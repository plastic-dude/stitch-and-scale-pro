// Gift-Card & Store-Credit Lab — giftcard-lab.ts
// Prices a knitwear pattern shop's gift-card / store-credit program the honest
// way: cash-in float vs the liability sitting behind it, recognized revenue under
// the ASC 606 proportionate method, breakage income net of the share a state can
// take by escheat, the small-balance cash-back laws that convert a $4 balance
// into a cash payout, and the refund-credit erosion loop most indie sellers
// never model.
//
// Verified facts (session 75, Aug 2026):
// - US unredeemed gift card value ≈ $21B/yr, ~10-19% of total sales; average
//   redemption rate across industries 80-90% (Enjovia; CreditCards.com poll:
//   47% of consumers hold >=1 unused card; Statista 2024: ~1/3 forgot their
//   cards; >1 in 5 let one expire).
// - Redeemers spend 20-30% more than the card's face value (Capital One Shopping).
// - ASC 606-10-55-48 proportionate method: breakage recognized in proportion to
//   actual redemptions vs expected total redemptions, not at expiry; if not
//   estimable, recognize when redemption becomes remote.
// - Breakage cannot be recognized as revenue where escheat laws require
//   remittance of unremitted balances (Deloitte DART 8.8).
// - Dormancy before escheat: typically 3-5 years; 14 of 20 classified
//   jurisdictions escheat 100% of face value, 6 escheat 60% (Journal of
//   Accountancy, "States Bite Into Broken Gift Cards").
// - Many states exempt merchandise-only retail credits entirely from escheat
//   (Alabama merch-only at 60%; Arkansas/California retail merchandise credit
//   not unclaimed property) — but rules vary and shift (EisnerAmper 2025:
//   enforcement uptick, multistate audits, self-audit programs).
// - H&M paid $36M to New York for unlawfully retaining unused gift card funds.
// - Cash-back laws: small balances (<$10 federally; California < $15 from
//   Apr 2026) must be redeemable for cash — a permanent liability.
// - Competitor flaw: Etsy/Payhip/Gumroad stacks show gift-card sales as pure
//   revenue; none expose expected breakage vs escheat vs cash-back liability.

export type EscheatMode = "none" | "full" | "partial60";
// none = state exempts merch-only credits (no escheat); full = 100% of breakage
// surrendered; partial60 = state takes 60% of face value (keeps 40% margin).

export interface GiftCardInput {
  /** gift cards actually sold per month, $ (new cash in) */
  cardSalesPerMonth: number;
  /** store credit issued as refunds per month, $ (no new cash — pure liability) */
  refundCreditPerMonth: number;
  /** expected redemption rate, 0-1 (industry average 80-90%) */
  redemptionRate: number;
  /** average extra spend when redeeming beyond face value, 0-1 (20-30%) */
  spendUpliftPct: number;
  /** months between card sale and typical redemption */
  redemptionLagMonths: number;
  /** months of dormancy after which escheat / expiry applies */
  dormancyMonths: number;
  /** share of unredeemed balances the state takes (0 = exempt, 0.6 or 1) */
  escheatTakePct: number;
  escheatMode: EscheatMode;
  /** smallest balance state law forces cash redemption for, $ (0 = none) */
  cashBackThreshold: number;
  /** can you legally set expiry dates or dormancy fees */
  expiryAndFeesAllowed: boolean;
  /** monthly fee income from dormancy/service fees, $ (0 if disallowed) */
  feeIncomePerMonth: number;
  /** card processing costs as % of card sales, 0-1 (issuing platform fee) */
  processingPct: number;
  /** cost share of each redeemed dollar (0 for pure digital patterns) */
  redeemedCostPct: number;
  /** breakage assumption for proportionate revenue recognition, 0-1 */
  breakageAssumption: number;
  /** admin hours per month for the program (codes, disputes, fraud checks) */
  adminHoursPerMonth: number;
  hourlyRate: number;
  /** view horizon in months for the float build-up */
  horizonMonths: number;
}

