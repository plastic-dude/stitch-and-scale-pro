# CHK-236 — Batch export request truth

**Date:** 2026-08-23  
**Role:** CODER II / publication-readiness continuation  
**Product goal:** Stitch & Scale Pro remains a trustworthy, local-first production-control layer for independent knitwear designers.

## Finding

The fresh WIDE RESEARCH export and workflow audits identified a publication-truth defect in the dashboard’s multi-project JSON handoff. The browser-side handler serializes selected local projects, creates a Blob URL, and clicks an anchor with a download filename. That action requests a browser download, but the application cannot know whether the browser saved, renamed, blocked, or canceled the file. The existing toast reused completion language after the request, which could be read as confirmation that the batch export had completed.

This was a stronger repair candidate than cosmetic export polish because it affected a primary multi-project production workflow and contradicted the project’s established policy not to claim durable browser download completion.

## Repair

The dashboard now uses a dedicated `batchExportRequested(count)` message after the browser handoff request. The existing `batchComplete` copy remains available for actual local archive/delete completion and is not used for the JSON download path. All five supported locales have explicit request-only copy:

| Locale | Copy shape |
|---|---|
| English | `{count} pattern exports requested` |
| German | `Export für {count} Muster angefordert` |
| French | `Export de {count} patrons demandé` |
| Spanish | `Exportación de {count} patrones solicitada` |
| Portuguese | `Exportação de {count} padrões solicitada` |

The repair changes no persistence model, server/API behavior, project selection rules, filename behavior, export payload, or browser handoff mechanism. It only makes the post-request claim truthful and keeps the change reversible.

## Verification

Focused regression coverage passed:

- `src/lib/dashboard-copy.test.ts`
- `src/pages/dashboard-batch-selection.test.ts`
- **2 files / 12 tests passed**
- Locale-specific copy assertions verify the count and reject completion-language leakage.
- Dashboard selection tests continue to cover selection, clear, and batch-action behavior.

Repository-wide gates passed on the exact code worktree:

- Full Vitest: **225 files / 2,592 tests passed**.
- Application TypeScript: passed.
- Workspace TypeScript: passed.
- Production build: passed in **4.84s**.
- `git diff --check`: passed.
- Source-bundle context verifier: passed; archive SHA `c19b71cdd06d250326d80eddc27685cbb627f91b03d85a624f0bb4894ba2a082`, 15 files.
- Protected invention brief SHA: unchanged at `5a7668a95841e7e74fc2dcf702cf1ffa94deed06d7029116919dcc0489b609ce`.

## Promotion and production proof

The code commit was committed and pushed audit-first:

- Audit/main code commit: `1660f0459965fc8d0e6f711dfc8d1d85d4aee794`.
- Remote audit branch and `main` were promoted by fast-forward only.
- The separate documentation follow-up is intentionally being committed after this code release.

Public deployment metadata for the exact code commit recorded:

- GitHub/Vercel deployment ID: `6049985718`.
- Environment: `Production`.
- State: `success`.
- Target: `https://stitch-and-scale-pro-api-server-2400dr5hv.vercel.app`.
- Created/updated: `2026-08-23T16:10:34Z`.

The active public alias `https://stitch-and-scale-pro-api-server.vercel.app` was then checked directly:

- Entry bundle: `/assets/index-DsVwb9pY.js`.
- Dashboard chunk: `/assets/dashboard-DXB8pPgC.js`, HTTP 200.
- The live dashboard chunk contains `batchExportRequested` and the request-only English marker. The prior completion handler marker is absent from the batch-export path.
- `/`, `/workspace`, `/grading`, and `/pdf` returned HTTP 200.
- `OPTIONS /api/mcp` from the approved active public origin returned 204.
- `OPTIONS /api/mcp` from `https://example.invalid` returned 403.

The active alias was initially still serving the prior entry asset immediately after promotion; a bounded poll observed the new entry asset after normal Git-to-Vercel propagation. The final proof uses the propagated asset graph, not the first stale response.

## Truth boundary

This checkpoint does **not** claim that the browser saved the batch JSON file. The application confirms only that it prepared the selected local projects and requested a browser download. Browser-controlled save, rename, block, and cancel outcomes remain outside the app’s reliable observability.

## Residual risks

Remaining risks include browser-native download completion limits; custom-domain and authenticated-MCP verification; below-320px, safe-area, and unusual zoom behavior; large lazy chunks on constrained mobile networks; lower-priority localized copy outside the repaired batch-export surface; and the isolated CSV-export branch, which must not be merged or reused blindly while its independent deployment/typecheck failure remains unresolved. The portable maker-identity/Stitch Score directive remains research-only and was not implemented.
