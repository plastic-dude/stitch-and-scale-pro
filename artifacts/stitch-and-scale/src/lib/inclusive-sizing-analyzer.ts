/**
 * CHK-024 — Inclusive Sizing & Adaptive Grading Analyzer.
 *
 * The competitor flaw this exploits: every tool treats the size range as a
 * free checkbox. Jill Wolcott (a working patternmaker who teaches her own
 * grading course) says outright that her inclusive-grading costs "exceed their
 * market price", and craftsnark shoppers now litmus-test "size inclusive"
 * claims for shoddy plus grading. Grading more sizes is not free — each extra
 * size multiplies grading passes, yardage re-estimation, test-knit hours and
 * tech-edit counts — and nobody prices it. Adaptive construction (magnetic
 * closures, seated-rise sweaters, sensory-flat seams — the Iowa State
 * adaptive-apparel syllabus) is bespoke consulting work that deserves its own
 * fees. This library puts a real number on all of it.
 *
 * Cited anchors:
 * - $5 per extra size editor adder (fixed-rate tech editors)
 * - $12/hr professional floor; $25/hr default design rate
 * - 30yd/hr sample knitting (shared yardage seam +10% swatches)
 * - Ysolda Teague chart standard: 2"/5cm grade rule, XXS–7XL, cup sizing
 * - 6+ measurements needed for plus bodies (bicep, shoulder, full bust,
 *   waist, hip, sleeve length) per plus-knitter buying criteria
 */

import { PatternProject } from '@/lib/grading-engine';
import { estimateYarn, YarnWeight } from '@/lib/yarn-estimator';
import { platformNet, PlatformId } from '@/lib/pattern-income-calculator';

// ---------------- constants & types ----------------

export const PROFESSIONAL_FLOOR = 12;
export const DEFAULT_DESIGN_RATE = 25;
export const KNIT_YARDS_PER_HOUR = 30;
export const EDITOR_PER_EXTRA_SIZE = 5;
export const EDITOR_BASE_GARMENT = 50;
export const GRADE_HOUR_PER_SIZE_PER_MEASUREMENT = 0.45; // grading pass incl. math + proofing
export const YARDAGE_REESTIMATE_HOUR_PER_SIZE = 0.5;
export const TEST_KNIT_HOUR_PER_SIZE_BAND = 2.5; // larger-size test knit time grows ~25% per band (2XL ≈ $147 cost vs 150% yards)
export const LARGE_SIZE_YARDAGE_MULTIPLIER = 1.25; // 2XL knits cost ~147 vs small-size equivalent
export const WOLCOTT_THRESH = 6; // "small range" boundary — effort steepens past it

export type SizeOption = {
  label: string;
  bust: number; // inches
  cup?: 'A' | 'B' | 'C' | 'D' | 'DD' | 'E' | 'F';
  broadShoulders?: boolean;
};

export type AdaptiveMod = {
  id: string;
  label: string;
  hours: number;
  description: string;
};

export const ADAPTIVE_MODS: AdaptiveMod[] = [
  { id: 'magnetic-closure', label: 'Magnetic / adaptive closure band', hours: 3, description: 'Full-width magnet or Velcro front band replacing knit-in buttons; easier donning for limited dexterity (Iowa State adaptive syllabus).' },
  { id: 'long-side-opening', label: 'Extended side-seam opening', hours: 1.5, description: 'Full-length side zip or snap strip — wheelchair users reach forward constantly; front openings help seated dressing.' },
  { id: 'seated-rise', label: 'Seated-fit grading', hours: 2.5, description: 'Back-lengthened, front-shortened grading so the sweater sits level when worn seated; waistline measured seated, rise taken from chair seat to waist.' },
  { id: 'flat-sensory-seams', label: 'Sensory-flat seam construction', hours: 2, description: 'Flat-locked seam style, seams relocated off pressure points, tag removal; for sensory sensitivity.' },
  { id: 'thigh-pockets', label: 'Thigh / knee pockets', hours: 1.5, description: 'Extra pockets for medical items; thigh or knee placement serves wheelchair users.' },
  { id: 'donning-loops', label: 'Donning loops at waistband', hours: 0.75, description: 'Loops woven into the waistband or hem to help self-dressing.' },
  { id: 'adjustable-hem', label: 'Adjustable hem slit / zip', hours: 1.25, description: 'Zipped or slitted hem for seated comfort and mobility.' },
  { id: 'extended-cuff', label: 'Extended cuff / zipper length', hours: 1, description: 'Longer cuff openings or zippers for prosthetics, casts and swelling accommodation.' },
];

