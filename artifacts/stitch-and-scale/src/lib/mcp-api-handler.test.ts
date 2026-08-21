import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import handler from '../../../../api/mcp';

const fetchHandler = handler.fetch as (request: Request) => Promise<Response>;

async function invoke(request: Request): Promise<{ response: Response; body: Record<string, unknown> }> {
  const response = await fetchHandler(request);
  const rawBody = await response.text();
  const body = rawBody ? JSON.parse(rawBody) as Record<string, unknown> : {};
  return { response, body };
}

describe('Vercel MCP Web Standard handler', () => {
  const originalApiKey = process.env.MCP_API_KEY;
  const originalAllowedOrigin = process.env.MCP_ALLOWED_ORIGIN;

  beforeEach(() => {
    process.env.MCP_API_KEY = 'test-api-key';
    delete process.env.MCP_ALLOWED_ORIGIN;
  });

  afterAll(() => {
    if (originalApiKey === undefined) delete process.env.MCP_API_KEY;
    else process.env.MCP_API_KEY = originalApiKey;
    if (originalAllowedOrigin === undefined) delete process.env.MCP_ALLOWED_ORIGIN;
    else process.env.MCP_ALLOWED_ORIGIN = originalAllowedOrigin;
  });

  it('returns a safe 405 response for non-POST requests without invoking a legacy response adapter', async () => {
    const { response, body } = await invoke(new Request('https://example.test/api/mcp', { method: 'GET' }));
    expect(response.status).toBe(405);
    expect(response.headers.get('allow')).toBe('POST, OPTIONS');
    expect(body.error).toMatchObject({ code: -32600 });
  });

  it('fails closed for unauthorised POST requests', async () => {
    const { response, body } = await invoke(new Request('https://example.test/api/mcp', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
    }));
    expect(response.status).toBe(401);
    expect(body.error).toMatchObject({ code: -32003 });
  });

  it('allows an authorised tools/list request without eagerly loading the PDF workflow', async () => {
    const { response, body } = await invoke(new Request('https://example.test/api/mcp', {
      method: 'POST',
      headers: {
        authorization: 'Bearer test-api-key',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list' }),
    }));
    expect(response.status).toBe(200);
    expect(body.result).toBeDefined();
    expect(JSON.stringify(body)).toContain('export.pattern_pdf');
  });

  it('handles a preflight request only when the configured origin matches', async () => {
    process.env.MCP_ALLOWED_ORIGIN = 'https://client.example';
    const allowed = await invoke(new Request('https://example.test/api/mcp', {
      method: 'OPTIONS',
      headers: { origin: 'https://client.example' },
    }));
    expect(allowed.response.status).toBe(204);
    expect(allowed.response.headers.get('access-control-allow-origin')).toBe('https://client.example');

    const denied = await invoke(new Request('https://example.test/api/mcp', {
      method: 'OPTIONS',
      headers: { origin: 'https://attacker.example' },
    }));
    expect(denied.response.status).toBe(403);
    expect(denied.body.error).toMatchObject({ code: -32001 });
  });
});
