"""
Privacy, masking, and redaction logic for Evidence Ledger.

Conforms to docs/DATA_CONTRACTS.md and PROJECT.md privacy invariants:
- Masks phone numbers, account numbers, emails, UPI IDs, and sanitizes URLs.
- Generates safe aliases (Contact C01, Account A01, Transaction T01).
- Neutralizes formula-like injection in CSV cells (=, +, -, @).
- Does not log or expose raw sensitive values.
"""

from __future__ import annotations

import re
from typing import Literal
from urllib.parse import urlparse

AliasType = Literal["contact", "account", "transaction", "url", "upi"]


def mask_phone(value: str) -> str:
    """
    Masks a phone number for display with asterisks.
    e.g. +91 98765 43210 -> +91 98*** **210
    """
    if not value:
        return ""
    digits = re.sub(r"\D", "", value)
    if len(digits) < 6:
        return "*" * len(value)

    if value.startswith("+") and len(digits) >= 10:
        cc_len = 2 if len(digits) == 12 else 1
        country_code = digits[:cc_len]
        rest = digits[cc_len:]
        first2 = rest[:2]
        last3 = rest[-3:]
        return f"+{country_code} {first2}*** **{last3}"

    first2 = digits[:2]
    last3 = digits[-3:]
    return f"{first2}{'*' * (len(digits) - 5)}{last3}"


def mask_account(value: str) -> str:
    """
    Masks a bank account or card number.
    e.g. 4029-1234-5678-1184 -> 4029-XXXX-XXXX-1184
    """
    if not value:
        return ""
    cleaned = re.sub(r"[\s-]", "", value)
    if len(cleaned) < 8:
        return "XXXX-XXXX"
    first4 = cleaned[:4]
    last4 = cleaned[-4:]
    return f"{first4}-XXXX-XXXX-{last4}"


def mask_email(value: str) -> str:
    """
    Masks an email address.
    e.g. john.doe@example.com -> j****@example.com
    """
    if not value or "@" not in value:
        return "*" * len(value) if value else ""
    local, domain = value.split("@", 1)
    if not local:
        return f"*@{domain}"
    masked_local = local[0] + "*" * max(len(local) - 1, 3)
    return f"{masked_local}@{domain}"


def compute_field_masked_display(field_name: str, value: str | None) -> str | None:
    """
    Computes a privacy-masked display value for any candidate or raw field value.
    Ensures sensitive phone numbers, accounts, emails, and UPI handles are never sent raw.
    """
    if not value:
        return None
    fn = field_name.lower()
    if any(k in fn for k in ("phone", "msisdn", "mobile", "tel", "contact")):
        return mask_phone(value)
    if any(k in fn for k in ("account", "card", "beneficiary_acc", "bank_acc")):
        return mask_account(value)
    if any(k in fn for k in ("upi", "vpa")):
        return mask_upi_id(value)
    if any(k in fn for k in ("email", "mail")):
        return mask_email(value)
    if any(k in fn for k in ("url", "link", "uri", "portal")):
        return sanitize_url(value)
    return redact_free_text(value)


def mask_upi_id(value: str) -> str:
    """
    Masks a UPI ID for display.
    e.g. user.name@okaxis -> user.****@okaxis
    """
    if not value or "@" not in value:
        return "••••@••••"
    parts = value.split("@", 1)
    handle, provider = parts[0], parts[1]
    masked_handle = handle[:4] + "****" if len(handle) > 4 else handle + "****"
    return f"{masked_handle}@{provider}"


def sanitize_url(value: str) -> str:
    """
    Sanitizes a URL for display — strips query strings and fragments
    to prevent active-session leakage. Never fetches or scores the URL.
    """
    if not value:
        return "[Sanitized URL: empty]"
    try:
        parsed = urlparse(value)
        if not parsed.netloc:
            return "[Sanitized URL: invalid format]"
        path = parsed.path
        if len(path) > 30:
            path = path[:30] + "…"
        return f"[Sanitized URL: {parsed.netloc}{path}]"
    except Exception:
        return "[Sanitized URL: invalid format]"


def neutralize_csv_formula(value: str | None) -> str:
    """
    Neutralizes formula-like injection in CSV cells.
    Any cell beginning with '=', '+', '-', or '@' has a single quote prepended.
    """
    if value is None:
        return ""
    str_val = str(value)
    if str_val and str_val[0] in ("=", "+", "-", "@"):
        return f"'{str_val}"
    return str_val


# Regex patterns for scanning free text
PHONE_PATTERN = re.compile(r"(\+?\d{1,3}[-.\s]?)?\(?\d{3,5}\)?[-.\s]?\d{3}[-.\s]?\d{4}")
EMAIL_PATTERN = re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+")
UPI_PATTERN = re.compile(r"[a-zA-Z0-9_.]{2,256}@[a-zA-Z]{2,64}")
ACCOUNT_PATTERN = re.compile(r"\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{2,4}\b")


def redact_free_text(text: str) -> str:
    """
    Redacts sensitive phone numbers, emails, accounts, and UPIs in narrative text or summaries.
    """
    if not text:
        return ""
    # Redact emails first
    res = EMAIL_PATTERN.sub(lambda m: mask_email(m.group(0)), text)
    # Redact UPI (check if not email)
    res = UPI_PATTERN.sub(lambda m: mask_upi_id(m.group(0)), res)
    # Redact accounts/cards
    res = ACCOUNT_PATTERN.sub(lambda m: mask_account(m.group(0)), res)
    # Redact phones
    res = PHONE_PATTERN.sub(lambda m: mask_phone(m.group(0)), res)
    return res


class CaseAliasRegistry:
    """
    Maintains deterministic, scoped aliases for a case (e.g. Contact C01, Account A01, Transaction T01).
    """

    def __init__(self) -> None:
        self._contacts: dict[str, str] = {}
        self._accounts: dict[str, str] = {}
        self._transactions: dict[str, str] = {}

    def get_contact_alias(self, raw_value: str) -> str:
        key = raw_value.strip().lower()
        if key not in self._contacts:
            idx = len(self._contacts) + 1
            self._contacts[key] = f"Contact C{idx:02d}"
        return self._contacts[key]

    def get_account_alias(self, raw_value: str) -> str:
        cleaned = re.sub(r"[\s-]", "", raw_value.strip())
        if cleaned not in self._accounts:
            idx = len(self._accounts) + 1
            self._accounts[cleaned] = f"Account A{idx:02d}"
        return self._accounts[cleaned]

    def get_transaction_alias(self, raw_value: str) -> str:
        key = raw_value.strip().upper()
        if key not in self._transactions:
            idx = len(self._transactions) + 1
            self._transactions[key] = f"Transaction T{idx:02d}"
        return self._transactions[key]
