# CHK-220 — Project Book browser-print handoff truth and mobile resilience

**Date:** 2026-08-22
**Author:** Manus AI
**Scope:** One narrow structural correction to the Portfolio Project Book browser-print handoff, with adjacent mobile resilience and smoke-fixture repairs. This note does not claim overall publication readiness.

## Decision and product boundary

The WIDE RESEARCH audit found a concrete trust defect in Portfolio → Project Book. After the user activated the action, the application could observe that a popup was created, the Project Book document was written, the new window was focused, and a delayed `print()` request was scheduled. It could not observe that the browser's print dialog actually opened, that the user selected **Save to PDF**, or that a PDF was saved. The previous `bookReady` status therefore overstated what the application knew.

The correction follows the product's browser-handoff truth boundary: report preparation and handoff, not completion of a browser-controlled print or file-save transaction. This keeps local-first ownership and user control intact without adding a server upload, hidden publication state, or an untestable success claim.

## Implemented correction

`portfolio.tsx` now uses `bookPrepared` status copy. The visible status states that the Project Book opened in a new window and instructs the user to use the browser print dialog to choose **Save to PDF**. It no longer says that the print dialog opened. The delayed print request is guarded by `!popup.closed`, so a user closing the new window before the timer fires does not cause an invalid call.

`portfolio-copy.ts` renames the status key and supplies preparation-only wording in English, German, French, Spanish, and Portuguese. `project-book-export-contract.test.ts` protects the no-dialog-completion claim, closed-popup guard, five-locale copy, 44px Project Book controls, and the shared mobile shell/toast viewport constraints.

The Project Book action row's **Select all**, **Clear**, and **Prepare Project Book** controls now have a 44px minimum height. `shell.tsx` gives the mobile navigation grid an explicit full width, and `toast.tsx` constrains the fixed toast viewport with `box-border`, full width, and `max-w-full`. These are harmless layout hardening measures: the initial smoke harness's apparent 390px overflow was separately diagnosed as a mismatch between its reported `clientWidth` and CSS `window.innerWidth`; the final CSS-viewport measurement had no document-level overflow.

The prescribed `scripts/mobile-smoke.mjs` also now uses the canonical lazy-seeded demo route `/project/mss5osqd88j6fdyvtdu`, matching `ProjectsContext.DEMO_PROJECT_ID`. The former `/project/sample-crew-neck-sweater` fixture was not automatically seeded on a clean profile and could make export-preflight smoke fail before the product route was exercised. This is a test-fixture reliability correction, not a new product data source.

## Verification evidence

| Check | Result |
|---|---|
| Focused Project Book and Portfolio-copy contracts | Passed: 2 files, 6 tests; Project Book contract 5 tests and copy parity 1 test |
| Full app Vitest gate | Passed: **220 files / 2,554 tests** |
| Application TypeScript check | Passed |
| Root TypeScript check | Passed |
| Production build | Passed in **5.11 seconds**; entry bundle 324.92 kB / 101.86 kB gzip and i18n bundle 208.61 kB / 58.57 kB gzip |
| `git diff --check` | Passed |
| Source-bundle verifier | Passed; expected archive SHA-256 `c19b71cdd06d250326d80eddc27685cbb627f91b03d85a624f0bb4894ba2a082`; 15 files present and fingerprinted |
| Protected invention brief | Unchanged; SHA-256 `5a7668a95841e7e74fc2dcf702cf1ffa94deed06d7029116919dcc0489b609ce` |
| Local four-width mobile smoke | Passed at 320/360/390/430px after the final code build, using the canonical demo fixture; prescribed onboarding, dashboard, new-project, workspace, export-preflight, Grading Lab, and Design Ledger paths remained covered |
| Active-production four-width mobile smoke | Passed at 320/360/390/430px against the active alias serving the verified code release |
| Fresh active-production Project Book route smoke | Passed at 390px on `/portfolio` after first visiting `/project/mss5osqd88j6fdyvtdu` to lazy-seed the canonical demo. The preparation-only status was observed exactly, stale `Print dialog opened` wording was absent, the Project Book control measured 44px, and true CSS-viewport body/document overflow was false |
| Production Project Book harness boundary | The smoke stubbed `window.open` and its `print()` method only to prevent a headless modal dialog from blocking the test. It proved the product's preparation copy and guarded print-request path; it did **not** and cannot prove that a real browser print dialog opened or that a PDF was saved |
| Active-production routes | `/`, `/project/mss5osqd88j6fdyvtdu`, `/project/mss5osqd88j6fdyvtdu/pdf`, and `/portfolio` returned 200; `/favicon-192.png` returned 200 with 48,605 bytes |
| Active MCP/origin boundary | Active-origin `OPTIONS /api/mcp` returned 204 with `POST, OPTIONS` and `Authorization, Content-Type, MCP-Protocol-Version`; authenticated `tools/list` returned the canonical eight tools; MCP `GET` returned 405; a forbidden alternate origin returned 403 / JSON-RPC `-32001` |

