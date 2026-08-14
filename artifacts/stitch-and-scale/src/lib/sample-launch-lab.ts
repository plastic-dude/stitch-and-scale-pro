/**
 * CHK-051 — Sample & Launch Window Lab engine (49th feature).
 *
 * Two revenue assets nobody else prices: the physical sample garment (yarn cost +
 * knit hours that can be recovered via a sample sale) and the launch-week burst
 * (well-timed launches can concentrate a pattern's month of sales into its first
 * days on Ravelry Hot Right Now, after which demand tails off).
 *
 * Documented market data (session 51 research):
 * - A sweater sample is the largest single cost block of a pattern: ~30 knitting
 *   hours, ~$75 yarn, plus tech edit ~$40 and model ~$40 (median design,
 *   mediaperuana.com BTS series).
 * - Designer sample sales: Westknits runs annual online sample sales of her
 *   handknit samples; Brooklyn Tweed sells samples the same way. Heartloom's Dec
 *   2025 NYC sample sale: sweaters $45, dresses $45–49 (chicmi.com). Etsy sample
 *   listings range $55–$137.50 per garment.
 * - Test/sample knitter compensation norms: ~$60–$120 per sample garment
 *   (knittingparadise.com); some brands compensate every sample knitter.
 * - Launch burst: the "Diego" launch hit Ravelry Hot Right Now and sold 76 copies
 *   in under 5 days; the designer's previous best sold 109 copies over an ENTIRE
 *   first month — and sales "steadily decline as the month goes on" (mediaperuana).
 * - Craft fairs/boutiques sell finished knitwear; boutiques take a consignment
 *   percentage (knittingutopia.com). Typical fair/boutique cut 25–40%.
 */
import { platformNet, type PlatformId } from './pattern-income-calculator';

// ---------- types ----------

export type SampleSaleChannel = 'etsy' | 'craftfair' | 'boutique' | 'flash_online';

export const SAMPLE_CHANNEL_LABELS: Record<SampleSaleChannel, string> = {
  etsy: 'Etsy listing',
  craftfair: 'Craft fair / market',
  boutique: 'Boutique consignment',
  flash_online: 'Flash online drop (Westknits-style)',
};

// Fee structure per channel (documented session-51 data):
// - etsy: standard fees via platformNet (listing $0.20/item ≈ flat), transaction 6.5% + $0.25.
// - craftfair: booth cost per fair + ~2% card fee on gross.
// - boutique: consignment 40% of gross (typical indie-boutique split; 30–50% band).
// - flash_online: 10% platform cut + $0.25/sale (self-hosted flash tool band).
const CHANNEL_FEE = (ch: SampleSaleChannel, price: number, units: number, fairCost: number): { fees: number; note: string } => {
  switch (ch) {
    case 'etsy': {
      const fees = platformNet('etsy', price, Math.max(units, 1)).totalFees + 0.20 * units;
      return { fees, note: 'Etsy transaction + listing fees apply to physical knitwear too; the sample is one listing.' };
    }
    case 'craftfair':
      return {
        fees: fairCost + price * units * 0.02,
        note: `Booth cost $${fairCost} amortized across samples sold at the fair + ~2% card-processing fee.`,
      };
    case 'boutique':
      return {
        fees: price * units * 0.4,
        note: 'Boutique consignment typically takes 40% (30–50% band) — no unsold risk and no selling effort, but the deepest cut.',
      };
    case 'flash_online':
      return {
        fees: price * units * 0.1 + 0.25 * units,
        note: 'Westknits-style flash drops: ~10% platform cut; demand concentrates into the drop window, samples clear fast at a discount.',
      };
  }
};

