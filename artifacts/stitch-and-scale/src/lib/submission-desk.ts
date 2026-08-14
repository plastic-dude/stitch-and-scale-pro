/**
 * Submission Desk — price a magazine / box / book call-for-submissions before signing.
 *
 * No tool in the market prices a call-for-submissions. Designers compare a "design for
 * our box" or "submit to our issue" offer against self-publishing with a gut feeling and
 * a spreadsheet. This module prices both sides on one ledger: the offer's effective hourly
 * rate, the fee floor your own labour demands, the revenue you surrender during the
 * exclusivity window (your own store can't sell the pattern while it's exclusive), and the
 * tail that comes back when rights return — plus the red flags every designer burns
 * themselves on at least once.
 *
 * Benchmarks baked in (session-39 research, all sourced):
 * - Indie magazines (Laine, Pom Pom and peers) pay by difficulty and cap at roughly $900
 *   for a sweater design covering 50–85 hours of design + sampling + grading
 *   (aimeeshermakes.com, verified against Laine's own submissions page).
 * - Laine keeps EXCLUSIVE rights for 5 months from publication day, then the designer is
 *   free to sell the pattern again; the designer knits the sample and runs the secret test
 *   knit, Laine does the tech edit.
 * - The pattern cost stack (MediaPeruana BTS, cross-confirmed by session-38 numbers):
 *   tech edit $40, model/photography $40, yarn $75 — roughly $155 direct per sweater cycle.
 * - Ravelry reality: $1,000 of revenue loses ~$35 to Ravelry fees and ~$130 to PayPal; the
 *   median designer takes $203 in January, 72% under $50 (session 38, MediaPeruana).
 * - The cautionary tale is KnitCrate (fka Craftisio), which collapsed Dec 2022 owing
 *   designer partners December pay and ~$2.95M to lenders; designers report it demanded
 *   85% wholesale discounts and paid contributing artists a MAX of $3 per item.
 *   Source: r/craftsnark + SBA loan filings.
 *
 * The two sides of the ledger:
 * - Offer side: flat fee (+ royalty if rare), plus yarn support value, minus the direct
 *   costs the offer forces you to eat (sample, model, tech edit) and your labour.
 * - Self-publish side (the alternative you're giving up): your own store keeps selling
 *   weekly. Exclusivity silences that machine for the window; when rights return, sales
 *   resume and ramp over ~8 weeks.
 */

export type OfferType = 'magazine' | 'box' | 'book';
export type Difficulty = 'accessory' | 'sweater' | 'other';

export const OFFER_TYPE_LABELS: Record<OfferType, string> = {
  magazine: 'Magazine submission (Laine/Pom Pom style)',
  box: 'Subscription box design (one box cohort)',
  book: 'Anthology / book contribution',
};

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  accessory: 'Accessory (hat, scarf, cowl, socks, mitts)',
  sweater: 'Sweater / cardigan',
  other: 'Blanket, home, other large format',
};

/**
 * Benchmark constants — every number here cites session-39 research (see
 * docs/competitors research files). Used as defaults AND as the yardstick behind
 * the red flags.
 */
export const MAGAZINE_SWEATER_CEILING = 900; // $ — upper bound for a magazine sweater fee
export const SWEATER_HOURS_RANGE = { min: 50, max: 85 }; // design + sampling + grading
export const ACCESSORY_HOURS_RANGE = { min: 15, max: 35 };
export const TECH_EDIT_COST = 40; // $ — MediaPeruana BTS figure
export const MODEL_COST = 40; // $ — model/photography, same source
export const YARN_COST = 75; // $ — sample yarn, same source
export const KNITCRATE_MAX_ITEM_FEE = 3; // $ — KnitCrate paid artists this, MAX, before collapse
export const KNITCRATE_DEMAND_DISCOUNT = 0.85; // demanded wholesale discount from dyers
export const LAINE_EXCLUSIVITY_MONTHS = 5; // exclusive rights window from publication day
export const RIGHTS_RETURN_RAMP_WEEKS = 8; // weeks of post-exclusivity sales ramp
export const WEEKS_PER_MONTH = 4.33; // calendar-month → week conversion for exclusivity math
export const RAVELRY_MEDIAN_JAN = 203; // $ — median Ravelry January income, whole site

