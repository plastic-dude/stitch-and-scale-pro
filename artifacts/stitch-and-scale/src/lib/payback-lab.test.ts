import { describe, expect, it } from "vitest";
import {
  computePayback,
  isReachable,
  matchDesignName,
  whatIfRecoup,
  type PaybackInput,
} from "./payback-lab";

const mkSale = (patternName: string, gross: number, fees: number, date: string, kind: "receipt" | "refund" = "receipt"): Parameters<typeof computePayback>[0]["sales"][number] => ({
  kind,
  date,
  patternName,
  qty: 1,
  gross,
  fees,
});

const baseInput: PaybackInput = {
  designs: [
    { id: "d1", name: "Mossy Yoke Sweater", status: "published", hours: 55, createdAt: "2026-01-01" },
    { id: "d2", name: "Birch Mittens", status: "published", hours: 12, createdAt: "2026-02-01" },
    { id: "d3", name: "Draft Vest", status: "concept", hours: 4, createdAt: "2026-03-01" },
  ],
  expenses: [
    { designId: "d1", amount: 40, currency: "USD", date: "2026-01-05" }, // tech edit
    { designId: "d1", amount: 35, currency: "USD", date: "2026-01-10" }, // test knit
    { designId: "d1", amount: 25, currency: "USD", date: "2026-01-12" }, // yarn
    { designId: "d2", amount: 15, currency: "USD", date: "2026-02-05" }, // yarn
    { designId: "", amount: 30, currency: "USD", date: "2026-03-01" }, // overhead (website/hosting)
  ],
  sales: [
    mkSale("Mossy Yoke Sweater", 65, 6.5, "2026-04-02"),
    mkSale("Mossy Yoke Sweater", 65, 6.5, "2026-05-11"),
    mkSale("birch mittens", 12, 1.2, "2026-06-03"),
    mkSale("Mossy Yoke Sweater", 65, 6.5, "2026-07-20"),
  ],
  hourlyRate: 12,
};

describe("matchDesignName", () => {
  it("matches case-insensitive substring both ways", () => {
    expect(matchDesignName("Mossy Yoke Sweater", "mossy yoke sweater")).toBe(true);
    expect(matchDesignName("Mossy Yoke Sweater", "MOSSY")).toBe(true);
    expect(matchDesignName("Mossy Yoke Sweater", "Cardigan")).toBe(false);
  });

  it("rejects empty names", () => {
    expect(matchDesignName("", "Mossy")).toBe(false);
    expect(matchDesignName("Mossy", "")).toBe(false);
  });
});

describe("computePayback", () => {
  it("computes investment with direct costs + overhead share + time cost", () => {
    const r = computePayback(baseInput, "2026-08-01");
    const mossy = r.designs.find((d) => d.design.id === "d1")!;
    // direct 100 + overhead 30/2 (2 published) + 55h × 12 = 100 + 15 + 660
    expect(mossy.directCost).toBe(100);
    expect(mossy.overheadShare).toBe(15);
    expect(mossy.timeCost).toBe(660);
    expect(mossy.investment).toBe(775);
  });

  it("does not allocate overhead to unpublished designs", () => {
    const r = computePayback(baseInput, "2026-08-01");
    const draft = r.designs.find((d) => d.design.id === "d3")!;
    expect(draft.overheadShare).toBe(0);
    expect(draft.investment).toBe(48); // 4h × 12
  });

  it("counts copies and net revenue per design, attributes first match", () => {
    const r = computePayback(baseInput, "2026-08-01");
    const mossy = r.designs.find((d) => d.design.id === "d1")!;
    expect(mossy.copiesSold).toBe(3);
    expect(mossy.revenueGross).toBe(195);
    expect(mossy.revenueNet).toBe(175.5);
    expect(mossy.avgNetPerSale).toBe(58.5);
  });

  it("nets refunds against sales", () => {
    const withRefund: PaybackInput = {
      ...baseInput,
      sales: [...baseInput.sales, mkSale("Mossy Yoke Sweater", 65, 0, "2026-07-25", "refund")],
    };
    const r = computePayback(withRefund, "2026-08-01");
    const mossy = r.designs.find((d) => d.design.id === "d1")!;
    // 3 receipts − 1 refund → 2 copies; net = 2 × 58.5 + (−65) refund net (fees 0)
    expect(mossy.copiesSold).toBe(2);
    expect(mossy.revenueNet).toBe(110.5);
  });

  it("recoupCopies = ceil(investment / avgNetPerSale)", () => {
    const r = computePayback(baseInput, "2026-08-01");
    const mossy = r.designs.find((d) => d.design.id === "d1")!;
    expect(mossy.recoupCopies).toBe(Math.ceil(775 / 58.5)); // 14
    expect(mossy.costCopies).toBe(Math.ceil(100 / 58.5)); // 2
  });

  it("reports Infinity recoup when average net is non-positive", () => {
    const noSales: PaybackInput = { ...baseInput, sales: [] };
    const r = computePayback(noSales, "2026-08-01");
    const mossy = r.designs.find((d) => d.design.id === "d1")!;
    expect(mossy.recoupCopies).toBe(Infinity);
    expect(mossy.paidBack).toBe(false);
    expect(mossy.deficit).toBe(775);
  });

  it("marks a design paid back when copies sold reach the recoup point", () => {
    const rich: PaybackInput = {
      ...baseInput,
      sales: Array.from({ length: 15 }, (_, i) =>
        mkSale("Mossy Yoke Sweater", 65, 6.5, "2026-0" + (Math.min(i, 7) + 2) + "-0" + ((i % 9) + 1)),
      ),
    };
    const r = computePayback(rich, "2026-09-01");
    const mossy = r.designs.find((d) => d.design.id === "d1")!;
    expect(mossy.paidBack).toBe(true);
    expect(mossy.surplus).toBeGreaterThan(0);
    expect(r.paidBackCount).toBe(1);
  });

  it("falls back to floor hourly rate when rate is zero", () => {
    const r = computePayback({ ...baseInput, hourlyRate: 0 }, "2026-08-01");
    const mossy = r.designs.find((d) => d.design.id === "d1")!;
    expect(mossy.timeCost).toBe(55 * 12);
  });

  it("tracks months since last sale for bleed detection", () => {
    const r = computePayback(baseInput, "2026-12-01");
    const mittens = r.designs.find((d) => d.design.id === "d2")!;
    expect(mittens.lastSaleDate).toBe("2026-06-03");
    expect(mittens.monthsSinceLastSale).toBe(6);
  });

  it("derives currency from the first recorded expense", () => {
    const eurOnly = computePayback(
      { ...baseInput, expenses: [{ designId: "d2", amount: 5, currency: "EUR", date: "2026-01-01" }] },
      "2026-08-01",
    );
    expect(eurOnly.currency).toBe("EUR");
    // EUR prepended before the USD rows: first recorded wins.
    const withBoth = computePayback(
      { ...baseInput, expenses: [{ designId: "d2", amount: 5, currency: "EUR", date: "2026-01-01" }, ...baseInput.expenses] },
      "2026-08-01",
    );
    expect(withBoth.currency).toBe("EUR");
  });
});

describe("whatIfRecoup", () => {
  it("shows fewer recoup copies at a higher net per sale", () => {
    const w = whatIfRecoup(775, 58.5, 58.5 * 1.1);
    expect(isReachable(w.current)).toBe(true);
    expect(w.projected).toBeLessThan(w.current);
  });

  it("returns Infinity when new net is non-positive", () => {
    const w = whatIfRecoup(775, 58.5, -5);
    expect(w.projected).toBe(Infinity);
  });
});
