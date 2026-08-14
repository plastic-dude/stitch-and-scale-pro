/**
 * Teach economics — Decide, for a pattern or collection, whether teaching it
 * (course, cohort, Zoom series, guild flat-fee day, or LYS class) beats leaving
 * it to sell as a PDF — and price the offer with engineering rather than gut.
 *
 * Benchmarks baked in (session-35 research):
 * - Self-paced flagship courses: $500–600 standard tier (Pip & Pin $548 /
 *   $99x6; Kneedles & Life $99–125; market "most $500–600").
 * - Hosted workshops: flat teacher fee $300–1,000/day, tickets $75–150/day,
 *   break-even ~8 students, full house 15–20.
 * - Graduated per-student pay: $50/$75/$100 per class-hour at 1–8 / 9–16 / 17+ seats.
 * - Grassroots direct-charge: $100–150/day per student.
 * - LYS: ~$40/hr when full; small-group $5/person/hr; 1:1 ~$50/2h.
 * - Enrollment from an existing email list realistically 1–3%.
 * - Refund risk 5–10% of gross (30-day refund windows are standard).
 * - Platform economics: Kajabi/Podia take 0% on most plans but charge fixed
 *   monthly fees (~$159 and ~$39); Zoom $0–10/mo. Ravelry live classes take a
 *   small cut. Fixed monthly cost vs projected gross is the silent killer.
 */

export type TeachFormat =
  | 'selfPacedCourse'
  | 'cohortCourse'
  | 'zoomSeries'
  | 'guildFlatFee'
  | 'lysClass';

export const TEACH_FORMAT_LABELS: Record<TeachFormat, string> = {
  selfPacedCourse: 'Self-paced course (Kajabi/Podia/Teachable)',
  cohortCourse: 'Cohort course (fixed dates, live touchpoints)',
  zoomSeries: 'Live Zoom series',
  guildFlatFee: 'Guild / retreat flat-fee day',
  lysClass: 'LYS or studio class',
};

export const FORMAT_DAY_RATES: Record<TeachFormat, { low: number; high: number }> = {
  selfPacedCourse: { low: 0, high: 0 }, // per-student pricing instead
  cohortCourse: { low: 0, high: 0 },
  zoomSeries: { low: 30, high: 90 },
  guildFlatFee: { low: 300, high: 1000 },
  lysClass: { low: 30, high: 60 }, // per hour, when full
};

export const FORMAT_SESSION_COUNT: Record<TeachFormat, number> = {
  selfPacedCourse: 1,
  cohortCourse: 6,
  zoomSeries: 6,
  guildFlatFee: 1,
  lysClass: 1,
};

export interface TeachInput {
  format: TeachFormat;
  /** Number of teaching sessions the offer contains (1 for a course, 6 for a series). */
  sessionCount?: number;
  /** Standard ticket price per student per session (or total for courses), $. */
  ticketPrice: number;
  /** Early-bird discount share, 0–0.5 (e.g. 0.15 = 15% off). */
  earlyBirdDiscount: number;
  /** Share of enrollees who buy the early-bird tier, 0–1. */
  earlyBirdShare: number;
  /** Installment plan premium on standard price, 0–0.25 (market norm 0.10–0.15). */
  installmentPremium: number;
  /** Share of enrollees on installments, 0–1. */
  installmentShare: number;
  /** Email list size used for the enrollment projection, 0–∞. */
  emailListSize: number;
  /** Conversion rate of the list assumed to enroll, 0.01–0.03 default. */
  listConversion: number;
  /** Expected paid students if enrollment is NOT list-derived (overrides). */
  expectedStudents: number;
  /** Hours to plan, record, market and deliver the whole offer. */
  prepHours: number;
  /** The designer's effective hourly rate (from their own income planner), $/hr. */
  hourlyRate: number;
  /** Platform + tooling monthly cost the offer carries, $. */
  platformMonthlyCost: number;
  /** Months the offer stays live/sells. */
  platformMonths: number;
  /** Materials, travel, venue cut or stipend offset, $ total. */
  materialCost: number;
  /** Refund share of gross, 0–0.2. */
  refundRate: number;
  /** Platform percentage cut of gross, 0–0.2 (Ravelry classes take a small cut; big platforms 0%). */
  platformCut: number;
  /** How much the same hours would earn per hour if spent selling PDFs instead, $/hr. */
  patternHourlyRate: number;
  /** Issue #26: hours per session used by the hosted-offer quick check (defaults 4). */
  hostedHoursPerSession?: number;
  /** Issue #26: session count used by the hosted-offer quick check (defaults 1). */
  hostedSessions?: number;
}

