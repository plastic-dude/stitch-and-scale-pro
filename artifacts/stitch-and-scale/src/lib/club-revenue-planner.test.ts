import { describe, expect, it } from 'vitest';
import {
  modelClub,
  defaultClubInput,
  auditPremiumTier,
  generateFoundingOfferEmail,
  CHURN_MO_GOOD,
  CHURN_MO_TYPICAL,
  PLATFORM_NET_PCT,
} from './club-revenue-planner';

function makeInput(patch: Partial<ReturnType<typeof defaultClubInput>>) {
  return { ...defaultClubInput(), ...patch };
}

describe('modelClub', () => {
  it('computes month-1 net revenue net of fees with premium on top', () => {
    const i = makeInput({
      monthlyMembers: 40,
      annualMembers: 20,
      monthlyPrice: 7,
      annualPrice: 77,
      premiumMembers: 5,
      premiumPrice: 5,
    });
    const r = modelClub(i);
    // month-1 sim applies 7% churn to the starting base then adds 6 signups
    // (80% monthly, 20% annual, +1 premium): members = (40+20+5)*0.93 + 6 + 1 = 71.65
    // gross = 44.8*7 + (19.6)*(77/12) + 5.6*5 = 313.6 + 125.77 + 28 = 467.37 → 425.21 after fees (rounded snapshot)
    expect(r.monthlyRecurring).toBeCloseTo(425.21, 0);
    // annual works out to a monthly equivalent
    expect(r.annualizedRevenue).toBeCloseTo(77 / 12);
  });

  it('flags 7% monthly churn as TYPICAL', () => {
    const r = modelClub(makeInput({ monthlyChurnPct: 7 }));
    expect(r.churnVerdict).toBe('typical');
    expect(r.churnBenchmark.label).toBe('TYPICAL');
    expect(r.churnBenchmark.monthlyChurnPct).toBe(CHURN_MO_TYPICAL);
  });

  it('flags sub-4.5% churn as HEALTHY', () => {
    const r = modelClub(makeInput({ monthlyChurnPct: 3 }));
    expect(r.churnVerdict).toBe('healthy');
    expect(r.churnBenchmark.monthlyChurnPct).toBe(CHURN_MO_GOOD);
  });

  it('flags >7% churn as BLEEDING', () => {
    const r = modelClub(makeInput({ monthlyChurnPct: 10 }));
    expect(r.churnVerdict).toBe('bleeding');
    expect(r.churnBenchmark.label).toBe('BLEEDING');
    expect(r.retentionNotes[0]).toContain('retention calendar below before adding marketing');
  });

  it('runs the 12-month simulation with churn and signups', () => {
    const r = modelClub(makeInput({ newMembersPerMonth: 6, monthlyChurnPct: 7 }));
    expect(r.months).toHaveLength(12);
    // month 12 members should reflect churn attrition plus a year of signups
    const m12 = r.months[11];
    expect(m12.monthlyMembers).toBeGreaterThan(0);
    // churned members each month
    expect(m12.monthlyMembers).toBeLessThan(40 + 6 * 12 * 0.8);
  });

  it('sims cost structure: $155 pattern cost + $67 overhead + $50 marketing + premium hours at the $12 bar', () => {
    const r = modelClub(makeInput());
    const month1 = r.months[0];
    // costs = 155+67+50+6*12 = 344; net after costs = 425.21 - 344 = 81.21
    expect(month1.netAfterCosts).toBeCloseTo(month1.netRevenue - 344, 1);
    expect(month1.netAfterCosts).toBeCloseTo(81.21, 0);
  });

  it('computes breakeven members from costs and net per member', () => {
    const r = modelClub(makeInput());
    // costs = 155+67+50+72 = 344; net per member = 7*0.95 = 6.65 → 52
    expect(r.breakevenMembers).toBe(52);
  });

  it('computes hours and effective hourly against the $12 floor', () => {
    const r = modelClub(makeInput({ hoursPerPattern: 12, adminHoursPerMonth: 10, premiumHoursPerMonth: 6 }));
    expect(r.totalHoursPerMonth).toBe(28);
    // effective hourly counts labour back: (81.21 + 336) / 28 = 14.9
    expect(r.effectiveHourly).toBeCloseTo(14.9, 1);
    expect(r.effectiveHourly).toBeGreaterThan(12);
  });

  it('loses the hourly bar when hours are heavy', () => {
    const r = modelClub(makeInput({ hoursPerPattern: 24, adminHoursPerMonth: 15, premiumHoursPerMonth: 10 }));
    // hours 49; costs = 155+67+50+10*12 = 392; nac = 425.21-392 = 33.21 → (33.21+588)/49 = 12.68... still clears
    // with admin 15: costs = 155+67+50+120 = 392; heavy enough at premium 10h? nac = 33.21 → 12.68 > 12
    // bump pattern hours to 30 to push below the bar: costs = 155+67+50+120 = 392 (admin 15 included in costs via adminHours? no—adminHours not costed in sim, only priced in hourly)
    // labour = (30+15+10)*12 = 660; nac = 425.21-392 = 33.21 → (33.21+660)/55 = 12.6
    // Instead charge a realistic sample-knit cost: add 4 sample-knit hours at $9 to adminHoursPerMonth=24 → hours 64, labour 768
    const r2 = modelClub(makeInput({ hoursPerPattern: 30, adminHoursPerMonth: 24, premiumHoursPerMonth: 10, directCostPerPattern: 200 }));
    // costs = 200+67+50+120 = 437; nac = 425.21-437 = -11.79; hours 64; effective = (-11.79+768)/64 = 11.81
    expect(r2.effectiveHourly).toBeCloseTo(11.81, 1);
    expect(r2.effectiveHourly).toBeLessThan(12);
  });

  it('computes LTV as avg net per member × churn-based lifespan minus marketing allocation', () => {
    const r = modelClub(makeInput());
    // avgNetPerMember = 425.21/65 = 6.54; lifespan = 1/0.07 = 14.29 → 93.47 - 50/6 = 85.14
    expect(r.avgNetPerMember).toBeCloseTo(6.54, 1);
    expect(r.ltv).toBeCloseTo(85.14, 0);
  });

  it('reports marketing payback in months when spend exists', () => {
    const r = modelClub(makeInput({ marketingSpendPerMonth: 50, newMembersPerMonth: 6 }));
    expect(r.marketingPaybackMonths).toBeGreaterThan(0);
  });

  it('gives annual members a monthly-equivalent revenue figure', () => {
    const r = modelClub(makeInput());
    expect(r.annualizedRevenue).toBeCloseTo(77 / 12);
    // the annual discount at $7*12 vs $77 is 8.3% — designers copying the $77/$7 ratio should know
    // the real ~35%-discount band takes $7/mo → ~$60/yr; at $77 the discount is only 8%
    const discount = 1 - 77 / (7 * 12);
    expect(discount).toBeCloseTo(0.083, 3);
  });
});

