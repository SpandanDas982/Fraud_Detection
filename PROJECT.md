# Evidence Ledger — Complete Project Definition

Status: foundation specification for BUILD round 1

Working title: **Evidence Ledger**. The name may change; product behavior and safety boundaries may not change silently.

## 1. Executive summary

Evidence Ledger turns scattered post-incident material—screenshots, images, text, PDFs, and audio—into a structured evidence packet. It extracts candidate dates, amounts, transaction references, URLs, contacts, and sender identifiers; preserves their source locations; asks a human to verify uncertain/model-derived values; organizes reviewed observations into a chronology; raises neutral flags for missing or inconsistent information; masks unnecessary sensitive data; and exports a structured CSV and readable PDF.

It is an evidence-organization and integrity tool. It is **not** a fraud detector, legal authority, evidence-authentication service, police/bank submission portal, or system for assigning blame.

The first BUILD round produces the complete frontend experience with deterministic mock data. Later phases connect the same contracts to AWS Lambda, S3, DynamoDB, Amazon Bedrock Nova, Sarvam STT, PyMuPDF, and report generation.

## 2. Why this product should exist

After an online incident, a person may have:

- chat screenshots from several apps;
- payment-request and bank-notification screenshots;
- PDF account statements or invoices;
- copied messages and emails;
- phone numbers, sender IDs, transaction references, and URLs;
- voice notes or call recordings;
- conflicting claims and partial timestamps.

The recurring work is manual: transcribe values, identify duplicate representations of the same payment, reconstruct order, discover missing fields, compare disagreements, redact identifiers, and create something another human can understand. Current enterprise products demonstrate that OCR, chronology, evidence management, and redaction are valuable, but the hackathon opportunity is a lightweight, screenshot-first workflow for a person or support worker preparing material for review.

### Honest differentiation

The raw capabilities are not individually unique. Evidence Ledger differentiates through their combination:

1. ordinary-user, screenshot-first intake;
2. a claim ledger rather than a single model-generated “truth”;
3. field-level source traceability;
4. explicit human verification;
5. time uncertainty preserved as data;
6. contradictions retained rather than silently resolved;
7. one neutral, privacy-conscious PDF/CSV packet;
8. no accusation or fraud score.

### Product statement

> Organize evidence, preserve uncertainty, and prepare a source-linked packet for human review.

## 3. Goals and non-goals

### Goals

- Accept synthetic text, image/screenshots, PDF, and audio evidence.
- Inventory every input, including duplicate, unsupported, empty, partial, and failed sources.
- Generate schema-constrained candidate observations.
- Make model/Speech-to-Text uncertainty visible.
- Let the user accept, correct, or reject extracted fields beside their source.
- Preserve raw claims separately from normalized/reviewed values.
- Build precise/dated, uncertain, and undated timeline sections.
- Flag missing, invalid, ambiguous, duplicate, unsupported, and inconsistent information.
- Mask supported personal/financial identifiers in all shareable output.
- Export a portable PDF report and structured CSV with provenance, flags, and assumptions.
- Keep the first mock demo usable even when AWS/Sarvam are unavailable.

### Non-goals

- Determine whether something is fraud or a scam.
- Identify, rank, accuse, or profile a person.
- Produce legal advice, legal findings, authenticity certification, chain-of-custody certification, or admissibility opinions.
- Replace or submit to cybercrime.gov.in, IC3, police, courts, banks, or payment platforms.
- Fetch, open, crawl, or score extracted URLs.
- Perform device acquisition or full digital forensics.
- Handle real victim evidence during the hackathon.
- Build authentication, multi-tenancy, billing, collaboration, notifications, mobile apps, RAG, embeddings, or fine-tuning in the MVP.

## 4. Users and jobs

### Primary user: affected person

Job: “Help me turn confusing material into an organized packet without forcing me to decide what every item means.”

Needs plain language, visible privacy boundaries, recovery from partial failure, and a safe export.

### Secondary user: support worker

Job: “Help me review gaps and conflicting claims with the person and prepare an understandable record.”

