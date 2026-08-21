import { timingSafeEqual } from 'node:crypto';
import {
  MCP_JSONRPC_VERSION,
  dispatchMcpRequest,
  dispatchMcpRequestAsync,
  parseMcpBody,
  type McpJsonRpcResponse,
} from '../artifacts/stitch-and-scale/src/lib/mcp-server.js';

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 60;
const MAX_REQUEST_BODY_BYTES = 256 * 1024;
const rateBuckets = new Map<string, { startedAt: number; count: number }>();

function constantTimeEquals(left: string, right: string): boolean {
  const leftBytes = Buffer.from(left);
  const rightBytes = Buffer.from(right);
  return leftBytes.length === rightBytes.length && timingSafeEqual(leftBytes, rightBytes);
}

function clientIdentity(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  return (forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown').slice(0, 80);
}

function rateLimited(request: Request): boolean {
  const now = Date.now();
  const key = clientIdentity(request);
  const current = rateBuckets.get(key);
  if (!current || now - current.startedAt >= WINDOW_MS) {
    rateBuckets.set(key, { startedAt: now, count: 1 });
    if (rateBuckets.size > 2_000) rateBuckets.clear();
    return false;
  }
  current.count += 1;
  return current.count > MAX_REQUESTS_PER_WINDOW;
}

function authorized(request: Request): boolean {
  const configured = process.env.MCP_API_KEY?.trim();
  if (!configured) return false;
  const bearer = request.headers.get('authorization');
  const supplied = bearer?.startsWith('Bearer ')
    ? bearer.slice(7).trim()
    : request.headers.get('x-mcp-api-key');
  return Boolean(supplied && constantTimeEquals(supplied, configured));
}

function allowedOrigin(request: Request): string {
  const requestOrigin = request.headers.get('origin');
  if (!requestOrigin) return '';
  const configured = process.env.MCP_ALLOWED_ORIGIN?.trim();
  return configured && requestOrigin === configured ? configured : '';
}

function responseHeaders(origin = '', allow = ''): Headers {
  const headers = new Headers({
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
    Vary: 'Origin',
  });
  if (allow) headers.set('Allow', allow);
  if (origin) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type, MCP-Protocol-Version');
    headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  }
  return headers;
}

function jsonResponse(status: number, body: unknown, origin = '', allow = ''): Response {
  return new Response(JSON.stringify(body), { status, headers: responseHeaders(origin, allow) });
}

function emptyResponse(status: number, origin: string): Response {
  const headers = responseHeaders(origin);
  headers.delete('Content-Type');
  return new Response(null, { status, headers });
}

function rpcError(code: number, message: string): McpJsonRpcResponse {
  return { jsonrpc: MCP_JSONRPC_VERSION, id: null, error: { code, message } };
}

async function readBody(request: Request): Promise<string> {
  const body = await request.text();
  if (new TextEncoder().encode(body).byteLength > MAX_REQUEST_BODY_BYTES) {
    throw new Error('MCP body too large');
  }
  return body;
}

async function handleMcpRequest(request: Request): Promise<Response> {
  const origin = allowedOrigin(request);
  const requestOrigin = request.headers.get('origin');
  if (requestOrigin && !origin) {
    return jsonResponse(403, rpcError(-32001, 'This MCP origin is not allowed.'));
  }
  if (request.method === 'OPTIONS') {
    if (!origin) return jsonResponse(403, rpcError(-32001, 'CORS origin is not allowed.'));
    return emptyResponse(204, origin);
  }
  if (request.method !== 'POST') {
    return jsonResponse(405, rpcError(-32600, 'Only POST and OPTIONS are supported by this stateless MCP endpoint.'), origin, 'POST, OPTIONS');
  }
  if (!process.env.MCP_API_KEY?.trim()) {
    return jsonResponse(503, rpcError(-32002, 'MCP is disabled until the server owner configures MCP_API_KEY.'), origin);
  }
  if (!authorized(request)) {
    return jsonResponse(401, rpcError(-32003, 'MCP authorization failed.'), origin);
  }
  if (rateLimited(request)) {
    const response = jsonResponse(429, rpcError(-32004, 'MCP rate limit exceeded.'), origin);
    response.headers.set('Retry-After', '60');
    return response;
  }
  const protocolVersion = request.headers.get('mcp-protocol-version');
  if (protocolVersion && protocolVersion !== '2026-07-28') {
    return jsonResponse(400, rpcError(-32005, 'Unsupported MCP protocol version.'), origin);
  }
  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().includes('application/json')) {
    return jsonResponse(415, rpcError(-32600, 'MCP requests must use application/json.'), origin);
  }

  let parsed: { request: Parameters<typeof dispatchMcpRequest>[0] | null; error?: McpJsonRpcResponse };
  try {
    parsed = parseMcpBody(await readBody(request));
  } catch (error) {
    const message = error instanceof Error && error.message === 'MCP body too large'
      ? 'Request body is too large.'
      : 'Unable to read request body.';
    return jsonResponse(413, rpcError(-32600, message), origin);
  }
  if (parsed.error) return jsonResponse(400, parsed.error, origin);
  if (!parsed.request) return jsonResponse(400, rpcError(-32600, 'Missing JSON-RPC request.'), origin);
  if (parsed.request.id === undefined && parsed.request.method === 'notifications/initialized') {
    return emptyResponse(202, origin);
  }
  try {
    const response = await dispatchMcpRequestAsync(parsed.request);
    return jsonResponse('error' in response ? 400 : 200, response, origin);
  } catch {
    return jsonResponse(500, rpcError(-32007, 'MCP operation failed safely. No project or artifact data was persisted.'), origin);
  }
}

export default {
  fetch: handleMcpRequest,
};
