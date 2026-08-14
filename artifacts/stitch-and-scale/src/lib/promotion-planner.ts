/**
 * Promotion Budget Planner (CHK-027).
 *
 * Plans a pattern's promotion budget channel by channel — paid (Etsy onsite
 * ads, offsite ads) and organic (Pinterest, newsletter, free-pattern funnel) —
 * always against the pattern's true net margin from the shared platform fee
 * seam, so nobody celebrates a ROAS that turns negative once the fee stack is
 * subtracted.
 *
 * Research anchors (session 28):
 * - Etsy onsite CPC $0.20–0.50; offsite ads charge 12–15% of the sale
 *   (pay-only-on-sale; mandatory for shops >$10k/yr).
 * - Cost per sale = CPC ÷ conversion rate. $0.50 CPC at 5% = $10/sale — a
 *   $6 pattern can't survive that.
 * - Real seller: $182.72 spend → $192.23 revenue at 4.78% conv, unprofitable
 *   after fees. Revenue ROAS ≥3× is the folk minimum; true profit ROAS is the
 *   only number that matters.
 * - PlanetJune: CPC auction with no keyword targeting burned $15 on 69 clicks
 *   and 0 sales at pattern price points; her offsite (pay-on-sale) ads worked.
 * - Kill rule: $30 spend with 0 orders → pause the listing.
 */
import { platformNet, PlatformId } from '@/lib/pattern-income-calculator';

export type PromoChannelId =
  | 'etsyOnsite'
  | 'etsyOffsite'
  | 'pinterest'
  | 'newsletter'
  | 'freePattern';

export const CHANNEL_LABELS: Record<PromoChannelId, string> = {
  etsyOnsite: 'Etsy onsite ads',
  etsyOffsite: 'Etsy offsite ads',
  pinterest: 'Pinterest (organic)',
  newsletter: 'Newsletter launch',
  freePattern: 'Free pattern funnel',
};

export const CHANNEL_NOTES: Record<PromoChannelId, string> = {
  etsyOnsite:
    'Pay-per-click inside Etsy search. No keyword targeting — clicks come from whatever Etsy deems relevant. At pattern price points ($6–$9) a $0.30–0.50 CPC needs strong conversion to pay.',
  etsyOffsite:
    'Etsy promotes you on Google/Facebook/Instagram and charges 12–15% of the sale — only when a sale happens. The only paid channel where you never pay for a non-converting click.',
  pinterest:
    'Free organic reach with long pin shelf life. The steady traffic source for most pattern sellers — costs time, not money. Budget here is your hours.',
  newsletter:
    'Highest conversion of any channel at launch week. List size and open rate drive the math; a launch email with an early-bird discount is the standard play.',
  freePattern:
    'Give away a simple pattern to build the list and followers, then monetize the advanced work. Slowest payoff, cheapest per acquired fan.',
};

export type ChannelParams = {
  id: PromoChannelId;
  enabled: boolean;
  budget: number; // $ for paid channels; hours for organic channels
  // Paid-channel economics
  cpc: number; // $ per click (onsite / Pinterest ads if used)
  conversionPct: number; // 0-100
  // Offsite: cost is a % of the sale, pay-on-sale
  offsiteCommissionPct: number; // e.g. 15
  // Organic economics
  hourlyRate: number; // $/hr opportunity cost for organic channels
  clicksPerHour: number; // content reach: expected new clicks per hour invested
  organicConversionPct: number; // 0-100
};

export type PromotionInput = {
  price: number;
  platform: PlatformId;
  monthlySales: number; // baseline organic sales/mo without promotion
  channels: ChannelParams[];
  horizonMonths: number; // campaign horizon
  killSpendThreshold: number; // $ spent with 0 orders before pausing (default 30)
};

export type ChannelResult = {
  id: PromoChannelId;
  label: string;
  enabled: boolean;
  isPaid: boolean;
  spend: number; // $ (paid) or opportunity cost (organic)
  netPerSale: number; // pattern's net per sale via the platform fee seam
  offsiteNetPerSale: number; // after offsite commission
  clicks: number;
  expectedSales: number;
  expectedRevenue: number;
  expectedProfit: number; // expectedProfit − spend
  breakevenCpc: number; // max CPC where ad still profits (paid only; 0 otherwise)
  requiredConversionPct: number; // min conv % at current CPC (paid only; 0 otherwise)
  revenueRoas: number; // revenue / spend (0 when spend is 0)
  verdict: 'go' | 'maybe' | 'kill';
  verdictNote: string;
};

