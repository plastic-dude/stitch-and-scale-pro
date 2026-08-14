/**
 * Take-Rate War Lab — engine (CHK-072)
 *
 * Prices the REAL take per sale across the six marketplaces a pattern
 * designer actually uses: Etsy, Ravelry, LoveCrafts, Ribblr, Payhip and
 * an own-site Stripe checkout. Sticker percentages mislead on $4-10
 * patterns — fixed per-sale tolls ($0.20-$0.80) decide the real take, and
 * monthly thresholds (Ravelry $30/$1,500; LoveCrafts $40) flip effective
 * rates as volume scales. Every constant below is cited in the research
 * file research/competitors-session-72-marketplace-takerate.md.
 */

export type ChannelId =
  | 'etsy'
  | 'ravelry'
  | 'lovecrafts'
  | 'ribblr'
  | 'payhip'
  | 'own-site';

export interface ChannelSpec {
  id: ChannelId;
  label: string;
  /** Per-sale units/month the designer expects on this channel. */
  unitsPerMonth: number;
  /** Average price per sale on this channel ($). */
  price: number;
  /** Share of sales that arrive via Etsy Offsite Ads (0-1, Etsy only). */
  offsiteAdsShare: number;
  /** Whether the channel has an audience the designer rents (discovery). */
  hasAudience: boolean;
}

export const CHANNEL_LABELS: Record<ChannelId, string> = {
  etsy: 'Etsy',
  ravelry: 'Ravelry',
  lovecrafts: 'LoveCrafts',
  ribblr: 'Ribblr',
  payhip: 'Payhip (free)',
  'own-site': 'Own site (Stripe)',
};

export interface MarketplaceTakeRateInput {
  currency: string;
  currencySymbol: string;
  /** US-seller assumptions for the fee math. */
  sellerRegion: 'us' | 'uk-eu';
  channels: ChannelSpec[];
  /** Offsite Ads fee for the seller's tier: 15% default, 12% above $10k/yr. */
  offsiteAdsRate: number;
  /** Ravelry PayPal processing (legacy 2.9% + $0.30; flagged if PayPal fee tier rose). */
  ravelryPayPalPct: number;
  ravelryPayPalFixed: number;
  /** Whether the seller has cleared the Ravelry $1,500/mo commission-free ceiling. */
  ravelryHighTier: boolean;
}

export const DEFAULT_TAKE_RATE: MarketplaceTakeRateInput = {
  currency: 'USD',
  currencySymbol: '$',
  sellerRegion: 'us',
  offsiteAdsRate: 0.15,
  ravelryPayPalPct: 0.029,
  ravelryPayPalFixed: 0.3,
  ravelryHighTier: false,
  channels: [
    { id: 'etsy', label: 'Etsy', unitsPerMonth: 40, price: 6.5, offsiteAdsShare: 0.15, hasAudience: true },
    { id: 'ravelry', label: 'Ravelry', unitsPerMonth: 25, price: 8.0, offsiteAdsShare: 0, hasAudience: true },
    { id: 'lovecrafts', label: 'LoveCrafts', unitsPerMonth: 10, price: 7.5, offsiteAdsShare: 0, hasAudience: true },
    { id: 'ribblr', label: 'Ribblr', unitsPerMonth: 8, price: 5.5, offsiteAdsShare: 0, hasAudience: false },
    { id: 'payhip', label: 'Payhip (free)', unitsPerMonth: 15, price: 7.0, offsiteAdsShare: 0, hasAudience: false },
    { id: 'own-site', label: 'Own site (Stripe)', unitsPerMonth: 20, price: 7.0, offsiteAdsShare: 0, hasAudience: false },
  ],
};

export interface Flag {
  code: string;
  title: string;
  detail: string;
}

export interface ChannelBreakdown {
  channel: ChannelId;
  label: string;
  revenue: number;
  /** Total marketplace/platform cut across the month (fees + tolls). */
  totalFees: number;
  effectiveTakePct: number;
  netPerSale: number;
  netPerMonth: number;
  /** Fixed-fee toll portion of the month's fees (the hidden %). */
  fixedToll: number;
  /** Share of monthly fees due to Offsite Ads (Etsy). */
  offsiteAdsFees: number;
  /** Payout lag in days (cash-flow impact). */
  payoutLagDays: number;
}

export interface ThresholdAlert {
  channel: ChannelId;
  label: string;
  crossing: 'entering' | 'already-in' | 'above-ceiling';
  detail: string;
}

