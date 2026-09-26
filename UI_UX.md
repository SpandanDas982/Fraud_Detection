# Evidence Ledger — UI/UX Specification

Status: frontend-generation specification for BUILD round 1  
Source of truth: `PROJECT.md` and `AGENTS.md`  
Selected visual theme: **Midnight Steel**

## 1. Experience objective

Build a calm, professional evidence workspace that helps a person turn scattered screenshots, text, PDFs, and audio into a reviewable evidence packet. The interface must make uncertainty and provenance visible without feeling like a police system, threat-intelligence dashboard, or fraud verdict engine.

The UI should communicate three qualities:

1. **Clarity** — the next action and current state are always obvious.
2. **Trust through traceability** — every extracted fact links back to a source.
3. **Calm control** — warnings are precise and review-oriented, never sensational.

Primary product line:

> Organize evidence. Preserve uncertainty. Prepare for review.

Supporting line:

> Turn screenshots, documents, text, and audio into a source-linked timeline and privacy-conscious evidence packet.

## 2. UX principles

### Evidence before inference

Show source material and extracted candidates together. Never show a model-generated summary without access to its source.

### Review, not verdict

Use “requires review,” “reported,” “missing,” and “inconsistent.” Never use fraud score, guilty, scammer, verified, fake, or threat level.

### Progressive disclosure

The default view shows what the user must act on. Technical metadata—digest, model, raw extraction, detailed locator—is available in a secondary disclosure.

### Partial success is useful

One failed source must not block successfully processed sources. Show failures locally and preserve forward progress.

### Uncertainty is visible

Ambiguous and undated evidence get their own timeline sections. Never place them into a precise order merely to make the timeline look complete.

### Original and correction coexist

A reviewer correction never erases the extracted value. Show “Extracted” and “Reviewed” when they differ.

## 3. Information architecture

Use one case workspace with persistent navigation.

```text
Marketing/start screen
  └─ Case workspace
      ├─ 1. Evidence
      ├─ 2. Review
      ├─ 3. Timeline
      ├─ 4. Flags
      └─ 5. Export
```

Recommended routes for the mock frontend:

```text
/
/case/demo/evidence
/case/demo/review
/case/demo/timeline
/case/demo/flags
/case/demo/export
```

Use React Router if already part of the scaffold. Otherwise use one state-driven workspace with the same conceptual stages. The mock service must remain replaceable by the future API without page rewrites.

## 4. Global application shell

### Desktop: 1280px and above

```text
┌────────────────────────────────────────────────────────────────────┐
│ Evidence Ledger              Demo case       Privacy notice   •••  │ 64
├──────────────┬─────────────────────────────────────────────────────┤
│ Case summary │ Page heading                                      │
│              │ Page description                                  │
│ 1 Evidence   │                                                     │
│ 2 Review     │ Main content                                       │
│ 3 Timeline   │                                                     │
│ 4 Flags      │                                                     │
│ 5 Export     │                                                     │
│              │                                                     │
│ Draft packet │                                                     │
└──────────────┴─────────────────────────────────────────────────────┘
    248px                       fluid, max 1440px
```

- Header height: 64px.
- Left rail: 248px fixed, collapsible only below 1024px.
- Main area: maximum content width 1440px; 32px desktop page padding.
- Review page may use the full remaining width for its split pane.
- No global footer inside the workspace.

### Tablet: 768–1279px

- Replace left rail with a compact 72px icon rail or top step navigation.
- Main padding: 24px.
- Review source/fields split becomes approximately 45/55.
- Timeline cards remain single column.

### Mobile: below 768px

- Header height: 56px.
- Bottom stage navigation for Evidence, Review, Timeline, Flags, Export.
- Main padding: 16px.
- Source preview and review fields stack vertically.
- Sticky bottom action area must not cover content; account for safe area.
- Tables become cards or horizontally scroll with an explicit cue.
- Dialogs become bottom sheets where practical.

## 5. Persistent shell elements

### Product header

Left: simple wordmark `Evidence Ledger` with a 20px document-stack icon.  
Center/desktop: current case alias and `Synthetic demo` badge.  
Right: privacy disclosure button, help icon, overflow menu.

Do not show an avatar, organization switcher, notifications, or search in round 1.

### Stage navigation

Each stage has:

- step number;
- label;
- status: not started, in progress, completed, attention;
- optional count, such as `3` unresolved flags.

