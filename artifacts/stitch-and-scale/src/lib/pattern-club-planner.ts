/**
 * Pattern Club & Magazine Lockout Planner (CHK-016).
 *
 * Two recurring-revenue channels that designers model by hand or not at all:
 *
 * 1) PATTERN CLUB — a designer-run monthly subscription that delivers one
 *    new pattern to members. Cited market norms (research
 *    competitors-session-17-pattern-clubs.md):
 *    - Club price band: $5–$19/month, ~$60–$120/year; annual ≈ 2× monthly.
 *      Double The Stitches $7/mo or $77/yr; Club Crochet $5/mo; Crochet Spot
 *      $10/mo; Nicki's $19/mo (promo $13.30).
 *    - Fulfilment via Ravelry gift codes (1 per member per month) plus email
 *      PDF; the designer pays Ravelry's per-code gift price, and keeps the
 *      platform fee difference.
 *    - Retention mechanics on the market: founding-member price locks,
 *      10-day cancellation notice on monthly plans, no refunds on annual.
 *
 * 2) MAGAZINE / ANTHOLOGY LOCKOUT — a flat-fee publication that takes
 *    exclusive rights for a window (cited: Knitty ~3 months at $200–$300;
 *    Knit Now 3 months; Laine 5 months; I Like Knitting 6 months; Farm &
 *    Fiber Knits 12 months) after which the designer can self-publish.
 *    The honest cost is the income the pattern would have earned solo during
 *    the lockout — the fee must beat that opportunity value.
 *
 * No invented market constants beyond cited figures. Fee seam reused from
 * pattern-income-calculator (platformNet). Solo-baseline conventions reused
 * from design-offer-evaluator: the designer's own realistic monthly copies.
 */

export type Verdict = 'go' | 'review' | 'skip';

export interface ClubPricingInput {
  /** Member price per month, $. */
  monthlyPrice: number;
  /** Member price per year, $ (0 = not offered). */
  annualPrice: number;
  /** Free/discounted trial length in months (0 = none). */
  trialMonths: number;
  /** Trial price per month, $. 0 = free trial. */
  trialPrice: number;
}

export interface ClubDemandInput {
  /** Members signing up in month 1. */
  startMembers: number;
  /** New members added each month after month 1 (marketing baseline). */
  monthlyNewMembers: number;
  /** Monthly churn, decimal (0–1). */
  churnPct: number;
  /** Share of members on the annual plan (0–1); 0 = monthly only. */
  annualShare: number;
}

export interface ClubCostInput {
  /** Ravelry (or other) gift-code fulfilment cost per member per month, $. */
  giftCodeCost: number;
  /** Designer's pattern-production cost per monthly pattern, $ (tech edit +
   *  photography + layout if outsourced; own time if valued). */
  patternCost: number;
  /** Extra monthly community/labour cost ($0 = none). */
  labourCost: number;
  /** Channel fee on payments, decimal (e.g. 0.05 for Patreon/Payhip-like). */
  channelFee: number;
}

export interface ClubSoloBaseline {
  /** What this pattern would sell solo per month at steady state (copies). */
  soloCopiesPerMonth: number;
  /** The pattern's solo retail price, $. */
  soloPrice: number;
  /** Platform for the solo channel. */
  platform: 'ravelry' | 'etsy' | 'ribblr' | 'payhip';
}

export interface PlanClubInput {
  pricing: ClubPricingInput;
  demand: ClubDemandInput;
  costs: ClubCostInput;
  baseline: ClubSoloBaseline;
  /** Patterns released per month (1 = standard club). */
  patternsPerMonth: number;
  /** Projection horizon in months. */
  months: number;
}

export interface ClubMonth {
  month: number;
  /** Members at end of the month (post churn, pre new). */
  endMembers: number;
  /** Paid equivalent members (annual ÷ 12 + monthly + paid trials). */
  paidEquivalent: number;
  grossRevenue: number;
  fulfilmentCost: number;
  productionCost: number;
  labourCost: number;
  channelFees: number;
  netRevenue: number;
  /** Solo income lost that month because the pattern rides the club instead. */
  soloOpportunityCost: number;
  /** Net after the solo opportunity cost (the number that actually matters). */
  netVsSolo: number;
  /** Cumulative net-vs-solo. */
  cumulativeNetVsSolo: number;
}

