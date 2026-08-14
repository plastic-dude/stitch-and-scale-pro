/**
 * KAL Planner — Model the economics of a knit-along before committing to run it.
 *
 * No tool in the market prices a KAL. Ravelry offers calendar events and
 * groups; prize budgets, sponsor yarn, workload timelines, and post-KAL
 * sustain are all ad-hoc in spreadsheets. This module puts a real P&L on
 * the four KAL formats designers actually run.
 *
 * Benchmarks baked in (session-38 research):
 * - Indie designer revenue is brutal: Ravelry's best-ever January produced
 *   avg $203/designer; 72% earned under $50 (MediaPeruana).
 * - A sweater pattern costs ~55 labour hours and ~$155 direct costs
 *   (tech edit $40, model $40, yarn $75); breakeven ~24 copies at $6.50.
 * - Typical KAL prizes are $10–50 yarn gift cards; prize donors are yarn
 *   companies (Malabrigo, Hobbii); milestone giveaways reach ~$500.
 * - Mystery KALs (Westknits MSKAL model) release one clue per week for
 *   4 weeks — the highest-engagement format, with a real per-clue workload.
 * - Launch-window uplift from a well-run KAL: conservative 2–4x the base
 *   weekly launch rate, decaying to baseline within ~2 weeks.
 * - Afterglow: a KAL extends the long tail; modelled as ~1.1–1.3x base
 *   weekly rate for 8 weeks post-event, from the audience the KAL built.
 * - Prize-floor wisdom: prizes under ~$10 barely move sign-ups; prizes
 *   above the expected lift revenue are charity, not marketing.
 */

export type KalFormat = 'launch' | 'mystery' | 'guild' | 'seasonal';

export const KAL_FORMAT_LABELS: Record<KalFormat, string> = {
  launch: 'Pattern launch KAL (2–8 weeks, accountability)',
  mystery: 'Mystery KAL (clue a week, 4 weeks)',
  guild: 'Guild / LYS class KAL (paid sessions)',
  seasonal: 'Seasonal / repeatable KAL (annual events)',
};

export interface KalInput {
  format: KalFormat;
  /** Pattern price the KAL promotes, $ (0 if free). */
  patternPrice: number;
  /** Base weekly sales rate the pattern achieves without a KAL, copies/week. */
  baseWeeklySales: number;
  /** KAL duration in weeks. */
  durationWeeks: number;
  /** Number of prizes offered across the KAL. */
  prizeCount: number;
  /** Average value per prize, $ (sponsored gift cards etc.). */
  prizeValue: number;
  /** Value of yarn sponsors who donate directly, $ (0 = none). */
  yarnSponsorValue: number;
  /** Sample yarn the designer must buy, $ (0 = none). */
  sampleCost: number;
  /** Designer's own hourly cost, $/hr (opportunity cost of running it). */
  hourlyCost: number;
  /** Total hours expected: planning, hosting, support, prize admin. */
  totalHours: number;
  /** Launch-window sales multiplier vs base rate (conservative 2–4). */
  launchLiftFactor: number;
  /** Afterglow multiplier on base weekly sales for the 8 post-KAL weeks. */
  afterglowFactor: number;
  /** Per-clue support hours for mystery KALs (drafting + tech edit + hosting). */
  mysteryHoursPerClue?: number;
  /** Guild/seasonal format: per-session fee income, $ (0 = not applicable). */
  sessionFeeIncome?: number;
  /** Guild/seasonal format: number of paid sessions. */
  sessionCount?: number;
}

export const DEFAULT_KAL: KalInput = {
  format: 'launch',
  patternPrice: 6.5,
  baseWeeklySales: 3,
  durationWeeks: 4,
  prizeCount: 3,
  prizeValue: 25,
  yarnSponsorValue: 0,
  sampleCost: 75,
  hourlyCost: 20,
  totalHours: 20,
  launchLiftFactor: 2.5,
  afterglowFactor: 1.15,
  mysteryHoursPerClue: 4,
  sessionFeeIncome: 0,
  sessionCount: 0,
};

