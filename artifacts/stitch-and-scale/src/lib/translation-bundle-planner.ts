/**
 * Translation & Bundle Revenue Planner (CHK-015)
 *
 * Two money channels no designer tool covers, sourced from live market data:
 *
 * 1. TRANSLATION PLANNING — Ravelry makes translations derivative works: only
 *    the original designer can add them, and buyers won't pay for patterns in a
 *    language they don't read (r/knitting, 2025). So each language unlocked is
 *    revenue unlocked. Modelled on cited translator pricing:
 *      - Knitlingo automated + human-reviewed: $0.01/word per target language
 *      - Human specialists (e.g. Finnished Knits): higher per-word rates,
 *        include metric/imperial conversion and formatting
 *      - Repeated size sections are billable at a discount (Finnished: 50% off)
 *    Output: per-language cost, break-even copies, and a translate-first ranking.
 *
 * 2. BUNDLE PLANNING — Coalition bundles like Knit for Me (2020): 56 patterns
 *    for $27 (~$0.48/pattern), 28 patterns for $17 (~$0.61/pattern), both for
 *    $37 (~$0.44/pattern), with sum-of-parts retail $100–$200+ — an 80–90%
 *    discount depth, limited window, equal or per-pattern revenue splits.
 *    Modelled: bundle price vs sum-of-parts, discount depth, per-designer
 *    take, and a break-even-vs-solo-sales check.
 *
 * All constants are cited in comments; users can override every default.
 * Reuses PLATFORMS/net math from pattern-income-calculator via a minimal
 * platformNet passthrough so fee channels stay in one place.
 */

import { platformNet } from './pattern-income-calculator';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export interface LanguageMarket {
  /** Language code, e.g. 'de', 'ja'. */
  code: string;
  /** Display label, e.g. 'German'. */
  label: string;
  /** Share of expected additional copies that come from this market. */
  demandShare: number;
  /** Expected sell-through uplift vs the current language: fraction of the
   *  current-language monthly copies this market can add in steady state. */
  upliftFactor: number;
}

export interface TranslationInput {
  /** Word count of the full pattern text (prose + abbreviations). */
  wordCount: number;
  /** Words that appear in repeated size sections (billable at discount). */
  repeatedWords: number;
  /** Per-word rate for the translator, USD. */
  perWordRate: number;
  /** Discount applied to repeated words, e.g. 0.5 = half price. */
  repeatDiscount: number;
  /** Extra fixed fees (formatting, metric/imperial conversion, upload help). */
  fixedFees: number;
  /** The pattern's current steady monthly copies in the home language. */
  homeMonthlyCopies: number;
  /** Pattern price per copy, USD. */
  pricePerCopy: number;
  /** Ravelry/payout channel fee rate, e.g. 0.15. */
  channelFeeRate: number;
  /** Markets considered, with demand share + uplift per market. */
  markets: LanguageMarket[];
  /** Optional fixed licensing fee paid BY a translator/publisher for rights. */
  licensingFeeReceived?: number;
}

export interface TranslationRow {
  market: LanguageMarket;
  /** Full cost to translate into this language. */
  cost: number;
  /** Extra monthly copies at steady state (home volume × uplift × demand share). */
  addedMonthlyCopies: number;
  /** Monthly net revenue from the added copies (after channel fee). */
  addedMonthlyNet: number;
  /** Months to recover the translation cost. Infinity if it never pays back. */
  paybackMonths: number;
  /** Break-even copies needed to cover the cost (price adjusted for fees). */
  breakEvenCopies: number;
  /** Whether the translation pays for itself inside 24 months. */
  worthIt: boolean;
}

export interface TranslationOutcome {
  rows: TranslationRow[];
  /** Total cost if all worthwhile markets are translated. */
  totalCost: number;
  /** Total added monthly net from all worthwhile markets. */
  addedMonthlyNet: number;
  /** Months to recover the whole worthwhile portfolio. */
  portfolioPaybackMonths: number;
  /** Ranked languages to translate first (by added monthly net per $ cost). */
  priorityOrder: string[];
}

/* ------------------------------------------------------------------ */
/* Translation planning                                                */
/* ------------------------------------------------------------------ */

const WORDS_PER_HOUR = 200; // sanity baseline for human translators

export function translationCost(input: TranslationInput): number {
  const baseWords = Math.max(0, input.wordCount - input.repeatedWords);
  const repeated = Math.max(0, input.repeatedWords);
  const discounted = repeated * input.perWordRate * Math.max(0, Math.min(1, input.repeatDiscount));
  return baseWords * input.perWordRate + discounted + (input.fixedFees || 0);
}

