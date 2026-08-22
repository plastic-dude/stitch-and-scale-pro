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