export const DEFAULT_TEACH: TeachInput = {
  format: 'selfPacedCourse',
  ticketPrice: 125,
  earlyBirdDiscount: 0.15,
  earlyBirdShare: 0.4,
  installmentPremium: 0.12,
  installmentShare: 0.25,
  emailListSize: 800,
  listConversion: 0.02,
  expectedStudents: 0,
  prepHours: 60,
  hourlyRate: 50,
  platformMonthlyCost: 39,
  platformMonths: 12,
  materialCost: 0,
  refundRate: 0.07,
  platformCut: 0,
  patternHourlyRate: 32,
};

export interface TicketEcon {
  standard: number;
  earlyBird: number;
  installment: number;
  /** Blended average revenue per student. */
  blended: number;
}

export interface TeachResult {
  tickets: TicketEcon;
  /** Students the list projection (or manual override) puts in seats. */
  students: number;
  /** Full-price gross before refunds and platform cut. */
  gross: number;
  netOfRefunds: number;
  netOfPlatform: number;
  platformCost: number;
  productionCost: number;
  materialCost: number;
  /** Net profit after every deduction. */
  profit: number;
  /** Break-even students at the blended ticket. */
  breakEvenStudents: number;
  /** Weeks of revenue to recover production cost. */
  paybackWeeks: number | null;
  /** Effective $/hour of the designer's own time in this offer. */
  effectiveHourlyRate: number;
  /** Ratio of this offer's $/hr to selling patterns for the same hours. */
  vsPatternMultiple: number;
  /** Break-even seats ÷ full house capacity guidance for hosted formats. */
  fillRatio: number;
  verdict: 'skip' | 'hold' | 'launch';
  verdictReason: string;
  redFlags: { id: string; label: string; detail: string }[];
  suggestion: string;
}

/** Blended ticket price given the pricing ladder inputs. */
export function computeTickets(input: Pick<TeachInput,
  'ticketPrice' | 'earlyBirdDiscount' | 'earlyBirdShare' | 'installmentPremium' | 'installmentShare'>): TicketEcon {
  const standard = input.ticketPrice;
  const earlyBird = Math.round(standard * (1 - Math.max(0, Math.min(0.5, input.earlyBirdDiscount))) * 100) / 100;
  const installment = Math.round(standard * (1 + Math.max(0, Math.min(0.25, input.installmentPremium))) * 100) / 100;
  const ebShare = Math.max(0, Math.min(1, input.earlyBirdShare));
  const insShare = Math.max(0, Math.min(1 - ebShare, input.installmentShare));
  const remainingShare = 1 - ebShare - insShare;
  const blended = Math.round(
    (standard * remainingShare + earlyBird * ebShare + installment * insShare) * 100,
  ) / 100;
  return { standard, earlyBird, installment, blended };
}

/** Projected enrollment: manual override, else list-derived. */
export function projectStudents(input: Pick<TeachInput, 'expectedStudents' | 'emailListSize' | 'listConversion'>): number {
  if (input.expectedStudents > 0) return input.expectedStudents;
  return Math.max(0, Math.round(input.emailListSize * Math.max(0.001, Math.min(0.1, input.listConversion))));
}

/**
 * Full teaching-economics analysis for one offer.
 */
