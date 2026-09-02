import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  InMemoryRateLimitStore,
  UpstashRateLimitStore,
  checkMcpRateLimit,
  resolveMcpRateLimitStore,
} from './mcp-rate-limit.js';

describe('InMemoryRateLimitStore', () => {
  it('counts up within a single fixed window', async () => {
    const store = new InMemoryRateLimitStore();
    expect(await store.increment('client-a', 60_000)).toBe(1);
    expect(await store.increment('client-a', 60_000)).toBe(2);
    expect(await store.increment('client-a', 60_000)).toBe(3);
  });

  it('keeps separate counters per key', async () => {
    const store = new InMemoryRateLimitStore();
    await store.increment('client-a', 60_000);
    await store.increment('client-a', 60_000);
    expect(await store.increment('client-b', 60_000)).toBe(1);
  });

  it('resets the count once the window has elapsed', async () => {
    const store = new InMemoryRateLimitStore();
    const realNow = Date.now;
    let now = 1_000_000;
    vi.spyOn(Date, 'now').mockImplementation(() => now);
    try {
      expect(await store.increment('client-a', 1_000)).toBe(1);
      expect(await store.increment('client-a', 1_000)).toBe(2);
      now += 1_001;
      expect(await store.increment('client-a', 1_000)).toBe(1);
    } finally {
      Date.now = realNow;
    }
  });

  it('clears all buckets once the configured cap is exceeded, rather than growing unbounded', async () => {
    const store = new InMemoryRateLimitStore(3);
    await store.increment('a', 60_000);
    await store.increment('b', 60_000);
    await store.increment('c', 60_000);
    // This 4th distinct key pushes the map over maxBuckets, which clears it.
    expect(await store.increment('d', 60_000)).toBe(1);
    // 'a' was cleared along with everything else, so it starts a fresh window.
    expect(await store.increment('a', 60_000)).toBe(1);
  });
});

describe('UpstashRateLimitStore', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('sends a pipelined INCR + PEXPIRE NX and returns the INCR result', async () => {
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      expect(url).toBe('https://example-kv.upstash.io/pipeline');
      expect(init?.headers).toMatchObject({ Authorization: 'Bearer test-token' });
      const body = JSON.parse(init!.body as string);
      expect(body).toEqual([
        ['INCR', 'mcp-rl:1.2.3.4'],
        ['PEXPIRE', 'mcp-rl:1.2.3.4', '60000', 'NX'],
      ]);
      return new Response(JSON.stringify([{ result: 7 }, { result: 0 }]), { status: 200 });
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const store = new UpstashRateLimitStore('https://example-kv.upstash.io/', 'test-token');
    const count = await store.increment('mcp-rl:1.2.3.4', 60_000);
    expect(count).toBe(7);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('throws when the store responds with a non-OK status', async () => {
    global.fetch = vi.fn(async () => new Response('', { status: 503 })) as unknown as typeof fetch;
    const store = new UpstashRateLimitStore('https://example-kv.upstash.io', 'test-token');
    await expect(store.increment('key', 60_000)).rejects.toThrow(/status 503/);
  });

  it('throws when the store response is shaped unexpectedly', async () => {
    global.fetch = vi.fn(async () => new Response(JSON.stringify([{ notResult: true }]), { status: 200 })) as unknown as typeof fetch;
    const store = new UpstashRateLimitStore('https://example-kv.upstash.io', 'test-token');
    await expect(store.increment('key', 60_000)).rejects.toThrow(/unexpected response shape/);
  });
});

describe('checkMcpRateLimit', () => {
  it('is not limited while under the max, and limited once over it', async () => {
    const store = new InMemoryRateLimitStore();
    let lastResult;
    for (let i = 0; i < 5; i += 1) {
      lastResult = await checkMcpRateLimit(store, 'client', 60_000, 3);
    }
    expect(lastResult).toEqual({ limited: true, count: 5, failedOpen: false });
  });

  it('allows exactly maxRequests before limiting', async () => {
    const store = new InMemoryRateLimitStore();
    expect((await checkMcpRateLimit(store, 'client', 60_000, 2)).limited).toBe(false);
    expect((await checkMcpRateLimit(store, 'client', 60_000, 2)).limited).toBe(false);
    expect((await checkMcpRateLimit(store, 'client', 60_000, 2)).limited).toBe(true);
  });

  it('fails open and reports failedOpen when the store throws', async () => {
    const failingStore: { increment: () => Promise<number> } = {
      increment: async () => {
        throw new Error('store unreachable');
      },
    };
    const result = await checkMcpRateLimit(failingStore, 'client');
    expect(result).toEqual({ limited: false, count: 0, failedOpen: true });
  });
});

describe('resolveMcpRateLimitStore', () => {
  it('returns an in-memory store when no KV env vars are set', () => {
    expect(resolveMcpRateLimitStore({})).toBeInstanceOf(InMemoryRateLimitStore);
  });

  it('returns an in-memory store when only one of the two KV env vars is set', () => {
    expect(resolveMcpRateLimitStore({ MCP_RATE_LIMIT_KV_URL: 'https://x.upstash.io' })).toBeInstanceOf(InMemoryRateLimitStore);
    expect(resolveMcpRateLimitStore({ MCP_RATE_LIMIT_KV_TOKEN: 'token' })).toBeInstanceOf(InMemoryRateLimitStore);
  });

  it('returns an Upstash store once both KV env vars are set', () => {
    const store = resolveMcpRateLimitStore({ MCP_RATE_LIMIT_KV_URL: 'https://x.upstash.io', MCP_RATE_LIMIT_KV_TOKEN: 'token' });
    expect(store).toBeInstanceOf(UpstashRateLimitStore);
  });
});
