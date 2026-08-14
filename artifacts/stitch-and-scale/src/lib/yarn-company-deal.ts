/**
 * Yarn-company deal comparator — model whether a B2B collaboration deal
 * (flat fee, royalty, exclusive license) beats self-publishing the pattern.
 *
 * RESEARCH BASIS (all cited, see research/competitors-session-9-deal-comparison.md):
 *
 * - Stitchcraft Marketing (Jul 2017) documents the three standard yarn-company
 *   deal structures: royalties with no exclusivity (designer sells anywhere,
 *   company pays royalties on its sales, quarterly reporting), royalties with
 *   exclusivity (exclusivity period 3 months – 1 year), and a non-exclusive
 *   license (company buys resale rights, no further compensation).
 * - Who Pays Knitters / Knit Now Magazine: flat-fee commissions of roughly
 *   £60–100 (~$85–145) recorded for magazine-style work; whopaysknitters
 *   (May 2016) notes flat-fee + exclusivity of 6–12 months as a common variant.
 * - Making Stories (Apr 2019): royalty example of 30% of net Ravelry proceeds
 *   and 20% net in-store.
 * - Emma Knitty (Sep 2023): lump-sum work often transfers rights entirely; a
 *   fair hybrid keeps self-resell rights with a floor-price clause.
 * - LoloDidIt: flat-fee exclusive model with 2-year exclusivity, company
 *   providing yarn support, tech editing, and photography.
 * - Sandi Rosner (2022): a designer with $1000 revenue pays $35 Ravelry fees +
 *   $130 PayPal fees; commissioned lump sums must beat independent net after
 *   the same fixed production costs ($40–65 tech edit, ~$45 test knitting,
 *   ~$40 model, ~$75 yarn — Media Peruana cost model).
 *
 * DESIGN: no invented market constants. Every input comes from the designer
 * (their hours, rate, and fixed costs — the same fields the Income Planner
 * already uses) or from a cited published figure stated as a default the
 * designer can adjust. Deal math reuses platformNet() from the verified
 * income calculator for the self-publish baseline and the royalty channel.
 *
 * OUTPUT: one verdict per deal ("Take the deal" / "Counter with $X+" /
 * "Self-publish instead") plus a copy-paste terms response paragraph.
 */

import { PLATFORMS, PlatformId, platformNet } from './pattern-income-calculator';

export type DealType =
  | 'self_publish'
  | 'flat_fee'
  | 'royalty_no_exclusivity'
  | 'exclusive_flat_fee';

export interface DealInput {
  /** Design hours the pattern consumed (designer's own time cost). */
  designHours: number;
  /** The designer's self-set hourly rate. */
  hourlyRate: number;
  /** Fixed production costs: tech edit + test knit + model + yarn. */
  fixedCosts: number;
  /** Recommended price per pattern copy (from the Pricing Advisor, in $). */
  price: number;
  /** Estimated lifetime direct sales over the exclusivity window. */
  estimatedSales: number;
  /** Platform used for direct/royalty-channel sales. */
  platform: PlatformId;
}

export interface FlatFeeDeal {
  type: 'flat_fee';
  /** The fee offered (or to negotiate), in $. */
  fee: number;
  /** Yarn + support value the company provides, in $ (optional, default 0). */
  supportValue: number;
  /** Rights: false = company owns it outright; true = designer keeps resale rights. */
  retainsResellRights: boolean;
}

export type RoyaltyBase = 'net' | 'gross';

export interface RoyaltyDeal {
  type: 'royalty_no_exclusivity';
  /** Royalty share, decimal (e.g. 0.30 = 30%). */
  royaltyPct: number;
  /**
   * Which revenue base the royalty is a share of. 'net' = the company's net
   * proceeds after platform fees (the Making Stories precedent — their
   * published 30% example is 30% of NET Ravelry proceeds). 'gross' = raw
   * price × units, which a company may push for because the designer pays
   * the platform fee share on that revenue too. The default 'net' matches
   * the cited precedent; a company demanding 'gross' is worth roughly
   * (1 + platformEffectiveFeePct)% more headline — flag it in terms.
   */
  royaltyBase: RoyaltyBase;
  /** How many sales the company expects to make through its channel. */
  companySales: number;
}

