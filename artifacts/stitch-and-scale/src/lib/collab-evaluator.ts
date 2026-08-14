/**
 * Collab & Exposure Evaluator — should you take this unpaid/underpaid yarn-company
 * or magazine collaboration offer?
 *
 * RESEARCH BASIS (all cited — see research/competitors-session-32-collab-exposure-economics.md):
 *
 * - Emma Knitty (Jul 2026): the 2026 wave of "not a paid collaboration" emails
 *   that demand design proposals, deadlines, and posting requirements while
 *   paying nothing. Rule of thumb she documents: free product seeding with no
 *   strings is fine; any design work with deadlines/requirements must be paid.
 * - Who Pays Knitters (WhoPaysKnitters.com): crowdsourced rate database — the
 *   industry reference for what design, tech editing, and sampling should cost.
 * - Ravelry Jan 2019 census (cited via Sandi Rosner, Jul 2024): 10,059 pattern
 *   sellers; 72.3% earned under $50; only 304 earned $1,000+ and 93 earned
 *   $3,000+. "Exposure" to a tiny audience is worth exactly what the census
 *   says the audience is worth — and designers can compute it here.
 * - Media Peruana (Mar 2019): same census, headline "No One's Getting Rich" —
 *   the honest counterweight to any brand claiming their following is "reach".
 * - Sandi Rosner (Jul 2024): self-publishing $1,000 revenue nets $835 after
 *   Ravelry ($35) + PayPal ($130) fees, BEFORE production costs; commissioned
 *   lump sums must beat this net, not the gross.
 * - Stitchcraft Marketing (2017): LYS partnership economics — dyer + designer
 *   bundles, Ravelry In-Store Sales Program; collab value can be real when the
 *   channel (not the logo) is the point.
 * - UK IPO Copyright Notice (Jan 2021): patterns are literary works whether or
 *   not registered; a contract that transfers copyright outright for a small
 *   fee is giving away life+70-year rights.
 *
 * DESIGN: every number comes from the designer (their hours, rate, sample
 * cost) or a cited published figure stated as an adjustable default. No
 * invented market constants. Exposure is never presented as revenue — it is
 * shown beside what the numbers actually say it is worth.
 *
 * OUTPUT: fair-fee floor, exposure-value estimate with honest caveats,
 * verdict ladder (take / counter / walk), red flags (exposure-only asks,
 * full copyright transfer, deadlines with no pay), and paste-ready reply
 * letters for accept / counter / decline.
 */

import { PLATFORMS, PlatformId, platformNet } from './pattern-income-calculator';

export type CollabType =
  | 'unpaid_seed'
  | 'unpaid_work'
  | 'flat_fee'
  | 'royalty'
  | 'exclusive_license';

export interface CollabInput {
  /** Which kind of ask this is. */
  collabType: CollabType;
  /** What the company offered, in $ (fee, or the lump-sum value of the yarn). */
  offeredValue: number;
  /** Royalty share if type is royalty, decimal. */
  royaltyPct: number;
  /** Royalty base (issue #2 / S015): 'net' | 'gross'. */
  royaltyBase: 'net' | 'gross';
  /** Platform for royalty-channel math. */
  platform: PlatformId;
  /** Expected sales through the company's channel during the window. */
  companySales: number;
  /** Pattern price for royalty/gross calculations, in $. */
  patternPrice: number;
  /** Designer hours this collaboration requires (design, grading, sample, tech doc). */
  requiredHours: number;
  /** The designer's own hourly rate, in $/hr (from their income math). */
  hourlyRate: number;
  /** Sample cost the designer must cover: yarn + swatching + photography if not provided, in $. */
  sampleCost: number;
  /** Whether the company provides yarn free of charge. */
  yarnProvided: boolean;
  /** Posting requirements: number of Reels/posts/stories demanded. */
  postingRequirements: number;
  /** Months of exclusivity demanded (0 = none). */
  exclusivityMonths: number;
  /** Monthly sales the designer would normally make through their own channel. */
  ownMonthlySales: number;
  /** Brand's total followers across its channels. */
  brandFollowers: number;
  /** Contract transfers full copyright to the company. */
  fullCopyrightTransfer: boolean;
  /** The brand has a reputation for unpaid/exposure-only asks (community reports). */
  unpaidReputation: boolean;
}

