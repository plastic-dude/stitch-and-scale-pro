/**
 * Pluggable request-rate limiting for the MCP transport.
 *
 * The MCP endpoint runs as a Vercel Edge Function, which may be served by
 * several independent isolates concurrently and does not guarantee that
 * repeat requests from the same client land on the same isolate. A limiter
 * backed only by a module-level Map is therefore only a per-isolate
 * approximation of the configured limit, not a real one - under
 * multi-isolate traffic the effective limit can be several times higher
 * than configured, silently.
 *
 * This module keeps that in-memory approximation as the zero-configuration
 * default (safe, always available, no external dependency, correct for a
 * single isolate or local dev) and adds an optional Upstash Redis
 * REST-backed store that becomes a real, shared limit once
 * MCP_RATE_LIMIT_KV_URL and MCP_RATE_LIMIT_KV_TOKEN are both configured.
 */

export interface McpRateLimitStore {
  /**
   * Increments the counter for `key` and returns the count AFTER the
   * increment. Implementations must create the key with count 1 and an
   * expiry of `windowMs` if it does not already exist, and must not reset
   * that expiry on every increment - this is a fixed window, not a rolling
   * one, matching the previous in-file behaviour exactly.
   */
  increment(key: string, windowMs: number): Promise<number>;
}

export const MCP_RATE_LIMIT_WINDOW_MS = 60_000;
export const MCP_RATE_LIMIT_MAX_REQUESTS = 60;
const MAX_IN_MEMORY_BUCKETS = 2_000;

/** Zero-configuration default. A real limit, but only per-isolate; see module doc. */
export class InMemoryRateLimitStore implements McpRateLimitStore {
  private readonly buckets = new Map<string, { startedAt: number; count: number }>();

  constructor(private readonly maxBuckets: number = MAX_IN_MEMORY_BUCKETS) {}

  async increment(key: string, windowMs: number): Promise<number> {
    const now = Date.now();
    const current = this.buckets.get(key);
    if (!current || now - current.startedAt >= windowMs) {
      this.buckets.set(key, { startedAt: now, count: 1 });
      if (this.buckets.size > this.maxBuckets) this.buckets.clear();
      return 1;
    }
    current.count += 1;
    return current.count;
  }
}

/**
 * Upstash Redis REST-compatible store, shared across every isolate. Uses a
 * single pipelined INCR + "PEXPIRE ... NX" call so the window is only set on
 * the first request in a bucket (fixed window, matching
 * InMemoryRateLimitStore's semantics exactly) and the whole check is one
 * network round trip.
 */
export class UpstashRateLimitStore implements McpRateLimitStore {
  constructor(private readonly restUrl: string, private readonly restToken: string) {}

  async increment(key: string, windowMs: number): Promise<number> {
    const response = await fetch(`${this.restUrl.replace(/\/+$/, '')}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.restToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        ['INCR', key],
        ['PEXPIRE', key, String(windowMs), 'NX'],
      ]),
    });
    if (!response.ok) {
      throw new Error(`MCP rate limit store request failed with status ${response.status}.`);
    }
    const results = (await response.json()) as Array<{ result?: unknown }>;
    const incrResult = results[0]?.result;
    if (typeof incrResult !== 'number') {
      throw new Error('MCP rate limit store returned an unexpected response shape.');
    }
    return incrResult;
  }
}

export interface McpRateLimitResult {
  limited: boolean;
  count: number;
  /** True if the store failed (e.g. network error) and the request was allowed through as a result. */
  failedOpen: boolean;
}

/**
 * Checks and increments the caller's request count.
 *
 * On a store error (for example, an unreachable Upstash endpoint) this
 * fails OPEN: the request is allowed through rather than taking the whole
 * endpoint dark for every caller because of an unrelated infrastructure
 * outage. `failedOpen` is reported so the caller can log or alert on it.
 * This is a deliberate availability-over-strictness tradeoff for a
 * secondary defense - MCP_API_KEY authorization is the primary access
 * control and is unaffected by this failure mode - and should be
 * revisited if this endpoint is ever the sole protection against abuse.
 */
export async function checkMcpRateLimit(
  store: McpRateLimitStore,
  clientId: string,
  windowMs: number = MCP_RATE_LIMIT_WINDOW_MS,
  maxRequests: number = MCP_RATE_LIMIT_MAX_REQUESTS,
): Promise<McpRateLimitResult> {
  try {
    const count = await store.increment(clientId, windowMs);
    return { limited: count > maxRequests, count, failedOpen: false };
  } catch {
    return { limited: false, count: 0, failedOpen: true };
  }
}

/**
 * Builds the configured store from environment variables, falling back to
 * the in-memory default whenever Upstash credentials are not both present.
 * Both variables are required together deliberately - a half-configured
 * KV binding is treated as unconfigured rather than guessed at, matching
 * this codebase's existing preference for explicit configuration over
 * silent defaults.
 */
export function resolveMcpRateLimitStore(env: {
  MCP_RATE_LIMIT_KV_URL?: string;
  MCP_RATE_LIMIT_KV_TOKEN?: string;
}): McpRateLimitStore {
  const url = env.MCP_RATE_LIMIT_KV_URL?.trim();
  const token = env.MCP_RATE_LIMIT_KV_TOKEN?.trim();
  if (url && token) return new UpstashRateLimitStore(url, token);
  return new InMemoryRateLimitStore();
}
