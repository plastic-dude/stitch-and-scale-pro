import { describe, expect, it } from 'vitest';
import {
  buildRoster,
  checkPoolHealth,
  generateTesterCall,
  gradedSizes,
  summarizeRoster,
  validateTesterYardage,
  TesterSlot,
} from './test-knit-programme';
import { PatternProject } from './grading-engine';
import { SAMPLE_CREW_NECK_SWEATER } from './sample-projects';

function makeSlots(count: number): TesterSlot[] {
  return buildRoster(SAMPLE_CREW_NECK_SWEATER, { slotsPerSize: 1, offeredSizes: ['S', 'M', 'L'] });
}

describe('gradedSizes', () => {
  it('returns only sizes that actually appear in graded data', () => {
    const sizes = gradedSizes(SAMPLE_CREW_NECK_SWEATER);
    for (const size of sizes) {
      expect(['XS','S','M','L','XL','2XL','3XL','4XL','5XL']).toContain(size);
    }
    expect(sizes.length).toBeGreaterThan(0);
    expect(sizes.length).toBeLessThanOrEqual(9);
    // CYC order preserved.
    for (let i = 1; i < sizes.length; i++) {
      expect(['XS','S','M','L','XL','2XL','3XL','4XL','5XL'].indexOf(sizes[i]))
        .toBeGreaterThan(['XS','S','M','L','XL','2XL','3XL','4XL','5XL'].indexOf(sizes[i - 1]));
    }
  });

  it('returns nothing for an empty project', () => {
    const empty: PatternProject = {
      id: 'empty', name: 'e', author: 'a', baseSize: 'M',
      gauge: { stitchesPer4In: 20, rowsPer4In: 26, unit: 'in' },
      sections: [], createdAt: '', updatedAt: '',
    };
    expect(gradedSizes(empty)).toEqual([]);
  });
});

describe('buildRoster', () => {
  it('creates slotsPerSize slots for each graded size', () => {
    const slots = buildRoster(SAMPLE_CREW_NECK_SWEATER, { slotsPerSize: 2 });
    const sizes = gradedSizes(SAMPLE_CREW_NECK_SWEATER);
    expect(slots.length).toBe(sizes.length * 2);
    expect(slots[0].id).toBe(`${sizes[0]}-0`);
    expect(slots[0].status).toBe('invited');
  });

  it('respects offeredSizes overrides', () => {
    const slots = buildRoster(SAMPLE_CREW_NECK_SWEATER, { slotsPerSize: 1, offeredSizes: ['M', 'L'] });
    expect(slots.length).toBe(2);
    expect(slots.map(s => s.size)).toEqual(['M', 'L']);
  });

  it('never produces slots for sizes missing from the graded data', () => {
    // A designer can also simply restrict the test to sizes they offer.
    const slots = buildRoster(SAMPLE_CREW_NECK_SWEATER, {
      slotsPerSize: 2,
      offeredSizes: ['XS', 'S', 'M', 'L', 'XL', '2XL'],
    });
    expect(slots.every(s => !['3XL', '4XL', '5XL'].includes(s.size))).toBe(true);
    expect(slots.every(s => ['XS', 'S', 'M', 'L', 'XL', '2XL'].includes(s.size))).toBe(true);
  });

  it('clamps slotsPerSize to at least 1', () => {
    const slots = buildRoster(SAMPLE_CREW_NECK_SWEATER, { slotsPerSize: 0 });
    const sizes = gradedSizes(SAMPLE_CREW_NECK_SWEATER);
    expect(slots.length).toBe(sizes.length);
  });
});

describe('summarizeRoster', () => {
  it('counts filled/finished/dropped correctly', () => {
    // S, M, L — one slot each.
    const slots = buildRoster(SAMPLE_CREW_NECK_SWEATER, { slotsPerSize: 1, offeredSizes: ['S', 'M', 'L'] });
    slots[0].status = 'confirmed';
    slots[1].status = 'finished';
    slots[2].status = 'dropped';
    const s = summarizeRoster(slots);
    // 'filled' counts every slot that has left 'invited' — including dropped
    // slots, since a dropped tester still consumed a slot in the pool.
    expect(s.filled).toBe(3);
    expect(s.finished).toBe(1);
    expect(s.dropped).toBe(1);
    // dropoutRate divides drops by slots that ever confirmed (2), not all filled.
    expect(s.dropoutRate).toBeCloseTo(1 / 2);
  });

  it('dropoutRate is 0 with no confirmed slots (no division by zero)', () => {
    const s = summarizeRoster(buildRoster(SAMPLE_CREW_NECK_SWEATER, { slotsPerSize: 1, offeredSizes: ['M'] }));
    expect(s.dropoutRate).toBe(0);
  });
});

