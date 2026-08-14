import { describe, it, expect } from 'vitest';
import { analyzeYarnPool, DEFAULT_POOL, type YarnPoolInput, type YarnColorway } from './yarn-pool-lab';

function colorway(overrides: Partial<YarnColorway> = {}): YarnColorway {
  return {
    name: 'Main colorway',
    gramsPerKg: 1000,
    gramsNeeded: 2500,
    retailPricePerKg: 45,
    bulkPricePerKg: 38,
    wholesalePricePerKg: 30,
    millPricePerKg: 24,
    millMinPerColorway: 20000,
    bulkMin: 1000,
    wholesaleMinValue: 250,
    ...overrides,
  };
}

function pool(overrides: Partial<YarnPoolInput> = {}): YarnPoolInput {
  return { ...DEFAULT_POOL, ...overrides };
}

describe('Yarn Pool Lab — defaults', () => {
  it('verdicts pool-it at default numbers', () => {
    const r = analyzeYarnPool(pool());
    // 2,500 g at $30/kg = $75 order value — below the $250 dealer minimum,
    // so the pool lands on the retail-bulk tier ($38/kg), not wholesale.
    expect(r.verdict).toContain('Pool it');
    expect(r.colorways[0].tierReached).toBe('retailBulk');
  });
  it('pools members into colorway grams', () => {
    const r = analyzeYarnPool(pool());
    expect(r.totalGrams).toBe(2500);
  });
  it('savings vs retail are positive at default numbers', () => {
    const r = analyzeYarnPool(pool());
    expect(r.totalSavings).toBeGreaterThan(0);
    expect(r.totalSavings).toBeCloseTo((45 - 38) * 2.5, 2);
  });
});

describe('Yarn Pool Lab — tier ladder', () => {
  it('retail tier when grams are below every floor', () => {
    const r = analyzeYarnPool(pool({ colorways: [colorway({ gramsNeeded: 500 })] }));
    expect(r.colorways[0].tierReached).toBe('retail');
    expect(r.verdict).toContain('split it');
  });
  it('retail-bulk tier once grams pass bulk minimum', () => {
    const r = analyzeYarnPool(pool({ colorways: [colorway({ gramsNeeded: 1500 })] }));
    expect(r.colorways[0].tierReached).toBe('retailBulk');
  });
  it('wholesale tier when the order value passes the dealer minimum', () => {
    // 5,000 g at $30/kg = $150 < $250 → retail; 9,000 g = $270 → wholesale
    const low = analyzeYarnPool(pool({ colorways: [colorway({ gramsNeeded: 5000 })] }));
    expect(low.colorways[0].tierReached).toBe('retailBulk');
    const high = analyzeYarnPool(pool({ colorways: [colorway({ gramsNeeded: 9000 })] }));
    expect(high.colorways[0].tierReached).toBe('wholesale');
  });
  it('mill-direct tier when grams pass the colorway MOQ', () => {
    const r = analyzeYarnPool(pool({ colorways: [colorway({ gramsNeeded: 20000 })] }));
    expect(r.colorways[0].tierReached).toBe('millDirect');
    expect(r.verdict).toContain('Mill it');
  });
  it('mill tier beats wholesale price', () => {
    const r = analyzeYarnPool(pool({ colorways: [colorway({ gramsNeeded: 20000 })] }));
    expect(r.colorways[0].pricePerKg).toBe(24);
  });
});

describe('Yarn Pool Lab — cash and stash', () => {
  it('cash-locked months scale with outlay vs revenue', () => {
    const r = analyzeYarnPool(pool());
    expect(r.cashLockedMonths).toBeCloseTo(r.totalCost / 1400, 4);
  });
  it('zero revenue makes lock-up infinite', () => {
    const r = analyzeYarnPool(pool({ monthlyRevenue: 0 }));
    expect(isFinite(r.cashLockedMonths)).toBe(false);
  });
  it('stash offset caps at pool need', () => {
    const big = analyzeYarnPool(pool({ stashGrams: 50000 }));
    expect(big.stashGramsUsed).toBe(big.totalGrams);
  });
  it('cash lock-up warning fires when outlay exceeds 75% of runway', () => {
    const r = analyzeYarnPool(pool({ productionRunwayMonths: 1, monthlyRevenue: 50 }));
    expect(r.flags.map(f => f.code)).toContain('YP-02');
  });
});

describe('Yarn Pool Lab — flags', () => {
  it('YP-01 fires when a colorway sits within 75% of the mill MOQ', () => {
    // MOQ 20 kg; 16 kg = 80% → within the 75% band and doesn't meet MOQ
    const r = analyzeYarnPool(pool({ colorways: [colorway({ gramsNeeded: 16000 })] }));
    expect(r.flags.map(f => f.code)).toContain('YP-01');
  });
  it('YP-01 does not fire far below the MOQ band', () => {
    const r = analyzeYarnPool(pool({ colorways: [colorway({ gramsNeeded: 3000 })] }));
    expect(r.flags.map(f => f.code)).not.toContain('YP-01');
  });
  it('YP-03 fires when stash exists but is not credited', () => {
    const r = analyzeYarnPool(pool({ stashGrams: 800 }));
    expect(r.flags.map(f => f.code)).toContain('YP-03');
  });
  it('YP-05 (group buy) fires at retail tier when group buy available', () => {
    const r = analyzeYarnPool(pool({ colorways: [colorway({ gramsNeeded: 800 })] }));
    expect(r.flags.map(f => f.code)).toContain('YP-05');
    expect(r.needsGroupBuy).toBe(true);
  });
  it('YP-04 (pool still retail) fires when no group buy path exists', () => {
    const r = analyzeYarnPool(pool({ colorways: [colorway({ gramsNeeded: 800 })], groupBuyAvailable: false }));
    expect(r.flags.map(f => f.code)).toContain('YP-04');
    expect(r.needsGroupBuy).toBe(true);
  });
  it('YP-06 dye-lot warning fires with multiple colorways', () => {
    const r = analyzeYarnPool(pool({ colorways: [colorway(), colorway({ name: 'Contrast' })] }));
    expect(r.flags.map(f => f.code)).toContain('YP-06');
  });
  it('YP-07 fires when members demand more grams than colorways hold', () => {
    const r = analyzeYarnPool(
      pool({
        members: [{ name: 'Big sweater', gramsNeeded: 3000 }],
        colorways: [colorway({ gramsNeeded: 2500 })],
      }),
    );
    expect(r.flags.map(f => f.code)).toContain('YP-07');
  });
});

describe('Yarn Pool Lab — verdict ladder', () => {
  it('empty pool verdicts nothing to pool', () => {
    const r = analyzeYarnPool(pool({ colorways: [] }));
    expect(r.verdict).toContain('Nothing to pool');
  });
  it('under-ordering colorways raises no results', () => {
    const r = analyzeYarnPool(pool({ colorways: [colorway({ gramsNeeded: 0 })] }));
    expect(r.totalCost).toBe(0);
    expect(r.totalSavings).toBe(0);
  });
});