Needs side-by-side source review, reviewer corrections, unresolved flags, and source references.

### Receiving reviewer

Job: “Give me a coherent record where every claim can be traced and uncertainty has not been hidden.”

Uses PDF/CSV only; does not need an Evidence Ledger account.

## 5. Supported evidence

| Type | MVP processing | Provenance locator | Primary service |
|---|---|---|---|
| Pasted text | Direct candidate extraction | line/character span or anchor quote | Nova Micro through Bedrock |
| PNG/JPG/JPEG/WebP | Multimodal candidate extraction | image ID, region description, anchor text; bbox only if reliable | Nova Lite through Bedrock |
| PDF | PyMuPDF text extraction per page; render image-only pages; analyze text/pages | page + anchor/region | PyMuPDF + Nova Micro/Lite |
| Audio: WAV/MP3/M4A/AAC/OGG/FLAC/WebM | STT transcript and time segments, then candidate extraction | audio time range + transcript anchor | Sarvam STT + Nova Micro |

Images are a primary input, not an optional add-on. Screenshots may show chats, notifications, bank screens, emails, invoices, or browser content.

Unsupported or encrypted files are not dropped. They remain in the source inventory with a neutral reason.

## 6. Core user journey

1. **Start case** — user reads a synthetic-data/privacy notice and creates a temporary case.
2. **Add evidence** — upload images/PDF/audio or paste text; built-in demo is always available.
3. **Processing** — each source has its own state: queued, processing, ready, partial, failed, duplicate, unsupported.
4. **Review extraction** — source preview appears beside candidate fields. User accepts, corrects, rejects, or marks unreadable.
5. **Organize** — deterministic services normalize values and build dated, uncertain, and undated sections.
6. **Review flags** — missing fields, ambiguous dates, duplicates, discrepancies, and human-verification needs link back to sources.
7. **Preview privacy** — user sees aliases/masking and unresolved assumptions.
8. **Export** — generate a PDF report and structured CSV. Draft exports are visibly labeled when unresolved items remain.

## 7. Product language and flag taxonomy

Allowed terms include `reported`, `claimed`, `extracted`, `candidate`, `reviewed`, `missing`, `invalid`, `ambiguous`, `inconsistent`, `duplicate`, and `human verification required`.

Prohibited conclusions include `fraud confirmed`, `scam detected`, `high fraud risk`, `fraudster`, `criminal`, `guilty`, `fake evidence`, or `verified authentic`.

### Required flags

| Code | Trigger | Human-readable meaning |
|---|---|---|
| `MISSING_INFO` | Event-specific required field absent | Required information was not found |
| `INVALID_VALUE` | Claimed value cannot be normalized safely | Value needs human review |
| `AMBIGUOUS_TIME` | Multiple date/time interpretations or missing timezone/context | Timeline placement is uncertain |
| `HUMAN_VERIFICATION_REQUIRED` | Low confidence, unreadable source, model assumption, or unresolved correction | A person must confirm this value |
| `AMOUNT_DISCREPANCY` | Explicitly linked comparable transaction claims report different amounts | Both reported amounts are retained |
| `TIME_DISCREPANCY` | Same explicitly linked time role has incompatible non-overlapping claims | Both reported times are retained |
| `DUPLICATE_SOURCE` | Same SHA-256 source bytes | Source is retained in inventory but not double-counted |
| `POTENTIAL_DUPLICATE` | Similar observations without enough identity evidence | Reviewer may link or keep separate |
| `UNSUPPORTED_INPUT` | Type/encryption/format outside support | Source could not be processed |
| `PROCESSING_ERROR` | Provider/parser failed | Other successful evidence remains usable |

Flags are review aids, not risk levels or verdicts.

## 8. Evidence and time model

### Source

```text
source_id, case_id, media_type, safe_filename, s3_key, sha256,
size_bytes, page_or_duration_count, status, duplicate_of,
created_at, processing_error_code
```

### Observation

One observation represents one source's claim about one event:

