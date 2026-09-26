# Product Requirements Document

## Product

**Evidence Ledger** is a multimodal evidence-packet compiler. It helps people and support workers transform scattered material into a neutral, source-linked timeline and export without deciding what is true or who is responsible.

## Product promise

> Organize evidence. Preserve uncertainty. Prepare for review.

## Differentiation

- screenshot-first ordinary-user workflow;
- claim ledger rather than a model-selected truth;
- field-level provenance;
- explicit human verification;
- uncertain/undated chronology;
- contradictions retained symmetrically;
- masked PDF/CSV packet;
- no fraud score or accusation.

## Primary journey

1. Start a temporary synthetic case and accept the privacy limitation.
2. Add images, PDF, audio, or pasted text—or load the demo.
3. Track each source independently through processing.
4. Review candidates beside the source; accept, correct, reject, or mark unreadable.
5. Inspect dated, uncertain, and undated observations.
6. Resolve or acknowledge missing information, human-verification needs, discrepancies, duplicates, and failures.
7. Preview masking and packet readiness.
8. Generate/download PDF and CSV.

## Functional requirements

### FR-1 Case and intake

- Create/read/delete a temporary case.
- Inventory every source with stable ID, safe label, digest, media type, size, status, and duplicate relationship.
- Support direct S3 upload intent for binary files and bounded inline pasted text.
- Isolate per-source failure.

### FR-2 Extraction

- Image/rendered PDF page -> Nova Lite.
- Pasted/PDF text and audio transcript -> Nova Micro.
- Audio -> Sarvam STT before Nova extraction.
- Validate all provider output against versioned contracts.
- Store absent values as `null`; never fabricate.

### FR-3 Human review

- Show source preview and candidate fields together.
- Preserve raw candidate and reviewed value separately.
- Record accept/correct/reject/unreadable state and optional note.
- Use optimistic version checks when live.

### FR-4 Organization

- Normalize amounts without binary float.
- Represent time as point, interval, candidate set, or unresolved.
- Auto-link only with explicit compatible identifiers; allow reviewer-confirmed links.
- Separate dated, uncertain, and undated sections.

### FR-5 Flags

- Apply event-specific completeness rules.
- Flag missing, invalid, ambiguous, human verification, amount/time discrepancy, duplicate/potential duplicate, unsupported input, and processing error.
- Keep every conflicting observation.
- Never calculate an overall risk score.

### FR-6 Privacy and export

- Use case-local aliases for contacts, accounts, and transactions.
- Mask supported phone/email/account/identifier/URL patterns throughout shareable view models.
- Neutralize formula-like CSV cells.
- Export one CSV row per source observation.
- Produce PDF with methodology, inventory, timeline, unresolved flags, assumptions, and source appendix.

## Non-functional requirements

- Mock mode works without credentials or network.
- Deterministic core logic and fixture results.
- Partial success and idempotent processing.
- No raw evidence/provider payloads in logs.
- Accessible keyboard/mobile workflow targeting WCAG 2.2 AA.
- Provider/service configuration outside committed source.
- Costs bounded by file/page/audio/token limits and deduplication.

## UI-round acceptance criteria

- Production frontend build passes.
- All five stages function using built-in demo.
- Four modalities and all required states appear.
- Reviewer can accept/edit/reject/mark unreadable.
- Dated/uncertain/undated groups are distinct.
- Discrepancy view is symmetric and source-linked.
- Export preview masks planted identifiers.
- UI clearly labels all processing/export behavior as mock.

## Full MVP acceptance criteria

- Supported synthetic inputs complete end to end.
- Every exported nonempty factual field has resolvable provenance.
- Contradictions and uncertainty are preserved.
- Unrelated records do not receive contradiction flags.
- Supported planted identifiers are absent from shareable outputs.
- PDF/CSV open correctly.
- Tests/build/deployment smoke tests pass with recorded results.

## Out of scope

Authentication, multi-tenancy, billing, collaboration, mobile app, official submission, URL fetching/reputation checks, device forensics, authenticity certification, guilt classification, RAG, vector storage, model training, and production use of real victim data.
