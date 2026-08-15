/**
 * CHK-021 — Club Revenue Planner (21st workspace tab: "Club Rev").
 *
 * Models a pattern club as a real subscription business instead of a price
 * you guessed off a competitor's page. Built from session-22 research:
 *   - Patreon-style retention bars: good 3-month retention 65%, great 78%
 *     (bonjoro.com Patreon retention analysis); small-creator annual churn
 *     commonly runs 25–35% (market.us creator-economy report).
 *   - Double The Stitches Pattern Club: $7/mo or $77/yr (~35% annual
 *     discount), founding-member price lock, 10-day cancellation notice,
 *     no annual refunds, 2-tier ladder (club + Stitch Society premium
 *     tier with priority support, library, community).
 *   - Mediaperuana cost model: sweater = 55 hours; $155 direct costs
 *     ($40 tech edit + $40 model + $75 yarn); Ravelry nets ~96% after the
 *     3.5% commission and PayPal processing (audited in the Take-Rate War
 *     Lab — see fee-registry.ts; the old "~95%" figure is retired by CHK-088).
 *
 * The flaw we are converting into a strength: designers announce "$7 a
 * month" with no idea how many members churn makes the club die, what the
 * annual discount actually costs, or which premium tier perks earn their
 * hours. Nothing in the category models this — it is all vibes.
 */

export const HOURS_FLOOR = 12; // cited professional floor ($12/hr)
// Ravelry at club scale ($30–$1,500/mo band): 1 − 3.5% commission − 2.9% −
// $0.30 PayPal ≈ 96% on a $7 member price. Audited source: fee-registry.ts.
export const PLATFORM_NET_PCT = 0.96;
export const CHURN_MO_GOOD = 0.045; // 78% retained at month 3 → ~4.5%/mo
export const CHURN_MO_TYPICAL = 0.07; // 65% retained at month 3 → ~7%/mo
export const CHURN_MO_POOR = 0.1; // ~25–35%/yr+ typical small-creator drift

export interface ClubInput {
  // Membership structure
  monthlyMembers: number;
  annualMembers: number;
  monthlyPrice: number;
  annualPrice: number; // charged once per 12 months
  newMembersPerMonth: number; // expected signups per month
  monthlyChurnPct: number; // 0.05 = 5% of members cancel per month
  // Money in / money out
  directCostPerPattern: number; // tech edit + model + yarn per monthly pattern
  monthlyOverhead: number; // platform, website, admin, tools
  marketingSpendPerMonth: number;
  hoursPerPattern: number; // hours you spend per club pattern (write/grade/edits)
  adminHoursPerMonth: number; // support, emails, community management
  // Premium tier (optional)
  premiumMembers: number;
  premiumPrice: number; // on top of base monthly price
  premiumHoursPerMonth: number; // priority support, library, community hosting
  premiumDelivered: {
    prioritySupport: boolean;
    tutorialLibrary: boolean;
    privateCommunity: boolean;
    guestSpeakers: boolean;
    firstAccess: boolean;
    discounts: boolean;
  };
  // Policy flags
  founderPriceLock: boolean; // founding members keep lowest price forever
  monthlyNoticeDays: number; // cancellation notice period (0 = instant)
  annualRefunds: boolean; // refund partial unused annual?
  lifetimeAccess: boolean; // members keep patterns after cancelling
}

export function defaultClubInput(): ClubInput {
  return {
    monthlyMembers: 40,
    annualMembers: 20,
    monthlyPrice: 7,
    annualPrice: 77,
    newMembersPerMonth: 6,
    monthlyChurnPct: 7,
    directCostPerPattern: 155,
    monthlyOverhead: 67,
    marketingSpendPerMonth: 50,
    hoursPerPattern: 12,
    adminHoursPerMonth: 10,
    premiumMembers: 5,
    premiumPrice: 5,
    premiumHoursPerMonth: 6,
    premiumDelivered: {
      prioritySupport: true,
      tutorialLibrary: false,
      privateCommunity: false,
      guestSpeakers: false,
      firstAccess: false,
      discounts: false,
    },
    founderPriceLock: false,
    monthlyNoticeDays: 0,
    annualRefunds: false,
    lifetimeAccess: true,
  };
}

export interface ClubMonth {
  month: number;
  monthlyMembers: number;
  annualMembers: number;
  premiumMembers: number;
  netRevenue: number;
  netAfterCosts: number;
}

export interface ChurnBenchmark {
  label: string;
  monthlyChurnPct: number;
  note: string;
}

export interface TierGap {
  name: string;
  delivered: boolean;
  note: string;
}

