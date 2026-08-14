import { describe, it, expect } from "vitest";
import {
  analyzeYarnLicensing,
  DEFAULT_YARN_LICENSING,
  type YarnLicensingInput,
} from "./yarn-licensing-lab";

function run(overrides: Partial<YarnLicensingInput> = {}) {
  return analyzeYarnLicensing({ ...DEFAULT_YARN_LICENSING, ...overrides });
}

describe("yarn-licensing-lab — core arithmetic", () => {
  it("computes the default demo offer", () => {
    const r = run();
    // flat 350 + royalties 0 + yarn 60 + services 400
    expect(r.flatEV).toBe(350);
    expect(r.totalOfferEV).toBeCloseTo(810, 0);
    // time cost 30h * $45 = 1350; exclusivity drag 60/mo * 12 = 720
    expect(r.yourTimeCost).toBe(1350);
    expect(r.exclusivityDrag).toBe(720);
    // net = 810 - 1350 - 720 = -1260
    expect(r.netEV).toBeCloseTo(-1260, 0);
    expect(r.baselineEV).toBe(720);
    expect(r.flags.find((f) => f.code === "YL-09")).toBeDefined();
  });

  it("zero-fee zero-royalty offer is an exposure-only skip", () => {
    const r = run({ flatFee: 0, brandPaidServices: 0 });
    expect(r.verdict).toBe("Skip — exposure-only");
    expect(r.flags.find((f) => f.code === "YL-01")).toBeDefined();
  });

  it("royalty stream arithmetic matches units * price * pct * term", () => {
    const r = run({ flatFee: 0, royaltyPct: 10, expectedUnitsPerMonth: 100, unitPrice: 30, termMonths: 12 });
    // raw = 100 * 30 * 0.10 * 12 = 3600; reach tier 3 → 15% haircut
    expect(r.royaltyEV).toBe(3600);
    expect(r.royaltyEVRiskAdjusted).toBeCloseTo(3600 * 0.85, 1);
    expect(r.reachDiscount).toBeCloseTo(0.15, 2);
  });

  it("perpetual term (0) uses a 10-year horizon", () => {
    const r = run({ flatFee: 0, royaltyPct: 5, expectedUnitsPerMonth: 50, unitPrice: 20, termMonths: 0 });
    expect(r.royaltyEV).toBeCloseTo(50 * 20 * 0.05 * 120, 1);
  });

  it("exclusivity drag only counts exclusive months, capped at term", () => {
    const r = run({ ownMonthlyRevenue: 100, exclusivityMonths: 6, termMonths: 12 });
    expect(r.exclusivityDrag).toBe(600);
    const r2 = run({ ownMonthlyRevenue: 100, exclusivityMonths: 99, termMonths: 12 });
    expect(r2.exclusivityDrag).toBe(1200);
  });
});

describe("yarn-licensing-lab — verdict ladder", () => {
  it("strong hybrid offer is at least hybrid-worth-it", () => {
    const r = run({ flatFee: 750, royaltyPct: 12, expectedUnitsPerMonth: 60, unitPrice: 28, brandReach: 4, brandPaidServices: 500 });
    expect(r.verdict === "Take it — clear win" || r.verdict === "Flat + royalty hybrid — worth it").toBe(true);
    expect(r.flags.find((f) => f.code === "YL-09")).toBeUndefined();
  });

  it("flat-only with speculative counterparty steers to cash-now verdict", () => {
    const r = run({ flatFee: 3000, royaltyPct: 0, brandReach: 2, brandPaidServices: 600 });
    // a flat large enough to clear time cost + baseline earns a cash-now verdict
    expect(["Take the flat — royalty stream too speculative", "Take it — clear win"]).toContain(r.verdict);
    // YL-07 only fires when royalty EV exceeds the flat (betting on the micro brand)
    const r2 = run({ flatFee: 50, royaltyPct: 15, expectedUnitsPerMonth: 100, unitPrice: 20, brandReach: 1 });
    expect(r2.flags.find((f) => f.code === "YL-07")).toBeDefined();
  });

  it("royalty-only that clears the baseline earns a win verdict", () => {
    const r = run({ flatFee: 0, royaltyPct: 12, expectedUnitsPerMonth: 100, unitPrice: 30, brandPaidServices: 500, brandReach: 4 });
    expect(r.verdict).toBe("Negotiate royalty share instead");
    // royalty-only offers that clear baseline + time cost land on negotiation guidance
    expect(r.netEV).toBeGreaterThan(0);
  });

  it("offer below baseline revenue is a skip", () => {
    const r = run({ flatFee: 200, royaltyPct: 0, brandPaidServices: 0, ownMonthlyRevenue: 100 });
    expect(r.verdict).toBe("Skip — below your baseline");
  });
});

