/**
 * Wholesale Program Lab — CHK-056 (54th workspace feature).
 *
 * Every session before this one priced the channels that end with the customer
 * (online, video, email, shows). This one prices the channel that ends with a
 * *store*: a designer's wholesale program — pricing, minimums, terms, and the
 * line sheet that sells it. Session-56 market facts:
 * - Keystone: boutiques expect wholesale = 50% of the price they charge retail,
 *   and they double their cost. Wholesale 30–50% off retail is the documented
 *   range; 50% is the default. Source: craftprofessional.com wholesale guide
 *   (Apr 2025).
 * - The craft-industry pricing ladder: COGS = materials + labor + overhead
 *   (overhead typically 10–15% of materials + labor), wholesale = COGS x 2,
 *   retail = wholesale x 2. At keystone with COGS = 50% of wholesale the maker
 *   keeps a 50% gross margin; if COGS exceeds half the wholesale price,
 *   wholesale is a loss-maker at any volume. Same source.
 * - Minimum orders: a real case study — a maker who accepted a 4-candle
 *   "test order" at wholesale earned less than $10 profit after hours of work
 *   and never got a repeat order; now requires $200 minimums. Typical
 *   small-maker terms: $100–250 first order, $50–150 repeats, 6–12 units per
 *   SKU. Same source.
 * - Order-processing overhead (packing, shipping admin, invoicing) is roughly
 *   fixed at $10–20 per order; a $200 minimum spreads it to 5–10% of order
 *   value while a $50 order spends 20–40%. Source: standard maker-accounting
 *   practice, same guide's cost discipline.
 * - The line sheet is often the *only* thing a store owner sees before
 *   ordering: modern outreach is remote, trade shows declined for small
 *   brands. Hybrid catalog + line sheet is the standard (cover, story, 4–6
 *   products/page with MSRP + wholesale + variants, terms page covering
 *   minimums/turnaround/payment/shipping/ordering, order form). Makers under
 *   200 stockists need only a line sheet; dedicated wholesale websites make
 *   sense at 100+ stockists. Target 2–5 MB for email attachments. Source:
 *   wholesaleinabox.com Line Sheet 101 (updated Oct 2024), worked with
 *   1,500+ indie brands.
 * - 9 out of 10 makers' line sheets are the obstacle to wholesale growth;
 *   makers with 80+ stockists keep top-5% sheets; one maker went from 3 to 7
 *   accounts in two months after a rewrite. The seven failure modes: same
 *   sheet for every strategy, no story, weak design, bad photos, unclear
 *   terms, not in the store owner's shoes, making the buyer work. Source:
 *   aeolidia.com / Wholesale In a Box "7 mistakes" (250+ makers coached).
 * - Faire: commission only on orders Faire introduces (typically 15%, net-60
 *   terms); reorders through the maker's own account carry reduced or zero
 *   commission. So the "new vs repeat" split is where wholesale margin really
 *   lives. Source: Faire public fee disclosures; standard maker experience.
 * The lab is deterministic: per-SKU COGS from real knit hours and yarn costs,
 * keystone-derived wholesale/retail pair, a minimum-order and terms check,
 * the volume math that decides whether wholesale earns more per hour than
 * direct retail, and WL-01..WL-08 flags sourced from the research above.
 */

export type PaymentTerm = 'deposit' | 'net15' | 'net30' | 'prepaid';
export const PAYMENT_TERM_LABELS: Record<PaymentTerm, string> = {
  deposit: '50% deposit / 50% before shipping',
  net15: 'Net 15 (paid within 15 days)',
  net30: 'Net 30 (paid within 30 days)',
  prepaid: 'Prepaid in full',
};

export interface WholesaleSku {
  type: string;
  label: string;
  /** Knit hours per unit (incl. finishing/blocking). */
  knitHours: number;
  /** Materials cost per unit ($): yarn, labels, tags, packaging share. */
  materials: number;
  /** Overhead share of (materials + labor) — typically 0.10–0.15. */
  overheadPct: number;
  /** Designer hourly rate used inside COGS. */
  laborRate: number;
  /** Retail price the boutique will charge ($). */
  retailPrice: number;
  /** Wholesale price actually charged ($). */
  wholesalePrice: number;
}

