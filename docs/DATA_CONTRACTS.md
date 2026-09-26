# Data Contracts and Invariants

**Status: canonical authoritative source — frontend TypeScript types and backend Pydantic models MUST match this file exactly.**

Last updated: 2026-09-26

## Core invariant

The system stores source claims and reviewer decisions; it does not store a single chosen "truth." A derived event grouping references observations and never destroys them.

---

## Enumerations

All enum values are snake_case strings. Frontend TypeScript and backend Pydantic must use these exact values — no abbreviations, no aliases.

### SourceStatus

Represents the processing lifecycle of a single evidence source.

```
awaiting_upload     — upload-intent issued; file not yet received by S3
queued              — received, waiting for processing slot
processing          — actively being extracted
ready               — extraction complete; observations available
partial             — extraction completed with some fields unresolvable
failed              — extraction failed; source retained in inventory
duplicate           — same SHA-256 as an existing source; retained, not processed twice
unsupported         — file type/format/encryption outside supported set
deletion_requested  — user requested deletion; actual removal may be async
```

UI display labels (UI-layer only, not stored values):

| Status | UI label |
|--------|----------|
| `awaiting_upload` | Awaiting upload |
| `queued` | Queued |
| `processing` | Processing |
| `ready` | Ready |
| `partial` | Partial |
| `failed` | Failed |
| `duplicate` | Duplicate |
| `unsupported` | Unsupported |
| `deletion_requested` | Deletion requested |

> ⚠️ "Needs review" is a UI filter label only, not a stored status value.

---

### ReviewStatus (entity-level)

Represents the aggregate review state of an entire observation. Stored on the Observation entity.

```
unreviewed           — no fields have been reviewed
partially_reviewed   — some fields reviewed, others pending
reviewed             — all fields have a reviewer decision
```

> `rejected` at the observation level is NOT a valid ReviewStatus. Field-level rejection uses FieldAction and FieldState. An observation is never wholly rejected — only individual fields are.

---

### FieldAction (API write verb)

Verbs sent in the `PATCH /observations/{id}` request body `field_reviews[].action`. These are WRITE-TIME ONLY — they are not stored. They transition FieldState.

```
accept       — reviewer accepts the extracted candidate as-is
correct      — reviewer provides a different reviewed_value
reject       — reviewer marks the extracted value as incorrect/unusable
unreadable   — reviewer confirms the source field cannot be read at all
unavailable  — reviewer confirms the information is absent from this source
```

**FieldAction → FieldState transition:**

| FieldAction | Resulting FieldState |
|-------------|---------------------|
| `accept` | `accepted` |
| `correct` | `corrected` |
| `reject` | `rejected` |
| `unreadable` | `unreadable` |
| `unavailable` | `unavailable` |

---

### FieldState

Represents the current state of a single field within an observation. Stored per-field.

```
missing      — field was not present in the source
extracted    — candidate extracted, awaiting reviewer decision
accepted     — reviewer accepted the extracted candidate
corrected    — reviewer provided a different value
rejected     — reviewer marked the extracted value as wrong
unreadable   — source content cannot be read for this field
unavailable  — reviewer confirmed the information is absent
invalid      — extracted value cannot be normalized safely; requires review
ambiguous    — multiple valid interpretations; requires reviewer choice
```

---

### TimelineSection

```
dated       — observation has a usable time anchor
uncertain   — observation has a time claim that cannot be precisely placed
undated     — observation has no time information
```

---

### TimelinePrecision

```
exact        — full timestamp with timezone
date_only    — date known, time unknown (one-day interval)
ambiguous    — multiple interpretations (e.g. 03/04/2026 locale unclear)
unknown      — no time information
```

---

### FlagCode

Stored on Flag entities and observation.flag_codes arrays.

```
MISSING_INFO                — required field absent from source
INVALID_VALUE               — extracted value cannot be normalized
AMBIGUOUS_TIME              — multiple date/time interpretations
HUMAN_VERIFICATION_REQUIRED — low confidence, unreadable, assumed, or model-flagged value
AMOUNT_DISCREPANCY          — explicitly linked sources report different amounts
TIME_DISCREPANCY            — explicitly linked sources report incompatible times
DUPLICATE_SOURCE            — same SHA-256 as existing source
POTENTIAL_DUPLICATE         — similar observations without sufficient identity match
UNSUPPORTED_INPUT           — file type/encryption outside support
PROCESSING_ERROR            — provider/parser failed
```

