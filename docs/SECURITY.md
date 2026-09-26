# Security and Privacy

## Scope statement

Hackathon mode uses synthetic evidence only. The target architecture reduces obvious exposure but is not approved for real victim data. Production use requires authentication/authorization, privacy/legal review, regional processing decisions, retention/deletion controls, audit, abuse controls, incident response, and vendor agreements.

## Assets

Raw evidence, rendered pages, transcripts, structured claims, matching values, reviewer corrections, PDF/CSV exports, API keys, AWS credentials/roles, presigned URLs, and operational metadata.

## Trust boundaries

- Browser/Vercel client is untrusted.
- API Gateway/Lambda validate every request.
- S3 event data and uploaded file metadata are untrusted.
- Evidence content can contain prompt injection and malicious payloads.
- Nova and Sarvam are external processing boundaries; their outputs are untrusted candidates.
- Export is a separate disclosure boundary and uses only a safe view model.

## Controls

### Upload

- Direct S3 upload through short-lived operation/object-scoped presigned URLs.
- Server-generated object keys.
- Content-type/size conditions and configured count/page/duration limits.
- Extension/MIME/magic-byte checks where practical.
- Public access blocked, encryption enabled, CORS restricted.
- Raw prefix alone triggers processing; derived/export writes cannot loop.

### Compute and IAM

- Least-privilege role per Lambda.
- Backend-only secrets, preferably managed secret/environment integration.
- Resource names supplied by environment, not hard-coded.
- Network timeout, bounded retry, and provider error sanitization.
- Idempotent handlers and conditional writes for duplicate events.

### Evidence/model safety

- Delimit evidence as untrusted data; system prompt forbids obeying embedded instructions.
- No tool use or URL fetch initiated by evidence.
- Strict structured output/Pydantic validation.
- Null for absence; confidence never equals truth.
- Human review for low-confidence, unreadable, ambiguous, or assumed values.

### Privacy

- Raw evidence/transcripts/provider payloads never logged.
- Shareable aliases separate from restricted matching values.
- Common masking policy used by UI summaries, flags, errors, CSV, PDF, and telemetry.
- Download URLs short-lived and not logged.
- TTL/lifecycle policy disclosed accurately; TTL is not immediate secure erasure.
- Redaction protects output, not source content already processed by vendors.

### Export

- Real CSV serializer and formula-cell neutralization.
- URLs displayed inert and sanitized; no clickable untrusted links by default.
- PDF metadata uses safe case alias, not raw personal identifiers.
- Export checksum and policy/schema versions recorded.

## Threat table

| Threat | Control | Verification |
|---|---|---|
| Credential exposure | backend-only config, ignore files, secret scan | repository scan + frontend bundle inspection |
| Cross-case access | opaque IDs, authorization design, scoped keys | negative access tests when auth exists |
| Public S3 object | block-public-access policy | infrastructure assertion/smoke check |
| Oversized/decompression file | preflight and processing limits | boundary fixtures |
| Prompt injection | evidence delimiter, no source-driven tools, schema validation | adversarial text/image fixture |
| Duplicate S3 event | conditional claim/idempotency | replay same event twice |
| PII in logs/export | safe logging/view model | planted-secret scan |
| CSV formula execution | prefix/control normalization and neutralization | formula fixtures in spreadsheet-targeted output |
| Stale edit overwrite | optimistic version | concurrent-edit 409 test |
| Provider outage | partial state, bounded retry, mock mode | forced timeout/error fixture |

## Logging policy

Allowed: request ID, case/source opaque ID, handler name, status transition, duration, error code, provider/model identifier, bounded usage metadata.  
Forbidden: raw filename when sensitive, evidence bytes/text, transcript, contact/account/reference values, prompt/provider payload, presigned URL, secrets.

## Pre-release gate

- synthetic data confirmed;
- secret scan clean;
- S3 non-public/encrypted/lifecycle checked;
- CORS restricted;
- IAM reviewed;
- raw logging absent;
- planted PII/formula/prompt-injection tests pass;
- disclaimers and retention statement visible;
- known production gaps listed.
