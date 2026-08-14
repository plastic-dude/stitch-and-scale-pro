/**
 * PoD Book Builder & Evaluator — "Book It" tab engine.
 *
 * Models bundling a designer's patterns into a single print/ebook collection
 * and running it through the real print-on-demand economics (2026 market data):
 * - Amazon KDP: 60% royalty minus print cost; ~60-day payout; Amazon-only traffic
 * - Lulu direct (Bookstore): 80% minus print cost; monthly, $20 minimum
 * - Lulu distribution (retail/Amazon third-party): ~50% effective after wholesale
 * - IngramSpark: 70% minus print cost after wholesale; wider non-Amazon retail
 * - Books.by / direct-sales platforms: ~100% of list minus print cost — but you
 *   bring every buyer yourself
 *
 * Sources: books.by KDP-vs-Lulu 2026 comparison ($19.99, 200pp B&W: KDP $5.74,
 * Lulu direct $5.99 per book); Lulu print-cost tables (100pp B&W 6x9: $4.11
 * Lulu / $2.30 KDP / $2.68 IngramSpark); Lulu royalty rates 80% direct / 90%
 * ebook; KDP 60%/40%; IngramSpark 70%; payout cadences.
 *
 * The math nobody tells you: color pages cost roughly 6-8x a B&W page on POD,
 * and pattern books live or die on charts and photography. This planner prices
 * the color share honestly instead of pretending a pattern book is a novel.
 */

export type PodChannelId = 'kdp' | 'lulu_direct' | 'lulu_dist' | 'ingramspark' | 'booksby' | 'direct_self';

export interface PodChannel {
  id: PodChannelId;
  name: string;
  /** Fraction of list price the platform keeps before print cost. */
  platformCut: number;
  /** Base print cost, USD — 100-page B&W 6x9 paperback. */
  basePrintCost: number;
  /** Extra print cost per page beyond 100 pages (B&W). */
  extraPageCost: number;
  /** Extra print cost per color page beyond the B&W page cost. */
  colorPagePremium: number;
  /** Payout speed, days after a sale. */
  payoutDays: number;
  /** What this channel gives the designer, honestly. */
  trafficNote: string;
}

export const POD_CHANNELS: Record<PodChannelId, PodChannel> = {
  kdp: {
    id: 'kdp',
    name: 'Amazon KDP',
    platformCut: 0.4,
    basePrintCost: 2.3,
    extraPageCost: 0.011,
    colorPagePremium: 0.07,
    payoutDays: 60,
    trafficNote:
      'The only real Amazon marketplace play — full algorithm support and Prime. You are one of millions of titles; Amazon takes 40% and you wait ~60 days.',
  },
  lulu_direct: {
    id: 'lulu_direct',
    name: 'Lulu Bookstore (direct)',
    platformCut: 0.2,
    basePrintCost: 4.11,
    extraPageCost: 0.0589,
    colorPagePremium: 0.16,
    payoutDays: 30,
    trafficNote:
      '80% direct royalty pays more than KDP per copy, but the Lulu Bookstore has almost no organic traffic. Only earns if you drive the buyer.',
  },
  lulu_dist: {
    id: 'lulu_dist',
    name: 'Lulu distribution (retail)',
    platformCut: 0.5,
    basePrintCost: 4.11,
    extraPageCost: 0.041,
    colorPagePremium: 0.16,
    payoutDays: 45,
    trafficNote:
      'Global Reach puts you in Barnes & Noble and international retail — roughly half the list price after wholesale, with the same heavier print bill.',
  },
  ingramspark: {
    id: 'ingramspark',
    name: 'IngramSpark',
    platformCut: 0.3,
    basePrintCost: 2.68,
    extraPageCost: 0.013,
    colorPagePremium: 0.075,
    payoutDays: 60,
    trafficNote:
      'The widest non-Amazon retail spine (bookstores, libraries, online retailers). 70% royalty but retail discount still eats ~55% of list in practice.',
  },
  booksby: {
    id: 'booksby',
    name: 'Direct-sales storefront',
    platformCut: 0.0,
    basePrintCost: 4.5,
    extraPageCost: 0.045,
    colorPagePremium: 0.16,
    payoutDays: 1,
    trafficNote:
      'You keep ~100% and get paid daily — but you bring every single buyer yourself. Best margin, zero discovery.',
  },
  direct_self: {
    id: 'direct_self',
    name: 'Self-fulfilled (own stock)',
    platformCut: 0.0,
    basePrintCost: 6.0,
    extraPageCost: 0.06,
    colorPagePremium: 0.2,
    payoutDays: 0,
    trafficNote:
      'Bulk offset print lowers per-unit cost at volume, but you front the print run, hold stock, and ship orders. Capital at risk; highest per-copy upside.',
  },
};

