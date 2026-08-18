/**
 * Release Portfolio — portfolio-level release planning over the designer's
 * full project catalogue.
 *
 * WHY THIS EXISTS (session-7 research):
 * Every design tool on the market treats one pattern at a time. A designer's
 * income, however, is a PORTFOLIO decision: which patterns to ship next, in
 * what order, at what prices, released against a calendar and cross-sold as
 * bundles. Media Peruana's catalogue analysis (2016) shows total income =
 * sales across the whole catalogue minus expenses — 200 underpriced patterns
 * earn less than a focused, well-priced handful. Sister Mountain runs a
 * monthly release cadence (Dec 2023). Bundles anchor just below the sum of
 * parts (Fit for Art's variation bundle: $36 vs $51 individual = 29%
 * discount positioning, fitforartpatterns.com). Yarn-company royalties,
 * exclusive windows, and non-exclusive licenses are distinct licensed
 * streams designers evaluate with no tooling (Stitchcraft Marketing TNNA
 * survey, 2017). Paid "maker licenses" for selling finished objects are an
 * emerging add-on designers currently improvise (r/knittingadvice Oct 2025).
 *
 * Competitors' flaw = our strength: Stitchmastery, EnvisioKnit,
 * KnitCompanion, Pattern Keeper and Ribblr all stop at the single pattern.
 * Nothing lifts the per-pattern data (already computed by the Pricing
 * Advisor, Income Planner, and Publish Toolkit) to the portfolio level.
 *
 * Pure math — no UI, no storage. Reuses existing libraries exclusively:
 * pricing advisor bands (documented market data), income-calculator fee
 * model (verified), readiness checks. Zero new fee or market constants —
 * nothing can drift.
 */
import { advisePrice, sizeCountForProject, type PricingAdvice } from '@/lib/pattern-pricing-advisor';
import { platformNet, PLATFORMS } from '@/lib/pattern-income-calculator';
import { checkReadiness, type ReadinessResult } from '@/lib/pattern-readiness';
import { PatternProject } from '@/lib/grading-engine';
import { estimateYarn } from '@/lib/yarn-estimator';

export interface PortfolioInputs {
  /** Item type declared for pricing (falls back to 'other'). */
  itemType: string;
  skillLevel: string;
  marketTarget: 'standard' | 'premium';
  hoursWorked: number;
  hourlyRate: number;
  currentPrice: number;
}

export interface PortfolioLine {
  projectId: string;
  name: string;
  /** Launch-readiness score 0–100: readiness errors deduct hard, warnings soft. */
  readinessScore: number;
  readiness: ReadinessResult;
  pricing: PricingAdvice;
  /** Estimated net per unit on the cheapest and most profitable platforms. */
  netPerUnitBest: number;
  netPerUnitWorst: number;
  /** Recommended launch order weight: readiness × revenue potential. */
  launchScore: number;
  /** Weight class for bundle matching (derived from the yarn estimate). */
  yarnWeightClass: string;
  /** Whether the pattern has enough listing material to sell. */
  listingReady: boolean;
}

/** Score readiness as 0–100: every error -25 (hard stop), every warning -10.
 *  Floor 0, cap 100. */
export function scoreReadiness(result: ReadinessResult): number {
  return Math.max(0, Math.min(100, 100 - result.errorCount * 25 - result.warningCount * 10));
}

/** Build the portfolio line for one project. Pricing inputs are the
 *  designer's declared plan (they are per-designer, not stored on the
 *  pattern data — the grading engine is the single source of truth for
 *  engineering data). */
