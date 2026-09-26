# Project Status

Last updated: 2026-09-26 IST

## Completed documentation

- [x] `AGENTS.md` — updated: Python 3.13, AWS named profile rule
- [x] `PROJECT.md` — updated: Python 3.13, AWS SDK profile note
- [x] `UI_UX.md`
- [x] `DESIGN.md`
- [x] `docs/DATA_CONTRACTS.md` — CANONICAL: all enums reconciled (SourceStatus, ReviewStatus, FieldAction, FieldState, FlagCode, FlagCategory, TimelinePrecision, TimelineSection). Single source of truth for frontend and backend.
- [x] `docs/API.md` — updated: vocabulary note distinguishing FieldAction from entity states; AWS profile note; /v1 base URL clarification
- [x] `docs/DECISIONS.md` — added D-016 (Python 3.13), D-017 (AWS named profile `aws`)
- [x] Problem, PRD, architecture, database, phases, rules, security, testing/evaluation, deployment, boundaries, AI/LLM docs

## Implementation status

### Frontend
- [x] Vite + React + TypeScript scaffold
- [x] Tailwind configured with Midnight Steel design tokens (DESIGN.md §3)
- [x] `frontend/src/contracts/types.ts` — all enums match DATA_CONTRACTS.md exactly
- [x] `frontend/src/contracts/privacy.ts` — masking utilities (phone, account, email, URL, UPI)
- [x] `frontend/src/index.css` — IBM Plex fonts, shadcn CSS variables, base styles
- [x] `frontend/index.html` — correct title and meta description
- [x] `react-router-dom`, `lucide-react`, `clsx`, `tailwind-merge`, `class-variance-authority`, `sonner` installed
- [ ] `shadcn/ui init` — NOT YET RUN
- [ ] App shell + 5-stage navigation
- [ ] Mock service + fixture data (PROJECT.md §20 scenario list)
- [ ] Screen A: intake / source inventory
- [ ] Screen B: extraction review
- [ ] Screen C: timeline
- [ ] Screen D: flags
- [ ] Screen E: export + privacy preview
- [ ] Vitest component tests
- [ ] Production build verification
- [ ] Vercel deployment

### Backend
- [x] `uv` project scaffold
- [x] `backend/pyproject.toml` — fixed: name=evidence_ledger, Python 3.13, all deps (pydantic v2, boto3, pymupdf, reportlab, ruff, pytest, mypy)
- [x] `backend/src/evidence_ledger/` — module renamed from `backend`
- [x] `uv sync --extra dev` run successfully and locked
- [x] Pydantic contracts mirroring DATA_CONTRACTS.md (`contracts/models.py`)
- [x] Configuration & AWS session helper (`config.py`) with `profile_name='aws'` fallback
- [x] Single-table DynamoDB repository (`repositories/dynamo_repo.py`) with optimistic locking and cursors
- [x] S3 repository (`repositories/s3_repo.py`) with scoped presigned URLs and hashing
- [x] Privacy, masking, sanitization, and alias registry (`privacy/masking.py`)
- [x] Normalization for money and time claims (`normalization/money.py`, `normalization/time.py`)
- [x] Timeline builder with dated, uncertain, undated sections (`timeline/builder.py`)
- [x] Flag evaluation and inconsistency rules (`validation/flags.py`)
- [x] Nova Lite / Nova Micro Bedrock extractor with converse API and system prompt (`extractors/nova.py`)
- [x] Sarvam STT adapter with audio segments (`extractors/sarvam.py`)
- [x] PyMuPDF ingestion for text extraction and layout page rendering (`ingestion/pdf.py`)
- [x] ReportLab PDF and canonical CSV v1 export generators (`exports/pdf_export.py`, `exports/csv_export.py`)
- [x] API Gateway HTTP API Lambda handler with /v1 routing (`handlers/api.py`)
- [x] S3 ObjectCreated multimodal processing Lambda handler (`handlers/processing.py`)
- [x] Export worker Lambda handler (`handlers/export.py`)
- [x] Complete pytest test suite (29 tests passing, 0 warnings)
- [x] AWS SAM infrastructure template (`infra/template.yaml`)
- [x] GitHub Actions CI/CD workflows for backend AWS SAM and frontend Vercel (`.github/workflows/`)

## Configuration reconciliation log

### Resolved issues (2026-09-26)

| # | Issue | Resolution |
|---|-------|-----------|
| 1 | ReviewStatus vocab mismatch | DATA_CONTRACTS.md is canonical; split into ReviewStatus (entity) + FieldAction (PATCH verb) |
| 2 | SourceStatus missing awaiting_upload, fake needs_review | Fixed in DATA_CONTRACTS.md and types.ts |
| 3 | FieldState wrong enum values | Fixed — exact DATA_CONTRACTS values in types.ts |
| 4 | FlagCategory abbreviated names | Fixed — full names match DATA_CONTRACTS |
| 5 | Python 3.12 vs 3.13 | Resolved: 3.13 everywhere (matches .python-version, Lambda 3.13 GA) |
| 6 | Backend module named 'backend' | Renamed to evidence_ledger |
| 7 | pyproject.toml empty deps | Added pydantic, boto3, pymupdf, reportlab, ruff, pytest, mypy |
| 8 | pyproject.toml placeholder description | Fixed |
| 9 | Google Fonts @import | Kept for now (online demo); switch to @fontsource if offline is required |
| 10 | AWS SDK config undocumented | Added profile_name='aws' rule to AGENTS.md, PROJECT.md, DATA_CONTRACTS.md, DECISIONS.md D-017 |
| 11 | error_code vs processing_error_code | Standardized to error_code in types.ts |
| 12 | observation_count on Source type | Moved to CaseSummary (where DATABASE.md places it) |
| 13 | index.html default Vite title | Fixed |
| 14 | API /v1 prefix undocumented | Added note in API.md |

## Current round

BUILD round 1: frontend UI with deterministic mock data.  
Backend: parallel skeleton build (contracts + pyproject only; no live API yet).

## Blockers / manual gates

- shadcn/ui not yet initialized — required before building components.
- uv sync not yet run — required before backend code.
- AWS region/model access, Sarvam key/endpoint, Vercel project — future gates.

## Risks

- Google Fonts @import will fail if demo is shown offline — switch to @fontsource if needed.
- shadcn version (v2 new CLI) CSS variable format differs from v1 — verify after init.

## Next action — exactly one

Run `npx shadcn@latest init` in frontend/, commit generated components, then build the App shell and all 5 screens using mock data.

## Verification log

Backend verification executed on 2026-09-26:

```bash
# Backend lint
cd backend && uv run ruff check src/ tests/
# Result: All checks passed!

# Backend test suite
cd backend && uv run pytest -v
# Result: 32 passed in 1.04s (all 6 test modules passing, 0 warnings)

# Frontend lint & build
cd frontend && npm run lint && npm run build
# Result: 0 errors, 0 warnings; Vite build completed cleanly
```


