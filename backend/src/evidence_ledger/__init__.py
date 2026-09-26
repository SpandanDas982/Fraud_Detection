"""
Evidence Ledger — multimodal evidence-packet compiler for human review.

This package is the backend for Evidence Ledger. It is organized into:

  evidence_ledger/
    contracts/      — Pydantic models mirroring docs/DATA_CONTRACTS.md
    handlers/       — Lambda handler entry points (case, processing, export)
    ingestion/      — Upload intent, text source, validation
    extractors/     — Per-modality extraction adapters (Nova Lite, Nova Micro, Sarvam)
    normalization/  — Amount, time, reference deterministic normalization
    validation/     — Provider output schema validation
    timeline/       — Dated / uncertain / undated assembly
    privacy/        — Alias map and masking policy
    exports/        — CSV and ReportLab PDF generation
    repositories/   — DynamoDB and S3 access (one adapter each)

AWS SDK: local development uses boto3.Session(profile_name='aws').
Lambda execution uses the IAM role automatically via the standard credential chain.
No credentials or region strings are hardcoded — region comes from AWS_REGION env var.
"""


def main() -> None:
    """Entry point for local development / CLI use only."""
    print("Evidence Ledger backend — use Lambda handlers for production.")
