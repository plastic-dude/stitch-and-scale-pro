/**
 * Yarn-partnership economics for indie knitwear designers.
 *
 * Models the deal types yarn companies, indie dyers, and LYSes actually offer
 * (research: Knit Picks IDP, Who Pays Knitters, indie-dyer collaboration guides,
 * LYS Day exclusives — see research/competitors-session-36).
 *
 * Local-first, no backend, no external state.
 */

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

export type DealType =
  | 'yarnSupport'        // free yarn only, no cash, design self-published
  | 'idpListing'         // Knit Picks IDP-style: designer sets price, company keeps flat %
  | 'lumpSum'            // one-off design fee, rights may transfer
  | 'exclusivityWindow'  // flat fee for 6-12 month exclusivity, then designer keeps sales
  | 'lysDayExclusive'    // LYS Day (annual, April): pattern free/exclusive with purchase
  | 'kalHost'            // KAL/CAL hosting with company promoting, possible fee

export type RightsGrant =
  | 'keepAll'            // designer keeps all rights (yarn support / IDP style)
  | 'partialExclusivity' // company gets 6-12 mo exclusivity only
  | 'partialRoyalty'     // concurrent self-publish, company shares sales %
  | 'fullTransfer';      // company owns the pattern outright

export type PitchStatus =
  | 'draft' | 'pitched' | 'yarnReceived' | 'inDesign' | 'delivered' | 'closed';

export interface DealOffer {
  dealType: DealType;
  rights: RightsGrant;
  offeredAmount: number;        // $ fee or lump sum (0 for yarn-support / IDP per-sale)
  idpFeePct: number;            // company cut of each pattern sale (IDP-style), e.g. 15
  exclusivityMonths: number;    // exclusivity window length
  patternPrice: number;         // expected self-published listing price
  expectedUnitSales12m: number; // self-published unit sales over 12 months
  marketingReach: number;       // relative 0-100, company audience share for this design
  yarnValue: number;            // $ value of yarn support provided
  kalfollowers: number;         // expected extra exposure reach (followers)
  /** production costs designer still pays even with yarn support */
  productionCost: number;       // tech edit + photography + sample finishing
  hoursWorked: number;          // total designer hours incl. revisions & deadlines
  deliverablesCount: number;    // marketing posts, files, assets owed to the company
  exclusiveListed: boolean;     // pattern may NOT be self-published during window
  /** LYS Day specific */
  lysDayWindowDays: number;     // e.g. 30-day window (April window)
}

export interface RedFlag {
  code: string;
  text: string;
}

export interface DealAnalysis {
  cashValue: number;            // guaranteed cash in the deal
  selfPublishValue12m: number;  // what the pattern earns self-published (gross)
  platformNetSelfPublish: number; // self-publish value after typical marketplace fees
  totalValue12m: number;        // cash + platform-net self-publish - production
  effectiveHourly: number;      // totalValue12m / hoursWorked
  verdict: 'great' | 'good' | 'hold' | 'rethink' | 'skip';
  verdictNote: string;
  rightsPenalty: number;        // $ value surrendered by rights grant vs keepAll
  redFlags: RedFlag[];
  deliverablesPerHour: number;
  pitchScore: number;           // 0-100 pitch readiness score
  pitchGaps: string[];
  annualEventNote?: string;
}

export interface PitchEntry {
  id: string;
  company: string;
  dealType: DealType;
  status: PitchStatus;
  dueDate: string;              // ISO date — next deadline
  amount: number;
  notes: string;
}

export const DEFAULT_PARTNER: DealOffer = {
  dealType: 'yarnSupport',
  rights: 'keepAll',
  offeredAmount: 0,
  idpFeePct: 15,
  exclusivityMonths: 6,
  patternPrice: 8,
  expectedUnitSales12m: 250,
  marketingReach: 30,
  yarnValue: 120,
  kalfollowers: 0,
  productionCost: 300,
  hoursWorked: 25,
  deliverablesCount: 2,
  exclusiveListed: false,
  lysDayWindowDays: 30,
};

export const DEFAULT_PITCHES: PitchEntry[] = [];

/* ------------------------------------------------------------------ */
/* Constants                                                          */
/* ------------------------------------------------------------------ */

export const DEAL_LABELS: Record<DealType, string> = {
  yarnSupport: 'Yarn support only',
  idpListing: 'IDP-style listing (flat % fee)',
  lumpSum: 'Lump-sum buyout',
  exclusivityWindow: 'Exclusivity window (6-12 mo)',
  lysDayExclusive: 'LYS Day exclusive',
  kalHost: 'KAL/CAL hosted by company',
};

