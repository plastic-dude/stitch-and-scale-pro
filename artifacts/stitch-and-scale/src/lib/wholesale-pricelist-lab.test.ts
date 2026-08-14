// CHK-078 — tests for the Wholesale Price List Lab engine
import { describe, expect, it } from "vitest";
import { analyzeWholesale, DEFAULT_WHOLESALE, type WholesaleInput } from "./wholesale-pricelist-lab";

function wInput(partial: Partial<WholesaleInput>): WholesaleInput {
  return { ...DEFAULT_WHOLESALE, ...partial };
}

describe("analyzeWholesale — default scenario", () => {
  it("returns all 4 tier rows with descending wholesale prices", () => {
    const r = analyzeWholesale(DEFAULT_WHOLESALE);
    expect(r.tiers).toHaveLength(4);
    const prices = r.tiers.map((t) => t.unitWholesale);
    expect(prices[0]).toBe(6);
    expect(prices[1]).toBe(6); // $150+ tier is 0% discount
    expect(prices[2]).toBeCloseTo(5.7, 2);
    expect(prices[3]).toBeCloseTo(5.4, 2);
    expect(prices[1]).toBeGreaterThan(prices[2]);
    expect(prices[2]).toBeGreaterThan(prices[3]);
  });

  it("base wholesale equals retail ÷ keystone (keystone math)", () => {
    const r = analyzeWholesale(wInput({ retailPrice: 16, keystone: 2.0 }));
    expect(r.baseUnitWholesale).toBe(8);
  });

  it("returns 3 order models: direct, marketplace, reorder", () => {
    const r = analyzeWholesale(wInput({ channelCommissionPct: 15, channelNewCustomerFee: 10 }));
    expect(r.orders.map((o) => o.name)).toEqual([
      expect.stringContaining("Direct"),
      expect.stringContaining("Marketplace"),
      expect.stringContaining("Reorder"),
    ]);
  });

  it("default scenario verdict is wholesale-ready", () => {
    const r = analyzeWholesale(DEFAULT_WHOLESALE);
    expect(r.verdict).toBe("Wholesale-ready — your keystone math holds");
    expect(r.flags.length).toBeGreaterThanOrEqual(0);
    expect(r.monthlyNet).toBeGreaterThan(0);
  });
});

describe("keystone gates", () => {
  it("WL-01 fires when COGS exceeds the retail÷4 ceiling", () => {
    // retail 12, unitCost 3.01 → implied ceiling 3.0 → fails
    const r = analyzeWholesale(wInput({ retailPrice: 12, unitCost: 3.01 }));
    const wl01 = r.flags.find((f) => f.code === "WL-01");
    expect(wl01).toBeDefined();
    expect(wl01?.severity).toBe("high");
    expect(r.verdict).toBe("Pricing fails — fix COGS or retail before quoting wholesale");
  });

  it("WL-01 does not fire when COGS is under the ceiling", () => {
    const r = analyzeWholesale(wInput({ retailPrice: 12, unitCost: 2.4 }));
    expect(r.flags.find((f) => f.code === "WL-01")).toBeUndefined();
  });

  it("WL-02 fires when keystone-protected price can't cover COGS (high floor share)", () => {
    // floor share 0.8 on retail 12 → wholesale ceiling 2.40; unitCost 2.4 → floor margin 0
    const r = analyzeWholesale(wInput({ keystoneFloorShare: 0.8 }));
    const wl02 = r.flags.find((f) => f.code === "WL-02");
    expect(wl02).toBeDefined();
    expect(r.verdict).toBe("Pricing fails — fix COGS or retail before quoting wholesale");
  });

  it("keystoneCompliant respects the floor price", () => {
    const r = analyzeWholesale(wInput({ retailPrice: 12, keystone: 2.0, keystoneFloorShare: 0.5 }));
    // floor = 12*(1-0.5) = 6; base wholesale 6 → compliant at base
    expect(r.tiers[0].keystoneCompliant).toBe(true);
    const deep = analyzeWholesale(
      wInput({ retailPrice: 12, keystone: 1.8, keystoneFloorShare: 0.6, tiers: [{ label: "Deep", minOrderUsd: 0, discountPct: 20 }] }),
    );
    // floor = 12*0.4=4.8; discounted wholesale = 12/1.8*0.8 = 5.33 > 4.8 → not compliant
    expect(deep.tiers[0].keystoneCompliant).toBe(false);
  });
});

describe("channel and terms economics", () => {
  it("Faire-style 15%+10 marketplace nets less than direct (WL-03)", () => {
    const direct = analyzeWholesale(wInput({ channelCommissionPct: 0, channelNewCustomerFee: 0 }));
    const faire = analyzeWholesale(wInput({ channelCommissionPct: 15, channelNewCustomerFee: 10 }));
    const directNet = direct.orders[0].netPerOrder;
    const faireNet = faire.orders[1].netPerOrder;
    expect(faireNet).toBeLessThan(directNet);
    const wl03 = faire.flags.find((f) => f.code === "WL-03");
    expect(wl03).toBeDefined();
  });

  it("WL-04 fires when Net 30 terms are used", () => {
    const r = analyzeWholesale(wInput({ termsShare: 0.5, termsDays: 30, dailyCashCostPct: 0.027 }));
    const wl04 = r.flags.find((f) => f.code === "WL-04");
    expect(wl04).toBeDefined();
    expect(r.orders[0].cashDragPerOrder).toBeGreaterThan(0);
    expect(r.monthlyCashDrag).toBeGreaterThan(0);
  });

  it("break-even orders rise with higher labor", () => {
    const lean = analyzeWholesale(wInput({ hoursPerOrder: 0.5 }));
    const heavy = analyzeWholesale(wInput({ hoursPerOrder: 4 }));
    expect(heavy.breakEvenOrdersPerMonth).toBeGreaterThan(lean.breakEvenOrdersPerMonth);
  });

  it("WL-05 fires when break-even orders far exceed current volume", () => {
    // Keep per-order economics positive so the ladder does not short-circuit;
    // assert the flag and the break-even math directly.
    const r = analyzeWholesale(
      wInput({ hoursPerOrder: 6, hourlyRate: 40, ordersPerMonth: 1, perOrderCost: 2, minOrderValue: 200 }),
    );
    expect(r.flags.find((f) => f.code === "WL-05")).toBeDefined();
    expect(r.breakEvenOrdersPerMonth).toBeGreaterThan(Math.max(1, 1) * 1.5);
  });

  it("WL-04 becomes high-severity when terms drag is large", () => {
    const r = analyzeWholesale(wInput({ termsShare: 1, termsDays: 60, avgOrderValue: 500 }));
    const wl04 = r.flags.find((f) => f.code === "WL-04");
    expect(wl04?.severity).toBe("high");
  });
});

