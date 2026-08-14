import { describe, expect, it } from 'vitest';
import {
  ADAPTIVE_MODS,
  DEFAULT_DESIGN_RATE,
  EDITOR_PER_EXTRA_SIZE,
  GRADE_HOUR_PER_SIZE_PER_MEASUREMENT,
  PROFESSIONAL_FLOOR,
  analyzeInclusiveSizing,
  buildInclusivePack,
} from './inclusive-sizing-analyzer';
import { PatternProject, Gauge } from './grading-engine';


const gauge: Gauge = { stitchesPer4In: 18, rowsPer4In: 24, inTheRound: false };

function crewProject(name = 'Test Sweater'): PatternProject {
  return {
    id: 't1',
    name,
    author: 'Tester',
    baseSize: 'M',
    gauge,
    sections: [
      {
        id: 'body',
        name: 'Body',
        measurements: [
          { id: 'm1', label: 'Chest', measurementType: 'circumference', gradingKey: 'bust', baseValue: 38, unit: 'in' },
          { id: 'm2', label: 'Length', measurementType: 'length', gradingKey: 'backLength', baseValue: 25, unit: 'in' },
          { id: 'm3', label: 'Armhole', measurementType: 'length', gradingKey: 'armholeDepth', baseValue: 8.5, unit: 'in' },
          { id: 'm6', label: 'Waist', measurementType: 'circumference', gradingKey: 'waist', baseValue: 32, unit: 'in' },
          { id: 'm7', label: 'Hip', measurementType: 'circumference', gradingKey: 'hip', baseValue: 40, unit: 'in' },
          { id: 'm8', label: 'Shoulder', measurementType: 'width', gradingKey: 'shoulder', baseValue: 15, unit: 'in' },
        ],
      },
      {
        id: 'sleeve',
        name: 'Sleeve',
        measurements: [
          { id: 'm4', label: 'Upper arm', measurementType: 'circumference', gradingKey: 'upperArm', baseValue: 14, unit: 'in' },
          { id: 'm5', label: 'Sleeve length', measurementType: 'length', gradingKey: 'sleeveLength', baseValue: 18, unit: 'in' },
        ],
      },
    ],
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  };
}

const standardRange = [
  { label: 'XS', bust: 31 },
  { label: 'S', bust: 34 },
  { label: 'M', bust: 38 },
  { label: 'L', bust: 42 },
  { label: 'XL', bust: 46 },
];

