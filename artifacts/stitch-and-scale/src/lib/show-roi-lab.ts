/**
 * Show ROI Lab — CHK-055 (53rd workspace feature).
 *
 * Answers the question every knitwear designer faces before handing over a booth fee:
 * is this craft fair / fiber festival worth my knitting, or is my time better spent
 * online? Session-55 market facts:
 * - Booth fees cluster into four tiers: pop-ups $25–75 (<500 attendees), standard
 *   markets $75–300 (500–2,000), featured/juried $300–700 (2,000–5,000), premium
 *   expos $700–2,000+ (5,000–25,000+). Source: Boothly 2026 craft-fair pricing guide.
 * - The craft-circles "7x rule": sell at least 7x the booth fee to call a show
 *   successful ($200 fee → $1,400 target). Some veteran vendors benchmark 10x.
 *   Source: SmartAsset economics of craft fairs; Etsy vendor forums.
 * - Conversion of foot traffic: 1–3% for browse markets, 3–8% for high-intent
 *   events. Hidden costs (application fee, liability insurance, canopy/weights,
 *   tax permits, power) add 20–30% to the headline fee. Source: Boothly guide.
 * - Hand-knits compete on uniqueness: commodity hats cap at ~2–3x the $15–20
 *   retail equivalent; the premium lives in machine-impossible construction,
 *   inclusivity, or special yarn. Professional knitting is priced per yard
 *   ($0.10–0.20/yd), not per hour. Sources: nimble-needles pricing tutorial,
 *   Arcane Fibre Makers pricing threads.
 * The lab builds the same deterministic funnel the other tabs use: attendance ×
 * conversion × average ticket, minus real costs (fees + hidden + materials + card
 * processing), normalized to net $ per show-hour, then stress-tested against the
 * 7x rule and against knitting the same hours at home for online sale.
 */

export type ShowTier = 'popup' | 'standard' | 'featured' | 'premium';

export const SHOW_TIER_LABELS: Record<ShowTier, string> = {
  popup: 'Community pop-up (<500 people)',
  standard: 'Standard market (500–2,000)',
  featured: 'Featured / juried (2,000–5,000)',
  premium: 'Premium expo / bridal / major juried (5,000+)',
};

/** Default attendance and conversion bands per tier (2026 Boothly figures). */
export const SHOW_TIER_DEFAULTS: Record<ShowTier, { attendees: number; conversionPct: number }> = {
  popup: { attendees: 300, conversionPct: 0.015 },
  standard: { attendees: 1000, conversionPct: 0.02 },
  featured: { attendees: 3500, conversionPct: 0.03 },
  premium: { attendees: 12000, conversionPct: 0.02 },
};

export type ProductType = 'hat' | 'cowl' | 'socks' | 'mitts' | 'shawl';

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  hat: 'Hat / beanie',
  cowl: 'Cowl',
  socks: 'Socks (pair)',
  mitts: 'Mitts',
  shawl: 'Shawl',
};

export interface ShowProduct {
  type: ProductType;
  /** Units to bring to the show. */
  units: number;
  /** Knit hours per unit (includes finishing/blocking). */
  knitHoursPerUnit: number;
  /** Material cost per unit ($): yarn + labels + tags + packaging share. */
  materialCostPerUnit: number;
  /** Typical in-hand show price per unit ($). */
  pricePerUnit: number;
}

export interface ShowRoiInput {
  /** Show tier (drives default attendance/conversion; all defaults are overridable). */
  showTier: ShowTier;
  /** Expected foot traffic for this event. */
  attendance: number;
  /** Share of foot traffic that converts to a sale. */
  conversionPct: number;
  /** Average amount a buyer spends at the booth ($). */
  avgTicket: number;
  /** Headline booth fee ($). */
  boothFee: number;
  /** Non-refundable application fee ($). */
  appFee: number;
  /** Travel, supplies, signage, one-off props ($). */
  travelSupplies: number;
  /** Power hookup / extras per event ($). */
  powerExtras: number;
  /** Product mix to bring. */
  products: ShowProduct[];
  /** Setup + teardown hours (total across both ends). */
  setupTeardownHours: number;
  /** On-site show hours (full show days). */
  onsiteHours: number;
  /** Card processing fee pct of sales (Square 2.75%, Shopify 2.7%). */
  cardFeePct: number;
  /** Sales-tax share on gross (keep simple — effective rate). */
  taxPct: number;
  /** Post-show follow-up: email signups captured at the booth. */
  listSignups: number;
  /** Share of signups who buy online within 6 months. */
  followupBuyRate: number;
  /** Online net per unit when the same item sells via the designer's channels. */
  onlineNetPerUnit: number;
  /** Designer's hourly floor ($/hr) for the knit-at-home comparison. */
  hourlyFloor: number;
}