export const RIGHTS_LABELS: Record<RightsGrant, string> = {
  keepAll: 'Keep all rights',
  partialExclusivity: '6-12 mo exclusivity only',
  partialRoyalty: 'Concurrent self-publish, shared sales',
  fullTransfer: 'Full rights transfer',
};

/* Who Pays Knitters: accessory design rate $40-$700, avg $246 (2016; garment higher). */
export const WPK_ACCESSORY_RATE_AVG = 246;
export const WPK_ACCESSORY_RATE_MIN = 40;
export const WPK_ACCESSORY_RATE_MAX = 700;
export const MARKER_GARMENT_RATE_MIN = 400;
export const MARKER_GARMENT_RATE_MAX = 1400;

/* Marketplace net: typical fees are 15% (Ravelry/Etsy after listing) — used as the
   "self-publish baseline" for comparing partnership value against selling it yourself. */
export const MARKETPLACE_FEE_PCT = 15;

/* LYS Day is annual, late April. */
export const LYS_DAY_MONTH = 4;

/* Who Pays Knitters guidance: every agreement should be signed and cover costs,
   payment, rights, responsibilities, nullification clause, and deadlines. */
export const CONTRACT_CHECKLIST = [
  'Costs (who pays tech edit, photography, sample finishing)',
  'Payment (amount, schedule, late-payment terms)',
  'Rights (exact grant, expiry, resale permissions)',
  'Responsibilities (deliverables list with counts and deadlines)',
  'Nullification clause (what happens if the company goes dark)',
  'Deadlines (design, deliverables, and release dates)',
];

/* ------------------------------------------------------------------ */
/* Value helpers                                                      */
/* ------------------------------------------------------------------ */

function rightsPenalty(o: DealOffer): number {
  const selfPub = selfPublishValue(o);
  switch (o.rights) {
    case 'keepAll': return 0;
    /* Partial exclusivity: designer loses ~6-12 mo of prime-window sales.
       Assume 45% of 12-month sales fall in the first exclusivity window. */
    case 'partialExclusivity':
      return o.exclusiveListed ? selfPub * 0.45 : selfPub * 0.25;
    /* Partial royalty: company shares sales but designer keeps listing — penalty is
       the share given away. Assume 20% of platform-net self-publish value. */
    case 'partialRoyalty': return selfPub * (1 - MARKETPLACE_FEE_PCT / 100) * 0.2;
    /* Full transfer: designer loses everything beyond the fee forever;
       assume 3 years of self-publish value as surrender. */
    case 'fullTransfer': return selfPub * 3;
  }
}

export function selfPublishValue(o: DealOffer): number {
  return o.patternPrice * o.expectedUnitSales12m;
}

/* ------------------------------------------------------------------ */
/* Core analysis                                                      */
/* ------------------------------------------------------------------ */

export function analyzePartnerDeal(o: DealOffer): DealAnalysis {
  const selfPub = selfPublishValue(o);
  const platformNet = selfPub * (1 - MARKETPLACE_FEE_PCT / 100);

  let cashValue = 0;
  switch (o.dealType) {
    case 'yarnSupport': cashValue = o.yarnValue; break;
    case 'idpListing':
      /* Designer keeps (100 - idpFee)% of each sale, through company audience reach.
         Marketing reach lifts unit sales proportionally: base sales * (1 + reach/100). */
      cashValue = selfPub * (1 - o.idpFeePct / 100) * (1 + o.marketingReach / 100);
      break;
    case 'lumpSum': cashValue = o.offeredAmount; break;
    case 'exclusivityWindow':
      cashValue = o.offeredAmount + (o.exclusiveListed ? 0 : platformNet * 0.55);
      break;
    case 'lysDayExclusive':
      /* LYS Day exclusive rides an annual coordinated traffic spike: window sales
         are roughly 1.5x the rate-equivalent of the normal window share (30/365). */
      cashValue = selfPub * (o.lysDayWindowDays / 365) * 1.5 * (1 - MARKETPLACE_FEE_PCT / 100);
      break;
    case 'kalHost':
      /* Company hosts the KAL and promotes it; designer keeps listing revenue and gains
         audience exposure valued at $0.005 per follower (reach-based attribution floor). */
      cashValue = platformNet * (1 + o.marketingReach / 300) + o.kalfollowers * 0.005;
      break;
  }

  const penalty = rightsPenalty(o);
  const totalValue = cashValue + platformNet - penalty - o.productionCost;
  const effectiveHourly = o.hoursWorked > 0 ? totalValue / o.hoursWorked : 0;
  const deliverablesPerHour = o.hoursWorked > 0 ? o.deliverablesCount / o.hoursWorked : 0;
  const redFlags = computeRedFlags(o, effectiveHourly);

  /* Verdict ladder */
  let verdict: DealAnalysis['verdict'];
  let verdictNote = '';

  /* $30/hr pattern-design benchmark (from the Hire vs Self tab economics):
     partnership work below that rate is worse than selling patterns directly. */
  if (effectiveHourly >= 60 && redFlags.length === 0) {
    verdict = 'great';
    verdictNote = `~$${effectiveHourly.toFixed(0)}/hr — well above the pattern-design benchmark. Take it and protect the contract terms.`;
  } else if (effectiveHourly >= 30) {
    verdict = 'good';
    verdictNote = `~$${effectiveHourly.toFixed(0)}/hr — a fair partnership that beats doing nothing. Negotiate the weaker terms first.`;
  } else if (effectiveHourly >= 15) {
    verdict = 'hold';
    verdictNote = `~$${effectiveHourly.toFixed(0)}/hr — below the $30/hr pattern-design benchmark. Take it only for the audience exposure, and only after re-pricing the fee.`;
  } else if (effectiveHourly >= 0) {
    verdict = 'rethink';
    verdictNote = `~$${effectiveHourly.toFixed(0)}/hr — the deal works against you. Either the fee is too low or the rights grant is too wide. Renegotiate before signing.`;
  } else {
    verdict = 'skip';
    verdictNote = `~$${effectiveHourly.toFixed(0)}/hr — this offer pays you to lose money after rights surrender. Decline or flip it into a yarn-support-only deal with no exclusivity.`;
  }

  return {
    cashValue,
    selfPublishValue12m: selfPub,
    platformNetSelfPublish: platformNet,
    totalValue12m: totalValue,
    effectiveHourly,
    verdict,
    verdictNote,
    rightsPenalty: penalty,
    redFlags,
    deliverablesPerHour,
    pitchScore: computePitchScore(o),
    pitchGaps: computePitchGaps(o),
    ...(o.dealType === 'lysDayExclusive' ? { annualEventNote: 'LYS Day runs annually in late April — a coordinated traffic spike across every participating shop. Exclusive-window deals signed for April ride the biggest single day in indie yarn retail.' } : undefined),
  };
}