export interface ClubAnalysis {
  months: ClubMonth[];
  monthlyRecurring: number; // net-of-fees MRR at month 1
  annualizedRevenue: number; // what annual members work out to per month
  avgNetPerMember: number; // average net monthly revenue per member
  totalHoursPerMonth: number;
  effectiveHourly: number;
  churnBenchmark: ChurnBenchmark;
  churnVerdict: 'healthy' | 'typical' | 'bleeding';
  breakevenMembers: number; // members needed to cover direct + overhead + marketing
  projectedAnnualNet: number; // sum of month 2–13 net (after start-up effects settle)
  ltv: number; // average net lifetime value of a member
  marketingPaybackMonths: number; // months for a member's LTV to cover marketing spend (0 = not applicable)
  premiumVerdict: 'worth' | 'add-more' | 'cut' | 'skip';
  premiumNotes: string[];
  policyNotes: string[];
  retentionNotes: string[];
}

function fees(n: number) {
  return n * (1 - PLATFORM_NET_PCT);
}

/**
 * Simulate 12 months: churn applies to existing members, signups arrive,
 * annual members renew monthly-equivalent. Returns per-month snapshot plus
 * aggregates.
 */
export function modelClub(input: ClubInput): ClubAnalysis {
  const churn = Math.min(Math.max(input.monthlyChurnPct, 0), 100) / 100;
  const basePrice = input.monthlyPrice;
  // Effective monthly value of an annual member (pre-fees)
  const annualMonthlyEquivalent = input.annualPrice / 12;

  let mm = input.monthlyMembers;
  let am = input.annualMembers;
  let pm = input.premiumMembers;

  const months: ClubMonth[] = [];

  // Churn benchmark
  let churnBenchmark: ChurnBenchmark = {
    label: 'TYPICAL',
    monthlyChurnPct: CHURN_MO_TYPICAL,
    note: '',
  };
  let churnVerdict: 'healthy' | 'typical' | 'bleeding' = 'typical';
  if (churn <= CHURN_MO_GOOD) {
    churnBenchmark = {
      label: 'HEALTHY',
      monthlyChurnPct: CHURN_MO_GOOD,
      note:
        `At ${input.monthlyChurnPct}% monthly churn you are at or above the "great" Patreon bar of ~78% retained at 3 months — ` +
        'most small clubs never reach this; protect it with the retention calendar.',
    };
    churnVerdict = 'healthy';
  } else if (churn <= CHURN_MO_TYPICAL) {
    churnBenchmark = {
      label: 'TYPICAL',
      monthlyChurnPct: CHURN_MO_TYPICAL,
      note:
        `At ${input.monthlyChurnPct}% monthly churn you sit near the 65%-at-3-months "good" bar. ` +
        'Small clubs commonly churn 25–35% a year; at this rate yours does too — the calendar below fights that drift.',
    };
    churnVerdict = 'typical';
  } else {
    churnBenchmark = {
      label: 'BLEEDING',
      monthlyChurnPct: CHURN_MO_POOR,
      note:
        `At ${input.monthlyChurnPct}% monthly churn your club loses most of its base within a year — ` +
        'above the 25–35% annual drift small creators report. Before growing, fix the leak: fix the pattern ' +
        'that frustrates beginners first, not the pricing.',
    };
    churnVerdict = 'bleeding';
  }

  let totalNet = 0;
  let totalMemberMonths = 0;
  let totalHours = 0;

  // Breakeven: how many monthly-equivalent members cover costs
  // cost per pattern + overhead + marketing; premium hours priced at floor
  const premiumCost = (input.premiumHoursPerMonth * HOURS_FLOOR) / 12; // spread annualised premium time across month
  const monthlyCosts =
    input.directCostPerPattern +
    input.monthlyOverhead +
    input.marketingSpendPerMonth +
    input.premiumHoursPerMonth * HOURS_FLOOR;
  const perMemberNet = basePrice * PLATFORM_NET_PCT;
  const breakevenMembers =
    perMemberNet > 0 ? Math.ceil(monthlyCosts / perMemberNet) : Infinity;

  for (let m = 1; m <= 12; m++) {
    // churn removes members (annual churn counted as 1/12 of base leaving)
    mm = Math.max(0, mm - mm * churn);
    am = Math.max(0, am - (am / 12));
    // signups arrive: 80% monthly mix, 20% annual, premium 1 in newMembers
    const signupRatio = input.newMembersPerMonth;
    mm += signupRatio * 0.8;
    am += signupRatio * 0.2;
    // premium: existing premium churn with base; 1 in 6 new members upgrades
    pm = Math.max(0, pm - pm * churn) + signupRatio / 6;

    const gross = mm * basePrice + am * annualMonthlyEquivalent + pm * input.premiumPrice;
    const netRevenue = gross - fees(gross);
    const netAfterCosts =
      netRevenue -
      input.directCostPerPattern -
      input.monthlyOverhead -
      input.marketingSpendPerMonth -
      input.premiumHoursPerMonth * HOURS_FLOOR;

    months.push({
      month: m,
      monthlyMembers: Math.round(mm * 10) / 10,
      annualMembers: Math.round(am * 10) / 10,
      premiumMembers: Math.round(pm * 10) / 10,
      netRevenue: Math.round(netRevenue * 100) / 100,
      netAfterCosts: Math.round(netAfterCosts * 100) / 100,
    });

    totalNet += netAfterCosts;
    totalMemberMonths += mm + am + pm;
    totalHours += input.hoursPerPattern + input.adminHoursPerMonth + input.premiumHoursPerMonth;
  }

  const hoursPerMonth = input.hoursPerPattern + input.adminHoursPerMonth + input.premiumHoursPerMonth;
  const labour = hoursPerMonth * HOURS_FLOOR;
  const firstMonth = months[0];
  const effectiveHourly =
    hoursPerMonth > 0 ? (firstMonth.netAfterCosts + labour) / hoursPerMonth : 0;

  // LTV: average net lifetime value of one member (net per member-month × avg lifespan)
  const avgNetPerMember =
    totalMemberMonths > 0 ? firstMonth.netRevenue / (input.monthlyMembers + input.annualMembers + input.premiumMembers) : 0;
  const avgLifespanMonths = churn > 0 ? 1 / churn : 24;
  const ltv = avgNetPerMember * avgLifespanMonths -
    input.marketingSpendPerMonth / (input.newMembersPerMonth || 1);

  const marketingPaybackMonths =
    input.marketingSpendPerMonth > 0 && input.newMembersPerMonth > 0 && avgNetPerMember > 0
      ? input.marketingSpendPerMonth / (avgNetPerMember * input.newMembersPerMonth)
      : 0;

  // --- Premium tier verdict ---
  const premiumVerdict: 'worth' | 'add-more' | 'cut' | 'skip' =
    input.premiumPrice <= 0 || input.premiumMembers <= 0
      ? 'skip'
      : premiumVerdictCalc(input);
  const premiumNet = input.premiumMembers * input.premiumPrice * PLATFORM_NET_PCT;
  const premiumAltEarnings = input.premiumHoursPerMonth * 9 * PLATFORM_NET_PCT;
  const premiumNotes: string[] = [];
  premiumNotes.push(
    `Premium at +$${input.premiumPrice}/mo with ${input.premiumMembers} members adds ~$${premiumNet.toFixed(0)}/mo net — ` +
      `and costs ${input.premiumHoursPerMonth} hours; if those hours were spent selling patterns at $9 they would earn $${premiumAltEarnings.toFixed(0)} (minus costs). ` +
      'The premium tier is only beating self-publishing when it carries perks members actually pay for.'
  );
  if (premiumVerdict !== 'worth') {
    premiumNotes.push('At the moment the tier verdict is ' + premiumVerdict + ' — adjust perks, price or hours until it reads "worth".');
  }

  // --- Policy notes ---
  const policyNotes: string[] = [];
  if (input.monthlyNoticeDays >= 10) {
    policyNotes.push(
      `A ${input.monthlyNoticeDays}-day cancellation notice is standard for small clubs (Double The Stitches uses 10 days) — ` +
        'it smooths delivery but keep it in writing, because instant-cancel members who keep the last pattern ' +
        'are the most common source of refund disputes.'
    );
  }
  if (!input.annualRefunds) {
    policyNotes.push(
      'No annual refunds is common, but state it at checkout: partial-season refunds are the #1 chargeback cause ' +
        'on small club platforms — a clear "no refund on the current season" line cuts disputes.'
    );
  }
  if (input.founderPriceLock) {
    policyNotes.push(
      'A lifetime price lock converts founding members into your lowest-churn cohort — but price future tiers ' +
        'high enough that the lock does not anchor every price you ever set.'
    );
  }
  if (input.lifetimeAccess) {
    policyNotes.push(
      'Lifetime access to delivered patterns is the strongest retention lever in knitting clubs (members feel they ' +
        'own a library, not rent it) — and it costs you nothing after delivery.'
    );
  }

  // --- Retention calendar notes ---
  const retentionNotes: string[] = [
    churnVerdict === 'bleeding'
      ? 'Start with the retention calendar below before adding marketing: every $50 of signup spend at 10% churn refills a bucket with a hole.'
      : 'The retention calendar below targets the two biggest small-club cancels: a confusing second-month pattern, and going quiet in month three.',
    'Welcome week: email the new member within 24 hours with a stitch glossary for your most-difficult technique — the top cancel reason across small clubs is "the pattern beat me".',
    'Day 30: ask one question — "what was the trickiest part of the first pattern?" Every answer is a fix that keeps three other members.',
    'Day 60: offer a choice before the next pattern — swap to an easier one for free. Churn at day 60 clusters around members who are behind.',
    'Day 90 / renewal point: price the annual plan at roughly 30–35% under monthly (the ~$77-on-$7 pattern); annual members churn about a third as fast.',
  ];

  return {
    months,
    monthlyRecurring: Math.round(firstMonth.netRevenue * 100) / 100,
    annualizedRevenue: Math.round(annualMonthlyEquivalent * 100) / 100,
    avgNetPerMember: Math.round(avgNetPerMember * 100) / 100,
    totalHoursPerMonth: hoursPerMonth,
    effectiveHourly: Math.round(effectiveHourly * 100) / 100,
    churnBenchmark,
    churnVerdict,
    breakevenMembers: Number.isFinite(breakevenMembers) ? breakevenMembers : 0,
    projectedAnnualNet: Math.round(totalNet * 100) / 100,
    ltv: Math.round(ltv * 100) / 100,
    marketingPaybackMonths: marketingPaybackMonths > 0 ? Math.round(marketingPaybackMonths * 10) / 10 : 0,
    premiumVerdict,
    premiumNotes,
    policyNotes,
    retentionNotes,
  };
}