export interface ShowProductRow {
  type: ProductType;
  label: string;
  units: number;
  unitsSold: number;
  revenue: number;
  materials: number;
  cardFees: number;
  net: number;
  knitHours: number;
}

export interface ShowRoiResult {
  /** Revenue split by product type (limited by units brought). */
  productRows: ShowProductRow[];
  /** Gross revenue from same-day sales. */
  grossRevenue: number;
  /** Same-day sales actually achievable given the units brought. */
  unitsSoldTotal: number;
  /** Total show cost: fee + app + travel + extras + materials + card fees + tax. */
  totalCost: number;
  /** Net from the show (cash), excluding designer time. */
  showNet: number;
  /** Time cost: setup/teardown + onsite hours at the hourly floor. */
  timeCost: number;
  /** True net after paying yourself for every show hour. */
  netAfterTime: number;
  /** Total hours invested. */
  totalHours: number;
  /** Net per show-hour — the number everything else normalizes against. */
  netPerHour: number;
  /** Follow-up list value: signups × buy rate × online net. */
  followupValue: number;
  /** Full net including follow-up list value. */
  netWithFollowup: number;
  /** The 7x rule target ($). */
  sevenXTarget: number;
  /** Whether the show clears 7x the booth fee. */
  clearsSevenX: boolean;
  /** Units that would need to sell at the avg ticket to clear 7x. */
  unitsForSevenX: number;
  /** What the same total knit hours earn at home, sold online. */
  homeValueSameHours: number;
  /** Quality flags. */
  flags: { id: string; detail: string }[];
  /** Banner verdict. */
  verdict: string;
  /** Follow-up suggestion. */
  suggestion: string;
}

const PRODUCT_DEFAULTS: Record<ProductType, { knitHoursPerUnit: number; materialCostPerUnit: number; pricePerUnit: number }> = {
  hat: { knitHoursPerUnit: 5, materialCostPerUnit: 14, pricePerUnit: 45 },
  cowl: { knitHoursPerUnit: 6, materialCostPerUnit: 18, pricePerUnit: 55 },
  socks: { knitHoursPerUnit: 9, materialCostPerUnit: 12, pricePerUnit: 40 },
  mitts: { knitHoursPerUnit: 4, materialCostPerUnit: 8, pricePerUnit: 32 },
  shawl: { knitHoursPerUnit: 20, materialCostPerUnit: 45, pricePerUnit: 150 },
};

const SHOW_TIER_FEE_DEFAULTS: Record<ShowTier, number> = {
  popup: 45,
  standard: 180,
  featured: 450,
  premium: 900,
};

export const DEFAULT_PRODUCTS: ShowProduct[] = [
  { type: 'hat', units: 8, ...PRODUCT_DEFAULTS.hat },
  { type: 'cowl', units: 4, ...PRODUCT_DEFAULTS.cowl },
  { type: 'socks', units: 2, ...PRODUCT_DEFAULTS.socks },
  { type: 'mitts', units: 4, ...PRODUCT_DEFAULTS.mitts },
  { type: 'shawl', units: 1, ...PRODUCT_DEFAULTS.shawl },
];

export const SHOW_ROI_DEFAULTS: ShowRoiInput = {
  showTier: 'standard',
  attendance: SHOW_TIER_DEFAULTS.standard.attendees,
  conversionPct: SHOW_TIER_DEFAULTS.standard.conversionPct,
  avgTicket: 48,
  boothFee: SHOW_TIER_FEE_DEFAULTS.standard,
  appFee: 30,
  travelSupplies: 60,
  powerExtras: 0,
  products: DEFAULT_PRODUCTS,
  setupTeardownHours: 2.5,
  onsiteHours: 8,
  cardFeePct: 0.0275,
  taxPct: 0,
  listSignups: 15,
  followupBuyRate: 0.12,
  onlineNetPerUnit: 35,
  hourlyFloor: 24,
};

/**
 * Analyze one show decision. Pure function; every number is deterministic so the
 * QA role can hand-verify it to the cent (same discipline as CHK-046..054 labs).
 */