export interface SubmissionInput {
  offerType: OfferType;
  /** Flat fee the offer pays, $ (0 = exposure-only). */
  fee: number;
  difficulty: Difficulty;
  /** Exclusive-rights window in months (Laine-style: 5). 0 = non-exclusive. */
  exclusivityMonths: number;
  /** What you must spend on the sample the offer requires, $. */
  sampleCost: number;
  /** Model/photography you must fund yourself, $. */
  modelCost: number;
  /** Tech editing you must fund yourself, $. */
  techEditCost: number;
  /** Total hours you'll spend: design, drafting, sampling, test-knit running, admin. */
  labourHours: number;
  /** Your own hourly rate, $/hr — the floor the fee must clear. */
  hourlyRate: number;
  /** Yarn the offer supplies/supports, $ value (0 = none). */
  yarnSupportValue: number;
  /** Royalty share the offer adds, % (rare — box deals occasionally). */
  royaltyPct: number;
  /** What the pattern sells for on your own store, $. */
  patternPrice: number;
  /** Weekly copies it sells on your own store when un-exclusive. */
  weeklyOwnSales: number;
}

export const DEFAULT_SUBMISSION: SubmissionInput = {
  offerType: 'magazine',
  fee: 500,
  difficulty: 'sweater',
  exclusivityMonths: 5,
  sampleCost: 75,
  modelCost: 0,
  techEditCost: 0,
  labourHours: 65,
  hourlyRate: 20,
  yarnSupportValue: 75,
  royaltyPct: 0,
  patternPrice: 6.5,
  weeklyOwnSales: 3,
};

export interface SubmissionResult {
  /** Fee + royalty + yarn support + rights-return tail, minus direct costs and labour. $ */
  netOutcome: number;
  /** What the deal pays per hour of your labour, including the tail. $/hr. */
  effectiveHourly: number;
  /** Your labour alone, at your own rate. The minimum the fee should clear. $ */
  floorFee: number;
  /** Your own-store revenue silenced during the exclusive window. $ */
  exclusivityDeadLoss: number;
  /** Post-exclusivity sales ramp: 8 weeks of gradually-returned traffic. $ */
  rightsReturnTail: number;
  /** The fee needed to break even vs self-publishing, given costs, labour and dead-loss. $ */
  breakEvenFee: number;
  redFlags: { id: string; label: string; detail: string }[];
  verdict: 'go' | 'hold' | 'no';
  verdictReason: string;
  /** One-line desk recommendation. */
  suggestion: string;
}

const clampN = (v: number, min: number, max: number): number =>
  Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : min;

/**
 * Price the whole decision: the offer's true net against self-publishing, the red flags,
 * and a verdict. Pure math — no UI.
 */
