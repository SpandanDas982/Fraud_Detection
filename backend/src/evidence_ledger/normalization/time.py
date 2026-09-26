"""
Time claim parsing and normalization logic for Evidence Ledger.

Conforms to DATA_CONTRACTS.md:
- Never substitutes ingestion timestamp for event time.
- Handles exact timestamps, date-only intervals, ambiguous formats, and missing time.
"""

from __future__ import annotations

import re
from datetime import UTC, datetime, timedelta

from evidence_ledger.contracts.models import TimeClaim, TimelinePrecision

# Regex to detect potentially ambiguous date format like DD/MM/YYYY vs MM/DD/YYYY
SLASH_DATE_PATTERN = re.compile(
    r"^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$"
)
TIME_ONLY_PATTERN = re.compile(r"^\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM|am|pm)?$")


def normalize_time(raw_time: str | None) -> TimeClaim:
    """
    Parses a raw time string into a structured TimeClaim.
    """
    if not raw_time or not raw_time.strip():
        return TimeClaim(
            raw=raw_time,
            precision=TimelinePrecision.unknown,
            status="unknown",
        )

    cleaned = raw_time.strip()

    # Check for time-only (e.g. "10:45 AM")
    if TIME_ONLY_PATTERN.match(cleaned):
        return TimeClaim(
            raw=cleaned,
            precision=TimelinePrecision.ambiguous,
            status="time_only_no_date",
            candidate_interpretations=[],
        )

    # Check for ambiguous slash/dash date (e.g. "03/04/2026 10:45")
    match = SLASH_DATE_PATTERN.match(cleaned)
    if match:
        p1, p2, yr, hr, mn, sc = match.groups()
        n1, n2, year = int(p1), int(p2), int(yr)
        hr_val = int(hr) if hr else 0
        mn_val = int(mn) if mn else 0
        sc_val = int(sc) if sc else 0

        # If both n1 <= 12 and n2 <= 12 and n1 != n2, it is ambiguous
        if 1 <= n1 <= 12 and 1 <= n2 <= 12 and n1 != n2:
            time_part = f"{hr_val:02d}:{mn_val:02d}:{sc_val:02d}"
            interp1 = f"{year:04d}-{n1:02d}-{n2:02d}T{time_part}"
            interp2 = f"{year:04d}-{n2:02d}-{n1:02d}T{time_part}"
            return TimeClaim(
                raw=cleaned,
                precision=TimelinePrecision.ambiguous,
                candidate_interpretations=[interp1, interp2],
                status="ambiguous",
            )
        else:
            # Deterministic: if n1 > 12, then n1 is day, n2 is month; if n2 > 12, n2 is day, n1 is month
            day = n1 if n1 > 12 else n2
            month = n2 if n1 > 12 else n1
            try:
                dt = datetime(year, month, day, hr_val, mn_val, sc_val, tzinfo=UTC)
                if hr is not None:
                    return TimeClaim(
                        raw=cleaned,
                        earliest=dt,
                        latest_exclusive=dt,
                        precision=TimelinePrecision.exact,
                        status="exact",
                    )
                else:
                    return TimeClaim(
                        raw=cleaned,
                        earliest=dt,
                        latest_exclusive=dt + timedelta(days=1),
                        precision=TimelinePrecision.date_only,
                        status="date_only",
                    )
            except ValueError:
                return TimeClaim(
                    raw=cleaned,
                    precision=TimelinePrecision.unknown,
                    status="invalid",
                )

    # Try date-only standard format YYYY-MM-DD
    if re.match(r"^\d{4}-\d{2}-\d{2}$", cleaned):
        try:
            dt = datetime.strptime(cleaned, "%Y-%m-%d").replace(tzinfo=UTC)
            return TimeClaim(
                raw=cleaned,
                earliest=dt,
                latest_exclusive=dt + timedelta(days=1),
                precision=TimelinePrecision.date_only,
                status="date_only",
            )
        except ValueError:
            pass

    # Try ISO formats with time component
    try:
        iso_str = cleaned.replace("Z", "+00:00")
        dt = datetime.fromisoformat(iso_str)
        tz_str = dt.tzname() or (
            f"+{int(dt.utcoffset().total_seconds() // 3600):02d}:00" if dt.utcoffset() else None
        )
        return TimeClaim(
            raw=cleaned,
            earliest=dt,
            latest_exclusive=dt,
            precision=TimelinePrecision.exact,
            timezone=tz_str,
            status="exact",
        )
    except ValueError:
        pass

    return TimeClaim(
        raw=cleaned,
        precision=TimelinePrecision.unknown,
        status="invalid",
    )