export type InclusiveInputs = {
  project: PatternProject;
  yarnWeight: YarnWeight;
  platform: PlatformId;
  patternPrice: number;
  monthlySales: number;
  designRate: number; // $/hr, falls back to DEFAULT_DESIGN_RATE
  sizeOptions: SizeOption[]; // the intended release size range
  includeCupOptions: boolean;
  includePetiteTall: boolean;
  gradeRule: number; // inches between sizes at chest (2 = Ysolda standard)
  mods: string[]; // adaptive mod ids
};

export type InclusivityAuditItem = {
  check: string;
  rationale: string;
  pass: boolean;
};

export type AuditResult = {
  score: number;
  items: InclusivityAuditItem[];
  verdict: 'genuinely-inclusive' | 'partial' | 'naive-scaling' | 'not-inclusive';
};

export type EffortResult = {
  sizeCount: number;
  largeSizeCount: number;
  gradingHours: number;
  yardageReestimateHours: number;
  yardageBySize: { label: string; bust: number; yards: number; yarnCostNote?: string }[];
  testKnitHours: number;
  techEditCost: number;
  totalEffortHours: number;
  effortCost: number;
  wolcottFlag: string | null;
};

export type PricingResult = {
  effortFloor: number;
  marketPrice: number;
  shortfall: number;
  strategy: string[];
  badgeStatement: string;
};

export type InclusiveSizingResult = {
  audit: AuditResult;
  effort: EffortResult;
  pricing: PricingResult;
  mods: { item: AdaptiveMod; fee: number }[];
  totalModFee: number;
  notes: string[];
};

// ---------------- core ----------------

export function analyzeInclusiveSizing(input: InclusiveInputs): InclusiveSizingResult {
  const designRate = Math.max(input.designRate || DEFAULT_DESIGN_RATE, PROFESSIONAL_FLOOR);
  const opts = [...input.sizeOptions].sort((a, b) => a.bust - b.bust);
  const sizeCount = opts.length;
  const largeSizeCount = opts.filter(o => o.bust >= 44).length;

  const audit = runInclusivityAudit(input, opts);
  const effort = computeEffort(input, opts, sizeCount, largeSizeCount, designRate);
  const pricing = computePricing(input, effort, sizeCount, designRate);
  const mods = input.mods
    .map(id => ADAPTIVE_MODS.find(m => m.id === id))
    .filter((m): m is AdaptiveMod => !!m)
    .map(m => ({ item: m, fee: Math.round(m.hours * designRate) }));
  const totalModFee = mods.reduce((s, m) => s + m.fee, 0);

  const notes: string[] = [];
  if (audit.score <= 4) {
    notes.push(`Audit score ${audit.score}/10 — buyers now litmus-test "size inclusive" claims; publishing with shoddy plus grading costs reviews and repeat buyers (craftsnark thread: knitters accuse designers of sizing to 5XL "just so they can say" inclusive).`);
  }
  if (effort.wolcottFlag) notes.push(effort.wolcottFlag);
  if (largeSizeCount > 0) {
    notes.push(`Plus sizes cost more to make: a 2XL sweater knits to about $147 of yarn/time versus small sizes — your yardage estimates grow ~25% per size band (craftsnark), so every plus size needs re-estimated yardage and its own schematic.`);
  }
  if (pricing.shortfall > 0) {
    notes.push(`Your effort floor ($${pricing.effortFloor.toFixed(0)}) exceeds a typical self-published pattern's launch value at this price — Wolcott's own words: inclusive grading costs "exceed their market price". Price the range or the strategy below, not the checkbox.`);
  }
  notes.push(`Grade rule: ${input.gradeRule}" between chest sizes. Ysolda's free designer chart (XXS–7XL, cup sizing, broad shoulders) is the commodity reference — the 2"/5cm rule is the standard; what you sell is the audit and the fit, not the numbers.`);
  notes.push(`Adaptive modifications are bespoke consulting, not pattern extras — the Iowa State adaptive-apparel syllabus lists each by technique (seated-rise grading, magnetic bands, sensory-flat seams, thigh pockets). Quote them separately at ${designRate}/hr.`);

  return { audit, effort, pricing, mods, totalModFee, notes };
}

