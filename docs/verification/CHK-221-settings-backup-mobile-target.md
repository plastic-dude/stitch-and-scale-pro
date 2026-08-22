# CHK-221 — Settings backup handoff mobile target

**Date:** 2026-08-22  
**Author:** Manus AI  
**Scope:** One narrow structural accessibility correction to the Settings Data & Backups action row. This checkpoint does not claim overall publication readiness.

## Decision and product boundary

A fresh WIDE RESEARCH audit and active-production mobile contract smoke found that the Settings **Download Backup** control measured **38px** high at 320px, 360px, 390px, and 430px CSS viewport widths. That is below the project's 44px minimum touch-target rule and creates avoidable friction on the mobile path used to protect local-first project data.

The same smoke observed the new browser-handoff wording from the preceding export-truth correction:

> **Backup export requested** — Your browser was asked to save 0 projects; check your downloads if needed.

The application can observe that it built and requested a browser download handoff. It cannot observe whether the browser saved the file or whether the user completed the save. CHK-221 preserves that boundary and changes no storage, export payload, server, or publication state.

## Implemented correction

`artifacts/stitch-and-scale/src/pages/settings.tsx` now adds `min-h-11` to both `button-export-data` (**Download Backup**) and `button-import-data` (**Upload File**). The change is intentionally limited to the action hit areas; export, restore, validation, and local-first persistence behavior are unchanged.

`artifacts/stitch-and-scale/src/touch-target.test.ts` now structurally requires both Settings browser-handoff buttons to carry the repository's 44px token. The test reads the source-level JSX and fails if either control loses `min-h-11`, `min-h-[44px]`, or another accepted 44px class.

## Verification evidence

| Check | Result |
|---|---|
| Focused regression suite | Passed: 4 files / 26 tests, including Settings touch targets, toast localization, dashboard export copy, and Project Book contract |
| Full app Vitest gate | Passed; exact full-suite count recorded in the gate log and unchanged from the current release baseline: **220 files / 2,554 tests** |
| Application TypeScript check | Passed |
| Root TypeScript check | Passed |
| Production build | Passed in **5.03 seconds**; entry bundle 324.92 kB / 101.87 kB gzip and i18n bundle 208.61 kB / 58.57 kB gzip |
| `git diff --check` | Passed |
| Source-bundle verifier | Passed; expected archive SHA-256 `c19b71cdd06d250326d80eddc27685cbb627f91b03d85a624f0bb4894ba2a082`; 15 files present and fingerprinted |
| Protected invention brief | Unchanged; SHA-256 `5a7668a95841e7e74fc2dcf702cf1ffa94deed06d7029116919dcc0489b609ce` |
| Active-production bounded mobile contract smoke | Passed for `/settings` and `/` at 320/360/390/430px with no body or document overflow; before this patch, the live Download Backup control was 38px and the request-only toast was observed |
| Active-production route/MCP boundary | `/`, `/settings`, `/portfolio`, canonical demo project, PDF route, and favicon returned 200; MCP GET returned 405; active-origin OPTIONS returned 204 with exact origin/method/header policy; authenticated `tools/list` returned the canonical eight tools; forbidden alternate origin returned 403 / JSON-RPC `-32001` |

The prescribed screenshot-heavy mobile smoke was separately attempted but timed out before producing assertions; the bounded no-screenshot contract smoke above completed successfully. This distinction is recorded rather than treating the timeout as a product failure or silently calling it a pass.

Known non-fatal diagnostics remain: Vitest reducer tests can log `indexedDB is not defined` in the non-browser environment while passing, and the build emits six sourcemap-location warnings in `tooltip.tsx`, `label.tsx`, `dropdown-menu.tsx`, `sheet.tsx`, `select.tsx`, and `progress.tsx`.

## Repository and release integrity

The implementation was audited against the fetched `origin/main` at baseline commit `6b4db9030f422aa3a8cf83f7cef017a35bb5c426`. The working change is limited to the Settings page and its structural touch-target test. No protected invention brief, product-goal document, MCP handler, schedule, connector, or deployment alias was modified.

The verified implementation commit is `d810c5bd7f46947705d69f7979cfd00f4a0b18fa` (`fix: restore settings backup touch targets`). It was pushed audit-first and then fast-forwarded to `main` only after `origin/main` was proven equal to its parent `6b4db9030f422aa3a8cf83f7cef017a35bb5c426`. A bounded secret-safe Vercel observer found no deployment record for `d810c5b` yet. The active production alias therefore remains attributable to the preceding code release `6b4db9030f422aa3a8cf83f7cef017a35bb5c426`, whose READY production deployment is `dpl_6u3ke1bBNPzvkFVCDs3LmHN65B4g`. The 44px correction must not be described as live until a matching READY production deployment and fresh active-alias verification exist.

The existing operating schedule was inspected and left unchanged: one active max-mode task, 30-minute interval, `runAsNewTask=false`, timezone `Africa/Lagos`. Connector configuration was not modified. `QUEUE-067` remains queued and research-only pending its separate brief and two-pass approval. Existing open proposals were not adopted or merged.

## Residual risks and release posture

This checkpoint proves a narrow mobile accessibility defect and its local verification. It does not prove that browser-mediated backup downloads complete, that every export surface is risk-free, or that the product is globally publication-ready.

Residual risks remain explicit: browser-controlled download, print, share, and save outcomes; oversized public logo and app assets; the six sourcemap-location warnings; non-browser IndexedDB diagnostics; and future custom-domain/MCP-origin migration re-verification. The product still needs continued evidence-led work across Pattern PDF, Project Book, Brag Card, Receipt Lab, onboarding, localization, and release integrity rather than a blanket readiness claim.

**Overall publication readiness is not claimed.** CHK-221 addresses one measured Settings mobile barrier while preserving the product's truthful local-first handoff model.
