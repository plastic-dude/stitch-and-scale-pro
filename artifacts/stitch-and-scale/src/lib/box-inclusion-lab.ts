/* Box Inclusion Lab — subscription-box designer-inclusion economics.
 *
 * A designer gets offered a feature in a yarn/craft subscription box. What is
 * that offer actually worth? The box industry churns hard (10-12% of
 * subscribers cancel monthly, well-run boxes under 5%), boxes fold outright
 * (KnitCrate, Nov 2022 — the biggest knit box in the US closed with $1.45M
 * senior + $1.5M junior debt owed; it paid contributing makers a MAXIMUM of
 * $3 per item and demanded ~85% wholesale discounts), and exclusivity clauses
 * pull the design off the designer's own shop for 3-12 months while the box
 * keeps paying nothing after it dies.
 *
 * No tool on the market models the designer-side expected value of a box
 * feature. This engine does: fee income + exposure-sales funnel − time cost −
 * exclusivity drag, weighted by box health (mortality).
 *
 * Session-73 verified facts (Aug 2026):
 *  - yarn box retail $10-$225/mo (avg US box ~$43)
 *  - box churn 10-12%/mo; average subscriber life ~10 months at 10% churn,
 *    ~20 months at 5% churn
 *  - CAC benchmarks $70-$135 per subscriber; sustainable CAC ≤ 25-35% of CLTV
 *  - gross-margin benchmark ≥ 40-50% per box (below 30% = unsalvageable)
 *  - KnitCrate valued patterns at $3-$5 each in its own box-value math
 *  - Hooks & Needles ($34.97/box) uses anonymous hired designers — no byline,
 *    i.e. zero exposure even when the box survives
 */

export type BoxInclusionInput = {
  boxName: string;
  /** Box subscriber count at the time of the offer. */
  subs: number;
  /** Average monthly price the box charges a subscriber (USD). */
  boxPrice: number;
  /** Flat design fee the box offers for the featured pattern (USD). 0 = exposure-only. */
  designerFee: number;
  /** Per-box-shipped royalty the box offers (USD). 0 = flat-fee-only. */
  royaltyPerBox: number;
  /** How many months the pattern must stay exclusive to the box (0 = non-exclusive). */
  exclusiveMonths: number;
  /** Hours the design + test-knit will take you. */
  designHours: number;
  /** Your effective hourly rate (USD/hr). */
  hourlyRate: number;
  /** What your own digital sale of a comparable pattern earns, per unit (USD). */
  patternPrice: number;
  /** What you normally self-publish a pattern of this kind per month (USD/mo, opportunity baseline). */
  selfPublishEarningsMonthly: number;
  /** % of each box wave's subscribers that join your list (0-1). */
  listSignupsPct: number;
  /** % of your list that buys this pattern over the following 12 months (0-1). */
  listToSalePct: number;
  /** Months between waves that feature you (e.g. 1 = monthly feature; 0.5 unrealistic; 6 = twice a year). */
  waveFreqMonths: number;
  /** Box health score 0-1 — 1 = stable, long-running, funded; lower = churny/leveraged/new. */
  boxHealth: number;
  /** Free/discounted yarn or goods included in the offer (USD value, one-off). */
  extraGoodsValue: number;
  /** Whether the contract demands first-publication / copyright assignment (0 or 1). */
  rightsAssignment: number;
  /** Whether the box's printed pattern credits you by name (0 or 1). */
  byline: number;
};

export const DEFAULT_BOX_INCLUSION: BoxInclusionInput = {
  boxName: 'Indie Yarn Box',
  subs: 3200,
  boxPrice: 34.99,
  designerFee: 125,
  royaltyPerBox: 0,
  exclusiveMonths: 6,
  designHours: 24,
  hourlyRate: 45,
  patternPrice: 7.5,
  selfPublishEarningsMonthly: 190,
  listSignupsPct: 0.05,
  listToSalePct: 0.07,
  waveFreqMonths: 1,
  boxHealth: 0.55,
  extraGoodsValue: 40,
  rightsAssignment: 0,
  byline: 1,
};

export type BoxFlagId =
  | 'BI-01'
  | 'BI-02'
  | 'BI-03'
  | 'BI-04'
  | 'BI-05'
  | 'BI-06'
  | 'BI-07'
  | 'BI-08'
  | 'BI-09';

