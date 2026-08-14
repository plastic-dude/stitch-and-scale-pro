import { describe, it, expect } from 'vitest';
import {
  analyzeLicenseOffer,
  DEFAULT_DESIGN_RATE,
  EXCLUSIVE_FLOOR_MULTIPLE,
  LICENCE_LABELS,
} from './pattern-license-planner';
import { PatternProject } from '@/lib/grading-engine';

const baseProject: PatternProject = {
  id: 'p1',
  name: 'Demo Crewneck Sweater',
  brand: 'Stitch & Scale Demo',
  yarnBrand: '',
  yarnLine: '',
  yarnColorway: '',
  yarnWeight: 'worsted',
  needleSizeUS: '8',
  needleSizeMM: '5',
  gaugeSts: 18,
  gaugeRows: 24,
  gaugeInches: 4,
  sections: [
    {
      id: 's1',
      name: 'Body',
      sizes: ['XS', 'S', 'M', 'L', 'XL'],
      measurements: [
        { id: 'm1', label: 'Chest', measurementType: 'circumference', gradingKey: 'bust', baseValue: 38, unit: 'in' },
        { id: 'm2', label: 'Length', measurementType: 'length', gradingKey: 'backLength', baseValue: 25, unit: 'in' },
        { id: 'm3', label: 'Armhole', measurementType: 'length', gradingKey: 'armholeDepth', baseValue: 8.5, unit: 'in' },
      ],
    },
    {
      id: 's2',
      name: 'Sleeve',
      sizes: ['XS', 'S', 'M', 'L', 'XL'],
      measurements: [
        { id: 'm4', label: 'Sleeve', measurementType: 'length', gradingKey: 'sleeveLength', baseValue: 18, unit: 'in' },
        { id: 'm5', label: 'Bicep', measurementType: 'circumference', gradingKey: 'bicep', baseValue: 13, unit: 'in' },
      ],
    },
  ],
  measurements: [],
  notes: '',
} as unknown as PatternProject;

function baseOffer(): ReturnType<typeof Object.assign> extends never ? never : never {
  throw new Error('never used');
}

const DEFAULT_OFFER = {
  type: 'nonExclusive' as const,
  fee: 150,
  royaltyPercent: 0,
  licensorMonthlySales: 0,
  exclusivityMonths: 0,
  licensorPaysProduction: true,
  productionCost: 0,
  marketingIncluded: false,
  derivativeRightsTransferred: false,
  worldwide: false,
  paymentTimingMonths: 0,
  creditAndPromotionRights: true,
};

function run(partialOffer: Partial<typeof DEFAULT_OFFER> = {}, sales = 40) {
  return analyzeLicenseOffer({
    project: baseProject,
    yarnWeight: 'worsted',
    platform: 'ravelry',
    price: 8,
    monthlySales: sales,
    designRate: DEFAULT_DESIGN_RATE,
    effortHours: 55,
    horizonMonths: 24,
    offer: { ...DEFAULT_OFFER, ...partialOffer },
  });
}

