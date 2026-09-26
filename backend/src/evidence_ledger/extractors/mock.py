"""
Deterministic mock extractors for testing, offline development, and fallback mode.
"""

from __future__ import annotations

from typing import Any

from evidence_ledger.contracts.models import (
    ExtractionFieldResult,
    ExtractionObservationResult,
    ExtractionProviderResult,
    MediaType,
)
from evidence_ledger.extractors.base import EvidenceExtractor, SpeechTranscriber


class MockEvidenceExtractor(EvidenceExtractor):
    """Deterministic mock extractor."""

    def extract(
        self,
        case_id: str,
        source_id: str,
        media_type: MediaType,
        content_bytes: bytes,
        filename: str,
    ) -> ExtractionProviderResult:
        # Check filename or content for scenario simulation
        fn_lower = filename.lower()
        observations: list[ExtractionObservationResult] = []

        if "discrepancy" in fn_lower or "statement" in fn_lower:
            obs = ExtractionObservationResult(
                event_type="bank_statement_entry",
                locator={"page": 1, "region": "row 4", "anchor": "UPI/4500.00/DR"},
                fields={
                    "amount": ExtractionFieldResult(
                        raw="4,500.00", candidate="4500.00", confidence=0.98
                    ),
                    "currency": ExtractionFieldResult(raw="INR", candidate="INR", confidence=0.99),
                    "timestamp": ExtractionFieldResult(
                        raw="2026-03-04 10:45:00",
                        candidate="2026-03-04T10:45:00Z",
                        confidence=0.95,
                    ),
                    "transaction_reference": ExtractionFieldResult(
                        raw="UPI/20260304/991823",
                        candidate="UPI20260304991823",
                        confidence=0.92,
                    ),
                },
                assumptions=[],
            )
            observations.append(obs)
        elif "missing" in fn_lower:
            obs = ExtractionObservationResult(
                event_type="chat_message",
                locator={"region": "chat body", "anchor": "Please send money fast"},
                fields={
                    "amount": ExtractionFieldResult(raw=None, candidate=None, confidence=None),
                    "timestamp": ExtractionFieldResult(
                        raw="10:45 AM", candidate=None, confidence=0.80
                    ),
                },
                assumptions=["Sender did not specify amount or date"],
            )
            observations.append(obs)
        else:
            # Default payment notification
            obs = ExtractionObservationResult(
                event_type="payment_notification",
                locator={
                    "page": 1 if media_type == MediaType.pdf else None,
                    "region": "center card",
                    "anchor": "₹5,000 paid successfully",
                },
                fields={
                    "amount": ExtractionFieldResult(
                        raw="₹5,000", candidate="5000.00", confidence=0.99
                    ),
                    "currency": ExtractionFieldResult(raw="₹", candidate="INR", confidence=0.99),
                    "timestamp": ExtractionFieldResult(
                        raw="2026-03-04 10:45:00",
                        candidate="2026-03-04T10:45:00Z",
                        confidence=0.97,
                    ),
                    "transaction_reference": ExtractionFieldResult(
                        raw="UPI/20260304/991823",
                        candidate="UPI20260304991823",
                        confidence=0.94,
                    ),
                    "recipient": ExtractionFieldResult(
                        raw="rahul.kumar@okicici",
                        candidate="rahul.kumar@okicici",
                        confidence=0.95,
                    ),
                },
                assumptions=[],
            )
            observations.append(obs)

        return ExtractionProviderResult(
            schema_version="1.0",
            source_id=source_id,
            observations=observations,
            warnings=[],
        )


class MockSpeechTranscriber(SpeechTranscriber):
    """Deterministic mock speech transcriber."""

    def transcribe(self, audio_bytes: bytes, filename: str) -> dict[str, Any]:
        return {
            "transcript": "I transferred five thousand rupees to UPI ID rahul.kumar@okicici at 10:45 AM on March 4th.",
            "language_code": "en-IN",
            "segments": [
                {
                    "text": "I transferred five thousand rupees to UPI ID rahul.kumar@okicici at 10:45 AM on March 4th.",
                    "start_ms": 500,
                    "end_ms": 4200,
                }
            ],
        }