export interface KalResult {
  /** Total prize + sample spend after sponsor offset. */
  totalPrizeSpend: number;
  /** Launch-window (KAL duration) sales in copies. */
  launchWindowSales: number;
  /** Launch-window revenue, $. */
  launchWindowRevenue: number;
  /** 8-week afterglow extra sales in copies. */
  afterglowSales: number;
  /** 8-week afterglow extra revenue, $. */
  afterglowRevenue: number;
  /** Guild/seasonal session fee income, $. */
  feeIncome: number;
  /** Designer hours cost. */
  hoursCost: number;
  /** Net P&L of the whole KAL, $. */
  net: number;
  /** Pattern copies needed to recover prize+sample spend at this price. */
  prizeRecoveryCopies: number;
  /** Weeks of KAL uplift needed to cover prize spend — vs actual duration. */
  prizeRecoveryWeeks: number;
  /** For mystery format: clue timeline (per-clue workload breakdown). */
  clueTimeline?: { clueNumber: number; draftingHours: number; techEditHours: number; week: number }[];
  /** Red flags with actionable detail. */
  redFlags: { id: string; label: string; detail: string }[];
  verdict: 'skip' | 'hold' | 'go';
  verdictReason: string;
  /** One-line planner recommendation. */
  suggestion: string;
}

/** Mystery KAL clue workload timeline: 4 clues, each clue = drafting + tech edit. */
function buildClueTimeline(input: KalInput): KalResult['clueTimeline'] {
  const perClue = input.mysteryHoursPerClue ?? 4;
  return Array.from({ length: 4 }, (_, i) => ({
    clueNumber: i + 1,
    draftingHours: Math.round((perClue * 2 / 3) * 10) / 10,
    techEditHours: Math.round((perClue * 1 / 3) * 10) / 10,
    week: i + 1,
  }));
}

/**
 * Full KAL economics: P&L, prize recovery, timeline, flags, verdict.
 */
