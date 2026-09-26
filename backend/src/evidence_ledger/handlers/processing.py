"""
S3 ObjectCreated event Lambda handler for Evidence Ledger.

Conforms to docs/ARCHITECTURE.md and PROJECT.md:
- Triggered by S3 ObjectCreated event on cases/{case_id}/raw/{source_id}/{filename}
- Claims source idempotently (transitions status to processing)
- Computes SHA-256 digest and checks for duplicates
- Routes by modality: Image -> Nova Lite, PDF -> PyMuPDF, Audio -> Sarvam STT, Text -> Nova Micro
- Normalizes money and time
- Evaluates initial data-quality flags
- Writes observations and flags to DynamoDB
- Updates Source and Case status
"""

from __future__ import annotations

import logging
import urllib.parse
import uuid
from typing import Any

from evidence_ledger.config import get_settings
from evidence_ledger.contracts.models import (
    CaseMode,
    FieldClaim,
    FieldState,
    FlagCode,
    FlagState,
    MediaType,
    Observation,
    ReviewStatus,
    SourceStatus,
)
from evidence_ledger.extractors.mock import MockEvidenceExtractor, MockSpeechTranscriber
from evidence_ledger.extractors.nova import NovaExtractor
from evidence_ledger.extractors.sarvam import SarvamSTTTranscriber
from evidence_ledger.ingestion.pdf import PdfProcessor
from evidence_ledger.normalization.money import normalize_money
from evidence_ledger.normalization.time import normalize_time
from evidence_ledger.privacy.masking import compute_field_masked_display
from evidence_ledger.repositories.dynamo_repo import DynamoRepository
from evidence_ledger.repositories.s3_repo import S3Repository
from evidence_ledger.validation.flags import (
    evaluate_duplicate_sources,
    evaluate_observation_flags,
)

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


