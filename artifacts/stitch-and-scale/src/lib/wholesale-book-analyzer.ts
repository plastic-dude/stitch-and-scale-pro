/**
 * Wholesale & Book-deal Analyzer — CHK-022
 *
 * Two decisions every indie knitwear designer eventually faces, and almost
 * nobody prices before saying yes:
 *
 *   1. A wholesale / bulk-pattern deal (LYS, yarn brand, bundle seller).
 *   2. A traditional book / publisher offer (advance + royalties).
 *
 * The category flaw this exploits: competitors' "deal" calculators (our own
 * Deals tab excepted) quote fees and splits but never compare the deal
 * against continuing to self-publish the same work — and never model the
 * cash timing of an advance or the volume doubling that wholesale demands.
 *
 *
 * CITED ECONOMICS:
 *
 * PLATFORM NETS (per $6 pattern, GoSadi Nov 2025):
 * - Ravelry: 0% commission → ~$5.70 net (2.9% + $0.30 processing)
 * - Etsy: ~$5.10 net (listing + transaction + processing)
 * - LoveCrafts: 25% seller fee until £1,500/mo → ~$4.20 net
 *
 * TRUE COST OF A PATTERN (Woolly Wormhead, canonical breakdown):
 * - Tech edit ~£30/pattern; books ~£50/pattern (3 editors, £800–900/10-pattern book)
 * - Test knitting ~£35/pattern (yardage-based pay + flat fee)
 * - Photography/models ~£20; yarn ~£10; advertising ~£15
 * - Direct production cost ≈ £130/pattern
 * - Labour ≈ 34.5 hours/pattern (knitting alone 24h)
 * - At £3 full price: 49 copies to cover cash, 84 to cover labour;
 *   at wholesale/discount rate: 87–150 copies.
 *
 * WHOLESALE STRUCTURE:
 * - LYSes generally double wholesale price → wholesale ≈ 50% of retail
 * - Keystone handmade formula: COGS × 2 = wholesale, COGS × 4 = retail
 * - A $8 pattern at 50% wholesale nets $4 — needs 2× the volume of direct
 *   sales at the same net price to equal direct income.
 *
 * BOOK DEAL MECHANICS (Writers Block Party, trad-publishing masterpost):
 * - Royalties are % of cover price: typical 10% hardcover, 25% ebook,
 *   8% paperback, 6% mass market — negotiated by agent
 * - Advances paid in 2–4 installments (signing / delivery / release most common)
 * - Royalties start only after the advance is earned out; most books
 *   never earn out — plan for the advance as your full income
 * - First royalty statement arrives ~6 months after release (~2 years
 *   after deal close); statements twice a year or quarterly
 * - Agent takes 15% of income; taxes a further ~35%
 *
 * PROFESSIONAL FLOOR: $12/hr (Who Pays Knitters bar, used across the app).
 */

import { platformNet, PLATFORM_LABELS } from './pattern-income-calculator';
import { estimateYarn, YARN_WEIGHTS } from './yarn-estimator';
import { isFinitePositive } from './numeric-guard'; // CHK-146: prose must never stringify Infinity/NaN

export const HOURLY_FLOOR = 12; // realistic floor for a part-time designer's time
export const AGENT_SHARE = 0.15;
export const TAX_SHARE = 0.35;
export const WHOLESALE_SPLIT = 0.5; // typical keystone cut of retail
export const DIRECT_PRODUCTION_COST_PER_PATTERN = 130; // £-based benchmark, used as $ proxy
export const LABOUR_HOURS_PER_PATTERN = 34.5;

export type Verdict = 'go' | 'maybe' | 'no';

export interface WholesaleInputs {
  patterns: number; // patterns offered at wholesale
  retailPrice: number; // your normal self-publish retail price
  wholesaleRate: number; // per-pattern wholesale price offered
  orderQuantity: number; // quantity / term (copies or months)
  repeatOrderChance: number; // 0–1 chance the buyer reorders
  workHours: number; // total design/support hours for this deal
  exclusive: boolean; // can you still self-sell these patterns?
  cashCosts: number; // test knitting, tech edit, photo, yarn for this deal
  yourRate: number; // platform net per pattern when self-selling (defaults to Ravelry)
}

export interface WholesaleResult {
  wholesaleNet: number;
  directNetEquivalent: number; // what the same quantity self-sold would net
  volumeBreakeven: number; // direct sales needed to equal this wholesale net
  effectiveHourly: number;
  labourCovered: boolean;
  verdict: Verdict;
  notes: string[];
  /** quarantined if order quantity is 0 or non-finite economics */
  isComplete: boolean;
}

