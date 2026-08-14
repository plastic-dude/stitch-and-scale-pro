import { describe, expect, it } from 'vitest';
import { analyzeWorkshopTeaching, DEFAULT_WORKSHOP, type WorkshopTeachingInput } from './workshop-teaching-lab';

function base(overrides: Partial<WorkshopTeachingInput> = {}): WorkshopTeachingInput {
  return { ...structuredClone(DEFAULT_WORKSHOP), ...overrides };
}

describe('snapshot math', () => {
  it('computes per-student net after venue cut and materials', () => {
    const r = analyzeWorkshopTeaching(base());
    // fee 60, cut 25%, materials 0 -> net 45/student; 8 students -> 360 - 400 travel = -40 deal net.
    expect(r.snapshots[1].netDeal).toBeCloseTo(-40, 1);
  });

  it('applies the guarantee floor', () => {
    const r = analyzeWorkshopTeaching(base({ deal: { feePerStudent: 60, venueCut: 0.25, guarantee: 300, travelCost: 400, materialsPerStudent: 0 } }));
    // 8 students deal net = 360 - 400 = -40; floor gives max(-40, 300-400=-100) -> -40.
    expect(r.snapshots[1].netDeal).toBeCloseTo(-40, 1);
    // At min students (4): 180 - 400 = -220 vs floor -100 -> -100.
    expect(r.snapshots[0].netDeal).toBeCloseTo(-100, 1);
  });

  it('adds follow-up pattern attach to total value', () => {
    const r = analyzeWorkshopTeaching(base({ followUpAttach: 0.2, followUpPrice: 8 }));
    // 8 students * 0.2 * $8 = $12.8 attach.
    expect(r.snapshots[1].followUpValue).toBeCloseTo(12.8, 1);
    expect(r.snapshots[1].totalValue).toBeCloseTo(r.snapshots[1].netDeal + 12.8, 4);
  });

  it('effective hourly uses prep + class hours', () => {
    const r = analyzeWorkshopTeaching(base({ prepHours: 6, classHours: 3 }));
    expect(r.snapshots[1].totalHours).toBe(9);
  });

  it('worst snapshot uses min students, best uses max', () => {
    const r = analyzeWorkshopTeaching(base());
    expect(r.snapshots[0].students).toBe(4);
    expect(r.snapshots[2].students).toBe(14);
    expect(r.snapshots[1].students).toBe(8);
  });
});

describe('break-even and profitable thresholds', () => {
  it('break-even students covers travel only', () => {
    const r = analyzeWorkshopTeaching(base());
    // travel 400 / net 45 per student -> 9.
    expect(r.breakEvenStudents).toBe(9);
  });

  it('profitable students also covers opportunity cost', () => {
    const r = analyzeWorkshopTeaching(base({ prepHours: 6, classHours: 3, hourlyRate: 25 }));
    // (400 + 9*25) / 45 = 14.
    expect(r.profitableStudents).toBe(14);
  });

  it('returns Infinity when per-student net is zero or negative', () => {
    // Materials fee of $15 fully offsets the $15 net after a 62.5% venue cut -> net 0 per student.
    const r = analyzeWorkshopTeaching(base({ deal: { feePerStudent: 40, venueCut: 0.625, guarantee: 0, travelCost: 100, materialsPerStudent: 15 } }));
    expect(r.breakEvenStudents).toBe(Infinity);
    expect(r.profitableStudents).toBe(Infinity);
  });
});