describe('auditPremiumTier', () => {
  it('scores the delivered perks and lists missing ones with their notes', () => {
    const result = auditPremiumTier({
      prioritySupport: true,
      tutorialLibrary: false,
      privateCommunity: false,
      guestSpeakers: false,
      firstAccess: false,
      discounts: false,
    });
    expect(result.score).toBe(1);
    expect(result.gaps).toHaveLength(5);
    // priority support is delivered (the perk members cite most) — so gaps start
    // with the library, whose note carries the evergreen/support-load insight
    expect(result.gaps[0].note).toContain('Evergreen');
    expect(result.gaps.every((g) => !g.delivered)).toBe(true);
  });

  it('awards points for every delivered perk', () => {
    const full = auditPremiumTier({
      prioritySupport: true,
      tutorialLibrary: true,
      privateCommunity: true,
      guestSpeakers: true,
      firstAccess: true,
      discounts: true,
    });
    expect(full.score).toBe(6);
    expect(full.gaps).toHaveLength(0);
  });
});

describe('modelClub premium verdict', () => {
  it('skips premium when there are no premium members', () => {
    const r = modelClub(makeInput({ premiumMembers: 0, premiumPrice: 0 }));
    expect(r.premiumVerdict).toBe('skip');
  });

  it('calls an under-perked tier "add-more"', () => {
    const r = modelClub(
      makeInput({
        premiumMembers: 5,
        premiumPrice: 5,
        premiumHoursPerMonth: 6,
        premiumDelivered: {
          prioritySupport: false,
          tutorialLibrary: false,
          privateCommunity: false,
          guestSpeakers: false,
          firstAccess: true,
          discounts: false,
        },
      })
    );
    expect(r.premiumVerdict).toBe('add-more');
  });

  it('notes when premium hours beat self-publishing', () => {
    const r = modelClub(makeInput());
    // 6 premium hours at $5/member × 5 members = $23.75 net vs 6h × $9 pattern = $51.30
    expect(r.premiumNotes[0]).toContain('self-publishing');
  });
});

describe('modelClub policy notes', () => {
  it('explains the 10-day notice standard', () => {
    const r = modelClub(makeInput({ monthlyNoticeDays: 10 }));
    expect(r.policyNotes.some((n) => n.includes('10-day cancellation notice is standard'))).toBe(true);
  });

  it('flags no-refund chargeback risk', () => {
    const r = modelClub(makeInput({ annualRefunds: false }));
    expect(r.policyNotes.some((n) => n.includes('chargeback'))).toBe(true);
  });

  it('praises the lifetime-access retention lever', () => {
    const r = modelClub(makeInput({ lifetimeAccess: true }));
    expect(r.policyNotes.some((n) => n.includes('strongest retention lever'))).toBe(true);
  });

  it('warns that price locks anchor future pricing', () => {
    const r = modelClub(makeInput({ founderPriceLock: true }));
    expect(r.policyNotes.some((n) => n.includes('anchor every price'))).toBe(true);
  });
});

describe('generateFoundingOfferEmail', () => {
  it('includes the discount percentage and every listed perk', () => {
    const email = generateFoundingOfferEmail({
      clubName: 'The Wren Club',
      designerName: 'Sam',
      monthlyPrice: 7,
      annualPrice: 77,
      founderLockUntil: 'forever',
      perks: ['1 pattern per month', 'priority support', 'pattern library'],
    });
    // $77 vs $84 → 8%
    expect(email).toContain('8%');
    expect(email).toContain('The Wren Club');
    expect(email).toContain('Sam');
    expect(email).toContain('- 1 pattern per month');
    expect(email).toContain('- pattern library');
    expect(email).toContain('price lock');
  });

  it('handles a zero monthly price without exploding', () => {
    const email = generateFoundingOfferEmail({
      clubName: 'X',
      designerName: 'Y',
      monthlyPrice: 0,
      annualPrice: 77,
      founderLockUntil: 'z',
      perks: [],
    });
    expect(email).toContain('Founding membership is open — X');
  });
});
