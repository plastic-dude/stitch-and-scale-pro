/**
 * Channel Migration Lab (CHK-062) — where should each pattern live, and is a
 * move (or a copy) worth it?
 *
 * Competitor flaw: sellers get fee tables from Etsy/Ravelry/LoveCrafts and
 * generic "list everywhere" advice — but nobody models the actual money per
 * channel per pattern. Etsy's fee stack is death by a thousand cuts (6.5%
 * transaction + 3% + $0.25 processing + $0.20 listing/renewal + regional
 * regulatory fees), while Ravelry charges nothing up to $1,500/mo. Tools like
 * GoSadi sync metadata across channels but never compute net revenue, the
 * silent listing-renewal drain, or the one-time cost of migrating a pattern.
 *
 * This lab computes: net per sale on each channel, annual fee drag of
 * listing fees and renewals, one-time migration/re-listing cost in hours,
 * the sales lift needed to break even on moving or copying a pattern,
 * review-count fragmentation when splitting a pattern across channels,
 * and a verdict ladder: stay / copy to new channel / migrate / hold tight.
 */

export interface Channel {
  key: string;
  label: string;
  /** Fraction of the sale price taken by platform cut (0 for free tiers). */
  platformCut: number;
  /** Payment-processing fraction, e.g. 0.029 for PayPal/stripe-style. */
  processorCut: number;
  /** Fixed payment-processing fee per transaction in USD. */
  processorFixed: number;
  /** Listing fee per listing in USD (0 if free). */
  listingFee: number;
  /** Listing lifetime in months before a renewal fee fires (0 = perpetual). */
  listingLifetimeMo: number;
  /** Extra per-sale fee fraction (regulatory operating fee, 0 = none). */
  regulatoryCut: number;
  /** Monthly fixed platform cost for this channel (0 = none). */
  monthlyFixed: number;
}

export const CHANNELS: Record<string, Channel> = {
  etsy: {
    key: 'etsy', label: 'Etsy',
    platformCut: 0.065, processorCut: 0.03, processorFixed: 0.25,
    listingFee: 0.20, listingLifetimeMo: 4, regulatoryCut: 0.0015, monthlyFixed: 0,
  },
  ravelry: {
    key: 'ravelry', label: 'Ravelry',
    platformCut: 0.035, processorCut: 0.029, processorFixed: 0.30,
    listingFee: 0, listingLifetimeMo: 0, regulatoryCut: 0, monthlyFixed: 0,
  },
  lovecrafts: {
    key: 'lovecrafts', label: 'LoveCrafts',
    platformCut: 0.02, processorCut: 0.0, processorFixed: 0.20,
    listingFee: 0, listingLifetimeMo: 0, regulatoryCut: 0, monthlyFixed: 0,
  },
  ownsite: {
    key: 'ownsite', label: 'Own site (Payhip/Stripe)',
    platformCut: 0.0, processorCut: 0.029, processorFixed: 0.30,
    listingFee: 0, listingLifetimeMo: 0, regulatoryCut: 0, monthlyFixed: 0,
  },
  patternByEtsy: {
    key: 'patternByEtsy', label: 'Pattern by Etsy',
    platformCut: 0.065, processorCut: 0.03, processorFixed: 0.25,
    listingFee: 0, listingLifetimeMo: 0, regulatoryCut: 0, monthlyFixed: 0,
  },
};

export const DEFAULT_CHANNEL_KEY = 'etsy';

export interface ChannelMigrationInput {
  /** Pattern price in USD. */
  price: number;
  /** Which channel this pattern currently lives on. */
  fromChannel: string;
  /** Expected sales per month on the current channel. */
  salesPerMonth: number;
  /** Expected sales per month the pattern would ADD on the target channel (0 = pure migration). */
  addedSalesPerMonth: number;
  /** Sales per month that FOLLOW the move from the current channel (0 = copy scenario; > 0 = true migration). */
  migratedSalesPerMonth: number;
  /** Hours to re-list the pattern on the target channel: new photos, SEO rewrite, description, setup. */
  migrationHours: number;
  /** Your opportunity rate $/hour (what those hours earn doing grading/selling work instead). */
  hourlyRate: number;
  /** Extra platform monthly fee you'd take on for the new channel (e.g. Etsy Plus $10), 0 = none. */
  newChannelMonthlyFee: number;
  /** Expected review/social-proof counts: reviews on current channel, reviews on target channel. */
  reviewsOnTarget: number;
  /** Fraction of the target channel's buyers who find you via paid ads (drives ads cost). */
  adsShare: number;
  /** Offsite-ad fee fraction applied when the sale comes from an ad click (0 = disabled). */
  adsFee: number;
}

