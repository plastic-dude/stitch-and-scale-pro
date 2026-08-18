import { ALL_SIZES, type GradingResult, type PatternProject } from '@/lib/grading-engine';
import { isValidLanguageCode } from '@/lib/i18n';
import { PATTERN_QUALITY_VERSION, validatePatternQuality, type PatternQualityFlag } from '@/lib/pattern-quality';
import { RENDERER_VERSION } from '@/lib/pdf/renderer';

export const PUBLICATION_PREFLIGHT_VERSION = 1;

export type PublicationPreflightSeverity = 'error' | 'warn' | 'info';
export type PublicationPreflightCode =
  | 'X-001' // missing title/author
  | 'X-002' // missing grading output
  | 'X-003' // invalid locale
  | 'X-004' // missing template identity
  | 'X-005' // missing renderer provenance
  | 'X-006' // oversized logo
  | 'X-007'; // quality review required

export interface PublicationPreflightFlag {
  code: PublicationPreflightCode;
  severity: PublicationPreflightSeverity;
  title: string;
  detail: string;
}

export interface PublicationPreflightInput {
  project: PatternProject;
  gradingResult: GradingResult;
  locale?: string;
  templateId?: string;
  customLogo?: string;
}

export interface PublicationPreflightResult {
  version: number;
  rendererVersion: string;
  patternQualityVersion: number;
  readyToPrint: boolean;
  flags: PublicationPreflightFlag[];
}

function hasGradedMeasurements(result: GradingResult): boolean {
  return result.some((section) => section.measurements.some((measurement) => measurement.gradedValues.length > 0));
}

function mapQualityFlags(flags: PatternQualityFlag[]): PublicationPreflightFlag[] {
  return flags
    .filter((flag) => flag.severity === 'error')
    .map((flag) => ({
      code: 'X-007',
      severity: 'error' as const,
      title: 'Pattern quality review is blocked',
      detail: `${flag.code}: ${flag.detail}`,
    }));
}

export function validatePublicationPreflight(input: PublicationPreflightInput): PublicationPreflightResult {
  const { project, gradingResult } = input;
  const locale = input.locale ?? 'en';
  const flags: PublicationPreflightFlag[] = [];
  const quality = validatePatternQuality(project);

  if (!project.name?.trim() || !project.author?.trim()) {
    flags.push({
      code: 'X-001',
      severity: 'error',
      title: 'Publication identity is incomplete',
      detail: 'A published pattern needs both a pattern name and designer name.',
    });
  }
  if (!hasGradedMeasurements(gradingResult)) {
    flags.push({
      code: 'X-002',
      severity: 'error',
      title: 'No graded measurements are available',
      detail: 'Add at least one valid section and measurement before exporting a pattern.',
    });
  }
  if (!isValidLanguageCode(locale)) {
    flags.push({
      code: 'X-003',
      severity: 'error',
      title: 'Export language is unsupported',
      detail: `The locale “${locale}” is not supported by the export labels.`,
    });
  }
  if (!input.templateId?.trim()) {
    flags.push({
      code: 'X-004',
      severity: 'error',
      title: 'Template identity is missing',
      detail: 'Record the selected publication template so the export can be reproduced later.',
    });
  }
  if (!RENDERER_VERSION.trim()) {
    flags.push({
      code: 'X-005',
      severity: 'error',
      title: 'Renderer provenance is missing',
      detail: 'A reproducible export needs a non-empty renderer version.',
    });
  }
  if (input.customLogo && input.customLogo.length > 1_500_000) {
    flags.push({
      code: 'X-006',
      severity: 'warn',
      title: 'Branding image is unusually large',
      detail: 'Use a compressed logo so mobile browsers can preview and print the pattern without avoidable memory pressure.',
    });
  }

  flags.push(...mapQualityFlags(quality.flags));

  // The export route can still offer a preview when warnings exist, but a
  // blocking quality or publication error must stop the print action.
  return {
    version: PUBLICATION_PREFLIGHT_VERSION,
    rendererVersion: RENDERER_VERSION,
    patternQualityVersion: PATTERN_QUALITY_VERSION,
    readyToPrint: flags.every((flag) => flag.severity !== 'error'),
    flags,
  };
}

export function hasAllStandardSizes(project: PatternProject): boolean {
  return ALL_SIZES.includes(project.baseSize);
}