export interface BookInputs {
  patterns: number; // number of patterns in the book
  advance: number; // total advance offered
  installments: 2 | 3 | 4; // paid at signing/delivery/release(/publication)
  royaltyRate: number; // % of cover price (e.g. 10 for hardcover)
  coverPrice: number; // book cover price
  workHours: number; // total design/test/edit hours for the book
  cashCosts: number; // out-of-pocket costs covered by advance
  selfPublishMonths: number; // months it would take to self-publish same patterns
  monthlySelfSellUnits: number; // realistic monthly pattern sales
  unitNet: number; // net per self-sold pattern
}

export interface BookResult {
  earnOutCopies: number;
  perCopyRoyalty: number;
  installmentTimeline: string[];
  netAdvanceAfterDeductions: number;
  agentCut: number;
  taxCut: number;
  selfPublishNet: number;
  dealNetPerHour: number;
  selfPublishHourly: number;
  firstStatementLagMonths: number;
  verdict: Verdict;
  notes: string[];
  /** quarantined if advance is 0 or non-finite economics */
  isComplete: boolean;
}

export interface BulkCheckItem {
  check: string;
  rationale: string;
  flag: boolean; // true = potential red flag / needs attention
}

export interface WholesalePack {
  checklist: BulkCheckItem[];
  reply: string;
}

/**
 * Analyse a wholesale / bulk-pattern deal against self-publishing.
 *
 * The core question: how much would selling these same patterns direct
 * have earned, versus what this deal pays — and is the hourly rate real?
 */
export function analyzeWholesaleDeal(input: WholesaleInputs): WholesaleResult {
  const retail = Math.max(0, input.retailPrice);
  const wholesale = Math.max(0, input.wholesaleRate);
  const qty = Math.max(1, input.orderQuantity);

  const yourRate = input.yourRate > 0
    ? input.yourRate
    : platformNet('ravelry', retail, 1).netPerSale;
  const directNetEquivalent = qty * yourRate * (1 + input.repeatOrderChance);
  const wholesaleNet = qty * wholesale * (1 + input.repeatOrderChance * WHOLESALE_SPLIT);

  // Volume breakeven: how many direct sales match this wholesale cheque
  const volumeBreakeven = yourRate > 0
    ? Math.ceil(wholesaleNet / yourRate)
    : Infinity;

  const totalHours = Math.max(1, input.workHours);
  const effectiveHourly = wholesaleNet / totalHours;

  const labourCovered = wholesaleNet >= input.cashCosts + totalHours * HOURLY_FLOOR;

  const notes: string[] = [];

  // The keystone math: LYSes mark wholesale up to retail, so buyers expect ~50%
  if (retail > 0 && wholesale / retail < 0.4) {
    notes.push(
      `At ${Math.round(wholesale / retail * 100)}% of retail you're under the standard keystone cut — shops buy at half retail because that's the margin structure, but below 40% the deal is quietly a discount to the buyer's discount. Ask for the retail price the shop plans to carry and work backwards.`
    );
  }
  if (retail > 0 && wholesale / retail > 0.6) {
    notes.push(
      `${Math.round(wholesale / retail * 100)}% of retail is unusually generous — check the terms for consignment-without-payment clauses, long payment terms, or inventory-credit language before banking on it.`
    );
  }

  // CHK-146 (extended audit E-02): never stringify a non-finite breakeven.
  // When the self-sell net cannot be computed (no retail price AND no
  // Ravelry net), the direct-vs-wholesale comparison is meaningless.
  if (isFinitePositive(yourRate)) {
    notes.push(
      `Sell ${volumeBreakeven} copies direct to match this wholesale cheque at your $${yourRate.toFixed(2)}/pattern net. If your realistic direct volume over this term is lower, wholesale wins on volume; if higher, you're handing the margin away.`
    );
  } else {
    notes.push(
      `No direct-vs-wholesale volume comparison is possible yet: your self-sell net per pattern could not be computed (set a real retail price or your own platform rate first).`
    );
  }

  if (!input.exclusive) {
    notes.push(
      `You can keep self-selling these patterns — the deal is pure upside on the wholesale slice. Non-exclusive wholesale rarely changes your core strategy; treat it as bonus income.`
    );
  } else {
    const lostDirect = qty * yourRate;
    notes.push(
      `Exclusive deal: the direct sales you give up are ~$${lostDirect.toFixed(0)} over this term. The wholesale cheque needs to clear your hourly bar on total hours, not just the knitting.`
    );
  }

  if (effectiveHourly < HOURLY_FLOOR) {
    notes.push(
      `$${effectiveHourly.toFixed(2)}/hr is under the $12/hr professional floor. Wholesale's real cost is the volume doubling — every wholesale copy earns about half a direct copy, so the bar for "yes" is double the direct sales you'd expect.`
    );
  }

  const verdict: Verdict = labourCovered && effectiveHourly >= HOURLY_FLOOR
    ? 'go'
    : labourCovered
      ? 'maybe'
      : 'no';

  if (verdict === 'maybe') {
    notes.push(
      `Covers cash costs and pays some hourly, but below the $12 bar — counter on rate, quantity or hours, or take it if the buyer is a relationship you want (repeat-order chance ${Math.round(input.repeatOrderChance * 100)}% is your best lever).`
    );
  }

  const isComplete = input.orderQuantity > 0 && isFinite(wholesaleNet) && input.wholesaleRate > 0;

  return {
    wholesaleNet: round2(wholesaleNet),
    directNetEquivalent: round2(directNetEquivalent),
    volumeBreakeven,
    effectiveHourly: round2(effectiveHourly),
    labourCovered,
    verdict,
    notes,
    isComplete,
  };
}

