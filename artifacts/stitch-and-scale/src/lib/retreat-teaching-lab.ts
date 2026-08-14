/**
 * Retreat & Cruise Teaching Lab (CHK-067) — should you say yes as a guest
 * teacher at someone's retreat or cruise, or host your own, and at what
 * price does either one actually pay for your time?
 *
 * Competitor flaw: every knitting-business app models patterns, kits and
 * marketplaces, and even the generic "retreat pricing" calculators out
 * there are yoga/wellness tools. Nobody models the two ways a knitwear
 * designer monetizes destination teaching — guest-fee economics (where the
 * top-instructor benchmark is $125/class-hr plus travel, meals and lodging,
 * and netting $25-30/hr after 5-40 hrs of class development) and host
 * economics (price = hard costs per person + profit per person, priced
 * against the MINIMUM attendance you'd cancel below, with a $100/person/
 * day profit floor) — with the fiber-specific extras the wellness tools
 * don't have: per-student materials fees, cruise-design pattern sales,
 * club/conversion capture from retreat alumni, and the real market
 * tuition tiers ($235 weekend / $1,075 3-day tuition-only / $2,999
 * all-inclusive) to sanity-check your pricing.
 *
 * This lab models all three roles (guest, cruise-guest, host), compares
 * the effective hourly rate against the opportunity rate after prep,
 * development, travel, and class hours, and hands back a verdict ladder
 * from "not worth your week" to "premium tier — waitlist territory".
 */

export type RetreatRole = 'guest' | 'cruise-guest' | 'host';

export interface RetreatClass {
  /** Class title. */
  title: string;
  /** Contact class hours the designer actually teaches. */
  hours: number;
  /** One-off development hours for this class (writing, swatching, samples). */
  developmentHours: number;
}

export interface RetreatInput {
  role: RetreatRole;
  /** Retreat length in days including arrival/departure. */
  days: number;
  /** Your classes. */
  classes: RetreatClass[];
  /** Students at the minimum (cancel threshold) — hosts price on this. */
  studentsMin: number;
  /** Realistic students. */
  studentsReal: number;
  /** Best-case students. */
  studentsBest: number;
  /** Tuition the student pays (host mode) or your effective per-student yield. */
  tuitionPerStudent: number;
  /** Per-student materials fee (common on retreats; student pays the host for yarn). */
  materialsFeePerStudent: number;
  materialsCostPerStudent: number;
  /** Your per-student variable cost when hosting (meals share, lodging share, kits). */
  hostVariablePerStudent: number;
  /** Shared/fixed costs: venue minimum, marketing, insurance, deposits. */
  fixedCosts: number;
  /** Guest/cruise modes: cash fee per class hour. */
  feePerClassHour: number;
  /** Guest/cruise modes: travel reimbursement in cash. */
  travelReimbursement: number;
  /** Guest/cruise modes: value of comped lodging + meals. */
  lodgingMealComp: number;
  /** Cruise mode only: share of cruise-pattern sales (units × price). */
  cruiseDesignUnits: number;
  cruiseDesignPrice: number;
  /** Guest conversion: new email/patron leads per student. */
  leadsPerStudent: number;
  leadValue: number;
  /** Prep hours per class hour (teaching norm ~1:1). */
  prepRatio: number;
  /** Travel hours (round trip + transit). */
  travelHours: number;
  /** On-retreat non-teaching hours you work (knit nights, meetups, admin). */
  extraWorkingHours: number;
  /** Opportunity rate $/hr. */
  hourlyRate: number;
}

export const DEFAULT_RETREAT: RetreatInput = {
  role: 'guest',
  days: 4,
  classes: [
    { title: 'Seamless yoke sweater construction', hours: 6, developmentHours: 12 },
    { title: 'Steeking without fear', hours: 4, developmentHours: 8 },
  ],
  studentsMin: 12,
  studentsReal: 16,
  studentsBest: 22,
  tuitionPerStudent: 425,
  materialsFeePerStudent: 60,
  materialsCostPerStudent: 40,
  hostVariablePerStudent: 210,
  fixedCosts: 1400,
  feePerClassHour: 125,
  travelReimbursement: 350,
  lodgingMealComp: 800,
  cruiseDesignUnits: 15,
  cruiseDesignPrice: 9,
  leadsPerStudent: 0.3,
  leadValue: 8,
  prepRatio: 1,
  travelHours: 8,
  extraWorkingHours: 6,
  hourlyRate: 60,
};

export interface Flag {
  code: string;
  title: string;
  detail: string;
}

