import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import {
  MCP_CONTRACT_VERSION,
  normalizeMcpProject,
  runMcpGrading,
  type McpGradeOutput,
  type McpValidationIssue,
  type McpValidationOutput,
} from './mcp-contract.js';
import { isMcpGradeOutput } from './mcp-contract.js';
import { prepareMcpPdfExport } from './mcp-workflow.js';
import {
  buildBragCardSvg,
  computeBragStats,
  type BragCardBranding,
  type BragCardInput,
  type BragCardStyle,
  type BragCardTemplate,
} from './brag-card.js';
import { getBragCardCopy } from './brag-copy.js';
import type { MonthlyLedgerRow } from './receipt-lab.js';

const MAX_PROJECTS = 52;
const MAX_EXPORT_BYTES = 8 * 1024 * 1024;
const MAX_FILENAME_LENGTH = 100;
const MAX_LEDGER_ROWS = 120;
const MAX_TEXT_LENGTH = 240;
const DEFAULT_LOCALE = 'en';
type ExportLocale = 'en' | 'de' | 'fr' | 'es' | 'pt';

export interface McpProjectBookApprovalRequired {
  schemaVersion: number;
  ready: false;
  requiresUserApproval: true;
  projectCount: number;
  projectIds: string[];
  message: string;
}

export interface McpProjectBookArtifactOutput {
  schemaVersion: number;
  ready: true;
  artifact: {
    kind: 'project-book-pdf';
    filename: string;
    mimeType: 'application/pdf';
    encoding: 'base64';
    byteLength: number;
    projectCount: number;
    projectIds: string[];
    projectRevisions: string[];
    locale: ExportLocale;
    calculationVersion: string;
    limitations: string[];
  };
  data: string;
}

export type McpProjectBookOutput = McpProjectBookArtifactOutput | McpProjectBookApprovalRequired | McpValidationOutput;

export interface McpBragCardApprovalRequired {
  schemaVersion: number;
  ready: false;
  requiresUserApproval: true;
  message: string;
}

export interface McpBragCardArtifactOutput {
  schemaVersion: number;
  ready: true;
  artifact: {
    kind: 'brag-card-svg';
    filename: string;
    mimeType: 'image/svg+xml';
    encoding: 'base64';
    byteLength: number;
    template: BragCardTemplate;
    style: BragCardStyle;
    locale: ExportLocale;
    calculatedFacts: {
      totalRevenue: number;
      totalSales: number;
      totalProfit: number;
      publishedCount: number;
      profitMonths: number;
    };
    limitations: string[];
  };
  data: string;
}

export type McpBragCardOutput = McpBragCardArtifactOutput | McpBragCardApprovalRequired | McpValidationOutput;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function text(raw: unknown, fallback: string, max = MAX_TEXT_LENGTH): string {
  if (typeof raw !== 'string') return fallback;
  const value = raw.trim().slice(0, max);
  return value || fallback;
}

function finite(raw: unknown, fallback = 0): number {
  return typeof raw === 'number' && Number.isFinite(raw) ? raw : fallback;
}

function bool(raw: unknown, fallback: boolean): boolean {
  return typeof raw === 'boolean' ? raw : fallback;
}

function localeValue(raw: unknown): ExportLocale {
  const base = typeof raw === 'string' ? raw.toLowerCase().split('-')[0] : DEFAULT_LOCALE;
  return (['en', 'de', 'fr', 'es', 'pt'] as ExportLocale[]).includes(base as ExportLocale)
    ? base as ExportLocale
    : DEFAULT_LOCALE;
}

function safeFilename(raw: unknown, fallback: string, suffix: string): string {
  const candidate = text(raw, fallback, MAX_FILENAME_LENGTH)
    .replace(new RegExp(`\\${suffix}$`, 'i'), '')
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '')
    .slice(0, MAX_FILENAME_LENGTH)
    || fallback;
  const lower = candidate.toLowerCase();
  return lower.endsWith(suffix) ? lower : `${lower}${suffix}`;
}

function validationOutput(issues: McpValidationIssue[], projectIds: string[] = []): McpValidationOutput {
  return {
    schemaVersion: MCP_CONTRACT_VERSION,
    projectId: projectIds.join(',').slice(0, 120),
    projectRevision: '',
    valid: false,
    issues,
    readiness: { verdict: 'blocked', verdictReason: 'Correct the supplied inputs before creating an artifact.', gradedSizeCount: 0 },
  };
}

function ascii(value: unknown): string {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[—–]/g, '-')
    .split('')
    .map(character => character.charCodeAt(0) < 128 ? character : '?')
    .join('');
}