The full Vitest run retains known non-fatal reducer-context messages reporting `indexedDB is not defined` in the non-browser test environment; the tests passed. The build retains six known non-fatal sourcemap-location warnings in `tooltip.tsx`, `label.tsx`, `dropdown-menu.tsx`, `sheet.tsx`, `select.tsx`, and `progress.tsx`.

## Repository, deployment, and operating-state integrity

The fresh audit fetched origin before inspection. At audit time the worktree was clean, the audit branch was at code commit `9f00918762a6168b0fb18c05e86047c84c3839c6`, and `origin/main` matched that commit. The public GitHub REST audit found three open proposals — #70, #71, and #72 — and no open issues; none was silently adopted or merged. The canonical queue remains authoritative, and `QUEUE-067` remains queued and research-only pending its separate brief and two-pass approval.

The exact code-bearing Vercel deployment is `dpl_144CvR6kGa5bDZ6HAoBE3JuExMAu`. It reached `READY`, targets `production`, carries commit SHA `9f00918762a6168b0fb18c05e86047c84c3839c6`, and serves the active public alias [`stitch-and-scale-pro-api-server.vercel.app`](https://stitch-and-scale-pro-api-server.vercel.app). No manual alias assignment was used. Any later documentation-only commit must not be described as the production code release or manually aliased.

The existing operating schedule was inspected and left unchanged: one active max-mode task, 30-minute interval, `runAsNewTask=false`, timezone `Africa/Lagos`. No connector or credential configuration was modified. A scoped production credential should be rotated or revoked after the operational handoff according to the owner's secret-management practice; no secret is recorded in this document.

## Adjacent audit decisions

Pattern PDF, Brag Card, Receipt Lab, Publication Package, and Design Ledger remain separate export surfaces. Their recent truth-boundary corrections remain intentionally separate from this Project Book change. Brag Card download/share reports browser/device handoff rather than saved delivery; Receipt Lab provides screenshot guidance rather than claiming image capture; Publication Package remains unavailable until a persisted safe artifact URL exists; and Design Ledger CSV remains a request-only browser download. No social posting or media-release behavior was added, and `QUEUE-067` was not started.

## Residual risks and release posture

This checkpoint proves that the Project Book correction is live on the active production alias and that its preparation handoff is mobile-tested. It does not establish that every export surface is risk-free, that downstream browser save operations completed, or that the broader product is publication-ready.

Known residual risks are explicit. The browser controls the real print dialog and PDF save outcome. Brag Card sharing/download, screenshot capture, and other browser-mediated handoffs have the same delivery boundary. Public logo and app assets remain oversized, including approximately 2.3 MiB `logo.png` and `app-icon.png`, approximately 960 KiB `favicon.png`, and approximately 588 KiB `og-image.png`/`app-logo.png`; bundle assets should not be described as optimized. The six sourcemap-location warnings and non-browser IndexedDB diagnostics remain hygiene follow-ups. A future custom-domain migration must update and re-verify the MCP allowed-origin policy, active routes, forbidden-origin behavior, and exact production release identity.

**Overall publication readiness is not claimed.** The narrow Project Book defect is corrected, verified, and live; the residual-risk list remains open and requires continued evidence-led work.
