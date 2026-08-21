/**
 * Subscription & Distribution Lab — session-46 feature.
 *
 * MARKET LENS (documented in research/competitors-session-46): no tool attaches
 * distribution math to the pattern's own grade/pricing data. LoveCrafts and
 * Ribblr are channel storefronts with formatting lock-in; GoSadi syncs
 * listings but never models net economics; Ravelry/Etsy/Payhip are passive
 * storefronts. Channel fees materially move the payback period (MediaPeruana:
 * a $6.50 pattern needs ~24 copies to recover build cost; net-per-sale spread
 * across channels is $4.20–$5.70 on the same $6 pattern). Subscription
 * libraries pay royalties often an order of magnitude below sale price —
 * Creative Fabrica-class payouts are "a few cents" per download.
 *
 * DESIGN (same seams as every other tab):
 * - per-channel net uses platformNet() from pattern-income-calculator.ts
 *   (verified against published fee pages), extended here with a LoveCrafts
 *   model from the LoveCrafts designer handbook (May 2026) and an own-store
 *   Stripe-only model.
 * - channel allocation: the designer's expected monthly units are distributed
 *   across selected channels; the lab scores the split for concentration
 *   risk and net per sale.
 * - subscription comparison: own pattern club vs library placement — the
 *   breakeven where club pricing beats library royalties.
 * - verdict ladder: ready (split sane, nets healthy) / revise / blocked.
 * - every number traceable: net per sale = per-channel platformNet; HHIs,
 *   concentration flags, and breakevens are computed from those.
 */

import { platformNet } from './pattern-income-calculator';
import { safeNum } from './numeric-guard';

// ---- market constants (session-46 research, cited in the research file) ----

export interface DistributionMarket {
  /** LoveCrafts: 2% + $0.20 always; extra selling fee only between thresholds. */
  lovecraftsTransactionPct: number;
  lovecraftsFlatPerSale: number;
  lovecraftsExtraSellingPct: number;
  lovecraftsExtraLowThreshold: number;
  lovecraftsExtraHighThreshold: number;
  lovecraftsPaymentLagDays: number;
  /** Own website: Stripe-only processing. */
  ownStoreProcessingPct: number;
  ownStoreFlatPerSale: number;
  /** Subscription-library royalty per download, published anecdotal band. */
  libraryRoyaltyLow: number;
  libraryRoyaltyHigh: number;
  /** Typical pattern sale price band the designer prices inside. */
  salePriceLow: number;
  salePriceHigh: number;
  /** Club rate band (per pattern value at club membership rate). */
  clubRateLow: number;
  clubRateHigh: number;
  /** Concentration HHI thresholds: >0.5 one-channel dependent; >0.33 heavy. */
  hhiHeavy: number;
  hhiDominant: number;
  /** Monthly-sales band at which Ravelry's 3.5% commission starts. */
  ravelryCommissionThreshold: number;
}

export const SESSION_46_MARKET: DistributionMarket = {
  lovecraftsTransactionPct: 0.02,
  lovecraftsFlatPerSale: 0.2,
  lovecraftsExtraSellingPct: 0.035,
  lovecraftsExtraLowThreshold: 40,
  lovecraftsExtraHighThreshold: 1500,
  lovecraftsPaymentLagDays: 30,
  ownStoreProcessingPct: 0.029,
  ownStoreFlatPerSale: 0.3,
  libraryRoyaltyLow: 0.01,
  libraryRoyaltyHigh: 0.45,
  salePriceLow: 5,
  salePriceHigh: 12,
  clubRateLow: 3,
  clubRateHigh: 8,
  hhiHeavy: 0.33,
  hhiDominant: 0.5,
  ravelryCommissionThreshold: 30,
};

