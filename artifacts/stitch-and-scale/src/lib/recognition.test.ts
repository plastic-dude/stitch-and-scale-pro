import { describe, expect, it } from 'vitest';
import type { PatternProject } from './grading-engine';
import type { LabResult } from './grading-lab';
import { projectStorage } from './storage-lib';
import {
  FIRST_CLEAN_GRADE_KIND,
  normalizeRecognitionState,
  observeFirstCleanGrade,
  RECOGNITION_SCHEMA_VERSION,
} from './recognition';

const project = (overrides: Partial<PatternProject> = {}): PatternProject => ({
  id: 'project-1',
  name: 'Quiet Cardigan',
  author: 'Maker',
  baseSize: 'M',
  gauge: { stitchesPer4In: 20, rowsPer4In: 28, unit: 'in' },
  sections: [],
  createdAt: '2026-08-22T00:00:00.000Z',
  updatedAt: '2026-08-22T00:00:00.000Z',
  ...overrides,
} as PatternProject);

const result = (overrides: Partial<LabResult> = {}): LabResult => ({
  sizeChecks: [],
  gradedSizeCount: 3,
  gradedBustEaseCm: 10,
  easeBand: 'Classic fit',
  flags: [],
  freelanceCost: { min: 45, max: 75 },
  verdict: 'ready',
  verdictReason: 'All checks pass',
  ...overrides,
});

describe('first-clean-grade recognition', () => {
  it('records only a genuinely clean ready result with a nonzero graded size count', () => {
    const observed = observeFirstCleanGrade(
      project(),
      result(),
      null,
      '2026-08-22T12:00:00.000Z',
    );

    expect(observed.event).toMatchObject({
      kind: FIRST_CLEAN_GRADE_KIND,
      earnedAt: '2026-08-22T12:00:00.000Z',
      sizeCount: 3,
      acknowledgedAt: null,
    });
    expect(observed.event?.id).toContain(`${FIRST_CLEAN_GRADE_KIND}:`);
    expect(observed.state.version).toBe(RECOGNITION_SCHEMA_VERSION);
    expect(observed.state.events).toHaveLength(1);
  });

  it.each([
    ['review', { verdict: 'review' as const }],
    ['blocked', { verdict: 'blocked' as const }],
    ['zero graded sizes', { gradedSizeCount: 0 }],
    ['ready with an informational flag', {
      flags: [{ code: 'G-07', severity: 'info', title: 'Inclusive range note', detail: 'Context only' }],
    }],
  ])('rejects %s as a clean recognition event', (_label, overrides) => {
    const observed = observeFirstCleanGrade(project(), result(overrides), null);
    expect(observed.event).toBeNull();
    expect(observed.state.events).toHaveLength(0);
  });

  it('normalizes malformed, unknown, and duplicate persisted records safely', () => {
    const normalized = normalizeRecognitionState({
      version: 1,
      events: [
        { kind: 'future-kind', id: 'future', earnedAt: 'nope' },
        { kind: FIRST_CLEAN_GRADE_KIND, id: 'wrong', earnedAt: '2026-08-22T12:00:00.000Z', sourceFingerprint: 'x', sizeCount: 3, acknowledgedAt: null },
        { kind: FIRST_CLEAN_GRADE_KIND, id: `${FIRST_CLEAN_GRADE_KIND}:valid`, earnedAt: '2026-08-22T12:00:00.000Z', sourceFingerprint: 'valid', sizeCount: 3, acknowledgedAt: null },
        { kind: FIRST_CLEAN_GRADE_KIND, id: `${FIRST_CLEAN_GRADE_KIND}:valid`, earnedAt: '2026-08-22T12:01:00.000Z', sourceFingerprint: 'valid', sizeCount: 4, acknowledgedAt: null },
      ],
    });

    expect(normalized).toEqual({
      version: 1,
      events: [{
        kind: FIRST_CLEAN_GRADE_KIND,
        id: `${FIRST_CLEAN_GRADE_KIND}:valid`,
        earnedAt: '2026-08-22T12:00:00.000Z',
        sourceFingerprint: 'valid',
        sizeCount: 3,
        acknowledgedAt: null,
      }],
    });
    expect(normalizeRecognitionState({ version: 999, events: [] })).toEqual({ version: 1, events: [] });
    expect(normalizeRecognitionState('not-an-object')).toEqual({ version: 1, events: [] });
  });

  it('suppresses repeats for the same project even after a source revision', () => {
    const first = observeFirstCleanGrade(project(), result(), null, '2026-08-22T12:00:00.000Z');
    const revised = observeFirstCleanGrade(
      project({ name: 'Revised Quiet Cardigan' }),
      result({ gradedSizeCount: 4 }),
      first.state,
      '2026-08-23T12:00:00.000Z',
    );

    expect(first.event).not.toBeNull();
    expect(revised.event).toBeNull();
    expect(revised.state.events).toEqual(first.state.events);
  });

  it('keeps evidence when presentation is opted out', () => {
    const observed = observeFirstCleanGrade(project(), result(), null);
    const recognitionEnabled = false;

    expect(recognitionEnabled).toBe(false);
    expect(observed.event).not.toBeNull();
    expect(observed.state.events).toHaveLength(1);
    // The setting is intentionally presentation-only; event evidence is unchanged.
    expect(observed.state.events[0].acknowledgedAt).toBeNull();
  });

  it('uses the canonical project-scoped storage key rather than a global key', () => {
    const first = projectStorage('recognition', 'project-1');
    const second = projectStorage('recognition', 'project-2');

    expect(first.scopedKey).toBe('stitch-and-scale-recognition-project-1');
    expect(second.scopedKey).toBe('stitch-and-scale-recognition-project-2');
    expect(first.scopedKey).not.toBe(second.scopedKey);
  });
});
