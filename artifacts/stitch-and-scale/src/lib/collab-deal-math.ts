/**
 * CHK-052 — Collab Offer Deal Math (50th workspace tab).
 *
 * Where the Collab & Exposure Evaluator judges a raw "do the work / take the fee"
 * ask, this engine judges the STRUCTURE of a yarn-company rights contract:
 * full buyout, exclusivity + flat fee, advance + royalty, or yarn-support-only
 * (often with a "sole recommended yarn" clause).
 *
 * RESEARCH BASIS (all cited — see research/competitors-session-52-collab-contract-economics.md):
 *
 * - Who Pays Knitters: freelance accessory-pattern rates $40–700, average $246 —
 *   often excluding tech editing, photography, layout. Sample knitting/crocheting
 *   industry rate $0.25/yard (350-yd sample ≈ $87.50).
 * - Slow Knitting (2024, 1000+ designers worked with): yarn support $0–200/design;
 *   tech editing $30–300; layout $0–200; photography $0–500+ (pros at $150–200/hr);
 *   Vogue Knitting flat $500 for a design; a book project budgeted >$11,000.
 * - Who Pays Knitters (yarn-company side playbook): three rights structures —
 *   (1) full rights, company pays everything and owns it; (2) partial rights —
 *   flat fee for 6–12 months exclusivity then designer keeps all sales, or
 *   concurrent self-publish with an advance + royalty paid by the company;
 *   (3) yarn support only, no company residuals, company often demands the
 *   designer list their yarn as the ONLY recommended yarn ("monopoly clause").
 * - MediaPeruana 2019 census: 72.3% of Ravelry designers sold ≤$50 in January
 *   (Ravelry's best month); top-10% threshold ≈ $201/month. The self-publishing
 *   baseline a brand-offer must beat is usually tiny but REAL.
 * - The flaws→strengths lens: most designers sign brand offers with no cost/ROI
 *   math — free yarn is treated as payment when the real cost is the rights given
 *   up. This engine makes the hidden side of the contract visible.
 *
 * DESIGN: every number is designer-supplied or a cited published default stated
 * as adjustable. No invented market constants.
 */
import { PLATFORMS, PlatformId, platformNet } from './pattern-income-calculator';

export type RightsStructure =
  | 'full_buyout'      // company pays fee, owns the pattern outright (life+70)
  | 'exclusive_flat'   // flat fee for N months exclusivity, designer reclaims all sales after
  | 'advance_royalty'  // concurrent self-publish; advance + royalty % paid by company
  | 'yarn_support';    // free yarn (optionally with sole-recommended-yarn clause)

export interface DealMathInput {
  structure: RightsStructure;
  /** The brand's fixed fee / buyout price / advance, in $. */
  fixedFee: number;
  /** Royalty share offered by the company, decimal (0–1). */
  royaltyPct: number;
  /** Royalty base the company pays on: 'net' or 'gross'. */
  royaltyBase: 'net' | 'gross';
  /** Platform used for the royalty-channel math. */
  platform: PlatformId;
  /** Expected sales through the COMPANY'S channel over the contract window. */
  companySales: number;
  /** Pattern price, in $. */
  patternPrice: number;
  /** Months of exclusivity demanded (0 = none / perpetual). */
  exclusivityMonths: number;
  /** The designer's expected monthly self-published sales (units) on their own channel. */
  ownMonthlySales: number;
  /** Designer hours the contract requires. */
  requiredHours: number;
  /** Designer hourly rate, $/hr. */
  hourlyRate: number;
  /** Cost the designer carries that the brand does NOT cover: tech edit, photography,
   *  layout, extra sampling beyond provided yarn — in $. */
  uncoveredCosts: number;
  /** Retail value of the yarn the brand provides free of charge, in $. */
  yarnSupportValue: number;
  /** The contract names the brand's yarn as the ONLY recommended yarn. */
  soleYarnClause: boolean;
  /** Months the pattern remains sellable on the designer's channel after exclusivity. */
  tailMonths: number;
}

