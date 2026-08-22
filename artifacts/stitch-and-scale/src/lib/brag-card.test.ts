import { describe, expect, it } from "vitest";
import {
  buildBragCaption,
  buildBragCardSvg,
  computeBragStats,
  isLocalBragCardLogo,
} from "./brag-card";
import type { MonthlyLedgerRow } from "./receipt-lab";
import { getBragCardCopy } from "./brag-copy";

const rows = (pairs: [string, number, number, number][]): MonthlyLedgerRow[] =>
  pairs.map(([month, sales, revenue, profit]) => ({
    month,
    salesCount: sales,
    revenue,
    refunds: 0,
    grossRevenue: revenue,
    feesPaid: 0,
    profit,
  }));

describe("computeBragStats", () => {
  it("aggregates revenue, sales, profit and finds best month", () => {
    const s = computeBragStats({
      studioName: "Woolworks",
      currency: "USD",
      ledger: rows([
        ["2026-04", 5, 50, 30],
        ["2026-05", 12, 120, 80],
        ["2026-06", 8, 80, 20],
      ]),
      publishedCount: 3,
      salesCount: 25,
    });
    expect(s.totalRevenue).toBe(250);
    expect(s.totalSales).toBe(25);
    expect(s.totalProfit).toBe(130);
    expect(s.bestMonth).toBe("2026-05");
    expect(s.bestMonthProfit).toBe(80);
    expect(s.revenuePerSale).toBe(10);
    expect(s.profitMonths).toBe(3);
    expect(s.profitRatio).toBe(100);
  });

  it("streak stops at the first non-profitable month from the newest", () => {
    const s = computeBragStats({
      studioName: "A",
      currency: "USD",
      ledger: rows([
        ["2026-01", 1, 10, 5],
        ["2026-02", 0, 0, -2],
        ["2026-03", 4, 40, 20],
        ["2026-04", 3, 30, 12],
      ]),
      publishedCount: 1,
      salesCount: 8,
    });
    expect(s.profitMonths).toBe(2);
    expect(s.profitRatio).toBe(75);
  });

  it("handles empty ledger without crashing", () => {
    const s = computeBragStats({ studioName: "A", currency: "USD", ledger: [], publishedCount: 0, salesCount: 0 });
    expect(s.totalRevenue).toBe(0);
    expect(s.revenuePerSale).toBe(0);
    expect(s.profitRatio).toBe(0);
    expect(s.bestMonth).toBeUndefined();
  });

  it("excludes malformed rows", () => {
    const s = computeBragStats({
      studioName: "A",
      currency: "USD",
      ledger: [null as unknown as MonthlyLedgerRow, { month: "2026-07", salesCount: 2, revenue: 20, refunds: 0, grossRevenue: 20, feesPaid: 0, profit: 10 }],
      publishedCount: 0,
      salesCount: 2,
    });
    expect(s.totalRevenue).toBe(20);
  });
});

describe("buildBragCaption", () => {
  it("income template shows revenue and average", () => {
    const c = buildBragCaption(
      { totalRevenue: 250, totalSales: 25, totalProfit: 130, publishedCount: 3, revenuePerSale: 10, bestMonth: "2026-05", bestMonthProfit: 80, profitMonths: 3, profitRatio: 100 },
      "USD",
      "income",
      "Woolworks",
    );
    expect(c.headline).toBe("$250 in pattern sales");
    expect(c.subline).toContain("25 sales");
    expect(c.subline).toContain("best month: $80.00");
    expect(c.caption).toContain("$250");
    expect(c.caption).toContain("Woolworks");
    expect(c.caption).toContain("$10");
  });

  it("streak template celebrates consecutive profitable months", () => {
    const c = buildBragCaption(
      { totalRevenue: 130, totalSales: 9, totalProfit: 40, publishedCount: 2, revenuePerSale: 14.44, bestMonth: undefined, bestMonthProfit: 0, profitMonths: 4, profitRatio: 80 },
      "EUR",
      "streak",
      "",
    );
    expect(c.headline).toContain("4 months, all profitable");
    expect(c.caption).toContain("4 months in a row finishing above zero");
    expect(c.caption).not.toMatch(/:{2}/);
  });

  it("uses the selected locale for generated captions", () => {
    const stats = { totalRevenue: 250, totalSales: 25, totalProfit: 130, publishedCount: 3, revenuePerSale: 10, bestMonth: "2026-05", bestMonthProfit: 80, profitMonths: 3, profitRatio: 100 };
    const c = buildBragCaption(stats, "EUR", "income", "Wollwerk", getBragCardCopy("de"));
    expect(c.headline).toContain("Musterverkäufen");
    expect(c.subline).toContain("Verkäufe");
    expect(c.caption).toContain("Wollwerk");
    expect(c.caption).not.toContain("pattern sales");
  });

  it("published template leads with the portfolio", () => {
    const c = buildBragCaption(
      { totalRevenue: 500, totalSales: 30, totalProfit: 300, publishedCount: 6, revenuePerSale: 16.67, bestMonth: undefined, bestMonthProfit: 0, profitMonths: 0, profitRatio: 0 },
      "GBP",
      "published",
      "Knitfolk",
    );
    expect(c.headline).toBe("6 patterns published");
    expect(c.caption).toContain("6 published patterns");
  });
});

