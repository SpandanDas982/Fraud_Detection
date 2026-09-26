# Mock → Live API Switch Prompt

**Copy this prompt verbatim when the frontend is approved and you want to connect the real backend.**

---

## Prompt to give the agent

```
The frontend mock UI has been reviewed and approved. Now wire the Evidence Ledger frontend to the real backend API.

Context:
- The frontend currently uses a mock service at `frontend/src/mocks/mockService.ts`.
- The real API follows the contract in `docs/API.md` with base URL `{VITE_API_BASE_URL}/v1`.
- All TypeScript types are in `frontend/src/contracts/types.ts` — these already match the backend Pydantic models exactly. Do not change any type definitions.
- The backend runs on AWS Lambda + API Gateway. Local backend is started with `uv run`.
- AWS SDK: backend uses `boto3.Session(profile_name='aws')` locally. Credentials are in the `aws` named profile on the laptop — no extra configuration is needed.

Tasks — do them in this order:

1. Create `frontend/src/services/apiClient.ts`:
   - Read base URL from `import.meta.env.VITE_API_BASE_URL` (fallback to `''` for local proxy).
   - Every request sends `Idempotency-Key` header (UUID v4) for mutations.
   - On 4xx/5xx, parse the `ApiError` envelope from `contracts/types.ts` and throw a typed error.
   - On network failure in mock/offline mode, fall back to the mock service automatically if `VITE_USE_MOCK=true`.

2. Create `frontend/src/services/caseService.ts`:
   - Implement each API call from `docs/API.md`:
     - `getCase(caseId)` → GET /cases/{case_id}
     - `getSources(caseId)` → GET /cases/{case_id}/sources
     - `getObservations(caseId, filters?)` → GET /cases/{case_id}/observations
     - `patchObservation(caseId, observationId, body: ObservationPatchRequest)` → PATCH
     - `getTimeline(caseId)` → GET /cases/{case_id}/timeline
     - `getFlags(caseId)` → GET /cases/{case_id}/flags
     - `patchFlag(caseId, flagId, state)` → PATCH /cases/{case_id}/flags/{flag_id}
     - `createExport(caseId, body: ExportRequest)` → POST /cases/{case_id}/exports
     - `getExport(caseId, exportId)` → GET /cases/{case_id}/exports/{export_id}
   - Each function has the exact same signature whether calling mock or live — callers never know which is active.

3. Add `VITE_API_BASE_URL` and `VITE_USE_MOCK` to `frontend/.env.example`:
   ```
   VITE_API_BASE_URL=https://your-api-gateway-id.execute-api.ap-south-1.amazonaws.com
   VITE_USE_MOCK=false
   ```
   Add `.env.local` to `.gitignore` — never commit real URLs.

4. Replace every `mockService.*` import in page components with `caseService.*`.
   - The function signatures are identical — this should be a find-and-replace import swap.
   - Do NOT rewrite any component logic.

5. Add TanStack Query (`@tanstack/react-query`) for polling:
   - `useQuery` for GET calls with `refetchInterval: 3000` on sources/observations during processing.
   - `useMutation` for PATCH observation and export creation.
   - QueryClient goes in `main.tsx`.

6. Verify:
   - `npm run build` passes.
   - `npm run lint` passes with no new errors.
   - Mock demo (`VITE_USE_MOCK=true`) still loads without a network connection.
   - With `VITE_USE_MOCK=false` and a running backend, create a case and list sources.
   - Record the exact commands and outcomes in `docs/STATUS.md`.

Do NOT:
- Change any type definitions in `contracts/types.ts`.
- Change any component UI logic or layout.
- Add any new dependencies beyond react-query and uuid (for idempotency keys).
- Remove the mock service — it must remain the fallback.
- Add authentication — that is explicitly out of scope (BOUNDARIES.md MUST NOT).
```

---

## Backend parallel build prompt

