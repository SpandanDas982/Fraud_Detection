# Feature-by-Feature Delivery Phases

Do not implement an entire phase in one uncontrolled pass. Complete each feature slice with its tests and update `STATUS.md`.

## Phase 0 — contracts and mock foundation

Features:

- React/Vite/TypeScript/Tailwind/shadcn scaffold;
- theme tokens, app shell, routing/state;
- TypeScript contracts mirroring `DATA_CONTRACTS.md`;
- deterministic built-in mock case and mock service;
- empty/loading/partial/error state primitives.

Exit: production build and base tests pass; mock service needs no network/secrets.

## Phase 1 — evidence intake UI

Features:

- landing/privacy notice;
- multimodal dropzone and pasted text;
- source inventory desktop/mobile;
- ready/processing/partial/duplicate/failed/unsupported states;
- demo loader.

Exit: all four modalities and states appear; selected files are labelled demo-only, not analyzed.

## Phase 2 — extraction review UI

Features:

- image/PDF/audio/text preview variants;
- candidate observation cards;
- field source anchors/confidence metadata;
- accept/correct/reject/unreadable/unavailable;
- reviewer progress and unsaved-change protection.

Exit: reviewer correction preserves extracted value and completes keyboard flow.

## Phase 3 — timeline UI

Features:

- dated, uncertain, undated sections;
- event/source/review filters;
- overlapping-order disclaimer;
- source-link navigation;
- responsive cards.

Exit: ambiguous and missing dates never appear precise.

## Phase 4 — flags UI

Features:

- category summary and filters;
- missing-info action;
- human-verification action;
- symmetric amount discrepancy;
- duplicate/processing states;
- no-flags wording.

Exit: ₹5,000/₹7,000 linked claims both appear; unrelated payment is not flagged.

## Phase 5 — export UI and frontend verification

Features:

- readiness/draft state;
- privacy alias preview;
- mock PDF/CSV preview/download behavior;
- final disclaimer;
- responsive/accessibility pass;
- critical component/integration tests;
- Vercel deployment.

Exit: complete 90-second mock demo, production build, mobile/keyboard path, and honest mock labels.

## Phase 6 — AWS foundation

Features:

- Python 3.12 `uv` project, Pydantic models, pytest;
- AWS SAM template;
- API Gateway HTTP API and configured CORS;
- case/API Lambda;
- DynamoDB table/TTL;
- private S3 bucket/lifecycle/events/IAM;
- case creation, upload intent, text source, inventory/status;
- frontend live/mock service switch.

Manual gates: AWS account/region, deploy role, Vercel origin, retention interval. Exit: direct S3 upload and status round trip pass.

## Phase 7 — image extraction

Features:

- image validation/hash/dedupe;
- Nova Lite adapter through boto3 Bedrock;
- schema-constrained candidate extraction;
- provider timeout/error mapping;
- Pydantic validation and human-review flags.

Manual gate: Nova Lite model/inference-profile access. Exit: golden screenshot fixtures pass without logging content.

## Phase 8 — text and PDF extraction

Features:

- bounded pasted text -> Nova Micro;
- PyMuPDF page text extraction;
- image-only page detection/rendering -> Nova Lite;
- page locators;
- encrypted/corrupt/page-limit states.

Exit: born-digital and scan-like PDF fixtures preserve page provenance.

## Phase 9 — audio extraction

Features:

- Sarvam adapter and audio validation;
- transcript/time segments;
- transcript -> Nova Micro;
- audio locators and low-confidence verification;
- vendor error/timeout mapping.

Manual gate: Sarvam key/endpoint/quota. Exit: synthetic audio fixture produces source-linked candidates and graceful failure.

## Phase 10 — deterministic integrity engine

Features:

- amount/time/reference normalization;
- event-specific completeness;
- explicit/reference and reviewer-confirmed links;
- grouped discrepancies;
- duplicate handling;
- dated/uncertain/undated assembly;
- versioned rule results.

Exit: positive and negative golden cases pass; no LLM decides contradictions.

## Phase 11 — privacy and exports

Features:

- case-local alias map;
- unified shareable view model;
- supported PII/URL masking;
- CSV writer/formula protection;
- ReportLab PDF;
- async export state and S3 downloads.

Exit: planted-secret tests show zero supported originals in PDF/CSV; outputs open and include provenance.

## Phase 12 — deploy, evaluate, document

Features:

- AWS/Vercel environment wiring;
- smoke/E2E tests;
- structured logs/metrics without evidence;
- golden evaluation and measured runtime;
- generated child docs/readme/status;
- demo rehearsal.

Exit: deployed critical path works, results/limitations are recorded, and no unmeasured claims remain.

## Cut order under deadline

Animations -> DOCX/extra formats -> bounding boxes -> extra languages -> advanced sequence rules -> noncritical E2E coverage. Never cut provenance, uncertainty, contradiction preservation, masking checks, safe CSV, or mock fallback.
