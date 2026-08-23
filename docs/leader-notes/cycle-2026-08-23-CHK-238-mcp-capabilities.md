# CHK-238 — MCP reference resources, prompts, standards comparison, and protocol compatibility

**Date:** 2026-08-23  
**Author:** Manus AI  
**Product boundary:** Stitch & Scale Pro remains a local-first production-control layer for independent knitwear designers. This checkpoint adds read-only MCP context and comparison capability; it does not add accounts, cloud project storage, social/community behavior, gamification, or write operations.

## Why this checkpoint was selected

The required WIDE RESEARCH pass was completed before implementation. Independent tracks covered repository and branch reconciliation, open-PR overlap, MCP trust contracts, export truth, mobile and scroll behavior, accessibility and localization, bundle/performance, and active-alias release integrity. The strongest safe unfinished candidate was the open MCP capability proposal in PR #72: it addressed a real AI-client usability gap by exposing bounded reference material, user-controlled explanation prompts, deterministic CYC comparison, and a compatible protocol-version allowlist.

The proposal was stale relative to current `main` and overlapped the already-integrated PR #73 grading CSV capability. It was therefore not merged blindly. An isolated audit branch was created from the exact current `main` release, the PR #72 capability was reconciled explicitly, and the existing CSV contract and deployment-safe import were reintroduced with focused regressions. The result was reviewed as a union of capabilities, not as an unexamined historical merge.

## Implemented behavior

The MCP contract now exposes three static, allowlisted reference resources: the CYC sizing chart, the supported grading-key labels, and a contract summary containing server and tool versions. Resource reads are exact-URI matches and return deterministic JSON only; unknown URIs return `null` and the server maps them to a protocol error.

The contract also exposes four user-controlled prompt templates for explaining, teaching, checking, or selecting one next step from a supplied grading result. Prompt construction continues through the bounded `explainMcpGrade` path. Caller-supplied project names, notes, labels, and other embedded text remain untrusted data rather than instructions, and no prompt autonomously saves, publishes, shares, emails, or changes a project.

`grading.compare_standards` compares an explicitly supplied project’s resolved standard against the actual CYC baseline table, size by size and grading-key by grading-key. The implementation deliberately does not fabricate comparisons for future standard enum values that do not yet have independent backing tables. A genuine frozen Custom snapshot may produce deterministic deltas; a project resolving to CYC reports an identical comparison when appropriate.

The previously integrated `grading.export_csv` capability remains in the same contract and uses the canonical `buildGradingCsv` serializer already used by the in-app grading page. The source-level regression continues to require the deployment-safe relative ESM import `from './grading-engine.js'` and reject the failing Vite-only alias `from '@/lib/grading-engine'`.

The API handler now derives its accepted protocol-header versions from the contract allowlist rather than duplicating a single literal. Existing CORS, API-key authorization, request-size, content-type, rate-limit, and fail-closed error boundaries were preserved.

## Verification gates

| Gate | Result |
|---|---|
| Focused MCP, CSV, and API regressions | 4 files / 32 tests passed |
| Full application Vitest suite | 225 files / 2,604 tests passed |
| Application TypeScript | Passed |
| Workspace/root TypeScript | Passed |
| Production build | Passed in 4.69 seconds |
| `git diff --check` | Passed |
| Source-bundle context verifier | Passed; archive `c19b71cdd06d250326d80eddc27685cbb627f91b03d85a624f0bb4894ba2a082` |
| Protected invention brief | SHA-256 unchanged: `5a7668a95841e7e74fc2dcf702cf1ffa94deed06d7029116919dcc0489b609ce` |
| Unrelated source files changed | No; API and five MCP contract/server files only |

The full suite includes the previous PDF provenance, export-truth, mobile-clearance, localization, onboarding, and dashboard request-only regressions. Existing non-failing environment diagnostics remain known and are not new failures.

## Audit-first promotion

The verified source commit is `5b7865ede6681b933ef3a7409d045446ed3ce971` (`5b7865e`). It was pushed first to `coder/mcp-capability-audit`, received a successful Vercel Preview status, and was then promoted to `main` only after a fresh fetch and fast-forward ancestry check. Remote `main` and the audit branch both point exactly to `5b7865ede6681b933ef3a7409d045446ed3ce971`.

