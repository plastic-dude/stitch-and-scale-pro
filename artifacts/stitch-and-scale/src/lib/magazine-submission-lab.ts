/**
 * Magazine Submission Lab (CHK-069) — is this magazine offer actually
 * worth signing, compared to self-publishing the same design?
 *
 * Competitor flaw: pipeline trackers (Duotrope-style) manage deadlines,
 * and publishing guides list honoraria, but no pattern-business tool
 * compares a magazine deal STRUCTURE against the designer's own
 * self-publish baseline — flat fee vs royalty vs fee+royalty, rights
 * lease vs outright sale, kill-fee protection, royalty break-even
 * copies, the cost of the exclusivity lock-up window, and the value of
 * what the publisher covers (tech edit, photography, test knit, yarn)
 * plus the post-window prestige uplift to your own-brand sales.
 *
 * Verified market anchors used by this lab:
 * - Knitty: $250-350 honorarium per published design, ~3mo exclusivity,
 *   magazine covers tech editing
 * - Making Stories: €100-550 by complexity, 4mo exclusivity, covers
 *   tech edit + test knit, yarn support, shipping reimbursed
 * - Laine: pays on completion of sample+pattern+tech edit, 5mo
 *   exclusivity, covers tech edit and shipping
 * - Crochet Now / Simply Crochet: commission per design + yarn box
 * - Lease norms: $30 to lease a design, "a few hundred" to sell the
 *   rights outright (Salena Misko, American Crochet Association)
 * - Kill fee norm in publishing: ~50% of contracted fee if the design
 *   is cut or the issue is cancelled
 * - Self-publish: $3.50-10 avg price (Slow Knitting); Ravelry Jan 2019:
 *   72.3% of sellers earned <$50 in their best month
 * - Exclusivity windows: 3-12 months typical
 */

export type DealModel = 'flat' | 'royalty' | 'fee-and-royalty' | 'lease' | 'outright-sale';

export interface MagazineInput {
  /** work-for-hire / royalty / fee+royalty / lease-with-exclusivity / outright sale. */
  dealModel: DealModel;
  /** Flat design fee in dollars (all models except pure royalty can carry one). */
  flatFee: number;
  /** Royalty percent of per-copy revenue (0 = not modeled). */
  royaltyPct: number;
  /** Magazine copies printed for the issue. */
  copiesPrinted: number;
  /** Realistic sell-through of printed copies. */
  sellThrough: number;
  /** Per-copy magazine revenue attributed to the design (cover price share or digital split). */
  revenuePerCopy: number;
  /** Extra royalty income expected from magazine digital archives/republishing. */
  digitalRoyalty: number;
  /** Kill fee percent of the flat fee (0 = unprotected). */
  killFeePct: number;
  /** Months the magazine holds exclusive rights before you can self-publish. */
  exclusivityMonths: number;
  /** Months the rights are transferred permanently (0 = lease/reverts). */
  outrightSaleMonths: number;
  /** Months before the flat fee is actually paid. */
  paymentLagMonths: number;
  /** What the publisher covers that you'd otherwise pay out of pocket. */
  publisherCoveredTechEdit: number;
  publisherCoveredPhotography: number;
  publisherCoveredTestKnit: number;
  publisherCoveredYarn: number;
  /** Your production cost for this design regardless of deal (yarn beyond what's covered, grading, writing). */
  yourProductionCost: number;
  /** All-in hours to deliver the design to magazine standard. */
  designHours: number;
  /** Opportunity rate $/hr. */
  hourlyRate: number;
  /** Self-publish baseline: your price × realistic units/month for this design. */
  selfPublishPrice: number;
  selfPublishUnitsPerMonth: number;
  /** Post-window prestige uplift: extra self-sell units/month attributed to the magazine feature. */
  prestigeUnitsPerMonth: number;
  /** Months the prestige uplift is modeled for (0 = none). */
  prestigeMonths: number;
}

