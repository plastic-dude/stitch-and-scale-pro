import { describe, expect, it } from 'vitest';
import {
  analyzePatternBundle,
  DEFAULT_BUNDLE,
  PatternBundleInput,
} from './pattern-bundle-lab';

function bundleIn(overrides: Partial<PatternBundleInput>): PatternBundleInput {
  return { ...DEFAULT_BUNDLE, ...overrides };
}

describe('pattern-bundle-lab', () => {
  it('returns three scenarios for the default bundle', () => {
    const r = analyzePatternBundle(DEFAULT_BUNDLE);
    expect(r.scenarios.map(s => s.label)).toEqual(['worst', 'realistic', 'best']);
    expect(r.scenarios[1].sales).toBe(150);
    expect(r.standaloneSum).toBe(21);
  });

  it('computes discount share vs standalone sum', () => {
    const r = analyzePatternBundle(DEFAULT_BUNDLE);
    // $14 bundle from $21 of value = 1/3 off
    expect(r.discountShare).toBeCloseTo(1 / 3, 5);
  });

  it('weighted split gives higher-priced patterns a larger share', () => {
    const r = analyzePatternBundle(bundleIn({ splitMode: 'weighted' }));
    const shares = r.scenarios[0].designers.map(d => d.share);
    expect(shares[0]).toBeCloseTo(8 / 21, 9);
    expect(shares[1]).toBeCloseTo(7 / 21, 9);
    expect(shares[2]).toBeCloseTo(6 / 21, 9);
  });

  it('equal split divides evenly', () => {
    const r = analyzePatternBundle(bundleIn({ splitMode: 'equal' }));
    for (const d of r.scenarios[0].designers) {
      expect(d.share).toBeCloseTo(1 / 3, 9);
    }
  });

  it('host commission reduces the designer pool', () => {
    const a = analyzePatternBundle(bundleIn({ hostCommission: 0.1 }));
    const b = analyzePatternBundle(bundleIn({ hostCommission: 0.3 }));
    expect(b.scenarios[1].designers[0].grossTake).toBeLessThan(
      a.scenarios[1].designers[0].grossTake
    );
  });

  it('net take deducts processing fees', () => {
    const r = analyzePatternBundle(bundleIn({ bundleSales: 150 }));
    const d = r.scenarios[1].designers[0];
    expect(d.netTake).toBeLessThan(d.grossTake);
  });

  it('break-even sales is finite with positive increment', () => {
    const r = analyzePatternBundle(
      bundleIn({ bundleSales: 300, bundleSalesBest: 600 })
    );
    expect(r.breakEvenSales).toBeGreaterThan(0);
    expect(Number.isFinite(r.breakEvenSales)).toBe(true);
  });

  it('break-even is Infinity when processing kills every sale', () => {
    const r = analyzePatternBundle(
      bundleIn({ bundlePrice: 1, processorFixed: 5, soloSalesPerPattern: 100 })
    );
    expect(r.breakEvenSales).toBe(Infinity);
  });

  it('higher bundle sales raise every designer net', () => {
    const r = analyzePatternBundle(DEFAULT_BUNDLE);
    const nets = r.scenarios.map(s => s.designers[0].netTake);
    expect(nets[0]).toBeLessThan(nets[1]);
    expect(nets[1]).toBeLessThan(nets[2]);
  });

  it('default verdict is positive at the default bundle settings', () => {
    const r = analyzePatternBundle(DEFAULT_BUNDLE);
    expect(['Host this launch', 'Teach it — small but positive']).toContain(r.verdict);
  });

  it('skip-the-bundle verdict when break-even far exceeds best case', () => {
    const r = analyzePatternBundle(
      bundleIn({
        bundleSales: 20,
        bundleSalesBest: 25,
        bundleSalesWorst: 5,
        soloSalesPerPattern: 30,
        promoHours: 25,
        emailGained: 0,
      })
    );
    expect(r.breakEvenSales).toBeGreaterThan(r.scenarios[r.scenarios.length - 1].sales * 1.2);
    expect(r.verdict).toBe('Skip the bundle — sell solo');
  });

  it('renegotiate verdict when realistic sales underperform solo', () => {
    const r = analyzePatternBundle(
      bundleIn({
        bundleSales: 40,
        hostCommission: 0.3,
        promoHours: 30,
        soloSalesPerPattern: 15,
        emailGained: 0,
      })
    );
    expect(r.scenarios[1].designers[0].incremental).toBeLessThan(0);
    expect(r.verdict).toBe('Not yet — renegotiate before signing');
  });

  it('make-host-carry verdict when incremental is positive but promo underpaid', () => {
    const r = analyzePatternBundle(
      bundleIn({
        bundleSales: 300,
        bundleSalesBest: 600,
        promoHours: 80,
        hourlyRate: 40,
        soloSalesPerPattern: 3,
        emailGained: 30,
      })
    );
    expect(r.scenarios[1].designers[0].incremental).toBeGreaterThan(0);
    expect(r.scenarios[1].effectiveHourly).toBeLessThan(24);
    expect(r.verdict).toBe('Worth it, but make the host carry the launch');
  });

  it('host-this-launch verdict at strong bundle volume', () => {
    const r = analyzePatternBundle(
      bundleIn({
        bundleSales: 400,
        bundleSalesBest: 800,
      })
    );
    expect(r.verdict).toBe('Host this launch');
  });

  it('PB-01 shallow discount when bundle near standalone sum', () => {
    const r = analyzePatternBundle(bundleIn({ bundlePrice: 19 }));
    expect(r.flags.some(f => f.code === 'PB-01')).toBe(true);
  });

  it('PB-02 deep-discount flag at >75% off', () => {
    const r = analyzePatternBundle(bundleIn({ bundlePrice: 4 }));
    expect(r.flags.some(f => f.code === 'PB-02')).toBe(true);
  });

  it('PB-03 host commission above the 25% band', () => {
    const r = analyzePatternBundle(bundleIn({ hostCommission: 0.3 }));
    expect(r.flags.some(f => f.code === 'PB-03')).toBe(true);
  });

  it('PB-07 equal-split warning when prices vary widely', () => {
    const r = analyzePatternBundle(
      bundleIn({
        splitMode: 'equal',
        patterns: [{ price: 12, monthlySales: 6 }, { price: 5, monthlySales: 4 }, { price: 4, monthlySales: 3 }],
      })
    );
    expect(r.flags.some(f => f.code === 'PB-07')).toBe(true);
  });

  it('PB-08 fires when email capture is zero', () => {
    const r = analyzePatternBundle(bundleIn({ emailGained: 0 }));
    expect(r.flags.some(f => f.code === 'PB-08')).toBe(true);
  });

  it('PB-04 fires when bundle underperforms solo baseline', () => {
    const r = analyzePatternBundle(
      bundleIn({ bundleSales: 30, soloSalesPerPattern: 15, promoHours: 20 })
    );
    expect(r.flags.some(f => f.code === 'PB-04')).toBe(true);
  });

  it('PB-05 fires at bad worst case', () => {
    const r = analyzePatternBundle(
      bundleIn({ bundleSalesWorst: 5, promoHours: 20 })
    );
    expect(r.flags.some(f => f.code === 'PB-05')).toBe(true);
  });

  it('email capture raises effective hourly and net take', () => {
    const a = analyzePatternBundle(bundleIn({ emailGained: 0 }));
    const b = analyzePatternBundle(bundleIn({ emailGained: 300 }));
    expect(b.scenarios[1].designers[0].netTake).toBeGreaterThan(
      a.scenarios[1].designers[0].netTake
    );
  });

  it('launch months scale the solo baseline', () => {
    const a = analyzePatternBundle(bundleIn({ launchMonths: 1 }));
    const b = analyzePatternBundle(bundleIn({ launchMonths: 2 }));
    expect(b.scenarios[1].designers[0].soloBaseline).toBeCloseTo(
      a.scenarios[1].designers[0].soloBaseline * 2,
      5
    );
  });

  it('no patterns falls back to skip verdict without crashing', () => {
    const r = analyzePatternBundle(bundleIn({ patterns: [] }));
    expect(r.verdict).toBe('Skip the bundle — sell solo');
    expect(r.flags.length).toBeGreaterThanOrEqual(0);
  });
});
