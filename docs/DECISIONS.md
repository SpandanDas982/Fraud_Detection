# Architecture Decision Record

## D-001 — Evidence organizer, not detector

Decision: no guilt/fraud/authenticity score. Reason: matches challenge and avoids unsupported conclusions. Rejected: threat scoring.

## D-002 — Mock UI first

Decision: complete frontend journey before AWS. Reason: BUILD round needs demonstrable UI and stable contracts. Rejected: backend-first integration.

## D-003 — Midnight Steel design

Decision: cool light enterprise palette with amber review states. Reason: professional security/analytics fit without cyber alarmism. Rejected: neon/dark threat dashboard and round-one dark mode.

## D-004 — React/Vite SPA + Vercel

Decision: React TypeScript, Tailwind, shadcn, Vite. Reason: fast UI delivery and separate AWS backend. Rejected: Next.js server features not needed for selected backend.

## D-005 — API Gateway/Lambda + direct S3

Decision: HTTP API for control plane; presigned direct S3 for binary data. Reason: avoid binary API/Lambda payload limits and credential exposure. Rejected: base64 file upload through API.

## D-006 — Event-driven per source

Decision: raw S3 event invokes idempotent processing. Reason: PDF/audio/model work is asynchronous and partial failure must be isolated. Rejected: one synchronous batch request.

## D-007 — Nova routing

Decision: Nova Lite for image/rendered page; Nova Micro for text/transcript. Reason: modality fit and cost. Rejected: Micro for images; one prose-generating model directly authoring reports.

## D-008 — Sarvam adapter

Decision: STT behind vendor-neutral interface. Reason: selected Indian-language speech provider and replaceable boundary. Rejected: frontend call with exposed key.

## D-009 — PyMuPDF + ReportLab

Decision: PyMuPDF input extraction/rendering; ReportLab output. Reason: distinct reliable responsibilities and Lambda-feasible packaging to verify. Rejected: treating PDF as plain text; browser print as authoritative export.

## D-010 — Observation ledger

Decision: one source observation remains immutable; reviews/groupings reference it. Reason: preserves contradictions/provenance. Rejected: canonical merged truth.

## D-011 — Explicit linkage

Decision: reference+namespace or reviewer confirmation required for contradiction comparison. Rejected: fuzzy merge based on amount/date/contact.

## D-012 — DynamoDB single case partition

Decision: one table, `PK=CASE#id`, prefixed SK entities, no initial GSI. Reason: access patterns are case-centric and simple. Rejected: table per entity and speculative indexes.

## D-013 — Unified safe export model

Decision: UI summaries, PDF, CSV, flags, and errors derive from shared masking/alias policy. Reason: avoid inconsistent leaks. Rejected: final-file-only regex redaction.

## D-014 — Synthetic-only hackathon

Decision: no real victim evidence. Reason: cloud providers and incomplete production controls. Rejected: production privacy claims.

## D-015 — One agent authority

Decision: `AGENTS.md` and project docs override skill packs. Use only targeted skills. Reason: overlapping workflows waste the timebox and can alter scope.

## D-016 — Python 3.13

Decision: Use Python 3.13. Reason: `backend/.python-version` is 3.13; AWS Lambda Python 3.13 runtime is GA. Rejected: 3.12 (docs originally said 3.12 but local toolchain is 3.13 and Lambda supports it).

## D-017 — AWS local dev uses named profile `aws`

Decision: All backend code that calls `boto3` locally uses `boto3.Session(profile_name='aws')`. Reason: credentials live in the developer's AWS named profile on the laptop; no `.env` file or hardcoded keys needed. Lambda execution uses the IAM role via the standard credential chain — the profile name is ignored in Lambda. Rejected: hardcoded keys, `.env` secrets in repo, or default profile (too ambiguous).