export function analyzeShowRoi(input: Partial<ShowRoiInput> = {}): ShowRoiResult {
  const tier = (input.showTier ?? 'standard') as ShowTier;
  const tierDefaults = SHOW_TIER_DEFAULTS[tier];
  const attendance = Math.max(0, Math.round(input.attendance ?? tierDefaults.attendees));
  const conversionPct = Math.max(0, Math.min(1, input.conversionPct ?? tierDefaults.conversionPct));
  const avgTicket = Math.max(0, input.avgTicket ?? 48);
  const boothFee = Math.max(0, input.boothFee ?? SHOW_TIER_FEE_DEFAULTS[tier]);
  const appFee = Math.max(0, input.appFee ?? 30);
  const travelSupplies = Math.max(0, input.travelSupplies ?? 60);
  const powerExtras = Math.max(0, input.powerExtras ?? 0);
  const setupTeardownHours = Math.max(0, input.setupTeardownHours ?? 2.5);
  const onsiteHours = Math.max(0, input.onsiteHours ?? 8);
  const cardFeePct = Math.max(0, Math.min(0.15, input.cardFeePct ?? 0.0275));
  const taxPct = Math.max(0, Math.min(0.15, input.taxPct ?? 0));
  const listSignups = Math.max(0, Math.round(input.listSignups ?? 15));
  const followupBuyRate = Math.max(0, Math.min(1, input.followupBuyRate ?? 0.12));
  const onlineNetPerUnit = Math.max(0, input.onlineNetPerUnit ?? 35);
  const hourlyFloor = Math.max(0, input.hourlyFloor ?? 24);

  // Normalize the product mix; fall back to defaults when empty.
  const products: ShowProduct[] =
    input.products && input.products.length > 0
      ? input.products.map((p) => ({
          type: p.type,
          units: Math.max(0, Math.round(p.units ?? 0)),
          knitHoursPerUnit: Math.max(0, p.knitHoursPerUnit ?? 0),
          materialCostPerUnit: Math.max(0, p.materialCostPerUnit ?? 0),
          pricePerUnit: Math.max(0, p.pricePerUnit ?? 0),
        }))
      : DEFAULT_PRODUCTS;

  // --- Revenue funnel: attendees × conversion = buyers; distribute buyers across
  //     the product mix weighted by units brought (units act as the demand shape),
  //     capped at units brought per product.
  const buyers = Math.round(attendance * conversionPct * 100) / 100;
  const totalUnits = products.reduce((s, p) => s + p.units, 0);
  const unitsSoldTotal = Math.min(buyers, totalUnits);

  const productRows: ShowProductRow[] = products.map((p) => {
    const share = totalUnits > 0 ? p.units / totalUnits : 0;
    const unitsSold = Math.max(0, Math.min(p.units, Math.round(buyers * share)));
    const revenue = unitsSold * p.pricePerUnit;
    const materials = unitsSold * p.materialCostPerUnit;
    const cardFees = Math.round(revenue * cardFeePct * 100) / 100;
    const taxOnSale = Math.round(revenue * taxPct * 100) / 100;
    const net = Math.round((revenue - materials - cardFees - taxOnSale) * 100) / 100;
    const knitHours = Math.round(unitsSold * p.knitHoursPerUnit * 10) / 10;
    return {
      type: p.type,
      label: PRODUCT_TYPE_LABELS[p.type],
      units: p.units,
      unitsSold,
      revenue,
      materials,
      cardFees,
      net,
      knitHours,
    };
  });

  const grossRevenue = Math.round(productRows.reduce((s, r) => s + r.revenue, 0) * 100) / 100;
  const materialsTotal = productRows.reduce((s, r) => s + r.materials, 0);
  const cardFeesTotal = productRows.reduce((s, r) => s + r.cardFees, 0);
  const taxTotal = Math.round(grossRevenue * taxPct * 100) / 100;

  // Booth fee's hidden costs: Boothly's rule — add 20–30% on top of the headline
  // fee for application, insurance, canopy, permits. Modeled explicitly instead:
  // appFee + travelSupplies + powerExtras are user-supplied line items.
  const totalCost = Math.round((boothFee + appFee + travelSupplies + powerExtras + materialsTotal + cardFeesTotal + taxTotal) * 100) / 100;
  const showNet = Math.round((grossRevenue - totalCost) * 100) / 100;

  const totalHours = setupTeardownHours + onsiteHours;
  const timeCost = Math.round(totalHours * hourlyFloor * 100) / 100;
  const netAfterTime = Math.round((showNet - timeCost) * 100) / 100;
  const netPerHour = totalHours > 0 ? Math.round((netAfterTime / totalHours) * 100) / 100 : 0;

  const followupValue = Math.round(listSignups * followupBuyRate * onlineNetPerUnit * 100) / 100;
  const netWithFollowup = Math.round((netAfterTime + followupValue) * 100) / 100;

  // The 7x rule: the show must gross 7x the booth fee to be "successful".
  const sevenXTarget = boothFee * 7;
  const clearsSevenX = grossRevenue >= sevenXTarget;
  const unitsForSevenX = avgTicket > 0 ? Math.ceil(sevenXTarget / avgTicket) : 0;

  // Knit-at-home comparison: total knit hours of the goods actually sold at the
  // show could instead be knitted at home and sold online at onlineNetPerUnit.
  const knitHoursSold = Math.round(productRows.reduce((s, r) => s + r.knitHours, 0) * 10) / 10;
  const homeValueSameHours = Math.round(knitHoursSold * onlineNetPerUnit * 100) / 100;

  // --- Flags (SH-01..SH-08), each with a hard trigger sourced above.
  const flags: ShowRoiResult['flags'] = [];
  const hiddenOverHeadline = appFee + travelSupplies + powerExtras;
  if (hiddenOverHeadline > boothFee * 0.3) {
    flags.push({
      id: 'SH-01',
      detail: `Hidden costs ($${hiddenOverHeadline}) exceed 30% of the booth fee ($${boothFee}) — Boothly's ceiling for total extras is 20–30%; this booking is running hot before you knit anything.`,
    });
  }
  if (avgTicket < 20 && listSignups === 0) {
    flags.push({
      id: 'SH-02',
      detail: `At a $${avgTicket.toFixed(0)} average ticket with no list capture, the premium tier's economics rarely close — the 2026 pricing guide sets the premium floor at a $40+ ticket or lead-capture value.`,
    });
  }
  if (conversionPct < 0.01 && attendance > 0) {
    flags.push({
      id: 'SH-03',
      detail: `A ${conversionPct.toFixed(3)} conversion is below the 1% browse-market floor (1–3% typical, 3–8% high-intent). Either the audience isn't yours or the show doesn't sell.`,
    });
  }
  if (tier === 'premium') {
    flags.push({
      id: 'SH-04',
      detail: 'Premium/juried tier ($700–2,000+): only book established 5+ year events with curated audiences, or the fee will out-run any plausible hand-knit conversion.',
    });
  }
  // Sweater economics: if any product's knit hours × hourly floor exceeds 3x its price,
  // the item can't price its way out of the hand-knit ceiling.
  const impossibleProducts = products.filter(
    (p) => p.units > 0 && p.knitHoursPerUnit * hourlyFloor > p.pricePerUnit * 3 && p.pricePerUnit > 0,
  );
  if (impossibleProducts.length > 0) {
    flags.push({
      id: 'SH-05',
      detail: `${impossibleProducts.map((p) => PRODUCT_TYPE_LABELS[p.type]).join(', ')}: knit cost at your floor is 3x+ the shelf price — hand-knits only escape the $20 retail ceiling through uniqueness, inclusivity, or machine-impossible construction.`,
    });
  }
  if (listSignups === 0) {
    flags.push({
      id: 'SH-06',
      detail: 'Zero list capture kills the follow-up value ($0) — in-person shows double as a list-building channel (session-54: buyers live in email/DMs, not feed impressions).',
    });
  }
  const totalKnitHours = Math.round(products.reduce((s, p) => s + p.units * p.knitHoursPerUnit, 0) * 10) / 10;
  if (totalKnitHours > totalHours * 4 && totalHours > 0) {
    flags.push({
      id: 'SH-07',
      detail: `You're bringing ${totalKnitHours.toFixed(0)} knit hours of inventory against ${totalHours.toFixed(0)} show hours — most of the booth will go unsold; cut the mix to the proven sellers.`,
    });
  }
  if (tier === 'premium' && attendance < 5000) {
    flags.push({
      id: 'SH-08',
      detail: 'Premium fees ($700–2,000+) pair with 5,000–25,000 attendance; below 5,000 the fee is premium for standard traffic.',
    });
  }

  // --- Verdict and suggestion.
  let verdict = '';
  let suggestion = '';
  const clearedEverything = netAfterTime >= 0 && netPerHour >= hourlyFloor * 0.5 && clearsSevenX;
  if (clearedEverything) {
    verdict = `Worth the weekend: $${showNet.toFixed(0)} show net, $${netPerHour.toFixed(0)}/hour after your time — the show beats your floor and clears 7x the fee.`;
    suggestion = followupBuyRate > 0.1 && listSignups > 0
      ? `Plus ${followupValue.toFixed(0)} of follow-up value from ${listSignups} signups — send a show-special email within 48 hours while the yarn is still warm.`
      : 'Book this show again next year; bring the same mix and add one list-building hook to the booth.';
  } else if (netAfterTime >= 0 && netPerHour >= hourlyFloor * 0.5) {
    verdict = `Profitable but soft: $${netAfterTime.toFixed(0)} after your time at $${netPerHour.toFixed(0)}/hour — the show pays, but it doesn't clear the 7x bar ($${sevenXTarget.toFixed(0)} gross needed).`;
    suggestion = avgTicket < 30
      ? 'Raise the average ticket: bundle a hat + cowl at 15% off, or move the price of the standout piece up — hand-knit uniqueness is the only leverage over the $20 retail ceiling.'
      : `Cut booth-adjacent spend: ${hiddenOverHeadline.toFixed(0)} in extras is dragging the net down to ${netPerHour.toFixed(0)}/hour.`;
  } else if (netAfterTime >= 0) {
    // Net-positive against time, but the hourly rate is below half the floor —
    // the show pays a wage, just not a designer's wage.
    verdict = `Underpaid but paid: $${netAfterTime.toFixed(0)} after your time at $${netPerHour.toFixed(0)}/hour — under half your $${hourlyFloor.toFixed(0)} floor, and it doesn't clear 7x the fee ($${sevenXTarget.toFixed(0)} needed).`;
    suggestion = 'Raise the average ticket or cut the inventory you never sell: a 15% ticket bump on the same traffic closes most of that gap, and the list signup rescues the rest.';
  } else if (netAfterTime < 0 && netWithFollowup > 0) {
    verdict = `Cash-profitable only because of the list: the show itself loses $${Math.abs(netAfterTime).toFixed(0)} against your time, but ${followupValue.toFixed(0)} of follow-up value puts you positive — only run it if you actually capture emails.`;
    suggestion = listSignups > 0
      ? 'Make the signup hook the point of the booth: a raffle, a pattern freebie, or a show-only code all lift the 12% follow-up rate that rescues this math.'
      : 'Without signups this is a loss. Add a clipboard or QR-code list hook, or skip the show.';
  } else if (netAfterTime < 0) {
    // Losing against the floor. The actionable split: is the same knit time worth
    // more online? If yes, reframe; if not, the plain answer is skip.
    if (homeValueSameHours > showNet && knitHoursSold >= 1) {
      verdict = `Knit at home instead: the same ${knitHoursSold.toFixed(0)} knit hours sold online earn $${homeValueSameHours.toFixed(0)} vs this show's $${showNet.toFixed(0)} net — the booth fee and the commute are the difference.`;
      suggestion = 'Keep in-person for brand-building and list growth only, and take the pop-up tier ($25–75) where the fee can never outrun the night\u2019s sales.';
    } else {
      verdict = `Skip this one: $${netAfterTime.toFixed(0)} after your time at $${netPerHour.toFixed(0)}/hour — below your $${hourlyFloor.toFixed(0)} floor and below the 7x rule.`;
      suggestion = tier !== 'popup'
        ? 'Downshift a tier: pop-ups ($25–75) are the documented proving ground for untested markets — earn the $900 booth with a season of $45 ones first.'
        : 'Reprice or slim the mix: at these units and prices the show can\u2019t clear its own fee, and the 7x target needs about half the foot traffic to convert.';
    }
  }

  return {
    productRows,
    grossRevenue,
    unitsSoldTotal,
    totalCost,
    showNet,
    timeCost,
    netAfterTime,
    totalHours,
    netPerHour,
    followupValue,
    netWithFollowup,
    sevenXTarget,
    clearsSevenX,
    unitsForSevenX,
    homeValueSameHours,
    flags,
    verdict,
    suggestion,
  };
}