The user may revisit completed stages. Prevent navigation only when doing so would corrupt state; otherwise warn rather than trap.

### Case summary block

Show only safe descriptive metrics:

- 8 sources;
- 11 observations;
- 7 reviewed;
- 3 require attention.

Do not display total loss, fraud probability, risk level, or “evidence strength.”

## 6. Screen A — start and intake

### Goal

Get the user into a complete demonstration immediately while making the privacy and synthetic-data boundary explicit.

### Layout

Top section uses a restrained two-column composition:

- left: eyebrow `EVIDENCE ORGANIZATION WORKSPACE`, headline, supporting copy, two CTAs;
- right: compact product-preview composition showing source cards flowing into a timeline—not marketing photography or cyber imagery.

Headline:

> Complex evidence.  
> Clear review.

Primary CTA: `Load synthetic demo`  
Secondary CTA: `Start empty case`

Below the intro, the intake workspace becomes the primary content.

### Privacy notice

Use a steel-soft informational panel, not a danger alert:

> This prototype is designed for synthetic demonstration data. It organizes evidence but does not determine wrongdoing or submit an official report.

Button: `I understand` only when the notice blocks first use; thereafter keep it accessible from the header.

### Add-evidence area

One large dropzone with four modality shortcuts:

- Images
- PDF
- Audio
- Paste text

Dropzone copy:

> Drop screenshots, documents, or audio here

Support line:

> PNG, JPG, WebP, PDF, WAV, MP3, M4A, AAC, OGG, FLAC, WebM. Limits will be validated before processing.

For mock round, selecting files creates simulated source rows and clearly labels them `Demo processing`. Do not imply that content was actually analyzed.

### Source inventory

Use a compact table on desktop and cards on mobile.

Columns:

- source/type;
- safe filename;
- size or pages/duration;
- status;
- observations;
- action menu.

Statuses:

- Queued — neutral steel;
- Processing — blue with spinner;
- Ready — green;
- Partial — amber;
- Needs review — amber;
- Duplicate — gray;
- Unsupported/Failed — muted red.

Never animate fake percentages. Use determinate progress only when actual progress exists; otherwise use a small indeterminate indicator and descriptive status.

### Empty state

Display a line illustration/icon group for image, PDF, text, and audio. No sad faces or warning icon.

Title: `Add the material you want to organize`  
Body: `Each source stays linked to the observations extracted from it.`  
Action: `Load synthetic demo`

## 7. Screen B — extraction review

### Goal

Confirm candidate fields efficiently without hiding source context.

### Desktop structure

Use a resizable two-pane workspace:

```text
┌──────────────────────────┬────────────────────────────────────────┐
│ Source list / preview    │ Observation and field review           │
│                          │                                        │
│ [image/PDF/audio/text]   │ Payment notification                   │
│                          │ Amount        ₹5,000    [Accept]        │
│ Zoom/page/audio controls │ Date          26 Sep…  [Edit]          │
│                          │ Reference     Missing   [Add]           │
└──────────────────────────┴────────────────────────────────────────┘
```

- Left pane: 42% minimum 360px.
- Right pane: 58% minimum 440px.
- Sticky pane headers.
- Preserve review position when switching sources.

### Source preview variants

**Image:** contain image on checker-free neutral surface; zoom, fit, rotate.  
**PDF:** page thumbnails, current page, page count, zoom.  
**Audio:** player, scrubber, duration, transcript segments with active timestamp.  
**Text:** line-numbered read-only text with highlighted anchor.

No OCR bounding boxes unless actual, reliable coordinates exist. Anchor text/region description is acceptable and must be labelled accordingly.

### Observation card

Header:

- event type;
- extraction status;
- source ID chip;
- confidence summary only as descriptive metadata;
- overflow actions.

Field row:

- field label;
- candidate/raw value;
- normalized value when different;
- source anchor control;
- confidence: High/Medium/Low with numeric value in details only;
- actions: Accept, Edit, Mark unreadable, Reject.

Confidence never determines truth. Low confidence automatically adds `Human verification required` but does not force rejection.

### Editing pattern

Editing opens inline controls. Show:

- `Extracted value` read-only;
- `Reviewed value` editable;
- optional review note;
- save/cancel.

After saving, display `Corrected by reviewer` with an undo action. Keep the original visible under `View extraction`.

### Review completion

Sticky footer:

- left: `7 of 11 observations reviewed`;
- center: Previous / Next unreviewed;
- right: `Continue to timeline`.

