/**
 * Listing Test Lab engine (CHK-058)
 *
 * Session-58 research angle: competitors (Alura A/B, Listybox, generic SEO
 * score tools) tell a pattern designer WHAT to change but never whether the
 * change pays. Alura assumes ~30,000 visitors per variant — impossible for a
 * single pattern listing. This engine applies honest low-traffic statistics:
 *
 *   - Evan Miller's normal-approximation sample formula (power 0.8, α 0.05):
 *       n = (z(α/2)√(2p̄q̄) + z(β)√(p₁q₁ + p₂q₂))² / (p₂ − p₁)²
 *   - Detectability: the smallest lift a listing's traffic can prove
 *     (only ~6x conversion improvements are detectable at low traffic).
 *   - Break-even: months of revenue uplift needed to repay the re-list hours.
 *   - Platform fee drag: Ravelry ≈2.9%+$0.30 net, Etsy ≈$5.10/$6, LoveCrafts 25%.
 *
 * Sources: guessthetest.com / Evan Miller's AB test guide (formula);
 * listybox.com Etsy conversion benchmarks (1–3% avg, +23% organic in 60d);
 * help.alura.io A/B mechanics (1 variable, ≥1 week); gosadi platform fees;
 * crochetpreneur Ravelry tag/attribute discovery; printify CTR definition.
 */

import type { LanguageCode } from '@/lib/i18n';
import { LISTING_TEST_COPY } from '@/lib/listing-test-copy';

export type Platform = 'ravelry' | 'etsy' | 'lovecrafts' | 'payhip';
export type TestVariable = 'photo' | 'title' | 'price' | 'description';

export interface ListingInput {
  /** Listing title (display only). */
  name: string;
  platform: Platform;
  /** Monthly views (unique visits to the listing). */
  monthlyViews: number;
  /** OR: search impressions + CTR derive views. */
  monthlyImpressions?: number;
  ctrPct?: number;
  /** Current conversion rate, 0..1 (orders ÷ visits). */
  conversionRate: number;
  /** Listing price in USD. */
  price: number;
  /** The listing element being changed. */
  variable: TestVariable;
  /** Hypothesized absolute lift in conversion, 0..1 (e.g. 0.01 = 2%→3%). */
  hypothesizedLift: number;
  /** Hours of effort to run the test (re-shoot, re-write, re-list). */
  effortHours: number;
  /** Designer's hourly rate for the effort. */
  hourlyRate: number;
  /** If the hypothesized lift holds, how many years of sales to credit it? */
  upliftHorizonMonths: number;
  /** Is this test one of several running at once (multi-variable)? */
  isMultipleVariables: boolean;
  /** Months the test will actually run (designer's plan). */
  plannedDurationMonths: number;
  /** Tags/attributes completeness: share of Ravelry's 13 tag slots used. */
  tagsUsedPct: number;
}

export const DEFAULT_LISTING: ListingInput = {
  name: 'My Lace Shrug',
  platform: 'ravelry',
  monthlyViews: 40,
  conversionRate: 0.02,
  price: 6,
  variable: 'photo',
  hypothesizedLift: 0.01,
  effortHours: 4,
  hourlyRate: 25,
  upliftHorizonMonths: 24,
  isMultipleVariables: false,
  plannedDurationMonths: 2,
  tagsUsedPct: 0.7,
};

export interface ListingFlag {
  code: 'LT-01' | 'LT-02' | 'LT-03' | 'LT-04' | 'LT-05' | 'LT-06';
  title: string;
  detail: string;
}

/**
 * Miller's formula (two-proportion z-test, normal approximation):
 * n = ( z(α/2)√(2p̄q̄) + z(β)√(p₁q₁ + p₂q₂) )² / (p₂ − p₁)²
 * with power β = 0.8 (z = 0.8416) and α = 0.05 two-sided (z = 1.96).
 */
export function samplePerVariant(p1: number, p2: number, alpha = 0.05, power = 0.8): number {
  if (!isFinite(p1) || !isFinite(p2) || p1 <= 0 || p2 <= p1 || p1 >= 1 || p2 >= 1) {
    return Infinity;
  }
  const zAlpha = 1.959963984540054; // qnorm(0.975)
  const zBeta = 0.8416212335729143; // qnorm(0.8)
  const pBar = (p1 + p2) / 2;
  const qBar = 1 - pBar;
  const q1 = 1 - p1;
  const q2 = 1 - p2;
  const numer = zAlpha * Math.sqrt(2 * pBar * qBar) + zBeta * Math.sqrt(p1 * q1 + p2 * q2);
  return Math.pow(numer / (p2 - p1), 2);
}

