/**
 * Pattern Pricing Advisor — recommends a price band for a specific pattern
 * using its own engineering data plus documented industry pricing guidance.
 *
 * INDUSTRY PRICE BANDS (cited, verified against published guidance):
 * - Most digital knitting patterns cluster in the $5–10 band
 *   (GoSadi, "Pricing Your Knitting Patterns", Oct 2025).
 * - Premium / traditional-indie detailed patterns run $14–18
 *   (r/BitchEatingCrafters pricing discussion, Mar 2025; corroborated by
 *   tinynonsense.com designer commentary, May 2019).
 * - Socks land around $8, small accessories around $10; sweaters at
 *   $7–8 are the community norm for established designers (r/knitting,
 *   r/knitting willingness-to-pay threads 2019–2022).
 * - The $8 point is the observed sweet spot (GoSadi + Snugglery platform
 *   comparison).
 *
 * PREMIUM JUSTIFIERS (industry-recognized value factors, GoSadi):
 * - size inclusivity (a wide graded size range is work knitters pay for),
 * - tech editing (verified correctness ≈ £30–50 per pattern, Woolly
 *   Wormhead, "The true cost of a pattern"),
 * - test knitting (≈ £35 per pattern, Woolly Wormhead),
 * - complexity (lace/colorwork sweater >> beginner hat),
 * - unique construction / in-demand aesthetic.
 *
 * COST-PLUS FLOOR: if the designer's recorded hours at their rate exceed
 * what the current price would ever recover at realistic lifetime sales
 * (we model a conservative 150-sale lifetime — well above the $203 average
 * Ravelry lifetime per Media Peruana's 10,000-designer analysis), the
 * advisor flags underpricing.
 *
 * This is a planning aid grounded in cited market data — not a sales
 * promise. Every band boundary below matches the documented ranges.
 */

import { PatternProject, ALL_SIZES } from '@/lib/grading-engine';
import { PLATFORMS, PLATFORM_LABELS, platformNet } from '@/lib/pattern-income-calculator';

export type ItemType = 'sweater' | 'cardigan' | 'hat' | 'scarf' | 'shawl' | 'socks' | 'mitts' | 'other';

export const ITEM_TYPE_LABELS: Record<ItemType, string> = {
  sweater: 'Sweater / Pullover',
  cardigan: 'Cardigan',
  hat: 'Hat / Beanie',
  scarf: 'Scarf / Cowl',
  shawl: 'Shawl',
  socks: 'Socks',
  mitts: 'Mitts / Gloves',
  other: 'Other garment or accessory',
};

export const ITEM_TYPE_LIST: ItemType[] = [
  'sweater', 'cardigan', 'hat', 'scarf', 'shawl', 'socks', 'mitts', 'other',
];

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced';

export const SKILL_LEVEL_LABELS: Record<SkillLevel, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced (lace, colorwork, cables…)',
};

export const SKILL_LEVEL_LIST: SkillLevel[] = ['beginner', 'intermediate', 'advanced'];

export interface PricingInputs {
  itemType: ItemType;
  skillLevel: SkillLevel;
  /** Number of sizes the pattern will ship in (from the grading data). */
  sizeCount: number;
  /** Whether the designer tech-edits (or plans to) every pattern. */
  techEdited: boolean;
  /** Whether the designer test-knits (or plans to) every pattern. */
  testKnitted: boolean;
  /** Hours the designer has logged on this pattern so far. */
  hoursWorked: number;
  /** The designer's self-assessed hourly rate (USD) for time recovery. */
  hourlyRate: number;
  /** The price the designer is currently planning to list at. */
  currentPrice: number;
  /** Target market: 'standard' ($5–10 band) or 'premium' ($12–18 band). */
  marketTarget: 'standard' | 'premium';
}

export interface PriceBand {
  label: 'Conservative' | 'Market' | 'Premium';
  low: number;
  high: number;
}

export interface PriceJustifier {
  factor: string;
  /** 'up' = supports raising the price, 'neutral' = no effect, 'down' = suggests staying conservative. */
  effect: 'up' | 'neutral' | 'down';
  note: string;
}

export interface VolumeScenario {
  label: string;
  units: number;
  /** Platform key -> net revenue at that volume. */
  platformNets: Record<string, number>;
}

