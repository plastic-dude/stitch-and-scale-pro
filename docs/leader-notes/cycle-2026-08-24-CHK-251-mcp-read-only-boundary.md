# CHK-251 — MCP read-only artifact boundary correction

**Date:** 2026-08-24

**Role:** CODER II

**Repository:** `plastic-dude/stitch-and-scale-pro`

**Branch:** `coderii/queue-070-release-draft-v1-053155`

**Code commit:** `66d2334cc968977b5a2e40d5c72815a52314115d`

**Origin main at audit:** `81a94bdd45006da7e904a9e7fc7a969d944e98fc`

## Decision

This firing corrected a trust-boundary mismatch in the MCP surface. The server previously advertised three binary artifact-generation names as if they were read-only tools and still retained an asynchronous dispatch path capable of preparing PDF or SVG artifacts. That behavior was inconsistent with the product’s currently approved MCP posture: deterministic, explicit-input, read-only calculations and grading assistance only; no MCP write behavior, artifact persistence, social posting, cloud sync, account flow, or external-success claim.

The correction is intentionally narrow and reversible. `export.pattern_pdf`, `export.project_book_pdf`, and `export.brag_card` are no longer returned by `tools/list`, are no longer included in the tool-name contract, and now return the normal unknown-tool error (`-32601`) through both synchronous and asynchronous dispatch. The internal artifact workflow modules were not deleted or broadened; they remain outside the callable MCP surface for a future separately reviewed decision.

The remaining `calculate.marketplace_take_rate` asynchronous path returns JSON text and structured calculation content only. It does not create a binary resource, save data, browse a platform, read account data, or persist a result.

## Verification

The following checks passed on the candidate code before commit:

| Gate | Result |
|---|---|
| Focused MCP contract/server/API-handler suites | 3 files, 31 tests passed |
| Full application Vitest suite | 230 files, 2,645 tests passed |
| App TypeScript | Passed with `pnpm exec tsc --noEmit` |
| Deterministic monorepo build | Passed; Vite application and API bundle built |
| Diff whitespace | Passed |
| Source-bundle context verifier | Passed; archive `c19b71cdd06d250326d80eddc27685cbb627f91b03d85a624f0bb4894ba2a082`, 15 files |
| Protected invention brief | SHA-256 remains `5a7668a95841e7e74fc2dcf702cf1ffa94deed06d7029116919dcc0489b609ce` |
| Changed-path scope | Passed; only the MCP contract/server and three focused test files changed |
| Credential-shaped diff scan | Passed; no credential-shaped content found |

The focused regression coverage now asserts the exact safe tool list, rejects all three binary artifact names from discovery, and proves both dispatch paths return `-32601` for an artifact-generation call. The HTTP contract test also confirms the advertised public list excludes all three names.

## Product and safety boundary

No UI, local project schema, exportable format, social-share control, camera permission, media upload, remote media fetch, account/OAuth flow, cloud synchronization, analytics, connector, schedule, or MCP write behavior was added. The change does not claim that any artifact was saved, downloaded, published, posted, shared, or delivered to a platform.

The correction supports the product goal by making the AI-facing surface more truthful: a tool is not presented as read-only when it can create a binary artifact, and an undocumented asynchronous route cannot bypass the advertised contract.

## Release status

The branch was pushed successfully through the private credential-safe helper. `origin/main` was not changed. No Vercel deployment retry or main promotion was performed in this firing because the repository already has an active Free-tier `api-deployments-free-per-day` capacity blocker. The exact candidate commit therefore has no newly verified READY deployment, alias assignment, or no-cache public smoke in this record.

The public release remains **release-blocked**, not publication-ready. When Vercel capacity is available, the remaining release proof is an exact-SHA deployment, READY status, alias confirmation, and fresh no-cache checks for the root route plus the approved-origin/forbidden-origin MCP CORS and authentication boundaries. OAuth discovery remains intentionally unshipped.

## Evidence files

- Focused tests: `/tmp/queue071-mcp-focused-20260824.log`
- Full application tests: `/tmp/queue071-full-vitest-20260824.log`
- App TypeScript: `/tmp/queue071-mcp-ts-20260824.log`
- Root build: `/tmp/queue071-root-build-20260824.log`
- Hygiene: `/tmp/queue071-hygiene-20260824.log`
- WIDE audit: `/tmp/queue071-wide-audit-20260824/`

## References

No external source was used for this implementation decision. The product boundary is grounded in the repository’s authoritative local-first release brief: `docs/research/portable-maker-social-release-2026-08-24.md`, and the existing MCP contract and server tests in `artifacts/stitch-and-scale/src/lib/`.
