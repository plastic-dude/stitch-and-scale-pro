/**
 * Brag Card engine (CHK-091, redesigned CHK-094).
 *
 * A shareable "brag moment" generator. The founder asked for exactly this:
 * a card a designer can build from the work they did in the tool — sales,
 * income, patterns published — and post to their socials. It doubles as a
 * growth engine: every card shared is an honest "this tool works" signal
 * that reaches other designers where they already hang out
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
 *
 * Design rules (CHK-094, the opposite of the failure patterns we
 * researched — clutter, gradients-as-decoration, no hierarchy, generic
 * SaaS look, >3 colors, no authorship):
 *   D-1  One dominant hero stat; everything else subordinate.
 *   D-2  Two typefaces max: editorial serif display + quiet sans/mono.
 *   D-3  ≤3 hues per card, craft palette.
 *   D-4  Grid discipline: hairline rules, letterspaced small-caps labels.
 *   D-5  Numbers in tabular mono where meaningful, never decorated.
 *   D-6  Every card carries the studio name + tool attribution.
 *   D-7  Zero watermarks.
 *   D-8  Honest math — no invented percentages, no 3D charts.
 *   D-9  Knit texture over gradient (purl-bump / grid SVG patterns).
 *   D-10 1080x1080, social-ready.
 */
import { fmtMoney } from "./receipt-lab.js";
import { getBragCardCopy, type BragCardCopy } from "./brag-copy.js";
import type { MonthlyLedgerRow } from "./receipt-lab.js";

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

/**
 * Visual style family (CHK-094). Each is a distinct designer-grade
 * identity — the accent colour still recolors any style.
 */
export type BragCardStyle =
  | "navy" // classic: deep navy, serif hero (default)
  | "editorial" // magazine cover: cream paper, serif display, folio
  | "swatch" // gauge swatch: graph-paper knit grid + gauge block
  | "selvedge" // yarn band: narrow vertical selvedge edge text
  | "swiss" // Swiss poster: giant hero number, tight grid, ink
  | "cameo" // stitch cameo: knit-symbol cameo panel

export const BRAG_CARD_STYLES: { id: BragCardStyle; label: string }[] = [
  { id: "navy", label: "Navy" },
  { id: "editorial", label: "Editorial" },
  { id: "swatch", label: "Gauge Swatch" },
  { id: "selvedge", label: "Selvedge" },
  { id: "swiss", label: "Swiss Poster" },
  { id: "cameo", label: "Stitch Cameo" },
];

/** Optional identity layered onto the generated social artifact. The logo is
 * intentionally a local data URI: Brag Cards never fetch remote brand assets. */
export const MAX_BRAG_CARD_LOGO_LENGTH = 200_000;

/**
 * Brag Cards are rendered locally and must never make an export depend on a
 * remote asset. Keep the same bounded data-URI contract used by the MCP
 * artifact path so imported or legacy settings cannot taint a canvas export.
 */
export function isLocalBragCardLogo(value: unknown): value is string {
  return typeof value === "string"
    && value.trim().length > 0
    && value.trim().length <= MAX_BRAG_CARD_LOGO_LENGTH
    && /^data:image\//i.test(value.trim());
}

export interface BragCardBranding {
  studioName?: string;
  customLogo?: string;
  socialHandle?: string;
  copyrightNotice?: string;
}

/** Base palettes per style — ≤3 hues (D-3); accent stays free. */
export const CARD_BASE_INK: Record<BragCardStyle, { bg: string; ink: string; inkSoft: string; rule: string }> = {
  navy: { bg: "#171b2b", ink: "#f1e9dd", inkSoft: "#b9b4c6", rule: "#3a3f57" },
  editorial: { bg: "#f4efe4", ink: "#26221c", inkSoft: "#6f6a5f", rule: "#cbbfad" },
  swatch: { bg: "#faf8f3", ink: "#2b2b26", inkSoft: "#7a786f", rule: "#d8d4c8" },
  selvedge: { bg: "#24201c", ink: "#efe7d8", inkSoft: "#b3ab9b", rule: "#554f44" },
  swiss: { bg: "#f2f0ea", ink: "#14130f", inkSoft: "#6b6860", rule: "#cfcac0" },
  cameo: { bg: "#eef0ec", ink: "#1c2420", inkSoft: "#6a7570", rule: "#c9d2cb" },
};

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

/** One hero number + its unit per highlight template (D-1). */
export function heroLine(stats: BragStats, currency: string, template: BragCardTemplate, copy: BragCardCopy = getBragCardCopy('en')): { big: string; unit: string } {
  if (template === "income") return { big: fmtMoney(stats.totalRevenue, currency), unit: "" };
  if (template === "sales") return { big: String(stats.totalSales), unit: copy.sales };
  if (template === "published") return { big: String(stats.publishedCount), unit: copy.published };
  return { big: String(stats.profitMonths), unit: copy.profitableMonths };
}

