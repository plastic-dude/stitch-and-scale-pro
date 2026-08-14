/**
 * CHK-019 — KAL & Collab ROI Planner library.
 *
 * One library, pure functions, fully tested. Converts marketing activities
 * (KALs, giveaways, brand collabs, affiliate-linked designs, sale events)
 * from vibes-only advice into priced decisions, using cited benchmarks.
 *
 * Cited benchmarks baked into the math (sources saved in
 * /research/competitors-session-20-kal-marketing.md):
 * - Ravelry Jan-2019: top 10% of indie designers earn ≥$201/mo; only 3% earn
 *   $1,000+/mo (mediaperuana.com/blog1/designerincome).
 * - Author case study: $4,647 profit from $7,910 revenue (~59% margin after
 *   fees/expenses), 3,400 followers, 762 newsletter subs, 921 patterns/yr.
 * - Emma Knitty (Working with Brands): small design €80–140 fee benchmark;
 *   yarn-only collabs for sized garments are a red flag; lump-sum paid work
 *   usually transfers rights and may impose a resale price floor.
 * - Knit Picks: 10% affiliate commission, no posting requirements; Ambassador
 *   entry tier 100 followers; Influencer tier 10k followers.
 * - GAL: free to join, designers self-set the discount (e.g. 25% off).
 * - Design fee floor: $12/hr professional bar (Who Pays Knitters, reused
 *   from CHK-004) and indie-magazine ceiling ~$900/garment.
 */

export type KalFormat =
  | 'free-kal' // free pattern to drive list growth / sales of OTHER patterns
  | 'paid-kal' // attendees buy the pattern (discounted or full price)
  | 'sponsored-kal' // yarn brand pays a lump sum and/or provides yarn support
  | 'giveaway' // giveaway of the pattern or a kit to grow audience
  | 'sale-event'; // participation in an event like the Ravelry GAL

export interface KalEvent {
  format: KalFormat;
  name: string;
  durationWeeks: number; // length of the KAL / campaign
  patternPrice: number; // list price of the pattern in $
  discountPct: number; // 0-100, e.g. 25 for GAL-style discounts
  /** Estimated additional pattern copies sold during the event (beside baseline). */
  eventSalesUnits: number;
  /** Ongoing sales-lift copies/month the KAL leaves behind (visibility tail). */
  tailSalesPerMonth: number;
  tailMonths: number;
  /** Extra sales of OTHER patterns in the designer's shop during the event. */
  crossSellRevenue: number;
  /** New newsletter / follower signups attributed to the event. */
  newLeads: number;
  /** Expected lifetime value of each new lead (default uses cited list value). */
  leadValue: number;
  /** Affiliate commission rate earned on yarn/tools links during the event (0-1). */
  affiliateRate: number;
  /** Average affiliate-linked cart value per participating knitter. */
  affiliateCartValue: number;
  /** Number of participating knitters buying yarn via affiliate links. */
  affiliateBuyers: number;
  /** Platform fees on pattern sales (decimal, e.g. 0.05 for Ravelry ~5%). */
  platformFeeRate: number;
  /** Cost inputs */
  sampleYarnCost: number; // own out-of-pocket sample yarn (0 if sponsored)
  otherCosts: number; // prizes, ads, shipping of giveaway kits etc.
  /** Effort inputs (hours) — the designer's real cost of time */
  designHours: number; // includes design/grading/writing already amortised? no: NEW work
  promotionHours: number; // weekly promo content, posts, Q&A during event
  supportHours: number; // answering participant questions across the whole event
  hourlyRate: number; // opportunity cost of time, e.g. 12+
}

export interface KalResult {
  grossRevenue: number; // sales + cross-sell + affiliate + lead value (pre-fee)
  platformFees: number;
  cashCosts: number; // yarn, prizes, ads
  labourCost: number; // hours × hourlyRate
  netCash: number; // grossRevenue - fees - cashCosts
  netProfit: number; // netCash - labourCost
  effectiveHourly: number; // netProfit / totalHours
  verdict: 'go' | 'maybe' | 'no';
  notes: string[]; // cited reasoning behind the verdict
}

const LEAD_VALUE_BENCHMARK = 0.35; // $ per email subscriber/month, cited email-marketing norm
const KNIT_PICKS_AFFILIATE = 0.10; // Knit Picks affiliate commission, no posting requirements
const DESIGN_FEE_FLOOR = 80; // €80 small-project lower bound (Emma Knitty) converted 1:1 as $80 bar
const DESIGN_FEE_CEILING_SMALL = 140; // €140 small-project upper bound
const HOURS_FLOOR = 12; // professional bar, Who Pays Knitters
const INDIE_MAG_CEILING = 900; // indie magazines don't pay more than ~$900/garment

