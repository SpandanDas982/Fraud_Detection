"""
Unit tests for privacy, masking, alias registry, and CSV formula neutralization.
"""

from __future__ import annotations

from evidence_ledger.privacy.masking import (
    CaseAliasRegistry,
    compute_field_masked_display,
    mask_account,
    mask_email,
    mask_phone,
    mask_upi_id,
    neutralize_csv_formula,
    redact_free_text,
    sanitize_url,
)


def test_mask_phone() -> None:
    # 10 digits
    assert mask_phone("9876543210") == "98*****210"
    # With country code +91
    masked = mask_phone("+919876543210")
    assert masked == "+91 98*** **210"
    # Short number
    assert mask_phone("123") == "***"


def test_mask_account() -> None:
    assert mask_account("4029-1234-5678-1184") == "4029-XXXX-XXXX-1184"
    assert mask_account("4029123456781184") == "4029-XXXX-XXXX-1184"
    assert mask_account("123") == "XXXX-XXXX"


def test_mask_email() -> None:
    assert mask_email("john.doe@example.com") == "j*******@example.com"
    assert mask_email("a@b.com") == "a***@b.com"
    assert mask_email("invalid") == "*******"


def test_compute_field_masked_display() -> None:
    assert compute_field_masked_display("sender_phone", "+919876543210") == "+91 98*** **210"
    assert compute_field_masked_display("beneficiary_account", "4029123456781184") == "4029-XXXX-XXXX-1184"
    assert compute_field_masked_display("upi_id", "user.name@okaxis") == "user****@okaxis"
    assert compute_field_masked_display("unknown_note", "Call 9876543210") == "Call 98*****210"


def test_mask_upi_id() -> None:
    assert mask_upi_id("rahul.kumar@okicici") == "rahu****@okicici"
    assert mask_upi_id("badupi") == "••••@••••"


def test_sanitize_url() -> None:
    # Strips params and tokens
    clean = sanitize_url("https://secure.pay-gateway.com/verify?token=SECRET123&session=ABC")
    assert "token=SECRET123" not in clean
    assert clean == "[Sanitized URL: secure.pay-gateway.com/verify]"

    # Bad url
    assert sanitize_url("not a url") == "[Sanitized URL: invalid format]"


def test_neutralize_csv_formula() -> None:
    assert neutralize_csv_formula("=SUM(A1:A10)") == "'=SUM(A1:A10)"
    assert neutralize_csv_formula("+12345") == "'+12345"
    assert neutralize_csv_formula("-999") == "'-999"
    assert neutralize_csv_formula("@cmd") == "'@cmd"
    assert neutralize_csv_formula("Regular Text") == "Regular Text"
    assert neutralize_csv_formula(None) == ""


def test_case_alias_registry() -> None:
    registry = CaseAliasRegistry()
    c1 = registry.get_contact_alias("+91 98765 43210")
    c2 = registry.get_contact_alias("+91 98765 43210")
    c3 = registry.get_contact_alias("+91 91234 56789")
    assert c1 == "Contact C01"
    assert c2 == "Contact C01"  # deterministic for same contact
    assert c3 == "Contact C02"

    a1 = registry.get_account_alias("1234-5678-9012")
    a2 = registry.get_account_alias("123456789012")
    assert a1 == "Account A01"
    assert a2 == "Account A01"

    t1 = registry.get_transaction_alias("UPI-987654321")
    assert t1 == "Transaction T01"


def test_redact_free_text() -> None:
    text = "Transferred to rahul.kumar@okicici from account 4029-1234-5678-1184. Call me at +91 98765 43210."
    redacted = redact_free_text(text)
    assert "rahul.kumar@okicici" not in redacted
    assert "4029-1234-5678-1184" not in redacted
    assert "rahu****@okicici" in redacted
