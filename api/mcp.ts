import {
  MCP_JSONRPC_VERSION,
  dispatchMcpRequest,
  dispatchMcpRequestAsync,
  parseMcpBody,
  type McpJsonRpcResponse,
} from '../artifacts/stitch-and-scale/src/lib/mcp-server.js';
import { MCP_SUPPORTED_PROTOCOL_VERSIONS } from '../artifacts/stitch-and-scale/src/lib/mcp-contract.js';
import { authorizeMcpRequest, parseMcpApiKeys } from '../artifacts/stitch-and-scale/src/lib/mcp-auth.js';
import {
  checkMcpRateLimit,
  resolveMcpRateLimitStore,
  type McpRateLimitStore,
} from '../artifacts/stitch-and-scale/src/lib/mcp-rate-limit.js';

const MAX_REQUEST_BODY_BYTES = 256 * 1024;
const DEFAULT_MCP_ALLOWED_ORIGIN = 'https://stitch-and-scale-pro-api-server.vercel.app';

// Resolved once per isolate: an in-memory store unless MCP_RATE_LIMIT_KV_URL
// and MCP_RATE_LIMIT_KV_TOKEN are both configured, in which case requests
// are rate-limited against a real, shared Upstash-backed counter instead of
// an approximation that resets on every cold start / other isolate. See
// mcp-rate-limit.ts for why the in-memory fallback is only a per-isolate
// approximation, and why the shared store fails open rather than closed.
let rateLimitStore: McpRateLimitStore | null = null;
function getRateLimitStore(): McpRateLimitStore {
  if (!rateLimitStore) rateLimitStore = resolveMcpRateLimitStore(process.env);
  return rateLimitStore;
}

function clientIdentity(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  return (forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown').slice(0, 80);
}

function suppliedApiKey(request: Request): string | undefined {
  const bearer = request.headers.get('authorization');
  return bearer?.startsWith('Bearer ')
    ? bearer.slice(7).trim()
    : (request.headers.get('x-mcp-api-key') ?? undefined);
}

function allowedOrigin(request: Request): string {
  const requestOrigin = request.headers.get('origin');
  if (!requestOrigin) return '';
  const configured = process.env.MCP_ALLOWED_ORIGIN?.trim() || DEFAULT_MCP_ALLOWED_ORIGIN;
  const allowed = configured.split(',').map(o => o.trim()).filter(Boolean);
  return allowed.includes(requestOrigin) ? requestOrigin : '';
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
  if (parseMcpApiKeys(process.env.MCP_API_KEY).length === 0) {
    return jsonResponse(503, rpcError(-32002, 'MCP is disabled until the server owner configures MCP_API_KEY.'), origin);
  }
  const auth = authorizeMcpRequest(suppliedApiKey(request), process.env.MCP_API_KEY);
  if (!auth.authorized) {
    return jsonResponse(401, rpcError(-32003, 'MCP authorization failed.'), origin);
  }
  const rateLimit = await checkMcpRateLimit(getRateLimitStore(), clientIdentity(request));
  if (rateLimit.limited) {
    const response = jsonResponse(429, rpcError(-32004, 'MCP rate limit exceeded.'), origin);
    response.headers.set('Retry-After', '60');
    return response;
  }
  if (rateLimit.failedOpen) {
    // The rate-limit store itself failed (e.g. Upstash unreachable); the
    // request was allowed through per the fail-open policy documented in
    // mcp-rate-limit.ts. Logged (not thrown) so it's visible in
    // logs/monitoring without affecting the caller's ability to complete
    // the request - the failure is in a secondary defense, not the
    // MCP_API_KEY check that already passed above.
    console.error('MCP rate limit store failed open for client', clientIdentity(request));
  }
  const protocolVersion = request.headers.get('mcp-protocol-version');
  if (protocolVersion && !(MCP_SUPPORTED_PROTOCOL_VERSIONS as readonly string[]).includes(protocolVersion)) {
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