export function formatUsd(n: number): string {
  if (!Number.isFinite(n)) return '—';
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ---- types ----

export type DistributionChannelId =
  | 'ravelry' | 'etsy' | 'ribblr' | 'payhip' | 'lovecrafts' | 'ownstore' | 'library' | 'club';

export const DISTRIBUTION_CHANNELS: DistributionChannelId[] = [
  'ravelry', 'etsy', 'ribblr', 'payhip', 'lovecrafts', 'ownstore', 'library', 'club',
];

export const CHANNEL_LABELS: Record<DistributionChannelId, string> = {
  ravelry: 'Ravelry',
  etsy: 'Etsy',
  ribblr: 'Ribblr',
  payhip: 'Payhip',
  lovecrafts: 'LoveCrafts',
  ownstore: 'Own website',
  library: 'Subscription library',
  club: 'Own pattern club',
};

export interface ChannelAllocation {
  channel: DistributionChannelId;
  /** Share of expected monthly units assigned to this channel (0–1). */
  share: number;
}

export interface DistributionInputs {
  price: number;
  monthlyUnits: number;
  allocations: ChannelAllocation[];
  /** Expected royalty per download on a subscription library (if placed). */
  libraryRoyaltyPerDownload: number;
  /** Expected club download rate: downloads per member per month (0–1). */
  clubDownloadsPerMember: number;
  clubMembers: number;
  clubRate: number;
  /** Months the designer expects to sell (pattern lifetime). */
  lifetimeMonths: number;
  /** Build cost the pattern must recover (design hours × hourly rate + fixed). */
  buildCost: number;
}

export const DEFAULT_DISTRIBUTION: DistributionInputs = {
  price: 6.5,
  monthlyUnits: 40,
  allocations: [
    { channel: 'ravelry', share: 0.6 },
    { channel: 'etsy', share: 0.3 },
    { channel: 'lovecrafts', share: 0.1 },
  ],
  libraryRoyaltyPerDownload: 0.1,
  clubDownloadsPerMember: 0.3,
  clubMembers: 0,
  clubRate: 5,
  lifetimeMonths: 24,
  buildCost: 156,
};

// ---- derived per-channel economics ----

export interface ChannelNet {
  channel: DistributionChannelId;
  label: string;
  units: number;
  gross: number;
  /** Net after all fees for the channel's units. Negative channels are capped at 0 and flagged. */
  net: number;
  netPerSale: number;
  effectiveFeePct: number;
  /** Platform-specific notes surfaced to the designer. */
  note: string;
  /** Non-sale channel: revenue model is royalties/club, not per-sale net. */
  royaltyMode: boolean;
}

/** LoveCrafts net (handbook May 2026): 2% + $0.20 on every sale; an extra
 *  selling fee applies only while monthly sales sit between the thresholds. */
function lovecraftsNet(price: number, units: number): number {
  const gross = price * units;
  if (gross <= 0 || units <= 0) return 0;
  const base = gross * SESSION_46_MARKET.lovecraftsTransactionPct + units * SESSION_46_MARKET.lovecraftsFlatPerSale;
  const extra = (gross >= SESSION_46_MARKET.lovecraftsExtraLowThreshold &&
                 gross < SESSION_46_MARKET.lovecraftsExtraHighThreshold)
    ? gross * SESSION_46_MARKET.lovecraftsExtraSellingPct
    : 0;
  return Math.round((base + extra) * 100) / 100;
}

function ownStoreNet(price: number, units: number): number {
  const gross = price * units;
  const fees = gross * SESSION_46_MARKET.ownStoreProcessingPct + units * SESSION_46_MARKET.ownStoreFlatPerSale;
  return Math.round(fees * 100) / 100;
}

const CHANNEL_NETTER: Record<
  Exclude<DistributionChannelId, 'library' | 'club'>,
  (price: number, units: number) => number
> = {
  ravelry: (price, units) => platformNet('ravelry', price, Math.max(units, 1)).totalFees,
  etsy: (price, units) => platformNet('etsy', price, Math.max(units, 1)).totalFees,
  ribblr: (price, units) => platformNet('ribblr', price, Math.max(units, 1)).totalFees,
  payhip: (price, units) => platformNet('payhip', price, Math.max(units, 1)).totalFees,
  lovecrafts: lovecraftsNet,
  ownstore: ownStoreNet,
};

export interface DistributionResult {
  channels: ChannelNet[];
  totalGross: number;
  totalNet: number;
  totalFees: number;
  /** Herfindahl index of the allocation (1 = one channel, lower = spread). */
  hhi: number;
  /** Dominant channel share (max allocation share). */
  dominantShare: number;
  /** Lifetime net at the current allocation. */
  lifetimeNet: number;
  /** Months to recover build cost at the current allocation. */
  monthsToRecover: number;
  /** Subscription comparison. */
  subscription: {
    clubMonthlyNet: number;
    clubAnnualNet: number;
    libraryAnnualNetAtUnits: number;
    /** Units per month at which the library matches the club's monthly net. */
    libraryBreakevenUnits: number;
    verdict: 'club_wins' | 'library_wins' | 'neither_active';
  };
  flags: { code: string; severity: 'error' | 'warning' | 'info'; message: string }[];
  verdict: 'ready' | 'revise' | 'blocked';
  verdictReason: string;
  moneyLine: string;
}

function bounded(raw: unknown, min: number, max: number, fallback: number): number {
  const value = safeNum(typeof raw === 'number' ? raw : String(raw ?? ''), fallback);
  return Math.min(max, Math.max(min, value));
}

export function normalizeDistributionInputs(raw: Partial<DistributionInputs> = {}): DistributionInputs {
  const merged = { ...DEFAULT_DISTRIBUTION, ...raw };
  const hasExplicitAllocations = Object.prototype.hasOwnProperty.call(raw, 'allocations');
  const allocations = hasExplicitAllocations && Array.isArray(merged.allocations)
    ? merged.allocations
        .filter((a) => DISTRIBUTION_CHANNELS.includes(a.channel))
        .map((a) => ({ channel: a.channel, share: bounded(a.share, 0, 1, 0) }))
        .filter((a) => a.share > 0)
    : DEFAULT_DISTRIBUTION.allocations;
  return {
    price: bounded(merged.price, 0.01, 1_000_000, DEFAULT_DISTRIBUTION.price),
    monthlyUnits: Math.round(bounded(merged.monthlyUnits, 0, 10_000_000, DEFAULT_DISTRIBUTION.monthlyUnits)),
    allocations,
    libraryRoyaltyPerDownload: bounded(merged.libraryRoyaltyPerDownload, 0, 2.45, DEFAULT_DISTRIBUTION.libraryRoyaltyPerDownload),
    clubDownloadsPerMember: bounded(merged.clubDownloadsPerMember, 0, 1, DEFAULT_DISTRIBUTION.clubDownloadsPerMember),
    clubMembers: Math.round(bounded(merged.clubMembers, 0, 10_000_000, DEFAULT_DISTRIBUTION.clubMembers)),
    clubRate: bounded(merged.clubRate, 0, 10_000, DEFAULT_DISTRIBUTION.clubRate),
    lifetimeMonths: Math.round(bounded(merged.lifetimeMonths, 1, 120, DEFAULT_DISTRIBUTION.lifetimeMonths)),
    buildCost: bounded(merged.buildCost, 0, 100_000_000, DEFAULT_DISTRIBUTION.buildCost),
  };
}

export function analyzeDistribution(raw?: Partial<DistributionInputs>): DistributionResult {
  const inputs = normalizeDistributionInputs(raw);
  const price = inputs.price;
  const monthlyUnits = inputs.monthlyUnits;
  const lifetimeMonths = inputs.lifetimeMonths;
  const buildCost = inputs.buildCost;

  const flags: DistributionResult['flags'] = [];

  // ---- allocation hygiene ----
  const valid = inputs.allocations.filter(
    (a) => DISTRIBUTION_CHANNELS.includes(a.channel) && Number.isFinite(a.share) && a.share > 0,
  );
  // Normalize shares to 1 among sale channels (library/club are additive models).
  const saleChannels = valid.filter((a) => a.channel !== 'library' && a.channel !== 'club');
  const saleSum = saleChannels.reduce((s, a) => s + a.share, 0);
  const norm = saleSum > 0 ? saleSum : 1;

  const channels: ChannelNet[] = valid.map((a) => {
    const units = (monthlyUnits * a.share) / norm;
    const gross = price * units;
    if (a.channel === 'library') {
      const lib = SESSION_46_MARKET;
      const libraryUnits = units;
      const net = libraryUnits * Math.min(Math.max(inputs.libraryRoyaltyPerDownload, 0), lib.libraryRoyaltyHigh + 2);
      return {
        channel: 'library', label: CHANNEL_LABELS.library, units: libraryUnits, gross, net,
        netPerSale: units > 0 ? Math.round((net / units) * 100) / 100 : 0,
        effectiveFeePct: 0,
        royaltyMode: true,
        note: units > 0
          ? `Library placement trades the ${formatUsd(price)} sale for ~${formatUsd(inputs.libraryRoyaltyPerDownload)}/download — ${formatUsd(price - inputs.libraryRoyaltyPerDownload)} less per use than a sale at the same traffic.`
          : 'Not active — library placement is off.',
      };
    }
    if (a.channel === 'club') {
      const memberDownloads = inputs.clubMembers * inputs.clubDownloadsPerMember;
      const net = memberDownloads * inputs.clubRate;
      return {
        channel: 'club', label: CHANNEL_LABELS.club, units: Math.round(memberDownloads * 10) / 10, gross: net, net,
        netPerSale: memberDownloads > 0 ? Math.round((net / memberDownloads) * 100) / 100 : 0,
        effectiveFeePct: 0,
        royaltyMode: true,
        note: inputs.clubMembers > 0
          ? `${inputs.clubMembers} members × ${inputs.clubDownloadsPerMember} downloads/mo × ${formatUsd(inputs.clubRate)}/pattern-value = ${formatUsd(net)}/mo — paid to you directly, no platform cut.`
          : 'Not active — set member count to model your own club.',
      };
    }
    const fees = CHANNEL_NETTER[a.channel](price, Math.max(units, 1));
    const net = Math.max(gross - fees, 0);
    const netPerSale = units > 0 ? Math.round((net / units) * 100) / 100 : 0;
    const effectiveFeePct = gross > 0 ? Math.round((fees / gross) * 1000) / 10 : 0;
    const notes: Record<Exclude<DistributionChannelId, 'library' | 'club'>, string> = {
      ravelry: gross >= SESSION_46_MARKET.ravelryCommissionThreshold
        ? `3.5% commission active above ${formatUsd(SESSION_46_MARKET.ravelryCommissionThreshold)}/mo — this channel carries ${formatUsd(gross)}/mo gross.`
        : `Below ${formatUsd(SESSION_46_MARKET.ravelryCommissionThreshold)}/mo Ravelry charges no commission — best per-sale net of any marketplace (${formatUsd(netPerSale)}/sale).`,
      etsy: `Listing fee amortized per sale plus 6.5% transaction + 3% + $0.25 processing — fixed per-sale fees bite hardest below ~10 sales/mo.`,
      ribblr: `4% or $0.25 (whichever is greater) + Stripe 2.9% + $0.30 — and Ribblr locks the pattern into its interactive format (documented lock-in flaw).`,
      payhip: `5% transaction + processing on the free plan — bring-your-own-traffic channel; pay-what-you-want is its one real edge.`,
      lovecrafts: `2% + $0.20 on every sale${gross >= SESSION_46_MARKET.lovecraftsExtraLowThreshold && gross < SESSION_46_MARKET.lovecraftsExtraHighThreshold ? ` + ${SESSION_46_MARKET.lovecraftsExtraSellingPct * 100}% selling fee (monthly sales sit between ${formatUsd(SESSION_46_MARKET.lovecraftsExtraLowThreshold)} and ${formatUsd(SESSION_46_MARKET.lovecraftsExtraHighThreshold)})` : ''} — payment arrives ~${SESSION_46_MARKET.lovecraftsPaymentLagDays} days in arrears.`,
      ownstore: `Stripe-only processing — best net of any channel (${formatUsd(netPerSale)}/sale) but all traffic is on you; no discovery audience at all.`,
    };
    return {
      channel: a.channel, label: CHANNEL_LABELS[a.channel], units, gross, net,
      netPerSale, effectiveFeePct, royaltyMode: false, note: notes[a.channel],
    };
  });

  // ---- concentration ----
  const shares = valid.map((a) => (a.channel !== 'library' && a.channel !== 'club') ? a.share / norm : 0);
  const hhi = Math.round(shares.reduce((s, x) => s + x * x, 0) * 100) / 100;
  const dominantShare = shares.length > 0 ? Math.max(...shares) : 0;
  const dominantChannel = valid.find((a) => a.channel !== 'library' && a.channel !== 'club' && a.share / norm === dominantShare);

  if (valid.length === 0) {
    flags.push({ code: 'D-01', severity: 'error', message: 'No distribution channels selected — the portfolio is empty, so every sale this month is $0 on paper. Pick at least one channel.' });
  } else if (valid.length === 1 && valid[0].channel !== 'library' && valid[0].channel !== 'club') {
    flags.push({ code: 'D-01', severity: 'warning', message: `${CHANNEL_LABELS[valid[0].channel]} carries 100% of expected sales (HHI 1.0). Liz Corke's Ravelry-exit report and every platform fee-change history say the same thing: one channel is one policy change away from a revenue cliff.` });
  } else if (hhi > SESSION_46_MARKET.hhiDominant) {
    flags.push({ code: 'D-01', severity: 'warning', message: `${CHANNEL_LABELS[dominantChannel?.channel ?? 'ravelry']} carries ${Math.round(dominantShare * 100)}% of expected sales (HHI ${hhi.toFixed(2)} > 0.50). Concentration risk is high — the channel owns the customer relationship, not you.` });
  } else if (hhi > SESSION_46_MARKET.hhiHeavy) {
    flags.push({ code: 'D-01', severity: 'info', message: `Portfolio HHI ${hhi.toFixed(2)} — weighted toward ${CHANNEL_LABELS[dominantChannel?.channel ?? 'ravelry']} at ${Math.round(dominantShare * 100)}% of sales. Acceptable, but a second channel with real share would cut the cliff.` });
  }

  // ---- fee sanity: channel whose effective cut exceeds half the price ----
  const brutal = channels.find((c) => !c.royaltyMode && c.gross > 0 && c.effectiveFeePct > 40);
  if (brutal) {
    flags.push({ code: 'D-02', severity: 'warning', message: `${brutal.label} keeps only ${formatUsd(brutal.netPerSale)}/sale of the ${formatUsd(price)} price (${brutal.effectiveFeePct}% effective cut) — check that channel is earning its traffic.` });
  }

  // ---- low-traffic Etsy warning: listing fee amortization ----
  const etsyEntry = channels.find((c) => c.channel === 'etsy');
  if (etsyEntry && etsyEntry.units < 5) {
    flags.push({ code: 'D-03', severity: 'info', message: `Etsy at ~${etsyEntry.units.toFixed(1)} sales/mo pays $0.20/listing renewal every 4 months plus 9.5% + $0.25 per sale — the slow tail eats ~${formatUsd(0.2 + 0.25 * (monthlyUnits * (etsyEntry.units / (etsyEntry.units > 0 ? 1 : 1))))}/mo in fixed charges against thin volume.` });
  }

  // ---- subscription comparison ----
  const clubMonthlyNet = inputs.clubMembers > 0
    ? Math.round(inputs.clubMembers * inputs.clubDownloadsPerMember * inputs.clubRate * 100) / 100
    : 0;
  const royalty = Math.min(Math.max(inputs.libraryRoyaltyPerDownload, 0), 5);
  const libraryAnnualNetAtUnits = Math.round(royalty * monthlyUnits * 12 * 100) / 100;
  const libraryBreakevenUnits = royalty > 0
    ? Math.max(clubMonthlyNet / royalty, 0)
    : Infinity;
  const subscription: DistributionResult['subscription'] = {
    clubMonthlyNet,
    clubAnnualNet: Math.round(clubMonthlyNet * 12 * 100) / 100,
    libraryAnnualNetAtUnits,
    libraryBreakevenUnits: Number.isFinite(libraryBreakevenUnits) ? Math.round(libraryBreakevenUnits * 10) / 10 : Infinity,
    verdict: clubMonthlyNet <= 0
      ? 'neither_active'
      : royalty * monthlyUnits >= clubMonthlyNet
        ? 'library_wins'
        : 'club_wins',
  };
  if (clubMonthlyNet > 0 && royalty > 0) {
    if (subscription.verdict === 'club_wins') {
      flags.push({ code: 'D-04', severity: 'info', message: `Your club (${formatUsd(clubMonthlyNet)}/mo) beats library placement of the same traffic (${formatUsd(royalty * monthlyUnits)}/mo) — the library would need ${subscription.libraryBreakevenUnits.toFixed(1)} downloads/mo just to match it.` });
    } else {
      flags.push({ code: 'D-04', severity: 'warning', message: `Library placement (${formatUsd(royalty * monthlyUnits)}/mo at ${formatUsd(royalty)}/download) currently beats your club (${formatUsd(clubMonthlyNet)}/mo) — either the library is paying unusually well (rare) or the club rate/members need a look.` });
    }
  }

  // ---- totals ----
  const totalGross = Math.round(channels.reduce((s, c) => s + c.gross, 0) * 100) / 100;
  const totalNet = Math.round(channels.reduce((s, c) => s + c.net, 0) * 100) / 100;
  const totalFees = Math.round(Math.max(totalGross - totalNet, 0) * 100) / 100;
  const lifetimeNet = Math.round(totalNet * lifetimeMonths * 100) / 100;
  const monthsToRecover = totalNet > 0 ? Math.round((buildCost / totalNet) * 10) / 10 : Infinity;

  // ---- verdict ----
  const hasError = flags.some((f) => f.severity === 'error');
  const hasWarning = flags.some((f) => f.severity === 'warning');
  let verdict: DistributionResult['verdict'];
  let verdictReason: string;
  if (hasError) {
    verdict = 'blocked';
    verdictReason = `Resolve the errors before settling the distribution split — an empty portfolio (or a channel you cannot price) means the launch math doesn't exist yet.`;
  } else if (hhi > SESSION_46_MARKET.hhiDominant || hasWarning) {
    verdict = 'revise';
    verdictReason = `${hhi.toFixed(2)} HHI and ${totalFees > 0 ? formatUsd(totalFees) + '/mo in fees' : 'fee exposure'} — the split will launch, but the concentration cliff and the per-channel cut are exactly what a bad quarter is made of.`;
  } else {
    verdict = 'ready';
    verdictReason = `Split is sane (HHI ${hhi.toFixed(2)}), nets ${formatUsd(totalNet)}/mo on ${formatUsd(totalGross)} gross — ${formatUsd(totalFees)}/mo in fees across ${valid.length} channels. No channel keeps more than half the sale.`;
  }

  const moneyLine = `A $6 pattern nets ~${formatUsd(platformNet('ravelry', 6, Math.max(monthlyUnits, 1)).netPerSale)} on Ravelry, ~${formatUsd(platformNet('etsy', 6, Math.max(monthlyUnits, 1)).netPerSale)} on Etsy and ~${formatUsd(6 - lovecraftsNet(6, 1))} on LoveCrafts (per sale) — the same pattern, different take-homes; MediaPeruana needed ~24 copies at $6.50 just to break even on the build, and library placements pay $0.01–$0.45 per download against that. This lab is the only place the whole portfolio is priced on one page.`;

  return {
    channels, totalGross, totalNet, totalFees, hhi, dominantShare, lifetimeNet,
    monthsToRecover, subscription, flags, verdict, verdictReason, moneyLine,
  };
}