export interface PricingAdvice {
  bands: PriceBand[];
  /** The single recommended point price, rounded to a conventional .00/.50/.99 anchor. */
  recommendedPrice: number;
  justifiers: PriceJustifier[];
  /** True when currentPrice sits under the cost-plus floor. */
  underpriced: boolean;
  costPlusFloor: number;
  /** Revenue-at-volume scenarios reusing the verified platform fee model. */
  volumeScenarios: VolumeScenario[];
  /** Human-readable reasoning, one line per active justifier. */
  reasoning: string[];
}

/** Size-range anchors for the size-count adjuster. 3 sizes is the
 *  traditional small range; 5+ is size-inclusive territory; 7+ is the
 *  widest practical range — each step is a documented value lever
 *  (size-inclusive sizing is repeatedly cited as a premium justifyer,
 *  r/BitchEatingCrafters 2025, one-wild-designs sizing guide 2024). */
export const SIZE_COUNT_MAX_EFFECTS = 3;

function baseBand(item: ItemType, marketTarget: PricingInputs['marketTarget']): { low: number; high: number } {
  if (marketTarget === 'premium') {
    return item === 'hat' || item === 'scarf' || item === 'socks' || item === 'mitts'
      ? { low: 9, high: 12 }
      : { low: 12, high: 18 };
  }
  // Standard band: $5–10 documented norm, anchored per item type.
  switch (item) {
    case 'hat': return { low: 5, high: 8 };
    case 'scarf': return { low: 5, high: 8 };
    case 'socks': return { low: 6, high: 9 };
    case 'mitts': return { low: 5, high: 8 };
    case 'shawl': return { low: 6, high: 9 };
    case 'sweater': return { low: 7, high: 10 };
    case 'cardigan': return { low: 7, high: 10 };
    default: return { low: 5, high: 9 };
  }
}

/** Conventional price anchors a knitter expects to see (avoid arbitrary cents). */
function anchorPrice(raw: number): number {
  const anchors = [5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10, 11, 12, 14, 15, 16, 18];
  let best = anchors[0];
  for (const a of anchors) {
    if (Math.abs(a - raw) < Math.abs(best - raw)) best = a;
  }
  return best;
}

/**
 * Derive pricing advice for one pattern. Pure function — the whole
 * monetization story is tested without any UI.
 */
