/**
 * Hire-vs-Self Analyzer — CHK-023
 *
 * Every release forces two outsourcing decisions: knit the sample yourself
 * or hire a sample knitter, and tech-edit yourself or hire a tech editor.
 * Most indie designers decide both on feeling. This library prices them on
 * opportunity cost.
 *
 *
 * CITED ECONOMICS:
 *
 * SAMPLE KNITTING (designer-side cost of hiring):
 * - Kristen Tendyke's per-yardage model: $0.12/yard knit, $0.10/yard
 *   crochet (kristentendyke.com, 2015) — fee = weighed finished yardage
 *   including swatches (swatches are knitting time too).
 * - Jeanette Sloan / Felix Ford: 12p per metre of yarn used, rounded up
 *   (jeanettesloandesign.com) — 870m lace shawl → £105.
 * - Reddit craftsnark common practice: ~US$80 per sweater (size M) + yarn.
 * - Expectations that come free with paying fairly: professional
 *   finishing (blocked, sewn, ends woven), timescale adherence, photo
 *   updates, pattern feedback, pre-release discretion (Sloan's contract).
 *
 * SELF-KNITTING (the opportunity cost most designers ignore):
 * - The app's shared yardage model: 30 yards/hour sample knitting.
 * - Every hour spent sample-knitting is an hour not spent designing,
 *   photographing, marketing — priced at the designer's opportunity rate.
 * - Who Pays Knitters floor: $12/hr; design work typically worth $25+/hr
 *   when it sells patterns.
 *
 * TECH EDITING:
 * - Going rate $30–40/hr (r/AdvancedKnitting); sweater ≈ 4 hours of edit
 *   time; basic hats/socks 0.5–1h.
 * - Works of Our Hands fixed rates (2023): socks/hats/mitts/cowls $30,
 *   shawls $40, garments $50, +$5 per extra size (5-size sweater = $70).
 * - Heather Storta: $36/hr base, $40/hr rush. First-time-designer
 *   discount rates ($15/hr) exist but the market rate is $30–40.
 * - Designers self-editing their own pattern maths is the classic blind
 *   spot: you can't see your own stitch-count errors.
 *
 * TEST KNITTING (context only): typically unpaid with credit + free PDF
 * (Nest Creative Works, Rosemary & Pines); paid flat-fee tests are the
 * better practice per the craftsnark consensus — modeled as an option.
 */

import { estimateYarn, YARN_WEIGHTS, YarnWeight } from './yarn-estimator';
import { PatternProject } from './grading-engine';

export const HOURLY_FLOOR = 12;
export const DEFAULT_DESIGNER_OPPORTUNITY_RATE = 25; // what design/marketing time sells at
export const KNIT_YARDS_PER_HOUR = 30; // shared app model
export const SAMPLE_KNIT_RATE_PER_YARD = 0.12; // USD, Tendyke/Sloan class
export const SHIPPING_PER_SAMPLE = 8; // USPS-class shipping + tracking
export const TECH_EDIT_HOURLY_LOW = 30;
export const TECH_EDIT_HOURLY_HIGH = 40;
export const TECH_EDIT_HOURS_BY_TYPE: Record<string, number> = {
  accessories: 1, // hats, socks, mitts, cowls
  shawl: 2.5,
  garment: 4, // sweaters, cardigans
};

/**
 * Rough edit-scope heuristic from yarn weight + size count when no
 * garment type is known: heavier yarn + more sizes = more lines and
 * more grading to check. Keep the default at the sweater benchmark
 * (4h) unless the yardage is clearly accessory-scale.
 */
export function estimateEditHours(project: PatternProject): number {
  const sizeCount = Math.max(1, project.sections.reduce((max, s) => Math.max(max, s.measurements.length), 1));
  const accessoriesThreshold = 4; // small-yardage projects read as accessories
  if (sizeCount <= 1) return TECH_EDIT_HOURS_BY_TYPE.accessories;
  if (sizeCount <= 2) return 2.5; // small graded accessory range
  return Math.min(6, TECH_EDIT_HOURS_BY_TYPE.garment + (sizeCount - 4) * 0.25);
}

export type Verdict = 'go' | 'maybe' | 'no';

