"""
Unit tests for CSV and PDF export generators.
"""

from __future__ import annotations

import csv
import io
from datetime import UTC, datetime

from evidence_ledger.contracts.models import (
    CaseMode,
    CaseStatus,
    CaseSummary,
    FieldClaim,
    FieldState,
    Flag,
    FlagCategory,
    FlagCode,
    FlagState,
    MediaType,
    Observation,
    ReviewStatus,
    Source,
    SourceStatus,
    TimeClaim,
    TimelinePrecision,
)
from evidence_ledger.exports.csv_export import CSV_V1_HEADER, generate_csv_v1
from evidence_ledger.exports.pdf_export import generate_pdf_report


def test_generate_csv_v1_header_and_content() -> None:
    obs = Observation(
        observation_id="obs_01",
        case_id="case_01",
        source_id="src_01",
        event_type="payment",
        extraction_method="mock",
        review_status=ReviewStatus.unreviewed,
        fields={
            "amount": FieldClaim(
                raw_claimed_value="=1+2",  # Formula injection attempt!
                normalized_candidate_value="3.00",
                state=FieldState.extracted,
            ),
            "currency": FieldClaim(
                raw_claimed_value="INR",
                normalized_candidate_value="INR",
                state=FieldState.extracted,
            ),
        },
        time_claim=TimeClaim(
            earliest=datetime(2026, 3, 4, 10, 45, tzinfo=UTC),
            precision=TimelinePrecision.exact,
        ),
    )

    csv_bytes = generate_csv_v1("case_01", [obs])
    text = csv_bytes.decode("utf-8")
    reader = csv.reader(io.StringIO(text))
    rows = list(reader)

    assert rows[0] == CSV_V1_HEADER
    assert len(rows) == 2

    # Check that case_id and observation_id are present
    assert rows[1][0] == "case_01"
    assert rows[1][1] == "obs_01"
    assert rows[1][2] == "dated"  # timeline section

    # Formula injection was neutralized
    # Amount was "=1+2" or candidate "3.00" -> raw was formula, let's verify formula cell escaping
    # If cell starts with '=', it must be prepended with "'"
    obs_with_formula_event = obs.model_copy(update={"event_type": "=SUM(A1:B1)"})
    csv_bytes2 = generate_csv_v1("case_01", [obs_with_formula_event])
    rows2 = list(csv.reader(io.StringIO(csv_bytes2.decode("utf-8"))))
    event_type_cell = rows2[1][8]
    assert event_type_cell.startswith("'=")


def test_generate_pdf_report() -> None:
    case = CaseSummary(
        case_id="case_01",
        safe_title="Suspected Impersonation Packet",
        status=CaseStatus.draft,
        mode=CaseMode.mock,
    )
    src = Source(
        source_id="src_01",
        case_id="case_01",
        media_type=MediaType.image,
        safe_filename="screenshot.png",
        sha256="abcdef1234567890",
        status=SourceStatus.ready,
    )
    obs = Observation(
        observation_id="obs_01",
        case_id="case_01",
        source_id="src_01",
        event_type="payment_notification",
        extraction_method="mock",
        review_status=ReviewStatus.reviewed,
        fields={
            "amount": FieldClaim(
                raw_claimed_value="₹5,000",
                normalized_candidate_value="5000.00",
                reviewed_value="5000.00",
                state=FieldState.accepted,
            )
        },
        time_claim=TimeClaim(
            earliest=datetime(2026, 3, 4, 10, 45, tzinfo=UTC),
            precision=TimelinePrecision.exact,
        ),
    )
    flag = Flag(
        flag_id="flag_01",
        case_id="case_01",
        rule_id="RULE_01",
        code=FlagCode.MISSING_INFO,
        category=FlagCategory.missing_info,
        title="Missing reference",
        explanation="No reference provided",
        state=FlagState.open,
    )

    pdf_bytes = generate_pdf_report(case, [src], [obs], [flag])
    assert len(pdf_bytes) > 1000
    # PDF magic bytes
    assert pdf_bytes.startswith(b"%PDF")
