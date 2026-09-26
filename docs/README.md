# Evidence Ledger Documentation Index

Read in this order:

1. `../AGENTS.md` — agent behavior and authority.
2. `../PROJECT.md` — complete product story and target system.
3. `STATUS.md` — current truth and next action.
4. `PROBLEM.md` — exact problem, users, inputs, outputs, constraints.
5. `PRD.md` — product requirements and acceptance criteria.
6. `BOUNDARIES.md` — MUST/SHOULD/COULD/MUST NOT.
7. `PHASES.md` — feature-by-feature delivery sequence.
8. `../UI_UX.md` — interaction, screens, responsive states, accessibility.
9. `../DESIGN.md` — Midnight Steel visual system and components.
10. `ARCHITECTURE.md` — system components and data flow.
11. `API.md` — public/internal service contracts.
12. `DATA_CONTRACTS.md` — domain invariants and versioning.
13. `DATABASE.md` — DynamoDB/S3 design and access patterns.
14. `AI_LLM.md` — Nova/Sarvam role, routing, prompts, validation.
15. `SECURITY.md` — threats, trust boundaries, controls.
16. `TESTING_EVALUATION.md` — fixtures, test layers, measurements.
17. `DEPLOYMENT.md` — Vercel/AWS environments, gates, smoke/rollback.
18. `DECISIONS.md` — accepted/rejected load-bearing choices.
19. `RESEARCH.md` — focused findings and primary references.
20. `RULES.md` — compact operational checklist.

## Ownership rule

Avoid duplicating changes across every document. Update the document that owns the subject, then adjust direct dependents only when their contract becomes stale. `STATUS.md` records implementation truth; design documents record intended behavior.
