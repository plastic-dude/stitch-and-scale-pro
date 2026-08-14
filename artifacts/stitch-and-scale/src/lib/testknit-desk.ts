/**
 * Test Knit Desk — session 43 research. No tool on the market attaches a
 * test-knit desk to the pattern's own data. Designers run tests on a
 * Google-sheets/Instagram patchwork; Yarnpond (2018) is the only dedicated
 * player, and its own users report testers ghosting and no budget math;
 * Ribblr locks patterns into its format. The desk prices the test before
 * it happens:
 *
 *  1. Roster economics — paid sample knitters ($0.10–0.40/yard, typical
 *     $0.15–0.30), unpaid testers rewarded with the final pattern + extras.
 *     Yardage comes straight from the project's own yarn estimator.
 *  2. Size coverage — graded sizes as recruitment targets (every size at
 *     least one knitter; big sizes double-covered, per FatTestKnits practice).
 *  3. Pre-launch readiness — a tech-edit-audit-clean pattern wastes far
 *     less of everyone's time; score below the bar raises an R-04 flag.
 *  4. Verdict with market-sourced red flags (R-01…R-06).
 *
 * Market anchors (cited in SESSION_43_MARKET):
 *  - Labor pricing $0.10–0.40/yard (r/AdvancedKnitting, Jan 2025; typical
 *    $0.15–0.30/yard per Nest Creative Works, Nov 2025).
 *  - Kristen TenDyke: $0.12/yard knit, $0.10/yard crochet.
 *  - Sample knitting $75–200/sample (Holly Priestley via The Penny
 *    Hoarder); Jeanette Sloan 12p/metre up to £105; fair floor ≥ $0.18/yard
 *    (r/craftsnark); Woolly Wormhead ~£35/pattern, 2 testers avg.
 *  - Common test failures = missing instructions, glossary gaps, no
 *    stitch counts after inc/dec rows, inconsistent punctuation and
 *    abbreviations, grading issues (Nest Creative Works).
 *  - Sample knitting requires surrendering the finished object.
 *
 * Pure math — no DOM, no storage.
 */
import { estimateYarn, type YarnWeight } from './yarn-estimator';
import { runTechEditAudit } from './tech-edit-audit';
import type { PatternProject } from './grading-engine';
import { gradePattern, ALL_SIZES } from './grading-engine';

export interface TesterInput {
  handle: string;
  size: string;
  /** Paid rate per yard in USD. 0 = unpaid tester. */
  ratePerYard: number;
  /** Yarn support value in USD (skeins the designer covers). */
  yarnSupport: number;
  extras: string[];
  feedback: string;
  status: 'invited' | 'active' | 'done' | 'ghosted';
}

export interface TestKnitInputs {
  /** USD per yard paid to sample knitters. Typical 0.15–0.30. */
  ratePerYard: number;
  /** Free final pattern for every tester? */
  freeFinalPattern: boolean;
  /** Extra free pattern from the store (USD value). */
  extraPatternValue: number;
  /** Social-feature promise: credit + tagged feature. */
  socialFeature: boolean;
  /** Priority early access to the next test. */
  earlyAccess: boolean;
  /** Days of yarn support (USD) for unpaid testers. */
  yarnSupportPerTester: number;
  /** Test deadline in days from start. */
  deadlineDays: number;
  /** Feedback due days after finish. */
  feedbackDays: number;
  /** Paid sample knitters hired (surrender finished object). */
  sampleKnitters: number;
  /** Yarn weight used for the yardage basis. Defaults to worsted. */
  weight?: YarnWeight;
  /** Tech-edit score threshold below which R-04 fires. */
  auditScore: number;
  testers: TesterInput[];
}

export const DEFAULT_TESTKNIT: TestKnitInputs = {
  ratePerYard: 0.18,
  freeFinalPattern: true,
  extraPatternValue: 7,
  socialFeature: true,
  earlyAccess: true,
  yarnSupportPerTester: 0,
  deadlineDays: 21,
  feedbackDays: 7,
  sampleKnitters: 0,
  auditScore: 100,
  testers: [],
};

