/**
 * Brag Card engine (CHK-091).
 *
 * A shareable "brag moment" generator. The founder asked for exactly this:
 * a card a designer can build from the work they did in the tool — sales,
 * income, patterns published — and post to their socials. It doubles as a
 * growth engine: every card shared is an unbranded, honest "this tool
 * works" signal that reaches other designers where they already hang out
 * (WhatsApp, Instagram, X, Mastodon, Bluesky, Pinterest).
 *
 * Data flow (local-first, zero network):
 *   - Sales stats come from the Receipt Lab's stored ledger
 *     (`stitch-and-scale-receipt-${projectId}` in localStorage / the
 *     projectStorage seam). The Receipt Lab stays the single source of
 *     truth for sales.
 *   - Design stats come from the Design Ledger's stored designs.
 *   - The card is rendered as an SVG → PNG via canvas on the client.
 *     Nothing leaves the browser.
 *
 * Copy rules (brand-voice-brief.md Rule 1): captions never claim the
 * founder knits. Claims are always attributable to the DESIGNER's own
 * numbers — the card celebrates them, not us.
 */
import { fmtMoney } from "./receipt-lab";
import type { MonthlyLedgerRow } from "./receipt-lab";

export interface BragCardInput {
  /** Studio / brand name shown on the card. */
  studioName: string;
  /** Currency code for money formatting (receipt-lab fmtMoney rules). */
  currency: string;
  /** Receipt Lab monthly ledger rows (single source of truth for sales). */
  ledger: MonthlyLedgerRow[];
  /** Number of published designs (from the Design Ledger pipeline). */
  publishedCount: number;
  /** Lifetime sales count for context metrics. */
  salesCount: number;
}

export interface BragStats {
  totalRevenue: number;
  totalSales: number;
  totalProfit: number;
  publishedCount: number;
  /** average revenue per sale (0 when no sales) */
  revenuePerSale: number;
  /** best month by profit (YYYY-MM) — undefined when ledger empty */
  bestMonth?: string;
  bestMonthProfit: number;
  /** streak of consecutive months with profit (from newest row backwards) */
  profitMonths: number;
  /** months with profit / total months in ledger (0 when empty) */
  profitRatio: number;
}

export type BragCardTemplate =
  | "income" // total revenue highlight
  | "sales" // sales count highlight
  | "streak" // profit streak highlight
  | "published"; // designs published highlight

export function computeBragStats(input: BragCardInput): BragStats {
  const ledger = (input.ledger ?? []).filter((r) => r && typeof r.month === "string");
  let totalRevenue = 0;
  let totalSales = 0;
  let totalProfit = 0;
  let bestMonth: string | undefined;
  let bestMonthProfit = 0;
  for (const row of ledger) {
    totalRevenue += row.revenue ?? 0;
    totalSales += row.salesCount ?? 0;
    totalProfit += row.profit ?? 0;
    const p = row.profit ?? 0;
    if (p > bestMonthProfit) {
      bestMonthProfit = p;
      bestMonth = row.month;
    }
  }
  const sorted = [...ledger].sort((a, b) => (a.month < b.month ? -1 : a.month > b.month ? 1 : 0));
  let profitMonths = 0;
  for (let i = sorted.length - 1; i >= 0; i -= 1) {
    if ((sorted[i].profit ?? 0) > 0) profitMonths += 1;
    else break;
  }
  const months = sorted.length;
  const profitRatio = months > 0 ? Math.round((ledger.filter((r) => (r.profit ?? 0) > 0).length / months) * 100) : 0;
  return {
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalSales,
    totalProfit: Math.round(totalProfit * 100) / 100,
    publishedCount: input.publishedCount ?? 0,
    revenuePerSale: totalSales > 0 ? Math.round((totalRevenue / totalSales) * 100) / 100 : 0,
    bestMonth,
    bestMonthProfit: Math.round(bestMonthProfit * 100) / 100,
    profitMonths,
    profitRatio,
  };
}

export interface BragCaption {
  /** Short headline for the card itself. */
  headline: string;
  /** One-line subline under the headline. */
  subline: string;
  /** Social caption text (for copy-to-socials). */
  caption: string;
}

/**
 * Copy lines per template. Written to sound like a real indie knitwear
 * designer posting — never generic SaaS copy, never claiming the founder
 * knits (Rule 1). All numbers come straight from the designer's ledger.
 */