describe('analyzeInclusiveSizing', () => {
  it('runs against a 5-size standard range without flags', () => {
    const r = analyzeInclusiveSizing({
      project: crewProject(),
      yarnWeight: 'worsted',
      platform: 'ravelry',
      patternPrice: 8,
      monthlySales: 40,
      designRate: 25,
      sizeOptions: standardRange,
      includeCupOptions: false,
      includePetiteTall: false,
      gradeRule: 2,
      mods: [],
    });
    expect(r.effort.sizeCount).toBe(5);
    expect(r.effort.wolcottFlag).toBeNull();
    expect(r.effort.totalEffortHours).toBeGreaterThan(0);
    expect(r.effort.yardageBySize.length).toBe(5);
    expect(r.totalModFee).toBe(0);
  });

  it('flags Wolcott territory past 6 sizes and grows grading hours', () => {
    const extended = [...standardRange, { label: '2XL', bust: 50 }, { label: '3XL', bust: 54 }, { label: '4XL', bust: 58 }];
    const r = analyzeInclusiveSizing({
      project: crewProject(),
      yarnWeight: 'worsted',
      platform: 'ravelry',
      patternPrice: 8,
      monthlySales: 40,
      designRate: 25,
      sizeOptions: extended,
      includeCupOptions: false,
      includePetiteTall: false,
      gradeRule: 2,
      mods: [],
    });
    expect(r.effort.sizeCount).toBe(8);
    expect(r.effort.wolcottFlag).not.toBeNull();
    expect(r.effort.techEditCost).toBe(50 + 3 * EDITOR_PER_EXTRA_SIZE);
    expect(r.effort.wolcottFlag).not.toBeNull();
    expect(r.notes.some(n => n.includes('Wolcott') || n.includes('hard magic') || n.includes('effort steepens'))).toBe(true);
    expect(r.effort.gradingHours).toBeGreaterThan(8 * 1.5); // 8 measurements × (1.5 + 3×0.45)
  });

  it('grows yardage per size band with plus-size warnings', () => {
    const extended = [...standardRange, { label: '2XL', bust: 50 }, { label: '3XL', bust: 54 }];
    const r = analyzeInclusiveSizing({
      project: crewProject(),
      yarnWeight: 'worsted',
      platform: 'ravelry',
      patternPrice: 8,
      monthlySales: 40,
      designRate: 25,
      sizeOptions: extended,
      includeCupOptions: false,
      includePetiteTall: false,
      gradeRule: 2,
      mods: [],
    });
    const xs = r.effort.yardageBySize.find(y => y.label === 'XS')!;
    const xxl = r.effort.yardageBySize.find(y => y.label === '2XL')!;
    expect(xxl.yards).toBeGreaterThan(xs.yards);
    expect(xxl.yarnCostNote).toBeDefined();
    // bust ≥ 44: XL (46), 2XL (50), 3XL (54) → 3 plus sizes
    expect(r.effort.largeSizeCount).toBe(3);
    expect(r.effort.testKnitHours).toBeGreaterThan(7 * 1.5);
    // grading-hours for 7 sizes (2 extra): 8 measurements × (1.5 + 2×0.45)
    expect(r.effort.gradingHours).toBeCloseTo(8 * (1.5 + 2 * 0.45));
  });

  it('scores a genuinely-inclusive range 6/6', () => {
    const full = [
      { label: 'XXS', bust: 28 },
      { label: 'XS', bust: 31 },
      { label: 'S', bust: 34 },
      { label: 'M', bust: 38 },
      { label: 'L', bust: 42 },
      { label: 'XL', bust: 46 },
      { label: '2XL', bust: 50 },
      { label: '3XL', bust: 54 },
      { label: '4XL', bust: 58 },
      { label: '5XL', bust: 62, cup: 'D' as const },
      { label: '6XL', bust: 66, cup: 'DD' as const },
      { label: '7XL', bust: 70, broadShoulders: true },
    ];
    const r = analyzeInclusiveSizing({
      project: crewProject(),
      yarnWeight: 'DK',
      platform: 'etsy',
      patternPrice: 9,
      monthlySales: 30,
      designRate: 25,
      sizeOptions: full,
      includeCupOptions: true,
      includePetiteTall: true,
      gradeRule: 2,
      mods: [],
    });
    expect(r.audit.score).toBe(6);
    expect(r.audit.verdict).toBe('genuinely-inclusive');
    expect(r.pricing.badgeStatement).toContain('cup-shape options');
    expect(r.pricing.badgeStatement).toContain('petite/tall lengths');
  });

  it('marks a chest-and-length-only 3-size drop as naive scaling', () => {
    const r = analyzeInclusiveSizing({
      project: crewProject(),
      yarnWeight: 'worsted',
      platform: 'ravelry',
      patternPrice: 7,
      monthlySales: 50,
      designRate: 25,
      sizeOptions: [{ label: 'S', bust: 34 }, { label: 'M', bust: 38 }, { label: 'L', bust: 42 }],
      includeCupOptions: false,
      includePetiteTall: false,
      gradeRule: 2,
      mods: [],
    });
    expect(r.audit.score).toBeLessThan(6);
    expect(r.notes.some(n => n.includes('litmus-test'))).toBe(true);
  });

  it('flags an inconsistent grade rule (5" jumps)', () => {
    const r = analyzeInclusiveSizing({
      project: crewProject(),
      yarnWeight: 'worsted',
      platform: 'ravelry',
      patternPrice: 8,
      monthlySales: 40,
      designRate: 25,
      sizeOptions: [{ label: 'S', bust: 34 }, { label: 'M', bust: 38 }, { label: 'L', bust: 42 }, { label: 'XL', bust: 46 }, { label: '2XL', bust: 51 }],
      includeCupOptions: false,
      includePetiteTall: false,
      gradeRule: 5,
      mods: [],
    });
    expect(r.audit.items.find(i => i.check.includes('grade rule'))?.pass).toBe(false);
  });

  it('prices adaptive mods at the design rate per hour', () => {
    const r = analyzeInclusiveSizing({
      project: crewProject(),
      yarnWeight: 'worsted',
      platform: 'ravelry',
      patternPrice: 8,
      monthlySales: 40,
      designRate: 30,
      sizeOptions: standardRange,
      includeCupOptions: false,
      includePetiteTall: false,
      gradeRule: 2,
      mods: ['magnetic-closure', 'seated-rise', 'donning-loops'],
    });
    const expected = Math.round((3 + 2.5 + 0.75) * 30);
    expect(r.totalModFee).toBe(expected);
    expect(r.mods.map(m => m.item.id)).toEqual(['magnetic-closure', 'seated-rise', 'donning-loops']);
  });

  it('computes the effort floor and shortfall against launch-week platform net', () => {
    const extended = [...standardRange, { label: '2XL', bust: 50 }, { label: '3XL', bust: 54 }, { label: '4XL', bust: 58 }];
    const r = analyzeInclusiveSizing({
      project: crewProject(),
      yarnWeight: 'worsted',
      platform: 'ravelry',
      patternPrice: 8,
      monthlySales: 40,
      designRate: 25,
      sizeOptions: extended,
      includeCupOptions: false,
      includePetiteTall: false,
      gradeRule: 2,
      mods: [],
    });
    // ravelry is 0% fees → net = 8×40 = 320; 8 sizes at 5 measurements should exceed that.
    // Ravelry still nets a per-sale transaction charge → expect ~$292.8, i.e. net < gross.
    expect(r.pricing.marketPrice).toBeLessThanOrEqual(320);
    expect(r.pricing.marketPrice).toBeGreaterThan(250);
    expect(r.effort.effortCost).toBeGreaterThan(320);
    expect(r.pricing.shortfall).toBe(r.pricing.effortFloor - r.pricing.marketPrice);
  });

  it('never drops below the professional floor rate', () => {
    const r = analyzeInclusiveSizing({
      project: crewProject(),
      yarnWeight: 'worsted',
      platform: 'ravelry',
      patternPrice: 8,
      monthlySales: 40,
      designRate: 5,
      sizeOptions: standardRange,
      includeCupOptions: false,
      includePetiteTall: false,
      gradeRule: 2,
      mods: [],
    });
    expect(r.effort.effortCost).toBeGreaterThanOrEqual(PROFESSIONAL_FLOOR * r.effort.totalEffortHours);
  });

  it('uses the correct grading-hours formula', () => {
    const project8 = crewProject();
    const r = analyzeInclusiveSizing({
      project: project8,
      yarnWeight: 'worsted',
      platform: 'ravelry',
      patternPrice: 8,
      monthlySales: 40,
      designRate: 25,
      sizeOptions: [...standardRange, { label: '2XL', bust: 50 }],
      includeCupOptions: false,
      includePetiteTall: false,
      gradeRule: 2,
      mods: [],
    });
    // 8 measurements × (1.5 + 1 extra × 0.45) = 15.6
    expect(r.effort.gradingHours).toBeCloseTo(8 * (1.5 + GRADE_HOUR_PER_SIZE_PER_MEASUREMENT));
    expect(r.effort.yardageReestimateHours).toBe(0.5);
  });

  it('handles a single-size accessory', () => {
    const hat: PatternProject = {
      id: 'h1',
      name: 'Beanie',
      author: 'Tester',
      baseSize: 'M',
      gauge,
      sections: [
        { id: 'hat', name: 'Hat', measurements: [{ id: 'c1', label: 'Circumference', measurementType: 'circumference', gradingKey: 'bust', baseValue: 20, unit: 'in' }] },
      ],
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    };
    const r = analyzeInclusiveSizing({
      project: hat,
      yarnWeight: 'bulky',
      platform: 'ravelry',
      patternPrice: 5,
      monthlySales: 60,
      designRate: DEFAULT_DESIGN_RATE,
      sizeOptions: [{ label: 'One size', bust: 20 }],
      includeCupOptions: false,
      includePetiteTall: false,
      gradeRule: 2,
      mods: [],
    });
    expect(r.effort.sizeCount).toBe(1);
    expect(r.effort.yardageBySize).toHaveLength(1);
    expect(r.pricing.strategy.length).toBeGreaterThan(0);
  });
});

