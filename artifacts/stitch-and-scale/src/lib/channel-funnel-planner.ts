/**
 * CHK-020 — Channel & Funnel Planner library.
 *
 * Two planners, one seam: (1) score a revenue channel offer (subscription box,
 * yarn-brand collab, magazine, or any exclusive-placement deal) against what
 * self-publishing would earn in the same window; (2) price a newsletter funnel
 * from freebie lead magnet to launch-week surge and convert-up ladder.
 *
 * Cited benchmarks baked into the math (source:
 * /research/competitors-session-21-subscription-box-funnel.md):
 * - Ravelry Jan-2019: 10,059 designers averaged $203 in the best month;
 *   72% earned under $50; top 93 (under 1%) sold $3,000+ (~$36k/yr pace).
 * - Indie magazines cap ~$900/garment; an average sweater takes 50–85 hours
 *   to design, sample and grade.
 * - Small paid design benchmark $80–$140 (Working with Brands); $12/hr floor
 *   (Who Pays Knitters), reused as the professional bar.
 * - Subscription boxes: $35–$65/box, 200–400 monthly subscribers typical,
 *   ~13% of tracked boxes go defunct, designers featured at most once a year,
 *   hard delivery dates (boxes assemble a month ahead), only ~10% of suppliers
 *   include any marketing insert — the exposure most designers leave on the table.
 * - List value: $0.35/subscriber/month (email-marketing norm, reused from
 *   CHK-019), ~60% of garment sales happen in launch week for most designers.
 */

export type ChannelType = 'subbox' | 'brand-collab' | 'magazine' | 'other';

export interface ChannelDeal {
  type: ChannelType;
  name: string; // e.g. the box or brand name
  /** Upfront design fee paid to the designer ($). */
  designFee: number;
  /** Wholesale/unit compensation on top (e.g. yarn support value, royalty). */
  extrasValue: number;
  /** Exclusivity window in months (0 = none, design may self-sell immediately). */
  exclusivityMonths: number;
  /** Expected audience exposed to the design (subscribers/followers of the channel). */
  audienceReach: number;
  /** % of that audience expected to visit the designer's shop/profile (0–100). */
  profileVisitPct: number;
  /** % of visitors expected to buy something from the designer's own shop (0–100). */
  visitorConvertPct: number;
  /** Average spend per converted visitor in the designer's own shop ($). */
  visitorSpend: number;
  /** Months the audience effect runs (default = exclusivity window, min 3). */
  effectMonths: number;
  /** Is the designer's pattern exclusive to the channel? Affects self-sell loss. */
  isExclusive: boolean;
  /** Self-sell baseline: copies/month the designer would sell anyway at own price. */
  baselineSalesPerMonth: number;
  patternPrice: number;
  platformFeeRate: number; // e.g. 0.05 Ravelry-ish
  /** Effort hours: design/grading/writing. */
  workHours: number;
  hourlyRate: number;
  /** Delivery-date buffer in weeks (hard deadline: boxes assemble a month ahead). */
  deliveryBufferWeeks: number;
  /** Marketing insert / card included in the channel (10% of suppliers do). */
  hasMarketingInsert: boolean;
  /** Contract has paid-amount clause + date terms. */
  paidInWriting: boolean;
  /** Channel stability: known box defunct rate ~13%. */
  channelDefunctRate: number; // 0-1, default 0.13 for boxes, 0.02 for brands/mags
}

export interface ChannelResult {
  channelIncome: number; // fee + extras
  audienceIncome: number; // estimated shop income from the channel's audience
  lostSelfSell: number; // self-sell income forgone during exclusivity
  exposureValue: number; // lead value of visitors (0.35/mo/subscriber norm)
  totalValue: number;
  labourCost: number;
  netProfit: number;
  effectiveHourly: number;
  deadlineRisk: 'low' | 'medium' | 'high';
  stabilityRisk: number; // 0-1 probability-adjusted haircut
  verdict: 'go' | 'maybe' | 'no';
  notes: string[];
}

const HOURS_FLOOR = 12;
const LEAD_VALUE = 0.35;
const LAUNCH_WEEK_SHARE = 0.6; // share of garment sales in launch week
const DESIGN_FEE_MIN = 80;
const DESIGN_FEE_MAX = 140;
const MAG_CEILING = 900;

export const CHANNEL_TYPE_LABELS: Record<ChannelType, string> = {
  subbox: 'Subscription box',
  'brand-collab': 'Yarn-brand collab',
  magazine: 'Magazine / anthology',
  other: 'Other placement',
};

