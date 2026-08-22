
## Browser-confirmed deployment evidence

The public production URL again rendered a dark blank viewport with no detected interactive elements. The Vercel official REST documentation confirms that an authenticated deployment can be created or an existing deployment redeployed, that a production target assigns aliases, and that deployment state progresses through queued/building to ready or error. The production repair must therefore identify the Vercel project and deployment/alias state, trigger a deployment from the verified commit, and poll the resulting public alias rather than merely assuming that a Git push rebuilt production.

Vercel's Git documentation states that a production deployment should be created when the configured production branch receives a new commit, and that the production branch is controlled in Project Settings → Environments → Production → Branch Tracking. Vercel's Environments documentation distinguishes Preview from Production and supports manual promotion/rollback. The inspected project is Git-connected to `plastic-dude/stitch-and-scale-pro`, but recent deployments for the target project are failing before alias assignment with `lint_or_type_error` in the root `api/mcp.ts` handler.

## Fresh Vercel deployment evidence (2026-08-21)

- Official Vercel deployment API: `POST https://api.vercel.com/v13/deployments`; Git deployments can specify `project`, `target: production`, and `gitSource`, with response fields for `readyState`, `aliasAssigned`, `alias`, `errorCode`, and `errorMessage`. Source: https://vercel.com/docs/rest-api/deployments/create-a-new-deployment
- Official runtime log API: `GET /v1/projects/{projectId}/deployments/{deploymentId}/runtime-logs`; it returns a stream of runtime invocation records and requires runtime-log permissions. Source: https://vercel.com/docs/rest-api/logs/get-logs-for-a-deployment
- Commit `bb003d4` deployed to production but failed Vercel lint/type checking because `mcp-server.ts` used extensionless ESM imports.
- Commit `a5b5047` deployed but failed module resolution because `pdf/labels.ts` used the app-only `@/lib/i18n` alias in the serverless dependency graph.
- Commit `72c606c` produced Vercel deployment `dpl_2f6RtzHzuc6m5GhYXiukSP8XC59A`, `READY`, `target: production`, `aliasAssigned: true`, and aliases including `stitch-and-scale-pro-api-server.vercel.app`. The public HTML now references `assets/index-Cf9xo7xy.js` and no longer references stale `index-K0lrZ2kE.js`.
- Despite the READY deployment, `GET`, unauthenticated `POST`, and `OPTIONS` requests to `/api/mcp` returned HTTP 500 `FUNCTION_INVOCATION_FAILED`. Runtime-log stream retrieval did not return within the bounded request window. Further investigation is required; the frontend deployment is live, but the MCP serverless function is not yet publication-ready.

## CODER II firing — 2026-08-21

Fresh Vercel evidence:

- The official `FUNCTION_INVOCATION_FAILED` guidance says the error can come from the function or its environment, and requires checking application logs, reviewing function code, checking unhandled exceptions, and verifying function configuration: https://vercel.com/docs/errors/function_invocation_failed
- The official Node.js runtime guidance states that `/api` TypeScript functions may use Web Standard `fetch` exports or named HTTP method exports, that root `tsconfig.json` path mappings and project references are not supported by the Node.js runtime, and that Node.js dependencies are installed from the root lockfile: https://vercel.com/docs/functions/runtimes/node-js
- Live production evidence from this firing: deployment `dpl_mx6TeW8f3dw1KTtQrKTKC3DwFEGn` for commit `635c5f3` is READY and promoted, but `/api/mcp` still returns HTTP 500 `FUNCTION_INVOCATION_FAILED` for GET, OPTIONS, and unauthenticated POST. The lazy-loading repair therefore did not remove the runtime failure; the next diagnosis must isolate the handler entrypoint/runtime contract itself rather than guessing at PDF imports.

## CODER II firing — latest release-integrity evidence

- Commit `b73694f` is pushed to both `coder/perfection-foundation-2026-08-21` and `main`.
- Local gates passed after the Web Standard handler change: root TypeScript, app TypeScript, focused MCP handler/transport tests (11 tests), full application regression suite, and production build. The built initial chunk remains approximately 445 KB minified / 142.62 KB gzip.
- Vercel deployment `dpl_9USuXrkMUcYMNYfHu5YKqW36vmsS` for `main` commit `b73694f` is `READY`, `target: production`, and assigned the production alias. The public HTML references `assets/index-Cf9xo7xy.js`; stale `index-K0lrZ2kE.js` is absent.
- The live frontend is healthy at HTTP 200, but `GET /api/mcp`, `OPTIONS /api/mcp`, and unauthenticated `POST /api/mcp` still return HTTP 500 `FUNCTION_INVOCATION_FAILED`. The remaining blocker is a runtime entrypoint/module-load issue, not a stale frontend deployment or local type/test failure.
- Project context: Vercel project `stitch-and-scale-pro-api-server`, team slug `plastic-dudes-projects`, Node.js project setting `24.x`. The documented runtime-log endpoint was queried with the project and team context but did not return a bounded response; the next safe step is to reproduce the deployed handler boundary locally or inspect the deployed lambda artifact using the supported deployment API.
- Source scope for the current feature work remains uncommitted beyond `b73694f`; untracked audit/research files are intentionally excluded from production commits.