```text
observation_id, case_id, source_id, event_type, source_locator,
candidate_fields, review_status, extraction_method, provider_model,
assumptions, created_at, reviewed_at
```

### Field claim

```text
field_name, raw_claimed_value, normalized_candidate_value,
reviewed_value, value_state, confidence, source_id, locator,
anchor_text, reviewed_by, review_note
```

### Time claim

```text
raw_value, earliest, latest_exclusive, precision,
timezone, candidate_interpretations, status
```

Examples:

- exact timestamp with timezone -> point/range suitable for ordering;
- date only -> one-day interval and `time unknown`;
- `03/04/2026` without locale -> multiple candidates and `AMBIGUOUS_TIME`;
- `yesterday` -> resolvable only with an explicit source reference date/timezone;
- no timestamp -> undated section;
- invalid timestamp -> raw value retained and flagged.

Overlapping intervals do not establish order. UI row order is presentation, not causality.

### Linking and contradictions

Automatic transaction linkage requires:

- exact normalized transaction/reference ID;
- compatible reference namespace/provider;
- compatible event meaning.

Otherwise linkage requires explicit reviewer confirmation. Same amount, phone, or date alone is insufficient. Compare amounts only when currency/units match. Never compare notification-delivery time to transaction-occurrence time as if they are the same field.

## 9. System architecture

```text
React/Vite SPA on Vercel
        |
        | HTTPS
        v
API Gateway HTTP API
        |
        +--> Case/API Lambda --------> DynamoDB
        |          |
        |          +--> short-lived S3 presigned upload URLs
        |
Browser ----------------------------> private S3 raw bucket
                                            |
                                            | ObjectCreated event
                                            v
                                      Processing Lambda
                                      /       |       \
                               PyMuPDF   Bedrock Nova   Sarvam STT
                                      \       |       /
                                            v
                                        DynamoDB
                                            |
React polls case/source status <------------+
        |
        +--> Compile/export Lambda --> CSV + ReportLab PDF --> S3 exports
        |
        +<-- short-lived presigned download URLs
```

### Why direct-to-S3 upload

Do not send binary evidence through the Lambda request body. AWS documents a 6 MB synchronous Lambda invocation payload limit, while presigned S3 URLs allow time-limited upload without giving the browser AWS credentials. Direct S3 upload also isolates file processing per source.

### Why asynchronous per-source processing

PDF rendering, Bedrock inference, and audio transcription can exceed an interactive HTTP request. An S3 object-created event invokes a processing Lambda for one source. The frontend polls a case-status endpoint. DynamoDB writes and processing must be idempotent because event delivery/retries can repeat.

For the first functional integration, mock/local processing may be synchronous. The production-shaped AWS path is asynchronous.

## 10. Selected technology stack

### Frontend

- React + TypeScript.
- Vite for a simple SPA.
- Current stable Tailwind CSS and shadcn/ui at installation time; commit lockfile and generated components.
- React Router only if route separation materially helps; otherwise a state-driven single workspace.
- TanStack Query for API polling/cache only when backend integration begins.
- Zod for frontend contract validation.
- Vitest + React Testing Library.
- Vercel deployment.

### Backend

- Python 3.13 (matches `backend/.python-version`; AWS Lambda Python 3.13 runtime is available).
- `uv` for environment, dependency management, scripts, and lockfile.
- AWS Lambda + API Gateway HTTP API.
- Pydantic v2 for request/provider/schema validation.
- `boto3` Bedrock Runtime using the Converse/tool configuration supported by Nova.
- AWS SDK local usage: `boto3.Session(profile_name='aws')`. Lambda execution uses IAM role automatically via the standard credential chain. No credentials or region are hardcoded.
- DynamoDB and S3.
- PyMuPDF for PDF page text extraction and rendering.
- ReportLab for deterministic PDF output.
- Python `csv` module for CSV output.
- `pytest`, Ruff, and mypy — configured in `pyproject.toml`.

### Model routing

