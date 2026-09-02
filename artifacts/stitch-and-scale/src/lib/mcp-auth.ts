import { timingSafeEqual } from 'node:crypto';

/**
 * Multi-key MCP API key authorization.
 *
 * A single static MCP_API_KEY means every caller shares one credential: a
 * leaked key can't be revoked for one client without rotating it for all of
 * them, and there is no way to tell which caller a leaked key belonged to.
 *
 * This module keeps MCP_API_KEY as a single bare secret fully working with
 * zero configuration changes (existing deployments are unaffected), and
 * additionally accepts a comma-separated list of "keyId:secret" pairs so
 * individual client keys can be issued and revoked independently. The
 * matched keyId is returned so the caller can log which credential was used
 * without ever logging the secret itself.
 */

export interface McpApiKeyEntry {
  keyId: string;
  secret: string;
}

/**
 * Parses MCP_API_KEY into one or more entries.
 *
 * - "abc123" (no colon, or a colon-free single value) -> one entry, keyId "key-1".
 * - "labA:abc123,labB:def456" -> two independently revocable entries.
 * - Entries with an empty secret, and blank items from stray commas, are dropped.
 */
export function parseMcpApiKeys(raw: string | undefined): McpApiKeyEntry[] {
  const trimmed = raw?.trim();
  if (!trimmed) return [];
  const entries: McpApiKeyEntry[] = [];
  trimmed
    .split(',')
    .map(part => part.trim())
    .filter(Boolean)
    .forEach((part, index) => {
      const separatorIndex = part.indexOf(':');
      const hasSeparator = separatorIndex >= 0;
      const label = hasSeparator ? part.slice(0, separatorIndex).trim() : '';
      const secret = (hasSeparator ? part.slice(separatorIndex + 1) : part).trim();
      const keyId = label || `key-${index + 1}`;
      if (secret) entries.push({ keyId, secret });
    });
  return entries;
}

function constantTimeEquals(left: string, right: string): boolean {
  const leftBytes = Buffer.from(left);
  const rightBytes = Buffer.from(right);
  return leftBytes.length === rightBytes.length && timingSafeEqual(leftBytes, rightBytes);
}

export interface McpAuthResult {
  authorized: boolean;
  /** Which configured key matched, when authorized is true. Never the secret itself. */
  keyId?: string;
}

/**
 * Checks a supplied credential against every configured key. Every entry is
 * compared, rather than returning on the first match, so response timing
 * does not vary with how many keys are configured or where in the list a
 * match sits; the actual secret comparison for each entry is still
 * constant-time.
 */
export function authorizeMcpRequest(supplied: string | undefined, configuredRaw: string | undefined): McpAuthResult {
  const keys = parseMcpApiKeys(configuredRaw);
  if (!supplied || keys.length === 0) return { authorized: false };
  let match: McpAuthResult = { authorized: false };
  for (const key of keys) {
    if (constantTimeEquals(supplied, key.secret)) match = { authorized: true, keyId: key.keyId };
  }
  return match;
}