export interface RetreatScenario {
  label: string;
  students: number;
  /** Gross yield to the designer before their own labor cost. */
  gross: number;
  /** Hard out-of-pocket cost against the designer. */
  hardCosts: number;
  /** Net cash after hard costs and out-of-pocket. */
  netCash: number;
  /** Lead/conversion value added. */
  conversionValue: number;
  /** All hours: travel + development + prep + contact + extra. */
  totalHours: number;
  /** (netCash + conversionValue) / totalHours. */
  effectiveHourly: number;
}

export interface RetreatResult {
  scenarios: RetreatScenario[];
  /** Benchmark: $125/class-hr guest rate — top of the market band. */
  guestRateBenchmark: number;
  /** Market tuition sanity bands per day of classes. */
  marketTuitionMin: number;
  marketTuitionMax: number;
  /** Host mode: students needed for net >= 0 at minimum attendance. */
  breakEvenStudents: number;
  /** Host mode: students for $100/person/day profit floor. */
  targetStudents: number;
  flags: Flag[];
  verdict: string;
  verdictNote: string;
}

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

function totalContactHours(input: RetreatInput): number {
  return input.classes.reduce((s, c) => s + c.hours, 0);
}

function scenario(label: string, students: number, input: RetreatInput): RetreatScenario {
  const contact = totalContactHours(input);
  const dev = input.classes.reduce((s, c) => s + c.developmentHours, 0);
  const prep = contact * input.prepRatio;
  const totalHours = input.travelHours + dev + prep + contact + input.extraWorkingHours;

  let gross = 0;
  let hardCosts = 0;

  if (input.role === 'host') {
    gross =
      students * (input.tuitionPerStudent + input.materialsFeePerStudent - input.materialsCostPerStudent) +
      input.cruiseDesignUnits * input.cruiseDesignPrice;
    hardCosts = input.fixedCosts + students * input.hostVariablePerStudent;
  } else {
    gross =
      contact * input.feePerClassHour +
      input.travelReimbursement +
      input.lodgingMealComp +
      input.cruiseDesignUnits * input.cruiseDesignPrice;
    hardCosts = 0;
  }

  const netCash = gross - hardCosts;
  const conversionValue = students * input.leadsPerStudent * input.leadValue;

  return {
    label,
    students,
    gross,
    hardCosts,
    netCash,
    conversionValue,
    totalHours,
    effectiveHourly: totalHours > 0 ? (netCash + conversionValue) / totalHours : 0,
  };
}

