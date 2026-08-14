/**
 * Membership Site Lab (CHK-060) — should you launch your own paid
 * pattern membership, and what does the math say?
 *
 * Competitor flaw: teaching-monetization guides list clubs as an income
 * option, and club planners model retention — but no tool answers the
 * pre-launch questions. Typical free-to-paid conversion is under 5% of
 * an engaged audience (median newsletter just 0.62%); monthly churn of
 * 3-10% caps member lifetime value; and the monthly pattern + tech-edit
 * treadmill can pay less than selling the same pattern outright.
 *
 * This lab models expected members across a realistic conversion band,
 * net revenue after the real platform-fee stack (Payhip/Patreon/Wix/
 * Ravelry), LTV per member, break-even audience, the content-treadmill
 * inequality, and an annual-vs-monthly pricing verdict.
 */

export interface FeeStack {
  /** Platform cut as a fraction of revenue, e.g. 0.05 for Payhip free plan. */
  platformCut: number;
  /** Fixed platform monthly fee in USD (0 for Payhip free). */
  platformMonthlyFee: number;
  /** Payment processing fee per transaction, e.g. 0.029 + 0.30. */
  processorCut: number;
  processorFixed: number;
}

export const FEE_STACKS: Record<string, { label: string; stack: FeeStack }> = {
  payhipFree: { label: 'Payhip (free plan, 5% + PayPal)', stack: { platformCut: 0.05, platformMonthlyFee: 0, processorCut: 0.0349, processorFixed: 0.49 } },
  payhipPlus: { label: 'Payhip Plus ($29/mo, 2% + card)', stack: { platformCut: 0.02, platformMonthlyFee: 29, processorCut: 0.0259, processorFixed: 0.49 } },
  wixStripe: { label: 'Wix memberships (Stripe 2.9% + $0.30)', stack: { platformCut: 0, platformMonthlyFee: 0, processorCut: 0.029, processorFixed: 0.3 } },
  patreon: { label: 'Patreon (8% + processing)', stack: { platformCut: 0.08, platformMonthlyFee: 0, processorCut: 0.029, processorFixed: 0.3 } },
  ravelryGifts: { label: 'Ravelry gift codes (3.5% + PayPal)', stack: { platformCut: 0.035, platformMonthlyFee: 0, processorCut: 0.0349, processorFixed: 0.49 } },
};

export const DEFAULT_FEE_STACK_KEY = 'payhipFree';

export interface MembershipSiteInput {
  /** Engaged audience size: followers + newsletter + Ravelry favorites. */
  audienceSize: number;
  /** Best-case free-to-paid conversion (0-0.10). */
  conversionBest: number;
  /** Realistic free-to-paid conversion (0-0.10). */
  conversionRealistic: number;
  /** Conservative free-to-paid conversion (0-0.10). */
  conversionWorst: number;
  /** Monthly membership price in USD. */
  monthlyPrice: number;
  /** Annual price in USD (0 = monthly only). */
  annualPrice: number;
  /** Fraction of members on the annual plan (0-1). */
  annualShare: number;
  /** Monthly churn as a fraction (0-0.20). */
  monthlyChurn: number;
  /** Hours spent per month on the club: pattern + tech edit + test knit + community. */
  contentHours: number;
  /** Your opportunity rate $/hour (what selling/grading work pays). */
  hourlyRate: number;
  /** Moderation + pattern-support hours per month. */
  supportHours: number;
  feeStackKey: string;
}

export const DEFAULT_CLUB: MembershipSiteInput = {
  audienceSize: 1500,
  conversionBest: 0.05,
  conversionRealistic: 0.03,
  conversionWorst: 0.01,
  monthlyPrice: 7,
  annualPrice: 72,
  annualShare: 0.3,
  monthlyChurn: 0.05,
  contentHours: 20,
  hourlyRate: 25,
  supportHours: 5,
  feeStackKey: DEFAULT_FEE_STACK_KEY,
};

export interface Flag {
  code: string;
  title: string;
  detail: string;
}

export interface Scenario {
  /** Label like "realistic" / "best" / "worst". */
  label: string;
  /** Expected members at this conversion. */
  members: number;
  /** Gross monthly revenue at blended monthly/annual pricing. */
  grossRevenue: number;
  /** Platform + processing fees. */
  fees: number;
  /** Net monthly revenue after fees and fixed platform fee. */
  netRevenue: number;
  /** Average member lifetime value at this churn. */
  ltvPerMember: number;
}