export const DEAL_MATH_DEFAULTS: DealMathInput = {
  structure: 'exclusive_flat',
  fixedFee: 246,
  royaltyPct: 0.05,
  royaltyBase: 'net',
  platform: 'ravelry',
  companySales: 60,
  patternPrice: 9,
  exclusivityMonths: 12,
  ownMonthlySales: 25,
  requiredHours: 40,
  hourlyRate: 25,
  uncoveredCosts: 300,
  yarnSupportValue: 150,
  soleYarnClause: true,
  tailMonths: 24,
};

export const STRUCTURE_LABELS: Record<RightsStructure, string> = {
  full_buyout: 'Full buyout (company owns it, life+70)',
  exclusive_flat: 'Flat fee + exclusivity, designer reclaims',
  advance_royalty: 'Advance + royalty, concurrent sales',
  yarn_support: 'Yarn support only',
};

export interface ChannelValue {
  channel: string;
  label: string;
  units: number;
  netRevenue: number;
}

export interface StructureVerdict {
  structure: RightsStructure;
  label: string;
  /** Fixed cash from the brand. */
  cash: number;
  /** Royalty/ongoing revenue the brand channel pays. */
  royaltyRevenue: number;
  /** Yarn support counted as it really is: a cost offset, never revenue. */
  yarnOffset: number;
  /** Gross inflow from the brand side. */
  grossInflow: number;
  /** Costs the designer carries (hours at rate + uncovered production). */
  designerCosts: number;
  /** Sales the designer's own channel would make during exclusivity. */
  lockedOutValue: number;
  /** Net of the brand deal: inflow − own costs − lockout (where applicable). */
  brandNet: number;
  /** What the pattern nets on the designer's own channel outside the deal. */
  selfPublishNet: number;
  /** Effective hourly rate of accepting the brand deal as structured. */
  effectiveHourly: number;
  ok: boolean;
  reason: string;
}

