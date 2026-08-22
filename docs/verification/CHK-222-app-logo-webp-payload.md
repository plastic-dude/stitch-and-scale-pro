# CHK-222 — App-logo WebP-first payload correction

**Date:** 2026-08-22
**Author:** Manus AI
**Scope:** One narrow, reversible mobile-performance correction for the active app-logo consumers. This checkpoint does not claim overall publication readiness and does not remove the original PNG fallback.

## Decision and product boundary

A fresh WIDE RESEARCH audit found that the app-logo PNG was a material repeated branding payload: `app-logo.png` is 602,054 bytes at 680 × 680 pixels, while the same decoded pixels can be served as a lossless WebP derivative at 416,824 bytes. The exact-pixel comparison passed, reducing the transferred app-logo payload by 185,230 bytes, approximately 30.8%, without changing the rendered artwork.

The audit also found that the larger `logo.png` and `app-icon.png` files are not active runtime consumers of the app-logo placements audited here. They were not removed or rewritten in this checkpoint because their distinct branding roles and any non-tracked consumers require a separate asset inventory and visual review.

## Implemented correction

`artifacts/stitch-and-scale/public/app-logo.webp` is now tracked as the lossless, exact-pixel derivative of the existing app logo. The existing `app-logo.png` remains the fallback and rollback source.

The active app-logo placements in `landing.tsx`, `onboarding.tsx` (both placements), `dashboard.tsx`, and `about-emlux.tsx` now use browser-native `<picture>` markup with `/app-logo.webp` first and `/app-logo.png` as the fallback. Existing image dimensions, classes, decorative versus semantic `alt` behavior, and surrounding layout were preserved.

`deployment-security.test.ts` now requires every active app-logo consumer to offer the WebP source first, retain the PNG fallback, and keep the tracked WebP below the bounded payload threshold. This is a source-and-asset contract; it does not claim that a browser downloaded the WebP from production.

## Verification evidence

| Check | Result |
|---|---|
| Focused regression | Passed: 1 file / 6 tests in `deployment-security.test.ts` |
| Full Vitest gate | Passed: **220 files / 2,558 tests** |
| Application TypeScript check | Passed |
| Root TypeScript check | Passed |
| Production build | Passed in **4.88 seconds**; entry bundle 324.92 kB / 101.87 kB gzip and i18n bundle 208.61 kB / 58.57 kB gzip |
| `git diff --check` | Passed before commit and on the staged patch |
| Source-bundle verifier | Passed; expected archive SHA-256 `c19b71cdd06d250326d80eddc27685cbb627f91b03d85a624f0bb4894ba2a082`; 15 files present and fingerprinted |
| Protected invention brief | Unchanged; SHA-256 `5a7668a95841e7e74fc2dcf702cf1ffa94deed06d7029116919dcc0489b609ce` |
| Asset integrity | Exact decoded pixels preserved; PNG 602,054 bytes; WebP 416,824 bytes |
| Known diagnostics | Vitest continues to log non-browser `indexedDB is not defined` persistence diagnostics while passing; the build continues to emit six known sourcemap-location warnings in `tooltip.tsx`, `label.tsx`, `dropdown-menu.tsx`, `sheet.tsx`, `select.tsx`, and `progress.tsx` |

## Live route and release integrity

Fresh active-alias checks against `https://stitch-and-scale-pro-api-server.vercel.app` returned 200 for `/`, the canonical demo project route, its `/pdf` route, and `/favicon-32.png`. The active alias returned the existing PNG as `image/png` with a 602,054-byte payload. Its `/app-logo.webp` response was a 200 HTML SPA fallback rather than an image, proving that the new WebP asset is not served by the active production release.

The new application commit is `ba212ffca7f29d45393d2cb82192c89a04fab20d` (`perf: serve lossless webp app branding first`). It was pushed audit-first to `coder/perfection-audit-2026-08-22`, then fast-forwarded to `main` only after a fresh fetch proved `origin/main` was exactly its parent `a680fe0147e0cb93d012cc2bc4e6d05bc021da8c`. Final remote verification proved `main` and the audit branch contain the new commit.

Vercel created READY deployment `dpl_EP17CSvvcGSmmh8ppF4tyTvnLY3P` for `ba212ff`, but its target is `null` and it has no production alias. The active READY production deployment remains `dpl_6u3ke1bBNPzvkFVCDs3LmHN65B4g` at baseline SHA `6b4db9030f422aa3a8cf83f7cef017a35bb5c426`. No manual deployment, promotion, or alias mutation was performed. The WebP correction must not be described as live until a matching READY production deployment and fresh active-alias asset/content-type check exist.

The existing operating schedule was inspected and left unchanged: one active max-mode task, 30-minute interval, `runAsNewTask=false`, timezone `Africa/Lagos`. Connector configuration was not modified. `QUEUE-067` remains queued and research-only pending its separate brief and two-pass approval. Existing open proposals were not adopted or merged.

## Residual risks and release posture

This checkpoint proves a source-level, exact-pixel branding payload reduction and a safe fallback path. It does not prove that the new WebP is deployed, that every browser chooses the WebP source, or that the broader bundle and public asset inventory is optimized.

Residual risks remain explicit: the current production alias is still on the preceding application release; the larger `logo.png`, `app-icon.png`, favicon, and social-preview assets remain; entry and i18n chunks remain large; browser-mediated download, print, share, and save outcomes remain outside application observability; the six sourcemap warnings and non-browser IndexedDB diagnostics remain; and future custom-domain/MCP-origin migration requires fresh verification.

**Overall publication readiness is not claimed.** CHK-222 narrows one repeated mobile branding payload while preserving visual fidelity, compatibility, rollback, accessibility semantics, and release-truth discipline.

## Commit

`ba212ffca7f29d45393d2cb82192c89a04fab20d` — `perf: serve lossless webp app branding first`

The checkpoint document itself is intentionally not bundled into that application commit so production attribution remains unambiguous.
