# Evidence Ledger — Visual Design System

Status: implementation-ready design specification  
Selected source theme: **Midnight Steel**  
Theme rationale: enterprise SaaS, security, infrastructure, and analytics are the closest fit. Cool blue-gray neutrals communicate precision without the alarmism of a red/black cyber-security palette.

## 1. Art direction

### Design concept: forensic calm

Evidence Ledger should feel like a careful editorial workspace crossed with a modern technical console:

- clean light canvas;
- white evidence surfaces;
- deep steel actions;
- pale blue structural accents;
- amber reserved for unresolved review;
- muted red reserved for actual validation/processing failures;
- clear typography and generous whitespace;
- thin borders rather than heavy shadows;
- no gradients, glassmorphism, neon, metallic effects, or “hacker” imagery.

This is a human review product. It should feel dependable and understandable under stress.

### Color distribution

Use an approximate 60/30/10 balance:

- 60% cool canvas and muted structural areas;
- 30% white cards/panels;
- 10% deep steel actions, selection, focus, and restrained status accents.

## 2. Brand and naming presentation

Working product name: `Evidence Ledger`.

Wordmark treatment:

- IBM Plex Sans, 600, 18px desktop / 16px mobile;
- main text color;
- sentence case;
- no all-caps logotype;
- pair with a simple `Files` or `Layers3` Lucide icon in deep steel;
- do not design a shield, police badge, fingerprint, target, siren, or magnifying-glass logo.

Tagline:

> Organize evidence. Preserve uncertainty.

## 3. Color tokens

### Core Midnight Steel palette

```yaml
colors:
  canvas: "#F4F6F8"
  surface: "#FFFFFF"
  surface-subtle: "#F8FAFB"
  surface-raised: "#FFFFFF"
  ink: "#17232F"
  ink-secondary: "#52616E"
  ink-tertiary: "#74818C"
  border: "#D9E0E6"
  border-strong: "#BEC9D2"
  primary: "#243C53"
  primary-hover: "#1C3145"
  primary-active: "#15293B"
  primary-soft: "#E7EDF2"
  primary-muted: "#AEC2D0"
  on-primary: "#FFFFFF"
  focus: "#2F6FA3"
  link: "#2B628F"
  link-hover: "#1E4D73"

  success: "#28745A"
  success-soft: "#E8F4EF"
  success-border: "#A9D3C2"

  review: "#946200"
  review-soft: "#FFF4D6"
  review-border: "#E7C66E"

  error: "#A33E43"
  error-soft: "#FBECEE"
  error-border: "#E3A9AD"

  info: "#315F82"
  info-soft: "#EAF2F7"
  info-border: "#AECAD9"

  duplicate: "#66727D"
  duplicate-soft: "#EEF1F3"

  overlay: "rgba(15, 27, 38, 0.48)"
  selection: "#DCEAF4"
```

### Semantic status mapping

| Meaning | Color | Never imply |
|---|---|---|
| Primary action/selected | Deep steel | Risk or authority |
| Ready/reviewed | Green | Truth or authenticity |
| Human review/ambiguous/partial | Amber | Guilt or danger |
| Failed/invalid | Muted red | Fraud detected |
| Information/processing | Blue steel | Verification |
| Duplicate/disabled | Gray | Deletion or irrelevance |

### Contrast rule

- Body text must meet WCAG AA contrast against its surface.
- Never place `ink-tertiary` below 14px on white for critical information.
- Use `on-primary` only on `primary`, `primary-hover`, or darker surfaces.
- Status-soft backgrounds require their corresponding dark text color.
- Test final Tailwind values with an automated contrast tool; tokens are a specification, not a substitute for verification.

## 4. Typography

Use open, production-safe fonts rather than the proprietary/reference Cohere typefaces.

```yaml
fontFamily:
  sans: "IBM Plex Sans, ui-sans-serif, system-ui, sans-serif"
  mono: "IBM Plex Mono, ui-monospace, SFMono-Regular, monospace"
```

### Type scale

The supplied 96/72/60px display reference is appropriate for marketing pages, not a dense evidence application. Evidence Ledger uses a restrained responsive scale.