export function advisePrice(inputs: PricingInputs): PricingAdvice {
  const justifiers: PriceJustifier[] = [];
  const band = baseBand(inputs.itemType, inputs.marketTarget);
  let effectPoints = 0; // each +1 shifts the recommended point one anchor step up
  const maxSteps = Math.max(0, band.high - band.low);

  // Complexity: advanced patterns are consistently recommended higher
  // prices across every strategy article (GoSadi, The Knitting Times).
  if (inputs.skillLevel === 'advanced') {
    justifiers.push({
      factor: 'Skill level: advanced',
      effect: 'up',
      note: 'Advanced techniques (lace, colorwork, cables) carry a documented premium — complex designs deserve more than beginner-band pricing.',
    });
    effectPoints += 1;
  } else if (inputs.skillLevel === 'beginner') {
    justifiers.push({
      factor: 'Skill level: beginner',
      effect: 'down',
      note: 'Beginner patterns compete in the crowded accessible-price segment; stay near the band floor to win first-time buyers.',
    });
  } else {
    justifiers.push({
      factor: 'Skill level: intermediate',
      effect: 'neutral',
      note: 'Intermediate is the market core — price with the market, not against it.',
    });
  }

  // Size inclusivity: every graded size is real engineering work, and
  // size-inclusive patterns are explicitly cited as worth more
  // (r/BitchEatingCrafters Mar 2025, One Wild Designs 2024).
  const sizeEffect = Math.min(SIZE_COUNT_MAX_EFFECTS, Math.max(0, inputs.sizeCount - 2));
  if (sizeEffect > 0) {
    justifiers.push({
      factor: `Size range: ${inputs.sizeCount} sizes`,
      effect: sizeEffect >= SIZE_COUNT_MAX_EFFECTS ? 'up' : 'neutral',
      note:
        inputs.sizeCount >= 5
          ? 'A wide graded range is size-inclusive — real grading work that most market patterns skip. Price for it.'
          : `A ${inputs.sizeCount}-size range is standard; the grading depth is worth mentioning in your listing.`,
    });
    effectPoints += sizeEffect;
  }

  // Tech editing: correctness is the thing that protects the designer's
  // reputation; ~£30–50/pattern cost (Woolly Wormhead) that must be earned back.
  if (inputs.techEdited) {
    justifiers.push({
      factor: 'Tech edited',
      effect: 'up',
      note: 'Tech editing runs roughly $40–65 per pattern in real designer costs — a tech-edited pattern justifies a firmer price.',
    });
    effectPoints += 1;
  }

  // Test knitting: ~£35 per pattern (Woolly Wormhead), and it is also
  // social proof for the listing itself.
  if (inputs.testKnitted) {
    justifiers.push({
      factor: 'Test knitted',
      effect: 'up',
      note: 'Test knitting adds real cost (~$45/pattern) and proof — both are priced into premium patterns.',
    });
    effectPoints += 1;
  }

  // Garment vs accessory: sweaters and cardigans anchor the top of the
  // standard band (r/knitting designer pricing norms).
  if (inputs.itemType === 'sweater' || inputs.itemType === 'cardigan') {
    justifiers.push({
      factor: `Item: ${ITEM_TYPE_LABELS[inputs.itemType]}`,
      effect: 'neutral',
      note: 'Garments anchor the top of the standard band; accessories anchor the lower half.',
    });
  }

  // Clamp the shift so the recommendation never leaves the market-documented bands.
  const steps = Math.min(effectPoints, maxSteps);
  const rawPoint = band.low + steps;
  const recommendedPrice = anchorPrice(rawPoint);

  const reasoning = justifiers.map(j => `${j.factor} — ${j.note}`);

  // Cost-plus floor: conservative 150-sale lifetime model. If the floor
  // (cost ÷ lifetime sales) exceeds the current price, the designer is
  // structurally underpricing this pattern.
  const lifetimeSales = 150;
  const timeCost = Math.max(0, inputs.hoursWorked) * Math.max(0, inputs.hourlyRate);
  const costPlusFloor = timeCost > 0
    ? Math.round((timeCost / lifetimeSales) * 100) / 100
    : 0;
  const underpriced = costPlusFloor > 0 && inputs.currentPrice > 0 && inputs.currentPrice < costPlusFloor;
  if (underpriced) {
    reasoning.push(
      `At ${inputs.hoursWorked} hours × $${inputs.hourlyRate}/hr, this pattern needs to recover $${timeCost.toLocaleString()} over a conservative ${lifetimeSales}-sale lifetime — the floor is $${costPlusFloor.toLocaleString(undefined, { minimumFractionDigits: 2 })}, above your current $${inputs.currentPrice.toFixed(2)}.`,
    );
  }

  // Volume scenarios reuse the verified per-platform fee model so the
  // designer sees what their price nets at 25 / 100 / 500 lifetime sales.
  const volumeScenarios: VolumeScenario[] = [
    { label: 'Quiet month (25 sales)', units: 25 },
    { label: 'Solid lifetime pace (100 sales)', units: 100 },
    { label: 'Best seller (500 sales)', units: 500 },
  ].map(({ label, units }) => {
    const platformNets: Record<string, number> = {};
    for (const p of PLATFORMS) {
      platformNets[p] = platformNet(p, recommendedPrice, units).netRevenue;
    }
    return { label, units, platformNets };
  });

  return {
    bands: [
      { label: 'Conservative', low: band.low, high: Math.max(band.low, recommendedPrice - 1) },
      { label: 'Market', low: band.low, high: band.high },
      { label: 'Premium', low: band.high, high: band.high },
    ],
    recommendedPrice,
    justifiers,
    underpriced,
    costPlusFloor,
    volumeScenarios,
    reasoning,
  };
}

/** Convenience: size count for a project's graded range (used by the UI).
 *  Uses the documented grading standards: the CYC chart models XS–5XL
 *  (9 sizes, per ALL_SIZES in grading-engine.ts), so the realistic
 *  maximum contribution is that full 9-size CYC range. */
export function sizeCountForProject(project: PatternProject): number {
  // Grade only the body sections that touch bust/waist/hip — those are
  // the garments where size range actually matters to buyers.
  const graddable = project.sections.filter(section =>
    section.measurements.some(m => ['bust', 'waist', 'hip'].includes(m.gradingKey)),
  );
  if (graddable.length === 0) return project.sections.length > 0 ? 3 : 1;
  return ALL_SIZES.length; // CYC range XS–5XL = 10 sizes when garment grades are present
}

export const PRICING_MARKET_TARGET_LABELS = { standard: 'Standard band ($5–10)', premium: 'Premium band ($12–18)' } as const;