describe("buildBragCardSvg", () => {
  it("emits 1080x1080 SVG with escaped studio name and big number", () => {
    const svg = buildBragCardSvg(
      { totalRevenue: 250, totalSales: 25, totalProfit: 130, publishedCount: 3, revenuePerSale: 10, bestMonth: undefined, bestMonthProfit: 0, profitMonths: 3, profitRatio: 100 },
      "USD",
      "income",
      "Wool & Yarn <Studio>",
      "#d87093",
    );
    expect(svg).toContain('width="1080" height="1080"');
    expect(svg).toContain("250");
    expect(svg).toContain("$250 in pattern sales");
    expect(svg).toContain("Wool &amp; Yarn &lt;Studio&gt;");
    expect(svg).toContain("STITCH &amp; SCALE");
  });

  it("renders all six designer styles with the accent applied", () => {
    const s = { totalRevenue: 250, totalSales: 25, totalProfit: 130, publishedCount: 3, revenuePerSale: 10, bestMonth: undefined, bestMonthProfit: 0, profitMonths: 3, profitRatio: 100 };
    for (const st of ["navy", "editorial", "swatch", "selvedge", "swiss", "cameo"] as const) {
      const svg = buildBragCardSvg(s, "USD", "income", "Studio", "#d87093", st);
      expect(svg).toContain('width="1080" height="1080"');
      expect(svg).toContain("#d87093");
    }
    expect(() => buildBragCardSvg(s, "USD", "income", "Studio", "#d87093")).not.toThrow();
  });

  it("emits localized SVG text when a locale copy object is supplied", () => {
    const svg = buildBragCardSvg(
      { totalRevenue: 130, totalSales: 9, totalProfit: 40, publishedCount: 2, revenuePerSale: 14.44, bestMonth: undefined, bestMonthProfit: 0, profitMonths: 4, profitRatio: 80 },
      "EUR",
      "sales",
      "Wollwerk",
      "#d87093",
      "navy",
      getBragCardCopy("de"),
    );
    expect(svg).toContain("Verkäufe");
    expect(svg).not.toContain(">sales<");
  });

  it("streak template shows the month count as the big number", () => {
    const svg = buildBragCardSvg(
      { totalRevenue: 130, totalSales: 9, totalProfit: 40, publishedCount: 2, revenuePerSale: 14.44, bestMonth: undefined, bestMonthProfit: 0, profitMonths: 4, profitRatio: 80 },
      "USD",
      "streak",
      "X",
      "#d87093",
    );
    expect(svg).toContain(">4 profitable months<");
  });

  it("accepts only bounded local image data URIs for logos", () => {
    expect(isLocalBragCardLogo("data:image/svg+xml;base64,PHN2Zy8+")).toBe(true);
    expect(isLocalBragCardLogo("https://example.com/logo.png")).toBe(false);
    expect(isLocalBragCardLogo(`data:image/png;base64,${"a".repeat(200_000)}`)).toBe(false);
  });

  it("strips remote and oversized logos from the final SVG artifact", () => {
    const base = {
      totalRevenue: 130,
      totalSales: 9,
      totalProfit: 40,
      publishedCount: 2,
      revenuePerSale: 14.44,
      bestMonth: undefined,
      bestMonthProfit: 0,
      profitMonths: 4,
      profitRatio: 80,
    };
    const remote = buildBragCardSvg(base, "USD", "income", "North Loop", "#d87093", "editorial", undefined, { customLogo: "https://example.com/logo.png" });
    const oversized = buildBragCardSvg(base, "USD", "income", "North Loop", "#d87093", "editorial", undefined, { customLogo: `data:image/png;base64,${"a".repeat(200_000)}` });
    expect(remote).not.toContain("<image ");
    expect(oversized).not.toContain("<image ");
  });

  it("applies configured studio branding to the final SVG artifact", () => {
    const svg = buildBragCardSvg(
      { totalRevenue: 130, totalSales: 9, totalProfit: 40, publishedCount: 2, revenuePerSale: 14.44, bestMonth: undefined, bestMonthProfit: 0, profitMonths: 4, profitRatio: 80 },
      "USD",
      "income",
      "North <Loop>",
      "#d87093",
      "editorial",
      undefined,
      {
        studioName: "North <Loop>",
        customLogo: "data:image/svg+xml;base64,PHN2Zy8+",
        socialHandle: "@northloop",
        copyrightNotice: "© 2026 North Loop",
      },
    );
    expect(svg).toContain("North &lt;Loop&gt;");
    expect(svg).toContain('href="data:image/svg+xml;base64,PHN2Zy8+"');
    expect(svg).toContain("@northloop · © 2026 North Loop");
    expect(svg).not.toContain("STITCH &amp; SCALE");
  });
});
