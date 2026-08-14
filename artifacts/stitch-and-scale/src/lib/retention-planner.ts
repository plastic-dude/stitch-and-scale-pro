/**
 * Repeat Buyer & Retention Planner (CHK-029).
 *
 * Models the cheapest revenue a designer has: people who already bought.
 *
 * BENCHMARKS (documented in research/competitors-session-30-retention-economics.md):
 * - Acquiring a new customer costs 5–10× more than retaining an existing one
 *   (Churnkey/OPEX cost-comparison studies, 2026).
 * - DTC repeat purchase rate averages ~19–28% (BS&Co 18.8% across 156k stores,
 *   Sender 28.2%); a "healthy" rate is 20%+.
 * - Non-consumables (patterns are a durable purchase, not yarn) run ~10%
 *   repeat within 365 days without deliberate retention work.
 * - 59% of buyers are influenced by marketing email; 50%+ buy from marketing
 *   email at least monthly (SaleCycle crafts-industry stats).
 * - 17% of craft emails are deleted unread — send less, say more.
 *
 * All money math runs through the shared platformNet fee seam.
 */

import { platformNet, type PlatformId } from './pattern-income-calculator';

export type Verdict = 'go' | 'maybe' | 'no';

/** Email tooling tiers — flat monthly cost, covers a realistic growth path. */
export const EMAIL_TIERS = [
  { label: 'Free plan (up to ~500 contacts)', monthly: 0, maxContacts: 500 },
  { label: 'Starter (up to ~2.5k contacts)', monthly: 19, maxContacts: 2500 },
  { label: 'Growth (up to ~10k contacts)', monthly: 49, maxContacts: 10000 },
  { label: 'Pro (up to ~25k contacts)', monthly: 99, maxContacts: 25000 },
  { label: 'Scale (up to ~50k contacts)', monthly: 149, maxContacts: 50000 },
];

export interface RetentionInput {
  platform: PlatformId;
  /** Current email list size. */
  listSize: number;
  /** Share of the list that is active/engaged (open-capable), 0–100. */
  activeRatePct: number;
  /** Patterns released per month. */
  releasesPerMonth: number;
  /** Average pattern price ($). */
  avgPrice: number;
  /** How many subscribers buy a pattern at each release, % of the list, 0–100. */
  releasePurchaseRatePct: number;
  /** Share of last month's buyers who come back next release, % of buyers, 0–100. */
  repeatPurchaseRatePct: number;
  /** New list signups per month (growth). */
  listGrowthPerMonth: number;
  /** Cost to acquire one new fan (ads, promo threads, giveaways) in $. */
  acquisitionCostPerFan: number;
  /** Monthly email tooling cost in $. */
  emailToolingMonthly: number;
  /** How many patterns a typical subscriber knits per quarter (consumption). */
  patternsConsumedPerQuarter: number;
}

export const DEFAULT_RETENTION: RetentionInput = {
  platform: 'ravelry',
  listSize: 800,
  activeRatePct: 55,
  releasesPerMonth: 1,
  avgPrice: 8,
  releasePurchaseRatePct: 4,
  repeatPurchaseRatePct: 20,
  listGrowthPerMonth: 15,
  acquisitionCostPerFan: 3,
  emailToolingMonthly: 0,
  patternsConsumedPerQuarter: 2,
};

export interface CohortStep {
  label: string;
  buyers: number;
  /** Revenue from this step, net of platform fees. */
  netRevenue: number;
  /** Cost to produce this step's buyers. */
  cost: number;
}

export interface WatchOut {
  /** releasePurchaseRatePct above plausible email benchmark (6%). */
  optimisticPurchaseRate: boolean;
  /** repeatPurchaseRatePct below the healthy 20% line for a warm list. */
  weakRepeat: boolean;
  /** More releases than the base's consumption supports. */
  overRelease: boolean;
  /** Email tooling cost exceeds list revenue. */
  toolingOverhead: boolean;
  /** Acquisition spend exceeds retention math. */
  acquisitionWaste: boolean;
  items: string[];
}

export interface RetentionResult {
  /** Monthly buyers from the list at the current release cadence. */
  monthlyBuyers: number;
  /** Monthly revenue from those buyers, net of platform fees. */
  monthlyListRevenue: number;
  /** Monthly cost: tooling + (new fan acquisition cost). */
  monthlyCost: number;
  /** Monthly profit from the retention motion, net. */
  monthlyProfit: number;
  /** What one retained sale costs vs one acquired sale. */
  costPerRetainedSale: number;
  costPerAcquiredSale: number;
  retentionAdvantageMultiple: number;
  cohortLadder: CohortStep[];
  /** Projected list value over 12 months with growth and churn. */
  twelveMonthListRevenue: number;
  /** 12-month net profit from the retention motion. */
  twelveMonthNet: number;
  /** Cost to buy the same revenue through cold acquisition. */
  twelveMonthColdAcquisitionCost: number;
  watchOut: WatchOut;
  verdict: Verdict;
  verdictNote: string;
  welcomeEmail: string;
  releaseEmail: string;
}

