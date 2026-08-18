import { describe, expect, it } from 'vitest';
import { generateId, gradePattern, SIZE_STANDARDS, type PatternProject } from '@/lib/grading-engine';
import { validatePublicationPreflight } from './publication-quality';

function makeProject(overrides: Partial<PatternProject> = {}): PatternProject {
  return {
    id: generateId(),
    name: 'Publication Test',
    author: 'Tester',
    baseSize: 'M',
    gauge: { stitchesPer4In: 18, rowsPer4In: 24, unit: 'in' },
    sections: [{
      id: 'body',
      name: 'Body',
      measurements: [{
        id: 'bust',
        label: 'Bust circumference',
        measurementType: 'circumference',
        gradingKey: 'bust',
        baseValue: 45,
        stitchRepeat: 6,
        stitchRemainder: 2,
      }],
    }],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('publication-quality', () => {
  it('passes a complete export preflight with explicit provenance', () => {
    const project = makeProject();
    const result = validatePublicationPreflight({
      project,
      gradingResult: gradePattern(project, SIZE_STANDARDS),
      locale: 'en',
      templateId: 'technical',
    });

    expect(result.readyToPrint).toBe(true);
    expect(result.flags).toHaveLength(0);
    expect(result.rendererVersion).toMatch(/^v/);
  });

  it('blocks export when grading output is empty', () => {
    const project = makeProject({ sections: [] });
    const result = validatePublicationPreflight({
      project,
      gradingResult: [],
      locale: 'en',
      templateId: 'technical',
    });

    expect(result.readyToPrint).toBe(false);
    expect(result.flags.some((flag) => flag.code === 'X-002')).toBe(true);
  });

  it('blocks an unsupported locale and missing template identity', () => {
    const project = makeProject();
    const result = validatePublicationPreflight({
      project,
      gradingResult: gradePattern(project, SIZE_STANDARDS),
      locale: 'xx',
      templateId: '',
    });

    expect(result.flags.some((flag) => flag.code === 'X-003')).toBe(true);
    expect(result.flags.some((flag) => flag.code === 'X-004')).toBe(true);
    expect(result.readyToPrint).toBe(false);
  });

  it('accepts normalized browser locales used by the rest of the app', () => {
    const project = makeProject();
    const result = validatePublicationPreflight({
      project,
      gradingResult: gradePattern(project, SIZE_STANDARDS),
      locale: 'en-US',
      templateId: 'technical',
    });

    expect(result.flags.some((flag) => flag.code === 'X-003')).toBe(false);
    expect(result.readyToPrint).toBe(true);
  });

  it('surfaces Pattern QA warnings without blocking export', () => {
    const project = makeProject({
      sections: [{
        id: 'body',
        name: 'Body',
        measurements: [{
          id: 'bust',
          label: '',
          measurementType: 'circumference',
          gradingKey: 'bust',
          baseValue: 45,
        }],
      }],
    });
    const result = validatePublicationPreflight({
      project,
      gradingResult: gradePattern(project, SIZE_STANDARDS),
      locale: 'en',
      templateId: 'technical',
    });

    expect(result.flags.some((flag) => flag.code === 'X-007' && flag.severity === 'warn')).toBe(true);
    expect(result.readyToPrint).toBe(true);
  });

  it('blocks incomplete grading output even when some values are present', () => {
    const project = makeProject();
    const graded = gradePattern(project, SIZE_STANDARDS);
    const incomplete = graded.map((section) => ({
      ...section,
      measurements: section.measurements.map((measurement) => ({
        ...measurement,
        gradedValues: measurement.gradedValues.slice(0, 1),
      })),
    }));
    const result = validatePublicationPreflight({
      project,
      gradingResult: incomplete,
      locale: 'en',
      templateId: 'technical',
    });

    expect(result.flags.some((flag) => flag.code === 'X-008')).toBe(true);
    expect(result.readyToPrint).toBe(false);
  });

  it('blocks an empty rendered artifact and exposes inspection metadata', () => {
    const project = makeProject();
    const result = validatePublicationPreflight({
      project,
      gradingResult: gradePattern(project, SIZE_STANDARDS),
      locale: 'en',
      templateId: 'technical',
      renderedHtml: '',
    });

    expect(result.flags.some((flag) => flag.code === 'X-009' && flag.severity === 'error')).toBe(true);
    expect(result.artifactInspection?.readyForReview).toBe(false);
    expect(result.readyToPrint).toBe(false);
  });

  it('records rendered artifact structure as non-blocking evidence', () => {
    const project = makeProject();
    const result = validatePublicationPreflight({
      project,
      gradingResult: gradePattern(project, SIZE_STANDARDS),
      locale: 'en',
      templateId: 'technical',
      renderedHtml: '<h1>Pattern</h1><h2>Gauge</h2><table><tr><th>Size</th></tr></table>',
    });

    expect(result.artifactInspection?.headingCount).toBe(2);
    expect(result.artifactInspection?.tableCount).toBe(1);
    expect(result.flags.some((flag) => flag.code === 'X-009' && flag.severity === 'info')).toBe(true);
    expect(result.readyToPrint).toBe(true);
  });

  it('propagates blocking Pattern QA evidence instead of trusting a non-empty render', () => {
    const project = makeProject({ gauge: { stitchesPer4In: 0, rowsPer4In: 24, unit: 'in' } });
    const result = validatePublicationPreflight({
      project,
      gradingResult: gradePattern(project, SIZE_STANDARDS),
      locale: 'en',
      templateId: 'technical',
    });

    expect(result.flags.some((flag) => flag.code === 'X-007')).toBe(true);
    expect(result.readyToPrint).toBe(false);
  });
});
