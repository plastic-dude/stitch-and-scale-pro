/**
 * Yarn Pool Lab — CHK-059 (57th workspace feature).
 *
 * Every tool in session 37 told designers to "buy wholesale"; none answers
 * the three questions that actually block it: WHAT do I order, WITH WHOM,
 * and is the cash locked in yarn worth it? Session-59 market facts:
 *
 * - Mill-direct yarn runs EUR 8–12 per 100g, but mills require 10–50 kg
 *   PER COLORWAY (20+ kg typical — italianafilatipregiati, Mar 2026). An
 *   indie designer knitting samples and small runs needs 2–5 kg. One
 *   designer can never clear a colorway MOQ alone; N designers can.
 * - Wholesale price tiers follow MOQ amortization: the fixed costs of a
 *   production line (setup, color changes) are split across units, so
 *   per-unit price drops with volume. Representative tiers (meetsocks
 *   MOQ model, 2026): ~100 kg-equivalent = 100% baseline; 300 = 85–90%;
 *   500 = 75–80%; 1,000 = 65–70%; 3,000+ = 55–60%.
 * - Retail→bulk→wholesale price ladder: retail skeins carry a 2–3x markup
 *   over mill-direct per kg once packaging, dyeing, labelling, and
 *   marketing are in (the raw-state discount); retail bulk-programs
 *   (Hobbii volume tiers, Knit Picks 10-skein bundles, Ice Yarns 400g
 *   lots) recover part of the gap without MOQ commitments.
 * - Cone yarn is the hand-knitter's bridge: one fingering cone ≈ 4,000 yd
 *   = 20 retail skeins, at $25–40 vs $80–150 retail equivalent (25–40%
 *   per-yard savings) with premium fibers that never hit retail shelves
 *   (shershegrows cone guide). Cones also kill dye-lot risk — one
 *   continuous supply, no "80% of each contrast ball" waste in colorwork.
 * - The iron rule of dye lots: buy ALL yarn for a garment/collection at
 *   once — dye lots never match later (r/YarnAddicts). Pooling therefore
 *   buys both a price tier AND lot security.
 * - Tariff volatility (MDK "This Tariff Thing", Aug 2025) makes timing a
 *   hedge: a pool that hits a better tier before a duty hike saves more
 *   than the tier spread alone.
 * - Cash lock-up is the real cost: yarn bought early is cash that can't
 *   pay test-knitters, tech editors, or rent. The lab measures months of
 *   production runway the outlay consumes.
 *
 * The lab is deterministic: it aggregates per-pattern yarn demand across
 * a catalog (or a pool of designers), walks the price ladder
 * (retail → retail bulk → wholesale → mill-direct), models the tier
 * actually reached, cash outlay, production runway, and dye-lot risk,
 * then verdicts: too small / pool it / split it / mill it.
 */

import type { LanguageCode } from '@/lib/i18n';
import { YARN_POOL_COPY, type YarnPoolFlagCode, type YarnPoolTierId, type YarnPoolVerdictId } from '@/lib/yarn-pool-copy';

export type SourceTier = 'retail' | 'retailBulk' | 'wholesale' | 'millDirect';
/** Typed, locale-independent verdict discriminator — the card styles by this, never by string prefix. */
export type VerdictId = YarnPoolVerdictId;

export interface PoolMember {
  name: string;
  /** Yarn need for this member's patterns, grams (one yarn type per member row). */
  gramsNeeded: number;
}

export interface YarnColorway {
  name: string;
  gramsPerKg: number;
  /** Grams needed across all pool members for this colorway. */
  gramsNeeded: number;
  /** Price per kg at retail (skeins, retail shop). */
  retailPricePerKg: number;
  /** Price per kg if a retail bulk program tier is hit. */
  bulkPricePerKg: number;
  /** Wholesale dealer price per kg (no MOQ per colorway, min order value). */
  wholesalePricePerKg: number;
  /** Mill-direct price per kg (requires colorway MOQ). */
  millPricePerKg: number;
  /** Mill minimum order per colorway (grams). */
  millMinPerColorway: number;
  /** Retail bulk program minimum (grams). */
  bulkMin: number;
  /** Wholesale dealer minimum order value ($). */
  wholesaleMinValue: number;
}

export interface YarnPoolInput {
  colorways: YarnColorway[];
  members: PoolMember[];
  /** How many months of production runway the designer expects from this yarn stock. */
  productionRunwayMonths: number;
  /** Monthly revenue (all channels) — used to price the cash lock-up. */
  monthlyRevenue: number;
  /** Stash on hand already available for these projects (grams). */
  stashGrams: number;
  /** If a colorway MOQ is missed, allow "split it" (join a group buy / co-op). */
  groupBuyAvailable: boolean;
}

