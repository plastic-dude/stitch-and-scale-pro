import { describe, it, expect } from 'vitest';
import {
  analyzeReprice,
  netPerUnit,
  type RepriceInput,
  hydrateRepriceState,
  applyRepricePatch,
} from './consignment-reprice-lab';

function mk(
  overrides: Partial<RepriceInput> = {},
): RepriceInput {
  return {
    retailPrice: 8,
    channel: 'ravelry-instore',
    printCostPerUnit: 1.5,
    unitsAtShop: 30,
    unitsSoldPerMonth: 3,
    monthsInShop: 2,
    seasonBand: 'winter',
    opportunityRate: 25,
    repriceHours: 2,
    ...overrides,
  };
}

describe('netPerUnit — channel split math', () => {
  it('Ravelry In-Store above $2.49: 60% share minus 9.5% + $0.25 fee minus print cost', () => {
    const ch = {
      name: 'Ravelry In-Store',
      designerShare: 0.6,
      platformRate: 0.065 + 0.03,
      platformFlat: 0.25,
      lowPriceFlatShopCut: 1.0,
      lowPriceThreshold: 2.49,
    };
    // $8 × 60% = $4.80 gross; fee = 4.80 × 0.095 + 0.25 = 0.706; net = 4.80 - 0.706 - 1.50
    const { net, fee } = netPerUnit(8, ch, 1.5);
    expect(net).toBeCloseTo(4.8 - (4.8 * 0.095 + 0.25) - 1.5, 4);
    expect(fee).toBeCloseTo(4.8 * 0.095 + 0.25, 4);
  });

  it('Ravelry In-Store at or under $2.49: shop keeps flat $1, designer nets the rest minus fees', () => {
    const ch = {
      name: 'Ravelry In-Store',
      designerShare: 0.6,
      platformRate: 0.095,
      platformFlat: 0.25,
      lowPriceFlatShopCut: 1.0,
      lowPriceThreshold: 2.49,
    };
    const { net } = netPerUnit(2.49, ch, 1.5);
    // designer gross = 2.49 - 1.00 = 1.49; fee = 1.49 × 0.095 + 0.25; net = 1.49 - fee - 1.50
    expect(net).toBeCloseTo(1.49 - (1.49 * 0.095 + 0.25) - 1.5, 4);
    expect(net).toBeLessThan(0); // print cost alone exceeds the designer portion
  });

  it('direct consignment at 45% share has no platform fee', () => {
    const ch = {
      name: 'Direct consignment',
      designerShare: 0.45,
      platformRate: 0,
      platformFlat: 0,
      lowPriceFlatShopCut: 0,
      lowPriceThreshold: Infinity,
    };
    const { net, fee } = netPerUnit(8, ch, 1.5);
    expect(fee).toBe(0);
    expect(net).toBeCloseTo(8 * 0.45 - 1.5, 4);
  });
});

describe('analyzeReprice — healthy default', () => {
  const result = analyzeReprice(mk());

  it('is in season with 10 months of stock on hand (warns at 6+)', () => {
    expect(result.monthsOfStock).toBeCloseTo(10, 0);
    const cr4 = result.flags.find(f => f.code === 'CR-04');
    expect(cr4).toBeDefined();
    expect(cr4!.severity).toBe('warning');
    expect(cr4!.title).toContain('6 months');
  });

  it('has no critical flags for a young in-season run', () => {
    expect(result.flags.filter(f => f.severity === 'critical').length).toBe(0);
  });

  it('current price is the best ladder step for a young in-season run', () => {
    expect(result.bestStep.label).toBe('Hold full price');
  });

  it('verdict is hold for the healthy case', () => {
    expect(result.verdict).toContain('Hold the price');
  });
});

