/**
 * Payback Lab — per-pattern lifetime recoup tracker (CHK-093).
 *
 * THE PAIN (session 84 research): every designer answers the same question
 * manually, in their head or in a fragile spreadsheet — "I spent X hours and
 * $Y on this pattern; how many sales until it pays me back?" Woolly Wormhead
 * published her own math: £130 of direct cost per pattern, 49 copies to cover
 * costs, 133 copies to cover her time at minimum wage. Mediaperuana's math:
 * 55 hours, $155 direct costs, 24 copies to cover costs, 34 to cover costs +
 * overhead share, 94 to cover her time. No bookkeeping tool (Wave, Zoho,
 * QuickBooks, Xero, Craftybase, Ardent Seller) computes a per-design recoup
 * point against live sales. They track money in and out; none says "this
 * pattern paid you back on March 12th" or "this pattern has bled $140 for
 * 11 months — kill it, reprice it, or promote it."
 *
 * WHAT THIS ENGINE DOES
 * For every design in the ledger it computes:
 *   investment  = Σ design-scoped expenses (from the Design Ledger, matched
 *                 by designId — test knits, tech edits, yarn, photos, marketing)
 *               + Σ allocated overhead (expenses with designId === "")
 *                 split evenly across published designs
 *               + hours × hourlyRate (time cost; rate passed in by the UI,
 *                 defaulting to a floor of 12 currency units/hr with the
 *                 honest "your time has a price" nudge)
 *   netPerSale  = per-sale net = gross − fees (from Receipt Lab rows matched
 *                 to the design by patternName, same substring rule the
 *                 Design Ledger's matchDesign uses), averaged across the
 *                 design's receipts
 *   recoup point = ceil(investment / netPerSale) copies (or ∞ when not
 *                 reachable)
 *   status      = paid back (yes/no), copies sold vs needed, deficit/surplus
 *                 amount, months since last sale for bleed detection
 * Plus a what-if repricing view: at a new price the recoup point moves.
 *
 * LOCAL-FIRST: pure engine, no storage. Reads input shapes passed in.
 */

export interface PaybackSaleRow {
  /** kind "receipt" or "refund" (quotes skipped) */
  kind: "receipt" | "refund";
  /** YYYY-MM-DD */
  date: string;
  patternName: string;
  qty: number;
  gross: number;
  /** total fees on this sale (platform + processing + tax − shipping recovery) */
  fees: number;
}

export interface PaybackExpenseRow {
  /** design this expense is scoped to; "" = studio overhead */
  designId: string;
  amount: number;
  currency: string;
  /** YYYY-MM-DD */
  date: string;
}

export interface PaybackDesign {
  id: string;
  name: string;
  status: string;
  /** design hours the designer put in (knitting + writing + revising) */
  hours: number;
  /** when this design was added */
  createdAt: string;
}

export interface PaybackInput {
  designs: PaybackDesign[];
  expenses: PaybackExpenseRow[];
  sales: PaybackSaleRow[];
  /** designer's self-declared hourly rate in the studio currency */
  hourlyRate: number;
}

export const PAYBACK_DEFAULTS = {
  /** floor rate shown when the designer hasn't set one — honest, not invented */
  floorHourlyRate: 12,
} as const;

export interface PaybackDesignResult {
  design: PaybackDesign;
  /** fixed out-of-pocket cost recorded against this design */
  directCost: number;
  /** overhead share allocated to this design */
  overheadShare: number;
  /** time cost = hours × hourlyRate */
  timeCost: number;
  investment: number;
  copiesSold: number;
  revenueGross: number;
  revenueNet: number;
  avgNetPerSale: number;
  /** copies needed to recover the full investment; Infinity when unreachable */
  recoupCopies: number;
  /** "time break-even" copies — covers cost only, time excluded */
  costCopies: number;
  paidBack: boolean;
  paidBackTime: boolean;
  /** investment minus (net revenue − overhead share); positive = still in deficit */
  deficit: number;
  surplus: number;
  /** YYYY-MM-DD of last recorded sale, or "" */
  lastSaleDate: string;
  /** months since last sale; 0 when no sales */
  monthsSinceLastSale: number;
}

export interface PaybackResult {
  currency: string;
  designs: PaybackDesignResult[];
  /** investment across all designs */
  totalInvestment: number;
  /** revenue net across all designs */
  totalNet: number;
  /** how many designs have paid back their full investment */
  paidBackCount: number;
  /** patterns that have real skin in the game: investment > 0 or at least one sale */
  paidBackCountOfRelevant: number;
  publishedCount: number;
}