export const DEFAULT_MAGAZINE: MagazineInput = {
  dealModel: 'flat',
  flatFee: 300,
  royaltyPct: 0,
  copiesPrinted: 0,
  sellThrough: 0.7,
  revenuePerCopy: 0,
  digitalRoyalty: 0,
  killFeePct: 50,
  exclusivityMonths: 4,
  outrightSaleMonths: 0,
  paymentLagMonths: 3,
  publisherCoveredTechEdit: 150,
  publisherCoveredPhotography: 300,
  publisherCoveredTestKnit: 0,
  publisherCoveredYarn: 60,
  yourProductionCost: 45,
  designHours: 40,
  hourlyRate: 60,
  selfPublishPrice: 7.5,
  selfPublishUnitsPerMonth: 25,
  prestigeUnitsPerMonth: 10,
  prestigeMonths: 6,
};

export interface Flag {
  code: string;
  title: string;
  detail: string;
}

export interface DealOutcome {
  label: string;
  /** Cash paid to the designer under this deal. */
  dealCash: number;
  /** Costs avoided because the publisher covered them. */
  avoidedCosts: number;
  /** Opportunity cost: foregone self-publishing net during lock-up, plus rights loss. */
  opportunityCost: number;
  /** Post-window prestige uplift net. */
  prestigeValue: number;
  /** dealCash + avoidedCosts - opportunityCost + prestigeValue - yourProductionCost. */
  netVersusSelf: number;
  /** (netVersusSelf) / designHours, compared against the opportunity rate. */
  effectiveHourly: number;
}

export interface MagazineResult {
  deal: DealOutcome;
  /** What self-publishing the same design would net over the same window. */
  selfPublishNet: number;
  /** Royalty copies needed for royalty income to equal the flat fee. */
  royaltyBreakEvenCopies: number;
  /** Market fee band for this designer tier. */
  feeBandMin: number;
  feeBandMax: number;
  /** Market exclusivity window range (months). */
  windowBandMin: number;
  windowBandMax: number;
  /** Market kill-fee norm (percent). */
  killFeeNorm: number;
  flags: Flag[];
  verdict: string;
  verdictNote: string;
}

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