/** Platform net revenue per sale (pattern pricing, 2025 published rates). */
export function netPerSale(platform: Platform, price: number): number {
  switch (platform) {
    case 'ravelry':
      return price - (price * 0.029 + 0.3); // 2.9% + $0.30 processing
    case 'etsy':
      return price - 0.2 / 4 - (price * 0.065) - (price * 0.03 + 0.25); // $0.20/4mo + 6.5% transaction + 3%+$0.25
    case 'lovecrafts':
      return price - price * 0.25; // 25% seller fee
    case 'payhip':
      return price - (price * 0.05); // 5% platform
  }
}

/** Smallest detectable lift at this listing's traffic given a realistic test duration.
 *  If no realistic lift fits the traffic budget, returns null (the listing
 *  cannot be tested). */
export function maxDetectableLift(
  monthlyViews: number,
  durationMonths: number,
  baseline: number,
): number | null {
  // samplePerVariant(baseline, p2) decreases as p2 rises — a bigger lift needs
  // fewer visitors. So: if the BIGGEST lift (→ ~100%) still doesn't fit the
  // traffic budget, nothing is detectable: return null. Otherwise binary-search
  // for the smallest p2 whose sample fits the budget — that floor is the
  // smallest lift this listing can honestly prove.
  if (monthlyViews <= 0 || durationMonths <= 0) return null;
  const budget = monthlyViews / 2 / durationMonths; // per variant
  if (!isFinite(samplePerVariant(baseline, 0.9999)) || samplePerVariant(baseline, 0.9999) > budget) {
    return null; // no realistic lift is provable at this traffic
  }
  // Search window: floor = baseline (sample = ∞), ceiling = 0.9999 (sample = 0-ish).
  let lo = baseline; // too big a sample
  let hi = 0.9999; // fits the budget
  for (let i = 0; i < 64; i++) {
    const mid = (lo + hi) / 2;
    if (samplePerVariant(baseline, mid) <= budget) hi = mid;
    else lo = mid;
  }
  return hi - baseline;
}

/**
 * Analyze a per-listing test: required sample, time to power, detectability,
 * break-even, expected value, flags, and the verdict ladder.
 *
 * Verdict ladder (demand-first like the other labs):
 *   rewire  → traffic is hopeless for testing; the move is catalog-wide fixes
 *   fix     → traffic exists but the planned test is too weakly powered
 *   test    → powered, one variable, run it for ≥ the seasonality cycle
 *   scale   → the winner hypothesis is pre-committed (planner mode, no result yet)
 */
