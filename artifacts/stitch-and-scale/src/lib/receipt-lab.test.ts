import { describe, it, expect } from "vitest";
import {
  analyzeReceipt,
  analyzeReceiptFees,
  fmtMoney,
  nextDocNumber,
  DEFAULT_BRAND,
  DEFAULT_FEES,
  DEFAULT_SALE,
  type SavedSale,
} from "./receipt-lab";

const brand = { ...DEFAULT_BRAND, businessName: "Test Knits", currency: "USD" };

let saleCounter = 0;
function makeSale(patch: Partial<SavedSale> = {}): SavedSale {
  saleCounter += 1;
  return {
    ...DEFAULT_SALE,
    id: patch.id ?? "sale-" + saleCounter,
    ...patch,
  };
}

describe("receipt-lab engine", () => {
  it("fmtMoney renders all supported currency symbols (QA #49 parity)", () => {
    expect(fmtMoney(12.5, "USD")).toBe("$12.50");
    expect(fmtMoney(9.4, "GBP")).toBe("£9.40");
    expect(fmtMoney(20, "EUR")).toBe("€20.00");
    expect(fmtMoney(20, "CHF")).toBe("CHF 20.00");
    expect(fmtMoney(20, "BRL")).toBe("R$ 20.00");
    expect(fmtMoney(20, "INR")).toBe("₹20.00");
    expect(fmtMoney(20, "JPY")).toBe("¥20.00");
    expect(fmtMoney(20, "SEK")).toBe("20.00 kr");
    expect(fmtMoney(20, "NOK")).toBe("20.00 kr");
    expect(fmtMoney(20, "DKK")).toBe("20.00 kr");
    expect(fmtMoney(20, "ISK")).toBe("20.00 kr");
  });

  it("fmtMoney drops decimals at >=1000 and adds thousands separators", () => {
    expect(fmtMoney(1250, "USD")).toBe("$1,250");
    expect(fmtMoney(1250000, "USD")).toBe("$1,250,000");
  });

  it("a basic receipt computes subtotal, fees, and profit", () => {
    const sale = makeSale({
      items: [{ name: "Mossy Yoke Sweater", qty: 1, unitPrice: 120 }],
      fees: { ...DEFAULT_FEES, platformCommissionPct: 0.095, processingPct: 0.029, processingFlat: 0.3 },
      kind: "receipt",
      docNumber: "REC-001",
    });
    const r = analyzeReceipt({ brand, draft: sale, ledger: [], materialsCost: 34 });
    expect(r.fees.subtotal).toBe(120);
    expect(r.fees.grossTotal).toBe(120);
    expect(r.fees.platformFee).toBe(11.4);
    expect(r.fees.processingFee).toBeCloseTo(3.78, 1);
    expect(r.document.profit).toBeCloseTo(120 - 11.4 - 3.78 - 34, 1);
    expect(r.totals.salesCount).toBe(1);
  });

  it("tax and shipping flow through to the gross total", () => {
    const sale = makeSale({
      items: [{ name: "Beret", qty: 2, unitPrice: 25 }],
      fees: { ...DEFAULT_FEES, taxPct: 0.08, shippingCharged: 6, shippingCost: 4 },
    });
    const r = analyzeReceipt({ brand, draft: sale, ledger: [], materialsCost: 10 });
    expect(r.fees.subtotal).toBe(50);
    expect(r.fees.taxAmount).toBe(4);
    expect(r.fees.grossTotal).toBe(60);
    expect(r.document.total).toBe(60);
  });

  it("quotes show deposit and balance due, not revenue", () => {
    const sale = makeSale({
      kind: "quote",
      docNumber: "QUO-002",
      depositReceived: 0,
      items: [{ name: "Custom Cable Cardi — Size L", qty: 1, unitPrice: 200 }],
    });
    const r = analyzeReceipt({ brand, draft: sale, ledger: [], materialsCost: 0 });
    expect(r.document.balanceDue).toBe(200);
    expect(r.totals.salesCount).toBe(0);
    expect(r.totals.revenue).toBe(0);
    const quoteLine = r.document.lines.find((l) => l.label === "Deposit due");
    expect(quoteLine?.value).toBe("$100");
  });

  it("refunds net out of revenue and profit", () => {
    const receipt = makeSale({
      kind: "receipt",
      docNumber: "REC-001",
      items: [{ name: "Pattern", qty: 1, unitPrice: 40 }],
      date: "2026-08-10",
    });
    const refund = makeSale({
      kind: "refund",
      docNumber: "REF-001",
      items: [{ name: "Pattern", qty: 1, unitPrice: 40 }],
      date: "2026-08-15",
    });
    const r = analyzeReceipt({ brand, draft: receipt, ledger: [refund], materialsCost: 0 });
    expect(r.totals.revenue).toBe(40);
    expect(r.totals.salesCount).toBe(1);
    expect(r.totals.refunds).toBe(40);
    // refund nets out of profit for the month
    expect(r.totals.profit).toBe(0);
    // ledger merges by month and nets refund against receipt revenue
    expect(r.ledger.length).toBe(1);
    expect(r.ledger[0].revenue).toBe(0);
    expect(r.ledger[0].profit).toBe(0);
  });

  it("nextDocNumber sequences per kind", () => {
    const ledger: SavedSale[] = [
      makeSale({ kind: "receipt", docNumber: "REC-003" }),
      makeSale({ kind: "quote", docNumber: "QUO-002" }),
      makeSale({ kind: "receipt", docNumber: "REC-001" }),
    ];
    expect(nextDocNumber(ledger, "receipt")).toBe("REC-004");
    expect(nextDocNumber(ledger, "quote")).toBe("QUO-003");
    expect(nextDocNumber(ledger, "refund")).toBe("REF-001");
  });

  it("analyzeReceiptFees clamps hostile inputs", () => {
    const sale = makeSale({
      items: [{ name: "X", qty: -5, unitPrice: 100 }],
      fees: { ...DEFAULT_FEES, platformCommissionPct: 2 },
    });
    const r = analyzeReceiptFees(sale);
    expect(r.subtotal).toBe(0);
    expect(r.platformFee).toBe(0);
  });

  it("never leaks non-finite or negative financial values from hostile input", () => {
    const sale = makeSale({
      items: [{ name: "X", qty: Number.POSITIVE_INFINITY, unitPrice: Number.NaN }],
      fees: {
        platformCommissionPct: Number.POSITIVE_INFINITY,
        processingPct: -0.5,
        processingFlat: Number.NaN,
        taxPct: -1,
        shippingCharged: Number.NEGATIVE_INFINITY,
        shippingCost: -25,
      },
    });
    const r = analyzeReceiptFees(sale);
    expect(r).toMatchObject({
      subtotal: 0,
      taxAmount: 0,
      shippingCharged: 0,
      grossTotal: 0,
      platformFee: 0,
      processingFee: 0,
      shippingCost: 0,
      netAfterFees: 0,
    });
    expect(Object.values(r).every(Number.isFinite)).toBe(true);
  });

  it("doc lines include profit with materials note when cost set", () => {
    const sale = makeSale({
      items: [{ name: "Cardigan", qty: 1, unitPrice: 150 }],
      kind: "receipt",
      docNumber: "REC-001",
    });
    const r = analyzeReceipt({ brand, draft: sale, ledger: [], materialsCost: 42 });
    const profitLine = r.document.lines.find((l) => l.label === "Profit on this sale");
    expect(profitLine?.value).toContain("108");
    expect(profitLine?.value).toContain("42");
  });
});
