/**
 * Submission Pipeline planner — track magazine/anthology calls, plan the
 * production deadlines behind each one, and score every accepted offer.
 *
 * WHAT THIS MODELS:
 * Knitting designers submit to publications one call at a time, each with a
 * different timeline shape: submission deadline, decision date, pattern due,
 * sample due, tech-edit window, test-knit window, launch, and an exclusive
 * window after launch during which the pattern cannot self-sell. The only
 * tools designers actually use are spreadsheets (the literary world's
 * Duotrope/Submittable has no knitting equivalent). This turns the whole
 * pipeline into deadline math against the project's own production model.
 *
 * CITED REFERENCES:
 * - Making Stories Issue 11 call: submission deadline → decision 3 days later
 *   → pattern due ~3 months after → sample due ~5 months after → launch ~12
 *   months after submission; magazine handles tech editing and test knitting,
 *   designer knits the sample and answers tech-edit questions; compensation
 *   €100–€550 by complexity, yarn support included, 4-month exclusivity
 *   (making-stories.com/pages/call-for-submissions)
 * - Laine 34/35: sample due BEFORE pattern (photographed in Finnish winter),
 *   5-month exclusivity from publication, compensation on completion of
 *   sample + pattern + tech edit (lainepublishing.com/en-us/pages/submissions)
 * - Knitty: $250–350 honorarium per published submission, no exclusivity
 *   beyond issue release (knitty.com/subguide.php, 2026)
 * - Who Pays Knitters: accessory commissions average $246, range $40–$700
 *   (whopaysknitters.com)
 * - Submission packs carry 6 parts: inspiration photo(s), sketch, description,
 *   swatch photo(s), swatch info (yarn/fibre/colorway/needle/gauge), contact
 *   info + heading (Paper Moon Knits, "Designer Insider: The Submission
 *   Process", papermoonknits.com)
 */
import { PatternProject } from './grading-engine';
import { estimateYarn, YarnWeight, YARN_WEIGHTS } from './yarn-estimator';
import { platformNet, PlatformId, PLATFORMS } from './pattern-income-calculator';

// ---------- Types ----------

export type SubmissionStatus =
  | 'draft'
  | 'submitted'
  | 'decision'
  | 'accepted'
  | 'rejected'
  | 'withdrawn';

export interface PipelineCall {
  /** Publication name, e.g. "Making Stories". */
  publication: string;
  /** Issue/theme being called for, e.g. "Seashore". */
  issue: string;
  /** Submission deadline (ISO date). */
  submissionDeadline: string;
  /** When the editor's decision is communicated (ISO date). */
  decisionDate?: string;
  /** Finished pattern due (ISO date). */
  patternDue?: string;
  /** Sample knit due (ISO date). */
  sampleDue?: string;
  /** Magazine issue launch (ISO date). */
  launchDate?: string;
  /** Months of exclusivity from launch during which self-selling is barred. */
  exclusiveMonths: number;
  /** Payment on acceptance/publishing (USD). */
  fee: number;
  /** Whether the magazine covers tech editing (and test knitting). */
  magazineCoversTechEdit: boolean;
  /** Whether yarn support / shipping is provided. */
  yarnSupport: boolean;
}

export interface ProductionRates {
  /** Knitting speed in yards per hour, for the sample (30 yd/hr default). */
  knitYardsPerHour: number;
  /** Hours to write the pattern itself (excluding sample knitting). */
  patternWriteHours: number;
  /** Hours of swatch work: knit, wash, block, photograph. */
  swatchHours: number;
  /** Hours available per week for submission work. */
  availableHoursPerWeek: number;
}

export const DEFAULT_PRODUCTION_RATES: ProductionRates = {
  knitYardsPerHour: 30,
  patternWriteHours: 20,
  swatchHours: 6,
  availableHoursPerWeek: 10,
};

export interface AcceptanceBaseline {
  /** Platform the designer would self-publish on after exclusivity. */
  platform: PlatformId;
  /** Expected monthly unit sales of the pattern. */
  monthlyUnits: number;
  /** Self-publish price the pattern would carry. */
  price: number;
}

export interface PipelineInput {
  call: PipelineCall;
  project: PatternProject;
  rates?: ProductionRates;
  baseline?: AcceptanceBaseline;
  /** Yarn weight used for the sample-yardage model. */
  yarnWeight?: YarnWeight;
}

export interface MilestoneStatus {
  name: string;
  date: string | null;
  /** Days remaining from today (negative = overdue). */
  daysFromNow: number | null;
  state: 'past' | 'due-soon' | 'upcoming' | 'unknown';
}

export interface ProductionPlan {
  /** Total sample knit hours from the yardage model. */
  sampleKnitHours: number;
  /** Total production hours (sample + pattern writing + swatch work). */
  totalProductionHours: number;
  /** Weeks of work needed at the available weekly hours. */
  requiredWeeks: number;
  /** Earliest start date (ISO) so everything lands before the earliest due date. */
  mustStartBy: string | null;
  /** Weeks from today to the earliest due date (negative = impossible). */
  weeksUntilFirstDue: number | null;
  /** Whether the accepted-timeline commitments fit in the available hours. */
  feasible: boolean;
  /** Human explanation of any infeasibility. */
  note: string;
}