export function computeRedFlags(o: DealOffer, effectiveHourly: number): RedFlag[] {
  const flags: RedFlag[] = [];
  /* YP-01: Full rights transfer without a garment-scale fee. */
  if (o.rights === 'fullTransfer' && o.offeredAmount < MARKER_GARMENT_RATE_MIN) {
    flags.push({ code: 'YP-01', text: `Full rights transfer for $${o.offeredAmount.toLocaleString()} — garment buyouts start around $${MARKER_GARMENT_RATE_MIN.toLocaleString()} (accessory average is $${WPK_ACCESSORY_RATE_AVG}).` });
  }
  /* YP-02: IDP fee above the 15% market norm. */
  if (o.dealType === 'idpListing' && o.idpFeePct > 15) {
    flags.push({ code: 'YP-02', text: `${o.idpFeePct}% platform fee exceeds the 15% norm (Knit Picks IDP, WeCrochet). Standard ask: 10-15%.` });
  }
  /* YP-03: Exclusivity longer than 12 months. */
  if (o.exclusivityMonths > 12) {
    flags.push({ code: 'YP-03', text: `${o.exclusivityMonths}-month exclusivity — the market norm is 6-12 months, after which all rights revert to you.` });
  }
  /* YP-04: Yarn-only pay with high production costs and deliverables. */
  if (o.dealType === 'yarnSupport' && o.productionCost > o.yarnValue * 1.5 && o.deliverablesCount >= 3) {
    flags.push({ code: 'YP-04', text: 'Yarn-only pay with 3+ deliverables and production cost over 1.5x the yarn value — the industry red-flag pattern for underpaid garment work.' });
  }
  /* YP-05: Effective hourly under $10. */
  if (effectiveHourly > 0 && effectiveHourly < 10) {
    flags.push({ code: 'YP-05', text: `Effective rate ~$${effectiveHourly.toFixed(0)}/hr — below craft-industry sustainability; sets a bad precedent for every designer after you.` });
  }
  /* YP-06: lump sum below accessory floor for garment-scale work. */
  if (o.dealType === 'lumpSum' && o.offeredAmount < WPK_ACCESSORY_RATE_MIN && o.hoursWorked >= 15) {
    flags.push({ code: 'YP-06', text: `Lump sum $${o.offeredAmount} for 15+ hours — under the $${WPK_ACCESSORY_RATE_MIN} accessory floor from Who Pays Knitters.` });
  }
  return flags;
}

/* ------------------------------------------------------------------ */
/* Pitch readiness                                                    */
/* ------------------------------------------------------------------ */

