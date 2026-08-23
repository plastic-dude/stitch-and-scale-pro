# CHK-237 — PDF publication-package provenance alignment

**Date:** 2026-08-23  
**Role:** CODER II / publication-readiness continuation  
**Product goal:** Stitch & Scale Pro remains a trustworthy, local-first production-control layer for independent knitwear designers.

## Finding

The fresh WIDE RESEARCH pass did not find a safe reason to duplicate the already-correct onboarding install banner or archive empty-state work. It did find a concrete publication-control inconsistency in the existing package workflow. `ProjectCompilerCard` selected the current draft publication package and fell back to the newest package, while `ProjectPdf` always recorded a prepared PDF artifact in `publicationPackages[0]`.

New publication packages are prepended by the local persistence reducer, so the first entry is normally the newest package. That is not sufficient once a newer package has moved to `published` or another non-draft status while an older draft remains. In that state, the compiler and PDF surface could disagree about package ownership, placing metadata-only PDF provenance in a package that was no longer the current editable publication target. That weakens the package-scoped audit trail even though the PDF renderer itself remains deterministic.

## Repair

`project-pdf.tsx` now uses the same established rule as the compiler: select the first package whose status is `draft`, then fall back to the newest package for legacy or otherwise incomplete local data. The change is limited to the package ID used by `addPublicationArtifact`; it does not change the PDF payload, renderer, filename behavior, persistence schema, browser print handoff, or publication preflight.

The artifact remains explicitly metadata-only. It records that the browser print surface was prepared, never that the user saved a PDF. The toast remains the truthful preparation message. A source-level regression in `publication-package-workflow.test.ts` asserts the draft-first selector and rejects the old unconditional first-package assignment.

## Verification

| Gate | Result |
|---|---|
| Focused publication/export regressions | 3 files / 10 tests passed |
| Full Vitest suite | 225 files / 2,596 tests passed |
| Application TypeScript | Passed |
| Workspace TypeScript | Passed |
| Production build | Passed in 5.03 seconds |
| `git diff --check` | Passed |
| Source-bundle context verifier | Passed; archive SHA `c19b71cdd06d250326d80eddc27685cbb627f91b03d85a624f0bb4894ba2a082`, 15 files |
| Protected invention brief | Unchanged; SHA `5a7668a95841e7e74fc2dcf702cf1ffa94deed06d7029116919dcc0489b609ce` |

## Promotion

The code was committed on an isolated audit branch as `9a095d380f13424a7a5e8f694d688c836f3eade4` (`fix: record PDF artifacts on current draft package`). Its Vercel Preview deployment completed successfully as deployment `6050274521` at `2026-08-23T16:41:12Z`. After a fresh fetch and an explicit ancestry check, the audit commit was fast-forwarded from `origin/main` at `971d5b41a1a572ea91caeca2a91cf566cf4c3ecc` to `origin/main` at `9a095d380f13424a7a5e8f694d688c836f3eade4`.

GitHub/Vercel then reported the Production deployment for the exact main commit successful as deployment `6050281031` at `2026-08-23T16:41:53Z`. The remote audit branch `coder/pdf-package-artifact-target` and `main` were re-fetched and both resolved to the exact same full commit SHA. No connector or schedule configuration was changed.

## Active-alias proof

The active public alias was checked after Production completion with a cache-busting query. It returned HTTP 200 with `age: 0`, `x-vercel-cache: MISS`, and a fresh response ETag. Its entry HTML served `/assets/index-CDwOm9Nr.js`, matching the audited production build. The entry graph resolved the lazy PDF route to `/assets/project-pdf-Cj_QFzCD.js`, which returned HTTP 200 and contains the compiled `publicationPackages.find` draft-first selector plus the deliberate `[0]` legacy fallback. This proves the new frontend repair is present in the public alias’s code-split graph; entry HTML alone would not have been sufficient evidence.

The public MCP boundary also remained fail-closed. A preflight from the approved active origin returned HTTP 204 with the active origin echoed in `Access-Control-Allow-Origin`. A preflight from `https://example.invalid` returned HTTP 403 with JSON-RPC error `-32001` (`This MCP origin is not allowed.`). An approved-origin unauthenticated `tools/list` POST returned HTTP 401 with JSON-RPC error `-32003` (`MCP authorization failed.`). All three API responses used `cache-control: no-store`.

## Truth boundary and residual risks

This checkpoint proves the current static frontend release is serving the new package-provenance repair and that the MCP origin/authentication boundary is operating as designed. It does not claim an authenticated MCP tool listing or a real authenticated `grading.export_csv` invocation because no credential was available or inspected in this sandbox. The local MCP contract/server tests and the deployment-safe CSV import repair remain green, but authenticated production data-path verification is still an explicit follow-up boundary.

The application also cannot observe whether a browser actually saves, renames, blocks, or cancels a print-generated PDF. The PDF record therefore remains a preparation record only. Custom-domain behavior, authenticated MCP calls, below-320px and unusual safe-area/zoom behavior, large lazy chunks on constrained networks, and lower-priority locale surfaces remain residual risks. The original PR #73 remains open with head `cf1932e7e268c99a2767cacbb0ad566f75348dab` on an outdated base; its repaired Preview is green, but it must not be merged blindly because the equivalent feature is already integrated on newer `main` history.

## References

[1]: https://api.github.com/repos/plastic-dude/stitch-and-scale-pro/commits/9a095d380f13424a7a5e8f694d688c836f3eade4/status "GitHub commit status for the promoted main commit"

[2]: https://api.github.com/repos/plastic-dude/stitch-and-scale-pro/deployments?sha=9a095d380f13424a7a5e8f694d688c836f3eade4 "GitHub deployment records for the promoted main commit"

[3]: https://api.github.com/repos/plastic-dude/stitch-and-scale-pro/pulls/73 "GitHub pull request #73"

[4]: https://stitch-and-scale-pro-api-server.vercel.app/ "Stitch & Scale Pro active public alias"

[5]: https://stitch-and-scale-pro-api-server.vercel.app/api/mcp "Stitch & Scale Pro public MCP endpoint"
