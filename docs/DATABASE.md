# Database and Object-Storage Design

## Storage ownership

- **DynamoDB:** bounded structured state and indexes required by the application.
- **S3:** raw evidence, derived pages/transcripts when retained, and generated exports.
- Never store large source bytes or full unbounded transcripts in DynamoDB.

## DynamoDB table

Prototype single table: `EvidenceLedger`

Keys:

```text
PK: string
SK: string
```

Common attributes:

```text
entity_type, schema_version, created_at, updated_at, version, ttl
```

### Entity keys

| Entity | PK | SK |
|---|---|---|
| Case | `CASE#{case_id}` | `META` |
| Source | `CASE#{case_id}` | `SOURCE#{source_id}` |
| Observation | `CASE#{case_id}` | `OBS#{observation_id}` |
| Flag | `CASE#{case_id}` | `FLAG#{flag_id}` |
| Link | `CASE#{case_id}` | `LINK#{link_id}` |
| Export | `CASE#{case_id}` | `EXPORT#{export_id}` |
| Idempotency | `CASE#{case_id}` | `IDEMP#{key_hash}` |

All case data can be queried by `PK=CASE#{case_id}`. Entity prefixes support filtered/query slices without a GSI. Add a GSI only after a real access pattern requires it.

## Entity attributes

### Case

```text
case_id, safe_title, status, mode(mock|live), source_count,
observation_count, unresolved_flag_count, retention_notice_version,
created_at, updated_at, version, ttl
```

Counts are convenience values and must be updated idempotently or computed when consistency matters.

### Source

```text
source_id, media_type, safe_filename, s3_key, sha256, size_bytes,
page_count, duration_ms, status, duplicate_of, extraction_provider,
processing_attempts, error_code, created_at, updated_at, version, ttl
```

Use a conditional write to claim processing (`status` transition) and avoid duplicate observations. Digest is an integrity/deduplication aid, not authenticity proof.

### Observation

```text
observation_id, source_id, event_type, source_locator,
candidate_fields, review_status, assumptions,
extraction_method, provider_model, prompt_schema_version,
created_at, reviewed_at, version, ttl
```

Each field stores raw candidate, normalized candidate, reviewed value, value state, confidence, anchor/locator, review note, and reviewer timestamp. Keep items below DynamoDB's item-size constraint; move oversized content to S3.

### Flag

```text
flag_id, rule_id, category, status(open|acknowledged|resolved),
observation_ids, field_name, safe_explanation,
rule_version, created_at, updated_at, version, ttl
```

### Link

```text
link_id, link_type, observation_ids, normalized_reference_alias,
created_by(rule|reviewer), rationale, created_at, version, ttl
```

Do not persist raw full transaction references in shareable aliases.

### Export

```text
export_id, format(pdf|csv), status, draft, s3_key,
schema_version, masking_policy_version, checksum,
created_at, completed_at, error_code, version, ttl
```

## Access patterns

| Need | Operation |
|---|---|
| Load case summary | Get `PK`, `SK=META` |
| List sources | Query PK with `begins_with(SK,'SOURCE#')` |
| List observations | Query PK with `begins_with(SK,'OBS#')` |
| List flags | Query PK with `begins_with(SK,'FLAG#')` |
| Load complete small case | Query entire case partition, paginate |
| Update reviewed observation | Conditional update on `version` |
| Claim source processing | Conditional update on status/version |
| Create idempotent operation | Conditional put `attribute_not_exists(PK)`/unique SK |
| Delete case | Query partition, batch-delete structured items, separately remove S3 prefix |

## Consistency

- Strongly consistent reads may be used immediately after critical writes where UI correctness needs it; otherwise eventual reads are acceptable.
- Use transactions only for genuinely atomic multi-item transitions, such as export record + case state, not every write.
- Optimistic `version` protects reviewer edits.
- Event handlers are idempotent because AWS events can be delivered more than once.

## TTL and deletion

`ttl` is an epoch-seconds expiration attribute. TTL is asynchronous; expiration is not immediate deletion. S3 lifecycle is configured separately. The UI/API must say “deletion requested” or describe policy accurately rather than promise immediate secure erasure.

## S3 layout

```text
cases/{case_id}/raw/{source_id}/{generated_safe_name}
cases/{case_id}/derived/{source_id}/page-{page}.png
cases/{case_id}/derived/{source_id}/transcript.json
cases/{case_id}/exports/{export_id}/timeline.csv
cases/{case_id}/exports/{export_id}/evidence-report.pdf
```

Controls:

- block public access;
- default encryption;
- server-generated keys;
- short presigned URL expiry;
- upload content-type/size conditions;
- distinct raw/derived/export event filters;
- lifecycle expiration;
- restricted CORS origins;
- checksum/digest stored with source/export record.

## Schema evolution

Every entity carries `schema_version`; provider responses and export formats have independent versions. Readers tolerate older optional fields. Breaking changes require an explicit migration/compatibility decision recorded in `DECISIONS.md`.