| Remote evidence | Result |
|---|---|
| Vercel Preview deployment | `6050594031`, successful |
| Vercel Production deployment | `6050600711`, successful |
| GitHub/Vercel status target for promoted main | `https://vercel.com/plastic-dudes-projects/stitch-and-scale-pro-api-server/6MwYeAQCn2RB7VgJ9fTQ24MN935w` |
| Active alias entry | `/assets/index-B8f1GAC_.js` |
| Active alias response | HTTP 200, `age: 0`, `x-vercel-cache: MISS`, `cache-control: public, max-age=0, must-revalidate` |
| Live frontend markers | Current dashboard chunk `/assets/dashboard-DIuMNvHY.js` contains five-locale `batchExportRequested` request-only copy; current PDF chunk `/assets/project-pdf-flwz1BaN.js` contains the draft-first package selector |
| Required routes | `/`, `/workspace`, `/grading`, and `/pdf` each returned HTTP 200 |

The browser alias proof verifies that the current promoted frontend is not serving the previously observed stale asset graph. The MCP server is a Vercel function and is not part of the browser bundle; its exact source is tied to the promoted commit and its deployment status is green, while the public runtime boundary below was exercised directly.

## Public MCP boundary proof

| Probe | Observed result | Interpretation |
|---|---|---|
| Approved-origin `OPTIONS /api/mcp` | HTTP 204; explicit approved `Access-Control-Allow-Origin`; `POST, OPTIONS`; required headers; `Vary: Origin` | CORS preflight remains allowed for the active origin |
| Forbidden-origin `OPTIONS /api/mcp` | HTTP 403; JSON-RPC `-32001` | Unapproved origins remain blocked |
| Approved-origin unauthenticated `POST /api/mcp` with `MCP-Protocol-Version: 2025-11-25` | HTTP 401; JSON-RPC `-32003` | Authorization remains fail-closed; no credential was guessed or exposed |

An authenticated production `tools/list`, `grading.compare_standards`, or `grading.export_csv` invocation is intentionally **not claimed** from this sandbox because no MCP credential was supplied. The local contract/server tests cover those dispatch paths, but a live authenticated call requires an authorized operator or separately provided test credential.

## PR and concurrency reconciliation

PR #72 remains open at head `9737c596ed932f76e87560045c59fb82c0a17bf8`, based on old `main` commit `8e64d9b218ac7e039b4b09b369109317d87b783f`. PR #73 remains open at repaired head `cf1932e7e268c99a2767cacbb0ad566f75348dab`, based on old `main` commit `3201cab54296111443e2b905a5d187597f8c2243`. Neither was merged blindly. The equivalent reviewed capabilities are now integrated into current `main` at `5b7865e`, preserving the later PDF provenance and export-truth work.

## Release checklist and residual risks

The current public frontend release has no known stale-alias or deployment-status blocker: the promoted commit is green in Production and the active alias serves fresh, current assets. The MCP source is deployed with preserved origin and authorization boundaries. Publication readiness is nevertheless conditional for the following explicitly unresolved limits: authenticated live MCP tool/resource/prompt execution; custom-domain and future browser-origin migration verification; durable browser print/save/cancel/share completion, which the app must not claim; below-320px, unusual safe-area, and browser-zoom coverage; large lazy bundles and the 208.93 kB compressed-by-source localization chunk; and lower-priority hardcoded locale surfaces.

The portable maker-identity/Stitch Score brief remains research-only and was not touched. No connectors or schedules were changed. No cloud sync, accounts, community features, gamification, or social expansion was introduced.

## References

[1]: https://github.com/plastic-dude/stitch-and-scale-pro/commit/5b7865ede6681b933ef3a7409d045446ed3ce971 "Promoted MCP capability commit"
[2]: https://api.github.com/repos/plastic-dude/stitch-and-scale-pro/commits/5b7865ede6681b933ef3a7409d045446ed3ce971/status "GitHub commit status"
[3]: https://api.github.com/repos/plastic-dude/stitch-and-scale-pro/deployments?sha=5b7865ede6681b933ef3a7409d045446ed3ce971 "GitHub deployment records"
[4]: https://github.com/plastic-dude/stitch-and-scale-pro/pull/72 "PR #72"
[5]: https://github.com/plastic-dude/stitch-and-scale-pro/pull/73 "PR #73"
[6]: https://stitch-and-scale-pro-api-server.vercel.app "Active public alias"