export interface SelfVsHireInputs {
  project: PatternProject;
  yarnWeight: string; // CYC weight key
  /** Designer's opportunity rate $/hr — what that hour sells at instead */
  opportunityRate: number;
  /** What you'd pay a sample knitter per yard (0 = use $0.12 market) */
  sampleRatePerYard: number;
  /** Shipping to get the sample back */
  shipping: number;
  /** Fixed sample fee alternative (e.g. $80 sweater), 0 = per-yard model */
  flatSampleFee: number;
  /** Hours you'd spend tech-editing yourself, 0 = auto by garment type */
  selfEditHours: number;
  /** Tech editor's hourly rate (0 = $30 market low) */
  editorRate: number;
  /** Hours the editor will actually take, 0 = auto by garment type */
  editHours: number;
}

export interface HireResult {
  // sample knitting leg
  sampleYards: number;
  selfKnitHours: number;
  selfKnitOpportunityCost: number;
  hireSampleCost: number;
  sampleVerdict: 'hire' | 'self' | 'either';
  sampleNotes: string[];
  // tech edit leg
  editHours: number;
  selfEditOpportunityCost: number;
  hireEditCost: number;
  editVerdict: 'hire' | 'self' | 'either';
  editNotes: string[];
  // totals
  totalSelfCost: number;
  totalHireCost: number;
  savings: number;
  hoursFreed: number;
  freedIncomePotential: number;
  overallVerdict: Verdict;
}

export interface HiringPack {
  items: Array<{ check: string; rationale: string; flag: boolean }>;
  sampleKnitListing: string;
}

/**
 * Estimate the finished yardage of a sample for pay purposes.
 * Uses the app's shared yardage model and adds a swatch allowance
 * (Sloan and Tendyke both count swatches as knitting time).
 */
export function sampleYardage(project: PatternProject, weight: string): number {
  const w: YarnWeight = YARN_WEIGHTS.includes(weight as YarnWeight)
    ? (weight as YarnWeight)
    : 'worsted';
  const base = estimateYarn(project, w).totalYards;
  // swatch allowance: ~10% extra — both cited pay models weigh swatches
  return Math.round(base * 1.1);
}

/**
 * Price the self-knit vs hire decision for the sample knitting leg,
 * the tech-edit leg, and the combined release.
 */