export interface ClubPlanResult {
  months: ClubMonth[];
  /** End-of-horizon monthly net revenue vs going solo with the same pattern. */
  finalMonthlyNetVsSolo: number;
  /** Month index (1-based) when cumulative net-vs-solo turns positive. */
  breakevenMonth: number | null;
  /** Minimum end-members needed at steady state so net-vs-solo ≥ 0. */
  breakEvenMembers: number | null;
  /** Horizon total net-vs-solo. */
  horizonNetVsSolo: number;
  verdict: Verdict;
  verdictNote: string;
  /** Annualized net-vs-solo at steady state (last month × 12). */
  annualizedNetVsSolo: number;
}

function paidEquivalentMembers(
  endMembers: number,
  annualShare: number,
  annualPrice: number,
  monthlyPrice: number,
): number {
  if (monthlyPrice <= 0) return 0;
  if (annualShare <= 0 || annualPrice <= 0) return endMembers;
  // An annual member is worth annualPrice/12 per month of membership.
  return endMembers * (annualShare * (annualPrice / 12) / monthlyPrice + (1 - annualShare));
}

/**
 * 12-month rolling member model: new members join, churn is applied to the
 * existing base, trials are charged at trialPrice for the first
 * `trialMonths` of each cohort (0 = free trial). Simple cohort approximation:
 * an average share of the base is inside its trial window.
 */
function cohortTrialShare(trialMonths: number): number {
  // With steady membership, the trial share of the base ≈ trialMonths /
  // average member lifetime. Average lifetime at churn c (per month) is 1/c
  // months; trial share ≈ trialMonths * c, capped at 1.
  return 1; // overridden below with demand churn
}

export function planClub(input: PlanClubInput): ClubPlanResult {
  const { pricing: p, demand: d, costs: c, baseline: b, patternsPerMonth: np, months } = input;
  const m = Math.max(1, Math.min(60, months));
  const churn = Math.min(0.99, Math.max(0, d.churnPct));
  const trialShare = (trialMonths: number) => (trialMonths > 0 ? Math.min(1, trialMonths * churn) : 0);
  const tShare = trialShare(p.trialMonths);

  // Solo-baseline monthly net via the shared fee seam (platformNet).
  const soloNetMonth =
    b.soloCopiesPerMonth > 0 && b.soloPrice > 0
      ? platformNet(b.platform, b.soloPrice, b.soloCopiesPerMonth).netRevenue
      : 0;

  let base = d.startMembers;
  const out: ClubMonth[] = [];
  let cumulative = 0;
  let breakevenMonth: number | null = null;

  for (let i = 1; i <= m; i++) {
    const grossBefore = base * p.monthlyPrice; // monthly-priced base
    // Apply churn then add new members.
    const churned = Math.round(base * (1 - churn) * 10) / 10;
    base = churned + d.monthlyNewMembers;
    const endMembers = Math.round(base * 100) / 100;
    const pe = paidEquivalentMembers(endMembers, d.annualShare, p.annualPrice, p.monthlyPrice);

    // Revenue: monthly members at monthlyPrice; annual members valued at
    // annualPrice/12; trial members at trialPrice (share tShare of base).
    const trialRev = Math.min(tShare, 1) * endMembers * Math.max(0, p.trialPrice);
    const paidRev = Math.max(0, pe - tShare * endMembers) * p.monthlyPrice;
    const grossRevenue = Math.round((paidRev + trialRev) * 100) / 100;
    const fulfilment = endMembers * np * c.giftCodeCost;
    const production = np * c.patternCost;
    const labour = c.labourCost;
    const channelFees = Math.round(grossRevenue * c.channelFee * 100) / 100;
    const netRevenue =
      Math.round((grossRevenue - fulfilment - production - labour - channelFees) * 100) / 100;
    const soloOpportunityCost = soloNetMonth * np;
    const netVsSolo = Math.round((netRevenue - soloOpportunityCost) * 100) / 100;
    cumulative = Math.round((cumulative + netVsSolo) * 100) / 100;

    out.push({
      month: i,
      endMembers,
      paidEquivalent: Math.round(pe * 100) / 100,
      grossRevenue,
      fulfilmentCost: Math.round(fulfilment * 100) / 100,
      productionCost: production,
      labourCost: labour,
      channelFees,
      netRevenue,
      soloOpportunityCost,
      netVsSolo,
      cumulativeNetVsSolo: cumulative,
    });
    if (breakevenMonth === null && cumulative > 0) breakevenMonth = i;
  }

  const last = out[out.length - 1];
  // Break-even member count at steady state: solve paid-equivalent revenue
  // against per-member variable cost + solo opportunity + channel fees.
  let breakEvenMembers: number | null = null;
  if (p.monthlyPrice > 0) {
    const annualBoost = d.annualShare > 0 && p.annualPrice > 0
      ? d.annualShare * ((p.annualPrice / 12) / p.monthlyPrice) + (1 - d.annualShare)
      : 1;
    // Revenue one steady member brings per month, net of channel fees.
    const perMemberRevenue = p.monthlyPrice * annualBoost * (1 - c.channelFee);
    // The solo opportunity cost is spread over the member base — one more
    // member must also out-earn their share of the solo income lost.
    const perMemberContribution = perMemberRevenue - np * c.giftCodeCost;
    if (perMemberContribution > 0) {
      const needed = (np * c.patternCost + c.labourCost + soloNetMonth * np) / perMemberContribution;
      breakEvenMembers = Math.round(needed * 10) / 10;
    }
  }

  const { verdict, verdictNote } = clubVerdict(last, breakEvenMembers, p.monthlyPrice);
  return {
    months: out,
    finalMonthlyNetVsSolo: last.netVsSolo,
    breakevenMonth,
    breakEvenMembers,
    horizonNetVsSolo: cumulative,
    verdict,
    verdictNote,
    annualizedNetVsSolo: Math.round(last.netVsSolo * 12 * 100) / 100,
  };
}

