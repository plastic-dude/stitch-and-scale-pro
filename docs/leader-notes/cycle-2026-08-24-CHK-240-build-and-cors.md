# CHK-240 — Deterministic workspace release gate and fail-closed MCP CORS

**Date:** 2026-08-24

**Author:** Manus AI

**Product boundary:** Stitch & Scale Pro remains a local-first production-control layer for independent knitwear designers. This checkpoint changes only workspace release determinism, static deployment headers, and MCP boundary regression coverage. It adds no accounts, cloud project storage, social/community behavior, gamification, write operations, or browser-local-data access from another device.

## Why this checkpoint was selected

The required WIDE RESEARCH pass was completed before implementation. Independent audit tracks reviewed the current repository and remote ancestry, recent changes and stale PR overlap, application and workspace quality commands, production routing and asset markers, export and MCP trust surfaces, mobile/accessibility/localization/onboarding contracts, source-bundle and protected-brief integrity, and the still-blocked Claude OAuth path.

The highest-impact safe defects were release-integrity defects rather than a product-surface rewrite. The repository-level `pnpm build` command could be terminated while recursively building workspace packages in parallel on the constrained release runner, even though serial package builds passed. Separately, `vercel.json` added `Access-Control-Allow-Origin: *` to every `/api/*` response while `api/mcp.ts` already implemented exact, environment-controlled origin matching. The static wildcard could therefore appear on a forbidden-origin 403 and contradicted the product's fail-closed MCP boundary.

## Implemented behavior

The root `package.json` build script now invokes recursive workspace builds with `--workspace-concurrency=1`. This is intentionally a release-runner reliability change, not a runtime performance change: each package keeps its own build script, while the top-level gate no longer relies on simultaneous memory-heavy builds.

The mockup sandbox build script now supplies its documented `PORT=8081` and `BASE_PATH=/__mockup` values only to the build command. Its runtime Vite configuration still rejects missing explicit runtime values, so deterministic artifact generation does not weaken preview/runtime validation. A focused deployment-security test prevents either contract from regressing.

The static Vercel CORS header overlay was removed. `api/mcp.ts` is now the sole CORS authority: approved origins receive the exact configured origin and MCP methods/headers; forbidden origins receive a JSON-RPC 403 without `Access-Control-Allow-Origin`; requests without an origin remain usable for non-browser MCP clients. The existing comma-separated `MCP_ALLOWED_ORIGIN` override and active-alias fallback remain unchanged, preserving future custom-domain migration without a wildcard.

The previously exposed Production `MCP_API_KEY` was rotated through the authorized Vercel project API and the current Production deployment was redeployed. The replacement value was held privately and is not recorded here. A private live authenticated `tools/list` probe returned HTTP 200 and included `project.intake` and `export.project_book_pdf`; no credential value was printed or committed.

## Verification gates

| Gate | Result |
|---|---|
| Focused deployment/MCP regression | 2 files / 13 tests passed after CORS hardening |
| Full application Vitest suite | 225 files / 2,607 tests passed |
| Application TypeScript | Passed |
| Workspace/root TypeScript | Passed |
| Exact top-level `pnpm run build` | Passed; application bundle in 4.72 seconds and workspace build completed |
| `git diff --check` | Passed before promotion |
| Source-bundle context verifier | Passed; archive `c19b71cdd06d250326d80eddc27685cbb627f91b03d85a624f0bb4894ba2a082`, 15 files |
| Protected invention brief | SHA-256 unchanged: `5a7668a95841e7e74fc2dcf702cf1ffa94deed06d7029116919dcc0489b609ce` |
| Promotion history | Fast-forward only: `c1e2243` → `b914d93` → `9d6186f` → `663a344`; no stale main overwrite |
| Source scope | Build determinism, mockup build contract, Vercel headers, two focused test files, and the required bundle reading receipt only |

The full suite includes existing grading, export/provenance, publication-package, receipt, localization, onboarding, responsive/mobile, accessibility, and MCP/API contract tests. Known non-failing persistence diagnostics and existing sourcemap/build-size notices remain non-blocking and are not misreported as new failures.

## Audit-first promotion and live release proof

