"""
Canonical CSV v1 export generator for Evidence Ledger.

Conforms to docs/DATA_CONTRACTS.md and API.md:
- Canonical header:
  case_id,observation_id,timeline_section,occurred_at,earliest,latest_exclusive,
  time_precision,timezone,event_type,amount,currency,direction,actor_alias,
  transaction_alias,source_id,source_locator,field_sources_json,summary_redacted,
  flag_codes,flag_details_json,assumptions_json,review_status
- Retains both conflicting observations on separate rows.
- Neutralizes formula-like injection (=, +, -, @) in all cells.
- Serializes nested structures to JSON strings.
"""

from __future__ import annotations

import csv
import io
import json

from evidence_ledger.contracts.models import (
    Flag,
    Link,
    Observation,
)
from evidence_ledger.privacy.masking import (
    CaseAliasRegistry,
    neutralize_csv_formula,
    redact_free_text,
)
from evidence_ledger.timeline.builder import categorize_timeline_section

CSV_V1_HEADER = [
    "case_id",
    "observation_id",
    "timeline_section",
    "occurred_at",
    "earliest",
    "latest_exclusive",
    "time_precision",
    "timezone",
    "event_type",
    "amount",
    "currency",
    "direction",
    "actor_alias",
    "transaction_alias",
    "source_id",
    "source_locator",
    "field_sources_json",
    "summary_redacted",
    "flag_codes",
    "flag_details_json",
    "assumptions_json",
    "review_status",
]


def generate_csv_v1(
    case_id: str,
    observations: list[Observation],
    flags: list[Flag] | None = None,
    links: list[Link] | None = None,
    alias_registry: CaseAliasRegistry | None = None,
) -> bytes:
    """
    Generates CSV export bytes adhering to CSV v1 format.
    """
    registry = alias_registry or CaseAliasRegistry()
    flags_by_obs: dict[str, list[Flag]] = {}
    if flags:
        for f in flags:
            for oid in f.involved_observation_ids:
                flags_by_obs.setdefault(oid, []).append(f)

    # Sort observations deterministically
    sorted_obs = sorted(
        observations,
        key=lambda o: (
            o.time_claim.earliest.isoformat() if o.time_claim and o.time_claim.earliest else "9999",
            o.observation_id,
        ),
    )

    output = io.StringIO()
    writer = csv.writer(output, quoting=csv.QUOTE_MINIMAL, lineterminator="\n")
    writer.writerow(CSV_V1_HEADER)

    for obs in sorted_obs:
        sec = categorize_timeline_section(obs)
        tc = obs.time_claim

        earliest_str = tc.earliest.isoformat() if tc and tc.earliest else ""
        latest_str = tc.latest_exclusive.isoformat() if tc and tc.latest_exclusive else ""
        occurred_at_str = earliest_str

        # Amount and currency
        amt_field = obs.fields.get("amount")
        amount_val = ""
        currency_val = ""
        if amt_field:
            val = (
                amt_field.reviewed_value
                if amt_field.reviewed_value is not None
                else amt_field.normalized_candidate_value
            )
            amount_val = val or ""
        curr_field = obs.fields.get("currency")
        if curr_field:
            curr_val = (
                curr_field.reviewed_value
                if curr_field.reviewed_value is not None
                else curr_field.normalized_candidate_value
            )
            currency_val = curr_val or ""

        # Direction
        direction_val = "unknown"
        if amt_field and amt_field.raw_claimed_value:
            from evidence_ledger.normalization.money import normalize_money

            m = normalize_money(amt_field.raw_claimed_value)
            if m:
                direction_val = m.direction.value

        # Aliases
        actor_alias = ""
        recipient_field = obs.fields.get("recipient") or obs.fields.get("sender")
        if recipient_field and recipient_field.raw_claimed_value:
            actor_alias = registry.get_contact_alias(recipient_field.raw_claimed_value)

        tx_alias = ""
        tx_field = obs.fields.get("transaction_reference")
        if tx_field and tx_field.raw_claimed_value:
            tx_alias = registry.get_transaction_alias(tx_field.raw_claimed_value)

        # Locator
        locators = [f"{k}:{v.source_locator}" for k, v in obs.fields.items() if v.source_locator]
        source_locator = "; ".join(locators)

        # JSON fields
        field_sources = {
            k: {
                "raw": v.raw_claimed_value,
                "reviewed": v.reviewed_value,
                "state": v.state.value,
                "confidence": v.confidence,
                "locator": v.source_locator,
            }
            for k, v in obs.fields.items()
        }
        field_sources_json = json.dumps(field_sources)

        # Summary redacted
        raw_summary = f"{obs.event_type} of {currency_val} {amount_val} via {obs.extraction_method}"
        summary_redacted = redact_free_text(raw_summary)

        # Flag codes and flag details JSON
        obs_flags = flags_by_obs.get(obs.observation_id, [])
        flag_codes = ";".join(sorted(set(f.code.value for f in obs_flags)))
        flag_details = [
            {
                "flag_id": f.flag_id,
                "code": f.code.value,
                "category": f.category.value,
                "explanation": f.explanation,
                "state": f.state.value,
            }
            for f in obs_flags
        ]
        flag_details_json = json.dumps(flag_details)
        assumptions_json = json.dumps(obs.assumptions)

        row = [
            neutralize_csv_formula(case_id),
            neutralize_csv_formula(obs.observation_id),
            sec.value,
            neutralize_csv_formula(occurred_at_str),
            neutralize_csv_formula(earliest_str),
            neutralize_csv_formula(latest_str),
            tc.precision.value if tc else "unknown",
            neutralize_csv_formula(tc.timezone if tc else ""),
            neutralize_csv_formula(obs.event_type),
            neutralize_csv_formula(amount_val),
            neutralize_csv_formula(currency_val),
            direction_val,
            neutralize_csv_formula(actor_alias),
            neutralize_csv_formula(tx_alias),
            neutralize_csv_formula(obs.source_id),
            neutralize_csv_formula(source_locator),
            field_sources_json,
            neutralize_csv_formula(summary_redacted),
            neutralize_csv_formula(flag_codes),
            flag_details_json,
            assumptions_json,
            obs.review_status.value,
        ]
        writer.writerow(row)

    return output.getvalue().encode("utf-8")