Allow continuation with unresolved items, but show a confirmation dialog explaining that the export will remain a draft.

## 8. Screen C — timeline

### Goal

Show what can be ordered, what remains uncertain, and what lacks time information.

### Page header

Title: `Evidence timeline`  
Description: `Events are ordered only when their reported time supports it.`

Controls:

- search;
- event-type filter;
- source filter;
- review-status filter;
- `Show assumptions` toggle;
- list view only in round 1—do not build a decorative chart.

### Section 1: dated evidence

Use a vertical rule with time labels in a left column and cards in a right column. Exact times show time/date; date-only items show `Time unknown`.

Each timeline card includes:

- event-type icon and label;
- safe one-line summary;
- exact/date-only precision label;
- aliases for actor/transaction;
- source ID + locator button;
- flag chips;
- assumptions disclosure.

Cards with the same time or overlapping intervals share a grouped band labelled `Order not established`.

### Section 2: uncertain placement

Distinct steel-soft container with a dashed left rule. Example:

`03/04/2026 — could mean 3 April or 4 March`  
Badge: `Ambiguous time`  
Action: `Review source`

### Section 3: undated evidence

Neutral surface at the bottom. Explain that these items are included in the packet but not positioned chronologically.

### Timeline mobile behavior

- Time label moves above each card.
- Vertical rule aligns 12px from card edge.
- Filter controls use a sheet.
- Source preview opens full-screen.

## 9. Screen D — flags and gaps

### Goal

Help the user review observable data problems without turning them into risk scores.

### Summary row

Four compact cards:

- Missing information
- Human verification
- Inconsistencies
- Duplicates/processing

Show counts only. No percentages, severity gauges, or overall score.

### Filter tabs

`All`, `Missing`, `Ambiguous`, `Verification`, `Inconsistencies`, `Duplicates`, `Processing`

### Standard flag card

- neutral icon;
- plain-language title;
- one-sentence explanation;
- involved source/observation chips;
- what triggered the rule;
- `Review source` primary action;
- `Mark reviewed` secondary action where appropriate.

### Amount discrepancy comparison

Show claims symmetrically:

```text
Amount discrepancy                         Requires review
These linked sources report different amounts. Both are retained.

SOURCE S02                    SOURCE S03
₹5,000                        ₹7,000
Transaction T01               Transaction T01
26 Sep, 10:45                 26 Sep, 10:47
[Open source]                 [Open source]
```

Do not visually mark either side as correct, winner, suspicious, or more trustworthy. If confidence appears, use the same hierarchy on both sides.

### Missing information card

Example:

`Transaction reference was not found`  
`Required by the Payment notification checklist.`  
Actions: `Add reviewed value`, `Confirm unavailable`, `Open source`.

## 10. Screen E — export

### Goal

Make the final packet understandable and prevent users from overlooking unresolved items or privacy behavior.

### Export readiness panel

Show:

- sources included;
- reviewed observations;
- unresolved flags;
- uncertain/undated observations;
- output status: `Draft` or `Ready for export`.

Do not call it “verified.”

### Privacy preview

Side-by-side examples:

- `+91 98••• ••210` -> `Contact C01`;
- account reference -> `Account A01`;
- transaction reference -> `Transaction T01`;
- sanitized URL display.

Explain:

> Masking applies to the generated packet. Original uploaded sources remain restricted and are not rewritten.

### Output cards

**Evidence Organization Report — PDF**  
Readable chronology, flags, assumptions, and source appendix.  
Action: `Generate PDF`

**Structured Timeline — CSV**  
One row per source observation with provenance and flags.  
Action: `Generate CSV`

In mock mode, actions download deterministic fixture outputs or show `Demo export preview`. Never imply live report generation.

### Final disclaimer

> This packet organizes reported information for human review. It does not establish wrongdoing, source authenticity, or legal conclusions, and it is not an official submission.

## 11. Component inventory and shadcn mapping

