# CHK-239 — MCP origin fallback aligned with the active public alias

**Date:** 2026-08-23

**Author:** Manus AI

**Product boundary:** Stitch & Scale Pro remains a local-first production-control layer for independent knitwear designers. This checkpoint changes only the MCP CORS fallback configuration and its regression coverage. It does not add accounts, cloud project storage, social/community behavior, gamification, or write operations.

## Why this checkpoint was selected

The required WIDE RESEARCH pass was completed before implementation. Independent tracks reconciled the repository and remote branches, reviewed open PR overlap, checked the active public deployment and code-split assets, audited export and publication provenance, inspected mobile and scroll constraints, reviewed accessibility and localization, and re-checked MCP/API trust boundaries. The open PR proposals were stale or already integrated, so none was merged blindly.

The strongest unfinished defect was a real origin-migration inconsistency in the API source. The active public frontend alias is `https://stitch-and-scale-pro-api-server.vercel.app`, while the MCP handler’s no-environment-variable fallback still named the older `https://stitch-and-scale-pro.vercel.app` alias. The handler already supported a comma-separated `MCP_ALLOWED_ORIGIN` environment override, which remains the correct path for a future custom domain. The safe repair was therefore to align only the secure fallback with the current active alias, without widening the allowlist or weakening the fail-closed behavior.

## Implemented behavior

`api/mcp.ts` now defines `DEFAULT_MCP_ALLOWED_ORIGIN` as `https://stitch-and-scale-pro-api-server.vercel.app` and uses it only when `MCP_ALLOWED_ORIGIN` is absent or blank. The existing comma-separated environment override remains unchanged, so an operator can explicitly configure a future custom domain or a deliberate multi-origin deployment. Origin comparison remains exact after trimming configured entries; there is no wildcard, substring, protocol downgrade, or implicit reflection of an untrusted origin.

The API continues to reject a request carrying an unapproved `Origin` before it reaches authentication or dispatch. Approved preflight remains 204, forbidden preflight remains 403 with JSON-RPC `-32001`, and approved unauthenticated POST remains 401 with JSON-RPC `-32003`. No request-size, content-type, rate-limit, protocol-version, API-key, or read-only MCP contract behavior changed.

A focused regression now verifies that, with the environment override removed, the active public alias receives 204 and the stale alias receives 403. The existing configured-origin test remains in place, preserving future custom-domain migration coverage.

## Verification gates

| Gate | Result |
|---|---|
| Focused MCP/API regressions | 3 files / 31 tests passed |
| Full application Vitest suite | 225 files / 2,605 tests passed |
| Application TypeScript | Passed |
| Workspace/root TypeScript | Passed |
| Production build | Passed in 4.93 seconds |
| `git diff --check` | Passed |
| Source-bundle context verifier | Passed; archive `c19b71cdd06d250326d80eddc27685cbb627f91b03d85a624f0bb4894ba2a082` |
| Protected invention brief | SHA-256 unchanged: `5a7668a95841e7e74fc2dcf702cf1ffa94deed06d7029116919dcc0489b609ce` |
| Source scope | Only `api/mcp.ts` and `mcp-api-handler.test.ts` changed |

The full suite includes the prior MCP resources/prompts/standards-comparison, grading CSV, PDF provenance, export-truth, mobile-clearance, localization, onboarding, and dashboard handoff regressions. Existing non-failing environment diagnostics remain known and are not new failures.

## Audit-first promotion

The verified source commit is `c1873c656d8c223e8797b44125c527741510d8e0` (`c1873c6`). It was created from the exact remote `main` parent `c6b9986cb67c2c2b11c48fb3b9b3a863d52f2cc2`, pushed first to `coder/origin-fallback-repair`, and then promoted to `main` only after a fresh fetch and an explicit parent equality check. After promotion, both remote refs were verified at `c1873c656d8c223e8797b44125c527741510d8e0`.

| Remote evidence | Result |
|---|---|
| Vercel Preview deployment | `6050867063`, successful |
| Vercel Production deployment | `6050870992`, successful |
| GitHub/Vercel Production status target | `https://vercel.com/plastic-dudes-projects/stitch-and-scale-pro-api-server/7X4roLgcBTembEjsRqSicWGZnJEP` |
| Active alias response after Production | HTTP 200, `age: 0`, `x-vercel-cache: MISS`, `last-modified: Sun, 23 Aug 2026 17:45:59 GMT` |
| Active frontend entry | `/assets/index-B8f1GAC_.js` |
| Required routes | `/`, `/workspace`, `/grading`, and `/pdf` each returned HTTP 200 |

The browser bundle does not contain the Vercel function source, so the API-only repair cannot be proven through a frontend marker. The fresh active-alias response and direct function probes below are the appropriate public evidence; deployment metadata ties the function source to the promoted commit.

## Public MCP boundary proof

| Probe | Observed result | Interpretation |
|---|---|---|
| Approved-origin `OPTIONS /api/mcp` | HTTP 204; `Access-Control-Allow-Origin: https://stitch-and-scale-pro-api-server.vercel.app`; required headers and `POST, OPTIONS`; `Cache-Control: no-store`; Vercel cache MISS | Active public origin remains accepted |
| Forbidden-origin `OPTIONS /api/mcp` | HTTP 403; JSON-RPC `-32001`; `Cache-Control: no-store`; Vercel cache MISS | Unapproved origins remain blocked |
| Approved-origin unauthenticated `POST /api/mcp` | HTTP 401 with the active-origin CORS response | Authorization remains fail-closed |

These probes did not include or expose an MCP credential. An authenticated production `tools/list`, `grading.compare_standards`, or `grading.export_csv` invocation remains intentionally unclaimed. Because production environment variables are not publicly inspectable, the live 204/403 results prove the effective deployed boundary but do not independently distinguish the explicit environment override from the newly corrected fallback constant.

## Release checklist and residual risks

The current public release has no known stale-alias or failed-deployment blocker. The origin fallback is now aligned with the active alias, and the environment override remains ready for a future custom domain. The CORS and authorization boundary is still fail-closed.

Residual risks remain explicit: authenticated live MCP execution; operator verification of the production `MCP_ALLOWED_ORIGIN` value during custom-domain migration; durable browser print/save/cancel/share completion, which the app must not claim; below-320px, unusual safe-area, and browser-zoom coverage; large lazy bundles and the 208.93 kB compressed-by-source localization chunk; and lower-priority hardcoded locale surfaces. The portable maker-identity/Stitch Score brief remains research-only and was not touched. No connectors or schedules were changed.

## References

[1]: https://github.com/plastic-dude/stitch-and-scale-pro/commit/c1873c656d8c223e8797b44125c527741510d8e0 "Promoted origin fallback repair"
[2]: https://api.github.com/repos/plastic-dude/stitch-and-scale-pro/commits/c1873c656d8c223e8797b44125c527741510d8e0/status "GitHub commit status"
[3]: https://api.github.com/repos/plastic-dude/stitch-and-scale-pro/deployments?sha=c1873c656d8c223e8797b44125c527741510d8e0 "GitHub deployment records"
[4]: https://stitch-and-scale-pro-api-server.vercel.app "Active public alias"
[5]: https://github.com/plastic-dude/stitch-and-scale-pro/pull/72 "PR #72 remains open and outdated"
[6]: https://github.com/plastic-dude/stitch-and-scale-pro/pull/73 "PR #73 remains open and outdated"