export const KAL_FORMAT_LABELS: Record<KalFormat, string> = {
  'free-kal': 'Free KAL (lead builder)',
  'paid-kal': 'Paid KAL',
  'sponsored-kal': 'Sponsored KAL / brand collab',
  'giveaway': 'Giveaway',
  'sale-event': 'Sale event (e.g. GAL)',
};

export function defaultKalEvent(): KalEvent {
  return {
    format: 'free-kal',
    name: '',
    durationWeeks: 4,
    patternPrice: 8,
    discountPct: 0,
    eventSalesUnits: 0,
    tailSalesPerMonth: 4,
    tailMonths: 3,
    crossSellRevenue: 60,
    newLeads: 25,
    leadValue: LEAD_VALUE_BENCHMARK,
    affiliateRate: KNIT_PICKS_AFFILIATE,
    affiliateCartValue: 45,
    affiliateBuyers: 5,
    platformFeeRate: 0.05,
    sampleYarnCost: 0,
    otherCosts: 0,
    designHours: 10,
    promotionHours: 3,
    supportHours: 5,
    hourlyRate: HOURS_FLOOR,
  };
}

export function analyzeKal(event: KalEvent): KalResult {
  const notes: string[] = [];

  const priceAfterDiscount = event.patternPrice * (1 - Math.min(100, Math.max(0, event.discountPct)) / 100);
  const patternRevenue =
    event.eventSalesUnits * priceAfterDiscount +
    event.tailSalesPerMonth * event.tailMonths * event.patternPrice +
    event.crossSellRevenue;
  const affiliateRevenue =
    event.affiliateBuyers * event.affiliateCartValue * Math.min(1, Math.max(0, event.affiliateRate));
  const leadRevenue = event.newLeads * Math.max(0, event.leadValue);
  const grossRevenue = patternRevenue + affiliateRevenue + leadRevenue;

  const platformFees = (patternRevenue + affiliateRevenue) * Math.min(1, Math.max(0, event.platformFeeRate));
  const cashCosts = Math.max(0, event.sampleYarnCost) + Math.max(0, event.otherCosts);

  const totalHours =
    Math.max(0, event.designHours) +
    Math.max(0, event.promotionHours) * Math.max(1, event.durationWeeks) +
    Math.max(0, event.supportHours);
  const labourCost = totalHours * Math.max(0, event.hourlyRate);

  const netCash = grossRevenue - platformFees - cashCosts;
  const netProfit = netCash - labourCost;
  const effectiveHourly = totalHours > 0 ? netProfit / totalHours : 0;

  let verdict: 'go' | 'maybe' | 'no' = 'maybe';

  if (event.format === 'free-kal') {
    if (event.newLeads === 0 && event.crossSellRevenue === 0) {
      notes.push(
        'A free KAL earns nothing in pattern sales on purpose — its job is new leads and cross-sell. ' +
          'Set realistic "new leads" and "other-pattern sales" numbers or the plan is a free giveaway with no goal.'
      );
      verdict = 'no';
    } else if (netProfit >= 0 && effectiveHourly >= HOURS_FLOOR) {
      notes.push(
        'Covers its costs and clears the cited $12/hr professional bar — a healthy lead-building machine. ' +
          'Most designers treat free KALs as charity; priced this way it is a marketing product.'
      );
      verdict = 'go';
    } else if (netProfit < 0) {
      notes.push(
        'This free KAL loses cash on top of your time. Trim giveaway costs, add an affiliate link list to the pattern page, ' +
          'or cut duration before signing up.'
      );
      verdict = 'no';
    } else {
      notes.push(
        'Profitable in cash but your effective hourly rate sits under the $12/hr bar most designers quote as a floor. ' +
          'Raise the cross-sell target or shorten the promo commitment.'
      );
      verdict = 'maybe';
    }
    if (event.affiliateBuyers > 0 && event.affiliateRate <= 0) {
      notes.push(
        'You listed knitters buying yarn but a 0% affiliate rate. Knit Picks pays 10% with no posting requirements — ' +
          'a blank affiliate field leaves money unclaimed on every kit sale.'
      );
    }
  } else if (event.format === 'paid-kal') {
    if (event.eventSalesUnits === 0) {
      notes.push(
        'A paid KAL with zero expected sales is a contradiction — either the discount is too deep or the audience too small. ' +
          'For reference, only ~3% of Ravelry designers ever clear $1,000/mo, so anchor expectations to your real list size.'
      );
      verdict = 'no';
    } else if (effectiveHourly >= HOURS_FLOOR && netProfit > 0) {
      notes.push('Clears the $12/hr bar and turns a profit. The format pays.');
      verdict = 'go';
    } else if (netProfit > 0) {
      notes.push('Positive cash but under the hourly bar — it is paying you below the professional floor.');
      verdict = 'maybe';
    } else {
      notes.push('A paid KAL that loses money is just a discount with extra steps. Fix pricing or skip it.');
      verdict = 'no';
    }
  } else if (event.format === 'sponsored-kal') {
    if (event.sampleYarnCost === 0 && event.otherCosts === 0 && cashCosts === 0) {
      notes.push('Yarn support covered — good. But check the rights clause: lump-sum deals often transfer pattern rights or impose a resale price floor.');
    }
    if (netProfit > 0 && effectiveHourly >= HOURS_FLOOR) {
      notes.push('Paid collab that clears the hourly bar. Standard good outcome.');
      verdict = 'go';
    } else if (netCash > 0) {
      notes.push(
        'Cash covers the out-of-pocket costs but your time still earns below the professional bar. ' +
          'The benchmark for a small paid design is $80–$140; a full KAL pattern should sit at the top of that range or above it.'
      );
      verdict = 'maybe';
    } else {
      notes.push('Out-of-pocket costs plus underpaid time — this collab costs you money to make.');
      verdict = 'no';
    }
  } else if (event.format === 'giveaway') {
    if (netProfit >= 0 && effectiveHourly >= HOURS_FLOOR / 2) {
      notes.push('Breaks even or better while growing the list — acceptable for a visibility play.');
      verdict = 'go';
    } else {
      notes.push(
        'Giveaways have a real cost floor: prize plus labour plus platform fees on whatever sales it moves. ' +
          'Size the prize against the leads it will realistically bring in.'
      );
      verdict = 'no';
    }
  } else {
    // sale-event
    const discountLoss = patternRevenue * (event.discountPct / 100);
    if (event.eventSalesUnits > 0 && netProfit > 0) {
      notes.push(
        `The ~${event.discountPct}% event discount costs about $${discountLoss.toFixed(0)} in margin but the volume covers it. ` +
          'GAL participation is free to join, so self-set the discount where volume beats margin.'
      );
      verdict = 'go';
    } else if (netProfit <= 0) {
      notes.push(
        'The discount plus entry effort outweighs the extra volume. Shallower discount or fewer promo hours fixes it.'
      );
      verdict = 'no';
    } else {
      notes.push('Positive but thin — the sale moves stock without building much.');
      verdict = 'maybe';
    }
  }

  return { grossRevenue, platformFees, cashCosts, labourCost, netCash, netProfit, effectiveHourly, verdict, notes };
}