- Official Vercel changelog verification: Node.js Vercel Functions support the default Web Standard export `export default { fetch(request: Request) { return new Response(...) } }`; named HTTP method exports remain an alternative. Source: https://vercel.com/changelog/node-js-vercel-functions-now-support-fetch-web-handlers
- Official Functions API reference: Vercel Functions use a Web Handler with standard `Request`/`Response`; the documented examples show named `GET(request: Request)` exports for other frameworks and the reference links to the fetch Web Standard form. Source: https://vercel.com/docs/functions/functions-api-reference
- This rules out the `{ fetch }` shape alone as the remaining cause of the live 500. The next diagnosis must target module initialization or a dependency loaded before `handleMcpRequest` runs.

- Official Vercel runtime configuration documentation states that a non-framework project must add `"type": "module"` to `package.json` or use `.mjs` extensions for JavaScript Functions. The repository root package currently has no `type` field while the Vercel API source uses ESM imports and a Web Standard handler. This is the leading explanation for a successful build followed by `FUNCTION_INVOCATION_FAILED` on every `/api/mcp` request. Source: https://vercel.com/docs/functions/configuring-functions/runtime


## Final deployment verification evidence (2026-08-21)

Official Vercel redeploy reference: https://vercel.com/docs/rest-api/deployments/create-a-new-deployment. It documents `POST /v13/deployments` with an existing `deploymentId` to trigger a fresh build.

Commit `ce23e49` initially failed on Vercel with `lint_or_type_error`: `artifacts/stitch-and-scale/src/lib/brag-card.ts` required explicit `.js` specifiers under NodeNext. Commit `0eabc01` fixed those imports, but Vercel then reported unresolved aliases in `brag-copy.ts`; commit `3edb0d7` replaced those aliases with explicit relative `.js` imports. Vercel then reported the remaining `receipt-lab.ts` alias; commit `ef416ca` replaced it with `./numeric-guard.js`.

Local evidence after `ef416ca`: root TypeScript passed, app TypeScript passed, focused MCP/Brag Card tests passed (5 files, 34 tests), full Vitest passed (175 files, 2,275 tests), and the production Vite build passed.

Vercel deployment `dpl_GG4p7rweRfbLkVsxCz6rsihnSNAP` for `ef416ca` reached READY. A redeploy with `POST /v13/deployments` using that deployment ID returned `dpl_Dd8NFbQputVUoKZCzv4hiuQxQ9cw`, which also reached READY.

Production checks immediately after redeploy: `GET /api/mcp` without an Origin returned 405 as intended. A request carrying the public Origin returned 403 origin-not-allowed for both OPTIONS and POST, indicating the current public origin is not yet reflected in `MCP_ALLOWED_ORIGIN` on the deployed function; this remains an active configuration issue to resolve. The earlier pre-configuration POST without auth returned 503 with the explicit MCP-disabled message, proving the endpoint was then fail-closed when `MCP_API_KEY` was absent.

The project environment API accepted creation of production-scoped `MCP_API_KEY` and `MCP_ALLOWED_ORIGIN` variables with HTTP 201, but the redeployment from an existing deployment still returned 403 for the configured Origin. A fresh Git-source production deployment is required to ensure the current project environment snapshot is loaded rather than relying on an older deployment snapshot.


## MCP registry consistency hardening (2026-08-21)

The local audit found a real contract-quality defect: `getMcpToolNames()` listed `export.brag_card` before `calculate.marketplace_take_rate`, while `getMcpToolDefinitions()` and the live `tools/list` response exposed the reverse order. Membership was identical, but consumers relying on deterministic registry order could observe inconsistent contracts. The definitions were reordered to the canonical sequence and the contract test now asserts that helper names exactly equal the definition names; the transport test was aligned to the same sequence.

Post-fix local evidence: root TypeScript passed, app TypeScript passed, the focused MCP subset passed (4 files, 21 tests), the full Vitest suite passed (175 files, 2,275 tests), and the production build passed. The post-fix source still requires a fresh Vercel deployment before the live order can be rechecked.