export const DEFAULT_MIGRATION: ChannelMigrationInput = {
  price: 7,
  fromChannel: DEFAULT_CHANNEL_KEY,
  salesPerMonth: 8,
  addedSalesPerMonth: 3,
  migratedSalesPerMonth: 0,
  migrationHours: 4,
  hourlyRate: 25,
  newChannelMonthlyFee: 0,
  reviewsOnTarget: 0,
  adsShare: 0.1,
  adsFee: 0.12,
};

export interface Flag {
  code: string;
  title: string;
  detail: string;
}

export interface ChannelNet {
  channel: Channel;
  /** Net revenue of a single sale on this channel (incl. listing-fee amortization). */
  netPerSale: number;
  /** Annualized listing/renewal drag for one listing (USD/year). */
  annualListingDrag: number;
  /** Effective fee rate on a single sale. */
  feeShare: number;
}

export interface ChannelMigrationResult {
  nets: ChannelNet[];
  /** One-time migration/re-listing cost in USD (hours × rate). */
  migrationCost: number;
  /** Extra net revenue per month from the move (added sales × target net − new fixed fee). */
  deltaNetPerMonth: number;
  /** Months to recover the migration cost from the extra net revenue (Infinity if ≤ 0). */
  paybackMonths: number;
  /** Fee spread per sale between target and source channel (positive = target cheaper). */
  perSaleSpread: number;
  /** 12-month net difference if the move proceeds. */
  yearOneDelta: number;
  flags: Flag[];
  verdict: string;
  verdictNote: string;
}

function channelFor(key: string): Channel {
  return CHANNELS[key] ?? CHANNELS[DEFAULT_CHANNEL_KEY];
}

