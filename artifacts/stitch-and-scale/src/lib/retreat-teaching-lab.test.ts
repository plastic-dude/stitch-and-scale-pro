import { describe, expect, it } from 'vitest';
import {
  analyzeRetreatTeaching,
  DEFAULT_RETREAT,
  type RetreatInput,
} from './retreat-teaching-lab';

const hostDefaults: RetreatInput = {
  ...DEFAULT_RETREAT,
  role: 'host',
};

describe('analyzeRetreatTeaching — empty and degenerate inputs', () => {
  it('returns skip verdict with empty classes', () => {
    const r = analyzeRetreatTeaching({ ...DEFAULT_RETREAT, classes: [] });
    expect(r.verdict).toBe('Add your classes');
    expect(r.scenarios).toHaveLength(0);
  });

  it('returns skip verdict when class hours are zero', () => {
    const r = analyzeRetreatTeaching({
      ...DEFAULT_RETREAT,
      classes: [{ title: 'x', hours: 0, developmentHours: 0 }],
    });
    expect(r.verdict).toBe('Add your classes');
  });
});

describe('guest mode economics', () => {
  it('guest gross = contact hours × fee + reimbursements', () => {
    const input: RetreatInput = {
      ...DEFAULT_RETREAT,
      classes: [{ title: 'A', hours: 10, developmentHours: 20 }],
      feePerClassHour: 125,
      travelReimbursement: 350,
      lodgingMealComp: 800,
      cruiseDesignUnits: 0,
      cruiseDesignPrice: 9,
    };
    const r = analyzeRetreatTeaching(input);
    const contact = 10;
    const gross = contact * 125 + 350 + 800;
    expect(r.scenarios[1].gross).toBe(gross);
    expect(r.scenarios[1].netCash).toBe(gross);
  });

  it('guest fee at $125/hr still nets modestly after development hours', () => {
    const r = analyzeRetreatTeaching({
      ...DEFAULT_RETREAT,
      classes: [{ title: 'A', hours: 10, developmentHours: 40 }],
      hourlyRate: 60,
    });
    const real = r.scenarios[1];
    // 8 travel + 40 dev + 10 prep + 10 contact + 6 extra = 74 hours
    expect(real.totalHours).toBe(74);
    expect(real.effectiveHourly).toBeLessThan(125);
    expect(real.effectiveHourly).toBeGreaterThan(20);
  });

  it('flags RT-01 when guest fee is below $100/hr', () => {
    const r = analyzeRetreatTeaching({
      ...DEFAULT_RETREAT,
      feePerClassHour: 75,
    });
    expect(r.flags.some(f => f.code === 'RT-01')).toBe(true);
  });

  it('does not flag RT-01 at benchmark fee', () => {
    const r = analyzeRetreatTeaching({ ...DEFAULT_RETREAT, feePerClassHour: 125 });
    expect(r.flags.some(f => f.code === 'RT-01')).toBe(false);
  });

  it('flags RT-02 when travel/lodging comp is far below working hours value', () => {
    const r = analyzeRetreatTeaching({
      ...DEFAULT_RETREAT,
      travelReimbursement: 0,
      lodgingMealComp: 0,
    });
    expect(r.flags.some(f => f.code === 'RT-02')).toBe(true);
  });

  it('flags RT-03 on cruise deals where cash fee < comp value', () => {
    const r = analyzeRetreatTeaching({
      ...DEFAULT_RETREAT,
      role: 'cruise-guest',
      feePerClassHour: 50,
      travelReimbursement: 400,
      lodgingMealComp: 900,
    });
    expect(r.flags.some(f => f.code === 'RT-03')).toBe(true);
  });
});

describe('host mode economics', () => {
  it('host gross includes materials margin and cruise design sales', () => {
    const r = analyzeRetreatTeaching(hostDefaults);
    const students = hostDefaults.studentsReal;
    const expected =
      students *
        (hostDefaults.tuitionPerStudent +
          hostDefaults.materialsFeePerStudent -
          hostDefaults.materialsCostPerStudent) +
      hostDefaults.cruiseDesignUnits * hostDefaults.cruiseDesignPrice;
    expect(r.scenarios[1].gross).toBeCloseTo(expected, 1);
  });

  it('host net subtracts fixed and per-student variable costs', () => {
    const r = analyzeRetreatTeaching(hostDefaults);
    const students = hostDefaults.studentsReal;
    const expected =
      r.scenarios[1].gross -
      hostDefaults.fixedCosts -
      students * hostDefaults.hostVariablePerStudent;
    expect(r.scenarios[1].netCash).toBeCloseTo(expected, 1);
  });

  it('break-even students is finite when per-student net is positive', () => {
    const r = analyzeRetreatTeaching(hostDefaults);
    expect(r.breakEvenStudents).toBeGreaterThan(0);
    expect(r.breakEvenStudents).toBeLessThan(Infinity);
    expect(r.targetStudents).toBeGreaterThan(r.breakEvenStudents);
  });

  it('break-even is Infinity when per-student net is non-positive', () => {
    const r = analyzeRetreatTeaching({
      ...hostDefaults,
      tuitionPerStudent: 100,
      hostVariablePerStudent: 210,
    });
    expect(r.breakEvenStudents).toBe(Infinity);
  });

  it('flags RT-05 when break-even exceeds realistic attendance', () => {
    const r = analyzeRetreatTeaching({
      ...hostDefaults,
      tuitionPerStudent: 300,
      fixedCosts: 6000,
      materialsFeePerStudent: 0,
      materialsCostPerStudent: 0,
    });
    expect(r.flags.some(f => f.code === 'RT-05')).toBe(true);
  });

  it('flags RT-04 when per-day tuition is below market floor', () => {
    const r = analyzeRetreatTeaching({
      ...hostDefaults,
      tuitionPerStudent: 100, // over 3 class days ≈ $33/day
    });
    expect(r.flags.some(f => f.code === 'RT-04')).toBe(true);
  });

  it('flags RT-07 when a host charges no materials fee against material costs', () => {
    const r = analyzeRetreatTeaching({
      ...hostDefaults,
      materialsFeePerStudent: 0,
    });
    expect(r.flags.some(f => f.code === 'RT-07')).toBe(true);
  });

  it('flags RT-09 on host retreats with meaningful fixed costs', () => {
    const r = analyzeRetreatTeaching({ ...hostDefaults, fixedCosts: 1400, days: 4 });
    expect(r.flags.some(f => f.code === 'RT-09')).toBe(true);
  });

  it('does not flag RT-09 on small fixed-cost events', () => {
    const r = analyzeRetreatTeaching({ ...hostDefaults, fixedCosts: 200 });
    expect(r.flags.some(f => f.code === 'RT-09')).toBe(false);
  });
});