## Registry-order release verification (2026-08-21)

Commit `9846ae0` was pushed to both `coder/perfection-foundation-2026-08-21` and `main`. Fresh Git-source production deployment `dpl_EsioRhDUiz2aJtaHXkkjvUyf7D6a` reached READY at `stitch-and-scale-pro-api-server-f2coi3ppf.vercel.app`.

The public alias `https://stitch-and-scale-pro-api-server.vercel.app/api/mcp` now passes the final transport checks: GET returns 405, allowed-origin OPTIONS returns 204 with `Access-Control-Allow-Origin: https://stitch-and-scale-pro-api-server.vercel.app`, authenticated `tools/list` returns HTTP 200 with no JSON-RPC error, and the eight tools appear in canonical order: `project.intake`, `project.validate`, `grading.run`, `grading.explain`, `export.pattern_pdf`, `export.project_book_pdf`, `export.brag_card`, `calculate.marketplace_take_rate`. A request from `https://example.com` returns 403, confirming origin allowlisting remains fail-closed. The deployment URL redirects to the public alias, so the alias is the authoritative live smoke-test target.


## CODER II firing — 2026-08-22: main synchronization and registry-derived public truth

Before committing, the audit branch was reconciled with newer agent work. Local audit head `6aa86f0` was safely fast-forwarded to origin/main commit `5e4cc73` (`CHK-186`, Pattern Compiler and mathematical validation). The truthfulness patch was stashed before synchronization and reapplied; the only merge conflict was the five-locale lab title/ARIA pair in `workspace-copy.ts`. Resolution preserved the compiler release and replaced hardcoded counts with the canonical `TAB_COUNT` expression. The current registry contains 83 entries.

The repair makes landing stats, localized workspace titles and ARIA labels, and onboarding search-description counts derive from `TAB_REGISTRY`/`TAB_COUNT`. Spanish and Portuguese onboarding descriptions use `{count}` interpolation supplied by `TAB_COUNT` at render time. The count-drift, tab-visibility, and revision-snapshot contracts now derive expected totals from the registry instead of encoding historical literals. Source scanning found no remaining 79-lab claims in `src` after the repair.

Commit `53b9cee` was created after staged whitespace validation and pushed to both `coder/perfection-audit-2026-08-22` and `main`. Fresh post-merge evidence: root TypeScript passed; app TypeScript passed; 195 test files and 2,365 tests passed; production build passed in 4.53 seconds. The Vite build continues to emit six non-fatal sourcemap-location warnings for `tooltip`, `dropdown-menu`, `label`, `sheet`, `select`, and `progress`; they do not fail the build but remain a release-hygiene cleanup candidate.

Fresh Git-source production deployment `dpl_2VnNosNsZ8Cn9PsAVWvj5jnAY2i2` was created from full commit `53b9ceea7a440fe25f80b0bc156c29a2371384d6` and reached READY. Public alias checks passed: GET `/api/mcp` returned 405; allowed-origin OPTIONS returned 204; authenticated JSON-RPC `tools/list` returned 200 with all eight tools in canonical order: `project.intake`, `project.validate`, `grading.run`, `grading.explain`, `export.pattern_pdf`, `export.project_book_pdf`, `export.brag_card`, `calculate.marketplace_take_rate`; rejected-origin POST returned 403 with MCP error `-32001`. The deployment-specific URL is protected by Vercel and returned 302/401, so the public alias is the authoritative release check.

The pre-sync stash remains temporarily retained as a recovery precaution and contains only the already-committed pre-sync audit patch; no credentials or `/home/ubuntu/first_novel_invention_brief.md` were modified.


## Exact-main release integrity recheck — 2026-08-22

The repository was rechecked against origin before release: origin/main had advanced from the audit branch’s `6aa86f0` to agent commit `5e4cc73`; the audit branch was fast-forwarded safely, its patch was reapplied, and the resulting correction was committed as `53b9cee`. The evidence-only follow-up commit `d3abf16` was then pushed to both the audit branch and `main`, leaving no uncommitted changes or recovery stashes.

To eliminate any ambiguity between the verified code commit and the current main tip, a fresh Git-source production deployment was created from full commit `d3abf163a29a79a780e4a6f29c4dd00de8315762`: deployment `dpl_9qG2w7A2oSfzwpgHzk5GuPVBPifw` reached READY. The public alias remained healthy after this exact-main deployment: GET `/api/mcp` returned 405, allowed-origin OPTIONS returned 204, authenticated JSON-RPC `tools/list` returned 200 with eight tools in canonical order, and a disallowed origin returned 403 with MCP error `-32001`.