The verified implementation commit is `9d6186f966a13a5bd35a242a5a0646d3f356c59c` (`9d6186f`), created from exact remote `main` parent `b914d9347ab96f340bc794205f4a7a2772bca825`, pushed first to `coderii/mcp-cors-fail-closed-20260824`, and promoted to `main` only after a fresh ancestry check. The evidence note was then committed as `663a34412c6fbc1cd65d937545a6c5c44ed1557b` (`663a344`) from that verified implementation, pushed first to `coderii/chk-240-evidence-20260824`, and fast-forwarded to `main`. The final Vercel Production deployment `dpl_482zeWJy2jRA4wJUMiXpEwCQPxfz` reported READY for `663a344`; the active alias was then re-probed after the authorized key rotation.

| Public probe | Observed result | Interpretation |
|---|---|---|
| Active frontend entry | HTTP 200; `/assets/index-B8f1GAC_.js` present | Alias serves the verified current frontend release marker |
| `GET /api/mcp` | HTTP 405, JSON-RPC `-32600`; `POST, OPTIONS` allow | Endpoint is not a browser GET API and retains its stateless JSON-RPC contract |
| Approved-origin `OPTIONS /api/mcp` | HTTP 204; exact `Access-Control-Allow-Origin: https://stitch-and-scale-pro-api-server.vercel.app` | Runtime CORS policy accepts only the configured active origin |
| Forbidden-origin `OPTIONS /api/mcp` | HTTP 403, JSON-RPC `-32001`; no `Access-Control-Allow-Origin` | Wildcard overlay is gone; denied origins fail closed |
| Approved-origin unauthenticated `POST /api/mcp` | HTTP 401, JSON-RPC `-32003`; exact origin response | Authorization remains required |
| Authenticated `tools/list` with rotated Production key | HTTP 200; required MCP tools present | Legacy direct-Bearer client path still works after rotation |
| OAuth protected-resource metadata | HTTP 200 `text/html` SPA fallback | Deliberately recorded as an unimplemented OAuth blocker, not claimed as valid metadata |
| OAuth authorization-server metadata | HTTP 200 `text/html` SPA fallback | Same blocker; Claude URL-only hosted Connector flow is not yet compatible |

## OAuth decision and residual release risks

The Claude-compatible OAuth implementation remains intentionally unpublished. The private Vercel environment audit found only `MCP_ALLOWED_ORIGIN` and `MCP_API_KEY` in Production; no durable KV/Redis/Upstash state store and no separate `MCP_OAUTH_SIGNING_SECRET` are configured. The provisional OAuth code uses stateless signed authorization codes and refresh tokens, which is not sufficient for one-time code consumption or refresh-token rotation/revocation across Vercel instances. It must not be deployed until a durable state provider and separate signing secret are explicitly provisioned and the owner-only consent model is made honest. The direct Bearer path remains available for clients that can set an Authorization header; the Claude URL-only connector remains blocked by design rather than by a fake metadata response.

The public release has no known stale-alias or failed-deployment blocker for the changes in this checkpoint. Residual risks remain explicit: durable OAuth state and per-user/owner consent architecture; actual Claude hosted-connector validation; browser proof of native print/save/cancel/share completion; visual testing below 320px, unusual safe-area/zoom, and device-specific browser chrome; large lazy chunks including the localization bundle; lower-priority hardcoded locale surfaces; and direct visual inspection of every export artifact. The portable maker-identity/Stitch Score brief remains research-only and was not touched. No connectors or schedules were changed.

## References

[1]: https://github.com/plastic-dude/stitch-and-scale-pro/commit/9d6186f966a13a5bd35a242a5a0646d3f356c59c "Verified build and MCP CORS implementation"
[2]: https://stitch-and-scale-pro-api-server.vercel.app "Active public alias"
[3]: https://vercel.com/plastic-dudes-projects/stitch-and-scale-pro/482zeWJy2jRA4wJUMiXpEwCQPxfz "Final Vercel Production deployment"
[4]: https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp "Claude hosted Custom Connector documentation"
[5]: https://modelcontextprotocol.io/specification/draft/basic/authorization "MCP authorization specification"
[6]: https://github.com/anthropics/claude-ai-mcp/issues/110 "Claude Custom Connector static-header compatibility issue"
[7]: https://github.com/anthropics/claude-ai-mcp/issues/112 "Claude Custom Connector authorization-header compatibility issue"