export function analyzeKal(raw: Partial<KalInput>): KalResult {
  const input = { ...DEFAULT_KAL, ...raw } as KalInput;

  const totalPrizeSpend = Math.max(0, input.prizeCount * input.prizeValue + input.sampleCost - input.yarnSponsorValue);
  const perWeekUplift = Math.max(0, input.baseWeeklySales) * Math.max(0, input.launchLiftFactor - 1);
  const baseDuringKal = Math.max(0, input.baseWeeklySales) * input.durationWeeks;
  const launchWindowSales = Math.round((baseDuringKal + perWeekUplift * input.durationWeeks) * 100) / 100;
  const launchWindowRevenue = Math.round(launchWindowSales * Math.max(0, input.patternPrice) * 100) / 100;
  // Afterglow: extra copies over 8 post-KAL weeks at (afterglowFactor − 1) × base.
  const afterglowSales = Math.round(
    Math.max(0, input.baseWeeklySales) * Math.max(0, input.afterglowFactor - 1) * 8 * 100,
  ) / 100;
  const afterglowRevenue = Math.round(afterglowSales * Math.max(0, input.patternPrice) * 100) / 100;
  const feeIncome = Math.max(0, (input.sessionFeeIncome ?? 0) * Math.max(0, input.sessionCount ?? 0));
  const hoursCost = Math.round(Math.max(0, input.totalHours) * Math.max(0, input.hourlyCost) * 100) / 100;
  const net = Math.round((launchWindowRevenue + afterglowRevenue + feeIncome - totalPrizeSpend - hoursCost) * 100) / 100;

  const prizeRecoveryCopies = input.patternPrice > 0
    ? Math.round((totalPrizeSpend / input.patternPrice) * 100) / 100
    : Infinity;
  const upliftRevenuePerWeek = perWeekUplift * Math.max(0, input.patternPrice);
  const prizeRecoveryWeeks = upliftRevenuePerWeek > 0
    ? Math.round((totalPrizeSpend / upliftRevenuePerWeek) * 10) / 10
    : Infinity;

  const clueTimeline = input.format === 'mystery' ? buildClueTimeline(input) : undefined;

  const redFlags: KalResult['redFlags'] = [];

  // K-01: prize spend exceeds expected total revenue (charity, not marketing).
  if (totalPrizeSpend > 0 && launchWindowRevenue + afterglowRevenue + feeIncome < totalPrizeSpend) {
    redFlags.push({
      id: 'K-01',
      label: 'Prize spend outruns revenue',
      detail: `$${totalPrizeSpend.toFixed(0)} in prizes vs ~$${(launchWindowRevenue + afterglowRevenue + feeIncome).toFixed(0)} expected revenue — this KAL pays out more than it earns.`,
    });
  }
  // K-02: prizes too cheap to move sign-ups.
  if (input.prizeCount > 0 && input.prizeValue > 0 && input.prizeValue < 10) {
    redFlags.push({
      id: 'K-02',
      label: 'Prizes under the motivation floor',
      detail: '$10 gift cards barely move KAL sign-ups; $25–50 (or a yarn-company sponsor) is the range that actually fills the group.',
    });
  }
  // K-03: mystery timeline unrealistic (less than 4 weeks).
  if (input.format === 'mystery' && input.durationWeeks < 4) {
    redFlags.push({
      id: 'K-03',
      label: 'Mystery cadence squeezed',
      detail: 'The proven mystery KAL model (Westknits) runs 4 weekly clues; squeezing below that starves the reveal structure.',
    });
  }
  // K-04: designer hours dominate the outcome at this price.
  if (hoursCost > 0 && launchWindowRevenue + afterglowRevenue + feeIncome > 0 &&
      hoursCost > (launchWindowRevenue + afterglowRevenue + feeIncome) * 0.6) {
    redFlags.push({
      id: 'K-04',
      label: 'Unpaid labour eats the KAL',
      detail: `$${hoursCost.toFixed(0)} of your time vs ~$${(launchWindowRevenue + afterglowRevenue + feeIncome).toFixed(0)} revenue — pattern visibility is real, but budget it as marketing spend, not free.`,
    });
  }
  // K-05: no sample budget despite launching a pattern.
  if (input.format === 'launch' && input.sampleCost === 0 && input.patternPrice > 0) {
    redFlags.push({
      id: 'K-05',
      label: 'No sample in the budget',
      detail: 'A KAL with no sample photo converts far worse; the ~$75 sample is the cheapest marketing line in the whole plan.',
    });
  }
  // K-06: guild/seasonal with zero fee income.
  if ((input.format === 'guild' || input.format === 'seasonal') && feeIncome === 0) {
    redFlags.push({
      id: 'K-06',
      label: 'Guild/seasonal without fee income',
      detail: 'LYS and guild formats carry explicit session fees ($30–60/hr, or flat $150–300/day) — an unpaid one should run through the Teach tab instead.',
    });
  }

  let verdict: KalResult['verdict'] = 'go';
  let verdictReason = '';
  if (redFlags.some(f => f.id === 'K-01')) {
    verdict = 'skip';
    verdictReason = 'The KAL loses money even counting afterglow — either drop prizes, get a yarn sponsor, or skip it and let the pattern sell organically.';
  } else if (redFlags.length > 0) {
    verdict = 'hold';
    verdictReason = 'The P&L works, but flagged items should be fixed before announcing the KAL.';
  } else {
    verdict = 'go';
    verdictReason = 'Prize spend pays for itself within the KAL window, and afterglow keeps earning for 8 weeks.';
  }

  let suggestion = '';
  if (verdict === 'skip') {
    suggestion = 'Ask a yarn company to sponsor prizes (Malabrigo/Hobbii-style donorship is common) — their samples drive their sales too.';
  } else if (verdict === 'hold') {
    const cheapPrize = redFlags.find(f => f.id === 'K-02');
    suggestion = cheapPrize
      ? 'Raise prize value to $25–50 or recruit a yarn-company donor; KAL entry rates jump at that level.'
      : 'Fix the flagged item first — the P&L is healthy enough that one correction makes this a clean go.';
  } else {
    suggestion = input.format === 'mystery'
      ? 'Lock the 4-week clue calendar now: draft each clue ~2/3 of the per-clue hours, tech-edit the rest, and schedule the grand reveal as the final-week post.'
      : 'Announce 2–3 weeks out, open the KAL group at listing launch, and keep the prize draw in the final week to hold attendance.';
  }

  return {
    totalPrizeSpend,
    launchWindowSales,
    launchWindowRevenue,
    afterglowSales,
    afterglowRevenue,
    feeIncome,
    hoursCost,
    net,
    prizeRecoveryCopies,
    prizeRecoveryWeeks,
    clueTimeline,
    redFlags,
    verdict,
    verdictReason,
    suggestion,
  };
}