function premiumVerdictCalc(input: ClubInput): 'worth' | 'add-more' | 'cut' | 'skip' {
  const delivered = Object.values(input.premiumDelivered).filter(Boolean).length;
  const earned = delivered >= 3 && input.premiumMembers >= 4;
  const hoursPerDollar = input.premiumHoursPerMonth / input.premiumPrice;
  if (earned && hoursPerDollar <= 1.2) return 'worth';
  if (delivered < 2) return 'add-more';
  if (hoursPerDollar > 1.5) return 'cut';
  return 'worth';
}

/**
 * The premium tier must add genuine value — audit a proposed perk list.
 */
export function auditPremiumTier(premium: ClubInput['premiumDelivered']): {
  gaps: TierGap[];
  score: number;
} {
  const items: { name: string; key: keyof ClubInput['premiumDelivered']; note: string }[] = [
    {
      name: 'Priority pattern support',
      key: 'prioritySupport',
      note: 'The perk small-club members cite most — "a patient designer who answers" is why Stitch Society exists.',
    },
    {
      name: 'Stitch & technique library',
      key: 'tutorialLibrary',
      note: 'Evergreen tutorials rescue stuck members and cut support load; build once, reuse forever.',
    },
    {
      name: 'Private community',
      key: 'privateCommunity',
      note: 'A weekly or monthly group session is the highest-loyalty perk (members cancel friends, not clubs).',
    },
    {
      name: 'Guest speakers & interviews',
      key: 'guestSpeakers',
      note: 'Events fill quiet months but cost your hours; once a quarter beats once a month.',
    },
    {
      name: 'First access to KALs & workshops',
      key: 'firstAccess',
      note: 'Low-cost perk with strong perceived value — gate sign-ups, not content.',
    },
    {
      name: 'Member discounts',
      key: 'discounts',
      note: '10–15% off your catalogue rewards loyalty but shrinks margin; keep it on older patterns.',
    },
  ];
  const delivered = items.filter((i) => premium[i.key]).length;
  const gaps: TierGap[] = items.filter((i) => !premium[i.key]).map((i) => ({
    name: i.name,
    delivered: false,
    note: i.note,
  }));
  return { gaps, score: delivered };
}