```yaml
typography:
  hero-display:
    fontFamily: sans
    fontSize: "clamp(44px, 6vw, 72px)"
    fontWeight: 600
    lineHeight: 0.98
    letterSpacing: "-0.04em"

  page-display:
    fontFamily: sans
    fontSize: "clamp(32px, 4vw, 48px)"
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "-0.03em"

  page-title:
    fontFamily: sans
    fontSize: 32px
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.02em"

  section-heading:
    fontFamily: sans
    fontSize: 24px
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.015em"

  card-heading:
    fontFamily: sans
    fontSize: 18px
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "-0.01em"

  feature-heading:
    fontFamily: sans
    fontSize: 16px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: 0

  body-large:
    fontFamily: sans
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: 0

  body:
    fontFamily: sans
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0

  body-small:
    fontFamily: sans
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: 0

  button:
    fontFamily: sans
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.005em"

  caption:
    fontFamily: sans
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0

  mono-label:
    fontFamily: mono
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.04em"
    textTransform: uppercase

  micro:
    fontFamily: sans
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0
```

### Responsive typography

- Below 768px: page title 28px, section heading 21px, card heading 17px.
- Do not reduce body below 16px for primary reading.
- Source metadata and captions may use 13px; critical status text must be at least 14px.
- Use mono only for source IDs, transaction aliases, digests, timestamps in technical details, and code-like values—not paragraphs.

## 5. Spacing system

Base unit: 4px. Use the following named scale consistently.

```yaml
spacing:
  0: 0px
  0.5: 2px
  1: 4px
  1.5: 6px
  2: 8px
  3: 12px
  4: 16px
  5: 20px
  6: 24px
  8: 32px
  10: 40px
  12: 48px
  16: 64px
  20: 80px
```

Rules:

- Page section gap: 32px application, 64–80px start screen.
- Card padding: 20px default, 24px major, 16px compact.
- Form field vertical gap: 16px.
- Inline action gap: 8px.
- Table row height: minimum 52px.
- Mobile page padding: 16px; tablet 24px; desktop 32px.
- Maximum readable paragraph width: 68ch.

## 6. Radius, border, elevation

```yaml
rounded:
  xs: 4px
  sm: 6px
  md: 10px
  lg: 14px
  xl: 18px
  pill: 9999px

border:
  default: "1px solid #D9E0E6"
  strong: "1px solid #BEC9D2"
  selected: "1px solid #243C53"

shadow:
  none: none
  xs: "0 1px 2px rgba(23, 35, 47, 0.05)"
  sm: "0 4px 14px rgba(23, 35, 47, 0.07)"
  overlay: "0 18px 50px rgba(15, 27, 38, 0.18)"
```

- Default cards use a border and `shadow-xs` only.
- Raised menus/popovers use `shadow-sm`.
- Dialogs/sheets use `shadow-overlay`.
- Do not stack multiple shadows or use colored glows.
- Pills are reserved for statuses, filters, aliases, and compact actions—not every button/card.

## 7. Grid and layout tokens

```yaml
layout:
  maxAppWidth: 1600px
  maxContentWidth: 1440px
  maxReadingWidth: 760px
  headerHeightDesktop: 64px
  headerHeightMobile: 56px
  sidebarWidth: 248px
  compactSidebarWidth: 72px
  reviewSourceMinWidth: 360px
  reviewFieldsMinWidth: 440px
  bottomNavHeight: 64px

breakpoints:
  sm: 640px
  md: 768px
  lg: 1024px
  xl: 1280px
  2xl: 1536px
```

Use CSS Grid for application layout and review split. Use Flexbox for local alignment. Avoid absolute positioning for primary structure.

## 8. shadcn/Tailwind theme variables

Use these as the light-theme starting point. Store colors in the format required by the installed Tailwind/shadcn version; do not blindly paste incompatible syntax.

```css
:root {
  --background: #F4F6F8;
  --foreground: #17232F;
  --card: #FFFFFF;
  --card-foreground: #17232F;
  --popover: #FFFFFF;
  --popover-foreground: #17232F;
  --primary: #243C53;
  --primary-foreground: #FFFFFF;
  --secondary: #E7EDF2;
  --secondary-foreground: #243C53;
  --muted: #EEF1F3;
  --muted-foreground: #52616E;
  --accent: #DCEAF4;
  --accent-foreground: #17232F;
  --destructive: #A33E43;
  --destructive-foreground: #FFFFFF;
  --border: #D9E0E6;
  --input: #BEC9D2;
  --ring: #2F6FA3;
  --radius: 0.625rem;
}
```

No dark mode in round 1. A rushed dark mode doubles state/contrast testing and does not improve the core demo.

## 9. Component specifications

### Button

