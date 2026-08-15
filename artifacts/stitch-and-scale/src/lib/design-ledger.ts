/**
 * Design Ledger engine (CHK-086).
 *
 * THE RECORD ROOM — the first place in the app that records a portfolio of
 * designs rather than calculating one number. Per the CHK-085 research
 * (docs/record-keeping-gap-map.md): designers suffer margin blindness,
 * design cost fog, tax paralysis, and spreadsheet abandonment. This engine
 * keeps four record types:
 *
 *   1. DesignEntry  — the portfolio row: every design the studio touches,
 *                     with a status life-cycle (concept → sampled →
 *                     published → archived) so nothing gets lost in the
 *                     "which sweater was I knitting again" fog.
 *   2. ExpenseEntry — a running cost log (yarn for samples, tech edit
 *                     fees, test-knit fees, photography, software...)
 *                     attached to a design. Feeds break-even math.
 *   3. Rollup       — per-design sales + cost view, plus monthly P&L.
 *                     (Sales rows flow in from the Receipt Lab — the
 *                     receipt ledger stays the single source of truth for
 *                     sales; this module reads them, never writes them.)
 *   4. Export       — accountant-ready CSV + summary text for tax season,
 *                     answering the "zero records, paralyzed" failure mode.
 *
 * CLOUD / AUTH SEAM NOTE (founder directive CHK-086): the stored shape
 * carries an `authId` field so that when Supabase auth lands, a tester's
 * signed-in id is written alongside their records. Local-first stays for
 * everyone; cloud merge later reads `authId` as the bridge key between
 * the local IndexedDB store and the Neon-backed account. Nothing in this
 * module contacts any network today.
 */

export type DesignStatus =
  | "concept"
  | "in-progress"
  | "sampled"
  | "published"
  | "archived";

export const DESIGN_STATUS_LABELS: Record<DesignStatus, string> = {
  concept: "Concept",
  "in-progress": "In Progress",
  sampled: "Sampled",
  published: "Published",
  archived: "Archived",
};

export const DESIGN_STATUS_ORDER: DesignStatus[] = [
  "concept",
  "in-progress",
  "sampled",
  "published",
  "archived",
];

export type ExpenseCategory =
  | "yarn"
  | "notions"
  | "tech-edit"
  | "test-knit"
  | "photography"
  | "software"
  | "marketing"
  | "platform-fees"
  | "shipping"
  | "other";

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  yarn: "Yarn / Materials",
  notions: "Notions",
  "tech-edit": "Tech Editing",
  "test-knit": "Test Knit Fees",
  photography: "Photography",
  software: "Software / Tools",
  marketing: "Marketing",
  "platform-fees": "Platform Fees",
  shipping: "Shipping",
  other: "Other",
};

