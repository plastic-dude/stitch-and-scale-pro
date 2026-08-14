// CHK-076 — Regional Pricing Lab engine tests
import { describe, expect, it } from "vitest";
import {
  DEFAULT_INTL_PRICING,
  analyzeIntlPricing,
} from "@/lib/intl-pricing-lab";

function withMarkets(overrides: Partial<typeof DEFAULT_INTL_PRICING> = {}) {
  return { ...DEFAULT_INTL_PRICING, ...overrides };
}

describe("analyzeIntlPricing — defaults", () => {
  const r = analyzeIntlPricing(withMarkets());

  it("returns one result per market", () => {
    expect(r.markets).toHaveLength(DEFAULT_INTL_PRICING.markets.length);
  });

  it("US market nets the anchor minus platform and FX only", () => {
    const us = r.markets.find((m) => m.currency === "USD")!;
    const net = 9 * (1 - 0.05 - 0.029);
    expect(us.currentNetPerSale).toBeCloseTo(net, 4);
    expect(us.parityPriceString).toBe("$9.00");
  });

  it("parity price for weak-PPP markets is lower than the USD anchor", () => {
    const india = r.markets.find((m) => m.currency === "INR")!;
    expect(india.parityNetPerSale).toBeGreaterThan(0);
    expect(india.parityNetPerSale).toBeLessThan(r.markets[0].parityNetPerSale);
    // ₹10 × 0.3 PPP = $3 USD-equivalent, far below the $9 anchor
    expect(india.parityNetPerSale).toBeGreaterThan(0);
    expect(india.parityNetPerSale).toBeLessThan(4);
  });

  it("demand multiplier is >= 1 for markets with PPP < 1", () => {
    for (const m of r.markets) {
      expect(m.demandMultiplier).toBeGreaterThanOrEqual(1);
      if (Math.abs(m.pppIndex - 1) < 0.01) expect(m.demandMultiplier).toBeCloseTo(1, 9);
      else expect(m.demandMultiplier).toBeGreaterThan(1);
    }
  });

  it("parity revenue beats flat revenue with default elasticity", () => {
    expect(r.totalParityMonthly).toBeGreaterThan(r.totalCurrentMonthly);
    expect(r.liftPct).toBeGreaterThan(0);
    expect(r.annualRevenueLift).toBeCloseTo((r.totalParityMonthly - r.totalCurrentMonthly) * 12, 6);
  });

  it("parity prices are rounded to sensible local endings", () => {
    const us = r.markets.find((m) => m.currency === "USD")!;
    expect(us.parityPriceString).toMatch(/^\$\d+(\.\d{2})?$/);
    const india = r.markets.find((m) => m.currency === "INR")!;
    // INR steps are whole numbers (10/20/50/99) — parity at 9*0.3 = 2.7 → 10... or min step
    expect(Number.isInteger(parseFloat(india.parityPriceString.replace(/[^\d.]/g, "")))).toBe(true);
  });

  it("FX leak aggregates across markets", () => {
    expect(r.totalFxLeakMonthly).toBeGreaterThan(0);
    expect(r.totalFxLeakAnnual).toBeCloseTo(r.totalFxLeakMonthly * 12, 6);
  });
});

describe("analyzeIntlPricing — elasticity and abuse", () => {
  it("zero elasticity prices parity at the PPP discount with no demand response", () => {
    const r = analyzeIntlPricing(withMarkets({ elasticity: 0, abuseRate: 0 }));
    // With elasticity 0 the demand multiplier collapses to the price ratio:
    // weak markets earn now × ppp, rich markets (no discount) earn now.
    for (const m of r.markets) {
      const expected = m.pppIndex <= 1 ? m.pppIndex : 1;
      expect(m.monthlyRevenueParity / m.monthlyRevenueNow).toBeCloseTo(expected, 4);
    }
  });

  it("higher elasticity increases parity revenue", () => {
    const low = analyzeIntlPricing(withMarkets({ elasticity: 0.2 }));
    const high = analyzeIntlPricing(withMarkets({ elasticity: 0.9 }));
    expect(high.totalParityMonthly).toBeGreaterThan(low.totalParityMonthly);
  });

  it("abuse rate reduces parity revenue linearly", () => {
    const r0 = analyzeIntlPricing(withMarkets({ abuseRate: 0 }));
    const r5 = analyzeIntlPricing(withMarkets({ abuseRate: 5 }));
    expect(r5.totalParityMonthly).toBeCloseTo(r0.totalParityMonthly * 0.95, 4);
  });
});