export interface OfferScore {
  /** Net gain vs declining and self-publishing through the exclusivity window. */
  netVsSolo: number;
  /** Effective hourly rate across total production hours. */
  effectiveHourlyRate: number;
  /** Months of lost self-publish income inside the exclusivity window. */
  lostSoloMonths: number;
  /** Lost self-publish income across the window (USD). */
  lostSoloIncome: number;
  /** Self-publish income after exclusivity ends (USD, per 6 months). */
  postExclusivityIncome: number;
  verdict: 'go' | 'review' | 'skip';
  note: string;
}

export interface PipelineSummary {
  call: PipelineCall;
  milestones: MilestoneStatus[];
  production: ProductionPlan;
  offer: OfferScore | null;
}

// ---------- Helpers ----------

function parseDate(s: string): Date {
  const d = new Date(s + (s.length === 10 ? 'T00:00:00Z' : ''));
  return Number.isNaN(d.getTime()) ? new Date('2000-01-01T00:00:00Z') : d;
}

const DAY_MS = 86400000;
function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / DAY_MS);
}

/** Today at UTC midnight, the anchor for all "days from now" math. */
export function todayUtc(): Date {
  const n = new Date();
  return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate()));
}

function milestoneState(days: number | null, daysToDue: number | null): MilestoneStatus['state'] {
  if (days === null) return 'unknown';
  if (days < 0) return 'past';
  if (daysToDue !== null && days > daysToDue) return 'upcoming';
  return 'due-soon';
}

// ---------- Core ----------

/** Build the full pipeline summary for one call. */
export function buildPipeline(input: PipelineInput): PipelineSummary {
  const rates = { ...DEFAULT_PRODUCTION_RATES, ...input.rates };
  const now = todayUtc();
  const call = input.call;

  const milestoneDates: Array<[string, string | null]> = [
    ['Submission deadline', call.submissionDeadline || null],
    ['Editor decision', call.decisionDate || null],
    ['Pattern due', call.patternDue || null],
    ['Sample due', call.sampleDue || null],
    ['Launch', call.launchDate || null],
  ];

  // Earliest real due date drives production planning (decision date is the
  // editor's clock, not the designer's deliverable).
  const dueDates = [call.submissionDeadline, call.patternDue ?? null, call.sampleDue ?? null]
    .filter((d): d is string => d !== null && d !== '')
    .map(parseDate);
  const earliestDue = dueDates.length
    ? dueDates.reduce((a, b) => (b < a ? b : a))
    : null;

  const yarnWeight = input.yarnWeight ?? input.project.yarnWeight ?? 'worsted';
  const weight: YarnWeight = YARN_WEIGHTS.includes(yarnWeight)
    ? (yarnWeight as YarnWeight)
    : 'worsted';
  const yardage = estimateYarn(input.project, weight).totalYards;
  const sampleKnitHours = yardage / rates.knitYardsPerHour;
  const totalProductionHours = sampleKnitHours + rates.patternWriteHours + rates.swatchHours;
  const requiredWeeks = totalProductionHours / Math.max(rates.availableHoursPerWeek, 0.5);

  let mustStartBy: string | null = null;
  let weeksUntilFirstDue: number | null = null;
  let feasible = true;
  let note = 'All commitments fit within available weekly hours.';

  if (earliestDue) {
    const daysUntil = daysBetween(now, earliestDue);
    weeksUntilFirstDue = Math.round((daysUntil / 7) * 10) / 10;
    const workableWeeks = daysUntil / 7;
    if (workableWeeks >= requiredWeeks) {
      // Latest start = earliest due minus the required duration.
      const start = new Date(earliestDue.getTime() - Math.ceil(requiredWeeks) * 7 * DAY_MS);
      mustStartBy = start.toISOString().slice(0, 10);
    } else {
      feasible = false;
      note = `Needs ${requiredWeeks.toFixed(1)} weeks of work at ${rates.availableHoursPerWeek} h/week but only ${weeksUntilFirstDue} weeks remain until ${earliestDue.toISOString().slice(0, 10)}.`;
    }
  } else {
    note = 'No due dates set yet — add at least the submission deadline.';
    feasible = true;
  }

  const daysToDue = earliestDue ? daysBetween(now, earliestDue) : null;

  const milestones: MilestoneStatus[] = milestoneDates.map(([name, date]) => {
    const days = date === null ? null : daysBetween(now, parseDate(date));
    return { name, date, daysFromNow: days, state: milestoneState(days, daysToDue) };
  });

  let offer: OfferScore | null = null;
  if (input.baseline) {
    offer = scoreOffer({ ...input, sampleKnitHours, totalProductionHours });
  }

  return { call, milestones, production: { sampleKnitHours, totalProductionHours, requiredWeeks: Math.round(requiredWeeks * 10) / 10, mustStartBy, weeksUntilFirstDue, feasible, note }, offer };
}

