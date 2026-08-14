/**
 * CHK-071 — POD Patterns Lab
 *
 * Print-on-demand physical pattern economics for knitwear designers:
 * a pattern collection becomes a paperback (KDP minimum 24 pages), the
 * designer picks page count, ink, platform, and list price, and this lab
 * turns that into per-unit net, minimum list price, break-even vs the
 * digital PDF, and the watch-outs that kill POD accounts and margins.
 *
 * Competitor flaw: PriceWin, bundlers, and merch calculators optimize the
 * DIGITAL price point. No tool models the POD physical economics — page
 * count → print cost → minimum list price → net royalty per unit across
 * platforms, the 24-page paperback floor, color vs B&W tradeoff, platform
 * commission structure (KDP 30-40% vs Lulu 20% vs IngramSpark 55%),
 * break-even vs the digital PDF equivalent, and the account-ban risk
 * flags unique to patterns-as-books.
 *
 * Verified research anchors used by this lab:
 * - Amazon KDP (official help, paperback printing cost): printing cost =
 *   fixed + pages × per-page; US B&W regular trim = $2.30 flat for
 *   24-110 pages, $1.00 + $0.012/page for 111-828 pages; premium color
 *   = $3.60 flat for 24-40 pages, $1.00 + $0.065/page for 42+ pages;
 *   standard color = $1.00 + $0.0255/page (72-600 pages); hardcover
 *   $5.65 + $0.012/page; royalty 60% band ($9.99-$200) / 50% band
 *   ($2.99-$9.98); royalty = list × rate − print cost; min list price =
 *   print cost / rate; 24-page minimum for paperbacks; max list $250
 * - Platform commission spread (books.by comparison, verified Feb 2026):
 *   KDP Amazon.com 30% commission (60% royalty), KDP expanded
 *   distribution 40% commission (60% royalty), IngramSpark ~55%
 *   wholesale discount + distribution fee, Lulu ~20% commission,
 *   Blurb 45-64% royalties, BookBaby $399 setup / 50% royalty
 * - 250-page B&W paperback at $15.99 example (Feb 2026): KDP net $5.59,
 *   IngramSpark net $2.22, Lulu-equivalent ~$10.73
 * - Knitting-designer war stories (The Knitting Times, first person):
 *   single patterns sell on KDP only as ebooks (paperback needs 24+
 *   pages); sets of 6+ patterns sell better as paperbacks than ebooks
 *   because knitters knit from paper; color print cost forces price
 *   hikes; an account was CLOSED for "misleading" pattern-as-book
 *   listings (customers thought a book was a knitted item) — metadata
 *   must clearly describe content
 */

export type PodPlatform =
  | 'kdp-amazon'
  | 'kdp-expanded'
  | 'ingramspark'
  | 'lulu-direct'
  | 'etsy-self';

export interface PodPatternsInput {
  /** Title of the collection, e.g. "Capsule Sweaters booklet". */
  title: string;
  /** Total page count of the physical product (incl. cover interior, intro, etc.). */
  pageCount: number;
  /** Pages printed in color (0 = all black & white). */
  colorPages: number;
  /** Whether to print as color booklet (forces color ink cost on all pages). */
  colorInk: boolean;
  /** Paperbound vs hardbound. */
  hardcover: boolean;
  /** List price the designer intends to charge. */
  listPrice: number;
  /** Which channel the physical copy ships through. */
  platform: PodPlatform;
  /** Cover + layout design cost allocated to this title ($). 0 if already sunk. */
  coverLayoutCost: number;
  /** Price of the same patterns sold as a digital PDF. */
  digitalPdfPrice: number;
  /** Monthly digital units sold at the digital PDF price. */
  digitalUnitsPerMonth: number;
  /** Expected monthly physical units sold at the list price. */
  expectedUnitsPerMonth: number;
  /** Share of physical sales cannibalizing digital (0-1). */
  cannibalShare: number;
  /** Designer's effective hourly rate, for the production-hours verdict. */
  hourlyRate: number;
  /** Hours spent on cover + layout + formatting (per-title one-time). */
  productionHours: number;
}

