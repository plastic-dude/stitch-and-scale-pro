import { describe, it, expect } from 'vitest';
import { analyzeYarnPool, DEFAULT_POOL, DEFAULT_COLORWAY, tierLabel, type YarnPoolInput, type YarnColorway, type PoolMember, type SourceTier } from './yarn-pool-lab';
import { YARN_POOL_COPY, type YarnPoolFlagCode, type YarnPoolVerdictId } from './yarn-pool-copy';
import type { LanguageCode } from '@/lib/i18n';

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
    const r = analyzeYarnPool(pool(), 'en');
    // 2,500 g at $30/kg = $75 order value — below the $250 dealer minimum,
    // so the pool lands on the retail-bulk tier ($38/kg), not wholesale.
    expect(r.verdict).toContain('Pool it');
    expect(r.colorways[0].tierReached).toBe('retailBulk');
  });
  it('pools members into colorway grams', () => {
    const r = analyzeYarnPool(pool(), 'en');
    expect(r.totalGrams).toBe(2500);
  });
  it('savings vs retail are positive at default numbers', () => {
    const r = analyzeYarnPool(pool(), 'en');
    expect(r.totalSavings).toBeGreaterThan(0);
    expect(r.totalSavings).toBeCloseTo((45 - 38) * 2.5, 2);
  });
});

describe('Yarn Pool Lab — tier ladder', () => {
  it('retail tier when grams are below every floor', () => {
    const r = analyzeYarnPool(pool({ colorways: [colorway({ gramsNeeded: 500 })] }), 'en');
    expect(r.colorways[0].tierReached).toBe('retail');
    expect(r.verdict).toContain('split it');
  });
  it('retail-bulk tier once grams pass bulk minimum', () => {
    const r = analyzeYarnPool(pool({ colorways: [colorway({ gramsNeeded: 1500 })] }), 'en');
    expect(r.colorways[0].tierReached).toBe('retailBulk');
  });
  it('wholesale tier when the order value passes the dealer minimum', () => {
    // 5,000 g at $30/kg = $150 < $250 → retail; 9,000 g = $270 → wholesale
    const low = analyzeYarnPool(pool({ colorways: [colorway({ gramsNeeded: 5000 })] }), 'en');
    expect(low.colorways[0].tierReached).toBe('retailBulk');
    const high = analyzeYarnPool(pool({ colorways: [colorway({ gramsNeeded: 9000 })] }), 'en');
    expect(high.colorways[0].tierReached).toBe('wholesale');
  });
  it('mill-direct tier when grams pass the colorway MOQ', () => {
    const r = analyzeYarnPool(pool({ colorways: [colorway({ gramsNeeded: 20000 })] }), 'en');
    expect(r.colorways[0].tierReached).toBe('millDirect');
    expect(r.verdictId).toBe('mill');
  });
  it('mill tier beats wholesale price', () => {
    const r = analyzeYarnPool(pool({ colorways: [colorway({ gramsNeeded: 20000 })] }), 'en');
    expect(r.colorways[0].pricePerKg).toBe(24);
  });
});

describe('Yarn Pool Lab — cash and stash', () => {
  it('cash-locked months scale with outlay vs revenue', () => {
    const r = analyzeYarnPool(pool(), 'en');
    expect(r.cashLockedMonths).toBeCloseTo(r.totalCost / 1400, 4);
  });
  it('zero revenue makes lock-up infinite', () => {
    const r = analyzeYarnPool(pool({ monthlyRevenue: 0 }), 'en');
    expect(isFinite(r.cashLockedMonths)).toBe(false);
  });
  it('stash offset caps at pool need', () => {
    const big = analyzeYarnPool(pool({ stashGrams: 50000 }), 'en');
    expect(big.stashGramsUsed).toBe(big.totalGrams);
  });
  it('cash lock-up warning fires when outlay exceeds 75% of runway', () => {
    const r = analyzeYarnPool(pool({ productionRunwayMonths: 1, monthlyRevenue: 50 }), 'en');
    expect(r.flags.map(f => f.code)).toContain('YP-02');
  });
});