export const DEFAULT_GIFTCARD: GiftCardInput = {
  cardSalesPerMonth: 300,
  refundCreditPerMonth: 40,
  redemptionRate: 0.85,
  spendUpliftPct: 0.25,
  redemptionLagMonths: 3,
  dormancyMonths: 36,
  escheatTakePct: 0.6,
  escheatMode: "partial60",
  cashBackThreshold: 10,
  expiryAndFeesAllowed: false,
  feeIncomePerMonth: 0,
  processingPct: 0.029,
  redeemedCostPct: 0,
  breakageAssumption: 0.12,
  adminHoursPerMonth: 2,
  hourlyRate: 40,
  horizonMonths: 36,
};

export interface FlagDetail { code: string; title: string; note: string; severity: "high" | "mid" | "low" }

export interface GiftCardResult {
  /** total cash collected from card sales over the horizon */
  totalCashIn: number;
  /** processing fees paid */
  processingFees: number;
  /** value of cards expected to be redeemed over the horizon */
  expectedRedemptions: number;
  /** uplifted basket value: redeemers spending above face value */
  upliftValue: number;
  /** product cost of goods triggered by redemptions */
  redemptionCOGS: number;
  /** expected breakage (unredeemed) over the horizon */
  expectedBreakage: number;
  /** breakage surrendered to states under escheat */
  escheatSurrender: number;
  /** breakage you actually keep as income after escheat */
  keptBreakage: number;
  /** recognized revenue under ASC 606 proportionate method over the horizon */
  recognizedRevenue: number;
  /** liability still outstanding at the end of the horizon (unredeemed + refunds) */
  endingLiability: number;
  /** small-balance cash payouts owed under cash-back laws */
  cashBackPayouts: number;
  /** fee income */
  feeIncome: number;
  /** refund credits are a pure liability — no cash benefit */
  refundCreditLiability: number;
  /** admin cost of running the program */
  adminCost: number;
  /** net program profit over the horizon (recognized revenue + fees - COGS -
   *  escheat - cashback - admin - processing) */
  netProgramProfit: number;
  /** effective margin on card sales */
  effectiveMarginPct: number;
  /** extra sales the uplift drives over what the cards alone brought in */
  upliftSales: number;
  /** months for the liability to stabilize */
  stabilizationMonths: number;
  /** max outstanding liability at any point in the horizon */
  peakLiability: number;
  flags: FlagDetail[];
  verdict:
    | "Do not sell cards — liability exceeds float"
    | "Sell small — refund-credit loop dominates"
    | "Treat as pure float — keep it small and simple"
    | "Worth running — float + breakage beat the cost of the liability"
    | "Strong program — uplift alone justifies it";
  verdictNote: string;
}

export function fmt$(n: number): string {
  return (
    (n < 0 ? "-$" : "$") +
    Math.abs(n)
      .toFixed(2)
      .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  );
}

function clamp(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, x));
}

/** One-step simulation of the card float: returns per-month new cash,
 *  redemptions hitting this month, breakage maturing this month, and the
 *  running liability. Uses cohort accounting — each month's card cohort
 *  redeems after `redemptionLagMonths`, then whatever survives to
 *  `dormancyMonths` is breakage (kept or escheated per mode). */