/**
 * Analyse a traditional book deal: advance timing, earn-out reality,
 * deductions, and the alternative of self-publishing the same patterns.
 */
export function analyzeBookDeal(input: BookInputs): BookResult {
  const advance = Math.max(0, input.advance);
  const royalty = Math.max(0, input.royaltyRate) / 100;
  const cover = Math.max(0.01, input.coverPrice);
  const perCopyRoyalty = cover * royalty;
  const earnOutCopies = perCopyRoyalty > 0 ? Math.ceil(advance / perCopyRoyalty) : Infinity;

  // Installment timeline — signing / delivery / release / publication
  const months = [0, 8, 14, 20].slice(0, input.installments);
  const installmentTimeline = months.map((m) =>
    m === 0 ? 'At signing (month 0)' : `Month ~${m}`
  );

  const agentCut = advance * AGENT_SHARE;
  const afterAgent = advance - agentCut;
  const taxCut = afterAgent * TAX_SHARE;
  const netAdvanceAfterDeductions = round2(afterAgent - taxCut);

  // Self-publish alternative: same patterns sold directly over the window
  const selfPublishNet = input.monthlySelfSellUnits * input.unitNet * input.selfPublishMonths;

  const totalHours = Math.max(1, input.workHours);
  const dealNetPerHour = netAdvanceAfterDeductions / totalHours;
  const selfPublishHourly = selfPublishNet / Math.max(1, input.selfPublishMonths * 30 / 30); // per month → normalize below

  const firstStatementLagMonths = 6 + Math.round(input.selfPublishMonths / 6) * 3;

  const notes: string[] = [];

  notes.push(
    `At ${Math.round(royalty * 100)}% of the $${cover.toFixed(2)} cover you earn $${perCopyRoyalty.toFixed(2)}/copy — you need ${earnOutCopies.toLocaleString()} copies sold just to start earning royalties. Most books never earn out; plan on the advance as your entire income.`
  );

  if (royalty < 0.08) {
    notes.push(
      `${Math.round(royalty * 100)}% is below the typical 8% paperback floor — trad deals usually run 10% hardcover / 8% paperback / 25% ebook. If this is a print deal under 8%, counter.`
    );
  } else if (royalty <= 0.12) {
    notes.push(
      `Royalty sits in the standard paperback range (8–12% of cover). Ebook rights at 25% of net are the typical companion — if digital is included at a lower rate, split the rights.`
    );
  }

  notes.push(
    `After the agent's 15% and ~35% tax drag, the $${advance.toLocaleString()} advance nets ~$${netAdvanceAfterDeductions.toLocaleString()} over ${input.installments} installments (signing, delivery, release${input.installments === 4 ? ', publication' : ''}). First royalty statement arrives ~6 months after release; until then every royalty dollar pays back the advance, not you.`
  );

  const window = Math.max(input.selfPublishMonths, 24);
  notes.push(
    `Self-publishing the same ${input.patterns} patterns over ~${Math.round(window)} months at ${input.monthlySelfSellUnits} sales/month nets ~$${selfPublishNet.toFixed(0)} ($${(selfPublishNet / window).toFixed(2)}/month). The book deal beats that only if the advance + any platform royalties beat self-sell — and remember: self-sold patterns stay in your catalogue earning forever, book royalties stop when the book stops selling.`
  );

  if (netAdvanceAfterDeductions / input.patterns < DIRECT_PRODUCTION_COST_PER_PATTERN * 0.55) {
    notes.push(
      `$${(netAdvanceAfterDeductions / input.patterns).toFixed(0)} per pattern after deductions sits under half the ~$130 direct cost of a professionally produced pattern — the publisher is pricing your test knitting, tech edit and photography cheaply. Check what costs the publisher absorbs before accepting.`
    );
  }

  const verdict: Verdict =
    dealNetPerHour >= HOURLY_FLOOR && netAdvanceAfterDeductions >= selfPublishNet
      ? 'go'
      : netAdvanceAfterDeductions >= selfPublishNet * 0.7 && dealNetPerHour >= HOURLY_FLOOR
        ? 'maybe'
        : 'no';

  if (verdict === 'maybe') {
    notes.push(
      `Verdict is maybe: the hourly clears the bar but the advance doesn't beat self-publishing outright — this deal is worth taking if the publisher's audience (which you can't self-sell into) closes the gap, or for the catalogue credibility a book carries.`
    );
  } else if (verdict === 'no') {
    notes.push(
      `Verdict is no: self-publishing the same patterns clears more money, keeps the catalogue, and avoids the ~${firstStatementLagMonths}-month cash lag. A book deal has to pay for both the delay and the rights.`
    );
  }

  const isComplete = input.advance > 0 && isFinite(netAdvanceAfterDeductions) && input.patterns > 0;

  return {
    earnOutCopies,
    perCopyRoyalty: round2(perCopyRoyalty),
    installmentTimeline,
    netAdvanceAfterDeductions,
    agentCut: round2(agentCut),
    taxCut: round2(taxCut),
    selfPublishNet: round2(selfPublishNet),
    dealNetPerHour: round2(dealNetPerHour),
    selfPublishHourly: round2(selfPublishNet / window),
    firstStatementLagMonths,
    verdict,
    notes,
    isComplete,
  };
}