export function analyzeTeachingOffer(raw: Partial<TeachInput>): TeachResult {
  const input = { ...DEFAULT_TEACH, ...raw } as TeachInput;
  const tickets = computeTickets(input);
  const students = Math.max(0, Math.round(projectStudents(input)));

  // Course formats price the whole offer once per student (the flagship
  // benchmark is $548 for the entire course, not per lesson); series and class
  // formats charge per session and scale by session count.
  // Course formats price the whole offer once per student (the flagship
  // benchmark is $548 for the entire course, not per lesson); series and class
  // formats charge per session and scale by session count; hosted flat-fee
  // formats charge the fee once, with the students figure representing the
  // organizer's audience (not multiplied).
  const sessions = Math.max(1, Math.round(input.sessionCount ?? FORMAT_SESSION_COUNT[input.format]));
  const pricesOnce = input.format === 'selfPacedCourse' || input.format === 'cohortCourse' ||
    input.format === 'guildFlatFee';
  // Issue #29 residual fix: flat-fee hosted formats (guild day rate, LYS class rate) have no
  // per-student cohort pricing, so early-bird/installment blending is meaningless there —
  // blending silently shaded the contract fee to ~94% with default shares. Use the raw
  // ticketPrice (the contract day fee) as the gross input for those formats; blending stays
  // for per-student cohort formats where the ladder is genuinely a marketing mix.
  const usesBlendedTicket = input.format !== 'guildFlatFee' && input.format !== 'lysClass';
  const baseTicket = usesBlendedTicket ? tickets.blended : tickets.standard;
  const perStudentTotal = baseTicket * (pricesOnce ? 1 : sessions);
  const studentMultiplier = input.format === 'guildFlatFee' ? 1 : students;
  const gross = Math.round(perStudentTotal * studentMultiplier * 100) / 100;

  const refundLoss = Math.round(gross * Math.max(0, Math.min(0.5, input.refundRate)) * 100) / 100;
  const netOfRefunds = gross - refundLoss;
  const platformCutCost = Math.round(netOfRefunds * Math.max(0, Math.min(0.5, input.platformCut)) * 100) / 100;
  const netOfPlatform = netOfRefunds - platformCutCost;
  const platformCost = Math.round(input.platformMonthlyCost * Math.max(0, input.platformMonths) * 100) / 100;
  const materialCost = Math.round(Math.max(0, input.materialCost) * 100) / 100;
  const productionCost = Math.round(Math.max(0, input.prepHours) * Math.max(0, input.hourlyRate) * 100) / 100;

  const profit = Math.round((netOfPlatform - platformCost - materialCost - productionCost) * 100) / 100;

  const fixedCosts = productionCost + platformCost + materialCost;
  const breakEvenStudents = perStudentTotal > 0
    ? Math.round((fixedCosts / perStudentTotal) * 100) / 100
    : Infinity;

  const weeklyRevenue = gross > 0 ? gross / 26 : 0;
  const paybackWeeks = productionCost > 0 && weeklyRevenue > 0
    ? Math.round((productionCost / weeklyRevenue) * 10) / 10
    : productionCost <= 0
      ? 0
      : null;

  const totalHours = Math.max(0.5, input.prepHours);
  const effectiveHourlyRate = Math.round((profit / totalHours) * 100) / 100;
  const patternRate = Math.max(0, input.patternHourlyRate);
  const vsPatternMultiple = patternRate > 0
    ? Math.round((effectiveHourlyRate / patternRate) * 100) / 100
    : 0;

  // Fill ratio for hosted formats: break-even vs a full house. Course formats
  // have no capacity constraint (seats are unlimited), so fill ratio is 0.
  const capacity = input.format === 'guildFlatFee' ? 15 : input.format === 'lysClass' ? 6 : input.format === 'zoomSeries' ? 20 : 0;
  const fillRatio = capacity > 0 && perStudentTotal > 0
    ? Math.round((fixedCosts / perStudentTotal / capacity) * 100) / 100
    : 0;

  const redFlags: TeachResult['redFlags'] = [];

  // T-01: enrollment projection can't reach break-even even at optimistic list conversion.
  if (students > 0 && students < breakEvenStudents) {
    redFlags.push({
      id: 'T-01',
      label: 'Projected seats miss break-even',
      detail: `${students} projected students need ${Math.ceil(breakEvenStudents)} to cover production, platform and materials.`,
    });
  }
  // T-02: platform fixed cost dominates projected gross.
  if (platformCost > 0 && gross > 0 && platformCost / gross > 0.3) {
    redFlags.push({
      id: 'T-02',
      label: 'Platform costs eat the offer',
      detail: `$${platformCost.toFixed(0)} of fixed tooling vs $${gross.toFixed(0)} gross — a fixed-fee-free platform (or a longer runway) is needed.`,
    });
  }
  // T-03: hosted day priced below the market floor ($75/day ticket in North America).
  if ((input.format === 'guildFlatFee' || input.format === 'lysClass') && input.ticketPrice < 60) {
    redFlags.push({
      id: 'T-03',
      label: 'Below market floor',
      detail: 'Fiber-workshop tickets run $75–150/day in North America; below ~$60/day underprices even a first class.',
    });
  }
  // T-04: huge prep load with a list too small to fill it.
  if (input.prepHours > 50 && input.emailListSize < 2000 && students < 40) {
    redFlags.push({
      id: 'T-04',
      label: 'Big build, small audience',
      detail: `${input.prepHours}h of production against a ${input.emailListSize}-subscriber list projects ${students} enrollees — a cohort or guild format monetizes that content with far less risk.`,
    });
  }
  // T-05: flat-fee day below the travel-and-time floor.
  if (input.format === 'guildFlatFee' && input.ticketPrice === 0 && input.materialCost === 0 &&
      input.prepHours > 8) {
    // ticketPrice 0 means flat-fee mode: gross counts the fee itself via
    // materialCost field reuse — see note below; keep this purely a heuristic.
    void gross;
  }
  if (input.format === 'guildFlatFee' && gross > 0 && gross < input.prepHours * Math.max(20, input.hourlyRate * 0.6)) {
    redFlags.push({
      id: 'T-05',
      label: 'Flat fee under the floor',
      detail: 'The hosted model pays teachers $300–1,000/day; this day rates below the time floor.',
    });
  }

  let verdict: TeachResult['verdict'] = 'launch';
  let verdictReason = '';
  if (redFlags.some(f => f.id === 'T-01') || (students > 0 && fillRatio > 1)) {
    verdict = 'skip';
    verdictReason = 'The offer loses money at the projected enrollment — reformat before launching.';
  } else if (effectiveHourlyRate < patternRate * 0.8 || paybackWeeks !== null && paybackWeeks > 26) {
    verdict = 'hold';
    verdictReason = 'It pays less than the same hours would earn selling patterns, or takes more than half a year to pay back — grow the list or shrink the build first.';
  } else if (redFlags.length > 0) {
    verdict = 'hold';
    verdictReason = 'Profitable, but flagged economics should be fixed before launch.';
  } else {
    verdict = 'launch';
    verdictReason = 'Pays more per hour than patterns and covers costs at the projected enrollment.';
  }

  let suggestion = '';
  if (verdict === 'skip' && input.format === 'selfPacedCourse') {
    suggestion = 'Drop to a cohort or Zoom series: fewer recorded hours, a fixed student count, and lower platform costs.';
  } else if (verdict === 'skip' && (input.format === 'guildFlatFee' || input.format === 'lysClass')) {
    suggestion = 'Raise the day rate toward $300–1,000 (hosted model) or ask the organizer for a graduated per-hour fee.';
  } else if (verdict === 'hold' && input.emailListSize < 2000) {
    suggestion = 'The list, not the offer, is the constraint — one launch-worthy newsletter funnel before recording anything.';
  } else if (verdict === 'hold' && input.prepHours > 50) {
    suggestion = 'Cut the build: 6–10 well-produced lessons beat 20 rushed ones, and refund risk falls with a tighter scope.';
  } else {
    suggestion = 'Launch with the early-bird window first (it funds the final polish) and keep the 30-day refund window — it is market-standard and costs ~refund-rate.';
  }

  return {
    tickets,
    students,
    gross,
    netOfRefunds,
    netOfPlatform,
    platformCost,
    productionCost,
    materialCost,
    profit,
    breakEvenStudents,
    paybackWeeks,
    effectiveHourlyRate,
    vsPatternMultiple,
    fillRatio,
    verdict,
    verdictReason,
    redFlags,
    suggestion,
  };
}