class ProcessingHandler:
    def __init__(
        self,
        dynamo_repo: DynamoRepository | None = None,
        s3_repo: S3Repository | None = None,
        use_mock: bool = False,
    ) -> None:
        self.dynamo = dynamo_repo or DynamoRepository()
        self.s3 = s3_repo or S3Repository()
        self.settings = get_settings()
        self.use_mock = use_mock

        if self.use_mock:
            self.extractor = MockEvidenceExtractor()
            self.transcriber = MockSpeechTranscriber()
        else:
            self.extractor = NovaExtractor()
            self.transcriber = SarvamSTTTranscriber()

        self.pdf_processor = PdfProcessor(
            nova_extractor=self.extractor if isinstance(self.extractor, NovaExtractor) else None
        )

    def process_s3_event(self, event: dict[str, Any], context: Any = None) -> dict[str, Any]:
        records = event.get("Records", [])
        processed_count = 0

        for record in records:
            s3_info = record.get("s3", {})
            raw_key = s3_info.get("object", {}).get("key", "")
            if not raw_key:
                continue

            # Key is url-encoded in S3 events
            s3_key = urllib.parse.unquote_plus(raw_key)
            # Expect key format: cases/{case_id}/raw/{source_id}/{filename}
            parts = s3_key.split("/")
            if len(parts) < 5 or parts[0] != "cases" or parts[2] != "raw":
                logger.info("Ignoring non-raw S3 key: %s", s3_key)
                continue

            case_id = parts[1]
            source_id = parts[3]
            filename = parts[4]

            self.process_source(case_id, source_id, s3_key, filename)
            processed_count += 1

        return {"processed_count": processed_count}

    def process_source(self, case_id: str, source_id: str, s3_key: str, filename: str) -> None:
        source = self.dynamo.get_source(case_id, source_id)
        if not source:
            logger.warning("Source %s not found in DynamoDB for key %s", source_id, s3_key)
            return

        # Check if case is mock mode
        case = self.dynamo.get_case(case_id)
        is_mock_case = self.use_mock or (case and case.mode == CaseMode.mock)

        # Idempotently claim source
        if source.status in (SourceStatus.processing, SourceStatus.ready, SourceStatus.duplicate):
            logger.info("Source %s already in status %s, skipping", source_id, source.status)
            return

        source = source.model_copy(
            update={
                "status": SourceStatus.processing,
                "processing_attempts": source.processing_attempts + 1,
            }
        )
        self.dynamo.put_source(source)

        try:
            content_bytes = self.s3.get_object_bytes(s3_key)
            digest = self.s3.compute_sha256(content_bytes)
            size_bytes = len(content_bytes)

            source = source.model_copy(update={"sha256": digest, "size_bytes": size_bytes})

            # Check duplicate sha256 in case
            all_sources, _ = self.dynamo.list_sources(case_id, limit=200)
            existing_sources = [s for s in all_sources if s.source_id != source_id]
            dup_flags = evaluate_duplicate_sources(existing_sources + [source])
            if dup_flags:
                for f in dup_flags:
                    self.dynamo.put_flag(f)
                source = source.model_copy(update={"status": SourceStatus.duplicate})
                self.dynamo.put_source(source)
                logger.info("Source %s detected as duplicate", source_id)
                return

            # Determine extraction based on media type
            media_type = source.media_type
            page_count: int | None = None
            duration_ms: int | None = None

            if is_mock_case:
                extractor = MockEvidenceExtractor()
                provider_res = extractor.extract(
                    case_id, source_id, media_type, content_bytes, filename
                )
            else:
                if media_type == MediaType.pdf:
                    provider_res, page_count = self.pdf_processor.process_pdf(
                        case_id, source_id, content_bytes, filename
                    )
                elif media_type == MediaType.audio:
                    transcription = self.transcriber.transcribe(content_bytes, filename)
                    transcript_text = transcription.get("transcript", "")
                    # Extract observations from transcript using Nova Micro
                    if transcript_text:
                        provider_res = self.extractor.extract(
                            case_id,
                            source_id,
                            MediaType.text,
                            transcript_text.encode("utf-8"),
                            filename,
                        )
                    else:
                        from evidence_ledger.contracts.models import ExtractionProviderResult

                        provider_res = ExtractionProviderResult(
                            source_id=source_id,
                            observations=[],
                            warnings=["Audio transcription yielded empty transcript"],
                        )
                elif media_type == MediaType.image:
                    provider_res = self.extractor.extract(
                        case_id, source_id, MediaType.image, content_bytes, filename
                    )
                else:  # Text
                    provider_res = self.extractor.extract(
                        case_id, source_id, MediaType.text, content_bytes, filename
                    )

            # Process observations
            new_observations: list[Observation] = []
            for ext_obs in provider_res.observations:
                obs_id = f"obs_{uuid.uuid4().hex[:8]}"

                # Parse and normalize fields
                field_claims: dict[str, FieldClaim] = {}
                for f_name, f_val in ext_obs.fields.items():
                    raw = f_val.raw
                    cand = f_val.candidate
                    state = FieldState.extracted if cand or raw else FieldState.missing

                    # If amount, normalize
                    if f_name == "amount" and raw:
                        m = normalize_money(raw)
                        if m:
                            cand = f"{m.as_decimal:.2f}"
                        else:
                            state = FieldState.invalid

                    # Determine locator
                    loc_desc = (
                        ext_obs.locator.get("region")
                        or ext_obs.locator.get("anchor")
                        or f"page {ext_obs.locator.get('page')}"
                    )

                    field_claims[f_name] = FieldClaim(
                        raw_claimed_value=raw,
                        normalized_candidate_value=cand,
                        state=state,
                        confidence=f_val.confidence,
                        source_locator=loc_desc,
                        anchor_text=ext_obs.locator.get("anchor"),
                        masked_display=compute_field_masked_display(f_name, raw or cand),
                    )

                # Time claim
                time_f = ext_obs.fields.get("timestamp")
                time_claim = normalize_time(time_f.raw if time_f else None)

                obs = Observation(
                    observation_id=obs_id,
                    case_id=case_id,
                    source_id=source_id,
                    event_type=ext_obs.event_type,
                    review_status=ReviewStatus.unreviewed,
                    extraction_method="mock" if is_mock_case else "amazon_bedrock_nova",
                    fields=field_claims,
                    time_claim=time_claim,
                    assumptions=ext_obs.assumptions,
                )

                # Evaluate flags
                obs_flags = evaluate_observation_flags(obs)
                obs = obs.model_copy(update={"flag_codes": [f.code for f in obs_flags]})

                self.dynamo.put_observation(obs)
                for f in obs_flags:
                    self.dynamo.put_flag(f)

                new_observations.append(obs)

            # Update source status
            final_status = SourceStatus.ready
            if not new_observations and provider_res.warnings:
                final_status = SourceStatus.failed
            elif any(
                f.code == FlagCode.HUMAN_VERIFICATION_REQUIRED
                for o in new_observations
                for f in o.flag_codes
            ):
                final_status = SourceStatus.partial

            source = source.model_copy(
                update={
                    "status": final_status,
                    "page_count": page_count,
                    "duration_ms": duration_ms,
                    "extraction_provider": "mock" if is_mock_case else "bedrock_nova",
                }
            )
            self.dynamo.put_source(source)

            # Update Case summary counts
            if case:
                all_obs, _ = self.dynamo.list_observations(case_id, limit=500)
                all_flags = self.dynamo.list_flags(case_id)
                open_flags = [f for f in all_flags if f.state != FlagState.resolved]
                updated_case = case.model_copy(
                    update={
                        "observation_count": len(all_obs),
                        "unresolved_flag_count": len(open_flags),
                    }
                )
                self.dynamo.update_case(updated_case)

        except Exception:
            logger.exception("Error processing source %s", source_id)
            source = source.model_copy(
                update={
                    "status": SourceStatus.failed,
                    "error_code": "PROCESSING_ERROR",
                }
            )
            self.dynamo.put_source(source)


# Lambda entrypoint
_processing_handler = None


def lambda_handler(event: dict[str, Any], context: Any) -> dict[str, Any]:
    global _processing_handler
    if _processing_handler is None:
        _processing_handler = ProcessingHandler()
    return _processing_handler.process_s3_event(event, context)
