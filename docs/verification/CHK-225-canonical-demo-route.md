# CHK-225 — Canonical demo project route render-safe seeding

**Date:** 2026-08-23
**Author:** Manus AI
**Scope:** One narrow, reversible production-blocker correction for the explicit canonical demo project route. This checkpoint repairs render-phase state mutation and hook-order instability in `useProject`; it does not change project schemas, grading calculations, export formats, MCP tools, ownership rules, or browser-handoff claims.

## Decision and product boundary

A fresh-profile production audit found that direct navigation to the canonical demo route, `/project/mss5osqd88j6fdyvtdu`, reached `RouteErrorBoundary` with minified React error `#185` instead of mounting the demo workspace. HTTP `200` responses were therefore insufficient evidence: the SPA fallback worked, but the UI did not.

The direct cause was in `artifacts/stitch-and-scale/src/context/ProjectsContext.tsx`: `useProject()` dispatched `createProject(demo)` during render when the explicit canonical demo was absent. That parent-provider update could create a render-update loop. The same hook also returned before calling `useSettings()` when no ID was present, creating a conditional-hook-order hazard if a route ID changed during the component lifetime.

This was selected over new feature work because it removes a concrete route blocker with a small reversible change. Automatic seeding remains lazy and explicit: only a consumer requesting `DEMO_PROJECT_ID` receives the demo candidate and triggers the seed effect. Unrelated dashboard launches and non-demo missing-project IDs are not seeded.

## Implemented correction

`useProject()` now:

1. Calls `useSettings()` unconditionally before any ID-based return.
2. Builds a memoized canonical demo candidate only when the requested ID is `DEMO_PROJECT_ID` and the project is absent.
3. Calls `createProject(demoCandidate)` only inside a guarded `useEffect`, never during render.
4. Returns the stable demo candidate immediately while local-first persistence catches up, so workspace, grading, and PDF consumers can render during the seed transition.
5. Uses one shared dispatcher return path bound to the resolved project ID, preserving all existing project actions.

A focused regression file, `artifacts/stitch-and-scale/src/context/ProjectsContext.route.test.tsx`, mounts an empty project store in happy-dom and verifies that the canonical demo is usable while seeding occurs after render. It also changes the route ID from absent to the demo ID and asserts that no hook-order or render-loop diagnostic appears.

No persistence model, project ownership behavior, grading logic, PDF generation, download/print implementation, localization copy, or MCP code was changed.

## Verification evidence

| Check | Result |
|---|---|
| Focused regression | Passed: **2 files / 16 tests**, including the new canonical-route hook regression and existing ProjectsContext tests |
| Full Vitest gate | Passed: **221 files / 2,563 tests**. The wrapper log printed a non-zero artifact because its `PIPESTATUS` capture was malformed after the passing run; the Vitest process itself reported all 221 files and 2,563 tests passed. |
| Application TypeScript check | Passed |
| Root TypeScript check | Passed across the workspace typecheck projects |
| Production build | Passed in **4.89 seconds**; entry bundle 324.00 kB / 101.64 kB gzip and i18n bundle 208.61 kB / 58.57 kB gzip |
| `git diff --check` | Passed before commit |
| Source-bundle verifier | Passed; expected archive SHA-256 `c19b71cdd06d250326d80eddc27685cbb627f91b03d85a624f0bb4894ba2a082`; 15 files present and fingerprinted |
| Protected invention brief | Unchanged; SHA-256 `5a7668a95841e7e74fc2dcf702cf1ffa94deed06d7029116919dcc0489b609ce` |
| Asset state | No asset changed in this checkpoint; larger tracked branding assets and existing app-logo WebP state remain as previously documented |
| Known diagnostics | Vitest continues to log non-browser `indexedDB is not defined` persistence diagnostics while passing. Vite continues to emit the known sourcemap-location warnings in shared UI files. These were not treated as product-gate failures. |

## Local route evidence

After the fix, a fresh local Chromium profile mounted the canonical workspace route without the recovery boundary or React loop marker. The freshly built preview was checked in separate fresh profiles for:

- `/project/mss5osqd88j6fdyvtdu`
- `/project/mss5osqd88j6fdyvtdu/grading`
- `/project/mss5osqd88j6fdyvtdu/pdf`