### FlagCategory

Groups of FlagCodes for UI filtering. Category is derived — NOT stored on Flag entities.

| Category | FlagCodes |
|----------|-----------|
| `missing_info` | `MISSING_INFO` |
| `invalid_value` | `INVALID_VALUE` |
| `ambiguous_time` | `AMBIGUOUS_TIME` |
| `human_verification` | `HUMAN_VERIFICATION_REQUIRED` |
| `inconsistency` | `AMOUNT_DISCREPANCY`, `TIME_DISCREPANCY` |
| `duplicate` | `DUPLICATE_SOURCE`, `POTENTIAL_DUPLICATE` |
| `processing` | `UNSUPPORTED_INPUT`, `PROCESSING_ERROR` |

---

## Money

- Raw claim retained exactly as bounded text.
- Normalized amount uses decimal string or integer minor units, never binary float.
- Currency is a separate nullable string (e.g. `"INR"`, `"USD"`).
- Direction is separate: `debit | credit | request | refund | unknown`.
- Missing amount is `null`, not zero.
- Amount comparison requires compatible currency AND explicitly linked transaction identity.
- Never sum amounts that may describe the same transaction.

---

## Time

```json
{
  "raw": "03/04/2026 10:45",
  "earliest": null,
  "latest_exclusive": null,
  "precision": "ambiguous",
  "timezone": null,
  "candidate_interpretations": ["2026-03-04T10:45", "2026-04-03T10:45"],
  "status": "ambiguous"
}
```

Valid representations: exact timestamp, date-only interval, bounded interval, candidate set, invalid, or unresolved. An ingestion timestamp NEVER substitutes for occurrence time.

---

## Source locator

At least one appropriate locator per observation field:

- **image:** region description + anchor text; bounding box only when reliable
- **PDF:** page number + anchor/region description
- **text:** line/character span + anchor quote
- **audio:** start_ms + end_ms + transcript anchor quote

Filename alone is insufficient provenance.

---

## Review

Candidate value is immutable. Review adds `action` (FieldAction), `reviewed_value`, `review_note`, `reviewed_by`, `reviewed_at`, and increments `version`. A correction displays both candidate and reviewed values in detailed views.

---

## Aliases and matching

Backend may use restricted normalized values for internal matching (e.g., normalized phone E.164). Shareable aliases are always separate:

- `Contact C01`, `Contact C02` — phone/email identifiers
- `Account A01`, `Account A02` — bank/card account identifiers
- `Transaction T01`, `Transaction T02` — transaction/UTR references
- `[Sanitized URL: hostname/path]` — URL display

Masked last-four digits MUST NOT be used as entity keys (collision risk).

---

## Versioning

Each layer has an independent version counter:

| Layer | Attribute |
|-------|-----------|
| Persisted entity | `version` (integer, optimistic concurrency) |
| Schema shape | `schema_version` (string, e.g. `"1.0"`) |
| Extraction prompts | `prompt_schema_version` |
| Flag rules | `rule_version` |
| CSV export format | `export_schema_version` |
| Masking policy | `masking_policy_version` |

Breaking changes require compatibility logic or migration and a decision record in `DECISIONS.md`.

---

## CSV export header (v1 — canonical)

```
case_id,observation_id,timeline_section,occurred_at,earliest,latest_exclusive,
time_precision,timezone,event_type,amount,currency,direction,actor_alias,
transaction_alias,source_id,source_locator,field_sources_json,summary_redacted,
flag_codes,flag_details_json,assumptions_json,review_status
```

One row per observation. Both conflicting observations are retained as separate rows. JSON-in-cell values are serialized with Python's `json.dumps` then the CSV writer. Formula-like leading characters (`=`, `+`, `-`, `@`) must be neutralized.

---

## AWS SDK configuration

All backend Lambda code uses the `aws` named profile when running locally:

```python
import boto3
session = boto3.Session(profile_name='aws')
```

In Lambda execution context the profile is not used; IAM role credentials are used automatically via the standard credential chain. No explicit credentials or region strings are hardcoded — region comes from the `AWS_REGION` environment variable.
