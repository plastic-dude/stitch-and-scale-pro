import { describe, expect, it } from 'vitest';
import { generateId, type PatternProject } from './grading-engine';
import {
  MCP_MAX_BODY_BYTES,
  dispatchMcpRequest,
  dispatchMcpRequestAsync,
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
    expect(result.capabilities.resources.listChanged).toBe(false);
    expect(result.capabilities.resources.subscribe).toBe(false);
    expect(result.capabilities.prompts.listChanged).toBe(false);
    expect(result.serverInfo.name).toBe('stitch-and-scale-pro');
    expect(result.instructions).toContain('never saves');
  });

  it('lists only the allowlisted read-only tools', () => {
    const response = dispatchMcpRequest({ jsonrpc: '2.0', id: 1, method: 'tools/list' });
    expect('result' in response).toBe(true);
    if (!('result' in response)) throw new Error('tools/list failed');
    expect((response.result.tools as Array<{ name: string }>).map(tool => tool.name)).toEqual([
      'project.intake', 'project.validate', 'grading.run', 'grading.explain', 'grading.export_csv', 'grading.compare_standards',
      'calculate.marketplace_take_rate',
    ]);
  });

  it('lists and reads static reference resources without a project snapshot', () => {
    const list = dispatchMcpRequest({ jsonrpc: '2.0', id: 'res-list', method: 'resources/list' });
    expect('result' in list).toBe(true);
    if (!('result' in list)) throw new Error('resources/list failed');
    const uris = (list.result.resources as Array<{ uri: string }>).map(r => r.uri);
    expect(uris).toContain('stitch-scale://reference/sizing-standards');

    const read = dispatchMcpRequest({
      jsonrpc: '2.0', id: 'res-read', method: 'resources/read',
      params: { uri: 'stitch-scale://reference/sizing-standards' },
    });
    expect('result' in read).toBe(true);
    if (!('result' in read)) throw new Error('resources/read failed');
    const contents = read.result.contents as Array<{ mimeType: string; text: string }>;
    expect(contents[0]?.mimeType).toBe('application/json');
    expect(JSON.parse(contents[0]?.text ?? '{}').standard).toBe('CYC');

    const unknown = dispatchMcpRequest({
      jsonrpc: '2.0', id: 'res-missing', method: 'resources/read',
      params: { uri: 'stitch-scale://reference/does-not-exist' },
    });
    expect('error' in unknown).toBe(true);
  });

  it('lists and gets user-controlled explain prompts', () => {
    const list = dispatchMcpRequest({ jsonrpc: '2.0', id: 'prompt-list', method: 'prompts/list' });
    expect('result' in list).toBe(true);
    if (!('result' in list)) throw new Error('prompts/list failed');
    expect((list.result.prompts as Array<{ name: string }>).map(p => p.name)).toContain('grading.explain');

    const got = dispatchMcpRequest({
      jsonrpc: '2.0', id: 'prompt-get', method: 'prompts/get',
      params: { name: 'grading.explain', arguments: { grade: { verdict: 'go' } } },
    });
    expect('result' in got).toBe(true);
    if (!('result' in got)) throw new Error('prompts/get failed');
    const messages = got.result.messages as Array<{ content: { text: string } }>;
    expect(messages[0]?.content.text).toContain('untrusted data');

    const missing = dispatchMcpRequest({
      jsonrpc: '2.0', id: 'prompt-missing', method: 'prompts/get', params: { name: 'not.a.prompt' },
    });
    expect('error' in missing).toBe(true);
  });

  it('compares a project standard against the CYC baseline deterministically', () => {
    const response = dispatchMcpRequest({
      jsonrpc: '2.0', id: 'compare-1', method: 'tools/call',
      params: { name: 'grading.compare_standards', arguments: { project: project() } },
    });
    expect('result' in response).toBe(true);
    if (!('result' in response)) throw new Error('grading.compare_standards failed');
    expect(response.result.isError).toBe(false);
    expect((response.result.structuredContent as { identical: boolean }).identical).toBe(true);
  });

  it('exports a grading result as CSV using the same serializer as the in-app Download CSV button', () => {
    const response = dispatchMcpRequest({
      jsonrpc: '2.0',
      id: 'csv-1',
      method: 'tools/call',
      params: { name: 'grading.export_csv', arguments: { project: project() } },
    });
    expect('result' in response).toBe(true);
    if (!('result' in response)) throw new Error('grading.export_csv failed');
    expect(response.result.isError).toBe(false);
    const structured = response.result.structuredContent as { csv: string; filename: string };
    expect(structured.csv).toContain('Section,Measurement,Property');
    expect(structured.filename).toContain('grading.csv');
    expect(response.result.content).toEqual([{ type: 'text', text: structured.csv }]);
  });

  it('refuses to export CSV for an invalid project instead of guessing', () => {
    const response = dispatchMcpRequest({
      jsonrpc: '2.0',
      id: 'csv-2',
      method: 'tools/call',
      params: { name: 'grading.export_csv', arguments: { project: { ...project(), sections: [] } } },
    });
    expect('result' in response).toBe(true);
    if (!('result' in response)) throw new Error('grading.export_csv failed');
    expect(response.result.isError).toBe(true);
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

  it('rejects binary artifact-generation tools through both sync and async dispatch', async () => {
    const request = {
      jsonrpc: '2.0' as const,
      id: 'pdf-1',
      method: 'tools/call' as const,
      params: { name: 'export.pattern_pdf', arguments: { project: project(), userApproved: true, filename: 'transport-report' } },
    };
    const sync = dispatchMcpRequest(request);
    const asyncResponse = await dispatchMcpRequestAsync(request);
    expect('error' in sync).toBe(true);
    expect('error' in asyncResponse).toBe(true);
    if ('error' in sync) expect(sync.error.code).toBe(-32601);
    if ('error' in asyncResponse) expect(asyncResponse.error.code).toBe(-32601);
  });

  it('rejects unknown tools and missing project arguments without throwing', () => {
    const unknown = dispatchMcpRequest({ jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'storage.read_all', arguments: {} } });
    expect('error' in unknown).toBe(true);
    const missing = dispatchMcpRequest({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'grading.run', arguments: {} } });
    expect('error' in missing).toBe(true);
    const pdf = dispatchMcpRequest({ jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'export.pattern_pdf', arguments: { project: project(), userApproved: true } } });
    expect('error' in pdf).toBe(true);
    if ('error' in missing) expect(missing.error.code).toBe(-32602);
    if ('error' in pdf) expect(pdf.error.code).toBe(-32601);
  });

  it('returns JSON parse and body-size errors without exposing request data', () => {
    const malformed = parseMcpBody('{not-json');
    expect(malformed.error?.error.code).toBe(-32700);
    const oversized = parseMcpBody('x'.repeat(MCP_MAX_BODY_BYTES + 1));
    expect(oversized.error?.error.message).toContain('too large');
    expect(JSON.stringify(oversized)).not.toContain('xxx');
  });

  it('rejects unsupported methods and malformed JSON-RPC envelopes', () => {
    const unsupported = dispatchMcpRequest({ jsonrpc: '2.0', id: 4, method: 'sampling/createMessage' });
    expect('error' in unsupported).toBe(true);
    const malformed = dispatchMcpRequest({ jsonrpc: '1.0', id: 5, method: 'tools/list' });
    expect('error' in malformed).toBe(true);
  });
});
