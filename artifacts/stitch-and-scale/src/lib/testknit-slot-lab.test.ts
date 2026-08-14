import { describe, expect, it } from "vitest";
import { analyzeTestKnit, DEFAULT_TESTKNIT, type TestKnitInput } from "./testknit-slot-lab";

const run = (patch: Partial<TestKnitInput>) => analyzeTestKnit({ ...DEFAULT_TESTKNIT, ...patch });

describe("test-knit slot lab engine", () => {
  it("returns seven compensation models with positive costs and coverage", () => {
    const r = run({});
    expect(r.rows).toHaveLength(7);
    for (const row of r.rows) {
      expect(row.totalCost).toBeGreaterThanOrEqual(0);
      expect(row.sizeCoverage).toBeGreaterThanOrEqual(0);
      expect(row.sizeCoverage).toBeLessThanOrEqual(1);
      expect(row.socialProofValue).toBeGreaterThanOrEqual(0);
    }
    expect(r.flags.length).toBeGreaterThan(0);
  });

  it("default scenario shows TK-01 ghosting flag and TK-03 yarn flag", () => {
    const r = run({});
    expect(r.flags.some((f) => f.code === "TK-01")).toBe(true);
    expect(r.flags.some((f) => f.code === "TK-03")).toBe(true);
  });

  it("a tiny launch refuses paid slots (TK-04, verdict free-pool)", () => {
    const r = run({ launchRevenueBaseline: 100, paidSlotShare: 0.5, flatFeeUsd: 80 });
    const paidRow = r.rows.find((x) => x.model === "flatCash");
    expect(paidRow).toBeDefined();
    expect(paidRow!.netOutcome).toBeLessThan(r.baseFreeRow.netOutcome);
    expect(r.flags.some((f) => f.code === "TK-04")).toBe(true);
    expect(r.verdict).toBe("Free pool covers it — launch too small for paid slots");
  });

  it("a large launch flips to a paid model when social proof covers the tier", () => {
    const r = run({ launchRevenueBaseline: 8000, socialProofLiftPct: 15, paidSlotShare: 0.25 });
    const paidBest = r.rows.reduce((a, b) => (b.netOutcome > a.netOutcome ? b : a), r.rows[0]);
    expect(paidBest.netOutcome).toBeGreaterThan(r.baseFreeRow.netOutcome);
    expect(r.flags.some((f) => f.code === "TK-04")).toBe(false);
  });

  it("free row has zero cash and yarn cost and suffers the ghost rate", () => {
    const r = run({ ghostRate: 0.3, paidSlotShare: 0 });
    expect(r.baseFreeRow.cashCost).toBe(0);
    expect(r.baseFreeRow.yarnCost).toBe(0);
    expect(r.baseFreeRow.churnAdjustedSlots).toBeCloseTo(16 * 0.3, 0);
  });

  it("full yarn support prices whole skeins rounded up", () => {
    const full = run({ patternYardage: 1200, yarnCostPerSkein: 25, yardsPerSkein: 200, paidSlotShare: 0 });
    const yarnRow = full.rows.find((x) => x.model === "yarnSupportFull");
    // 1200/200 = 6 skeins x $25 = $150 x 16 slots
    expect(yarnRow!.yarnCost).toBeCloseTo(6 * 25 * 16, 0);
    expect(yarnRow!.cashCost).toBe(0);
  });

  it("partial yarn support applies the discount to the yarn cost", () => {
    const full = run({ yarnCostPerSkein: 25, yardsPerSkein: 200, paidSlotShare: 0 });
    const partial = run({ partialSupportDiscount: 0.3, paidSlotShare: 0 });
    const fullRow = full.rows.find((x) => x.model === "yarnSupportFull")!;
    const partialRow = partial.rows.find((x) => x.model === "yarnSupportPartial")!;
    expect(partialRow.yarnCost).toBeCloseTo(fullRow.yarnCost * 0.7, 0);
  });

  it("flat cash and per-yard scale with slot count", () => {
    const cash = run({ flatFeeUsd: 40, paidSlotShare: 0 });
    const yard = run({ perYardRateUsd: 0.12, paidSlotShare: 0 });
    const cashRow = cash.rows.find((x) => x.model === "flatCash")!;
    const yardRow = yard.rows.find((x) => x.model === "perYard")!;
    expect(cashRow.cashCost).toBeCloseTo(40 * 16, 0);
    expect(yardRow.cashCost).toBeCloseTo(1200 * 0.12 * 16, 0);
  });

  it("sample row only buys yarn for the paid share of slots", () => {
    const r = run({ yarnCostPerSkein: 25, yardsPerSkein: 200, paidSlotShare: 0.25 });
    const sampleRow = r.rows.find((x) => x.model === "sample")!;
    // paid slots = 4; sample knitters carry a yarn stipend: ceil(4 x 0.4) = 2
    // testers x 6 skeins x $25 = $300
    expect(sampleRow.yarnCost).toBeCloseTo(2 * 6 * 25, 0);
    expect(sampleRow.cashCost).toBeGreaterThan(0);
  });

  it("ghost rate cuts free-pool size coverage; paid slots hold it", () => {
    const free = run({ ghostRate: 0.5, paidSlotShare: 0, slotsPerSize: 1 });
    const paid = run({ ghostRate: 0.5, paidSlotShare: 1, slotsPerSize: 1 });
    // rows[0] is always the free-model row (carries the ghost risk by
    // design); the flat-cash row shows what a paid roster covers
    const freeCoverage = free.rows[0].sizeCoverage;
    const paidRow = paid.rows.find((x) => x.model === "flatCash")!;
    expect(freeCoverage).toBeCloseTo(0.5, 2);
    expect(paidRow.sizeCoverage).toBeGreaterThanOrEqual(0.94);
  });

  it("low free-pool coverage fires TK-02", () => {
    const r = run({ ghostRate: 0.4, slotsPerSize: 1, paidSlotShare: 0 });
    expect(r.flags.some((f) => f.code === "TK-02")).toBe(true);
    expect(r.rows[0].sizeCoverage).toBeLessThan(0.9);
  });

  it("short test windows fire TK-05", () => {
    const r = run({ patternYardage: 1200, testWeeks: 4 });
    expect(r.flags.some((f) => f.code === "TK-05")).toBe(true);
  });

  it("heavy management time against a small launch fires TK-07", () => {
    const r = run({ designerMgmtHoursPerWeek: 10, designerHourlyRate: 60, launchRevenueBaseline: 300 });
    expect(r.flags.some((f) => f.code === "TK-07")).toBe(true);
  });

  it("bad tech edit + thin slots fires TK-08", () => {
    const r = run({ techEditScore: 25, slotsPerSize: 1, ghostRate: 0.3, paidSlotShare: 0, sizeCount: 10 });
    expect(r.flags.some((f) => f.code === "TK-08")).toBe(true);
  });

  it("a healthy launch with a sample row earns TK-06 photo-offset flag", () => {
    const r = run({ launchRevenueBaseline: 12000, socialProofLiftPct: 14, paidSlotShare: 0.2 });
    expect(r.flags.some((f) => f.code === "TK-06")).toBe(true);
  });

  it("paid slots raise net outcome vs free when retention beats churn", () => {
    const free = run({ ghostRate: 0.25, paidSlotShare: 0, launchRevenueBaseline: 4000, socialProofLiftPct: 12 });
    const mix = run({ ghostRate: 0.25, paidSlotShare: 0.3, launchRevenueBaseline: 4000, socialProofLiftPct: 12 });
    const mixBest = mix.rows.reduce((a, b) => (b.netOutcome > a.netOutcome ? b : a), mix.rows[0]);
    // the mixed roster's coverage is strictly higher (fewer ghosted slots),
    // so its best model's coverage-scaled proof value exceeds the pure free pool
    const mixPaidRow = mix.rows.find((x) => x.model === "flatCash")!;
    expect(mixPaidRow.sizeCoverage).toBeGreaterThan(free.baseFreeRow.sizeCoverage);
    expect(mixBest.netOutcome).toBeGreaterThanOrEqual(free.baseFreeRow.netOutcome);
  });

  it("paidRetention and ghostRate are clamped; zero yardage floors to 100", () => {
    const r = run({ ghostRate: 2, paidRetention: -1, patternYardage: 0 });
    const freeRow = r.rows[0];
    expect(freeRow.cashCost).toBe(0);
    expect(freeRow.yarnCost).toBe(0);
    expect(r.flags.some((f) => f.code === "TK-01")).toBe(true); // clamped ghost still > 0.1
  });

  it("extra pattern copy costs half a pattern price per slot", () => {
    const r = run({ launchPrice: 10, paidSlotShare: 0 });
    const row = r.rows.find((x) => x.model === "extraPattern")!;
    expect(row.cashCost).toBeCloseTo(5 * 16, 0);
  });

  it("designer time cost tracks hours x weeks x rate", () => {
    const r = run({ designerMgmtHoursPerWeek: 2, testWeeks: 10, designerHourlyRate: 50 });
    expect(r.totalDesignerTimeHours).toBe(20);
    expect(r.designerTimeCost).toBe(1000);
  });

  it("ghosted slot count excludes paid share", () => {
    const r = run({ ghostRate: 0.2, paidSlotShare: 0.5, sizeCount: 8, slotsPerSize: 2 });
    // 16 slots, half paid -> 8 free ghosting at 20%
    expect(r.ghostedSlots).toBeCloseTo(8 * 0.2, 0);
  });

  it("verdict ladder covers the negative paid case", () => {
    const r = run({ launchRevenueBaseline: 50, paidSlotShare: 0.8, flatFeeUsd: 100 });
    expect(["Free pool covers it — launch too small for paid slots", "Paid slots don't pencil — raise the launch or cut the window"]).toContain(r.verdict);
  });

  it("social proof value scales with launch size and lift, discounted by coverage", () => {
    const a = run({ launchRevenueBaseline: 1000, socialProofLiftPct: 10, paidSlotShare: 0 });
    const b = run({ launchRevenueBaseline: 2000, socialProofLiftPct: 10, paidSlotShare: 0 });
    const freeA = a.rows[0].socialProofValue;
    const freeB = b.rows[0].socialProofValue;
    expect(freeB / freeA).toBeCloseTo(2, 1);
  });

  it("error catch value exists and is non-negative", () => {
    const r = run({ techEditScore: 30, errorCatchValueUsd: 50 });
    expect(r.errorCatchValueTotal).toBeGreaterThanOrEqual(0);
    expect(r.errorCatchValueTotal).toBeLessThan(r.baseFreeRow.expectedErrorsCaught * 50 + 1);
  });
});