export function analyzeListingTest(input: ListingInput, language: LanguageCode = 'en'): {
  viewsFromImpressions: number | null;
  effectiveMonthlyViews: number;
  samplePerVariant: number;
  monthsToPower: number;
  maxDetectableLift: number | null;
  liftIsDetectable: boolean;
  baselineMonthlySales: number;
  netRevenuePerSale: number;
  baselineMonthlyNet: number;
  upliftMonthlyNet: number;
  upliftMonthlyGain: number;
  effortCost: number;
  breakEvenMonths: number;
  horizonUpliftNet: number;
  expectedValue: number;
  flags: ListingFlag[];
  verdict: 'Rewire' | 'Fix the test' | 'Test it' | 'Scale the winner';
  verdictNote: string;
  monthsToSeasonality: number;
} {
  const dynamicCopy = LISTING_TEST_COPY[language];
  const viewsFromImpressions =
    input.monthlyImpressions !== undefined && input.ctrPct !== undefined
      ? input.monthlyImpressions * Math.max(0, Math.min(1, input.ctrPct))
      : null;
  const effectiveMonthlyViews = Math.max(
    input.monthlyViews,
    viewsFromImpressions ?? 0,
  );

  const p1 = Math.max(1e-4, Math.min(0.9999, input.conversionRate));
  const p2 = Math.min(0.9999, p1 + Math.max(0, input.hypothesizedLift));
  const n = samplePerVariant(p1, p2);
  const monthsToPower = effectiveMonthlyViews > 0 ? n / (effectiveMonthlyViews / 2) : Infinity;

  const detect = maxDetectableLift(effectiveMonthlyViews, input.plannedDurationMonths, p1);
  const liftIsDetectable = detect !== null && input.hypothesizedLift >= detect - 1e-9;

  const netSale = netPerSale(input.platform, input.price);
  const baselineSales = effectiveMonthlyViews * p1;
  const baselineNet = baselineSales * netSale;
  const upliftNet = baselineSales * (1 + input.hypothesizedLift / p1) * netSale;
  const upliftGain = upliftNet - baselineNet;
  const effortCost = input.effortHours * input.hourlyRate;
  const breakEvenMonths = upliftGain > 0 ? effortCost / upliftGain : Infinity;
  const horizonMonths = Math.max(1, Math.min(60, Math.round(input.upliftHorizonMonths)));
  const horizonUpliftNet = upliftGain * horizonMonths - effortCost;
  // Honest EV: 50% chance the lift is real (no prior data), penalized for peeking.
  const peekingPenalty = input.plannedDurationMonths < 1 ? 0.3 : 0;
  const expectedValue = (horizonUpliftNet * 0.5 * (1 - peekingPenalty)) - (effortCost * 0.5 * peekingPenalty);

  const flags: ListingFlag[] = [];
  if (detect === null || !liftIsDetectable) {
    flags.push({
      code: 'LT-01',
      title: dynamicCopy.flagTitle('LT-01'),
      detail: dynamicCopy.flagDetail('LT-01', {
        detectable: fmtPct(detect ?? 0),
        hypothesis: fmtPct(input.hypothesizedLift),
      }),
    });
  }
  if (input.plannedDurationMonths < 1) {
    flags.push({
      code: 'LT-02',
      title: dynamicCopy.flagTitle('LT-02'),
      detail: dynamicCopy.flagDetail('LT-02', {}),
    });
  }
  if (input.isMultipleVariables) {
    flags.push({
      code: 'LT-03',
      title: dynamicCopy.flagTitle('LT-03'),
      detail: dynamicCopy.flagDetail('LT-03', {}),
    });
  }
  if (input.variable === 'price' && (input.platform === 'etsy' || input.platform === 'lovecrafts')) {
    flags.push({
      code: 'LT-04',
      title: dynamicCopy.flagTitle('LT-04'),
      detail: dynamicCopy.flagDetail('LT-04', {}),
    });
  }
  if (input.plannedDurationMonths > 0 && monthsToPower > input.plannedDurationMonths * 2) {
    flags.push({
      code: 'LT-05',
      title: dynamicCopy.flagTitle('LT-05'),
      detail: dynamicCopy.flagDetail('LT-05', {
        sample: fmtN(Math.ceil(n)),
        months: fmtN(monthsToPower),
      }),
    });
  }
  if (input.tagsUsedPct < 1) {
    flags.push({
      code: 'LT-06',
      title: dynamicCopy.flagTitle('LT-06'),
      detail: dynamicCopy.flagDetail('LT-06', {
        tags: Math.round(input.tagsUsedPct * 100).toString(),
      }),
    });
  }

  const verdict: ReturnType<typeof analyzeListingTest>['verdict'] =
    detect === null
      ? 'Rewire'
      : !liftIsDetectable
        ? 'Fix the test'
        : 'Test it';
  const verdictNote = dynamicCopy.verdictNote(
    verdict === 'Rewire' ? 'rewire' : verdict === 'Fix the test' ? 'fix' : 'test',
    {
      detectable: fmtPct(detect ?? 0),
      plan: input.plannedDurationMonths.toString(),
      hypothesis: fmtPct(input.hypothesizedLift),
      months: fmtN(Math.ceil(monthsToPower)),
      sample: fmtN(Math.ceil(n)),
    },
  );

  return {
    viewsFromImpressions,
    effectiveMonthlyViews,
    samplePerVariant: n,
    monthsToPower,
    maxDetectableLift: detect,
    liftIsDetectable,
    baselineMonthlySales: baselineSales,
    netRevenuePerSale: netSale,
    baselineMonthlyNet: baselineNet,
    upliftMonthlyNet: upliftNet,
    upliftMonthlyGain: upliftGain,
    effortCost,
    breakEvenMonths,
    horizonUpliftNet,
    expectedValue,
    flags,
    verdict,
    verdictNote,
    monthsToSeasonality: 1,
  };
}

/**
 * Portfolio view: which listings are worth testing first, ranked by
 * expected value per re-list hour.
 */
export function rankListingQueue(listings: ListingInput[]): {
  listing: ListingInput;
  expectedValue: number;
  evPerHour: number;
  monthsToPower: number;
  verdict: string;
}[] {
  // QA #42 item 3: the queue claims to rank "by expected value per re-list
  // hour", but it sorted and displayed the raw total EV. True EV per hour is
  // expectedValue over the re-list effort hours; a total of $-23 spread over
  // 4 h is $-5.75/hr, not $-23/hr.
  return listings
    .map(listing => {
      const a = analyzeListingTest(listing);
      const evPerHour = listing.effortHours > 0 ? a.expectedValue / listing.effortHours : a.expectedValue;
      return {
        listing,
        expectedValue: a.expectedValue,
        evPerHour,
        monthsToPower: a.monthsToPower,
        verdict: a.verdict,
      };
    })
    .sort((x, y) => y.evPerHour - x.evPerHour);
}

function fmtPct(p: number): string {
  return `${(p * 100).toFixed(1)}%`;
}

function fmtN(n: number): string {
  if (!isFinite(n)) return '∞';
  return Math.round(n).toLocaleString('en-US');
}