/**
 * Copy lines per template. Written to sound like a real indie knitwear
 * designer posting — never generic SaaS copy, never claiming the founder
 * knits (Rule 1). All numbers come straight from the designer's ledger.
 */
export function buildBragCaption(stats: BragStats, currency: string, template: BragCardTemplate, studioName: string, copy: BragCardCopy = getBragCardCopy('en')): BragCaption {
  const rev = fmtMoney(stats.totalRevenue, currency);
  const perSale = fmtMoney(stats.revenuePerSale, currency);
  const best = stats.bestMonth ? `${copy.bestMonth}: ${fmtMoney(stats.bestMonthProfit, currency)}` : "";

  switch (template) {
    case "income":
      return {
        headline: `${rev} ${copy.patternSales}`,
        subline: `${stats.totalSales} ${copy.sales}${best ? ` · ${best}` : ""}`,
        caption: `${studioName ? studioName + ": " : ""}${rev} ${copy.earned} — ${stats.totalSales} ${copy.sales}, ${perSale} ${copy.averagePerSale}.`,
      };
    case "sales":
      return {
        headline: `${stats.totalSales} ${copy.sales}, ${copy.oneStudio}`,
        subline: `${perSale} ${copy.averagePerSale}${best ? ` · ${best}` : ""}`,
        caption: `${studioName ? studioName + ": " : ""}${stats.totalSales} ${copy.sales}, ${rev} ${copy.total}.`,
      };
    case "streak":
      return {
        headline: `${stats.profitMonths} ${copy.monthsAllProfitable}`,
        subline: `${copy.onRecord} · ${rev} ${copy.total}${best ? ` · ${best}` : ""}`,
        caption: `${studioName ? studioName + ": " : ""}${copy.streakCaption.replace('{count}', String(stats.profitMonths)).replace('{total}', rev)}`,
      };
    case "published":
      return {
        headline: `${stats.publishedCount} ${copy.publishedHeadline}`,
        subline: `${rev} ${copy.earned} · ${stats.totalSales} ${copy.sales}`,
        caption: `${studioName ? studioName + ": " : ""}${copy.publishedCaption.replace('{count}', String(stats.publishedCount)).replace('{revenue}', rev).replace('{sales}', String(stats.totalSales))}`,
      };
  }
}

/* ---------- small SVG building blocks (D-4, D-9) ---------- */

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&apos;");
const FONT_SERIF = "Georgia, 'Times New Roman', serif";
const FONT_SANS = "Helvetica, Arial, sans-serif";
const FONT_MONO = "SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace";

/** Purl-bump texture knitters read instantly (D-9). */
function knitPatternDefs(accent: string): string {
  const size = 40;
  const half = size / 2;
  const q = half / 2;
  return `<defs>
    <pattern id="stock" width="${size}" height="${size}" patternUnits="userSpaceOnUse">
      <path d="M0 ${half} q${q} ${-q} ${half} 0 q${q} ${q} ${half} 0" fill="none" stroke="${accent}" stroke-width="1.6" opacity="0.10"/>
    </pattern>
  </defs>`;
}

function footerBlock(stats: BragStats, currency: string, rule: string, inkSoft: string, copy: BragCardCopy = getBragCardCopy('en')): string {
  const items = [
    stats.publishedCount > 0 ? `${stats.publishedCount} ${copy.published}` : "",
    `${stats.totalSales} ${copy.sales}`,
    `${stats.profitRatio}% ${copy.profitableMonths}`,
  ]
    .filter(Boolean)
    .join("   ·   ");
  return `<line x1="80" y1="924" x2="1000" y2="924" stroke="${rule}" stroke-width="1.5"/>
  <text x="80" y="956" font-family="${FONT_SANS}" font-size="25" letter-spacing="2" fill="${inkSoft}">${esc(items)}</text>
  <text x="1000" y="956" font-family="${FONT_SANS}" font-size="22" letter-spacing="3" text-anchor="end" fill="${inkSoft}">STITCH &amp; SCALE</text>`;
}

/* ---------- per-style SVG composers ---------- */

