import {
  GRADING_KEY_LABELS,
  gradePattern,
  isCustomStandardMissing,
  resolveProjectStandards,
  type GradingResult,
  type PatternProject,
  type StandardsTable,
} from '@/lib/grading-engine';
import { analyzeGrading, type LabFlag, type LabResult } from '@/lib/grading-lab';

export const PATTERN_QUALITY_VERSION = 1;

export type PatternQualitySeverity = 'error' | 'warn' | 'info';
export type PatternQualitySource = 'structure' | 'grading';

export type PatternQualityCode =
  | 'P-001' // missing pattern name
  | 'P-002' // missing designer name
  | 'P-003' // invalid gauge
  | 'P-004' // no sections
  | 'P-005' // section without measurements
  | 'P-006' // missing or duplicate ids
  | 'P-007' // missing measurement label
  | 'P-008' // invalid measurement value or grading key
  | 'P-009' // custom sizing chart missing
  | 'P-010' // non-finite grading output
  | 'P-011'; // grading engine could not complete

export interface PatternQualityFlag {
  code: PatternQualityCode | LabFlag['code'];
  source: PatternQualitySource;
  severity: PatternQualitySeverity;
  title: string;
  detail: string;
  sectionId?: string;
  measurementId?: string;
}

export interface PatternQualityResult {
  version: number;
  verdict: 'ready' | 'review' | 'blocked';
  flags: PatternQualityFlag[];
  grading: LabResult | null;
  graded: GradingResult;
  sectionCount: number;
  measurementCount: number;
  checkedSizeCount: number;
  checkedAt: string;
}

function structuralFlag(
  code: PatternQualityCode,
  severity: PatternQualitySeverity,
  title: string,
  detail: string,
  extra: Pick<PatternQualityFlag, 'sectionId' | 'measurementId'> = {},
): PatternQualityFlag {
  return { code, source: 'structure', severity, title, detail, ...extra };
}

function mapGradingFlag(flag: LabFlag): PatternQualityFlag {
  return {
    code: flag.code,
    source: 'grading',
    severity: flag.severity,
    title: flag.title,
    detail: flag.detail,
  };
}

function isFinitePositive(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function hasInvalidOutput(result: GradingResult): boolean {
  return result.some((section) =>
    section.measurements.some((measurement) =>
      measurement.gradedValues.some((value) =>
        !Number.isFinite(value.physicalValue) ||
        !Number.isFinite(value.stitchCount) ||
        value.stitchCount < 0 ||
        (value.rowCount !== undefined && (!Number.isFinite(value.rowCount) || value.rowCount < 0)),
      ),
    ),
  );
}

export function validatePatternQuality(
  project: PatternProject,
  liveCustomStandard?: StandardsTable,
): PatternQualityResult {
  const flags: PatternQualityFlag[] = [];
  const seenIds = new Set<string>();
  const sections = Array.isArray(project.sections) ? project.sections : [];
  const measurementCount = sections.reduce((total, section) => total + (section.measurements?.length ?? 0), 0);

  if (!project.name?.trim()) {
    flags.push(structuralFlag('P-001', 'error', 'Pattern name is missing', 'Give the pattern a stable name before reviewing or publishing it.'));
  }
  if (!project.author?.trim()) {
    flags.push(structuralFlag('P-002', 'warn', 'Designer name is missing', 'A publication should identify its designer; add an author before export.'));
  }
  if (!isFinitePositive(project.gauge?.stitchesPer4In) || !isFinitePositive(project.gauge?.rowsPer4In)) {
    flags.push(structuralFlag('P-003', 'error', 'Gauge is incomplete', 'Enter positive stitches and rows per four units. Gauge drives every physical and stitch output.'));
  }
  if (sections.length === 0) {
    flags.push(structuralFlag('P-004', 'error', 'No pattern sections exist', 'Add at least one section before grading or publishing the pattern.'));
  }

  for (const section of sections) {
    if (!section.measurements?.length) {
      flags.push(structuralFlag('P-005', 'error', 'Section has no measurements', `“${section.name || 'Unnamed section'}” cannot produce a graded output without a measurement.`, { sectionId: section.id }));
    }
    if (!section.id || seenIds.has(section.id)) {
      flags.push(structuralFlag('P-006', 'error', 'Section identifier is missing or duplicated', 'Each section must have a stable unique identifier so exports and saved records remain traceable.', { sectionId: section.id }));
    }
    if (section.id) seenIds.add(section.id);

    for (const measurement of section.measurements ?? []) {
      if (!measurement.id || seenIds.has(measurement.id)) {
        flags.push(structuralFlag('P-006', 'error', 'Measurement identifier is missing or duplicated', 'Each measurement needs a stable unique identifier so a later edit cannot attach values to the wrong row.', { sectionId: section.id, measurementId: measurement.id }));
      }
      if (measurement.id) seenIds.add(measurement.id);
      if (!measurement.label?.trim()) {
        flags.push(structuralFlag('P-007', 'warn', 'Measurement label is missing', 'Name the measurement so a grader, tech editor, and knitter can identify the row in the export.', { sectionId: section.id, measurementId: measurement.id }));
      }
      if (!isFinitePositive(measurement.baseValue) || !(measurement.gradingKey in GRADING_KEY_LABELS)) {
        flags.push(structuralFlag('P-008', 'error', 'Measurement data is invalid', 'Each measurement needs a positive numeric base value and a supported grading key.', { sectionId: section.id, measurementId: measurement.id }));
      }
    }
  }

  if (isCustomStandardMissing(project)) {
    flags.push(structuralFlag('P-009', 'error', 'Custom sizing chart is missing', 'This project was created with Custom sizing, but its frozen chart is unavailable. Add the designer’s measurements before trusting any grade.', ));
  }

  let graded: GradingResult = [];
  let grading: LabResult | null = null;
  try {
    const standards = resolveProjectStandards(project, liveCustomStandard);
    graded = gradePattern(project, standards);
    grading = analyzeGrading(project);
    if (hasInvalidOutput(graded)) {
      flags.push(structuralFlag('P-010', 'error', 'Grading produced an unsafe value', 'At least one graded physical, stitch, or row value is non-finite or negative. Do not export until the source data is corrected.'));
    }
  } catch (error) {
    flags.push(structuralFlag('P-011', 'error', 'Grading could not complete', error instanceof Error ? error.message : 'The grading engine stopped before producing a complete result.'));
  }

  if (grading) flags.push(...grading.flags.map(mapGradingFlag));

  const errors = flags.filter((flag) => flag.severity === 'error').length;
  const warnings = flags.filter((flag) => flag.severity === 'warn').length;
  const verdict = errors > 0 ? 'blocked' : warnings > 0 ? 'review' : 'ready';
  const checkedSizeCount = graded
    .flatMap((section) => section.measurements)
    .map((measurement) => measurement.gradedValues.length)
    .reduce((max, count) => Math.max(max, count), 0);

  return {
    version: PATTERN_QUALITY_VERSION,
    verdict,
    flags,
    grading,
    graded,
    sectionCount: sections.length,
    measurementCount,
    checkedSizeCount,
    checkedAt: new Date().toISOString(),
  };
}