/**
 * Engineered tier ladder for the offer page: anchor → standard → early bird,
 * using market anchors ($500–600 flagship, $99–150 mini) and the standard
 * ~+10–15% installment premium.
 */
export interface PricingLadder {
  anchor: number;
  standard: number;
  earlyBird: number;
  installment: number;
}

export function buildPricingLadder(
  target: number,
  anchors?: { anchorPct?: number; earlyBirdPct?: number; installmentPct?: number },
): PricingLadder {
  const anchorPct = anchors?.anchorPct ?? 0.6; // flagship anchor at ~60% of price
  const earlyBirdPct = anchors?.earlyBirdPct ?? 0.15;
  const installmentPct = anchors?.installmentPct ?? 0.12;
  return {
    anchor: Math.round(target / Math.max(0.1, Math.min(1, anchorPct))),
    standard: Math.round(target * 100) / 100,
    earlyBird: Math.round(target * (1 - Math.max(0, Math.min(0.5, earlyBirdPct))) * 100) / 100,
    installment: Math.round(target * (1 + Math.max(0, Math.min(0.25, installmentPct))) * 100) / 100,
  };
}

/**
 * Hosted-format quick check: given an organizer's offer, what the teacher
 * actually nets per hour of their own time, and whether it clears the pattern
 * alternative. Handles flat-fee days AND graduated per-hour pay.
 */