export function buildBragCaption(stats: BragStats, currency: string, template: BragCardTemplate, studioName: string): BragCaption {
  const rev = fmtMoney(stats.totalRevenue, currency);
  const profit = fmtMoney(stats.totalProfit, currency);
  const perSale = fmtMoney(stats.revenuePerSale, currency);
  const best = stats.bestMonth ? `Best month: ${fmtMoney(stats.bestMonthProfit, currency)}` : "";

  switch (template) {
    case "income":
      return {
        headline: `${rev} in pattern sales`,
        subline: `${stats.totalSales} sales${best ? ` · ${best}` : ""}`,
        caption: `${studioName ? studioName + ": " : ""}${rev} earned from my own patterns — ${stats.totalSales} sales at an average of ${perSale} each. Every number here came out of my ledger, not a guess. #knitwearnetwork #indiedesigner #handmadewithnumbers`,
      };
    case "sales":
      return {
        headline: `${stats.totalSales} sales, one studio`,
        subline: `${perSale} average per sale${best ? ` · ${best}` : ""}`,
        caption: `${studioName ? studioName + ": " : ""}${stats.totalSales} sales of patterns I designed — ${perSale} on average, ${rev} total. Small studio, honest books. #knitwear #indiedesigner #makersmove`,
      };
    case "streak":
      return {
        headline: `${stats.profitMonths} profitable months${stats.profitMonths === stats.profitMonths && stats.profitRatio > 0 && stats.profitMonths < (stats.profitMonths + (100 - stats.profitRatio)) ? "" : ""}`,
        subline: `on record · ${rev} total`,
        caption: `${studioName ? studioName + ": " : ""}${stats.profitMonths} months in a row finishing above zero. ${rev} on the books and still designing. This is what a real design studio looks like. #knitwearnetwork #profitablemaker`,
      };
    case "published":
      return {
        headline: `${stats.publishedCount} patterns published`,
        subline: `${rev} earned · ${stats.totalSales} sales`,
        caption: `${studioName ? studioName + ": " : ""}${stats.publishedCount} published patterns, ${rev} earned, ${stats.totalSales} sales. The portfolio is the résumé. #knitwear #indiedesigner #patternpublisher`,
      };
  }
}

/**
 * The visual card: returns SVG markup (1080x1080, social-ready).
 * Render client-side, then rasterize to PNG with canvas.
 */
export function buildBragCardSvg(stats: BragStats, currency: string, template: BragCardTemplate, studioName: string, accent: string): string {
  const c = buildBragCaption(stats, currency, template, studioName);
  const big = template === "income"
    ? fmtMoney(stats.totalRevenue, currency)
    : template === "sales"
      ? String(stats.totalSales)
      : template === "published"
        ? String(stats.publishedCount)
        : String(stats.profitMonths);
  const unit = template === "income" ? "" : template === "sales" ? "sales" : template === "published" ? "published" : "months";
  const line = unit ? `${big} ${unit}` : `${big}`;

  const monthNote = stats.bestMonth
    ? `best month ${fmtMoney(stats.bestMonthProfit, currency)}`
    : "";
  const footer = [
    stats.publishedCount > 0 ? `${stats.publishedCount} published design${stats.publishedCount === 1 ? "" : "s"}` : "",
    `${stats.totalSales} sales`,
    `${stats.profitRatio}% profitable months`,
  ]
    .filter(Boolean)
    .join("  ·  ");

  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#1a1a2e"/>
      <stop offset="1" stop-color="#16213e"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${accent}"/>
      <stop offset="1" stop-color="#e8b4b8"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="1080" fill="url(#bg)"/>
  <circle cx="960" cy="120" r="220" fill="${accent}" opacity="0.12"/>
  <circle cx="140" cy="980" r="180" fill="#e8b4b8" opacity="0.10"/>
  <text x="80" y="150" font-family="Georgia, serif" font-size="44" fill="#e8b4b8">${esc(studioName || "My Studio")}</text>
  <text x="80" y="430" font-family="Georgia, serif" font-size="150" font-weight="bold" fill="url(#accent)">${esc(line)}</text>
  <text x="80" y="520" font-family="Georgia, serif" font-size="42" fill="#e8b4b8">${esc(c.headline)}</text>
  <text x="80" y="590" font-family="Georgia, serif" font-size="34" fill="#b0b0c8">${esc(c.subline)}</text>
  <text x="80" y="640" font-family="Georgia, serif" font-size="30" fill="#8888a8">${esc(monthNote)}</text>
  <line x1="80" y1="760" x2="1000" y2="760" stroke="#3a3a5e" stroke-width="2"/>
  <text x="80" y="830" font-family="Georgia, serif" font-size="32" fill="#c8c8e0">${esc(footer)}</text>
  <text x="80" y="980" font-family="Georgia, serif" font-size="26" fill="#6a6a8e">Made with Stitch &amp; Scale</text>
</svg>`;
}
