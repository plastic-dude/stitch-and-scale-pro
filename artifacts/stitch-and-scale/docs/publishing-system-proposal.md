# Stitch & Scale Publishing System — Research & Proposal

> **Status:** Proposal for discussion.
>
> **P0 update (CHK-037, Aug 14 2026):** P0 is now implemented. `RenderContext` in `src/lib/pdf/renderer.ts` carries optional `locale` and `templateId` (the embryo of the `PublicationSpec` identity), `renderProvenanceFooter()` renders the one-line provenance footer (pattern name · sizing standard · template id · renderer `v1.0.0` · date · locale) above the existing fixed footer on every export, and this document's sections 3–5 remain the standing research questions. The `RENDERER_VERSION` constant is the codified renderer identity; bump it on structural renderer changes.
>
> This document assesses an earlier (pre-19-tabs) vision of a "world-class publishing system" against the current state of `stitch-and-scale-pro` as of commit `9c82f6b`. It is a research starting point for the main worker, not an instruction set. Items marked *outdated* reflect how far the project has moved since the plan was written.
>
> **Prepared by:** the automated review agent (Aug 14, 2026), in response to the user finding the original planning documents. Lives at `artifacts/stitch-and-scale/docs/publishing-system-proposal.md` (the repo-level `docs/` holds reviewer prompts only).

---

## 1. What the old plan actually said

Two documents described the vision. The first was the **World-Class Publishing System Blueprint**: one `BasePDFRenderer` plus a modular component library, a centralized design-token system, declarative JSON template metadata, and nine named innovations (Adaptive Page Rhythm, Intelligent White-Space Balancing, Semantic Knitting Layouts, Automatic Diagram Emphasis, Context-Aware Typography, Chart-First Layouts, Accessibility-First Publishing, Print Intelligence, Publication Personalities). The second expanded this into a **Publishing Platform**: a *Publication Specification* as the single input, a strict **content/design separation** (switching from Luxury to Technical must never touch stitch counts, sizes, or instructions), publication *personalities* as curated collections ("Technical", "Editorial", "Luxury", "Craft", "Minimal", "Educational"), a deep component library (~50 components), chart intelligence, publication *variants* (Standard, Print Saver, Large Print, Chart Edition, Workshop Edition, Digital, Accessibility, Booklet), publication packs and a book builder, localization with semantic keys, a pre-export **QA engine**, a **mathematical integrity boundary** (publishing formats, never calculates), multi-grading rendering, live preview from the same model, a template marketplace with licensing tiers, analytics, versioning, provenance manifests, "AI proposes, the engine decides", and finally a *Publication Studio* WYSIWYG product. Its own closing advice was explicit:

> "What I'd do next is not start coding this immediately. I'd first turn this into a formal STITCH & SCALE PUBLISHING SYSTEM v2 architecture document… Then an implementation agent can build against that instead of improvising another 'PDF template feature.'"

This proposal follows that advice.

## 2. What the codebase already has (verified at `9c82f6b`)

The repository's PDF surface lives in `artifacts/stitch-and-scale/src/lib/pdf/`: `renderer.ts` (453 lines, one `renderDocument` function), `themes.ts` (171 lines), and `print-utils.ts` (120 lines). The `docs/` folder holds screenshots only.

| Old-plan capability | Current state | Assessment |
|---|---|---|
| Publication Personalities / token system | `themes.ts` — 4 themes (minimal, luxury, craft, technical) with fonts, colors, personality string, cover layout, watermark, callout tokens, table tokens | **Seed exists.** The token contract is exactly the shape the plan describes; its own header says "adding a new template = one entry to THEMES, zero new component code" — aspirational but not yet mechanically true |
| Single publishing engine (`BasePDFRenderer`) | One `renderDocument()` consuming a `RenderContext` | **Compatible shape**, but a monolith: components are hand-coded inside, not composable |
| Component library (~50 components) | None. The 23 `src/components/` files are app cards for the 19 tabs, not document components | **Absent.** YarnCard, GaugeCard, MeasurementTable, SizingTable, InstructionsSection do not exist yet |
| Content/design separation | Theming changes colors and fonts; layout logic is theme-agnostic but hardcoded | **Partial.** Colors/fonts separate cleanly; section structure does not |
| Mathematical integrity boundary | `grading-engine.ts` computes grades; the renderer consumes values it never derives | **True in practice** — this principle is already embedded, needs only codification |
| Multi-grading support | `sizingStandard` field + `resolveStandards()` exists; renderer doesn't vary output by standard | **Partial** |
| Localization | None (the Translation & Bundle tab plans *revenue* from translations, not UI or document i18n) | **Absent** |
| Publication QA engine | Only vitest suites | **Absent** |
| Publication variants | None | **Absent** |
| Books / collections / packs | None — single-pattern PDF | **Absent** |
| Licensing tiers, marketplace, white-label | No template subsystem at all | **Distant** |
| Provenance / versioning | CHANGELOG.md at repo root; pattern version not in PDF | **Absent** |