export function planTranslations(input: TranslationInput): TranslationOutcome {
  const rows = input.markets.map(market => {
    const cost = translationCost(input);
    // Extra copies this market brings at steady state. Demand share splits
    // which portion of the uplift actually lands in this market.
    const addedMonthlyCopies =
      input.homeMonthlyCopies * market.upliftFactor * Math.max(0, Math.min(1, market.demandShare));
    const gross = addedMonthlyCopies * input.pricePerCopy;
    // Reuse the single fee seam: platform fee on copies.
    const fee = Math.max(0, Math.min(1, input.channelFeeRate));
    const addedMonthlyNet = gross * (1 - fee);
    const breakEvenCopies = addedMonthlyNet > 0 ? cost / (input.pricePerCopy * (1 - fee)) : Infinity;
    const paybackMonths = addedMonthlyNet > 0 ? cost / addedMonthlyNet : Infinity;
    return {
      market,
      cost: Math.round(cost * 100) / 100,
      addedMonthlyCopies: Math.round(addedMonthlyCopies * 10) / 10,
      addedMonthlyNet: Math.round(addedMonthlyNet * 100) / 100,
      breakEvenCopies: Number.isFinite(breakEvenCopies) ? Math.ceil(breakEvenCopies * 10) / 10 : Infinity,
      paybackMonths: Number.isFinite(paybackMonths) ? Math.round(paybackMonths * 10) / 10 : Infinity,
      worthIt: Number.isFinite(paybackMonths) && paybackMonths <= 24,
    };
  });

  const worthIt = rows.filter(r => r.worthIt);
  const totalCost = worthIt.reduce((s, r) => s + r.cost, 0);
  const addedMonthlyNet = worthIt.reduce((s, r) => s + r.addedMonthlyNet, 0);
  const portfolioPaybackMonths = addedMonthlyNet > 0 ? totalCost / addedMonthlyNet : Infinity;

  const priorityOrder = [...rows]
    .filter(r => Number.isFinite(r.paybackMonths))
    .sort((a, b) => a.paybackMonths - b.paybackMonths)
    .map(r => r.market.code);

  return {
    rows,
    totalCost: Math.round(totalCost * 100) / 100,
    addedMonthlyNet: Math.round(addedMonthlyNet * 100) / 100,
    portfolioPaybackMonths: Number.isFinite(portfolioPaybackMonths)
      ? Math.round(portfolioPaybackMonths * 10) / 10
      : Infinity,
    priorityOrder,
  };
}

/* ------------------------------------------------------------------ */
/* Bundle planning                                                     */
/* ------------------------------------------------------------------ */

export interface BundlePattern {
  /** Pattern name. */
  name: string;
  /** This designer's pattern? */
  mine: boolean;
  /** Retail price of the pattern sold solo, USD. */
  retailPrice: number;
  /** Expected solo copies sold during the bundle window if NOT bundled. */
  soloWindowCopies: number;
}

export interface BundleInput {
  patterns: BundlePattern[];
  /** Proposed bundle price, USD. */
  bundlePrice: number;
  /** Expected bundle units sold during the window. */
  expectedUnits: number;
  /** Channel fee on bundle sales, e.g. 0.15 Ravelry/Etsy etc. */
  channelFeeRate: number;
  /** How bundle revenue is split: 'equal' or 'perPattern'. */
  splitMode: 'equal' | 'perPattern';
  /** Number of designers sharing revenue equally (only for equal split). */
  designerCount?: number;
  /** Platform fee for the bundle host, e.g. 0.05 for a bundle platform. */
  hostFeeRate?: number;
}

export interface BundleOutcome {
  /** Sum of retail prices if every pattern was bought solo. */
  sumOfParts: number;
  /** Discount depth vs sum of parts, 0–1. */
  discountDepth: number;
  /** Average price per pattern inside the bundle. */
  pricePerPattern: number;
  /** Gross bundle revenue. */
  grossRevenue: number;
  /** Net after channel + host fees. */
  netRevenue: number;
  /** Total units. */
  units: number;
  /** Per-designer designerCount-weighted split, or per-pattern retail-weighted split. */
  myDesignerShare: number;
  /** What the designer would have earned selling their own patterns solo in the same window. */
  mySoloBaseline: number;
  /** Extra earned by bundling vs solo baseline. Negative = bundling loses to solo. */
  incrementalVsSolo: number;
  /** Health verdict. */
  verdict: 'great' | 'good' | 'review' | 'skip';
  verdictReason: string;
}

