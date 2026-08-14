/**
 * Pre-Order Campaign Lab — CHK-057 (55th workspace feature).
 *
 * Every session before this one priced channels that ship a finished pattern
 * or garment. This one prices the *pre-order* — the campaign where a designer
 * sells a garment (or garment-sized kit) before it exists, using customers'
 * own money to fund production. Session-57 market facts:
 *
 * - The pre-order model flips "make then hope to sell" into "sell then make":
 *   demand is validated and production funded before a single yarn ball is
 *   bought. In-stock is the model with the "dead stock" risk, the number one
 *   killer of small clothing brands (Lemura Knitwear, pre-orders vs in-stock
 *   showdown, Sep 2025).
 * - The minimum-production-threshold formula (Hey-Dom, 2026 handmade guide):
 *   threshold = (fixed series costs + materials + labor + 30% safety margin)
 *   ÷ unit net price. The all-or-nothing threshold is a legally clean
 *   "conditional sale" — no one is charged if it misses.
 * - First-campaign discipline: set the threshold at 60–70% of predicted
 *   sales. Overly optimistic thresholds produce the "25 sales, 27 needed"
 *   failure that burns audience trust; pessimistic thresholds swamp capacity.
 * - Early-bird pricing: a 15–25% pre-order discount is the minimum perceived
 *   incentive; Hey-Dom/Kickstarter benchmarks put early-bird at +30–50%
 *   conversion versus same-price listings.
 * - Campaign length sweet spot is 21–35 days. Under 14 days there is no
 *   word-of-mouth runway; past 45 days urgency dies and conversion drops
 *   ~40% on average.
 * - Charge-later / deposit models carry 43.8% of pre-order listings
 *   ($85M+ in pre-order sales analyzed, preproduct.io). Charging the full
 *   amount upfront for a long lead time is the refund-risk setting.
 * - Fulfillment hours are the hidden cost: knitwear + packing + shipping
 *   admin; indie dyers running pre-order drops hit capacity overwhelm as
 *   their top failure mode (craftsnark, 2022).
 * - Small-run unit economics: fully fashioned knitwear production runs
 *   $35–85/unit at 50–100 unit MOQs (Plucky Reach, 2026); a realistic
 *   small knitwear run starts at $8,000–10,000 — the pre-order's job is
 *   to fund that without touching reserves.
 * - Benchmarks: average cancellation 5.4% across 1M+ pre-orders (lower with
 *   proactive communication); waitlist→pre-order conversion for new brands
 *   runs 1–2% (preproduct.io); the most common shipping wait, 121–150 days
 *   for 28.1% of pre-orders, shows patience is purchasable with honesty.
 * - Buffer stock: order 10–15% extra units beyond pre-orders (press,
 *   giveaways, an immediate in-stock bridge).
 *
 * The lab is deterministic: campaign revenue, threshold math, per-unit
 * economics with the 30% safety margin, fulfillment-hour exposure, the
 * campaign-length and pricing-policy checks (PC-01..PC-07), and a verdict.
 */

export type ChargeModel = 'upfront' | 'chargeLater' | 'deposit';
export const CHARGE_MODEL_LABELS: Record<ChargeModel, string> = {
  upfront: 'Charge upfront (full payment now)',
  chargeLater: 'Charge later (pay at shipping)',
  deposit: 'Deposit now, balance at shipping',
};

export interface PreorderCampaignInput {
  /** Campaign item retail price ($). */
  itemPrice: number;
  /** Early-bird pre-order price ($). */
  earlyBirdPrice: number;
  /** Share of expected orders that take the early-bird price (0–1). */
  earlyBirdShare: number;
  /** Platform payment processing + commission (e.g. Stripe 2.9%+30c ≈ 3–7%). */
  platformFeePct: number;
  /** Campaign length in days. */
  campaignDays: number;
  /** Charge model. */
  chargeModel: ChargeModel;
  /** Expected production + shipping lead time in days. */
  leadTimeDays: number;