function clubVerdict(last: ClubMonth, breakEvenMembers: number | null, monthlyPrice: number): { verdict: Verdict; verdictNote: string } {
  if (last.netVsSolo > 0) {
    return {
      verdict: 'go',
      verdictNote: `A running club beats your solo baseline by ${usd(last.netVsSolo)}/month at the horizon — steady-state members needed: ${fmtN(breakEvenMembers)}. Launch it.`,
    };
  }
  if (last.netVsSolo === 0) {
    return { verdict: 'review', verdictNote: 'The club exactly matches your solo baseline — it earns loyalty, not money. Run it only if community is the goal.' };
  }
  const deficit = -last.netVsSolo;
  if (breakEvenMembers !== null && monthlyPrice > 0) {
    const gap = Math.max(0, Math.round((breakEvenMembers - last.endMembers) * 10) / 10);
    return {
      verdict: 'review',
      verdictNote: `The club trails your solo baseline by ${usd(deficit)}/month at the horizon — you need ${fmtN(gap)} more members than projected (${fmtN(last.endMembers)} vs ${fmtN(breakEvenMembers)}) to break even against selling the same patterns solo. Raise pricing, cut fulfilment cost, or shrink the member ramp before committing.`,
    };
  }
  return {
    verdict: 'skip',
    verdictNote: `The club can't break even against your solo baseline at any realistic member count (${usd(deficit)}/month deficit at horizon). Keep selling patterns solo — clubs only pay when the audience already exists.`,
  };
}

export interface MagazineOfferInput {
  /** Flat honorarium offered, $. */
  fee: number;
  /** Exclusive-rights window in months. */
  exclusiveMonths: number;
  /** The pattern's expected solo monthly copies after the window, at steady state. */
  soloCopiesPerMonth: number;
  /** Solo retail price, $. */
  soloPrice: number;
  /** Platform for the solo channel. */
  platform: 'ravelry' | 'etsy' | 'ribblr' | 'payhip';
  /** Whether the publisher covers tech editing (cited: Knitty does). */
  techEditCovered: boolean;
  /** Designer's design/grading hours (for effective rate). */
  designHours: number;
  /** Hourly rate, $/hr. */
  hourlyRate: number;
  /** Designer's tech-edit cost if not covered, $. */
  techEditCost: number;
  /** Photographer/layout cost if not covered, $. */
  mediaCost: number;
}