export interface DesignEntry {
  id: string;
  /** design name — free text, e.g. "Mossy Yoke Sweater" */
  name: string;
  status: DesignStatus;
  /** notes visible in the ledger (swatch yarn, sizes planned, launch plan) */
  notes: string;
  /** when this design was added */
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseEntry {
  id: string;
  /** design this cost belongs to; "" means studio overhead (no design) */
  designId: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  currency: string;
  /** YYYY-MM-DD */
  date: string;
  /** when recorded */
  createdAt: string;
}

export interface DesignLedgerInput {
  designs: DesignEntry[];
  expenses: ExpenseEntry[];
  /** sales rows from the Receipt Lab for this project (read-only view) */
  sales: DesignLedgerSaleRow[];
}

/**
 * Minimal view the ledger needs from a Receipt Lab row — passed in rather
 * than importing the receipt module, keeping this engine testable and
 * decoupled.
 */
export interface DesignLedgerSaleRow {
  id: string;
  kind: "receipt" | "quote" | "refund";
  date: string;
  patternName: string;
  itemsQtyTotal: number;
  grossTotal: number;
  feesTotal: number;
  profit: number;
}

export interface DesignDesignSummary {
  design: DesignEntry;
  /** total cost recorded against this design */
  costTotal: number;
  /** gross revenue attributed to this design (matched by name) */
  revenueTotal: number;
  /** sales count attributed to this design */
  salesCount: number;
  /** profit attributed: revenue minus fees minus design cost */
  profitAttributed: number;
}

export interface DesignLedgerRollup {
  designs: DesignDesignSummary[];
  totalCost: number;
  totalRevenue: number;
  totalSales: number;
  totalProfit: number;
  /** number of published designs */
  publishedCount: number;
  /** design status pipeline counts */
  pipeline: Record<DesignStatus, number>;
  /** monthly P&L rows */
  monthly: { month: string; revenue: number; cost: number; profit: number }[];
}

export function addDesign(designs: DesignEntry[], patch: { name: string; notes?: string }): DesignEntry[] {
  const now = new Date().toISOString();
  const base: DesignEntry = {
    id: "design-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    name: patch.name.trim(),
    status: "concept",
    notes: (patch.notes ?? "").trim(),
    createdAt: now,
    updatedAt: now,
  };
  if (!base.name) return designs;
  return [...designs, base];
}

export function updateDesign(
  designs: DesignEntry[],
  id: string,
  patch: Partial<Pick<DesignEntry, "name" | "status" | "notes">>,
): DesignEntry[] {
  return designs.map((d) => {
    if (d.id !== id) return d;
    const next: DesignEntry = {
      id: d.id,
      name: patch.name !== undefined ? (patch.name ?? "").trim() || d.name : d.name,
      status: patch.status ?? d.status,
      notes: patch.notes !== undefined ? (patch.notes ?? "").trim() : d.notes,
      createdAt: d.createdAt,
      updatedAt: new Date().toISOString(),
    };
    return next;
  });
}

export function removeDesign(designs: DesignEntry[], id: string): DesignEntry[] {
  return designs.filter((d) => d.id !== id);
}

export function addExpense(
  expenses: ExpenseEntry[],
  patch: {
    designId: string;
    category: ExpenseCategory;
    description: string;
    amount: number;
    currency: string;
    date?: string;
  },
): ExpenseEntry[] {
  if (!(patch.amount > 0)) return expenses;
  const row: ExpenseEntry = {
    id: "exp-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    designId: patch.designId ?? "",
    category: patch.category,
    description: (patch.description ?? "").trim(),
    amount: twoDec(patch.amount),
    currency: patch.currency || "USD",
    date: patch.date || new Date().toISOString().slice(0, 10),
    createdAt: new Date().toISOString(),
  };
  return [...expenses, row];
}

export function removeExpense(expenses: ExpenseEntry[], id: string): ExpenseEntry[] {
  return expenses.filter((e) => e.id !== id);
}

/**
 * Attribute a sales row to a design by case-insensitive substring match on
 * the pattern name. "Mossy Yoke" matches a design named "Mossy Yoke
 * Sweater". Rows matching no design attribute to overhead revenue.
 */
function matchDesign(name: string, row: DesignLedgerSaleRow): string | null {
  const key = row.patternName.trim().toLowerCase();
  if (!key) return null;
  const candidate = name.toLowerCase();
  return candidate.includes(key) || key.includes(candidate) || candidate === key ? name : null;
}

export function rollup(input: DesignLedgerInput): DesignLedgerRollup {
  const { designs, expenses, sales } = input;
  const byDesign = new Map<string, { cost: number; revenue: number; sales: number; profit: number }>();
  const pipeline: Record<DesignStatus, number> = {
    concept: 0,
    "in-progress": 0,
    sampled: 0,
    published: 0,
    archived: 0,
  };
  for (const d of designs) {
    byDesign.set(d.id, { cost: 0, revenue: 0, sales: 0, profit: 0 });
    pipeline[d.status] += 1;
  }
  for (const e of expenses) {
    const entry = byDesign.get(e.designId) ?? { cost: 0, revenue: 0, sales: 0, profit: 0 };
    entry.cost += e.amount;
    if (e.designId && !byDesign.has(e.designId)) {
      // orphan expense against a removed design — keep its cost visible
      byDesign.set(e.designId, entry);
    }
  }
  const monthMap = new Map<string, { revenue: number; cost: number; profit: number }>();
  for (const e of expenses) {
    const m = e.date.slice(0, 7);
    if (!m) continue;
    const row = monthMap.get(m) ?? { revenue: 0, cost: 0, profit: 0 };
    row.cost += e.amount;
    monthMap.set(m, row);
  }
  for (const s of sales) {
    // receipts and refunds are real money; quotes are offers, not sales.
    if (s.kind === "quote") continue;
    const isRefund = s.kind === "refund";
    const eff = isRefund ? -1 : 1;
    let attributed = false;
    for (const d of designs) {
      if (matchDesign(d.name, s)) {
        const entry = byDesign.get(d.id)!;
        entry.revenue += eff * s.grossTotal;
        if (!isRefund) entry.sales += 1;
        entry.profit += eff * (s.grossTotal - s.feesTotal);
        attributed = true;
        break;
      }
    }
    // monthly P&L sees every real sale, attributed or not.
    const m = s.date.slice(0, 7);
    if (m) {
      const row = monthMap.get(m) ?? { revenue: 0, cost: 0, profit: 0 };
      row.revenue += eff * s.grossTotal;
      monthMap.set(m, row);
    }
  }
  // Attributed profit for a design = (revenue - fees) - design cost.
  // entry.profit accumulates (gross - fees) per attributed sale/refund, so
  // attributed profit is simply profit minus the design's recorded cost.
  const finalSummaries: DesignDesignSummary[] = designs.map((d) => {
    const entry = byDesign.get(d.id)!;
    return {
      design: d,
      costTotal: twoDec(entry.cost),
      revenueTotal: twoDec(entry.revenue),
      salesCount: entry.sales,
      profitAttributed: twoDec(entry.profit - entry.cost),
    };
  });

  let totalCost = 0;
  let totalRevenue = 0;
  let totalSales = 0;
  let totalProfit = 0;
  for (const e of expenses) totalCost += e.amount;
  for (const s of sales) {
    if (s.kind === "quote") continue;
    const eff = s.kind === "refund" ? -1 : 1;
    totalRevenue += eff * s.grossTotal;
    if (s.kind !== "refund") totalSales += 1;
    totalProfit += eff * (s.grossTotal - s.feesTotal);
  }
  for (const row of monthMap.values()) {
    row.cost = twoDec(row.cost);
    row.revenue = twoDec(row.revenue);
    row.profit = twoDec(row.revenue - row.cost);
  }
  const monthly = [...monthMap.entries()]
    .map(([month, row]) => ({ month, revenue: twoDec(row.revenue), cost: twoDec(row.cost), profit: twoDec(row.profit) }))
    .sort((a, b) => (a.month < b.month ? -1 : a.month > b.month ? 1 : 0));
  return {
    designs: finalSummaries,
    totalCost: twoDec(totalCost),
    totalRevenue: twoDec(totalRevenue),
    totalSales,
    totalProfit: twoDec(totalProfit - totalCost),
    publishedCount: pipeline.published,
    pipeline,
    monthly,
  };
}

export function breakEven(cost: number, pricePerCopy: number): { copies: number; reachable: boolean } {
  if (!(pricePerCopy > 0)) return { copies: 0, reachable: !(cost > 0) };
  const copies = Math.max(0, Math.ceil(cost / pricePerCopy));
  return { copies, reachable: true };
}

/** Accountant-ready CSV export (RFC 4180 escaping). */
export function exportLedgerCsv(input: DesignLedgerInput, studioName: string): string {
  const esc = (v: string) => {
    if (v.includes('"') || v.includes(",") || v.includes("\n")) {
      return '"' + v.replace(/"/g, '""') + '"';
    }
    return v;
  };
  const lines: string[] = [];
  lines.push("type,design,date,category,description,amount,currency");
  for (const d of input.designs) {
    lines.push(["design", esc(d.name), d.createdAt.slice(0, 10), esc(DESIGN_STATUS_LABELS[d.status]), esc(d.notes), "", ""].join(","));
  }
  for (const e of input.expenses) {
    const d = input.designs.find((x) => x.id === e.designId);
    lines.push(["expense", esc(d?.name ?? ""), e.date, esc(EXPENSE_CATEGORY_LABELS[e.category]), esc(e.description), String(twoDec(e.amount)), esc(e.currency)].join(","));
  }
  for (const s of input.sales) {
    const d = input.designs.find((x) => matchDesign(x.name, s));
    lines.push(["sale", esc(s.kind === "refund" ? "REFUND " + (d?.name ?? s.patternName) : (d?.name ?? s.patternName)), s.date, esc(s.kind), "", String(twoDec(s.grossTotal)), ""].join(","));
  }
  const header = studioName ? "# " + studioName + " — design ledger export" : "# design ledger export";
  return [header, "", lines.join("\n")].join("\n");
}

export function exportLedgerSummary(r: DesignLedgerRollup, studioName: string): string {
  const lines: string[] = [];
  lines.push(studioName ? studioName + " — Design Ledger Summary" : "Design Ledger Summary");
  lines.push("");
  lines.push("Pipeline: " + DESIGN_STATUS_ORDER.map((s) => r.pipeline[s] + " " + DESIGN_STATUS_LABELS[s].toLowerCase()).join(" · "));
  lines.push("Published designs: " + r.publishedCount);
  lines.push("Sales recorded: " + r.totalSales);
  lines.push("Revenue: " + r.totalRevenue.toFixed(2));
  lines.push("Design costs: " + r.totalCost.toFixed(2));
  lines.push("Profit after fees & costs: " + r.totalProfit.toFixed(2));
  lines.push("");
  for (const d of r.designs) {
    if (d.costTotal > 0 || d.revenueTotal !== 0) {
      lines.push(DESIGN_STATUS_LABELS[d.design.status] + " · " + d.design.name + " — cost " + d.costTotal.toFixed(2) + ", revenue " + d.revenueTotal.toFixed(2) + ", sales " + d.salesCount + ", profit " + d.profitAttributed.toFixed(2));
    }
  }
  return lines.join("\n");
}

function twoDec(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Default studio — used until the designer types a studio name in the
 * ledger settings. Kept minimal on purpose (spreadsheet-graveyard rule:
 * fewest-possible-fields default).
 */
export const DEFAULT_DESIGN_LEDGER: {
  studioName: string;
  currency: string;
  authId: string;
  designs: DesignEntry[];
  expenses: ExpenseEntry[];
} = {
  studioName: "",
  currency: "USD",
  /** Cloud-bridge field: tester's signed-in auth id, written when auth
   *  arrives; empty string while local-first only. */
  authId: "",
  designs: [],
  expenses: [],
};
