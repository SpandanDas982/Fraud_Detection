"""
Export Lambda worker handler for Evidence Ledger.

Conforms to docs/ARCHITECTURE.md:
- Generates CSV or ReportLab PDF for a case
- Uploads export artifacts to S3 cases/{case_id}/exports/{export_id}/
- Updates Export record in DynamoDB to ready
"""

from __future__ import annotations

import logging
from typing import Any

from evidence_ledger.contracts.models import (
    CaseSummary,
    ExportFormat,
    ExportStatus,
)
from evidence_ledger.exports.csv_export import generate_csv_v1
from evidence_ledger.exports.pdf_export import generate_pdf_report
from evidence_ledger.repositories.dynamo_repo import DynamoRepository
from evidence_ledger.repositories.s3_repo import S3Repository

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


class ExportHandler:
    def __init__(
        self,
        dynamo_repo: DynamoRepository | None = None,
        s3_repo: S3Repository | None = None,
    ) -> None:
        self.dynamo = dynamo_repo or DynamoRepository()
        self.s3 = s3_repo or S3Repository()

    def process_export(self, case_id: str, export_id: str) -> dict[str, Any]:
        export = self.dynamo.get_export(case_id, export_id)
        if not export:
            logger.error("Export %s not found for case %s", export_id, case_id)
            return {"status": "error", "message": "Export not found"}

        case = self.dynamo.get_case(case_id) or CaseSummary(case_id=case_id, safe_title="Export")
        sources, _ = self.dynamo.list_sources(case_id, limit=200)
        observations, _ = self.dynamo.list_observations(case_id, limit=500)
        flags = self.dynamo.list_flags(case_id)
        links = self.dynamo.list_links(case_id)

        try:
            if export.format == ExportFormat.csv:
                filename = "timeline.csv"
                content = generate_csv_v1(case_id, observations, flags, links)
                content_type = "text/csv; charset=utf-8"
            else:
                filename = "evidence-report.pdf"
                content = generate_pdf_report(case, sources, observations, flags)
                content_type = "application/pdf"

            s3_key = self.s3.export_key(case_id, export_id, filename)
            self.s3.put_object_bytes(s3_key, content, content_type=content_type)
            checksum = self.s3.compute_sha256(content)

            updated_export = export.model_copy(
                update={
                    "status": ExportStatus.ready,
                    "s3_key": s3_key,
                    "checksum": checksum,
                    "schema_version": "1.0",
                    "masking_policy_version": "1.0",
                }
            )
            self.dynamo.put_export(updated_export)
            logger.info("Export %s completed successfully", export_id)
            return {"status": "ready", "export_id": export_id, "s3_key": s3_key}

        except Exception as e:
            logger.exception("Failed to generate export %s", export_id)
            failed_export = export.model_copy(
                update={
                    "status": ExportStatus.failed,
                    "error_code": "EXPORT_GENERATION_FAILED",
                }
            )
            self.dynamo.put_export(failed_export)
            return {"status": "failed", "export_id": export_id, "error": str(e)}


_export_handler = None


def lambda_handler(event: dict[str, Any], context: Any) -> dict[str, Any]:
    global _export_handler
    if _export_handler is None:
        _export_handler = ExportHandler()

    case_id = event.get("case_id")
    export_id = event.get("export_id")
    if not case_id or not export_id:
        return {"status": "error", "message": "Missing case_id or export_id"}

    return _export_handler.process_export(case_id, export_id)