export function buildPortfolioLine(
  project: PatternProject,
  inputs: PortfolioInputs,
): PortfolioLine {
  const readiness = checkReadiness(project);
  const sizingInputs = {
    itemType: (inputs.itemType || 'other') as never,
    skillLevel: (inputs.skillLevel || 'intermediate') as never,
    sizeCount: sizeCountForProject(project),
    techEdited: false,
    testKnitted: false,
    hoursWorked: Math.max(0, inputs.hoursWorked || 0),
    hourlyRate: Math.max(0, inputs.hourlyRate || 0),
    currentPrice: Math.max(0, inputs.currentPrice || 0),
    marketTarget: inputs.marketTarget,
  };
  const pricing = advisePrice(sizingInputs);

  const price = pricing.recommendedPrice;
  const nets = PLATFORMS.map(p => platformNet(p, price, 1).netRevenue);
  const netPerUnitBest = nets.length > 0 ? Math.max(...nets) : 0;
  const netPerUnitWorst = nets.length > 0 ? Math.min(...nets) : 0;

  // Yarn weight class groups patterns for bundle matching — patterns in
  // the same weight class knit on comparable needles and yarn budgets,
  // the classic collection logic (a hat + socks + mitts in the same
  // fingering weight = the "matching set" bundle buyers reach for).
  let yarnWeightClass = 'unknown';
  if (project.yarnWeight) {
    yarnWeightClass = project.yarnWeight;
  } else if (project.gauge) {
    const sts = project.gauge.stitchesPer4In;
    if (sts > 0) {
      // NOTE: the old code compared sts-per-4in (e.g. 20) against CYC
      // midpoints (7.5 … 3) — every gauge won as 'lace', silently distorting
      // portfolio KPIs (issue #12). CYC midpoints are stitches per INCH,
      // so divide the 4in gauge by 4 first.
      const stsPerIn = sts / 4;
      const refStitches: Record<string, number> = {
        lace: 9.25, fingering: 7.4, sport: 6.1, dk: 5.6, worsted: 4.5, bulky: 3.4, superBulky: 2.1,
      };

      let best = 'worsted';
      let bestDist = Infinity;
      for (const [w, ref] of Object.entries(refStitches)) {
        const dist = Math.abs(stsPerIn - ref);
        if (dist < bestDist) { bestDist = dist; best = w; }
      }
      yarnWeightClass = best;
    }
  }

  const listingReady = readiness.errorCount === 0 && (project.description ?? '').trim().length >= 10;

  // Launch score: readiness first (never ship a broken pattern), then
  // revenue potential per unit. Normalised 0–100.
  const readinessScore = scoreReadiness(readiness);
  const revenueFactor = Math.min(100, netPerUnitBest * 8);
  const launchScore = readinessScore * 0.6 + revenueFactor * 0.4;

  return {
    projectId: project.id,
    name: project.name || 'Untitled pattern',
    readinessScore,
    readiness,
    pricing,
    netPerUnitBest,
    netPerUnitWorst,
    launchScore,
    yarnWeightClass,
    listingReady,
  };
}

export interface BundleCandidate {
  /** Stable id for rendering. */
  id: string;
  patterns: { projectId: string; name: string; price: number }[];
  /** Bundle price = sum of parts × 0.71 (Fit for Art's observed 29% bundle
   *  discount positioning; verified against fitforartpatterns.com $36 vs
   *  $51). Never priced below the single-pattern cost-plus floor floor. */
  bundlePrice: number;
  sumOfParts: number;
  /** Extra net per bundle vs selling separately at the discounted price
   *  the designer would otherwise leave on the table. */
  bundleNetExtra: number;
  /** Best-platform net revenue from selling the bundle at bundlePrice. */
  bundleNet: number;
  /** Best-platform net revenue from selling the member patterns separately
   *  (at their individual recommended prices, no bundle discount). */
  separateNet: number;
  why: string;
}

const BUNDLE_DISCOUNT = 0.71;
const MIN_BUNDLE_SIZE = 2;

/** Find bundle candidates across the catalogue: groups sharing a yarn
 *  weight class (the "matching set" logic) plus a portfolio-wide garment
 *  bundle if there are 2+ graded garments. Returns at most 4 candidates,
 *  ordered by extra revenue unlocked. */
