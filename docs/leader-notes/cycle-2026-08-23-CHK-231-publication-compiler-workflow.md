# CHK-231 — Publication compiler made reachable from the package workflow

**Date:** 2026-08-23  
**Code commit:** `5e6295879867994b7539933822df77d85ca74a45`  
**Audit branch:** `coder/perfection-audit-2026-08-22`  
**Production branch:** `main`  
**Author:** Manus AI / CODER II

## Why this was selected

WIDE RESEARCH split the current `origin/main` state into independent audits covering mobile and scroll structure, export truth, localization and onboarding claims, performance and test configuration, MCP/origin boundaries, and publication-package wiring. The highest-impact safe gap was not a missing algorithm: the existing deterministic publication compiler was orphaned. `project-compiler-card.tsx` and `pattern-compiler.ts` were present, but the workspace package tab rendered only `ProjectPackageCard`, so users could not run the local publication preflight from the workflow that owns packages.

This was selected over broader changes because it is narrow, reversible, local-first, and uses an already implemented persistence seam. It does not add server behavior, accounts, AI requests, cloud storage, new schema, or export claims.

## Change made

`project-workspace.tsx` now lazy-loads `project-compiler-card` and renders it below the package list in the `packages` workspace tab. The existing `updatePublicationPackage` callback is passed through unchanged. Both surfaces retain the existing suspense fallback. `publication-package-workflow.test.ts` locks the lazy import, package-tab rendering, callback wiring, and local-only compiler boundary.

The compiler remains deterministic and package-scoped. It calls `compileProject(project)`, persists the resulting CompilerIR/readiness verdict into an existing publication package, and reports contradictions. It does not call `fetch`, Axios, XMLHttpRequest, or any external AI/API service.

## Evidence

### Repository reconciliation

The clean audit branch was refreshed from all remotes before commit. `origin/main` was exactly `14c53143b93f9aaee6a691f913f57c63dfc83cd6`, the parent of the new code commit. The audit branch was pushed first, then `main` was fast-forwarded without force or merge noise. The open `mcp/grading-csv-export` branch was not merged; its separate missing `@/lib/grading-engine` typecheck failure remains isolated.

### Tests and gates

| Gate | Result |
|---|---|
| Focused package/publication/responsive/print tests | 3 files, 14 tests passed |
| Full application Vitest | 225 files, 2,580 tests passed |
| App TypeScript | Passed |
| Workspace TypeScript | Passed across API server, mockup sandbox, Stitch & Scale, and scripts |
| Production build | Passed in 5.11 seconds |
| Entry bundle | 324.16 kB raw / 101.70 kB gzip |
| i18n bundle | 208.62 kB raw / 58.58 kB gzip |
| `git diff --check` | Passed |
| Source-bundle verifier | Passed; archive SHA `c19b71cdd06d250326d80eddc27685cbb627f91b03d85a624f0bb4894ba2a082` |
| Protected invention brief | Unchanged; SHA `5a7668a95841e7e74fc2dcf702cf1ffa94deed06d7029116919dcc0489b609ce` |

The build retained known non-fatal Vite sourcemap diagnostics and dynamic-import optimization warnings; no new failure was introduced.

### Release integrity

The code commit was pushed audit-first to `coder/perfection-audit-2026-08-22`, then promoted to `main` only after the exact-parent check. Vercel deployment `dpl_2enZnS5MX79EswE1UH2vjkT46sKZ` was created from main commit `5e6295879867994b7539933822df77d85ca74a45` with production target and reached `READY`.

The active alias `https://stitch-and-scale-pro-api-server.vercel.app` served entry asset `/assets/index-C-DtA-5f.js`, whose observed SHA-256 was `19e52c5dca8cb0f4701ba1258b21bba93fd3871d447e397cb71fa8674cdb71bd`. Root, canonical workspace, grading, and PDF routes returned HTTP 200. The deployed workspace chunk referenced `project-compiler-card-CKj2wgoj.js`, and that compiler chunk returned HTTP 200.

The active MCP boundary remained unchanged and passed: allowed-origin preflight `204`; forbidden-origin preflight `403`. No connectors or schedules were changed.

A fresh browser profile loaded the deployed route into the first-run local landing state because it had no seeded project in local storage; therefore no user-specific package-tab interaction is claimed from that browser session. This is a storage-state limitation, not a deployment failure.

## Product-goal impact

The package workflow now exposes a concrete publication-control preflight rather than only a package inventory. A designer can use the local compiler to surface missing sections, contradictions, and readiness conditions before delivery while retaining local ownership and reversibility. The change moves the product toward a trustworthy production-control layer without turning it into a generic dashboard or an autonomous AI agent.

## Residual risks and deferred work

The existing print handoff still records a local PDF artifact after the browser `afterprint` event even though browser APIs cannot reliably distinguish print cancellation from completion. That trust-boundary issue was identified but intentionally not mixed into this compiler wiring change; it needs its own focused contract and UX repair. Browser print completion, durable download, and delivery remain unclaimed.

The new compiler surface has bundle-level and source-contract proof, but no fresh seeded-profile click-through was claimed in this firing because the active browser profile had no local project data. Future custom-domain origin verification, authenticated MCP calls, below-320px behavior, and large-chunk performance remain bounded follow-ups.