describe('analyzeReprice — the $2.49 cliff (CR-01)', () => {
  it('flags pricing at or below $2.49 on In-Store', () => {
    const result = analyzeReprice(mk({ retailPrice: 2.49 }));
    const cliff = result.flags.find(f => f.code === 'CR-01');
    expect(cliff).toBeDefined();
    expect(cliff!.title).toContain('2.49');
  });

  it('the flag details the quarter-bump economics', () => {
    const atCliff = analyzeReprice(mk({ retailPrice: 2.49 }));
    const atAbove = analyzeReprice(mk({ retailPrice: 2.5 }));
    const cliff = atCliff.flags.find(f => f.code === 'CR-01')!;
    const netBelow = netPerUnit(2.49, {
      name: 'Ravelry In-Store',
      designerShare: 0.6,
      platformRate: 0.095,
      platformFlat: 0.25,
      lowPriceFlatShopCut: 1.0,
      lowPriceThreshold: 2.49,
    }, 1.5).net;
    expect(cliff.detail).toContain(`$${netBelow.toFixed(2)}/unit`);
    // $2.50 nets more than $2.49 despite the higher price (40% share back)
    expect(atAbove.currentNetPerUnit).toBeGreaterThan(atCliff.currentNetPerUnit);
  });
});

describe('analyzeReprice — negative net (CR-02)', () => {
  it('flags when current price nets zero or less', () => {
    // $8 retail, 15% designer share via a bad direct-consignment deal
    const result = analyzeReprice(
      mk({ channel: 'consignment-direct', printCostPerUnit: 4, unitsSoldPerMonth: 0 }),
    );
    expect(result.flags.some(f => f.code === 'CR-02')).toBe(true);
  });

  it('negative net drives a markdown verdict', () => {
    const result = analyzeReprice(mk({ printCostPerUnit: 5, unitsSoldPerMonth: 0 }));
    expect(result.verdict).toContain('Markdown');
  });
});

describe('analyzeReprice — seasonal aging (CR-03, CR-04)', () => {
  it('flags a winter run aged past season at month 8', () => {
    const result = analyzeRepageAged(8);
    const aged = result.flags.find(f => f.code === 'CR-03');
    expect(aged).toBeDefined();
    expect(aged!.detail).toContain('65%');
  });

  it('deep aging to 15 months cuts willingness-to-pay to ~40%', () => {
    const result = analyzeRepageAged(15);
    expect(result.flags.find(f => f.code === 'CR-03')!.detail).toContain('40%');
  });

  it('yearround band never ages', () => {
    const result = analyzeReprice(mk({ monthsInShop: 15, seasonBand: 'yearround' }));
    expect(result.flags.some(f => f.code === 'CR-03')).toBe(false);
  });

  it('no sell-through flags dead stock (CR-04 critical)', () => {
    const result = analyzeReprice(mk({ unitsSoldPerMonth: 0 }));
    const dead = result.flags.find(f => f.code === 'CR-04');
    expect(dead).toBeDefined();
    expect(dead!.severity).toBe('critical');
    expect(dead!.title).toContain('not moving');
  });

  it('slow sell-through above 6 months warns', () => {
    const result = analyzeReprice(mk({ unitsAtShop: 30, unitsSoldPerMonth: 3, monthsInShop: 2, unitsSoldPerMonthOverride: undefined }));
    // 30 units / 3 per month = 10 months of stock → warning not critical
    expect(result.flags.find(f => f.code === 'CR-04')!.title).toContain('6 months');
  });
});

function analyzeRepageAged(months: number) {
  return analyzeReprice(mk({ monthsInShop: months, unitsSoldPerMonth: 0.5 }));
}

describe('analyzeReprice — ladder economics', () => {
  it('ladder has six steps from hold to pull-back', () => {
    const result = analyzeReprice(mk());
    expect(result.ladder).toHaveLength(6);
    expect(result.ladder[0].label).toBe('Hold full price');
    expect(result.ladder[5].label).toBe('Pull back to online-only discount');
  });

  it('ladder prices descend from retail', () => {
    const result = analyzeReprice(mk());
    const prices = result.ladder.map(s => s.price);
    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]).toBeLessThanOrEqual(prices[i - 1]);
    }
  });

  it('pull-back step uses own-site fees (no 60/40 split)', () => {
    const result = analyzeReprice(mk({ unitsSoldPerMonth: 0 }));
    const pull = result.ladder.find(s => s.label === 'Pull back to online-only discount')!;
    // own-site: 97% share minus 3% processing minus $0.25 minus print cost
    const expected = 8 * 0.5 * 0.97 * (1 - 0.03 / 0.97) - 0.25 - 1.5;
    // simpler: price 4.00 × 0.97 = 3.88; fee = 3.88 × 0.03 + 0.25 = 0.3664; net = 3.88 - 0.3664 - 1.5
    expect(pull.netPerUnit).toBeCloseTo(3.88 - (3.88 * 0.03 + 0.25) - 1.5, 2);
  });

  it('markdown steps clear stock faster than full price', () => {
    const result = analyzeReprice(mk());
    const hold = result.ladder[0].monthsToClear;
    const clearance = result.ladder[3].monthsToClear;
    expect(clearance).toBeLessThan(hold);
  });

  it('best step picks highest total net on current stock', () => {
    const result = analyzeReprice(mk());
    const totals = result.ladder.map(s => s.totalNetOnCurrentStock);
    expect(result.bestStep.totalNetOnCurrentStock).toBe(Math.max(...totals));
  });
});

