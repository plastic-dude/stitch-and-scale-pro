// Test Knit Slot Lab engine — prices a designer's test-knit program.
//
// Free test-knit pools look like they cost nothing. They don't: unpaid slots
// carry churn (testers ghost), thin size coverage, and slow launches. Paid
// slots (cash, yarn support, flat fee) buy reliability and coverage — but
// only pencil out when the launch is big enough. Nobody in the ecosystem
// (Ravelry testing pools, Yarnpond, CoordiKnit, Ribblr, Google Forms + IG)
// does this math. The designer's own data — yardage estimate, graded sizes,
// tech-edit score — makes the budgeting exact, and that's where we sit.
//
// Verified facts (session 77, Aug 2026):
// - Woolly Wormhead pays ~£35 per pattern with ~2 testers; paid benchmarks
//   cluster £35-70/pattern (nestcreativeworks.com, Nov 2025).
// - Sample knitting pays $0.10-0.40/yd (fair ~$0.15-0.30; TenDyke $0.12
//   knit/$0.10 crochet); Holly Priestley $75-200/sample; Jeanette Sloan
//   12p/metre up to ~£105/sample.
// - Natalie in Stitches (FN2N 7): a 12-size sweater production budget is
//   ~£1,000 incl. ~£200 test compensation (corrected upward as too low);
//   break-even at $10 = 100 copies.
// - Yarn support is the emerging compensation model: full (designer buys
//   yarn) or partial (e.g. 30%-off wholesale rate) (littleskein.substack,
//   Jul 2025). A 1,200yd sweater at $25/skein/200yd ≈ $150 of yarn.
// - Tester norms: garment tests 8-12 weeks; ~1 week per 200 yards
//   (littleskein). Designer management ~1-2h/week per test group.
// - Unpaid churn: "lots of testers signing up, grabbing the pattern and
//   disappearing" (Yarnpond, 2018); most designers have been ghosted.
// - Value of testing: per-size math/fit verification, error catching
//   pre-launch (missing stitch counts, grading issues — Nest), tester FO
//   photos in the Ravelry gallery at launch = conversion lift.

export type CompModel = "free" | "yarnSupportFull" | "yarnSupportPartial" | "extraPattern" | "flatCash" | "perYard" | "sample";

export interface TestKnitInput {
  /** pattern yardage total (from the yarn estimator or entered), yd */
  patternYardage: number;
  /** number of graded sizes on this pattern */
  sizeCount: number;
  /** tester slots the designer plans per size */
  slotsPerSize: number;
  /** planned test duration in weeks */
  testWeeks: number;
  /** share of slots intended as paid (0-1) */
  paidSlotShare: number;
  /** cash flat fee per paid tester, USD */
  flatFeeUsd: number;
  /** per-yard sample rate, USD/yd (defaults to $0.12) */
  perYardRateUsd: number;
  /** yarn price per skein, USD */
  yarnCostPerSkein: number;
  /** yards per skein */
  yardsPerSkein: number;
  /** discount rate for partial yarn support, 0-1 (30% off = 0.30) */
  partialSupportDiscount: number;
  /** ghost/churn rate on unpaid slots, 0-1 (typical 0.15-0.25) */
  ghostRate: number;
  /** completion reliability on paid slots, 0-1 (typical 0.95) */
  paidRetention: number;
  /** designer management hours per week across the test */
  designerMgmtHoursPerWeek: number;
  /** designer's opportunity hourly rate, USD */
  designerHourlyRate: number;
  /** expected launch-period sales baseline WITHOUT the paid tier's extra proof, USD revenue */
  launchRevenueBaseline: number;
  /** revenue lift attributable to tester social proof (FO photos + launch reviews), 0-1 */
  socialProofLiftPct: number;
  /** expected launch price per pattern copy, USD */
  launchPrice: number;
  /** platform take on sales, 0-1 (Ravelry 0.05) */
  platformFeePct: number;
  /** tech-edit quality score 0-100 — higher = fewer errors to catch, so test
   *  error-catch value scales with (1 - score/100) */
  techEditScore: number;
  /** value the designer places on one caught pre-launch error vs a
   *  post-launch support/reputation cost; USD */
  errorCatchValueUsd: number;
  /** whether to surface the sample-knitter row in the comparison table */
  includeSampleRow: boolean;
}

export interface ModelRow {
  model: CompModel;
  label: string;
  cashCost: number;
  yarnCost: number;
  timeCost: number;
  churnAdjustedSlots: number;
  totalCost: number;
  sizeCoverage: number; // share of sizes with >=1 reliable slot
  expectedErrorsCaught: number;
  socialProofValue: number; // lift-adjusted net revenue attributable
  netOutcome: number; // social proof value + error value - total cost
}