export interface SampleLabInput {
  /** Knit hours spent producing the sample garment. */
  knitHours: number;
  /** Yarn + materials cost of the sample. */
  yarnCost: number;
  /** The designer's hourly rate they apply to their knit hours. */
  knitHourlyRate: number;
  /** What a new/custom version of the garment would be asked at. */
  askPrice: number;
  /** Discounted sample-sale price. */
  samplePrice: number;
  /** Sale channel. */
  channel: SampleSaleChannel;
  /** Booth cost, only relevant for craftfair. */
  boothCost: number;
  /** Days after release the sample sale happens (0 = pre-launch). */
  daysAfterRelease: number;
  /** The pattern's expected monthly sales after launch (long-tail baseline). */
  monthlySales: number;
  /** Sample-sale channel listing price band floor/ceiling observed in market. */
  useBenchmarks: boolean;
}

export const SAMPLE_LAB_DEFAULTS: SampleLabInput = {
  knitHours: 30,
  yarnCost: 75,
  knitHourlyRate: 15,
  askPrice: 380,
  samplePrice: 140,
  channel: 'flash_online',
  boothCost: 60,
  daysAfterRelease: 0,
  monthlySales: 40,
  useBenchmarks: true,
};

export interface SampleBreakdown {
  channel: SampleSaleChannel;
  label: string;
  /** Gross from selling the sample at the sample price. */
  gross: number;
  fees: number;
  net: number;
  /** Cost to recover: yarn + (knit hours × knit hourly rate). */
  costBasis: number;
  /** Net minus cost basis — positive means the sample turned a profit against its own production cost. */
  recoveredVsCost: number;
  /** What the garment cost in knit hours alone. */
  knitCost: number;
  /** Effective margin after cost basis. */
  marginPct: number;
  note: string;
  /** Discount off the ask price. */
  discountPct: number;
}

export interface LaunchBurst {
  /** Burst multiple: first-week share of first-month sales. Benchmarked on documented
   *  launches (76 copies in <5 days vs 109 in a whole month ≈ 0.7 in week one;
   *  typical launch without burst ≈ 0.25). */
  firstWeekMultiple: number;
  /** Sales in launch week. */
  weekOneSales: number;
  /** The tail: remaining month-1 sales outside the burst. */
  tailSales: number;
  /** Seasonal timing factor: 1.0 = perfectly timed (fall design, summer launch),
   *  0.6–0.75 = off-season. */
  seasonFactor: number;
  note: string;
}