describe('hours model', () => {
  it('total hours include travel, development, prep, contact and extra', () => {
    const input: RetreatInput = {
      ...DEFAULT_RETREAT,
      classes: [{ title: 'A', hours: 6, developmentHours: 12 }],
      prepRatio: 1,
      travelHours: 8,
      extraWorkingHours: 4,
    };
    const r = analyzeRetreatTeaching(input);
    // 8 + 12 dev + 6 prep + 6 contact + 4 extra = 36
    expect(r.scenarios[1].totalHours).toBe(36);
  });

  it('flags RT-06 when prep is undercounted relative to contact hours', () => {
    const r = analyzeRetreatTeaching({
      ...DEFAULT_RETREAT,
      classes: [{ title: 'A', hours: 10, developmentHours: 2 }],
      prepRatio: 0,
    });
    expect(r.flags.some(f => f.code === 'RT-06')).toBe(true);
  });

  it('does not flag RT-06 with normal prep ratio and development', () => {
    const r = analyzeRetreatTeaching({
      ...DEFAULT_RETREAT,
      classes: [
        { title: 'A', hours: 6, developmentHours: 12 },
        { title: 'B', hours: 4, developmentHours: 8 },
      ],
      prepRatio: 1,
    });
    expect(r.flags.some(f => f.code === 'RT-06')).toBe(false);
  });
});

describe('conversion value', () => {
  it('conversion value scales with students × leads × lead value', () => {
    const r = analyzeRetreatTeaching(DEFAULT_RETREAT);
    const expected = DEFAULT_RETREAT.studentsReal * DEFAULT_RETREAT.leadsPerStudent * DEFAULT_RETREAT.leadValue;
    expect(r.scenarios[1].conversionValue).toBeCloseTo(expected, 1);
  });

  it('flags RT-08 when leads per student is zero', () => {
    const r = analyzeRetreatTeaching({ ...DEFAULT_RETREAT, leadsPerStudent: 0 });
    expect(r.flags.some(f => f.code === 'RT-08')).toBe(true);
  });
});

describe('verdict ladder', () => {
  it('walk-away verdict when effective hourly is negative', () => {
    const r = analyzeRetreatTeaching({
      ...hostDefaults,
      tuitionPerStudent: 100,
      fixedCosts: 10000,
      hostVariablePerStudent: 210,
    });
    expect(r.scenarios[1].effectiveHourly).toBeLessThan(0);
    expect(r.verdict).toContain('loses money');
  });

  it('not-worth verdict when effective hourly is between 0 and 35', () => {
    const r = analyzeRetreatTeaching({
      ...DEFAULT_RETREAT,
      feePerClassHour: 30,
      travelReimbursement: 0,
      lodgingMealComp: 0,
      classes: [{ title: 'A', hours: 10, developmentHours: 40 }],
    });
    expect(r.verdict).toBe('Not worth your week');
  });

  it('premium tier verdict when effective hourly beats opportunity rate', () => {
    const r = analyzeRetreatTeaching({
      ...hostDefaults,
      tuitionPerStudent: 1200,
      studentsMin: 16,
      studentsReal: 22,
      studentsBest: 26,
    });
    expect(r.verdict).toContain('Premium tier');
    expect(r.scenarios[1].effectiveHourly).toBeGreaterThan(hostDefaults.hourlyRate);
  });

  it('scenarios are ordered minimum / realistic / best with rising net', () => {
    const r = analyzeRetreatTeaching(hostDefaults);
    expect(r.scenarios[0].label).toBe('minimum');
    expect(r.scenarios[1].label).toBe('realistic');
    expect(r.scenarios[2].label).toBe('best');
    expect(r.scenarios[2].netCash).toBeGreaterThan(r.scenarios[0].netCash);
  });
});
