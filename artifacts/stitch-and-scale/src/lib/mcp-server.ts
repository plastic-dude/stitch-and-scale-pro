import { assessMcpProject } from './mcp-intake.js';
import {
  compareMcpStandards,
  explainMcpGrade,
  getMcpPrompt,
  getMcpPromptDefinitions,
  getMcpResourceDefinitions,
  getMcpToolDefinitions,
  MCP_CONTRACT_VERSION,
  MCP_PROTOCOL_VERSION,
  MCP_SERVER_NAME,
  MCP_SERVER_VERSION,
  readMcpResource,
  runMcpGrading,
  validateMcpProject,
  type McpGradeOutput,
  type McpExplainInput,
} from './mcp-contract.js';
import type { McpPdfOutput } from './mcp-workflow.js';
import type { McpBragCardOutput, McpProjectBookOutput } from './mcp-artifact-workflow.js';
import type { McpTakeRateOutput } from './mcp-calculation-workflow.js';

export const MCP_JSONRPC_VERSION = '2.0';
export const MCP_MAX_BODY_BYTES = 256 * 1024;

export interface McpJsonRpcRequest {
  jsonrpc?: unknown;
  id?: unknown;
  method?: unknown;
  params?: unknown;
}

export interface McpJsonRpcSuccess {
  jsonrpc: typeof MCP_JSONRPC_VERSION;
  id: string | number | null;
  result: Record<string, unknown>;
}

export interface McpJsonRpcError {
  jsonrpc: typeof MCP_JSONRPC_VERSION;
  id: string | number | null;
  error: { code: number; message: string; data?: Record<string, unknown> };
}

export type McpJsonRpcResponse = McpJsonRpcSuccess | McpJsonRpcError;

const SERVER_INSTRUCTIONS = 'Read-only Stitch & Scale grading, comparison, and calculation tools, plus static reference resources and explain prompts. The server never saves, publishes, shares, or changes a project. The caller must supply the project or ledger snapshot explicitly.';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validId(value: unknown): value is string | number | null {
  return value === null || typeof value === 'string' || (typeof value === 'number' && Number.isFinite(value));
}

function responseId(request: McpJsonRpcRequest): string | number | null {
  return validId(request.id) ? request.id : null;
}

function success(request: McpJsonRpcRequest, result: Record<string, unknown>): McpJsonRpcSuccess {
  return { jsonrpc: MCP_JSONRPC_VERSION, id: responseId(request), result };
}

function error(
  request: McpJsonRpcRequest,
  code: number,
  message: string,
  data?: Record<string, unknown>,
): McpJsonRpcError {
  return {
    jsonrpc: MCP_JSONRPC_VERSION,
    id: responseId(request),
    error: data ? { code, message, data } : { code, message },
  };
}

function invalidParams(request: McpJsonRpcRequest, message: string): McpJsonRpcError {
  return error(request, -32602, message);
}

function toolProject(params: unknown): unknown | null {
  if (!isRecord(params) || !Object.prototype.hasOwnProperty.call(params, 'project')) return null;
  return params.project;
}

export function mcpInitializeResult() {
  return {
    protocolVersion: MCP_PROTOCOL_VERSION,
    capabilities: {
      tools: { listChanged: false },
      resources: { listChanged: false, subscribe: false },
      prompts: { listChanged: false },
    },
    serverInfo: { name: MCP_SERVER_NAME, version: MCP_SERVER_VERSION },
    instructions: SERVER_INSTRUCTIONS,
  };
}