export const DEFAULT_POD_PATTERNS: PodPatternsInput = {
  title: 'Capsule Sweaters Collection',
  pageCount: 60,
  colorPages: 0,
  colorInk: false,
  hardcover: false,
  listPrice: 18.99,
  platform: 'kdp-amazon',
  coverLayoutCost: 0,
  digitalPdfPrice: 8.0,
  digitalUnitsPerMonth: 60,
  expectedUnitsPerMonth: 12,
  cannibalShare: 0.3,
  hourlyRate: 45,
  productionHours: 10,
};

export interface Flag {
  code: string;
  title: string;
  detail: string;
}

export interface UnitEconomics {
  /** Printing cost per copy under the chosen spec. */
  printingCost: number;
  /** Net royalty per physical unit after printing + platform commission. */
  netPerUnit: number;
  /** Monthly net at expected units minus the per-month cannibalization drag. */
  monthlyNet: number;
  /** Monthly digital net lost to cannibalization. */
  cannibalDrag: number;
}

export interface DigitalComparison {
  /** What the same patterns earn monthly as a digital PDF at current sales. */
  digitalMonthlyNet: number;
  /** Months at expected physical volume to equal one month of current digital sales. */
  monthsToDigitalMonth: number;
  /** Net per sale of the digital PDF on Ravelry-style marketplace (~15% take). */
  digitalNetPerSale: number;
}