async function buildProjectBookPdf(projects: Array<{ project: NonNullable<ReturnType<typeof normalizeMcpProject>['project']>; grade: McpGradeOutput }>, title: string, locale: ExportLocale, includeCover: boolean): Promise<Uint8Array> {
  const output = await PDFDocument.create();
  output.setTitle(title);
  output.setAuthor('Stitch & Scale');
  output.setSubject('Deterministic multi-project Project Book');
  const regular = await output.embedFont(StandardFonts.Helvetica);
  const bold = await output.embedFont(StandardFonts.HelveticaBold);
  if (includeCover) {
    const page = output.addPage([612, 792]);
    page.drawText('STITCH & SCALE', { x: 54, y: 700, size: 11, font: bold, color: rgb(0.42, 0.38, 0.34) });
    page.drawLine({ start: { x: 54, y: 674 }, end: { x: 126, y: 674 }, thickness: 3, color: rgb(0.71, 0.36, 0.31) });
    page.drawText(ascii(title), { x: 54, y: 610, size: 27, font: bold, maxWidth: 500, color: rgb(0.10, 0.09, 0.08) });
    page.drawText(`${projects.length} project${projects.length === 1 ? '' : 's'} | deterministic grading snapshot | ${locale}`, { x: 54, y: 565, size: 10, font: regular, color: rgb(0.42, 0.38, 0.34) });
    page.drawText('This book is a portable evidence packet. Values are calculated from the supplied project snapshots; human review remains required before publication.', { x: 54, y: 515, size: 11, font: regular, maxWidth: 470, lineHeight: 16, color: rgb(0.20, 0.18, 0.16) });
    page.drawText('Included projects', { x: 54, y: 430, size: 13, font: bold, color: rgb(0.10, 0.09, 0.08) });
    projects.slice(0, MAX_PROJECTS).forEach(({ project }, index) => {
      page.drawText(`${index + 1}. ${ascii(project.name)}  |  ${project.id.slice(0, 12)}`, { x: 64, y: 402 - index * 17, size: 9, font: regular, maxWidth: 470, color: rgb(0.20, 0.18, 0.16) });
    });
    page.drawText('Provenance: Stitch & Scale deterministic grading engine. This server returns the artifact but never saves, publishes, shares, or emails it.', { x: 54, y: 54, size: 8, font: regular, maxWidth: 500, color: rgb(0.42, 0.38, 0.34) });
  }
  for (const item of projects) {
    const single = await prepareMcpPdfExport({ project: item.project, userApproved: true, filename: `${item.project.id}-grading.pdf`, locale, includeCover: true, includeGaugeSummary: true, includeNotes: true });
    if (!('ready' in single) || !single.ready || !('data' in single)) throw new Error('Unable to render a validated project section.');
    const source = await PDFDocument.load(Buffer.from(single.data, 'base64'));
    const pages = await output.copyPages(source, source.getPageIndices());
    pages.forEach(page => output.addPage(page));
  }
  return output.save();
}

export async function prepareMcpProjectBookExport(input: Record<string, unknown>): Promise<McpProjectBookOutput> {
  const rawProjects = Array.isArray(input.projects) ? input.projects : [];
  const issues: McpValidationIssue[] = [];
  if (rawProjects.length === 0) issues.push({ path: 'projects', code: 'missing', message: 'projects must contain at least one explicitly supplied project.', severity: 'error' });
  if (rawProjects.length > MAX_PROJECTS) issues.push({ path: 'projects', code: 'out_of_range', message: `projects cannot exceed ${MAX_PROJECTS} items per artifact.`, severity: 'error' });
  const normalized: Array<{ project: NonNullable<ReturnType<typeof normalizeMcpProject>['project']>; grade: McpGradeOutput }> = [];
  rawProjects.slice(0, MAX_PROJECTS).forEach((rawProject, index) => {
    const result = normalizeMcpProject(rawProject);
    result.issues.filter(issue => issue.severity === 'error').forEach(issue => issues.push({ ...issue, path: `projects[${index}].${issue.path}` }));
    if (result.project && !result.issues.some(issue => issue.severity === 'error')) {
      const grade = runMcpGrading(result.project);
      if (isMcpGradeOutput(grade)) normalized.push({ project: result.project, grade });
      else issues.push({ path: `projects[${index}]`, code: 'invalid_value', message: 'The project did not produce a deterministic grading result.', severity: 'error' });
    }
  });
  const ids = normalized.map(item => item.project.id);
  if (issues.some(issue => issue.severity === 'error') || normalized.length !== rawProjects.length) return validationOutput(issues, ids);
  if (input.userApproved !== true) {
    return { schemaVersion: MCP_CONTRACT_VERSION, ready: false, requiresUserApproval: true, projectCount: normalized.length, projectIds: ids, message: 'Ask the user to confirm the complete project list, ordering, filename, and combined PDF creation before calling this tool with userApproved=true.' };
  }
  const locale = localeValue(input.locale);
  const title = text(input.title, 'Stitch & Scale Project Book', 160);
  const bytes = await buildProjectBookPdf(normalized, title, locale, bool(input.includeCover, true));
  if (bytes.byteLength > MAX_EXPORT_BYTES) return { schemaVersion: MCP_CONTRACT_VERSION, ready: false, requiresUserApproval: true, projectCount: normalized.length, projectIds: ids, message: 'The combined Project Book exceeds the safe artifact limit. Reduce the project count or scope before exporting.' };
  return {
    schemaVersion: MCP_CONTRACT_VERSION,
    ready: true,
    artifact: {
      kind: 'project-book-pdf', filename: safeFilename(input.filename, 'stitch-and-scale-project-book', '.pdf'), mimeType: 'application/pdf', encoding: 'base64', byteLength: bytes.byteLength,
      projectCount: normalized.length, projectIds: ids, projectRevisions: normalized.map(item => item.project.updatedAt), locale, calculationVersion: normalized[0]?.grade.calculationVersion || `grading-engine-v${MCP_CONTRACT_VERSION}`,
      limitations: ['The combined server artifact uses standard PDF fonts and does not include browser-only logos or portfolio pricing summaries.', 'The server returns the file for user download; it does not save, publish, share, or email it.', 'Human review remains required for every project before publication.'],
    },
    data: Buffer.from(bytes).toString('base64'),
  };
}