  // --- Cost basis.
  /** Materials cost per unit ($): yarn, notions, packaging share. */
  materialsPerUnit: number;
  /** Knit/production hours per unit (incl. finishing, blocking). */
  knitHoursPerUnit: number;
  /** Designer hourly rate ($/hr) used inside the cost basis. */
  laborRate: number;
  /** Fixed series costs ($): sample, tech editing, grading, photography,
   *  shipping supplies, pattern printing. */
  fixedSeriesCosts: number;
  /** Fulfillment hours per unit ($ packing, labeling, shipping admin). */
  fulfillmentHoursPerUnit: number;
  /** Per-unit shipping cost charged to the customer or absorbed ($). */
  shippingPerUnit: number;

  // --- Demand basis.
  /** Email list size. */
  emailListSize: number;
  /** Expected conversion from email list to orders (0–1). */
  emailConversion: number;
  /** Orders expected from social followers outside the list. */
  socialExpectedOrders: number;
  /** Waitlist members for the campaign. */
  waitlistSize: number;
  /** Waitlist→pre-order conversion (0–1). */
  waitlistConversion: number;

  // --- Threshold basis.
  /** Whether the campaign uses a minimum production threshold. */
  useThreshold: boolean;
  /** Threshold set as share of predicted orders (0–1; 0.6–0.7 recommended). */
  thresholdShareOfPredicted: number;
  /** Safety margin on the cost basis (0–1; 0.30 recommended). */
  safetyMarginPct: number;
  /** Buffer units ordered beyond pre-orders (0–1 share, 0.10–0.15 typical). */
  bufferShare: number;
}

export const PREORDER_CAMPAIGN_DEFAULTS: PreorderCampaignInput = {
  // garment defaults are batched-effective hours: a designer knitting 10
  // of the same sweater in one season spends far less than 10x the solo
  // time per unit, and session-57 production benchmarks put small-run
  // fully fashioned knitwear at $35–85/unit — the defaults must sit near
  // that band for the keystone pair ($198 retail ↔ ~$99 wholesale pair) to
  // reconcile with the cost basis.
  itemPrice: 248,
  earlyBirdPrice: 198,
  earlyBirdShare: 0.6,
  platformFeePct: 0.035,
  campaignDays: 28,
  chargeModel: 'deposit',
  leadTimeDays: 70,
  materialsPerUnit: 30,
  knitHoursPerUnit: 1.7,
  laborRate: 25,
  fixedSeriesCosts: 420,
  fulfillmentHoursPerUnit: 0.7,
  shippingPerUnit: 12,
  emailListSize: 1200,
  emailConversion: 0.03,
  socialExpectedOrders: 12,
  waitlistSize: 90,
  waitlistConversion: 0.1,
  useThreshold: true,
  thresholdShareOfPredicted: 0.65,
  safetyMarginPct: 0.3,
  bufferShare: 0.12,
};

export interface PreorderResult {
  // --- Demand & revenue.
  /** Predicted orders from all demand sources. */
  predictedOrders: number;
  /** Email-derived orders. */
  emailOrders: number;
  /** Waitlist-derived orders. */
  waitlistOrders: number;
  /** Social-derived orders. */
  socialOrders: number;
  /** Average revenue per order after early-bird mix ($). */
  avgRevenuePerOrder: number;
  /** Platform fees paid ($). */
  platformFees: number;
  /** Net campaign revenue after fees ($). */
  netCampaignRevenue: number;

  // --- Cost basis & threshold.
  /** Full cost basis per unit (materials + labor + overhead 12% + fulfillment
   *  labor + shipping). */
  costPerUnit: number;
  /** Cost basis incl. 30% safety margin. */
  costPerUnitSafe: number;
  /** Total fixed costs recovered ($). */
  totalFixedCosts: number;
  /** Minimum production threshold in units (all-or-nothing model). */
  minimumThreshold: number;
  /** Predicted vs threshold ratio (≥1 = campaign closes successfully). */
  thresholdCoverage: number;
  /** Buffer units (10–15% beyond pre-orders). */
  bufferUnits: number;

