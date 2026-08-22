# Cycle 2026-08-22 · CHK-212 · Soothing recognition Pass 1

**Status:** Research-only complete. **No application code, copy strings, or storage schema was changed.**

**Source audited:** `8e64d9b218ac7e039b4b09b369109317d87b783f` (current HEAD at the time of the Pass 1 audit).

**Binding instruction:** This is the first of two independent research passes required by `docs/research/soothing-recognition-gamification-2026-08-22.md`. Pass 2 must stress-test these findings against the non-manipulative design principles, draft five-locale copy, and sketch a `useProjectStorageState`-compatible schema. No implementation ticket may be opened before Pass 2 lands.

## Executive finding

The original brief’s six touchpoints are useful hypotheses, but several are not currently truthful success events. The current application has a mixture of computed analysis, print-dialog handoff, transient UI events, and durable settings. It does **not** yet have a durable craft-recognition ledger or a trustworthy PDF-saved signal.

The safest Pass 1 conclusion is therefore:

> Recognition should attach only to already-durable, user-visible facts. A computed verdict, a print-dialog handoff, or a button click must not be treated as a completed accomplishment unless the product can prove that distinction at the current trust boundary.

## Updated touchpoint audit

| # | Hypothetical moment | Verified current signal at HEAD | Durable evidence currently available | Pass 1 conclusion |
|---:|---|---|---|---|
| 1 | First successful grade | `src/lib/grading-lab.ts:322-340` computes `LabResult.verdict` as `ready`, `review`, or `blocked`. `src/components/grading-lab-card.tsx:26-47` renders that result. The current result is a read-through analysis of the project, not a durable `grading.run` completion event. | The project’s source data is durable, but the fact that a user ran or accepted a successful grade is not recorded as a separate accomplishment. `ready` is the only clean result; `review` is not a clean success and `blocked` is a failure state. | **Viable only after Pass 2 defines the trigger narrowly as a real, clean `ready` result and avoids recognizing a mere render.** Do not use the brief’s `go` label; current code uses `ready`/`review`/`blocked`. |
| 2 | First PDF export | `src/pages/project-pdf.tsx:333-392` validates the preflight, sets the export state, sanitizes the filename, persists PDF defaults, and calls `openPrintWindow`. `src/lib/print-utils.ts:25-132` returns `{ ok: true }` when the print surface is accepted. | `openPrintWindow` owns a print-dialog handoff, not a saved-file confirmation. Its `afterprint` callback is invoked when the dialog closes, including cancellation according to the source comment. `src/components/shell.tsx:53-59,119-123` consumes `stitch-and-scale:pattern-exported` only as an ephemeral install-banner response. A publication artifact is added only inside the callback when a publication package exists, but the callback is not yet a proven save outcome. | **Not currently a truthful “successful PDF export” trigger.** The current trustworthy candidates are “preflight passed and print handoff accepted” or, after a future print-state correction, “artifact recorded with an explicit outcome.” Pass 2 must not silently equate either with a saved PDF. |
| 3 | Nth pattern graded, such as the fifth or twenty-fifth | The only nearby count is `gradedSizeCount`/`gradedCount` in `src/lib/grading-lab.ts:314-340`, which counts graded sizes in the current project. It is not a count of distinct projects with clean grading results. | No verified cross-project completion counter or grade-history record was found in the current workflow. | **Not presently triggerable without new persistence.** Pass 2 should test whether this volume milestone is necessary at all; it is less craft-specific and has a larger risk of turning the tool into a progress counter. |
| 4 | First multi-size or inclusive-sizing grade | `src/components/inclusive-sizing-card.tsx:92-129` calls `analyzeInclusiveSizing`; the result is computed from the current project and stored calculator inputs. `src/lib/inclusive-sizing-analyzer.ts:125-154` returns the analysis, effort, pricing, mods, and notes. Its audit verdict is computed at `:157-203`, with `genuinely-inclusive` requiring a score of at least five. | Inputs persist through `useProjectStorageState` under the project-scoped `incsizing` key, but there is no separate durable record that the designer completed an inclusive-sizing audit or achieved a successful graded result. The analyzer is a sizing/business analysis, not the same thing as a successful `grading.run`. | **The brief’s “inclusive-sizing grade” wording is inaccurate.** A potential milestone is “first genuinely-inclusive audit result,” but only if Pass 2 accepts that distinction and defines a non-render-only trigger. It must not claim that the pattern was graded inclusively when only the advisory analyzer ran. |
| 5 | First Project Book export | `src/pages/portfolio.tsx:168-191` requires at least one selected project, opens a popup, renders `renderProjectBookDocument`, writes the HTML, sets `bookReady`, then schedules `popup.print()`. `src/lib/project-book-export.ts:145-166` explicitly says the renderer creates print-ready HTML and does not itself write a PDF. | `bookReady` means the print surface was prepared, not that the user saved a PDF. The renderer is pure and has no persistence. Existing `src/lib/project-book-export.test.ts` coverage verifies document rendering, filename normalization, human-review content, and escaping, but not popup/print completion or durable export outcome. | **Not currently a truthful “successful Project Book export” trigger.** Treat “book print handoff prepared” as a separate operational event only if the user benefit is clear; do not call it a saved export. |
| 6 | First onboarding completion | `src/pages/onboarding.tsx:448-453` (`completeOnboarding`) sets unit, sizing standard, `onboardingCompleted=true`, and routes to `/project/new`. The skip path at `:463-476` also sets the flag, may seed sample projects, and preserves a deep link. `handleOpenSample` at `:488-498` and `handleCreateOwn` at `:500-505` also set the flag. `src/context/SettingsContext.tsx:137-168` persists settings to `localStorage`; `src/App.tsx:27-39,50-59` uses the flag to suppress the onboarding overlay on applicable entry routes. | The flag is durable and controls later app behavior. It does not prove that the user completed all seven steps: skip, open-sample, and create-own all count as completion exits. | **Viable as “onboarding finished or dismissed” rather than “completed setup.”** Pass 2 should decide whether that softer, truthful event deserves recognition and ensure it remains private, non-blocking, and non-judgmental. |