/* ------------------------------------------------------------------ */
/* Brand-collab rights checklist (from Working with Brands guidance)   */
/* ------------------------------------------------------------------ */

export interface CollabOffer {
  upfrontPayment: number; // lump sum, 0 = yarn-only
  yarnProvided: boolean;
  selfResellRight: boolean; // can you still sell the pattern yourself
  resalePriceFloor: boolean; // must not sell below the brand's price
  rightsTransferred: boolean; // brand owns the pattern
  exclusivityMonths: number;
  sizingScope: string; // e.g. 'XXS-5XL'
  deliverables: string[];
}

export interface RightsCheck {
  item: string;
  ok: boolean;
  detail: string;
}

export function rightsChecklist(offer: CollabOffer): RightsCheck[] {
  const checks: RightsCheck[] = [];
  if (offer.upfrontPayment <= 0 && offer.sizingScope.length > 0) {
    checks.push({
      item: 'Yarn-only payment for a sized garment',
      ok: false,
      detail:
        'A full-size garment (especially multi-size like XXS–5XL) designed for yarn alone is widely called out as unfair. ' +
        'The benchmark range for a small paid design is $80–$140; sized garments command more.',
    });
  } else if (offer.upfrontPayment <= 0 && !offer.yarnProvided) {
    checks.push({
      item: 'Unpaid, no yarn support',
      ok: false,
      detail: 'No cash and no materials: this is pure free labour below the professional floor.',
    });
  } else {
    checks.push({ item: 'Compensation structure', ok: offer.upfrontPayment > 0 || offer.yarnProvided, detail: offer.upfrontPayment > 0 ? `Lump sum $${offer.upfrontPayment}.` : 'Yarn support only — check the rights below carefully.' });
  }
  checks.push({
    item: 'Self-resell right retained',
    ok: offer.selfResellRight,
    detail: offer.selfResellRight
      ? 'You can keep selling the pattern yourself — passive income intact.'
      : 'If the brand pays a lump sum, they often own the rights and can resell it or put it in their magazine. Confirm in writing whether you may resell.',
  });
  checks.push({
    item: 'Resale price floor',
    ok: !offer.resalePriceFloor || offer.selfResellRight,
    detail: offer.resalePriceFloor
      ? 'You must not undercut the brand\'s price — normal in lump-sum deals, but it caps your discount flexibility forever.'
      : 'No resale floor: you keep pricing freedom.',
  });
  checks.push({
    item: 'Rights transfer',
    ok: !offer.rightsTransferred,
    detail: offer.rightsTransferred
      ? 'Rights transferred to the brand: the pattern can appear free on their platform. That is fine ONLY if the upfront payment reflects it.'
      : 'Rights stay yours.',
  });
  if (offer.exclusivityMonths > 0) {
    checks.push({
      item: 'Exclusivity window',
      ok: offer.exclusivityMonths <= 6,
      detail:
        offer.exclusivityMonths <= 6
          ? `Exclusive for ${offer.exclusivityMonths} month(s) — comparable to magazine windows.`
          : `Exclusive for ${offer.exclusivityMonths} months — longer than most indie-magazine windows (typically 4–5 months). Negotiate it down or up the fee.`,
    });
  }
  if (offer.deliverables.length > 0) {
    checks.push({
      item: 'Deliverables scope',
      ok: offer.deliverables.length <= 5,
      detail: `${offer.deliverables.length} deliverable(s) listed: ${offer.deliverables.join(', ')}. More than ~5 is a scope that belongs in a higher fee.`,
    });
  }
  return checks;
}