export const DEFAULT_COLORWAY: YarnColorway = {
  name: 'Main colorway',
  gramsPerKg: 1000,
  gramsNeeded: 2500,
  retailPricePerKg: 45,
  bulkPricePerKg: 38,
  wholesalePricePerKg: 30,
  millPricePerKg: 24,
  millMinPerColorway: 20000,
  bulkMin: 1000,
  wholesaleMinValue: 250,
};

export const DEFAULT_POOL: YarnPoolInput = {
  colorways: [DEFAULT_COLORWAY],
  members: [
    { name: 'Crewneck sweater', gramsNeeded: 1200 },
    { name: 'Crewneck (size L+ sample)', gramsNeeded: 450 },
    { name: 'Matching beanie', gramsNeeded: 350 },
    { name: 'Sample + marketing stock', gramsNeeded: 500 },
  ],
  productionRunwayMonths: 6,
  monthlyRevenue: 1400,
  stashGrams: 400,
  groupBuyAvailable: true,
};

export interface Flag {
  code: YarnPoolFlagCode;
  title: string;
  detail: string;
}

export interface ColorwayResult {
  key: string;
  name: string;
  gramsNeeded: number;
  gramsAfterStash: number;
  /** Tier this colorway actually reaches when pooling members. */
  tierReached: SourceTier;
  pricePerKg: number;
  cost: number;
  /** Cost if everyone just bought retail — the comparison baseline. */
  retailCost: number;
  savings: number;
  savingsPct: number;
  meetsMillMinq: boolean;
  millMinPerColorway: number;
}

export interface YarnPoolResult {
  colorways: ColorwayResult[];
  totalGrams: number;
  totalCost: number;
  totalRetailCost: number;
  totalSavings: number;
  totalSavingsPct: number;
  /** Months of production revenue the pooled outlay locks up. */
  cashLockedMonths: number;
  /** Grams contributed by stash instead of cash. */
  stashGramsUsed: number;
  /** Whether a group buy / split is the right move for any colorway. */
  needsGroupBuy: boolean;
  flags: Flag[];
  /** Stable, locale-independent verdict discriminator. */
  verdictId: VerdictId;
  /** Localized verdict display string for the current locale. */
  verdict: string;
  verdictNote: string;
}

interface BestSource {
  tier: SourceTier;
  pricePerKg: number;
  meetsConditions: boolean;
}

function bestSource(c: YarnColorway, pooledGrams: number, remainingColorways: number): BestSource {
  // Walk from cheapest to most expensive; first tier whose condition the
  // pooled grams satisfy is the tier reached.
  const candidates: Array<{ tier: SourceTier; price: number; ok: boolean }> = [
    { tier: 'millDirect', price: c.millPricePerKg, ok: pooledGrams >= c.millMinPerColorway },
    { tier: 'wholesale', price: c.wholesalePricePerKg, ok: remainingColorways * c.wholesalePricePerKg * Math.max(0.25, pooledGrams / 1000) >= c.wholesaleMinValue },
    { tier: 'retailBulk', price: c.bulkPricePerKg, ok: pooledGrams >= c.bulkMin },
    { tier: 'retail', price: c.retailPricePerKg, ok: true },
  ];
  for (const cand of candidates) {
    if (cand.ok) return { tier: cand.tier, pricePerKg: cand.price, meetsConditions: true };
  }
  return { tier: 'retail', pricePerKg: c.retailPricePerKg, meetsConditions: false };
}

