# MCP transport: rate limiting and key rotation

## Status

Two hardening fixes to the `/api/mcp` transport shell (`api/mcp.ts`), landed together because they touch the same request path. Both are additive and backward-compatible: an existing deployment with a single bare `MCP_API_KEY` and no KV configuration behaves exactly as before.

This complements `docs/mcp-ai-grading.md`, which covers the tool contract and trust boundary. This document covers only the transport-layer changes below it.

## 1. Rate limiting: real vs. per-isolate

**Before:** the 60-requests-per-minute limit was tracked in a module-level `Map` inside `api/mcp.ts`. The MCP endpoint runs as a Vercel Edge Function, which may be served by several independent isolates concurrently, with no guarantee that repeat requests from one client land on the same isolate. The limit was therefore only a per-isolate approximation — under multi-isolate traffic the effective limit could be several times higher than configured, silently.

**After:** the limiting logic moved into `src/lib/mcp-rate-limit.ts` behind a `McpRateLimitStore` interface with two implementations:

- `InMemoryRateLimitStore` — the previous behavior, now isolated and unit-tested on its own. Still the zero-configuration default.
- `UpstashRateLimitStore` — a real, shared counter over the Upstash Redis REST API, used automatically once both `MCP_RATE_LIMIT_KV_URL` and `MCP_RATE_LIMIT_KV_TOKEN` are configured. A single pipelined `INCR` + `PEXPIRE ... NX` call keeps the fixed-window semantics identical to the in-memory version and costs one network round trip per request.

**Failure mode, by design:** if the configured store errors (for example, Upstash unreachable), the request is allowed through — `checkMcpRateLimit` fails *open*, not closed, and reports `failedOpen: true` so it can be logged. Rate limiting is a secondary defense here; `MCP_API_KEY` authorization is the primary access control and is unaffected by this failure mode. This tradeoff should be revisited if the rate limiter is ever the sole protection against abuse.

**Vercel configuration (optional):**

```text
MCP_RATE_LIMIT_KV_URL=<Upstash Redis REST URL>
MCP_RATE_LIMIT_KV_TOKEN=<Upstash Redis REST token>
```

Both are required together; a half-configured pair is treated as unconfigured and falls back to the in-memory store rather than guessing.

## 2. API key rotation without downtime

**Before:** `MCP_API_KEY` was a single static secret shared by every caller. A leaked key could not be revoked for one client without rotating it — and breaking access — for all of them, and there was no way to tell which caller a compromised key had belonged to.

**After:** `src/lib/mcp-auth.ts` accepts either form:

```text
# Legacy: unchanged, still works exactly as before
MCP_API_KEY=some-long-random-secret

# New: comma-separated, independently revocable per client
MCP_API_KEY=clientA:secretForClientA,clientB:secretForClientB
```

To revoke one client, remove its `keyId:secret` entry from the list and redeploy the env var — every other client keeps working. Every configured entry is checked (not short-circuited on the first mismatch) so response timing doesn't reveal how many keys are configured; the actual secret comparison per entry is still constant-time (`node:crypto.timingSafeEqual`), matching the original implementation.

## Verification

- `src/lib/mcp-rate-limit.test.ts` (13 tests) and `src/lib/mcp-auth.test.ts` (15 tests) — unit tests for the new modules in isolation.
- `src/lib/mcp-api-handler.test.ts` — extended with two new tests that exercise the real HTTP handler end-to-end: 60 requests succeed and the 61st returns a genuine `429` with `Retry-After: 60`; a revoked key is rejected while a sibling key continues to work.
- Full existing suite (2,677 tests across the app) passes unchanged; `tsc --noEmit` is clean for both the app package and `api/mcp.ts` against the project's own strict compiler options.
- **Not verified:** an actual live round trip against Upstash (no network path to `*.upstash.io` from the environment this was built in) or behavior under real Vercel multi-isolate production traffic. Both are integration concerns a static test suite can't settle — worth a smoke test against a real Upstash instance before this is relied on in production.

## Known follow-up

`docs/mcp-ai-grading.md`'s tool table is stale — it lists 5 tools; the live contract (`src/lib/mcp-contract.ts`) exposes 10 (`grading.export_csv`, `grading.compare_standards`, `export.project_book_pdf`, `export.brag_card`, and `calculate.marketplace_take_rate` are missing from it). Not fixed here to keep this change scoped to the transport layer, but flagged so it doesn't go stale further.
