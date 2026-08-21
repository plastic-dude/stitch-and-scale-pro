import { timingSafeEqual } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  MCP_JSONRPC_VERSION,
  dispatchMcpRequest,
  dispatchMcpRequestAsync,
  parseMcpBody,
  type McpJsonRpcResponse,
} from '../artifacts/stitch-and-scale/src/lib/mcp-server';

interface VercelRequest extends IncomingMessage {
  body?: unknown;
}

type VercelResponse = ServerResponse & {
  status?: (statusCode: number) => VercelResponse;
  json?: (body: unknown) => void;
};

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 60;
const rateBuckets = new Map<string, { startedAt: number; count: number }>();

function header(req: IncomingMessage, name: string): string | undefined {
  const value = req.headers[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
}

function writeJson(res: VercelResponse, statusCode: number, body: unknown, origin = '') {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
  res.setHeader('Vary', 'Origin');
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, MCP-Protocol-Version');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  }
  res.end(JSON.stringify(body));
}

function rpcError(code: number, message: string): McpJsonRpcResponse {
  return { jsonrpc: MCP_JSONRPC_VERSION, id: null, error: { code, message } };
}

function constantTimeEquals(left: string, right: string): boolean {
  const leftBytes = Buffer.from(left);
  const rightBytes = Buffer.from(right);
  return leftBytes.length === rightBytes.length && timingSafeEqual(leftBytes, rightBytes);
}

function clientIdentity(req: IncomingMessage): string {
  const forwarded = header(req, 'x-forwarded-for');
  return (forwarded?.split(',')[0]?.trim() || header(req, 'x-real-ip') || 'unknown').slice(0, 80);
}

function rateLimited(req: IncomingMessage): boolean {
  const now = Date.now();
  const key = clientIdentity(req);
  const current = rateBuckets.get(key);
  if (!current || now - current.startedAt >= WINDOW_MS) {
    rateBuckets.set(key, { startedAt: now, count: 1 });
    if (rateBuckets.size > 2_000) rateBuckets.clear();
    return false;
  }
  current.count += 1;
  return current.count > MAX_REQUESTS_PER_WINDOW;
}

function authorized(req: IncomingMessage): boolean {
  const configured = process.env.MCP_API_KEY?.trim();
  if (!configured) return false;
  const bearer = header(req, 'authorization');
  const supplied = bearer?.startsWith('Bearer ') ? bearer.slice(7).trim() : header(req, 'x-mcp-api-key');
  return Boolean(supplied && constantTimeEquals(supplied, configured));
}

function allowedOrigin(req: IncomingMessage): string {
  const requestOrigin = header(req, 'origin');
  if (!requestOrigin) return '';
  const configured = process.env.MCP_ALLOWED_ORIGIN?.trim();
  return configured && requestOrigin === configured ? configured : '';
}

async function readBody(req: VercelRequest): Promise<string> {
  if (req.body !== undefined) return typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk));
    size += buffer.length;
    if (size > 256 * 1024) throw new Error('MCP body too large');
    chunks.push(buffer);
  }
  return Buffer.concat(chunks).toString('utf8');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = allowedOrigin(req);
  const requestOrigin = header(req, 'origin');
  if (requestOrigin && !origin) {
    writeJson(res, 403, rpcError(-32001, 'This MCP origin is not allowed.'));
    return;
  }
  if (req.method === 'OPTIONS') {
    if (!origin) {
      writeJson(res, 403, rpcError(-32001, 'CORS origin is not allowed.'));
      return;
    }
    res.statusCode = 204;
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, MCP-Protocol-Version');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Vary', 'Origin');
    res.end();
    return;
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    writeJson(res, 405, rpcError(-32600, 'Only POST and OPTIONS are supported by this stateless MCP endpoint.'), origin);
    return;
  }
  if (!process.env.MCP_API_KEY?.trim()) {
    writeJson(res, 503, rpcError(-32002, 'MCP is disabled until the server owner configures MCP_API_KEY.'), origin);
    return;
  }
  if (!authorized(req)) {
    writeJson(res, 401, rpcError(-32003, 'MCP authorization failed.'), origin);
    return;
  }
  if (rateLimited(req)) {
    res.setHeader('Retry-After', '60');
    writeJson(res, 429, rpcError(-32004, 'MCP rate limit exceeded.'), origin);
    return;
  }
  const protocolVersion = header(req, 'mcp-protocol-version');
  if (protocolVersion && protocolVersion !== '2026-07-28') {
    writeJson(res, 400, rpcError(-32005, 'Unsupported MCP protocol version.'), origin);
    return;
  }
  const contentType = header(req, 'content-type') ?? '';
  if (!contentType.toLowerCase().includes('application/json')) {
    writeJson(res, 415, rpcError(-32600, 'MCP requests must use application/json.'), origin);
    return;
  }

  let parsed: { request: Parameters<typeof dispatchMcpRequest>[0] | null; error?: McpJsonRpcResponse };
  try {
    parsed = parseMcpBody(await readBody(req));
  } catch (error) {
    const message = error instanceof Error && error.message === 'MCP body too large'
      ? 'Request body is too large.'
      : 'Unable to read request body.';
    writeJson(res, 413, rpcError(-32600, message), origin);
    return;
  }
  if (parsed.error) {
    writeJson(res, 400, parsed.error, origin);
    return;
  }
  if (!parsed.request) {
    writeJson(res, 400, rpcError(-32600, 'Missing JSON-RPC request.'), origin);
    return;
  }
  if (parsed.request.id === undefined && parsed.request.method === 'notifications/initialized') {
    res.statusCode = 202;
    res.setHeader('Cache-Control', 'no-store');
    res.end();
    return;
  }
  try {
    const response = await dispatchMcpRequestAsync(parsed.request);
    writeJson(res, 'error' in response ? 400 : 200, response, origin);
  } catch {
    writeJson(res, 500, rpcError(-32007, 'MCP operation failed safely. No project or artifact data was persisted.'), origin);
  }
}