export const POD_CHANNEL_LABELS: Record<PodChannelId, string> = {
  kdp: 'Amazon KDP',
  lulu_direct: 'Lulu direct',
  lulu_dist: 'Lulu retail',
  ingramspark: 'IngramSpark',
  booksby: 'Direct storefront',
  direct_self: 'Self-fulfilled',
};

export interface PodBookInput {
  /** Book list price, USD. */
  listPrice: number;
  /** Total pages (print edition). */
  pageCount: number;
  /** Number of those pages that are color (charts, photos). */
  colorPageCount: number;
  /** Expected copies sold in the launch window. */
  copiesExpected: number;
  /** Production budget, USD: tech edit, sample photography, layout, cover. */
  productionBudget: number;
  /** Marketing spend, USD: ads, review copies, launch team. */
  marketingBudget: number;
  /** What the same patterns would earn sold as solo PDFs at their retail prices. */
  pdfBaselineNet: number;
  /** Which channel to model first (primary). */
  primaryChannel: PodChannelId;
}

export interface PodChannelResult {
  channel: PodChannelId;
  /** Total print cost for one book. */
  printCost: number;
  /** Platform's cut of the list price. */
  platformCut: number;
  /** Net to the designer per copy. */
  netPerBook: number;
  /** Total net across expected copies, before production budget. */
  netBeforeBudget: number;
  /** Copies needed to recover production + marketing spend. */
  breakEvenCopies: number;
  /** Whether expected copies clear break-even. */
  clearsBreakEven: boolean;
}

export interface PodBookResult {
  primary: PodChannelResult;
  allChannels: PodChannelResult[];
  /** Net across expected copies minus the whole production + marketing spend. */
  netTotal: number;
  /** Incremental value vs selling the same patterns as solo PDFs. */
  incrementalVsPdf: number;
  verdict: 'great' | 'good' | 'review' | 'skip';
  verdictReason: string;
  /** Honest warnings — color-page cost trap, traffic reality, payout cadence. */
  watchOuts: string[];
  /** Production checklist for a pattern-book pipeline. */
  checklist: { item: string; done: boolean }[];
}

const DEFAULT_COSTS: PodBookInput = {
  listPrice: 24,
  pageCount: 120,
  colorPageCount: 40,
  copiesExpected: 150,
  productionBudget: 1000,
  marketingBudget: 150,
  pdfBaselineNet: 900,
  primaryChannel: 'kdp',
};

export { DEFAULT_COSTS };

function buildChannelResult(channel: PodChannel, input: PodBookInput): PodChannelResult {
  const extraPages = Math.max(0, input.pageCount - 100);
  const bwPageCost = channel.basePrintCost + extraPages * channel.extraPageCost;
  const printCost = bwPageCost + input.colorPageCount * channel.colorPagePremium;
  const platformCut = input.listPrice * channel.platformCut;
  const netPerBook = Math.max(0, input.listPrice - platformCut - printCost);
  const netBeforeBudget = netPerBook * input.copiesExpected;
  const spend = input.productionBudget + input.marketingBudget;
  const breakEvenCopies = spend > 0 && netPerBook > 0 ? Math.ceil(spend / netPerBook) : 0;
  return {
    channel: channel.id,
    printCost: Math.round(printCost * 100) / 100,
    platformCut: Math.round(platformCut * 100) / 100,
    netPerBook: Math.round(netPerBook * 100) / 100,
    netBeforeBudget: Math.round(netBeforeBudget * 100) / 100,
    breakEvenCopies,
    clearsBreakEven: netPerBook > 0 && input.copiesExpected >= breakEvenCopies,
  };
}

