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

export type SourceTier = 'retail' | 'retailBulk' | 'wholesale' | 'millDirect';
export const TIER_LABELS: Record<SourceTier, string> = {
  retail: 'Retail',
  retailBulk: 'Retail bulk program',
  wholesale: 'Wholesale dealer',
  millDirect: 'Mill direct',
};

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
  code: string;
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

export function analyzeYarnPool(input: YarnPoolInput): YarnPoolResult {
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
      title: 'Colorway MOQ nearly reached',
      detail: `${millMiss.map(c => c.name).join(', ')} ${millMiss.length === 1 ? 'is' : 'are'} within 70% of the mill's per-colorway minimum — pool one more pattern or one more designer and the tier opens (mill-direct is typically 25–47% under retail).`,
    });
  }
  const cashWarn = isFinite(cashLockedMonths) && cashLockedMonths > input.productionRunwayMonths * 0.75;
  if (cashWarn) {
    flags.push({
      code: 'YP-02',
      title: 'Cash lock-up exceeds runway',
      detail: `This pool ties up ≈${cashLockedMonths.toFixed(1)} months of your revenue against only ${input.productionRunwayMonths} months of expected production. Buy in stages or pool less per cycle — yarn is the easiest inventory to over-order.`,
    });
  }
  const noStashOffset = input.stashGrams > 0 && totalGrams > 0;
  if (noStashOffset) {
    flags.push({
      code: 'YP-03',
      title: 'Stash not offsetting this pool',
      detail: `${input.stashGrams} g on hand is not credited against this pool's needs. Even partial stash substitution shrinks the cash outlay at every tier.`,
    });
  }
  const retailOnly = colorways.filter(c => c.tierReached === 'retail' && c.gramsNeeded > 500);
  if (retailOnly.length > 0 && !input.groupBuyAvailable) {
    flags.push({
      code: 'YP-04',
      title: 'Pooling still lands at retail',
      detail: `${retailOnly.map(c => c.name).join(', ')} don't hit any tier's floor — split this colorway into a group buy, knitting co-op, or LYS order-share instead of buying alone.`,
    });
  }
  if (retailOnly.length > 0 && input.groupBuyAvailable) {
    flags.push({
      code: 'YP-05',
      title: 'Group buy ready for these colorways',
      detail: `${retailOnly.map(c => c.name).join(', ')} sit at retail because nothing else qualifies — a co-op or group buy aggregates the community's demand the way a pool aggregates your own.`,
    });
  }
  const dyeLot = colorways.length >= 2;
  if (dyeLot && totalGrams > 0) {
    flags.push({
      code: 'YP-06',
      title: 'One order, all colorways at once',
      detail: 'Dye lots never match later — order every colorway for these garments in a single purchase so bodies, sleeves, and accessories match forever.',
    });
  }
  if (totalGrams > 0 && membersGrams > 0 && membersGrams > totalGrams * 1.15) {
    flags.push({
      code: 'YP-07',
      title: 'Members ask for more than the pool plans',
      detail: `Members total ${membersGrams.toLocaleString('en-US')} g but the colorways hold ${totalGrams.toLocaleString('en-US')} g. Either raise colorway grams or trim members — under-ordered dye lots can never be re-matched.`,
    });
  }

  // ---- Verdict ----
  const canMill = colorways.some(c => c.meetsMillMinq);
  const canBulk = colorways.some(c => c.tierReached === 'wholesale' || c.tierReached === 'retailBulk');
  let verdict: string;
  let verdictNote: string;
  if (totalGrams === 0) {
    verdict = 'Nothing to pool';
    verdictNote = 'Add at least one colorway with a yarn need. The pool only finds tiers if there is demand to aggregate.';
  } else if (!canMill && !canBulk && needsGroupBuy) {
    verdict = 'Too small to pool alone — split it';
    verdictNote = `Your own catalog ($${totalCost.toFixed(0)} projected, ${totalSavings.toFixed(0)} under retail if a tier opened) still sits at retail because no floor is reached. Split these colorways into a group buy or co-op: every extra designer's grams move the pool closer to the 10–50 kg/colorway mill tier. Savings worth having: ≈${(totalSavingsPct * 100).toFixed(0)}%.`;
  } else if (canBulk && !canMill) {
    const onDealer = colorways.some(c => c.tierReached === 'wholesale');
    verdict = onDealer ? 'Pool it — dealer/wholesale tier unlocked' : 'Pool it — retail bulk tier unlocked';
    verdictNote = onDealer
      ? `Pooling your own patterns passes the dealer's minimum order at ≈$${totalCost.toFixed(0)} — $${totalSavings.toFixed(0)} (${(totalSavingsPct * 100).toFixed(0)}%) under retail. You still don't clear the mill's per-colorway minimum (${(Math.max(...(input.colorways || []).map(c => c.millMinPerColorway)) / 1000).toFixed(0)} kg); one more partner or pattern gets you there.`
      : `Pooling your own patterns hits the retail bulk-program floor at ≈$${totalCost.toFixed(0)} — $${totalSavings.toFixed(0)} (${(totalSavingsPct * 100).toFixed(0)}%) under retail. Getting to the dealer's minimum order (or the mill's ${(Math.max(...(input.colorways || []).map(c => c.millMinPerColorway)) / 1000).toFixed(0)} kg per-colorway MOQ) is the next unlock — one more pattern or partner's grams does it.`;
  } else if (canMill) {
    verdict = 'Mill it — best tier reached';
    verdictNote = `Mill-direct opened for at least one colorway: ≈$${totalCost.toFixed(0)} total, $${totalSavings.toFixed(0)} (${(totalSavingsPct * 100).toFixed(0)}%) under retail. Mill orders mean EUR 8–12 per 100 g and fibers that never hit retail shelves — plus cone-stock consistency across the whole run. Order every colorway in one shipment.`;
  } else {
    verdict = 'Pool it — demand aggregated';
    verdictNote = `Grouping your patterns moves the colorways to better pricing: $${totalCost.toFixed(0)} vs $${totalRetailCost.toFixed(0)} retail. Watch the cash lock-up — yarn bought today is cash that can't pay test-knitters next month.`;
  }

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
    verdict,
    verdictNote,
  };
}