export function analyzeHireDecision(input: SelfVsHireInputs): HireResult {
  const opp = Math.max(0, input.opportunityRate || DEFAULT_DESIGNER_OPPORTUNITY_RATE);
  const rate = input.sampleRatePerYard > 0 ? input.sampleRatePerYard : SAMPLE_KNIT_RATE_PER_YARD;
  const shipping = input.shipping >= 0 ? input.shipping : SHIPPING_PER_SAMPLE;

  const yards = sampleYardage(input.project, input.yarnWeight);
  const selfKnitHours = yards / KNIT_YARDS_PER_HOUR;
  const selfKnitOpportunityCost = selfKnitHours * opp;

  const hireSampleCost = input.flatSampleFee > 0
    ? input.flatSampleFee + shipping
    : Math.round(yards * rate * 100) / 100 + shipping;

  const sampleNotes: string[] = [];
  if (input.flatSampleFee > 0 && yards * rate > input.flatSampleFee) {
    sampleNotes.push(
      `Flat fee $${input.flatSampleFee.toFixed(0)} beats the per-yard model ($${(yards * rate).toFixed(0)} for ${yards.toLocaleString()} yards) — take the flat rate.`
    );
  } else if (input.flatSampleFee === 0) {
    sampleNotes.push(
      `Per-yard model: ${yards.toLocaleString()} yards × $${rate.toFixed(2)} = $${(yards * rate).toFixed(0)} + $${shipping.toFixed(0)} shipping. Matches the Tendyke/Sloan pay standard; the weighed-yardage method (finished weight ÷ skein grams × yards/skein) is what knitters expect on the invoice.`
    );
  }
  sampleNotes.push(
    `Knitting it yourself costs ${selfKnitHours.toFixed(1)} hours at ${KNIT_YARDS_PER_HOUR} yd/hr — that's $${selfKnitOpportunityCost.toFixed(0)} of design/marketing time at your $${opp.toFixed(0)}/hr opportunity rate.`
  );

  const sampleVerdict =
    hireSampleCost < selfKnitOpportunityCost * 0.7
      ? 'hire'
      : selfKnitOpportunityCost < hireSampleCost * 0.7
        ? 'self'
        : 'either';

  if (sampleVerdict === 'hire') {
    sampleNotes.push(
      `Hiring is clearly cheaper than your opportunity cost. A paid sample also buys pattern feedback, professional finishing, and photo-ready blocking — the standard expectations at this pay level (Sloan's contract).`
    );
  } else if (sampleVerdict === 'self') {
    sampleNotes.push(
      `Your opportunity cost is low enough that self-knitting wins — but cap it: if the pattern is launching on a deadline, buy back your hours anyway.`
    );
  } else {
    sampleNotes.push(
      `Either works on pure cost. The tiebreaker is your release calendar: hiring buys the hours back for photography and marketing, where they earn more.`
    );
  }

  // Tech edit leg
  const editHours =
    input.selfEditHours > 0
      ? input.selfEditHours
      : estimateEditHours(input.project);
  const editorRate = input.editorRate > 0 ? input.editorRate : TECH_EDIT_HOURLY_LOW;
  const selfEditOpportunityCost = editHours * opp;
  const hireEditCost = Math.round(editHours * editorRate * 100) / 100;

  const editNotes: string[] = [];
  editNotes.push(
    `This pattern reads as ~${editHours} hours of tech editing at the $${editorRate.toFixed(0)}/hr market rate — $${hireEditCost.toFixed(0)}. Doing it yourself saves the cash but you can't see your own stitch-count errors; self-edited patterns carry the highest revision rate with testers.`
  );
  if (editorRate < TECH_EDIT_HOURLY_LOW) {
    editNotes.push(
      `At $${editorRate.toFixed(0)}/hr this is below the $30–40/hr going rate — check it's not a first-timer discount that will jump next project, or scope-creep pricing later.`
    );
  } else if (editorRate > TECH_EDIT_HOURLY_HIGH) {
    editNotes.push(
      `$${editorRate.toFixed(0)}/hr is above the $30–40/hr market band — fine for rush jobs (rush pricing runs ~$40/hr) but negotiate on schedule, not just price.`
    );
  }

  const editVerdict =
    editHours >= 4 || (hireEditCost < selfEditOpportunityCost * 0.85 && editHours >= 1)
      ? 'hire'
      : selfEditOpportunityCost < hireEditCost * 0.7
        ? 'self'
        : 'either';

  if (editVerdict === 'hire') {
    editNotes.push(
      `Hire the editor: $${hireEditCost.toFixed(0)} for ${editHours} hours against $${selfEditOpportunityCost.toFixed(0)} of your time, and testers stop finding the errors you'd ship. Editing is the one task you should almost never do yourself.`
    );
  }

  const totalSelfCost = selfKnitOpportunityCost + selfEditOpportunityCost;
  const totalHireCost = hireSampleCost + hireEditCost;
  const hoursFreed = selfKnitHours + editHours;

  const savings = totalSelfCost - totalHireCost;
  const freedIncomePotential = hoursFreed * opp;

  const overallVerdict: Verdict =
    totalHireCost <= totalSelfCost * 0.8 ? 'go'
    : totalHireCost <= totalSelfCost * 1.2 ? 'maybe'
    : 'no';

  if (overallVerdict === 'go') {
    editNotes.push(
      `Full hire: outsourcing both legs nets you ~$${savings.toFixed(0)} of opportunity value and ${hoursFreed.toFixed(1)} hours back for the things that sell patterns.`
    );
  } else if (overallVerdict === 'no') {
    editNotes.push(
      `Full outsourcing costs more than it saves at your current rate — self-knit this one, but still send the pattern to an editor.`
    );
  }

  return {
    sampleYards: yards,
    selfKnitHours: round2(selfKnitHours),
    selfKnitOpportunityCost: round2(selfKnitOpportunityCost),
    hireSampleCost: round2(hireSampleCost),
    sampleVerdict,
    sampleNotes,
    editHours: round2(editHours),
    selfEditOpportunityCost: round2(selfEditOpportunityCost),
    hireEditCost: round2(hireEditCost),
    editVerdict,
    editNotes,
    totalSelfCost: round2(totalSelfCost),
    totalHireCost: round2(totalHireCost),
    savings: round2(savings),
    hoursFreed: round2(hoursFreed),
    freedIncomePotential: round2(freedIncomePotential),
    overallVerdict,
  };
}