export function analyzePodBook(input: Partial<PodBookInput> = {}): PodBookResult {
  const cfg: PodBookInput = { ...DEFAULT_COSTS, ...input };
  const clamp = (v: number) => (Number.isFinite(v) ? v : 0);
  const listPrice = Math.max(0, clamp(cfg.listPrice));
  const pageCount = Math.max(10, clamp(cfg.pageCount));
  const colorPageCount = Math.max(0, Math.min(clamp(cfg.colorPageCount), pageCount));
  const copiesExpected = Math.max(0, clamp(cfg.copiesExpected));
  const productionBudget = Math.max(0, clamp(cfg.productionBudget));
  const marketingBudget = Math.max(0, clamp(cfg.marketingBudget));
  const pdfBaselineNet = Math.max(0, clamp(cfg.pdfBaselineNet));
  const colorShare = colorPageCount / pageCount;
  const normalized: PodBookInput = {
    ...cfg,
    listPrice,
    pageCount,
    colorPageCount,
    copiesExpected,
    productionBudget,
    marketingBudget,
    pdfBaselineNet,
    primaryChannel: cfg.primaryChannel,
  };

  const allChannels = (Object.keys(POD_CHANNELS) as PodChannelId[]).map(c => buildChannelResult(POD_CHANNELS[c], normalized));
  const primary = allChannels.find(r => r.channel === normalized.primaryChannel) ?? allChannels[0];
  const netTotal = primary.netBeforeBudget - productionBudget - marketingBudget;
  const incrementalVsPdf = netTotal - pdfBaselineNet;

  const watchOuts: string[] = [];
  if (colorShare >= 0.3) {
    watchOuts.push(
      `Color share is ${Math.round(colorShare * 100)}% of the book. POD color pages cost 6-8x a B&W page — every color plate is a direct margin hit. Keep color to charts and covers.`
    );
  }
  if (primary.netPerBook < 3) {
    watchOuts.push(
      `${POD_CHANNEL_LABELS[primary.channel]} nets under $3 per copy at this list price. Pattern books carry more pages than novels; raise the list price or trim the page count before you commit.`
    );
  }
  if (POD_CHANNELS[primary.channel].platformCut >= 0.3 && primary.channel !== 'ingramspark') {
    watchOuts.push(
      'Amazon and heavy-marketplace channels take 40%+ off the top. If you have any audience at all (newsletter, KAL group, Instagram), a direct-sales channel nets dramatically more per copy.'
    );
  }
  if (POD_CHANNELS[primary.channel].payoutDays >= 45 && marketingBudget > 200) {
    watchOuts.push(
      `This channel pays out after ~${POD_CHANNELS[primary.channel].payoutDays} days while your ad spend is due now. Mind the cash gap if the book funds itself.`
    );
  }
  if (pdfBaselineNet <= 0 && copiesExpected > 0) {
    watchOuts.push(
      'PDF baseline is $0 — make sure that reflects what the same patterns actually earn solo, or the book-vs-PDF comparison is meaningless.'
    );
  }

  const spend = productionBudget + marketingBudget;
  let verdict: PodBookResult['verdict'] = 'skip';
  let verdictReason = '';
  if (copiesExpected === 0 || listPrice <= 0) {
    verdict = 'skip';
    verdictReason = 'Set a list price and an expected-copy count before judging this book.';
  } else if (primary.netPerBook <= 0) {
    verdict = 'skip';
    verdictReason = `${POD_CHANNEL_LABELS[primary.channel]} prints for more than it sells at $${listPrice}. The book loses money on every copy — trim pages, cut color, or price up.`;
  } else if (!primary.clearsBreakEven) {
    verdict = 'review';
    verdictReason = `Break-even is ${primary.breakEvenCopies} copies but only ${copiesExpected} are expected. The book pays for itself only if the launch outperforms the estimate — run the launch plan first (KAL, review team, list) or shrink the print scope.`;
  } else if (netTotal <= pdfBaselineNet) {
    verdict = 'review';
    verdictReason = `The book nets ${netTotal.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })} vs $${Math.round(pdfBaselineNet).toLocaleString()} selling the same patterns as PDFs. The collection is worth printing only if you value the bundled price anchor, LYS stockist orders, or the list-building event — not the margin alone.`;
  } else if (incrementalVsPdf >= pdfBaselineNet * 0.5) {
    verdict = 'great';
    verdictReason = `The book beats the PDF baseline by more than half. Bundle pricing at $${listPrice} for ${Math.round(pdfBaselineNet / 8)}–$${Math.round(pdfBaselineNet / 6)} of solo value plus print scarcity is a real offer — ship it.`;
  } else {
    verdict = 'good';
    verdictReason = `The book clears break-even and beats the PDF baseline, but the margin edge is thin. Worth doing if the book doubles as a launch event and stockist product.`;
  }

  const checklist = [
    { item: 'Three-level tech edit budgeted (~$100 / pattern for a 10-pattern book; UK precedent is £800–900)', done: false },
    { item: 'Sample photography locked in before page layout', done: false },
    { item: 'Color pages restricted to charts, covers, and hero photography', done: false },
    { item: 'Proof copy ordered and checked at home-gauge before launch', done: false },
    { item: 'Launch list built: KAL or review team commits to the window copies', done: false },
    { item: 'Channel picked for your traffic reality, not its headline royalty', done: false },
  ];

  return {
    primary,
    allChannels,
    netTotal: Math.round(netTotal * 100) / 100,
    incrementalVsPdf: Math.round(incrementalVsPdf * 100) / 100,
    verdict,
    verdictReason,
    watchOuts,
    checklist,
  };
}

/** What the solo-PDF baseline should reflect for an honest comparison. */
export function pdfBaselineFromPatterns(
  patterns: { retailPrice: number; copiesInWindow: number; channelFeeRate: number }[]
): number {
  return Math.round(
    patterns.reduce((s, p) => s + p.retailPrice * p.copiesInWindow * (1 - Math.max(0, Math.min(1, p.channelFeeRate))), 0) * 100
  ) / 100;
}