export interface MembershipSiteResult {
  scenarios: Scenario[];
  /** Break-even audience size for the realistic case to cover content hours. */
  breakEvenAudience: number;
  /** Net revenue at realistic conversion vs same hours spent on one-off pattern sales. */
  treadmillGap: number;
  /** Months of net revenue equal to one month of content-hours cost. */
  treadmillRatio: number;
  flags: Flag[];
  verdict: string;
  verdictNote: string;
}

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

interface EffectiveInput extends MembershipSiteInput {
  feeStack: FeeStack;
}

function scenario(label: string, conversion: number, input: EffectiveInput): Scenario {
  const members = input.audienceSize * conversion;
  const blended =
    input.annualPrice > 0
      ? input.monthlyPrice * (1 - input.annualShare) + (input.annualPrice / 12) * input.annualShare
      : input.monthlyPrice;
  const grossRevenue = members * blended;
  const fees = grossRevenue * input.feeStack.platformCut + grossRevenue * input.feeStack.processorCut + input.feeStack.processorFixed * Math.max(1, Math.round(members)) + input.feeStack.platformMonthlyFee;
  const netRevenue = Math.max(0, grossRevenue - fees);
  const ltvPerMember = input.monthlyChurn > 0 ? blended / input.monthlyChurn : blended * 36;
  return { label, members, grossRevenue, fees, netRevenue, ltvPerMember };
}