describe("analyzeIntlPricing — flags", () => {
  it("fires IP-02 high when FX leak exceeds 4% of revenue", () => {
    const r = analyzeIntlPricing(
      withMarkets({
        markets: [
          { country: "United Kingdom", currency: "GBP", pppIndex: 0.86, share: 0.5, buyersPerMonth: 50, fxFee: 0.06 },
        ],
        currentMonthlyRevenue: 300,
      }),
    );
    expect(r.flags.some((f) => f.code === "IP-02" && f.severity === "high")).toBe(true);
  });

  it("fires IP-04 for strong-PPP undercharging", () => {
    const r = analyzeIntlPricing(
      withMarkets({
        markets: [{ country: "Switzerland", currency: "CHF", pppIndex: 1.25, share: 0.3, buyersPerMonth: 30, fxFee: 0.03 }],
      }),
    );
    expect(r.flags.some((f) => f.code === "IP-04")).toBe(true);
  });

  it("fires IP-05 for weak-PPP priced-out markets", () => {
    const r = analyzeIntlPricing(
      withMarkets({
        markets: [{ country: "India", currency: "INR", pppIndex: 0.3, share: 0.2, buyersPerMonth: 20, fxFee: 0.07 }],
      }),
    );
    expect(r.flags.some((f) => f.code === "IP-05")).toBe(true);
  });

  it("fires IP-01 when international share is below 15%", () => {
    const r = analyzeIntlPricing(
      withMarkets({
        markets: [
          { country: "United States", currency: "USD", pppIndex: 1, share: 0.9, buyersPerMonth: 90, fxFee: 0.029 },
          { country: "Germany", currency: "EUR", pppIndex: 0.78, share: 0.1, buyersPerMonth: 10, fxFee: 0.045 },
        ],
      }),
    );
    expect(r.flags.some((f) => f.code === "IP-01")).toBe(true);
  });

  it("fires IP-08 on high platform take", () => {
    const r = analyzeIntlPricing(withMarkets({ platformFeePct: 20 }));
    expect(r.flags.some((f) => f.code === "IP-08")).toBe(true);
  });

  it("fires IP-06 on low abuse setting", () => {
    const r = analyzeIntlPricing(withMarkets({ abuseRate: 1 }));
    expect(r.flags.some((f) => f.code === "IP-06")).toBe(true);
  });

  it("fires IP-07 on low elasticity", () => {
    const r = analyzeIntlPricing(withMarkets({ elasticity: 0.1 }));
    expect(r.flags.some((f) => f.code === "IP-07")).toBe(true);
  });

  it("fires IP-03 when domestic share is under 40%", () => {
    const r = analyzeIntlPricing(
      withMarkets({
        markets: [
          { country: "United Kingdom", currency: "GBP", pppIndex: 0.86, share: 0.55, buyersPerMonth: 55, fxFee: 0.045 },
          { country: "Germany", currency: "EUR", pppIndex: 0.78, share: 0.45, buyersPerMonth: 45, fxFee: 0.045 },
        ],
      }),
    );
    expect(r.flags.some((f) => f.code === "IP-03")).toBe(true);
  });
});