export interface PitchInput {
  hasConceptBrief: boolean;
  hasSketches: boolean;
  hasYarnSpec: boolean;      // weight / fiber / color theme identified
  hasTimeline: boolean;      // release date + yarn needed-by date
  hasMarketingPlan: boolean; // what you'll deliver to the company (posts, KAL, etc.)
  portfolioPatterns: number;
  hasAudienceStats: boolean; // list size / followers ready to share
}

export const DEFAULT_PITCH: PitchInput = {
  hasConceptBrief: true,
  hasSketches: false,
  hasYarnSpec: true,
  hasTimeline: true,
  hasMarketingPlan: false,
  portfolioPatterns: 5,
  hasAudienceStats: true,
};

export function computePitchScore(o: DealOffer): number {
  /* How well-prepared the designer is to pitch this deal type.
     (UI layer provides PitchInput; the deal itself contributes structure.) */
  let score = 30;
  if (o.dealType === 'yarnSupport' || o.dealType === 'kalHost') score += 15;
  if (o.dealType === 'idpListing') score += 10;
  if (o.yarnValue > 0) score += 10;
  if (o.marketingReach >= 50) score += 10;
  if (o.hoursWorked > 0) score += 10;
  return Math.min(100, score);
}

export function computePitchGaps(o: DealOffer): string[] {
  const gaps: string[] = [];
  if (o.deliverablesCount >= 3 && o.hoursWorked < 20) {
    gaps.push('Many deliverables against few hours — the dyer-workflow failure mode; price the deliverables explicitly in the agreement.');
  }
  if (o.dealType === 'lysDayExclusive' && o.lysDayWindowDays > 60) {
    gaps.push('LYS Day is an April spike; a window longer than ~60 days dilutes the "exclusive" promise to shops.');
  }
  if (o.exclusivityMonths > 0 && o.exclusiveListed && o.expectedUnitSales12m > 500) {
    gaps.push('High expected sales + locked self-publishing — negotiate a buyout that prices the window against 45% of 12-month sales.');
  }
  if (o.productionCost > 0 && o.dealType !== 'yarnSupport') {
    gaps.push('Production costs (tech edit, photography) are yours in most partnership models — confirm who pays in the signed agreement.');
  }
  return gaps;
}

export function scorePitch(p: PitchInput): { score: number; gaps: string[] } {
  const gaps: string[] = [];
  let score = 0;
  if (p.hasConceptBrief) score += 20; else gaps.push('Concept brief — dyers want the design idea, not a request for free yarn.');
  if (p.hasSketches) score += 15; else gaps.push('Sketches / swatch photos — more detail in the first email meaningfully lifts response rates.');
  if (p.hasYarnSpec) score += 15; else gaps.push('Yarn spec (weight, fiber, color theme) — dyers ask for this in reply; send it up front.');
  if (p.hasTimeline) score += 20; else gaps.push('Timeline (yarn needed-by + release date) — dyers re-plan dye schedules around it.');
  if (p.hasMarketingPlan) score += 15; else gaps.push('Marketing plan (what you post, when, to whom) — this is the dyer\'s actual ROI.');
  if (p.portfolioPatterns >= 3) score += 10; else gaps.push('Portfolio of 3+ published patterns — the minimum dyers ask for.');
  if (p.hasAudienceStats) score += 5; else gaps.push('Audience stats (list size, followers) — include them in the pitch email.');
  return { score: Math.min(100, score), gaps };
}

/* ------------------------------------------------------------------ */
/* Pitch pipeline                                                     */
/* ------------------------------------------------------------------ */

export interface PipelineSummary {
  open: PitchEntry[];
  cashInFlight: number;
  avgDaysToDeadline: number;
  byStatus: Record<PitchStatus, number>;
}

export function summarizePipeline(pitches: PitchEntry[]): PipelineSummary {
  const open = pitches.filter((p) => p.status !== 'closed' && p.status !== 'delivered');
  const cashInFlight = open.reduce((sum, p) => sum + p.amount, 0);
  const now = Date.now();
  const days = open
    .map((p) => (new Date(p.dueDate).getTime() - now) / 86400000)
    .filter((d) => d > 0);
  const avgDaysToDeadline = days.length > 0 ? days.reduce((a, b) => a + b, 0) / days.length : 0;
  const byStatus = { draft: 0, pitched: 0, yarnReceived: 0, inDesign: 0, delivered: 0, closed: 0 } as Record<PitchStatus, number>;
  for (const p of pitches) byStatus[p.status] += 1;
  return { open, cashInFlight, avgDaysToDeadline, byStatus };
}

export const PITCH_STATUS_LABELS: Record<PitchStatus, string> = {
  draft: 'Draft',
  pitched: 'Pitched',
  yarnReceived: 'Yarn received',
  inDesign: 'In design',
  delivered: 'Delivered',
  closed: 'Closed',
};
