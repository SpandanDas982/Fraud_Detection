"""
Money parsing and normalization logic for Evidence Ledger.

Conforms to DATA_CONTRACTS.md:
- Raw claim is retained exactly as bounded text.
- Normalized amount uses integer minor units (never binary float).
- Currency is a separate nullable string (e.g. "INR", "USD").
- Direction is separate: debit | credit | request | refund | unknown.
- Missing amount is None, not zero.
"""

from __future__ import annotations

import re
from decimal import Decimal, InvalidOperation

from evidence_ledger.contracts.models import MoneyAmount, MoneyDirection

CURRENCY_MAP = {
    "₹": "INR",
    "rs.": "INR",
    "rs": "INR",
    "inr": "INR",
    "$": "USD",
    "usd": "USD",
    "€": "EUR",
    "eur": "EUR",
    "£": "GBP",
    "gbp": "GBP",
}

DIRECTION_HINTS = {
    "debit": [
        "debited",
        "paid",
        "sent",
        "transfer to",
        "transferred to",
        "spent",
        "withdrawn",
        "purchase",
    ],
    "credit": ["credited", "received", "added", "transfer from", "transferred from", "deposit"],
    "request": ["requested", "collect request", "payment request"],
    "refund": ["refund", "refunded", "reversal"],
}


def normalize_money(raw_amount: str | None, context_text: str | None = None) -> MoneyAmount | None:
    """
    Parses a raw amount string into a normalized MoneyAmount.
    """
    if not raw_amount:
        return None

    cleaned = raw_amount.strip()
    if not cleaned:
        return None

    # Detect currency
    currency: str | None = None
    lower_cleaned = cleaned.lower()
    for symbol, code in CURRENCY_MAP.items():
        if symbol in lower_cleaned:
            currency = code
            break

    # Strip currency symbols and letters, keeping digits, dot, comma
    numeric_str = re.sub(r"[^\d.,]", "", cleaned)
    # Remove thousands separators
    # E.g. "5,000.00" -> "5000.00" or "5.000,00" (European)
    if "," in numeric_str and "." in numeric_str:
        if numeric_str.rfind(",") > numeric_str.rfind("."):
            # European format: 1.000,50
            numeric_str = numeric_str.replace(".", "").replace(",", ".")
        else:
            # Standard: 1,000.50
            numeric_str = numeric_str.replace(",", "")
    elif "," in numeric_str:
        # Could be 5,000 or 5,50
        parts = numeric_str.split(",")
        if len(parts[-1]) == 2:
            numeric_str = numeric_str.replace(",", ".")
        else:
            numeric_str = numeric_str.replace(",", "")

    try:
        dec = Decimal(numeric_str)
        minor_units = int((dec * 100).to_integral_value())
    except (InvalidOperation, ValueError):
        return None

    # Determine direction
    combined = f"{raw_amount} {context_text or ''}".lower()
    direction = MoneyDirection.unknown
    for dir_enum, hints in DIRECTION_HINTS.items():
        if any(h in combined for h in hints):
            direction = MoneyDirection(dir_enum)
            break

    return MoneyAmount(
        minor_units=minor_units,
        currency=currency,
        direction=direction,
        raw_claimed=raw_amount,
    )