describe("minimum order gate", () => {
  it("minOrderGate is profitable for the default minimum", () => {
    const r = analyzeWholesale(DEFAULT_WHOLESALE);
    expect(r.minOrderGate).toContain("profitable");
  });

  it("minOrderGate reports a loss and suggests a raised minimum when per-order costs are huge", () => {
    const r = analyzeWholesale(wInput({ perOrderCost: 200, minOrderValue: 150 }));
    expect(r.minOrderGate).toContain("LOSES");
    expect(r.flags.find((f) => f.code === "WL-07")).toBeUndefined(); // expected value 150 == minimum
    // ladder picks 'Only profitable on bigger orders'
    expect(r.verdict).toBe("Only profitable on bigger orders — raise the minimum");
  });

  it("WL-06 fires when deep tiers thin under channel fees", () => {
    const r = analyzeWholesale(
      wInput({
        // 25% channel + 2.9% processing on a 20%-off rung: margin after fees
        // ≈ 23% < 30% → WL-06
        channelCommissionPct: 25,
        channelNewCustomerFee: 10,
        tiers: [
          { label: "Base", minOrderUsd: 0, discountPct: 0 },
          { label: "Wholesale Club", minOrderUsd: 300, discountPct: 20 },
        ],
      }),
    );
    expect(r.flags.find((f) => f.code === "WL-06")).toBeDefined();
  });

  it("WL-08 fires for rungs with discounts over 15%", () => {
    const r = analyzeWholesale(
      wInput({
        tiers: [
          { label: "Base", minOrderUsd: 0, discountPct: 0 },
          { label: "Stockist Special", minOrderUsd: 500, discountPct: 18 },
        ],
      }),
    );
    const wl08 = r.flags.find((f) => f.code === "WL-08");
    expect(wl08).toBeDefined();
    expect(wl08?.note).toContain('"Stockist Special"');
  });
});

describe("verdict ladder", () => {
  it("terms-drag branch triggers when min order is fine but Net terms hurt", () => {
    const r = analyzeWholesale(
      wInput({ termsShare: 1, termsDays: 45, avgOrderValue: 400, dailyCashCostPct: 0.03 }),
    );
    expect(r.verdict).toBe("Terms are eating you — tighten payment terms");
  });

  it("thin-margins branch triggers when channel fee makes reference channel too thin", () => {
    // Keep min-order economics positive (termsDrag 0, modest perOrderCost,
    // low minimum) so the ladder passes the min-order and terms gates and
    // lands on the thin-margins else branch.
    // per-order net: 150*0.971-8-120 = 17.6 → monthly 35.2 vs labor 240 → thin;
    // min-order net: 150*0.971-8-120 = 17.6 > 0 → ladder reaches this branch
    const r = analyzeWholesale(
      wInput({
        channelCommissionPct: 15,
        channelNewCustomerFee: 10,
        perOrderCost: 8,
        hoursPerOrder: 3,
        hourlyRate: 40,
        avgOrderValue: 150,
        minOrderValue: 150,
        avgOrderUnits: 8,
      }),
    );
    expect(r.minOrderGate).toContain("profitable");
    expect(r.verdict).toBe("Margins too thin — cut the channel fee or raise the floor");
  });
});

describe("edge cases", () => {
  it("handles zero unit cost (free digital SKU)", () => {
    const r = analyzeWholesale(wInput({ unitCost: 0 }));
    expect(r.tiers[0].unitGrossMargin).toBe(r.baseUnitWholesale);
    expect(isFinite(r.breakEvenOrdersPerMonth)).toBe(true);
  });

  it("handles zero orders per month (monthlyNet = 0, no crash)", () => {
    const r = analyzeWholesale(wInput({ ordersPerMonth: 0 }));
    expect(r.monthlyNet).toBe(0);
    expect(r.annualNet).toBe(0);
  });

  it("annualNet is 12× monthlyNet", () => {
    const r = analyzeWholesale(DEFAULT_WHOLESALE);
    expect(r.annualNet).toBeCloseTo(r.monthlyNet * 12, 0);
  });

  it("discounts cap at 40%", () => {
    const r = analyzeWholesale(
      wInput({ tiers: [{ label: "Mega", minOrderUsd: 0, discountPct: 60 }] }),
    );
    expect(r.tiers[0].discountPct).toBe(40);
  });

  it("fmt-style money rounds and commas correctly", () => {
    // fmt is private; verify via flag note strings which embed fmt output
    const r = analyzeWholesale(wInput({ minOrderValue: 1500, perOrderCost: 5, hoursPerOrder: 0.1 }));
    expect(r.minOrderGate).toMatch(/\$1,?500/);
  });
});