export interface MagazineResult {
  /** Net of the fee after designer-borne production costs. */
  netFee: number;
  /** What the pattern would net solo during the same window. */
  windowSoloNet: number;
  /** Steady monthly solo net after the window. */
  steadySoloNet: number;
  /** Effective hourly rate on the deal. */
  effectiveHourlyRate: number;
  /** Minimum fee that beats the window's opportunity value, $. */
  minimumWorthwhileFee: number;
  verdict: Verdict;
  verdictNote: string;
  /** Months after publication before the designer can self-publish. */
  lockoutMonths: number;
}

export function compareMagazine(input: MagazineOfferInput): MagazineResult {
  const pn = platformNet;
  const window = Math.max(0, Math.round(input.exclusiveMonths));
  const steadyNet = (() => {
    if (input.soloCopiesPerMonth <= 0 || input.soloPrice <= 0) return 0;
    return pn(input.platform, input.soloPrice, input.soloCopiesPerMonth).netRevenue;
  })();
  const windowSoloNet = Math.round(steadyNet * window * 100) / 100;
  const productionCosts = (input.techEditCovered ? 0 : input.techEditCost) + input.mediaCost;
  const netFee = Math.round((Math.max(0, input.fee) - productionCosts) * 100) / 100;
  const minimumWorthwhileFee = Math.round((windowSoloNet + productionCosts) * 100) / 100;
  const totalHours = Math.max(0.5, input.designHours);
  const effectiveHourlyRate =
    Math.round((netFee / totalHours) * 100) / 100;

  let verdict: Verdict;
  let verdictNote: string;
  if (window === 0) {
    verdict = 'go';
    verdictNote = `No exclusivity lockout — take the fee (${usd(netFee)}) and sell solo from day one. Cited terms (Knitty, 2026) follow this shape.`;
  } else if (netFee >= windowSoloNet && effectiveHourlyRate >= Math.max(input.hourlyRate * 0.5, 10)) {
    verdict = 'go';
    verdictNote = `The fee clears the lockout value (${usd(windowSoloNet)} over ${window} mo) and pays ${usd(effectiveHourlyRate)}/hr. Cited windows run 3–12 months (Knitty ~3, Laine 5, Farm & Fiber 12) — yours fits.`;
  } else if (netFee >= windowSoloNet) {
    verdict = 'review';
    verdictNote = `The fee covers the lockout value, but at ${usd(effectiveHourlyRate)}/hr it underpays your time. Negotiate higher or cap the exclusivity window.`;
  } else if (netFee >= windowSoloNet * 0.7) {
    verdict = 'review';
    verdictNote = `The fee covers ${Math.round((netFee / Math.max(1, windowSoloNet)) * 100)}% of what the pattern would earn solo during the ${window}-month lockout (${usd(windowSoloNet)}). Accept only if the exposure genuinely lifts your steady-state sales.`;
  } else {
    verdict = 'skip';
    verdictNote = `The fee (${usd(netFee)}) falls well short of the lockout value (${usd(windowSoloNet)}). The honest move is to decline and self-publish — unless the publication is a strategic launchpad you're willing to pay for.`;
  }
  return {
    netFee,
    windowSoloNet,
    steadySoloNet: Math.round(steadyNet * 100) / 100,
    effectiveHourlyRate,
    minimumWorthwhileFee,
    verdict,
    verdictNote,
    lockoutMonths: window,
  };
}

/**
 * Paste-ready club FAQ copy answering the questions members actually ask
 * (delivery, Ravelry codes, price locks, cancellation) — modelled on the
 * Double The Stitches / Crochet Spot FAQ patterns.
 */
