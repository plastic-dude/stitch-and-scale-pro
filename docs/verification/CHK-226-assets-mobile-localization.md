# CHK-226 — Assets mobile controls and localization

**Date:** 2026-08-23  
**Author:** Manus AI  
**Scope:** One narrow, reversible correction to the project Assets panel: mobile-sized action targets, touch-visible image actions, accessible localized names, and localized add-form actions. No project schema, persistence model, grading calculation, export format, ownership rule, MCP tool, or browser-handoff promise was changed.

## Decision and product boundary

The fresh WIDE audit found a concrete accessibility defect in the first-class Assets panel. The Add Asset and form actions did not have an explicit 44px minimum target, image view/download actions were hover-dependent and used sub-44px dimensions, the delete action was also below the target, and the three image actions had no dedicated localized accessible names. The active production workspace itself mounted successfully, so this was selected as a narrow improvement rather than a route or data-model rewrite.

The change preserves the browser-handoff boundary. Download remains an anchor request with the existing `download` attribute; this checkpoint does not claim that a browser saved a file or that a durable delivery occurred. View remains a browser-window request, and delete remains confirmation-gated.

## Implemented correction

`artifacts/stitch-and-scale/src/components/assets-panel.tsx` now:

1. Gives Add Asset, Cancel, and Save explicit `min-h-11` targets.
2. Gives image View, Download, and Delete controls explicit 44px minimum height and width.
3. Keeps image quick actions visible on small screens and available through focus, instead of relying on hover-only opacity.
4. Assigns localized `aria-label` values to View, Download, and Delete.
5. Uses dedicated localized `Cancel` and `Save` copy instead of undefined-key English fallbacks.

`artifacts/stitch-and-scale/src/lib/assets-copy.ts` adds View, Download, Delete, Cancel, and Save labels for English, German, French, Spanish, and Portuguese. `assets.test.ts` and `residual-touch-targets.test.ts` enforce the five-locale and structural contracts.

## Verification evidence

| Check | Result |
|---|---|
| Focused regression | Passed: **2 files / 10 tests** after the final localization adjustment |
| Full Vitest gate | Passed: **221 files / 2,564 tests** |
| Application TypeScript check | Passed |
| Root TypeScript check | Passed |
| Production build | Passed in **4.63 seconds**; entry bundle 324.00 kB / 101.63 kB gzip and i18n bundle 208.61 kB / 58.57 kB gzip |
| `git diff --check` | Passed |
| Source-bundle verifier | Passed; expected archive SHA-256 `c19b71cdd06d250326d80eddc27685cbb627f91b03d85a624f0bb4894ba2a082`; 15 files present and fingerprinted |
| Protected invention brief | Unchanged; SHA-256 `5a7668a95841e7e74fc2dcf702cf1ffa94deed06d7029116919dcc0489b609ce` |
| Known diagnostics | Passing tests continue to log non-browser `indexedDB is not defined` persistence diagnostics. The build continues to report known sourcemap-location warnings in tooltip, dropdown-menu, label, sheet, select, and progress shared UI files. |

## Local mobile UI evidence

A fresh isolated Chromium profile checked the newly built preview at a simulated **390 × 844** viewport. It used the visible mobile path: All Labs sheet, Assets search, Assets selection, Add Asset, synthetic PNG selection, and Save. The route mounted without body or document horizontal overflow.

The synthetic asset was rendered and the three image actions were present, visible, and measured:

| Control | Accessible label | Measured height | Measured width | Visibility |
|---|---|---:|---:|---|
| View | View asset | 44 px | 44 px | opacity 1 |
| Download | Download asset | 44 px | 44 px | opacity 1 |
| Delete | Delete asset | 44 px | 44 px | opacity 1 |

The flow also proved that Add Asset was reachable from the mobile navigator and that the asset appeared after Save. This is local-preview evidence for the built commit, not active-production evidence.

## Production deployment status

The exact code commit is `087945ccf332b2dbdd1160a4d7f8ddc50f1957f3` (`fix: localize assets form actions`). It contains the preceding Assets mobile/accessibility commit `25961ee101f9449e15547982491b42ac1ac8bdd0` plus the final localized Cancel/Save correction. The commit was pushed to `coder/perfection-audit-2026-08-22` first, then fast-forwarded to `main` only after confirming that `origin/main` was exactly `25961ee101f9449e15547982491b42ac1ac8bdd0`, its parent.

Production promotion was **not verified** for this commit. The transient Vercel CLI deployment attempt was rejected with the service response `Resource is limited - try again in 24 hours (more than 100, code: "api-deployments-free-per-day")`. A subsequent deployment-feed check showed the latest READY production deployment remained the prior canonical-route release for commit `33cca032553ebccc621eb75ab2f1fcc4cfd2afd5`, not `087945ccf332b2dbdd1160a4d7f8ddc50f1957f3`.

Therefore the active alias must not be described as serving this Assets correction. No active-production Assets control measurement or production export claim is made for CHK-226. The deployment quota is a release blocker for this checkpoint, not a product test failure.

## Operating-state integrity

The recurring schedule was inspected and not modified. It remains the single max/full-auto 30-minute task with `runAsNewTask=false` and timezone `Africa/Lagos`. Connectors were not enabled or changed. No open GitHub proposal was adopted or merged. `QUEUE-067` remains research-only and is outside this checkpoint.

## Residual risks and release posture

This checkpoint proves a structural accessibility and localization correction through focused tests, the complete local test/build gates, and a fresh built-preview 390px interaction smoke. It does not prove active production behavior because the free-tier daily deployment quota blocked promotion and exact active-alias verification.

Residual risks remain explicit: the active release still predates this Assets correction; large tracked branding assets remain; entry and i18n chunks remain large; browser-mediated export, print, share, clipboard, and save outcomes remain outside application observability; known sourcemap warnings and non-browser IndexedDB diagnostics remain; the prescribed screenshot-heavy mobile harness remains constrained; and any future custom-domain migration still requires fresh MCP-origin and release-integrity verification.

**Global publication readiness is not claimed.** CHK-226 is a verified, pushed code improvement with local evidence and a plainly recorded production-deployment blocker. A future firing should re-attempt promotion only when the service quota permits, then re-run the active-alias Assets smoke before treating the correction as live.

## Commit separation

Application code: `087945ccf332b2dbdd1160a4d7f8ddc50f1957f3` — `fix: localize assets form actions`

This checkpoint document and its queue-ledger update are intentionally committed separately from application code so verification evidence cannot be confused with the code release identity.
