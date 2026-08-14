import { describe, it, expect } from 'vitest';
import {
  analyzeSampleLab,
  SAMPLE_LAB_DEFAULTS,
  seasonFactor,
  type SampleLabInput,
} from './sample-launch-lab';

const base = (overrides: Partial<SampleLabInput> = {}): SampleLabInput => ({ ...SAMPLE_LAB_DEFAULTS, ...overrides });

describe('sample sale economics', () => {
  it('default input prices all four channels with documented fee logic', () => {
    const r = analyzeSampleLab(base());
    expect(r.samples.length).toBe(4);
    expect(r.samples.find((s) => s.channel === 'etsy')).toBeTruthy();
    expect(r.samples.find((s) => s.channel === 'boutique')).toBeTruthy();
    const boutique = r.samples.find((s) => s.channel === 'boutique')!;
    // 40% consignment on $140 = $56 fees
    expect(boutique.fees).toBe(56);
    expect(boutique.net).toBe(84);
  });

  it('boutique carries the deepest cut while a flash drop keeps most of the sample price', () => {
    const r = analyzeSampleLab(base());
    const flash = r.samples.find((s) => s.channel === 'flash_online')!;
    const boutique = r.samples.find((s) => s.channel === 'boutique')!;
    expect(flash.fees).toBeLessThan(boutique.fees);
    expect(flash.net).toBeGreaterThan(boutique.net);
  });

  it('craft fair fees rise as booth cost rises, so net drops', () => {
    const cheap = analyzeSampleLab(base({ boothCost: 20 }));
    const dear = analyzeSampleLab(base({ boothCost: 150 }));
    expect(cheap.samples.find((s) => s.channel === 'craftfair')!.fees)
      .toBeLessThan(dear.samples.find((s) => s.channel === 'craftfair')!.fees);
    expect(cheap.samples.find((s) => s.channel === 'craftfair')!.net)
      .toBeGreaterThan(dear.samples.find((s) => s.channel === 'craftfair')!.net);
  });

  it('recovers sample cost basis when the sample price beats a low cost basis', () => {
    const r = analyzeSampleLab(base({ samplePrice: 200, knitHours: 6, knitHourlyRate: 15, yarnCost: 30 }));
    expect(r.best).toBeTruthy();
    expect(r.best!.recoveredVsCost).toBeGreaterThan(0);
  });

  it('deep discounting erodes recovery — a $60 flash sample covers only a slice of the $525 basis', () => {
    const r = analyzeSampleLab(base({ samplePrice: 60, knitHours: 30, knitHourlyRate: 15, yarnCost: 75 }));
    expect(r.sampleVerdict.ok).toBe(false);
    expect(r.recoveryRatio).toBeLessThan(0.15);
  });

  it('discount percentage is computed against the ask price', () => {
    const r = analyzeSampleLab(base({ askPrice: 380, samplePrice: 140 }));
    const flash = r.samples.find((s) => s.channel === 'flash_online')!;
    expect(flash.discountPct).toBeGreaterThan(60);
    expect(flash.discountPct).toBeLessThan(65);
  });

  it('best channel is surfaced with a recovery ratio', () => {
    const r = analyzeSampleLab(base());
    expect(r.best!.net).toBeGreaterThan(0);
    expect(r.recoveryRatio).toBeGreaterThan(0);
  });
});

describe('launch burst model', () => {
  it('timed pre-launch sales pull most of the month into week one', () => {
    const r = analyzeSampleLab(base({ monthlySales: 100, daysAfterRelease: 0 }));
    // burst floor even off-season: 0.25*0.65 = 0.1625 → ≥16 sales
    expect(r.burst.weekOneSales).toBeGreaterThanOrEqual(16);
    expect(r.burst.weekOneSales).toBeLessThan(r.burst.tailSales + 80);
  });

  it('discounts of 45%+ reach the burst multiple while a mild discount does not', () => {
    const deep = analyzeSampleLab(base({ monthlySales: 100, samplePrice: 200, askPrice: 420, daysAfterRelease: 14 }));
    const mild = analyzeSampleLab(base({ monthlySales: 100, samplePrice: 380, daysAfterRelease: 14 }));
    expect(deep.burst.firstWeekMultiple).toBeGreaterThanOrEqual(0.68);
    expect(mild.burst.firstWeekMultiple).toBeLessThan(0.5);
    expect(deep.burst.firstWeekMultiple).toBeGreaterThan(mild.burst.firstWeekMultiple);
  });

  it('season timing inside the peak returns factor 1.0; two months off returns 0.65', () => {
    expect(seasonFactor('fall', 8)).toBe(1.0); // Sep launch for fall
    expect(seasonFactor('fall', 4)).toBe(0.65); // May launch for fall
    expect(seasonFactor('winter', 11)).toBe(1.0);
    expect(seasonFactor('summer', 5)).toBe(1.0);
  });

  it('adjacent-month launches get the mild penalty', () => {
    expect(seasonFactor('fall', 10)).toBe(0.85); // Nov launch for fall designs
  });

  it('off-season burst note cites the documented launch data', () => {
    const r = analyzeSampleLab(base(), 'fall', 4);
    expect(r.burst.note).toContain('76');
    expect(r.burst.note).toContain('109');
  });
});

describe('defaults sanity (documented market anchors)', () => {
  it('default cost basis matches the documented sweater-sample economics', () => {
    const r = analyzeSampleLab(base());
    // 30 knit hours × $15 + $75 yarn = $525
    expect(r.samples[0].costBasis).toBe(525);
    expect(r.samples[0].knitCost).toBe(450);
  });

  it('every channel note surfaces documented market data', () => {
    const r = analyzeSampleLab(base());
    for (const s of r.samples) {
      expect(s.note.length).toBeGreaterThan(10);
    }
    expect(r.keepVsSellNote).toContain('marketing asset');
  });
});
