# Release-Candidate Artifact Audit — Initial Findings

**Branch:** `milestone/release-trust-and-records`  
**Commit under audit:** `0cb1091`  
**Source:** local Vite preview and isolated Chromium print conversion  
**Review date:** 18 August 2026

## Artifact matrix

The extraction harness generated **20 representative HTML artifacts**: five locales (`en`, `de`, `fr`, `es`, `pt`) multiplied by four themes (`technical`, `minimal`, `luxury`, `craft`). Headless Chromium converted all 20 artifacts to PDFs. Every artifact produced six pages, with non-zero PDF bytes and extracted text.

| Review area | Current observation | Disposition |
|---|---|---|
| Cover hierarchy | The reviewed English covers retain stable title, designer, gauge, base-size, yarn, and footer hierarchy across craft, luxury, minimal, and technical themes. | Verified for reviewed fixtures. |
| Locale expansion | German, French, Spanish, and Portuguese covers render with translated headings and metadata; no obvious cover-level clipping appeared in the contact sheet. | Needs long-text and typography review at full resolution. |
| Interior page breaks | Contents, Materials & Gauge, and section pages occupy deliberate page boundaries. The 20 generated PDFs all report six pages. | Verified for the sample fixture; not universal proof. |
| Dense grading tables | The reviewed tables remain inside page margins and repeat the visual theme; no obvious overlap or blank page was visible in the contact sheet. | Requires full-resolution table and print-size review. |
| Technical theme | Blueprint grid and footer remain visible on reviewed pages; page 6 contains the expected technical treatment rather than an empty artifact. | Verified for reviewed fixture. |
| Blank-page risk | No blank PDF page was observed in the six-page sample matrix. | Verified for reviewed fixture; keep automated page-content check. |

## Limits of this pass

The contact sheets are screening evidence, not a substitute for full-resolution print review. They do not prove chart readability, schematic scale, tagged-PDF accessibility, physical print contrast, or successful test knitting. The next inspection pass should compare full-resolution page crops, extracted text by page, and long translated strings against the mobile preview and the technical-editor defect ledger.

## Full-resolution interior review

A full-resolution French Materials & Gauge page preserved translated headings and wrapped the localized grading note without clipping. The sample’s explanatory sentence remains English because the underlying pattern notes are source content rather than export UI labels; this is not automatically a localization defect and should be reviewed as designer-authored content.

A full-resolution English technical-theme Body table kept all nine size columns visible, aligned, and inside the page margins. The footer remained separated from the table. The table is technically legible at the rendered page resolution, but a physical print or mobile zoom review is still required for small text and chart-scale confidence.

## Confirmed long-text defect

The long-title and long-note stress artifact exposes a **blocking publication defect** in the craft cover layout. The title wraps to six lines and the deliberately long designer-authored note extends into the fixed footer region; the footer text and cover content visibly collide at the bottom of page 1. The contents page remains structurally intact, so the defect is localized to variable-height cover content rather than a global blank-page or page-count failure.

| Field | Finding |
|---|---|
| Code | `A-007` proposed follow-up; current preflight does not yet detect this condition. |
| Severity | `error` for publication when a cover’s variable content crosses the footer safe area. |
| Source | Artifact visual inspection, long-title/long-note stress fixture. |
| Affected surface | Craft cover at minimum; all cover layouts require the same stress matrix. |
| Disposition | `needs-designer-decision` for whether to add cover pagination or clamp/relocate optional notes; `verified` as a reproducible layout defect. |
| Required next action | Add deterministic cover-content budgeting or a second cover page for overflow, then add full-resolution page-image regression evidence. |

## Release-candidate verification update

The proposed `A-007` guard is now implemented in `src/lib/pdf/artifact-inspection.ts`. It emits a blocking error when the cover title exceeds 90 characters or when stripped cover content exceeds 950 characters. The thresholds are intentionally conservative and are not a pagination fix: they prevent a designer from treating a visibly colliding cover as ready for review while leaving future cover-pagination or safe-area layout work for a separate change.

The regression fixture now confirms that a title above the threshold makes `readyForReview` false and emits an `A-007` error. TypeScript typechecking passed, the artifact-inspection and publication-quality suites passed with **13 tests**, and the expanded browser smoke suite passed against the normal sample project. The normal sample title, `Classic Crew Neck Sweater`, does not trigger `A-007`; the guard therefore does not reject the representative short-title artifact.

The confirmed defect is recorded in `docs/audits/release-defect-ledger-2026-08-18.json` with stable identity, evidence paths, severity `error`, status `open`, and disposition `needs-designer-decision`. No source renderer was changed. The long-text contact-sheet evidence remains at `/tmp/stitch-and-scale-release-images/long/en-craft-long-1.png`, and the deterministic artifact metrics remain at `/tmp/stitch-and-scale-release-pdfs/metrics.tsv` and `/tmp/stitch-and-scale-release-pdfs/audit-report.json`.

## Local record backup and recovery verification

Operational records were exercised at both the pure engine seam and the browser persistence seam. CSV export contains all four record families—samples, test-knits, submissions, and wholesale orders—with stable record IDs. A versioned JSON serialization and restore path now rejects malformed payloads and payloads belonging to another project. The operational-record test suite passed **5 tests**, including a round-trip recovery assertion.

The mobile smoke runner also added a project-scoped sample, verified the `projectStorage` payload, reloaded the project, reopened All Labs and Design Ledger, and confirmed that the sample was visible after recovery. This passed as part of the complete smoke run. The current release evidence establishes reliable local persistence and machine-readable backup at the engine seam; a polished user-facing file-picker import flow remains a follow-up product decision rather than an unverified release claim.

## Final release disposition

| Area | Evidence | Disposition | Release implication |
|---|---|---|---|
| Representative locale/theme artifact matrix | 20 HTML artifacts and 20 six-page PDFs across `en`, `de`, `fr`, `es`, and `pt` with four themes | **Verified** for the reviewed fixture matrix | No observed blank pages, language-tag failures, or English export-label leakage in this pass. |
| Normal sample cover budget | A-007 unit regression plus browser smoke on `Classic Crew Neck Sweater` | **Verified** | The conservative guard does not block the normal short-title sample. |
| Long variable-height cover content | Full-resolution stress evidence and A-007 blocking preflight | **Needs-designer-decision** | Do not publish affected long-text covers until pagination, relocation, or content limits are selected. |
| Operational records persistence | Five engine tests plus browser add/reload/reopen smoke path | **Verified** | Records survive reload through the project-scoped local storage seam. |
| Operational record recovery UX | Versioned engine restore path is tested; no file-picker import UI is exposed yet | **Needs-designer-decision** | Treat JSON restore as an internal seam until a user-facing backup/import flow is specified. |
| Physical print contrast, chart readability, and test knitting | Not deterministically established by HTML/PDF inspection alone | **Requires-test-knit** | A physical print and at least one representative test knit remain required before publication certification. |

## Release gate results

| Gate | Result |
|---|---|
| Typecheck | Passed after A-007 and backup/recovery changes. |
| Artifact and publication focused tests | Passed: 13 tests. |
| Operational-record tests | Passed: 5 tests. |
| Mobile smoke | Passed all eight journeys, including operational-record persistence and recovery. |
| Full regression, production build, and whitespace check | Passed: 142 test files / 2,013 tests, typecheck, production build, and `git diff --check`. |

## Merge hold

This branch remains intentionally **unmerged and without a new pull request**. PR #71 remains untouched for owner review. The release-candidate branch should remain on hold until the owner selects a cover overflow policy, reviews the defect ledger, and supplies physical print/test-knit evidence for publication certification.