- **Nova Lite:** multimodal screenshot/image and rendered PDF-page understanding. AWS describes Nova Lite as accepting text, image, video, and documents.
- **Nova Micro:** low-cost text-only extraction from pasted text, PyMuPDF text, and Sarvam transcripts. AWS documents that Nova Micro does not support image/video inputs.
- Model IDs and AWS region are environment configuration; never hard-code an assumed current ID throughout the codebase.
- Require schema-constrained/tool output and validate it. The model must return `null` rather than guess.

### Audio

- Sarvam STT REST or Batch API behind one adapter.
- Preserve transcript segments/timestamps when returned.
- Store transcript as restricted structured evidence, never logs.
- Sarvam currently documents common formats including WAV, MP3, M4A, AAC, OGG, FLAC, WebM, and PCM, but the deployed adapter must validate against the selected endpoint's current rules.

## 11. Repository layout

```text
evidence-ledger/
├── AGENTS.md
├── PROJECT.md
├── README.md
├── docs/                         # generated from PROJECT.md after UI round
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── features/
│   │   │   ├── intake/
│   │   │   ├── review/
│   │   │   ├── timeline/
│   │   │   ├── flags/
│   │   │   └── export/
│   │   ├── mocks/
│   │   ├── services/
│   │   ├── contracts/
│   │   └── test/
│   ├── package.json
│   └── vercel.json
├── backend/
│   ├── pyproject.toml
│   ├── uv.lock
│   ├── src/evidence_ledger/
│   │   ├── contracts/
│   │   ├── handlers/
│   │   ├── ingestion/
│   │   ├── extractors/
│   │   ├── normalization/
│   │   ├── validation/
│   │   ├── timeline/
│   │   ├── privacy/
│   │   ├── exports/
│   │   └── repositories/
│   └── tests/
├── fixtures/
│   ├── case_demo/
│   └── expected/
└── infra/
    └── template.yaml              # SAM, if selected during infrastructure phase
```

Do not create every empty module on day one. Add paths as the corresponding vertical slice begins.

## 12. API surface

Version all routes under `/v1`.

### Cases

- `POST /v1/cases` — create temporary case.
- `GET /v1/cases/{case_id}` — case summary/status.
- `DELETE /v1/cases/{case_id}` — delete supported prototype records/objects; response must not overstate secure erasure.

### Sources

- `POST /v1/cases/{case_id}/sources/upload-intent` — validate metadata and return short-lived presigned upload request.
- `POST /v1/cases/{case_id}/sources/text` — add bounded pasted text.
- `GET /v1/cases/{case_id}/sources` — source inventory.
- `GET /v1/cases/{case_id}/sources/{source_id}` — safe metadata and preview URL when allowed.
- `POST /v1/cases/{case_id}/sources/{source_id}/retry` — retry failed processing with idempotency control.

### Review and timeline

- `GET /v1/cases/{case_id}/observations`.
- `PATCH /v1/cases/{case_id}/observations/{observation_id}` — accept/correct/reject fields with optimistic version.
- `POST /v1/cases/{case_id}/links` — reviewer-confirmed relationship.
- `GET /v1/cases/{case_id}/timeline`.
- `GET /v1/cases/{case_id}/flags`.

### Exports

- `POST /v1/cases/{case_id}/exports` with `format: pdf|csv` and `draft`.
- `GET /v1/cases/{case_id}/exports/{export_id}` — status and short-lived download URL when ready.

Every mutation accepts an idempotency key. Errors return stable codes, safe messages, and request IDs without raw evidence.

## 13. DynamoDB design

Single table for the prototype:

```text
PK=CASE#{case_id}, SK=META
PK=CASE#{case_id}, SK=SOURCE#{source_id}
PK=CASE#{case_id}, SK=OBS#{observation_id}
PK=CASE#{case_id}, SK=FLAG#{flag_id}
PK=CASE#{case_id}, SK=LINK#{link_id}
PK=CASE#{case_id}, SK=EXPORT#{export_id}
```