export function dispatchMcpRequest(request: McpJsonRpcRequest): McpJsonRpcResponse {
  if (request.jsonrpc !== MCP_JSONRPC_VERSION || typeof request.method !== 'string') {
    return error(request, -32600, 'Invalid JSON-RPC request.');
  }
  if (request.id !== undefined && !validId(request.id)) {
    return error(request, -32600, 'The JSON-RPC request id must be a string, finite number, or null.');
  }

  switch (request.method) {
    case 'initialize':
      return success(request, mcpInitializeResult());
    case 'notifications/initialized':
      return success(request, {});
    case 'ping':
      return success(request, {});
    case 'tools/list':
      return success(request, { tools: getMcpToolDefinitions() });
    case 'resources/list':
      return success(request, { resources: getMcpResourceDefinitions() });
    case 'resources/read': {
      if (!isRecord(request.params) || typeof request.params.uri !== 'string') {
        return invalidParams(request, 'resources/read requires a uri.');
      }
      const resource = readMcpResource(request.params.uri);
      if (!resource) return error(request, -32602, `Unknown resource: ${request.params.uri}.`);
      return success(request, { contents: [resource] });
    }
    case 'prompts/list':
      return success(request, { prompts: getMcpPromptDefinitions() });
    case 'prompts/get': {
      if (!isRecord(request.params) || typeof request.params.name !== 'string') {
        return invalidParams(request, 'prompts/get requires a name.');
      }
      const promptArgs = isRecord(request.params.arguments) ? request.params.arguments : {};
      const prompt = getMcpPrompt(request.params.name, promptArgs);
      if (!prompt) return error(request, -32601, `Unknown prompt: ${request.params.name}.`);
      return success(request, prompt);
    }
    case 'tools/call': {
      if (!isRecord(request.params) || typeof request.params.name !== 'string') {
        return invalidParams(request, 'tools/call requires a tool name.');
      }
      const name = request.params.name;
      if (name === 'project.intake') {
        const project = toolProject(request.params.arguments);
        if (project === null) return invalidParams(request, 'project.intake requires arguments.project.');
        const output = assessMcpProject(project);
        return success(request, { content: [{ type: 'text', text: JSON.stringify(output) }], structuredContent: output, isError: !output.ready });
      }
      if (name === 'project.validate') {
        const project = toolProject(request.params.arguments);
        if (project === null) return invalidParams(request, 'project.validate requires arguments.project.');
        const output = validateMcpProject(project);
        return success(request, { content: [{ type: 'text', text: JSON.stringify(output) }], structuredContent: output, isError: !output.valid });
      }
      if (name === 'grading.run') {
        const project = toolProject(request.params.arguments);
        if (project === null) return invalidParams(request, 'grading.run requires arguments.project.');
        const output = runMcpGrading(project);
        const isGrade = 'sections' in output;
        return success(request, {
          content: [{ type: 'text', text: JSON.stringify(output) }],
          structuredContent: output,
          isError: !isGrade || ('valid' in output && !output.valid),
        });
      }
      if (name === 'grading.explain') {
        const args = request.params.arguments;
        if (!isRecord(args) || !['explain', 'teach', 'check', 'next-step'].includes(args.intent as string) || !isRecord(args.grade)) {
          return invalidParams(request, 'grading.explain requires intent and a grading result.');
        }
        const output = explainMcpGrade({ intent: args.intent as McpExplainInput['intent'], grade: args.grade as unknown as McpGradeOutput });
        return success(request, { content: [{ type: 'text', text: JSON.stringify(output) }], structuredContent: output, isError: false });
      }
      if (name === 'grading.compare_standards') {
        const project = toolProject(request.params.arguments);
        if (project === null) return invalidParams(request, 'grading.compare_standards requires arguments.project.');
        const output = compareMcpStandards(project);
        const isComparison = 'rows' in output;
        return success(request, {
          content: [{ type: 'text', text: JSON.stringify(output) }],
          structuredContent: output,
          isError: !isComparison || ('valid' in output && !output.valid),
        });
      }
      if (name === 'export.pattern_pdf' || name === 'export.project_book_pdf' || name === 'export.brag_card') {
        return error(request, -32006, 'This tool creates a binary artifact and must be dispatched through the asynchronous MCP transport.');
      }
      return error(request, -32601, `Unknown tool: ${name}.`);
    }
    default:
      return error(request, -32601, `Unsupported MCP method: ${request.method}.`);
  }
}

export async function dispatchMcpRequestAsync(request: McpJsonRpcRequest): Promise<McpJsonRpcResponse> {
  if (request.method !== 'tools/call' || !isRecord(request.params) || !['export.pattern_pdf', 'export.project_book_pdf', 'export.brag_card', 'calculate.marketplace_take_rate'].includes(request.params.name as string)) {
    return dispatchMcpRequest(request);
  }
  const args = request.params.arguments;
  const name = request.params.name;
  if (!isRecord(args)) return invalidParams(request, `${name} requires an arguments object.`);
  let output: McpPdfOutput | McpProjectBookOutput | McpBragCardOutput | McpTakeRateOutput;
  if (name === 'calculate.marketplace_take_rate') {
    const { prepareMcpTakeRateCalculation } = await import('./mcp-calculation-workflow.js');
    output = prepareMcpTakeRateCalculation(args);
  } else if (name === 'export.pattern_pdf') {
    if (!Object.prototype.hasOwnProperty.call(args, 'project')) return invalidParams(request, 'export.pattern_pdf requires arguments.project.');
    const { prepareMcpPdfExport } = await import('./mcp-workflow.js');
    output = await prepareMcpPdfExport(args);
  } else {
    const { prepareMcpBragCardExport, prepareMcpProjectBookExport } = await import('./mcp-artifact-workflow.js');
    output = name === 'export.project_book_pdf'
      ? await prepareMcpProjectBookExport(args)
      : await prepareMcpBragCardExport(args);
  }
  if ('data' in output && output.ready) {
    const { data, ...metadata } = output;
    return success(request, {
      content: [{ type: 'resource', resource: { uri: `stitch-scale://artifacts/${output.artifact.filename}`, mimeType: output.artifact.mimeType, blob: data } }],
      structuredContent: metadata,
      isError: false,
    });
  }
  return success(request, {
    content: [{ type: 'text', text: JSON.stringify(output) }],
    structuredContent: output,
    isError: 'valid' in output ? !output.valid : false,
  });
}

export function parseMcpBody(rawBody: string): { request: McpJsonRpcRequest | null; error?: McpJsonRpcError } {
  if (Buffer.byteLength(rawBody, 'utf8') > MCP_MAX_BODY_BYTES) {
    return { request: null, error: { jsonrpc: MCP_JSONRPC_VERSION, id: null, error: { code: -32600, message: 'Request body is too large.' } } };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return { request: null, error: { jsonrpc: MCP_JSONRPC_VERSION, id: null, error: { code: -32700, message: 'Request body must be valid JSON.' } } };
  }
  if (!isRecord(parsed)) {
    return { request: null, error: { jsonrpc: MCP_JSONRPC_VERSION, id: null, error: { code: -32600, message: 'Request body must be one JSON-RPC object.' } } };
  }
  return { request: parsed as McpJsonRpcRequest };
}

export function mcpCorsOrigin(requestOrigin: string | undefined, configuredOrigin: string | undefined): string {
  if (!configuredOrigin || configuredOrigin === '*') return '';
  return requestOrigin === configuredOrigin ? configuredOrigin : '';
}