describe('buildInclusivePack', () => {
  const result = analyzeInclusiveSizing({
    project: crewProject(),
    yarnWeight: 'worsted',
    platform: 'ravelry',
    patternPrice: 8,
    monthlySales: 40,
    designRate: 25,
    sizeOptions: [
      ...standardRange,
      { label: '2XL', bust: 50 },
      { label: '3XL', bust: 54, cup: 'C' as const },
    ],
    includeCupOptions: true,
    includePetiteTall: true,
    gradeRule: 2,
    mods: ['thigh-pockets'],
  });

  it('builds the pack with unflagged effort and mod items', () => {
    const pack = buildInclusivePack(result);
    expect(pack.items.some(i => i.check.includes('Effort priced'))).toBe(true);
    expect(pack.items.some(i => i.check.includes('Adaptive mods'))).toBe(true);
    expect(pack.launchCopy.toLowerCase()).toContain('thigh / knee pockets');
    expect(pack.launchCopy).toContain('Graded across');
  });

  it('lists all 8 catalogued adaptive mods with quoted hours', () => {
    expect(ADAPTIVE_MODS.length).toBe(8);
    const seated = ADAPTIVE_MODS.find(m => m.id === 'seated-rise')!;
    expect(seated.hours).toBeGreaterThan(0);
    expect(seated.description).toContain('seated');
  });
});