export function analyzeYarnPool(input: YarnPoolInput, language: LanguageCode = 'en'): YarnPoolResult {
  const copy = YARN_POOL_COPY[language];
  const membersGrams = (input.members || []).reduce((s, m) => s + (m.gramsNeeded || 0), 0);
  const flags: Flag[] = [];

  const colorways: ColorwayResult[] = (input.colorways || []).map((c, idx) => {
    const gramsNeeded = Math.max(c.gramsNeeded || 0, 0);
    const gramsAfterStash = Math.max(0, gramsNeeded);
    const source = bestSource(c, gramsNeeded, Math.max(1, (input.colorways || []).length));
    const cost = (gramsNeeded / 1000) * source.pricePerKg;
    const retailCost = (gramsNeeded / 1000) * c.retailPricePerKg;
    const key = `cw-${idx}-${c.name}`;
    return {
      key,
      name: c.name,
      gramsNeeded,
      gramsAfterStash,
      tierReached: source.tier,
      pricePerKg: source.pricePerKg,
      cost,
      retailCost,
      savings: retailCost - cost,
      savingsPct: retailCost > 0 ? (retailCost - cost) / retailCost : 0,
      meetsMillMinq: gramsNeeded >= c.millMinPerColorway,
      millMinPerColorway: c.millMinPerColorway,
    };
  });

  const totalGrams = colorways.reduce((s, c) => s + c.gramsNeeded, 0);
  const totalCost = colorways.reduce((s, c) => s + c.cost, 0);
  const totalRetailCost = colorways.reduce((s, c) => s + c.retailCost, 0);
  const totalSavings = totalRetailCost - totalCost;
  const totalSavingsPct = totalRetailCost > 0 ? totalSavings / totalRetailCost : 0;

  const cashLockedMonths = input.monthlyRevenue > 0 ? totalCost / input.monthlyRevenue : Infinity;
  const needsGroupBuy = colorways.some(c => c.tierReached === 'retail' && c.gramsNeeded > 0);

  // ---- Flags ----
  const millMiss = colorways.filter(c => !c.meetsMillMinq && c.gramsNeeded >= c.millMinPerColorway * 0.7);
  if (millMiss.length > 0) {
    flags.push({
      code: 'YP-01',
      title: copy.flagTitle('YP-01'),
      detail: copy.flagDetail('YP-01', { names: millMiss.map(c => c.name).join(', '), are: millMiss.length === 1 ? 'is' : 'are' }),
    });
  }
  const cashWarn = isFinite(cashLockedMonths) && cashLockedMonths > input.productionRunwayMonths * 0.75;
  if (cashWarn) {
    flags.push({
      code: 'YP-02',
      title: copy.flagTitle('YP-02'),
      detail: copy.flagDetail('YP-02', { months: cashLockedMonths.toFixed(1), runway: String(input.productionRunwayMonths) }),
    });
  }
  const noStashOffset = input.stashGrams > 0 && totalGrams > 0;
  if (noStashOffset) {
    flags.push({
      code: 'YP-03',
      title: copy.flagTitle('YP-03'),
      detail: copy.flagDetail('YP-03', { stash: String(input.stashGrams) }),
    });
  }
  const retailOnly = colorways.filter(c => c.tierReached === 'retail' && c.gramsNeeded > 500);
  if (retailOnly.length > 0 && !input.groupBuyAvailable) {
    flags.push({
      code: 'YP-04',
      title: copy.flagTitle('YP-04'),
      detail: copy.flagDetail('YP-04', { names: retailOnly.map(c => c.name).join(', ') }),
    });
  }
  if (retailOnly.length > 0 && input.groupBuyAvailable) {
    flags.push({
      code: 'YP-05',
      title: copy.flagTitle('YP-05'),
      detail: copy.flagDetail('YP-05', { names: retailOnly.map(c => c.name).join(', ') }),
    });
  }
  const dyeLot = colorways.length >= 2;
  if (dyeLot && totalGrams > 0) {
    flags.push({
      code: 'YP-06',
      title: copy.flagTitle('YP-06'),
      detail: copy.flagDetail('YP-06', {}),
    });
  }
  if (totalGrams > 0 && membersGrams > 0 && membersGrams > totalGrams * 1.15) {
    flags.push({
      code: 'YP-07',
      title: copy.flagTitle('YP-07'),
      detail: copy.flagDetail('YP-07', { memberGrams: membersGrams.toLocaleString('en-US'), poolGrams: totalGrams.toLocaleString('en-US') }),
    });
  }

  // ---- Verdict ----
  const canMill = colorways.some(c => c.meetsMillMinq);
  const canBulk = colorways.some(c => c.tierReached === 'wholesale' || c.tierReached === 'retailBulk');
  // The tier-ladder arithmetic (bestSource, savings, cash lock-up) is unchanged —
  // only the displayed verdict strings and flag prose now flow through the locale catalogue.
  let verdictId: VerdictId;
  const verdictValues = (overrides: Record<string, string> = {}): Record<string, string> => ({
    cost: totalCost.toFixed(0),
    savings: totalSavings.toFixed(0),
    savingsPct: (totalSavingsPct * 100).toFixed(0),
    retailCost: totalRetailCost.toFixed(0),
    millKg: (Math.max(...(input.colorways || []).map(c => c.millMinPerColorway)) / 1000).toFixed(0),
    ...overrides,
  });
  if (totalGrams === 0) {
    verdictId = 'nothing';
  } else if (!canMill && !canBulk && needsGroupBuy) {
    verdictId = 'tooSmall';
  } else if (canBulk && !canMill) {
    const onDealer = colorways.some(c => c.tierReached === 'wholesale');
    verdictId = onDealer ? 'bulkDealer' : 'bulkRetail';
  } else if (canMill) {
    verdictId = 'mill';
  } else {
    verdictId = 'pooled';
  }
  const verdict = copy.verdictLabel(verdictId);
  const verdictNote = copy.verdictNote(verdictId, verdictValues());

  return {
    colorways,
    totalGrams,
    totalCost,
    totalRetailCost,
    totalSavings,
    totalSavingsPct,
    cashLockedMonths,
    stashGramsUsed: Math.min(input.stashGrams || 0, totalGrams),
    needsGroupBuy,
    flags,
    verdictId,
    verdict,
    verdictNote,
  };
}

/** Typed tier label lookup for the active locale (replaces the hardcoded English TIER_LABELS). */
export function tierLabel(tier: SourceTier, language: LanguageCode = 'en'): string {
  return YARN_POOL_COPY[language].tierLabel(tier as YarnPoolTierId);
}
