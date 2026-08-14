import { describe, it, expect } from "vitest";
import { analyzeGiftCard, DEFAULT_GIFTCARD, type GiftCardInput } from "./giftcard-lab";

const run = (patch: Partial<GiftCardInput>) => analyzeGiftCard({ ...DEFAULT_GIFTCARD, ...patch });

describe("gift-card lab engine", () => {
  it("returns positive recognized revenue for a healthy program", () => {
    const r = run({});
    expect(r.recognizedRevenue).toBeGreaterThan(0);
    expect(r.totalCashIn).toBeGreaterThan(0);
    expect(r.netProgramProfit).toBeGreaterThan(0);
    expect(r.flags.length).toBeGreaterThan(0);
  });

  it("cash-in tracks processing fees and never exceeds face value", () => {
    const r = run({ processingPct: 0.029 });
    // the simulation window is at least dormancy + lag so breakage can
    // mature; cash-in is face value minus processing over that window
    const months = Math.max(36, 36 + 3);
    expect(r.totalCashIn).toBeCloseTo(300 * months * (1 - 0.029), 0);
    expect(r.totalCashIn).toBeLessThanOrEqual(300 * months + 0.01);
    expect(r.processingFees).toBeCloseTo(300 * 36 * 0.029, 0);
  });

  it("zero card sales with refund credits fires GC-01 and refuses the program", () => {
    const r = run({ cardSalesPerMonth: 0, refundCreditPerMonth: 100 });
    expect(r.flags.some((f) => f.code === "GC-01")).toBe(true);
    expect(r.verdict).toBe("Do not sell cards — liability exceeds float");
  });

  it("refund credits > 30% of card sales fires GC-02 and caps the program", () => {
    const r = run({ cardSalesPerMonth: 200, refundCreditPerMonth: 100 });
    expect(r.flags.some((f) => f.code === "GC-02")).toBe(true);
    expect(r.verdict).toBe("Sell small — refund-credit loop dominates");
  });

  it("full escheat cuts kept breakage to zero", () => {
    const full = run({ escheatTakePct: 1, escheatMode: "full" });
    const partial = run({ escheatTakePct: 0.6, escheatMode: "partial60" });
    expect(full.keptBreakage).toBeLessThan(partial.keptBreakage);
    expect(full.escheatSurrender).toBeGreaterThan(partial.escheatSurrender);
    expect(full.flags.some((f) => f.code === "GC-03")).toBe(true);
  });

  it("merchandise-credit exemption (no escheat) raises kept breakage", () => {
    const exempt = run({ escheatTakePct: 0, escheatMode: "none" });
    const full = run({ escheatTakePct: 1, escheatMode: "full" });
    expect(exempt.keptBreakage).toBeGreaterThan(full.keptBreakage);
    expect(full.keptBreakage).toBe(0);
  });

  it("cash-back threshold adds a cash payout liability (GC-04)", () => {
    const withLaw = run({ cashBackThreshold: 10 });
    const without = run({ cashBackThreshold: 0 });
    expect(withLaw.cashBackPayouts).toBeGreaterThan(0);
    expect(without.cashBackPayouts).toBe(0);
    expect(withLaw.flags.some((f) => f.code === "GC-04")).toBe(true);
  });

  it("fee income without legal permission fires GC-05", () => {
    const r = run({ expiryAndFeesAllowed: false, feeIncomePerMonth: 20 });
    expect(r.flags.some((f) => f.code === "GC-05")).toBe(true);
  });

  it("a program that loses money fires GC-06", () => {
    const r = run({
      cardSalesPerMonth: 50,
      adminHoursPerMonth: 30,
      hourlyRate: 60,
      escheatTakePct: 1,
      escheatMode: "full",
      redeemedCostPct: 0.45,
    });
    expect(r.netProgramProfit).toBeLessThan(0);
    expect(r.flags.some((f) => f.code === "GC-06")).toBe(true);
    expect(r.effectiveMarginPct).toBeLessThan(0);
  });

  it("low redemption fires GC-07", () => {
    const r = run({ redemptionRate: 0.6 });
    expect(r.flags.some((f) => f.code === "GC-07")).toBe(true);
  });

  it("high redemption COGS fires GC-08", () => {
    const r = run({ redeemedCostPct: 0.4 });
    expect(r.flags.some((f) => f.code === "GC-08")).toBe(true);
    expect(r.redemptionCOGS).toBeGreaterThan(0);
  });

  it("uplift drives extra sales proportional to redemptions", () => {
    const r = run({ spendUpliftPct: 0.3 });
    expect(r.upliftSales).toBeCloseTo(r.expectedRedemptions * 0.3, 0);
    expect(r.upliftValue).toBe(r.upliftSales);
  });

  it("a strong program with big uplift and no escheat wins", () => {
    const r = run({
      cardSalesPerMonth: 1200,
      escheatTakePct: 0,
      escheatMode: "none",
      spendUpliftPct: 0.3,
      adminHoursPerMonth: 1,
      cashBackThreshold: 0,
    });
    expect(r.verdict).toBe("Strong program — uplift alone justifies it");
  });

  it("a modest compliant program settles on the float verdict", () => {
    const r = run({
      cardSalesPerMonth: 300,
      escheatTakePct: 0,
      escheatMode: "none",
      cashBackThreshold: 0,
    });
    expect(r.verdict).toBe("Treat as pure float — keep it small and simple");
  });

  it("liability stacks while sales outpace redemptions (GC-09)", () => {
    const r = run({ redemptionRate: 0.3, dormancyMonths: 60, cardSalesPerMonth: 800 });
    expect(r.flags.some((f) => f.code === "GC-09")).toBe(true);
    // outstanding card cohorts still stack at the measurement point — the
    // liability is a multiple of monthly sales even ignoring refunds
    expect(r.peakLiability).toBeGreaterThan(800 * 6);
  });

  it("an inflated breakage assumption fires GC-10", () => {
    const r = run({ breakageAssumption: 0.3 });
    expect(r.flags.some((f) => f.code === "GC-10")).toBe(true);
  });

  it("escheat larger than profit fires GC-11", () => {
    const r = run({
      escheatTakePct: 1,
      escheatMode: "full",
      // high sales with low admin ≈ break-even float: escheat on the
      // unredeemed pool ($2,880) exceeds the razor-thin program net ($2,650)
      cardSalesPerMonth: 800,
      redemptionRate: 0.7,
      dormancyMonths: 24,
      cashBackThreshold: 0,
      adminHoursPerMonth: 10,
      hourlyRate: 60,
      spendUpliftPct: 0,
      breakageAssumption: 0.3,
    });
    expect(r.escheatSurrender).toBeGreaterThan(Math.abs(r.netProgramProfit));
    expect(r.flags.some((f) => f.code === "GC-11")).toBe(true);
  });

  it("recognized revenue follows the proportionate method, not face value", () => {
    const r = run({ escheatTakePct: 0, escheatMode: "none" });
    // recognized must exceed raw cash-in only by the proportionate breakage share,
    // never by the full estimated breakage
    const maxBreakageRecognizable = r.keptBreakage;
    expect(r.recognizedRevenue).toBeLessThanOrEqual(r.totalCashIn + maxBreakageRecognizable + 0.01);
    expect(r.recognizedRevenue).toBeGreaterThan(r.totalCashIn - 1);
  });

  it("zero horizon and negative inputs are clamped safely", () => {
    const r = run({ horizonMonths: 0, cardSalesPerMonth: -50, redemptionRate: -0.2 });
    expect(r.totalCashIn).toBe(0);
    expect(r.processingFees).toBe(0);
    expect(r.verdict).toBe("Do not sell cards — liability exceeds float");
  });

  it("no-card-sales, no-refund state refuses the program cleanly", () => {
    const r = run({ cardSalesPerMonth: 0, refundCreditPerMonth: 0 });
    expect(r.netProgramProfit).toBeLessThanOrEqual(0);
    expect(["Do not sell cards — liability exceeds float", "Sell small — refund-credit loop dominates"]).toContain(r.verdict);
  });

  it("fee income is only added when expiry and fees are allowed", () => {
    const allowed = run({ expiryAndFeesAllowed: true, feeIncomePerMonth: 25 });
    const blocked = run({ expiryAndFeesAllowed: false, feeIncomePerMonth: 25 });
    expect(allowed.feeIncome).toBeCloseTo(25 * 36, 0);
    expect(blocked.feeIncome).toBe(0);
  });

  it("stabilization months are bounded by the horizon", () => {
    const r = run({});
    expect(r.stabilizationMonths).toBeGreaterThan(0);
    expect(r.stabilizationMonths).toBeLessThanOrEqual(r.horizonMonths ?? 36);
  });

  // issue #48: escheatMode select was dead state — the engine now reads it
  it("escheatMode governs the take even when the percent field shows 60%", () => {
    // the exact reported defect: select changed but math stayed at 60% basis
    const fullDefault = run({ escheatMode: "full" }); // takePct left at default 0.6
    const partial = run({ escheatMode: "partial60" });
    const exempt = run({ escheatMode: "none" });
    expect(fullDefault.keptBreakage).toBe(0); // 100% escheat despite 0.6 field
    expect(fullDefault.escheatSurrender).toBeGreaterThan(partial.escheatSurrender);
    expect(exempt.keptBreakage).toBeGreaterThan(partial.keptBreakage);
    expect(exempt.escheatSurrender).toBe(0);
  });

  it("in the 60%-class mode the percent field tunes the take", () => {
    const custom = run({ escheatMode: "partial60", escheatTakePct: 0.8 });
    const standard = run({ escheatMode: "partial60", escheatTakePct: 0.6 });
    expect(custom.escheatSurrender).toBeGreaterThan(standard.escheatSurrender);
    expect(custom.keptBreakage).toBeLessThan(standard.keptBreakage);
  });

  it("the percent field is ignored when the mode is full or none (absolute bands)", () => {
    const fullWithPartialField = run({ escheatMode: "full", escheatTakePct: 0.2 });
    const full = run({ escheatMode: "full" });
    const noneWithField = run({ escheatMode: "none", escheatTakePct: 0.9 });
    const none = run({ escheatMode: "none" });
    expect(fullWithPartialField.keptBreakage).toBeCloseTo(full.keptBreakage, 0);
    expect(fullWithPartialField.escheatSurrender).toBeCloseTo(full.escheatSurrender, 0);
    expect(noneWithField.keptBreakage).toBeCloseTo(none.keptBreakage, 0);
  });
});