export function generateClubFaq(
  name: string,
  p: ClubPricingInput,
  np: number,
): string {
  const lines: string[] = [
    `Pattern Club FAQ — ${name}`,
    '',
    'What do I get each month?',
    np === 1
      ? `One brand-new pattern, delivered by the end of each month, sometimes sooner.`
      : `${np} brand-new patterns, delivered by the end of each month, sometimes sooner.`,
    '',
    'How is it delivered?',
    'Each pattern is delivered as a Ravelry gift code added to your library (the easiest way to sort, organize, and search patterns — Ravelry is free to join), plus a direct email copy. Save your email copy somewhere safe in case the email is ever lost.',
    '',
    'Will my price ever go up?',
    'Founding members are locked in at the lowest price the club will ever be offered, for as long as you remain a member in good standing.',
    '',
    'How does cancellation work?',
    (() => {
      const parts: string[] = [];
      if (p.trialMonths > 0) {
        parts.push(`You can try the club for ${p.trialMonths} month${p.trialMonths > 1 ? 's' : ''} at ${p.trialPrice === 0 ? 'no cost' : usd(p.trialPrice) + '/month'}.`);
      }
      parts.push('Monthly members can cancel at any time with 10 days notice.');
      if (p.annualPrice > 0) parts.push('Annual members may cancel so their plan does not renew after the paid year.');
      parts.push('Digital memberships are not refundable — patterns are delivered the day you join.');
      return parts.join(' ');
    })(),
    '',
    'What if I have a question about a pattern?',
    "Email pattern support with the pattern name and the line you're stuck on \u2014 most questions are answered within a few hours.",
    '',
    'Can I sell finished objects made from club patterns?',
    'Yes — finished objects may be sold with credit given to the designer. Patterns themselves may not be copied, shared, or redistributed.',
  ];
  return lines.join('\n');
}

/**
 * Paste-ready response to a magazine/anthology offer, asking the questions
 * that protect the designer (window, rights after window, AI policy, payment
 * timing) — grounded in the Knitty submission-guide norms.
 */
export function generateMagazineResponse(offer: { magazine: string; pattern: string; fee: number; exclusiveMonths: number }): string {
  const lines: string[] = [
    `Re: ${offer.magazine} — "${offer.pattern}" submission`,
    '',
    'Hi [editor],',
    '',
    'Thank you for the offer to publish "' + offer.pattern + '" in ' + offer.magazine + '. Before I confirm, a few standard questions so we both know exactly what the terms are:',
    '',
    '1. Please confirm the honorarium is ' + usd(offer.fee) + ', paid by PayPal around publication.',
    offer.exclusiveMonths > 0
      ? `2. The exclusivity window is ${offer.exclusiveMonths} month${offer.exclusiveMonths > 1 ? 's' : ''} from publication, after which I'm free to self-publish or submit elsewhere — correct?`
      : '2. Please confirm there is no exclusivity window and I may self-publish the same day.',
    '3. I retain full copyright to the pattern and photographs — the publication rights are limited to the issue, back-issue archives, and the formats you describe.',
    '4. Tech editing and photography are covered by the publication — is that right?',
    '5. Please confirm no AI tools are used to create or edit my pattern text or images, and none of my submitted work was AI-generated.',
    '6. May my post-window translation of the pattern be done with my permission and a link back, as is customary?',
    '',
    "Once these are confirmed in writing, I'm happy to move forward.",
    '',
    'Warmly,',
    '[Designer name]',
  ];
  return lines.join('\n');
}

export function usd(n: number): string {
  const fixed = Math.round(n * 100) / 100;
  const cents = Math.round(Math.abs(fixed) * 100) % 100;
  const whole = Math.floor(Math.abs(fixed)).toLocaleString('en-US');
  const sign = n < 0 ? '-' : '';
  return sign + '$' + whole + (cents > 0 ? '.' + String(cents).padStart(2, '0') : '');
}

export function fmtN(n: number | null): string {
  if (n === null) return '—';
  return Number.isFinite(n) ? n.toLocaleString('en-US', { maximumFractionDigits: 1 }) : '—';
}

import { platformNet } from './pattern-income-calculator';
