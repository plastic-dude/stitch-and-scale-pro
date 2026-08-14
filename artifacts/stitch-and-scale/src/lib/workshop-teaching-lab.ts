/**
 * Workshop Teaching Lab (CHK-064) — is this in-person workshop worth the
 * designer's hours, and where does the money actually go?
 *
 * Competitor flaw: teaching-monetization guides cover online courses and
 * festivals list their class schedules — but no tool models the same hours
 * across three earning paths. A designer accepting a fiber-festival
 * contract (per-student pay, self-funded hotel) can walk away negative
 * without realizing it; the #FairFiberWage fights at Interweave Yarn Fest
 * showed teachers earning as little as $25-60 for a full class of prep
 * and travel. Meanwhile LYS classes keep 50-80% of tickets with zero
 * travel. This lab prices the whole event: deal economics, break-even
 * students, slot-risk exposure, follow-up pattern attach, and the same
 * hours rerouted to patterns or an online course.
 */

export interface ClassDeal {
  /** Per-student gross fee in USD. */
  feePerStudent: number;
  /** Venue/organizer cut as a fraction of gross (0-1). */
  venueCut: number;
  /** Guaranteed minimum total payout in USD (0 = pure per-student, no floor). */
  guarantee: number;
  /** Travel + lodging total cost in USD. */
  travelCost: number;
  /** Materials cost per student the designer covers (0 = students pay separately). */
  materialsPerStudent: number;
}

export interface WorkshopTeachingInput {
  deal: ClassDeal;
  /** Minimum students the class needs to be confirmed. */
  studentsMin: number;
  /** Realistic expected student count. */
  studentsRealistic: number;
  /** Venue max capacity for the class. */
  studentsMax: number;
  /** Hours spent preparing (new content typically 2-4x class time). */
  prepHours: number;
  /** In-room teaching hours. */
  classHours: number;
  /** Follow-up pattern sales fraction of class roster (0-1). */
  followUpAttach: number;
  /** Price of the follow-up pattern. */
  followUpPrice: number;
  /** Your opportunity rate $/hour (what grading/pattern work pays). */
  hourlyRate: number;
  /** 0 = local LYS class, 1 = travel-day slot or bad-time conflict risk. */
  slotRisk: number;
  /** Whether the deal is a local LYS event (no travel, immediate yarn sales). */
  isLocalLys: boolean;
}

export const DEFAULT_WORKSHOP: WorkshopTeachingInput = {
  deal: { feePerStudent: 60, venueCut: 0.25, guarantee: 0, travelCost: 400, materialsPerStudent: 0 },
  studentsMin: 4,
  studentsRealistic: 8,
  studentsMax: 14,
  prepHours: 6,
  classHours: 3,
  followUpAttach: 0.2,
  followUpPrice: 8,
  hourlyRate: 25,
  slotRisk: 0.3,
  isLocalLys: false,
};

export interface Flag {
  code: string;
  title: string;
  detail: string;
}

export interface Snapshot {
  /** Scenario label. */
  label: string;
  students: number;
  /** Gross ticket revenue. */
  grossRevenue: number;
  /** After venue cut, per-student materials, travel. */
  netDeal: number;
  /** Pattern attach value. */
  followUpValue: number;
  /** Total value including attach. */
  totalValue: number;
  /** Prep + class hours. */
  totalHours: number;
  /** Effective hourly rate including attach. */
  effectiveHourly: number;
  /** Total value minus opportunity cost of the hours. */
  opportunityGap: number;
}

export interface WorkshopTeachingResult {
  /** worst / realistic / best snapshots. */
  snapshots: Snapshot[];
  /** Students needed to cover fixed costs at the deal rate. */
  breakEvenStudents: number;
  /** Students needed to clear the hourly-rate bar including opportunity cost. */
  profitableStudents: number;
  /** Realistic effective hourly rate. */
  realisticHourly: number;
  /** Worst-case effective hourly. */
  worstHourly: number;
  /** Share of the realistic take-home eaten by travel. */
  travelBurden: number;
  /** Realistic net deal value minus opportunity cost. */
  opportunityGap: number;
  flags: Flag[];
  verdict: string;
  verdictNote: string;
}

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

function dealNet(deal: ClassDeal, students: number): number {
  const perStudent = deal.feePerStudent * (1 - deal.venueCut) - deal.materialsPerStudent;
  const gross = perStudent * students - deal.travelCost;
  return Math.max(gross, deal.guarantee - deal.travelCost);
}

function snapshot(label: string, students: number, input: WorkshopTeachingInput): Snapshot {
  const followUpValue = students * input.followUpAttach * input.followUpPrice;
  const totalValue = dealNet(input.deal, students) + followUpValue;
  const totalHours = input.prepHours + input.classHours;
  const effectiveHourly = totalHours > 0 ? totalValue / totalHours : 0;
  const opportunityGap = totalValue - totalHours * input.hourlyRate;
  return {
    label,
    students,
    grossRevenue: students * input.deal.feePerStudent,
    netDeal: dealNet(input.deal, students),
    followUpValue,
    totalValue,
    totalHours,
    effectiveHourly,
    opportunityGap,
  };
}