/** Session-43 market anchors. */
export const SESSION_43_MARKET = {
  rateLow: 0.1,
  rateHigh: 0.4,
  rateTypicalLow: 0.15,
  rateTypicalHigh: 0.3,
  fairFloor: 0.18, // r/craftsnark "18 cents a yard at least"
  tenDykeKnit: 0.12,
  tenDykeCrochet: 0.1,
  sampleLow: 75,
  sampleHigh: 200, // Holly Priestley via The Penny Hoarder
  jeanetteSloanCap: 105, // GBP — 12p/metre up to £105
  wormheadAvg: 35, // GBP per pattern, ~2 testers
  sources: [
    'r/AdvancedKnitting pricing thread (Jan 2025)',
    'Nest Creative Works test-knit guide (Nov 2025)',
    'Kristen TenDyke: how to hire sample knitters ($0.12/yd knit, $0.10/yd crochet)',
    'The Penny Hoarder: Holly Priestley $75–200 per sample',
    'Jeanette Sloan: 12p/metre up to £105',
    'Woolly Wormhead: ~£35/pattern, 2 testers',
    'r/craftsnark fair sample wage ≥ $0.18/yd',
    'FatTestKnits: big sizes double-covered in testing calls',
  ],
};

export interface SizeCoverage {
  size: string;
  /** How many testers knit this size. */
  testers: number;
  /** Whether the size is at least covered once. */
  covered: boolean;
  /** Big sizes need double coverage (FatTestKnits practice). */
  doubleTarget: boolean;
  gap: boolean;
}

export interface SamplePay {
  /** Sample-knitter pay if the finished object is surrendered. */
  sampleKnitterPay: number;
  /** Yardage basis in yards (base size from the project's own estimator). */
  yards: number;
  /** Market-typical pay band at typical rates. */
  typicalLow: number;
  typicalHigh: number;
}

export interface TestKnitResult {
  /** Total cash out the door. */
  cashTotal: number;
  /** Cash spent on paid testers/sample knitters. */
  paidTotal: number;
  /** Yarn-support dollars (designer covers skeins). */
  yarnSupportTotal: number;
  /** Non-cash rewards value (final pattern, extras, social, early access). */
  rewardValue: number;
  /** Non-cash value per unpaid tester (fairness check vs paid rates). */
  rewardPerUnpaidTester: number;
  /** Sample-knitter estimate at the set rate. */
  samplePay: SamplePay;
  /** Size coverage vs graded sizes. */
  coverage: SizeCoverage[];
  /** Graded sizes with zero testers. */
  uncoveredSizes: string[];
  /** Days until the roster is complete at the deadline. */
  daysToDeadline: number;
  verdict: 'ready' | 'revise' | 'blocked';
  verdictReason: string;
  flags: { code: string; severity: 'error' | 'warning' | 'info'; message: string }[];
}

/** Sizes the project grades across. The raw project measurements carry
 *  no per-size values — gradePattern derives the full grade for every
 *  measurement from the standards table, so every measurement with a
 *  positive base value implies the full size run. */
function gradedSizes(project: PatternProject): string[] {
  const grade = gradePattern(project);
  if (grade.length === 0 || grade.some(s => s.measurements.length === 0)) return [];
  // If any graded measurement exists, the project grades to the full run.
  const hasGraded = grade.some(s => s.measurements.some(m => m.gradedValues.length > 0));
  if (!hasGraded) return [];
  return ALL_SIZES;
}

/** Is this a plus/extended size? Anything past the 5th standard grade
 *  (XS S M L XL) counts as big-size territory for coverage targets. */
function isBigSize(idx: number): boolean {
  return idx >= 5;
}

/** Roster cash: testers × yardage × their rate + yarn support. */
function rosterCash(project: PatternProject, testers: TesterInput[], weight: YarnWeight): number {
  const yards = estimateYarn(project, weight).totalYards;
  return testers.reduce(
    (sum, t) => sum + yards * t.ratePerYard + t.yarnSupport,
    0,
  );
}