All three had zero recovery-boundary and not-found markers, and no React loop marker was found. The page-level grading route rendered all four expected controls.

## Live production, mobile, and MCP evidence

The exact code-bearing Vercel production deployment was observed as READY:

- **Commit:** `33cca032553ebccc621eb75ab2f1fcc4cfd2afd5`
- **Deployment:** `dpl_Ft62vDg6ex7jgqCiKGsbV2VHGx4n`
- **Deployment URL:** `https://stitch-and-scale-pro-api-server-7lz66jl9r.vercel.app`
- **Active alias:** `https://stitch-and-scale-pro-api-server.vercel.app`
- **Target:** `production`

A fresh isolated Chromium profile at a simulated **390 × 844** viewport directly opened the active canonical workspace route. It reached the workspace and Grading Lab tab, with `bodyOverflow=false` and `htmlOverflow=false`; no recovery UI or React `#185` marker appeared.

A separate fresh isolated profile directly opened the correct page-level route `/project/mss5osqd88j6fdyvtdu/grading`. The four Project Grading actions were present and measured exactly as follows:

| Control | Measured height | Measured width |
|---|---:|---:|
| Copy TSV | 44 px | 113.72 px |
| CSV | 44 px | 83.11 px |
| Handoff JSON | 44 px | 139.63 px |
| Print Sheet | 44 px | 144.78 px |

The page-level grading route had no body or document horizontal overflow. The initial temporary helper expected workspace-tab assertions while remaining on the workspace route; those assertions are not applicable to the page-level grading URL and were not used as product evidence. The corrected route smoke measured the controls above.

The active alias returned HTTP `200` for `/`, `/settings`, `/portfolio`, the canonical workspace route, the canonical grading route, and the canonical PDF route. The unchanged MCP origin boundary was also rechecked: an allowed-origin `OPTIONS /api/mcp` returned `204` with the exact active origin, `POST, OPTIONS`, and `Authorization, Content-Type, MCP-Protocol-Version`; a forbidden origin returned `403` with JSON-RPC error `-32001` (`This MCP origin is not allowed.`). A wildcard allow-origin header on that denied response was not treated as permission.

No browser-mediated download, clipboard write, share, print-dialog completion, or durable file save is claimed. The live evidence proves UI availability and request initiation surfaces only.

## Repository and operating-state integrity

The application-code commit is `33cca032553ebccc621eb75ab2f1fcc4cfd2afd5` (`fix: seed canonical demo after render`). It was pushed to `coder/perfection-audit-2026-08-22` first. A fresh parent check proved `origin/main` was exactly the code commit’s parent `8943cf3d869682c05fca8d2bce3757178f3c8a48`, after which the code commit was fast-forwarded to `main`. The local worktree was clean after the code commit and remained separate from this documentation commit.

The active schedule remains unchanged: one max/full-auto task at a 30-minute interval, `runAsNewTask=false`, timezone `Africa/Lagos`. Connector configuration was not modified. Public GitHub backlog inspection remains separate from implementation; no open proposal was adopted or merged. `QUEUE-067` remains research-only and is not expanded by this route repair.

## Residual risks and release posture

This checkpoint proves that the formerly failing fresh-profile canonical route now mounts on the active production alias and that the page-level Project Grading action row meets the 44px mobile target without horizontal overflow. It does not prove browser-mediated export or print completion, nor does it establish global publication readiness.

Residual risks remain explicit: large tracked branding assets remain; entry and i18n chunks remain large; browser-mediated export, print, share, clipboard, and save outcomes remain outside application observability; known sourcemap warnings and non-browser IndexedDB diagnostics remain; the screenshot-heavy prescribed mobile harness has previously timed out in this constrained environment; and a future custom-domain migration still requires fresh MCP-origin and active-alias verification.

**Overall publication readiness is not claimed.** CHK-225 removes the identified canonical demo-route production blocker and verifies the relevant live UI surfaces while preserving local-first ownership, truthful handoff wording, accessibility, and release-attribution discipline.

## Commit separation

Application code: `33cca032553ebccc621eb75ab2f1fcc4cfd2afd5` — `fix: seed canonical demo after render`

This checkpoint document and the run-ledger update are intentionally committed separately so verification evidence cannot be confused with the application-code release identity.
