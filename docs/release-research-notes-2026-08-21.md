
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
