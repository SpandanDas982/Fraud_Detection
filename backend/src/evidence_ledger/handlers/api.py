"""
API Gateway HTTP API Lambda handler for Evidence Ledger.

Conforms to docs/API.md:
- Routes relative to /v1
- Standard error envelope: {"error": {"code": "...", "message": "...", "request_id": "...", "details": {}}}
- Optimistic locking via version and If-Match / expected_version
- Scoped presigned S3 URLs
- CORS headers for allowed origins
"""

from __future__ import annotations

import fnmatch
import json
import logging
import re
import uuid
from typing import Any

from pydantic import ValidationError

from evidence_ledger.config import get_settings
from evidence_ledger.contracts.models import (
    CaseMode,
    CaseSummary,
    Export,
    ExportFormat,
    ExportRequest,
    ExportStatus,
    FlagCategory,
    FlagPatchRequest,
    FlagState,
    Link,
    LinkRequest,
    MediaType,
    Observation,
    ObservationPatchRequest,
    ReviewStatus,
    Source,
    SourceStatus,
    TextSourceRequest,
    UploadIntentRequest,
)
from evidence_ledger.privacy.masking import compute_field_masked_display
from evidence_ledger.repositories.dynamo_repo import (
    DynamoRepository,
    EntityNotFoundError,
    VersionConflictError,
)
from evidence_ledger.repositories.s3_repo import S3Repository
from evidence_ledger.timeline.builder import build_timeline
from evidence_ledger.validation.flags import (
    evaluate_link_discrepancies,
)

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


def _resolve_cors_origin(request_origin: str, allowed_origins: list[str]) -> str:
    if not request_origin:
        return "*"
    for pattern in allowed_origins:
        if pattern == "*" or fnmatch.fnmatch(request_origin, pattern):
            return request_origin
    return allowed_origins[0] if allowed_origins else "*"


def _sanitize_observation_for_client(obs: Observation) -> dict[str, Any]:
    """Ensures all field claims have masked_display populated so sensitive PII is never exposed raw."""
    dump = obs.model_dump(mode="json")
    fields = dump.get("fields", {})
    for f_name, f_claim in fields.items():
        if not f_claim.get("masked_display"):
            val = (
                f_claim.get("reviewed_value")
                or f_claim.get("normalized_candidate_value")
                or f_claim.get("raw_claimed_value")
            )
            f_claim["masked_display"] = compute_field_masked_display(f_name, val)
    return dump


def _json_response(
    status_code: int,
    body: Any,
    cors_origin: str = "*",
    request_id: str | None = None,
) -> dict[str, Any]:
    headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": cors_origin,
        "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token,If-Match,Idempotency-Key,x-request-id,Accept,Origin",
        "Access-Control-Allow-Methods": "GET,POST,PATCH,PUT,DELETE,OPTIONS,HEAD",
        "Access-Control-Allow-Credentials": "true",
        "Vary": "Origin",
    }
    if request_id:
        headers["x-request-id"] = request_id

    return {
        "statusCode": status_code,
        "headers": headers,
        "body": json.dumps(body) if not isinstance(body, str) else body,
    }


def _error_response(
    status_code: int,
    code: str,
    message: str,
    request_id: str,
    details: dict[str, Any] | None = None,
    cors_origin: str = "*",
) -> dict[str, Any]:
    return _json_response(
        status_code=status_code,
        body={
            "error": {
                "code": code,
                "message": message,
                "request_id": request_id,
                "details": details or {},
            }
        },
        cors_origin=cors_origin,
        request_id=request_id,
    )


