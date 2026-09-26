# API Contract

Base URL: `{API_BASE_URL}/v1`  
All route paths in this document are relative to the base URL — `/v1` is NOT repeated in the paths below.  
Transport: HTTPS JSON except direct S3 upload/download  
Authentication: not implemented in the hackathon mock; production authorization is explicitly unresolved  
AWS SDK: local development uses `boto3.Session(profile_name='aws')`. Lambda execution uses IAM role automatically. No credentials are hardcoded.

## Vocabulary note

**FieldAction** (write-time verb sent in PATCH body) and **ReviewStatus / FieldState** (stored entity values) are two distinct concepts.  
See `DATA_CONTRACTS.md` for the complete enum definitions and the FieldAction→FieldState transition table.  
The PATCH request sends a `FieldAction`; the resulting stored state is a `FieldState`.

## Conventions

- IDs are opaque UUID/ULID-style strings.
- Timestamps are ISO 8601 UTC unless the field represents source-reported time.
- Mutations accept `Idempotency-Key`.
- Mutable entities expose integer `version`; updates send `If-Match` or body `expected_version`.
- Errors never include raw source/provider content.
- Pagination uses opaque `next_cursor`.

### Error envelope

```json
{
  "error": {
    "code": "SOURCE_NOT_READY",
    "message": "This source is still processing.",
    "request_id": "req_...",
    "details": {}
  }
}
```

HTTP mapping: 400 invalid request, 404 not found, 409 version/idempotency conflict, 413 size limit, 415 media type, 422 valid shape but unsupported state, 429 limit, 500 internal, 502/503 provider unavailable.

## Cases

### `POST /cases`

Request:

```json
{"safe_title":"Demo evidence packet","mode":"mock"}
```

Response `201`:

```json
{"case_id":"case_01","status":"draft","mode":"mock","created_at":"...","version":1}
```

### `GET /cases/{case_id}`

Returns safe summary counts, status, mode, retention notice version, and version. It never returns raw evidence.

### `DELETE /cases/{case_id}`

Returns `202` with deletion job/state. Do not claim immediate secure erasure; DynamoDB TTL/S3 lifecycle may be asynchronous.

## Sources

### `POST /cases/{case_id}/sources/upload-intent`

Request:

```json
{
  "filename":"payment.png",
  "media_type":"image/png",
  "size_bytes":342991,
  "sha256":"optional-client-digest"
}
```

Response `201`:

```json
{
  "source_id":"src_01",
  "upload":{"method":"PUT","url":"<presigned>","headers":{"Content-Type":"image/png"},"expires_at":"..."},
  "status":"awaiting_upload"
}
```

The presigned URL is sensitive and must not be logged.

### `POST /cases/{case_id}/sources/text`

```json
{"safe_label":"Pasted message","text":"bounded synthetic content"}
```

Returns source metadata with queued/processing state.

### `GET /cases/{case_id}/sources?cursor=&limit=`

Returns source inventory containing only safe metadata, status, counts, duplicate relation, and error code.

### `GET /cases/{case_id}/sources/{source_id}`

Returns safe metadata and an optional short-lived preview URL. Never returns S3 bucket/key to untrusted clients unless required by the signed URL contract.

### `POST /cases/{case_id}/sources/{source_id}/retry`

Allowed only for retryable failed states. Idempotent response returns current/new processing state.

## Observations and review

### `GET /cases/{case_id}/observations`

Filters: `source_id`, `review_status`, `event_type`, `cursor`, `limit`.

Observation fields include candidate/reviewed values, confidence, source locator/anchor, assumptions, and version. Restricted raw matching keys are never returned.

### `PATCH /cases/{case_id}/observations/{observation_id}`

Request:

```json
{
  "expected_version":2,
  "field_reviews":[
    {"field":"amount","action":"correct","reviewed_value":"5000.00","note":"Read directly from source"},
    {"field":"transaction_reference","action":"unavailable","reviewed_value":null}
  ]
}
```

Actions: `accept`, `correct`, `reject`, `unreadable`, `unavailable`. Response returns updated safe observation and new version. Conflict returns 409 with current version.

### `POST /cases/{case_id}/links`

```json
{
  "link_type":"same_transaction",
  "observation_ids":["obs_01","obs_02"],
  "rationale":"Reviewer confirmed matching reference namespace and value"
}
```

Creates a reviewer-confirmed relationship; does not merge observations.

## Timeline and flags

### `GET /cases/{case_id}/timeline`

Returns:

```json
{
  "dated":[],
  "uncertain":[],
  "undated":[],
  "generated_from_version":12
}
```

### `GET /cases/{case_id}/flags`

Filters by category/status. Each flag returns `rule_id`, category, safe explanation, field, involved observation/source references, state, and rule version.

### `PATCH /cases/{case_id}/flags/{flag_id}`

Allows `acknowledged` or `resolved` where a reviewed correction supports it. Never permits choosing a source as “true” without preserving both claims.

## Exports

### `POST /cases/{case_id}/exports`

```json
{"format":"pdf","draft":true,"expected_case_version":12}
```

Response `202`:

```json
{"export_id":"exp_01","status":"queued","format":"pdf","draft":true}
```

### `GET /cases/{case_id}/exports/{export_id}`

Returns queued/processing/ready/failed. Ready response includes checksum, schema/masking versions, and short-lived download URL.

## Internal extraction contract

Provider result:

```json
{
  "schema_version":"1.0",
  "source_id":"src_01",
  "observations":[{
    "event_type":"payment_notification",
    "locator":{"page":null,"region":"center notification","anchor":"₹5,000 debited","audio_start_ms":null,"audio_end_ms":null},
    "fields":{
      "amount":{"raw":"₹5,000","candidate":"5000.00","confidence":0.98},
      "currency":{"raw":"₹","candidate":"INR","confidence":0.99},
      "timestamp":{"raw":"10:45 AM","candidate":null,"confidence":0.90},
      "transaction_reference":{"raw":null,"candidate":null,"confidence":null}
    },
    "assumptions":["Visible time has no date or timezone"]
  }],
  "warnings":[]
}
```

Rules: absent is `null`; `source_id` must match; anchors are bounded; confidence does not establish truth; output failing strict schema creates no observations and sets a visible source-level error.

## CSV v1 header

```csv
case_id,observation_id,timeline_section,occurred_at,earliest,latest_exclusive,time_precision,timezone,event_type,amount,currency,direction,actor_alias,transaction_alias,source_id,source_locator,field_sources_json,summary_redacted,flag_codes,flag_details_json,assumptions_json,review_status
```