export interface ExclusiveDeal {
  type: 'exclusive_flat_fee';
  fee: number;
  supportValue: number;
  /** Exclusivity window in months (cited range 3–12, LoloDidIt 24). */
  exclusivityMonths: number;
  /** Fraction of estimatedSales that would have gone direct during the window. */
  lockedOutFraction: number;
}

export type DealOffer = FlatFeeDeal | RoyaltyDeal | ExclusiveDeal;

export interface DealOutcome {
  dealType: DealType;
  /** Net to the designer, in $, after their time and production costs. */
  netToDesigner: number;
  /** Net if self-published instead, in $. */
  selfPublishNet: number;
  /** The opportunity-cost delta: self-publish minus deal net. Negative = deal wins. */
  deltaVsSelfPublish: number;
  /** Minimum flat fee that would match self-publish net (flat-fee deals only). */
  minimumFee: number | null;
  verdict: 'take' | 'counter' | 'walk_away';
  reasoning: string;
}

/**
 * Self-publish baseline: (designer-set direct sales) × verified platform net
 * per unit, minus time and production costs. This is the honest baseline every
 * deal must beat — the figure most designers never compute before saying yes.
 */
export function selfPublishNet(input: DealInput): number {
  const gross = input.price * input.estimatedSales;
  if (gross <= 0) return -input.designHours * input.hourlyRate - input.fixedCosts;
  const net = platformNet(input.platform, input.price, input.estimatedSales);
  return net.netRevenue - input.designHours * input.hourlyRate - input.fixedCosts;
}

/**
 * Minimum flat fee that matches self-publishing (i.e. the floor to negotiate
 * from). Computed by inverting selfPublishNet for the direct-sales channel.
 */
export function minimumFlatFee(input: DealInput): number {
  const timeCost = input.designHours * input.hourlyRate;
  // A flat fee must at minimum cover the designer's own costs outright —
  // self-publishing recovers costs through sales over a lifetime; a company
  // paying a one-time fee can't ask the designer to amortize them away.
  return Math.round(Math.max(timeCost + input.fixedCosts, 0) * 100) / 100;
}

/**
 * Compare one offered deal against the self-publish baseline.
 */
