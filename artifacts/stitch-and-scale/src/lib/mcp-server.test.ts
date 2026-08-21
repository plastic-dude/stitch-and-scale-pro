import { describe, expect, it } from 'vitest';
import { generateId, type PatternProject } from './grading-engine';
import {
  MCP_MAX_BODY_BYTES,
  dispatchMcpRequest,
  mcpInitializeResult,
  parseMcpBody,
} from './mcp-server';

function project(): PatternProject {
  return {
    id: generateId(),
    name: 'Transport Test',
    author: 'Designer',
    baseSize: 'M',
    gauge: { stitchesPer4In: 18, rowsPer4In: 24, unit: 'in' },
    sections: [{
      id: 'body',
      name: 'Body',
      measurements: [{ id: 'bust', label: 'Bust', measurementType: 'circumference', gradingKey: 'bust', baseValue: 39 }],
    }],
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
  };
}

describe('MCP server transport contract', () => {
  it('negotiates the pinned protocol and read-only capability set', () => {
    const result = mcpInitializeResult();
    expect(result.protocolVersion).toBe('2026-07-28');
    expect(result.capabilities.tools.listChanged).toBe(false);
    expect(result.serverInfo.name).toBe('stitch-and-scale-pro');
    expect(result.instructions).toContain('never saves');
  });

  it('lists only the three allowlisted read-only tools', () => {
    const response = dispatchMcpRequest({ jsonrpc: '2.0', id: 1, method: 'tools/list' });
    expect('result' in response).toBe(true);
    if (!('result' in response)) throw new Error('tools/list failed');
    expect((response.result.tools as Array<{ name: string }>).map(tool => tool.name)).toEqual([
      'project.validate', 'grading.run', 'grading.explain',
    ]);
  });

  it('runs grading only against an explicit supplied snapshot', () => {
    const response = dispatchMcpRequest({
      jsonrpc: '2.0',
      id: 'grade-1',
      method: 'tools/call',
      params: { name: 'grading.run', arguments: { project: project() } },
    });
    expect('result' in response).toBe(true);
    if (!('result' in response)) throw new Error('grading.run failed');
    expect(response.id).toBe('grade-1');
    expect(response.result.isError).toBe(false);
    expect(response.result.structuredContent).toBeDefined();
  });

  it('rejects unknown tools and missing project arguments without throwing', () => {
    const unknown = dispatchMcpRequest({ jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'storage.read_all', arguments: {} } });
    expect('error' in unknown).toBe(true);
    const missing = dispatchMcpRequest({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'grading.run', arguments: {} } });
    expect('error' in missing).toBe(true);
    if ('error' in missing) expect(missing.error.code).toBe(-32602);
  });

  it('returns JSON parse and body-size errors without exposing request data', () => {
    const malformed = parseMcpBody('{not-json');
    expect(malformed.error?.error.code).toBe(-32700);
    const oversized = parseMcpBody('x'.repeat(MCP_MAX_BODY_BYTES + 1));
    expect(oversized.error?.error.message).toContain('too large');
    expect(JSON.stringify(oversized)).not.toContain('xxx');
  });

  it('rejects unsupported methods and malformed JSON-RPC envelopes', () => {
    const unsupported = dispatchMcpRequest({ jsonrpc: '2.0', id: 4, method: 'resources/list' });
    expect('error' in unsupported).toBe(true);
    const malformed = dispatchMcpRequest({ jsonrpc: '1.0', id: 5, method: 'tools/list' });
    expect('error' in malformed).toBe(true);
  });
});
