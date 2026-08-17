# QA Cycle 65 — independent auditor report

## Scope and baseline

Cycle 65 began from clean Sq1 browser contexts and tested the live deployment at `https://stitch-and-scale-pro-api-server.vercel.app` against latest main `6db5aa11004092965d35094df60ca3f95f434a25`. The supplied full-app crawl specification, app-layout-perfection standard, repository playbook and quality policy, QA handoff SOP, and the new CHK-129 leader guidance were reviewed before testing. No application code, `main`, or the protected RC repository was modified.

The recurring auditor schedule remains active at a 25-minute interval: task `etuJjiLGr9kDYCvoQEHs8b`, interval `1500` seconds, enabled and active.

## Coverage and stability

The focused clean-start crawl captured **85 named screenshots** across Android 360px, iPhone 390px, iPhone 430px, tablet 768px, and desktop 1280px. It exercised onboarding and deep-link skip, both landing CTAs, project creation, PDF route, Settings, Portfolio, root/project routes, and long-route top/middle/bottom scroll states. It recorded **0 crawl errors and 0 console/page errors**.

The refreshed desktop real-pointer crawl captured **79/79 project tabs** at 1280px. Every tab produced an active-panel identity matching the requested tab label, with `inventoryCount=79`, `reachedCount=79`, `identityMismatch=0`, `errors=0`, and `consoleErrors=0`. The prior Cycle 63 report of 47 blocked tabs is therefore stale at current main and was not reopened.

The deep-state pass covered landing scroll positions, seeded demo workspace, inline Project Details form, project list, Portfolio scroll positions, Settings preferences and Data & Backups, new-project empty state, and backup actions. A clean persistence probe created a new project, saved a Body section, reloaded the page, and confirmed both the project title and section remained present. A clean 360px invalid route rendered the friendly 404 state with no onboarding overlay and no errors. A dedicated route/lab network probe found no non-200 responses, failed requests, or console errors on deep-link, root, Settings, Portfolio, 404, Brag Cards, Receipt Lab, Payback Lab, Grading Lab, or Chart Lab.

## CHK-129 and previous-fix verification

CHK-129’s shell header touch-target fix is verified. At 360px, 390px, and 430px, Projects, Portfolio, and Settings measure 44×44 CSS pixels, while New Project measures 48×44. At the differentiated 640px, 767px, 768px, and 1280px widths, header controls have no measured overlaps; the mobile icon treatment remains stable through the narrow tablet breakpoint. Fresh real-pointer activation of the destinations succeeded. Closed Cycle 64 issue #66 and duplicate #67 were not reopened.

The mobile All Labs trigger remains visible and touch-sized at 328×44, 358×44, 398×44, and 704×44 across 360/390/430/768px. The corrected dialog inventory contains 80 buttons: one Close control plus 79 lab entries. Clean deep-link skip preserves the requested deep link, while a plain root entry still falls back to `/project/new`.

The desktop strip remains left-aligned after CHK-128. At 1280px, `scrollLeft=0`, `scrollWidth=8143`, and `clientWidth=1214`; Sections, Preview, and Yarn are fully visible at first paint, and Payback Lab is visible and activatable at the far end. Closed issues #64 and #65 remain closed and were not duplicated.

## New finding 1 — mobile icon-only controls below 44px

A focused 360px icon-only sweep and a 360/390/430px touch-target matrix verified a new responsive defect class outside the fixed header navigation. The actual visible controls are below the supplied 44×44 minimum:

| Surface | 360px | 390px | 430px | Real pointer result |
|---|---:|---:|---:|---|
| Delete section Body/Sleeve/Neckline | 36×36 | 36×36 | 36×36 | Pointer opens the destructive confirmation sheet |
| All Labs Close | 16×16 | 16×16 | 16×16 | Pointer closes the sheet |
| Brag Cards — Rose accent | 35.2×35.2 | 35.2×35.2 | 35.2×35.2 | Pointer activates after sheet is closed |
| Brag Cards — Honey/Moss/Denim accents | 32×32 | 32×32 | 32×32 | Pointer activates after sheet is closed |

This is distinct from closed #66/#67, which covered only the shell header. It is routed as a new **MINOR** Reviewer issue with a focused acceptance test: each listed control must expose an effective hit rectangle of at least 44×44px at 360/390/430px, retain its current action, and preserve adjacent-control separation.

## New finding 2 — All Labs selection leaves the modal sheet open

At 360px, 390px, 430px, and 768px, selecting Brag Cards or Payback Lab by real pointer input changes the active tab identity but leaves the Radix modal sheet mounted over the selected content. The sheet remains the blocking surface until the user separately taps its Close control or the scrim. This was verified with `dialogCount=1` and active identities `Brag Cards` or `Payback Lab` in all eight matrix cases.

The component source confirms the selection handler calls `onTabChange(value)` without dismissing the Sheet. The behavior is routed as a separate **MINOR** Reviewer issue because the user has selected a destination but still cannot interact with the destination content until performing another dismissal action. This interpretation is supported by Material’s modal bottom-sheet guidance: modal sheets block the underlying UI and may be dismissed by tapping a menu item or action, the scrim, a swipe, or a close affordance [1].

The minimal acceptance test is: in fresh 360/390/430/768px contexts, open All Labs, select Brag Cards and Payback Lab, confirm the active panel changes, and confirm the modal sheet dismisses automatically so the selected panel is immediately interactable. The close control and scrim must remain valid dismissal fallbacks.

## Backup and stale-item handling

`Download Backup` successfully produced a JSON export and `Upload File` remained available. Storage Health continued to show `Never backed up` after export, reproducing the existing LIVE-006/LIVE-007 verification observation. Because the latest leader guidance explicitly treats this wording as unconfirmed rather than a confirmed defect, no duplicate issue was opened.

The 47-tab blocked state from Cycle 63 is stale at current main and was suppressed. The fixed header 36px defect from Cycle 64 was independently re-verified at the new commit but was not reopened. Prior landing CTA, flat-navigation, and first-paint findings remain closed and were not duplicated. The anomalous 418px `window.innerWidth` observed after Brag Cards activation was suppressed as a harness/runtime artifact because the actual client and visual viewport remained 360px and the base state measured correctly.

## Evidence and routing

The evidence branch contains the focused manifest, 79-tab active-panel manifest, navigator and desktop-strip matrices, persistence and 404 states, deep-state and backup results, responsive header measurements, touch-target matrices, modal-selection matrices, network results, source-behavior evidence, and named screenshots. The branch contains evidence only and no application-code changes.

This report is addressed to the Reviewer. The Coder should not act on this report directly — please triage and decide on closure or routing.

## References

[1]: https://m2.material.io/components/sheets-bottom "Material Design — Bottom sheets"
