# Mobile smoke evidence — 2026-08-22

## Scope

Fresh local production-build smoke against `http://127.0.0.1:5000/` using the repository runner `scripts/mobile-smoke.mjs`, with CDP device metrics at 320, 360, 390, and 430 CSS pixels.

## Result

The rerun passed with `status=0` and returned `ok: true`.

Checks completed:

- onboarding at 320/360/390/430px, including no horizontal overflow;
- dashboard at 390px;
- new-project required-field state and disabled Next hit area;
- sample workspace at 390px;
- export preflight at 390px, including Export PDF hit-area check;
- Grading Lab navigation and visible QA metrics;
- Design Ledger navigation and visible content.

## Captured artifacts

`/tmp/coder2-mobile-rerun-20260822-074429/` contains `onboarding-320.png`, `onboarding-360.png`, `onboarding-390.png`, `onboarding-430.png`, `dashboard-390.png`, `new-project-390.png`, `sample-workspace-390.png`, `export-390.png`, `grading-lab-390.png`, and `design-ledger-390.png`.

## Diagnostic note

The immediately preceding complete-gate run stopped at the onboarding skip assertion after earlier checks had passed. The same runner then passed without source changes after the local browser/CDP page was brought to the expected onboarding state. This is recorded as a transient test-environment/state issue, not as a claimed product fix. The runner should be made more deterministic in a future bounded maintenance change if the failure recurs.

## Fresh local workspace visual checkpoint

The local build rendered the sample project route `/project/sample-crew-neck-sweater` without a route error. The browser exposed direct entry points for **Full Grading Table** and **Export PDF**, six grouped lab controls, the **All Labs** control advertising 83 workspace labs, and the workspace tabs `Studio`, `Designs (0)`, `Costs (0)`, and `Export`. This is local-build evidence only; the public deep-link remains unverified because the exact 8eeeab6 production deployment is quota-blocked.

## Pattern PDF export preflight checkpoint

The local sample project’s `/project/sample-crew-neck-sweater/pdf` route rendered with four template choices (Minimal, Luxury, Craft/Cozy, Technical/Blueprint), logo upload affordance, Cover Page/Gauge Summary/Pattern Notes switches, and a custom filename field. With filename `sample-crew-neck-2026-proof`, the preflight displayed **Ready to print**, `0 errors · 0 warnings`, and a six-page live preview. The UI explicitly explains that Export PDF opens a print dialog and requires the user to choose “Save as PDF”; this is a browser-print workflow, not a direct binary download from the app.

## Pattern PDF export trigger checkpoint

The local Export PDF button was triggered with the custom filename and the browser console remained empty afterward. The page stayed on the export route, consistent with the product’s stated `window.print()`/browser-print flow. No automatically downloadable PDF was observed through this browser automation path; a human/browser print-save confirmation is still required for binary-artifact evidence.
