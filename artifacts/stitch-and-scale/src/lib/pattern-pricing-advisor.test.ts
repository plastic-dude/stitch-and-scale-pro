import { describe, it, expect } from 'vitest';
import {
  advisePrice,
  sizeCountForProject,
  ITEM_TYPE_LIST,
  SKILL_LEVEL_LIST,
  type PricingInputs,
} from './pattern-pricing-advisor';
import type { PatternProject } from './grading-engine';

function baseInputs(overrides: Partial<PricingInputs> = {}): PricingInputs {
  return {
    itemType: 'sweater',
    skillLevel: 'intermediate',
    sizeCount: 10,
    techEdited: false,
    testKnitted: false,
    hoursWorked: 20,
    hourlyRate: 25,
    currentPrice: 8,
    marketTarget: 'standard',
    ...overrides,
  };
}

function baseProject(overrides: Partial<PatternProject> = {}): PatternProject {
  return {
    id: 't1',
    name: 'Test',
    author: 'Test',
    baseSize: 'M',
    gauge: { stitchesPer4In: 20, rowsPer4In: 24, unit: 'in' },
    sections: [
      {
        id: 'body',
        name: 'Body',
        measurements: [{ id: 'bust', label: 'Bust', measurementType: 'circumference', gradingKey: 'bust', baseValue: 42 }],
      },
    ],
    createdAt: '2026-08-14T00:00:00Z',
    updatedAt: '2026-08-14T00:00:00Z',
    ...overrides,
  };
}


describe('sizeCountForProject', () => {
  it('returns the full CYC size range for a garment project with body grading keys', () => {
    expect(sizeCountForProject(baseProject())).toBe(9);
  });
  it('returns 3 for accessory-only projects (no bust/waist/hip keys)', () => {
    const p = baseProject({
      sections: [{
        id: 'len',
        name: 'Length',
        measurements: [{ id: 'l', label: 'Length', measurementType: 'length', gradingKey: 'backLength', baseValue: 12 }],
      }],
    });
    expect(sizeCountForProject(p)).toBe(3);
  });
  it('returns 1 for a project with no sections', () => {
    expect(sizeCountForProject(baseProject({ sections: [] }))).toBe(1);
  });
});

describe('advisePrice — standard band', () => {
  it('keeps a beginner hat at the band floor', () => {
    const advice = advisePrice(baseInputs({ itemType: 'hat', skillLevel: 'beginner', sizeCount: 3 }));
    expect(advice.recommendedPrice).toBeLessThanOrEqual(6);
    expect(advice.recommendedPrice).toBeGreaterThanOrEqual(5);
  });

  it('raises an advanced tech-edited, test-knitted sweater toward the top of the band', () => {
    const advice = advisePrice(baseInputs({
      itemType: 'sweater',
      skillLevel: 'advanced',
      sizeCount: 10,
      techEdited: true,
      testKnitted: true,
    }));
    expect(advice.recommendedPrice).toBe(10);
  });

  it('never recommends above the documented standard band', () => {
    for (const itemType of ITEM_TYPE_LIST) {
      const advice = advisePrice(baseInputs({
        itemType,
        skillLevel: 'advanced',
        sizeCount: 10,
        techEdited: true,
        testKnitted: true,
      }));
      expect(advice.recommendedPrice).toBeLessThanOrEqual(10);
    }
  });

  it('handles every skill level across every item type without error', () => {
    for (const itemType of ITEM_TYPE_LIST) {
      for (const skill of SKILL_LEVEL_LIST) {
        expect(() => advisePrice(baseInputs({ itemType, skillLevel: skill }))).not.toThrow();
      }
    }
  });
});

describe('advisePrice — premium band', () => {
  it('places an advanced premium sweater in the $14–18 tier', () => {
    const advice = advisePrice(baseInputs({
      itemType: 'sweater',
      skillLevel: 'advanced',
      sizeCount: 10,
      techEdited: true,
      marketTarget: 'premium',
    }));
    expect(advice.recommendedPrice).toBeGreaterThanOrEqual(12);
    expect(advice.recommendedPrice).toBeLessThanOrEqual(18);
  });

  it('places a premium hat in the accessory premium band', () => {
    const advice = advisePrice(baseInputs({ itemType: 'hat', marketTarget: 'premium' }));
    expect(advice.recommendedPrice).toBeGreaterThanOrEqual(9);
    expect(advice.recommendedPrice).toBeLessThanOrEqual(12);
  });
});