export function analyzeWorkshopTeaching(input: WorkshopTeachingInput): WorkshopTeachingResult {
  const deal = { ...input.deal, venueCut: clamp01(input.deal.venueCut) };
  const effective: WorkshopTeachingInput = { ...input, deal, followUpAttach: clamp01(input.followUpAttach), slotRisk: clamp01(input.slotRisk) };

  const perStudentNet = effective.deal.feePerStudent * (1 - effective.deal.venueCut) - effective.deal.materialsPerStudent;
  // Break-even students: cover fixed costs (travel minus guarantee floor already accounted separately).
  const uncoveredFixed = Math.max(0, effective.deal.travelCost - effective.deal.guarantee);
  const breakEvenStudents = perStudentNet > 0 ? Math.ceil(uncoveredFixed / perStudentNet) : Infinity;
  // Profitable students: also cover opportunity cost of hours.
  const totalHours = effective.prepHours + effective.classHours;
  const profitableStudents = perStudentNet > 0 ? Math.ceil((uncoveredFixed + totalHours * effective.hourlyRate) / perStudentNet) : Infinity;

  const snapshots = [
    snapshot('worst', effective.studentsMin, effective),
    snapshot('realistic', effective.studentsRealistic, effective),
    snapshot('best', effective.studentsMax, effective),
  ];

  const realistic = snapshots[1];
  const worst = snapshots[0];
  const realisticHourly = realistic.effectiveHourly;
  const worstHourly = worst.effectiveHourly;
  const opportunityGap = realistic.opportunityGap;
  const travelBurden = effective.deal.travelCost > 0 && perStudentNet > 0 ? Math.min(1, effective.deal.travelCost / (perStudentNet * effective.studentsRealistic)) : 0;

  const flags: Flag[] = [];

  // WT-01 — realistic class size below the confirmed minimum.
  if (effective.studentsRealistic < effective.studentsMin) {
    flags.push({
      code: 'WT-01',
      title: 'Realistic size below confirmed minimum',
      detail: `You expect ${effective.studentsRealistic} students but the class only confirms at ${effective.studentsMin} — if enrollment stalls, the venue can cancel. Festivals schedule classes on travel days and alongside marquee lectures that can cut attendance to as few as 4. Ask for an enrollment update before committing travel money.`,
    });
  }

  // WT-02 — effective hourly below your rate.
  if (realisticHourly < effective.hourlyRate) {
    flags.push({
      code: 'WT-02',
      title: `Realistic pay ${fmt$(realisticHourly)}/hr — below your $${effective.hourlyRate}/hr rate`,
      detail: `Across ${totalHours} hours (prep ${effective.prepHours} + class ${effective.classHours}) the realistic take-home of ${fmt$(realistic.totalValue)} works out to ${fmt$(realisticHourly)}/hr including pattern attach — below your $${effective.hourlyRate}/hr rate. The same hours of pattern writing and grading at your rate would earn ${fmt$(totalHours * effective.hourlyRate)}. Teaching is not wrong — audience-building and warm buyers have value — but price it as marketing, not income.`,
    });
  }

  // WT-03 — travel eats the margin.
  if (effective.deal.travelCost > realistic.netDeal * 0.4 && !effective.isLocalLys) {
    flags.push({
      code: 'WT-03',
      title: 'Travel takes more than 40% of the take-home',
      detail: `${fmt$(effective.deal.travelCost)} of travel and lodging against a realistic deal net of ${fmt$(realistic.netDeal)} means travel consumes ${(travelBurden * 100).toFixed(0)}% of the value. #FairFiberWage exists because per-student contracts without stipends handed this risk to teachers: hotel rooms at venues run $170+/night. Negotiate a travel stipend or hotel nights before accepting.`,
    });
  }

  // WT-04 — follow-up attach missing or trivial.
  if (effective.followUpAttach <= 0.05 || effective.followUpPrice <= 0) {
    flags.push({
      code: 'WT-04',
      title: 'Follow-up pattern sales not modeled',
      detail: `The class itself is rarely the profit center — attendees are warm buyers who typically purchase the class pattern or related designs at 10-30% attach rates. Linking the class roster to a launch-list discount captures that second income. A class with zero modeled attach is priced only on tickets.`,
    });
  }

  // WT-05 — max class size unrealistic for the format.
  if (effective.studentsMax > 20 && perStudentNet > 0) {
    flags.push({
      code: 'WT-05',
      title: 'Max size may exceed what you can actually teach',
      detail: `${effective.studentsMax} students in one hands-on class is 2+ students per hour of instruction each. Most effective in-person formats cap at 12-16; beyond that quality (and reviews) suffers. Check the venue's actual room capacity and negotiate two smaller sections — two full classes usually beat one overflowing one.`,
    });
  }

  // WT-06 — venue cut below market norm.
  if (effective.deal.venueCut > 0.5) {
    flags.push({
      code: 'WT-06',
      title: `Venue takes ${Math.round(effective.deal.venueCut * 100)}% — above market`,
      detail: `Festival and LYS deals typically take 20-40% of the ticket for venue, staffing, and marketing. At ${Math.round(effective.deal.venueCut * 100)}% the organizer is pricing your class as their profit center, not a draw. Compare against the per-student benchmarks ($22-45 net for half-days, $60-90 for full-days) before signing.`,
    });
  }

  // WT-07 — no guarantee floor on a per-student deal.
  if (effective.deal.guarantee <= 0 && perStudentNet > 0) {
    flags.push({
      code: 'WT-07',
      title: 'No guaranteed floor — enrollment risk is yours',
      detail: `Pure per-student deals (the post-#FairFiberWage standard) pay $0 below the minimum and can leave you with $25-60 for the whole day after travel. The pre-2017 standard guaranteed $50-100/hr regardless of enrollment. Ask for even a small floor (e.g. the old $150 half-day minimum) — it is the cheapest insurance in the industry.`,
    });
  }

  // WT-08 — worst case goes negative.
  if (worst.netDeal + worst.followUpValue < 0) {
    flags.push({
      code: 'WT-08',
      title: 'Worst case loses money',
      detail: `At the confirmed minimum of ${effective.studentsMin} students the whole event nets ${fmt$(worst.netDeal + worst.followUpValue)} — traveling to teach can literally cost you money. This is the scenario that drove the #FairFiberWage withdrawals. If the floor is non-negotiable, treat this as a paid trip to the marketplace and price booth sales into the same journey instead of the class.`,
    });
  }

  // ---- Verdict ladder ----
  let verdict: string;
  let verdictNote: string;

  if (worst.netDeal + worst.followUpValue < 0 && effective.deal.guarantee <= 0) {
    verdict = 'Decline as written — worst case loses money';
    verdictNote = `At ${effective.studentsMin} students this class nets ${fmt$(worst.netDeal + worst.followUpValue)} after ${fmt$(effective.deal.travelCost)} of travel. Without a guaranteed floor, enrollment risk is 100% yours — the exact contract shape that triggered teacher withdrawals at Yarn Fest. Renegotiate a floor or a stipend before committing anything non-refundable.`;
  } else if (effective.studentsRealistic < effective.studentsMin) {
    verdict = 'Not confirmed yet — hold travel money';
    verdictNote = `You expect ${effective.studentsRealistic} students against a ${effective.studentsMin}-student confirmation. Book nothing non-refundable until enrollment clears the minimum; festivals cancel or reschedule travel-day classes routinely.`;
  } else if (realisticHourly < effective.hourlyRate * 0.6) {
    verdict = 'Teach for audience, not hours';
    verdictNote = `Realistic take-home of ${fmt$(realistic.totalValue)} over ${totalHours} hours is ${fmt$(realisticHourly)}/hr — less than a quarter of your $${effective.hourlyRate}/hr rate. The class is viable only as marketing: the ${effective.studentsRealistic} attendees are warm buyers worth ${fmt$(realistic.followUpValue)} in attach, plus a marketplace audience if you run a booth on the same trip. If you cannot pair it with booth sales or a listing launch, sell those hours as patterns instead.`;
  } else if (opportunityGap < 0) {
    verdict = 'Borderline — teach it if the audience is worth it';
    verdictNote = `Realistic take-home of ${fmt$(realistic.totalValue)} covers your ${fmt$(effective.deal.travelCost)} travel and ${fmt$(totalHours * effective.hourlyRate)} of hours value minus ${fmt$(Math.abs(opportunityGap))}. ${effective.isLocalLys ? 'As a local LYS class with no travel drag, the math improves fast with one extra student — push for a larger room.' : 'The travel burden is the swing factor: one extra student adds ' + fmt$(perStudentNet) + ' and turns the month around.'}`;
  } else if (realisticHourly >= effective.hourlyRate * 1.5) {
    verdict = 'Great deal — book the trip';
    verdictNote = `${fmt$(realisticHourly)}/hr realistic across ${totalHours} hours, ${fmt$(opportunityGap)} above your hourly rate, and ${fmt$(realistic.followUpValue)} in follow-up pattern sales. This is the tier teachers fight to keep — a per-student rate at or above the $45-90/festival-student benchmark with travel reasonably covered.`;
  } else {
    verdict = 'Worth teaching — the numbers clear the bar';
    verdictNote = `Realistic take-home of ${fmt$(realistic.totalValue)} at ${fmt$(realisticHourly)}/hr clears your $${effective.hourlyRate}/hr rate by ${fmt$(opportunityGap)}, plus ${fmt$(realistic.followUpValue)} in attach. Break-even is ${breakEvenStudents === Infinity ? 'not reachable (restructure the deal)' : breakEvenStudents} students and the realistic ${effective.studentsRealistic} clears it with ${Math.max(0, effective.studentsRealistic - breakEvenStudents)} to spare. Keep the floor, cap travel, and launch the pattern to the class list after the event.`;
  }

  return { snapshots, breakEvenStudents, profitableStudents, realisticHourly, worstHourly, travelBurden, opportunityGap, flags, verdict, verdictNote };
}

export function fmt$(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}