export type PromotionResult = {
  channels: ChannelResult[];
  totalSpend: number;
  totalExpectedProfit: number; // profit minus all spend
  grossBaseline: number; // baseline net without promo over horizon
  bestChannels: PromoChannelId[]; // sorted by expected profit per $/hr
  budgetSplit: { id: PromoChannelId; recommendedSharePct: number }[];
  verdict: 'go' | 'maybe' | 'no';
  verdictNote: string;
  killRule: string;
  testPlan: string; // paste-ready 30-day protocol
};

export const DEFAULT_KILL_THRESHOLD = 30;
export const DEFAULT_ONSITE_CPC = 0.35;
export const DEFAULT_ONSITE_CONV = 3;
export const DEFAULT_OFFSITE_COMM = 15;
export const DEFAULT_HORIZON = 3;

export function defaultChannels(): ChannelParams[] {
  return [
    {
      id: 'etsyOnsite', enabled: false, budget: 150,
      cpc: DEFAULT_ONSITE_CPC, conversionPct: DEFAULT_ONSITE_CONV,
      offsiteCommissionPct: DEFAULT_OFFSITE_COMM,
      hourlyRate: 25, clicksPerHour: 0, organicConversionPct: 0,
    },
    {
      id: 'etsyOffsite', enabled: true, budget: 0,
      cpc: 0, conversionPct: 0,
      offsiteCommissionPct: DEFAULT_OFFSITE_COMM,
      hourlyRate: 25, clicksPerHour: 0, organicConversionPct: 0,
    },
    {
      id: 'pinterest', enabled: true, budget: 10,
      cpc: 0, conversionPct: 0,
      offsiteCommissionPct: DEFAULT_OFFSITE_COMM,
      hourlyRate: 25, clicksPerHour: 40, organicConversionPct: 1.5,
    },
    {
      id: 'newsletter', enabled: true, budget: 4,
      cpc: 0, conversionPct: 0,
      offsiteCommissionPct: DEFAULT_OFFSITE_COMM,
      hourlyRate: 25, clicksPerHour: 25, organicConversionPct: 4,
    },
    {
      id: 'freePattern', enabled: false, budget: 5,
      cpc: 0, conversionPct: 0,
      offsiteCommissionPct: DEFAULT_OFFSITE_COMM,
      hourlyRate: 25, clicksPerHour: 30, organicConversionPct: 2,
    },
  ];
}

function makeInput(channels?: Partial<ChannelParams>[]): PromotionInput {
  const fullDefaults = defaultChannels();
  const merged = channels
    ? fullDefaults.map((d) => {
        const override = channels.find((c) => c.id === d.id);
        return override ? { ...d, ...override } : d;
      })
    : fullDefaults;
  return {
    price: 8,
    platform: 'etsy',
    monthlySales: 10,
    channels: merged,
    horizonMonths: DEFAULT_HORIZON,
    killSpendThreshold: DEFAULT_KILL_THRESHOLD,
  };
}

export { makeInput as defaultPromotionInput };

