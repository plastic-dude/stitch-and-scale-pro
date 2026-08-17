import { describe, expect, it } from "vitest";
import { resolveStoredReceiptFees, type ReceiptStoredRow } from "@/components/payback-lab-card";

describe("Payback receipt-row fee normalization", () => {
  it("calculates fees from Receipt Lab input-shaped fields", () => {
    const row: ReceiptStoredRow = {
      kind: "receipt",
      patternName: "Mossy Yoke Sweater",
      items: [{ name: "Pattern", qty: 1, unitPrice: 45 }],
      fees: {
        platformCommissionPct: 0.065,
        processingPct: 0.029,
        processingFlat: 0.3,
        taxPct: 0,
        shippingCharged: 0,
        shippingCost: 0,
      },
    };

    expect(resolveStoredReceiptFees(row)).toBe(4.54);
  });

  it("continues reading legacy resolved fee fields", () => {
    const row: ReceiptStoredRow = {
      kind: "receipt",
      fees: { platformFee: 3, processingFee: 1.5, taxAmount: 0.5, shippingCost: 2 },
    };

    expect(resolveStoredReceiptFees(row)).toBe(7);
  });
});

export {};