Fields include `entity_type`, schema version, created/updated timestamps, optimistic `version`, and TTL where appropriate. Store large raw content in S3, not DynamoDB. Keep only bounded anchor excerpts and structured values. Design access around loading one case; do not add GSIs until a real query requires one.

## 14. S3 design

Private bucket/key layout:

```text
cases/{case_id}/raw/{source_id}/{generated_safe_name}
cases/{case_id}/derived/{source_id}/page-{n}.png
cases/{case_id}/derived/{source_id}/transcript.json
cases/{case_id}/exports/{export_id}/timeline.csv
cases/{case_id}/exports/{export_id}/evidence-report.pdf
```

- Bucket public access blocked.
- Default encryption enabled.
- CORS restricted to approved Vercel/local origins and required methods/headers.
- Lifecycle expiration configured for prototype evidence and exports after a documented interval.
- Object key generated server-side and scoped by case/source.
- Presigned URL expiration is short and operation-specific.
- Do not reuse upload keys; S3 can replace an existing object at the same key.

## 15. Extraction pipeline by modality

### Image/screenshot

1. Validate file metadata/magic bytes and hash.
2. Store raw source and source record.
3. Send image/S3 reference to Nova Lite with strict evidence-as-data instructions.
4. Request schema-constrained observations containing raw visible values, nulls, anchor text, region description, confidence, and assumptions.
5. Validate Pydantic schema; reject prose/extra invalid payload.
6. Mark uncertain/low-confidence fields for human verification.

### PDF

1. Open with PyMuPDF under page/size limits.
2. Extract text by page.
3. If page text is sufficient, route bounded text to Nova Micro.
4. If image-only or layout-dependent, render limited-resolution page image and route to Nova Lite.
5. Retain page number and anchor/region for every field.
6. Encrypted, corrupt, or oversized PDFs remain visible with a neutral status.

### Audio

1. Validate selected Sarvam endpoint format/size constraints.
2. Send to Sarvam STT without exposing credentials to frontend.
3. Preserve transcript segments/time ranges and language metadata.
4. Route bounded transcript to Nova Micro for candidate observations.
5. Every extracted field links to audio time range and transcript anchor.
6. Mark unclear audio/low-confidence transcript claims for verification.

### Pasted text

1. Enforce length limit and preserve line boundaries.
2. Route to Nova Micro using schema-constrained extraction.
3. Use line/character spans or anchor quotes.
4. Treat embedded instructions/URLs as inert evidence.

## 16. Deterministic post-processing

Model output may propose; code decides representation:

- amounts use `Decimal` or integer minor units, never float;
- currency remains separate and may be missing;
- debit/credit/payment-request direction is separate from amount;
- timestamps become exact points, bounded intervals, candidate sets, or unresolved;
- phone/email/account/reference matching uses restricted normalized values;
- displayed/exported aliases are separate from matching keys;
- grouping is by explicit reference namespace or user-confirmed link;
- discrepancies are grouped per linked event to avoid pairwise flag explosion;
- stable sort uses comparable time plus observation ID; it never implies causality.

## 17. Privacy and redaction

Supported masking targets include phone numbers, emails, account/card identifiers, government-style identifiers in defined test patterns, personal names where explicitly tagged, transaction references, and sensitive URL query/fragment/path values.

Use case-local aliases such as `Contact C01`, `Account A01`, and `Transaction T01`. Do not use masked last-four values as entity keys because collisions can merge people/accounts.

Apply the same output policy to:

- UI cards and summaries;
- flags and assumptions;
- error messages;
- CSV cells;
- PDF body, appendix, and metadata;
- logs/telemetry.

The raw source remains restricted and unredacted. The provider must receive necessary source content for extraction. State this before use; do not claim end-to-end anonymization.

## 18. Export specification

### Structured CSV

One row per source observation. Exact initial header:

```csv
case_id,observation_id,timeline_section,occurred_at,earliest,latest_exclusive,time_precision,timezone,event_type,amount,currency,direction,actor_alias,transaction_alias,source_id,source_locator,field_sources_json,summary_redacted,flag_codes,flag_details_json,assumptions_json,review_status
```

