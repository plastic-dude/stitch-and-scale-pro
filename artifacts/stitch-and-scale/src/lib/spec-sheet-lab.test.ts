import { describe, expect, it } from 'vitest';
import {
  analyzeSpecSheet,
  DEFAULT_SPEC_SHEET,
  formatUsd,
  SESSION_45_MARKET,
} from './spec-sheet-lab';
import { gradePattern, PatternProject, resolveProjectStandards, SIZE_STANDARDS } from './grading-engine';

const GAUGE = { stitchesPer4In: 16, rowsPer4In: 22, unit: 'in' as const };

function measurement(id: string, gradingKey: string, baseValue: number, measurementType: 'width' | 'circumference' | 'length' | 'direct' = 'circumference') {
  return { id, label: id, measurementType, gradingKey, baseValue };
}

function makeProject(name = 'Sample Cardigan'): PatternProject {
  return {
    id: 'test',
    name,
    author: 'designer',
    baseSize: 'M',
    gauge: GAUGE,
    sections: [
      {
        id: 'body',
        name: 'Body',
        measurements: [
          measurement('chest', 'bust', 40),
          measurement('waist', 'waist', 38),
          measurement('hip', 'hip', 40),
          measurement('length', 'backLength', 24, 'length'),
        ],
      },
      {
        id: 'sleeves',
        name: 'Sleeves',
        measurements: [
          measurement('upperarm', 'upperArm', 15),
          measurement('sleevelen', 'sleeveLength', 18, 'length'),
        ],
      },
    ],
    createdAt: '2026-08-14T00:00:00Z',
    updatedAt: '2026-08-14T00:00:00Z',
    yarnWeight: 'worsted',
  };
}

describe('DEFAULT_SPEC_SHEET', () => {
  it('defaults to the market tolerance band', () => {
    expect(DEFAULT_SPEC_SHEET.toleranceDefault).toBe(SESSION_45_MARKET.toleranceIn);
  });
});

describe('analyzeSpecSheet — POM table from grading data', () => {
  it('derives one POM row per graded project measurement, all sizes present', () => {
    const result = analyzeSpecSheet(makeProject());
    // 4 body + 2 sleeve measurements, each grades all 9 sizes.
    expect(result.pomTable.length).toBe(6);
    const chest = result.pomTable.find(r => r.point.includes('chest'))!;
    expect(Object.keys(chest.values).length).toBe(9);
    expect(chest.toleranceIn).toBe(0.25);
  });

  it('carries per-point tolerance overrides and designer labels', () => {
    const result = analyzeSpecSheet(makeProject(), {
      pomPoints: [{ label: 'Front depth', gradingKey: 'bust', toleranceIn: 0.5 }],
    });
    const chest = result.pomTable.find(r => r.gradingKey === false || r.point.includes('chest'))!;
    expect(chest.toleranceIn).toBe(0.5);
    expect(chest.note).toBe('Front depth');
  });

  it('adds extra points with no graded mapping', () => {
    const result = analyzeSpecSheet(makeProject(), {
      pomPoints: [{ label: 'Collar spread', gradingKey: '', toleranceIn: 0 }],
    });
    expect(result.extraPoints.length).toBe(1);
    expect(result.extraPoints[0].point).toBe('Collar spread');
    expect(result.extraPoints[0].toleranceIn).toBe(0.25);
  });
});

describe('analyzeSpecSheet — S-01 POM coverage', () => {
  it('flags a thin POM sheet (8..11 points) as warning — below the 12–18 norm', () => {
    const project = makeProject();
    project.sections[0].measurements.push(measurement('armhole', 'armholeDepth', 8)); // 7 points
    project.sections[1].measurements.push(measurement('wrist', 'wrist', 6)); // 8 points
    const result = analyzeSpecSheet(project);
    const flag = result.flags.find(f => f.code === 'S-01')!;
    expect(flag.severity).toBe('warning');
    expect(flag.message).toContain('8 POM points');
  });

  it('errors below 8 points (excluding extra points from designer)', () => {
    const project = makeProject();
    project.sections = [project.sections[0]]; // 4 measurements
    const result = analyzeSpecSheet(project);
    const flag = result.flags.find(f => f.code === 'S-01')!;
    expect(flag.severity).toBe('error');
  });

  it('errors with the base fixture below the norm (6 points — under the 8-point minimum)', () => {
    const result = analyzeSpecSheet(makeProject());
    const flag = result.flags.find(f => f.code === 'S-01')!;
    expect(flag.severity).toBe('error');
    expect(flag.message).toContain('6 POM points');
  });

  it('passes info at or above the 12-point norm', () => {
    const project = makeProject();
    project.sections[0].measurements.push(
      measurement('armhole', 'armholeDepth', 8),
      measurement('neck', 'neckCircumference', 16),
      measurement('shoulder', 'shoulder', 16),
      measurement('lowerarm', 'lowerArm', 9),
    );
    project.sections[1].measurements.push(
      measurement('wrist', 'wrist', 6),
      measurement('neck2', 'neckCircumference', 16),
    );
    const result = analyzeSpecSheet(project);
    const flag = result.flags.find(f => f.code === 'S-01')!;
    expect(flag.severity).toBe('info');
    expect(flag.message).toContain('12 POM points');
  });
});

