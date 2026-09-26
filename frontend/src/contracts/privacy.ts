// Privacy masking utility — masks sensitive identifiers in UI display values.
// Rule: mask phone numbers, account numbers, emails, and transaction references
// in all UI output. Raw values are never shown except in the restricted source view.
// Aliases (Contact C01, Account A01, Transaction T01) are used in export packets.

/**
 * Masks a phone number for display with asterisks.
 * e.g. +91 98765 43210 -> +91 98*** **210
 */
export function maskPhone(value: string): string {
  // Remove non-digit prefix characters to count digits
  const digits = value.replace(/\D/g, '');
  if (digits.length < 6) return '*'.repeat(value.length);

  // If phone has country code e.g. +91 98765 43210
  if (value.startsWith('+') && digits.length >= 10) {
    const cc = digits.slice(0, 2);
    const rest = digits.slice(2);
    const first2 = rest.slice(0, 2);
    const last3 = rest.slice(-3);
    return `+${cc} ${first2}*** **${last3}`;
  }

  const first2 = digits.slice(0, 2);
  const last3 = digits.slice(-3);
  return `${first2}${'*'.repeat(Math.max(digits.length - 5, 3))}${last3}`;
}

/**
 * Masks a bank account or card number.
 * e.g. 4029-1234-5678-1184 -> 4029-XXXX-XXXX-1184
 */
export function maskAccount(value: string): string {
  const cleaned = value.replace(/[\s-]/g, '');
  if (cleaned.length < 8) return 'XXXX-XXXX';
  const first4 = cleaned.slice(0, 4);
  const last4 = cleaned.slice(-4);
  const middle = 'XXXX-XXXX';
  return `${first4}-${middle}-${last4}`;
}

/**
 * Masks an email address.
 * e.g. john.doe@example.com -> j****@example.com
 */
export function maskEmail(value: string): string {
  const [local, domain] = value.split('@');
  if (!domain) return '*'.repeat(value.length);
  const maskedLocal = local[0] + '*'.repeat(Math.max(local.length - 1, 3));
  return `${maskedLocal}@${domain}`;
}

/**
 * Sanitizes a URL for display — strips query strings and fragments
 * to prevent active-session leakage. The URL is never visited.
 */
export function sanitizeUrl(value: string): string {
  try {
    const url = new URL(value);
    return `[Sanitized URL: ${url.hostname}${url.pathname.slice(0, 30)}${url.pathname.length > 30 ? '…' : ''}]`;
  } catch {
    return '[Sanitized URL: invalid format]';
  }
}

/**
 * Masks a UPI ID for display.
 * e.g. user.name@okaxis -> user.m****@okaxis
 */
export function maskUpiId(value: string): string {
  const parts = value.split('@');
  if (parts.length !== 2) return '••••@••••';
  const handle = parts[0];
  const provider = parts[1];
  const maskedHandle = handle.slice(0, 4) + '****';
  return `${maskedHandle}@${provider}`;
}

/**
 * Determines the alias token for a sensitive value in export output.
 * e.g. phone -> Contact C01, account -> Account A01
 */
export type AliasType = 'contact' | 'account' | 'transaction' | 'url';

export interface PrivacyAlias {
  alias_token: string;
  masked_display: string;
  alias_type: AliasType;
}

/**
 * Returns a masked display string based on field type and alias assignment.
 * In mock mode, aliases are deterministic from the fixture.
 */
export function getMaskedDisplay(fieldType: AliasType, rawValue: string, alias: string): string {
  switch (fieldType) {
    case 'contact':
      return maskPhone(rawValue);
    case 'account':
      return maskAccount(rawValue);
    case 'url':
      return sanitizeUrl(rawValue);
    case 'transaction':
      // Transaction refs are shown as aliases in exports
      return alias;
    default:
      return rawValue;
  }
}