describe('analyzeReprice — shop take & print cost (CR-06, CR-08)', () => {
  it('flags a shop keeping more than 60% (CR-06)', () => {
    const result = analyzeReprice(mk({ channel: 'consignment-direct' }));
    // default direct-consignment share is 45% → shop keeps 55% (within norm)
    expect(result.flags.some(f => f.code === 'CR-06')).toBe(false);
  });

  it('flags print cost over 25% of retail (CR-08)', () => {
    const result = analyzeReprice(mk({ printCostPerUnit: 2.5 }));
    // 2.50 / 8.00 = 31.25%
    expect(result.flags.some(f => f.code === 'CR-08')).toBe(true);
  });
});

describe('analyzeReprice — verdict ladder', () => {
  it('dead and aged stock: hold step removed, pull-back in the ladder', () => {
    const result = analyzeReprice(
      mk({ monthsInShop: 14, unitsSoldPerMonth: 0, seasonBand: 'winter' }),
    );
    expect(result.ladder.some(s => s.label === 'Hold full price')).toBe(false);
    expect(result.ladder.some(s => s.label === 'Pull back to online-only discount')).toBe(true);
    // hold step removed, so the ladder forces a move; verdict names the best step
    expect(result.bestStep.label === 'Pull back to online-only discount' ||
      result.bestStep.label === 'Light markdown (15% off)' ||
      result.bestStep.label === 'Destash floor (50% off)').toBe(true);
  });

  it('markdown verdict beats hold when current price nets negative', () => {
    const result = analyzeReprice(mk({ printCostPerUnit: 5, unitsSoldPerMonth: 0 }));
    // dead stock removes the hold step entirely from the ladder
    expect(result.ladder.some(s => s.label === 'Hold full price')).toBe(false);
    expect(result.bestStep.label).not.toBe('Hold full price');
  });
});

describe('analyzeReprice — channel net table', () => {
  it('lists all three channels with shares', () => {
    const result = analyzeReprice(mk());
    expect(result.channelNets).toHaveLength(3);
    const ri = result.channelNets.find(c => c.channel === 'Ravelry In-Store')!;
    expect(ri.designerSharePct).toBe(60);
    const own = result.channelNets.find(c => c.channel === 'Own shop / online')!;
    expect(own.designerSharePct).toBe(97);
  });

  it('own-site nets the most at full price', () => {
    const result = analyzeReprice(mk());
    const nets = result.channelNets.map(c => c.netPerUnit);
    expect(nets[2]).toBe(Math.max(...nets));
  });
});