describe('analyzeSpecSheet — S-02 tolerance band', () => {
  it('errors when the tolerance band is unset', () => {
    const result = analyzeSpecSheet(makeProject(), { toleranceDefault: 0 });
    expect(result.flags.find(f => f.code === 'S-02')!.severity).toBe('error');
  });

  it('confirms the industry norm band when set', () => {
    const result = analyzeSpecSheet(makeProject(), { toleranceDefault: 0.25 });
    const flag = result.flags.find(f => f.code === 'S-02')!;
    expect(flag.severity).toBe('info');
    expect(flag.message).toContain('±0.25');
  });
});

describe('analyzeSpecSheet — S-03 colourway depth', () => {
  it('warns with no colourways', () => {
    expect(analyzeSpecSheet(makeProject()).flags.find(f => f.code === 'S-03')!.severity).toBe('warning');
  });

  it('informs with a single colourway', () => {
    const result = analyzeSpecSheet(makeProject(), { colourways: [{ name: 'Oatmeal', yarnSpec: 'merino' }] });
    expect(result.flags.find(f => f.code === 'S-03')!.severity).toBe('info');
  });

  it('counts multiple colourways toward readiness', () => {
    const result = analyzeSpecSheet(makeProject(), {
      colourways: [
        { name: 'Oatmeal', yarnSpec: 'merino' },
        { name: 'Charcoal', yarnSpec: 'merino' },
      ],
    });
    expect(result.flags.find(f => f.code === 'S-03')!.message).toContain('2 colourways');
  });
});

describe('analyzeSpecSheet — S-04 yarn bill', () => {
  it('errors when the fibre composition is missing', () => {
    expect(analyzeSpecSheet(makeProject()).flags.find(f => f.code === 'S-04')!.severity).toBe('error');
  });

  it('completes the yarn bill with composition + derived yardage', () => {
    const result = analyzeSpecSheet(makeProject(), { fibreComposition: '100% superwash merino' });
    const flag = result.flags.find(f => f.code === 'S-04')!;
    expect(flag.severity).toBe('info');
    expect(flag.message).toContain('yd');
    expect(result.yarnBill.some(b => b.value.endsWith('yd'))).toBe(true);
  });

  it('honours the yardage override', () => {
    const result = analyzeSpecSheet(makeProject(), {
      fibreComposition: '100% superwash merino',
      yardageOverride: 1500,
    });
    expect(result.yarnBill.some(b => b.value === '1,500 yd')).toBe(true);
  });

  it('errors when yardage cannot be derived and no override', () => {
    // A project with no measurements at all — nothing to knit, nothing
    // to source yarn for; the sheet's yarn bill is empty and the flag
    // must demand a yardage figure.
    const project = makeProject();
    project.sections = [
      { id: 'deco', name: 'Decorative band', measurements: [] },
    ];
    const result = analyzeSpecSheet(project, { fibreComposition: '100% superwash merino' });
    expect(result.flags.find(f => f.code === 'S-04')!.severity).toBe('error');
  });
});

describe('analyzeSpecSheet — S-05 gauge block', () => {
  it('errors with a missing gauge', () => {
    const project = makeProject();
    project.gauge = { ...GAUGE, stitchesPer4In: 0, rowsPer4In: 0 };
    expect(analyzeSpecSheet(project).flags.find(f => f.code === 'S-05')!.severity).toBe('error');
  });

  it('warns with a valid gauge but unset machine gauge', () => {
    const result = analyzeSpecSheet(makeProject(), { fibreComposition: '100% superwash merino' });
    expect(result.flags.find(f => f.code === 'S-05')!.severity).toBe('warning');
  });

  it('confirms the 7–14 flat-bed band when the machine gauge is set in range', () => {
    const result = analyzeSpecSheet(makeProject(), { fibreComposition: '100% superwash merino', machineGauge: 7 });
    const flag = result.flags.find(f => f.code === 'S-05')!;
    expect(flag.severity).toBe('info');
    expect(flag.message).toContain('inside');
  });

  it('notes gauges outside the band without blocking', () => {
    const result = analyzeSpecSheet(makeProject(), { fibreComposition: '100% superwash merino', machineGauge: 16 });
    const flag = result.flags.find(f => f.code === 'S-05')!;
    expect(flag.severity).toBe('info');
    expect(flag.message).toContain('outside');
  });
});