export interface FlagDetail { code: string; title: string; note: string; severity: "high" | "mid" | "low" }

export interface TestKnitResult {
  rows: ModelRow[];
  baseFreeRow: ModelRow;
  recommended: CompModel;
  /** mirrors the input toggle — the card filters the sample row on it */
  includeSampleRow: boolean;
  totalDesignerTimeHours: number;
  designerTimeCost: number;
  ghostedSlots: number;
  paidSlotsCount: number;
  errorCatchValueTotal: number;
  flags: FlagDetail[];
  verdict:
    | "Free pool covers it — launch too small for paid slots"
    | "Yarn support buys the reliability your free pool loses to ghosting"
    | "Pay flat cash for launch-critical sizes"
    | "Hire a sample knitter — the FO photos offset the cash"
    | "Paid slots don't pencil — raise the launch or cut the window";
  verdictNote: string;
}

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}

export const fmt$ = (n: number) =>
  `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

const MODEL_LABELS: Record<CompModel, string> = {
  free: "Free slot (pattern copy)",
  yarnSupportFull: "Full yarn support",
  yarnSupportPartial: "Partial yarn support (wholesale)",
  extraPattern: "Extra pattern copy",
  flatCash: "Flat cash fee",
  perYard: "Per-yard sample rate",
  sample: "Sample knitter (FO returns)",
};

/** yarn needed per tester = patternYardage, rounded up to whole skeins */
function skeinsForTester(yardage: number, yardsPerSkein: number): number {
  return Math.max(1, Math.ceil(yardage / Math.max(1, yardsPerSkein)));
}

/** cost of compensating one slot under a model, split cash / yarn */
function costPerSlot(input: TestKnitInput, model: CompModel): { cash: number; yarn: number } {
  const skeins = skeinsForTester(input.patternYardage, input.yardsPerSkein);
  const fullYarn = skeins * Math.max(0, input.yarnCostPerSkein);
  switch (model) {
    case "free":
      return { cash: 0, yarn: 0 };
    case "yarnSupportFull":
      return { cash: 0, yarn: fullYarn };
    case "yarnSupportPartial":
      return { cash: 0, yarn: fullYarn * clamp(1 - input.partialSupportDiscount, 0, 1) };
    case "extraPattern":
      return { cash: 0.5 * Math.max(0, input.launchPrice), yarn: 0 };
    case "flatCash":
      return { cash: Math.max(0, input.flatFeeUsd), yarn: 0 };
    case "perYard":
      return { cash: input.patternYardage * clamp(input.perYardRateUsd, 0, 2), yarn: 0 };
    case "sample":
      // sample knitting benchmark: $0.12/yd with FO returned for promo photos;
      // paid sample knitters (Woolly Wormhead / Holly Priestley) typically
      // also receive yarn or a yarn-heavy stipend, so the slot carries yarn
      return { cash: input.patternYardage * clamp(input.perYardRateUsd, 0, 2), yarn: fullYarn };
  }
}

export const DEFAULT_TESTKNIT: TestKnitInput = {
  patternYardage: 1200,
  sizeCount: 8,
  slotsPerSize: 2,
  testWeeks: 10,
  paidSlotShare: 0.25,
  flatFeeUsd: 40,
  perYardRateUsd: 0.12,
  yarnCostPerSkein: 25,
  yardsPerSkein: 200,
  partialSupportDiscount: 0.3,
  ghostRate: 0.2,
  paidRetention: 0.95,
  designerMgmtHoursPerWeek: 1.5,
  designerHourlyRate: 40,
  launchRevenueBaseline: 1500,
  socialProofLiftPct: 8,
  launchPrice: 9,
  platformFeePct: 5,
  techEditScore: 55,
  errorCatchValueUsd: 60,
  includeSampleRow: false,
};

export function analyzeTestKnit(input: TestKnitInput): TestKnitResult {
  const flags: FlagDetail[] = [];
  const yardage = Math.max(100, input.patternYardage);
  const sizes = Math.max(1, Math.round(input.sizeCount));
  const slotsPerSize = Math.max(1, Math.round(input.slotsPerSize));
  const testWeeks = clamp(Math.round(input.testWeeks), 2, 52);
  const paidShare = clamp(input.paidSlotShare, 0, 1);
  const ghost = clamp(input.ghostRate, 0, 1);
  const paidRet = clamp(input.paidRetention, 0.7, 1);
  const netSalesPct = 1 - clamp(input.platformFeePct, 0, 1) / 100;
  const mgmtHours = clamp(input.designerMgmtHoursPerWeek, 0, 40);
  const hourly = clamp(input.designerHourlyRate, 0, 500);
  const lift = clamp(input.socialProofLiftPct, 0, 100) / 100;
  const tech = clamp(input.techEditScore, 0, 100);
  const errValue = Math.max(0, input.errorCatchValueUsd);
  const paidSlots = Math.round(sizes * slotsPerSize * paidShare);
  const freeSlots = sizes * slotsPerSize - paidSlots;

  const models: CompModel[] = [
    "free",
    "yarnSupportFull",
    "yarnSupportPartial",
    "extraPattern",
    "flatCash",
    "perYard",
    "sample",
  ];

  const rows: ModelRow[] = models.map((model) => {
    const per = costPerSlot({ ...input, patternYardage: yardage }, model);
    // tester-side completion on the slot: paid slots retain, free slots ghost
    const reliability = model === "free" ? 1 - ghost : model === "sample" ? paidRet * 0.9 : paidRet;
    const churnSlots = Math.max(0, sizes * slotsPerSize * (1 - reliability));
    // size coverage: probability a size has at least one reliable slot
    const perSizeSlots = slotsPerSize * reliability;
    const coverage = 1 - Math.pow(1 - reliability, Math.max(1, slotsPerSize));
    // expected errors caught: pre-launch error load scales with poor tech
    // edit; each reliable tester slot catches a diminishing share
    const errorLoad = 1 - tech / 100;
    const caught = Math.min(1, perSizeSlots * 0.35) * errorLoad * sizes * 1.4;
    // social proof value: lift applies to the net revenue the program helps
    // convert; scale by coverage (photos/reviews only help if testers finish)
    const socialValue = input.launchRevenueBaseline * netSalesPct * lift * coverage;
    const timeCost = mgmtHours * testWeeks * hourly;
    const total = per.cash * (model === "sample" ? paidSlots : sizes * slotsPerSize) +
      per.yarn * (model === "sample" ? Math.ceil(paidSlots * 0.4) : sizes * slotsPerSize) +
      timeCost;
    const netOutcome = socialValue + caught * errValue - total;
    return {
      model,
      label: MODEL_LABELS[model],
      cashCost: per.cash * (model === "sample" ? paidSlots : sizes * slotsPerSize),
      yarnCost: per.yarn * (model === "sample" ? Math.ceil(paidSlots * 0.4) : sizes * slotsPerSize),
      timeCost,
      churnAdjustedSlots: churnSlots,
      totalCost: total,
      sizeCoverage: coverage,
      expectedErrorsCaught: caught,
      socialProofValue: socialValue,
      netOutcome,
    };
  });

  const baseFreeRow = rows[0];
  const designerTimeHours = mgmtHours * testWeeks;

  // ---- flags ----
  if (ghost > 0.1 && freeSlots > 0) {
    flags.push({
      code: "TK-01",
      severity: "high",
      title: `Free pool loses ${Math.round(ghost * 100)}% of slots to ghosting`,
      note: `At a ${Math.round(ghost * 100)}% churn rate your unpaid pool surrenders ~${Math.round(ghost * sizes * slotsPerSize)} of ${sizes * slotsPerSize} slots. This is the pattern Yarnpond documented ("testers grab the pattern and disappear"). A paid tier at ~25% of slots usually buys back the coverage you lose.`,
    });
  }
  if (baseFreeRow.sizeCoverage < 0.9) {
    flags.push({
      code: "TK-02",
      severity: "high",
      title: "Launch-critical sizes are unverified",
      note: `With ${slotsPerSize} slot(s)/size at ${(100 - ghost * 100).toFixed(0)}% free-pool reliability, top/bottom sizes risk shipping unverified. Size coverage is the single biggest review driver on Ravelry — one bad fit photo outweighs ten good ones.`,
    });
  }
  if (baseFreeRow.yarnCost === 0 && ghost > 0.1 && freeSlots > 0) {
    flags.push({
      code: "TK-03",
      severity: "mid",
      title: "Yarn support underpriced for this yardage",
      note: `A full-yarn slot on this pattern costs ${fmt$(skeinsForTester(yardage, input.yardsPerSkein) * Math.max(0, input.yarnCostPerSkein))} (${skeinsForTester(yardage, input.yardsPerSkein)} skeins) — the same order as a cash fee, and testers consistently rank yarn support above pattern copies as compensation (littleskein, Woolly Wormhead).`,
    });
  }
  const paidBest = rows.reduce((a, b) => (b.netOutcome > a.netOutcome ? b : a), rows[0]);
  const paidBetter = paidBest.netOutcome > baseFreeRow.netOutcome;
  const caughtAvg = paidBest.expectedErrorsCaught;
  if (!paidBetter && paidShare > 0) {
    flags.push({
      code: "TK-04",
      severity: "high",
      title: "Paid tier loses money at this launch size",
      note: `Your baseline launch nets ${fmt$(input.launchRevenueBaseline * netSalesPct)}. With a ${lift * 100}% social-proof lift the paid tier's extra revenue doesn't cover ${fmt$(paidBest.totalCost - baseFreeRow.totalCost)} of added cost. Raise the launch (bundle, KAL, newsletter push) before paying testers, or the paid tier subsidizes your marketing for free.`,
    });
  }
  const testerWeeks = Math.max(1, yardage / 200);
  if (testWeeks < testerWeeks * 0.75) {
    flags.push({
      code: "TK-05",
      severity: "mid",
      title: "Test window too short for this yardage",
      note: `At ~1 week per 200 yd this pattern needs ~${Math.round(testerWeeks)} weeks; ${testWeeks} weeks invites the "2 weeks for a sweater is disrespect" backlash and more ghosting. Testers cite timelines as their #1 red flag (A Bee In The Bonnet tester panel).`,
    });
  }
  const sampleRow = rows.find((r) => r.model === "sample");
  const photoSavings = Math.min(200, sampleRow ? sampleRow.cashCost * 0.6 : 0);
  if (sampleRow && input.launchRevenueBaseline * netSalesPct * lift > sampleRow.totalCost - photoSavings) {
    flags.push({
      code: "TK-06",
      severity: "low",
      title: "Sample-knit FO photos offset the cash",
      note: `A paid sample knitter returns the finished object for launch photography — worth ~$200-1,000 vs hiring a shoot. At ${fmt$(sampleRow.totalCost)} cost against that offset plus the ${fmt$(sampleRow.socialProofValue)} proof value, the sample slot pays for itself when the launch exceeds ~${fmt$(Math.max(0, sampleRow.totalCost - photoSavings) / (netSalesPct * lift || 0.08) / 2)}.`,
    });
  }
  if (designerTimeHours * hourly > input.launchRevenueBaseline * netSalesPct * 0.4) {
    flags.push({
      code: "TK-07",
      severity: "mid",
      title: "Management time dominates the program",
      note: `${designerTimeHours.toFixed(0)} h × ${fmt$(hourly)}/h = ${fmt$(designerTimeHours * hourly)} of your time against a ${fmt$(input.launchRevenueBaseline * netSalesPct)} net launch. Batch tests, use one feedback form per size, and keep groups to 10-15 testers max.`,
    });
  }
  const errorLoad = 1 - tech / 100;
  const caughtEst = Math.min(1, slotsPerSize * 0.35 * (1 - ghost)) * errorLoad * sizes * 1.4;
  // TK-08: test capacity covers less than 35% of the pattern's error load
  if (tech < 40 && caughtEst < sizes * 0.35) {
    flags.push({
      code: "TK-08",
      severity: "mid",
      title: "Test can't catch what the pattern hides",
      note: `At a tech-edit score of ${tech}/100 the pattern carries ~${(sizes * (1 - tech / 100) * 1.4).toFixed(1)} expected error points, but with ${slotsPerSize} slot(s)/size your coverage only catches ~${caughtEst.toFixed(1)}. Run the Tech Edit audit first — testing cannot fix missing stitch counts and grading errors cheaper than fixing them pre-test.`,
    });
  }

  const best = rows.reduce((a, b) => (b.netOutcome > a.netOutcome ? b : a), rows[0]);
  const verdict: TestKnitResult["verdict"] = paidBetter
    ? best.model === "sample"
      ? "Hire a sample knitter — the FO photos offset the cash"
      : best.model === "flatCash" || best.model === "perYard"
        ? "Pay flat cash for launch-critical sizes"
        : "Yarn support buys the reliability your free pool loses to ghosting"
    : "Free pool covers it — launch too small for paid slots";

  return {
    rows,
    baseFreeRow,
    recommended: best.model,
    includeSampleRow: input.includeSampleRow,
    totalDesignerTimeHours: designerTimeHours,
    designerTimeCost: designerTimeHours * hourly,
    ghostedSlots: Math.round(sizes * slotsPerSize * ghost * (1 - paidShare)),
    paidSlotsCount: paidSlots,
    errorCatchValueTotal: baseFreeRow.expectedErrorsCaught * errValue,
    flags,
    verdict,
    verdictNote: `Best model on net outcome: ${best.label} (${fmt$(best.netOutcome)}). Free pool baseline is ${fmt$(baseFreeRow.netOutcome)}; paid slots cost ${fmt$(paidSlots)} slot(s) of the ${sizes * slotsPerSize} total.`,
  };
}