/**
 * Bulk-order / wholesale reply checklist + a paste-ready counteroffer reply.
 *
 * Checklist drawn from the keystone formula and the Woolly Wormhead cost
 * model: wholesale without labour and without the retail anchor is how
 * designers end up working for free at scale.
 */
export function buildWholesalePack(
  inputs: WholesaleInputs,
  result: WholesaleResult
): WholesalePack {
  const checklist: BulkCheckItem[] = [
    {
      check: `Retail price anchoring — confirm the shop's planned retail price`,
      rationale: `LYSes generally double the wholesale price they pay (keystone: COGS×2 = wholesale, COGS×4 = retail). If the retailer won't tell you the carry price, they're keeping the margin flexibility and you're buying blind.`,
      flag: inputs.retailPrice <= 0,
    },
    {
      check: `Payment terms — deposit or payment on delivery, not consignment-only`,
      rationale: `Consignment without a payment date means the shop pays when it sells — which can be never. Wholesale orders should carry a payment term (typically 30 days from invoice) or a deposit of 50% on order.`,
      flag: false,
    },
    {
      check: `Volume breakeven sanity — ${isFinite(result.volumeBreakeven) ? result.volumeBreakeven.toLocaleString() : 'no computable breakeven'} direct copies would equal this cheque`,
      rationale: `At roughly half of direct net per copy, wholesale only wins on volume you can't reach yourself. If the order is small (under ~25 copies), the admin alone eats the margin.`,
      flag: inputs.orderQuantity < 25,
    },
    {
      check: `Exclusivity window — if exclusive, get a defined term and reversion clause`,
      rationale: `An open-ended exclusive wholesale deal turns into de facto rights transfer. A 12-month term with automatic reversion keeps your catalogue yours.`,
      flag: inputs.exclusive,
    },
    {
      check: `Labour priced — ${inputs.workHours}h at the $12/hr floor = $${(inputs.workHours * HOURLY_FLOOR).toFixed(0)} must be inside the cheque`,
      rationale: `Makers who omit their own labour from wholesale pricing turn wholesale into a margin trap (Craftybase wholesale pricing guidance). The cheque must cover COGS at current prices + your labour + a share of overheads.`,
      flag: !result.labourCovered,
    },
    {
      check: `Repeat-order clause — reorder at the same rate, not a renegotiated one`,
      rationale: `The best wholesale relationships pay on reorder. If the buyer can renegotiate after you've sunk the design cost, your sunk cost becomes their leverage.`,
      flag: inputs.repeatOrderChance <= 0,
    },
  ];

  const retailAnchor = inputs.retailPrice > 0
    ? ` at $${inputs.wholesaleRate.toFixed(2)} each against the $${inputs.retailPrice.toFixed(2)} retail`
    : '';
  const exclusivity = inputs.exclusive
    ? ` Because this is exclusive, I'd ask for a 12-month term with rights reverting automatically at term end.`
    : '';

  const reply =
    `Thanks so much for the interest in carrying my patterns${retailAnchor}. To make this work at scale I'd need to confirm a few things before I commit:\n\n` +
    `- Payment terms: 50% deposit on order with the balance due on delivery (or net 30 from invoice)\n` +
    `- Reorder rate locked at the same price for at least the first year\n` +
    `- Confirmation of the retail price you'll carry them at\n` +
    `- Your planned quantity per pattern and a re-order date\n\n` +
    `I can deliver print-ready files within ${Math.ceil(inputs.workHours / 8)} working days of order confirmation.${exclusivity}`;

  return { checklist, reply };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