describe('analyzeSpecSheet — S-06 readiness score and verdict', () => {
  it('scores 1/6 for the empty default (only the default tolerance band is present)', () => {
    expect(analyzeSpecSheet(makeProject()).readinessScore).toBe(1);
  });

  it('scores 6/6 and verdict ready with a fully complete sheet', () => {
    const project = makeProject();
    // Lift POM coverage to the 8-point readiness bar.
    project.sections[0].measurements.push(
      measurement('armhole', 'armholeDepth', 8),
      measurement('wrist', 'wrist', 6),
    );
    const result = analyzeSpecSheet(project, {
      fibreComposition: '100% superwash merino',
      colourways: [
        { name: 'Oatmeal', yarnSpec: 'merino' },
        { name: 'Charcoal', yarnSpec: 'merino' },
      ],
      machineGauge: 7,
      construction: 'flat',
    });
    expect(result.readinessScore).toBe(6);
    expect(result.verdict).toBe('ready');
  });

  it('verdict blocked below 3 points or on hard errors', () => {
    const blocked = analyzeSpecSheet(makeProject(), { toleranceDefault: 0 });
    expect(blocked.verdict).toBe('blocked');
  });

  it('verdict review between 3 and 5', () => {
    const project = makeProject();
    // Lift POM coverage to the 8-point readiness bar.
    project.sections[0].measurements.push(
      measurement('armhole', 'armholeDepth', 8),
      measurement('wrist', 'wrist', 6),
    );
    const result = analyzeSpecSheet(project, {
      fibreComposition: '100% superwash merino',
      colourways: [
        { name: 'Oatmeal', yarnSpec: 'merino' },
        { name: 'Charcoal', yarnSpec: 'merino' },
      ],
    });
    // s1(yes, 8 pts), s2(yes), s3(yes), s4(yes), s5(no), s6(no) → 4
    expect(result.readinessScore).toBe(4);
    expect(result.verdict).toBe('review');
  });

  it('ties construction to the last readiness point', () => {
    const result = analyzeSpecSheet(makeProject(), {
      fibreComposition: '100% superwash merino',
      machineGauge: 7,
      construction: 'fully-fashioned',
    });
    expect(result.readinessScore).toBe(4);
    expect(result.gaugeBlock.some(g => g.includes('fully-fashioned'))).toBe(true);
  });
});

describe('analyzeSpecSheet — grading integration', () => {
  it('POM values match the shared grading engine', () => {
    const project = makeProject();
    const graded = gradePattern(project, resolveProjectStandards(project, SIZE_STANDARDS));
    const bust = graded[0].measurements.find(m => m.gradingKey === 'bust')!
      .gradedValues.find(g => g.size === 'L')!.physicalValue;
    const sheet = analyzeSpecSheet(project);
    const row = sheet.pomTable.find(r => r.point.includes('chest'))!;
    expect(row.values['L']).toBeCloseTo(bust, 4);
  });

  it('handles extra designer points with no grading mapping', () => {
    const result = analyzeSpecSheet(makeProject(), {
      pomPoints: [{ label: 'Back neck width', gradingKey: '', toleranceIn: 0.25 }],
    });
    expect(result.extraPoints.length).toBe(1);
    expect(Object.keys(result.extraPoints[0].values).length).toBe(0);
  });
});

describe('analyzeSpecSheet — market framing', () => {
  it('frames the money against Techpacker, freelance, and AI pricing', () => {
    const result = analyzeSpecSheet(makeProject());
    expect(result.moneyLine).toContain(formatUsd(SESSION_45_MARKET.techpackerMonthly));
    expect(result.moneyLine).toContain(formatUsd(SESSION_45_MARKET.techpackerProMonthly));
    expect(result.moneyLine).toContain(formatUsd(SESSION_45_MARKET.aiPackHigh));
  });

  it('exposes the industry-norm benchmarks', () => {
    const result = analyzeSpecSheet(makeProject());
    expect(result.benchmarks.pomNormMin).toBe(12);
    expect(result.benchmarks.toleranceBand).toBe('±0.25in');
    expect(result.benchmarks.machineGaugeBand).toBe('7–14 gauge');
  });

  it('formatUsd renders whole dollars', () => {
    expect(formatUsd(35)).toBe('$35');
    expect(formatUsd(1140)).toBe('$1,140');
  });
});