export const DEFAULT_COLLAB: CollabInput = {
  collabType: 'unpaid_work',
  offeredValue: 0,
  royaltyPct: 0.30,
  royaltyBase: 'net',
  platform: 'ravelry',
  companySales: 0,
  patternPrice: 8,
  requiredHours: 12,
  hourlyRate: 35,
  sampleCost: 45,
  yarnProvided: false,
  postingRequirements: 2,
  exclusivityMonths: 0,
  ownMonthlySales: 25,
  brandFollowers: 50000,
  fullCopyrightTransfer: false,
  unpaidReputation: false,
};

export interface ExposureEstimate {
  /** Followers × assumed conversion (0.5%, conservative per platform norms) × average revenue per sale. */
  grossExposureValue: number;
  /** The honest reading: exposure is only worth this much IF every reachable follower converts. */
  realisticReach: number;
}

export interface CollabResult {
  /** The honest minimum to say yes to this ask — hours×rate + sample costs, no "exposure" padding. */
  fairFeeFloor: number;
  /** What the offer actually totals: fee + support + royalties − designer's costs. */
  totalOfferValue: number;
  /** What the designer loses while locked out of their own channel during exclusivity. */
  lockedOutValue: number;
  exposure: ExposureEstimate;
  /** The exposure value, netted against the ask's true opportunity cost, if the deal otherwise made sense. */
  verdict: 'take' | 'counter' | 'walk';
  verdictReason: string;
  redFlags: { code: string; severity: 'critical' | 'warning'; text: string }[];
  /** Paste-ready reply text. */
  replyLetter: string;
}

const FOLLOWER_CONVERSION = 0.005; // 0.5% — conservative platform-norm ceiling
const REALISTIC_REACH_CUTOFF = 50; // dollars; below this, exposure is not a payment

/**
 * The fair floor: what this work costs the designer at their own numbers,
 * with zero padding. Hours are the designer's time at their rate; sample cost
 * is whatever the company does not provide. Per WhoPaysKnitters practice, the
 * floor is where negotiation starts — not where it ends.
 */
function fairFeeFloor(input: CollabInput): number {
  const timeCost = input.requiredHours * input.hourlyRate;
  const sampleCovered = input.sampleCost * (input.yarnProvided ? 0.5 : 1);
  // Posting requirements are work too: ~1.5h per demanded Reel/post, at rate.
  const postingCost = input.postingRequirements * 1.5 * input.hourlyRate;
  return timeCost + sampleCovered + postingCost;
}