export function analyzeHostedOffer(input: {
  model: 'flatFee' | 'graduated' | 'perStudent';
  flatFee?: number;
  /** Graduated: [minStudents, maxStudents, ratePerHour][] or rate lookup. */
  graduatedRates?: { min: number; max: number; ratePerHour: number }[];
  students?: number;
  hoursPerSession?: number;
  sessions?: number;
  hourlyRate: number;
  patternHourlyRate: number;
  /** Teacher's out-of-pocket travel/materials. */
  outOfPocket?: number;
  /** Per-student charge if model is perStudent. */
  perStudentPrice?: number;
}): {
  net: number;
  effectiveHourlyRate: number;
  vsPatternMultiple: number;
  advice: string;
} {
  const hoursPerSession = Math.max(0.5, input.hoursPerSession ?? 4);
  const sessions = Math.max(1, Math.round(input.sessions ?? 1));
  const totalHours = hoursPerSession * sessions;
  const outOfPocket = Math.max(0, input.outOfPocket ?? 0);

  let net = 0;
  if (input.model === 'flatFee') {
    net = Math.max(0, input.flatFee ?? 0) - outOfPocket;
  } else if (input.model === 'graduated' && input.graduatedRates?.length) {
    const s = Math.max(0, input.students ?? 0);
    const tier = input.graduatedRates.find(t => s >= t.min && s <= t.max);
    const rate = tier ? tier.ratePerHour : (input.graduatedRates[0]?.ratePerHour ?? 0);
    net = rate * totalHours - outOfPocket;
  } else if (input.model === 'perStudent' && input.perStudentPrice) {
    net = Math.max(0, input.perStudentPrice ?? 0) * Math.max(0, input.students ?? 0) - outOfPocket;
  }

  const effectiveHourlyRate = Math.round((net / totalHours) * 100) / 100;
  const patternRate = Math.max(0.01, input.patternHourlyRate);
  const vsPatternMultiple = Math.round((effectiveHourlyRate / patternRate) * 100) / 100;

  let advice = '';
  if (net <= 0) {
    advice = 'This gig loses money after out-of-pocket costs — decline or renegotiate travel.';
  } else if (effectiveHourlyRate < input.hourlyRate * 0.8) {
    advice = 'Below your own rate; ask for the graduated-fee model ($50/75/100 per class-hour by enrollment) or a day rate nearer $300–1,000.';
  } else if (vsPatternMultiple < 1) {
    advice = 'Slightly above your rate but below what the same hours earn from patterns — only take it if the marketing draw is worth it.';
  } else {
    advice = 'Clears your hourly rate and the pattern alternative — take it and ask the organizer for repeat bookings.';
  }

  return { net: Math.round(net * 100) / 100, effectiveHourlyRate, vsPatternMultiple, advice };
}

/**
 * Session-49: platform-compare engine.
 *
 * The single flaw every course platform shares: none of them reports what a
 * teacher earns per hour of their own life. This engine normalizes the five
 * models an indie designer realistically faces — self-hosted course, flat-fee
 * day, per-seat class, minutes-royalty (Skillshare-style) and coupon-eroded
 * rev share (Udemy-style) — onto the same denominator: effective net $ per
 * teacher-hour (production hours dominate; delivery is normalized where
 * relevant). Every constant below is sourced in the session-49 research file
 * (competitors-session-49-course-platform-market.md).
 */

export type TeachIncomeModel =
  | 'selfHosted'      // self-hosted course (Kajabi/Podia/Teachable) — keep 95%+, flat tooling fee
  | 'flatFeeDay'      // guild/retreat day rate (market $300-1,000/day)
  | 'perSeatClass'    // per-seat LYS/studio class (market $75-150/day/student)
  | 'minutesRoyalty'  // Skillshare-style: 30% of platform membership revenue, share by paid minutes
  | 'erodedRevShare'; // Udemy-style: rev share lands 15-20% after coupons

export const TEACH_MODEL_LABELS: Record<TeachIncomeModel, string> = {
  selfHosted: 'Self-hosted course',
  flatFeeDay: 'Flat-fee day',
  perSeatClass: 'Per-seat class',
  minutesRoyalty: 'Minutes-royalty pool',
  erodedRevShare: 'Coupon-eroded rev share',
};

export interface PlatformCompareInput {
  /** List price the designer would set for the offer, $. */
  listPrice: number;
  /** Expected paid students/buyers for the offer's lifetime. */
  buyers: number;
  /** Hours to produce (record, edit, prep materials) the offer. */
  productionHours: number;
  /** Fixed platform/tooling cost the offer carries, $ lifetime. */
  platformCost: number;
  /** For perSeatClass: number of students per seat slot (capacity). */
  seatsPerSlot?: number;
  /** For minutesRoyalty: platform's monthly revenue pool, $ (default 30% share basis). */
  poolRevenue?: number;
  /** For minutesRoyalty: the designer's projected share of paid minutes, 0-1. */
  minutesShare?: number;
  /** For minutesRoyalty: months of royalty income expected. */
  royaltyMonths?: number;
  /** For erodedRevShare: effective platform share after coupons, 0-1 (Udemy now ~0.80-0.85). */
  platformShare?: number;
  /** For flatFeeDay: organizer's day fee, $ (defaults to listPrice). */
  dayFee?: number;
  /** Hours the designer spends delivering on-site/online beyond production. */
  deliveryHours?: number;
  /** Out-of-pocket travel/materials, $. */
  outOfPocket?: number;
  /** The designer's effective pattern-selling hourly rate for the comparison banner, $/hr. */
  patternHourlyRate?: number;
}

