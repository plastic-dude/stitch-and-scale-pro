// CHK-065 — Consignment Re-Price Lab engine
// Prices a print pattern/leaflet/kit sitting on consignment at local yarn
// shops (or via Ravelry In-Store): per-unit net by channel, the re-price
// ladder when the season turns, dead-stock cost of unsold print runs, and a
// keep / markdown / pull-back verdict.
//
// Verified market facts baked in:
// - Ravelry In-Store split: designer 60% / LYS 40% of retail above $2.49;
//   at $2.49 or below the designer nets retail - $1.00 flat (shop keeps $1).
// - Ravelry designer fee: 6.5% + $0.25 + ~3% processing on each sale.
// - Typical consignment shop take: 50-60% of sales (designer keeps 40-50%).
// - Print leaflets are seasonally perishable: a winter garment leaflet
//   printed for Oct is worth full price until Dec, ~60-70% Mar-May, and
//   nearly unsellable at print Jun-Aug.
// - Buyers expect destash/aged stock at ~50% off retail; 65-70% of retail
//   is acceptable for current, in-good-condition stock.

export interface ShopChannel {
  name: string;
  /** Share of each sale kept by the designer (e.g. 0.60 for Ravelry In-Store
   *  above $2.49; 0.40-0.50 for direct consignment). */
  designerShare: number;
  /** Ravelry platform fee (6.5% + $0.25 + ~3% processing) applied per sale;
   *  0 for direct consignment where the shop remits a flat share. */
  platformRate: number;
  /** Ravelry flat $0.25 per-sale fee */
  platformFlat: number;
  /** Special: pattern at $2.49 or below => shop keeps flat $1.00 instead of
   *  the 40% share (Ravelry In-Store rule). */
  lowPriceFlatShopCut: number;
  lowPriceThreshold: number;
}

export interface RepriceInput {
  /** Current retail price of the print pattern/leaflet. */
  retailPrice: number;
  /** Which channel the stock currently sits in. */
  channel: 'ravelry-instore' | 'consignment-direct' | 'own-shop';
  /** Print cost per copy (blank + ink + labor). */
  printCostPerUnit: number;
  /** Units currently printed and sitting at the shop(s). */
  unitsAtShop: number;
  /** Units selling per month at the current price. */
  unitsSoldPerMonth: number;
  /** Months since the print run landed in shops (season age). */
  monthsInShop: number;
  /** Category season: which months this design sells best. */
  seasonBand: 'winter' | 'spring' | 'summer' | 'yearround';
  /** Desired per-hour value of your time (used to weigh markdown labor). */
  opportunityRate: number;
  /** Hours to execute a re-price (re-print covers, notify shops, update site). */
  repriceHours: number;
}

export interface ChannelNet {
  channel: string;
  designerSharePct: number;
  netPerUnit: number;
  platformFeePerUnit: number;
}

export interface LadderStep {
  label: string;
  price: number;
  pricePctOfRetail: number;
  /** Designer net per unit after split + platform fees + print cost. */
  netPerUnit: number;
  /** Months to clear current stock at the estimated sell-through uplift. */
  monthsToClear: number;
  totalNetOnCurrentStock: number;
  rationale: string;
}

export interface Flag {
  code: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  detail: string;
}

export interface RepriceResult {
  input: RepriceInput;
  channelNets: ChannelNet[];
  currentNetPerUnit: number;
  /** Months of stock on hand at current sell-through. */
  monthsOfStock: number;
  /** Estimated value of unsold units if they never move (print cost sunk). */
  deadStockRisk: number;
  ladder: LadderStep[];
  /** Best ladder step by total net on current stock. */
  bestStep: LadderStep;
  /** QA #45 (S255): true when units are stocked but nothing is selling — every
   * ladder step's total net is $0.00, so no step can be meaningfully crowned BEST. */
  zeroSellThrough: boolean;
  flags: Flag[];
  verdict: string;
}

function channels(input: RepriceInput): ShopChannel[] {
  return [
    {
      name: 'Ravelry In-Store',
      designerShare: 0.6,
      platformRate: 0.065 + 0.03,
      platformFlat: 0.25,
      lowPriceFlatShopCut: 1.0,
      lowPriceThreshold: 2.49,
    },
    {
      name: 'Direct consignment',
      designerShare: 0.45,
      platformRate: 0,
      platformFlat: 0,
      lowPriceFlatShopCut: 0,
      lowPriceThreshold: Infinity,
    },
    {
      name: 'Own shop / online',
      designerShare: 0.97,
      platformRate: 0.03,
      platformFlat: 0.25,
      lowPriceFlatShopCut: 0,
      lowPriceThreshold: Infinity,
    },
  ];
}