describe('watch-out flags', () => {
  it('WT-01 fires when realistic is below confirmed minimum', () => {
    const r = analyzeWorkshopTeaching(base({ studentsMin: 10, studentsRealistic: 6 }));
    expect(r.flags.map(f => f.code)).toContain('WT-01');
  });

  it('WT-02 fires when realistic hourly is below the opportunity rate', () => {
    const r = analyzeWorkshopTeaching(base());
    // realistic total -27.2 over 9 hours -> below $25/hr.
    expect(r.flags.map(f => f.code)).toContain('WT-02');
    expect(r.flags.find(f => f.code === 'WT-02')?.detail).toContain('below your $25/hr rate');
  });

  it('WT-03 fires when travel exceeds 40% of take-home on non-local deals', () => {
    const r = analyzeWorkshopTeaching(base({ deal: { feePerStudent: 60, venueCut: 0.25, guarantee: 0, travelCost: 300, materialsPerStudent: 0 } }));
    expect(r.flags.map(f => f.code)).toContain('WT-03');
  });

  it('WT-03 stays silent for local LYS classes even with modest numbers', () => {
    const r = analyzeWorkshopTeaching(base({ isLocalLys: true, deal: { feePerStudent: 35, venueCut: 0.4, guarantee: 0, travelCost: 10, materialsPerStudent: 0 } }));
    const codes = r.flags.map(f => f.code);
    expect(codes).not.toContain('WT-03');
  });

  it('WT-04 fires when follow-up attach is not modeled', () => {
    const r = analyzeWorkshopTeaching(base({ followUpAttach: 0, followUpPrice: 8 }));
    expect(r.flags.map(f => f.code)).toContain('WT-04');
  });

  it('WT-05 fires above a 20-student max', () => {
    const r = analyzeWorkshopTeaching(base({ studentsMax: 24 }));
    expect(r.flags.map(f => f.code)).toContain('WT-05');
  });

  it('WT-06 fires when the venue cut exceeds 50%', () => {
    const r = analyzeWorkshopTeaching(base({ deal: { feePerStudent: 60, venueCut: 0.55, guarantee: 0, travelCost: 400, materialsPerStudent: 0 } }));
    expect(r.flags.map(f => f.code)).toContain('WT-06');
    expect(r.flags.find(f => f.code === 'WT-06')?.detail).toContain('55%');
  });

  it('WT-07 fires on pure per-student deals without a floor', () => {
    const r = analyzeWorkshopTeaching(base());
    expect(r.flags.map(f => f.code)).toContain('WT-07');
    // A guaranteed floor silences it.
    const r2 = analyzeWorkshopTeaching(base({ deal: { feePerStudent: 60, venueCut: 0.25, guarantee: 150, travelCost: 400, materialsPerStudent: 0 } }));
    expect(r2.flags.map(f => f.code)).not.toContain('WT-07');
  });

  it('WT-08 fires when the worst case loses money', () => {
    const r = analyzeWorkshopTeaching(base());
    expect(r.flags.map(f => f.code)).toContain('WT-08');
    // A floor that keeps the minimum positive silences it.
    const r2 = analyzeWorkshopTeaching(base({ deal: { feePerStudent: 60, venueCut: 0.25, guarantee: 600, travelCost: 400, materialsPerStudent: 0 } }));
    expect(r2.flags.map(f => f.code)).not.toContain('WT-08');
  });
});

describe('verdict ladder', () => {
  it('declines a no-floor deal that loses money at minimum', () => {
    const r = analyzeWorkshopTeaching(base());
    expect(r.verdict).toContain('Decline as written');
  });

  it('holds travel money when realistic is below confirmed minimum', () => {
    const r = analyzeWorkshopTeaching(base({ studentsMin: 10, studentsRealistic: 6, deal: { feePerStudent: 60, venueCut: 0.25, guarantee: 200, travelCost: 400, materialsPerStudent: 0 } }));
    expect(r.verdict).toContain('hold travel money');
  });

  it('flags audience-only teaching when hourly is far below the rate', () => {
    const r = analyzeWorkshopTeaching(base({ deal: { feePerStudent: 60, venueCut: 0.25, guarantee: 400, travelCost: 400, materialsPerStudent: 0 } }));
    expect(r.verdict).toContain('audience');
  });

  it('returns borderline when realistic total falls just short of the opportunity cost', () => {
    // net 45/student, 5 students -> 225 - 50 = 175 deal net + 8 attach = 183; hours 9 -> 20.3/hr, gap -42 (below the $25/hr bar, above audience-only 60% bar? -> borderline branch).
    const r = analyzeWorkshopTeaching(base({ deal: { feePerStudent: 60, venueCut: 0.25, guarantee: 0, travelCost: 50, materialsPerStudent: 0 }, studentsRealistic: 5 }));
    expect(r.verdict).toContain('Borderline');
  });

  it('returns a great deal at festival benchmark rates', () => {
    // $90/student full-day net after modest cut, low travel.
    const r = analyzeWorkshopTeaching(base({
      deal: { feePerStudent: 120, venueCut: 0.25, guarantee: 0, travelCost: 150, materialsPerStudent: 0 },
      studentsRealistic: 10,
      prepHours: 4,
      classHours: 6,
    }));
    expect(r.verdict).toContain('Great deal');
  });

  it('returns worth teaching when realistic clears the hourly bar but is below the 1.5x great-deal bar', () => {
    // net 56.25/student, 6 students -> 337.5 - 100 = 237.5 + 9.6 attach = 247.1; 7 hours -> 35.3/hr (between the 25 rate and the 37.5 great-deal bar).
    const r = analyzeWorkshopTeaching(base({
      deal: { feePerStudent: 75, venueCut: 0.25, guarantee: 0, travelCost: 100, materialsPerStudent: 0 },
      studentsRealistic: 6,
      prepHours: 4,
      classHours: 3,
    }));
    expect(r.verdict).toContain('Worth teaching');
  });

  it('flags carry zero outside the ladder and notes are non-empty', () => {
    const r = analyzeWorkshopTeaching(base());
    expect(r.verdictNote.length).toBeGreaterThan(40);
    expect(r.flags.every((f, i, arr) => arr.findIndex(x => x.code === f.code) === i)).toBe(true);
  });
});

describe('default input produces a complete result', () => {
  it('has all three snapshots and realisticHourly/worstHourly', () => {
    const r = analyzeWorkshopTeaching(DEFAULT_WORKSHOP);
    expect(r.snapshots).toHaveLength(3);
    expect(typeof r.realisticHourly).toBe('number');
    expect(typeof r.worstHourly).toBe('number');
    expect(r.travelBurden).toBeGreaterThan(0);
    expect(r.opportunityGap).toBeLessThan(0);
  });
});