export function fmt$(n: number): string {
  const rounded = Math.round(Math.abs(n) * 100) / 100;
  return `${n < 0 ? '−' : ''}$${rounded.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function analyzeMagazineSubmission(input: MagazineInput): MagazineResult {
  const flags: Flag[] = [];

  // ---- Deal cash by model ----
  let dealCash = 0;
  let lockupMonths = 0; // months during which self-publishing is blocked or rights are lost

  if (input.dealModel === 'outright-sale') {
    dealCash = input.flatFee;
    lockupMonths = Math.max(1, input.outrightSaleMonths);
  } else if (input.dealModel === 'fee-and-royalty') {
    const soldCopies = input.copiesPrinted * clamp01(input.sellThrough);
    dealCash = input.flatFee + soldCopies * clamp01(input.royaltyPct) * input.revenuePerCopy + input.digitalRoyalty;
    lockupMonths = Math.max(1, input.exclusivityMonths);
  } else if (input.dealModel === 'royalty') {
    const soldCopies = input.copiesPrinted * clamp01(input.sellThrough);
    dealCash = soldCopies * clamp01(input.royaltyPct) * input.revenuePerCopy + input.digitalRoyalty;
    lockupMonths = Math.max(1, input.exclusivityMonths);
  } else if (input.dealModel === 'lease') {
    dealCash = input.flatFee;
    lockupMonths = Math.max(1, input.exclusivityMonths);
  } else {
    // flat: pay for publication + exclusivity window
    dealCash = input.flatFee;
    lockupMonths = Math.max(1, input.exclusivityMonths);
  }

  // ---- Avoided costs (what the publisher covers) ----
  const avoidedCosts =
    input.publisherCoveredTechEdit +
    input.publisherCoveredPhotography +
    input.publisherCoveredTestKnit +
    input.publisherCoveredYarn;

  // ---- Opportunity cost of lock-up ----
  // Net self-publish margin per unit: price minus marketplace fees (~35% blended
  // Ravelry+payment) minus marginal cost (yarn sample amortized into units: $0).
  const marketplaceFeePct = 0.35;
  const selfNetPerUnit = input.selfPublishPrice * (1 - marketplaceFeePct);
  const foregoneMonthly = selfNetPerUnit * Math.max(0, input.selfPublishUnitsPerMonth);
  // Payment lag erodes cash value at the opportunity rate (simple, monthly).
  const lagErosion = dealCash * (input.hourlyRate / 6000) * Math.max(0, input.paymentLagMonths);
  const outrightLoss = input.dealModel === 'outright-sale'
    ? foregoneMonthly * Math.max(1, input.outrightSaleMonths)
    : foregoneMonthly * Math.max(1, input.exclusivityMonths);
  const opportunityCost = outrightLoss + lagErosion;

  // ---- Prestige uplift after the window ----
  const prestigeValue =
    selfNetPerUnit * Math.max(0, input.prestigeUnitsPerMonth) * Math.max(0, input.prestigeMonths);

  const netVersusSelf = dealCash + avoidedCosts - opportunityCost + prestigeValue - input.yourProductionCost;
  const designHours = Math.max(1, input.designHours);
  const effectiveHourly = netVersusSelf / designHours;

  // ---- Self-publish baseline over the same window ----
  const selfPublishNet = foregoneMonthly * Math.max(1, lockupMonths) + prestigeValue - input.yourProductionCost;

  // ---- Royalty break-even copies ----
  const soldShare = clamp01(input.sellThrough);
  const royaltyPerCopy = soldShare * clamp01(input.royaltyPct) * input.revenuePerCopy;
  const royaltyBreakEvenCopies =
    royaltyPerCopy > 0 ? Math.max(0, input.flatFee / royaltyPerCopy) : Infinity;

  // Market bands (verified): flat fees run $100-550 by tier and complexity
  // (Knitty $250-350, Making Stories €100-550, WPK avg $246 range $40-700).
  const feeBandMin = 100;
  const feeBandMax = 550;
  const windowBandMin = 3;
  const windowBandMax = 12;
  const killFeeNorm = 0.5;

  // ---- Flags ----

  // MS-01 — fee below band.
  if ((input.dealModel === 'flat' || input.dealModel === 'lease') && input.flatFee > 0 && input.flatFee < feeBandMin) {
    flags.push({
      code: 'MS-01',
      title: 'Fee below the market band',
      detail: `Your $${input.flatFee.toFixed(0)} sits under the verified band ($100 low, Knitty pays $250-350, Making Stories €100-550, WPK average $246). Designers have been paid as little as $30 to lease a design — that's the floor, not a benchmark. Counter at $250+ for a full garment, $100+ for an accessory, or ask the publisher to expand what they cover (tech edit, photography) instead of cash.`,
    });
  }

  // MS-02 — royalty-only deal with thin break-even.
  if (input.dealModel === 'royalty' && input.copiesPrinted > 0 && royaltyPerCopy > 0) {
    const expectedCopies = input.copiesPrinted * soldShare;
    if (expectedCopies < royaltyBreakEvenCopies * 0.4) {
      flags.push({
        code: 'MS-02',
        title: 'Royalty-only math does not reach a flat-fee equivalent',
        detail: `At ${input.copiesPrinted.toLocaleString()} printed copies × ${Math.round(soldShare * 100)}% sell-through you expect ${expectedCopies.toLocaleString()} sold copies, but royalty income only equals a $${feeBandMin} flat fee at ${Math.round(royaltyBreakEvenCopies).toLocaleString()} copies. Ask for fee + royalty (fee + ${Math.round(clamp01(input.royaltyPct) * 100)}% of sold copies) or a guaranteed minimum against royalty.`,
      });
    }
  }

  // MS-03 — royalty with no transparency floor (copies printed unknown = you can't audit).
  if ((input.dealModel === 'royalty' || input.dealModel === 'fee-and-royalty') && input.copiesPrinted <= 0) {
    flags.push({
      code: 'MS-03',
      title: 'Royalty with no copy floor — uneauditable',
      detail: 'Royalties without a guaranteed print floor are a trust exercise: the publisher chooses the print run and reports sell-through. Contract a minimum guaranteed royalty equivalent to a $100-250 flat fee before signing, and require an annual statement of copies printed and sold.',
    });
  }

  // MS-04 — kill fee below norm or missing.
  if (input.killFeePct < killFeeNorm && input.flatFee > 0) {
    flags.push({
      code: 'MS-04',
      title: 'Kill fee below the ~50% publishing norm',
      detail: `Your kill protection is ${Math.round(input.killFeePct * 100)}% vs the ~50% norm if the design is cut or the issue is cancelled. You've already spent the design hours before publication day — ${Math.round(input.killFeePct * 100)}% of $${input.flatFee.toFixed(0)} ($${(input.killFeePct * input.flatFee).toFixed(0)}) may not cover them at $${input.hourlyRate}/hr. Negotiate 50-100% kill protection, payable on notice of cancellation.`,
    });
  }

  // MS-05 — exclusivity window above the market band.
  if (input.exclusivityMonths > windowBandMax) {
    flags.push({
      code: 'MS-05',
      title: 'Exclusivity window above the market band',
      detail: `${Math.round(input.exclusivityMonths)} months is longer than the verified band (3mo Knitty, 4mo Making Stories, 5mo Laine, 12mo max seen at Farm & Fiber). Each month of lock-up costs you $${(selfNetPerUnit * input.selfPublishUnitsPerMonth).toFixed(0)} in foregone self-sales. Cap the window at 5-6 months and secure the post-window right to reuse up to 5 official photos with credit (Making Stories norm).`,
    });
  }

  // MS-06 — outright sale: price the rights transfer, not just the fee.
  if (input.dealModel === 'outright-sale') {
    const rightsValue = foregoneMonthly * Math.max(1, input.outrightSaleMonths) + prestigeValue * 0.5;
    if (input.flatFee < rightsValue * 1.2) {
      flags.push({
        code: 'MS-06',
        title: 'Rights sale underpriced — you sold the future',
        detail: `Selling the design outright forfeits ${input.outrightSaleMonths} months of self-sales (≈$${(foregoneMonthly * Math.max(1, input.outrightSaleMonths)).toFixed(0)}) plus half the prestige upside. At $${input.flatFee.toFixed(0)} the publisher is paying $${input.flatFee.toFixed(0)} for a right worth ≈$${rightsValue.toFixed(0)}. Lease with a 5-month window for $${input.flatFee.toFixed(0)} beats this sale — outright sale should cost the publisher 1.5-2× the fee-plus-window equivalent.`,
      });
    }
  }

  // MS-07 — long payment lag.
  if (input.paymentLagMonths > 6) {
    flags.push({
      code: 'MS-07',
      title: 'Payment lag erodes the fee',
      detail: `Payment at ${Math.round(input.paymentLagMonths)} months means your $${input.flatFee.toFixed(0)} fee is worth ~$${(input.flatFee - lagErosion).toFixed(0)} in today's dollars against your $${input.hourlyRate}/hr rate. Negotiate payment on delivery of pattern+sample, not on publication.`,
    });
  }

  // MS-08 — designer absorbs the costs a publisher normally covers.
  const uncovered = (input.publisherCoveredTechEdit <= 0 ? 150 : 0) + (input.publisherCoveredPhotography <= 0 ? 300 : 0);
  if (uncovered > 0) {
    flags.push({
      code: 'MS-08',
      title: 'You\u2019re paying for what magazines normally cover',
      detail: `Magazines (Knitty, Making Stories, Laine) routinely cover tech editing and photography — that's worth $${uncovered} per design that this deal leaves to you. If the fee can't move up, shift the ask to in-kind coverage; a $300 fee that includes $450 of coverage beats a $450 flat fee you spend $450 to support.`,
    });
  }

  // MS-09 — prestige uplift undercounted.
  if (input.prestigeUnitsPerMonth <= 0 && lockupMonths <= 6) {
    flags.push({
      code: 'MS-09',
      title: 'No prestige uplift modeled',
      detail: 'A magazine feature typically lifts your own-brand sales afterward — designers re-submit photos, and the byline drives Ravelry traffic for months. At 10 extra units/month on a $7.50 pattern that\u2019s ≈$49 of uplift over 6 months this lab isn\u2019t counting. Model it before ruling the deal out.',
    });
  }

  // ---- Verdict ladder ----
  let verdict: string;
  let verdictNote: string;

  if (input.designHours <= 0) {
    return {
      deal: { label: '', dealCash: 0, avoidedCosts: 0, opportunityCost: 0, prestigeValue: 0, netVersusSelf: 0, effectiveHourly: 0 },
      selfPublishNet: 0,
      royaltyBreakEvenCopies: Infinity,
      feeBandMin, feeBandMax, windowBandMin, windowBandMax, killFeeNorm,
      flags: [],
      verdict: 'Price your hours first',
      verdictNote: 'Enter the all-in design hours before this lab can compare the deal to your rate.',
    };
  }

  const feeEquivalent = input.flatFee + avoidedCosts;

  if (netVersusSelf < 0) {
    verdict = 'Decline — self-publish beats this deal';
    verdictNote = `Netting out the fee, avoided costs, and your lock-up, this deal earns $${netVersusSelf.toFixed(0)} less than releasing it yourself over the same window. Keep the design for your own store — or renegotiate: raise the fee toward $${feeBandMax}, cap the window at ${windowBandMin}-${windowBandMax} months, and add 50% kill protection.`;
  } else if (effectiveHourly < input.hourlyRate * 0.5) {
    verdict = 'Weak deal — only sign if the prestige matters';
    verdictNote = `$${effectiveHourly.toFixed(1)}/hr effective against your $${input.hourlyRate}/hr rate. The deal pays, but barely covers your time — sign it only if this is a brand-building publication (Vogue Knitting, Pom Pom tier) and you've negotiated fee ≥ $${feeBandMin} with a ≤${windowBandMax}-month window. Otherwise self-publish and keep the full upside.`;
  } else if (effectiveHourly < input.hourlyRate) {
    verdict = 'Fair deal — sign with the rights protections';
    verdictNote = `$${effectiveHourly.toFixed(1)}/hr effective, plus $${avoidedCosts.toFixed(0)} of tech-edit/photography coverage the publisher absorbs. Make the signature conditional: 50%+ kill fee, window ≤ ${windowBandMax} months with photo reuse rights after, and payment on delivery — the protections that turn a fair fee into a fair deal.`;
  } else {
    verdict = 'Strong deal — this beats self-publishing';
    verdictNote = `$${effectiveHourly.toFixed(1)}/hr effective and $${(dealCash + avoidedCosts).toFixed(0)} cash plus coverage against $${selfPublishNet.toFixed(0)} of self-publishing net over the same window. This is what a good magazine deal looks like: the fee lands in the $${feeBandMin}-${feeBandMax} band, the publisher carries the costs, and the window is short enough that your own store reclaims the design within a season.`;
  }

  return {
    deal: {
      label: input.dealModel,
      dealCash,
      avoidedCosts,
      opportunityCost,
      prestigeValue,
      netVersusSelf,
      effectiveHourly,
    },
    selfPublishNet,
    royaltyBreakEvenCopies,
    feeBandMin,
    feeBandMax,
    windowBandMin,
    windowBandMax,
    killFeeNorm,
    flags,
    verdict,
    verdictNote,
  };
}