/** Seasonal value factor: 1.0 in peak months, decaying out of season. */
function seasonFactor(band: RepriceInput['seasonBand'], monthsInShop: number): number {
  // Out-of-season decay kicks in after ~3 months; garment print runs lose
  // roughly 40-60% of their willingness-to-pay once the season turns.
  const inSeason = monthsInShop <= 3;
  const offSeason = monthsInShop > 3;
  if (band === 'yearround') return 1.0;
  if (inSeason) return 1.0;
  // Year 1 out of season: value falls to ~65%; year 2 to ~40%.
  if (monthsInShop <= 12) return 0.65;
  return 0.4;
}

/** Buyer psychology floor: below 50% of retail, aged stock reads as destash
 *  and buyers wait for more; above ~70% buyers just pass. */
function buyerAcceptable(pricePct: number, monthsInShop: number): boolean {
  if (monthsInShop <= 3) return pricePct >= 0.7;
  if (monthsInShop <= 12) return pricePct >= 0.65;
  return pricePct >= 0.5;
}

export function netPerUnit(price: number, ch: ShopChannel, printCost: number): {
  net: number; fee: number;
} {
  let share = ch.designerShare;
  let fee = 0;
  if (price <= ch.lowPriceThreshold && ch.lowPriceFlatShopCut > 0) {
    // Ravelry In-Store: shop keeps flat $1; designer keeps the rest, then pays
    // the standard pattern-store fee on the designer portion.
    const designerGross = price - ch.lowPriceFlatShopCut;
    fee = designerGross * ch.platformRate + ch.platformFlat;
    const net = designerGross - fee - printCost;
    return { net, fee };
  }
  const gross = price * share;
  fee = gross * ch.platformRate + ch.platformFlat;
  const net = gross - fee - printCost;
  return { net, fee };
}

function monthsToClear(
  monthsOfStock: number,
  pricePct: number,
  monthsInShop: number,
): number {
  // Markdown uplift: buyers take 65-70% of retail readily; 50% reads as a
  // real deal (~2.2× current sell-through); deep 35-40% moves ~3× but trips
  // the destash-perception floor.
  let uplift = 1.0;
  if (pricePct >= 0.65 && pricePct <= 0.75) uplift = 1.8;
  else if (pricePct >= 0.55 && pricePct < 0.65) uplift = 2.2;
  else if (pricePct >= 0.45 && pricePct < 0.55) uplift = 3.0;
  else if (pricePct < 0.45) uplift = 2.6; // deeper than destash floor, noise
  const baseMonths = Math.max(monthsOfStock, 0.1);
  return baseMonths / uplift;
}

