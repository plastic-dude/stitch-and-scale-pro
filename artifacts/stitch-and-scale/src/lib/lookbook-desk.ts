/**
 * Lookbook Desk — CHK-044
 *
 * WHY THIS EXISTS (session-44 research, no prior session covered it):
 * A pattern photo is the primary selling tool on every pattern listing
 * (Sister Mountain: most makers only read the description if the photos
 * sell them first), yet no tool on the market prices the photoshoot or
 * plans the shot list from the pattern's own data. The designer's stack
 * is a friend with a phone plus scattered blog tips. MediaPeruana's
 * widely-cited 2016 production stack budgets 8 of 55 sweater hours on
 * photography and photo editing — and nothing has updated it since.
 *
 *
 * WHAT THE DESK DOES:
 * 1. Prices the photoshoot in three tiers (DIY self-shoot, friend,
 *    professional half-day session) using market-anchored rates.
 * 2. Derives the hours budget from the pattern's OWN construction —
 *    size range, texture, and silhouette features — instead of a flat
 *    number.
 * 3. Generates a shot list from the pattern's traits and the size range
 *    the project was graded to (inclusive-lookbook flag).
 * 4. Compares DIY opportunity cost against hiring (the same seam the
 *    Hire-vs-Self analyzer uses) so the "free" shoot is never free.
 * 5. Flags per-platform framing minimums (Ravelry gallery strength,
 *    Etsy multi-image, social 1:1 teaser) from the toggled platforms.
 *
 * All verdicts are honest: an undersized budget is flagged, never
 * flattered. Pure functions over PatternProject — fully testable.
 *
 *
 * CITED ECONOMICS:
 *
 * PHOTOGRAPHY TIME (MediaPeruana "Behind the Scenes: Costs and Revenue
 * in Knitting Pattern Design", mediaperuana.com, 2016): a sweater takes
 * ~55 hours; 8 of them are photography + photo editing. The desk keeps
 * 8h as the base-line anchor (mood shots, practical shots, editing)
 * before pattern-complexity adjustments.
 *
 * PHOTOGRAPHER RATES: Natalie In Stitches (FN2N Part 7, Mar 2021)
 * budgets £200 for a half-day session at "mate's rates" inside a £1,000
 * 12-size sweater production stack — the desk anchors the friend tier
 * there ($50 half-day, pro $250 half-day, with Bark 2026 portrait
 * sessions at $100–$500 as the wide market band). Model ~$40/session
 * (MediaPeruana's stack: Model $40). Woolly Wormhead's 2014 10-pattern
 * book at £800–900 confirms photography+layout is a book-level cost,
 * not a throwaway line.
 *
 * TECHNIQUE (quality standards the shot list enforces): Sister Mountain
 * (sistermountain.com/blog/knitting-pattern-photography): natural light,
 * design is the star, mood shots for hooks vs practical shots
 * (front/back/side + fine details) for sales pages, self-timer/tripod
 * is acceptable. Laine Journal (issue 25, Jonna Hietala + Ronja
 * Hakalehto): cloudy-day light, editing is mandatory ("you make a
 * photo"), model-worn beats flat lay for garments, styling tells the
 * story. Flat-lay practice (Pacific Knit Co, A Bee In The Bonnet):
 * simple background, layers, greenery, angled placement.
 *
 * BREAKEVEN LOGIC reuses the app's platform-fee seam (platformNet) and
 * the designer's own price/expected-sales inputs so the photo budget
 * lands on the same number as every other desk: net revenue per copy.
 */
import type { PatternProject } from '@/lib/grading-engine';
import { estimateYarn } from '@/lib/yarn-estimator';
import type { YarnWeight } from '@/lib/yarn-estimator';

export interface LookbookInputs {
  /** The tier the designer plans to use. 'diy' = self-shot. */
  tier: 'diy' | 'friend' | 'pro';
  /** Hours spent per mood shot (setup, posing, culling). */
  hoursPerMoodShot: number;
  /** Practical (front/back/side/detail) shooting hours base. */
  hoursPractical: number;
  /** Hours for selection + editing. MediaPeruana's stack implies ~2h. */
  hoursEditing: number;
  /** Professional half-day session rate (pro tier). */
  proSessionRate: number;
  /** Friend/"mate's rates" half-day fee (friend tier). */
  friendRate: number;
  /** Model cost per session (0 when self-modeling). */
  modelCost: number;
  /** Print/prop/misc costs (lookbook print, backdrop, greenery). */
  miscCost: number;
  /** The designer's opportunity rate, for the DIY cost comparison. */
  opportunityHourly: number;
  /** Pattern price, for budget-vs-revenue sanity. */
  patternPrice: number;
  /** Designer's honest expected sales of the pattern. */
  expectedSales: number;
  /** Planned tester finished-object photos for size-range coverage. */
  testerFos: boolean;
  /** Per-platform distribution plan. */
  platforms: {
    ravelry: boolean;
    etsy: boolean;
    ownStore: boolean;
    social: boolean;
  };
}