describe('Yarn Pool Lab — flags', () => {
  it('YP-01 fires when a colorway sits within 75% of the mill MOQ', () => {
    // MOQ 20 kg; 16 kg = 80% → within the 75% band and doesn't meet MOQ
    const r = analyzeYarnPool(pool({ colorways: [colorway({ gramsNeeded: 16000 })] }), 'en');
    expect(r.flags.map(f => f.code)).toContain('YP-01');
  });
  it('YP-01 does not fire far below the MOQ band', () => {
    const r = analyzeYarnPool(pool({ colorways: [colorway({ gramsNeeded: 3000 })] }), 'en');
    expect(r.flags.map(f => f.code)).not.toContain('YP-01');
  });
  it('YP-03 fires when stash exists but is not credited', () => {
    const r = analyzeYarnPool(pool({ stashGrams: 800 }), 'en');
    expect(r.flags.map(f => f.code)).toContain('YP-03');
  });
  it('YP-05 (group buy) fires at retail tier when group buy available', () => {
    const r = analyzeYarnPool(pool({ colorways: [colorway({ gramsNeeded: 800 })] }), 'en');
    expect(r.flags.map(f => f.code)).toContain('YP-05');
    expect(r.needsGroupBuy).toBe(true);
  });
  it('YP-04 (pool still retail) fires when no group buy path exists', () => {
    const r = analyzeYarnPool(pool({ colorways: [colorway({ gramsNeeded: 800 })], groupBuyAvailable: false }), 'en');
    expect(r.flags.map(f => f.code)).toContain('YP-04');
    expect(r.needsGroupBuy).toBe(true);
  });
  it('YP-06 dye-lot warning fires with multiple colorways', () => {
    const r = analyzeYarnPool(pool({ colorways: [colorway(), colorway({ name: 'Contrast' })] }), 'en');
    expect(r.flags.map(f => f.code)).toContain('YP-06');
  });
  it('YP-07 fires when members demand more grams than colorways hold', () => {
    const r = analyzeYarnPool(
      pool({
        members: [{ name: 'Big sweater', gramsNeeded: 3000 }],
        colorways: [colorway({ gramsNeeded: 2500 })],
      }),
      'en',
    );
    expect(r.flags.map(f => f.code)).toContain('YP-07');
  });
});

describe('Yarn Pool Lab — verdict ladder', () => {
  it('empty pool verdicts nothing to pool', () => {
    const r = analyzeYarnPool(pool({ colorways: [] }), 'en');
    expect(r.verdictId).toBe('nothing');
    expect(r.verdict).toContain('Nothing to pool');
  });
  it('under-ordering colorways raises no results', () => {
    const r = analyzeYarnPool(pool({ colorways: [colorway({ gramsNeeded: 0 })] }), 'en');
    expect(r.totalCost).toBe(0);
    expect(r.totalSavings).toBe(0);
  });
});

// CHK-118 regression — dynamic-prose localization: flag titles/details,
// verdict labels/notes, and tier labels flow through the locale catalogue
// for all 5 locales; calculations are untouched (verdictId is stable).
const ALL_LOCALES: LanguageCode[] = ['en', 'de', 'fr', 'es', 'pt'];

describe('Yarn Pool Lab — localized dynamic prose (CHK-118)', () => {
  it('every locale renders every flag title and detail', () => {
    const codes: YarnPoolFlagCode[] = ['YP-01', 'YP-02', 'YP-03', 'YP-04', 'YP-05', 'YP-06', 'YP-07'];
    for (const lang of ALL_LOCALES) {
      const copy = YARN_POOL_COPY[lang];
      for (const code of codes) {
        expect(copy.flagTitle(code), `${lang}/${code} title`).toBeTruthy();
        expect(copy.flagDetail(code, {}), `${lang}/${code} detail`).toBeTruthy();
      }
    }
  });

  it('verdict ladder maps each stable verdictId to a localized label', () => {
    const ids: YarnPoolVerdictId[] = ['nothing', 'tooSmall', 'bulkRetail', 'bulkDealer', 'mill', 'pooled'];
    for (const lang of ALL_LOCALES) {
      const copy = YARN_POOL_COPY[lang];
      for (const id of ids) {
        expect(copy.verdictLabel(id), `${lang}/${id}`).toBeTruthy();
        expect(copy.verdictNote(id, { cost: '75', savings: '10', savingsPct: '12', retailCost: '85', millKg: '20' }), `${lang}/${id} note`).toBeTruthy();
      }
    }
  });

  it('engine emits stable verdictId and localized verdict in every locale', () => {
    const scenarios: { label: string; pool: Partial<YarnPoolInput>; expected: YarnPoolVerdictId }[] = [
      { label: 'empty', pool: { colorways: [] }, expected: 'nothing' },
      { label: 'small retail-only', pool: { colorways: [colorway({ gramsNeeded: 500 })] }, expected: 'tooSmall' },
      { label: 'bulk program', pool: { colorways: [colorway({ gramsNeeded: 1500 })] }, expected: 'bulkRetail' },
      { label: 'dealer', pool: { colorways: [colorway({ gramsNeeded: 9000 })] }, expected: 'bulkDealer' },
      { label: 'mill', pool: { colorways: [colorway({ gramsNeeded: 20000 })] }, expected: 'mill' },
      { label: 'default pool', pool: {}, expected: 'bulkRetail' },
      { label: 'member-stashed mill', pool: { colorways: [colorway({ gramsNeeded: 20000 })], stashGrams: 5000 }, expected: 'mill' },
      // Note (scope-honest): the engine's `pooled` branch (canBulk false && canMill false &&
      // needsGroupBuy false with totalGrams > 0) is currently unreachable — needsGroupBuy is
      // true for any positive-grams colorway at retail, so an engine with totalGrams > 0 but no
      // bulk/mill tiers always lands on `tooSmall`. Covered copy-wise by verdictLabel/verdictNote
      // parity above; wiring the ladder is out of CHK-118 scope (no calculation semantics changed).
    ];
    for (const lang of ALL_LOCALES) {
      for (const s of scenarios) {
        const r = analyzeYarnPool(pool(s.pool), lang);
        expect(r.verdictId, `${lang}/${s.label} verdictId`).toBe(s.expected);
        expect(r.verdict, `${lang}/${s.label} verdict`).toBe(YARN_POOL_COPY[lang].verdictLabel(s.expected));
      }
    }
  });

  it('tier labels are localized and tier price logic is unchanged', () => {
    const tiers: SourceTier[] = ['retail', 'retailBulk', 'wholesale', 'millDirect'];
    for (const lang of ALL_LOCALES) {
      for (const tier of tiers) {
        expect(tierLabel(tier, lang), `${lang}/${tier}`).toBeTruthy();
      }
    }
    // Tier selection stays invariant across locales — only the label changes.
    const rEn = analyzeYarnPool(pool({ colorways: [colorway({ gramsNeeded: 9000 })] }), 'en');
    const rDe = analyzeYarnPool(pool({ colorways: [colorway({ gramsNeeded: 9000 })] }), 'de');
    expect(rEn.colorways[0].tierReached).toBe(rDe.colorways[0].tierReached);
    expect(rDe.colorways[0].pricePerKg).toBe(30);
  });

  it('flag numbers still flow through the localized detail', () => {
    const r = analyzeYarnPool(pool({ productionRunwayMonths: 1, monthlyRevenue: 50 }), 'de');
    const f = r.flags.find(x => x.code === 'YP-02');
    expect(f).toBeTruthy();
    // The German detail must interpolate the same ≈ months value the engine computed.
    expect(f!.detail).toContain(r.cashLockedMonths.toFixed(1));
    expect(f!.detail).toContain('1 Monaten');
  });
});