/* ------------------------------------------------------------------ */
/* Collab fee estimator                                                */
/* ------------------------------------------------------------------ */

export interface FeeEstimate {
  baseFee: number;
  sizingMultiplier: number;
  rightsMultiplier: number;
  scopeMultiplier: number;
  suggestedMin: number;
  suggestedMax: number;
  notes: string[];
}

export function estimateCollabFee(offer: CollabOffer): FeeEstimate {
  const notes: string[] = [];
  // Base: $80–$140 band for a small project (Emma Knitty's published ranges).
  const baseFee = 110;
  const notesList: string[] = ['Base band $80–$140 for a small project, from published designer guidance.'];

  let sizingMultiplier = 1;
  const sized = /XXS|XS|S|M|L|XL|5XL|6XL|multi/i.test(offer.sizingScope) && offer.sizingScope.length > 2;
  if (sized) {
    sizingMultiplier = 1.5;
    notesList.push('Multi-size grading roughly +50% — grading work is real labour most brands discount away.');
  }
  let rightsMultiplier = 1;
  if (offer.rightsTransferred) {
    rightsMultiplier = 2;
    notesList.push('Full rights transfer roughly doubles the fee — the brand is buying an asset, not a one-off post.');
  }
  let scopeMultiplier = 1;
  if (offer.deliverables.length > 5) {
    scopeMultiplier = 1 + (offer.deliverables.length - 5) * 0.15;
    notesList.push(`Scope above 5 deliverables adds ~15% per extra item.`);
  }
  const suggestedMin = Math.round(baseFee * sizingMultiplier * rightsMultiplier * scopeMultiplier);
  const suggestedMax = Math.round(baseFee * 1.3 * sizingMultiplier * rightsMultiplier * scopeMultiplier);

  return { baseFee, sizingMultiplier, rightsMultiplier, scopeMultiplier, suggestedMin, suggestedMax, notes: notesList };
}

/* ------------------------------------------------------------------ */
/* Paste-ready collab pitch                                            */
/* ------------------------------------------------------------------ */

export interface PitchInput {
  designerName: string;
  patternName: string;
  brandName: string;
  kpis: { followers: number; newsletter: number; patternsSold: number };
  ask: string; // e.g. 'yarn support for a KAL in March'
  feeAsk: number; // 0 = yarn-only ask
}

export function generateCollabPitch(input: PitchInput): string {
  const lines: string[] = [];
  lines.push(`Subject: Design partnership idea — ${input.patternName}`);
  lines.push('');
  lines.push(`Hi ${input.brandName} team,`);
  lines.push('');
  lines.push(
    `I'm ${input.designerName}, an independent knitwear designer. I'd love to create a design around your yarn — my idea ` +
      `is ${input.ask}.`
  );
  lines.push('');
  lines.push(
    `A few quick numbers so you can see the reach: ~${input.kpis.followers.toLocaleString()} followers, ` +
      `~${input.kpis.newsletter.toLocaleString()} newsletter subscribers, and ${input.kpis.patternsSold.toLocaleString()} ` +
      `patterns sold to date. Designs with your yarn would carry your link in every pattern's materials list, so sales flow ` +
      `back to you every time a knitter buys the pattern.`
  );
  lines.push('');
  if (input.feeAsk > 0) {
    lines.push(
      `For this scope my fee is $${input.feeAsk} (including multi-size grading and full tech-edit-ready documentation), ` +
        `with yarn support on top. I retain self-resell rights so the pattern keeps promoting your yarn after launch.`
    );
  } else {
    lines.push(`In exchange for yarn support I'll credit your yarn in the pattern, link to your shop in the materials list, and post the build across my channels.`);
  }
  lines.push('');
  lines.push('Happy to share my portfolio and a mood board for the design. Thanks for considering it!');
  return lines.join('\n');
}