export function defaultChannelDeal(): ChannelDeal {
  return {
    type: 'subbox',
    name: '',
    designFee: 150,
    extrasValue: 0,
    exclusivityMonths: 3,
    audienceReach: 300,
    profileVisitPct: 5,
    visitorConvertPct: 8,
    visitorSpend: 20,
    effectMonths: 6,
    isExclusive: true,
    baselineSalesPerMonth: 10,
    patternPrice: 9,
    platformFeeRate: 0.05,
    workHours: 40,
    hourlyRate: HOURS_FLOOR,
    deliveryBufferWeeks: 2,
    hasMarketingInsert: false,
    paidInWriting: false,
    channelDefunctRate: 0.13,
  };
}

export function analyzeChannel(deal: ChannelDeal): ChannelResult {
  const notes: string[] = [];
  const clamped = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

  const channelIncome = Math.max(0, deal.designFee) + Math.max(0, deal.extrasValue);

  // Audience effect: reach → shop visitors → buyers, running across effect months.
  const monthlyVisitors = (deal.audienceReach * clamped(deal.profileVisitPct, 0, 100)) / 100;
  const monthlyBuyers = (monthlyVisitors * clamped(deal.visitorConvertPct, 0, 100)) / 100;
  const effectMonths = Math.max(3, deal.effectMonths || deal.exclusivityMonths || 3);
  const audienceIncome = monthlyBuyers * Math.max(0, deal.visitorSpend) * effectMonths;

  // Lost self-sell during exclusivity: baseline units at price net of platform fees.
  const lostSelfSell =
    deal.isExclusive && deal.exclusivityMonths > 0
      ? Math.max(0, deal.baselineSalesPerMonth) *
        Math.max(0, deal.patternPrice) *
        (1 - clamped(deal.platformFeeRate, 0, 1)) *
        deal.exclusivityMonths
      : 0;

  // Exposure value: visitors convert to list growth; use LEAD_VALUE × effect months per subscriber.
  const exposureValue = monthlyVisitors * LEAD_VALUE * effectMonths;

  const totalValue = channelIncome + audienceIncome + exposureValue - lostSelfSell;
  const labourCost = Math.max(0, deal.workHours) * Math.max(0, deal.hourlyRate);
  const netProfit = totalValue - labourCost;
  const totalHours = Math.max(1, deal.workHours);
  const effectiveHourly = netProfit / totalHours;

  // Deadline risk: boxes assemble a month ahead; buffer < 2 weeks = high risk.
  let deadlineRisk: 'low' | 'medium' | 'high' =
    deal.deliveryBufferWeeks >= 3 ? 'low' : deal.deliveryBufferWeeks >= 2 ? 'medium' : 'high';

  // Stability haircut: ~13% of tracked boxes go defunct (for boxes; lower for brands/mags).
  const stabilityRisk = clamped(deal.channelDefunctRate, 0, 1);

  let verdict: 'go' | 'maybe' | 'no' = 'maybe';

  if (deal.type === 'subbox') {
    if (deadlineRisk === 'high') {
      notes.push(
        'Box operators assemble a month ahead and accept no substitutions. With less than two weeks of ' +
          'buffer this deal puts your calendar at real risk of breach — negotiate the date down or add slack.'
      );
      verdict = 'no';
    } else if (!deal.hasMarketingInsert) {
      notes.push(
        'Only about 10% of box suppliers include a marketing card — and box owners say they want them and will ' +
          'give you social time for it. A code or QR card in the box turns subscribers into your own customers; ' +
          'without it the exposure dies inside the parcel. Add the insert before saying yes, or ask the box to feature it.'
      );
    }
    if (!deal.paidInWriting) {
      notes.push(
        'Get the fee, delivery date and rights terms in writing. Defunct-box rate runs around 13% among tracked ' +
          'boxes; written terms are your only recourse if the box folds before paying you.'
      );
    }
    const perSub = deal.audienceReach > 0 ? channelIncome / deal.audienceReach : 0;
    if (netProfit > 0 && effectiveHourly >= HOURS_FLOOR && deadlineRisk !== 'high') {
      notes.push(
        `At ${deal.audienceReach} subscribers the fee works out to ~$${perSub.toFixed(2)} per subscriber exposed. ` +
          'Clears the $12/hr bar and the deadline is workable — this channel pays.'
      );
      verdict = 'go';
    } else if (netProfit <= 0) {
      notes.push(
        'The fee does not cover your hours plus the self-sell you give up. Typical healthy boxes run 200–400 ' +
          'subscribers at $35–$65 a box; if the offer is below the small-design band of $80–$140, counter at the top of it.'
      );
      verdict = 'no';
    } else {
      notes.push('Cash-positive but under the hourly bar — push the fee up or shorten exclusivity.');
      verdict = 'maybe';
    }
    if (deal.exclusivityMonths > 6) {
      notes.push(
        `Exclusive for ${deal.exclusivityMonths} months — longer than the 4–5 month windows indie magazines use. ` +
          'Boxes feature a designer at most once a year, so long exclusivity is rarely worth it.'
      );
      verdict = verdict === 'go' ? 'maybe' : verdict;
    }
  } else if (deal.type === 'magazine') {
    if (deal.designFee > MAG_CEILING) {
      notes.push('Above the indie-magazine ceiling (~$900/garment) — verify the terms carefully.');
    } else if (deal.designFee < DESIGN_FEE_MIN && deal.workHours > 20) {
      notes.push(
        'Below the $80 small-design floor for 20+ hours of work. A sweater takes 50–85 hours to design, sample ' +
          'and grade; at this rate you earn well under minimum wage.'
      );
      verdict = 'no';
    } else if (netProfit > 0 && effectiveHourly >= HOURS_FLOOR) {
      notes.push('Above the hourly bar — solid magazine economics.');
      verdict = 'go';
    } else {
      notes.push('Positive cash but under the hourly bar — counter on fee or scope.');
    }
  } else {
    if (netProfit > 0 && effectiveHourly >= HOURS_FLOOR) {
      notes.push('Clears the hourly bar. Standard good outcome.');
      verdict = 'go';
    } else if (netProfit <= 0) {
      notes.push('Loses money against your time — decline or renegotiate.');
      verdict = 'no';
    } else {
      notes.push('Cash-positive but underpaid per hour.');
      verdict = 'maybe';
    }
  }

  if (deal.audienceReach > 0) {
    notes.push(
      'Audience math: only under 1% of Ravelry designers ever clear $3,000+/mo (top 93 of 10,000+); the average ' +
        'indie designer nets $203 even in the best month. Channel exposure at realistic 5–8% profile-visit and ' +
        '~8% visitor-conversion is usually worth more than the fee itself — but only with a marketing insert to capture it.'
    );
  }

  return {
    channelIncome,
    audienceIncome,
    lostSelfSell,
    exposureValue,
    totalValue,
    labourCost,
    netProfit,
    effectiveHourly,
    deadlineRisk,
    stabilityRisk,
    verdict,
    notes,
  };
}