Keep both conflicting rows. Use Python's CSV writer, UTF-8, correct quoting, and formula-cell neutralization after leading whitespace/control handling. JSON-in-cell values are serialized by a JSON encoder and then by the CSV writer.

### PDF report

Generated with ReportLab and contains:

1. title, generation time, case alias, and prominent non-verdict disclaimer;
2. methodology and supported-input limitations;
3. source inventory including failed/unsupported/duplicate sources;
4. dated timeline;
5. uncertain and undated evidence;
6. unresolved flags showing all involved claims symmetrically;
7. assumptions and human corrections;
8. source-reference appendix;
9. privacy/masking statement.

Never label the report `official complaint`, `verified evidence`, or `fraud report`. Use `Evidence Organization Report` or `Draft Evidence Packet`.

## 19. Frontend experience and design

### First-round screens

1. **Landing/intake** — product statement, limitations, upload dropzone, pasted-text entry, `Load synthetic demo`.
2. **Processing/source inventory** — per-source status and duplicate/error indicators.
3. **Extraction review** — source preview left, candidate fields right, accept/edit/reject/unreadable.
4. **Timeline** — dated, uncertain, undated sections with source and assumption chips.
5. **Flags** — missing/ambiguous/discrepancy/duplicate/processing filters; source-linked comparison.
6. **Export** — masking preview, unresolved count, draft/final state, PDF/CSV actions.

### Visual direction

Build a calm, professional evidence workspace. Avoid hacker/neon aesthetics and risk dashboards.

Suggested tokens:

```text
canvas #F6F7F9      surface #FFFFFF      text #172033
muted #5E687A       border #DCE1E8       primary #315EFB
review #A15C00      review-soft #FFF4D6  error #A73A3A
success #237A57     focus #1747D1
```

Red means validation/processing failure, never “fraud.” Amber means human review.

### Accessibility

- Keyboard-accessible workflow and visible focus.
- Labeled controls and sufficient contrast.
- Icons plus text; never color-only status.
- Meaningful image-preview alternative text.
- Reduced-motion support.
- Plain language; source details available without forcing forensic jargon.

## 20. Mock data for BUILD round 1

The mock case must exercise the product, not merely fill cards:

1. chat screenshot: payment requested, dated;
2. payment screenshot: INR 5,000 with reference `TXN-DEMO-001`;
3. notification screenshot: INR 7,000 with the same explicit reference;
4. text message missing a transaction reference;
5. screenshot containing ambiguous `03/04/2026`;
6. audio transcript observation with a timestamp and human-verification flag;
7. PDF bank record or statement page;
8. exact duplicate image source;
9. unrelated transaction with a different reference to prove it is not flagged as a contradiction;
10. planted synthetic phone/email/account/formula-like text for privacy/export tests.

The mock service implements the same frontend contract as the future API. Switching from mock to live must not require rewriting page components.

## 21. First BUILD round plan: UI + mock data

### Deliverable

A deployable Vercel frontend demonstrating the complete journey with deterministic mock data. It does not pretend that AWS, Bedrock, Sarvam, PDF parsing, persistence, or exports are live.

### Order

1. Scaffold React/TypeScript/Vite, Tailwind, shadcn/ui, tests, lint, and production build.
2. Define frontend contracts and mock case fixture.
3. Build app shell, stage navigation, disclaimer, and demo loader.
4. Build source inventory and processing states.
5. Build source/candidate review UI.
6. Build timeline sections.
7. Build flag comparison and missing-info views.
8. Build export preview; mock downloads may use fixture CSV/PDF clearly labeled as demo.
9. Test critical interactions, responsiveness, empty/error/loading/partial states.
10. Deploy to Vercel and run the 90-second demo from a clean session.

### UI-round acceptance criteria