export function analyzeTestKnit(project: PatternProject, raw: Partial<TestKnitInputs>): TestKnitResult {
  const inputs: TestKnitInputs = { ...DEFAULT_TESTKNIT, ...raw };
  const { ratePerYard } = inputs;
  const yardage = estimateYarn(project, inputs.weight ?? 'worsted');
  const yards = yardage.totalYards;

  const paid = inputs.testers.filter(t => t.ratePerYard > 0);
  const unpaid = inputs.testers.filter(t => t.ratePerYard === 0);
  const ghosts = inputs.testers.filter(t => t.status === 'ghosted');
  const paidTotal = paid.reduce((sum, t) => sum + yards * t.ratePerYard, 0);
  const yarnSupportTotal = inputs.testers.reduce((sum, t) => sum + t.yarnSupport, 0);

  // Non-cash rewards per unpaid tester: final pattern + extras + yarn support.
  let reward = 0;
  if (inputs.freeFinalPattern) reward += 9; // typical indie sweater-pattern price
  reward += inputs.extraPatternValue;
  const extrasPerTester = inputs.socialFeature ? 2 : 0; // social capital value (industry shorthand)
  const earlyAccessValue = inputs.earlyAccess ? 2 : 0;
  const rewardPerUnpaidTester = reward + extrasPerTester + earlyAccessValue +
    (yarnSupportTotal / Math.max(1, unpaid.length)) * (unpaid.length / Math.max(1, unpaid.length));
  const rewardValue =
    unpaid.length * (reward + extrasPerTester + earlyAccessValue) +
    paid.length * (inputs.socialFeature ? extrasPerTester : 0) +
    yarnSupportTotal;

  const sampleKnitterPay = yards * ratePerYard;
  const typicalLow = Math.round(yards * SESSION_43_MARKET.rateTypicalLow);
  const typicalHigh = Math.round(yards * SESSION_43_MARKET.rateTypicalHigh);
  const samplePay: SamplePay = {
    sampleKnitterPay: Math.round(sampleKnitterPay),
    yards,
    typicalLow,
    typicalHigh,
  };

  const grades = gradedSizes(project);
  const coverage: SizeCoverage[] = grades.map((size, idx) => {
    const testers = inputs.testers.filter(t => t.size === size && t.status !== 'ghosted').length;
    const doubleTarget = isBigSize(idx);
    return { size, testers, covered: testers >= 1, doubleTarget, gap: testers < (doubleTarget ? 2 : 1) };
  });
  const uncoveredSizes = coverage.filter(c => c.gap).map(c => c.size);

  const flags: TestKnitResult['flags'] = [];

  // R-01: paid rate outside the documented market band. Checked against the
  // worst rate any paid tester would actually be paid, since roster rates
  // are what appear in the call for testers.
  const paidRates = paid.map(t => t.ratePerYard);
  const rosterMin = paidRates.length ? Math.min(...paidRates) : ratePerYard;
  const rosterMax = paidRates.length ? Math.max(...paidRates) : ratePerYard;
  if (ratePerYard > 0 && ratePerYard < SESSION_43_MARKET.rateLow) {
    flags.push({ code: 'R-01', severity: 'error', message: `Rate ${formatUsd(ratePerYard)}/yard is below the documented $0.10 floor (r/AdvancedKnitting). Testers will ghost — Yarnpond's own users report exactly that.` });
  } else if (ratePerYard > SESSION_43_MARKET.rateHigh || rosterMax > SESSION_43_MARKET.rateHigh) {
    flags.push({ code: 'R-01', severity: 'info', message: `Rate ${formatUsd(ratePerYard)}/yard exceeds the documented $0.40 ceiling — sustainable only for sample knits, not test knits.` });
  }
  if (rosterMin > 0 && rosterMin < SESSION_43_MARKET.rateLow && !(ratePerYard > 0 && ratePerYard < SESSION_43_MARKET.rateLow)) {
    flags.push({ code: 'R-01', severity: 'error', message: `A tester's rate ${formatUsd(rosterMin)}/yard is below the documented $0.10 floor (r/AdvancedKnitting). Testers will ghost — Yarnpond's own users report exactly that.` });
  } else if (rosterMin > 0 && rosterMin < SESSION_43_MARKET.fairFloor && rosterMin >= SESSION_43_MARKET.rateLow && !(ratePerYard >= SESSION_43_MARKET.rateLow && ratePerYard < SESSION_43_MARKET.fairFloor)) {
    flags.push({ code: 'R-01', severity: 'warning', message: `A tester's rate ${formatUsd(rosterMin)}/yard is inside the market band but under the $0.18 fair floor (r/craftsnark). Expect slow sign-ups.` });
  }

  // R-02: every size covered.
  if (grades.length > 0 && uncoveredSizes.length > 0) {
    flags.push({ code: 'R-02', severity: 'error', message: `Uncovered sizes: ${uncoveredSizes.join(', ')}. Every graded size needs at least one knitter — a tester can only find the errors in the size they knit.` });
  } else if (grades.length > 0 && coverage.some(c => c.doubleTarget && c.testers < 2)) {
    flags.push({ code: 'R-02', severity: 'warning', message: `Big sizes (${coverage.filter(c => c.doubleTarget && c.testers < 2).map(c => c.size).join(', ')}) are covered once but the size-inclusive standard is double coverage (FatTestKnits practice).` });
  }

  // R-03: unpaid testers under-rewarded vs the paid benchmark.
  if (unpaid.length > 0 && !inputs.freeFinalPattern && inputs.extraPatternValue === 0 && inputs.yarnSupportPerTester === 0) {
    flags.push({ code: 'R-03', severity: 'warning', message: `Unpaid testers get no final pattern, no store extra, no yarn support — the documented minimum reward is the free final pattern (Nest Creative Works, Woolly Wormhead).` });
  } else if (unpaid.length > 0 && rewardPerUnpaidTester > 0 && ratePerYard > 0 && rewardPerUnpaidTester < yards * SESSION_43_MARKET.rateTypicalLow) {
    flags.push({ code: 'R-03', severity: 'info', message: `Non-cash reward ≈ ${formatUsd(rewardPerUnpaidTester)}/tester vs a typical ${formatUsd(typicalLow / 100)}–${formatUsd(typicalHigh / 100)} paid test — transparent in the call so testers self-select honestly.` });
  }

  // R-04: pre-launch audit readiness (self-edit before testing — Craft Industry Alliance).
  const audit = runTechEditAudit(project);
  const auditLow = audit.score < inputs.auditScore && audit.score < 80;
  if (auditLow) {
    flags.push({ code: 'R-04', severity: 'warning', message: `Audit score ${audit.score}/100 before testing. The most common test-knit failures (missing stitch counts, glossary gaps, grading issues) are exactly what the tech-edit sweep catches — cleaners patterns waste fewer tester hours.` });
  }

  // R-05: ghosted testers.
  if (ghosts.length > 0) {
    flags.push({ code: 'R-05', severity: 'warning', message: `${ghosts.length} tester(s) ghosted — the documented Yarnpond failure mode. Fill gaps from the Testing Pool or own tester group before the deadline.` });
  }

  // R-06: deadline tightness (sweater tests typically 3–4 weeks).
  if (inputs.deadlineDays < 14) {
    flags.push({ code: 'R-06', severity: 'error', message: `A ${inputs.deadlineDays}-day deadline is tight for a garment test (typical 3–4 weeks). Testers who can't commit honestly won't sign up.` });
  } else if (inputs.deadlineDays > 45) {
    flags.push({ code: 'R-06', severity: 'info', message: `A ${inputs.deadlineDays}-day window is long for a single pattern test — momentum dies; consider 3–4 weeks.` });
  }

  // Sample knitter framing: surrender of finished object.
  if (inputs.sampleKnitters > 0) {
    flags.push({ code: 'R-06', severity: 'info', message: `${inputs.sampleKnitters} sample knitter(s) at ${formatUsd(samplePay.sampleKnitterPay)} (typical market ${formatUsd(typicalLow)}–${formatUsd(typicalHigh)}). Sample knitters surrender the finished object — testers keep theirs.` });
  }

  const errors = flags.filter(f => f.severity === 'error').length;
  const verdict: TestKnitResult['verdict'] =
    errors > 0 || uncoveredSizes.length > 0 ? 'blocked' :
      flags.filter(f => f.severity === 'warning').length > 0 ? 'revise' : 'ready';
  const verdictReason = verdict === 'ready'
    ? `Every graded size covered${coverage.some(c => c.doubleTarget) ? ' and big sizes double-covered' : ''}, rate inside the market band, and a ${inputs.deadlineDays}-day deadline — launch the call.`
    : verdict === 'revise'
      ? 'Tighten the flagged items before posting the call.'
      : 'Cover the missing sizes and resolve errors before posting — an incomplete call burns tester goodwill.';

  const cashTotal = paidTotal + yarnSupportTotal + inputs.sampleKnitters * samplePay.sampleKnitterPay;

  return {
    cashTotal,
    paidTotal,
    yarnSupportTotal,
    rewardValue,
    rewardPerUnpaidTester,
    samplePay,
    coverage,
    uncoveredSizes,
    daysToDeadline: inputs.deadlineDays,
    verdict,
    verdictReason,
    flags,
  };
}

export function formatUsd(n: number, digits = 2): string {
  return '$' + n.toFixed(digits);
}
