import { describe, it, expect } from 'vitest';
import {
  buildKitCogs,
  yarnOnlyCost,
  analyzeKitChannels,
  consignmentClauseChecklist,
  generateKitProposal,
  CHANNEL_LABELS,
  type KitInput,
} from './kit-economics';
import type { PatternProject } from './grading-engine';
import type { YarnWeight } from './yarn-estimator';

// Fixture mirroring the grading-engine's measurement shape (the engine
// derives gradedValues from baseValue + the grading standard, so tests
// pass baseValue directly, exactly as yarn-estimator.test.ts does).
function demoProject(name = 'Demo Kit Sweater'): PatternProject {
  return {
    id: 'kit-demo',
    name,
    author: 'Designer',
    baseSize: 'M',
    gauge: { stitchesPer4In: 18, rowsPer4In: 24, unit: 'in' },
    sections: [
      {
        id: 'body',
        name: 'Body',
        measurements: [
          { id: 'bust', label: 'Bust Circumference', measurementType: 'circumference', gradingKey: 'bust', baseValue: 42 },
          { id: 'len', label: 'Body Length', measurementType: 'length', gradingKey: 'backLength', baseValue: 26 },
        ],
      },
      {
        id: 'sleeve',
        name: 'Sleeve',
        measurements: [
          { id: 'sleeve-len', label: 'Sleeve Length', measurementType: 'length', gradingKey: 'sleeveLength', baseValue: 17 },
        ],
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as PatternProject;
}

const baseInput: KitInput = {
  kitCogs: 36,
  retailPrice: 85,
  consignorShare: 0.6,
  processorFeePct: 0.029,
  monthlyKitSales: 8,
  monthlyConsignmentSales: 5,
  wholesaleKitsPerOrder: 12,
  monthlyWholesaleOrders: 2,
  wholesaleMarketplaceFeePct: 0,
  soloPatternIncomeMonthly: 80,
  platform: 'etsy',
};

describe('buildKitCogs', () => {
  it('computes yarn cost from the yardage model and rounds skeins up', () => {
    const cogs = buildKitCogs(demoProject(), 'worsted', 12, {
      notionsCost: 4,
      packagingCost: 3.5,
      labourHours: 1,
      labourRate: 25,
      overheadShare: 2,
    });
    // Yarn cost is skeins × price-per-skein, and the yardage model lands the
    // fixture's M worsted pullover in a sensible range (4–6 skeins ≈ 740–1110 yd).
    expect(cogs.skeins).toBeGreaterThanOrEqual(4);
    expect(cogs.skeins).toBeLessThanOrEqual(6);
    expect(cogs.yarnCost).toBeCloseTo(cogs.skeins * 12, 10);
    expect(cogs.notionsCost).toBe(4);
    expect(cogs.packagingCost).toBe(3.5);
    expect(cogs.labourCost).toBe(25);
    expect(cogs.overheadShare).toBe(2);
    expect(cogs.totalCogs).toBeCloseTo(cogs.yarnCost + 4 + 3.5 + 25 + 2, 10);
  });

  it('defaults extra costs to zero when omitted', () => {
    const cogs = buildKitCogs(demoProject(), 'DK', 10);
    expect(cogs.notionsCost).toBe(0);
    expect(cogs.totalCogs).toBeCloseTo(cogs.yarnCost, 10);
  });
});

describe('analyzeKitChannels', () => {
  it('models self-sell through the shared platformNet seam', () => {
    const econ = analyzeKitChannels(baseInput);
    const self = econ.channels.find(c => c.channel === 'self-sell')!;
    // Etsy: net per sale at $85 is 85 × (1 − 0.065 − 0.03) − 0.20 − 0.25 ≈ 75.40
    expect(self.netPerKit).toBeCloseTo(85 * (1 - 0.065 - 0.03) - 0.2 - 0.25, 2);
    expect(self.takePct).toBeGreaterThan(80);
    expect(self.takePct).toBeLessThan(95);
  });

  it('models consignment as processor-off-top then 60/40 split', () => {
    const econ = analyzeKitChannels(baseInput);
    const cons = econ.channels.find(c => c.channel === 'consignment')!;
    // 85 × (1 − 0.029) × 0.6 ≈ 49.76
    expect(cons.netPerKit).toBeCloseTo(85 * (1 - 0.029) * 0.6, 2);
    expect(cons.takePct).toBeCloseTo((cons.netPerKit / 85) * 100, 1);
  });

  it('models wholesale at keystone retail ÷ 2', () => {
    const econ = analyzeKitChannels(baseInput);
    const ws = econ.channels.find(c => c.channel === 'wholesale')!;
    expect(ws.netPerKit).toBeCloseTo(85 / 2, 2);
    // Monthly = per-kit × 12 kits/order × 2 orders
    expect(ws.monthlyNet).toBeCloseTo((85 / 2) * 12 * 2, 1);
  });

  it('applies a Faire-style marketplace fee to wholesale when present', () => {
    const econ = analyzeKitChannels({ ...baseInput, wholesaleMarketplaceFeePct: 0.15 });
    const ws = econ.channels.find(c => c.channel === 'wholesale')!;
    expect(ws.netPerKit).toBeCloseTo((85 / 2) * 0.85, 1);
  });

  it('picks the best channel by monthly net and compares against the baseline', () => {
    const econ = analyzeKitChannels(baseInput);
    expect(econ.bestChannel).not.toBeNull();
    expect(econ.beatsBaseline).toBe(econ.bestMonthlyNet > 80);
    // Wholesale at 2 orders × 12 kits × $42.50 = $1,020/mo clearly beats $80
    expect(econ.bestChannel).toBe('wholesale');
    expect(econ.beatsBaseline).toBe(true);
  });

  it('returns null best channel when nothing sells', () => {
    const econ = analyzeKitChannels({ ...baseInput, monthlyKitSales: 0, monthlyConsignmentSales: 0, monthlyWholesaleOrders: 0 });
    expect(econ.bestChannel).toBeNull();
    expect(econ.bestMonthlyNet).toBe(0);
  });

  it('computes kits-to-match-baseline from per-kit net', () => {
    const econ = analyzeKitChannels(baseInput);
    const cons = econ.channels.find(c => c.channel === 'consignment')!;
    expect(cons.kitsToMatchBaseline).toBe(Math.ceil(80 / cons.netPerKit));
  });
});

describe('capacity checks', () => {
  it('fails the keystone capacity test when COGS exceeds retail ÷ 4', () => {
    const econ = analyzeKitChannels({ ...baseInput, kitCogs: 30, retailPrice: 100 });
    expect(econ.capacity.keystoneCapacity).toBe(false);
    expect(econ.capacity.cogsSharePct).toBe(30);
  });

  it('passes the keystone capacity test for a healthy cost stack', () => {
    const econ = analyzeKitChannels({ ...baseInput, kitCogs: 20, retailPrice: 100 });
    expect(econ.capacity.keystoneCapacity).toBe(true);
    expect(econ.capacity.cogsSharePct).toBe(20);
  });

  it('flags convenience premium when retail exceeds 1.8× yarn cost', () => {
    const cogs = buildKitCogs(demoProject(), 'worsted', 12);
    const econ = analyzeKitChannels({ ...baseInput, kitCogs: cogs.totalCogs, retailPrice: 200 });
    expect(econ.capacity.conveniencePremiumWarning).toBe(true);
    // retailToYarnMultiple compares retail to yarn-only cost, not full COGS —
    // the convenience flag uses yarn cost as the DIY anchor the buyer sees.
    const yards = cogs.totalCogs > 0 ? 200 / cogs.yarnCost : 0;
    expect(econ.capacity.retailToYarnMultiple).toBeCloseTo(yards, 1);
  });

  it('clears the convenience warning at a modest multiple', () => {
    const econ = analyzeKitChannels({ ...baseInput, kitCogs: 40, retailPrice: 60 });
    expect(econ.capacity.conveniencePremiumWarning).toBe(false);
    expect(econ.capacity.retailToYarnMultiple).toBeCloseTo(1.5, 10);
  });
});

describe('generators', () => {
  it('lists all six consignment clauses with the negotiated split', () => {
    const clauses = consignmentClauseChecklist({ shopName: 'The Wool Room', consignorShare: 0.6, paymentTermDays: 14, unsoldReturnDays: 60 });
    expect(clauses.length).toBe(6);
    expect(clauses[0]).toContain('60/40');
    expect(clauses[1]).toContain('14 days');
    expect(clauses[2]).toContain('60 days');
    expect(clauses[3]).toMatch(/price band/i);
    expect(clauses[4]).toMatch(/copyright|copyrighted/i);
  });

  it('defaults clauses to standard terms', () => {
    const clauses = consignmentClauseChecklist();
    expect(clauses[0]).toContain('60/40');
    expect(clauses[1]).toContain('30 days');
  });

  it('generates a proposal with both channel options and keystone wholesale price', () => {
    const letter = generateKitProposal(demoProject('Woolly Pullover'), 90, 45, { shopName: 'Wool & Co', designerName: 'Ada' });
    expect(letter).toContain('Woolly Pullover');
    expect(letter).toContain('Wool & Co');
    expect(letter).toContain('$90.00');
    expect(letter).toContain('$45.00');
    expect(letter).toContain('keystone');
    expect(letter).toContain('60/40');
    expect(letter).toContain('Ada');
  });

  it('renders channel labels for all three channels', () => {
    for (const ch of Object.keys(CHANNEL_LABELS) as Array<keyof typeof CHANNEL_LABELS>) {
      expect(CHANNEL_LABELS[ch]).toBeTruthy();
    }
  });
});

describe('cross-library consistency', () => {
  it('yarn-only cost matches buildKitCogs yarn cost with zero extras', () => {
    const p = demoProject();
    const w: YarnWeight = 'worsted';
    expect(yarnOnlyCost(p, w, 11)).toBeCloseTo(buildKitCogs(p, w, 11).yarnCost, 10);
  });
});