/* ------------------------------------------------------------------ */
/* Newsletter funnel planner                                           */
/* ------------------------------------------------------------------ */

export interface FunnelInput {
  listSize: number; // current subscribers
  freebieLeadInPerMonth: number; // new leads/month from free pattern / lead magnet
  launchWeekShare: number; // 0-1, share of sales in the first week (default 0.6)
  launchConversionPct: number; // % of list that buys at launch (0-100, typical 2-5%)
  launchPrice: number;
  evergreenConversionPct: number; // % of remaining list that buys evergreen (0-100, ~0.5-1%)
  evergreenPrice: number;
  postLaunchConversionPct: number; // % converting after launch month (0-100, ~1-2%)
  monthsTracked: number;
  platformFeeRate: number;
  launchEffortHours: number;
  maintenanceHoursPerMonth: number;
  hourlyRate: number;
}

export interface FunnelResult {
  leadFlowValue: number; // new leads × LEAD_VALUE × months
  launchSales: number;
  launchRevenue: number;
  evergreenSales: number;
  evergreenRevenue: number;
  postLaunchSales: number;
  postLaunchRevenue: number;
  grossRevenue: number;
  fees: number;
  labourCost: number;
  netProfit: number;
  effectiveHourly: number;
  launchWeekInsight: string;
  notes: string[];
}

export function defaultFunnelInput(): FunnelInput {
  return {
    listSize: 300,
    freebieLeadInPerMonth: 15,
    launchWeekShare: LAUNCH_WEEK_SHARE,
    launchConversionPct: 3,
    launchPrice: 12,
    evergreenConversionPct: 0.5,
    evergreenPrice: 12,
    postLaunchConversionPct: 1.5,
    monthsTracked: 6,
    platformFeeRate: 0.05,
    launchEffortHours: 10,
    maintenanceHoursPerMonth: 3,
    hourlyRate: HOURS_FLOOR,
  };
}

