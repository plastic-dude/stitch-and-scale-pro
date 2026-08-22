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

## Project Book export checkpoint

The local `/portfolio` route rendered a two-project catalogue with launch ranking, readiness scores, commercial summaries, and bundle math. The Project Book section had both sample projects selected (`2 of 2`), a custom filename field set to `stitch-scale-2026-catalogue-proof`, Select all/Clear controls, and a Prepare Project Book button. The copy states it prepares one print-ready catalogue containing every project, launch ranking, commercial summary, measurements, and open publication checks, then opens a browser print dialog for Save to PDF.

The Project Book preparation trigger reported **“Print dialog opened — choose Save to PDF.”** No runtime error surfaced in the page response. As with Pattern PDF, automation did not complete the native print-dialog save, so this proves preparation/trigger behavior but not a saved PDF binary or its rendered pages.

## Local workspace navigation recheck

A subsequent attempt to open `http://127.0.0.1:5000/project/sample-crew-neck-sweater` produced no detected elements and the follow-up browser snapshot was `about:blank`; this is a local test-server/browser-session failure, not evidence of a product route failure. No export conclusion is drawn from this attempt. The local server/CDP session must be checked before further visual evidence.

The transient blank/about:blank state was recoverable: after pressing Escape to dismiss the print state, `/portfolio` rendered again from the local server with HTTP 200, two sample projects, and the Project Book controls. This reinforces that the prior blank state was browser/print-session related rather than an application route failure.

## Brag Cards checkpoint

The local Brag Cards lab opened successfully for the sample project. It truthfully showed an empty-data state: “Nothing to brag about yet” and explained that sales in Receipt Lab or a published design in Design Ledger populate cards. The UI exposed a Studio name field (`My Studio`), highlight choices (Income, Sales, Streak, Published), five styles (Navy, Editorial, Gauge Swatch, Selvedge, Swiss Poster, Stitch Cameo), four accent swatches, a `1080 × 1080` preview, editable caption area, and `Copy caption` / `Share` / `Download PNG` actions. The preview retained Stitch & Scale’s brand context only through the app shell; dedicated branded-mark/logo treatment inside the card remains a visual issue to inspect and potentially improve.

## Receipt Lab checkpoint

The local Receipt Lab opened successfully and accepted a controlled sample order without a runtime error. Filled data included customer `Ari Sample`, WhatsApp channel, `Classic Crew Neck Sweater`, one digital pattern item at `$12.00`, 5% tax, 6.5% platform fee, 2.9% processing fee plus `$0.30`, and `$3.00` materials cost. The rendered receipt calculated `$12.60` total, `$0.82` platform fee, `$0.67` processing fee, and `$8.11` profit. The card exposed Receipt/Order Quote/Refund Note modes, Chat/Craft/Paper/Selvedge styles, Copy/Share receipt, Save as image, Print/PDF, Save to ledger, and Reset. The ledger remained `0` because Save to ledger was not pressed; no persistent sample transaction was intentionally created.

The Receipt Lab’s lower share panel was reached at the mobile-like viewport. It visibly exposed `Copy / Share receipt`, `Save as image`, `Print / PDF`, `Save to ledger`, and `Reset`; the filled card remained rendered with the expected `$12.60` total and `$8.11` profit. The Save as image trigger produced no visible runtime error; binary/download presence is checked separately rather than inferred from the button response.

## Receipt Lab control-index correction

The first lower-panel element indices were stale after the re-render. The attempted click at index `125` invoked `Copy / Share receipt` rather than Print/PDF, and the app displayed a visible `Receipt copied — Paste it straight into the chat` toast. The subsequent rendered state showed the form back at its default empty values; this means the prior controlled values were not preserved across that interaction and requires a focused product investigation if reproducible. No claim is made that Print/PDF or Save as image was triggered in this pass.

### Receipt Lab print-path recheck — 2026-08-22

A coordinate-based click targeted the rendered `Print / PDF` control after the earlier element-index drift. The route remained stable at `/project/sample-crew-neck-sweater`, and the browser console reported no output or uncaught error. This is evidence that the trigger does not crash the app, not evidence of a saved PDF: the product delegates saving to the browser print dialog, which this automation surface does not expose as a downloadable file.

The Receipt Lab’s visible export controls remain `Copy / Share receipt`, `Save as image`, `Print / PDF`, `Save to ledger`, and `Reset`. The preceding interaction had returned the controlled form to defaults after a stale-index click, so no claim is made that a populated receipt binary was captured here.