function simulate(input: GiftCardInput) {
  const sales = Math.max(0, input.cardSalesPerMonth);
  const refunds = Math.max(0, input.refundCreditPerMonth);
  const redeemPct = clamp(input.redemptionRate, 0, 1);
  const lag = Math.max(0, Math.round(input.redemptionLagMonths));
  const dorm = Math.max(1, Math.round(input.dormancyMonths));
  // the horizon must run past dormancy or no cohort ever matures its
  // breakage — extend the simulation window to at least dormancy + lag so
  // breakage (kept or escheated) is visible at any horizon
  const horizon = Math.max(1, Math.max(Math.round(input.horizonMonths), Math.round(input.dormancyMonths) + lag));
  const escheat = clamp(input.escheatTakePct, 0, 1);
  const cashBack = Math.max(0, input.cashBackThreshold);

  // cohorts[m] = face value of cards sold in month m still outstanding
  const cohorts: number[] = [];
  const redemptions: number[] = [];
  const breakageEvents: number[] = [];
  const cashIn: number[] = [];

  let liability = 0;
  let peakLiability = 0;
  let totalCash = 0;
  let totalRedemptions = 0;
  let totalBreakageKept = 0;
  let totalEscheat = 0;
  let totalCashBack = 0;

  for (let m = 0; m < horizon; m++) {
    // new cards sold this month (minus processing fees — they're real cash cost
    // at sale time, but cash-in here tracks face value; fees summed separately)
    const sold = sales;
    cohorts.push(sold);
    totalCash += sold * (1 - input.processingPct);

    // redemptions this month: the cohort sold `lag` months ago (if any)
    let redeemedThisMonth = 0;
    const idx = m - lag;
    if (idx >= 0 && idx < cohorts.length) {
      redeemedThisMonth = cohorts[idx] * redeemPct;
    }
    // refund credits also get spent this month at the same behavior pattern
    redeemedThisMonth += refunds * redeemPct;

    // small-balance cash payouts: only tiny leftover balances (under the
    // legal threshold) are redeemed for cash instead of merchandise — a small
    // share of all redemptions, sized by how easily baskets clear the threshold
    if (cashBack > 0) {
      const basketPctUnder = clamp(cashBack / (cashBack + 60), 0, 0.12); // avg redeemed basket ~$60; few land under the $10/$15 line
      totalCashBack += redeemedThisMonth * basketPctUnder;
    }

    totalRedemptions += redeemedThisMonth;

    // breakage maturing: cohorts now past dormancy, unredeemed remainder
    let breakageThisMonth = 0;
    for (let c = 0; c <= m - dorm; c++) {
      if (cohorts[c] > 0) {
        const face = cohorts[c];
        breakageThisMonth += face * (1 - redeemPct);
        cohorts[c] = 0;
      }
    }
    const escheated = breakageThisMonth * escheat;
    totalEscheat += escheated;
    totalBreakageKept += breakageThisMonth - escheated;
    breakageEvents.push(breakageThisMonth);

    // liability = still-outstanding cohorts + unspent refund credit balance
    liability = cohorts.reduce((a, b) => a + b, 0) + refunds * (1 - redeemPct) * Math.min(m + 1, dorm);
    peakLiability = Math.max(peakLiability, liability);
    redemptions.push(redeemedThisMonth);
    cashIn.push(sold);
  }

  return {
    totalCash,
    totalRedemptions,
    totalBreakageKept,
    totalEscheat,
    totalCashBack,
    endingLiability: liability,
    peakLiability,
    redemptions,
    cashIn,
  };
}