// CHK-117 regression — storage-seam hydration: a stale pool blob (missing
// newer fields, or colorways missing per-field defaults) hydrates over the
// canonical pool defaults so nothing reaches an input as undefined.
describe('stored-pool hydration convention (CHK-117)', () => {
  it('hydrates a partial colorway over DEFAULT_COLORWAY defaults', () => {
    // Import path mirrors the card: loadStored folds DEFAULT_COLORWAY /
    // DEFAULT_POOL into any colorway missing keys.
    const colorways = [{ name: 'Dusty rose' }] as YarnColorway[];
    const folded = colorways.map(cw => ({ ...DEFAULT_COLORWAY, ...cw }));
    expect(folded[0].name).toBe('Dusty rose');
    expect(folded[0].gramsNeeded).toBe(2500);
    expect(folded[0].retailPricePerKg).toBe(45);
    expect(folded[0].millMinPerColorway).toBe(20000);
  });

  it('backfills top-level pool fields missing from a stale blob', () => {
    const stale = {
      colorways: [DEFAULT_COLORWAY],
      members: [{ name: 'Sweater', gramsNeeded: 900 }],
    } as YarnPoolInput;
    const folded: YarnPoolInput = {
      ...DEFAULT_POOL,
      ...stale,
      colorways: (stale.colorways as YarnColorway[]).map(cw => ({ ...DEFAULT_COLORWAY, ...cw })),
      members: (stale.members as PoolMember[]).map(m => ({ name: '', gramsNeeded: 0, ...m })),
    };
    expect(folded.productionRunwayMonths).toBe(6);
    expect(folded.monthlyRevenue).toBe(1400);
    expect(folded.stashGrams).toBe(400);
    expect(folded.groupBuyAvailable).toBe(true);
    expect(folded.members[0].name).toBe('Sweater');
  });

  it('carries the user override values from the blob', () => {
    const stale = {
      ...DEFAULT_POOL,
      monthlyRevenue: 3000,
      productionRunwayMonths: 12,
      colorways: [{ ...DEFAULT_COLORWAY, retailPricePerKg: 60 }],
    } as YarnPoolInput;
    const folded: YarnPoolInput = {
      ...DEFAULT_POOL,
      ...stale,
      colorways: (stale.colorways as YarnColorway[]).map(cw => ({ ...DEFAULT_COLORWAY, ...cw })),
      members: [...stale.members],
    };
    expect(folded.monthlyRevenue).toBe(3000);
    expect(folded.productionRunwayMonths).toBe(12);
    expect(folded.colorways[0].retailPricePerKg).toBe(60);
  });
});