  // --- Profit & hours.
  /** Net profit after all units' costs, fixed costs, and buffer ($). */
  netProfit: number;
  /** Profit as % of campaign revenue. */
  profitMarginPct: number;
  /** Knit hours demanded by predicted orders. */
  totalKnitHours: number;
  /** Fulfillment hours demanded. */
  totalFulfillmentHours: number;
  /** Net profit per total production hour. */
  netPerProductionHour: number;
  /** Designer's effective hourly rate from the campaign ($/hr, profit ÷
   *  knit+fulfillment hours). */
  effectiveHourly: number;

  // --- Flags (PC-01..PC-07).
  flags: { id: string; detail: string }[];
  /** Banner verdict. */
  verdict: string;
  /** Follow-up suggestion. */
  suggestion: string;
}

export function analyzePreorderCampaign(input: Partial<PreorderCampaignInput> = {}): PreorderResult {
  const i: PreorderCampaignInput = { ...PREORDER_CAMPAIGN_DEFAULTS, ...input };

  // --- Demand.
  const emailOrders = Math.round(i.emailListSize * i.emailConversion);
  const waitlistOrders = Math.round(i.waitlistSize * i.waitlistConversion);
  const socialOrders = Math.max(0, Math.round(i.socialExpectedOrders));
  const predictedOrders = Math.max(1, emailOrders + waitlistOrders + socialOrders);

  // --- Revenue.
  const avgRevenuePerOrder =
    Math.round((i.earlyBirdPrice * i.earlyBirdShare + i.itemPrice * (1 - i.earlyBirdShare)) * 100) / 100;
  const grossRevenue = predictedOrders * avgRevenuePerOrder;
  const platformFees = Math.round(grossRevenue * Math.max(0, Math.min(1, i.platformFeePct)) * 100) / 100;
  const netCampaignRevenue = Math.round((grossRevenue - platformFees) * 100) / 100;

  // --- Cost basis.
  const laborPerUnit = Math.max(0, i.knitHoursPerUnit) * Math.max(1, i.laborRate);
  const overhead = (i.materialsPerUnit + laborPerUnit) * 0.12;
  const fulfillmentLabor = Math.max(0, i.fulfillmentHoursPerUnit) * Math.max(1, i.laborRate);
  const costPerUnit = Math.round(
    (i.materialsPerUnit + laborPerUnit + overhead + fulfillmentLabor + Math.max(0, i.shippingPerUnit)) * 100,
  ) / 100;
  const costPerUnitSafe = Math.round(costPerUnit * (1 + Math.max(0, Math.min(1, i.safetyMarginPct))) * 100) / 100;
  const totalFixedCosts = Math.max(0, i.fixedSeriesCosts);

  // --- Threshold: (fixed + safe cost basis * predicted units) ÷ net price —
  // solved as fixed/price + units × costSafe/price per the Hey-Dom formula.
  const minimumThreshold = i.useThreshold
    ? Math.ceil((totalFixedCosts + predictedOrders * costPerUnitSafe) / Math.max(0.01, avgRevenuePerOrder))
    : 0;
  const thresholdCoverage = minimumThreshold > 0
    ? Math.round((predictedOrders / minimumThreshold) * 100) / 100
    : predictedOrders;

  // --- Buffer + fulfillment.
  const bufferUnits = Math.ceil(predictedOrders * Math.max(0, Math.min(1, i.bufferShare)));
  const totalUnits = predictedOrders + bufferUnits;
  const totalKnitHours = Math.round(totalUnits * Math.max(0, i.knitHoursPerUnit) * 10) / 10;
  const totalFulfillmentHours = Math.round(totalUnits * Math.max(0, i.fulfillmentHoursPerUnit) * 10) / 10;

  // --- Profit: revenue minus (fixed + every unit's safe cost incl. buffer).
  const totalProductionCost = Math.round((totalFixedCosts + totalUnits * costPerUnitSafe) * 100) / 100;
  const netProfit = Math.round((netCampaignRevenue - totalProductionCost) * 100) / 100;
  const profitMarginPct = grossRevenue > 0
    ? Math.round((netProfit / grossRevenue) * 1000) / 1000
    : 0;
  const totalProductionHours = totalKnitHours + totalFulfillmentHours;
  const netPerProductionHour = totalProductionHours > 0
    ? Math.round((netProfit / totalProductionHours) * 100) / 100
    : 0;
  const effectiveHourly = netPerProductionHour;

  // --- Flags (PC-01..PC-07), every trigger sourced in the header above.
  const flags: { id: string; detail: string }[] = [];

  if (thresholdCoverage < 1) {
    flags.push({
      id: 'PC-01',
      detail: `Predicted demand covers only ${(thresholdCoverage * 100).toFixed(0)}% of the ${minimumThreshold}-unit threshold — the all-or-nothing model would close without producing, refunding every card authorization and burning the trust the campaign was built to create.`,
    });
  }

  const earlyBirdGapPct = i.itemPrice > 0 ? (i.itemPrice - i.earlyBirdPrice) / i.itemPrice : 0;
  if (earlyBirdGapPct < 0.15) {
    flags.push({
      id: 'PC-02',
      detail: `The early-bird gap is ${(earlyBirdGapPct * 100).toFixed(0)}% — below the 15–25% minimum that makes pre-ordering feel worth the wait; benchmarks show a gap under 15% forfeits the documented +30–50% early-bird conversion lift.`,
    });
  }

  if (i.campaignDays < 14) {
    flags.push({
      id: 'PC-03',
      detail: `${i.campaignDays} days is too short to build word-of-mouth; the measured sweet spot is 21–35 days, and the D+16-to-close "re-momentum" push is what most campaigns actually need.`,
    });
  } else if (i.campaignDays > 45) {
    flags.push({
      id: 'PC-04',
      detail: `${i.campaignDays} days lets urgency die — conversion drops ~40% on average past 45 days; cap at 35 and use the mid-campaign trough for making-of content instead of more selling.`,
    });
  }

  if (i.chargeModel === 'upfront' && i.leadTimeDays > 60) {
    flags.push({
      id: 'PC-05',
      detail: `Charging the full amount ${i.leadTimeDays} days before delivery is the refund-risk setting — a customer legally entitled to withdraw at delivery is carrying the cash for over two months; deposit or charge-later fits this lead time.`,
    });
  }

  const fulfillmentShare = totalProductionHours > 0 ? totalFulfillmentHours / totalProductionHours : 0;
  if (fulfillmentShare > 0.25) {
    flags.push({
      id: 'PC-06',
      detail: `Fulfillment (packing, labeling, shipping) is ${Math.round(fulfillmentShare * 100)}% of total production hours — capacity overwhelm during the fulfillment window is the most-documented pre-order drop failure; stagger ship dates or price shipping separately.`,
    });
  }

  if (i.bufferShare < 0.1) {
    flags.push({
      id: 'PC-07',
      detail: 'No meaningful buffer stock: 10–15% extra units beyond pre-orders are the standard for press, giveaways, and the first in-stock bridge — without it the campaign ends with zero inventory and zero momentum for the next drop.',
    });
  }

  // --- Verdict.
  let verdict = '';
  let suggestion = '';
  const safeEffectiveFloor = 15; // $/hr — below skilled-wage territory for
  // garment knitting (knit hours at $25/hr + finishing).

  // The ladder orders questions, not severities: threshold coverage is a
  // demand question (skip / borderline / closes), and only after demand is
  // settled do we ask whether the economics pay (fund / underpays / don't
  // fund). Coverage in [0.7, 1) is always borderline — one communication
  // beat decides funded-or-empty — even when the safe-cost basis also says
  // the margin is thin, because the campaign's real failure mode there is
  // trust damage from a missed threshold, not raw pricing.
  if (thresholdCoverage < 0.7 && predictedOrders < minimumThreshold * 0.7) {
    verdict = `Skip this drop for now: demand (${predictedOrders} predicted) is well short of the ${minimumThreshold}-unit threshold — even a lowered bar would finish the campaign empty.`;
    suggestion = 'Warm the list first — a 2–4 week waitlist capture before the window, then reopen at 21–35 days; pre-orders are a demand instrument, and a failed threshold trains your audience that your campaigns are unreliable.';
  } else if (thresholdCoverage < 1) {
    verdict = `Borderline: predicted demand (${predictedOrders}) hovers near the ${minimumThreshold}-unit threshold — one communication beat decides whether this campaign closes funded or empty.`;
    suggestion = 'Raise the waitlist first (a 1–2% waitlist→order conversion on a warmed list is the measured baseline), then reopen with a 21–35 day window; the threshold math only survives a warm audience, never a cold one.';
  } else if (netProfit < 0) {
    verdict = `Don't fund this campaign: at $${avgRevenuePerOrder.toFixed(0)}/order against a $${costPerUnitSafe.toFixed(0)} safe cost basis, ${predictedOrders} orders plus buffer lose $${(-netProfit).toFixed(0)} — the pre-order solves stock risk, not pricing risk.`;
    suggestion = i.earlyBirdPrice < costPerUnitSafe
      ? `The early-bird price ($${i.earlyBirdPrice}) is below the safe cost basis ($${costPerUnitSafe.toFixed(0)}) — raise it to at least $${Math.ceil(costPerUnitSafe + 20)} and keep the 15–25% gap off the full price.`
      : `Raise the full price toward $${(costPerUnitSafe * 2).toFixed(0)} (the keystone pair) and keep fixed series costs under half of predicted revenue.`;
  } else if (effectiveHourly >= safeEffectiveFloor) {
    verdict = `Fund this drop: $${netProfit.toFixed(0)} profit at $${effectiveHourly.toFixed(0)}/production-hour clears the $15/hour floor, demand covers the threshold ${(thresholdCoverage * 100).toFixed(0)}%, and the buffer leaves units in hand for the in-stock bridge.`;
    suggestion = 'Run the D-7 tease → D0 launch blitz → D+4–15 making-of trough → final-week push calendar; over-communicate the ' +
      `$${i.itemPrice.toFixed(0)} delivery date weekly, add 30% slack to the lead-time promise, and invoice the next drop from this one's buyer list.`;
  } else {
    verdict = `The campaign closes but underpays: demand covers the ${minimumThreshold}-unit threshold, yet $${netProfit.toFixed(0)} profit across ${totalProductionHours.toFixed(0)} hours works out to $${effectiveHourly.toFixed(0)}/hour — the pre-order removes stock risk but this price sells your labor cheap.`;
    suggestion = 'Tighten the three levers that move profit without new demand: widen the early-bird gap to at least 15% off a higher full price, cut fixed series costs to under half of predicted revenue, and drop the buffer toward 10% until the second drop.';
  }

  return {
    predictedOrders,
    emailOrders,
    waitlistOrders,
    socialOrders,
    avgRevenuePerOrder,
    platformFees,
    netCampaignRevenue,
    costPerUnit,
    costPerUnitSafe,
    totalFixedCosts,
    minimumThreshold,
    thresholdCoverage,
    bufferUnits,
    netProfit,
    profitMarginPct,
    totalKnitHours,
    totalFulfillmentHours,
    netPerProductionHour,
    effectiveHourly,
    flags,
    verdict,
    suggestion,
  };
}