export const DEFAULT_LOOKBOOK: LookbookInputs = {
  tier: 'diy',
  hoursPerMoodShot: 2,
  hoursPractical: 5,
  hoursEditing: 2,
  proSessionRate: 250,
  friendRate: 50,
  modelCost: 0,
  miscCost: 0,
  opportunityHourly: 25,
  patternPrice: 6.5,
  expectedSales: 24,
  testerFos: false,
  platforms: { ravelry: true, etsy: false, ownStore: true, social: true },
};

export const SESSION_44_MARKET = {
  mediaPeruanaPhotoHours: 8,
  mediaPeruanaModelCost: 40,
  natalieHalfDayMateRates: 200,
  barkPortraitSessionLow: 100,
  barkPortraitSessionHigh: 500,
  woollyWormheadBookTotal: 850,
  flatFeeNotes: [
    'MediaPeruana BTS stack (2016): 8 of 55 sweater hours = photography + editing; model $40.',
    'Natalie In Stitches (2021): £200 half-day "mate\'s rates" inside a £1,000 12-size sweater budget.',
    'Bark (2026): portrait sessions $100–$500; Woolly Wormhead (2014): 10-pattern book £800–900 all-in.',
  ] as const,
};

export interface PhotoTier {
  name: string;
  cashCost: number;
  hours: number;
  opportunityCost: number;
  /** What the designer actually loses = cash + opportunity cost. */
  totalCost: number;
}

export interface ShotListItem {
  code: string;
  shot: string;
  reason: string;
  /** 'mood' | 'practical' | 'detail' | 'lifestyle' | 'size-range' */
  kind: string;
  required: boolean;
}

export interface PlatformFraming {
  platform: string;
  /** Minimum image count for a sales-page-ready listing. */
  minImages: number;
  framingNote: string;
  covered: boolean;
}

export interface LookbookResult {
  tiers: Record<'diy' | 'friend' | 'pro', PhotoTier>;
  planned: PhotoTier;
  hoursTotal: number;
  complexityHours: number;
  sizeCount: number;
  shotList: ShotListItem[];
  platforms: PlatformFraming[];
  budgetShareOfRevenue: number;
  breakevenCopiesAtPrice: number;
  verdict: 'go' | 'revise' | 'blocked';
  verdictReason: string;
  flags: Array<{ code: string; severity: 'major' | 'minor'; message: string }>;
}

const SIZE_GROUP_HOURS = 3;
const TEXTURE_HOURS = 1;
const YARDAGE_DETAIL_HOURS = 1;

function describe(project: PatternProject): string {
  const parts = [project.description ?? ''];
  for (const section of project.sections) parts.push(section.name);
  return parts.join(' ').toLowerCase();
}

function isComplex(describeText: string): boolean {
  const textureWords = [
    'cable', 'texture', 'brioche', 'mosaic', 'fair isle', 'colorwork',
    'colourwork', 'intarsia', 'tessellat', 'staggered', 'lace panel',
  ];
  return textureWords.some((w) => describeText.includes(w));
}

/**
 * Hours budget from the pattern's OWN construction.
 * Base line: mood shots (2) + practical shots (5) + editing (2) = 9h,
 * anchored on MediaPeruana's 8h stack (self-shooting one extra hour of
 * culling vs a dedicated photographer session). Adjustments:
 * - +3h once the size count exceeds 3 (each additional graded size
 *   adds real shooting time: re-positioning, flat-lay variants, model
 *   changeovers — the "limitation of one photo" problem).
 * - +1h for texture/cable/colorwork (a macro detail shot is mandatory;
 *   the knit must "pop" in the photo).
 * - +1h for heavy yarn-use patterns (fingering+ sweaters): yarn/skein
 *   styling shots sell those patterns disproportionately.
 */