function styleNavy(stats: BragStats, currency: string, template: BragCardTemplate, studioName: string, accent: string, copy: BragCardCopy = getBragCardCopy('en')): string {
  const p = CARD_BASE_INK.navy;
  const h = heroLine(stats, currency, template, copy);
  const c = buildBragCaption(stats, currency, template, studioName, copy);
  const line = h.unit ? `${h.big} ${h.unit}` : h.big;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">
  ${knitPatternDefs(accent)}
  <rect width="1080" height="1080" fill="${p.bg}"/>
  <rect x="0" y="0" width="1080" height="1080" fill="url(#stock)"/>
  <circle cx="960" cy="120" r="200" fill="${accent}" opacity="0.10"/>
  <text x="80" y="150" font-family="${FONT_SERIF}" font-size="42" fill="${p.ink}">${esc(studioName || "My Studio")}</text>
  <text x="80" y="420" font-family="${FONT_SERIF}" font-size="130" font-weight="bold" fill="${accent}">${esc(line)}</text>
  <text x="80" y="505" font-family="${FONT_SERIF}" font-size="42" fill="${p.ink}">${esc(c.headline)}</text>
  <text x="80" y="572" font-family="${FONT_SANS}" font-size="31" fill="${p.inkSoft}">${esc(c.subline)}</text>
  ${footerBlock(stats, currency, p.rule, p.inkSoft, copy)}
</svg>`;
}

/** Editorial magazine cover: cream paper, serif display, kicker + folio (D-2, D-4). */
function styleEditorial(stats: BragStats, currency: string, template: BragCardTemplate, studioName: string, accent: string, copy: BragCardCopy = getBragCardCopy('en')): string {
  const p = CARD_BASE_INK.editorial;
  const h = heroLine(stats, currency, template, copy);
  const c = buildBragCaption(stats, currency, template, studioName, copy);
  const line = h.unit ? `${h.big} ${h.unit}` : h.big;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">
  ${knitPatternDefs(p.rule)}
  <rect width="1080" height="1080" fill="${p.bg}"/>
  <rect x="64" y="64" width="952" height="952" fill="none" stroke="${p.rule}" stroke-width="2"/>
  <text x="80" y="128" font-family="${FONT_SANS}" font-size="23" letter-spacing="6" fill="${p.inkSoft}">THE LEDGER · NO. 01</text>
  <text x="1000" y="128" font-family="${FONT_SANS}" font-size="23" letter-spacing="6" text-anchor="end" fill="${p.inkSoft}">1080² · ONE STUDIO</text>
  <line x1="80" y1="156" x2="1000" y2="156" stroke="${p.rule}" stroke-width="1.5"/>
  <text x="80" y="262" font-family="${FONT_SANS}" font-size="28" letter-spacing="5" fill="${accent}">${esc((studioName || "My Studio").toUpperCase())}</text>
  <text x="80" y="424" font-family="${FONT_SERIF}" font-size="116" font-weight="bold" fill="${p.ink}">${esc(line)}</text>
  <line x1="80" y1="464" x2="440" y2="464" stroke="${accent}" stroke-width="5"/>
  <text x="80" y="552" font-family="${FONT_SERIF}" font-style="italic" font-size="44" fill="${p.inkSoft}">${esc(c.headline)}</text>
  <text x="80" y="620" font-family="${FONT_SANS}" font-size="30" fill="${p.inkSoft}">${esc(c.subline)}</text>
  ${footerBlock(stats, currency, p.rule, p.inkSoft, copy)}
</svg>`;
}