export interface DealMathResult {
  channels: ChannelValue[];
  /** The deal as actually structured. */
  deal: StructureVerdict;
  /** The designer's own channel at their sales velocity. */
  selfChannel: ChannelValue;
  /** How the same pattern does on the brand channel vs the designer channel. */
  channelComparison: { brandNet: number; ownNet: number; spread: number; note: string };
  /** Ranked read on all four structures at these inputs — which one wins. */
  bestStructure: RightsStructure | null;
  /** Clauses that quietly cut value. */
  clauseFlags: { code: string; severity: 'critical' | 'warning'; text: string }[];
  /** Paste-ready counter-offer letter. */
  counterLetter: string;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Brand-channel net revenue for a royalty-bearing structure. */
function royaltyRevenue(input: DealMathInput): number {
  if (input.royaltyPct <= 0 || input.companySales <= 0) return 0;
  const gross = input.patternPrice * input.companySales;
  const net = platformNet(input.platform, input.patternPrice, input.companySales).netRevenue;
  return (input.royaltyBase === 'gross' ? gross : net) * input.royaltyPct;
}

/** The designer's own channel — same price, own sales velocity, tail window. */
function ownChannelNet(input: DealMathInput): number {
  if (input.ownMonthlySales <= 0) return 0;
  const perMonth = platformNet(input.platform, input.patternPrice, input.ownMonthlySales).netRevenue;
  return perMonth * Math.max(0, input.tailMonths);
}

/** The designer's cost of doing the work: hours + uncovered production costs. */
function designerCosts(input: DealMathInput): number {
  return input.requiredHours * input.hourlyRate + input.uncoveredCosts;
}

/** What the designer gives up to exclusivity: own channel sales during the lockout. */
function lockedOutValue(input: DealMathInput): number {
  if (input.exclusivityMonths <= 0 || input.ownMonthlySales <= 0) return 0;
  const perMonth = platformNet(input.platform, input.patternPrice, input.ownMonthlySales).netRevenue;
  return perMonth * input.exclusivityMonths;
}

export function analyzeDealMath(input: DealMathInput): DealMathResult {
  const cost = designerCosts(input);
  const royaltyRev = royaltyRevenue(input);
  const locked = lockedOutValue(input);
  const ownNet = ownChannelNet(input);

  const makeVerdict = (s: RightsStructure): StructureVerdict => {
    let cash = 0;
    let royal = 0;
    let lockout = 0;
    switch (s) {
      case 'full_buyout':
        // S251 fix: yarn support is a cost offset, never revenue — counted
        // only once, via costAfterYarn below. Adding it here AND reducing
        // cost below it would double-count the same yarn (S123 regression).
        cash = input.fixedFee;
        royal = royaltyRev;
        // buyout is perpetual: every future self-published sale is gone.
        lockout = locked + ownNet;
        break;
      case 'exclusive_flat':
        cash = input.fixedFee;
        lockout = locked;
        break;
      case 'advance_royalty':
        cash = input.fixedFee;
        royal = royaltyRev;
        // concurrent selling: no lockout — the designer keeps their own channel
        // and the company's sales are the company's revenue, not the designer's.
        break;
      case 'yarn_support':
        cash = 0;
        royal = royaltyRev;
        // yarn support only has no exclusivity; the "revenue" is only the cost offset.
        break;
    }
    const grossInflow = round2(cash + royal);
    // Yarn support is a cost offset, never revenue: it reduces what the designer
    // must spend on sample/production costs, but it does not inflate inflow.
    const costAfterYarn = Math.max(0, cost - input.yarnSupportValue);
    const brandNet = round2(grossInflow - costAfterYarn - lockout);
    const hoursForRate = Math.max(input.requiredHours, 1);
    const effectiveHourly = round2(brandNet / hoursForRate);
    const ok = brandNet > 0 && effectiveHourly >= input.hourlyRate;
    const yarnNote = input.yarnSupportValue > 0 ? ` (incl. $${input.yarnSupportValue.toFixed(0)} yarn counted as cost offset, not revenue)` : '';
    const reason = ok
      ? `${STRUCTURE_LABELS[s]} nets ${brandNet.toFixed(0)} over your ${cost.toFixed(0)} of work${yarnNote} — ${effectiveHourly.toFixed(0)}/hr ≥ your ${input.hourlyRate}/hr floor.`
      : `${STRUCTURE_LABELS[s]} nets ${brandNet.toFixed(0)} against ${cost.toFixed(0)} of work${yarnNote}; that is ${effectiveHourly.toFixed(0)}/hr vs your ${input.hourlyRate}/hr — the structure loses money even when it looks like a win.`;
    return {
      structure: s, label: STRUCTURE_LABELS[s], cash: round2(cash),
      royaltyRevenue: round2(royal), yarnOffset: round2(input.yarnSupportValue),
      grossInflow, designerCosts: round2(cost), lockedOutValue: round2(lockout),
      brandNet, selfPublishNet: round2(ownNet), effectiveHourly, ok, reason,
    };
  };

  const deal = makeVerdict(input.structure);
  const allStructures: RightsStructure[] = ['full_buyout', 'exclusive_flat', 'advance_royalty', 'yarn_support'];
  const scored = allStructures.map(makeVerdict);
  scored.sort((a, b) => b.brandNet - a.brandNet);
  const best = scored[0].ok ? scored[0].structure : null;

  const clauseFlags: DealMathResult['clauseFlags'] = [];
  if (input.structure === 'full_buyout') {
    clauseFlags.push({
      code: 'DM-01', severity: 'critical',
      text: `Full buyout transfers the pattern outright — per copyright norms that means life+70 years of rights. Your own channel loses ${ownNet.toFixed(0)} of tail sales permanently. The buyout price must clear ${cost.toFixed(0)} + lockout to merely break even.`,
    });
  }
  if (input.soleYarnClause) {
    clauseFlags.push({
      code: 'DM-02', severity: 'warning',
      text: `"Sole recommended yarn" clause: the brand demands you list their yarn as the ONLY option. It costs you nothing today but caps affiliate/custom-yarn upside, and it is the hook the company uses to justify paying you less.`,
    });
  }
  if (input.exclusivityMonths > 0 && input.structure !== 'full_buyout') {
    clauseFlags.push({
      code: 'DM-03', severity: input.exclusivityMonths >= 12 ? 'warning' : 'warning',
      text: `${input.exclusivityMonths} months locked out of your own channel ≈ ${locked.toFixed(0)} of forgone self-published sales at your velocity. Shorter exclusivity (3–6 months) keeps the fee but returns the tail sooner.`,
    });
  }
  if (input.structure === 'yarn_support' && input.yarnSupportValue < input.uncoveredCosts + cost * 0.2) {
    clauseFlags.push({
      code: 'DM-04', severity: 'warning',
      text: `Yarn-support-only deals are marketing spend by the brand, not income. Free yarn covers part of the sample, but your hours (${input.requiredHours}h) still need to be paid by someone — the WPK reference for an accessory pattern is $246 average, up to $700.`,
    });
  }
  if (deal.ok && deal.effectiveHourly < input.hourlyRate * 0.5 && input.structure === 'advance_royalty') {
    clauseFlags.push({
      code: 'DM-05', severity: 'warning',
      text: 'Concurrent advance+royalty looks safe but check the royalty base: gross royalties on Ravelry prices ignore platform fees, and if the company pays "on net" after its own costs the share is smaller than advertised. Counter on gross, settle net.',
    });
  }

  const brandChannelNet = deal.grossInflow - deal.designerCosts;
  const spread = round2(brandChannelNet - ownNet);
  const channelComparison = {
    brandNet: round2(brandChannelNet),
    ownNet: round2(ownNet),
    spread,
    note: spread >= 0
      ? `The brand channel nets ${spread.toFixed(0)} more than your own channel at these inputs — the deal is buying a better audience, which justifies giving up part of the tail.`
      : `Your own channel nets ${(-spread).toFixed(0)} more than the brand channel — every month of exclusivity costs more than the brand is paying.`,
  };

  const counterLetter =
    `Thank you for the offer — ${STRUCTURE_LABELS[input.structure].toLowerCase()} at $${input.fixedFee.toFixed(0)}${input.exclusivityMonths > 0 ? ` with ${input.exclusivityMonths} months exclusivity` : ''}. Based on my production costs and sales history, the structure nets $${deal.brandNet.toFixed(0)} against my costs, which is below my rate. I would be glad to move forward on one of: (a) a fixed fee of $${Math.round(input.fixedFee * 1.4)} for ${Math.max(6, Math.round(input.exclusivityMonths / 2))} months exclusivity, (b) $${Math.round(input.fixedFee * 0.6)} with no exclusivity, or (c) an advance against a royalty on ${input.royaltyBase === 'gross' ? 'gross' : 'net'} sales with me retaining the right to relist after the window. Happy to share the numbers behind this.`;

  const channels: ChannelValue[] = [
    { channel: 'brand', label: 'Brand channel (deal window)', units: input.companySales, netRevenue: platformNet(input.platform, input.patternPrice, input.companySales).netRevenue },
    { channel: 'own', label: 'Your channel (tail window)', units: input.ownMonthlySales * Math.max(0, input.tailMonths), netRevenue: ownNet },
  ];

  return {
    channels, deal,
    selfChannel: {
      channel: 'own', label: 'Your own channel', units: input.ownMonthlySales,
      netRevenue: platformNet(input.platform, input.patternPrice, input.ownMonthlySales).netRevenue,
    },
    channelComparison, bestStructure: best, clauseFlags, counterLetter,
  };
}