- Production build passes.
- Built-in demo loads without secrets or network.
- All four modalities appear in source inventory.
- Reviewer can accept/edit/reject at least one field.
- Linked INR 5,000/7,000 claims remain separate and show one neutral discrepancy.
- Missing reference and ambiguous date are visible.
- Timeline has dated/uncertain/undated sections.
- Flag links navigate to involved source/observation.
- Export preview visibly masks planted identifiers and includes source IDs.
- UI never claims real processing, storage, PDF generation, or model accuracy.
- Primary path works at desktop and mobile widths with keyboard navigation.

## 22. Subsequent implementation phases

### Phase 2 — contracts and AWS foundation

- Freeze OpenAPI/JSON contracts from the working mock.
- Create `uv` backend, Pydantic models, unit fixtures.
- Deploy API Gateway, case Lambda, DynamoDB table, private S3 bucket, IAM, CORS.
- Implement case creation, upload intent, text source, inventory/status.
- Verify browser direct-to-S3 upload and idempotent source creation.

Manual gate: AWS region, Bedrock Nova access, S3 lifecycle, Vercel origin, and credentials are configured outside source control.

### Phase 3 — extraction adapters

- Image screenshot -> Nova Lite.
- Pasted/PDF text -> Nova Micro.
- PDF scan fallback -> PyMuPDF rendering + Nova Lite.
- Audio -> Sarvam STT -> Nova Micro.
- Validate every provider response; expose partial failure.

Manual gate: `AWS_REGION`, model IDs/inference profile if required, `SARVAM_API_KEY`, size/format limits.

### Phase 4 — evidence integrity

- Review persistence and optimistic concurrency.
- Time/amount/reference normalization.
- Explicit linkage and grouped flags.
- Dated/uncertain/undated timeline.
- Shared redacted view model.

### Phase 5 — exports

- Safe structured CSV.
- ReportLab PDF.
- S3 export objects and short-lived downloads.
- Planted-PII/formula regression tests.

### Phase 6 — deployment and evaluation

- Vercel frontend and AWS backend environment wiring.
- Smoke tests, observability without raw evidence, error budgets/alarms if time.
- Synthetic golden dataset evaluation and performance measurement.
- README, generated child docs, architecture diagram, limitations, demo script.

## 23. Evaluation strategy

Do not report one vague “accuracy” score. Measure:

- per-field extraction exact match/precision/recall by modality;
- missing/ambiguity/discrepancy flag precision/recall;
- provenance coverage: exported nonempty factual fields with resolvable source references;
- contradiction preservation: conflicting source claims retained;
- uncertainty preservation: ambiguous/undated cases not made exact;
- input accounting: accepted + duplicate + unsupported + failed reconcile with uploaded inventory;
- privacy: planted protected originals found in UI/export/log view models;
- CSV safety: formula-like cells neutralized;
- runtime and failure rate per modality with environment/model/fixture count disclosed.

Required negative cases include unrelated transactions with different amounts and same digits under different reference namespaces.

Synthetic tests demonstrate behavior on supported fixtures; they do not establish real-world forensic accuracy.

## 24. Security model and threats

### Protected assets

Raw evidence, transcripts, structured claims, identifiers, API keys, presigned URLs, exports, and review corrections.

### Major threats and controls

| Threat | MVP control |
|---|---|
| Secret leakage | server-only environment/IAM; `.env.example`; secret scan |
| Public evidence object | block public access; private bucket; short presigned URL |
| Cross-case object access | server-generated scoped keys; authorization placeholder; unguessable case IDs |
| Oversized/malicious file | type/size/page/duration limits; no execution; isolated processing |
| Prompt injection in evidence | strict system/tool schema; source delimited as untrusted data; no tool calls from source |
| Model hallucination | null-on-absence prompt, schema validation, confidence/assumption display, human review |
| Duplicate/replayed event | content hash and idempotent DynamoDB conditional writes |
| PII leakage in export/log | shared safe view model, no raw logs, planted-secret tests |
| CSV formula injection | normalize leading controls/whitespace and neutralize dangerous prefixes |
| Stale reviewer write | optimistic version check |
| Vendor outage/quota | per-source failure, bounded retry, mock demo, no loss of successful results |