export function analyzeReprice(input: RepriceInput): RepriceResult {
  const chs = channels(input);
  const chosen = chs.find(c =>
    (input.channel === 'ravelry-instore' && c.name === 'Ravelry In-Store') ||
    (input.channel === 'consignment-direct' && c.name === 'Direct consignment') ||
    (input.channel === 'own-shop' && c.name === 'Own shop / online')) ?? chs[0];

  const channelNets: ChannelNet[] = chs.map(c => {
    const { net, fee } = netPerUnit(input.retailPrice, c, input.printCostPerUnit);
    return {
      channel: c.name,
      designerSharePct: Math.round((c.designerShare) * 100),
      netPerUnit: Math.round(net * 100) / 100,
      platformFeePerUnit: Math.round(fee * 100) / 100,
    };
  });

  const current = netPerUnit(input.retailPrice, chosen, input.printCostPerUnit);
  const monthsOfStock =
    input.unitsSoldPerMonth > 0 ? input.unitsAtShop / input.unitsSoldPerMonth : Infinity;

  const ladder = buildLadder(input, chosen);
  const bestStep = [...ladder].sort((a, b) => b.totalNetOnCurrentStock - a.totalNetOnCurrentStock)[0];
  // QA #45 (S255): with units in the shop and zero sell-through, every step
  // clears $0.00 — the crown means nothing. Surface it to the UI.
  const zeroSellThrough = input.unitsSoldPerMonth <= 0 && input.unitsAtShop > 0;

  const flags: Flag[] = [];

  // CR-01: below the Ravelry $2.49 cliff
  if (input.retailPrice <= 2.49) {
    const netNow = current.net;
    const netAbove = netPerUnit(2.50, chosen, input.printCostPerUnit).net;
    flags.push({
      code: 'CR-01',
      severity: 'critical',
      title: `$${input.retailPrice.toFixed(2)} sits below the $2.49 split cliff`,
      detail: `At or under $2.49 the shop keeps a flat $1.00 instead of 40%, so ${chosen.name} nets you $${netNow.toFixed(2)}/unit; at $2.50 it would net $${netAbove.toFixed(2)}. A quarter bump earns more than it loses.`,
    });
  }

  // CR-02: negative net on the current price
  if (current.net <= 0) {
    flags.push({
      code: 'CR-02',
      severity: 'critical',
      title: 'Current price nets zero or less per unit',
      detail: `After the ${chosen.name} split and fees, each sale nets $${current.net.toFixed(2)} against $${input.printCostPerUnit.toFixed(2)} print cost. Every sale below break-even is paid labor.`,
    });
  }

  // CR-03: aged stock past season
  const sf = seasonFactor(input.seasonBand, input.monthsInShop);
  if (input.monthsInShop > 3 && sf < 1) {
    flags.push({
      code: 'CR-03',
      severity: 'warning',
      title: 'Print run has aged out of its season',
      detail: `${input.monthsInShop} months in shop puts willingness-to-pay around ${Math.round(sf * 100)}% of retail for a ${input.seasonBand}-band design. Holding full price while the season has turned converts shelf life into dead stock.`,
    });
  }

  // CR-04: dead stock risk
  const deadStockRisk = Math.round(input.unitsAtShop * input.printCostPerUnit * 100) / 100;
  if ((monthsOfStock === Infinity || monthsOfStock > 12) && input.unitsAtShop > 0) {
    flags.push({
      code: 'CR-04',
      severity: 'critical',
      title: monthsOfStock === Infinity ? 'No current sell-through — units are not moving' : 'Over a year of stock on hand',
      detail: `At ~${input.unitsSoldPerMonth}/mo sell-through, ${input.unitsAtShop} units is ${monthsOfStock === Infinity ? 'more than a year' : `${monthsOfStock.toFixed(0)} months`} of inventory worth $${deadStockRisk.toFixed(2)} in sunk print cost. Markdown or pull-back now.`,
    });
  } else if (monthsOfStock > 6) {
    flags.push({
      code: 'CR-04',
      severity: 'warning',
      title: 'More than 6 months of stock on hand',
      detail: `${monthsOfStock.toFixed(1)} months of sell-through ($${deadStockRisk.toFixed(2)} in sunk print cost). Seasonal print runs over 6 months deep should already be on the ladder.`,
    });
  }

  // CR-05: deep markdown trips the destash floor
  const deepStep = ladder.find(s => s.pricePctOfRetail < 0.5);
  if (deepStep && monthsOfStock !== Infinity && monthsOfStock > 3) {
    flags.push({
      code: 'CR-05',
      severity: 'warning',
      title: 'Buyers read deep markdowns as destash',
      detail: `Aged stock under 50% of retail signals "clearing out" to LYS buyers, who expect closer to 50% off and will wait. ${deepStep.label} is the floor — anything deeper mainly trains customers to wait.`,
    });
  }

  // CR-06: consignment take above market
  if (chosen.name === 'Direct consignment' && chosen.designerShare < 0.4) {
    flags.push({
      code: 'CR-06',
      severity: 'warning',
      title: 'Shop take above the consignment norm',
      detail: `This shop keeps ${Math.round((1 - chosen.designerShare) * 100)}% of sales. Direct consignment normally runs 50-60% to the shop; above that, the same units net more on Ravelry In-Store or your own site even after fees.`,
    });
  }

  // CR-07: reprice labor worth it?
  const repriceCost = input.repriceHours * input.opportunityRate;
  const bestGain = bestStep.totalNetOnCurrentStock - (current.net * Math.min(input.unitsAtShop, input.unitsSoldPerMonth > 0 ? input.unitsAtShop : 0));
  if (repriceCost > bestGain * 0.2 && input.unitsAtShop >= 10) {
    flags.push({
      code: 'CR-07',
      severity: 'info',
      title: 'Re-price labor is material',
      detail: `${input.repriceHours} hours at $${input.opportunityRate}/hr is $${repriceCost.toFixed(2)}. Only worth it with enough units on hand — at ${input.unitsAtShop} units a single ladder step moves $${(bestStep.netPerUnit * input.unitsAtShop).toFixed(2)} on current stock.`,
    });
  }

  // CR-08: print cost too high for the price point
  if (input.printCostPerUnit > input.retailPrice * 0.25) {
    flags.push({
      code: 'CR-08',
      severity: 'warning',
      title: 'Print cost eats more than 25% of retail',
      detail: `$${input.printCostPerUnit.toFixed(2)}/copy on a $${input.retailPrice.toFixed(2)} pattern leaves the ladder no room: even the full-price step nets under 75% of the sale before splits. Print cheaper or print less.`,
    });
  }

  const verdict = buildVerdict(input, current, bestStep, flags, monthsOfStock);

  return {
    input,
    channelNets,
    currentNetPerUnit: Math.round(current.net * 100) / 100,
    monthsOfStock,
    deadStockRisk,
    ladder,
    bestStep,
    zeroSellThrough,
    flags,
    verdict,
  };
}

