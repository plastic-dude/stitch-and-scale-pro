import { describe, expect, it } from "vitest";
import {
  addDesign,
  addExpense,
  breakEven,
  DESIGN_STATUS_LABELS,
  exportLedgerCsv,
  exportLedgerSummary,
  removeDesign,
  removeExpense,
  rollup,
  updateDesign,
  type DesignEntry,
  type DesignLedgerSaleRow,
  type ExpenseEntry,
} from "./design-ledger";

function design(name: string, status: DesignEntry["status"] = "concept"): DesignEntry {
  return {
    id: "d-" + name,
    name,
    status,
    notes: "",
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
  };
}

function expense(designId: string, amount: number, date = "2026-08-05", category: ExpenseEntry["category"] = "yarn"): ExpenseEntry {
  return {
    id: "e-" + designId + "-" + amount,
    designId,
    category,
    description: "sample yarn",
    amount,
    currency: "USD",
    date,
    createdAt: "2026-08-05T00:00:00.000Z",
  };
}

function sale(patternName: string, gross: number, fees: number, profit: number, kind: DesignLedgerSaleRow["kind"] = "receipt", date = "2026-08-10"): DesignLedgerSaleRow {
  return {
    id: "s-" + patternName + "-" + gross,
    kind,
    date,
    patternName,
    itemsQtyTotal: 1,
    grossTotal: gross,
    feesTotal: fees,
    profit,
  };
}

describe("design lifecycle", () => {
  it("adds a named design and rejects empty names", () => {
    const next = addDesign([], { name: "Mossy Yoke Sweater", notes: "worsted" });
    expect(next).toHaveLength(1);
    expect(next[0].name).toBe("Mossy Yoke Sweater");
    expect(next[0].status).toBe("concept");
    expect(addDesign(next, { name: "   " })).toHaveLength(1);
  });

  it("updates status along the pipeline and touches updatedAt", () => {
    const d = design("Mossy Yoke Sweater", "sampled");
    const next = updateDesign([d], d.id, { status: "published" });
    expect(next[0].status).toBe("published");
    expect(next[0].updatedAt).not.toBe(d.updatedAt);
    expect(updateDesign([d], "nope", { status: "published" })[0].status).toBe("sampled");
  });

  it("removes designs and their expenses survive as overhead-visible", () => {
    const d = design("Old Cardigan");
    expect(removeDesign([d], d.id)).toHaveLength(0);
    const r = rollup({ designs: [], expenses: [expense(d.id, 20)], sales: [] });
    // orphan cost still counts toward total cost
    expect(r.totalCost).toBe(20);
  });
});

describe("expense log", () => {
  it("adds expenses and refuses non-positive amounts", () => {
    const next = addExpense([], { designId: "d1", category: "tech-edit", description: "editor", amount: 75, currency: "USD" });
    expect(next[0].amount).toBe(75);
    expect(next[0].date).toBeTruthy();
    expect(addExpense(next, { designId: "d1", category: "yarn", description: "x", amount: 0, currency: "USD" })).toHaveLength(1);
    expect(addExpense(next, { designId: "d1", category: "yarn", description: "x", amount: -5, currency: "USD" })).toHaveLength(1);
  });

  it("removes expenses", () => {
    const e = expense("d1", 10);
    expect(removeExpense([e], e.id)).toHaveLength(0);
  });
});