interface ScoreDeps {
  call: PipelineCall;
  sampleKnitHours: number;
  totalProductionHours: number;
}

/** Score the accepted offer against the designer's solo baseline. */
export function scoreOffer(input: PipelineInput & ScoreDeps): OfferScore {
  const call = input.call;
  const baseline = input.baseline as AcceptanceBaseline;
  const totals = PLATFORMS.map((p) => platformNet(p, baseline.price, baseline.monthlyUnits).netRevenue);
  const soloMonthly = totals.length ? Math.max(...totals) : 0;
  const lostSoloMonths = call.exclusiveMonths;
  const lostSoloIncome = soloMonthly * lostSoloMonths;
  // After exclusivity ends, the designer sells for 6 months at the baseline rate.
  const postExclusivityIncome = soloMonthly * 6;
  const netVsSolo = call.fee - lostSoloIncome + postExclusivityIncome;
  const effectiveHourlyRate =
    input.totalProductionHours > 0 ? netVsSolo / input.totalProductionHours : 0;

  let verdict: OfferScore['verdict'];
  let note: string;
  const rateBar = 12; // realistic floor for a part-time designer's time
  if (netVsSolo > 0 && effectiveHourlyRate >= rateBar) {
    verdict = 'go';
    note = `Beats self-publishing by ${usd(netVsSolo)} with an effective rate of ${usd(effectiveHourlyRate)}/hr — worth taking.`;
  } else if (netVsSolo > 0) {
    verdict = 'review';
    note = `Pays more than self-publishing overall (${usd(netVsSolo)}), but at ${usd(effectiveHourlyRate)}/hr against ~${lostSoloMonths} months of lost sales — negotiate fee or a shorter window.`;
  } else if (call.exclusiveMonths === 0) {
    verdict = 'go';
    note = `No exclusivity — the fee is pure gain alongside self-publishing.`;
  } else {
    verdict = 'skip';
    note = `The ${call.exclusiveMonths}-month window costs ${usd(lostSoloIncome)} in lost sales and the fee doesn't cover it — self-publishing wins.`;
  }

  return { netVsSolo: Math.round(netVsSolo * 100) / 100, effectiveHourlyRate: Math.round(effectiveHourlyRate * 100) / 100, lostSoloMonths, lostSoloIncome: Math.round(lostSoloIncome * 100) / 100, postExclusivityIncome: Math.round(postExclusivityIncome * 100) / 100, verdict, note };
}

// ---------- Generators ----------

export interface SubmissionPackInput {
  publication: string;
  issue: string;
  theme: string;
  designName: string;
  designerName: string;
  /** Yarn used for the swatch, e.g. "Plucky Knitter Crew DK, Forest". */
  swatchYarn?: string;
  /** Needle used for the swatch. */
  swatchNeedle?: string;
  swatchGauge?: string;
  contact?: string;
}

/** The 6-part submission pack checklist, cited from working designers' accounts. */
export function submissionPackChecklist(input: SubmissionPackInput): string[] {
  return [
    `Inspiration photo(s) matched to the "${input.theme}" theme — 2 or 3 curated images, not the whole board.`,
    `Sketch on a croquis (or flat drawing) of "${input.designName}" — highlight the one detail that carries the design, keep the rest quiet.`,
    `Written description covering construction sequence (top-down vs bottom-up, seamed vs seamless), aesthetic, and suggested yarn.`,
    `Swatch photo(s) of the main stitch pattern, washed, blocked, and photographed in natural light.`,
    `Swatch information: yarn${input.swatchYarn ? ` (${input.swatchYarn})` : ''}, fibre content, colorway, needle${input.swatchNeedle ? ` (${input.swatchNeedle})` : ''}, and gauge${input.swatchGauge ? ` (${input.swatchGauge})` : ''}.`,
    `Heading and contact: publication name, issue, theme, and the design name ${input.designName ? `("${input.designName}")` : ''} up top — plus ${input.designerName ? `${input.designerName}'s` : 'your'} contact details and Ravelry/website links in case pages get separated.`,
  ];
}

/** Paste-ready cover letter for a specific call. */
export function generateSubmissionLetter(input: SubmissionPackInput): string {
  const lines = [
    `Dear ${input.publication} editorial team,`,
    '',
    `I'd love to contribute to ${input.issue}${input.theme ? ` ("${input.theme}")` : ''} with my design ${input.designName ? `"${input.designName}"` : ''}.`,
    '',
    submissionPackChecklist(input).map((c) => `- ${c}`).join('\n'),
    '',
    ...(input.contact ? [`My details: ${input.contact}`, ''] : []),
    `Thank you for your time — I know submission season is busy, and I'd be honoured to be considered.`,
    '',
    input.designerName ? `Warmly,\n${input.designerName}` : 'Warmly,',
  ];
  return lines.filter((l) => l !== undefined).join('\n');
}

export function usd(n: number): string {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