describe('advisePrice — cost-plus underpricing detection', () => {
  it('flags a pattern priced below its time-cost floor', () => {
    const advice = advisePrice(baseInputs({
      hoursWorked: 60,
      hourlyRate: 25,
      currentPrice: 8,
      sizeCount: 2,
    }));
    // 60 × 25 = $1500; floor = 1500/150 = $10 > current $8
    expect(advice.underpriced).toBe(true);
    expect(advice.costPlusFloor).toBe(10);
  });

  it('does not flag when the current price covers the floor', () => {
    const advice = advisePrice(baseInputs({ hoursWorked: 10, hourlyRate: 25, currentPrice: 9 }));
    // 10 × 25 = $250; floor = $1.67 < $9
    expect(advice.underpriced).toBe(false);
    expect(advice.costPlusFloor).toBe(1.67);
  });

  it('does not flag when no hours are logged', () => {
    const advice = advisePrice(baseInputs({ hoursWorked: 0, currentPrice: 8 }));
    expect(advice.underpriced).toBe(false);
    expect(advice.costPlusFloor).toBe(0);
  });
});

describe('advisePrice — justifiers', () => {
  it('includes a size-inclusivity note at wide ranges', () => {
    const advice = advisePrice(baseInputs({ sizeCount: 8 }));
    expect(advice.justifiers.some(j => j.factor.includes('Size range'))).toBe(true);
    expect(advice.justifiers.find(j => j.factor.includes('Size range'))!.effect).toBe('up');
  });

  it('records tech-edit and test-knit justifiers when true', () => {
    const advice = advisePrice(baseInputs({ techEdited: true, testKnitted: true }));
    const factors = advice.justifiers.map(j => j.factor.toLowerCase());
    expect(factors.some(f => f.includes('tech edited'))).toBe(true);
    expect(factors.some(f => f.includes('test knitted'))).toBe(true);
  });
});

describe('advisePrice — volume scenarios', () => {
  it('emits three volume scenarios with all four verified platforms', () => {
    const advice = advisePrice(baseInputs());
    expect(advice.volumeScenarios).toHaveLength(3);
    for (const scenario of advice.volumeScenarios) {
      expect(Object.keys(scenario.platformNets)).toEqual(['ravelry', 'etsy', 'ribblr', 'payhip']);
      for (const net of Object.values(scenario.platformNets)) {
        expect(net).toBeGreaterThan(0);
      }
    }
  });

  it('nets grow with volume and are consistent with the income calculator', () => {
    const advice = advisePrice(baseInputs());
    const nets = advice.volumeScenarios.map(s => s.platformNets.ravelry);
    expect(nets[0]).toBeLessThan(nets[1]);
    expect(nets[1]).toBeLessThan(nets[2]);
  });
});

describe('advisePrice — bands', () => {
  it('emits three ordered bands within documented ranges', () => {
    const advice = advisePrice(baseInputs());
    expect(advice.bands.map(b => b.label)).toEqual(['Conservative', 'Market', 'Premium']);
    for (const band of advice.bands) {
      expect(band.low).toBeLessThanOrEqual(band.high);
      expect(band.high).toBeLessThanOrEqual(10);
    }
  });

  it('uses premium band ceilings for premium targets', () => {
    const advice = advisePrice(baseInputs({ marketTarget: 'premium' }));
    expect(advice.bands[1].high).toBeGreaterThan(10);
  });
});

// CHK-147: QUEUE-012 shared validation layer — quarantine regression tests.
// No calculated recommendation may be derived from invalid input; every
// invalid numeric input must return a quarantined advisory, never a number.
describe('advisePrice — validation quarantine (CHK-147)', () => {
  it('quarantines a negative current price with no recommendation', () => {
    const advice = advisePrice(baseInputs({ currentPrice: -5 }));
    expect(Number.isFinite(advice.recommendedPrice)).toBe(false);
    expect(advice.bands).toEqual([]);
    expect(advice.reasoning[0]).toMatch(/^Validation — /);
  });

  it('quarantines negative hours and a negative hourly rate', () => {
    expect(advisePrice(baseInputs({ hoursWorked: -20 })).recommendedPrice).toBeNaN();
    expect(advisePrice(baseInputs({ hourlyRate: -25 })).recommendedPrice).toBeNaN();
  });

  it('quarantines an implausibly large money value above the 1e9 ceiling', () => {
    const advice = advisePrice(baseInputs({ hourlyRate: 1e12 }));
    expect(advice.reasoning[0]).toContain('Validation —');
  });

  it('quarantines a zero size count', () => {
    const advice = advisePrice(baseInputs({ sizeCount: 0 }));
    expect(advice.reasoning[0]).toMatch(/^Validation — /);
  });

  it('accepts zero cost and zero current price as valid (legit designer states)', () => {
    const advice = advisePrice(baseInputs({ hoursWorked: 0, hourlyRate: 0, currentPrice: 0 }));
    expect(Number.isFinite(advice.recommendedPrice)).toBe(true);
    expect(advice.bands).toHaveLength(3);
  });
});