export function analyzeMembershipSite(input: MembershipSiteInput): MembershipSiteResult {
  const feeStack = FEE_STACKS[input.feeStackKey]?.stack ?? FEE_STACKS[DEFAULT_FEE_STACK_KEY].stack;
  const effective: EffectiveInput = { ...input, feeStack };

  const blended =
    effective.annualPrice > 0
      ? effective.monthlyPrice * (1 - effective.annualShare) + (effective.annualPrice / 12) * effective.annualShare
      : effective.monthlyPrice;

  const scenarios = [
    scenario('worst', effective.conversionWorst, effective),
    scenario('realistic', effective.conversionRealistic, effective),
    scenario('best', effective.conversionBest, effective),
  ];

  const realistic = scenarios[1];

  // Break-even audience: audience where realistic net revenue covers content-hours cost.
  const monthlyCost = (effective.contentHours + effective.supportHours) * effective.hourlyRate;
  const perMemberNet =
    blended * (1 - feeStack.platformCut - feeStack.processorCut) - feeStack.processorFixed - feeStack.platformMonthlyFee / Math.max(1, effective.audienceSize * effective.conversionRealistic);
  const breakEvenAudience = perMemberNet > 0 ? Math.ceil(monthlyCost / perMemberNet / effective.conversionRealistic) : Infinity;

  // Treadmill: compare net revenue to what the same hours earn at the opportunity rate.
  const treadmillGap = realistic.netRevenue - monthlyCost;
  const treadmillRatio = monthlyCost > 0 ? realistic.netRevenue / monthlyCost : Infinity;

  const flags: Flag[] = [];

  // MS-01 — audience too small for club viability at realistic conversion.
  if (realistic.members < 10) {
    flags.push({
      code: 'MS-01',
      title: 'Audience too small for a club yet',
      detail: `At ${effective.conversionRealistic * 100}% conversion of ${effective.audienceSize.toLocaleString('en-US')} engaged followers you'd have ≈${realistic.members.toFixed(0)} members. Small clubs meaningfully work from ≈30-50 members. Grow the free-audience funnel first — the club is the monetization of the audience you already have, not a way to find one.`,
    });
  }

  // MS-02 — conversion assumption too rosy.
  if (effective.conversionRealistic > 0.08) {
    flags.push({
      code: 'MS-02',
      title: 'Conversion assumption is optimistic',
      detail: `Median free-to-paid conversion for newsletters is just 0.62%; structured paid communities hit 5-12% only with onboarding. ${effective.conversionRealistic * 100}% is above the 8% sweet spot — model 3% as the realistic band.`,
    });
  }

  // MS-03 — churn destroys LTV.
  if (effective.monthlyChurn > 0.1) {
    flags.push({
      code: 'MS-03',
      title: 'Churn erases member value',
      detail: `At ${effective.monthlyChurn * 100}% monthly churn a member stays ≈${(1 / effective.monthlyChurn).toFixed(0)} months on average, worth only $${realistic.ltvPerMember.toFixed(0)} lifetime. LTV collapses below one year of pattern value — prioritize onboarding, pattern quality, and a community reason to stay before spending on acquisition.`,
    });
  }

  // MS-04 — fee stack eats >10%.
  const feeShare = realistic.grossRevenue > 0 ? realistic.fees / realistic.grossRevenue : 0;
  if (feeShare > 0.1) {
    flags.push({
      code: 'MS-04',
      title: `Fees eat ${(feeShare * 100).toFixed(0)}% of revenue`,
      detail: `The platform cut plus per-transaction processing takes $${realistic.fees.toFixed(0)}/mo. Small monthly prices bleed hardest: a $7 plan on Payhip's free stack loses ≈8-9% to fees. Moving to annual plans or a $29/mo host cuts per-payment overhead dramatically.`,
    });
  }

  // MS-05 — content treadmill underpays.
  if (treadmillGap < -100) {
    flags.push({
      code: 'MS-05',
      title: 'The pattern treadmill underpays',
      detail: `The club nets $${realistic.netRevenue.toFixed(0)}/mo but ${(effective.contentHours + effective.supportHours)} hours at $${effective.hourlyRate}/hr cost $${monthlyCost.toFixed(0)}. Releasing the same pattern on Ravelry/Etsy at your usual price likely earns more — run the club for audience love, not hours.`,
    });
  }

  // MS-06 — annual discount too deep.
  if (effective.annualPrice > 0 && effective.annualShare > 0.5 && effective.annualPrice < effective.monthlyPrice * 9) {
    flags.push({
      code: 'MS-06',
      title: 'Annual discount is steep',
      detail: `Over half the members on the annual plan at ${(effective.annualPrice / 12).toFixed(2)}/mo effective price compresses blended revenue. Annual saves members ≈2 months but pays you per-member churn risk down to one payment per year — ${Math.round(effective.annualShare * 100)}% annual share leaves little monthly flexibility.`,
    });
  }

  // MS-07 — no support/moderation plan.
  if (effective.supportHours <= 0 && realistic.members >= 20) {
    flags.push({
      code: 'MS-07',
      title: 'Member support hours missing',
      detail: `${realistic.members.toFixed(0)} members at your quality bar mean pattern questions, tech support, and community moderation. Even 2-4 hours/month protects retention — unpaid support time is the quiet churn driver.`,
    });
  }

  // ---- Verdict ladder ----
  let verdict: string;
  let verdictNote: string;

  if (effective.audienceSize < 200) {
    verdict = 'Not ready — grow the audience first';
    verdictNote = `A club monetizes the audience you already have. At ${effective.audienceSize.toLocaleString('en-US')} engaged followers, even an 8% conversion is under 20 members. Put energy into the free-pattern funnel (Ravelry, newsletters, socials) until the audience supports ≈30+ members at a realistic 3% conversion — around ${(breakEvenAudience === Infinity ? '∞' : breakEvenAudience.toLocaleString('en-US'))} followers for your numbers.`;
  } else if (treadmillGap < 0) {
    verdict = 'Club pays less than your hours — launch for love, not money';
    verdictNote = `At realistic conversion the club nets $${realistic.netRevenue.toFixed(0)}/mo against $${monthlyCost.toFixed(0)} in content-hours cost — the treadmill costs you $${Math.abs(treadmillGap).toFixed(0)} more per month than selling patterns outright would pay for those hours. If the community itself is worth it to you, launch lean (monthly-only pricing, minimal support tiers) and re-run this lab at 30+ members.`;
  } else if (realistic.members < 30) {
    verdict = 'Borderline — small club, launch lean';
    verdictNote = `≈${realistic.members.toFixed(0)} members at $${blended.toFixed(2)}/mo blended nets $${realistic.netRevenue.toFixed(0)}/mo after fees — real money, but small enough that one bad month of churn bites hard. Start monthly-only, cap the content treadmill at one pattern, and let retention build the LTV before adding tiers.`;
  } else if (treadmillRatio < 1.5) {
    verdict = 'Club pays, but the treadmill bites';
    verdictNote = `The club nets $${realistic.netRevenue.toFixed(0)}/mo — $${treadmillGap.toFixed(0)} over the cost of ${(effective.contentHours + effective.supportHours)} hours at $${effective.hourlyRate}/hr. It beats doing nothing, but the margin is thin: churn one spike and the month is underwater. Lengthen member lifetime with onboarding before adding patterns per month.`;
  } else {
    verdict = 'Fund the club — the numbers support it';
    verdictNote = `≈${realistic.members.toFixed(0)} members at realistic conversion net $${realistic.netRevenue.toFixed(0)}/mo after the ${(feeShare * 100).toFixed(0)}% fee stack — $${treadmillGap.toFixed(0)} over your content-hours cost, with $${realistic.ltvPerMember.toFixed(0)} LTV per member. Real clubs at $7-17/mo live exactly here. Lock annual pricing from day one: it cuts fee overhead and churn exposure together.`;
  }

  return { scenarios, breakEvenAudience, treadmillGap, treadmillRatio, flags, verdict, verdictNote };
}

export function fmt$(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}