function twoDec(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Same substring attribution rule as the Design Ledger (matchDesign). */
export function matchDesignName(designName: string, patternName: string): boolean {
  const a = designName.trim().toLowerCase();
  const b = patternName.trim().toLowerCase();
  if (!a || !b) return false;
  return a.includes(b) || b.includes(a) || a === b;
}

export function computePayback(input: PaybackInput, nowDate: string = new Date().toISOString().slice(0, 10)): PaybackResult {
  const rate = input.hourlyRate > 0 ? input.hourlyRate : PAYBACK_DEFAULTS.floorHourlyRate;
  const currency =
    input.expenses.find((e) => e.currency)?.currency ??
    (input.designs.length > 0 ? "USD" : "USD");

  // Overhead expenses (designId === "") split evenly across published designs.
  let overheadTotal = 0;
  for (const e of input.expenses) {
    if (!e.designId) overheadTotal += e.amount;
  }
  const published = input.designs.filter((d) => d.status === "published");
  const overheadPerDesign = published.length > 0 ? overheadTotal / published.length : 0;

  // Sales aggregated per design (substring attribution).
  const byDesign = new Map<string, { copies: number; gross: number; net: number; lastDate: string }>();
  for (const d of input.designs) {
    byDesign.set(d.id, { copies: 0, gross: 0, net: 0, lastDate: "" });
  }
  for (const s of input.sales) {
    if (s.kind !== "receipt" && s.kind !== "refund") continue;
    const eff = s.kind === "refund" ? -1 : 1;
    for (const d of input.designs) {
      if (matchDesignName(d.name, s.patternName)) {
        const acc = byDesign.get(d.id)!;
        acc.copies += eff * Math.max(0, s.qty);
        acc.gross += eff * s.gross;
        acc.net += eff * (s.gross - s.fees);
        if (eff > 0 && s.date > acc.lastDate) acc.lastDate = s.date;
        break; // attribute each sale to the first matching design, like the ledger
      }
    }
  }

  const designResults: PaybackDesignResult[] = [];
  let totalInvestment = 0;
  let totalNet = 0;
  let paidBackCount = 0;
  let paidBackOfRelevant = 0;

  for (const d of input.designs) {
    const overheadShare = d.status === "published" ? overheadPerDesign : 0;
    const directCost = input.expenses
      .filter((e) => e.designId === d.id)
      .reduce((sum, e) => sum + e.amount, 0);
    const timeCost = twoDec((d.hours > 0 ? d.hours : 0) * rate);
    const investment = twoDec(directCost + overheadShare + timeCost);
    const acc = byDesign.get(d.id)!;
    const avgNet = acc.copies > 0 ? acc.net / acc.copies : 0;

    let recoupCopies = Infinity;
    let costCopies = Infinity;
    if (avgNet > 0) {
      recoupCopies = Math.max(0, Math.ceil(investment / avgNet));
      costCopies = Math.max(0, Math.ceil(directCost / avgNet));
    } else if (investment <= 0) {
      recoupCopies = 0;
      costCopies = 0;
    }

    // Defensive: reachable when copies finite (mirrors design-ledger.breakEven style).
    // A cost-free design with zero sales is not "paid back" — it just has
    // no investment yet. It only graduates once it has sold something or
    // has recouped real money invested.
    const paidBack =
      acc.copies >= recoupCopies && recoupCopies !== Infinity && (acc.copies > 0 || investment > 0);
    const paidBackTime = paidBack;
    const deficit = twoDec(investment - acc.net);
    const surplus = twoDec(Math.max(0, acc.net - investment));
    if (paidBack) paidBackCount += 1;
    if (acc.copies > 0 || investment > 0) paidBackOfRelevant += 1;

    let monthsSince = 0;
    if (acc.lastDate && acc.lastDate < nowDate) {
      const y0 = parseInt(acc.lastDate.slice(0, 4), 10);
      const m0 = parseInt(acc.lastDate.slice(5, 7), 10) - 1;
      const y1 = parseInt(nowDate.slice(0, 4), 10);
      const m1 = parseInt(nowDate.slice(5, 7), 10) - 1;
      monthsSince = Math.max(0, (y1 - y0) * 12 + (m1 - m0));
    }

    totalInvestment += investment;
    totalNet += acc.net;
    designResults.push({
      design: d,
      directCost: twoDec(directCost),
      overheadShare: twoDec(overheadShare),
      timeCost,
      investment,
      copiesSold: Math.max(0, Math.round(acc.copies)),
      revenueGross: twoDec(acc.gross),
      revenueNet: twoDec(acc.net),
      avgNetPerSale: twoDec(avgNet),
      recoupCopies,
      costCopies,
      paidBack,
      paidBackTime,
      deficit,
      surplus,
      lastSaleDate: acc.lastDate,
      monthsSinceLastSale: monthsSince,
    });
  }

  return {
    currency,
    designs: designResults,
    totalInvestment: twoDec(totalInvestment),
    totalNet: twoDec(totalNet),
    paidBackCount,
    paidBackCountOfRelevant: paidBackOfRelevant,
    publishedCount: published.length,
  };
}

/**
 * What-if repricing: recoup copies at a new net per sale. Used by the UI's
 * repricing slider to show "price it 10% higher → recoup in N copies instead".
 */
export function whatIfRecoup(investment: number, currentAvgNet: number, newNetPerSale: number): { current: number; projected: number } {
  const current = currentAvgNet > 0 ? Math.max(0, Math.ceil(investment / currentAvgNet)) : Infinity;
  const projected = newNetPerSale > 0 ? Math.max(0, Math.ceil(investment / newNetPerSale)) : Infinity;
  return { current, projected };
}

/** Copy of commissionActiveFor-style helper: never compare against Infinity
 *  as a ceiling (known scanner/Infinity-trap class). */
export function isReachable(copies: number): boolean {
  return Number.isFinite(copies);
}
