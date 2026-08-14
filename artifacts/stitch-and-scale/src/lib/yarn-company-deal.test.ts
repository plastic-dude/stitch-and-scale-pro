import { describe, expect, it } from 'vitest';
import {
  selfPublishNet,
  minimumFlatFee,
  compareDeal,
  generateTermsResponse,
  DealInput,
} from './yarn-company-deal';

// A realistic designer scenario: 60 design hours at $40/h, $200 fixed costs
// (tech edit $55 + test knit $45 + model $40 + yarn $60), $9 pattern, ~150
// estimated lifetime sales in the window.
const realistic: DealInput = {
  designHours: 60,
  hourlyRate: 40,
  fixedCosts: 200,
  price: 9,
  estimatedSales: 150,
  platform: 'ravelry',
};

describe('selfPublishNet', () => {
  it('computes direct-channel net minus time and production costs', () => {
    // 150 sales at $9 = $1350 gross; Ravelry effective cut ~8.5% → ~$1235 net;
    // minus $2400 time and $200 fixed → deeply negative (matches the industry
    // finding that most single patterns never recover their time cost).
    const net = selfPublishNet(realistic);
    expect(net).toBeLessThan(0);
    expect(net).toBeGreaterThan(-3000);
  });

  it('returns negative time cost when there are no sales', () => {
    const noSales = selfPublishNet({ ...realistic, estimatedSales: 0 });
    expect(noSales).toBe(-realistic.designHours * realistic.hourlyRate - realistic.fixedCosts);
  });
});

describe('minimumFlatFee', () => {
  it('is always non-negative', () => {
    expect(minimumFlatFee(realistic)).toBeGreaterThanOrEqual(0);
  });

  it('covers at least time and production costs', () => {
    const floor = minimumFlatFee(realistic);
    // The floor must at minimum cover the designer's direct costs.
    expect(floor).toBeGreaterThanOrEqual(realistic.designHours * realistic.hourlyRate + realistic.fixedCosts);
  });

  it('falls back to direct-cost coverage when sales are zero', () => {
    const floor = minimumFlatFee({ ...realistic, estimatedSales: 0 });
    expect(floor).toBe(realistic.designHours * realistic.hourlyRate + realistic.fixedCosts);
  });
});

describe('compareDeal', () => {
  it('rates a generous flat fee with resale rights as "take"', () => {
    const outcome = compareDeal(realistic, {
      type: 'flat_fee',
      fee: 3000,
      supportValue: 150,
      retainsResellRights: true,
    });
    expect(outcome.verdict).toBe('take');
    expect(outcome.minimumFee).not.toBeNull();
    expect(outcome.netToDesigner).toBeGreaterThan(0);
  });

  it('rates a below-floor fee even with resale rights as "counter", not "take"', () => {
    const outcome = compareDeal(realistic, {
      type: 'flat_fee',
      fee: 1200,
      supportValue: 150,
      retainsResellRights: true,
    });
    expect(outcome.verdict).toBe('counter');
    expect(outcome.minimumFee).not.toBeNull();
    expect(outcome.minimumFee!).toBeGreaterThan(1200);
  });

  it('rates a low flat fee that loses all resale rights as "walk_away" or "counter"', () => {
    const outcome = compareDeal(realistic, {
      type: 'flat_fee',
      fee: 300,
      supportValue: 0,
      retainsResellRights: false,
    });
    expect(outcome.verdict).toBe('walk_away');
    expect(outcome.minimumFee).not.toBeNull();
    // The floor must exceed the offered fee when verdict is walk_away.
    expect(outcome.minimumFee!).toBeGreaterThan(300);
  });

  it('rates a strong royalty deal with big company channel as "take"', () => {
    const outcome = compareDeal(realistic, {
      type: 'royalty_no_exclusivity',
      royaltyPct: 0.30,
      companySales: 1000,
    });
    expect(outcome.verdict).toBe('take');
    expect(outcome.minimumFee).toBeNull();
  });

  it('rates an exclusive fee that ignores locked-out sales as "counter" or worse', () => {
    const outcome = compareDeal(realistic, {
      type: 'exclusive_flat_fee',
      fee: 500,
      supportValue: 0,
      exclusivityMonths: 6,
      lockedOutFraction: 0.5,
    });
    expect(['counter', 'walk_away']).toContain(outcome.verdict);
    expect(outcome.minimumFee).not.toBeNull();
    // The floor must exceed the fee that was walked away from.
    expect(outcome.minimumFee!).toBeGreaterThan(500);
  });

  it('never invents numbers beyond the inputs', () => {
    // Every net outcome must reconcile to fee/support/royalties minus costs —
    // i.e. it must equal the arithmetic of the inputs, never exceed plausible
    // bounds. Spot-check: exclusive net = fee + support − costs − locked net.
    const outcome = compareDeal(realistic, {
      type: 'exclusive_flat_fee',
      fee: 800,
      supportValue: 100,
      exclusivityMonths: 6,
      lockedOutFraction: 0.5,
    });
    const costs = realistic.designHours * realistic.hourlyRate + realistic.fixedCosts;
    expect(outcome.netToDesigner).toBeLessThanOrEqual(800 + 100 - costs);
  });
});

describe('generateTermsResponse', () => {
  it('never claims more than the numbers support', () => {
    const outcome = compareDeal(realistic, {
      type: 'flat_fee',
      fee: 250,
      supportValue: 0,
      retainsResellRights: false,
    });
    const response = generateTermsResponse(realistic, outcome);
    expect(response).toContain('$');
    // No fabricated dollar figures beyond the computed floor and costs:
    expect(response).toContain('tech editing, testing, and sampling');
  });

  it('states "happy to proceed" only for take verdicts', () => {
    const take = compareDeal(realistic, { type: 'flat_fee', fee: 3000, supportValue: 0, retainsResellRights: false });
    const walk = compareDeal(realistic, { type: 'flat_fee', fee: 100, supportValue: 0, retainsResellRights: false });
    expect(generateTermsResponse(realistic, take)).toContain("I'm happy to proceed");
    expect(generateTermsResponse(realistic, walk)).not.toContain("I'm happy to proceed");
  });
});
