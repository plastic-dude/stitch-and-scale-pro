# CHK-223 — Brag Card mobile action-row touch targets

**Date:** 2026-08-22
**Author:** Manus AI
**Scope:** One narrow, reversible accessibility correction for the Brag Card caption, native-share, and PNG-download actions. This checkpoint does not broaden Brag Card functionality, alter its browser-handoff truth contract, or claim overall publication readiness.

## Decision and product boundary

A fresh WIDE RESEARCH audit identified a remaining mobile accessibility gap in a high-value export surface. The Brag Card action row used the shared small-button variant without an explicit minimum height, while the same component’s accent selectors had already been protected at 44px. On narrow mobile layouts, this left the user-facing **Copy Caption**, **Share**, and **Download** actions exposed to a sub-44px hit area.

This was selected over new feature work because it directly reduces interaction friction in a core production-control workflow and can be reverted without changing stored data, export schemas, sharing permissions, or MCP behavior.

## Implemented correction

`artifacts/stitch-and-scale/src/components/brag-card-card.tsx` now gives all three Brag Card action-row buttons an explicit `min-h-11` class:

- Copy Caption (`copyCaption`)
- Share (`shareNative`)
- Download (`downloadPng`)

The handlers, disabled state, localized labels, PNG generation, browser download request, Web Share fallback, object-URL cleanup, and request-only toast wording were not changed. The application still cannot observe whether a browser completed a download or whether a recipient accepted a share; the existing copy continues to describe only the handoff request.

`artifacts/stitch-and-scale/src/lib/residual-touch-targets.test.ts` now requires all three exact action-row controls to retain the 44px minimum, alongside the existing Brag Card accent-selector guard. This is a source contract and is intentionally separate from claims about browser-rendered geometry.

## Verification evidence

| Check | Result |
|---|---|
| Focused regression | Passed: 4 files / 23 tests, including residual touch targets, Brag Card export truth, toast localization, and dashboard export copy |
| Full Vitest gate | Passed: **220 files / 2,559 tests** |
| Application TypeScript check | Passed |
| Root TypeScript check | Passed |
| Production build | Passed in **4.90 seconds**; entry bundle 324.92 kB / 101.87 kB gzip and i18n bundle 208.61 kB / 58.57 kB gzip |
| `git diff --check` | Passed before commit and in the final gate runner |
| Source-bundle verifier | Passed; expected archive SHA-256 `c19b71cdd06d250326d80eddc27685cbb627f91b03d85a624f0bb4894ba2a082`; 15 files present and fingerprinted |
| Protected invention brief | Unchanged; SHA-256 `5a7668a95841e7e74fc2dcf702cf1ffa94deed06d7029116919dcc0489b609ce` |
| Asset state | Existing app-logo WebP remains 416,824 bytes; larger `logo.png` and `app-icon.png` remain unchanged because they require a separate inventory and visual-role decision |
| Known diagnostics | Vitest continues to log non-browser `indexedDB is not defined` persistence diagnostics while passing; the build continues to emit six known sourcemap-location warnings in `tooltip.tsx`, `label.tsx`, `dropdown-menu.tsx`, `sheet.tsx`, `select.tsx`, and `progress.tsx` |

The first gate runner reported one failure caused only by an escaping error in its protected-hash wrapper. A direct follow-up comparison passed with the exact protected SHA above. All product gate sections themselves passed, and the wrapper defect is not treated as a product-gate failure.

## Live route, mobile, MCP, and release integrity

A fresh bounded isolated Chromium smoke against `https://stitch-and-scale-pro-api-server.vercel.app` checked Settings and dashboard at 320, 360, 390, and 430px. Every route-width check reported `bodyOverflow=false` and `htmlOverflow=false`; the Settings Download Backup control measured 44px at all four widths. The browser backup action produced the request-only text **“Backup export requested”** and **“Your browser was asked to save 0 projects; check your downloads if needed.”** This proves the live handoff request and layout baseline, not file completion. The Brag Card action-row controls are protected by the source regression; this bounded smoke did not navigate into the Brag Card panel, so no live Brag Card geometry claim is made beyond source-gate evidence.

Fresh post-deployment active-origin route checks returned 200 for `/`, `/settings`, `/portfolio`, `/project/mss5osqd88j6fdyvtdu`, `/project/mss5osqd88j6fdyvtdu/pdf`, `/app-logo.webp`, and `/favicon-192.png`. The new `/app-logo.webp` response is now `image/webp`, confirming that the exact-pixel payload correction from CHK-222 is served by the active production release rather than falling through to the SPA shell. MCP OPTIONS returned 204 with the exact active-origin policy and allowed `POST, OPTIONS` plus `Authorization, Content-Type, MCP-Protocol-Version`; unauthenticated MCP GET returned 405 as required. The authenticated canonical eight-tool MCP proof remains covered by CHK-222-era evidence; this UI-only correction changed no MCP code and did not alter the trust boundary.

The application commit is `1cd5321fad1363d6c782e39202cd7633d1f2c3d9` (`fix: protect brag card mobile actions`). It was pushed to `coder/perfection-audit-2026-08-22` first, then `main` only after a fresh fetch proved `origin/main` was exactly its parent `2ec3f3511f2f0112229a01f68d7a17a3ab2fd1c0`. Final repository verification showed the audit branch, `origin/main`, and the clean worktree at `1cd5321`.

Vercel created matching READY deployments for the exact code commit. Production deployment `dpl_9dVymTG8vvr3k29EQ5PvyVM4WHvL` has target `production` and commit `1cd5321`; target-null preview `dpl_8Bp8iJXeTny6EZiVPoE6JnUzgN74` also reached READY. The production deployment was observed through the public metadata path; no manual deployment, promotion, or alias mutation was performed. The active public smoke used the same public alias after the production deployment reached READY.

## Operating-state preservation

The existing operating schedule was inspected and left unchanged: one active max-mode task, 30-minute interval, `runAsNewTask=false`, timezone `Africa/Lagos`. Connector configuration was not modified. Public GitHub backlog inspection found three open proposals (#70, #71, and #72) and no open issues; none were adopted or merged. `QUEUE-067` remains queued and research-only pending its separate brief and two-pass approval.

## Residual risks and release posture

This checkpoint proves a narrow source-level 44px accessibility correction in the Brag Card action row and a successful matching production deployment. It does not prove that a browser completed a PNG download, accepted a Web Share handoff, or saved any export to durable storage.

Residual risks remain explicit: the prescribed screenshot-heavy mobile harness has previously timed out before assertions in this constrained environment; the full live Brag Card action row still merits a dedicated visual route smoke; larger public branding assets remain; entry and i18n chunks remain large; browser-mediated export, print, share, and save outcomes remain outside application observability; six sourcemap warnings and non-browser IndexedDB diagnostics remain; and future custom-domain/MCP-origin migration requires fresh verification.

**Overall publication readiness is not claimed.** CHK-223 reduces mobile interaction friction in a core Brag Card workflow while preserving existing export truthfulness, local-first behavior, reversibility, and release-attribution discipline.

## Commit

`1cd5321fad1363d6c782e39202cd7633d1f2c3d9` — `fix: protect brag card mobile actions`

The checkpoint document is intentionally recorded separately so its evidence cannot be confused with the application-code release identity.
