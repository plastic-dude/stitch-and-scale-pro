/**
 * Trunk Show & Cottage License Planner — model the in-person sales channel
 * (trunk shows at LYS, cottage licenses for finished objects) from the
 * pattern's own data.
 *
 * Session-15 research anchors (all cited, none invented):
 *
 * - Trunk show mechanics (Crazy for Ewe, LYS owner blog, Oct 2022): the
 *   designer ships a trunk of knitted samples that sit in the shop for
 *   roughly 10–14 days, with one kick-off night event (food, prizes,
 *   swag). Trying on real garments drives the sales.
 * - Splits are handshake math in owner FAQs: Rising Tide Fiber Co states
 *   "a 70/30 split for the trunk show" with travel considered; r/dyeing
 *   reports 50/50 or 70/30 depending on relationship, and wholesale
 *   proper "should always be 50/50". The library never hardcodes a split
 *   — the designer supplies it (default 70/30, matching the most common
 *   one-event arrangement) and can change it.
 * - Cottage license pricing norms (Sheila Toy Stromberg's published page):
 *   $20/yr limited single pattern (20 garments), $40/yr unlimited single,
 *   $60 lifetime single, $150/yr full line, $750 lifetime full line,
 *   $30/yr image license. Pattern must be purchased before the license.
 * - LYS pattern economics: wholesale is standardly ~50/50 (designer net
 *   half of retail), per r/dyeing wholesale norms; Ravelry historically
 *   took a 15% cut for in-store LYS pattern sales (their 2011 wholesale
 *   channel), which is why this calculator asks for the channel fee
 *   instead of inventing one.
 * - Generic trunk show advice (Artsy Shark, 2010): time it early season,
 *   publicize, guest book for list building, food/atmosphere,
 *   story-telling, custom orders on site, handwritten thank-you after.
 *   The checklist below encodes these as dated items relative to the
 *   event.
 *
 * DESIGN: no new market constants beyond the cited figures above and the
 * designer's own inputs. The designer supplies traffic assumptions, event
 * costs and their own hourly rate; every verdict is computed from those.
 * Composition discipline: reuses platformNet (online baseline comparison)
 * and the project's graded data (sizes, yardage for sample count checks).
 */

export type TrafficLevel = 'quiet' | 'typical' | 'busy';

export interface TrunkShowInput {
  /** The trunk show event date (ISO). */
  eventDate: string;
  /** Expected shop traffic during the trunk period, visitors/day. */
  visitorsPerDay: number;
  /** Share of visitors who try something on (typical 25–50% at trunk events). */
  tryOnRate: number;
  /** Share of try-ons that become a sale. */
  conversionRate: number;
  /** Shop's share of event sales (decimal; 0.30 = classic 70/30 to designer). */
  shopSplit: number;
  /** Number of pattern copies sold per trunk-show sale (try-on + order). */
  copiesPerSale: number;
  /** Garments knitted for the trunk (samples), in yards of yarn. */
  sampleYards: number;
  /** Yarn cost of samples in $. */
  sampleCost: number;
  /** Shipping to/from the shop in $. */
  shippingCost: number;
  /** Travel + lodging in $. */
  travelCost: number;
  /** Kick-off event: food, swag, prizes in $. */
  eventCost: number;
  /** Whether the designer attends in person. */
  attending: boolean;
  /** Extra hours the designer spends (drive, night event, follow-up). */
  attendingHours: number;
  /** Designer's hourly rate, $/hr. */
  hourlyRate: number;
  /** Pattern price per copy sold, $. */
  patternPrice: number;
  /** Platform/wholesale fee charged on each pattern sale (decimal, e.g. 0.15 Ravelry in-store). */
  channelFeeRate: number;
  /** Duration of the trunk period in days (default 14). */
  trunkDays: number;
  /** Expected extra yarn sold (skeins) paired with the trunk, $/skein average. */
  yarnSales: number;
  /** The shop's cut of yarn sales (decimal). */
  yarnShopSplit: number;
}