export interface PlatformModelRow {
  model: TeachIncomeModel;
  label: string;
  /** Net profit after every deduction, $. */
  net: number;
  /** Total teacher-hours consumed (production + delivery). */
  totalHours: number;
  /** Effective net $ per teacher-hour. */
  hourlyNet: number;
  /** Ratio vs pattern-selling rate. */
  vsPattern: number;
  /** One-line note keyed to the documented market data. */
  note: string;
  redFlags: { id: string; detail: string }[];
}

export interface PlatformCompareResult {
  rows: PlatformModelRow[];
  /** The model row with the highest hourly net. */
  winner: TeachIncomeModel;
  winnerHourlyNet: number;
  verdict: 'skip' | 'hold' | 'launch';
  verdictReason: string;
  suggestion: string;
}

/**
 * Normalize a flat fee or per-seat revenue line against production + delivery
 * hours, subtracting out-of-pocket costs. Delivery hours are added only for
 * models where the teacher must physically show up (day fee, per-seat class);
 * a recorded course monetizes production hours once and sells afterwards.
 */
function netPerHour(opts: {
  revenue: number;
  productionHours: number;
  deliveryHours: number;
  platformCost: number;
  outOfPocket: number;
  patternHourlyRate: number;
}): { net: number; totalHours: number; hourlyNet: number; vsPattern: number } {
  const net = Math.round((Math.max(0, opts.revenue) - opts.platformCost - opts.outOfPocket) * 100) / 100;
  const totalHours = Math.max(0.5, opts.productionHours + Math.max(0, opts.deliveryHours));
  const hourlyNet = Math.round((net / totalHours) * 100) / 100;
  const patternRate = Math.max(0.01, opts.patternHourlyRate);
  const vsPattern = Math.round((hourlyNet / patternRate) * 100) / 100;
  return { net, totalHours, hourlyNet, vsPattern };
}

/**
 * Compare the five teaching-income models a designer faces for one offer, all
 * normalized to effective $/teacher-hour. Returns rows ranked worst-first so
 * UI tables read bottom (best) to top.
 */