## Additional current touchpoints not explicit in the hypothesis

### Print handoff versus saved artifact

The source exposes two distinct facts that must not be collapsed:

1. `openPrintWindow` returning `ok` means the browser accepted the print surface.
2. `addPublicationArtifact` inside the PDF callback records a project artifact when a publication package exists.

The first is not a saved PDF. The second is closer to a durable project event, but the current callback is attached to `afterprint`, whose source comment includes both save and cancel. This is a release-integrity concern as well as a recognition concern. Pass 2 should either exclude PDF recognition until the state machine distinguishes cancel from save or label any event as a print handoff rather than an export completion.

### Ephemeral pattern-export event

`src/components/shell.tsx:53-59,119-123` listens for `stitch-and-scale:pattern-exported` and shows an install banner. `src/pages/project-pdf.tsx:375` dispatches it after an accepted print handoff. This is a real observable event, but it is transient UI state and is dispatched before the operating-system print interaction finishes. It must not be used as a durable milestone without a separate truthful outcome.

### Manual human-review and publication evidence

The Project Book renderer already displays human-review state and handoff evidence through `src/lib/project-book-export.ts` and its helper imports. Those facts are more aligned with the product goal than generic engagement counts, but Pass 1 did not convert them into recognition proposals. Pass 2 should consider whether an explicitly recorded human-review approval or publication-package handoff is a better craft-control milestone than an arbitrary Nth-pattern count. Any such event must remain grounded in a user-entered or already-recorded project state, not inferred from viewing a page.

## Persistence and localization findings

The application already has appropriate storage seams for a future implementation: app-level settings in `SettingsContext` and project-scoped state through `useProjectStorageState`. No new server persistence is needed for the research conclusion. However, no recognition schema should be designed until Pass 2 has narrowed the event vocabulary and applied the no-loss/no-pressure test.

The current code localizes the analyzed surfaces through the existing copy modules and `useSettings().t` patterns, but the recognition layer does not yet exist. Pass 2 must produce all five locale strings (`en`, `de`, `fr`, `es`, `pt`) before any code is opened.

## Tests and evidence reviewed

- `src/lib/project-book-export.test.ts` verifies pure render output, filename safety, review content, and escaping; it does not prove browser print completion.
- `src/pages/onboarding-footer-spacing.test.ts` covers mobile footer layout only; it does not prove onboarding semantics.
- The current source audit found no existing achievement/title/badge/streak/milestone system to reuse.

## Pass 1 decision and hold

**Research-only outcome:** the six candidates are not all implementation-ready. Candidate 1 and candidate 6 are the strongest survivors, but both require precise wording. Candidates 2 and 5 are blocked as “successful export” events until print outcome semantics improve. Candidate 3 has no current durable trigger and should not be added merely to create engagement. Candidate 4 must be renamed from “inclusive-sizing grade” to an accurately computed inclusive-audit event, if it survives Pass 2.

**Implementation hold:** do not add UI, copy, storage, toast logic, counters, or schema from this note. The next scheduled firing must run Pass 2 independently, apply every design principle in §4 of the research brief, draft the smallest viable five-locale copy, and produce a storage-schema sketch. Only after that note is committed may a narrow implementation queue item be opened.

**Protected files:** `/home/ubuntu/first_novel_invention_brief.md` and the product-goal documents were not modified by this research pass.

## Source files read

- `src/lib/grading-lab.ts`
- `src/components/grading-lab-card.tsx`
- `src/pages/project-pdf.tsx`
- `src/lib/print-utils.ts`
- `src/components/shell.tsx`
- `src/components/inclusive-sizing-card.tsx`
- `src/lib/inclusive-sizing-analyzer.ts`
- `src/pages/portfolio.tsx`
- `src/lib/project-book-export.ts`
- `src/lib/project-book-export.test.ts`
- `src/pages/onboarding.tsx`
- `src/context/SettingsContext.tsx`
- `src/App.tsx`
- `src/pages/onboarding-footer-spacing.test.ts`

## Next required artifact

`docs/leader-notes/cycle-<next-firing>-CHK-213-soothing-recognition-pass2.md`

That note must remain research-only and must not be replaced by an implementation commit.

---

*Prepared as an evidence log, not a feature specification.*