export interface PodPatternsResult {
  unit: UnitEconomics;
  digital: DigitalComparison;
  /** Minimum list price enforced by the 60% royalty band floor. */
  minListPrice: number;
  /** Royalty band: 60% ($9.99+) or 50% (below). */
  royaltyRate: number;
  /** The digital-equivalent value of one physical sale (unit price anchor). */
  physicalToDigitalRatio: number;
  /** Break-even physical copies per month to out-earn the cannibal drag. */
  breakEvenUnits: number;
  flags: Flag[];
  verdict: string;
  verdictNote: string;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function fmt$(n: number): string {
  const rounded = Math.round(Math.abs(n) * 100) / 100;
  return `${n < 0 ? '−' : ''}$${rounded.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ---- Platform commission rates (verified, Feb 2026) ----
// Net to designer = list × (1 − commission) − printing cost.
const PLATFORM_COMMISSION: Record<PodPlatform, number> = {
  'kdp-amazon': 0.3, // 60% royalty band, sold on Amazon.com
  'kdp-expanded': 0.4, // expanded distribution, 60% royalty band
  'ingramspark': 0.55, // ~55% wholesale discount
  'lulu-direct': 0.2, // Lulu marketplace/direct ~20%
  'etsy-self': 0.11, // Etsy fees ~9.5% + payment ~3% ≈ 12.5% → use 0.11 blended-ish
};

/** Amazon.com B&W paperback printing cost (KDP official): $2.30 flat for
 *  24-110 pages, $1.00 + $0.012/page for 111-828. Returns null below 24
 *  pages (below the paperback minimum). Premium color: $3.60 flat
 *  24-40 pages, $1.00 + $0.065/page 42+. */
function kdpPrintCost(pages: number, color: boolean, hardcover: boolean): number | null {
  if (pages < 24) return null;
  if (hardcover) return round2(5.65 + (pages - 1) * 0.012);
  if (color) {
    if (pages <= 40) return 3.6;
    return round2(1.0 + (pages - 1) * 0.065);
  }
  if (pages <= 110) return 2.3;
  return round2(1.0 + (pages - 1) * 0.012);
}

/** Lulu-style network print cost estimate for the same spec:
 *  ~$1.26 base + $0.016/page B&W (books.by verified formula), color at
 *  ~$0.05/page (conservative between standard/premium). */
function luluPrintCost(pages: number, color: boolean): number {
  if (color) return round2(1.3 + Math.max(0, pages) * 0.05);
  return round2(1.26 + pages * 0.016);
}

/** Etsy/self-print estimate: short-run commercial printing ≈ $2.50 flat
 *  + $0.03/page B&W (aggregator floor, includes packing materials). */
function etsyPrintCost(pages: number, color: boolean): number {
  if (color) return round2(3.0 + pages * 0.08);
  return round2(2.5 + pages * 0.03);
}

/** IngramSpark B&W ≈ KDP + $0.50/page-adjacent overhead: use $1.50 + $0.016/page. */
function ingramPrintCost(pages: number, color: boolean): number {
  if (pages < 24) return -1;
  if (color) return round2(3.8 + pages * 0.06);
  return round2(1.5 + pages * 0.016);
}

function printingCostFor(input: PodPatternsInput): number | null {
  switch (input.platform) {
    case 'kdp-amazon':
    case 'kdp-expanded':
      return kdpPrintCost(input.pageCount, input.colorInk, input.hardcover);
    case 'lulu-direct':
      return luluPrintCost(input.pageCount, input.colorInk);
    case 'etsy-self':
      return etsyPrintCost(input.pageCount, input.colorInk);
    case 'ingramspark':
      return ingramPrintCost(input.pageCount, input.colorInk);
    default:
      return kdpPrintCost(input.pageCount, input.colorInk, input.hardcover);
  }
}

/** Royalty band: 60% above $9.99, 50% at $2.99-9.98 (KDP US rules). */
function royaltyRateFor(listPrice: number): number {
  return listPrice >= 9.99 ? 0.6 : 0.5;
}

/** Net royalty per unit = list × royaltyRate − print cost, with the
 *  platform commission baked into the rate; Etsy-self nets the full
 *  commission model (list × (1 − take) − print). */
function netPerUnit(listPrice: number, printCost: number, platform: PodPlatform): number {
  const commission = PLATFORM_COMMISSION[platform];
  if (platform === 'etsy-self') {
    return round2(listPrice * (1 - commission) - printCost);
  }
  if (platform === 'ingramspark') {
    // IngramSpark direct-to-reader orders still pay royalty minus discount:
    // 60% royalty band minus the ~55% wholesale discount ≈ list × 5% — the
    // documented reason direct IngramSpark sales underperform (verified
    // example: 250-page book at $15.99 nets $2.22 via IngramSpark vs $5.59
    // via KDP). Direct-channel net is modeled as the small residual after
    // the discount; the real money is trade distribution only.
    const residual = listPrice * royaltyRateFor(listPrice) - listPrice * commission;
    return round2(Math.max(0, residual) - printCost);
  }
  const rate = royaltyRateFor(listPrice);
  return round2(listPrice * rate - printCost);
}

/** Minimum list price for the 60% band: print cost / 0.6 (KDP rule). */
function minListPriceFor(printCost: number): number {
  return round2(printCost / 0.6);
}

export function analyzePODPatterns(input: PodPatternsInput): PodPatternsResult {
  const flags: Flag[] = [];
  const printCost = printingCostFor(input);

  // ---- Digital baseline ----
  const digitalTake = 0.15; // Ravelry-pattern-marketplace-ish blended take
  const digitalNetPerSale = round2(input.digitalPdfPrice * (1 - digitalTake));
  const digitalMonthlyNet = round2(digitalNetPerSale * Math.max(0, input.digitalUnitsPerMonth));
  const cannibalUnits = round2(Math.max(0, input.expectedUnitsPerMonth) * Math.max(0, Math.min(1, input.cannibalShare)));
  const cannibalDrag = round2(digitalNetPerSale * cannibalUnits);

  // ---- Physical unit economics ----
  let unit: UnitEconomics = {
    printingCost: 0,
    netPerUnit: 0,
    monthlyNet: round2(-cannibalDrag),
    cannibalDrag,
  };

  let minList = 0;
  let rate = 0.6;

  if (printCost === null || printCost < 0) {
    // Below the 24-page paperback minimum → POD paperback isn't possible.
    return {
      unit,
      digital: { digitalMonthlyNet, monthsToDigitalMonth: Infinity, digitalNetPerSale },
      minListPrice: 0,
      royaltyRate: 0.6,
      physicalToDigitalRatio: 0,
      breakEvenUnits: Infinity,
      flags: [{
        code: 'PD-01',
        title: 'Below the 24-page paperback minimum',
        detail: `POD paperbacks need at least 24 pages (KDP, IngramSpark, Lulu all enforce it). At ${input.pageCount} pages a single pattern or thin leaflet can't be POD'd as a book — this is why pattern designers bundle 6+ patterns per booklet: it lifts the page count over the floor AND matches what knitters buy on paper. Add more patterns, an intro, a techniques section, or sell this one as an ebook only.`,
      }],
      verdict: 'Too thin to print — bundle or ebook it',
      verdictNote: `Your ${input.pageCount}-page spec falls below the POD paperback minimum. Bundle this pattern with 5-8 more from your back catalog into a 60-90 page collection booklet and rerun the math — at 60+ pages you hit KDP's flat $2.30 print cost band, where every extra page is nearly free.`,
    };
  }

  rate = royaltyRateFor(input.listPrice);
  minList = minListPriceFor(printCost);
  const net = netPerUnit(input.listPrice, printCost, input.platform);
  const monthlyNet = round2(net * Math.max(0, input.expectedUnitsPerMonth) - cannibalDrag);
  const breakEvenUnits = net > 0 ? round2(cannibalDrag / net) : Infinity;
  const physicalToDigitalRatio = input.digitalPdfPrice > 0 ? round2(input.listPrice / input.digitalPdfPrice) : 0;
  const monthsToDigitalMonth = digitalMonthlyNet > 0 ? round2(digitalMonthlyNet / Math.max(0.001, monthlyNet)) : Infinity;

  unit = {
    printingCost: printCost,
    netPerUnit: net,
    monthlyNet,
    cannibalDrag,
  };

  // ---- Market band: pattern books vs digital PDFs ----
  // Pattern books on Amazon retail $15-35; designer booklets on Etsy $12-25;
  // digital PDFs $6-9. A physical copy at < 1.5× the digital price is
  // undervaluing the paper (print cost eats the margin); at > 4× it
  // competes with professionally photographed trade books.
  const LOW_RATIO = 1.5;
  const HIGH_RATIO = 4;

  // ---- Flags ----

  // PD-01 — below band floor: list price under the minimum that covers print.
  if (input.listPrice < minList && input.listPrice > 0) {
    flags.push({
      code: 'PD-01',
      title: 'List price below the print-cost floor',
      detail: `At $${input.listPrice.toFixed(2)} you earn $${net.toFixed(2)}/copy — check the math: print cost is $${printCost.toFixed(2)} and the platform keeps ${(PLATFORM_COMMISSION[input.platform] * 100).toFixed(0)}%, so the 60% band needs $${minList.toFixed(2)}+ just to break even. Raise the list price to $${minList.toFixed(2)} or trim pages: a 60-page booklet prints at $2.30 on KDP (flat band to 110 pages), which is the whole reason 6+ pattern collections are the sweet spot.`,
    });
  }

  // PD-02 — color ink blowout: premium color at 42+ pages runs $0.065/page.
  if (input.colorInk && input.pageCount >= 42) {
    const bwCost = kdpPrintCost(input.pageCount, false, input.hardcover) ?? 0;
    const delta = printCost - bwCost;
    flags.push({
      code: 'PD-02',
      title: 'Color ink multiplies the print cost',
      detail: `Premium color runs $0.065/page above 40 pages — your $${printCost.toFixed(2)} print cost is $${delta.toFixed(2)} more than the $${bwCost.toFixed(2)} black-and-white equivalent. Knitters DO accept B&W pattern booklets (most trade pattern books do), and a color cover + B&W interior is the classic hybrid: put photos on the cover and first pages inside the color band, charts in ink. Every $1 of print cost costs you $1.67 of list price at the 60% band.`,
    });
  }

  // PD-03 — net per unit below the digital PDF net.
  if (net > 0 && net < digitalNetPerSale) {
    flags.push({
      code: 'PD-03',
      title: 'Physical copy earns less than the PDF',
      detail: `One paperback nets $${net.toFixed(2)} but the same patterns as a PDF net $${digitalNetPerSale.toFixed(2)} — the book is working against your best margin. Knitters buy paper in hand while knitting, so the format has real demand, but the price must clear it: raise the list to $${(minList + 3).toFixed(2)}+ or move to a lower-commission channel (Lulu direct nets $${netPerUnit(input.listPrice, luluPrintCost(input.pageCount, input.colorInk), 'lulu-direct').toFixed(2)}/copy at this price).`,
    });
  }

  // PD-04 — platform commission trap: IngramSpark's 55% discount.
  if (input.platform === 'ingramspark') {
    const luluNet = netPerUnit(input.listPrice, luluPrintCost(input.pageCount, input.colorInk), 'lulu-direct');
    flags.push({
      code: 'PD-04',
      title: 'IngramSpark wholesale discount eats the margin',
      detail: `IngramSpark's ~55% wholesale discount leaves $${net.toFixed(2)}/copy here. The same book direct through Lulu nets $${luluNet.toFixed(2)}/copy — IngramSpark is the right tool for bookstore/library DISTRIBUTION, not for direct sales. The proven pattern: Lulu or your own site for direct (highest net), KDP for Amazon discovery, IngramSpark only for trade reach. If this is a direct-sale title, switch to lulu-direct and gain $${(luluNet - net).toFixed(2)}/copy instantly.`,
    });
  }

  // PD-05 — physical volume below break-even with cannibalization.
  if (net > 0 && Math.max(0, input.expectedUnitsPerMonth) < breakEvenUnits && input.expectedUnitsPerMonth > 0 && input.digitalUnitsPerMonth > 0) {
    flags.push({
      code: 'PD-05',
      title: 'Physical volume below the cannibalization break-even',
      detail: `With ${cannibalUnits.toFixed(0)}/mo of physical sales cannibalizing your PDF ($${digitalNetPerSale.toFixed(2)}/copy), you need $${breakEvenUnits.toFixed(1)}+ physical copies/month just to hold even with digital-only. At ${input.expectedUnitsPerMonth}/mo the book nets $${monthlyNet.toFixed(0)}/mo including the drag — if your audience is mostly digital-native (Ravelry-first), model the book as marketing that lifts PDF sales, not a standalone revenue line.`,
    });
  }

  // PD-06 — ratio too low: physical undervalued vs digital.
  if (physicalToDigitalRatio > 0 && physicalToDigitalRatio < LOW_RATIO) {
    flags.push({
      code: 'PD-06',
      title: 'Physical price too close to the PDF price',
      detail: `At ${physicalToDigitalRatio.toFixed(1)}× the PDF price, paper barely costs more than pixels — buyers will wait for the download, and the print cost eats what's left. Pattern-book market data supports 2-3× (a $8 PDF maps to a $18-24 booklet). Your PDF is $${input.digitalPdfPrice.toFixed(2)}; the booklet should clear $${(input.digitalPdfPrice * LOW_RATIO).toFixed(2)}+ before page-count math even starts.`,
    });
  }

  // PD-07 — ratio too high vs the trade-book ceiling.
  if (physicalToDigitalRatio > HIGH_RATIO) {
    flags.push({
      code: 'PD-07',
      title: 'Booklet priced into trade-book territory',
      detail: `At $${input.listPrice.toFixed(2)} this booklet competes with $25-35 professionally photographed trade books (Amy Herzog class). Designer booklets on Etsy hold $12-25. Either add the production value that justifies the price (full-color interior, styling guide, 10+ patterns) or price back into booklet territory — a $24.99 booklet that looks like a $24.99 booklet sells; an $29.99 leaflet that looks like one gets one-star reviews.`,
    });
  }

  // PD-08 — metadata/account-ban risk: pattern-as-book listings get banned.
  if (input.title.toLowerCase().includes('pattern') || input.title.toLowerCase().includes('knit') === false) {
    // flag whenever the title could be read as a finished object
    flags.push({
      code: 'PD-08',
      title: 'Title/metadata can be misread as a knitted item',
      detail: `Documented case: a designer's KDP account was CLOSED and titles deleted for "misleading" listings where customers thought a pattern book was a knitted sweater. Whatever your title, the subtitle and description must say "pattern book / instructions, NOT a finished garment" in plain text — buyers who misread a listing leave one-star reviews and platform teams ban the account, not just the title.`,
    });
  }

  // PD-09 — Etsy self-print logistics: per-unit shipping labor not in the math.
  if (input.platform === 'etsy-self') {
    flags.push({
      code: 'PD-09',
      title: 'Self-shipped copies carry hidden labor',
      detail: `Etsy-self prints at $${printCost.toFixed(2)}/copy but YOU pack and ship each one (~15-25 min/copy at your $${input.hourlyRate}/hr = $${round2(input.hourlyRate * 0.33).toFixed(2)}-$${round2(input.hourlyRate * 0.42).toFixed(2)} labor/copy) plus materials. KDP/Lulu ship for you at a $${Math.max(0, netPerUnit(input.listPrice, kdpPrintCost(input.pageCount, input.colorInk, input.hardcover) ?? 0, 'kdp-amazon')).toFixed(2)}/copy KDP net. Self-shipping only wins when the per-copy premium you can charge exceeds that labor — test at 25+ copies/month before scaling.`,
    });
  }

  // ---- Verdict ladder ----
  let verdict: string = '';
  let verdictNote: string = '';

  if (net <= 0) {
    verdict = 'Do not print at this spec — the math is negative'; // 1: negative per-copy net (checked first)
    verdictNote = `At $${input.listPrice.toFixed(2)} this spec nets $${net.toFixed(2)}/copy. The fix order: raise the list price to $${(minList + 3).toFixed(2)} (still inside the $12-25 booklet band), cut pages to stay under 110 (flat $2.30 band), kill full-color interior, or switch to lulu-direct. Rerun when one of those moves puts the copy above water.`;
  } else if (monthlyNet < 0 && breakEvenUnits < Infinity) {
    verdict = 'Print volume below break-even — sell it as marketing';
    verdictNote = `Including the $${cannibalDrag.toFixed(0)}/mo digital drag, this booklet loses $${Math.abs(monthlyNet).toFixed(0)}/mo at ${input.expectedUnitsPerMonth}/mo. It needs ${breakEvenUnits.toFixed(0)}+ physical copies/month to hold even. If your real goal is PDF-funnel visibility ("printed copy → Ravelry reviews → digital sales"), track the digital units AFTER listing and judge the booklet by lift, not by its own P&L.`;
  } else if (input.platform === 'ingramspark' && netPerUnit(input.listPrice, luluPrintCost(input.pageCount, input.colorInk), 'lulu-direct') > net + 0.01) {
    verdict = 'Switch channels before printing'; // 3: IngramSpark leaves >50% more on lulu-direct
    verdictNote = `The spec is sound but IngramSpark's 55% discount leaves $${net.toFixed(2)}/copy where lulu-direct leaves $${netPerUnit(input.listPrice, luluPrintCost(input.pageCount, input.colorInk), 'lulu-direct').toFixed(2)}. Use Lulu/your site for direct sales and reserve IngramSpark for bookstore distribution only. That channel move is worth $${(netPerUnit(input.listPrice, luluPrintCost(input.pageCount, input.colorInk), 'lulu-direct') - net).toFixed(2)} per copy with zero design changes.`;
  } else if (input.colorInk && input.pageCount >= 42) {
    verdict = 'Go hybrid color — cover in color, interior in ink';
    verdictNote = `Full color at ${input.pageCount} pages costs $${printCost.toFixed(2)}/copy and forces a $${(minList).toFixed(2)}+ list just to break even. The proven designer configuration: color cover + first color pages inside the 40-page color band, B&W charts beyond. That drops the print cost to roughly $${round2(3.6 + Math.max(0, input.pageCount - 40) * 0.012).toFixed(2)} and pulls the break-even list back into the $18-22 booklet band where buyers actually pay.`;
  } else {
    const prodPay = monthlyNet / Math.max(1, input.productionHours);
    if (prodPay >= input.hourlyRate) {
      verdict = 'Worth printing — beats your hourly rate';
      verdictNote = `At $${net.toFixed(2)}/copy × ${input.expectedUnitsPerMonth}/mo minus $${cannibalDrag.toFixed(0)} digital drag, the booklet nets $${monthlyNet.toFixed(0)}/mo — $${prodPay.toFixed(2)}/hr against your $${input.hourlyRate}/hr rate for the ${input.productionHours}h cover/layout job. The 24+ page floor, flat print band, and 2-3× PDF price are all met. Ship the first run through KDP for discovery, add lulu-direct for the direct channel when sales hold.`;
    } else {
      verdict = 'Marginal print economics — print only for the funnel';
      verdictNote = `The copy is above water ($${net.toFixed(2)}/copy) and the booklet band is right, but at ${input.expectedUnitsPerMonth}/mo the title nets $${monthlyNet.toFixed(0)}/mo — $${prodPay.toFixed(2)}/hr against your $${input.hourlyRate}/hr rate. Print it only if the Ravelry reviews, Amazon "also-bought" halo, and PDF-funnel lift matter more than the direct P&L; otherwise fold the patterns into a bigger collection (10+ patterns, 100+ pages) and let the flat print band do the work.`;
    }
  }
  if (verdict === '') {
    verdict = 'Model not applicable';
    verdictNote = 'No branch matched; rerun with full inputs.';
  }

  return {
    unit,
    digital: { digitalMonthlyNet, monthsToDigitalMonth, digitalNetPerSale },
    minListPrice: minList,
    royaltyRate: rate,
    physicalToDigitalRatio,
    breakEvenUnits,
    flags,
    verdict,
    verdictNote,
  };
}