export function analyzePlatformModels(raw: Partial<PlatformCompareInput>): PlatformCompareResult {
  const input: PlatformCompareInput = {
    listPrice: 0,
    buyers: 0,
    productionHours: 0,
    platformCost: 0,
    seatsPerSlot: 0,
    poolRevenue: 0,
    minutesShare: 0,
    royaltyMonths: 12,
    platformShare: 0.15,
    dayFee: 0,
    deliveryHours: 0,
    outOfPocket: 0,
    patternHourlyRate: 0,
    ...raw,
  };
  const buyers = Math.max(0, input.buyers ?? 0);
  const prod = Math.max(0, input.productionHours ?? 0);
  const fixed = Math.max(0, input.platformCost ?? 0);
  const oop = Math.max(0, input.outOfPocket ?? 0);
  const patternRate = Math.max(0.01, input.patternHourlyRate ?? 32);
  const seatsPerSlot = Math.max(0, Math.round(input.seatsPerSlot ?? 10));
  const poolRevenue = Math.max(0, input.poolRevenue ?? 0);
  const minutesShare = Math.max(0, Math.min(1, input.minutesShare ?? 0));
  const royaltyMonths = Math.max(1, Math.round(input.royaltyMonths ?? 12));
  const platformShare = Math.max(0, Math.min(1, input.platformShare ?? 0.15));
  const dayFee = input.dayFee && input.dayFee > 0 ? input.dayFee : input.listPrice;
  const delivery = Math.max(0, input.deliveryHours ?? 0);

  const rows: PlatformModelRow[] = [];

  // 1) Self-hosted course: keep ~95% (payment processing ~5%), fixed tooling cost only.
  {
    const revenue = Math.round(buyers * Math.max(0, input.listPrice) * 0.95 * 100) / 100;
    const m = netPerHour({ revenue, productionHours: prod, deliveryHours: 0, platformCost: fixed, outOfPocket: oop, patternHourlyRate: patternRate });
    rows.push({
      model: 'selfHosted',
      label: TEACH_MODEL_LABELS.selfHosted,
      net: m.net,
      totalHours: m.totalHours,
      hourlyNet: m.hourlyNet,
      vsPattern: m.vsPattern,
      note: 'Keep ~95% after payment processing; tooling is a flat $/mo, not a cut — the only model where a bigger list scales the return linearly.',
      redFlags: [
        ...(buyers * input.listPrice === 0 ? [{ id: 'P-01', detail: 'No sales priced in — self-hosted needs a list or an audience to fill the tooling cost.' }] : []),
        ...(fixed > buyers * input.listPrice * 0.3 && buyers > 0 ? [{ id: 'P-02', detail: `Tooling ($${fixed}) eats >30% of gross — cut fixed costs or extend the runway.` }] : []),
      ],
    });
  }

  // 2) Flat-fee day: market $300-1,000/day; production hours are unpaid prep.
  {
    const fee = Math.max(0, dayFee);
    const m = netPerHour({ revenue: fee, productionHours: prod, deliveryHours: delivery, platformCost: 0, outOfPocket: oop, patternHourlyRate: patternRate });
    const inBand = fee >= 300 && fee <= 1000;
    rows.push({
      model: 'flatFeeDay',
      label: TEACH_MODEL_LABELS.flatFeeDay,
      net: m.net,
      totalHours: m.totalHours,
      hourlyNet: m.hourlyNet,
      vsPattern: m.vsPattern,
      note: inBand
        ? 'Inside the documented $300–1,000 hosted-model band; the day fee is fixed no matter how many prep hours it takes.'
        : 'Below the $300 floor — every unpaid prep hour drags the hourly rate down.',
      redFlags: [
        ...(fee < 300 && fee > 0 ? [{ id: 'P-03', detail: `Fee ($${fee}) is under the $300 market floor — UK shop rates run £175–200/6h (~$30-34/hr gross) before prep.` }] : []),
        ...(prod > 8 && fee > 0 && fee / Math.max(0.5, prod + delivery) < 20 ? [{ id: 'P-04', detail: 'Heavy prep against a flat fee: unpaid prep collapses the hourly rate — negotiate prep pay or a higher fee.' }] : []),
      ],
    });
  }

  // 3) Per-seat class: $75-150/day/student market; teacher nets the seat price × seats, minus the shop's take if any.
  {
    const seatPrice = Math.max(0, input.listPrice);
    const capacitySeats = seatsPerSlot > 0 ? seatsPerSlot : 10;
    const revenue = Math.round(buyers * seatPrice * 100) / 100;
    // A one-slot class sells one seat per registered student; buyers here is total registrations.
    const m = netPerHour({ revenue, productionHours: prod, deliveryHours: delivery, platformCost: 0, outOfPocket: oop, patternHourlyRate: patternRate });
    rows.push({
      model: 'perSeatClass',
      label: TEACH_MODEL_LABELS.perSeatClass,
      net: m.net,
      totalHours: m.totalHours,
      hourlyNet: m.hourlyNet,
      vsPattern: m.vsPattern,
      note: buyers <= capacitySeats
        ? `Class fills within one ${capacitySeats}-seat slot — shop take (~50% typical when the shop runs signups) halves this if not already deducted.`
        : `Spans ${Math.ceil(buyers / Math.max(1, capacitySeats))} slots — the shop take stacks per slot; deduct ~50% if the organizer collects.`,
      redFlags: [
        ...(seatPrice > 0 && seatPrice < 25 ? [{ id: 'P-05', detail: "Seat price under ~$25 erodes fast once the shop's cut and prep are counted." }] : []),
        ...(buyers > capacitySeats && capacitySeats > 0 ? [{ id: 'P-06', detail: "Multiple slots mean delivery hours repeat — count every slot's live hours." }] : []),
      ],
    });
  }

  // 4) Minutes-royalty pool (Skillshare-style): 30% of platform membership revenue is shared by paid minutes.
  {
    const pool = poolRevenue * 0.3;
    const monthly = Math.round(pool * minutesShare * 100) / 100;
    const revenue = Math.round(monthly * royaltyMonths * 100) / 100;
    const m = netPerHour({ revenue, productionHours: prod, deliveryHours: 0, platformCost: 0, outOfPocket: 0, patternHourlyRate: patternRate });
    rows.push({
      model: 'minutesRoyalty',
      label: TEACH_MODEL_LABELS.minutesRoyalty,
      net: m.net,
      totalHours: m.totalHours,
      hourlyNet: m.hourlyNet,
      vsPattern: m.vsPattern,
      note: `Skillshare directs 30% of membership revenue to a minutes-watched royalty pool (avg teacher ~$200/mo); your $${monthly.toFixed(0)}/mo is share-of-minutes, not sales — it decays as other classes grow.`.slice(0, 220),
      redFlags: [
        ...(minutesShare <= 0 || poolRevenue <= 0 ? [{ id: 'P-07', detail: 'No minutes share or pool revenue set — royalties are minutes-share-of-pool, not a price you control.' }] : []),
        ...(m.hourlyNet < 10 && m.totalHours > 1 ? [{ id: 'P-08', detail: 'Platform averages confirm: most teachers earn ~$200/mo — royalty income is a supplement, not a launch plan.' }] : []),
        ...(monthly > 400 ? [{ id: 'P-11', detail: `Projected $${monthly.toFixed(0)}/mo is 2×+ the ~$200/mo platform average — only realistic with an established library and heavy watch time; treat this row as an upside case, not a plan.` }] : []),
      ],
    });
  }

  // 5) Coupon-eroded rev share (Udemy-style): list price collapses to $9.99-19.99 and the teacher keeps 15-20% (eroding to 15%).
  {
    const couponPrice = 14.99; // typical couponed street price
    const perBuyer = couponPrice * platformShare;
    const revenue = Math.round(buyers * perBuyer * 100) / 100;
    const m = netPerHour({ revenue, productionHours: prod, deliveryHours: 0, platformCost: 0, outOfPocket: 0, patternHourlyRate: patternRate });
    rows.push({
      model: 'erodedRevShare',
      label: TEACH_MODEL_LABELS.erodedRevShare,
      net: m.net,
      totalHours: m.totalHours,
      hourlyNet: m.hourlyNet,
      vsPattern: m.vsPattern,
      note: `Students pay ~$${couponPrice.toFixed(2)} after coupons; you keep ${Math.round(platformShare * 100)}% — Udemy's share has eroded 37% → 20% → 15% by 2026, and the teacher never controls the street price.`,
      redFlags: [
        ...(platformShare < 0.2 ? [{ id: 'P-09', detail: 'Share at or below the current 15-20% erosion band — list-price promises are not what the coupon street pays.' }] : []),
        ...(buyers * couponPrice * platformShare > 0 && (buyers * couponPrice * platformShare) / Math.max(0.5, prod) < 10 ? [{ id: 'P-10', detail: 'Volume must be massive to clear $10/hr at this share — the platform wins the coupon war, not the teacher.' }] : []),
      ],
    });
  }

  const ranked = [...rows].sort((a, b) => a.hourlyNet - b.hourlyNet);
  const winner = ranked[ranked.length - 1];

  let verdict: PlatformCompareResult['verdict'] = 'launch';
  let verdictReason = '';
  let suggestion = '';
  if (winner.hourlyNet < 0) {
    verdict = 'skip';
    verdictReason = 'Every modeled route loses money at these inputs — the offer itself is underpriced or underbuilt.';
    suggestion = 'Raise the list price or cut production hours; a $0-or-worse winner means the content plan is too heavy for the audience.';
  } else if (winner.hourlyNet < patternRate * 0.8) {
    verdict = 'hold';
    verdictReason = `The best model nets $${winner.hourlyNet.toFixed(0)}/hr — below 80% of your $${patternRate.toFixed(0)}/hr pattern rate. The same hours sell PDFs better right now.`;
    suggestion = winner.model === 'flatFeeDay' || winner.model === 'perSeatClass'
      ? 'Negotiate prep pay on top of the fee, or attach a royalty clause — hosted formats win only when prep is priced in.'
      : winner.model === 'minutesRoyalty'
        ? 'Use royalties as the tail, not the head: launch self-hosted or per-seat first, then license to the pool for residual income.'
        : 'Build the audience first (the email list is the multiplier for self-hosted and eroded-share models), then record.';
  } else if (ranked.some(r => r.redFlags.length > 0) && winner.redFlags.length > 0) {
    verdict = 'hold';
    verdictReason = `Best hourly net is $${winner.hourlyNet.toFixed(0)}/hr (${winner.label}), but the winner carries flagged economics.`;
    suggestion = winner.redFlags[0].detail;
  } else {
    verdict = 'launch';
    verdictReason = `Best hourly net is $${winner.hourlyNet.toFixed(0)}/hr on ${winner.label} — above your $${patternRate.toFixed(0)}/hr pattern rate.`;
    suggestion = ranked.slice(0, 2).map(r => `${r.label}: $${r.hourlyNet.toFixed(0)}/hr`).join(' · ');
  }

  return { rows: ranked, winner: winner.model, winnerHourlyNet: winner.hourlyNet, verdict, verdictReason, suggestion };
}
