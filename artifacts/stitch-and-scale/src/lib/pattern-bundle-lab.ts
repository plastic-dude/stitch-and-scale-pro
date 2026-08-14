/**
 * Pattern Bundle Lab (CHK-066) — is a designer-run pattern bundle worth
 * running, and under which split does each designer come out ahead?
 *
 * Competitor flaw: bundle hosts and craft-bundle platforms run launches
 * with 10-25% organizer commissions and opaque per-designer splits — and
 * no tool projects a designer's own net before signing the launch
 * agreement. Designer bundles are one of the few spike mechanisms that
 * move a Ravelry long-tail seller (median < $50/mo; top-10% threshold
 * $201+/mo) into real money: a $25 bundle at 200 sales is $5,000 gross.
 * But a bundle that simply discounts without adding volume loses every
 * designer money.
 *
 * This lab models: per-designer net under weighted vs equal splits at a
 * chosen host commission, the bundle multiplier needed to beat solo
 * sales, the break-even sales vs solo-rate baseline, discount-depth
 * sanity (the 40-60%-off retail norm), cross-audience capture (email
 * list growth), host-labor cost priced at the opportunity rate, and a
 * verdict ladder from "run solo instead" to "host this launch".
 */

export interface BundlePattern {
  /** Standalone price the designer would sell this pattern at on their own. */
  price: number;
  /** Realistic standalone sales/month for this pattern at its own price. */
  monthlySales: number;
}

export type SplitMode = 'weighted' | 'equal';

export interface PatternBundleInput {
  /** Your patterns in this bundle. */
  patterns: BundlePattern[];
  /** Total bundle price knitters pay (all patterns, one checkout). */
  bundlePrice: number;
  /** Host/organizer commission as a fraction of bundle gross (0-0.40). */
  hostCommission: number;
  /** Payment processing, e.g. 0.029 + 0.30 (Ravelry direct / most hosts). */
  processorCut: number;
  processorFixed: number;
  /** Realistic bundle sales across the whole launch window. */
  bundleSales: number;
  /** Best-case bundle sales. */
  bundleSalesBest: number;
  /** Worst-case bundle sales. */
  bundleSalesWorst: number;
  splitMode: SplitMode;
  /** Launch window in months (typically 1-2 for a bundle). */
  launchMonths: number;
  /** Solo launch sales you'd expect without the bundle, per pattern, over the window. */
  soloSalesPerPattern: number;
  /** Your promo/marketing hours across the launch. */
  promoHours: number;
  /** Opportunity rate $/hr. */
  hourlyRate: number;
  /** Email subscribers you expect to gain from bundle cross-audience. */
  emailGained: number;
  /** Estimated first-year value per new email subscriber. */
  emailValue: number;
}

export const DEFAULT_BUNDLE: PatternBundleInput = {
  patterns: [
    { price: 8, monthlySales: 6 },
    { price: 7, monthlySales: 5 },
    { price: 6, monthlySales: 4 },
  ],
  bundlePrice: 14,
  hostCommission: 0.2,
  processorCut: 0.029,
  processorFixed: 0.3,
  bundleSales: 150,
  bundleSalesBest: 300,
  bundleSalesWorst: 60,
  splitMode: 'weighted',
  launchMonths: 1,
  soloSalesPerPattern: 6,
  promoHours: 12,
  hourlyRate: 25,
  emailGained: 120,
  emailValue: 2.5,
};

export interface Flag {
  code: string;
  title: string;
  detail: string;
}

export interface DesignerNet {
  /** Your designer index within the bundle patterns array. */
  designerIndex: number;
  /** Split share of the designer-pool after host commission. */
  share: number;
  /** Your gross take at the current sales level. */
  grossTake: number;
  /** Processing fees charged against your take (per-sale fixed + cut). */
  fees: number;
  /** Net after processing, promo labor, minus solo-opportunity baseline. */
  netTake: number;
  /** What the same sales window would have earned selling solo. */
  soloBaseline: number;
  /** Net minus solo baseline — the incremental value of the bundle. */
  incremental: number;
}

export interface BundleScenario {
  label: string;
  sales: number;
  designers: DesignerNet[];
  /** Your effective hourly rate if you treat promo hours as the cost. */
  effectiveHourly: number;
}