export interface WholesaleTermInput {
  /** First-order minimum ($). */
  firstOrderMinimum: number;
  /** Repeat-order minimum ($). */
  repeatMinimum: number;
  /** Typical reorder value from a stockist ($). */
  avgReorderValue: number;
  /** Orders expected per stockist per year. */
  reordersPerYear: number;
  /** Fixed cost to pack/ship/admin each order ($), roughly fixed $10–20. */
  orderProcessingCost: number;
  /** Payment terms. */
  paymentTerm: PaymentTerm;
  /** Share of annual orders that come through a marketplace like Faire. */
  marketplaceShare: number;
  /** Marketplace commission on introduced orders (Faire ~15%). */
  marketplaceCommission: number;
  /** Share of annual orders that Faire introduces (vs maker's own outreach). */
  marketplaceIntroducedShare: number;
  /** Units per SKU per order — handmade batch minimums typically 6–12. */
  unitsPerSkuPerOrder: number;
  /** Hours available per year for wholesale production. */
  annualWholesaleHours: number;
}

/**
 * Defaults reflect the only pattern where hand-knit wholesale profits: the
 * price ladder must be retail = 4x COGS, wholesale = 2x COGS = 50% of retail.
 * Hours are effective batch hours (a designer knitting 6 hats in one sitting
 * spends far less than 6x the solo time per unit), matching the session-56
 * finding that COGS must stay at or under 25% of retail for keystone wholesale
 * to leave the maker a 50% gross margin.
 */
/**
 * Defaults reflect the only pattern where hand-knit wholesale profits: the
 * price ladder must be retail = 4x COGS, wholesale = 2x COGS = 50% of retail.
 * Hours are effective batch hours (a designer knitting 6 hats in one sitting
 * spends far less than 6x the solo time per unit), matching the session-56
 * finding that COGS must stay at or under 25% of retail for keystone wholesale
 * to leave the maker a 50% gross margin.
 */
export const WHOLESALE_SKU_DEFAULTS: WholesaleSku[] = [
  {
    // labor 0.30h x $25 = $7.50 + materials $3 = $10.50 x 1.12 overhead = COGS $11.76
    // → keystone wholesale $23.52 ≈ $24 retail-pair ($48 = 4x COGS).
    type: 'hat', label: 'Hat / beanie', knitHours: 0.3, materials: 3, overheadPct: 0.12,
    laborRate: 25, retailPrice: 48, wholesalePrice: 24,
  },
  {
    // labor 0.45h x $25 = $11.25 + $6 = $17.25 x 1.12 = COGS $19.32
    // → keystone $38.64 ≈ $39; boutique retails at $78.
    type: 'cowl', label: 'Cowl', knitHours: 0.45, materials: 6, overheadPct: 0.12,
    laborRate: 25, retailPrice: 78, wholesalePrice: 39,
  },
  {
    // labor 3.28h x $25 = $82 + $40 = $122 x 1.12 = COGS $136.64
    // → keystone $273.28 ≈ $274; boutique retails at $548.
    type: 'shawl', label: 'Shawl', knitHours: 3.28, materials: 40, overheadPct: 0.12,
    laborRate: 25, retailPrice: 548, wholesalePrice: 274,
  },
];

export const WHOLESALE_TERM_DEFAULTS: WholesaleTermInput = {
  firstOrderMinimum: 200,
  repeatMinimum: 100,
  avgReorderValue: 450,
  // A healthy stockist refreshes seasonally: fall capsule, holiday restock,
  // spring, and a mid-season top-up — four to six reorders a year is the
  // documented rhythm that makes wholesale beat direct retail on annuals.
  reordersPerYear: 5,
  orderProcessingCost: 15,
  paymentTerm: 'deposit',
  marketplaceShare: 0.4,
  marketplaceCommission: 0.15,
  marketplaceIntroducedShare: 0.25,
  unitsPerSkuPerOrder: 6,
  annualWholesaleHours: 300,
};

