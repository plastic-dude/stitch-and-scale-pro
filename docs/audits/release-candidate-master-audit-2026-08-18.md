# Stitch & Scale — Canonical Release-Candidate Master Audit

**Repository:** [`plastic-dude/stitch-and-scale-pro`](https://github.com/plastic-dude/stitch-and-scale-pro)  
**Active branch:** [`milestone/release-trust-and-records`](https://github.com/plastic-dude/stitch-and-scale-pro/tree/milestone/release-trust-and-records)  
**Current audited commit:** [`32465cb`](https://github.com/plastic-dude/stitch-and-scale-pro/commit/32465cb5d875fbb829ef33f4a74ef98c41bc9707)  
**Review date:** 18 August 2026  
**Author:** Manus AI  
**Canonical status:** This is the single maintained narrative audit for the release-candidate branch. Future milestone findings, gate results, decisions, and limitations must be appended here rather than distributed across new narrative audit files.

> **Current release decision:** Keep the branch unmerged and do not open a new pull request. PR #71 remains untouched for owner review. The branch has strong deterministic QA, publication-preflight, local-first record, backup, recovery, and mobile evidence, but publication certification still requires an owner decision on the A-007 cover-overflow policy plus physical print and test-knit evidence.

## 1. Executive summary

Stitch & Scale is a local-first knitwear pattern grading and publishing tool for independent designers. The release-candidate branch extends the Pattern QA and publication-preflight foundation from PR #71 into a broader operating layer: artifact-level PDF inspection, a technical-editor defect ledger, operational records for samples and test knits, submissions and wholesale follow-up, project-scoped mobile lab discovery, CI evidence, and progressively hardened backup and restore workflows.

The branch now has a **versioned project-wide workspace backup** containing patterns, settings, and project-scoped operational records. Settings restore is non-destructive by default and presents project and record counts, settings inclusion, creation timestamp, and legacy-file status before requiring an explicit merge confirmation. Operational-record restore remains separately project-scoped and uses its own versioned envelope with stable IDs and inline replacement confirmation.

The principal unresolved release defect is **A-007**: long variable-height cover content can cross the fixed footer safe area in the craft cover. A conservative preflight guard blocks affected artifacts, but it is not a pagination fix. The designer/editor must decide whether the future policy is cover pagination, note relocation, content limits, or another safe-area treatment.

## 2. Branch, PR, and protected boundaries

| Item | Current state |
|---|---|
| Expansion branch | `milestone/release-trust-and-records` |
| Latest audited commit | `32465cb` — versioned workspace-backup envelopes |
| Remote synchronization | Local HEAD equals `origin/milestone/release-trust-and-records`. |
| New pull request | None; intentionally not opened. |
| PR #71 | Open and untouched for owner review. |
| Protected files | `src/lib/pdf/renderer.ts`, `src/lib/grading-engine.ts`, the PDF export hook, and the tab registry were not modified by the audited expansion work. |
| Dependency policy | No unrelated dependencies, analytics, watermarks, cloud sync, background jobs, or payment behavior were added. |
| Persistence policy | New project data uses the existing `projectStorage<T>` seam; canonical project snapshots use the storage layer already established by the repository. |
| Localization policy | New user-facing copy on the audited surfaces is supplied for `en`, `de`, `fr`, `es`, and `pt`. |

The Vercel preview used during the original audit was behind a Vercel login wall, and the configured Chrome DevTools MCP session failed to create a browser window. The visual audit therefore continued against the local Vite preview using isolated Chromium/CDP screenshots. No public deployment or destructive action was performed.

## 3. Consolidated delivery chronology

### 3.1 PR #71 foundation and ten-workstream follow-up

PR #71 established deterministic Pattern QA and publication preflight. The follow-up work corrected browser-locale normalization, warning propagation, stale or partial grading detection, mobile scroll ownership, export decision order, localization leakage, and ambiguous ledger attribution. Its original full gate reached **138 test files / 1,996 tests**, with typecheck, build, whitespace, and mobile smoke passing.

The ten-workstream follow-up then delivered maintainer review, cross-viewport audit, Pattern QA, publication preflight, localization, mobile maker workflows, craft-business ledger hardening, browser regression coverage, PR documentation, and a next-milestone roadmap. Technical editing was kept distinct from test knitting, and deterministic source checks were not treated as proof of physical pattern success.

### 3.2 Expansion branch: release trust and records

The expansion branch added the following capabilities:

| Workstream | Delivered capability | Evidence boundary |
|---|---|---|
| Artifact inspection | Pure HTML artifact inspection for empty output, title/headings, image alt attributes, tables, pagination markers, and cover-content budget. | Evidence about rendered HTML and print conversion; not a claim of tagged-PDF accessibility or physical print quality. |
| A-007 preflight guard | Blocking cover budget warning when title exceeds 90 characters or stripped cover content exceeds 950 characters. | Prevents an affected artifact from being treated as ready; does not implement pagination. |
| Technical-editor defect ledger | Project-scoped persistent ledger with QA import, de-duplication, affected sizes, evidence, reproduction, location, status, disposition, and summary counts. | Keeps verified defects separate from designer decisions and test-knit evidence. |
| Operational records | Samples, test knits, submissions, and wholesale orders with stable identities, statuses, dates, notes, and CSV export. | Recorded operational history; not accounting automation, tax treatment, or reconciliation. |
| Operational backup | Versioned project-scoped JSON backup with stable IDs, source timestamp preview, wrong-project rejection, and inline replacement confirmation. | Portable local record recovery for one active project. |
| Workspace backup | Versioned project-wide envelope containing projects, settings, and operational records keyed by project ID. | Point-in-time snapshot; not synchronization or cloud durability. |
| Workspace restore preview | Fail-closed preview of project count, record count, settings inclusion, creation timestamp, legacy status, and non-destructive merge warning. | No storage mutation occurs on file selection; merge occurs only after explicit confirmation. |
| Mobile lab navigation | Localized search across registry-backed labels and project-scoped recent history. | Desktop grouped navigation remains intact. |
| CI evidence | GitHub Actions quality workflow for typecheck, full Vitest, build, Chromium mobile smoke, and screenshot/log artifacts. | CI automation evidence; physical print and test knitting remain human gates. |

## 4. Mobile-maker audit

The mobile audit covered onboarding, dashboard, new project, sample workspace, All Labs, Grading Lab, PDF export, Design Ledger, and operational records. The target matrix includes 320×568, 360×800, 390×844, 430×932, and 844×390 landscape.

The initial dominant defect was competing scroll ownership: duplicate scrollbar tracks and a sticky footer covering content at 320px and in landscape. The onboarding shell was corrected to lock document and body scrolling while the dialog is mounted, constrain the inner content owner, use overscroll containment, and reserve safe-area-aware footer clearance. After the fix, the duplicate outer scrollbar was gone at compact portrait and landscape sizes, although a later dedicated short-height landscape refinement remains possible.

The dashboard and workspace achieved no-horizontal-overflow checks. The mobile audit identified smaller follow-up opportunities including a low-size dismiss target on the local-storage notice, the disabled new-project Next button before its later 44px hardening, dense All Labs discovery, export filename and accent-control hit areas, and the need to keep readiness status before template scanning. The implemented branch added search and recent history to address the All Labs density problem.

The Design Ledger remains project-scoped, reads Receipt Lab as a read-only sales source of truth through `projectStorage`, distinguishes recorded receipts/refunds from excluded quotes, and refuses ambiguous fuzzy attribution. The added operational-record card keeps samples, test knits, submissions, and wholesale follow-up separate from the expense ledger rather than overloading the existing expense schema.

## 5. Publication artifact audit

The artifact harness generated **20 representative HTML artifacts**: five locales (`en`, `de`, `fr`, `es`, `pt`) multiplied by four themes (`technical`, `minimal`, `luxury`, `craft`). Chromium converted all 20 to PDFs. Each produced six pages, non-zero bytes, and extracted text. The screening matrix showed no blank pages, language-tag failures, or obvious English export-label leakage in the reviewed fixtures.

Full-resolution review preserved translated headings on a French Materials & Gauge page and kept all nine English technical-theme Body table columns inside the page margins. These are screening results, not universal proof. Tagged-PDF accessibility, physical print contrast, chart and schematic scale, and successful test knitting remain outside deterministic HTML/PDF evidence.

### A-007 confirmed defect

A long-title and long-note stress artifact exposed a blocking craft-cover defect: variable-height content crossed into the fixed footer region on page 1. The contents page remained structurally intact, so the failure is localized to cover safe-area budgeting rather than a global pagination or blank-page problem.

| Field | Current value |
|---|---|
| Code | `A-007` |
| Severity | `error` for publication when cover content crosses the footer safe area |
| Affected surface | Craft cover at minimum; all cover layouts require the same stress matrix |
| Evidence | `/tmp/stitch-and-scale-release-images/long/en-craft-long-1.png`; `/tmp/stitch-and-scale-release-pdfs/en-craft-long.pdf` |
| Reproduction | Render a title longer than 90 characters with a long description, then convert the HTML preview to a letter PDF with Chromium. |
| Status | `open` |
| Disposition | `needs-designer-decision` |
| Owner | `designer/editor` |
| Current mitigation | A-007 blocking preflight guard in `artifact-inspection.ts`. |
| Future fix boundary | Cover pagination, note relocation, or explicit content limits; do not modify the protected renderer as an expedient fix. |

The normal representative project, `Classic Crew Neck Sweater`, remains below the conservative thresholds and is not blocked by A-007.

## 6. Operational records and local recovery

Operational records cover four separate families: samples, test knits, submissions, and wholesale orders. Each record retains a stable ID and project ID. CSV export includes type, ID, project ID, primary party/name, status, date, amount, currency, location or terms, and notes. The workflow distinguishes recorded history from calculated estimates, planned activity, or unverified information.

The project-scoped JSON operational backup uses the `stitch-and-scale-operational-records` kind and version `1`. It preserves the source `updatedAt` for preview, normalizes the restored collection with a fresh local update timestamp after confirmation, and rejects malformed JSON, the wrong kind or version, wrong project identity, missing collections, and invalid timestamps. Restore is never an implicit overwrite: the user sees the active project, source backup date, total records, per-family counts, and replacement warning before choosing cancel or confirm.

The browser smoke journey adds an operational sample, verifies its `projectStorage` payload, reloads the project, reopens All Labs and Design Ledger, and confirms that the sample survives recovery. Focused engine tests cover stable IDs, CSV families, JSON round-trip, project scoping, corrupt and foreign-project rejection, preview metadata, and timestamp validation.

The operational backup is a portable local record path, not a cloud-sync system, accounting system, tax tool, reconciliation engine, or physical publication certificate. CSV remains the better format for accounting review; JSON is intended to be app-readable and should not be hand-edited casually.

## 7. Project-wide workspace backup contract

The canonical workspace snapshot now has this shape:

```json
{
  "kind": "stitch-and-scale-workspace-backup",
  "version": 1,
  "createdAt": "ISO-8601 timestamp",
  "projects": [],
  "settings": {},
  "operationalRecords": {
    "project-id": {}
  }
}
```

Every Settings-page export and the always-visible quick-backup path uses the canonical live-store snapshot. Operational records are included by project ID, so the project-wide backup contains patterns, settings, and operational history rather than only the project list.

| Contract rule | Behavior |
|---|---|
| New export | Emits explicit kind, version `1`, and ISO creation timestamp. |
| Legacy unwrapped backup | Accepted for recovery and labeled legacy in the preview. |
| Wrong kind or unsupported version | Rejected before preview or mutation. |
| Invalid timestamp | Rejected before preview or mutation. |
| Malformed operational partition | Rejected before preview or mutation. |
| File selection | Creates pending preview state only; no storage mutation. |
| Merge confirmation | Adds genuinely new projects and their records; existing project IDs remain workspace truth. |
| Replace mode | Installs incoming projects, removes orphaned operational keys, and restores valid incoming records. |
| Settings | Merged additively under the established policy. |
| Backup ledger | Records payload size including operational records. |

The workspace restore preview is localized across all five supported locales. It shows project count, operational-record count, settings inclusion, creation timestamp for versioned files, legacy status where applicable, and the non-destructive merge warning. The explicit Cancel and Merge actions are minimum 44px mobile controls.

## 8. Consolidated defect and release disposition

The machine-readable defect ledger remains at [`docs/audits/release-defect-ledger-2026-08-18.json`](./release-defect-ledger-2026-08-18.json). Its current stable entry is summarized below.

| Area | Evidence | Disposition | Release implication |
|---|---|---|---|
| Locale/theme artifact matrix | 20 HTML artifacts and 20 six-page PDFs across five locales and four themes | **Verified for reviewed fixtures** | No observed blank pages, language-tag failures, or English export-label leakage in this pass. |
| Normal sample cover budget | A-007 regression and browser smoke on `Classic Crew Neck Sweater` | **Verified** | Conservative guard does not block the normal sample. |
| Long variable-height cover content | Full-resolution stress image, PDF, defect ledger, and A-007 blocking preflight | **Needs-designer-decision** | Do not publish affected long-text covers until the safe-area policy is selected. |
| Pattern QA and publication preflight | Deterministic engine tests and export-panel evidence | **Verified for source checks** | Does not certify physical print, tagged-PDF accessibility, or successful test knitting. |
| Operational-record persistence | Engine tests and browser add/reload/reopen journey | **Verified** | Records survive reload through the project-scoped local seam. |
| Operational-record backup and restore | Versioned engine contract, project preview, inline confirmation, CSV and JSON paths | **Verified for local recovery** | Does not imply cloud durability or accounting reconciliation. |
| Workspace backup and restore | Versioned envelope, fail-closed inspector, localized preview, merge tests, Settings smoke checkpoint | **Verified for local snapshot workflow** | Snapshot is point-in-time; it is not synchronization. |
| Physical print contrast, chart readability, and test knitting | Not deterministically established by HTML/PDF inspection | **Requires-test-knit** | Physical print and at least one representative test knit remain required for publication certification. |

## 9. Current verification ledger

| Gate | Latest result at commit `32465cb` |
|---|---|
| Full Vitest regression | **144 test files / 2,021 tests passed** |
| TypeScript typecheck | **Passed** |
| Production build | **Passed**; Vite completed in 9.44 seconds. The existing large-chunk advisory remains informational. |
| Whitespace | **Passed** with `git diff --check`. |
| Mobile smoke | **Passed** with nine journeys: onboarding matrix, dashboard, new project, sample workspace, export preflight, Grading Lab QA/defect ledger, lab search/recent history, Design Ledger operational recovery, and Settings project-wide backup controls. |
| Protected-file guard | **Passed**; no renderer, grading engine, export hook, or tab-registry change. |
| Pull-request guard | **Passed**; no new PR opened and PR #71 not merged or modified. |

Supporting evidence includes `/tmp/stitch-and-scale-release-pdfs/metrics.tsv`, `/tmp/stitch-and-scale-release-pdfs/audit-report.json`, `/tmp/stitch-and-scale-release-images/contact-sheet.png`, `/tmp/stitch-and-scale-release-images/interior/interior-contact-sheet.png`, and `/tmp/stitch-and-scale-release-images/long/en-craft-long-1.png` while the sandbox evidence remains available.

## 10. Honest release boundaries

The audited branch can claim deterministic Pattern QA and publication-preflight checks, visible readiness status, localized audited UI surfaces, project-scoped local persistence, portable operational-record recovery, versioned project-wide snapshots, and repeatable mobile smoke evidence.

It must not claim tagged-PDF accessibility, print-perfect pagination, physical print contrast, chart or schematic correctness at every size, successful test knitting, tax treatment, automatic reconciliation, cloud sync, background execution, money movement, or universal coverage of all future localized long-text combinations. Technical editing is distinct from test knitting: a correct grade and a clean artifact inspection are necessary but not sufficient for a publishable knitwear pattern.

## 11. Merge hold and owner decisions

Keep the branch intentionally unmerged. Before publication certification, the owner should review the changed-file set and choose the A-007 policy: cover pagination, relocation of optional notes, a content limit, or another safe-area solution. The owner should also review the defect ledger, inspect the long-text evidence, and supply physical print and test-knit evidence.

The next implementation milestone must update this master document rather than create a parallel narrative audit. Each update should append the commit, scope, changed behavior, tests, smoke evidence, limitations, and any changed release disposition. Structured JSON ledgers and raw images/metrics remain supporting evidence, not replacement narratives.

## 12. Consolidated source register

The following existing documents were incorporated into this master audit: the mobile-maker audit, the PR #71 maintainer review, the ten-workstream delivery report, the release-trust milestone review, the release-candidate artifact audit, and the operational-record backup and restore audit. They remain in the repository as historical source artifacts for traceability; this file is the canonical document to read and update going forward.

Unrelated leader notes, proposals, research memos, skill-source files, and roadmap documents were not copied wholesale because they are not release-candidate audit evidence. They remain independent planning or research material.

## References

[1]: https://developer.mozilla.org/en-US/docs/Web/API/Blob "MDN Web Docs — Blob"

[2]: https://developer.mozilla.org/en-US/docs/Web/API/FileReader/readAsText "MDN Web Docs — FileReader: readAsText() method"

[3]: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API "MDN Web Docs — IndexedDB API"

[4]: https://www.section508.gov/create/pdfs/common-tags-and-usage/ "Section 508 — Common PDF Tags and Their Usage"

[5]: https://www.adobe.com/acrobat/hub/create-a-mobile-friendly-pdf.html "Adobe — How to create a mobile-friendly PDF"

[6]: https://knitjulep.com/knitting-technical-editing-services/ "Knit Julep — Technical Editing for Knitting"

[7]: https://www.midnightpurl.com/pricing-services "Midnight Purl — Technical Editing and Grading Services"

[8]: ../record-keeping-gap-map.md "Stitch & Scale record-keeping gap map and cited research"

## 13. Release-evidence checklist milestone

The Grading Lab now includes a project-scoped **Release evidence** checklist immediately after the Pattern QA summary and technical-editor defect ledger. It records four evidence categories separately from deterministic QA: physical print review, chart readability, schematic scale, and test knit. Each category has an explicit status—`not-started`, `in-review`, `passed`, or `blocked`—plus a note and evidence reference. The checklist persists through `projectStorage<T>` and is validated against the active project ID before hydration.

The checklist deliberately does not change the automated publication-preflight gate. It instead makes the remaining human and physical evidence boundary visible, actionable, and durable. Certification readiness is reported only when all four categories are marked `passed`; any `in-review`, `blocked`, or `not-started` item keeps the checklist visibly not ready. This prevents a rendered PDF or mathematically valid grade from being mistaken for physical print or test-knit proof.

All new checklist copy exists in `en`, `de`, `fr`, `es`, and `pt`. The mobile smoke suite verifies the checklist appears in Grading Lab at 390px, includes the physical-print evidence item, and does not introduce horizontal overflow. The readiness badge was corrected after diagnostic smoke found a 416px unwrapped localized badge; it now wraps within the card width.

| Evidence category | What the checklist records | What it cannot claim by itself |
|---|---|---|
| Physical print review | Printed-page observation and evidence reference. | Universal print contrast or every paper/printer combination. |
| Chart readability | Human review of charts at intended reading scale. | That every chart instruction is technically correct without editing. |
| Schematic scale | Human review of schematic dimensions and usable scale. | That the garment fits a real body. |
| Test knit | Knitter, note, and evidence reference recorded as a separate handoff. | That every size or edge case has been tested. |

The updated release gate passed with **146 test files / 2,026 tests**, typecheck, production build in 9.37 seconds, `git diff --check`, and all nine mobile-smoke checks. The Vite large-chunk warning remains informational. No protected renderer, grading engine, PDF export hook, or tab-registry file was modified.

## 14. Full project-scoped record snapshot milestone

The project-wide workspace backup now includes all release-relevant project-scoped records, not only operational records. New exports capture `operationalRecords`, `technicalDefects`, and `releaseEvidence` maps keyed by project ID, alongside projects and settings. This closes the previous portability gap in which a workspace backup could restore the pattern and business records while omitting technical-editor findings or human release-evidence status.

The restore inspector validates the new maps before preview. Technical-defect ledgers must carry the matching project ID, version `1`, a defects array, and an update timestamp. Release-evidence checklists must carry the matching project ID, version `1`, an items object, and an update timestamp. In merge mode, these records restore only for genuinely new projects; an existing project remains workspace truth, including its current defects and release-evidence checklist. Replace mode removes orphaned operational, technical-defect, and release-evidence partitions before restoring incoming records for landed projects.

The Settings preview now shows project count, operational-record count, technical-defect count, release-evidence item count, settings inclusion, creation timestamp, and legacy status before confirmation. All new labels are localized across the five supported locales. Storage regression coverage verifies export, merge collision preservation, new-project restore, replace cleanup, and the expanded preview counts.

The updated release gate passed with **146 test files / 2,029 tests**, typecheck, production build in 8.79 seconds, `git diff --check`, and all nine mobile-smoke checks. The Vite large-chunk advisory remains informational. No protected renderer, grading engine, PDF export hook, or tab-registry file was modified.