class ApiRouter:
    def __init__(
        self,
        dynamo_repo: DynamoRepository | None = None,
        s3_repo: S3Repository | None = None,
    ) -> None:
        self.dynamo = dynamo_repo or DynamoRepository()
        self.s3 = s3_repo or S3Repository()
        self.settings = get_settings()

    def handle(self, event: dict[str, Any], context: Any = None) -> dict[str, Any]:
        # Extract path and method from API Gateway payload v1 or v2
        http_method = (
            event.get("requestContext", {}).get("http", {}).get("method")
            or event.get("httpMethod")
            or "GET"
        ).upper()
        raw_path = event.get("rawPath") or event.get("path") or "/"
        request_id = event.get("requestContext", {}).get("requestId") or str(uuid.uuid4())

        # Extract headers case-insensitively for origin resolution
        raw_headers = event.get("headers") or {}
        req_headers = {k.lower(): v for k, v in raw_headers.items()}
        request_origin = req_headers.get("origin", "")
        cors_origin = _resolve_cors_origin(request_origin, self.settings.allowed_origins)

        # Handle CORS preflight
        if http_method == "OPTIONS":
            return _json_response(200, {}, cors_origin=cors_origin, request_id=request_id)

        # Normalize path: strip /v1 prefix if present and strip trailing slash
        path = raw_path
        if path.startswith("/v1"):
            path = path[3:]
        path = path.rstrip("/")
        if not path:
            path = "/"

        body_raw = event.get("body")
        body: dict[str, Any] = {}
        if body_raw:
            try:
                body = json.loads(body_raw) if isinstance(body_raw, str) else body_raw
            except Exception:
                return _error_response(
                    400,
                    "INVALID_JSON",
                    "Request body must be valid JSON",
                    request_id,
                    cors_origin=cors_origin,
                )

        query = event.get("queryStringParameters") or {}

        try:
            # 1. Cases
            if http_method == "POST" and path == "/cases":
                return self._create_case(body, request_id, cors_origin)
            if http_method == "GET" and re.match(r"^/cases/[^/]+$", path):
                case_id = path.split("/")[2]
                return self._get_case(case_id, request_id, cors_origin)
            if http_method == "DELETE" and re.match(r"^/cases/[^/]+$", path):
                case_id = path.split("/")[2]
                return self._delete_case(case_id, request_id, cors_origin)

            # 2. Sources
            if http_method == "POST" and re.match(r"^/cases/[^/]+/sources/upload-intent$", path):
                case_id = path.split("/")[2]
                return self._upload_intent(case_id, body, request_id, cors_origin)
            if http_method == "POST" and re.match(r"^/cases/[^/]+/sources/text$", path):
                case_id = path.split("/")[2]
                return self._create_text_source(case_id, body, request_id, cors_origin)
            if http_method == "GET" and re.match(r"^/cases/[^/]+/sources$", path):
                case_id = path.split("/")[2]
                return self._list_sources(case_id, query, request_id, cors_origin)
            if http_method == "GET" and re.match(r"^/cases/[^/]+/sources/[^/]+$", path):
                parts = path.split("/")
                return self._get_source(parts[2], parts[4], request_id, cors_origin)
            if http_method == "POST" and re.match(r"^/cases/[^/]+/sources/[^/]+/retry$", path):
                parts = path.split("/")
                return self._retry_source(parts[2], parts[4], request_id, cors_origin)

            # 3. Observations and Review
            if http_method == "GET" and re.match(r"^/cases/[^/]+/observations$", path):
                case_id = path.split("/")[2]
                return self._list_observations(case_id, query, request_id, cors_origin)
            if http_method == "PATCH" and re.match(r"^/cases/[^/]+/observations/[^/]+$", path):
                parts = path.split("/")
                return self._patch_observation(parts[2], parts[4], body, request_id, cors_origin)

            # 4. Links
            if http_method == "POST" and re.match(r"^/cases/[^/]+/links$", path):
                case_id = path.split("/")[2]
                return self._create_link(case_id, body, request_id, cors_origin)

            # 5. Timeline & Flags
            if http_method == "GET" and re.match(r"^/cases/[^/]+/timeline$", path):
                case_id = path.split("/")[2]
                return self._get_timeline(case_id, request_id, cors_origin)
            if http_method == "GET" and re.match(r"^/cases/[^/]+/flags$", path):
                case_id = path.split("/")[2]
                return self._list_flags(case_id, query, request_id, cors_origin)
            if http_method == "PATCH" and re.match(r"^/cases/[^/]+/flags/[^/]+$", path):
                parts = path.split("/")
                return self._patch_flag(parts[2], parts[4], body, request_id, cors_origin)

            # 6. Exports
            if http_method == "POST" and re.match(r"^/cases/[^/]+/exports$", path):
                case_id = path.split("/")[2]
                return self._create_export(case_id, body, request_id, cors_origin)
            if http_method == "GET" and re.match(r"^/cases/[^/]+/exports/[^/]+$", path):
                parts = path.split("/")
                return self._get_export(parts[2], parts[4], request_id, cors_origin)

            return _error_response(
                404,
                "ROUTE_NOT_FOUND",
                f"No route for {http_method} {raw_path}",
                request_id,
                cors_origin=cors_origin,
            )

        except VersionConflictError as e:
            return _error_response(
                409, "VERSION_CONFLICT", str(e), request_id, cors_origin=cors_origin
            )
        except EntityNotFoundError as e:
            return _error_response(404, "NOT_FOUND", str(e), request_id, cors_origin=cors_origin)
        except ValidationError as e:
            return _error_response(
                422, "VALIDATION_ERROR", str(e), request_id, cors_origin=cors_origin
            )
        except Exception:
            logger.exception("Internal handler error")
            return _error_response(
                500,
                "INTERNAL_ERROR",
                "An unexpected error occurred",
                request_id,
                cors_origin=cors_origin,
            )

    # -------------------------------------------------------------------------
    # Route Handlers
    # -------------------------------------------------------------------------

    def _create_case(self, body: dict[str, Any], req_id: str, cors: str) -> dict[str, Any]:
        safe_title = body.get("safe_title", "Evidence Packet")
        mode_val = body.get("mode", "mock")
        case_id = f"case_{uuid.uuid4().hex[:10]}"
        case = CaseSummary(
            case_id=case_id,
            safe_title=safe_title,
            mode=CaseMode(mode_val) if mode_val in ("mock", "live") else CaseMode.mock,
        )
        created = self.dynamo.create_case(case)
        return _json_response(
            201, created.model_dump(mode="json"), cors_origin=cors, request_id=req_id
        )

    def _get_case(self, case_id: str, req_id: str, cors: str) -> dict[str, Any]:
        case = self.dynamo.get_case(case_id)
        if not case:
            return _error_response(
                404, "CASE_NOT_FOUND", f"Case {case_id} not found", req_id, cors_origin=cors
            )
        return _json_response(
            200, case.model_dump(mode="json"), cors_origin=cors, request_id=req_id
        )

    def _delete_case(self, case_id: str, req_id: str, cors: str) -> dict[str, Any]:
        self.dynamo.delete_case(case_id)
        try:
            self.s3.delete_case_prefix(case_id)
        except Exception as e:
            logger.warning("Could not delete S3 prefix for %s: %s", case_id, e)
        return _json_response(
            202,
            {"status": "deletion_requested", "case_id": case_id},
            cors_origin=cors,
            request_id=req_id,
        )

    def _upload_intent(
        self, case_id: str, body: dict[str, Any], req_id: str, cors: str
    ) -> dict[str, Any]:
        req = UploadIntentRequest.model_validate(body)
        source_id = f"src_{uuid.uuid4().hex[:8]}"

        # Infer media type
        mt_lower = req.media_type.lower()
        if "pdf" in mt_lower:
            media_type = MediaType.pdf
        elif "audio" in mt_lower or req.filename.lower().endswith((".mp3", ".wav", ".m4a")):
            media_type = MediaType.audio
        else:
            media_type = MediaType.image

        # Check deduplication if client digest provided
        duplicate_of: str | None = None
        status = SourceStatus.awaiting_upload
        if req.sha256:
            existing = self.dynamo.find_source_by_sha256(case_id, req.sha256)
            if existing:
                duplicate_of = existing.source_id
                status = SourceStatus.duplicate

        # Generate presigned upload
        upload_details = self.s3.generate_presigned_upload(
            case_id=case_id,
            source_id=source_id,
            safe_filename=req.filename,
            content_type=req.media_type,
        )

        source = Source(
            source_id=source_id,
            case_id=case_id,
            media_type=media_type,
            safe_filename=req.filename,
            s3_key=upload_details["s3_key"],
            sha256=req.sha256,
            size_bytes=req.size_bytes,
            status=status,
            duplicate_of=duplicate_of,
        )
        self.dynamo.put_source(source)

        return _json_response(
            201,
            {
                "source_id": source_id,
                "upload": {
                    "method": upload_details["method"],
                    "url": upload_details["url"],
                    "headers": upload_details["headers"],
                    "expires_at": upload_details["expires_at"],
                },
                "status": status.value,
            },
            cors_origin=cors,
            request_id=req_id,
        )

    def _create_text_source(
        self, case_id: str, body: dict[str, Any], req_id: str, cors: str
    ) -> dict[str, Any]:
        req = TextSourceRequest.model_validate(body)
        source_id = f"src_{uuid.uuid4().hex[:8]}"
        safe_filename = f"{req.safe_label.replace(' ', '_')[:30]}.txt"
        s3_key = self.s3.raw_key(case_id, source_id, safe_filename)

        data_bytes = req.text.encode("utf-8")
        sha256 = self.s3.compute_sha256(data_bytes)
        self.s3.put_object_bytes(s3_key, data_bytes, content_type="text/plain; charset=utf-8")

        source = Source(
            source_id=source_id,
            case_id=case_id,
            media_type=MediaType.text,
            safe_filename=safe_filename,
            s3_key=s3_key,
            sha256=sha256,
            size_bytes=len(data_bytes),
            status=SourceStatus.queued,
        )
        self.dynamo.put_source(source)
        return _json_response(
            201, source.model_dump(mode="json"), cors_origin=cors, request_id=req_id
        )

    def _list_sources(
        self, case_id: str, query: dict[str, Any], req_id: str, cors: str
    ) -> dict[str, Any]:
        limit = int(query.get("limit", 50))
        cursor = query.get("cursor")
        sources, next_cursor = self.dynamo.list_sources(case_id, limit=limit, cursor=cursor)
        return _json_response(
            200,
            {
                "sources": [s.model_dump(mode="json") for s in sources],
                "next_cursor": next_cursor,
            },
            cors_origin=cors,
            request_id=req_id,
        )

    def _get_source(self, case_id: str, source_id: str, req_id: str, cors: str) -> dict[str, Any]:
        source = self.dynamo.get_source(case_id, source_id)
        if not source:
            raise EntityNotFoundError(f"Source {source_id} not found")
        data = source.model_dump(mode="json")
        if source.s3_key:
            data["preview_url"] = self.s3.generate_presigned_download(source.s3_key)
        return _json_response(200, data, cors_origin=cors, request_id=req_id)

    def _retry_source(self, case_id: str, source_id: str, req_id: str, cors: str) -> dict[str, Any]:
        source = self.dynamo.get_source(case_id, source_id)
        if not source:
            raise EntityNotFoundError(f"Source {source_id} not found")
        updated = source.model_copy(update={"status": SourceStatus.queued, "error_code": None})
        self.dynamo.put_source(updated)
        return _json_response(
            200, updated.model_dump(mode="json"), cors_origin=cors, request_id=req_id
        )

    def _list_observations(
        self, case_id: str, query: dict[str, Any], req_id: str, cors: str
    ) -> dict[str, Any]:
        src_id = query.get("source_id")
        status = ReviewStatus(query["review_status"]) if "review_status" in query else None
        event_type = query.get("event_type")
        limit = int(query.get("limit", 100))
        cursor = query.get("cursor")

        obs_list, next_cur = self.dynamo.list_observations(
            case_id,
            source_id=src_id,
            review_status=status,
            event_type=event_type,
            limit=limit,
            cursor=cursor,
        )
        return _json_response(
            200,
            {
                "observations": [_sanitize_observation_for_client(o) for o in obs_list],
                "next_cursor": next_cur,
            },
            cors_origin=cors,
            request_id=req_id,
        )

    def _patch_observation(
        self, case_id: str, observation_id: str, body: dict[str, Any], req_id: str, cors: str
    ) -> dict[str, Any]:
        req = ObservationPatchRequest.model_validate(body)
        updated = self.dynamo.patch_observation_review(
            case_id=case_id,
            observation_id=observation_id,
            expected_version=req.expected_version,
            field_reviews=req.field_reviews,
        )
        return _json_response(
            200, _sanitize_observation_for_client(updated), cors_origin=cors, request_id=req_id
        )

    def _create_link(
        self, case_id: str, body: dict[str, Any], req_id: str, cors: str
    ) -> dict[str, Any]:
        req = LinkRequest.model_validate(body)
        link = Link(
            link_id=f"link_{uuid.uuid4().hex[:8]}",
            case_id=case_id,
            link_type=req.link_type,
            observation_ids=req.observation_ids,
            created_by="reviewer",
            rationale=req.rationale,
        )
        self.dynamo.put_link(link)

        # Re-evaluate discrepancy flags for linked observations
        obs_map: dict[str, Observation] = {}
        for oid in req.observation_ids:
            obs = self.dynamo.get_observation(case_id, oid)
            if obs:
                obs_map[oid] = obs
        discrepancies = evaluate_link_discrepancies(case_id, [link], obs_map)
        for flag in discrepancies:
            self.dynamo.put_flag(flag)

        return _json_response(
            201, link.model_dump(mode="json"), cors_origin=cors, request_id=req_id
        )

    def _get_timeline(self, case_id: str, req_id: str, cors: str) -> dict[str, Any]:
        obs_list, _ = self.dynamo.list_observations(case_id, limit=500)
        case = self.dynamo.get_case(case_id)
        version = case.version if case else 1
        timeline = build_timeline(obs_list, case_version=version)
        return _json_response(200, timeline, cors_origin=cors, request_id=req_id)

    def _list_flags(
        self, case_id: str, query: dict[str, Any], req_id: str, cors: str
    ) -> dict[str, Any]:
        cat = FlagCategory(query["category"]) if "category" in query else None
        state = FlagState(query["state"]) if "state" in query else None
        flags = self.dynamo.list_flags(case_id, category=cat, state=state)
        return _json_response(
            200,
            {"flags": [f.model_dump(mode="json") for f in flags]},
            cors_origin=cors,
            request_id=req_id,
        )

    def _patch_flag(
        self, case_id: str, flag_id: str, body: dict[str, Any], req_id: str, cors: str
    ) -> dict[str, Any]:
        req = FlagPatchRequest.model_validate(body)
        updated = self.dynamo.patch_flag(case_id, flag_id, state=req.state, note=req.note)
        return _json_response(
            200, updated.model_dump(mode="json"), cors_origin=cors, request_id=req_id
        )

    def _create_export(
        self, case_id: str, body: dict[str, Any], req_id: str, cors: str
    ) -> dict[str, Any]:
        req = ExportRequest.model_validate(body)
        export_id = f"exp_{uuid.uuid4().hex[:8]}"

        export = Export(
            export_id=export_id,
            case_id=case_id,
            format=req.format,
            status=ExportStatus.processing,
            draft=req.draft,
        )
        self.dynamo.put_export(export)

        # Directly generate export payload (synchronous generation for serverless API)
        from evidence_ledger.exports.csv_export import generate_csv_v1
        from evidence_ledger.exports.pdf_export import generate_pdf_report

        case = self.dynamo.get_case(case_id)
        sources, _ = self.dynamo.list_sources(case_id, limit=200)
        obs_list, _ = self.dynamo.list_observations(case_id, limit=500)
        flags = self.dynamo.list_flags(case_id)

        if req.format == ExportFormat.csv:
            filename = "timeline.csv"
            content = generate_csv_v1(case_id, obs_list, flags)
            ct = "text/csv; charset=utf-8"
        else:
            filename = "evidence-report.pdf"
            content = generate_pdf_report(
                case or CaseSummary(case_id=case_id, safe_title="Export"), sources, obs_list, flags
            )
            ct = "application/pdf"

        s3_key = self.s3.export_key(case_id, export_id, filename)
        self.s3.put_object_bytes(s3_key, content, content_type=ct)
        checksum = self.s3.compute_sha256(content)

        ready_export = export.model_copy(
            update={
                "status": ExportStatus.ready,
                "s3_key": s3_key,
                "checksum": checksum,
                "schema_version": "1.0",
                "masking_policy_version": "1.0",
            }
        )
        self.dynamo.put_export(ready_export)

        return _json_response(
            202,
            {
                "export_id": export_id,
                "status": ready_export.status.value,
                "format": ready_export.format.value,
                "draft": ready_export.draft,
            },
            cors_origin=cors,
            request_id=req_id,
        )

    def _get_export(self, case_id: str, export_id: str, req_id: str, cors: str) -> dict[str, Any]:
        exp = self.dynamo.get_export(case_id, export_id)
        if not exp:
            raise EntityNotFoundError(f"Export {export_id} not found")
        data = exp.model_dump(mode="json")
        if exp.status == ExportStatus.ready and exp.s3_key:
            data["download_url"] = self.s3.generate_presigned_download(exp.s3_key)
        return _json_response(200, data, cors_origin=cors, request_id=req_id)


# Lambda entrypoint
_router = None


def lambda_handler(event: dict[str, Any], context: Any) -> dict[str, Any]:
    global _router
    if _router is None:
        _router = ApiRouter()
    return _router.handle(event, context)
