# System Architecture

## Architecture decision

Use a serverless, event-driven modular application:

```text
React/Vite SPA — Vercel
        |
        v
API Gateway HTTP API
        |
        +--> Case/API Lambda ------> DynamoDB
        |         |
        |         +--> S3 presigned upload intent
        |
Browser +--------------------------> private S3 raw objects
                                           |
                                           v ObjectCreated
                                    Processing Lambda
                                   /       |        \
                              PyMuPDF  Bedrock Nova  Sarvam STT
                                   \       |        /
                                           v
                                       DynamoDB
                                           |
Frontend polls status <--------------------+
        |
        +--> Export Lambda --> CSV/ReportLab PDF --> S3 exports
        +<-- short-lived presigned download URL
```

## Components

### React frontend

Responsibilities: case workflow, direct S3 upload, polling, source preview, review/correction, timeline, flags, privacy preview, downloads. Mock service implements the future API contract.

Must not contain AWS/Sarvam credentials, model calls, authoritative redaction logic, or persisted matching keys.

### API Gateway HTTP API

Routes `/v1` requests to Lambda, supplies configured CORS for approved Vercel/local origins, and exposes stable request IDs/errors. No wildcard origin in deployed environments.

### Case/API Lambda

Creates cases, returns upload intents, accepts pasted text, reads case/source/observation/flag state, applies reviewed edits with optimistic versions, creates reviewer links, and initiates exports.

### Processing Lambda

Consumes one S3 raw-object event, validates/idempotently claims a source, routes by modality, writes candidates and source status, and never logs raw content. Raw and derived prefixes must be separated so derived writes cannot recursively trigger raw processing.

### Export Lambda

Reads reviewed/flagged case state, builds one safe view model, applies aliasing/masking/CSV protection, writes PDF/CSV to the exports prefix, and stores export status.

### S3

Stores raw sources, bounded derived artifacts, and exports. Browser uses short-lived, scoped presigned URLs. Public access is blocked and lifecycle expiration is configured.

### DynamoDB

Stores case metadata and structured entities in one logical case partition. Large binary/raw/transcript content remains in S3.

### Bedrock Nova

Nova Lite receives images/rendered pages. Nova Micro receives bounded text/transcripts. Both return schema-constrained candidate observations. Configuration supplies region/model IDs.

### Sarvam STT

Transcribes supported audio through a backend adapter, preserving time segments when available. The transcript is evidence and is not logged.

## Data flow

1. Frontend requests upload intent with filename/type/size/hash when available.
2. API generates case/source IDs, conditional source record, and scoped S3 upload instructions.
3. Browser uploads directly to S3.
4. S3 event invokes processing; handler is idempotent because events can repeat.
5. Handler validates object, routes modality, validates provider output, and stores observations/status.
6. Frontend polls status and displays partial success.
7. Reviewer edits create reviewed values without overwriting source candidates.
8. Deterministic logic produces timeline and flags.
9. Export handler creates redacted CSV/PDF and returns short-lived download access.

## Reliability

- Per-source processing and failure isolation.
- Idempotency key/source digest and conditional DynamoDB writes.
- Bounded retry for transient provider errors; validation errors do not retry indefinitely.
- Optimistic concurrency on reviewer edits.
- Stable sorting and grouped discrepancy rules.
- Mock mode as demonstration fallback.

## Security boundaries

- Browser: untrusted client; only safe case data and presigned operations.
- API: validates authorization placeholder, IDs, size/type, schema, idempotency.
- Processing: treats evidence as untrusted data, not model instructions.
- Providers: receive only required data; results are candidates.
- Export: only the shared safe/redacted view model crosses to downloadable output.

## Repository structure

```text
frontend/src/{app,components,features,mocks,services,contracts,test}
backend/src/evidence_ledger/{contracts,handlers,ingestion,extractors,normalization,validation,timeline,privacy,exports,repositories}
backend/tests
fixtures/{case_demo,expected}
infra/template.yaml
docs/
```

Create modules when their vertical slice begins; do not scaffold empty architecture.

## Deployment

Vercel hosts the SPA. AWS SAM defines API Gateway, Lambdas, DynamoDB, S3, events, permissions, environment variables, logs, and outputs. Live credentials and service access are manual gates. See `DEPLOYMENT.md`.