/** Gauge swatch: graph-paper knit grid + gauge block — the most authentic card for knitters (D-9). */
function styleSwatch(stats: BragStats, currency: string, template: BragCardTemplate, studioName: string, accent: string, copy: BragCardCopy = getBragCardCopy('en')): string {
  const p = CARD_BASE_INK.swatch;
  const h = heroLine(stats, currency, template, copy);
  const c = buildBragCaption(stats, currency, template, studioName, copy);
  let grid = "";
  for (let i = 0; i <= 20; i += 1) {
    grid += `<line x1="${720 + i * 15}" y1="96" x2="${720 + i * 15}" y2="396" stroke="${p.rule}" stroke-width="1"/>
  <line x1="720" y1="${96 + i * 15}" x2="1020" y2="${96 + i * 15}" stroke="${p.rule}" stroke-width="1"/>`;
  }
  const accentCells = `<rect x="750" y="126" width="45" height="45" fill="${accent}" opacity="0.55"/>
  <rect x="825" y="171" width="45" height="45" fill="${accent}" opacity="0.40"/>
  <rect x="885" y="141" width="45" height="45" fill="${accent}" opacity="0.30"/>
  <rect x="780" y="231" width="45" height="45" fill="${accent}" opacity="0.25"/>`;
  const line = h.unit ? `${h.big} ${h.unit}` : h.big;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">
  <rect width="1080" height="1080" fill="${p.bg}"/>
  ${grid}
  ${accentCells}
  <line x1="720" y1="96" x2="720" y2="396" stroke="${p.rule}" stroke-width="2.5"/>
  <line x1="720" y1="396" x2="1020" y2="396" stroke="${p.rule}" stroke-width="2.5"/>
  <line x1="1020" y1="96" x2="1020" y2="396" stroke="${p.rule}" stroke-width="2.5"/>
  <text x="720" y="436" font-family="${FONT_MONO}" font-size="22" fill="${p.inkSoft}">18 sts × 24 rows / 4in</text>
  <text x="80" y="160" font-family="${FONT_SERIF}" font-size="44" fill="${p.ink}">${esc(studioName || "My Studio")}</text>
  <text x="80" y="430" font-family="${FONT_MONO}" font-size="112" font-weight="bold" fill="${p.ink}">${esc(line)}</text>
  <text x="80" y="516" font-family="${FONT_SERIF}" font-style="italic" font-size="44" fill="${p.inkSoft}">${esc(c.headline)}</text>
  <text x="80" y="584" font-family="${FONT_SANS}" font-size="30" fill="${p.inkSoft}">${esc(c.subline)}</text>
  ${footerBlock(stats, currency, p.rule, p.inkSoft, copy)}
</svg>`;
}

/** Selvedge yarn band: narrow vertical band with running letterspaced text — like a selvedge edge or yarn label (D-4, D-9). */
function styleSelvedge(stats: BragStats, currency: string, template: BragCardTemplate, studioName: string, accent: string, copy: BragCardCopy = getBragCardCopy('en')): string {
  const p = CARD_BASE_INK.selvedge;
  const h = heroLine(stats, currency, template, copy);
  const c = buildBragCaption(stats, currency, template, studioName, copy);
  const line = h.unit ? `${h.big} ${h.unit}` : h.big;
  const band = `STITCH &amp; SCALE   ·   ${esc((studioName || "My Studio").toUpperCase())}   ·   HONEST LEDGER   ·   KNIT LOCAL   ·   `;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">
  <rect width="1080" height="1080" fill="${p.bg}"/>
  <rect x="40" y="40" width="36" height="1000" fill="${accent}" opacity="0.85"/>
  <text x="0" y="0" transform="translate(58,1020) rotate(-90)" font-family="${FONT_SANS}" font-size="22" letter-spacing="8" fill="${p.bg}">${band}</text>
  <text x="120" y="150" font-family="${FONT_SANS}" font-size="26" letter-spacing="6" fill="${p.inkSoft}">${esc((studioName || "My Studio").toUpperCase())}</text>
  <text x="120" y="430" font-family="${FONT_SERIF}" font-size="122" font-weight="bold" fill="${p.ink}">${esc(line)}</text>
  <line x1="120" y1="476" x2="500" y2="476" stroke="${accent}" stroke-width="5"/>
  <text x="120" y="564" font-family="${FONT_SERIF}" font-style="italic" font-size="42" fill="${p.ink}">${esc(c.headline)}</text>
  <text x="120" y="628" font-family="${FONT_SANS}" font-size="30" fill="${p.inkSoft}">${esc(c.subline)}</text>
  ${footerBlock(stats, currency, p.rule, p.inkSoft, copy)}
</svg>`;
}