/**
 * Paste-ready founding-member launch email.
 */
export function generateFoundingOfferEmail(opts: {
  clubName: string;
  designerName: string;
  monthlyPrice: number;
  annualPrice: number;
  founderLockUntil: string;
  perks: string[];
}): string {
  const annualDiscount =
    opts.monthlyPrice > 0
      ? Math.round((1 - opts.annualPrice / (opts.monthlyPrice * 12)) * 100)
      : 0;
  return (
    `Subject: Founding membership is open — ${opts.clubName}\n\n` +
    `Hi,\n\n` +
    `I'm opening the founding cohort of ${opts.clubName}. Founding members get a price lock for as long as they stay: ` +
    `$${opts.monthlyPrice}/month, or $${opts.annualPrice}/year (about ${annualDiscount}% off if you commit annually). ` +
    `After the cohort closes, new members pay more — the founding price is the lowest this club will ever be.\n\n` +
    `Every month you get:\n` +
    opts.perks.map((p) => `- ${p}`).join('\n') +
    `\n\n` +
    `Patterns are yours to keep even if you leave — the library you build stays yours. You can cancel anytime with ` +
    `${opts.designerName}.\n\n` +
    `Founding spots are limited so I can keep tech-editing and test-knitting at the standard I'd put my name on.\n\n` +
    `— ${opts.designerName}`
  );
}

export const CLUB_TYPE_LABELS = {
  monthly: 'Monthly',
  annual: 'Annual',
  premium: 'Premium tier',
} as const;
