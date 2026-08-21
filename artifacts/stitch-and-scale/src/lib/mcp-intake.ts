import {
  MCP_CONTRACT_VERSION,
  normalizeMcpProject,
  type McpValidationIssue,
} from './mcp-contract.js';

export interface McpIntakeOutput {
  schemaVersion: number;
  ready: boolean;
  project: import('./grading-engine.js').PatternProject | null;
  issues: McpValidationIssue[];
  nextQuestions: string[];
  instruction: string;
}

function questionForIssue(issue: McpValidationIssue): string {
  const path = issue.path;
  if (path === 'name') return 'What should this pattern be called?';
  if (path === 'author') return 'What designer name should appear on the pattern?';
  if (path === 'baseSize') return 'Which base size is the pattern drafted from?';
  if (path === 'gauge.stitchesPer4In') return 'How many stitches are in 4 inches (or the selected gauge unit)?';
  if (path === 'gauge.rowsPer4In') return 'How many rows are in 4 inches (or the selected gauge unit)?';
  if (path === 'gauge.unit') return 'Is the gauge recorded in inches or centimetres?';
  if (path === 'sections') return 'Add at least one section with one measurement to grade the pattern.';
  if (path.startsWith('sections[') && path.endsWith('.name')) return 'What is the name of this pattern section?';
  if (path.includes('.measurements')) return 'Provide a measurement label, grading key, type, and base value for this section.';
  if (path === 'customStandardSnapshot') return 'Provide the frozen custom sizing chart before using the Custom standard.';
  return `Please correct ${path}.`;
}

export function assessMcpProject(raw: unknown): McpIntakeOutput {
  const normalized = normalizeMcpProject(raw);
  const errors = normalized.issues.filter(issue => issue.severity === 'error');
  const nextQuestions = Array.from(new Set(errors.map(questionForIssue))).slice(0, 8);
  return {
    schemaVersion: MCP_CONTRACT_VERSION,
    ready: errors.length === 0,
    project: normalized.project,
    issues: normalized.issues.slice(0, 100),
    nextQuestions,
    instruction: errors.length === 0
      ? 'The supplied snapshot is ready for deterministic grading. Ask the user to confirm the grading scope before running it.'
      : 'Ask only for the missing or invalid fields listed above. Do not guess measurements, gauge, units, sizes, or standards.',
  };
}