export interface PatternBundleResult {
  scenarios: BundleScenario[];
  /** Sum of standalone prices of all bundle patterns. */
  standaloneSum: number;
  /** Bundle discount vs the sum of standalone prices. */
  discountShare: number;
  /** Sales needed so your net bundle take beats your solo baseline. */
  breakEvenSales: number;
  /** Sales where your take equals the solo baseline times 1.5 — the "worth it" bar. */
  worthSales: number;
  /** Minimum bundle sales the host should guarantee or you walk. */
  floorSales: number;
  flags: Flag[];
  verdict: string;
  verdictNote: string;
}

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

function scenario(label: string, sales: number, input: PatternBundleInput): BundleScenario {
  const n = input.patterns.length;
  const standaloneSum = input.patterns.reduce((s, p) => s + p.price, 0);
  const pool = input.bundlePrice * (1 - input.hostCommission);
  const grossPerSale = pool;
  const netPerSale = pool * (1 - input.processorCut) - input.processorFixed;

  const designers: DesignerNet[] = input.patterns.map((p, i) => {
    const share =
      input.splitMode === 'equal' ? 1 / n : p.price / standaloneSum;
    const grossTake = grossPerSale * sales * share;
    // Per-sale processing charged against this designer's take.
    const fees = sales * (pool * share * input.processorCut + input.processorFixed * share) / Math.max(0.01, pool);
    const promoCost = input.promoHours * input.hourlyRate * share;
    const emailValue = input.emailGained * input.emailValue * share;
    // Realistic solo: solo sales over the launch window (scaled by launch months).
    const soloWindow =
      input.soloSalesPerPattern * input.launchMonths * p.price * (1 - input.processorCut) -
      input.processorFixed * input.soloSalesPerPattern * input.launchMonths;
    const netTake = grossTake - fees - promoCost + emailValue;
    return {
      designerIndex: i,
      share,
      grossTake,
      fees,
      netTake,
      soloBaseline: Math.max(0, soloWindow),
      incremental: netTake - Math.max(0, soloWindow),
    };
  });

  const myNet = designers[0].netTake;
  // Honest labor return: what the promo hours actually earned, per hour.
  const effectiveHourly = input.promoHours > 0 ? myNet / input.promoHours : 0;

  return { label, sales, designers, effectiveHourly };
}