describe("rollup", () => {
  it("sums costs, attributes revenue by name match, and subtracts cost from attributed profit", () => {
    const d = design("Mossy Yoke", "published");
    const input = {
      designs: [d],
      expenses: [expense(d.id, 40)],
      sales: [sale("Mossy Yoke", 100, 10, 90)],
    };
    const r = rollup(input);
    expect(r.totalCost).toBe(40);
    expect(r.totalRevenue).toBe(100);
    expect(r.totalSales).toBe(1);
    // profit after fees (90) minus design cost (40) = 50
    expect(r.totalProfit).toBe(50);
    const ds = r.designs[0];
    expect(ds.costTotal).toBe(40);
    expect(ds.revenueTotal).toBe(100);
    expect(ds.profitAttributed).toBe(50);
  });

  it("matches sales to designs case-insensitively and handles a unique substring", () => {
    const d = design("Mossy Yoke Sweater");
    const r = rollup({ designs: [d], expenses: [], sales: [sale("mossy yoke", 30, 3, 27)] });
    expect(r.designs[0].revenueTotal).toBe(30);
  });

  it("does not guess when a sale matches multiple designs", () => {
    const designs = [design("Mossy Yoke"), design("Mossy Yoke Sweater")];
    const r = rollup({ designs, expenses: [], sales: [sale("mossy", 30, 3, 27)] });
    expect(r.designs[0].revenueTotal).toBe(0);
    expect(r.designs[1].revenueTotal).toBe(0);
    expect(r.totalRevenue).toBe(30);
  });

  it("does not attribute a sale to a malformed empty design name", () => {
    const r = rollup({ designs: [design("   ")], expenses: [], sales: [sale("Any Pattern", 30, 3, 27)] });
    expect(r.designs[0].revenueTotal).toBe(0);
    expect(r.totalRevenue).toBe(30);
  });

  it("subtracts refunds and drops quotes from sales counts", () => {
    const d = design("Cabled Beret", "published");
    const input = {
      designs: [d],
      expenses: [],
      sales: [
        sale("Cabled Beret", 25, 2, 23, "receipt"),
        sale("Cabled Beret", 25, 2, -23, "refund"),
        sale("Future Drop", 999, 0, 999, "quote"),
      ],
    };
    const r = rollup(input);
    expect(r.totalSales).toBe(1);
    expect(r.totalRevenue).toBe(0);
    expect(r.totalProfit).toBe(0);
    expect(r.designs[0].revenueTotal).toBe(0);
  });

  it("unmatched sales roll into totals without inflating any design", () => {
    const d = design("Cabled Beret");
    const r = rollup({ designs: [d], expenses: [], sales: [sale("Unknown Pattern", 50, 5, 45)] });
    expect(r.totalRevenue).toBe(50);
    expect(r.designs[0].revenueTotal).toBe(0);
  });

  it("builds the pipeline counts and monthly P&L", () => {
    const designs = [design("A", "concept"), design("B", "sampled"), design("C", "published"), design("D", "published")];
    const r = rollup({
      designs,
      expenses: [expense(designs[2].id, 30, "2026-07-02"), expense("gone", 5, "2026-07-02")],
      sales: [sale("C", 80, 8, 72, "receipt", "2026-07-12")],
    });
    expect(r.pipeline).toEqual({ concept: 1, "in-progress": 0, sampled: 1, published: 2, archived: 0 });
    expect(r.publishedCount).toBe(2);
    expect(r.monthly).toEqual([{ month: "2026-07", revenue: 80, cost: 35, profit: 45 }]);
  });

  it("two-decimals everything", () => {
    const r = rollup({ designs: [design("X")], expenses: [expense("x-id", 10.555)], sales: [sale("X", 1.111, 0.111, 1)] });
    expect(r.totalCost).toBe(10.56);
    expect(r.totalRevenue).toBe(1.11);
  });
});

describe("break-even", () => {
  it("rounds up copies needed", () => {
    expect(breakEven(40, 15)).toEqual({ copies: 3, reachable: true });
    expect(breakEven(0, 20)).toEqual({ copies: 0, reachable: true });
    // zero cost needs zero copies even at zero price — trivially reachable
    expect(breakEven(0, 0)).toEqual({ copies: 0, reachable: true });
    expect(breakEven(40, 0)).toEqual({ copies: 0, reachable: false });
    expect(breakEven(-10, 5)).toEqual({ copies: 0, reachable: true });
  });
});

describe("export", () => {
  const input = {
    designs: [design("Mossy Yoke", "published")],
    expenses: [expense("d-Mossy Yoke", 40, "2026-08-05")],
    sales: [sale("Mossy Yoke", 100, 10, 90)],
  };
  it("CSV escapes commas and quotes", () => {
    const csv = exportLedgerCsv({ ...input, expenses: [expense("d-Mossy Yoke", 40, "2026-08-05")] }, 'Studio "A,B"');
    // studio name lands in the header comment line raw (comment, not parsed)
    expect(csv).toContain("# Studio \"A,B\" — design ledger export");
    expect(csv).toContain("type,design,date,category");
    expect(csv).toContain("expense,Mossy Yoke,2026-08-05,Yarn / Materials,sample yarn,40,USD");
    expect(csv).toContain("sale,Mossy Yoke,2026-08-10,receipt,,100,");
  });

  it("summary lines hit every rollup stat", () => {
    const r = rollup(input);
    const s = exportLedgerSummary(r, "My Studio");
    expect(s).toContain("My Studio — Design Ledger Summary");
    expect(s).toContain("Published designs: 1");
    expect(s).toContain("Profit after fees & costs: 50.00");
    expect(s).toContain("Published · Mossy Yoke");
  });
});