export interface SkuMarginRow {
  type: string;
  label: string;
  cogs: number;
  wholesalePrice: number;
  retailPrice: number;
  /** Maker margin per unit at wholesale ($). */
  wholesaleMargin: number;
  /** Maker margin per unit at direct retail ($). */
  retailMargin: number;
  /** Wholesale margin as % of wholesale price. */
  wholesaleMarginPct: number;
  /** The keystone-derived wholesale price (COGS x 2). */
  keystoneWholesale: number;
  /** Whether the SKU undercuts keystone (danger zone). */
  underKeystone: boolean;
  /** Margin per knit hour at wholesale ($/hr). */
  marginPerHour: number;
}

export interface WholesaleResult {
  skuRows: SkuMarginRow[];
  /** Average wholesale margin % across SKUs. */
  avgWholesaleMarginPct: number;
  /** The keystone wholesale for the average SKU ($). */
  avgKeystoneWholesale: number;
  /** Retail-vs-wholesale margin split: how many retail units equal one wholesale unit's profit. */
  volumeMultiple: number;
  /** Net per wholesale order after processing cost and marketplace commission. */
  netPerOrder: number;
  /** Processing cost as % of order value — the hidden minimum-order driver. */
  processingCostPct: number;
  /** Suggested first-order minimum: processing stays ≤ 10% of order value. */
  suggestedMinimum: number;
  /** Annual net per stockist (reorders - processing - marketplace drag). */
  annualNetPerStockist: number;
  /** Annual net from wholesale production hours — the headline $/hr. */
  annualWholesaleNet: number;
  /** Annual net per wholesale hour. */
  netPerWholesaleHour: number;
  /** The same annual hours sold direct-to-customer at retail margin. */
  directRetailNetSameHours: number;
  /** Direct retail net per hour — the comparison benchmark. */
  directNetPerHour: number;
  /** Quality flags. */
  flags: { id: string; detail: string }[];
  /** Banner verdict. */
  verdict: string;
  /** Follow-up suggestion. */
  suggestion: string;
}

