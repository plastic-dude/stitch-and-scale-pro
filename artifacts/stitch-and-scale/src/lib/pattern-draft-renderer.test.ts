import { describe, it, expect } from 'vitest';
import { renderDraft } from './pattern-draft-renderer';
import { PatternProject, generateId } from './grading-engine';

function sampleProject(overrides: Partial<PatternProject> = {}): PatternProject {
  return {
    id: 'p1',
    name: 'Crewneck Sweater',
    author: 'Stitch & Scale Demo',
    baseSize: 'M',
    gauge: { stitchesPer4In: 18, rowsPer4In: 24, unit: 'in' },
    sections: [
      {
        id: 's1',
        name: 'Back',
        measurements: [
          { id: 'm1', label: 'Back width', measurementType: 'circumference', gradingKey: 'bust', baseValue: 18.5 },
          { id: 'm2', label: 'Back length', measurementType: 'length', gradingKey: 'backLength', baseValue: 26 },
        ],
      },
    ],
    createdAt: '2026-08-14T00:00:00Z',
    updatedAt: '2026-08-14T00:00:00Z',
    yarnWeight: 'worsted',
    ...overrides,
  };
}

describe('renderDraft', () => {
  const project = sampleProject();

  it('resolves {Name}, {Author}, and gauge placeholders', () => {
    const out = renderDraft('Pattern: {Name} by {Author}. Gauge: {Gauge.stitches}sts x {Gauge.rows} rows / 4in.', project, undefined);
    expect(out).toContain('Pattern: Crewneck Sweater by Stitch & Scale Demo');
    expect(out).toContain('Gauge: 18sts x 24 rows / 4in');
  });

  it('resolves size placeholders for all sizes when no suffix is given', () => {
    const out = renderDraft('Back width for XS–5XL: {Size.bust}', project, undefined);
    expect(out).toContain('XS: 47 sts');
    expect(out).toContain('5XL: 191 sts');
  });

  it('resolves {Size.<size>.<key>.stitch} and {Size.<size>.<key>.row} for a single size', () => {
    const out1 = renderDraft('XS: {Size.XS.bust.stitch} sts', project, undefined);
    expect(out1).toMatch(/XS: \d+ sts$/);
    const lengthProject = sampleProject({
      sections: [
        {
          id: 's1', name: 'Back', measurements: [
            { id: 'm2', label: 'Back length', measurementType: 'length', gradingKey: 'backLength', baseValue: 26, rowRepeat: 8 },
          ],
        },
      ],
    });
    const out2 = renderDraft('Back length rows: {Size.XS.backLength.row}', lengthProject, undefined);
    expect(out2).toMatch(/Back length rows: \d+$/);
  });

  it('resolves {Yardage} using the yarn estimator', () => {
    const out = renderDraft('Yarn: approx {Yardage} yards.', project, undefined);
    expect(out).toMatch(/Yarn: approx [\d,.]+ yards\./);
  });

  it('renders — for missing stitch gauge values', () => {
    const out = renderDraft('Gauge: {Gauge.stitches}', sampleProject({ gauge: { stitchesPer4In: undefined as any, rowsPer4In: 24, unit: 'in' } }), undefined);
    expect(out).toBe('Gauge: —');
  });


  it('renders empty draft as empty string', () => {
    expect(renderDraft('', project, undefined)).toBe('');
  });
});