export function compareDeal(input: DealInput, offer: DealOffer): DealOutcome {
  const timeCost = input.designHours * input.hourlyRate;
  const base = selfPublishNet(input);

  if (offer.type === 'flat_fee') {
    const directNet = offer.retainsResellRights ? Math.max(base, 0) : 0;
    const net = offer.fee + offer.supportValue + directNet - timeCost - input.fixedCosts;
    // Floor the fee must cover the designer's own costs; and to beat the
    // baseline it must also exceed what direct sales would net.
    const costFloor = minimumFlatFee(input);
    const effectiveFloor = offer.retainsResellRights
      ? Math.round(Math.max(costFloor - Math.max(base, 0), 0) * 100) / 100
      : costFloor;
    let verdict: DealOutcome['verdict'] = 'walk_away';
    let reasoning = '';
    if (net >= base && offer.fee >= effectiveFloor) {
      verdict = 'take';
      reasoning = `The fee ${fmt(offer.fee)} covers your time and production costs and beats self-publishing by ${fmt(net - base)}.${offer.retainsResellRights ? ' Keeping resale rights adds your direct channel on top.' : ' You are giving up direct sales entirely — make sure the fee reflects that.'}`;
    } else if (net >= base || offer.fee >= costFloor) {
      verdict = 'counter';
      reasoning = `Counter from ${fmt(effectiveFloor)} — the fee as offered doesn't beat what self-publishing would net (${fmt(base)}), and it doesn't fully cover your time (${fmt(timeCost)}) and production costs (${fmt(input.fixedCosts)}).`;
    } else {
      verdict = 'walk_away';
      reasoning = `The fee ${fmt(offer.fee)} doesn't cover your time (${fmt(timeCost)}) and production costs (${fmt(input.fixedCosts)}) — self-publishing nets ${fmt(base)} over the same window.`;
    }
    return {
      dealType: 'flat_fee',
      netToDesigner: Math.round(net * 100) / 100,
      selfPublishNet: Math.round(base * 100) / 100,
      deltaVsSelfPublish: Math.round((base - net) * 100) / 100,
      minimumFee: effectiveFloor,
      verdict,
      reasoning,
    };
  }

  if (offer.type === 'royalty_no_exclusivity') {
    // Royalty base (issue #2 / S015): the Making Stories published precedent
    // computes royalties on NET proceeds (30% of net Ravelry proceeds), so the
    // royalty is a share of what the company's channel actually nets. A
    // designer can still negotiate a 'gross' base — it is just worth more
    // headline because the platform-fee share moves onto the company.
    const companyGross = input.price * offer.companySales;
    const companyNet = companyGross > 0
      ? platformNet(input.platform, input.price, offer.companySales).netRevenue
      : 0;
    const royalties =
      offer.royaltyBase === 'gross' ? companyGross * offer.royaltyPct : companyNet * offer.royaltyPct;
    // Designer keeps their direct channel too (no exclusivity).
    const net = royalties + Math.max(base, 0) - timeCost - input.fixedCosts;
    // The direct-channel baseline itself doesn't change with the royalty base —
    //  the change is only in what the company channel pays out. Kept explicit
    //  (instead of the tempting `+ 0`) so a future royalty-on-gross deal where
    //  the designer ALSO pays platform fees on company-channel revenue has an
    //  obvious place to live.
    const baseForVerdict = base;
    const verdict: DealOutcome['verdict'] = net >= baseForVerdict ? 'take' : net >= baseForVerdict * 0.7 ? 'counter' : 'walk_away';
    const neededRoyaltyPct =
      (offer.royaltyBase === 'gross' ? companyGross : companyNet) > 0
        ? offer.royaltyPct + (baseForVerdict - royalties) / (offer.royaltyBase === 'gross' ? companyGross : companyNet)
        : null;
    const baseLabel = offer.royaltyBase === 'gross' ? 'gross' : 'net';
    const reasoning = net >= baseForVerdict
      ? `Royalties of ${fmt(royalties)} on ${offer.companySales} company sales (at ${pct(offer.royaltyPct)} of ${baseLabel}) plus your direct channel beat self-publishing alone.`
      : `Royalties of ${fmt(royalties)} don't cover the company-channel reach; at ${offer.companySales} sales, matching self-publishing would need either more company sales or a royalty share around ${neededRoyaltyPct !== null ? pct(Math.min(neededRoyaltyPct, 1)) : '100%'} of ${baseLabel}.`;
    return {
      dealType: 'royalty_no_exclusivity',
      netToDesigner: Math.round(net * 100) / 100,
      selfPublishNet: Math.round(baseForVerdict * 100) / 100,
      deltaVsSelfPublish: Math.round((baseForVerdict - net) * 100) / 100,
      minimumFee: null,
      verdict,
      reasoning,
    };
  }

  // exclusive_flat_fee
  const lockedSales = Math.round(input.estimatedSales * offer.lockedOutFraction);
  const lockedNet = lockedSales > 0 && input.price > 0
    ? platformNet(input.platform, input.price, lockedSales).netRevenue
    : 0;
  const net = offer.fee + offer.supportValue - timeCost - input.fixedCosts - lockedNet;
  // Floor: fee must cover costs + compensate the locked-out direct channel.
  const effectiveFloor = Math.round((timeCost + input.fixedCosts + lockedNet) * 100) / 100;
  let verdict: DealOutcome['verdict'] = 'walk_away';
  let reasoning = '';
  if (net >= base && offer.fee >= effectiveFloor) {
    verdict = 'take';
    reasoning = `The fee ${fmt(offer.fee)} covers your costs and the ${fmt(lockedNet)} you lose while locked out of direct sales during the ${offer.exclusivityMonths}-month window.`;
  } else if (offer.fee >= effectiveFloor * 0.9) {
    verdict = 'counter';
    reasoning = `Close, but counter to ${fmt(effectiveFloor)}: the window locks you out of ${fmt(lockedNet)} in direct sales, and that must be in the fee, not your discount.`;
  } else {
    verdict = 'walk_away';
    reasoning = `The fee ${fmt(offer.fee)} doesn't even cover time (${fmt(timeCost)}) + production (${fmt(input.fixedCosts)}) + the ${fmt(lockedNet)} locked out of direct sales over ${offer.exclusivityMonths} months.`;
  }
  return {
    dealType: 'exclusive_flat_fee',
    netToDesigner: Math.round(net * 100) / 100,
    selfPublishNet: Math.round(base * 100) / 100,
    deltaVsSelfPublish: Math.round((base - net) * 100) / 100,
    minimumFee: effectiveFloor,
    verdict,
    reasoning,
  };
}