describe('analyzeLicenseOffer', () => {
  it('returns go for a fair non-exclusive fee above the labour floor', () => {
    const r = run({ fee: 1500 });
    expect(r.verdict).toBe('go');
    // Ravelry net ~$5.70/sale × 40/mo × 0 window → selfSell 0; fee 1500 > labour floor 1375
    expect(r.selfSellValue).toBe(0); // no exclusivity → no window cost
    expect(r.licensorIncomeValue).toBe(1500);
    expect(r.rightsScore).toBe(8);
  });

  it('flags a decent-but-small fee as below the labour floor', () => {
    const r = run({ fee: 150 });
    expect(r.verdict).toBe('no'); // fee 150 << 55h × $25 labour floor
    expect(r.selfSellValue).toBe(0); // no exclusivity → no window cost
    expect(r.licensorIncomeValue).toBe(150);
    expect(r.rightsScore).toBe(8); // rights are fine; the price is the problem
  });

  it('flags a fee below the $80–140 band in the rights audit', () => {
    const r = run({ fee: 50 });
    const feeCheck = r.rightsAudit.find(c => c.check === 'Fee + royalty structure');
    expect(feeCheck?.pass).toBe(false);
    expect(feeCheck?.note).toContain('80–140');
  });

  it('scores an exclusivity window above 12 months as a failed check', () => {
    const r = run({ type: 'royaltyExclusive', fee: 200, exclusivityMonths: 18 });
    const winCheck = r.rightsAudit.find(c => c.check.includes('Exclusivity window'));
    expect(winCheck?.pass).toBe(false);
    // 18 months of window cost at ~$5.70 × 40/mo = ~$4,100 self-sell lost
    expect(r.selfSellValue).toBeGreaterThan(4000);
  });

  it('flags a buyout priced without the multiple floor', () => {
    const r = run({ type: 'exclusiveBuyout', fee: 300 });
    // The raw $300 fee is far under 4× the self-sell window, so the rights audit
    // flags it; verdict must never be 'go' at a fee this low.
    expect(r.verdict).not.toBe('go');
    const multCheck = r.rightsAudit.find(c => c.check.includes('Buyout price multiple'));
    expect(multCheck?.pass).toBe(false);
    expect(r.selfSellValue).toBeGreaterThan(4000);
    expect(r.selfSellValue * 4).toBeGreaterThan(20000);
  });

  it('forces a no when a low-fee buyout also fails rights checks', () => {
    const r = run({
      type: 'exclusiveBuyout', fee: 300, paymentTimingMonths: 6, worldwide: true,
      derivativeRightsTransferred: true, creditAndPromotionRights: false,
    });
    expect(r.verdict).toBe('no');
  });

  it('passes a properly-priced buyout', () => {
    const r = run({ type: 'exclusiveBuyout', fee: 22000 });
    expect(r.verdict).toBe('go');
    const multCheck = r.rightsAudit.find(c => c.check.includes('Buyout price multiple'));
    expect(multCheck?.pass).toBe(true);
  });

  it('penalises royalty-only offers with no minimum fee', () => {
    const r = run({
      type: 'royaltyNonExclusive',
      fee: 0,
      royaltyPercent: 15,
      licensorMonthlySales: 100,
    });
    // licensorIncome = 15% × 5.70 × 100 × 24 × 0.9 ≈ 1,846
    expect(r.licensorIncomeValue).toBeGreaterThan(1500);
    const feeCheck = r.rightsAudit.find(c => c.check === 'Fee + royalty structure');
    expect(feeCheck?.pass).toBe(true);
    expect(r.verdict).toBe('go');
  });

  it('penalises derivative-rights transfer and missing credit rights', () => {
    const r = run({ derivativeRightsTransferred: true, creditAndPromotionRights: false });
    expect(r.rightsAudit.filter(c => !c.pass).length).toBeGreaterThanOrEqual(2);
    const derivCheck = r.rightsAudit.find(c => c.check.includes('Derivative'));
    expect(derivCheck?.pass).toBe(false);
    expect(derivCheck?.note).toContain('size expansions');
  });

  it('penalises worldwide non-buyout licences and slow payment', () => {
    const r = run({ worldwide: true, paymentTimingMonths: 6 });
    expect(r.rightsAudit.filter(c => !c.pass).length).toBeGreaterThanOrEqual(2);
    const payCheck = r.rightsAudit.find(c => c.check.includes('Payment schedule'));
    expect(payCheck?.pass).toBe(false);
    const terrCheck = r.rightsAudit.find(c => c.check.includes('Territory'));
    expect(terrCheck?.pass).toBe(false);
  });

  it('charges production costs to the designer when the licensor does not cover them', () => {
    const covered = run({ licensorPaysProduction: true });
    const notCovered = run({ licensorPaysProduction: false, productionCost: 120 });
    expect(notCovered.licensorIncomeValue).toBe(covered.licensorIncomeValue - 120);
    expect(
      notCovered.rightsAudit.find(c => c.check === 'Production costs carried by licensor')?.pass,
    ).toBe(false);
  });

  it('judges an unknown pattern by labour hours, not a sales projection', () => {
    const r = run({}, 0);
    expect(r.selfSellValue).toBe(0);
    expect(r.notes.some(n => n.includes('$12/hr floor'))).toBe(true);
    // With sales 0, fee 150 vs labour 55×25=1375 → verdict no (fee far below labour value)
    expect(r.verdict).toBe('no');
  });

  it('generates a counteroffer letter when the fee is below floor', () => {
    const r = run({ fee: 50 });
    expect(r.verdict).not.toBe('go');
    expect(r.offerLetter).toContain('Thanks so much for the offer');
    expect(r.offerLetter.includes('buyout rate')).toBe(r.type === 'exclusiveBuyout');
  });

  it('generates an acceptance letter when terms land well', () => {
    const r = run({ fee: 1500 });
    expect(r.verdict).toBe('go');
    expect(r.offerLetter).toContain('terms land well');
    expect(r.offerLetter).toContain('1500');
  });

  it('generates a counteroffer letter for a below-floor fee', () => {
    const r = run({ fee: 150 });
    expect(r.verdict).toBe('no');
    expect(r.offerLetter).toContain('Thanks so much for the offer');
    expect(r.offerLetter).toContain('self-sell baseline');
  });
});

describe('labels and constants', () => {
  it('labels all five licence types', () => {
    expect(Object.keys(LICENCE_LABELS).length).toBe(5);
    expect(LICENCE_LABELS.exclusiveBuyout).toContain('buyout');
  });

  it('keeps the exclusive multiple at the industry floor', () => {
    expect(EXCLUSIVE_FLOOR_MULTIPLE).toBe(4);
  });
});
