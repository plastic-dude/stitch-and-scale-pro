import { describe, expect, it } from 'vitest';
import { authorizeMcpRequest, parseMcpApiKeys } from './mcp-auth.js';

describe('parseMcpApiKeys', () => {
  it('returns an empty list for undefined, empty, or whitespace-only input', () => {
    expect(parseMcpApiKeys(undefined)).toEqual([]);
    expect(parseMcpApiKeys('')).toEqual([]);
    expect(parseMcpApiKeys('   ')).toEqual([]);
  });

  it('treats a bare secret with no colon as a single legacy key', () => {
    expect(parseMcpApiKeys('plain-secret-value')).toEqual([{ keyId: 'key-1', secret: 'plain-secret-value' }]);
  });

  it('parses labelled entries as independently identifiable keys', () => {
    expect(parseMcpApiKeys('labA:secretA,labB:secretB')).toEqual([
      { keyId: 'labA', secret: 'secretA' },
      { keyId: 'labB', secret: 'secretB' },
    ]);
  });

  it('trims whitespace around commas, colons, and each field', () => {
    expect(parseMcpApiKeys(' labA : secretA , labB : secretB ')).toEqual([
      { keyId: 'labA', secret: 'secretA' },
      { keyId: 'labB', secret: 'secretB' },
    ]);
  });

  it('drops empty entries produced by stray commas', () => {
    expect(parseMcpApiKeys('labA:secretA,,labB:secretB,')).toEqual([
      { keyId: 'labA', secret: 'secretA' },
      { keyId: 'labB', secret: 'secretB' },
    ]);
  });

  it('falls back to an auto-generated keyId for an entry with an empty label', () => {
    expect(parseMcpApiKeys(':secretA')).toEqual([{ keyId: 'key-1', secret: 'secretA' }]);
  });

  it('drops an entry whose secret is empty even if a label is present', () => {
    expect(parseMcpApiKeys('labA:,labB:secretB')).toEqual([{ keyId: 'labB', secret: 'secretB' }]);
  });

  it('treats a value containing a colon inside the secret as label:secret at the first colon', () => {
    expect(parseMcpApiKeys('labA:sec:ret')).toEqual([{ keyId: 'labA', secret: 'sec:ret' }]);
  });
});

describe('authorizeMcpRequest', () => {
  it('denies when nothing is configured', () => {
    expect(authorizeMcpRequest('anything', undefined)).toEqual({ authorized: false });
  });

  it('denies when no credential is supplied', () => {
    expect(authorizeMcpRequest(undefined, 'legacy-secret')).toEqual({ authorized: false });
  });

  it('authorizes a matching legacy bare key with keyId key-1', () => {
    expect(authorizeMcpRequest('legacy-secret', 'legacy-secret')).toEqual({ authorized: true, keyId: 'key-1' });
  });

  it('denies a non-matching key', () => {
    expect(authorizeMcpRequest('wrong-secret', 'legacy-secret')).toEqual({ authorized: false });
  });

  it('authorizes against any configured key and reports which one matched', () => {
    const configured = 'clientA:secretA,clientB:secretB';
    expect(authorizeMcpRequest('secretA', configured)).toEqual({ authorized: true, keyId: 'clientA' });
    expect(authorizeMcpRequest('secretB', configured)).toEqual({ authorized: true, keyId: 'clientB' });
  });

  it('denies a key that was revoked (removed from the configured list)', () => {
    // clientA's key existed here; it has since been rotated out.
    const configuredAfterRevocation = 'clientB:secretB';
    expect(authorizeMcpRequest('secretA', configuredAfterRevocation)).toEqual({ authorized: false });
    expect(authorizeMcpRequest('secretB', configuredAfterRevocation)).toEqual({ authorized: true, keyId: 'clientB' });
  });

  it('does not authorize a prefix or suffix of a valid key', () => {
    const configured = 'clientA:supersecretvalue';
    expect(authorizeMcpRequest('supersecret', configured)).toEqual({ authorized: false });
    expect(authorizeMcpRequest('supersecretvalueextra', configured)).toEqual({ authorized: false });
  });
});
