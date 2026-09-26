"""
Unit tests for money normalization, time normalization, timeline builder, and flag evaluation.
"""

from __future__ import annotations

from datetime import UTC, datetime

from evidence_ledger.contracts.models import (
    FieldClaim,
    FieldState,
    FlagCategory,
    FlagCode,
    Link,
    LinkType,
    MediaType,
    MoneyDirection,
    Observation,
    Source,
    SourceStatus,
    TimeClaim,
    TimelinePrecision,
)
from evidence_ledger.normalization.money import normalize_money
from evidence_ledger.normalization.time import normalize_time
from evidence_ledger.timeline.builder import build_timeline
from evidence_ledger.validation.flags import (
    evaluate_duplicate_sources,
    evaluate_link_discrepancies,
    evaluate_observation_flags,
)


def test_normalize_money() -> None:
    m1 = normalize_money("₹5,000.00", "amount debited")
    assert m1 is not None
    assert m1.currency == "INR"
    assert m1.minor_units == 500000
    assert m1.as_decimal == 5000
    assert m1.direction == MoneyDirection.debit

    m2 = normalize_money("$120.50", "received payment")
    assert m2 is not None
    assert m2.currency == "USD"
    assert m2.minor_units == 12050
    assert m2.direction == MoneyDirection.credit

    m3 = normalize_money("invalid text")
    assert m3 is None


def test_normalize_time_exact_and_ambiguous() -> None:
    # Exact ISO
    t1 = normalize_time("2026-03-04T10:45:00Z")
    assert t1.precision == TimelinePrecision.exact
    assert t1.status == "exact"
    assert t1.earliest == datetime(2026, 3, 4, 10, 45, tzinfo=UTC)

    # Ambiguous 03/04/2026
    t2 = normalize_time("03/04/2026 10:45")
    assert t2.precision == TimelinePrecision.ambiguous
    assert t2.status == "ambiguous"
    assert len(t2.candidate_interpretations) == 2

    # Date only
    t3 = normalize_time("2026-03-04")
    assert t3.precision == TimelinePrecision.date_only
    assert t3.status == "date_only"

    # Time only without date
    t4 = normalize_time("10:45 AM")
    assert t4.status == "time_only_no_date"


def test_timeline_builder_sections_and_sorting() -> None:
    obs1 = Observation(
        observation_id="obs_02",
        case_id="case_01",
        source_id="src_01",
        event_type="payment",
        extraction_method="test",
        time_claim=TimeClaim(
            earliest=datetime(2026, 3, 4, 12, 0, tzinfo=UTC),
            precision=TimelinePrecision.exact,
        ),
    )
    obs2 = Observation(
        observation_id="obs_01",
        case_id="case_01",
        source_id="src_01",
        event_type="payment",
        extraction_method="test",
        time_claim=TimeClaim(
            earliest=datetime(2026, 3, 4, 10, 0, tzinfo=UTC),
            precision=TimelinePrecision.exact,
        ),
    )
    obs3 = Observation(
        observation_id="obs_03",
        case_id="case_01",
        source_id="src_02",
        event_type="chat",
        extraction_method="test",
        time_claim=TimeClaim(precision=TimelinePrecision.ambiguous),
    )
    obs4 = Observation(
        observation_id="obs_04",
        case_id="case_01",
        source_id="src_03",
        event_type="note",
        extraction_method="test",
    )

    tl = build_timeline([obs1, obs2, obs3, obs4], case_version=5)
    assert len(tl["dated"]) == 2
    assert len(tl["uncertain"]) == 1
    assert len(tl["undated"]) == 1

    # Deterministic sort check: obs_01 (10:00) before obs_02 (12:00)
    assert tl["dated"][0]["observation_id"] == "obs_01"
    assert tl["dated"][1]["observation_id"] == "obs_02"


def test_flag_evaluation_and_discrepancies() -> None:
    obs_incomplete = Observation(
        observation_id="obs_inc",
        case_id="case_01",
        source_id="src_01",
        event_type="payment",
        extraction_method="test",
        fields={"amount": FieldClaim(state=FieldState.missing)},
    )
    flags = evaluate_observation_flags(obs_incomplete)
    flag_codes = [f.code for f in flags]
    assert FlagCode.MISSING_INFO in flag_codes

    # Linked amount discrepancy
    obs_a = Observation(
        observation_id="obs_a",
        case_id="case_01",
        source_id="src_a",
        event_type="payment",
        extraction_method="test",
        fields={
            "amount": FieldClaim(normalized_candidate_value="5000.00", state=FieldState.extracted)
        },
    )
    obs_b = Observation(
        observation_id="obs_b",
        case_id="case_01",
        source_id="src_b",
        event_type="payment",
        extraction_method="test",
        fields={
            "amount": FieldClaim(normalized_candidate_value="4500.00", state=FieldState.extracted)
        },
    )

    link = Link(
        link_id="link_01",
        case_id="case_01",
        link_type=LinkType.same_transaction,
        observation_ids=["obs_a", "obs_b"],
        created_by="reviewer",
        rationale="Same reference",
    )

    disc_flags = evaluate_link_discrepancies("case_01", [link], {"obs_a": obs_a, "obs_b": obs_b})
    assert len(disc_flags) == 1
    assert disc_flags[0].code == FlagCode.AMOUNT_DISCREPANCY
    assert disc_flags[0].category == FlagCategory.inconsistency
    assert len(disc_flags[0].discrepancy_sides) == 2


def test_duplicate_source_flags() -> None:
    s1 = Source(
        source_id="src_1",
        case_id="c1",
        media_type=MediaType.image,
        safe_filename="receipt.png",
        sha256="abc1234567890abcdef",
        status=SourceStatus.ready,
    )
    s2 = Source(
        source_id="src_2",
        case_id="c1",
        media_type=MediaType.image,
        safe_filename="receipt_copy.png",
        sha256="abc1234567890abcdef",
        status=SourceStatus.duplicate,
    )
    flags = evaluate_duplicate_sources([s1, s2])
    assert len(flags) == 1
    assert flags[0].code == FlagCode.DUPLICATE_SOURCE