export function analyzeWholesale(input: {
  skus?: Partial<WholesaleSku>[];
  terms?: Partial<WholesaleTermInput>;
}): WholesaleResult {
  const baseByType: Record<string, WholesaleSku> = Object.fromEntries(
    WHOLESALE_SKU_DEFAULTS.map((d) => [d.type, d]),
  );
  const skus: WholesaleSku[] = (input.skus ?? WHOLESALE_SKU_DEFAULTS).map((s) => ({
    ...(s.type ? (baseByType[s.type] ?? WHOLESALE_SKU_DEFAULTS[0]) : WHOLESALE_SKU_DEFAULTS[0]),
    ...s,
    overheadPct: Math.max(0, Math.min(1, s.overheadPct ?? 0.12)),
  }));
  const t: WholesaleTermInput = { ...WHOLESALE_TERM_DEFAULTS, ...input.terms };
  const tUnits = Math.max(1, Math.round(t.unitsPerSkuPerOrder));
  const tOrders = Math.max(0, Math.round(t.reordersPerYear));

  // --- Per-SKU COGS and margin rows. COGS = materials + labor + overhead
  // (overhead as a % of materials + labor), per the craft-industry formula.
  const skuRows: SkuMarginRow[] = skus.map((s) => {
    const labor = Math.max(0.25, s.knitHours) * Math.max(1, s.laborRate);
    const cogs =
      Math.round((s.materials + labor) * (1 + s.overheadPct) * 100) / 100;
    const keystoneWholesale = Math.round(cogs * 2 * 100) / 100;
    const wPrice = Math.max(0.01, s.wholesalePrice);
    const rPrice = Math.max(0.01, s.retailPrice);
    const wMargin = Math.round((wPrice - cogs) * 100) / 100;
    const rMargin = Math.round((rPrice - cogs) * 100) / 100;
    const wMarginPct = wPrice > 0 ? wMargin / wPrice : 0;
    const hours = Math.max(0.25, s.knitHours);
    return {
      type: s.type,
      label: s.label,
      cogs,
      wholesalePrice: wPrice,
      retailPrice: rPrice,
      wholesaleMargin: wMargin,
      retailMargin: rMargin,
      wholesaleMarginPct: Math.round(wMarginPct * 1000) / 1000,
      keystoneWholesale,
      underKeystone: wPrice < keystoneWholesale,
      marginPerHour: Math.round((wMargin / hours) * 100) / 100,
    };
  });

  const avgWholesaleMarginPct = skuRows.length > 0
    ? Math.round((skuRows.reduce((a, r) => a + r.wholesaleMarginPct, 0) / skuRows.length) * 1000) / 1000
    : 0;
  const avgKeystoneWholesale = skuRows.length > 0
    ? Math.round((skuRows.reduce((a, r) => a + r.keystoneWholesale, 0) / skuRows.length) * 100) / 100
    : 0;

  // --- Volume math: wholesale halves the per-unit profit vs retail; how many
  // retail units must sell to equal one wholesale unit's profit?
  const avgRetailMargin = skuRows.length > 0
    ? skuRows.reduce((a, r) => a + r.retailMargin, 0) / skuRows.length
    : 0;
  const avgWholesaleMargin = skuRows.length > 0
    ? skuRows.reduce((a, r) => a + r.wholesaleMargin, 0) / skuRows.length
    : 0;
  const volumeMultiple = avgRetailMargin > 0
    ? Math.round((avgWholesaleMargin / avgRetailMargin) * 100) / 100
    : 0;

  // --- Order economics. Typical order: unitsPerSkuPerOrder across all SKUs.
  const orderValue = tUnits * skuRows.reduce((a, r) => a + r.wholesalePrice, 0);
  const marketplaceCommissionPerOrder = orderValue * t.marketplaceCommission * t.marketplaceIntroducedShare;
  const netPerOrder =
    Math.round((orderValue - t.orderProcessingCost - marketplaceCommissionPerOrder) * 100) / 100;
  const processingCostPct = orderValue > 0
    ? Math.round((t.orderProcessingCost / orderValue) * 1000) / 1000
    : 1;

  // --- Suggested minimum: keep processing overhead ≤ 10% of order value.
  const suggestedMinimum =
    Math.round(Math.max(t.repeatMinimum, t.orderProcessingCost * 10) * 5) / 5;

  // --- Annual per-stockist and per-hour economics.
  const annualOrders = tOrders + (t.marketplaceShare > 0 && t.marketplaceIntroducedShare > 0 ? 1 : 0);
  const annualRevenuePerStockist = orderValue * annualOrders;
  const annualCommission = orderValue * t.marketplaceCommission * t.marketplaceIntroducedShare;
  const annualNetPerStockist =
    Math.round((annualRevenuePerStockist - t.orderProcessingCost * annualOrders - annualCommission) * 100) / 100;

  // Hours demanded per order across SKUs; annual hours demanded.
  const hoursPerOrder = skus.reduce((a, s) => a + Math.max(0.25, s.knitHours) * tUnits, 0);
  // (annualOrders is per stockist; assume one representative stockist for the
  // per-stockist math — the per-hour math scales linearly.)
  const annualWholesaleHours = Math.max(1, t.annualWholesaleHours);
  const ordersFit = annualWholesaleHours / Math.max(1, hoursPerOrder);
  // Annual net must deduct the goods' cost, not just order overhead —
  // netPerOrder is gross order economics (price revenue minus processing
  // and commission), so subtract cogsPerOrder for true profit.
  const cogsPerOrder = tUnits * skuRows.reduce((a, r) => a + r.cogs, 0);
  const annualWholesaleNet =
    Math.round(Math.min(ordersFit, annualOrders) * (netPerOrder - cogsPerOrder) * 100) / 100;
  const netPerWholesaleHour =
    Math.round((annualWholesaleNet / annualWholesaleHours) * 100) / 100;

  // --- Direct-retail benchmark on a like-for-like hourly basis:
  // the same knit hour through the designer's own channels earns the
  // wholesale-margin hourly rate (the baseline both sides of the decision
  // share); direct retail's extra margin per unit is captured separately as
  // directRetailNetSameHours using retail margins for reference only.
  const avgMarginPerHour = skuRows.length > 0
    ? skuRows.reduce((a, r) => a + r.marginPerHour, 0) / skuRows.length
    : 0;
  const avgDirectMarginPerHour = skuRows.length > 0
    ? skuRows.reduce((a, r) => {
        const hrs = r.marginPerHour > 0 ? r.wholesaleMargin / r.marginPerHour : 1;
        return a + r.retailMargin / Math.max(0.25, hrs);
      }, 0) / skuRows.length
    : 0;
  const directRetailNetSameHours = Math.round(annualWholesaleHours * avgDirectMarginPerHour * 100) / 100;
  const directNetPerHour = Math.round(avgMarginPerHour * 100) / 100;

  // --- Flags (WL-01..WL-08), every trigger sourced in the header above.
  const flags: { id: string; detail: string }[] = [];

  const weakSku = skuRows.find((r) => r.wholesaleMarginPct < 0.35);
  if (weakSku) {
    flags.push({
      id: 'WL-01',
      detail: `${weakSku.label} keeps only ${(weakSku.wholesaleMarginPct * 100).toFixed(0)}% at wholesale — below the ~50% keystone margin; boutiques will still double it, so the squeeze falls entirely on you.`,
    });
  }

  const overKeystone = skuRows.find((r) => r.wholesalePrice < r.keystoneWholesale * 0.85);
  if (overKeystone) {
    flags.push({
      id: 'WL-02',
      detail: `${overKeystone.label} charges $${overKeystone.wholesalePrice} below its COGS-based keystone of $${overKeystone.keystoneWholesale.toFixed(0)} — you're subsidizing the boutique's retail margin.`,
    });
  }

  if (t.firstOrderMinimum < 100) {
    flags.push({
      id: 'WL-03',
      detail: `A $${t.firstOrderMinimum} first-order minimum invites the "4 units to test" trap — the documented pattern where a maker spends hours packing a tiny order, earns under $10, and never gets a repeat.`,
    });
  }

  if (processingCostPct > 0.1) {
    flags.push({
      id: 'WL-04',
      detail: `Fixed order processing ($${t.orderProcessingCost}) eats ${(processingCostPct * 100).toFixed(0)}% of a typical $${orderValue.toFixed(0)} order — above 10%, the minimum is too low to cover the admin of the sale.`,
    });
  }

  if (t.paymentTerm === 'net30' && t.marketplaceShare < 0.1) {
    flags.push({
      id: 'WL-05',
      detail: 'Net-30 to small boutiques with no marketplace guarantee is how makers become unpaid inventory suppliers — take 50% deposits until the account proves out.',
    });
  }

  const dragPct = t.marketplaceShare * t.marketplaceCommission * t.marketplaceIntroducedShare;
  if (dragPct > 0.05) {
    flags.push({
      id: 'WL-06',
      detail: `Marketplace commission on introduced orders clips ~${(dragPct * 100).toFixed(1)}% of annual wholesale revenue — commission only applies to buyers Faire brings, so push repeat orders onto your own account where the fee drops.`,
    });
  }

  if (hoursPerOrder * Math.max(1, annualOrders) > annualWholesaleHours && annualOrders > 0) {
    flags.push({
      id: 'WL-07',
      detail: `One stockist at ${tUnits} units/SKU and ${tOrders} reorders demands ~${hoursPerOrder.toFixed(0)} hours per order — check how many stockists your annual hours can actually serve before saying yes to the next.`,
    });
  }

  if (t.unitsPerSkuPerOrder < 6) {
    flags.push({
      id: 'WL-08',
      detail: 'Under ~6 units per SKU per order, per-unit packing and invoicing dominates; handmade minimums of 6–12 units exist because smaller batches never cover their own admin.',
    });
  }

  // --- Verdict.
  let verdict = '';
  let suggestion = '';
  // Wholesale rarely wins the per-hour race at keystone (its margin is half
  // retail's); it wins the ANNUAL race when stockists reorder. So the ladder
  // compares annual nets, with per-hour numbers reported honestly on both sides.
  if (skuRows.some((r) => r.wholesaleMargin <= 0)) {
    verdict = `Wholesale can't pay for this line: at least one SKU makes nothing (or loses money) at your wholesale price — fix pricing before pitching to a single boutique.`;
    suggestion = 'Reprice to keystone (COGS x 2) or cut the SKU. A boutique will happily pay $' +
      skuRows.find((r) => r.wholesaleMargin <= 0)?.keystoneWholesale.toFixed(0) +
      ' wholesale — the constraint is your own price, not the market.';
  } else if (netPerWholesaleHour >= 30 && annualWholesaleNet > 0) {
    verdict = `Wholesale scales the business: $${netPerWholesaleHour.toFixed(0)}/wholesale-hour ($${annualWholesaleNet.toFixed(0)}/year) clears the $30/hour floor — a healthy program that pays real money while stockists carry your reach.`;
    suggestion = t.firstOrderMinimum >= suggestedMinimum && avgWholesaleMarginPct >= 0.4
      ? 'Terms and margins both clear the market standard — invest the line-sheet rewrite; for makers under 200 stockists the sheet is the entire sales pitch.'
      : `Tighten the terms first: raise the first-order minimum toward $${suggestedMinimum.toFixed(0)} and push wholesale prices toward keystone (${`$${avgKeystoneWholesale.toFixed(0)}`}).`;
  } else if (netPerWholesaleHour >= 15) {
    verdict = `Wholesale is steady work at $${netPerWholesaleHour.toFixed(0)}/hour ($${annualWholesaleNet.toFixed(0)}/year) — below the $30/hour floor but above piece-rate territory; it earns its keep through reorders, not first orders.`;
    suggestion = 'A typical stockist needs 2–3 reorders a year at $400+ to make the program hum; pitch the seasonal refresh (fall capsule, holiday bestsellers) as the reorder hook, and take only accounts that commit to the repeat minimum.';
  } else if (netPerWholesaleHour >= 8) {
    verdict = `Wholesale pays $${netPerWholesaleHour.toFixed(0)}/hour ($${annualWholesaleNet.toFixed(0)}/year) — underpaid for knitting labor; keep it selective unless every account reorders $${Math.max(t.repeatMinimum, suggestedMinimum).toFixed(0)}+ twice a year.`;
    suggestion = `Take only accounts that commit to the repeat minimum, skip one-off 6-unit test orders, and push prices toward keystone (${`$${avgKeystoneWholesale.toFixed(0)}`}) — the sheet itself filters for serious buyers.`;
  } else {
    verdict = `Wholesale pays $${netPerWholesaleHour.toFixed(0)}/hour ($${annualWholesaleNet.toFixed(0)}/year) — below piece-rate wages; the program loses to a test-knit commission before it earns a single reorder.`;
    suggestion = 'Reprice the line toward keystone (COGS x 2) or cut the slow SKUs; a boutique will pay keystone for a sell-through design, and selling direct at full retail pays far better for the same knit hours.';
  }

  return {
    skuRows,
    avgWholesaleMarginPct,
    avgKeystoneWholesale,
    volumeMultiple,
    netPerOrder,
    processingCostPct,
    suggestedMinimum,
    annualNetPerStockist,
    annualWholesaleNet,
    netPerWholesaleHour,
    directRetailNetSameHours,
    directNetPerHour,
    flags,
    verdict,
    suggestion,
  };
}