function normalizeLedger(raw: unknown, issues: McpValidationIssue[]): MonthlyLedgerRow[] {
  if (!Array.isArray(raw)) {
    issues.push({ path: 'card.ledger', code: 'invalid_type', message: 'card.ledger must be an array.', severity: 'error' });
    return [];
  }
  if (raw.length > MAX_LEDGER_ROWS) issues.push({ path: 'card.ledger', code: 'out_of_range', message: `card.ledger cannot exceed ${MAX_LEDGER_ROWS} rows.`, severity: 'error' });
  return raw.slice(0, MAX_LEDGER_ROWS).map((entry, index) => {
    const row = isRecord(entry) ? entry : {};
    if (!isRecord(entry)) issues.push({ path: `card.ledger[${index}]`, code: 'invalid_type', message: 'Each ledger row must be an object.', severity: 'error' });
    const month = text(row.month, '', 20);
    if (!month) issues.push({ path: `card.ledger[${index}].month`, code: 'missing', message: 'Each ledger row requires a month.', severity: 'error' });
    return { month, revenue: finite(row.revenue), salesCount: Math.max(0, Math.round(finite(row.salesCount))), profit: finite(row.profit) } as MonthlyLedgerRow;
  });
}

export async function prepareMcpBragCardExport(input: Record<string, unknown>): Promise<McpBragCardOutput> {
  const rawCard = isRecord(input.card) ? input.card : {};
  const issues: McpValidationIssue[] = [];
  if (!isRecord(input.card)) issues.push({ path: 'card', code: 'missing', message: 'card must be an explicitly supplied object.', severity: 'error' });
  const ledger = normalizeLedger(rawCard.ledger, issues);
  const template = ['income', 'sales', 'streak', 'published'].includes(rawCard.template as string) ? rawCard.template as BragCardTemplate : 'income';
  const style = ['navy', 'editorial', 'swatch', 'selvedge', 'swiss', 'cameo'].includes(rawCard.style as string) ? rawCard.style as BragCardStyle : 'navy';
  const locale = localeValue(input.locale);
  const card: BragCardInput = { studioName: text(rawCard.studioName, 'My Studio'), currency: text(rawCard.currency, 'USD', 12), ledger, publishedCount: Math.max(0, Math.round(finite(rawCard.publishedCount))), salesCount: Math.max(0, Math.round(finite(rawCard.salesCount))) };
  if (issues.some(issue => issue.severity === 'error')) return validationOutput(issues);
  if (input.userApproved !== true) return { schemaVersion: MCP_CONTRACT_VERSION, ready: false, requiresUserApproval: true, message: 'Ask the user to confirm the supplied ledger, template, style, branding, filename, and SVG creation before calling this tool with userApproved=true.' };
  const accent = typeof input.accent === 'string' && /^#[0-9a-fA-F]{6}$/.test(input.accent) ? input.accent : '#b65b50';
  const rawBranding = isRecord(input.branding) ? input.branding : {};
  const logo = typeof rawBranding.customLogo === 'string' && rawBranding.customLogo.startsWith('data:image/') && rawBranding.customLogo.length <= 200_000 ? rawBranding.customLogo : undefined;
  const branding: BragCardBranding = { studioName: text(rawBranding.studioName, card.studioName), socialHandle: text(rawBranding.socialHandle, '', 80), copyrightNotice: text(rawBranding.copyrightNotice, '', 120), customLogo: logo };
  const stats = computeBragStats(card);
  const copy = getBragCardCopy(locale);
  const svg = buildBragCardSvg(stats, card.currency, template, card.studioName, accent, style, copy, branding);
  const data = Buffer.from(svg, 'utf8').toString('base64');
  return { schemaVersion: MCP_CONTRACT_VERSION, ready: true, artifact: { kind: 'brag-card-svg', filename: safeFilename(input.filename, `brag-card-${template}`, '.svg'), mimeType: 'image/svg+xml', encoding: 'base64', byteLength: Buffer.byteLength(svg, 'utf8'), template, style, locale, calculatedFacts: { totalRevenue: stats.totalRevenue, totalSales: stats.totalSales, totalProfit: stats.totalProfit, publishedCount: stats.publishedCount, profitMonths: stats.profitMonths }, limitations: ['This SVG is generated only from the supplied ledger and counts; the server does not verify external sales or design records.', 'The server returns the artifact but does not save, publish, share, or email it.'] }, data };
}
