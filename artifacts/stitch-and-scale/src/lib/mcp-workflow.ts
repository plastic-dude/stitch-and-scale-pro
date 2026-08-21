import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import {
  MCP_CONTRACT_VERSION,
  normalizeMcpProject,
  runMcpGrading,
  type McpGradeOutput,
  type McpValidationIssue,
  type McpValidationOutput,
} from './mcp-contract.js';
import { isMcpGradeOutput } from './mcp-contract.js';
import { getPdfLabels } from './pdf/labels.js';
import { type PatternProject } from './grading-engine.js';

const MAX_FILENAME_LENGTH = 100;
const MAX_EXPORT_BYTES = 3 * 1024 * 1024;
const DEFAULT_LOCALE = 'en';

type ExportLocale = 'en' | 'de' | 'fr' | 'es' | 'pt';

export interface McpIntakeOutput {
  schemaVersion: number;
  ready: boolean;
  project: PatternProject | null;
  issues: McpValidationIssue[];
  nextQuestions: string[];
  instruction: string;
}

export interface McpPdfApprovalRequired {
  schemaVersion: number;
  ready: false;
  requiresUserApproval: true;
  projectId: string;
  projectRevision: string;
  message: string;
}

export interface McpPdfArtifactOutput {
  schemaVersion: number;
  ready: true;
  artifact: {
    kind: 'grading-pdf';
    filename: string;
    mimeType: 'application/pdf';
    encoding: 'base64';
    byteLength: number;
    projectId: string;
    projectRevision: string;
    calculationVersion: string;
    gradingLabVersion: number;
    standardsSource: string;
    locale: ExportLocale;
    limitations: string[];
  };
  /** Base64 payload for MCP embedded-resource/file handoff. */
  data: string;
}

export type McpPdfOutput = McpPdfArtifactOutput | McpPdfApprovalRequired | McpValidationOutput;

function text(raw: unknown, fallback: string, maxLength = 240): string {
  if (typeof raw !== 'string') return fallback;
  const value = raw.trim().slice(0, maxLength);
  return value || fallback;
}

function localeValue(raw: unknown): ExportLocale {
  const base = typeof raw === 'string' ? raw.toLowerCase().split('-')[0] : DEFAULT_LOCALE;
  return (['en', 'de', 'fr', 'es', 'pt'] as ExportLocale[]).includes(base as ExportLocale)
    ? base as ExportLocale
    : DEFAULT_LOCALE;
}

function boolValue(raw: unknown, fallback: boolean): boolean {
  return typeof raw === 'boolean' ? raw : fallback;
}

function safeFilename(raw: unknown, projectName: string): string {
  const fallback = `${projectName || 'stitch-and-scale-grading'}-grading-report`;
  const candidate = text(raw, fallback, MAX_FILENAME_LENGTH)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '')
    .slice(0, MAX_FILENAME_LENGTH)
    || 'stitch-and-scale-grading-report';
  const normalized = candidate.replace(/-+\./g, '.').toLowerCase();
  return normalized.endsWith('.pdf') ? normalized : `${normalized}.pdf`;
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

function asciiSafe(value: unknown): string {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[—–]/g, '-')
    .replace(/[•·]/g, '*')
    .replace(/[^\x20-\x7E]/g, '?');
}