| Product component | shadcn/ui foundation | Notes |
|---|---|---|
| App navigation | custom + `Button`, `Badge` | Desktop rail/mobile bottom bar |
| Evidence dropzone | `Card`, `Button`, native input | Drag states and modality shortcuts |
| Source inventory | `Table`, `DropdownMenu`, `Badge` | Cards on mobile |
| Source preview | `Card`, `ScrollArea`, `Tabs` | Media-specific toolbar |
| Observation review | `Card`, `Form`, `Input`, `Select`, `Textarea` | Inline editing |
| Timeline sections | custom semantic list + `Card` | No third-party timeline library |
| Flag filters | `Tabs` or `ToggleGroup` | Counts in labels |
| Flag comparison | `Card`, `Separator`, `Badge` | Symmetric layout |
| Privacy preview | `Table`, `Alert` | Informational, not destructive |
| Confirmation | `AlertDialog` | Only for consequential state changes |
| Mobile filters | `Sheet` | Preserve focus |
| Notifications | `Sonner` | Success/failure only; do not hide persistent errors in toast |
| Help/details | `Tooltip`, `Popover`, `Collapsible` | Critical meaning must remain visible |

Use Lucide icons at 16, 18, or 20px with 1.75px stroke. Do not use emoji as interface icons.

## 12. State matrix

| State | Required presentation |
|---|---|
| Initial empty | Explanation + load demo + add evidence |
| Upload drag active | Steel-blue border and short action copy |
| Queued | Neutral status, no fake progress |
| Processing | Small spinner + modality-specific text |
| Partial | Usable results plus local explanation |
| Failed | Safe reason, retry/remove, successful sources unaffected |
| Duplicate | Link to original source; retained in inventory |
| No observations | Source retained; explain that nothing was extracted |
| No flags | “No issues found by the implemented checks,” not “Everything is valid” |
| Network unavailable | Mock demo remains accessible |
| Export blocked/draft | Exact unresolved items and safe next actions |

## 13. Interaction and motion

- Standard transition: 140ms ease-out for opacity/background/border.
- Panel enter: 180ms ease-out, maximum 8px movement.
- No parallax, glowing effects, pulsing threat indicators, count-up metrics, or cinematic page transitions.
- Respect `prefers-reduced-motion`; remove translation and use instant/opacity-only changes.
- Preserve scroll position when opening/closing source details.
- Use optimistic UI only for mock/local review edits; live backend version later requires conflict handling.

## 14. Accessibility requirements

- Target WCAG 2.2 AA.
- Logical heading hierarchy with one `h1` per screen.
- Full keyboard navigation and visible 2px focus ring.
- Minimum interactive target 44×44px on touch.
- Do not rely on color alone; pair status color with text/icon.
- Announce upload/status changes through a polite live region.
- Errors appear beside the related control and in a page summary for failed submission.
- Source image has descriptive alt text; decorative icons are hidden from assistive technology.
- Dialog/sheet focus is trapped and returns to its trigger.
- Tables have semantic headers and a mobile equivalent.
- Dates and currency are readable by assistive technology; do not encode them only in icons.

## 15. Required mock fixture behavior

The frontend fixture must contain:

- images, PDF, text, and audio in the source inventory;
- at least one ready, processing, duplicate, partial, and failed/unsupported state;
- ₹5,000 and ₹7,000 claims linked to `Transaction T01`;
- one missing reference;
- one ambiguous `03/04/2026` date;
- one undated observation;
- one reviewer correction;
- one low-confidence/human-verification field;
- planted masked phone, email, account, URL, and formula-like text;
- one unrelated payment that does not receive a discrepancy flag.

## 16. Frontend completion criteria

- Production build succeeds.
- All five stages work from the built-in demo without network or credentials.
- Navigation state and progress are coherent.
- Source preview and candidate review are shown together.
- Reviewer can accept, edit, reject, and mark unreadable.
- Timeline visibly separates dated, uncertain, and undated evidence.
- Both conflicting claims remain visible and source-linked.
- Flags contain no risk score or verdict language.
- Export preview masks planted identifiers and labels mock behavior honestly.
- Empty/loading/partial/error/duplicate/no-flags states exist.
- Desktop, tablet, and mobile layouts are usable.
- Keyboard path supports the complete demo.
- Automated component tests and production build pass; actual results belong in `STATUS.md`.

## 17. 90-second demonstration sequence

1. Start screen: state the non-verdict purpose and load the synthetic demo.
2. Evidence: show all four modalities and source statuses.
3. Review: open a screenshot, correct one extracted field, show its source anchor.
4. Timeline: show dated, uncertain, and undated sections.
5. Flags: open the ₹5,000/₹7,000 comparison and emphasize that both are retained.
6. Export: show alias/masking preview and PDF/CSV packet choices.
7. Close with the disclaimer: organized for human review, not an official finding.