/** Swiss poster: giant hero number, tight asymmetric grid, ink on paper (D-1, D-4). */
function styleSwiss(stats: BragStats, currency: string, template: BragCardTemplate, studioName: string, accent: string, copy: BragCardCopy = getBragCardCopy('en')): string {
  const p = CARD_BASE_INK.swiss;
  const h = heroLine(stats, currency, template, copy);
  const c = buildBragCaption(stats, currency, template, studioName, copy);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">
  <rect width="1080" height="1080" fill="${p.bg}"/>
  <rect x="0" y="0" width="1080" height="72" fill="${p.ink}"/>
  <text x="80" y="50" font-family="${FONT_SANS}" font-size="25" letter-spacing="5" fill="${p.bg}">LEDGER REPORT · ${esc((studioName || "My Studio").toUpperCase())}</text>
  <text x="80" y="380" font-family="${FONT_MONO}" font-size="250" font-weight="bold" fill="${p.ink}">${esc(h.big)}</text>
  <rect x="80" y="420" width="340" height="26" fill="${accent}"/>
  <text x="80" y="516" font-family="${FONT_SANS}" font-size="40" font-weight="bold" letter-spacing="1" fill="${p.ink}">${esc((h.unit || "earned").toUpperCase())}</text>
  <text x="80" y="596" font-family="${FONT_SERIF}" font-size="38" fill="${p.inkSoft}">${esc(c.headline)}</text>
  <text x="80" y="656" font-family="${FONT_SANS}" font-size="28" fill="${p.inkSoft}">${esc(c.subline)}</text>
  ${footerBlock(stats, currency, p.rule, p.inkSoft, copy)}
</svg>`;
}

/** Stitch cameo: a knit-symbol cameo panel (O = knit, | = purl, X = cable) — the one card no rival can fake (D-8, D-9). */
function styleCameo(stats: BragStats, currency: string, template: BragCardTemplate, studioName: string, accent: string, copy: BragCardCopy = getBragCardCopy('en')): string {
  const p = CARD_BASE_INK.cameo;
  const h = heroLine(stats, currency, template, copy);
  const c = buildBragCaption(stats, currency, template, studioName, copy);
  const line = h.unit ? `${h.big} ${h.unit}` : h.big;
  const rows = ["O O X O | O O", "O | O O X O |", "X O | O O X O", "O O X | O O O", "| O O X O | O"];
  const cameo = rows
    .map((r, i) => `<text x="790" y="${186 + i * 52}" font-family="${FONT_MONO}" font-size="40" fill="${i % 2 === 0 ? accent : p.inkSoft}" letter-spacing="10">${r}</text>`)
    .join("\n  ");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">
  <rect width="1080" height="1080" fill="${p.bg}"/>
  <rect x="760" y="140" width="260" height="320" fill="none" stroke="${p.rule}" stroke-width="2"/>
  <text x="786" y="112" font-family="${FONT_SANS}" font-size="22" letter-spacing="4" fill="${p.inkSoft}">CAMEO</text>
  ${cameo}
  <text x="80" y="160" font-family="${FONT_SERIF}" font-size="42" fill="${p.ink}">${esc(studioName || "My Studio")}</text>
  <text x="80" y="430" font-family="${FONT_SERIF}" font-size="122" font-weight="bold" fill="${p.ink}">${esc(line)}</text>
  <text x="80" y="512" font-family="${FONT_SERIF}" font-style="italic" font-size="42" fill="${p.inkSoft}">${esc(c.headline)}</text>
  <text x="80" y="578" font-family="${FONT_SANS}" font-size="30" fill="${p.inkSoft}">${esc(c.subline)}</text>
  ${footerBlock(stats, currency, p.rule, p.inkSoft, copy)}
</svg>`;
}

/** Add the configured identity to the final SVG so every visual style and
 * every export route receives the same wordmark, logo, and legal line. */
function applyBragBranding(svg: string, branding?: BragCardBranding): string {
  if (!branding) return svg;
  const wordmark = branding.studioName?.trim() || "STITCH & SCALE";
  let branded = svg.replace(/STITCH &amp; SCALE/g, esc(wordmark));
  const logo = isLocalBragCardLogo(branding.customLogo) ? branding.customLogo.trim() : undefined;
  const logoMarkup = logo
    ? `<image href="${esc(logo)}" x="910" y="62" width="108" height="108" preserveAspectRatio="xMidYMid meet"/>`
    : "";
  const legal = [branding.socialHandle?.trim(), branding.copyrightNotice?.trim()].filter(Boolean).join(" · ");
  const legalMarkup = legal
    ? `<text x="80" y="1000" font-family="${FONT_SANS}" font-size="20" letter-spacing="1" fill="currentColor">${esc(legal)}</text>`
    : "";
  return branded.replace("</svg>", `${logoMarkup}${legalMarkup}</svg>`);
}

/**
 * The visual card: returns SVG markup (1080x1080, social-ready).
 * Render client-side, then rasterize to PNG with canvas.
 * The final branding argument is optional for backwards compatibility.
 */
export function buildBragCardSvg(stats: BragStats, currency: string, template: BragCardTemplate, studioName: string, accent: string, style: BragCardStyle = "navy", copy: BragCardCopy = getBragCardCopy('en'), branding?: BragCardBranding): string {
  let svg: string;
  switch (style) {
    case "editorial": svg = styleEditorial(stats, currency, template, studioName, accent, copy); break;
    case "swatch": svg = styleSwatch(stats, currency, template, studioName, accent, copy); break;
    case "selvedge": svg = styleSelvedge(stats, currency, template, studioName, accent, copy); break;
    case "swiss": svg = styleSwiss(stats, currency, template, studioName, accent, copy); break;
    case "cameo": svg = styleCameo(stats, currency, template, studioName, accent, copy); break;
    case "navy":
    default: svg = styleNavy(stats, currency, template, studioName, accent, copy); break;
  }
  return applyBragBranding(svg, branding);
}