function runInclusivityAudit(input: InclusiveInputs, opts: SizeOption[]): AuditResult {
  // Build the measurement-set description from the project itself.
  const measurementCount = input.project.sections.reduce(
    (s, sec) => s + sec.measurements.length,
    0,
  );

  const items: InclusivityAuditItem[] = [
    {
      check: `Rich measurement chart — ${measurementCount} measurements defined`,
      rationale: `Plus-size knitters refuse patterns that only give chest and length; they want bicep, shoulder, full bust, waist, hip and sleeve length before buying (craftsnark buying criteria). Aim for 6+ independent measurements.`,
      pass: measurementCount >= 6,
    },
    {
      check: `Consistent grade rule — ${input.gradeRule}" between sizes at chest`,
      rationale: `Ysolda's chart uses a 2" grade rule with graduated gaps; inconsistent jumps (2" then 4") force between-size knitters into a wrong size — the classic shoddy-grading complaint.`,
      pass: input.gradeRule >= 2 && input.gradeRule <= 4,
    },
    {
      check: `Range reaches 7XL territory — max bust ${Math.max(...opts.map(o => o.bust))}"`,
      rationale: `Ysolda's community chart tops out at 7XL (~71"); the genuinely-inclusive standard stops at "no sizes left out", not "a few extra".`,
      pass: Math.max(...opts.map(o => o.bust)) >= 60,
    },
    {
      check: `Cup-shape options for full busts`,
      rationale: `Plus bodies gain padding non-proportionally — Wolcott grades from an hourglass base, not a scaled average; without cup options the armhole and neckline drift on every graded size.`,
      pass: input.includeCupOptions && opts.some(o => o.cup),
    },
    {
      check: `Petite / tall length variants`,
      rationale: `The sizing data everyone uses is 5'4"–5'7" cis women by default; petite/tall lengths are how the same grade rule serves bodies outside that band.`,
      pass: input.includePetiteTall,
    },
    {
      check: `Broad-shoulder notes or non-gendered framing`,
      rationale: `Broad shoulders are included in Ysolda's 2026 chart for gender-inclusive fit; inclusive sizing means the body gets considered, not just resized.`,
      pass: opts.some(o => o.broadShoulders) || input.includeCupOptions,
    },
  ];
  const score = items.filter(i => i.pass).length;
  const verdict: AuditResult['verdict'] =
    score >= 5 ? 'genuinely-inclusive'
    : score >= 3 ? 'partial'
    : score >= 2 ? 'naive-scaling'
    : 'not-inclusive';

  return { score, items, verdict };
}

function computeEffort(
  input: InclusiveInputs,
  opts: SizeOption[],
  sizeCount: number,
  largeSizeCount: number,
  designRate: number,
): EffortResult {
  const measurementCount = Math.max(
    input.project.sections.reduce((s, sec) => s + sec.measurements.length, 0),
    1,
  );
  // Extra sizes beyond the base 5-size grade pass: each costs a full grading pass.
  const extraSizes = Math.max(sizeCount - 5, 0);
  const gradingHours = measurementCount * (1.5 + extraSizes * GRADE_HOUR_PER_SIZE_PER_MEASUREMENT);
  // (editor-per-size is folded into the tech-edit line below, keep grading pure)
  const yardageReestimateHours = extraSizes * YARDAGE_REESTIMATE_HOUR_PER_SIZE;

  // Yardage per size via the shared seam — scale the base estimate.
  const base = estimateYarn(input.project, input.yarnWeight);
  const baseYards = Number.isFinite(base.totalYards) ? base.totalYards : 0;
  const yardageBySize = opts.map(o => {
    const band = Math.max(0, (o.bust - (opts[0]?.bust ?? 34)) / 4);
    const mult = opts.length > 1 ? 1 + (band / (opts.length - 1)) * (LARGE_SIZE_YARDAGE_MULTIPLIER - 1) : 1;
    const yards = Math.round(baseYards * mult);
    return {
      label: o.label,
      bust: o.bust,
      yards,
      yarnCostNote: o.bust >= 44 ? `plus-size yardage grown ~${Math.round((mult - 1) * 100)}% — needs its own schematic and test knit` : undefined,
    };
  });

  // Test-knit hours: 2XL knits cost ~$147 vs small-size ~$100s — time grows per plus band.
  const testKnitHours = sizeCount * 1.5 + largeSizeCount * TEST_KNIT_HOUR_PER_SIZE_BAND;

  // Tech edit: base garment + $5 per extra size beyond 5
  const techEditCost = EDITOR_BASE_GARMENT + Math.max(extraSizes, 0) * EDITOR_PER_EXTRA_SIZE;

  const totalEffortHours = gradingHours + yardageReestimateHours + testKnitHours;
  const effortCost = totalEffortHours * designRate + techEditCost;

  const wolcottFlag =
    sizeCount > WOLCOTT_THRESH
      ? `Grading ${sizeCount} sizes is Wolcott's "hard magic" territory — effort steepens past the ~6-size small range because plus bodies are not proportional; padding distributes over the skeleton, not the average. Budget 2× the naïve hours and regrade the armhole and neckline lines, not just the circumference.`
      : null;

  return {
    sizeCount,
    largeSizeCount,
    gradingHours,
    yardageReestimateHours,
    yardageBySize,
    testKnitHours,
    techEditCost,
    totalEffortHours,
    effortCost,
    wolcottFlag,
  };
}