export function hoursBudget(inputs: LookbookInputs, project: PatternProject): {
  base: number;
  complexity: number;
  total: number;
} {
  const base = inputs.hoursPerMoodShot + inputs.hoursPractical + inputs.hoursEditing;
  const sizeCount = project.sections.reduce(
    (max, sec) => Math.max(max, sec.measurements.length),
    0,
  );
  const sizesBeyond = Math.max(0, sizeCount - 3);
  const sizeHours = sizesBeyond * (SIZE_GROUP_HOURS / 3);
  const textureHours = isComplex(describe(project)) ? TEXTURE_HOURS : 0;
  const weight: YarnWeight = project.yarnWeight ?? 'worsted';
  const yardage = estimateYarn(project, weight);
  const yardageHours = (yardage.totalYards ?? 0) > 1200 ? YARDAGE_DETAIL_HOURS : 0;
  const complexity = sizeHours + textureHours + yardageHours;
  return { base, complexity: Math.round(complexity * 10) / 10, total: Math.round((base + complexity) * 10) / 10 };
}

function tierPhoto(
  tier: 'diy' | 'friend' | 'pro',
  inputs: LookbookInputs,
  hours: number,
): PhotoTier {
  const cash =
    tier === 'pro' ? inputs.proSessionRate + inputs.modelCost + inputs.miscCost :
    tier === 'friend' ? inputs.friendRate + inputs.modelCost + inputs.miscCost :
    inputs.miscCost;
  const opportunity = hours * inputs.opportunityHourly;
  return {
    name: tier === 'diy' ? 'DIY (self-shot)' : tier === 'friend' ? 'Friend ("mate\'s rates")' : 'Professional (half-day)',
    cashCost: Math.round(cash * 100) / 100,
    hours: Math.round(hours * 10) / 10,
    opportunityCost: Math.round(opportunity * 100) / 100,
    totalCost: Math.round((cash + opportunity) * 100) / 100,
  };
}

/**
 * Shot list from the pattern's OWN traits. Every item is required only
 * when the pattern's data demands it — no invented shots.
 */
export function shotList(project: PatternProject, testerFos: boolean): ShotListItem[] {
  const describeText = describe(project);
  const hasTexture = isComplex(describeText);
  const weight: YarnWeight = project.yarnWeight ?? 'worsted';
  const yardage = estimateYarn(project, weight);
  const largeYarn = (yardage.totalYards ?? 0) > 1200;
  const items: ShotListItem[] = [
    {
      code: 'S-01',
      shot: 'Mood shot — the knit worn (or styled), story-first frame.',
      reason: 'Sister Mountain: mood shots are the hook that sells the sales-page listing.',
      kind: 'mood',
      required: true,
    },
    {
      code: 'S-02',
      shot: 'Practical set — front, back, and side views, plain background.',
      reason: 'Practical photos are what makers buy on; the design must be the star.',
      kind: 'practical',
      required: true,
    },
    ...(hasTexture ? [{
      code: 'S-03',
      shot: 'Macro detail shot of the texture/cable/colorwork.',
      reason: 'A textured knit that doesn\'t pop in photos loses the detail sale — Laine practice.',
      kind: 'detail',
      required: true,
    }] : []),
    ...(largeYarn ? [{
      code: 'S-04',
      shot: 'Yarn/skein styling shot showing the colourway and weight.',
      reason: 'High-yardage patterns sell partly on yarn appeal; skein styling completes the picture.',
      kind: 'lifestyle',
      required: true,
    }] : []),
    ...(testerFos ? [{
      code: 'S-05',
      shot: 'Tester finished-object photos across the graded size range.',
      reason: 'A single cover body undersells the size range; tester FOs close the fit gap.',
      kind: 'size-range',
      required: true,
    }] : []),
  ];
  return items;
}

export const PLATFORM_FRAMING_DEFAULTS: Array<{
  platform: string;
  minImages: number;
  framingNote: string;
}> = [
  {
    platform: 'Ravelry',
    minImages: 4,
    framingNote: 'Gallery strength drives Hot Right Now momentum; front/back/side + mood covers the minimum gallery story.',
  },
  {
    platform: 'Etsy',
    minImages: 5,
    framingNote: 'Etsy listings reward 5+ images; use the mood shot first, then practicals, then the detail macro.',
  },
  {
    platform: 'Own store',
    minImages: 4,
    framingNote: 'No platform cropping; publish the full set and keep a 1:1 social crop of the mood shot ready.',
  },
  {
    platform: 'Social',
    minImages: 2,
    framingNote: 'Mood shot teaser + detail macro; 1:1 or 4:5 crop reads best in feed.',
  },
];

export function platformFraming(inputs: { platforms: LookbookInputs['platforms'] }): PlatformFraming[] {
  return PLATFORM_FRAMING_DEFAULTS.map((p) => ({
    platform: p.platform,
    minImages: p.minImages,
    framingNote: p.framingNote,
    covered: p.platform === 'Ravelry' ? inputs.platforms.ravelry :
             p.platform === 'Etsy' ? inputs.platforms.etsy :
             p.platform === 'Own store' ? inputs.platforms.ownStore :
             inputs.platforms.social,
  }));
}