export interface TakeRateResult {
  totalRevenue: number;
  totalFees: number;
  totalNet: number;
  overallTakePct: number;
  channels: ChannelBreakdown[];
  /** Channels ranked worst-to-best by effective take %. */
  feeLeakRanking: { channel: ChannelId; label: string; effectiveTakePct: number }[];
  thresholdAlerts: ThresholdAlert[];
  /** Annualized revenue exposure to each platform's fee-inflation history. */
  annualNetByChannel: { channel: ChannelId; label: string; annualNet: number }[];
  /** Share of net revenue on channels with NO audience (discovery risk). */
  discoveryFreeNetShare: number;
  /** Share of net revenue on the single largest channel (concentration). */
  concentrationShare: number;
  flags: Flag[];
  verdict: string;
  verdictNote: string;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function fmt$(n: number, sym: string = '$'): string {
  const rounded = Math.round(Math.abs(n) * 100) / 100;
  return `${n < 0 ? '−' : ''}${sym}${rounded.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ---- Per-platform fee schedules (verified Aug 2026) ----
// All "net per sale" = price − platform fees − payment processing.

const ETSY = { listingRenewal: 0.2, transactionPct: 0.065, regOpPct: 0.0021, processingPct: 0.03, processingFixed: 0.25, offsiteMinPct: 0.15, offsiteMinPrice: 10 };

function etsyNetPerSale(price: number, offsiteAdsShare: number, offsiteAdsRate: number): number {
  // Etsy charges listing $0.20/sale (auto-renew per sale), 6.5% transaction,
  // 0.21% regulatory operating fee, 3% + $0.25 payment processing.
  const listing = ETSY.listingRenewal;
  const transaction = price * ETSY.transactionPct;
  const regOp = price * ETSY.regOpPct;
  const processing = price * ETSY.processingPct + ETSY.processingFixed;
  // Offsite Ads fee: 15% of sales arriving via offsite ads (12% once >$10k/yr).
  // Only a share of monthly sales arrive that way; model linearly.
  const adsShare = Math.max(0, Math.min(1, offsiteAdsShare));
  const adsFee = price * offsiteAdsRate * adsShare;
  return round2(price - listing - transaction - regOp - processing - adsFee);
}

function ravelryNetPerSale(
  price: number,
  monthlySales: number,
  highTier: boolean,
  ppPct: number,
  ppFixed: number,
): number {
  // Ravelry: 3.5% commission only between $30 and $1,500/mo of sales;
  // pays via PayPal only (legacy 2.9% + $0.30 processing pass-through).
  let commission = 0;
    if (highTier || monthlySales >= 1500) {
    commission = 0; // above the $1,500 ceiling the commission is removed
  } else if (monthlySales >= 30) {
    commission = price * 0.035;
  }
  const pp = price * ppPct + ppFixed;
  return round2(price - commission - pp);
}

function lovecraftsNetPerSale(price: number, monthlySales: number): number {
  // LoveCrafts: 2% + $0.20 base; additional selling fee 5% of month total
  // when monthly revenue sits between $40 and $1,500 (CartMango Aug-2026;
  // the 2021-era guide quoted 3.5% — the higher 5% is the defensive model).
  const base = price * 0.02 + 0.2;
  const extra = monthlySales >= 40 && monthlySales < 1500 ? price * 0.05 : 0;
  return round2(price - base - extra);
}

const RIBBLR_FLOOR = 0.25;
const STRIPE_PCT = 0.029;
const STRIPE_FIXED = 0.3;

function ribblrNetPerSale(price: number): number {
  // Ribblr: 4% or $0.25 minimum per pattern — the floor is the silent killer
  // on cheap patterns ($3.84 median → 6.5% real rate; $1.99 → 12.6%).
  const fee = Math.max(price * 0.04, RIBBLR_FLOOR);
  const processing = price * STRIPE_PCT + STRIPE_FIXED;
  return round2(price - fee - processing);
}

const PAYHIP_FREE_PCT = 0.05;

function payhipNetPerSale(price: number): number {
  // Payhip free plan: 5% platform fee + Stripe/PayPal processing 2.9%+$0.30.
  const platform = price * PAYHIP_FREE_PCT;
  const processing = price * STRIPE_PCT + STRIPE_FIXED;
  return round2(price - platform - processing);
}

function ownSiteNetPerSale(price: number): number {
  // Own site, Stripe only: no platform cut.
  return round2(price - (price * STRIPE_PCT + STRIPE_FIXED));
}

function netFor(channel: ChannelSpec, input: MarketplaceTakeRateInput, monthlyChannelSales: number): number {
  switch (channel.id) {
    case 'etsy': return etsyNetPerSale(channel.price, channel.offsiteAdsShare, input.offsiteAdsRate);
    case 'ravelry': return ravelryNetPerSale(channel.price, monthlyChannelSales, input.ravelryHighTier, input.ravelryPayPalPct, input.ravelryPayPalFixed);
    case 'lovecrafts': return lovecraftsNetPerSale(channel.price, monthlyChannelSales);
    case 'ribblr': return ribblrNetPerSale(channel.price);
    case 'payhip': return payhipNetPerSale(channel.price);
    case 'own-site': return ownSiteNetPerSale(channel.price);
  }
}

function grossFixedTollFor(channel: ChannelSpec): number {
  // The portion of per-sale fees that is a flat cent-amount (the hidden %).
  switch (channel.id) {
    case 'etsy': return ETSY.listingRenewal + ETSY.processingFixed; // $0.45
    case 'ravelry': return 0; // no platform fixed fee; PayPal fixed is payment processing
    case 'lovecrafts': return 0.2;
    case 'ribblr': return RIBBLR_FLOOR + STRIPE_FIXED; // $0.55 (floor dominates below $6.25)
    case 'payhip': return STRIPE_FIXED;
    case 'own-site': return STRIPE_FIXED;
  }
}

function payoutLagDays(channel: ChannelId): number {
  // Etsy ~3 days rolling; Ravelry PayPal payouts ~1-7 days; LoveCrafts pays
  // a month in arrears on the 20th-25th (~25-55 days lag); Ribblr monthly
  // payouts (~30 days); Payhip instant-to-3-days on Stripe; own site Stripe
  // 2-7 day rolling.
  switch (channel) {
    case 'etsy': return 3;
    case 'ravelry': return 7;
    case 'lovecrafts': return 45;
    case 'ribblr': return 30;
    case 'payhip': return 3;
    case 'own-site': return 7;
  }
}

export function analyzeTakeRate(input: MarketplaceTakeRateInput): TakeRateResult {
  const flags: Flag[] = [];
  const monthlySalesByChannel = new Map<ChannelId, number>();
  let totalRevenue = 0;
  let totalFees = 0;
  let totalNet = 0;
  let discoveryFreeNet = 0;
  const breakdowns: ChannelBreakdown[] = [];

  for (const ch of input.channels) {
    const units = Math.max(0, ch.unitsPerMonth);
    const price = Math.max(0.01, ch.price);
    const revenue = round2(units * price);
    monthlySalesByChannel.set(ch.id, revenue);
    const netPerSale = netFor(ch, input, revenue);
    const netPerMonth = round2(units * netPerSale);
    const fees = round2(revenue - netPerMonth);
    const fixedToll = round2(units * grossFixedTollFor(ch));
    const offsiteAdsFees = ch.id === 'etsy'
      ? round2(units * price * input.offsiteAdsRate * Math.max(0, Math.min(1, ch.offsiteAdsShare)))
      : 0;
    breakdowns.push({
      channel: ch.id,
      label: ch.label,
      revenue,
      totalFees: fees,
      effectiveTakePct: revenue > 0 ? round2((fees / revenue) * 100) : 0,
      netPerSale,
      netPerMonth,
      fixedToll,
      offsiteAdsFees,
      payoutLagDays: payoutLagDays(ch.id),
    });
    totalRevenue = round2(totalRevenue + revenue);
    totalFees = round2(totalFees + fees);
    totalNet = round2(totalNet + netPerMonth);
    if (!ch.hasAudience) discoveryFreeNet = round2(discoveryFreeNet + netPerMonth);
  }

  const feeLeakRanking = [...breakdowns]
    .filter(b => b.revenue > 0)
    .sort((a, b) => b.effectiveTakePct - a.effectiveTakePct)
    .map(b => ({ channel: b.channel, label: b.label, effectiveTakePct: b.effectiveTakePct }));

  const annualNetByChannel = breakdowns.map(b => ({
    channel: b.channel,
    label: b.label,
    annualNet: round2(b.netPerMonth * 12),
  }));

  // ---- Threshold alerts ----
  const thresholdAlerts: ThresholdAlert[] = [];
  for (const b of breakdowns) {
    if (b.channel === 'ravelry') {
      const r = monthlySalesByChannel.get('ravelry') ?? 0;
      if (!input.ravelryHighTier) {
        if (r < 30) {
          thresholdAlerts.push({
            channel: 'ravelry',
            label: 'Ravelry',
            crossing: 'already-in',
            detail: `At ${fmt$(r, input.currencySymbol)}/mo you are under Ravelry's $30 threshold — commission-free, PayPal-only ($0.30 flat per sale is ~${r > 0 ? ((0.3 / (r / Math.max(1, Math.max(0.01, (input.channels.find(c => c.id === 'ravelry')?.price ?? 8)))) * 100).toFixed(0)) : 0}% of a cheap sale). If volume grows past $30/mo, the 3.5% commission kicks in on every sale; at $60/mo that is ~$2.10/mo gone. A $0.30 flat per-sale toll is ${(0.3 / Math.max(0.01, (input.channels.find(c => c.id === 'ravelry')?.price ?? 8)) * 100).toFixed(0)}% of a $${(input.channels.find(c => c.id === 'ravelry')?.price ?? 8).toFixed(2)} pattern — at cheap pattern prices the cents matter more than the percent.`,
          });
        } else if (r < 1500) {
          thresholdAlerts.push({
            channel: 'ravelry',
            label: 'Ravelry',
            crossing: 'entering',
            detail: `Ravelry's 3.5% commission is active (${fmt$(r, input.currencySymbol)}/mo sits between the $30 floor and $1,500 ceiling). That is ~${(r * 0.035).toFixed(2)}/mo in commission — it disappears entirely once you cross $1,500/mo, where the platform is again commission-free.`,
          });
        } else {
          thresholdAlerts.push({
            channel: 'ravelry',
            label: 'Ravelry',
            crossing: 'above-ceiling',
            detail: `At ${fmt$(r, input.currencySymbol)}/mo you are above Ravelry's $1,500 ceiling — commission removed. The only deduction left is PayPal processing.`,
          });
        }
      } else {
        thresholdAlerts.push({
          channel: 'ravelry',
          label: 'Ravelry',
          crossing: 'above-ceiling',
          detail: 'High-tier mode: Ravelry commission modeled as removed (above the $1,500/mo ceiling).',
        });
      }
    }
    if (b.channel === 'lovecrafts') {
      const l = monthlySalesByChannel.get('lovecrafts') ?? 0;
      if (l >= 40 && l < 1500) {
        thresholdAlerts.push({
          channel: 'lovecrafts',
          label: 'LoveCrafts',
          crossing: 'entering',
          detail: `LoveCrafts' extra 5% selling fee is active (${fmt$(l, input.currencySymbol)}/mo sits between $40 and $1,500). On top of 2% + $0.20, this costs ~${(l * 0.05).toFixed(2)}/mo.`,
        });
      } else if (l >= 1500) {
        thresholdAlerts.push({
          channel: 'lovecrafts',
          label: 'LoveCrafts',
          crossing: 'above-ceiling',
          detail: `Above LoveCrafts' $1,500/mo the extra selling fee drops; base 2% + $0.20 remains (${fmt$(l, input.currencySymbol)}/mo).`,
        });
      }
    }
  }

  // ---- Flags ----
  for (const b of breakdowns) {
    const price = (input.channels.find(c => c.id === b.channel)?.price) ?? 0;
    const ch = input.channels.find(c => c.id === b.channel) ?? ({} as ChannelSpec);
    // TR-01 fixed-fee toll zone: fixed fees > 25% of the take on this channel
    if (b.revenue > 0 && ch.price !== undefined && ch.price < 6.25 && b.fixedToll / b.revenue > 0.2) {
      flags.push({
        code: 'TR-01',
        title: `${b.label}: cheap prices pay the fixed toll`,
        detail: `At $${ch.price.toFixed(2)} average, fixed fees ($${grossFixedTollFor(ch).toFixed(2)}/sale) eat ${((b.fixedToll / b.revenue) * 100).toFixed(0)}% of this channel's revenue. Three of four sampled listings sit under the $6.25 line where floors dominate — bundle or re-anchor above it.`,
      });
    }
    // TR-02 Offsite Ads exposure
    if (b.channel === 'etsy' && ch.offsiteAdsShare > 0.1 && b.offsiteAdsFees > 1) {
      flags.push({
        code: 'TR-02',
        title: `${b.label}: Offsite Ads leak — ${(ch.offsiteAdsShare * 100).toFixed(0)}% of sales pay ${((input.offsiteAdsRate) * 100).toFixed(0)}%`,
        detail: `Etsy charges ${((input.offsiteAdsRate) * 100).toFixed(0)}% on every sale that arrives via its ads — and once a shop crosses $10k/yr the program is mandatory at 12%. At ${((ch.offsiteAdsShare) * 100).toFixed(0)}% offsite share this costs ~${fmt$(b.offsiteAdsFees, input.currencySymbol)}/mo. Push search-SEO listings to cut that share.`,
      });
    }
    // TR-03 payout lag
    if (b.payoutLagDays >= 30 && b.netPerMonth > 0) {
      flags.push({
        code: 'TR-03',
        title: `${b.label}: ${b.payoutLagDays}-day payout lag`,
        detail: `LoveCrafts pays a month in arrears and Ribblr pays monthly — at ${fmt$(b.netPerMonth, input.currencySymbol)}/mo that is up to ~${fmt$(b.netPerMonth * (b.payoutLagDays / 30), input.currencySymbol)} of float tied up in transit. Etsy/Payhip pay in days.`,
      });
    }
    // TR-04 delisting exposure
    if (b.channel === 'lovecrafts' || b.channel === 'etsy') {
      const share = totalNet > 0 ? (b.netPerMonth / totalNet) * 100 : 0;
      if (share > 20) {
        flags.push({
          code: 'TR-04',
          title: `${b.label}: delisting risk on ${share.toFixed(0)}% of net`,
          detail: `${b.label} controls the listing and can delist (LoveCrafts discontinued/culled much of its indie library in 2023-24; Etsy suspends for IP complaints). Keep a mirror on Ravelry + own site for everything above ~20% of net.`,
        });
      }
    }
    // TR-05 fee-inflation history
    if (b.channel === 'etsy' || b.channel === 'payhip' || b.channel === 'ravelry') {
      const share = totalNet > 0 ? (b.netPerMonth / totalNet) * 100 : 0;
      if (share > 25) {
        flags.push({
          code: 'TR-05',
          title: `${b.label}: fee-inflation history — ${share.toFixed(0)}% of net exposed`,
          detail: `Etsy moved 5% → 6.5% (2022), Gumroad 3.5% → 10% (2023), LoveCrafts rose repeatedly, and Ravelry's fee table now hides behind a login. ${share.toFixed(0)}% of your net sits on a platform that has already raised prices once — diversify before the next increase lands.`,
        });
      }
    }
  }

  // TR-06 concentration risk
  const byNet = [...breakdowns].sort((a, b) => b.netPerMonth - a.netPerMonth);
  const topNet = byNet[0]?.netPerMonth ?? 0;
  const concentrationShare = totalNet > 0 ? (topNet / totalNet) * 100 : 0;
  if (concentrationShare > 50) {
    flags.push({
      code: 'TR-06',
      title: `One channel carries ${concentrationShare.toFixed(0)}% of net`,
      detail: `${byNet[0]?.label} is the single largest net line. One policy change (fee hike, delisting, payout suspension) takes half the business. Mirror listings and grow the runner-up channel.`,
    });
  }

  // TR-07 discovery-free share: no-audience channels have no organic lift
  const discoveryFreeNetShare = totalNet > 0 ? (discoveryFreeNet / totalNet) * 100 : 0;
  if (discoveryFreeNetShare > 40) {
    flags.push({
      code: 'TR-07',
      title: `${discoveryFreeNetShare.toFixed(0)}% of net has no discovery engine`,
      detail: `Payhip and own-site take zero platform cut for a reason — no one browses them. That revenue only exists if your email list, Instagram and Pinterest keep feeding it. If you are not actively marketing, this share quietly erodes.`,
    });
  }

    // TR-08 price-below-floor: Ribblr floor math
  for (const ch of input.channels) {
    if (ch.id === 'ribblr' && ch.price > 0 && ch.price < 6.25) {
      flags.push({
        code: 'TR-08',
        title: `Ribblr floor: $${ch.price.toFixed(2)} price pays ${(Math.max(0.04 * ch.price, 0.25) / ch.price * 100).toFixed(0)}%`,
        detail: `Ribblr's fee is 4% OR $0.25 minimum. Below $6.25 the floor applies — at $${ch.price.toFixed(2)} the real rate is ${(Math.max(0.04 * ch.price, 0.25) / ch.price * 100).toFixed(0)}%, not 4%. Only ~26% of sampled listings clear the line.`,
      });
    }
  }

  // TR-09 zero-volume channel with audience potential (churn / dead listing)
  const zeroChannels = input.channels.filter(c => c.unitsPerMonth <= 0 && c.hasAudience);
  if (zeroChannels.length > 0) {
    flags.push({
      code: 'TR-09',
      title: `${zeroChannels.map(c => c.label).join(', ')}: free listing, no sales`,
      detail: `Marketplace listings cost $0 to keep (Etsy renews at $0.20). A dormant free-channel listing is zero-risk exposure — upload the same pattern there too, it is the cheapest discovery you can buy.`,
    });
  }

  // ---- Verdict ladder ----
  const worst = feeLeakRanking[0];
  const best = feeLeakRanking[feeLeakRanking.length - 1];
  let verdict = '';
  let verdictNote = '';

  if (totalRevenue <= 0) {
    verdict = 'No sales modeled — enter units and prices per channel';
    verdictNote = 'Fill in expected monthly units and average price per channel to see the real take-rate war across Etsy, Ravelry, LoveCrafts, Ribblr, Payhip and your own site.';
  } else if (worst && worst.effectiveTakePct >= 20 && worst.effectiveTakePct - (best?.effectiveTakePct ?? 0) >= 10) {
    const diff = round2((breakdowns.find(b => b.channel === worst.channel)?.netPerMonth ?? 0) - ((worst.effectiveTakePct - best!.effectiveTakePct) / 100 * (breakdowns.find(b => b.channel === worst.channel)?.revenue ?? 0)));
    verdict = 'Move revenue from the leak channel — the gap pays for itself';
    verdictNote = `${worst.label} keeps ${(100 - worst.effectiveTakePct).toFixed(0)}¢ per $1 against ${best!.label}'s ${(100 - best!.effectiveTakePct).toFixed(0)}¢. The sticker % hides fixed tolls and thresholds — on ${fmt$(breakdowns.find(b => b.channel === worst.channel)!.revenue, input.currencySymbol)}/mo the gap is worth ~${fmt$(round2((worst.effectiveTakePct - (best?.effectiveTakePct ?? 0)) / 100 * (breakdowns.find(b => b.channel === worst.channel)?.revenue ?? 0)), input.currencySymbol)}/mo. Mirror listings on the cheaper channel before discounting; the audience trade is worth up to ~10% of margin.`;
  } else if (concentrationShare > 50) {
    verdict = 'Too dependent on one channel — diversify before the next fee hike';
    verdictNote = `${byNet[0].label} carries ${concentrationShare.toFixed(0)}% of net. Etsy has already moved 5%→6.5%, Gumroad 3.5%→10%, and LoveCrafts has culled libraries — a single policy change hits half the business. Growth moves: mirror everywhere free, push email-list capture to own-site, and treat the concentration channel as discovery, not banking.`;
  } else if (totalTakeHealthy(totalFees, totalRevenue) && discoveryFreeNetShare < 40 && concentrationShare <= 50) {
    verdict = 'Balanced portfolio — protect and grow';
    verdictNote = `Fees across all channels average ${overallTakePctLabel(totalFees, totalRevenue)} and no single channel or category dominates. Keep the mirrors current, watch the two threshold alerts, and funnel marketplace buyers into your own email list — the one asset no platform can devalue.`;
  } else {
    verdict = 'Trim the middle — consolidate to the best margin lines';
    verdictNote = `The middle channels (small units, high fixed tolls) earn the least per sale. Fold sub-5-unit channels into the nearest free mirror, bundle single patterns up past $6.25 to escape the floors, and re-run after the move.`;
  }

  return {
    totalRevenue,
    totalFees,
    totalNet,
    overallTakePct: totalRevenue > 0 ? round2((totalFees / totalRevenue) * 100) : 0,
    channels: breakdowns,
    feeLeakRanking,
    thresholdAlerts,
    annualNetByChannel,
    discoveryFreeNetShare: round2(discoveryFreeNetShare),
    concentrationShare: round2(concentrationShare),
    flags,
    verdict,
    verdictNote,
  };
}

function overallTakePctLabel(fees: number, revenue: number): string {
  return revenue > 0 ? `${((fees / revenue) * 100).toFixed(0)}% across the portfolio` : '0%';
}

function totalTakeHealthy(fees: number, revenue: number): boolean {
  return revenue > 0 && fees / revenue < 0.15;
}
