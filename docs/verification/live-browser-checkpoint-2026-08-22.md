# Live browser checkpoint — 2026-08-22

## Scope
Sandbox Chromium session only; no user device or production database was modified.

## Public alias entry
The public alias `https://stitch-and-scale-pro-api-server.vercel.app/` loaded successfully in the browser at 2026-08-22 07:36 UTC. The rendered application was the Spanish locale and showed the expected local-first shell: storage status, Projects, Portfolio Planner, Preferences, New Project, archive/search/import/restore controls, and a populated project grid. The earlier visible `Invalid time value` and `Cannot read properties of undefined (reading 'toLowerCase')` route failures were not present on this fresh load.

## Sandbox storage inventory
The browser console reported `stitch-and-scale-v1` in localStorage and an IndexedDB database named `keyval-store`. The sandbox contains many Stitch & Scale test fixtures. No storage was changed during this checkpoint; the next replay must write only a controlled malformed timestamp fixture and then restore the original serialized value.

## Release context
Vercel project metadata reported the public alias assigned to READY/PROMOTED production deployment `dpl_3MJzbHTi1p1s4Wtfobbmpo8FGjiK`, whose GitHub SHA is `f88f6a4f2ff07355f57b192929a79e508fe6a2ae`.

## Controlled malformed timestamp replay
At 07:36 UTC, only the sandbox browser stores were modified. The original localStorage serialized value and IndexedDB project count were saved in sessionStorage under `ss-replay-backup-20260822`; a one-project fixture with missing name/author/gauge/sections and invalid `createdAt`/`updatedAt` strings was written to both stores, then the page was reloaded. The exact public alias rendered the dashboard successfully in Spanish, showing one normalized `Untitled pattern` draft with valid zero-value gauge/section defaults and a relative timestamp of `creado hace menos de un minuto`. No `Invalid time value`, `toLowerCase`, or route error appeared. This is fresh live evidence for the e475 timestamp/legacy-normalization repair on the promoted f88f6a4 release.

## Restoration confirmation
The sandbox fixture was removed by restoring the original serialized localStorage and IndexedDB values from sessionStorage, then reloading. The browser returned to the original populated 58-project dashboard. This confirms the live malformed-data replay was reversible and did not leave a test record behind.

## Post-8eeeab6 routing recheck — 2026-08-22

The public alias `https://stitch-and-scale-pro-api-server.vercel.app/project/sample-crew-neck-sweater` was checked twice in a fresh browser state after the exact-main deployment attempt. Both checks returned Vercel `404: NOT_FOUND` with the same error ID prefix `cle1::zgckh-1787384964605-6b7fb4ba6985`. The root alias remains reachable, but the new `vercel.json` SPA fallback is not live because the target=production deployment of `8eeeab6` returned HTTP 402 `payment_required` / `api-deployments-free-per-day`.
