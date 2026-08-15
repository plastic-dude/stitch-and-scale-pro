import { describe, expect, it } from "vitest";
import {
  analyzeReceipt,
  computeMonthlyLedgerRows,
  DEFAULT_BRAND,
  DEFAULT_SALE,
  type ReceiptLabInput,
} from "./receipt-lab";

const sale = (month: string, gross: number, feePct = 0): typeof DEFAULT_SALE => ({
  ...DEFAULT_SALE,
  id: "",
  date: month + "-15",
  items: [{ name: "Pattern", qty: 1, unitPrice: gross / 1.0, materials: 0 }],
  fees: { ...DEFAULT_SALE.fees, platformCommissionPct: feePct, processingPct: 0, processingFlat: 0, taxPct: 0, shippingCharged: 0, shippingCost: 0 },
  note: "",
  depositReceived: 0,
  createdAt: month + "-15T00:00:00Z",
});

describe("computeMonthlyLedgerRows consistency", () => {
  it("standalone helper matches analyzeReceipt's ledger rows for a mixed ledger", () => {
    const ledger = [
      { ...DEFAULT_SALE, id: "a", date: "2026-03-02", items: [{ name: "Sweater", qty: 1, unitPrice: 100, materials: 0 }], fees: { ...DEFAULT_SALE.fees, platformCommissionPct: 0.05 } },
      { ...DEFAULT_SALE, id: "b", date: "2026-03-21", kind: "receipt", items: [{ name: "Pattern", qty: 2, unitPrice: 25, materials: 0 }], fees: DEFAULT_SALE.fees },
      { ...DEFAULT_SALE, id: "c", date: "2026-04-10", kind: "refund", items: [{ name: "Pattern", qty: 1, unitPrice: 40, materials: 0 }], fees: DEFAULT_SALE.fees },
    ];
    const standalone = computeMonthlyLedgerRows(ledger);
    const input: ReceiptLabInput = { brand: DEFAULT_BRAND, draft: DEFAULT_SALE, ledger, materialsCost: 0 };
    const viaAnalyze = analyzeReceipt(input).ledger;
    const byMonth = (rows: typeof standalone) => new Map(rows.map((r) => [r.month, r]));
    const m1 = byMonth(standalone);
    const m2 = byMonth(viaAnalyze);
    for (const [month, row] of m1) {
      expect(m2.get(month)).toEqual(row);
    }
    expect(m1.size).toBe(m2.size);
  });

  it("skips quotes and sales without a date", () => {
    const rows = computeMonthlyLedgerRows([
      { ...DEFAULT_SALE, kind: "quote", date: "2026-05-01" },
      { ...DEFAULT_SALE, kind: "receipt", date: "", items: [{ name: "x", qty: 1, unitPrice: 10, materials: 0 }] },
      { ...DEFAULT_SALE, kind: "receipt", date: "2026-06-01", items: [{ name: "x", qty: 1, unitPrice: 10, materials: 0 }] },
    ]);
    expect(rows.length).toBe(1);
    expect(rows[0].month).toBe("2026-06");
  });
});