function buildLadder(input: RepriceInput, chosen: ShopChannel): LadderStep[] {
  const sf = seasonFactor(input.seasonBand, input.monthsInShop);
  const deadStock = (input.unitsAtShop > 0) && (input.unitsSoldPerMonth <= 0 || input.unitsAtShop / Math.max(input.unitsSoldPerMonth, 0.01) > 12);
  const aged = input.monthsInShop > 3;
  const steps: { pricePct: number; label: string; rationale: string; skipWhen?: boolean }[] = [
    {
      pricePct: 1.0,
      label: 'Hold full price',
      rationale: 'Sell-through is healthy and the season still supports retail.',
      skipWhen: deadStock || aged || sf < 1,
    },
    {
      pricePct: 0.85,
      label: 'Light markdown (15% off)',
      rationale: 'A start-of-next-season nudge; buyers still see it as current stock, not destash.',
      skipWhen: false,
    },
    {
      pricePct: 0.7,
      label: 'Seasonal markdown (30% off)',
      rationale: 'The 65-70% band buyers accept for current-condition stock; the standard "end of season" move before the season actually ends.',
      skipWhen: false,
    },
    {
      pricePct: 0.55,
      label: 'Clearance (45% off)',
      rationale: 'The real-deal band: ~2.2× sell-through uplift while staying above the destash-perception floor.',
      skipWhen: false,
    },
    {
      pricePct: 0.5,
      label: 'Destash floor (50% off)',
      rationale: 'The floor — aged stock below this reads as clearance-bin and trains buyers to wait. Only worth it to empty the shelf before next season.',
      skipWhen: false,
    },
    {
      pricePct: 0,
      label: 'Pull back to online-only discount',
      rationale: 'Remove print copies, sell remaining stock online at a promo price (own-site fees only), or fold into a pattern bundle.',
      skipWhen: false as boolean,
    },
  ];

  return steps.filter(s => !(s as { skipWhen?: boolean }).skipWhen).map(s => {
    const price = s.pricePct === 0 ? input.retailPrice * 0.5 : input.retailPrice * s.pricePct;
    const net = netPerUnit(price, chosen, input.printCostPerUnit);
    const monthsOfStock = input.unitsSoldPerMonth > 0 ? input.unitsAtShop / input.unitsSoldPerMonth : 24;
    const clearanceMonths = monthsToClear(monthsOfStock, s.pricePct, input.monthsInShop);
    // Pull-back step sells on own site: recompute with own-shop fees.
    const netForStep = s.pricePct === 0
      ? netPerUnit(price, channels(input)[2], input.printCostPerUnit).net
      : net.net;
    const sellUnits = Math.min(input.unitsAtShop, Math.ceil(input.unitsSoldPerMonth * clearanceMonths));
    const total = netForStep * sellUnits;
    return {
      label: s.label,
      price: Math.round(price * 100) / 100,
      pricePctOfRetail: s.pricePct,
      netPerUnit: Math.round(netForStep * 100) / 100,
      monthsToClear: Math.round(clearanceMonths * 10) / 10,
      totalNetOnCurrentStock: Math.round(total * 100) / 100,
      rationale: s.rationale,
    };
  });
}

function buildVerdict(
  input: RepriceInput,
  current: { net: number },
  bestStep: LadderStep,
  flags: Flag[],
  monthsOfStock: number,
): string {
  const hasCritical = flags.some(f => f.severity === 'critical');
  const negativeNow = current.net <= 0;

  if (bestStep.label === 'Hold full price' && !negativeNow) {
    return 'Hold the price — the season still pays for it.';
  }
  if (bestStep.label === 'Pull back to online-only discount') {
    return 'Pull the print run back — shelf life at this shop is done; sell what remains online or bundle it.';
  }
  if (negativeNow) {
    return `Markdown now — the current price nets $${current.net.toFixed(2)}/unit. ${bestStep.label} is the best move on the stock you have.`;
  }
  if (hasCritical) {
    return `${bestStep.label} — the critical flags say the current setup is losing money or shelf life. Re-price rather than hope.`;
  }
  if (bestStep.label === 'Destash floor (50% off)' || bestStep.label === 'Clearance (45% off)') {
    return `${bestStep.label} clears the shelf fastest. Do it before the next season's print run, or the old stock becomes the new stock's backdrop.`;
  }
  return `${bestStep.label} — it nets more on current stock than holding, without training your buyers to wait for destash pricing.`;
}