export type BoxFlag = {
  id: BoxFlagId;
  title: string;
  note: string;
};

export type BoxInclusionResult = {
  /** Per-wave expected gross from fee + royalties (before funnel and costs). */
  feeIncomePerWave: number;
  /** Per-wave exposure funnel: subscribers → list signups → sales → revenue. */
  exposure: {
    waveReach: number;
    listSignups: number;
    funnelSales: number;
    funnelRevenue: number;
  };
  /** One-off goodwill: extra goods value. */
  goodwillValue: number;
  /** Your time cost for the design (designHours × hourlyRate). */
  timeCost: number;
  /** Monthly opportunity cost during exclusivity (selfPublishEarningsMonthly × exclusiveMonths / wave window). */
  exclusivityDragPerYear: number;
  /** Expected annual net EV in USD (health-weighted). */
  annualNetEv: number;
  /** Same, unweighted by box health (raw). */
  annualNetEvRaw: number;
  /** Health-adjusted multiplier applied (0-1). */
  healthMultiplier: number;
  /** Months a subscriber survives on average given box churn of (1 - boxHealth)*10%/mo — informational. */
  avgSubscriberLifeMonths: number;
  /** The flat fee you'd need to break even vs. your self-publish baseline over the exclusive window. */
  breakEvenFee: number;
  /** What the industry considers a fair floor per item based on box price and margin math. */
  fairFloorFee: number;
  flags: BoxFlag[];
  verdict:
    | 'Skip — exposure-only trap'
    | 'Fee below opportunity cost'
    | 'Marginally acceptable'
    | 'Take it — beats self-publish'
    | 'Negotiate — fee + royalties';
  verdictNote: string;
};

const FMT = (n: number) =>
  `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
const FMT2 = (n: number) =>
  `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Churn-adjusted health multiplier.
 * boxHealth 1 → subscriber lifetime ~20 mo (5%/mo churn, well-run box).
 * boxHealth 0 → lifetime ~5 mo (high churn, likely to fold — the KnitCrate
 * trajectory). We map lifetime to a payout-continuity weight capped at 1.
 */
function healthWeight(h: number): number {
  const clamped = Math.max(0, Math.min(1, h));
  const lifeMonths = 5 + clamped * 15; // 5..20 months
  // weight = expected fraction of an exclusive window paid before fold
  return Math.min(1, lifeMonths / 12);
}

function avgLifeMonths(h: number): number {
  const clamped = Math.max(0, Math.min(1, h));
  return 5 + clamped * 15;
}