export const RETENTION_STORAGE_KEY = 'rtpl-v1';

/** What a retained sale costs: tooling amortized across list size, tiny. */
const RETAINED_COST_PER_RECIPIENT = 0.005;

/** Email-driven purchase benchmark: ~5% of an active list buys a release
 *  (59% influenced × a 4% click-buy conversion band for a warm list). */
const EMAIL_PURCHASE_BENCHMARK_PCT = 5;

/** Healthy repeat rate for a warm email list: 20%+. */
const HEALTHY_REPEAT_PCT = 20;

function cohortNet(platform: PlatformId, price: number, buyers: number): number {
  return platformNet(platform, price, Math.max(buyers, 1)).netRevenue;
}

/**
 * Repeat buyer & retention analysis: list value, cohort ladder,
 * retention-vs-acquisition cost, 12-month projection, watch-outs, and
 * paste-ready emails.
 */
export function analyzeRetention(input: Partial<RetentionInput> = {}): RetentionResult {
  const p: RetentionInput = { ...DEFAULT_RETENTION, ...input };

  const net = platformNet(p.platform, p.avgPrice, 1);

  // --- Monthly motion
  const monthlyBuyers = Math.round((p.listSize * p.activeRatePct / 100) *
    (p.releasePurchaseRatePct / 100) * p.releasesPerMonth * 10) / 10;
  const monthlyListRevenue = Math.round(cohortNet(p.platform, p.avgPrice, monthlyBuyers) * 100) / 100;
  const monthlyCost = p.emailToolingMonthly +
    Math.round(p.listGrowthPerMonth * p.acquisitionCostPerFan * 100) / 100;
  const monthlyProfit = Math.round((monthlyListRevenue - monthlyCost) * 100) / 100;

  // --- Retained vs acquired cost
  const costPerRetainedSale = monthlyBuyers > 0
    ? Math.round((p.emailToolingMonthly + monthlyBuyers * RETAINED_COST_PER_RECIPIENT) /
        monthlyBuyers * 1000) / 1000
    : 0;
  // An acquired sale carries the full fan acquisition cost (the ad buys the
  // fan, not a single sale), while a retained sale costs near-zero tooling.
  const costPerAcquiredSale = p.acquisitionCostPerFan;
  const retainedMultiple = costPerRetainedSale > 0
    ? Math.round((costPerAcquiredSale / costPerRetainedSale) * 10) / 10
    : 0;

  // --- Cohort ladder: first sale → 2nd → 3rd → loyal (4+)
  const cohortLadder: CohortStep[] = [];
  const buyers = monthlyBuyers;
  const labels = ['First purchase', '2nd purchase', '3rd purchase', 'Loyal (4+)'];
  const r = p.repeatPurchaseRatePct / 100;
  // Each cohort converts at the repeat rate relative to the previous one —
  // a 20% repeat means the 3rd purchase is 4% of the first, loyal ~0.8%.
  const rates = [1, r, r * r, r * r * r];
  for (let i = 0; i < 4; i++) {
    const stepBuyers = Math.round(buyers * rates[i] * 10) / 10;
    const stepRevenue = cohortNet(p.platform, p.avgPrice, stepBuyers);
    const stepCost = stepBuyers * RETAINED_COST_PER_RECIPIENT;
    cohortLadder.push({
      label: labels[i],
      buyers: stepBuyers,
      netRevenue: Math.round(stepRevenue * 100) / 100,
      cost: Math.round(stepCost * 1000) / 1000,
    });
  }

  // --- 12-month projection with list growth and churn
  let projectedRevenue = 0;
  let totalNet = 0;
  let listSize = p.listSize;
  const monthlyChurnPct = Math.min(0.08, Math.max(0.01,
    (100 - p.activeRatePct) / 100 / 2 + 0.015));
  // Buyers this month = first-time purchases from the active list, plus
  // repeat purchases from the retained buyer pool from last month.
  let prevBuyers = 0;
  for (let m = 1; m <= 12; m++) {
    listSize = Math.round((listSize * (1 - monthlyChurnPct) + p.listGrowthPerMonth) * 10) / 10;
    const firstBuyers = listSize * (p.activeRatePct / 100) *
      (p.releasePurchaseRatePct / 100) * p.releasesPerMonth;
    const mBuyers = firstBuyers + prevBuyers * (p.repeatPurchaseRatePct / 100);
    const mRev = cohortNet(p.platform, p.avgPrice, mBuyers);
    projectedRevenue += mRev;
    totalNet += mRev - p.emailToolingMonthly - p.listGrowthPerMonth * p.acquisitionCostPerFan;
    prevBuyers = mBuyers;
  }
  const twelveMonthListRevenue = Math.round(projectedRevenue * 100) / 100;
  const twelveMonthNet = Math.round(totalNet * 100) / 100;
  // Cold acquisition would need to buy each of those buyers at full cost.
  const twelveMonthColdAcquisitionCost = Math.round(
    (projectedRevenue / net.netPerSale) * p.acquisitionCostPerFan * 100) / 100;

  // --- Watch-outs
  const items: string[] = [];
  const optimisticPurchaseRate = p.releasePurchaseRatePct > EMAIL_PURCHASE_BENCHMARK_PCT;
  const weakRepeat = p.repeatPurchaseRatePct < HEALTHY_REPEAT_PCT;
  const quarterlyCapacity = p.patternsConsumedPerQuarter;
  const quarterlyReleases = p.releasesPerMonth * 3;
  const overRelease = quarterlyReleases > quarterlyCapacity + 1;
  const toolingOverhead = p.emailToolingMonthly > 0 &&
    monthlyListRevenue > 0 && p.emailToolingMonthly > monthlyListRevenue * 0.25;
  const acquisitionWaste = p.acquisitionCostPerFan > net.netPerSale * 1.5;
  if (optimisticPurchaseRate)
    items.push(`A ${p.releasePurchaseRatePct}% purchase rate per release is above the ~5% email benchmark — most of the list watches, doesn't buy every drop.`);
  if (weakRepeat)
    items.push(`A ${p.repeatPurchaseRatePct}% repeat rate is under the 20% line for a warm list. Buyers who don't come back for the 2nd pattern rarely come back at all.`);
  if (overRelease)
    items.push(`Releasing ${quarterlyReleases} pattern(s)/quarter against a base that knits ~${quarterlyCapacity}/quarter — the excess trains buyers to wait for the sale.`);
  if (toolingOverhead)
    items.push(`Email tooling at ${fmt$(p.emailToolingMonthly)}/mo eats ${
      (p.emailToolingMonthly / Math.max(monthlyListRevenue, 1) * 100).toFixed(0)}% of list revenue — downgrade the tier until the list grows into it.`);
  if (acquisitionWaste)
    items.push(`Acquiring a fan at ${fmt$(p.acquisitionCostPerFan)} against a ${fmt$(net.netPerSale)} net sale is underwater — one sale doesn't pay for the fan. Budget for the 2nd+ sale.`);

  const watchOut: WatchOut = {
    optimisticPurchaseRate,
    weakRepeat,
    overRelease,
    toolingOverhead,
    acquisitionWaste,
    items,
  };

  // --- Verdict
  let verdict: Verdict;
  let verdictNote: string;
  if (monthlyProfit > 0 && !acquisitionWaste) {
    verdict = 'go';
    verdictNote = `The retention motion nets ${fmt$(monthlyProfit)}/mo — keeping buyers is 5–10× cheaper than finding new ones, and the list pays for itself.`;
  } else if (monthlyProfit > -net.netRevenue * 0.5) {
    verdict = 'maybe';
    verdictNote = monthlyProfit <= 0
      ? `The list isn't yet profitable at this cadence (${fmt$(monthlyProfit)}/mo) — cut tooling tier or price higher before scaling growth spend.`
      : `The retention motion nets ${fmt$(monthlyProfit)}/mo but acquisition spend is underwater per first sale — budget against the 2nd+ purchase.`;
  } else {
    verdict = 'no';
    verdictNote = `The retention motion loses ${fmt$(Math.abs(monthlyProfit))}/mo — fix the purchase rate or the cadence before buying more fans.`;
  }

  const releaseEmail = [
    'Subject: new pattern is live (and you get first pick)',
    '',
    'Hi {first name},',
    '',
    'The {pattern name} pattern is live — for the next 48 hours it is {discount} for people on this list, then it goes to full price.',
    '',
    '{one sentence: what it is and who it is for}',
    '',
    '{link}',
    '',
    'Back soon with the next one,',
    '{designer name}',
  ].join('\n');

  const welcomeEmail = [
    'Subject: here is your free pattern — and a heads-up on what comes next',
    '',
    'Hi {first name},',
    '',
    'Your free {pattern name} pattern is attached. If the instructions make sense and the finish feels right, that is exactly what every paid pattern of mine looks like.',
    '',
    'You will hear from me roughly {releasesPerMonth} release(s) a month — first pick, early pricing, and the occasional design story. No noise; craft emails deserve better than weekly begging.',
    '',
    'If you knit {pattern name}, I would love a project photo.',
    '',
    'Welcome to the row,',
    '{designer name}',
  ].join('\n').replace('{releasesPerMonth}', p.releasesPerMonth >= 2 ? '2' : '1');

  return {
    monthlyBuyers,
    monthlyListRevenue,
    monthlyCost,
    monthlyProfit,
    costPerRetainedSale,
    costPerAcquiredSale,
    retentionAdvantageMultiple: retainedMultiple,
    cohortLadder,
    twelveMonthListRevenue,
    twelveMonthNet,
    twelveMonthColdAcquisitionCost,
    watchOut,
    verdict,
    verdictNote,
    welcomeEmail,
    releaseEmail,
  };
}

function fmt$(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

/** Pick the email tier that fits a list size, cheapest that covers it. */
export function tierForListSize(listSize: number) {
  return EMAIL_TIERS.find((t) => listSize <= t.maxContacts) ?? EMAIL_TIERS[EMAIL_TIERS.length - 1];
}
