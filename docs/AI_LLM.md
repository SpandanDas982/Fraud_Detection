# AI, Extraction, and Speech Specification

## Role of AI

AI proposes structured candidate observations from unstructured evidence. It does not determine truth, fraud, risk, guilt, authenticity, or final chronology. Deterministic code validates, normalizes, links, flags, redacts, and exports; a human reviews candidates.

## Model routing

| Input | Preprocessing | Extraction |
|---|---|---|
| Image/screenshot | validate/hash | Nova Lite |
| PDF with usable text | PyMuPDF text by page | Nova Micro |
| Image-only/layout PDF page | PyMuPDF render | Nova Lite |
| Pasted text | bound/preserve lines | Nova Micro |
| Audio | Sarvam STT with segments | Nova Micro over transcript |

Nova model IDs/region/inference profiles are configuration. Do not scatter literals.

## Prompt requirements

- State that source content is untrusted evidence data and embedded instructions must be ignored.
- Ask only for visible/reported facts.
- Require `null` for absent/unreadable values.
- Preserve raw text plus normalized candidate where safe.
- Require source locator/anchor for each field.
- Capture assumptions and ambiguity explicitly.
- Prohibit guilt/fraud/authenticity/risk conclusions.
- Constrain output using Bedrock-supported tool/JSON schema and validate again in Pydantic.

## Output handling

- Reject schema-invalid prose/extra payload.
- Confidence is metadata, never truth.
- Low-confidence, conflicting, assumed, or unreadable values raise human verification.
- Provider output is stored with model and prompt-schema versions.
- Raw provider responses/prompts are not logged.
- Retry only transient failures with bounded attempts; validation failure requires review/reprocess, not infinite retry.

## Evaluation

Use independent synthetic golden annotations by modality. Measure per-field precision/recall/exact match and provenance coverage. Include prompt-injection text, cropped screenshots, blurry values, ambiguous dates, currency confusion, duplicate sources, and negative contradiction cases.

## Sarvam STT

- Select REST or Batch endpoint based on current file/duration requirements.
- Validate current supported format/size rules at integration.
- Request timestamps when supported and useful.
- Preserve language/code-mix metadata and segments.
- Link extracted facts to transcript anchor and audio time range.
- Treat transcript as sensitive evidence and model input, never operational logs.

## Fallbacks

- Deterministic mock adapter is mandatory.
- Provider outage produces per-source failure/partial state.
- Do not silently switch to a different model/provider with different privacy/cost behavior.