export function analyzeSubmission(raw: Partial<SubmissionInput>): SubmissionResult {
  const input: SubmissionInput = {
    ...DEFAULT_SUBMISSION,
    ...raw,
    offerType: (['magazine', 'box', 'book'].includes(raw.offerType ?? '') ? raw.offerType : 'magazine') as OfferType,
    difficulty: (['accessory', 'sweater', 'other'].includes(raw.difficulty ?? '') ? raw.difficulty : 'sweater') as Difficulty,
    fee: clampN(raw.fee ?? DEFAULT_SUBMISSION.fee, 0, 100000),
    exclusivityMonths: clampN(raw.exclusivityMonths ?? DEFAULT_SUBMISSION.exclusivityMonths, 0, 24),
    labourHours: clampN(raw.labourHours ?? DEFAULT_SUBMISSION.labourHours, 0, 10000),
    hourlyRate: clampN(raw.hourlyRate ?? DEFAULT_SUBMISSION.hourlyRate, 0, 10000),
    royaltyPct: clampN(raw.royaltyPct ?? DEFAULT_SUBMISSION.royaltyPct, 0, 100),
    patternPrice: clampN(raw.patternPrice ?? DEFAULT_SUBMISSION.patternPrice, 0, 10000),
    weeklyOwnSales: clampN(raw.weeklyOwnSales ?? DEFAULT_SUBMISSION.weeklyOwnSales, 0, 10000),
  };

  // ---- the offer's money ----
  const directCosts = input.sampleCost + input.modelCost + input.techEditCost;
  const labourCost = input.labourHours * input.hourlyRate;
  const yarnSupport = input.yarnSupportValue;
  const feeWithRoyalty = input.fee; // royalty handled as tail, see below

  // ---- the rights-return tail: when exclusivity ends, sales come back and ramp over 8 weeks ----
  // Linear ramp: week i of the ramp earns i/RAMP of a full sales week.
  const rampSum = RIGHTS_RETURN_RAMP_WEEKS * (RIGHTS_RETURN_RAMP_WEEKS + 1) / 2 / RIGHTS_RETURN_RAMP_WEEKS;
  const rightsReturnTail = input.patternPrice * input.weeklyOwnSales * rampSum;
  // Box royalty tail: royalty on assumed box-cohort volume during the exclusive window.
  const royaltyTail =
    input.royaltyPct > 0 && input.offerType === 'box'
      ? (input.royaltyPct / 100) * input.patternPrice * input.weeklyOwnSales * 2 * WEEKS_PER_MONTH // cohort ≈ 2-month run
      : 0;

  // ---- what self-publishing would have paid during the exclusive window ----
  const exclusivityWeeks = input.exclusivityMonths * WEEKS_PER_MONTH;
  const exclusivityDeadLoss = input.patternPrice * input.weeklyOwnSales * exclusivityWeeks;

  const totalIn = input.fee + yarnSupport + rightsReturnTail + royaltyTail;
  const totalOut = directCosts + labourCost;
  const netOutcome = Math.round((totalIn - totalOut) * 100) / 100;

  const effectiveHourly = input.labourHours > 0
    ? Math.round((netOutcome / input.labourHours) * 100) / 100
    : 0;

  const floorFee = Math.round(labourCost * 100) / 100;
  // Break-even vs self-publishing: fee that makes the offer match what own-store would earn,
  // net of direct costs and labour.
  const breakEvenFee = Math.round((exclusivityDeadLoss + labourCost + directCosts - yarnSupport - rightsReturnTail - royaltyTail) * 100) / 100;

  // ---- red flags ----
  const redFlags: SubmissionResult['redFlags'] = [];

  // S-01: fee below the designer's own labour floor.
  if (input.fee > 0 && input.fee < floorFee * 0.75) {
    redFlags.push({
      id: 'S-01',
      label: 'Fee under your labour floor',
      detail: `The offer pays $${input.fee.toFixed(0)} but ${input.labourHours}h at your $${input.hourlyRate}/hr rate is worth $${floorFee.toFixed(0)} — the fee clears less than 75% of your time. A good floor for negotiation.`,
    });
  }

  // S-02: exposure-only offer — the classic trap.
  if (input.fee === 0 && input.yarnSupportValue === 0) {
    redFlags.push({
      id: 'S-02',
      label: 'Exposure-only offer',
      detail: 'No fee and no yarn support: the offer monetizes your labour into their marketing. KnitCrate was the extreme version — designers eventually owed pay, not given it.',
    });
  }

  // S-03: exclusivity longer than the industry benchmark (Laine: 5 months).
  if (input.exclusivityMonths > LAINE_EXCLUSIVITY_MONTHS) {
    redFlags.push({
      id: 'S-03',
      label: 'Exclusivity beyond the benchmark window',
      detail: `${input.exclusivityMonths} months exclusive vs the 5-month industry standard (Laine). Each extra month silences ~$${(input.patternPrice * input.weeklyOwnSales * WEEKS_PER_MONTH).toFixed(0)} of your own-store sales.`,
    });
  }

  // S-04: sample cost uncompensated — the offer should eat the sample or pay for it.
  if (input.sampleCost > 0 && input.yarnSupportValue < input.sampleCost) {
    redFlags.push({
      id: 'S-04',
      label: 'Sample cost uncompensated',
      detail: `You're funding a $${input.sampleCost.toFixed(0)} sample with only $${input.yarnSupportValue.toFixed(0)} of yarn support. In the Laine model the magazine arranges yarn-company support — ask for the same.`,
    });
  }

  // S-05: rights transfer beyond the exclusivity window — a red line.
  if (input.exclusivityMonths > 0 && input.offerType === 'book') {
    redFlags.push({
      id: 'S-05',
      label: 'Book rights often outlive the window',
      detail: 'Anthologies frequently ask for first/second-print rights or perpetual print rights. Confirm in writing exactly when rights revert and that you may re-sell on your own store after exclusivity ends.',
    });
  }

  // S-06: single-buyer concentration — KnitCrate risk. One buyer going dark takes the deal with it.
  if (input.offerType === 'box') {
    redFlags.push({
      id: 'S-06',
      label: 'Box-channel concentration risk',
      detail: 'Box income depends entirely on one subscriber base staying solvent — KnitCrate owed its artists December pay when it collapsed in Dec 2022 after $2.95M in lender debt. Never let one box become your main channel; model it as volatile.',
    });
  }

  // S-07: yarn support below the actual yarn cost.
  if (input.sampleCost > 0 && input.yarnSupportValue > 0 && input.yarnSupportValue < YARN_COST) {
    redFlags.push({
      id: 'S-07',
      label: 'Yarn support below sample yarn cost',
      detail: `$${input.yarnSupportValue.toFixed(0)} of support vs ~$${YARN_COST} typical sample yarn (MediaPeruana BTS). The standard $40/$40/$75 stack (tech edit / model / yarn) exists so you can point at it: ask for $${YARN_COST.toFixed(0)} or a yarn-company sponsorship.`,
    });
  }

  // ---- verdict ----
  const offerBelowMarketCeiling = input.difficulty === 'sweater' && input.fee > 0 && input.fee > MAGAZINE_SWEATER_CEILING;

  let verdict: SubmissionResult['verdict'] = 'go';
  let verdictReason = '';
  if (input.fee === 0 && input.yarnSupportValue === 0) {
    verdict = 'no';
    verdictReason = 'No money anywhere in this offer — your labour funds someone else\'s audience. Only ever take exposure-only if the audience reach is worth $1,000+ of your own-store marketing and you keep full rights.';
  } else if (netOutcome < 0 && input.exclusivityMonths > 0) {
    verdict = 'no';
    verdictReason = 'The deal loses money after labour, costs and the sales you surrender during exclusivity — self-publishing beats it on the ledger.';
  } else if (effectiveHourly < input.hourlyRate * 0.5) {
    verdict = 'hold';
    verdictReason = `The effective rate lands around $${effectiveHourly.toFixed(0)}/hr vs your $${input.hourlyRate}/hr floor — negotiate the fee toward $${breakEvenFee.toFixed(0)} (the self-publish break-even) before accepting.`;
  } else if (redFlags.length > 0 && (redFlags.length >= 2 || input.exclusivityMonths > LAINE_EXCLUSIVITY_MONTHS)) {
    verdict = 'hold';
    verdictReason = 'The P&L is positive but several flagged terms stack up — fix them in writing before signing.';
  } else if (redFlags.length > 0) {
    verdict = 'go';
    verdictReason = 'Net-positive deal, but one flagged term deserves a negotiation note before you commit.';
  } else {
    verdict = 'go';
    verdictReason = offerBelowMarketCeiling
      ? 'The offer clears your floor, covers the exclusivity loss, and beats the magazine market ceiling — a strong deal.'
      : 'The offer clears your floor and survives the exclusivity math — clean to accept.';
  }

  let suggestion = '';
  if (verdict === 'no') {
    suggestion = input.fee === 0
      ? 'Counter with the break-even fee of $' + breakEvenFee.toFixed(0) + ' — it is what self-publishing would earn, net of costs. If they say no, your own store is the better job.'
      : 'Walk to self-publishing: price the pattern on your own store and run the KAL tab to amplify the launch window instead.';
  } else if (verdict === 'hold') {
    const s03 = redFlags.find(f => f.id === 'S-03');
    suggestion = s03
      ? `Negotiate the window down to ~${LAINE_EXCLUSIVITY_MONTHS} months (the Laine standard) and non-exclusive rights for your own store's archive page — that alone recovers ~$${(input.patternPrice * input.weeklyOwnSales * (input.exclusivityMonths - LAINE_EXCLUSIVITY_MONTHS) * WEEKS_PER_MONTH).toFixed(0)}.`
      : `Ask for the fee at or above the $${breakEvenFee.toFixed(0)} break-even — that number is your own store's earnings, so it is a fair anchor, not a demand.`;
  } else {
    suggestion = 'Lock the rights-reversion date in writing, calendar the exclusivity end date, and prep your own-store listing to drop the day rights return — the tail is where box/magazine deals quietly earn.';
  }

  return {
    netOutcome,
    effectiveHourly,
    floorFee,
    exclusivityDeadLoss,
    rightsReturnTail,
    breakEvenFee,
    redFlags,
    verdict,
    verdictReason,
    suggestion,
  };
}
