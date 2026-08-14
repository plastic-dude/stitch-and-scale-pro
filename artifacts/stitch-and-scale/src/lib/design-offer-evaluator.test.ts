import { describe, expect, it } from 'vitest';
import {
  evaluateDesignOffer,
  generateOfferResponse,
  DESIGN_OFFER_TYPES,
  DESIGN_OFFER_TYPE_LABELS,
  DesignOfferInput,
} from './design-offer-evaluator';

/**
 * A representative offer input: a 12-hour, $25/hr sweater design priced at
 * $8, with the designer's own channel doing ~30 sales and a 6-month
 * exclusivity window. Every test overrides only what it needs to test.
 */
function baseInput(overrides: Partial<DesignOfferInput> = {}): DesignOfferInput {
  return {
    salesVolume: 30,
    patternPrice: 8,
    platform: 'ravelry',
    exclusivityMonths: 6,
    techEditCovered: false,
    photographyCovered: false,
    layoutCovered: false,
    keepsOwnSiteRights: true,
    keepsWholesaleRights: true,
    yarnSupportValue: 0,
    designHours: 12,
    hourlyRate: 25,
    uncoveredCosts: 0,
    ...overrides,
  };
}

describe('evaluateDesignOffer', () => {
  it('takes a generous flat fee that clears the baseline', () => {
    const v = evaluateDesignOffer(baseInput({ fee: 500 }));
    // Ravelry net on 30 × $8 is ~$228 (below the $30/mo threshold behaviour);
    // $500 clears it.
    expect(v.verdict).toBe('take');
    expect(v.estimatedOfferValue).toBe(500);
    expect(v.effectiveHourlyRate).toBeCloseTo(500 / 12, 0);
  });

  it('flags a below-floor flat fee with no resale rights (DO-01)', () => {
    const v = evaluateDesignOffer(
      baseInput({ fee: 150, keepsOwnSiteRights: false, keepsWholesaleRights: false }),
    );
    expect(v.flags.find(f => f.code === 'DO-01')).toBeTruthy();
  });

  it('flags exclusivity beyond 12 months (DO-02)', () => {
    const v = evaluateDesignOffer(baseInput({ fee: 400, exclusivityMonths: 24 }));
    expect(v.flags.find(f => f.code === 'DO-02')).toBeTruthy();
  });

  it('flags tech edit and photography not covered (DO-06, DO-07)', () => {
    const v = evaluateDesignOffer(baseInput({ fee: 400 }));
    expect(v.flags.find(f => f.code === 'DO-06')).toBeTruthy();
    expect(v.flags.find(f => f.code === 'DO-07')).toBeTruthy();
    const covered = evaluateDesignOffer(baseInput({ fee: 400, techEditCovered: true, photographyCovered: true }));
    expect(covered.flags.find(f => f.code === 'DO-06')).toBeUndefined();
    expect(covered.flags.find(f => f.code === 'DO-07')).toBeUndefined();
  });

  it('royalty below 20% is a warning (DO-05)', () => {
    const v = evaluateDesignOffer(baseInput({ royaltyPct: 0.15, fee: 0 }));
    expect(v.flags.find(f => f.code === 'DO-05')).toBeTruthy();
    const fair = evaluateDesignOffer(baseInput({ royaltyPct: 0.3, fee: 0 }));
    expect(fair.flags.find(f => f.code === 'DO-05')).toBeUndefined();
  });

  it('royalty deal without own-site rights is a hard flag (DO-04)', () => {
    const v = evaluateDesignOffer(
      baseInput({ royaltyPct: 0.3, fee: 0, keepsOwnSiteRights: false }),
    );
    expect(v.flags.find(f => f.code === 'DO-04')).toBeTruthy();
  });

  it('yarn-only deal with no fee and no resale rights is flagged (DO-08)', () => {
    const v = evaluateDesignOffer(
      baseInput({ fee: 0, yarnSupportValue: 60, keepsOwnSiteRights: false }),
    );
    expect(v.flags.find(f => f.code === 'DO-08')).toBeTruthy();
  });

  it('yarn-support-only note when designer keeps sales rights (DO-03)', () => {
    const v = evaluateDesignOffer(
      baseInput({ fee: 0, yarnSupportValue: 60 }),
    );
    expect(v.flags.find(f => f.code === 'DO-03')).toBeTruthy();
  });

  it('counters when the offer is within 30% of the baseline', () => {
    const v = evaluateDesignOffer(baseInput({ fee: 170 }));
    // baseline ≈ $228 net; offer 170 → within 0.7 band → counter.
    expect(v.verdict).toBe('counter');
    expect(v.summary).toContain('counter');
  });

  it('walks away when the offer is far below the baseline', () => {
    const v = evaluateDesignOffer(baseInput({ fee: 80, keepsOwnSiteRights: false, keepsWholesaleRights: false }));
    expect(v.verdict).toBe('walk_away');
  });

  it('royalty value is computed on company net proceeds (Making Stories structure)', () => {
    // 30% royalty on the same 30 sales the baseline uses.
    const v = evaluateDesignOffer(baseInput({ royaltyPct: 0.3, fee: 0 }));
    const base = evaluateDesignOffer(baseInput());
    // Royalty value = 30% × companyNet; companyNet ≈ base.net (same volume/price/platform).
    expect(v.estimatedOfferValue).toBeCloseTo(0.3 * base.selfPublishValue, 1);
  });

  it('effective hourly rate is computed against design hours', () => {
    const v = evaluateDesignOffer(baseInput({ fee: 120, designHours: 20 }));
    expect(v.effectiveHourlyRate).toBeCloseTo(120 / 20, 1);
  });

  it('flags effective rate under half the designer rate (DO-09)', () => {
    const v = evaluateDesignOffer(baseInput({ fee: 100, designHours: 20 }));
    // 100/20 = $5/hr vs $25/hr rate → under half.
    expect(v.flags.find(f => f.code === 'DO-09')).toBeTruthy();
  });

  it('handles zero hours without crashing', () => {
    const v = evaluateDesignOffer(baseInput({ fee: 300, designHours: 0 }));
    expect(v.effectiveHourlyRate).toBe(0);
    expect(v.verdict).toBe('take');
  });

  it('produces a terms response that names the designer channel baseline', () => {
    const v = evaluateDesignOffer(baseInput({ fee: 170 }));
    const response = generateOfferResponse(baseInput({ fee: 170 }), v);
    expect(response).toContain('30 sales');
    expect(response).toContain('gap');
  });

  it('take response invites written terms', () => {
    const v = evaluateDesignOffer(baseInput({ fee: 500 }));
    const response = generateOfferResponse(baseInput({ fee: 500 }), v);
    expect(response).toContain('in writing');
  });

  it('walk-away response keeps the door open', () => {
    const v = evaluateDesignOffer(baseInput({ fee: 50, keepsOwnSiteRights: false, keepsWholesaleRights: false }));
    const response = generateOfferResponse(
      baseInput({ fee: 50, keepsOwnSiteRights: false, keepsWholesaleRights: false }),
      v,
    );
    expect(response).toContain('work together on something else');
  });
});

describe('type registry', () => {
  it('labels every offer type', () => {
    expect(DESIGN_OFFER_TYPES.length).toBe(5);
    for (const t of DESIGN_OFFER_TYPES) {
      expect(DESIGN_OFFER_TYPE_LABELS[t]).toBeTruthy();
    }
  });
});