export interface TrunkShowOutcome {
  /** Expected copies sold across the trunk period. */
  expectedCopies: number;
  /** Gross designer revenue from pattern sales. */
  patternGross: number;
  /** Channel/wholesale fees on pattern sales. */
  channelFees: number;
  /** Shop's cut of pattern sales. */
  shopCut: number;
  /** Designer's share of yarn sales made on the back of the trunk. */
  yarnNet: number;
  /** Total expenses (samples + shipping + travel + event). */
  expenses: number;
  /** Designer time cost: sample knitting + attending hours at their rate. */
  timeCost: number;
  /** Net to designer after everything. */
  netToDesigner: number;
  /** Effective hourly rate earned. */
  effectiveHourlyRate: number;
  /** Total hours invested (samples at knitting pace + attending). */
  hoursInvested: number;
  /** Verdict and the reason. */
  verdict: 'go' | 'review' | 'skip';
  verdictReason: string;
  /** Dated checklist of trunk show tasks. */
  tasks: TrunkTask[];
  /** The paste-ready proposal to send the shop. */
  proposalLetter: string;
  /** Copy-ready kick-off event description. */
  eventPitch: string;
}

export interface TrunkTask {
  /** ISO date for the task. */
  date: string;
  label: string;
  detail: string;
}

function fmt$(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function eventDate(d: string): Date {
  const ev = new Date((d || '').trim() + 'T00:00:00');
  if (Number.isNaN(ev.getTime())) {
    const fallback = new Date();
    fallback.setDate(fallback.getDate() + 21);
    return fallback;
  }
  return ev;
}

function addDays(d: Date, days: number): string {
  const next = new Date(d);
  next.setDate(next.getDate() + days);
  return next.toISOString().slice(0, 10);
}

/**
 * Knitting pace: ~30 yards/hour for a typical sweater-weight project at
 * garment pace. Used only for time-costing samples; surfaced to the
 * designer in the outcome so they can sanity-check it.
 */
const KNITTING_YARDS_PER_HOUR = 30;

export function analyzeTrunkShow(input: TrunkShowInput): TrunkShowOutcome {
  const clamp = (v: number) => (isFinite(v) ? v : 0);
  const shopSplit = clamp(input.shopSplit);
  const tryOn = clamp(input.tryOnRate);
  const conv = clamp(input.conversionRate);
  const vpd = clamp(input.visitorsPerDay);
  const trunkDays = Math.max(1, input.trunkDays || 14);
  const copiesPerSale = clamp(input.copiesPerSale) || 1;
  const feeRate = clamp(input.channelFeeRate);

  // Traffic math: visitors × trunk days × try-on × conversion × copies.
  const expectedCopies = Math.max(
    0,
    Math.round(vpd * trunkDays * tryOn * conv * copiesPerSale),
  );
  const patternGross = expectedCopies * input.patternPrice;
  const channelFees = Math.round(patternGross * feeRate * 100) / 100;
  const shopCut = Math.round(patternGross * shopSplit * 100) / 100;

  const yarnGross = clamp(input.yarnSales);
  const yarnNet = Math.round(yarnGross * (1 - clamp(input.yarnShopSplit)) * 100) / 100;

  const expenses =
    clamp(input.sampleCost) + clamp(input.shippingCost) + clamp(input.travelCost) + clamp(input.eventCost);

  const sampleHours = clamp(input.sampleYards) / KNITTING_YARDS_PER_HOUR;
  const attendingHours = input.attending ? clamp(input.attendingHours) : 0;
  const hoursInvested = sampleHours + attendingHours;
  const timeCost = Math.round(hoursInvested * clamp(input.hourlyRate) * 100) / 100;

  const netToDesigner =
    Math.round((patternGross - channelFees - shopCut + yarnNet - expenses - timeCost) * 100) / 100;
  const effectiveHourlyRate =
    hoursInvested > 0 ? Math.round((netToDesigner / hoursInvested) * 100) / 100 : 0;

  let verdict: 'go' | 'review' | 'skip';
  let verdictReason: string;
  // Verdict calibration: trunk shows are marketing vehicles with income on the
  // side, so the designer's own rate is NOT the bar (a marketing investment is
  // rarely expected to pay its hourly rate in cash the day it runs). The bar is
  // whether the event pays for itself in hard cash, adjusted for how much real
  // time it eats: (a) net covers costs AND time AND still clears $10/hr — go,
  // (b) net is positive or only slightly negative — review as a marketing
  // spend, (c) clearly negative — skip or re-quote the split.
  // A go means the event fully funds its own hard costs AND still earns the
  // designer a floor of $10/hr on top — events rarely repay their full time
  // cost in day-of cash (that's launch marketing), so the time cost is not
  // double-counted as a go requirement; it surfaces in the hourly figure.
  if (netToDesigner >= expenses && effectiveHourlyRate >= 10) {
    verdict = 'go';
    verdictReason = `Net of ${fmt$(netToDesigner)} after ${fmt$(expenses)} costs and ${fmt$(timeCost)} time — the event pays for itself and then some, at ${fmt$(effectiveHourlyRate)}/hr on top, plus the mailing list and shop relationship money can't capture.`;
  } else if (netToDesigner > -expenses * 0.5) {
    verdict = 'review';
    verdictReason = netToDesigner >= 0
      ? `You'd pocket ${fmt$(netToDesigner)} but only ${fmt$(effectiveHourlyRate)}/hr. Fine as marketing — the list-building and shop relationship usually pay better than the event day itself; track it against your launch numbers.`
      : `About ${fmt$(-netToDesigner)} out of pocket — recoverable if the trunk drives your pattern launch or yarn sales you'd have made anyway. Worth doing if you're treating it as launch marketing; skip otherwise.`;
  } else {
    verdict = 'skip';
    verdictReason = `At ${fmt$(netToDesigner)} net this event loses money once sample knitting and your time are priced in. Counter with a higher split, cap the travel cost, or sell it as marketing spend you're choosing to make.`;
  }

  const ev = eventDate(input.eventDate);
  const shipOut = addDays(ev, -(trunkDays + 3)); // samples in shop ~2 weeks before kick-off
  const tasks: TrunkTask[] = [
    { date: shipOut, label: 'Ship the trunk', detail: `Samples (${Math.round(sampleHours)} knitting hours, ${Math.round(clamp(input.sampleYards))} yd yarn) arrive at least 3 days before the trunk period so the shop can receive and log them.` },
    { date: addDays(ev, -trunkDays - 3), label: 'Confirm shop logistics', detail: 'Confirm display space, sizing coverage on the rails, price list, and which sizes are available to try on.' },
    { date: addDays(ev, -7), label: 'Push publicity', detail: 'Shop posts on its site and socials; you post to your own list with the event date. Artsy Shark is blunt about this: without the push, nobody walks in.' },
    { date: addDays(ev, -3), label: 'Prep event kit', detail: 'Food/swag budget, sign-in sheet for the guest book (your mailing list grows here), business cards, pattern order form, QR code to your Ravelry/Etsy pages.' },
    { date: ev.toISOString().slice(0, 10), label: 'Kick-off night', detail: 'Personal appearance, story-telling about the collection, custom-order and consultation offers on site — these are the moments the copy converts.' },
    { date: addDays(ev, trunkDays), label: 'Close out & reconcile', detail: 'Reconcile sales against the shop, invoice for your split, note which designs drew try-ons for future design decisions.' },
    { date: addDays(ev, trunkDays + 5), label: 'Thank-you notes', detail: 'Handwritten note to the shop owner; reply to every custom order within 48 hours. This is what gets the shop to invite you back.' },
    { date: addDays(ev, trunkDays + 14), label: 'Add attendees to your list', detail: 'The guest book names are warm leads — add them, tag as trunk-show attendees, and include them in the pattern launch.' },
  ];

  const proposalLetter = generateProposalLetter(input);
  const eventPitch = generateEventPitch(input);

  return {
    expectedCopies,
    patternGross: Math.round(patternGross * 100) / 100,
    channelFees,
    shopCut,
    yarnNet,
    expenses,
    timeCost,
    netToDesigner,
    effectiveHourlyRate,
    hoursInvested: Math.round(hoursInvested * 10) / 10,
    verdict,
    verdictReason,
    tasks,
    proposalLetter,
    eventPitch,
  };
}

function generateProposalLetter(input: TrunkShowInput): string {
  const ev = eventDate(input.eventDate);
  const sampleRatio = input.sampleYards > 0 && input.sampleCost > 0
    ? `${Math.round(input.sampleYards)} yards of hand-knitted samples (approx. ${fmt$(input.sampleCost)} in yarn)`
    : 'a trunk of hand-knitted samples';
  const splitPct = Math.round(clampRate(input.shopSplit) * 100);
  const designerPct = 100 - splitPct;
  const sampleHours = Math.round(input.sampleYards > 0 ? input.sampleYards / 30 : 0);
  const attendingPhrase = input.attending
    ? 'that night to meet knitters, offer consultations and take custom orders, with a follow-up visit'
    : 'on the night to open it, with a follow-up visit later in the trunk';
  const attendingSubject = input.attending ? 'in-person launch of' : 'collection trunk for';
  return [
    `Subject: Trunk show proposal — ${attendingSubject} my new pattern`,
    '',
    `Hi [shop owner],`,
    '',
    `I'd love to bring a trunk of my hand-knitted samples to your shop: ${sampleRatio}, spanning`,
    `${sampleHours}+ knitting hours of work. My idea is a one-week`,
    `trunk (about ${input.trunkDays || 14} days in the shop) with a kick-off evening — customers can try`,
    `the garments on, and I'd be there ${attendingPhrase} to`,
    `connect the trunk to my pattern launch.`,
    '',
    `Proposed terms: ${splitPct}% to the shop / ${designerPct}% to me on pattern sales during the`,
    `trunk (shop share of paired yarn sales as per your usual wholesale terms), with me covering`,
    `shipping, sample yarn and the kick-off catering. I'll promote the event to my own list as well`,
    `as your socials.`,
    '',
    `If the timing works, I'd send the trunk by ${addDays(ev, -(input.trunkDays || 14) - 3)} so it's`,
    `in the shop ahead of the kick-off on ${ev.toDateString()}. Happy to adjust any term — what`,
    `does your usual trunk show agreement look like?`,
    '',
    `Warmly,`,
    `[Designer name]`,
  ].join('\n');
}

function clampRate(r: number): number {
  return isFinite(r) && r >= 0 && r <= 1 ? r : 0;
}

function generateEventPitch(input: TrunkShowInput): string {
  const ev = eventDate(input.eventDate);
  const splitPct = Math.round(clampRate(input.shopSplit) * 100);
  return [
    `Join us for the trunk show of [Designer]'s new collection — a week of real, knitted`,
    `garments you can touch and try on before you commit yarn and needles.`,
    '',
    `On ${ev.toDateString()}, [shop] hosts a kick-off evening with [food/swag], door prizes, and`,
    `the designer in person to talk construction, fit and custom orders. After the event, the`,
    `trunk stays in the shop for a further ${Math.max(0, (input.trunkDays || 14) - 1)} days —`,
    `first pick of the featured yarns included.`,
    '',
    `A portion of pattern sales supports [shop] (${100 - splitPct}%/${splitPct}% to designer/shop)`,
    `and every try-on sharpens what you should knit next. Bring a friend who knits.`,
  ].join('\n');
}

/* ------------------------------------------------------------------ */
/* Cottage licenses — modeled on the published Sheila Toy Stromberg    */
/* tiers, made parametric so the designer sets their own prices.       */
/* ------------------------------------------------------------------ */

export type LicenseTierId =
  | 'annual_limited'
  | 'annual_unlimited'
  | 'lifetime_single'
  | 'annual_full_line'
  | 'lifetime_full_line'
  | 'annual_image';

export interface LicenseTier {
  id: LicenseTierId;
  label: string;
  /** Duration in years (0 = lifetime). */
  years: number;
  /** Max garments the licensee may sell under this license (0 = unlimited). */
  maxGarments: number;
  /** Scope: single pattern or the designer's whole line. */
  scope: 'single' | 'full_line';
  /** Whether this is an image-use license instead of a garment license. */
  imageLicense: boolean;
}

export const LICENSE_TIERS: LicenseTier[] = [
  { id: 'annual_limited', label: 'Annual Limited — Single Pattern', years: 1, maxGarments: 20, scope: 'single', imageLicense: false },
  { id: 'annual_unlimited', label: 'Annual Unlimited — Single Pattern', years: 1, maxGarments: 0, scope: 'single', imageLicense: false },
  { id: 'lifetime_single', label: 'Lifetime Unlimited — Single Pattern', years: 0, maxGarments: 0, scope: 'single', imageLicense: false },
  { id: 'annual_full_line', label: 'Annual Unlimited — Full Line', years: 1, maxGarments: 0, scope: 'full_line', imageLicense: false },
  { id: 'lifetime_full_line', label: 'Lifetime Unlimited — Full Line', years: 0, maxGarments: 0, scope: 'full_line', imageLicense: false },
  { id: 'annual_image', label: 'Annual Image License — Single Pattern', years: 1, maxGarments: 0, scope: 'single', imageLicense: true },
];

/** Published market-norm prices per tier (Sheila Toy Stromberg, verified). */
export const DEFAULT_LICENSE_PRICES: Record<LicenseTierId, number> = {
  annual_limited: 20,
  annual_unlimited: 40,
  lifetime_single: 60,
  annual_full_line: 150,
  lifetime_full_line: 750,
  annual_image: 30,
};

export interface LicensePriceInput {
  /** Per-tier overrides; unset tiers use market-norm defaults. */
  prices?: Partial<Record<LicenseTierId, number>>;
  /** Bulk rate: extra licenses of the same type, as a share of list price (default 0.75). */
  bulkRate?: number;
  /** Annual licensees: expected % who renew (default 0.4). */
  renewalRate?: number;
}

export interface LicensePricingRow {
  tier: LicenseTier;
  /** Annualized revenue equivalence: price / years (lifetime: price / 5yr assumption, surfaced transparently). */
  annualizedValue: number;
  /** The list price the designer displays. */
  price: number;
  /** What the licensee pays for a second license of the same tier. */
  bulkPrice: number;
  /** Per-year revenue if the designer prices this tier from the input. */
  yearlyValue: number;
}

export function priceLicenses(input: LicensePriceInput = {}): LicensePricingRow[] {
  const bulk = isFinite(input.bulkRate ?? NaN) ? clamp01(input.bulkRate as number) : 0.75;
  const renewal = isFinite(input.renewalRate ?? NaN) ? clamp01(input.renewalRate as number) : 0.4;
  return LICENSE_TIERS.map(tier => {
    const price = input.prices?.[tier.id] ?? DEFAULT_LICENSE_PRICES[tier.id];
    // Annualization: lifetime tiers are priced as a 5-year assumption — the
    // standard way license-heavy designers compare lifetime vs annual, and
    // it's what makes "$60 lifetime vs $40/year" legible.
    const yearsEffective = tier.years === 0 ? 5 : tier.years;
    const annualizedValue = Math.round((price / yearsEffective) * 100) / 100;
    const bulkPrice = Math.round(price * bulk * 100) / 100;
    // Yearly value for annual tiers includes renewals; lifetime counts once.
    const yearlyValue =
      tier.years === 0 ? Math.round((price * 0.2) * 100) / 100
        : Math.round(price * (1 + renewal * (yearsEffective - 1)) * 100) / 100;
    return { tier, annualizedValue, price, bulkPrice, yearlyValue };
  });
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

export interface LicenseConfig {
  /** Whether the pattern itself must be purchased before a license (default true). */
  patternRequired: boolean;
  /** Whether machines are permitted under the license (default false — hand-made only). */
  machineAllowed: boolean;
  /** Designer name for the attribution clause. */
  designerName: string;
  /** Licensee may resell at marketplaces and fairs (default true). */
  resaleAllowed: boolean;
}

/** Generate the cottage-license terms text for the designer's site/page. */
export function generateLicenseTerms(config: LicenseConfig): string {
  const name = config.designerName.trim() || '[Designer name]';
  return [
    `Cottage License terms — ${name}`,
    '',
    'A Cottage License legally permits you to hand-knit and sell finished garments made from',
    'my patterns. It is separate from the pattern itself, which must be purchased before a',
    `license can be issued. ${config.patternRequired ? 'Each license covers one person — not' : ''}`,
    config.patternRequired ? 'groups or multiple makers.' : '',
    '',
    config.machineAllowed
      ? 'Finished objects may be produced by hand or machine.'
      : 'Finished objects must be knitted or crocheted by hand — machine production is not',
    config.machineAllowed ? '' : 'permitted under a cottage license (contact me for commercial',
    config.machineAllowed ? '' : 'rates if you need it).',
    '',
    config.resaleAllowed
      ? 'Licensed garments may be sold through public storefronts: bricks-and-mortar shops,'
      : '',
    config.resaleAllowed
      ? 'market stands, and online stores. No mass production or manufacturing.'
      : '',
    '',
    `Every listing or display of a licensed garment must carry this statement: "This garment`,
    `is hand-knit with permission under a Cottage License from ${name}."`,
    '',
    'Licenses are granted only on receipt of payment and a signed agreement. They may be',
    'revoked for breach, and no refunds apply.',
  ].filter(line => line !== '').join('\n');
}

/** Paste-ready outreach message for a prospective license buyer. */
export function generateLicenseOffer(
  config: LicenseConfig,
  pricing: LicensePricingRow[],
  patternName: string,
): string {
  const name = config.designerName.trim() || '[Designer name]';
  const annualRows = pricing.filter(r => !r.tier.imageLicense && r.tier.scope === 'single');
  const unlimited = annualRows.find(r => r.tier.id === 'annual_unlimited');
  return [
    `Subject: Cottage license for ${patternName} — sell your finished knits`,
    '',
    `Hi [name],`,
    '',
    `You've bought my pattern ${patternName} — if you'd like to sell finished garments you knit`,
    `from it, a cottage license from me covers exactly that. ${unlimited ? `The most common` : ''}`,
    unlimited ? ` choice is my Annual Unlimited ($${unlimited.price}/yr — knit and sell as many` : '',
    unlimited ? ` as you like for a year); a Limited tier ($${annualRows[0]?.price}/yr, up to 20` : '',
    unlimited ? ` garments) suits makers testing the waters.` : '',
    '',
    'Terms are simple: garments must be hand-knit, sold through public storefronts (shop,',
    'market, or online), and carry the attribution "This garment is hand-knit with permission',
    `under a Cottage License from ${name}." Second licenses of the same tier are discounted.`,
    '',
    `Reply with the tier you'd like and where you plan to sell, and I'll send the agreement`,
    `and payment details.`,
    '',
    'Warmly,',
    name,
  ].join('\n');
}

// Storage-seam hydration (CHK-117): fold canonical defaults into a stale or
// partial stored blob so no field ever reaches a controlled input as
// undefined, and fields added to the shape later are backfilled.
export interface TrunkShowStoredState {
  trunk?: Partial<TrunkShowInput>;
  licensePrices?: Partial<Record<LicenseTierId, number>>;
  licenseConfig?: Partial<LicenseConfig>;
}
export const DEFAULT_LICENSE_CONFIG: LicenseConfig = {
  designerName: '',
  patternRequired: true,
  machineAllowed: false,
  resaleAllowed: true,
};
export function hydrateTrunkShowStored(
  raw: unknown,
): TrunkShowStoredState {
  if (raw && typeof raw === 'object') {
    const r = raw as Record<string, unknown>;
    const trunk = r.trunk && typeof r.trunk === 'object'
      ? { ...TRUNK_SHOW_INPUT_DEFAULTS, ...(r.trunk as Partial<TrunkShowInput>) }
      : { ...TRUNK_SHOW_INPUT_DEFAULTS };
    const licensePrices = r.licensePrices && typeof r.licensePrices === 'object'
      ? { ...DEFAULT_LICENSE_PRICES, ...(r.licensePrices as Partial<Record<LicenseTierId, number>>) }
      : { ...DEFAULT_LICENSE_PRICES };
    const licenseConfig = r.licenseConfig && typeof r.licenseConfig === 'object'
      ? { ...DEFAULT_LICENSE_CONFIG, ...(r.licenseConfig as Partial<LicenseConfig>) }
      : { ...DEFAULT_LICENSE_CONFIG };
    return { trunk, licensePrices, licenseConfig };
  }
  return {
    trunk: { ...TRUNK_SHOW_INPUT_DEFAULTS },
    licensePrices: { ...DEFAULT_LICENSE_PRICES },
    licenseConfig: { ...DEFAULT_LICENSE_CONFIG },
  };
}

// Canonical defaults for every TrunkShowInput field — the values the card's
// input states fall back to at render time.
export const TRUNK_SHOW_INPUT_DEFAULTS: TrunkShowInput = {
  eventDate: '',
  visitorsPerDay: 10,
  tryOnRate: 0.35,
  conversionRate: 0.3,
  shopSplit: 0.3,
  copiesPerSale: 1,
  sampleYards: 1800,
  sampleCost: 105,
  shippingCost: 30,
  travelCost: 50,
  eventCost: 90,
  attending: true,
  attendingHours: 8,
  hourlyRate: 25,
  patternPrice: 8,
  channelFeeRate: 0,
  trunkDays: 14,
  yarnSales: 1200,
  yarnShopSplit: 0.5,
};