/**
 * Hiring checklist + a paste-ready sample-knitter listing.
 * Checklist covers the cited standards: per-yard or flat fee, shipping,
 * swatch weighting, finishing, timescale, discretion.
 */
export function buildHiringPack(
  input: SelfVsHireInputs,
  result: HireResult
): HiringPack {
  const items = [
    {
      check: `Pay standard — ${result.sampleYards.toLocaleString()} yards at $0.12/yd = $${(result.sampleYards * SAMPLE_KNIT_RATE_PER_YARD).toFixed(0)} + shipping`,
      rationale: `The Tendyke/Sloan per-yard model is the cited standard; pay on weighed finished yardage including swatches. Flat ~$80/sweater is also accepted market practice (craftsnark). Yarn-only payment is the low end — fine for test knits, stingy for samples.`,
      flag: input.flatSampleFee < 0,
    },
    {
      check: `Shipping budgeted — $${(input.shipping >= 0 ? input.shipping : SHIPPING_PER_SAMPLE).toFixed(0)} for return postage + tracking`,
      rationale: `Sample knitters return the finished piece, ball bands and unused yarn; shipping is designer-paid in the Sloan model.`,
      flag: false,
    },
    {
      check: `Timescale in writing — deadline agreed before yarn ships`,
      rationale: `Both cited models require a mutually agreed timescale up front; late samples miss photo sessions and launch windows.`,
      flag: false,
    },
    {
      check: `Finishing standard — blocked, sewn, ends woven, photo-ready`,
      rationale: `Sloan's contract defines a finished sample as blocked/steamed with ends woven; unfinished samples need "sweater surgery" from the designer (Tendyke's regret).`,
      flag: false,
    },
    {
      check: `Feedback expected — errata notes and pattern questions welcome`,
      rationale: `Sample knitters are the first pattern testers; their questions are your errata list before publication.`,
      flag: false,
    },
    {
      check: `Pre-release discretion — no social sharing until you say go`,
      rationale: `Sloan's contract forbids progress photos pre-release; protect the launch surprise.`,
      flag: false,
    },
    {
      check: `Tech edit outsourced — designer self-editing own maths is the classic blind spot`,
      rationale: `You can't see your own stitch-count errors; going rate $30–40/hr, sweater ≈ 4 hours. Fixed-rate editors charge $30 hats / $50 garments + $5 per extra size.`,
      flag: result.editVerdict !== 'hire',
    },
    {
      check: `Opportunity cost priced — $${input.opportunityRate.toFixed(0)}/hr × ${result.hoursFreed.toFixed(1)} hrs = $${result.freedIncomePotential.toFixed(0)} potential`,
      rationale: `Every sample-knit and self-edit hour is design/marketing time not spent; at a $25+ design rate, those hours usually out-earn the outsourcing cost.`,
      flag: result.overallVerdict === 'no',
    },
  ];

  const sampleKnitListing =
    `Sample knitter wanted — ${input.project.name || 'new pattern'}\n\n` +
    `Looking for an intermediate–advanced knitter to work up a sample of my upcoming ` +
    `pattern in the gauge and yarn specified${input.project.yarnWeight ? ` (${input.project.yarnWeight})` : ''}. Details:\n\n` +
    `- Pay: $${result.hireSampleCost.toFixed(0)} (per the yardage model: ${result.sampleYards.toLocaleString()} yards at $${SAMPLE_KNIT_RATE_PER_YARD.toFixed(2)}/yd + $${(input.shipping >= 0 ? input.shipping : SHIPPING_PER_SAMPLE).toFixed(0)} shipping)\n` +
    `- Yarn and print-ready draft instructions provided\n` +
    `- Deadline: agreed before yarn ships — please confirm your availability\n` +
    `- Expectations: blocked, sewn, ends woven, photo-ready; regular photo updates; questions and errata notes welcome; no social sharing before release\n` +
    `- You keep the finished pattern PDF plus one pattern of your choice\n\n` +
    `Please share examples of your work or a Ravelry profile. I'll confirm within a few days of your offer.`;

  return { items, sampleKnitListing };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