export function analyzeGiftCard(input: GiftCardInput): GiftCardResult {
  const flags: FlagDetail[] = [];
  const sales = Math.max(0, input.cardSalesPerMonth);
  const refunds = Math.max(0, input.refundCreditPerMonth);
  const redeemPct = clamp(input.redemptionRate, 0, 1);
  const uplift = clamp(input.spendUpliftPct, 0, 1);
  const sim = simulate(input);

  const processingFees = sales * input.processingPct * input.horizonMonths;
  const upliftValue = sim.totalRedemptions * uplift;
  const upliftSales = sim.totalRedemptions * uplift;
  const redemptionCOGS = sim.totalRedemptions * clamp(input.redeemedCostPct, 0, 1);
  // fee income only counts when the program is legally allowed to charge fees;
  // an illegal dormancy fee is a compliance liability, not revenue
  const feeIncome = input.expiryAndFeesAllowed ? Math.max(0, input.feeIncomePerMonth) * input.horizonMonths : 0;
  const adminCost = input.adminHoursPerMonth * input.hourlyRate * input.horizonMonths;

  // ASC 606 proportionate method: recognize breakage in proportion to actual
  // redemptions against expected total redemptions over the cohort life.
  const expectedTotalRedeemed = sales * input.horizonMonths * redeemPct;
  const expectedBreakage = sales * input.horizonMonths * (1 - redeemPct);
  const breakageEstimate = Math.max(0, input.breakageAssumption);
  let recognizedRevenue = 0;
  if (expectedTotalRedeemed + expectedBreakage > 0) {
    const proportion =
      sim.totalRedemptions /
      (sim.totalRedemptions + expectedBreakage * (1 - input.escheatTakePct));
    recognizedRevenue =
      sim.totalCash + proportion * Math.min(sim.totalBreakageKept, sales * input.horizonMonths * breakageEstimate);
  }

  const cashBackPayouts = sim.totalCashBack;
  // refund credits are a pure liability with zero cash benefit — the full
  // unspent balance sits on the shop's books
  const refundCreditLiability = refunds * (1 - redeemPct) * Math.min(input.horizonMonths, Math.max(1, Math.round(input.dormancyMonths)));
  const netProgramProfit =
    recognizedRevenue + feeIncome - redemptionCOGS - cashBackPayouts - adminCost - processingFees - sim.totalEscheat;
  const totalCardFace = sales * input.horizonMonths;
  const effectiveMarginPct = totalCardFace > 0 ? (netProgramProfit / totalCardFace) * 100 : 0;

  // stabilization: months until new cash-in ≈ redemptions + maturing breakage
  let stabilizationMonths = input.horizonMonths;
  let prevCash = 0;
  let prevRed = 0;
  for (let m = 1; m < sim.cashIn.length; m++) {
    prevCash = sim.cashIn[m - 1];
    prevRed = sim.redemptions[m - 1] ?? 0;
    if (Math.abs(prevCash - prevRed) < totalCardFace * 0.02) {
      stabilizationMonths = m;
      break;
    }
  }

  // ---- flags ----
  if (sales <= 0 && refundCreditLiability > 0) {
    flags.push({
      code: "GC-01",
      title: "Refund-credit loop with no new sales",
      note: `You issue ${fmt$(refunds)}/mo in refund credit but sell no gift cards — credit is pure liability with no float benefit. Cap refunds to original payment method.`,
      severity: "high",
    });
  }
  if (refunds > 0 && sales > 0 && refunds > sales * 0.3) {
    flags.push({
      code: "GC-02",
      title: "Refund credits > 30% of card sales",
      note: `Refund credit (${fmt$(refunds)}/mo) is eating ${Math.round((refunds / sales) * 100)}% of your float. Refund to the original payment method instead of store credit.`,
      severity: "mid",
    });
  }
  if (input.escheatTakePct >= 0.5) {
    flags.push({
      code: "GC-03",
      title: "Heavy escheat exposure",
      note: `Your state takes ${Math.round(input.escheatTakePct * 100)}% of unredeemed balances after ${Math.round(input.dormancyMonths / 12)} yr. Many states exempt merchandise-only retail credits — check your state's retail-credit exemption before counting breakage as profit.`,
      severity: "mid",
    });
  }
  if (input.cashBackThreshold > 0) {
    flags.push({
      code: "GC-04",
      title: "Small-balance cash-back liability",
      note: `Balances under ${fmt$(input.cashBackThreshold)} must be paid out in cash (federal <$10; California <$15 from Apr 2026). This is a permanent liability no expiry date can remove.`,
      severity: "mid",
    });
  }
  if (!input.expiryAndFeesAllowed && input.feeIncomePerMonth > 0) {
    flags.push({
      code: "GC-05",
      title: "Fees without legal permission",
      note: "You plan dormancy-fee income but expiry/fees aren't allowed in your state. Remove the fee income or your program becomes a compliance liability.",
      severity: "high",
    });
  }
  if (effectiveMarginPct < 0) {
    flags.push({
      code: "GC-06",
      title: "Program loses money on recognized basis",
      note: `Recognized-program profit is ${fmt$(netProgramProfit)} over ${input.horizonMonths} months — processing, COGS, escheat and admin outweigh the float.`,
      severity: "high",
    });
  }
  if (input.redemptionRate < 0.7) {
    flags.push({
      code: "GC-07",
      title: "Low redemption — churn risk",
      note: `At ${Math.round(input.redemptionRate * 100)}% redemption, your float balloons but so does escheat exposure; industry average is 80-90%. Customers who forget cards become complaints, not revenue.`,
      severity: "mid",
    });
  }
  if (input.redeemedCostPct > 0.3) {
    flags.push({
      code: "GC-08",
      title: "High redemption COGS",
      note: `Physical goods redeem at ${Math.round(input.redeemedCostPct * 100)}% cost — with 12% breakage the breakage cushion evaporates and every redeemed dollar costs you nearly a dollar.`,
      severity: "mid",
    });
  }
  if (sim.peakLiability > sales * 6) {
    flags.push({
      code: "GC-09",
      title: "Liability stacking faster than redemption",
      note: `Peak outstanding liability ${fmt$(sim.peakLiability)} is ${Math.round((sim.peakLiability / (sales || 1)))}× monthly sales. If your shop closed tomorrow, that's what you owe back.`,
      severity: "high",
    });
  }
  if (input.breakageAssumption > 0.25) {
    flags.push({
      code: "GC-10",
      title: "Overstated breakage assumption",
      note: `Assuming ${Math.round(input.breakageAssumption * 100)}% breakage is optimistic — measured breakage runs 10-19% and falls as tracking improves (7.5% by 2015 industry data).`,
      severity: "low",
    });
  }
  if (sim.totalEscheat > Math.abs(netProgramProfit)) {
    flags.push({
      code: "GC-11",
      title: "Escheat larger than program profit",
      note: `${fmt$(sim.totalEscheat)} gets surrendered to the state — more than the program earns. Check whether your state exempts merchandise-only credits.`,
      severity: "high",
    });
  }
  const knownFraudNote =
    "Stolen code / brute-force / refund-to-cash loops — set codes >12 chars and never refund cards to cash.";
  void knownFraudNote; // surfaced in the card UI checklist, not a computed flag

  // ---- verdict ----
  const refundDominates = refunds > 0 && refunds > sales * 0.3;
  const hasRealSales = sales > 0;
  const beatsFloatCost =
    netProgramProfit > 0 && sim.totalBreakageKept + upliftValue > adminCost + cashBackPayouts + processingFees;
  const upliftAlone = upliftValue > adminCost + processingFees;

  let verdict: GiftCardResult["verdict"];
  let verdictNote: string;

  if (!hasRealSales && refundCreditLiability > 0) {
    verdict = "Do not sell cards — liability exceeds float";
    verdictNote = `With ${fmt$(refunds)}/mo of refund credit and no new card sales, the program is pure liability. Cap refunds to the original payment method before running any card program.`;
  } else if (!hasRealSales) {
    verdict = "Do not sell cards — liability exceeds float";
    verdictNote = "No card sales means no float — issuing cards only adds a liability you can't offset. Start selling cards before issuing more credit.";
  } else if (refundDominates) {
    verdict = "Sell small — refund-credit loop dominates";
    verdictNote = `Refund credits (${fmt$(refunds)}/mo) are larger than new card sales (${fmt$(sales)}/mo). The credit loop inflates liability faster than the float grows — fix the refund policy before scaling the program.`;
  } else if (!beatsFloatCost) {
    verdict = "Treat as pure float — keep it small and simple";
    verdictNote = `On a recognized basis the program nets ${fmt$(netProgramProfit)} over ${input.horizonMonths} months. The cash-in float is real, but breakage income is capped by escheat and cash-back law — run the program small, don't count on breakage.`;
  } else if (upliftAlone) {
    verdict = "Strong program — uplift alone justifies it";
    verdictNote = `Redeemers spend ${fmt$(upliftValue)} extra above face value — the uplift alone covers admin and processing. The float and kept breakage are upside.`;
  } else {
    verdict = "Worth running — float + breakage beat the cost of the liability";
    verdictNote = `Recognized profit ${fmt$(netProgramProfit)} over ${input.horizonMonths} months: float + uplift + kept breakage cover escheat, cash-back, admin and processing. Keep expiry law-compliant and never refund cards to cash.`;
  }

  return {
    totalCashIn: sim.totalCash,
    processingFees,
    expectedRedemptions: sim.totalRedemptions,
    upliftValue,
    redemptionCOGS,
    expectedBreakage,
    escheatSurrender: sim.totalEscheat,
    keptBreakage: sim.totalBreakageKept,
    recognizedRevenue,
    endingLiability: sim.endingLiability,
    cashBackPayouts,
    feeIncome,
    refundCreditLiability,
    adminCost,
    netProgramProfit,
    effectiveMarginPct,
    upliftSales,
    stabilizationMonths,
    peakLiability: sim.peakLiability,
    flags,
    verdict,
    verdictNote,
  };
}