```yaml
button-primary:
  height: 40px
  background: primary
  foreground: on-primary
  hover: primary-hover
  active: primary-active
  radius: sm
  paddingInline: 16px
  typography: button

button-secondary:
  height: 40px
  background: surface
  foreground: ink
  border: default
  hoverBackground: surface-subtle
  radius: sm
  paddingInline: 16px

button-ghost:
  height: 36px
  background: transparent
  foreground: ink-secondary
  hoverBackground: primary-soft
  radius: sm

button-destructive:
  useOnlyFor: delete/remove consequential action
  background: error
  foreground: white
```

- Loading button keeps width stable and shows spinner plus verb.
- Icon-only buttons need an accessible label and tooltip.
- Primary actions: maximum one per local action group.

### Input/select/textarea

- Height 42px; textarea minimum 96px.
- Border `border-strong`; focus 2px `focus` ring with 2px offset.
- Label 14px/600; helper/error 13px.
- Placeholder uses `ink-tertiary`; never substitute placeholder for label.
- Invalid state uses error border + icon + inline message.

### Card

```yaml
card:
  background: surface
  border: default
  radius: md
  padding: 20px
  shadow: xs

card-selected:
  border: selected
  boxShadow: "0 0 0 2px rgba(47,111,163,0.14)"
```

No hover lift on static cards. Clickable cards get a subtle border/background change.

### Status badge

- Height 24px, pill radius, 8px horizontal padding.
- 12px/500 text, icon optional at 12px.
- Use semantic soft background + dark semantic text.
- Never use a badge alone to communicate complex meaning.

### Source chip

- Mono label such as `S02 · PAGE 3`.
- Steel-soft background, deep steel text.
- Click opens source preview at locator.
- Focus/hover state must be obvious.

### Alert/callout

- Information: info-soft with info border.
- Review: review-soft with review border.
- Error: error-soft with error border.
- Maximum one prominent callout at the top of a page; local callouts remain near their source.
- Left icon, title, body, optional action. No full-width colored bars unless content is blocking.

### Source inventory table

- White surface; sticky header only when list exceeds viewport.
- Header uses 12px mono-label/uppercase or 13px/600, not both.
- Rows 56px minimum.
- Type icon inside 32px steel-soft square.
- Safe filename truncates in middle/end with full value in accessible tooltip.
- Row actions remain in a menu; Retry is visible for failed rows.

### Review field row

- 16px vertical padding, separators between fields.
- Three areas on desktop: label 160px, value/anchor fluid, actions 160px.
- On mobile: label -> value -> actions stacked.
- Corrected value uses a thin left steel border and `Corrected by reviewer` caption.

### Timeline card

- Width fills content column; white surface.
- 4px left semantic stripe only when a flag exists.
- Header line: event type, precision, review status.
- Summary uses card-heading or body-large depending density.
- Metadata chips wrap below.
- Source link and assumptions are never hidden solely on hover.

### Flag comparison card

- Parent card uses review-soft header and white comparison body.
- Two equal columns separated by a 1px border.
- Neither side receives green/red preference.
- At mobile width, stack with a centered `Compared with` separator.

### Dropzone

- Minimum height 220px desktop / 180px mobile.
- 1.5px dashed border-strong, large 14px radius.
- Drag active: primary-soft background, focus-colored border.
- Reject state: error-soft and exact file-specific reason.
- Do not use illustrations larger than 64px.

### Modal/sheet

- Dialog max width 560px; source preview may use 960px/full-screen.
- Mobile uses sheet/full-screen for source preview and filters.
- Destructive confirmation must name the action and object.

## 10. Iconography

Use Lucide React only.

Suggested mapping:

```text
Images: Image
PDF: FileText
Audio: AudioLines
Text: AlignLeft
Timeline: ListTree or Clock3
Flags: Flag
Missing: CircleHelp
Ambiguous: Split
Verification: UserCheck
Discrepancy: GitCompareArrows
Duplicate: Copy
Ready: CircleCheck
Error: CircleX
Privacy: ShieldCheck
Export: Download
Source link: ExternalLink or LocateFixed
```

Avoid icons that imply criminality or attack: Skull, Siren, Crosshair, Bug, ShieldAlert as branding.

## 11. Data visualization policy

Do not add charts to the first-round interface. Counts and a chronological list communicate the current dataset better. Specifically avoid:

- risk gauges;
- fraud scores;
- red/green probability donuts;
- relationship graphs without enough data;
- animated transaction totals;
- “threat maps.”