function wrap(value: unknown, font: PDFFont, size: number, maxWidth: number): string[] {
  const source = asciiSafe(value);
  if (!source) return [''];
  const words = source.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth || !line) {
      line = candidate;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

class PdfWriter {
  private page: PDFPage;
  private y: number;
  private readonly margin = 42;
  private readonly width = 612;
  private readonly height = 792;

  constructor(private readonly pdf: PDFDocument, private readonly regular: PDFFont, private readonly bold: PDFFont) {
    this.page = pdf.addPage([this.width, this.height]);
    this.y = this.height - this.margin;
  }

  private ensure(height: number) {
    if (this.y - height < this.margin) {
      this.page = this.pdf.addPage([this.width, this.height]);
      this.y = this.height - this.margin;
    }
  }

  heading(value: unknown, size = 20) {
    this.ensure(size + 20);
    this.page.drawText(asciiSafe(value), { x: this.margin, y: this.y, size, font: this.bold, color: rgb(0.10, 0.09, 0.08) });
    this.y -= size + 12;
  }

  paragraph(value: unknown, size = 10, color = rgb(0.28, 0.25, 0.22)) {
    const lines = wrap(value, this.regular, size, this.width - this.margin * 2);
    this.ensure(lines.length * (size + 4) + 4);
    for (const line of lines) {
      this.page.drawText(line, { x: this.margin, y: this.y, size, font: this.regular, color });
      this.y -= size + 4;
    }
    this.y -= 5;
  }

  rule() {
    this.ensure(12);
    this.page.drawLine({ start: { x: this.margin, y: this.y }, end: { x: this.width - this.margin, y: this.y }, thickness: 0.7, color: rgb(0.72, 0.68, 0.63) });
    this.y -= 12;
  }

  labelValue(label: unknown, value: unknown) {
    this.ensure(16);
    this.page.drawText(asciiSafe(label), { x: this.margin, y: this.y, size: 8, font: this.bold, color: rgb(0.45, 0.40, 0.35) });
    this.page.drawText(asciiSafe(value), { x: this.margin + 112, y: this.y, size: 10, font: this.regular, color: rgb(0.15, 0.14, 0.12) });
    this.y -= 16;
  }

  tableHeader(columns: string[], widths: number[]) {
    this.ensure(22);
    let x = this.margin;
    columns.forEach((column, index) => {
      this.page.drawText(asciiSafe(column), { x, y: this.y, size: 8, font: this.bold, color: rgb(0.42, 0.38, 0.34), maxWidth: widths[index] });
      x += widths[index];
    });
    this.y -= 9;
    this.rule();
  }

  tableRow(values: unknown[], widths: number[]) {
    const rows = values.map((value, index) => wrap(value, this.regular, 8, widths[index] - 6));
    const rowHeight = Math.max(...rows.map(lines => lines.length)) * 11 + 7;
    this.ensure(rowHeight);
    let x = this.margin;
    const top = this.y;
    values.forEach((_value, index) => {
      rows[index].forEach((line, lineIndex) => {
        this.page.drawText(line, { x, y: top - lineIndex * 11, size: 8, font: this.regular, color: rgb(0.15, 0.14, 0.12) });
      });
      x += widths[index];
    });
    this.y -= rowHeight;
    this.page.drawLine({ start: { x: this.margin, y: this.y }, end: { x: this.width - this.margin, y: this.y }, thickness: 0.35, color: rgb(0.85, 0.82, 0.78) });
    this.y -= 5;
  }

  footer(value: unknown) {
    this.page.drawText(asciiSafe(value), { x: this.margin, y: 20, size: 7, font: this.regular, color: rgb(0.48, 0.44, 0.40) });
  }
}

function gaugeText(project: PatternProject): string {
  return `${project.gauge.stitchesPer4In} sts x ${project.gauge.rowsPer4In} rows / 4${project.gauge.unit}`;
}

async function renderPdf(project: PatternProject, grade: McpGradeOutput, locale: ExportLocale, includeCover: boolean, includeGaugeSummary: boolean, includeNotes: boolean): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`${project.name} - Stitch & Scale grading report`);
  pdf.setAuthor(project.author || 'Stitch & Scale designer');
  pdf.setSubject('Deterministic Stitch & Scale grading report');
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const writer = new PdfWriter(pdf, regular, bold);
  const labels = getPdfLabels(locale);

  if (includeCover) {
    writer.heading(project.name || 'Untitled pattern', 28);
    writer.paragraph(`${labels.by} ${project.author || 'Designer'}`, 12, rgb(0.42, 0.38, 0.34));
    writer.rule();
    writer.labelValue(labels.gauge, gaugeText(project));
    writer.labelValue(labels.baseSize, project.baseSize);
    writer.labelValue(labels.template, 'MCP deterministic grading report');
    writer.labelValue('Standard', grade.standardsSource);
    writer.labelValue('Revision', grade.projectRevision);
    writer.paragraph('Calculated by the Stitch & Scale grading engine. This report is not a fit guarantee; test the fabric and review finished measurements before publishing.', 10);
    writer.heading('Grading verdict', 16);
    writer.paragraph(`${grade.analysis.verdict}: ${grade.analysis.verdictReason}`, 10);
    writer.rule();
  } else {
    writer.heading(`${project.name || 'Untitled pattern'} - grading`, 20);
  }

  if (includeGaugeSummary) {
    writer.heading(labels.materialsGauge, 15);
    writer.labelValue(labels.gauge, gaugeText(project));
    writer.labelValue(labels.baseSize, project.baseSize);
    writer.labelValue('Sizing standard', grade.standardsSource);
    writer.paragraph(grade.roundingRules.note, 9);
  }

  if (grade.warnings.length > 0) {
    writer.heading('Warnings and review notes', 15);
    grade.warnings.slice(0, 20).forEach(warning => writer.paragraph(`- ${warning}`, 9, rgb(0.50, 0.24, 0.18)));
  }

  writer.heading('Graded measurements', 15);
  const widths = [120, 48, 54, 54, 54];
  for (const section of grade.sections) {
    writer.heading(section.sectionName, 12);
    for (const measurement of section.measurements) {
      writer.paragraph(`${measurement.label} - ${measurement.gradingKey}`, 9, rgb(0.42, 0.38, 0.34));
      writer.tableHeader(['Size', 'Physical', 'Stitches', 'Rows', 'Exact'], widths);
      for (const value of measurement.gradedValues) {
        writer.tableRow([
          value.size,
          `${value.physicalValue} ${project.gauge.unit}`,
          value.stitchCount,
          value.rowCount ?? '-',
          `${value.exactStitchCount}${value.exactRowCount !== undefined ? ` / ${value.exactRowCount}` : ''}`,
        ], widths);
      }
    }
  }

  if (includeNotes && project.description?.trim()) {
    writer.heading(labels.patternNotes, 15);
    writer.paragraph(project.description, 9);
  }
  writer.paragraph('Provenance: deterministic Stitch & Scale grading; no AI recalculation. Human review remains required.', 8, rgb(0.42, 0.38, 0.34));
  writer.footer(`Stitch & Scale | ${project.id.slice(0, 12)} | ${grade.projectRevision}`);
  return pdf.save();
}

function bytesToBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64');
}

export async function prepareMcpPdfExport(input: Record<string, unknown>): Promise<McpPdfOutput> {
  const rawProject = input.project;
  const normalized = normalizeMcpProject(rawProject);
  const project = normalized.project;
  if (!project || normalized.issues.some(issue => issue.severity === 'error')) {
    const fallback = runMcpGrading(rawProject);
    return ('valid' in fallback ? fallback : {
      schemaVersion: MCP_CONTRACT_VERSION,
      projectId: project?.id ?? '',
      projectRevision: project?.updatedAt ?? '',
      valid: false,
      issues: normalized.issues,
      readiness: { verdict: 'blocked', verdictReason: 'Correct project inputs before creating a PDF.', gradedSizeCount: 0 },
    });
  }
  if (input.userApproved !== true) {
    return {
      schemaVersion: MCP_CONTRACT_VERSION,
      ready: false,
      requiresUserApproval: true,
      projectId: project.id,
      projectRevision: project.updatedAt,
      message: 'Ask the user to confirm the project, grading scope, filename, and PDF creation before calling this tool with userApproved=true.',
    };
  }
  const grade = runMcpGrading(project);
  if (!isMcpGradeOutput(grade)) return grade;
  const locale = localeValue(input.locale);
  const includeCover = boolValue(input.includeCover, true);
  const includeGaugeSummary = boolValue(input.includeGaugeSummary, true);
  const includeNotes = boolValue(input.includeNotes, true);
  const bytes = await renderPdf(project, grade, locale, includeCover, includeGaugeSummary, includeNotes);
  if (bytes.byteLength > MAX_EXPORT_BYTES) {
    return {
      schemaVersion: MCP_CONTRACT_VERSION,
      ready: false,
      requiresUserApproval: true,
      projectId: project.id,
      projectRevision: project.updatedAt,
      message: 'The requested PDF is too large for this MCP handoff. Reduce the project scope before exporting.',
    };
  }
  return {
    schemaVersion: MCP_CONTRACT_VERSION,
    ready: true,
    artifact: {
      kind: 'grading-pdf',
      filename: safeFilename(input.filename, project.name),
      mimeType: 'application/pdf',
      encoding: 'base64',
      byteLength: bytes.byteLength,
      projectId: project.id,
      projectRevision: project.updatedAt,
      calculationVersion: grade.calculationVersion,
      gradingLabVersion: grade.gradingLabVersion,
      standardsSource: grade.standardsSource,
      locale,
      limitations: ['The server artifact uses a standard PDF font; unusual glyphs may be substituted. Use the in-app browser renderer for full brand/logo fidelity.', 'The PDF is prepared for user download; the server does not save, publish, or share it.'],
    },
    data: bytesToBase64(bytes),
  };
}