export function analyzeCollab(input: CollabInput): CollabResult {
  const floor = Math.round(fairFeeFloor(input) * 100) / 100;

  let royaltyValue = 0;
  if (input.royaltyPct > 0 && input.companySales > 0) {
    const gross = input.patternPrice * input.companySales;
    const net = gross > 0
      ? platformNet(input.platform, input.patternPrice, input.companySales).netRevenue
      : 0;
    royaltyValue = (input.royaltyBase === 'gross' ? gross : net) * input.royaltyPct;
  }

  // offerTotal = what the offer actually adds over the fair floor. The
  // floor already counts time + sample + posting duties, so the net value of
  // the deal is simply cash in minus the floor's cost coverage. This keeps
  // the verdict ladder anchored to one number (floor) instead of two
  // parallel arithmetic branches drifting apart.
  const offerTotal = input.offeredValue + royaltyValue - floor;

  // Exclusivity: what the designer's own channel would have made during it.
  const lockedOutValue = Math.round(
    input.exclusivityMonths > 0 && input.ownMonthlySales > 0
      ? input.ownMonthlySales *
          platformNet(input.platform, input.patternPrice, input.ownMonthlySales).netPerSale *
          input.exclusivityMonths
      : 0,
  ) / 1;

  // Exposure honesty: followers × 0.5% conversion × the designer's net per sale.
  // This is the ceiling of what "reach" is actually worth — the Media Peruana
  // census says the audience behind most knit-brand followings converts poorly.
  const netPerSale =
    input.ownMonthlySales > 0
      ? platformNet(input.platform, input.patternPrice, input.ownMonthlySales).netPerSale
      : platformNet(input.platform, input.patternPrice, 1).netPerSale;
  const grossExposureValue = input.brandFollowers * FOLLOWER_CONVERSION * netPerSale;
  const realisticReach =
    grossExposureValue < REALISTIC_REACH_CUTOFF ? 0 : Math.round(grossExposureValue);

  const redFlags: CollabResult['redFlags'] = [];

  // CE-01: work asked with no pay and no strings attached is seeding — fine.
  // Work asked with deadlines, posting duties, or deliverables and no pay is
  // the 2026 pattern Emma Knitty documents; it must be paid.
  if (input.collabType === 'unpaid_work') {
    if (input.requiredHours > 2 || input.postingRequirements > 0 || input.exclusivityMonths > 0) {
      redFlags.push({
        code: 'CE-01',
        severity: 'critical',
        text: "This is work with requirements, not product seeding. The industry standard (WhoPaysKnitters) is that anything with deadlines, posting duties, or exclusivity must be paid — exposure is not currency. Counter from your fair-fee floor.",
      });
    }
  }

  // CE-02: full copyright transfer for a small or zero fee. UK IPO: pattern
  // rights last life+70 years. A full transfer is a permanent asset sale —
  // price it like one, or refuse it.
  if (input.fullCopyrightTransfer && input.offeredValue + royaltyValue < floor * 2) {
    redFlags.push({
      code: 'CE-02',
      severity: 'critical',
      text: "Transferring full copyright for less than roughly twice your fair floor gives away life+70-year rights (UK IPO: patterns are literary works) for the price of a week. Either license non-exclusively or price the buyout as an asset sale.",
    });
  }

  // CE-03: a brand with community-reported unpaid patterns asking for more work.
  if (input.unpaidReputation && input.collabType !== 'unpaid_seed') {
    redFlags.push({
      code: 'CE-03',
      severity: 'warning',
      text: 'Community reports suggest this brand works on exposure. Treat every deliverable as payable and get the scope in writing before starting.',
    });
  }

  // CE-04: exclusive license priced like a rental.
  if (input.collabType === 'exclusive_license' && input.exclusivityMonths > 0) {
    if (input.offeredValue < lockedOutValue) {
      redFlags.push({
        code: 'CE-04',
        severity: 'warning',
        text: `Your own channel would make about $${lockedOutValue.toFixed(0)} during the ${input.exclusivityMonths}-month lockout — the license fee is less than your locked-out sales. Counter with the lockout value included.`,
      });
    }
  }

  // CE-05: posting requirements with no compensation.
  if (input.postingRequirements >= 2 && input.offeredValue < 100 && input.collabType === 'unpaid_work') {
    redFlags.push({
      code: 'CE-05',
      severity: 'warning',
      text: 'Two or more demanded posts with no fee is a marketing budget being shifted onto your account. Each Reel is ~1.5h at your rate — invoice for them.',
    });
  }

  // Verdict ladder — take / counter / walk, from the designer's own numbers.
  let verdict: CollabResult['verdict'];
  let verdictReason: string;
  const cashOffer = input.offeredValue + royaltyValue;
  const offerPlusExposure = offerTotal + realisticReach;

  // The ladder is driven by what the offer actually covers against the fair
  // floor (time + sample + posting duties at the designer's own rate). An
  // offer covering the full floor is a take; anything from 60% is worth a
  // counter anchored at the floor; below that is a walk — exposure alone can
  // never promote a deal out of the walk zone (see exposure honesty above).
  // Verdict ladder: driven purely by what CASH the offer covers of the fair
  // floor — exposure is shown but never promotes a deal. Take at 80%+, counter
  // from 50%, walk below. (Sample-yarn value is a courtesy bonus, not cash.)
  if (cashOffer >= floor * 0.8) {
    verdict = 'take';
    verdictReason = `The offer ($${cashOffer.toFixed(0)}) covers your fair floor ($${floor.toFixed(0)}) — get the scope and any rights terms in writing and take it.`;
  } else if (cashOffer >= floor * 0.5) {
    verdict = 'counter';
    verdictReason = `The offer ($${cashOffer.toFixed(0)}) covers between half and four-fifths of your fair floor ($${floor.toFixed(0)}). Counter at the floor and hold — documented precedent (WhoPaysKnitters) supports the number.`;
  } else {
    verdict = 'walk';
    if (cashOffer <= 0 && (input.requiredHours > 0 || input.postingRequirements > 0)) {
      verdictReason = `The ask is unpaid work (${input.requiredHours}h + ${input.postingRequirements} posting duties) with a fair floor of $${floor.toFixed(0)} and nothing offered. The Ravelry census found 72.3% of designers earned under $50 — exposure here is statistically worth nearly nothing. Decline or counter at the floor.`;
    } else {
      verdictReason = `The offer covers $${cashOffer.toFixed(0)} of a $${floor.toFixed(0)} floor. Even the ceiling of what the brand's followers are worth ($${grossExposureValue.toFixed(0)}) doesn't close the gap — exposure alone can't turn this into a deal.`;
    }
  }

  const replyLetter = buildReplyLetter(input, { floor, offerTotal, royaltyValue, lockedOutValue, grossExposureValue, realisticReach, verdict });

  return {
    fairFeeFloor: floor,
    totalOfferValue: Math.round(offerTotal * 100) / 100,
    lockedOutValue,
    exposure: { grossExposureValue: Math.round(grossExposureValue * 100) / 100, realisticReach },
    verdict,
    verdictReason,
    redFlags,
    replyLetter,
  };
}

