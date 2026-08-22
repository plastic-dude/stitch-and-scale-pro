# CHK-218 — Design Ledger CSV download handoff truthfulness

**Date:** 2026-08-22  
**Scope:** Design Ledger CSV export request and object-URL lifecycle  
**Code commit:** `03365ac597ef763afcd09322f2a13ae82cb3ae77` (`fix: make design ledger download handoff truthful`)  
**Production status:** Not deployed in this firing. Vercel created a READY target-null preview for the code-bearing commit, but both direct production deployment and promotion were rejected by the free-tier daily deployment limit. The active production alias still serves the previously proved release.

## Finding

The Design Ledger did create a CSV Blob and request a browser download, but it revoked the object URL immediately after calling `anchor.click()`. That cleanup timing can invalidate the browser handoff before the user agent has consumed the URL. The success toast also used completion-oriented `csvDownloaded` wording even though the application can only establish that it requested a browser download; it cannot prove that a file was delivered, saved, or opened.

This was a trust-boundary defect in a real export flow. The correction preserves the local-first CSV behavior while aligning its claim with observable browser behavior.

## Correction

`design-ledger-card.tsx` now keeps the generated object URL available until the browser’s next task before revoking it. The CSV remains generated locally from the current ledger state and is still requested through an anchor with the persisted filename; no server storage or external upload was introduced.

`design-ledger-copy.ts` replaces completion language with request-only wording in English, German, French, Spanish, and Portuguese. The request toast directs the user to check the browser’s Downloads location and does not claim that the file was delivered.

`design-ledger-export-contract.test.ts` adds a focused structural regression covering CSV Blob creation, anchor download request semantics, delayed URL cleanup, request-only copy, and five-locale parity.

## Evidence and gates

| Check | Result |
|---|---|
| Focused Design Ledger export and copy tests | Passed: 2 files, 9 tests |
| Full app Vitest suite | Passed: 218 files, 2,546 tests |
| App TypeScript check | Passed |
| Root TypeScript check | Passed |
| Production build | Passed in 4.78s; known non-fatal sourcemap-location warnings remain |
| `git diff --check` | Passed |
| Source-bundle verifier | Passed; expected archive SHA `c19b71cdd06d250326d80eddc27685cbb627f91b03d85a624f0bb4894ba2a082`, 15 files |
| Protected invention brief hash | Passed; SHA `5a7668a95841e7e74fc2dcf702cf1ffa94deed06d7029116919dcc0489b609ce` |
| Local four-width mobile smoke | Passed at 320/360/390/430px, including onboarding, dashboard, new project, workspace, export preflight, Grading Lab, and Design Ledger |
| Local Design Ledger route smoke | Passed at 390px: opened All Labs → Design Ledger → Export, clicked Download CSV, observed request-only toast, and confirmed no horizontal overflow |
| Active production four-width mobile smoke | Passed as baseline evidence only; active alias was not serving commit `03365ac` |
| Code-bearing Vercel preview | READY, deployment `dpl_FU8iVr2dMoSkAowwGaZaXyRegF9p`, SHA `03365ac597ef763afcd09322f2a13ae82cb3ae77`, target null, Git preview alias only |
| Production deployment attempt | Blocked: `api-deployments-free`, more than 100 deployments in the free-tier daily window |
| Promotion attempt | Blocked by the same Vercel resource limit; no alias was manually assigned |

The full Vitest run retains the known non-fatal reducer-context `indexedDB is not defined` messages in the non-browser environment; tests passed. The build retains the known six sourcemap-location warnings in `tooltip.tsx`, `label.tsx`, `dropdown-menu.tsx`, `sheet.tsx`, `select.tsx`, and `progress.tsx`.

## Release integrity

The verified code commit was pushed to `coder/perfection-audit-2026-08-22` first and then fast-forwarded to remote `main` after confirming that remote `main` still pointed to the expected parent. Both remote branches now point to `03365ac597ef763afcd09322f2a13ae82cb3ae77`. The worktree is clean after the source commit.

The active production alias remains [`stitch-and-scale-pro-api-server.vercel.app`](https://stitch-and-scale-pro-api-server.vercel.app) and does not yet contain CHK-218. The next release action is to retry promotion or production deployment after the Vercel quota window resets, then rerun active-alias route, four-width mobile, CSV route, and MCP/origin checks against the exact served SHA.

## Adjacent audit decisions

The Publication Package correction remains separate and schema-safe: metadata-only artifacts stay visibly unavailable unless a persisted safe URL exists. Receipt Lab was not changed because its image action honestly offers screenshot guidance and its share path describes handoff rather than delivery. Pattern PDF, Project Book, and Brag Card remain separate export surfaces with their existing evidence and residual risks.

This correction does not add persisted artifact retrieval, multi-project PDF export, or social sharing. `QUEUE-067` remains queued and research-only; it still requires a separate brief and two-pass research approval before work begins.

## Residual risks

The CSV handoff is now truthful and its object-URL lifecycle is safer, but browser download delivery remains inherently outside application control. The active production alias is stale relative to this commit because Vercel’s free-tier deployment resource limit blocked release promotion. Publication readiness therefore remains **not complete** for CHK-218 until the exact code-bearing commit is served from the active production alias and fresh live evidence is recorded.