export function analyzePatternBundle(input: PatternBundleInput): PatternBundleResult {
  const n = Math.max(1, input.patterns.length);
  const standaloneSum = input.patterns.reduce((s, p) => s + p.price, 0);
  const firstPattern = input.patterns[0];
  if (!firstPattern || standaloneSum <= 0) {
    return {
      scenarios: [],
      standaloneSum: 0,
      discountShare: 0,
      breakEvenSales: Infinity,
      worthSales: Infinity,
      floorSales: Infinity,
      flags: [],
      verdict: 'Skip the bundle — sell solo',
      verdictNote: 'Add at least one pattern with a price before this lab can model the bundle.',
    };
  }
  const discountShare =
    standaloneSum > 0 ? 1 - input.bundlePrice / standaloneSum : 0;

  const pool = input.bundlePrice * (1 - input.hostCommission);
  const netPerSaleForMe =
    pool * (1 - input.processorCut) - input.processorFixed;

  // Break-even: sales where my net (incl. email value, minus promo) = solo window.
  const share =
    input.splitMode === 'equal' ? 1 / n : firstPattern.price / standaloneSum;
  const mySoloWindow =
    input.soloSalesPerPattern * input.launchMonths * firstPattern.price * (1 - input.processorCut) -
    input.processorFixed * input.soloSalesPerPattern * input.launchMonths;
  const promoCost = input.promoHours * input.hourlyRate * share;
  const emailPerSale = (input.emailGained * input.emailValue * share) / Math.max(1, input.bundleSales);
  const perSaleIncrement = netPerSaleForMe * share + emailPerSale;
  const breakEvenSales =
    perSaleIncrement > 0 ? Math.ceil((Math.max(0, mySoloWindow) + promoCost) / perSaleIncrement) : Infinity;
  const worthSales =
    perSaleIncrement > 0 ? Math.ceil((Math.max(0, mySoloWindow) * 1.5 + promoCost) / perSaleIncrement) : Infinity;
  // Floor: host should cover at least the solo baseline + labor cost.
  const floorSales = breakEvenSales === Infinity ? Infinity : breakEvenSales;

  const scenarios: BundleScenario[] = [
    scenario('worst', input.bundleSalesWorst, input),
    scenario('realistic', input.bundleSales, input),
    scenario('best', input.bundleSalesBest, input),
  ];

  const realistic = scenarios[1];
  const myReal = realistic.designers[0];

  const flags: Flag[] = [];

  // PB-01 — discount depth outside the 40-60% retail norm.
  if (discountShare < 0.3 && standaloneSum > 0) {
    flags.push({
      code: 'PB-01',
      title: 'Discount too shallow to feel like a bundle',
      detail: `Summing to $${standaloneSum.toFixed(0)} and priced at $${input.bundlePrice.toFixed(0)} is only ${(discountShare * 100).toFixed(0)}% off. Knitters buy bundles on the perceived deal — the market norm is 40-60% off the sum. Under ~30% the bundle reads as a markup and stalls.`,
    });
  }
  if (discountShare > 0.75 && standaloneSum > 0) {
    flags.push({
      code: 'PB-02',
      title: 'Discount erases the pool',
      detail: `${(discountShare * 100).toFixed(0)}% off leaves a $${input.bundlePrice.toFixed(0)} bundle from $${standaloneSum.toFixed(0)} of value. You'll sell it, but the pool after a ${input.hostCommission * 100}% host commission is thin — ${(netPerSaleForMe * share).toFixed(2)}/sale after processing for you. Deep-discount bundles work only at big volume.`,
    });
  }

  // PB-03 — host commission above the market 10-25% band.
  if (input.hostCommission > 0.25) {
    flags.push({
      code: 'PB-03',
      title: 'Host commission above the market band',
      detail: `Designers running bundles typically pay hosts 10-25% of gross as the organizer fee. ${(input.hostCommission * 100).toFixed(0)}% means the host keeps $${(input.hostCommission * input.bundlePrice).toFixed(2)} of every $${input.bundlePrice.toFixed(0)} — negotiate down or make the host carry real marketing labor (email blasts, Instagram takeovers, giveaways) in exchange.`,
    });
  }

  // PB-04 — bundle multiplier too low: same money, same hours.
  if (myReal.incremental < 0) {
    flags.push({
      code: 'PB-04',
      title: 'Bundle underperforms your solo baseline',
      detail: `At realistic sales (${realistic.sales.toLocaleString('en-US')}), your take is $${myReal.netTake.toFixed(0)} vs a $${myReal.soloBaseline.toFixed(0)} solo window — you lose $${Math.abs(myReal.incremental).toFixed(0)} and add launch-week labor on top. You need ≈${breakEvenSales === Infinity ? '∞' : breakEvenSales.toLocaleString('en-US')} bundle sales just to tie. Either the discount isn't big enough or the audience isn't.`,
    });
  }

  // PB-05 — worst case underwater.
  if (scenarios[0].designers[0].incremental < -input.patterns[0].price * 2) {
    flags.push({
      code: 'PB-05',
      title: 'Worst case loses meaningful money',
      detail: `At ${scenarios[0].sales} sales your bundle nets $${scenarios[0].designers[0].netTake.toFixed(0)} — $${Math.abs(scenarios[0].designers[0].incremental).toFixed(0)} worse than selling solo. Bundle launches are lumpy: a flopped launch window burns the discount AND the week. Ask for a host minimum-sale floor near ${floorSales === Infinity ? '∞' : floorSales.toLocaleString('en-US')} sales before committing.`,
    });
  }

  // PB-06 — promo labor priced out.
  if (realistic.effectiveHourly > 0 && realistic.effectiveHourly < input.hourlyRate * 0.6) {
    flags.push({
      code: 'PB-06',
      title: 'Promo labor underpaid',
      detail: `${input.promoHours} hours of launch promo at an effective $${realistic.effectiveHourly.toFixed(0)}/hr is well under your $${input.hourlyRate}/hr rate. Launch weeks are real work — email blasts, social posts, Ravelry group outreach, giveaway prizes. Either get the host to do more of it or price the discount so volume covers it.`,
    });
  }

  // PB-07 — equal split punishes higher-priced patterns.
  if (input.splitMode === 'equal' && input.patterns.length > 2) {
    const maxPrice = Math.max(...input.patterns.map(p => p.price));
    const minPrice = Math.min(...input.patterns.map(p => p.price));
    if (maxPrice > minPrice * 1.5) {
      flags.push({
        code: 'PB-07',
        title: 'Equal split underpays your premium pattern',
        detail: `Your $${input.patterns[0].price} pattern splits equally with patterns down to $${minPrice}. Weighted splits (share = price / sum) are the norm — $${((input.patterns[0].price / standaloneSum) * 100).toFixed(0)}% share vs ${(100 / n).toFixed(0)}%. Only accept equal splits when every pattern is priced near-identically.`,
      });
    }
  }

  // PB-08 — audience capture ignored.
  if (input.emailGained <= 0) {
    flags.push({
      code: 'PB-08',
      title: 'No audience capture modeled',
      detail: 'The single most durable bundle payout is new names: launch buyers subscribe to each designer\u2019s list, and newsletter subscribers are the #1 sales channel for indie designers. A 150-sale bundle typically surfaces 100-200 new subscriber-level leads across the designer pool. Value each at ~$1-4 in first-year sales and re-run this lab with that included.',
    });
  }

  // ---- Verdict ladder ----
  const worthGap = myReal.incremental - myReal.soloBaseline * 0.5;

  let verdict: string;
  let verdictNote: string;

  if (breakEvenSales > input.bundleSalesBest * 1.2 || input.patterns.length === 0) {
    verdict = 'Skip the bundle — sell solo';
    verdictNote = `Even a best-case launch of ${input.bundleSalesBest} sales leaves you ≈$${(breakEvenSales === Infinity ? '∞' : (myReal.soloBaseline - scenarios[2].designers[0].netTake).toFixed(0))} behind your solo window. At ${input.patterns.length} pattern(s) and a ${(discountShare * 100).toFixed(0)}% discount, there is no volume story here — publish normally and keep 100% of the margin.`;
  } else if (myReal.incremental < 0) {
    verdict = 'Not yet — renegotiate before signing';
    verdictNote = `Realistic sales of ${realistic.sales.toLocaleString('en-US')} net you $${myReal.netTake.toFixed(0)} vs $${myReal.soloBaseline.toFixed(0)} solo — $${Math.abs(myReal.incremental).toFixed(0)} underwater. Fix one lever: lift the bundle to $${Math.max(input.bundlePrice, Math.round((standaloneSum * 0.5) * 2) / 2)} (40-60% off), cut host commission under 25%, or demand a host-floor of ≈${floorSales === Infinity ? '∞' : floorSales.toLocaleString('en-US')} sales. The bundle then flips to +$${(perSaleIncrement * Math.max(breakEvenSales, input.bundleSales) - Math.max(0, mySoloWindow) - promoCost).toFixed(0)} territory.`;
  } else if (realistic.effectiveHourly < input.hourlyRate * 0.6) {
    verdict = 'Worth it, but make the host carry the launch';
    verdictNote = `You clear $${myReal.incremental.toFixed(0)} over solo at realistic sales — but your ${input.promoHours} promo hours price at $${realistic.effectiveHourly.toFixed(0)}/hr. Make the host do the email blast, the Instagram takeover, and the giveaway logistics; that labor is what their ${input.hostCommission * 100}% commission is for. With a true floor and shared labor this is a solid launch.`;
  } else if (myReal.incremental > myReal.soloBaseline * 0.5) {
    verdict = 'Host this launch';
    verdictNote = `$${myReal.netTake.toFixed(0)} net vs $${myReal.soloBaseline.toFixed(0)} solo at realistic sales — the bundle earns $${myReal.incremental.toFixed(0)} extra plus ${input.emailGained} new subscriber leads worth ≈$${(input.emailGained * input.emailValue).toFixed(0)} in the first year. At $${input.bundlePrice} from $${standaloneSum.toFixed(0)} of value the deal is real. Bundle launches are the single fastest way a long-tail designer jumps out of the <$50/mo median — coordinate the week, stack the email lists, and re-run every quarter.`;
  } else {
    verdict = 'Teach it — small but positive';
    verdictNote = `+$${myReal.incremental.toFixed(0)} over solo at realistic sales, at $${realistic.effectiveHourly.toFixed(0)}/hr effective. Above your floor of ≈${breakEvenSales === Infinity ? '∞' : breakEvenSales.toLocaleString('en-US')} sales, so the risk is managed — and the email capture adds lasting value beyond launch week. Fine launch to run, just don't let it consume the quarter.`;
  }

  return {
    scenarios,
    standaloneSum,
    discountShare,
    breakEvenSales,
    worthSales,
    floorSales,
    flags,
    verdict,
    verdictNote,
  };
}

export function fmt$(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}
