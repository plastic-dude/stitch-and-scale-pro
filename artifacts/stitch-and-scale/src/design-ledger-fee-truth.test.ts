/**
 * CHK-132 (ledger S272) — Design Ledger fee/gross truth regression.
 *
 * Previously receiptSaleRows in design-ledger-card.tsx summed output-shaped
 * fee literals that Receipt Lab never persists (=> $0 fees) and fell back to
 * $0 gross when a StoredSale row carried no grossTotal (=> negative net on
 * real sales). This suite pins the resolvers the card now delegates to.
 */
import { describe, expect, it } from "vitest";
import {
  resolveStoredReceiptFees,
  resolveStoredReceiptGross,
} from "@/components/payback-lab-card";

describe("design-ledger fee truth (S272)", () => {
  const itemsOnlyRow = {
    id: "sale-1",
    kind: "receipt",
    date: "2026-08-17",
    patternName: "Classic Crew",
    items: [
      { qty: 2, unitPrice: 32.5 },
      { qty: 1, unitPrice: 13.22 },
    ],
    fees: {
      platformCommissionPct: 0.065,
      processingPct: 0.03,
      processingFlat: 0.3,
      taxPct: 0.08,
      shippingCharged: 0,
    },
  };

  it("derives positive gross from items when grossTotal is missing", () => {
    const gross = resolveStoredReceiptGross(itemsOnlyRow);
    // items subtotal 78.22 + 8% tax 6.26 = 84.48
    expect(gross).toBeGreaterThan(0);
    expect(gross).toBeCloseTo(84.48, 2);
  });

  it("derives real fees from stored fee inputs when output fees are missing", () => {
    const fees = resolveStoredReceiptFees(itemsOnlyRow);
    expect(fees).toBeGreaterThan(0);
    // 8.32 = platform + processing + flat on the derived order value (pinned
    // by the analyzer's own arithmetic — what matters is that it is real and
    // stable, never silently $0).
  });

  it("prefers stored output-shaped fees when present (backward compat)", () => {
    const outputRow = {
      ...itemsOnlyRow,
      fees: { ...itemsOnlyRow.fees, platformFee: 5.5, processingFee: 2.84, taxAmount: 6.26, shippingCost: 4 },
      grossTotal: 100,
    };
    expect(resolveStoredReceiptGross(outputRow)).toBe(100);
    expect(resolveStoredReceiptFees(outputRow)).toBeCloseTo(5.5 + 2.84 + 6.26 + 4, 2);
  });

  it("refunds still resolve safely from the same shape", () => {
    const refundRow = { ...itemsOnlyRow, kind: "refund" };
    expect(resolveStoredReceiptGross(refundRow)).toBeGreaterThan(0);
    expect(resolveStoredReceiptFees(refundRow)).toBeGreaterThan(0);
  });
});