describe('validateTesterYardage', () => {
  it('flags usage within ±15% as within tolerance', () => {
    const result = validateTesterYardage(SAMPLE_CREW_NECK_SWEATER, 'worsted', 1000, 'M');
    // An exact-ish report against the estimated baseline should pass.
    if (result.variancePercent >= -15 && result.variancePercent <= 15) {
      expect(result.withinTolerance).toBe(true);
    }
  });

  it('flags heavy overuse as out of tolerance', () => {
    const result = validateTesterYardage(SAMPLE_CREW_NECK_SWEATER, 'worsted', 4000, 'M');
    expect(result.withinTolerance).toBe(false);
    expect(result.varianceYards).toBeGreaterThan(0);
  });

  it('variancePercent scales with the size vs the base size', () => {
    const m = validateTesterYardage(SAMPLE_CREW_NECK_SWEATER, 'worsted', 1000, 'M');
    const xl = validateTesterYardage(SAMPLE_CREW_NECK_SWEATER, 'worsted', 1000, 'XL');
    // XL body is bigger than M body, so the same 1000 yd report is a larger
    // underestimate for XL than for M.
    expect(m.variancePercent).toBeGreaterThan(xl.variancePercent);
  });
});

describe('generateTesterCall', () => {
  it('emits the pattern name, sizes, and incentive', () => {
    const text = generateTesterCall(SAMPLE_CREW_NECK_SWEATER, { slotsPerSize: 2 }, 'worsted');
    expect(text).toContain(SAMPLE_CREW_NECK_SWEATER.name);
    expect(text).toContain('Sizes needed');
    expect(text).toContain('credit');
  });

  it('includes yardage estimate when a weight is given', () => {
    const text = generateTesterCall(SAMPLE_CREW_NECK_SWEATER, { slotsPerSize: 1 }, 'worsted');
    expect(text).toContain('yards');
  });

  it('uses the ravelry line when requested', () => {
    const text = generateTesterCall(SAMPLE_CREW_NECK_SWEATER, { slotsPerSize: 1 }, undefined, { where: 'ravelry' });
    expect(text).toContain('Ravelry');
  });

  it('respects leadWeeks in the timeline line', () => {
    const text = generateTesterCall(SAMPLE_CREW_NECK_SWEATER, { slotsPerSize: 1, leadWeeks: 8 }, undefined);
    expect(text).toContain('8 weeks');
  });
});

describe('checkPoolHealth', () => {
  it('flags sizes with no confirmed tester', () => {
    const slots = buildRoster(SAMPLE_CREW_NECK_SWEATER, { slotsPerSize: 1, offeredSizes: ['S', 'M'] });
    slots[0].status = 'confirmed';
    const issues = checkPoolHealth(slots);
    expect(issues.some(i => i.size === 'M' && i.severity === 'risk')).toBe(true);
  });

  it('is clean when every size has a confirmed tester and no dropouts', () => {
    const slots = buildRoster(SAMPLE_CREW_NECK_SWEATER, { slotsPerSize: 1, offeredSizes: ['S', 'M'] });
    slots.forEach(s => { s.status = 'confirmed'; });
    expect(checkPoolHealth(slots)).toEqual([]);
  });

  it('raises risk at ≥50% dropout', () => {
    const slots = buildRoster(SAMPLE_CREW_NECK_SWEATER, { slotsPerSize: 1, offeredSizes: ['S'] });
    slots[0].status = 'confirmed';
    // Add three more confirmed slots that all drop.
    for (let i = 0; i < 3; i++) {
      slots.push({ id: `S-${i + 1}`, size: 'S', index: i + 1, name: `t${i}`, contactRef: '', status: 'dropped', feedback: '' });
    }
    const issues = checkPoolHealth(slots);
    expect(issues.some(i => i.severity === 'risk' && /Dropout rate/.test(i.message))).toBe(true);
  });
});
