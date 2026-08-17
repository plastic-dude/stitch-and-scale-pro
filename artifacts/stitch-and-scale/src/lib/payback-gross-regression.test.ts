import { describe, expect, it } from "vitest";
import {
  resolveStoredReceiptGross,
  resolveStoredReceiptFees,
} from "@/components/payback-lab-card";
import type { ReceiptStoredRow } from "@/components/payback-lab-card";

/**
 * Regression for QA issue #57 / ledger S273.
 * Receipt Lab's actual SavedSale rows have no grossTotal field, so before
 * this fix Payback read every UI-saved sale as $0 gross. With real fee
 * deductions (CHK-105) that pushed net negative. Gross must be derived
 * from items the same way the canonical analyzer does.
 */

function saleRow(overrides: Partial<ReceiptStoredRow> = {}): ReceiptStoredRow {
  return {
    id: `s-${Date.now()}-${Math.random()}`,
    kind: "receipt",
    date: "2026-08-16",
    items: [{ name: "Sweater", qty: 1, unitPrice: 45 }],
    fees: {
      platformCommissionPct: 0.065,
      processingPct: 0.029,
      processingFlat: 0.3,
      taxPct: 0,
      shippingCharged: 0,
      shippingCost: 0,
    },
    ...overrides,
  };
}

describe("resolveStoredReceiptGross", () => {
  it("derives gross from items when the row carries no grossTotal (SavedSale shape)", () => {
    const row = saleRow();
    // Analyze the same shape canonically for the oracle.
    expect(resolveStoredReceiptGross(row)).toBe(45);
  });

  it("honors explicit grossTotal when present (legacy output-shaped rows)", () => {
    const row = saleRow({ grossTotal: 52.5 });
    expect(resolveStoredReceiptGross(row)).toBe(52.5);
  });

  it("includes tax and shipping charged in the derived gross", () => {
    const row = saleRow({
      items: [{ name: "Sweater", qty: 2, unitPrice: 45 }],
      fees: {
        platformCommissionPct: 0,
        processingPct: 0,
        processingFlat: 0,
        taxPct: 0.08,
        shippingCharged: 7.5,
      },
    });
    // 90 + 7.20 tax + 7.50 shipping = 104.70
    expect(resolveStoredReceiptGross(row)).toBe(104.7);
  });
});

describe("QA #57 regression — Payback net must be positive for real UI-saved sales", () => {
  it("two $45 sales → net +$78.22 (reviewer repro), gross no longer $0", () => {
    const rows = [saleRow(), saleRow()];
    const totalGross = rows.reduce((s, r) => s + resolveStoredReceiptGross(r), 0);
    const totalFees = rows.reduce((s, r) => s + resolveStoredReceiptFees(r), 0);
    expect(totalGross).toBe(90);
    // Per sale: 6.5% platform (2.93) + 2.9% processing + $0.30 flat (1.61) = 4.54
    expect(totalFees).toBe(9.08);
    expect(Math.round((totalGross - totalFees) * 100) / 100).toBe(80.92);
  });

  it("a refund derives gross the same way as a receipt (sign applied by caller)", () => {
    const row = saleRow({ kind: "refund" });
    expect(resolveStoredReceiptGross(row)).toBe(45);
  });
});