export function analyzeChannelMigration(input: ChannelMigrationInput): ChannelMigrationResult {
  const from = channelFor(input.fromChannel);

  // Compute per-channel net first so the lab can recommend the best alternative.
  const nets: ChannelNet[] = Object.values(CHANNELS).map(c => {
    const proc = input.price * c.processorCut + c.processorFixed;
    const cut = input.price * (c.platformCut + c.regulatoryCut);
    const renewalRate = c.listingLifetimeMo > 0 ? 1 / c.listingLifetimeMo : 0; // renewals per month
    const listingAmort = c.listingFee * renewalRate;
    const grossFee = proc + cut + listingAmort;
    const netPerSale = Math.max(0, input.price - grossFee);
    const annualListingDrag = c.listingFee * renewalRate * 12;
    const feeShare = input.price > 0 ? grossFee / input.price : 0;
    return { channel: c, netPerSale, annualListingDrag, feeShare };
  });

  // Target = best alternative channel by net per sale (excludes the current channel).
  const target = nets
    .filter(n => n.channel.key !== input.fromChannel)
    .sort((a, b) => b.netPerSale - a.netPerSale)[0].channel;

  const fromNet = nets.find(n => n.channel.key === input.fromChannel)?.netPerSale ?? 0;
  const targetNet = nets.find(n => n.channel.key === target.key)?.netPerSale ?? 0;
  const perSaleSpread = targetNet - fromNet;

  // Migration cost: one-time hours × rate.
  const migrationCost = input.migrationHours * input.hourlyRate;

  // S160 fix — two distinct scenarios share one model:
  //   (copy)    the pattern is added to the target; existing sales stay put.
  //             Delta = added volume × target net − new monthly fixed fee.
  //   (migrate) a share of the current volume FOLLOWS the move; the old channel
  //             loses those sales. The delta must also carry the per-sale spread
  //             on the migrated volume: each migrated unit earns (targetNet −
  //             fromNet) more OR less — the old math ignored this entirely and
  //             could report a win on a channel that is worse per sale.
  const migratedFromCurrent = Math.min(
    input.migratedSalesPerMonth,
    Math.max(0, input.salesPerMonth),
  );
  const deltaNetPerMonth =
    input.addedSalesPerMonth * targetNet +
    migratedFromCurrent * perSaleSpread -
    input.newChannelMonthlyFee;
  const paybackMonths = deltaNetPerMonth > 0 ? migrationCost / deltaNetPerMonth : Infinity;
  const yearOneDelta = deltaNetPerMonth * 12 - migrationCost;

  const flags: Flag[] = [];

  // CM-01 — pure migration with zero added sales: you're just paying a moving cost.
  if (input.addedSalesPerMonth <= 0) {
    flags.push({
      code: 'CM-01',
      title: 'Moving without adding sales',
      detail: `At 0 expected new sales on the target, this is a pure migration — the only ongoing revenue effect is the per-sale spread on the ${migratedFromCurrent.toFixed(0)} units a month that follow you: $${(migratedFromCurrent * perSaleSpread).toFixed(0)}/mo. If the target nets less per sale than where you are, a migration that loses volume is a compounding loss, not a break-even. Migration only pays off if the target's per-sale net is higher AND your buyers actually follow you.`,
    });
  }

  // CM-02 — Etsy listing-renewal drag: silent quarterly leak on unsold listings.
  if (input.fromChannel === 'etsy') {
    const drag = (input.price * (from.platformCut + from.regulatoryCut) + input.price * from.processorCut + from.processorFixed);
    const renewalFee = 0.20 * 3; // 3 renewals/year
    flags.push({
      code: 'CM-02',
      title: `Etsy renewals drain $${renewalFee.toFixed(2)}/yr per unsold listing`,
      detail: `Each Etsy listing renews at $0.20 every 4 months whether or not it sells — $0.60/year, forever, plus $0.20 per extra quantity in an order and a 6.5% transaction + 3% + $0.25 processing on every sale. A $${input.price} pattern nets only $${fromNet.toFixed(2)}/sale after the full stack. At ${input.salesPerMonth}/mo that's $${(fromNet * input.salesPerMonth).toFixed(0)}/mo — worth knowing before you add the next listing.`,
    });
  }

  // CM-03 — payback longer than a year.
  if (paybackMonths > 12) {
    flags.push({
      code: 'CM-03',
      title: 'Payback takes over a year',
      detail: `The move costs $${migrationCost.toFixed(0)} in relisting hours and only earns $${deltaNetPerMonth.toFixed(0)}/mo extra — a ${paybackMonths === Infinity ? '∞' : paybackMonths.toFixed(1)}-month payback. Relisting is fast the second time around: reuse the photo set and description, cut migration hours toward 1-2, and the same move pays back in ${((1.5 * input.hourlyRate) / Math.max(0.01, deltaNetPerMonth)).toFixed(1)} months. Or skip the channel entirely.`,
    });
  }

  // CM-04 — review fragmentation.
  if (input.addedSalesPerMonth > 0 && input.salesPerMonth > 0 && input.reviewsOnTarget <= 0) {
    flags.push({
      code: 'CM-04',
      title: 'New channel starts at zero social proof',
      detail: `Your ${input.salesPerMonth}/mo on the current channel split their momentum: the target listing opens with 0 reviews while your old one keeps its history. Etsy and Ravelry buyers lean on review counts, so expect the first 3-6 months on the new channel to run well below its long-run ceiling. Seed the launch — announce in your newsletter, link both channels from one hub page, and resist the urge to judge the channel after month one.`,
    });
  }

  // CM-05 — price parity gap.
  if (input.addedSalesPerMonth > 0 && perSaleSpread > 1) {
    flags.push({
      code: 'CM-05',
      title: 'Same price, bigger spread — worth copying',
      detail: `At $${input.price} the same pattern earns $${fromNet.toFixed(2)}/sale where it is and $${targetNet.toFixed(2)}/sale on ${target.label} — a $${perSaleSpread.toFixed(2)} gap per sale (fee stacks, not a price change). Each $${input.price} sale on the new channel is free margin versus selling the identical PDF on the old channel. Copying beats migrating whenever the channels' audiences are distinct, which for Etsy and Ravelry they mostly are.`,
    });
  }

  // CM-06 — ads dependence.
  if (input.adsShare > 0.3) {
    flags.push({
      code: 'CM-06',
      title: 'Ads share is high — fees climb on ad sales',
      detail: `${(input.adsShare * 100).toFixed(0)}% of target-channel traffic via ads means a chunk of sales carry the ${input.adsFee > 0 ? (input.adsFee * 100).toFixed(0) + '% offsite-ad fee' : 'ad click fee'} on top of the standard stack. A $${input.price} pattern hit by the ad fee nets $${Math.max(0, targetNet - input.price * input.adsFee).toFixed(2)} on those sales — nearly half the normal take. Organic search and newsletter referral are where the copy really pays.`,
    });
  }

  // CM-07 — own-site opportunity: highest net, full customer ownership.
  if (input.fromChannel !== 'ownsite' && input.price >= 5) {
    const own = nets.find(n => n.channel.key === 'ownsite')?.netPerSale ?? 0;
    const ownSpread = own - fromNet;
    flags.push({
      code: 'CM-07',
      title: `Own site nets $${own.toFixed(2)}/sale — $${ownSpread.toFixed(2)} more`,
      detail: `Your own storefront (Payhip/Shopify + Stripe) keeps $${own.toFixed(2)}/sale on a $${input.price} pattern — roughly 95-97% of the price — and, unlike every marketplace, you own the customer email list. The trade is that nobody discovers you there: it monetizes audiences you bring yourself. Treat it as the top of your funnel, not the front door.`,
    });
  }

  // CM-08 — migration hours too high for the price.
  if (input.migrationHours >= 6) {
    flags.push({
      code: 'CM-08',
      title: 'Relisting hours are bloated',
      detail: `${input.migrationHours} hours to re-list a pattern is a full rebuild. In practice you reuse the photo set (1-2h for Etsy's 10-image requirement if they already exist), adapt the SEO title/description (1h), and fill platform fields (30min). Get the hours down to 2-3 and the payback compresses by half — batch 5+ patterns in one sitting to amortize the per-channel learning.`,
    });
  }

  // ---- Verdict ladder ----
  let verdict: string;
  let verdictNote: string;

  if (input.addedSalesPerMonth <= 0 && perSaleSpread < 0.5) {
    verdict = 'Stay put — moving pays nothing';
    verdictNote = `No added sales expected and only $${perSaleSpread.toFixed(2)} better per sale on the target — not worth the $${migrationCost.toFixed(0)} in hours plus social-proof reset. Keep the pattern where its reviews and queue momentum already are.`;
  } else if (input.addedSalesPerMonth <= 0 && perSaleSpread >= 0.5) {
    verdict = 'Migrate only if the audience follows';
    verdictNote = `The target nets $${perSaleSpread.toFixed(2)} more per sale — that's $${(input.salesPerMonth * perSaleSpread).toFixed(0)}/mo on your current volume — but only if your buyers actually move with you. Ravelry→Etsy moves fail when the designer's audience is community-rooted; Etsy→Ravelry fails when buyers came from marketplace search. Ask your newsletter where they shop before committing $${migrationCost.toFixed(0)} of hours.`;
  } else if (paybackMonths > 12) {
    verdict = 'Copy later — batch it when it pays back under a year';
    verdictNote = `Copying adds $${deltaNetPerMonth.toFixed(0)}/mo but the $${migrationCost.toFixed(0)} relisting cost needs ${paybackMonths.toFixed(1)} months to pay back. Batch this pattern with others in a quarterly relisting session (2-3h/pattern once the photo set exists) and the same copy pays back in ${(2.5 * input.hourlyRate / Math.max(0.01, deltaNetPerMonth)).toFixed(1)} months.`;
  } else if (deltaNetPerMonth < 1) {
    verdict = 'Marginal — only worth copying in a batch';
    verdictNote = `The copy adds less than $1/mo — $${deltaNetPerMonth.toFixed(2)}/mo — after fees and the new monthly fixed cost. Dozens of marginal patterns add up to real income in a quarterly batch, but for one pattern at a time the hours are better spent grading or designing.`;
  } else {
    verdict = 'Copy it — the channel adds free margin';
    verdictNote = `Adding the pattern on ${target.label} earns $${targetNet.toFixed(2)}/sale ($${perSaleSpread.toFixed(2)} better than $${fromNet.toFixed(2)} where it is) with $${deltaNetPerMonth.toFixed(0)}/mo in new net revenue and a ${paybackMonths.toFixed(1)}-month payback on $${migrationCost.toFixed(0)} of relisting work. Etsy and Ravelry buyers barely overlap — the same PDF, same price, two storefronts. Keep prices identical to avoid buyer confusion and seed the launch from your newsletter so the zero-review phase passes quickly.`;
  }

  return { nets, migrationCost, deltaNetPerMonth, paybackMonths, perSaleSpread, yearOneDelta, flags, verdict, verdictNote };
}

export function fmt$(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
}