## 3. What survives, what is outdated, what to skip

The vision remains sound in its core architecture — a spec-driven renderer that never computes authoritative math is genuinely the right spine, and it already matches the code. What is outdated is the framing: the plan predates the 19-tab business suite. The app is no longer "a PDF tool that might grow a publishing system"; it is a **design studio with 19 planners and one export**. The publishing system is now one of three pillars (business intelligence, publication quality, trust/infrastructure), and should be scoped accordingly.

The six-layer marketplace ecosystem (Pattern Data → Spec → Layout Engine → Components → Templates → Collections → Marketplace) is the right long-term shape but premature now — there is no template subsystem to put collections on. AI-assisted layout should retain only the plan's own principle, "AI proposes; the deterministic engine decides", which conveniently mirrors this repository's review discipline. Interactive PDFs with embedded video should be skipped for the foreseeable future: a local-first app cannot reliably host video assets, and the plan itself concedes these are "future integration" items.

## 4. Proposed phases (anchor on what already exists)

**P0 — Codify the contract (cheap, this quarter).** No new features. Define the `PublicationSpec` TypeScript interface (identity, author, pattern, grading, measurements, materials, instructions, charts, schematics, notes, licensing, accessibility, locale, publishing preferences) that `renderDocument` consumes; re-export it as the stable API boundary. Add a one-line **provenance footer** to the existing PDF (pattern version, grading standard, template id, renderer version, date, locale) — the plan's section 22, at trivial cost, with real bug-reporting value. Write down the mathematical integrity boundary as a `docs/` rule with the grading engine as the sole authoritative source. This phase alone validates or invalidates the plan's foundation without touching business logic.

**P1 — Semantic components.** Decompose `renderDocument` into composable document components (YarnCard, GaugeCard, MeasurementTable, SizingTable, InstructionsSection, ChartBlock, SchematicBlock, Callout variants), keeping the four existing themes working throughout — an internal refactor with no user-visible change, but it is what makes "zero new component code per template" mechanically true. This is also the fix that makes the existing theme header honest.

**P2 — Variants and accessibility.** Paper formats (A4/Letter/A5), Standard vs Large Print vs Print Saver output modes from the same spec; automated contrast checks against the theme tokens. The QA engine begins here as a small, expanding checklist (missing images, chart clipping, table overflow, font availability) rather than the full nineteen-point inspection.

**P3 — Full content/design separation and live preview.** Theme-driven section layout semantics (the Semantic Knitting Layouts and Chart-First concepts become implementable once P1 exists). The project-pdf page already renders HTML in the app — reuse it as the live preview with the *same* spec model the PDF uses, honoring the plan's "no fake preview" rule.

**P4 — Collections, books, marketplace.** Multi-pattern publication packs, the book builder (front matter/chapters/back matter), licensing tiers in template metadata, and only then the marketplace layers. Deferred until the component library proves itself on real patterns.

## 5. Open research questions for the main worker

Three things this assessment could not settle from code alone. First, whether the CYC multi-standard roadmap (already hinted at by `sizingStandard` and the open S003 lineage of empty-standards fallbacks) should drive the `PublicationSpec` design now, since multi-grading rendering is cheaper when designed in. Second, which rendering substrate survives phase 3 — the current HTML-string approach versus a layout library — a decision the spec-first approach deliberately postpones but which gates the variants phase. Third, whether localization starts with document strings (pattern.materials.title-style keys) or full UI, since the two have very different cost curves and the revenue planner shows designers already think about translation income.

## 6. Suggested action

Place this document at `docs/publishing-system-proposal.md`, let the main worker react to sections 3–5 (agree/disagree on phase boundaries, research questions), and only then write the formal v2 architecture document the original plan called for. No code changes are proposed in this cycle; the repo is untouched.