export function analyzeBoxInclusion(input: BoxInclusionInput): BoxInclusionResult {
  const in_ = { ...input };

  const safe = (v: number) => (Number.isFinite(v) ? v : 0);
  const subs = Math.max(0, Math.round(safe(in_.subs)));
  const designerFee = safe(in_.designerFee);
  const royaltyPerBox = safe(in_.royaltyPerBox);
  const exclusiveMonths = Math.max(0, safe(in_.exclusiveMonths));
  const designHours = Math.max(0, safe(in_.designHours));
  const hourlyRate = safe(in_.hourlyRate);
  const patternPrice = Math.max(0, safe(in_.patternPrice));
  const selfPublishMonthly = Math.max(0, safe(in_.selfPublishEarningsMonthly));
  const signupsPct = Math.max(0, Math.min(1, safe(in_.listSignupsPct)));
  const listToSalePct = Math.max(0, Math.min(1, safe(in_.listToSalePct)));
  const waveFreqMonths = Math.max(1 / 12, safe(in_.waveFreqMonths));
  const boxHealth = safe(in_.boxHealth);
  const extraGoods = Math.max(0, safe(in_.extraGoodsValue));
  const rightsAssignment = Math.max(0, Math.min(1, safe(in_.rightsAssignment)));
  const byline = Math.max(0, Math.min(1, safe(in_.byline)));

  // Waves per year featuring you.
  const wavesPerYear = 12 / waveFreqMonths;

  // Per-wave direct income.
  const feeIncomePerWave = designerFee + royaltyPerBox * subs;

  // Exposure funnel per wave (only meaningful with a byline).
  const waveReach = subs * byline;
  const listSignups = waveReach * signupsPct;
  const funnelSales = listSignups * listToSalePct;
  const funnelRevenue = funnelSales * patternPrice;

  const goodwillValue = extraGoods;

  const timeCost = designHours * hourlyRate;

  // Opportunity drag: during exclusivity the pattern can't earn on your shop.
  // Modelled as the baseline self-publish income over the exclusive window,
  // amortised to an annual figure.
  const exclusivityDragPerYear = (selfPublishMonthly * exclusiveMonths) / 12;

  const grossPerWave = feeIncomePerWave + funnelRevenue + goodwillValue / wavesPerYear;
  const netPerWave = grossPerWave - timeCost / wavesPerYear;
  const annualNetEvRaw = netPerWave * wavesPerYear - exclusivityDragPerYear;

  const hw = healthWeight(boxHealth);
  const annualNetEv = annualNetEvRaw * hw;

  const avgSubscriberLifeMonths = avgLifeMonths(boxHealth);

  // Break-even fee: fee that makes annualNetEvRaw (health-unweighted,
  // fee-only scenario with zero funnel contribution) equal the exclusivity
  // drag it replaces — i.e. the fee needed to at least cover your time and
  // exclusivity against the self-publish baseline.
  const neededPerWave = timeCost / wavesPerYear + exclusivityDragPerYear / wavesPerYear;
  const breakEvenFee = Math.max(0, neededPerWave - royaltyPerBox * subs);

  // Fair floor: boxes assign $3-5 per pattern item at the $25 retail tier;
  // fair fee scales with box retail and the 40-50% gross-margin reality — a
  // healthy box can afford ~6% of retail per design slot.
  const fairFloorFee = Math.round(in_.boxPrice * 0.06 * 100) / 100;

  const flags: BoxFlag[] = [];

  if (subs > 0 && designerFee === 0 && royaltyPerBox === 0 && selfPublishMonthly > 0) {
    flags.push({
      id: 'BI-01',
      title: 'Exposure-only offer',
      note: `${FMT(fairFloorFee)}/item is what KnitCrate paid its featured designers at its $24.99 tier — a box charging ${FMT2(in_.boxPrice)} and paying $0 is betting its marketing budget with your unpaid work. The KnitCrate operators called themselves a "friend to indie makers" right up to the $1.45M loan default.`,
    });
  }

  if (designerFee > 0 && designerFee < 50) {
    flags.push({
      id: 'BI-02',
      title: 'Fee below the indie floor',
      note: `${FMT2(designerFee)} is inside KnitCrate's "max $3 per item" exploitation band once you divide it across design, swatching, tech-editing and sample knitting. Historically the box charged subscribers $24.99 for the privilege of seeing your name.`,
    });
  }

  if (exclusiveMonths >= 9 && exclusiveMonths / 12 > 0.7) {
    flags.push({
      id: 'BI-03',
      title: 'Exclusivity consumes your year',
      note: `A ${exclusiveMonths}-month lock keeps this design off your own shop for most of a selling year. Knitwear patterns earn most in Sep-Feb; a lock that spans that window costs you the season, not just the months.`,
    });
  }

  if (exclusiveMonths >= 6) {
    const foldMonths = avgSubscriberLifeMonths;
    if (foldMonths < exclusiveMonths) {
      flags.push({
        id: 'BI-04',
        title: 'Box lifetime shorter than your lock',
        note: `At this health score the average subscriber survives ~${foldMonths.toFixed(0)} months — the box may fold (KnitCrate, Nov 2022) before your ${exclusiveMonths}-month exclusivity ends, leaving you locked out of your own design with no residuals.`,
      });
    }
  }

  if (rightsAssignment > 0) {
    flags.push({
      id: 'BI-05',
      title: 'Rights assignment demanded',
      note: 'Assignment or first-publication capture means the design can never be re-sold, bundled, or re-released under your own name. A pattern you spent 24 hours on becomes someone else\'s asset permanently. Almost no indie box justifies that trade.',
    });
  }

  if (royaltyPerBox > 0 && royaltyPerBox < in_.boxPrice * 0.02) {
    flags.push({
      id: 'BI-06',
      title: 'Royalty under the margin floor',
      note: `At ${FMT2(in_.boxPrice)} retail, a 2% royalty is the floor a 40%+ gross-margin box can comfortably pay per design slot. Anything below reads as marketing budget wearing a royalty costume.`,
    });
  }

  if (in_.boxPrice > 0 && in_.boxPrice < 12) {
    flags.push({
      id: 'BI-07',
      title: 'Box price below sustainable margin',
      note: `A ${FMT2(in_.boxPrice)} box carrying yarn, shipping ($5-10), packaging, and 3PL assembly ($1.50-$4/box) is almost certainly running below the industry's 30% survival margin — a KnitCrate-style death spiral is the base case, not the exception.`,
    });
  }

  if (boxHealth < 0.35) {
    flags.push({
      id: 'BI-08',
      title: 'Weak box health',
      note: `A health score this low maps to ~${avgSubscriberLifeMonths.toFixed(0)} months of average subscriber life. Featured-designer payout stops the day the operator folds; ask who the parent company is and whether it carries SBA or senior debt before signing.`,
    });
  }

  if (byline === 0 && subs > 0) {
    flags.push({
      id: 'BI-09',
      title: 'Anonymous hire, zero exposure',
      note: 'Hooks & Needles-type boxes publish patterns by "designers that we hire" with no name in the booklet. With no byline, the exposure funnel is zero and you are being paid strictly for anonymous labour — judge the offer as a fee-only job, not a marketing deal.',
    });
  }

  // ---- Verdict ladder ----
  let verdict: BoxInclusionResult['verdict'];
  let verdictNote: string;

  const annualGross = (feeIncomePerWave + funnelRevenue + goodwillValue / wavesPerYear) * wavesPerYear;

  if (designerFee === 0 && royaltyPerBox === 0 && selfPublishMonthly > 0) {
    verdict = 'Skip — exposure-only trap';
    verdictNote = `Zero pay with a ${exclusiveMonths > 0 ? exclusiveMonths + '-month lock' : 'list-only ask'} converts your design time into the box's retention marketing. At 5% signup conversion on ${subs.toLocaleString()} subscribers you'd harvest ~${Math.round(waveReach * signupsPct * wavesPerYear).toLocaleString()} list joins a year — worth paying attention, not giving away a pattern. KnitCrate built a national brand on this exact trade and closed owing $2.95M.`;
  } else if (annualNetEv < 0) {
    verdict = 'Fee below opportunity cost';
    verdictNote = `Even at face value this deal loses ${FMT(Math.abs(annualNetEv))}/yr against your ${FMT(selfPublishMonthly)}/mo self-publish baseline once time (${designHours}h × ${FMT2(hourlyRate)}) and the ${exclusiveMonths}-month lock are priced in. You'd need ${FMT(breakEvenFee)} per wave just to stand still.`;
  } else if (annualNetEvRaw >= selfPublishMonthly * 12 * 0.9) {
    verdict = 'Take it — beats self-publish';
    verdictNote = `${FMT(annualNetEv)} health-adjusted annual net — this beats your own shop baseline even after the exclusivity lock. The fee is doing the honest work, not vague "exposure".`;
  } else if (annualNetEvRaw >= 0) {
    verdict = 'Marginally acceptable';
    verdictNote = `${FMT(annualNetEv)} health-adjusted vs ${FMT(selfPublishMonthly * 12)} from your own shop. The deal clears your time cost, but the lock and the box's mortality discount eat most of the edge. Only worth it if the byline audience is exactly your buyer.`;
  } else {
    verdict = 'Negotiate — fee + royalties';
    verdictNote = `Close, but not there: you'd need ${FMT(breakEvenFee)} per wave to match your shop. Push for that fee, add a per-box royalty (≥${FMT2(in_.boxPrice * 0.02)}), and shorten exclusivity to ${Math.min(exclusiveMonths, 3)} months — the box's 40%+ gross margin can afford it.`;
  }

  return {
    feeIncomePerWave,
    exposure: { waveReach, listSignups, funnelSales, funnelRevenue },
    goodwillValue,
    timeCost,
    exclusivityDragPerYear,
    annualNetEv,
    annualNetEvRaw,
    healthMultiplier: hw,
    avgSubscriberLifeMonths,
    breakEvenFee,
    fairFloorFee,
    flags,
    verdict,
    verdictNote,
  };
}
