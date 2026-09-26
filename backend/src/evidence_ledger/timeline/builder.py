"""
Timeline construction engine for Evidence Ledger.

Conforms to docs/DATA_CONTRACTS.md and API.md:
- Groups observations into 3 distinct sections: 'dated', 'uncertain', 'undated'.
- Sorts dated observations deterministically by earliest timestamp asc, then observation_id.
- Retains both conflicting observations as separate timeline entries (never collapses them).
"""

from __future__ import annotations

from typing import Any

from evidence_ledger.contracts.models import (
    Observation,
    TimelinePrecision,
    TimelineSection,
)


def categorize_timeline_section(obs: Observation) -> TimelineSection:
    if not obs.time_claim:
        return TimelineSection.undated

    prec = obs.time_claim.precision
    if prec in (TimelinePrecision.exact, TimelinePrecision.date_only):
        if obs.time_claim.earliest is not None:
            return TimelineSection.dated
        return TimelineSection.uncertain

    if prec == TimelinePrecision.ambiguous:
        return TimelineSection.uncertain

    return TimelineSection.undated


def build_timeline_item(obs: Observation, section: TimelineSection) -> dict[str, Any]:
    time_claim = obs.time_claim
    earliest_iso = time_claim.earliest.isoformat() if time_claim and time_claim.earliest else None
    latest_iso = (
        time_claim.latest_exclusive.isoformat()
        if time_claim and time_claim.latest_exclusive
        else None
    )
    occurred_at = earliest_iso

    return {
        "observation_id": obs.observation_id,
        "case_id": obs.case_id,
        "source_id": obs.source_id,
        "event_type": obs.event_type,
        "timeline_section": section.value,
        "occurred_at": occurred_at,
        "earliest": earliest_iso,
        "latest_exclusive": latest_iso,
        "time_precision": time_claim.precision.value if time_claim else "unknown",
        "timezone": time_claim.timezone if time_claim else None,
        "review_status": obs.review_status.value,
        "fields": {k: v.model_dump(mode="json") for k, v in obs.fields.items()},
        "assumptions": obs.assumptions,
        "flag_codes": [code.value for code in obs.flag_codes],
        "created_at": obs.created_at.isoformat(),
        "version": obs.version,
    }


def build_timeline(observations: list[Observation], case_version: int = 1) -> dict[str, Any]:
    """
    Builds the complete timeline object according to API.md.
    """
    dated: list[dict[str, Any]] = []
    uncertain: list[dict[str, Any]] = []
    undated: list[dict[str, Any]] = []

    for obs in observations:
        sec = categorize_timeline_section(obs)
        item = build_timeline_item(obs, sec)
        if sec == TimelineSection.dated:
            dated.append(item)
        elif sec == TimelineSection.uncertain:
            uncertain.append(item)
        else:
            undated.append(item)

    # Deterministic sorting for dated: earliest asc, then observation_id asc
    dated.sort(key=lambda x: (x["earliest"] or "", x["observation_id"]))
    # Deterministic sorting for uncertain and undated
    uncertain.sort(key=lambda x: x["observation_id"])
    undated.sort(key=lambda x: x["observation_id"])

    return {
        "dated": dated,
        "uncertain": uncertain,
        "undated": undated,
        "generated_from_version": case_version,
    }