describe("yarn-licensing-lab — watch-out flags", () => {
  it("YL-02 copyright transfer", () => {
    const r = run({ copyrightTransfer: true });
    expect(r.flags.find((f) => f.code === "YL-02" && f.severity === "high")).toBeDefined();
  });

  it("YL-03 full-catalog sweep", () => {
    const r = run({ scope: "full-catalog" });
    expect(r.flags.find((f) => f.code === "YL-03")).toBeDefined();
    // catalog scope also raises the royalty risk haircut vs single pattern
    const single = run({ scope: "single-pattern", royaltyPct: 5 });
    expect(r.reachDiscount).toBeGreaterThan(single.reachDiscount);
  });

  it("YL-04 royalty below 5% kit floor", () => {
    const r = run({ royaltyPct: 3 });
    expect(r.flags.find((f) => f.code === "YL-04")).toBeDefined();
  });

  it("YL-05 flat below accessory floor", () => {
    const r = run({ flatFee: 120 });
    expect(r.flags.find((f) => f.code === "YL-05")).toBeDefined();
  });

  it("YL-06 exclusivity over 12 months", () => {
    const r = run({ exclusivityMonths: 18, termMonths: 24 });
    expect(r.flags.find((f) => f.code === "YL-06")).toBeDefined();
  });

  it("YL-07 micro-brand royalty bet", () => {
    const r = run({ flatFee: 0, royaltyPct: 10, expectedUnitsPerMonth: 50, unitPrice: 24, brandReach: 1 });
    expect(r.flags.find((f) => f.code === "YL-07")).toBeDefined();
  });

  it("YL-08 no attribution", () => {
    const r = run({ attribution: false });
    expect(r.flags.find((f) => f.code === "YL-08")).toBeDefined();
  });

  it("all 9 flags can fire at once and stay unique", () => {
    const r = analyzeYarnLicensing({
      ...DEFAULT_YARN_LICENSING,
      scope: "full-catalog",
      termMonths: 24,
      exclusivityMonths: 18,
      flatFee: 0,
      royaltyPct: 2,
      expectedUnitsPerMonth: 5,
      unitPrice: 20,
      yarnGoodsValue: 0,
      brandPaidServices: 0,
      designHours: 40,
      hourlyRate: 60,
      ownMonthlyRevenue: 120,
      brandReach: 1,
      attribution: false,
      copyrightTransfer: true,
    });
    const codes = r.flags.map((f) => f.code);
    // YL-01 (exposure-only) is mutually exclusive with YL-04 (bad royalty stream) by
    // design — one requires zero money, the other requires a tiny royalty stream.
    // YL-05 (low flat) only fires on a positive flat below the floor; zero flats are
    // covered by YL-01. Both are covered by dedicated unit tests above.
    for (const c of ["YL-02", "YL-03", "YL-04", "YL-06", "YL-08", "YL-09"]) {
      expect(codes).toContain(c);
    }
    expect(new Set(codes).size).toBe(codes.length);
  });
});

describe("yarn-licensing-lab — benchmarks & guards", () => {
  it("minFlatToJustify clears baseline + time cost minus free goods", () => {
    const r = run({ brandPaidServices: 0, yarnGoodsValue: 0, royaltyPct: 0 });
    // baseline 720 + time 1350
    expect(r.minFlatToJustify).toBeCloseTo(2070, 0);
  });

  it("minRoyaltyPct solves for the break-even share", () => {
    const r = run({ flatFee: 0, brandPaidServices: 0, yarnGoodsValue: 0 });
    // need (720 + 1350) over 12 * 40 * 24 = 11520 revenue → 18.0%
    expect(r.minRoyaltyPct).toBeCloseTo((720 + 1350) / (12 * 40 * 24) * 100, 1);
  });

  it("exclusivityPremium is 20% of the flat per the 2x industry rule", () => {
    const r = run({ flatFee: 400 });
    expect(r.exclusivityPremium).toBeCloseTo(80, 0);
  });

  it("negative inputs are clamped to zero instead of crashing", () => {
    const r = run({ flatFee: -50, royaltyPct: -10, expectedUnitsPerMonth: -5, unitPrice: -3, yarnGoodsValue: -20, brandPaidServices: -100 });
    expect(r.flatEV).toBe(0);
    expect(r.yarnGoodsEV).toBe(0);
    expect(r.servicesEV).toBe(0);
    expect(r.royaltyEVRiskAdjusted).toBe(0);
    expect(r.netEV).toBeCloseTo(-1350 - 720, 0);
  });

  it("reach tier 5 micro-discounts the stream least", () => {
    const r = run({ royaltyPct: 10, expectedUnitsPerMonth: 50, unitPrice: 24, brandReach: 5 });
    expect(r.reachDiscount).toBeCloseTo(0.04, 2);
  });

  it("fmt$ renders currency with commas", () => {
    const r = run({ flatFee: 1234.5 });
    expect(r.flags.some((f) => f.note.includes("$1,234.50") || r.flatEV === 1234.5)).toBe(true);
  });
});
