import { describe, expect, it } from 'vitest';
import { buildHandoffEvidence, serializeHandoffEvidence } from './handoff-evidence';
import type { PatternProject } from './grading-engine';
import type { ReadinessResult } from './pattern-readiness';
import type { AuditSummary } from './tech-edit-audit';

const project: PatternProject = {
  id: 'p-1',
  name: 'Harbour Sweater',
  author: 'A. Designer',
  baseSize: 'M',
  gauge: { stitchesPer4In: 20, rowsPer4In: 28, unit: 'in' },
  sections: [{
    id: 'body',
    name: 'Body',
    measurements: [{
      id: 'bust',
      label: 'Bust',
      measurementType: 'circumference',
      gradingKey: 'bust',
      baseValue: 40,
      stitchRepeat: 4,
    }],
  }],
  createdAt: '2026-08-21T10:00:00.000Z',
  updatedAt: '2026-08-21T11:00:00.000Z',
  sizingStandard: 'Custom',
  customStandardSnapshot: { XS: {}, S: {}, M: {}, L: {}, XL: {}, '2XL': {}, '3XL': {}, '4XL': {}, '5XL': {} } as PatternProject['customStandardSnapshot'],
  humanReview: {
    status: 'approved',
    reviewerName: 'Tech Editor',
    note: 'Numbers checked.',
    reviewedAt: '2026-08-21T12:00:00.000Z',
  },
};

const readiness: ReadinessResult = {
  checks: [],
  ready: true,
  errorCount: 0,
  warningCount: 1,
};

const audit: AuditSummary = {
  findingCounts: { error: 0, warning: 2, info: 1, pass: 9 },
  score: 92,
  verdict: 'check',
  findings: [],
  marketBill: { low: 40, high: 80, hours: 2, pending: 2, waitDays: 10, note: 'Review.' },
};

describe('handoff evidence', () => {
  it('captures the calculation contract and human decision without mutating the project', () => {
    const evidence = buildHandoffEvidence(project, readiness, audit, '2026-08-21T13:00:00.000Z');

    expect(evidence.schemaVersion).toBe(1);
    expect(evidence.project).toEqual({
      id: 'p-1', name: 'Harbour Sweater', author: 'A. Designer', updatedAt: '2026-08-21T11:00:00.000Z',
    });
    expect(evidence.calculation).toMatchObject({
      engineVersion: 'grading-engine-v1',
      sizingStandard: 'Custom',
      customStandardSnapshotPresent: true,
      baseSize: 'M',
      sections: 1,
      measurements: 1,
      constrainedMeasurements: 1,
    });
    expect(evidence.automatedReview).toEqual({
      readiness: { ready: true, errors: 0, warnings: 1 },
      technicalEdit: { score: 92, verdict: 'check', errors: 0, warnings: 2, info: 1, pass: 9 },
    });
    expect(evidence.humanReview).toEqual({
      status: 'approved', reviewerName: 'Tech Editor', note: 'Numbers checked.', reviewedAt: '2026-08-21T12:00:00.000Z',
    });
    expect(project.humanReview?.status).toBe('approved');
  });

  it('uses safe legacy defaults and produces valid JSON', () => {
    const legacy = { ...project, sizingStandard: undefined, customStandardSnapshot: undefined, humanReview: undefined };
    const evidence = buildHandoffEvidence(legacy, readiness, audit, '2026-08-21T13:00:00.000Z');

    expect(evidence.calculation.sizingStandard).toBe('CYC');
    expect(evidence.calculation.customStandardSnapshotPresent).toBe(false);
    expect(evidence.humanReview.status).toBe('not-reviewed');
    expect(JSON.parse(serializeHandoffEvidence(evidence))).toEqual(evidence);
  });
});