interface ReplyData {
  floor: number;
  offerTotal: number;
  royaltyValue: number;
  lockedOutValue: number;
  grossExposureValue: number;
  realisticReach: number;
  verdict: CollabResult['verdict'];
}

function buildReplyLetter(input: CollabInput, data: ReplyData): string {
  if (data.verdict === 'walk') {
    return [
      `Hi ${''},`,
      `Thank you for the offer — I appreciate you thinking of me for this.`,
      `I've priced the work involved (design, grading, sampling, tech documentation, and the required posts at ${input.requiredHours + input.postingRequirements * 1.5} hours at my working rate of $${input.hourlyRate}/hr) and my all-in floor for this scope is $${data.floor.toFixed(0)}, excluding production costs.`,
      `The offer as it stands doesn't cover that, and I've decided exposure doesn't pay for sample time — so I'll pass on this one. I'd be happy to revisit if a paid structure works for you.`,
      `All the best,`,
    ].join('\n');
  }
  if (data.verdict === 'counter') {
    return [
      `Hi ${''},`,
      `Thanks for the offer — this looks like a great fit and I'd love to make it work.`,
      `To give you a real number: my floor for this scope (design, grading, sampling, tech documentation, and the ${input.postingRequirements} required posts) is $${data.floor.toFixed(0)}, based on my working rate. That's the floor documented for comparable work in the industry rate database.`,
      input.royaltyPct > 0
        ? `On the royalty side, I'd ask for ${Math.round(input.royaltyPct * 100)}% of ${input.royaltyBase === 'gross' ? 'gross' : 'net'} proceeds through your channel — the published precedent for comparable work is 30% of net (Making Stories).`
        : ``,
      input.exclusivityMonths > 0
        ? `The ${input.exclusivityMonths}-month exclusivity locks out roughly $${data.lockedOutValue.toFixed(0)} of my own-channel sales, which needs to be inside the fee.`
        : ``,
      `Could we land somewhere in that range? I'm flexible on scope if the number can move.`,
      `All the best,`,
    ].filter(Boolean).join('\n');
  }
  return [
    `Hi ${''},`,
    `This works for me — thank you.`,
    `To confirm scope in writing: ${input.requiredHours} hours of design and tech documentation${input.postingRequirements > 0 ? `, ${input.postingRequirements} posts` : ''}${input.exclusivityMonths > 0 ? `, ${input.exclusivityMonths} months exclusivity` : ''}, for the agreed ${data.offerTotal >= 0 ? `$${data.offerTotal.toFixed(0)}` : 'compensation'}.`,
    input.fullCopyrightTransfer
      ? `One point before we start: copyright to the pattern stays with me; you receive the usage rights we've agreed (non-exclusive resale through your channel).`
      : `Copyright stays with me with the license scope we've agreed — that's standard for this structure.`,
    `Send over the terms and I'll get moving.`,
    `All the best,`,
  ].join('\n');
}