function computePricing(input: InclusiveInputs, effort: EffortResult, sizeCount: number, designRate: number): PricingResult {
  const selfSellNet = platformNet(input.platform, input.patternPrice, input.monthlySales).netPerSale * input.monthlySales;
  // What the range effort is worth at the design rate, plus the editor leg.
  const effortFloor = Math.max(
    effort.totalEffortHours * designRate + effort.techEditCost,
    PROFESSIONAL_FLOOR * effort.totalEffortHours,
  );
  // Reasonable range surcharge vs a 5-size baseline: per-extra-size value at 2× floor.
  const marketPrice = selfSellNet;
  const shortfall = effortFloor - marketPrice;

  const strategy: string[] = [];
  if (effort.techEditCost > 0 && sizeCount > 5) {
    strategy.push(`Price the range, not the pattern: add $${EDITOR_PER_EXTRA_SIZE}/size × ${Math.max(sizeCount - 5, 0)} extra sizes on top of your base pattern price — the editor band made public.`);
  }
  if (effort.wolcottFlag) {
    strategy.push(`Past 6 sizes, sell the extended range as a second (premium) release: one base pattern + extended-size companion. Wolcott-grade effort at 2× hours needs 2× launch pricing to clear the $12 floor.`);
  }
  if (effort.largeSizeCount > 0) {
    strategy.push(`Plus sizes = more yarn, more test-knit hours: the per-size yardage delta is visible in your launch copy — knitters pay for honest schematics and fit-tested plus grades.`);
  }
  strategy.push(`Adaptive modifications bill separately as consulting — ${designRate}/hr per technique, never bundled into the pattern price.`);

  const scoredBadge = `Genuinely graded ${sizeCount} sizes${effort.largeSizeCount > 0 ? ` including plus sizes to ${input.sizeOptions.reduce((m, o) => Math.max(m, o.bust), 0)}" bust` : ''}, ${input.gradeRule}" grade rule${input.includeCupOptions ? ', cup-shape options' : ''}${input.includePetiteTall ? ', petite/tall lengths' : ''}, full schematics per size.`;

  return { effortFloor, marketPrice, shortfall, strategy, badgeStatement: scoredBadge };
}

// ---------------- pack ----------------

export type InclusivePack = {
  items: Array<{ check: string; rationale: string; flag: boolean }>;
  launchCopy: string;
};

export function buildInclusivePack(result: InclusiveSizingResult): InclusivePack {
  const items = result.audit.items.map(i => ({ check: i.check, rationale: i.rationale, flag: !i.pass }));
  items.push({
    check: `Effort priced — ${result.effort.totalEffortHours.toFixed(1)} hrs + $${result.effort.techEditCost} edit = $${result.effort.effortCost.toFixed(0)}`,
    rationale: `Grading ${result.effort.sizeCount} sizes at Wolcott-grade depth; every extra size multiplies grading passes, yardage work and test-knit hours.`,
    flag: result.pricing.shortfall > 0,
  });
  items.push({
    check: `Plus-yardage transparency — ${result.effort.largeSizeCount} plus size${result.effort.largeSizeCount === 1 ? '' : 's'} with per-size schematics`,
    rationale: `A 2XL sweater knits to ~$147 of materials/time; plus buyers reward honest yardage and schematics per size.`,
    flag: result.effort.largeSizeCount === 0,
  });
  if (result.mods.length > 0) {
    items.push({
      check: `Adaptive mods quoted separately — $${result.totalModFee} of bespoke consulting`,
      rationale: `Adaptive construction (magnetic bands, seated-rise, sensory-flat seams) is consulting work from the adaptive-apparel syllabus, never a pattern extra.`,
      flag: false,
    });
  }
  const cleanLaunchCopy =
    `New — Graded across ${result.effort.sizeCount} sizes.\n\n` +
    `Every size in this range was graded individually — schematics, yardage and fit notes for each, including the plus sizes. ` +
    `The range was graded at real ${result.effort.sizeCount}-size depth: ${result.pricing.badgeStatement}\n\n` +
    (result.mods.length > 0
      ? `Adaptive options are available on request: ${result.mods.map(m => m.item.label).join(', ')} — quoted as bespoke work at $${result.mods[0]?.item.hours ? Math.round(result.mods[0].item.hours * DEFAULT_DESIGN_RATE) : 0}+ each.\n\n`
      : '') +
    `If your body sits between my chart and your measurements, message me — I'd rather help you adapt this pattern than have it not fit you.`;

  return { items, launchCopy: cleanLaunchCopy };
}
