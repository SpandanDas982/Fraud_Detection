"""
Flag evaluation and discrepancy detection engine for Evidence Ledger.

Conforms to DATA_CONTRACTS.md:
- Flags are neutral, observable data-quality indicators (never verdicts).
- FlagCategory is derived from FlagCode via FLAG_CODE_TO_CATEGORY.
- Discrepancy sides preserve both claims (never silently picks a winner).
"""

from __future__ import annotations

import uuid
from typing import Any

from evidence_ledger.contracts.models import (
    FLAG_CODE_TO_CATEGORY,
    FieldState,
    Flag,
    FlagCode,
    FlagState,
    Link,
    LinkType,
    Observation,
    Source,
    TimelinePrecision,
)


def evaluate_observation_flags(obs: Observation) -> list[Flag]:
    """
    Evaluates self-contained flags for an observation (missing info, ambiguous time, human verification).
    """
    flags: list[Flag] = []

    # 1. Missing Info check
    if not obs.fields.get("amount") or obs.fields["amount"].state == FieldState.missing:
        code = FlagCode.MISSING_INFO
        flags.append(
            Flag(
                flag_id=f"flag_{uuid.uuid4().hex[:8]}",
                case_id=obs.case_id,
                rule_id="RULE_MISSING_AMOUNT",
                code=code,
                category=FLAG_CODE_TO_CATEGORY[code],
                title="Missing transaction amount",
                explanation="No amount was detected in this evidence source.",
                involved_source_ids=[obs.source_id],
                involved_observation_ids=[obs.observation_id],
                field_name="amount",
                state=FlagState.open,
            )
        )

    # 2. Ambiguous Time check
    if obs.time_claim and obs.time_claim.precision == TimelinePrecision.ambiguous:
        code = FlagCode.AMBIGUOUS_TIME
        interps = (
            ", ".join(obs.time_claim.candidate_interpretations) or obs.time_claim.raw or "ambiguous"
        )
        flags.append(
            Flag(
                flag_id=f"flag_{uuid.uuid4().hex[:8]}",
                case_id=obs.case_id,
                rule_id="RULE_AMBIGUOUS_TIME",
                code=code,
                category=FLAG_CODE_TO_CATEGORY[code],
                title="Ambiguous timestamp format",
                explanation=f"Timestamp has multiple valid interpretations: {interps}",
                involved_source_ids=[obs.source_id],
                involved_observation_ids=[obs.observation_id],
                field_name="timestamp",
                state=FlagState.open,
            )
        )

    # 3. Human Verification Required (low confidence or assumptions or unreadable)
    low_conf_fields = [
        name
        for name, field in obs.fields.items()
        if (field.confidence is not None and field.confidence < 0.85)
        or field.state == FieldState.unreadable
    ]
    if low_conf_fields or obs.assumptions:
        code = FlagCode.HUMAN_VERIFICATION_REQUIRED
        reason_parts = []
        if low_conf_fields:
            reason_parts.append(
                f"Low extraction confidence on fields: {', '.join(low_conf_fields)}"
            )
        if obs.assumptions:
            reason_parts.append(f"Extractor recorded assumptions: {'; '.join(obs.assumptions)}")

        flags.append(
            Flag(
                flag_id=f"flag_{uuid.uuid4().hex[:8]}",
                case_id=obs.case_id,
                rule_id="RULE_HUMAN_VERIFICATION",
                code=code,
                category=FLAG_CODE_TO_CATEGORY[code],
                title="Human verification required",
                explanation="; ".join(reason_parts),
                involved_source_ids=[obs.source_id],
                involved_observation_ids=[obs.observation_id],
                state=FlagState.open,
            )
        )

    return flags