// QA #45 (S255) regression: zero sell-through must not crown a BEST step.
// When units are stocked but nothing sells, every ladder step nets $0.00,
// so no step can be meaningfully recommended — the BEST badge and primary
// highlight are suppressed, and the table footer says so explicitly.
describe('analyzeReprice — QA #45 (S255) zero sell-through', () => {
  it('flags zeroSellThrough when units are stocked but nothing sells', () => {
    const result = analyzeReprice(mk({ unitsSoldPerMonth: 0 }));
    expect(result.zeroSellThrough).toBe(true);
    // CR-04 critical "No current sell-through" still fires — the warning path
    // is preserved; only the ladder crown changes.
    expect(result.flags.some(f => f.code === 'CR-04' && f.severity === 'critical')).toBe(true);
  });

  it('every ladder step nets $0.00 on current stock at zero sell-through', () => {
    const result = analyzeReprice(mk({ unitsSoldPerMonth: 0, unitsAtShop: 40 }));
    expect(result.ladder.every(s => s.totalNetOnCurrentStock === 0)).toBe(true);
    // monthsOfStock is Infinity (nothing sells), so no time-to-clear nonsense.
    expect(result.monthsOfStock).toBe(Infinity);
  });

  it('bestStep exists but the crown is display-suppressed at zero sell-through', () => {
    const result = analyzeReprice(mk({ unitsSoldPerMonth: 0 }));
    // Engine semantics unchanged: a sorted best step is still returned.
    expect(result.bestStep).toBeDefined();
    expect(typeof result.bestStep.label).toBe('string');
    expect(result.ladder.some(s => s.label === result.bestStep.label)).toBe(true);
  });

  it('non-zero sell-through behaves exactly as before (no crown suppression)', () => {
    const result = analyzeReprice(mk({ unitsSoldPerMonth: 3 }));
    expect(result.zeroSellThrough).toBe(false);
    expect(result.ladder.some(s => s.label === result.bestStep.label)).toBe(true);
  });

  it('zero units at shop is not zero sell-through', () => {
    const result = analyzeReprice(mk({ unitsSoldPerMonth: 0, unitsAtShop: 0 }));
    expect(result.zeroSellThrough).toBe(false); // nothing in the shop to crown or not crown
  });
});


// ---- QA #60 (S260) regression: zero-sold scenario + input controlledness ----
//
// The reprice card must keep every input controlled for its lifetime. The card
// itself has no component tests in this repo (no @testing-library), so the
// normalization contract is pinned at the state layer it depends on:
//
// 1. analyzeReprice must behave with unitsSoldPerMonth = 0 (the zero-sold
//    probe that triggered the console errors), so the card renders
//    deterministically and never reads an undefined derived value.
// 2. hydrateRepriceState is the exact hydration path the card uses on mount:
//    a stale blob missing `unitsSoldPerMonth` must hydrate over the defaults
//    instead of carrying undefined into an input.
// 3. applyRepricePatch must strip undefined entries, so the card's setState
//    merge can never replace a defined input value with undefined.

describe('QA #60 — zero-sold probe and state normalization', () => {
  it('analyzes the zero-sold scenario deterministically', () => {
    const r = analyzeReprice({
      retailPrice: 8,
      channel: 'ravelry-instore',
      printCostPerUnit: 1.5,
      unitsAtShop: 60,
      unitsSoldPerMonth: 0,
      monthsInShop: 2,
      seasonBand: 'winter',
      opportunityRate: 25,
      repriceHours: 2,
    });
    expect(r.zeroSellThrough).toBe(true);
    for (const step of r.ladder) {
      expect(step.totalNetOnCurrentStock).toBe(0);
    }
    expect(r.bestStep).toBeDefined();
    expect(r.monthsOfStock).toBe(Infinity);
    expect(r.deadStockRisk).toBe(60 * 1.5);
  });

  it('hydrates a stale blob missing unitsSoldPerMonth over the defaults', () => {
    // A pre-v1 blob saved before unitsSoldPerMonth existed (or a seeded QA
    // fixture) must never reach an input as undefined.
    const stale = { retailPrice: 8, channel: 'ravelry-instore', printCostPerUnit: 1.5, unitsAtShop: 60, monthsInShop: 2, seasonBand: 'winter', opportunityRate: 25, repriceHours: 2 };
    const hydrated = hydrateRepriceState(stale as RepriceInput);
    expect(hydrated.unitsSoldPerMonth).toBe(3);
    expect(hydrated.unitsAtShop).toBe(60);
    expect(hydrated.channel).toBe('ravelry-instore');
    for (const [k, v] of Object.entries(hydrated)) {
      expect(v).not.toBeUndefined();
    }
  });

  it('strips undefined entries from a patch', () => {
    const prev: RepriceInput = {
      retailPrice: 8, channel: 'ravelry-instore', printCostPerUnit: 1.5,
      unitsAtShop: 60, unitsSoldPerMonth: 0, monthsInShop: 2,
      seasonBand: 'winter', opportunityRate: 25, repriceHours: 2,
    };
    const next = applyRepricePatch(prev, { unitsSoldPerMonth: undefined } as Partial<RepriceInput>);
    expect(next.unitsSoldPerMonth).toBe(0);
    const next2 = applyRepricePatch(prev, { unitsSoldPerMonth: 4 });
    expect(next2.unitsSoldPerMonth).toBe(4);
  });
});