describe("analyzeIntlPricing — verdict ladder", () => {
  it("skips when audience is nearly domestic", () => {
    const r = analyzeIntlPricing(
      withMarkets({
        markets: [{ country: "United States", currency: "USD", pppIndex: 1, share: 0.95, buyersPerMonth: 95, fxFee: 0.029 }],
      }),
    );
    expect(r.verdict).toBe("Skip — your audience is nearly all domestic");
  });

  it("prefers FX-route fix when leak dominates a marginal lift", () => {
    const r = analyzeIntlPricing(
      withMarkets({
        elasticity: 0.1,
        markets: [
          { country: "United States", currency: "USD", pppIndex: 1, share: 0.3, buyersPerMonth: 30, fxFee: 0.029 },
          { country: "Brazil", currency: "BRL", pppIndex: 0.48, share: 0.35, buyersPerMonth: 35, fxFee: 0.12 },
          { country: "India", currency: "INR", pppIndex: 0.3, share: 0.35, buyersPerMonth: 35, fxFee: 0.12 },
        ],
        currentMonthlyRevenue: 100,
      }),
    );
    expect(r.verdict).toBe("Parity is marginal — fix the FX route first");
  });

  it("tiers the anchor when strong-PPP markets don't add lift", () => {
    const r = analyzeIntlPricing(
      withMarkets({
        elasticity: 0.0,
        markets: [{ country: "Switzerland", currency: "CHF", pppIndex: 1.2, share: 0.6, buyersPerMonth: 60, fxFee: 0.03 }],
      }),
    );
    expect(r.verdict).toBe("Tier the anchor — you're undercharging strong-PPP markets");
  });

  it("enables parity tiers on a solid lift", () => {
    const r = analyzeIntlPricing(
      withMarkets({
        markets: [
          { country: "United States", currency: "USD", pppIndex: 1, share: 0.5, buyersPerMonth: 50, fxFee: 0.029 },
          { country: "India", currency: "INR", pppIndex: 0.3, share: 0.5, buyersPerMonth: 50, fxFee: 0.07 },
        ],
        elasticity: 0.8,
      }),
    );
    expect(r.liftPct).toBeGreaterThan(5);
    expect(r.verdict).toBe("Enable parity tiers — lift wins on your international share");
  });
});

describe("analyzeIntlPricing — clamping and edge cases", () => {
  it("clamps negative shares and extreme PPP", () => {
    const r = analyzeIntlPricing(
      withMarkets({
        markets: [{ country: "A", currency: "USD", pppIndex: 99, share: -0.5, buyersPerMonth: 0, fxFee: 2 }],
        platformFeePct: 200,
      }),
    );
    expect(r.markets[0].pppIndex).toBe(2.5);
    // fxFee 2 clamps to 0.5 and platformFeePct 200 clamps to 50%: net = 9 × (1 - 0.5 - 0.5) = 0
    expect(r.markets[0].currentNetPerSale).toBeCloseTo(0, 9);
    // Negative share clamps to 0, so monthlyNow and the FX leak are both 0;
    // with a non-positive current net per sale, parity revenue is guarded to 0.
    expect(r.markets[0].monthlyRevenueNow).toBe(0);
    expect(r.markets[0].monthlyRevenueParity).toBe(0);
    expect(r.markets[0].fxLeakMonthly).toBe(0);
  });

  it("handles zero revenue without crashing", () => {
    const r = analyzeIntlPricing(withMarkets({ currentMonthlyRevenue: 0 }));
    expect(r.totalCurrentMonthly).toBe(0);
    expect(r.flags.some((f) => f.code === "IP-02" && f.severity === "high")).toBe(false);
  });

  it("anchor note matches the platform", () => {
    expect(analyzeIntlPricing(withMarkets({ platform: "ravelry" })).anchorNote).toMatch(/Ravelry/);
    expect(analyzeIntlPricing(withMarkets({ platform: "lovecrafts" })).anchorNote).toMatch(/LoveCrafts/);
    expect(analyzeIntlPricing(withMarkets({ platform: "etsy" })).anchorNote).toMatch(/Etsy/);
    expect(analyzeIntlPricing(withMarkets({ platform: "gumroad-payhip" })).anchorNote).toMatch(/parity/);
  });
});