This prototype is not production-ready for real victim data until authentication/authorization, retention/deletion, audit, privacy review, regional processing, incident response, and legal/compliance requirements are designed and verified.

## 25. Environment and configuration

Frontend public configuration contains only API base URL and non-secret feature flags.

Backend configuration will include names such as:

```text
AWS_REGION
NOVA_LITE_MODEL_ID
NOVA_MICRO_MODEL_ID
EVIDENCE_BUCKET
CASE_TABLE
ALLOWED_ORIGINS
MAX_SOURCE_BYTES
MAX_PDF_PAGES
PRESIGNED_UPLOAD_TTL_SECONDS
PRESIGNED_DOWNLOAD_TTL_SECONDS
CASE_TTL_DAYS
SARVAM_API_KEY             # secret store/environment, never committed
SARVAM_STT_ENDPOINT_MODE
```

Do not prescribe real secret values in documents. Validate configuration at Lambda cold start and return safe errors.

## 26. Cost and operational controls

- Synthetic demo defaults to local mock data and costs nothing.
- Bound source count, bytes, pages, audio duration, and model tokens.
- One source per processing invocation.
- Avoid repeated inference by idempotent source hash/status checks.
- Store derived pages/transcripts only as long as needed.
- Configure S3 lifecycle and DynamoDB TTL.
- Log request IDs, source IDs, timings, error codes, token/usage metadata where available—but never raw evidence.
- Do not add dashboards before basic metrics exist.

## 27. Definition of done

The full project is complete only when:

- all required modalities pass supported synthetic end-to-end cases;
- source inventory reconciles every input;
- every exported factual field has provenance;
- human corrections are auditable;
- timeline uncertainty is preserved;
- linked discrepancies retain all claims;
- unrelated records do not generate contradiction flags;
- planted supported PII does not appear in shareable outputs;
- CSV and PDF generate and open correctly;
- mock mode still works without external credentials;
- frontend and backend tests/builds pass;
- deployments are smoke-tested;
- actual evaluation results and limitations are published;
- UI/report language contains no verdict or official-authority implication.

## 28. Current status and immediate next action

Current status: `AGENTS.md` and `PROJECT.md` foundation created. No application, infrastructure, tests, model calls, deployment, or measured evaluation exists yet.

Immediate next action:

> Scaffold the React/TypeScript/Vite frontend with Tailwind and shadcn/ui, define the shared mock contracts, and implement the built-in mock case from intake through the export-preview screen before connecting any external service.

## 29. Source notes verified 2026-09-26

- Amazon Nova overview and modalities: https://docs.aws.amazon.com/nova/latest/userguide/what-is-nova.html
- Nova structured output: https://docs.aws.amazon.com/nova/latest/userguide/concept-chapter-servicename.html
- Nova request schema / Micro modality limitation: https://docs.aws.amazon.com/nova/latest/userguide/complete-request-schema.html
- Nova image understanding and payload guidance: https://docs.aws.amazon.com/nova/latest/userguide/modalities-image.html
- Bedrock invocation: https://docs.aws.amazon.com/nova/latest/userguide/invoke.html
- Lambda invocation payload: https://docs.aws.amazon.com/lambda/latest/api/API_Invoke.html
- S3 presigned URLs: https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-presigned-url.html
- Sarvam STT REST: https://docs.sarvam.ai/api-reference-docs/speech-to-text/apis/rest-api
- Sarvam STT endpoint selection: https://docs.sarvam.ai/api-reference-docs/api-guides-tutorials/speech-to-text/which-api-to-use
- PyMuPDF documentation: https://pymupdf.readthedocs.io/
- Vercel Vite deployment: https://vercel.com/docs/frameworks/frontend/vite
- shadcn/ui Vite installation: https://ui.shadcn.com/docs/installation/vite

Service capabilities, model identifiers, quotas, formats, and pricing change. Recheck official documentation at integration time and record the selected region/model/endpoint in generated decision documentation.