export function findBundles(
  lines: PortfolioLine[],
): BundleCandidate[] {
  const ready = lines.filter(l => l.readinessScore >= 60);
  const byWeight = new Map<string, typeof ready>();
  for (const line of ready) {
    if (line.yarnWeightClass === 'unknown') continue;
    const group = byWeight.get(line.yarnWeightClass) ?? [];
    group.push(line);
    byWeight.set(line.yarnWeightClass, group);
  }

  const candidates: BundleCandidate[] = [];
  let index = 0;
  const add = (group: PortfolioLine[], why: string) => {
    if (group.length < MIN_BUNDLE_SIZE) return;
    // Qualify duplicate pattern names (same name on different projects) so a
    // bundle never reads "Sweater + Sweater". e.g. "Classic Crew Neck Sweater x2".
    const nameCounts = new Map<string, number>();
    for (const l of group) nameCounts.set(l.name, (nameCounts.get(l.name) ?? 0) + 1);
    const renderName = (l: { name: string }) => {
      const count = nameCounts.get(l.name) ?? 1;
      return count > 1 ? `${l.name} \u00d7${count}` : l.name;
    };
    const members = group.map(l => ({ projectId: l.projectId, name: renderName(l), price: l.pricing.recommendedPrice }));
    const sumOfParts = members.reduce((s, m) => s + m.price, 0);
    const bundlePrice = Math.round(sumOfParts * BUNDLE_DISCOUNT * 2) / 2;
    // Extra net unlocked: bundle vs each pattern selling individually at
    // its discounted price on the best platform (conservative baseline).
    const bundleNet = Math.max(...PLATFORMS.map(p => platformNet(p, bundlePrice, 1).netRevenue));
    const separateNet = members.reduce((s, m) => s + Math.max(...PLATFORMS.map(p => platformNet(p, m.price, 1).netRevenue)), 0);
    candidates.push({
      id: `bundle-${index++}`,
      patterns: members,
      bundlePrice,
      sumOfParts,
      bundleNetExtra: Math.max(0, bundleNet - separateNet * BUNDLE_DISCOUNT),
      bundleNet: Math.round(bundleNet * 100) / 100,
      separateNet: Math.round(separateNet * 100) / 100,
      why,
    });
  };

  const weightGroupKeys = new Set<string>();
  byWeight.forEach((group, weight) => {
    add(group, `Matching set in the same yarn weight (${weight}) — pieces buyers reach for in one order.`);
    weightGroupKeys.add([...group].map(l => l.projectId).sort().join('|'));
  });

  // Portfolio garment bundle: 2+ graded garments make a "wardrobe release" bundle —
  // but only when it isn't the same member set a yarn-weight group already covers.
  const garments = ready.filter(l => l.yarnWeightClass !== 'unknown');
  if (garments.length >= 2 && !weightGroupKeys.has([...garments].map(l => l.projectId).sort().join('|'))) {
    add(garments, 'Wardrobe release — launch multiple graded garments together and cross-sell at the bundle price.');
  }

  candidates.sort((a, b) => b.sumOfParts - a.sumOfParts);
  return candidates.slice(0, 4);
}

export interface PortfolioSummary {
  lines: PortfolioLine[];
  bundles: BundleCandidate[];
  /** Patterns ready to ship now, ordered by launch score desc. */
  readyToLaunch: PortfolioLine[];
  /** Total recommended catalogue price at market (sum of recommended prices). */
  totalCatalogueValue: number;
  /** Recommended monthly release cadence benchmark (from Sister Mountain's
   *  monthly cadence, Dec 2023 — one release per month is the documented
   *  working rhythm for independent designers). */
  recommendedCadence: string;
}

/** Aggregate the catalogue into the portfolio view. */
export function buildPortfolio(
  projects: PatternProject[],
  inputs: PortfolioInputs,
): PortfolioSummary {
  const lines = projects
    .map(p => buildPortfolioLine(p, inputs))
    .sort((a, b) => b.launchScore - a.launchScore);
  const readyToLaunch = lines.filter(l => l.readinessScore >= 75);
  const bundles = findBundles(lines);
  const totalCatalogueValue = lines.reduce((s, l) => s + l.pricing.recommendedPrice, 0);
  return { lines, bundles, readyToLaunch, totalCatalogueValue, recommendedCadence: 'One release per month' };
}