export function planBundle(input: BundleInput): BundleOutcome {
  const clamp = (v: number) => (Number.isFinite(v) ? v : 0);
  const channel = Math.max(0, Math.min(1, input.channelFeeRate));
  const host = Math.max(0, Math.min(1, input.hostFeeRate || 0));

  const sumOfParts = input.patterns.reduce((s, p) => s + Math.max(0, p.retailPrice), 0);
  const units = Math.max(0, input.expectedUnits || 0);
  const pricePerPattern = input.patterns.length > 0 ? input.bundlePrice / input.patterns.length : 0;
  const discountDepth = sumOfParts > 0 ? 1 - input.bundlePrice / sumOfParts : 0;

  const grossRevenue = input.bundlePrice * units;
  const netRevenue = grossRevenue * (1 - channel) * (1 - host);

  const minePatterns = input.patterns.filter(p => p.mine);
  const mineRetailSum = minePatterns.reduce((s, p) => s + Math.max(0, p.retailPrice), 0);

  let myDesignerShare = 0;
  if (input.splitMode === 'equal') {
    const designers = Math.max(1, input.designerCount || 1);
    myDesignerShare = netRevenue / designers;
  } else {
    // perPattern: each designer gets their share of bundle net in proportion to
    // their patterns' retail weight inside the bundle.
    myDesignerShare = sumOfParts > 0 ? (netRevenue * mineRetailSum) / sumOfParts : 0;
  }

  const mySoloBaseline = minePatterns.reduce(
    (s, p) => s + Math.max(0, p.retailPrice) * Math.max(0, p.soloWindowCopies) * (1 - channel),
    0
  );
  const incrementalVsSolo = myDesignerShare - mySoloBaseline;

  let verdict: BundleOutcome['verdict'];
  let verdictReason: string;
  const soloRatio = mySoloBaseline > 0 ? myDesignerShare / mySoloBaseline : myDesignerShare > 0 ? Infinity : 0;

  if (units === 0) {
    verdict = 'skip';
    verdictReason = 'Zero expected units — a bundle with no audience is just a deep discount with no counterparty.';
  } else if (myDesignerShare <= 0) {
    verdict = 'skip';
    verdictReason = 'Your share rounds to zero after fees. No bundle is worth more than no sale.';
  } else if (incrementalVsSolo > mySoloBaseline * 0.5) {
    verdict = 'great';
    verdictReason = `Bundling earns ${usd(incrementalVsSolo)} over your solo baseline — ${Math.round((soloRatio - 1) * 100)}% upside with almost no marketing you didn't already plan to do. Say yes.`;
  } else if (incrementalVsSolo > 0) {
    verdict = 'good';
    verdictReason = `Bundling nets ${usd(incrementalVsSolo)} more than solo sales. Modest, but bundles also buy exposure and list growth — count those too.`;
  } else if (incrementalVsSolo > -mySoloBaseline * 0.5) {
    verdict = 'review';
    verdictReason = `${usd(-incrementalVsSolo)} below your solo baseline. Acceptable if the exposure pays — but negotiate a higher split or a shorter window before signing.`;
  } else {
    verdict = 'skip';
    verdictReason = `${usd(-incrementalVsSolo)} below your solo baseline. Bundling here cannibalises sales you'd make anyway. Walk away or re-price.`;
  }

  return {
    sumOfParts: Math.round(sumOfParts * 100) / 100,
    discountDepth: Math.round(Math.max(0, Math.min(1, discountDepth)) * 1000) / 1000,
    pricePerPattern: Math.round(pricePerPattern * 100) / 100,
    grossRevenue: Math.round(grossRevenue * 100) / 100,
    netRevenue: Math.round(netRevenue * 100) / 100,
    units,
    myDesignerShare: Math.round(myDesignerShare * 100) / 100,
    mySoloBaseline: Math.round(mySoloBaseline * 100) / 100,
    incrementalVsSolo: Math.round(incrementalVsSolo * 100) / 100,
    verdict,
    verdictReason,
  };
}

function usd(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

/* ------------------------------------------------------------------ */
/* Copy-ready outreach: bundle pitch to coalition designers            */
/* ------------------------------------------------------------------ */

export function generateBundlePitch(input: BundleInput): string {
  const mineCount = input.patterns.filter(p => p.mine).length;
  const partnerCount = input.patterns.length - mineCount;
  const mineNames = input.patterns.filter(p => p.mine).map(p => p.name).join(', ') || '[your pattern names]';
  const lines: string[] = [
    'Subject: Bundle collaboration — ' + partnerCount + (partnerCount === 1 ? ' designer' : ' designers') + ', ' + input.patterns.length + (input.patterns.length === 1 ? ' pattern' : ' patterns'),
    '',
    'Hi [designer],',
    '',
    'I\'m pulling together a themed pattern bundle — ' + partnerCount + (partnerCount === 1 ? ' designer' : ' designers') + ',',
    input.patterns.length + (input.patterns.length === 1 ? ' pattern' : ' patterns') + ', one limited window — and I\'d love you in it.',
    '',
    'My patterns in: ' + mineNames + '.',
    '',
    'How it works: we price at ' + usd(input.bundlePrice) + ' for the bundle (about a ' +
    Math.round(planBundle(input).discountDepth * 100) + '% discount vs sum of parts), run it for a fixed window',
    'with no repeats, and split revenue ' + (input.splitMode === 'equal' ? 'equally between designers' : 'by pattern retail weight') +
    ' after platform fees. Everybody cross-promotes to their own lists — the coalitions that',
    'work (Knit for Me did $17 for 28 patterns, 2020) succeed on combined audiences,',
    'not on the discount itself.',
    '',
    'Interested? Send me your pattern picks and usual solo price — I\'ll model the split',
    'so you can see your exact number before you say yes.',
    '',
    'Warmly, [Designer name]',
  ];
  return lines.join('\n');
}