```
Build the Evidence Ledger backend in parallel with the frontend. The frontend uses mock data for now — do not block on frontend approval.

Context:
- Python 3.13, managed with uv. Run all commands with `uv run`.
- AWS SDK: always `boto3.Session(profile_name='aws')` locally. No credentials in code. Region from `AWS_REGION` env var.
- Canonical data contracts: `docs/DATA_CONTRACTS.md`. All Pydantic models must use exactly the enum values from that file.
- API contract: `docs/API.md`. Base URL is /v1; all routes are relative.
- Database: `docs/DATABASE.md` single-table DynamoDB design.
- Security: `docs/SECURITY.md` — no raw evidence/transcripts/keys in logs.

Build order (one slice at a time, tests after each):

Phase 6-A — contracts + repositories:
1. `uv sync` — install all deps from pyproject.toml.
2. Create `evidence_ledger/contracts/` — Pydantic v2 models for:
   - Source, Observation, FieldClaim, TimeClaim, Flag, Link, Export, CaseSummary
   - All enums from DATA_CONTRACTS.md as Python Enum classes (exact same values)
   - ObservationPatchRequest, ExportRequest, LinkRequest matching API.md
3. Create `evidence_ledger/repositories/dynamodb.py` — thin DynamoDB adapter:
   - `get_case(case_id)`, `put_source(source)`, `update_observation(obs, expected_version)`
   - Uses `boto3.Session(profile_name='aws').resource('dynamodb')` locally
   - Uses `boto3.resource('dynamodb')` in Lambda (profile ignored; IAM role used)
   - Detect local vs Lambda via `AWS_LAMBDA_FUNCTION_NAME` env var
4. Create `evidence_ledger/repositories/s3.py` — S3 adapter:
   - `generate_upload_intent(case_id, source_id, content_type, size_bytes)` → presigned PUT URL
   - `get_download_url(s3_key)` → short-lived presigned GET URL
   - Same profile detection as dynamodb.py
5. pytest: Pydantic model validation, enum values, DynamoDB conditional write conflict test.

Phase 6-B — case handler:
6. `evidence_ledger/handlers/case_handler.py` — Lambda handler for:
   - POST /cases, GET /cases/{id}, DELETE /cases/{id}
   - POST /cases/{id}/sources/upload-intent
   - POST /cases/{id}/sources/text
   - GET /cases/{id}/sources, GET /cases/{id}/sources/{id}
   - GET /cases/{id}/observations, PATCH /cases/{id}/observations/{id}
   - GET /cases/{id}/timeline, GET /cases/{id}/flags, PATCH /cases/{id}/flags/{id}
   - POST /cases/{id}/exports, GET /cases/{id}/exports/{id}
7. pytest: happy path for each route using DynamoDB/S3 fakes.

Phase 6-C — processing pipeline (one modality at a time):
8. `evidence_ledger/extractors/base.py` — EvidenceExtractor abstract base
9. `evidence_ledger/extractors/image_extractor.py` — Nova Lite via Bedrock
10. `evidence_ledger/extractors/text_extractor.py` — Nova Micro via Bedrock
11. `evidence_ledger/extractors/audio_extractor.py` — Sarvam STT → Nova Micro
12. `evidence_ledger/extractors/pdf_extractor.py` — PyMuPDF → route to text or image extractor
13. `evidence_ledger/handlers/processing_handler.py` — S3 event → modality routing
14. pytest: golden fixtures per modality.

Phase 6-D — integrity + export:
15. `evidence_ledger/normalization/` — amount (Decimal), time (TimeClaim), reference
16. `evidence_ledger/timeline/` — dated/uncertain/undated assembly
17. `evidence_ledger/privacy/` — alias map + masking policy (shared view model)
18. `evidence_ledger/exports/csv_writer.py` — DATA_CONTRACTS v1 header, formula neutralization
19. `evidence_ledger/exports/pdf_writer.py` — ReportLab
20. `evidence_ledger/handlers/export_handler.py`
21. pytest: planted-PII test, formula-cell test, CSV header test.

For every file:
- Use `boto3.Session(profile_name='aws')` locally; detect Lambda env and omit profile there.
- Never log raw evidence, transcripts, provider payloads, presigned URLs, or field values.
- Validate all Bedrock/Sarvam output with Pydantic before storing anything.
- Update `docs/STATUS.md` with actual commands and outcomes after each phase.
```
