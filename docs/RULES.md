# Project Rules

`AGENTS.md` is the complete repository authority. This file is the compact operational checklist.

## Must

- Read `AGENTS.md`, `PROJECT.md`, `BOUNDARIES.md`, and `STATUS.md` before coding.
- State assumptions and a short verification plan.
- Build one vertical feature slice at a time.
- Preserve original sources and candidate values.
- Link every reported field to a source locator.
- Keep unknown/missing/invalid/ambiguous states distinct.
- Validate model/STT responses; require human review where needed.
- Use neutral review language.
- Keep mock mode functional without credentials.
- Test focused behavior, regression, production build, and real UI path.
- Update `STATUS.md` with actual results and one next action.

## Must not

- Add unrequested features or speculative abstractions.
- Determine fraud, guilt, authenticity, or legal conclusions.
- Fetch evidence URLs or execute source content.
- Merge/discard conflicting claims or choose a winner silently.
- Send binary files through API/Lambda bodies when presigned S3 upload applies.
- Expose credentials, presigned URLs, raw evidence, transcripts, prompts, or provider responses in logs.
- Add auth, microservices, queues, RAG, vector DB, charts, or dark mode without an approved decision.
- Run multiple overlapping agent-skill workflows.
- Claim implementation/testing/performance/privacy without evidence.

## Change rule

Every changed line must trace to the requested feature, its test, or a directly necessary security/compatibility fix. Do not clean unrelated code.

## Completion rule

“Done” requires named acceptance criteria, executed commands, observed results, and documented remaining limitations. A plausible-looking UI or provider response is not verification.
