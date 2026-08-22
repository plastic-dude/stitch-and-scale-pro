import { ALL_SIZES, type GradingResult, type PatternProject, type StandardsTable } from '@/lib/grading-engine';
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
  | 'X-007' // quality review required
  | 'X-008'; // incomplete grading output

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
  liveCustomStandard?: StandardsTable;
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

function hasCompleteGradingResult(project: PatternProject, result: GradingResult): boolean {
  if (result.length !== project.sections.length) return false;
  return project.sections.every((section) => {
    const gradedSection = result.find((candidate) => candidate.sectionId === section.id);
    if (!gradedSection || gradedSection.measurements.length !== section.measurements.length) return false;
    return section.measurements.every((measurement) => {
      const gradedMeasurement = gradedSection.measurements.find((candidate) => candidate.measurementId === measurement.id);
      if (!gradedMeasurement || gradedMeasurement.gradedValues.length !== ALL_SIZES.length) return false;
      return new Set(gradedMeasurement.gradedValues.map((value) => value.size)).size === ALL_SIZES.length;
    });
  });
}

function mapQualityFlags(flags: PatternQualityFlag[]): PublicationPreflightFlag[] {
  return flags
    .filter((flag) => flag.code !== 'P-001' && flag.code !== 'P-002')
    .map((flag) => ({
      code: 'X-007',
      severity: flag.severity,
      title: flag.severity === 'error' ? 'Pattern quality review is blocked' : 'Pattern quality review needs attention',
      detail: `${flag.code}: ${flag.detail}`,
    }));
}

export function validatePublicationPreflight(input: PublicationPreflightInput): PublicationPreflightResult {
  const { project, gradingResult } = input;
  const locale = input.locale ?? 'en';
  const normalizedLocale = locale.toLowerCase().split('-')[0];
  const flags: PublicationPreflightFlag[] = [];
  const quality = validatePatternQuality(project, input.liveCustomStandard);

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
  } else if (!hasCompleteGradingResult(project, gradingResult)) {
    flags.push({
      code: 'X-008',
      severity: 'error',
      title: 'Grading output is incomplete',
      detail: 'Re-run grading so every project measurement has one result for each supported size before exporting.',
    });
  }
  if (!isValidLanguageCode(normalizedLocale)) {
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

export function getPreflightStatus(result: PublicationPreflightResult): 'pass' | 'fail' | 'pending' | 'blocked' {
  if (result.flags.some(f => f.severity === 'error')) return 'blocked';
  if (result.flags.some(f => f.severity === 'warn')) return 'fail';
  return 'pass';
}

export function hasAllStandardSizes(project: PatternProject): boolean {
  return ALL_SIZES.includes(project.baseSize);
}