export function analyzeFunnel(input: FunnelInput): FunnelResult {
  const notes: string[] = [];
  const clamped = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
  const feeRate = clamped(input.platformFeeRate, 0, 1);

  const listBase = input.listSize;
  const newLeads = input.freebieLeadInPerMonth * input.monthsTracked;
  const listEnd = listBase + newLeads;
  const leadFlowValue = newLeads * LEAD_VALUE * Math.max(1, input.monthsTracked);

  const launchBuyers = Math.round((listBase * clamped(input.launchConversionPct, 0, 100)) / 100);
  const launchRevenue = launchBuyers * Math.max(0, input.launchPrice);

  // Evergreen: non-launch buyers across the tracked months on the grown list.
  const nonLaunchShare = 1 - clamped(input.launchWeekShare, 0, 1);
  const evergreenBuyers = Math.round(
    (listEnd * clamped(input.evergreenConversionPct, 0, 100)) / 100 * Math.max(1, input.monthsTracked)
  );
  const evergreenRevenue = evergreenBuyers * Math.max(0, input.evergreenPrice);

  const postBuyers = Math.round(
    (listEnd * clamped(input.postLaunchConversionPct, 0, 100)) / 100 * Math.max(1, input.monthsTracked)
  );
  const postLaunchRevenue = postBuyers * Math.max(0, input.launchPrice);

  const grossRevenue = launchRevenue + evergreenRevenue + postLaunchRevenue;
  const fees = grossRevenue * feeRate;
  const labourCost =
    (Math.max(0, input.launchEffortHours) + Math.max(0, input.maintenanceHoursPerMonth) * input.monthsTracked) *
    Math.max(0, input.hourlyRate);
  const netProfit = grossRevenue - fees - labourCost + leadFlowValue;
  const totalHours = Math.max(1, input.launchEffortHours + input.maintenanceHoursPerMonth * input.monthsTracked);
  const effectiveHourly = netProfit / totalHours;

  const launchWeekInsight = `With ~${Math.round(input.launchWeekShare * 100)}% of sales landing in launch week, your
 release-day email does the heavy lifting: ${launchBuyers} buyers × $${input.launchPrice} = $${launchRevenue.toFixed(
    0
  )} before fees. ${Math.round((1 - input.launchWeekShare) * 100)}% trickles evergreen.`;

  if (input.listSize < 100) {
    notes.push(
      'A sub-100 list makes the list itself the bottleneck, not the pattern. 72% of designers earned under $50 in ' +
        'Ravelry\'s best month — the ones who beat that odds run release-week email pushes on lists they grew with ' +
        'free patterns. Grow the freebie lead-in before expecting the funnel to pay.'
    );
  }
  if (netProfit > 0 && effectiveHourly >= HOURS_FLOOR) {
    notes.push('The funnel clears the $12/hr bar — your list is earning, not just warming up.');
  } else if (netProfit <= 0) {
    notes.push('At current list size and conversion the funnel loses money against your time. Grow leads or tighten maintenance hours.');
  } else {
    notes.push('Positive but under the hourly bar — raise launch price or convert-up with a bundle.');
  }
  if (input.freebieLeadInPerMonth <= 0 && input.listSize < 1000) {
    notes.push(
      'No lead magnet feeding the list: the funnel has a leaky top. A free accessory pattern is the cheapest way ' +
        'in — one lead magnet can be worth more over 6 months than a single pattern sale.'
    );
  }

  return {
    leadFlowValue,
    launchSales: launchBuyers,
    launchRevenue,
    evergreenSales: evergreenBuyers,
    evergreenRevenue,
    postLaunchSales: postBuyers,
    postLaunchRevenue,
    grossRevenue,
    fees,
    labourCost,
    netProfit,
    effectiveHourly,
    launchWeekInsight,
    notes,
  };
}

/* ------------------------------------------------------------------ */
/* Paste-ready box pitch                                               */
/* ------------------------------------------------------------------ */

export interface BoxPitchInput {
  designerName: string;
  patternName: string;
  boxName: string;
  audienceReach: number;
  feeAsk: number;
  exclusivityAskMonths: number;
  insertPromise: boolean;
}

export function generateBoxPitch(input: BoxPitchInput): string {
  const lines: string[] = [];
  lines.push(`Subject: Exclusive design for ${input.boxName} — ${input.patternName}`);
  lines.push('');
  lines.push(`Hi ${input.boxName} team,`);
  lines.push('');
  lines.push(
    `I'm ${input.designerName}, an independent knitwear designer. I'd love to design an exclusive project for your box — ` +
      `my current idea is ${input.patternName}.`
  );
  lines.push('');
  lines.push(
    `For this scope my fee is $${input.feeAsk} with ${input.exclusivityAskMonths} months of exclusivity from your ship ` +
      `date, after which the pattern goes to my own shop (with credit to ${input.boxName} in the listing).`
  );
  lines.push('');
  if (input.insertPromise) {
    lines.push(
      `I'll include a marketing card with a personal discount code for subscribers — a code or QR in the box turns your ` +
        `subscribers into my customers, and you're welcome to share it to your audience as a bonus. I can deliver the ` +
        `finished pattern, tech-edited and graded, with room to spare before your assembly deadline.`
    );
  } else {
    lines.push(
      `I'll deliver the finished pattern, tech-edited and graded, with room to spare before your assembly deadline.`
    );
  }
  lines.push('');
  lines.push('Happy to share my portfolio and swatches. Thanks for considering it!');
  return lines.join('\n');
}
