# A-007 Cover Overflow Resolution Proposal

**Branch:** `milestone/cover-overflow-resolution`  
**Source branch:** `milestone/release-trust-and-records` at `2e40c94`  
**Status:** Decision proposal; no renderer implementation is included in this branch.  
**Author:** Manus AI

## Decision required

A-007 is the only confirmed blocking publication defect in the current release-candidate evidence. Long variable-height cover content can cross the fixed footer safe area on the craft cover. The current deterministic guard correctly blocks the affected artifact, but the guard does not change pagination or repair the layout.

The owner/designer must select one cover policy before publication certification:

| Policy | Description | Strength | Cost or risk | Recommendation |
|---|---|---|---|---|
| **Cover pagination** | Allow the cover content block to flow to a second cover page when its measured content exceeds the safe area, keeping the footer outside the content region. | Preserves designer-authored content and avoids silent truncation. | Requires careful page-count, contents, theme, locale, and long-text regression work. | **Preferred long-term policy.** |
| **Optional-note relocation** | Keep title and metadata on page 1, move the long designer note to a dedicated Pattern Notes page or the materials section. | Keeps the cover visually stable and preserves the note. | Changes information architecture and may affect the meaning of “cover note.” | Strong short-term alternative if notes are optional. |
| **Content limit with explicit editor feedback** | Enforce a documented title/note limit and ask the designer to shorten content before export. | Smallest implementation and predictable page count. | Places editing burden on the designer and risks losing useful context. | Acceptable only if limits are visible, localized, and editable. |
| **Dynamic copy fitting** | Reduce title or note size to fit the safe area. | Keeps one page without changing content placement. | Can create illegible or visually inconsistent output, especially across locales. | **Not recommended** as the default. |
| **Silent clipping or overlap tolerance** | Leave the current fixed-height cover and rely on the guard or user judgment. | No implementation work. | Produces an unsafe publication artifact and contradicts the release boundary. | **Reject.** |

## Evidence and technical basis

The current renderer uses a fixed-height cover with `overflow:hidden` and an absolutely positioned footer. That layout cannot safely absorb arbitrary title wrapping and note expansion without either allocating a second page, moving the note into normal document flow, or enforcing an explicit content budget. A character threshold is useful as a conservative preflight guard but is not a measurement of rendered height.

CSS paged-media guidance treats page breaks as a relationship among the preceding element’s `break-after`, the following element’s `break-before`, and the containing element’s `break-inside`. Forced breaks take precedence over avoid rules, and `break-before: page` is the standards-aligned mechanism for starting a new printed page [1]. The W3C paged-media task inventory also identifies page templates, running headers and footers, page breaks, copyfitting, and alternative layouts as separate concerns rather than one universal overflow rule [2].

> A correct grade and a rendered PDF are necessary but insufficient evidence for a publishable knitwear pattern. Physical print, chart scale, and test knitting remain separate release gates.

## Recommended implementation sequence

The first implementation should be a **cover-pagination feature in a separate branch**, not an edit to the protected renderer in this release-candidate branch. It should compose the existing cover layouts or add an adjacent template seam, then prove the behavior through generated HTML and PDF artifacts before the owner considers merging it.

The future implementation should keep the current A-007 guard as a safety net during development. It should introduce a deterministic cover layout result with at least these outcomes: `single-page-safe`, `requires-second-cover-page`, and `blocked-invalid-content`. The result should include the source project ID, locale, theme, title length, note length, measured or estimated content budget, and the selected layout policy. It must not mutate the pattern model or silently truncate designer-authored content.

If the owner chooses optional-note relocation instead, the first implementation should add a dedicated notes block using normal document flow and a deliberate page boundary, then verify that the cover remains stable while the note is preserved elsewhere. If the owner chooses a content limit, the limit must be localized in all five supported locales and surfaced before print/download, with an explicit reason and a path to shorten the content.

## Acceptance matrix for the future implementation

| Test dimension | Required evidence |
|---|---|
| Themes | Technical, minimal, luxury, and craft covers. |
| Locales | `en`, `de`, `fr`, `es`, and `pt`, including expansion-heavy German and French strings. |
| Content | Short title/note, title near the current threshold, long title, long note, and both long together. |
| Print output | PDF page count, no blank pages, no footer collision, correct cover hierarchy, contents-page consistency. |
| Metadata | Stable filename, source project ID, locale, template ID, renderer version, and policy result. |
| Mobile preview | No horizontal overflow, readable warning, reachable action, and no hidden decision state. |
| Human review | Full-resolution cover inspection plus physical print and at least one representative test knit before certification. |
| Regression | Existing normal sample remains unchanged and does not trigger a false block. |

## Branch disposition

This branch is intentionally a **decision and implementation-contract branch**, not a publication-ready fix. It does not touch `src/lib/pdf/renderer.ts`, `src/lib/grading-engine.ts`, the PDF export hook, the tab registry, or the canonical project data shapes. It should remain unmerged until the owner selects a policy and the future implementation produces full-resolution long-text evidence.

## References

[1]: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/break-before "MDN Web Docs — break-before CSS property"

[2]: https://www.w3.org/Style/2013/paged-media-tasks "W3C — Paged Media Tasks"

## Conservative budget-analysis implementation on this branch

This branch now carries a pure, renderer-independent A-007 budget analysis. The inspector accepts optional theme and locale context from publication preflight and reports the normalized theme, locale, title count, cover-text count, effective title limit, effective cover limit, individual risk flags, and final `safe` or `blocked` status. The model uses conservative theme tiers and applies a small expansion factor for supported locales; it is a guardrail, not a measurement of rendered CSS height.

The current thresholds are intentionally asymmetric: craft remains at the observed 90-character title / 950-character cover budget, luxury is stricter because its title treatment is larger and more vertically spaced, and minimal/technical have slightly wider title allowances but conservative cover-text caps. The A-007 error now identifies the theme/locale and the exceeded budget component, which makes the designer decision more actionable while preserving the existing blocking behavior.

The regression matrix covers all 20 locale-theme combinations. The representative short title `Classic Crew Neck Sweater` remains safe in every combination; a 130-character stress title blocks in every combination. Focused artifact/publication tests pass with **17 tests**, and the complete branch gate passes with **146 test files / 2,033 tests**, typecheck, production build in 9.64 seconds, `git diff --check`, and all nine mobile-smoke checks.

This is still not a pagination fix. The budget model reduces context-free warnings and creates traceable evidence for the eventual cover-pagination or note-relocation implementation, but the owner’s policy decision remains required.

## Localized designer-facing budget detail

The export preflight panel now surfaces the structured A-007 budget breakdown when the cover guard blocks. The message includes the selected theme, normalized locale, title characters versus title limit, and cover characters versus cover limit. The detail is formatted through the existing five-locale PDF label registry rather than exposing the inspector’s English diagnostic directly. It is rendered as an alert-adjacent, readable detail line beside the existing cover guidance and does not alter the export gate.

The localization contract now passes for all supported locales. The complete branch gate remains green at **146 test files / 2,033 tests**, typecheck, production build in 8.87 seconds, `git diff --check`, and all nine mobile-smoke checks. The normal sample does not trigger the panel, while a blocked artifact receives actionable context about which budget was exceeded.