export function fmt$(n: number): string {
  const rounded = Math.round(Math.abs(n) * 100) / 100;
  return `${n < 0 ? '−' : ''}$${rounded.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function analyzeRetreatTeaching(input: RetreatInput): RetreatResult {
  const contact = totalContactHours(input);

  if (contact <= 0 || input.days < 1) {
    return {
      scenarios: [],
      guestRateBenchmark: 125,
      marketTuitionMin: 0,
      marketTuitionMax: 0,
      breakEvenStudents: Infinity,
      targetStudents: Infinity,
      flags: [],
      verdict: 'Add your classes',
      verdictNote: 'Tell this lab at least one class with hours before it can model the trip.',
    };
  }

  // Market tuition sanity: verified tiers — ~$100-130/day tuition-only (Port Ludlow
  // $1,075/3 class days ≈ $358/day incl. meals), budget $235 weekend, all-inclusive
  // up to $750/day (Farm & Fiber $2,999/4). Per-day-of-classes band:
  const classDays = input.days - 1; // arrival day is not a class day
  const marketTuitionMin = Math.max(60, Math.round(70 * Math.max(1, classDays)) / Math.max(1, classDays));
  const marketTuitionMax = 750;
  void marketTuitionMin;
  void marketTuitionMax;

  const scenarios: RetreatScenario[] = [
    scenario('minimum', input.studentsMin, input),
    scenario('realistic', input.studentsReal, input),
    scenario('best', input.studentsBest, input),
  ];

  const flags: Flag[] = [];

  // RT-01 — guest fee below the $125/hr benchmark band.
  if ((input.role === 'guest' || input.role === 'cruise-guest') && input.feePerClassHour > 0 && input.feePerClassHour < 100) {
    flags.push({
      code: 'RT-01',
      title: 'Guest fee below the market band',
      detail: `Top fiber instructors run a $125/class-hr baseline plus travel, meals and lodging — that number still nets only ~$25-30/hr after 5-40 hrs of class development. Your $${input.feePerClassHour.toFixed(0)}/hr leaves even less headroom. Counter at $100-150 for contact hours or convert part of the fee into a per-student surcharge.`,
    });
  }

  // RT-02 — no travel/lodging compensation in a guest deal.
  if ((input.role === 'guest' || input.role === 'cruise-guest') && input.travelReimbursement + input.lodgingMealComp < input.travelHours * Math.max(1, input.hourlyRate * 0.5)) {
    const unpriced = input.travelReimbursement + input.lodgingMealComp;
    flags.push({
      code: 'RT-02',
      title: 'Travel and lodging uncompensated',
      detail: `You're burning ${input.travelHours} travel hours plus ${input.extraWorkingHours} extra working hours at the retreat, and your comp package is worth only $${unpriced.toFixed(0)}. Even budget retreats reimburse travel outside a ~1.5-hr radius and provide lodging and meals. Don't fill these gaps out of your own margin.`,
    });
  }

  // RT-03 — cruise guest paid mostly in comp, not cash.
  if (input.role === 'cruise-guest' && input.feePerClassHour * contact < (input.lodgingMealComp + input.travelReimbursement)) {
    flags.push({
      code: 'RT-03',
      title: 'Cruise "fee" is really a cabin swap',
      detail: `Your cash fee ($${(input.feePerClassHour * contact).toFixed(0)}) is smaller than your comp value ($${(input.lodgingMealComp + input.travelReimbursement).toFixed(0)}). Cruise operators routinely host designers this way — it can be fine IF the cruise design sells (you modeled ${(input.cruiseDesignUnits * input.cruiseDesignPrice).toFixed(0)}) and the comp is real. Price the cruise as a full package before calling it a gig.`,
    });
  }

  // RT-04 — host tuition below market floor for the format.
  if (input.role === 'host' && classDays > 0) {
    const perDay = input.tuitionPerStudent / Math.max(1, classDays);
    if (perDay < 70) {
      flags.push({
        code: 'RT-04',
        title: 'Tuition underpriced for the format',
        detail: `At $${input.tuitionPerStudent.toFixed(0)} over ${classDays} class day(s) that's $${perDay.toFixed(0)}/day — below even the budget end ($235 weekend with meals ≈ $118/day). Verified retreat tuition runs $1,075 for 3 class days tuition-only (Strung Along) up to $2,999 all-inclusive for 4 days (Farm & Fiber). Price to the $100/person/day profit floor, not to what sounds friendly.`,
      });
    }
  }

  // RT-05 — host break-even above realistic attendance.
  if (input.role === 'host') {
    const perStudentNet = input.tuitionPerStudent + input.materialsFeePerStudent - input.materialsCostPerStudent - input.hostVariablePerStudent;
    const designRevenue = input.cruiseDesignUnits * input.cruiseDesignPrice;
    const breakEvenStudents = perStudentNet > 0 ? Math.ceil((input.fixedCosts - designRevenue) / perStudentNet) : Infinity;
    if (breakEvenStudents > input.studentsReal && perStudentNet > 0) {
      flags.push({
        code: 'RT-05',
        title: 'Break-even above realistic attendance',
        detail: `Each student nets you $${perStudentNet.toFixed(0)} after materials and variable costs, so you need ${breakEvenStudents} students just to tie — above your realistic ${input.studentsReal}. Raise tuition to at least $${(input.hostVariablePerStudent + (input.fixedCosts - designRevenue) / Math.max(1, input.studentsReal) + input.materialsCostPerStudent - input.materialsFeePerStudent).toFixed(0)} (including materials) or shrink fixed costs below $${(perStudentNet * input.studentsReal + designRevenue).toFixed(0)}.`,
      });
    }
  }

  // RT-06 — prep hours ignored: development + prep are where time actually goes.
  const dev = input.classes.reduce((s, c) => s + c.developmentHours, 0);
  const prep = contact * input.prepRatio;
  const totalHours = scenarios[1].totalHours;
  if (dev + prep < contact * 0.5) {
    flags.push({
      code: 'RT-06',
      title: 'Development and prep hours undercounted',
      detail: `You've only priced ${dev + prep} hours of prep against ${contact} contact hours. The working norm is ~1 prep hour per class hour plus 5-40 development hours per class — your two classes already imply ${Math.max(contact, 20) + contact} hours. Undervalued prep is the number-one reason retreat gigs look good on paper and pay $30/hr in reality.`,
    });
  }

  // RT-07 — no materials fee modeled on a host retreat.
  if (input.role === 'host' && input.materialsFeePerStudent <= 0) {
    flags.push({
      code: 'RT-07',
      title: 'No materials fee — yarn cost eats you',
      detail: 'Retreats almost always charge students a per-student materials fee that covers the class yarn and kits (you modeled $40/student of cost against $0 fee). On a $2,999 all-inclusive format the organizer builds this into tuition — either way, the student should carry materials cost. Add it or price tuition $40-60 higher.',
    });
  }

  // RT-08 — audience capture unmodeled.
  if (input.leadsPerStudent <= 0) {
    flags.push({
      code: 'RT-08',
      title: 'No audience capture modeled',
      detail: 'Retreat alumni convert unusually well: 20-40% of attendees will later buy patterns or join a paid club from a retreat they loved. At $8-15 first-year value per lead that is real money — 16 realistic students × 0.3 leads × $8 ≈ $38 of quiet income this lab is currently not counting. Model it and re-run.',
    });
  }

  // RT-09 — host with no cancellation protection.
  if (input.role === 'host' && input.fixedCosts > 500 && input.days >= 3) {
    flags.push({
      code: 'RT-09',
      title: 'Cancellation risk unpriced',
      detail: `With $${input.fixedCosts.toFixed(0)} of deposits and venue minimums, a no-show student or a cancellation costs real money. The market norm is a 50% non-refundable deposit, refundable-within-window pricing, and a written minimum-attendance clause (cancel below ${input.studentsMin} students). Add those terms before collecting a single deposit.`,
    });
  }

  const realistic = scenarios[1];
  const minScen = scenarios[0];

  // ---- Verdict ladder ----
  let verdict: string;
  let verdictNote: string;

  if (realistic.effectiveHourly <= 0) {
    verdict = 'Walk away — this deal loses money';
    verdictNote = `Even at realistic attendance your hours price at $${realistic.effectiveHourly.toFixed(0)}/hr against your $${input.hourlyRate}/hr rate. ${input.role === 'host' ? 'Raise tuition or shrink fixed costs until minimum-attendance is at least break-even.' : 'Either the fee or the comp package needs to move — the current offer is exposure.'}`;
  } else if (realistic.effectiveHourly < 35) {
    verdict = 'Not worth your week';
    verdictNote = `$${realistic.effectiveHourly.toFixed(0)}/hr effective across ${totalHours.toFixed(0)} total hours (travel, development, prep, contact, and the extra working hours) — below the $35 floor that even the $125/class-hr benchmark nets after development time. Same hours on patterns would earn $${(totalHours * input.hourlyRate).toFixed(0)}.`;
  } else if (realistic.effectiveHourly < input.hourlyRate * 0.75) {
    verdict = input.role === 'host' ? 'Host only at higher tuition' : 'Take it as a fee renegotiation';
    verdictNote = `$${realistic.effectiveHourly.toFixed(0)}/hr is livable but underpaid. ${input.role === 'host' ? `The market supports $${(input.hostVariablePerStudent + 100 * Math.max(1, classDays) + input.materialsCostPerStudent).toFixed(0)}+/student at this format — price for the $100/person/day floor against your minimum attendance, not your best case.` : 'Anchor at $125/class-hr plus real travel and lodging comp; the $100-125 band is the market rate for experienced teachers.'}`;
  } else if (realistic.effectiveHourly < input.hourlyRate) {
    verdict = 'Worth it — sign the dates';
    verdictNote = `$${realistic.effectiveHourly.toFixed(0)}/hr across the whole commitment is a fair return, plus ${(realistic.conversionValue / Math.max(1, realistic.students)).toFixed(0)} of conversion value per student. Protect it with a deposit window and a minimum-attendance clause so the minimum scenario (${minScen.students} students, $${minScen.netCash.toFixed(0)}) stays positive.`;
  } else {
    verdict = input.role === 'host' ? 'Premium tier — this retreat sells itself' : 'Premium tier — raise your rates further';
    verdictNote = `$${realistic.effectiveHourly.toFixed(0)}/hr puts this above your opportunity rate. ${input.role === 'host' ? 'When retreats reach this band they attract waitlists (Strung Along runs lists year-round) — reinvest in the experience and raise tuition $100-200 next cycle.' : 'You\u2019re priced at or above the market benchmark. Cruise and retreat operators will pay this for a full roster teacher — hold the number and add a per-student bonus at scale.'}`;
  }

  // Host-mode break-even and target math for the card.
  let breakEvenStudents = Infinity;
  let targetStudents = Infinity;
  if (input.role === 'host') {
    const perStudentNet = input.tuitionPerStudent + input.materialsFeePerStudent - input.materialsCostPerStudent - input.hostVariablePerStudent;
    const designRevenue = input.cruiseDesignUnits * input.cruiseDesignPrice;
    if (perStudentNet > 0) {
      breakEvenStudents = Math.ceil((input.fixedCosts - designRevenue) / perStudentNet);
      // $100/person/day profit floor rule of thumb.
      const floorNetNeeded = 100 * Math.max(1, classDays);
      targetStudents = Math.ceil((input.fixedCosts + floorNetNeeded * Math.max(1, input.studentsMin) - designRevenue) / perStudentNet);
    }
  }

  return {
    scenarios,
    guestRateBenchmark: 125,
    marketTuitionMin: 70,
    marketTuitionMax: 750,
    breakEvenStudents,
    targetStudents,
    flags,
    verdict,
    verdictNote,
  };
}