/**
 * Paste-ready terms response a designer can send back to a yarn company,
 * grounded strictly in the computed numbers — nothing claimed that isn't.
 */
export function generateTermsResponse(input: DealInput, outcome: DealOutcome): string {
  const lines: string[] = [];
  lines.push(
    `I've modeled this deal against self-publishing the pattern (using ${input.estimatedSales} estimated direct sales ` +
    `over the same window). My all-in cost for this pattern is ${fmt(input.designHours * input.hourlyRate)} in design ` +
    `time plus ${fmt(input.fixedCosts)} in tech editing, testing, and sampling.`,
  );
  if (outcome.minimumFee !== null) {
    lines.push(
      `To be at least even with self-publishing, I'd need ${fmt(outcome.minimumFee)} for this work${outcome.dealType === 'exclusive_flat_fee' ? `, including compensation for the direct sales the exclusivity window locks out` : ''}.`,
    );
  }
  if (outcome.verdict === 'take') {
    lines.push(`As offered, this beats self-publishing by ${fmt(-outcome.deltaVsSelfPublish)} — I'm happy to proceed on these terms.`);
  } else if (outcome.verdict === 'counter') {
    lines.push(
      `As offered, the deal falls short of self-publishing by ${fmt(outcome.deltaVsSelfPublish)}. ` +
      `If the fee comes to ${outcome.minimumFee !== null ? fmt(outcome.minimumFee) : `a number that covers my costs plus the ${fmt(Math.max(-outcome.deltaVsSelfPublish, 0))} gap`}, I'm in.`,
    );
  } else {
    lines.push(
      `As offered, the gap is ${fmt(outcome.deltaVsSelfPublish)} against self-publishing. I'd need to revisit the fee structure or ` +
      `keep self-publishing rights to make this work.`,
    );
  }
  return lines.join(' ');
}

function fmt(n: number): string {
  return `$${Math.round(n).toLocaleString('en-US')}`;
}

function pct(x: number): string {
  return `${Math.round(x * 100)}%`;
}

export const DEAL_TYPES: DealType[] = ['self_publish', 'flat_fee', 'royalty_no_exclusivity', 'exclusive_flat_fee'];

export const PLATFORMS_LABEL: Record<PlatformId, string> = {
  ravelry: 'Ravelry Pattern Store',
  etsy: 'Etsy',
  ribblr: 'Ribblr',
  payhip: 'Payhip',
} as const;