If a later dataset justifies visualization, it must represent evidence organization—not guilt.

## 12. Content design

### Voice

Calm, exact, neutral, and action-oriented.

### Preferred patterns

- `3 observations require review.`
- `A transaction reference was not found in this source.`
- `These linked sources report different amounts. Both values are retained.`
- `The date can be interpreted in more than one way.`
- `No issues were found by the implemented checks.`
- `Generate draft PDF.`

### Avoid

- `3 dangerous findings.`
- `Fraud risk is high.`
- `We detected a scam.`
- `This evidence is fake.`
- `Everything is safe.`
- `Verified report.`
- `Submit complaint.`

### Button verbs

Use clear verbs: Add evidence, Load demo, Review source, Accept value, Save correction, Continue, Generate PDF, Download CSV.

## 13. Motion tokens

```yaml
motion:
  fast: 100ms
  standard: 140ms
  deliberate: 180ms
  easingStandard: "cubic-bezier(0.2, 0, 0, 1)"
  maxTranslate: 8px
```

- Hover/focus: fast.
- Panel disclosure: standard.
- Sheet/dialog: deliberate.
- No looping decorative motion.
- Processing spinner is permitted; progress must be honest.
- Reduced-motion removes translation and nonessential transition.

## 14. Responsive rules

### 1536px+

- Center app at max width; sidebar remains 248px.
- Review split can grow source pane but keep text review readable.

### 1024–1535px

- Standard desktop shell.
- Page padding 32px.
- Four count cards may stay one row.

### 768–1023px

- Compact rail/top steps.
- Page padding 24px.
- Count cards 2×2.
- Review split persists only if both panes retain minimum width; otherwise stack.

### Below 768px

- Bottom navigation.
- Page padding 16px.
- Single column.
- Sticky bottom primary action.
- Count cards 2×2 or horizontal scroll only when labelled.
- Comparison columns stack.
- Table becomes cards or scrollable data table with first column sticky.

### Below 380px

- Buttons may become full width.
- Avoid side-by-side field actions; use overflow menu.
- Keep 16px primary body text.

## 15. Accessibility tokens and behavior

```yaml
focusRing:
  width: 2px
  color: focus
  offset: 2px

touchTarget:
  minimum: 44px

reading:
  bodyMin: 16px
  metadataMin: 13px
  paragraphMaxWidth: 68ch
```

- Semantic HTML before ARIA.
- Use `aria-current="step"` in navigation.
- Status changes announced politely.
- Source-preview zoom controls expose accessible names and current value.
- Audio player/transcript selection works by keyboard.
- Do not trap users in the step flow.
- Test 200% zoom, keyboard-only flow, reduced motion, and screen-reader labels.

## 16. Tailwind implementation guidance

- Extend theme tokens once; do not scatter arbitrary hex values through components.
- Prefer semantic utilities/components such as `bg-background`, `text-foreground`, `border-border`, `bg-review-soft`.
- Create semantic custom variables for review/success/info/duplicate states.
- Avoid arbitrary values except layout dimensions specified here.
- Use `cn()` for conditional classes; do not introduce a second styling system.
- Use shadcn component code as owned source and keep variants small.
- Font loading: package or use a reliable webfont strategy with `font-display: swap`; system fallbacks must remain usable.

## 17. Implementation order

1. Install fonts/tokens and configure global canvas.
2. Build shell, header, sidebar, mobile navigation.
3. Build reusable status badge, source chip, page header, empty/error/loading states.
4. Build intake/dropzone/source inventory.
5. Build source preview and review-field patterns.
6. Build timeline cards/sections.
7. Build flag list and symmetric discrepancy comparison.
8. Build export/readiness/privacy preview.
9. Add responsive behavior.
10. Run accessibility and visual consistency pass.

Do not start with animation or marketing polish before the complete mock workflow works.

## 18. Visual acceptance checklist

- Midnight Steel tokens are centralized and consistently used.
- No gradients, neon, glassmorphism, cyber-threat decoration, or guilt imagery.
- Typography hierarchy is clear without oversized app headings.
- At most one primary action per local region.
- Status meaning includes text/icon, not color alone.
- Discrepancy claims are visually symmetric.
- Ambiguous and undated timeline sections are clearly distinct.
- Dense evidence views remain readable at 1280px and 200% zoom.
- Mobile review flow is usable without side-by-side dependence.
- Focus states, error states, empty states, and loading states are designed.
- UI never suggests official authority, authenticity, or fraud determination.