export interface SampleLabResult {
  samples: SampleBreakdown[];
  best: SampleBreakdown | null;
  burst: LaunchBurst;
  /** Verdict on running the sample sale. */
  sampleVerdict: { ok: boolean; reason: string };
  /** Net of the best channel vs keeping the sample as portfolio/marketing asset. */
  keepVsSellNote: string;
  /** Recovery ratio: best net / cost basis. */
  recoveryRatio: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

// Seasonal timing: fall/winter garments launched in summer clear the Hot Right Now
// burst; garments launched out of season lose ~25–40% of the burst (documented:
// Diego's "timing was just right for knitters dreaming of fall sweaters").
// garmentSeason: 'fall' | 'winter' | 'spring' | 'summer'; launchMonth: 0–11 (Jan=0).
const SEASON_PEEK: Record<string, number[]> = {
  fall: [7, 8, 9], // Aug-Sep-Oct launch for fall knitters
  winter: [10, 11, 0], // Nov-Dec-Jan
  spring: [1, 2, 3], // Feb-Mar-Apr
  summer: [4, 5, 6], // May-Jun-Jul
};

export function seasonFactor(garmentSeason: 'fall' | 'winter' | 'spring' | 'summer', launchMonth: number): number {
  const peek = SEASON_PEEK[garmentSeason] ?? [];
  if (peek.includes(launchMonth)) return 1.0;
  // one month off → mild penalty; two+ off → full off-season penalty.
  const nextMonth = (launchMonth + 1) % 12;
  const prevMonth = (launchMonth + 11) % 12;
  if (peek.includes(nextMonth) || peek.includes(prevMonth)) return 0.85;
  return 0.65;
}

/** Compute the sample sale breakdown for every channel; the input's own channel is
 *  highlighted as `selected`, but designers should compare all four. */
export function analyzeSampleLab(input: SampleLabInput, garmentSeason: 'fall' | 'winter' | 'spring' | 'summer' = 'fall', launchMonth = 7): SampleLabResult {
  const costBasis = round2(input.yarnCost + input.knitHours * input.knitHourlyRate);
  const knitCost = round2(input.knitHours * input.knitHourlyRate);
  const discountPct = input.askPrice > 0 ? (1 - input.samplePrice / input.askPrice) : 0;

  const samples: SampleBreakdown[] = (Object.keys(SAMPLE_CHANNEL_LABELS) as SampleSaleChannel[]).map((ch) => {
    const { fees, note } = CHANNEL_FEE(ch, input.samplePrice, 1, input.boothCost);
    const gross = input.samplePrice;
    const net = round2(Math.max(0, gross - fees));
    const recoveredVsCost = round2(net - costBasis);
    return {
      channel: ch,
      label: SAMPLE_CHANNEL_LABELS[ch],
      gross,
      fees: round2(fees),
      net,
      costBasis,
      recoveredVsCost,
      knitCost,
      marginPct: costBasis > 0 ? Math.round((recoveredVsCost / costBasis) * 1000) / 10 : 0,
      note,
      discountPct: Math.round(discountPct * 1000) / 10,
    };
  });

  samples.sort((a, b) => b.net - a.net);
  const best = samples[0];

  // Launch burst model (benchmarked): a timed launch that catches Hot Right Now
  // pulls ~60–70% of month-1 sales into the first week; without timing/burst the
  // week carries ~25% and demand tails off through the month.
  const baseMultiple = discountPct >= 0.45 || input.daysAfterRelease === 0 ? 0.68 : 0.25;
  const sf = seasonFactor(garmentSeason, launchMonth);
  const firstWeekMultiple = round2(baseMultiple * sf);
  const weekOneSales = Math.round(input.monthlySales * firstWeekMultiple);
  const tailSales = input.monthlySales - weekOneSales;

  const burst: LaunchBurst = {
    firstWeekMultiple,
    weekOneSales,
    tailSales: Math.max(0, tailSales),
    seasonFactor: sf,
    note:
      sf >= 1
        ? 'Launch month lands inside the season peak for this garment type — documented launches timed this way catch Ravelry Hot Right Now and pull most of the month\'s sales into the first week.'
        : `Launch month is off the peak for ${garmentSeason} designs — the burst typically loses ~15–35% of its force (Diego sold 76 copies in under 5 days when timed right; a whole month took the designer's previous best 109).`,
  };

  const sampleVerdict = best && best.recoveredVsCost >= 0
    ? { ok: true, reason: `At ${SAMPLE_CHANNEL_LABELS[best.channel]} the sample nets ${best.net.toFixed(2)} against a ${best.costBasis.toFixed(2)} cost basis — it recovers ${Math.round((best.net / Math.max(1, best.costBasis)) * 100)}% of its own production cost.` }
    : { ok: false, reason: best ? `Even the best channel nets ${best.net.toFixed(2)} against a ${best.costBasis.toFixed(2)} basis — the sample sale only partially recovers cost; pair it with the launch burst (see week-one math) to close the gap.` : 'No channels available.' };

  const keepVsSellNote = best
    ? `Keeping the sample as a portfolio/marketing asset has its own value (photos, classes, trunk shows). If the sample nets more than its basis here, selling it is pure recovery; if it nets less, it stays a marketing asset until a flash drop clears it.`
    : '';

  return {
    samples,
    best,
    burst,
    sampleVerdict,
    keepVsSellNote,
    recoveryRatio: best && best.costBasis > 0 ? round2(best.net / best.costBasis) : 0,
  };
}