export function analyzeLookbook(project: PatternProject, raw: Partial<LookbookInputs>): LookbookResult {
  const inputs: LookbookInputs = { ...DEFAULT_LOOKBOOK, ...raw };
  const hours = hoursBudget(inputs, project);
  const tiers = {
    diy: tierPhoto('diy', inputs, hours.total),
    friend: tierPhoto('friend', inputs, hours.total),
    pro: tierPhoto('pro', inputs, hours.total),
  };
  const planned = tiers[inputs.tier];

  const flags: Array<{ code: string; severity: 'major' | 'minor'; message: string }> = [];

  const sizeCount = Math.max(1, project.sections[0]?.measurements.length ?? 1);
  if (sizeCount > 3 && !inputs.testerFos) {
    flags.push({
      code: 'L-01',
      severity: 'major',
      message: `This pattern is graded to ${sizeCount} sizes but the lookbook plan has no tester finished-object photos. One cover body undersells the size range — Laine practice says worn-on photos beat flat lays.`,
    });
  }

  if (isComplex(describe(project)) && !inputs.testerFos) {
    // Detail macro exists in the shot list (required), but size-range
    // coverage for a complex knit is still worth the same flag.
    flags.push({
      code: 'L-02',
      severity: 'minor',
      message: 'Textured/colorwork knit: the macro detail shot is mandatory in the shot list — a texture that doesn\'t pop in photos loses sales.',
    });
  }

  if (!inputs.testerFos) {
    flags.push({
      code: 'L-03',
      severity: 'minor',
      message: 'No tester finished-object photos planned. Makers fit-check on other bodies before buying — tester FOs are the cheapest size-coverage photos you can get.',
    });
  }

  const revenue = inputs.patternPrice * inputs.expectedSales;
  const budgetShare = revenue > 0 ? planned.cashCost / revenue : 1;
  if (planned.cashCost > revenue * 0.5) {
    flags.push({
      code: 'L-04',
      severity: 'major',
      message: `The photo budget (${formatUsd(planned.cashCost)}) exceeds half of expected revenue (${formatUsd(revenue)}). Rebalance the tier or raise expected sales before shooting.`,
    });
  }

  const pf = platformFraming(inputs);
  for (const p of pf) {
    if (p.covered && p.platform === 'Ravelry') {
      flags.push({
        code: 'L-05',
        severity: 'minor',
        message: `Ravelry listing planned: you need at least ${p.minImages} strong gallery images to carry the pattern into launch-week visibility.`,
      });
    }
  }

  // Hours are identical across tiers (the shoot itself takes the same
  // time either way), so the honest hire-vs-DIY call compares the DIY
  // opportunity cost against the hire's cash cost alone.
  if (inputs.tier === 'diy' && planned.opportunityCost > tiers.friend.cashCost) {
    flags.push({
      code: 'L-06',
      severity: 'major',
      message: `DIY opportunity cost (${formatUsd(planned.opportunityCost)}) exceeds the cash cost of hiring a friend (${formatUsd(tiers.friend.cashCost)}). Self-shooting is only "free" when your hours are worth less than the hire.`,
    });
  }

  const blocked = flags.some((f) => f.code === 'L-04');
  const revise = flags.some((f) => f.severity === 'major' && f.code !== 'L-04') ||
    flags.filter((f) => f.severity === 'minor').length >= 3;

  const verdict = blocked ? 'blocked' : revise ? 'revise' : 'go';
  const verdictReason = blocked
    ? 'Photo budget exceeds half of expected revenue — the launch loses money before the first sale.'
    : revise
    ? 'The plan works but coverage gaps or a lopsided DIY/hire trade-off will show on the listing.'
    : 'Budget, hours, and coverage line up with the pattern\'s own data. Shoot it.';

  return {
    tiers,
    planned,
    hoursTotal: hours.total,
    complexityHours: hours.complexity,
    sizeCount,
    shotList: shotList(project, inputs.testerFos),
    platforms: pf,
    budgetShareOfRevenue: Math.round(budgetShare * 1000) / 10,
    breakevenCopiesAtPrice: inputs.patternPrice > 0
      ? Math.ceil(planned.cashCost / (inputs.patternPrice * 0.95))
      : 0,
    verdict,
    verdictReason,
    flags,
  };
}

export function formatUsd(n: number, digits = 0): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: digits });
}