def evaluate_link_discrepancies(
    case_id: str,
    links: list[Link],
    observations_by_id: dict[str, Observation],
) -> list[Flag]:
    """
    Evaluates inconsistency flags across reviewer-linked observations (AMOUNT_DISCREPANCY, TIME_DISCREPANCY).
    """
    flags: list[Flag] = []

    for link in links:
        if link.link_type != LinkType.same_transaction:
            continue

        linked_obs = [
            observations_by_id[oid] for oid in link.observation_ids if oid in observations_by_id
        ]
        if len(linked_obs) < 2:
            continue

        # Check Amount Discrepancy
        amounts_seen: list[dict[str, Any]] = []
        for o in linked_obs:
            amt_field = o.fields.get("amount")
            val = (
                amt_field.reviewed_value
                if amt_field and amt_field.reviewed_value is not None
                else (amt_field.normalized_candidate_value if amt_field else None)
            )
            amounts_seen.append(
                {
                    "observation_id": o.observation_id,
                    "source_id": o.source_id,
                    "amount": val,
                }
            )

        unique_amounts = {a["amount"] for a in amounts_seen if a["amount"] is not None}
        if len(unique_amounts) > 1:
            code = FlagCode.AMOUNT_DISCREPANCY
            flags.append(
                Flag(
                    flag_id=f"flag_{uuid.uuid4().hex[:8]}",
                    case_id=case_id,
                    rule_id="RULE_LINKED_AMOUNT_DISCREPANCY",
                    code=code,
                    category=FLAG_CODE_TO_CATEGORY[code],
                    title="Amount discrepancy across linked records",
                    explanation=(
                        f"Sources linked as same transaction report conflicting amounts: "
                        f"{', '.join(str(s['amount']) for s in amounts_seen)}."
                    ),
                    involved_source_ids=list({o.source_id for o in linked_obs}),
                    involved_observation_ids=[o.observation_id for o in linked_obs],
                    field_name="amount",
                    discrepancy_sides=amounts_seen,
                    state=FlagState.open,
                )
            )

        # Check Time Discrepancy
        times_seen: list[dict[str, Any]] = []
        for o in linked_obs:
            tc = o.time_claim
            times_seen.append(
                {
                    "observation_id": o.observation_id,
                    "source_id": o.source_id,
                    "earliest": tc.earliest if tc else None,
                    "latest": tc.latest_exclusive if tc else None,
                }
            )

        # Check if any two time claims are non-overlapping and both exact
        exact_times = [
            t for t in times_seen if t["earliest"] is not None and t["latest"] is not None
        ]
        if len(exact_times) >= 2:
            has_time_conflict = False
            for i in range(len(exact_times)):
                for j in range(i + 1, len(exact_times)):
                    t1, t2 = exact_times[i], exact_times[j]
                    # If intervals are separated by more than 1 hour for same transaction
                    diff = abs((t1["earliest"] - t2["earliest"]).total_seconds())
                    if diff > 3600:
                        has_time_conflict = True
                        break
                if has_time_conflict:
                    break

            if has_time_conflict:
                code = FlagCode.TIME_DISCREPANCY
                flags.append(
                    Flag(
                        flag_id=f"flag_{uuid.uuid4().hex[:8]}",
                        case_id=case_id,
                        rule_id="RULE_LINKED_TIME_DISCREPANCY",
                        code=code,
                        category=FLAG_CODE_TO_CATEGORY[code],
                        title="Time discrepancy across linked records",
                        explanation="Linked observations report timestamps differing by more than 1 hour.",
                        involved_source_ids=list({o.source_id for o in linked_obs}),
                        involved_observation_ids=[o.observation_id for o in linked_obs],
                        field_name="timestamp",
                        discrepancy_sides=[
                            {
                                "observation_id": t["observation_id"],
                                "time": t["earliest"].isoformat() if t["earliest"] else None,
                            }
                            for t in times_seen
                        ],
                        state=FlagState.open,
                    )
                )

    return flags


def evaluate_duplicate_sources(sources: list[Source]) -> list[Flag]:
    """Evaluates duplicate source flags based on sha256 digests."""
    flags: list[Flag] = []
    seen_hashes: dict[str, Source] = {}
    for s in sources:
        if not s.sha256:
            continue
        if s.sha256 in seen_hashes:
            orig = seen_hashes[s.sha256]
            code = FlagCode.DUPLICATE_SOURCE
            flags.append(
                Flag(
                    flag_id=f"flag_{uuid.uuid4().hex[:8]}",
                    case_id=s.case_id,
                    rule_id="RULE_DUPLICATE_SOURCE",
                    code=code,
                    category=FLAG_CODE_TO_CATEGORY[code],
                    title="Duplicate evidence file detected",
                    explanation=(
                        f"File '{s.safe_filename}' has identical SHA-256 digest ({s.sha256_prefix}) "
                        f"to '{orig.safe_filename}'."
                    ),
                    involved_source_ids=[orig.source_id, s.source_id],
                    state=FlagState.open,
                )
            )
        else:
            seen_hashes[s.sha256] = s
    return flags