export function analyzePromotion(input: PromotionInput): PromotionResult {
  const horizonMonths = Math.max(input.horizonMonths, 1);

  const baseline = platformNet(input.platform, input.price, input.monthlySales);
  const grossBaseline = Math.round(
    baseline.netPerSale * Math.max(input.monthlySales, 0) * horizonMonths * 100,
  ) / 100;

  const channelResults: ChannelResult[] = input.channels.map((c) => {
    const netPerSale = platformNet(input.platform, input.price, Math.max(input.monthlySales, 1)).netPerSale;
    const offsiteNetPerSale = Math.round(
      netPerSale * (1 - (c.offsiteCommissionPct || DEFAULT_OFFSITE_COMM) / 100) * 100,
    ) / 100;

    if (!c.enabled) {
      return {
        id: c.id, label: CHANNEL_LABELS[c.id],       enabled: false,
      isPaid: c.id === 'etsyOnsite' || c.id === 'etsyOffsite',
        spend: 0, netPerSale, offsiteNetPerSale, clicks: 0, expectedSales: 0,
        expectedRevenue: 0, expectedProfit: 0, breakevenCpc: 0, requiredConversionPct: 0,
        revenueRoas: 0, verdict: 'go' as const,
        verdictNote: 'Channel paused — no spend or time allocated.',
      };
    }

    const isPaid = c.id === 'etsyOnsite' || c.id === 'etsyOffsite';
    const spend = isPaid ? Math.max(c.budget, 0) : Math.max(c.budget, 0) * Math.max(c.hourlyRate || 0, 0);

    if (c.id === 'etsyOnsite') {
      const clicks = c.cpc > 0 ? Math.round((spend / c.cpc) * 10) / 10 : 0;
      const expectedSales = Math.round((clicks * (Math.max(c.conversionPct, 0) / 100)) * 100) / 100;
      const expectedRevenue = Math.round(expectedSales * input.price * 100) / 100;
      const expectedProfit = Math.round(expectedSales * netPerSale * 100) / 100 - spend;
      // Break-even CPC: profit per sale × conv rate = max CPC
      const breakevenCpc = Math.round(netPerSale * (Math.max(c.conversionPct, 0) / 100) * 1000) / 1000;
      const requiredConversionPct = c.cpc > 0 && netPerSale > 0
        ? Math.round((c.cpc / netPerSale) * 100 * 100) / 100
        : 0;
      const revenueRoas = spend > 0 ? Math.round((expectedRevenue / spend) * 100) / 100 : 0;
      let verdict: ChannelResult['verdict'] = 'go';
      let verdictNote = '';
      if (c.cpc >= breakevenCpc && breakevenCpc > 0) {
        verdict = 'kill';
        verdictNote = `At $${c.cpc.toFixed(2)} CPC you need >${requiredConversionPct.toFixed(1)}% conversion to profit — above your ${c.conversionPct}% setting. This is the $10-per-sale trap at pattern price points: pause and reprice or re-list first.`;
      } else if (expectedProfit < 0) {
        verdict = 'maybe';
        verdictNote = `Expected profit ${expectedProfit.toFixed(0)}$ — the clicks convert but not enough to cover the spend. Try a proven listing (5+ reviews) at $3–5/day for 30 days before scaling.`;
      } else if (revenueRoas < 3) {
        verdict = 'maybe';
        verdictNote = `Revenue ROAS ${revenueRoas.toFixed(2)}× is below the 3× folk minimum; after fees it barely clears. Scale slowly ($1–2/day increments) and watch weekly.`;
      } else {
        verdict = 'go';
        verdictNote = `Expected profit $${expectedProfit.toFixed(0)} over ${horizonMonths} month(s) at revenue ROAS ${revenueRoas.toFixed(2)}×.`;
      }
      return {
        id: c.id, label: CHANNEL_LABELS[c.id], enabled: true, isPaid: true, spend, netPerSale,
        offsiteNetPerSale: netPerSale, clicks, expectedSales, expectedRevenue,
        expectedProfit, breakevenCpc, requiredConversionPct, revenueRoas, verdict, verdictNote,
      };
    }

    if (c.id === 'etsyOffsite') {
      // Offsite: no spend model — every sale pays commission only. Profitability
      // check: does the pattern still profit after the commission leg?
      const verdict: ChannelResult['verdict'] = offsiteNetPerSale > 0 ? 'go' : 'kill';
      const verdictNote = offsiteNetPerSale > 0
        ? `Pay-only-on-sale — a sale nets $${offsiteNetPerSale.toFixed(2)} after the ${c.offsiteCommissionPct}% commission. Every offsite sale is profit by definition.`
        : 'At this price the offsite commission exceeds your net — $0 left per sale.';
      return {
        id: c.id, label: CHANNEL_LABELS[c.id], enabled: true, isPaid: true, spend: 0, netPerSale,
        offsiteNetPerSale, clicks: 0, expectedSales: 0, expectedRevenue: 0,
        expectedProfit: 0, breakevenCpc: 0, requiredConversionPct: 0, revenueRoas: 0,
        verdict, verdictNote,
      };
    }

    // Organic channels: spend is time at the design rate
    const clicks = Math.round(c.clicksPerHour * Math.max(c.budget, 0) * 10) / 10;
    const expectedSales = Math.round((clicks * (Math.max(c.organicConversionPct, 0) / 100)) * 100) / 100;
    const expectedProfit = Math.round(expectedSales * netPerSale * 100) / 100 - spend;
    const revenueRoas = 0;
    let verdict: ChannelResult['verdict'] = 'go';
    let verdictNote = '';
    if (expectedProfit < 0) {
      verdict = 'maybe';
      verdictNote = `At ${c.budget} hours this costs $${spend.toFixed(0)} in time and returns $${(expectedSales * netPerSale).toFixed(0)} — trim hours or lift the conversion hook (lead magnet / launch discount).`;
    } else {
      verdict = 'go';
      verdictNote = `~${clicks.toFixed(0)} clicks → ${expectedSales.toFixed(1)} sales → $${expectedProfit.toFixed(0)} net after your $${c.hourlyRate}/hr time cost.`;
    }
    return {
      id: c.id, label: CHANNEL_LABELS[c.id], enabled: true, isPaid: false, spend, netPerSale,
      offsiteNetPerSale: netPerSale, clicks, expectedSales,
      expectedRevenue: Math.round(expectedSales * input.price * 100) / 100,
      expectedProfit, breakevenCpc: 0, requiredConversionPct: 0, revenueRoas, verdict, verdictNote,
    };
  });

  const totalSpend = Math.round(channelResults.reduce((s, c) => s + c.spend, 0) * 100) / 100;
  const totalExpectedProfit = Math.round(
    channelResults.reduce((s, c) => s + c.expectedProfit, 0) * 100,
  ) / 100;

  const bestChannels = [...channelResults]
    .filter((c) => c.enabled && c.spend > 0)
    .sort((a, b) => {
      const pa = a.spend > 0 ? a.expectedProfit / a.spend : 0;
      const pb = b.spend > 0 ? b.expectedProfit / b.spend : 0;
      return pb - pa;
    })
    .map((c) => c.id);

  // Weight each active channel by its profit-per-dollar (or profit-per-hour
  // for time channels) so a $90 onsite test and a 10-hour newsletter push
  // share the plan proportionally to efficiency, not absolute profit.
  const enabledWithSpend = channelResults.filter((c) => c.enabled && c.spend > 0);
  const shareSum = enabledWithSpend.reduce(
    (s, c) => s + Math.max(c.expectedProfit / Math.max(c.spend, 1), 0),
    0,
  );
  const budgetSplit = channelResults.map((c) => ({
    id: c.id,
    recommendedSharePct:
      c.spend > 0 && shareSum > 0 && c.expectedProfit > 0
        ? Math.round(((c.expectedProfit / Math.max(c.spend, 1)) / shareSum) * 100)
        : 0,
  }));

  const kills = channelResults.filter((c) => c.verdict === 'kill');
  const maybes = channelResults.filter((c) => c.verdict === 'maybe');
  const paidChannelsActive = channelResults.filter((c) => c.enabled && c.isPaid && c.spend > 0);

  // Issue #14: consistent signed money display — '+$282' positive, '−$282'
  // negative; never '+$-282'.
  const signed$ = (n: number) => (n >= 0 ? '+$' + n.toFixed(0) : '−$' + Math.abs(n).toFixed(0));
  let verdict: PromotionResult['verdict'] = 'go';
  let verdictNote = '';
  if (kills.some((c) => c.id === 'etsyOnsite')) {
    verdict = 'no';
    verdictNote = `Onsite ads fail the break-even test — ${kills[0].verdictNote} Skip paid clicks; keep offsite (pay-on-sale) and the organic ladder.`;
  } else if (totalExpectedProfit < 0 && paidChannelsActive.length > 0) {
    verdict = 'no';
    verdictNote = `Total expected profit −$${Math.abs(totalExpectedProfit).toFixed(0)} — paid spend loses money before it earns it. Pause onsite ads and rebuild the listing.`;
  } else if (maybes.length > 0) {
    verdict = 'maybe';
    verdictNote = `Projected net ${signed$(totalExpectedProfit)} but ${maybes.map((m) => m.label).join(', ')} need monitoring — run the 30-day test below and apply the kill rule.`;
  } else {
    verdict = 'go';
    verdictNote = `Projected net ${signed$(totalExpectedProfit)} over ${horizonMonths} month(s) on top of the $${grossBaseline.toFixed(0)} baseline — the organic ladder carries this campaign.`;
  }

  const testPlan = [
    '— 30-Day Promotion Test Plan —',
    '1. Week 0: only advertise listings with 5+ reviews and conversion ≥ your target.',
    '2. Set onsite budget to $3/day on ONE proven listing. Everything else paused.',
    '3. Log weekly: clicks, spend, orders, revenue. Revenue ROAS = revenue ÷ spend.',
    '4. Kill rule: $30 spent with zero orders → pause that listing. ROAS < 2× after 30 days → pause.',
    '5. ROAS ≥ 3× → raise budget $1–2/day and add the next proven listing.',
    '6. Keep offsite ads on (pay-only-on-sale) and run the newsletter at launch.',
  ].join('\n');

  return {
    channels: channelResults,
    totalSpend,
    totalExpectedProfit,
    grossBaseline,
    bestChannels,
    budgetSplit,
    verdict,
    verdictNote,
    killRule: `$${input.killSpendThreshold} spent with zero orders → pause that listing, no exceptions.`,
    testPlan,
  };
}
