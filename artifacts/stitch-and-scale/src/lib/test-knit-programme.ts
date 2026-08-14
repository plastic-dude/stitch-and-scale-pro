/**
 * Test-Knit Programme engine — planner for running a size-covered test knit.
 *
 * Session-10 research anchors (no invented constants):
 * - Testers per size: designers typically allow ~2 testers per size (Nest
 *   Creative Works), so a 9-size CYC garment needs ~18 tester slots.
 * - Timeline: tester call goes out at least 10 weeks before the due date
 *   (A Bee in the Bonnet); keep the window generous, dropouts happen, big
 *   pools absorb them.
 * - Value of real yardage data: testers validate the pattern's yardage
 *   estimates per size — the exact loop this library closes.
 * - Compensation norms: free final pattern + credit; pay is rare; sample
 *   knitting is a separate paid thing.
 *
 * Composition discipline: builds on grading-engine and yarn-estimator only.
 * No new market constants.
 */
import { PatternProject, SizeKey, ALL_SIZES, gradePattern } from './grading-engine';
import { estimateYarn, YarnWeight, YARN_WEIGHTS } from './yarn-estimator';

export type TesterStatus = 'invited' | 'confirmed' | 'knitting' | 'stalled' | 'finished' | 'dropped';

export interface TesterSlot {
  /** Stable id: `${size}-${index}`. */
  id: string;
  size: SizeKey;
  index: number;
  name: string;
  contactRef: string;
  status: TesterStatus;
  /** Tester's actual total yards used (self-reported when finished). */
  actualYards?: number;
  /** Free-text feedback capture. */
  feedback: string;
}

export interface ProgrammeConfig {
  /** Slots per size (default 2, per common industry practice). */
  slotsPerSize?: number;
  /** Lead weeks: tester call → due date (default 10 weeks). */
  leadWeeks?: number;
  /** Only these sizes are offered — useful for partial tests. */
  offeredSizes?: SizeKey[];
  /** Incentive text for the call (default: free pattern + credit). */
  incentive?: string;
  /** When testers were/are invited (ISO date). */
  callDate?: string;
}

export interface RosterRow {
  size: SizeKey;
  slots: number;
  filled: number;
  finished: number;
}

/**
 * Build the default tester roster from the pattern's graded sizes. A size
 * only gets slots when the project carries that size in its graded data —
 * a pattern graded only up to 2XL should never show a 5XL tester slot.
 */
export function gradedSizes(project: PatternProject): SizeKey[] {
  // SectionMeasurement stores base values only; the full size table is
  // computed at grade time. A project with no sections grades to nothing
  // — and a designer with an empty project needs no tester slots either.
  if (project.sections.length === 0) return [];
  const grade = gradePattern(project);
  const seen = new Set<SizeKey>();
  for (const section of grade) {
    for (const measurement of section.measurements) {
      for (const graded of measurement.gradedValues) {
        seen.add(graded.size);
      }
    }
  }
  // Preserve CYC order.
  return ALL_SIZES.filter(s => seen.has(s));
}

export function buildRoster(project: PatternProject, config: ProgrammeConfig = {}): TesterSlot[] {
  const slotsPerSize = Math.max(1, Math.floor(config.slotsPerSize ?? 2));
  const offered = config.offeredSizes ?? gradedSizes(project);
  const slots: TesterSlot[] = [];
  for (const size of offered) {
    for (let i = 0; i < slotsPerSize; i++) {
      slots.push({
        id: `${size}-${i}`,
        size,
        index: i,
        name: '',
        contactRef: '',
        status: 'invited',
        feedback: '',
      });
    }
  }
  return slots;
}

export function applySlots(base: TesterSlot[], updated: TesterSlot[]): TesterSlot[] {
  const byId = new Map(updated.map(t => [t.id, t] as const));
  return base.map(t => byId.get(t.id) ?? t);
}

export interface RosterSummary {
  rows: RosterRow[];
  totalSlots: number;
  filled: number;
  finished: number;
  dropped: number;
  /** Dropout rate against confirmed slots — the pool-absorption number. */
  dropoutRate: number;
  /** Whether every offered size has at least one confirmed tester. */
  fullSizeCoverage: boolean;
}

export function summarizeRoster(slots: TesterSlot[]): RosterSummary {
  const bySize = new Map<SizeKey, RosterRow>();
  for (const slot of slots) {
    const row = bySize.get(slot.size) ?? { size: slot.size, slots: 0, filled: 0, finished: 0 };
    row.slots += 1;
    if (slot.status !== 'invited') row.filled += 1;
    if (slot.status === 'finished') row.finished += 1;
    bySize.set(slot.size, row);
  }
  const rows = ALL_SIZES.map(s => bySize.get(s)).filter((r): r is RosterRow => r != null);
  const confirmed = slots.filter(s => s.status !== 'invited' && s.status !== 'dropped');
  const dropped = slots.filter(s => s.status === 'dropped').length;
  const confirmedCount = confirmed.length;
  return {
    rows,
    totalSlots: slots.length,
    filled: slots.filter(s => s.status !== 'invited').length,
    finished: slots.filter(s => s.status === 'finished').length,
    dropped,
    dropoutRate: confirmedCount > 0 ? dropped / confirmedCount : 0,
    fullSizeCoverage: rows.every(r => r.slots - r.filled < r.slots),
  };
}

export interface YardageValidation {
  /** Whether the tester's actual usage is within ±15% of the estimate. */
  withinTolerance: boolean;
  estimatedYards: number;
  actualYards: number;
  /** Signed variance in yards (actual − estimated). */
  varianceYards: number;
  variancePercent: number;
}

/**
 * Compare a tester's self-reported yardage against the estimate for their
 * size's share of the pattern. The estimate itself is base-size total; a
 * fair per-tester benchmark is yards-per-size-progression. Sizes grade up
 * roughly linearly in physical dimension, so we scale the base estimate by
 * the size's bust share vs the base size's bust.
 */
export function validateTesterYardage(
  project: PatternProject,
  weight: YarnWeight,
  actualYards: number,
  testerSize: SizeKey,
): YardageValidation {
  const base = estimateYarn(project, weight);
  const bustShare = bustShareForSize(project, testerSize);
  // No physical bust data for this size → fall back to base estimate.
  const estimatedYards = bustShare > 0 ? base.totalYards * bustShare : base.totalYards;
  const varianceYards = actualYards - estimatedYards;
  const variancePercent = estimatedYards > 0 ? (varianceYards / estimatedYards) * 100 : 0;
  return {
    withinTolerance: Math.abs(variancePercent) <= 15,
    estimatedYards: Math.round(estimatedYards),
    actualYards,
    varianceYards: Math.round(varianceYards),
    variancePercent: Math.round(variancePercent * 10) / 10,
  };
}

function bustShareForSize(project: PatternProject, size: SizeKey): number {
  if (project.sections.length === 0) return 0;
  const grade = gradePattern(project);
  for (const section of grade) {
    for (const measurement of section.measurements) {
      if (measurement.gradingKey !== 'bust') continue;
      const base = measurement.gradedValues.find(g => g.size === project.baseSize);
      const tester = measurement.gradedValues.find(g => g.size === size);
      if (base && tester && base.physicalValue > 0) {
        return tester.physicalValue / base.physicalValue;
      }
    }
  }
  return 0;
}

/**
 * Compose a paste-ready tester call from the pattern's own data — for the
 * Ravelry Testing Pool, Yarnpond, a newsletter, or a group chat. Every
 * number comes from the project; nothing is invented.
 */
export interface CallTextOptions {
  where: 'ravelry' | 'general';
}

export function generateTesterCall(
  project: PatternProject,
  config: ProgrammeConfig,
  yarnWeight: YarnWeight | undefined,
  options: CallTextOptions = { where: 'general' },
): string {
  const offered = config.offeredSizes ?? gradedSizes(project);
  const slotsPerSize = Math.max(1, Math.floor(config.slotsPerSize ?? 2));
  const weightLabel = yarnWeight ? YARN_WEIGHTS.includes(yarnWeight) ? yarnWeight : undefined : undefined;
  const weightDisplay = weightLabel ?? (project.yarnWeight && YARN_WEIGHTS.includes(project.yarnWeight) ? project.yarnWeight : undefined);
  let yardageLine = '';
  if (weightDisplay) {
    const estimate = estimateYarn(project, weightDisplay);
    yardageLine = `Yardage (estimate): ${estimate.totalYards.toLocaleString('en-US')} yards (${estimate.skeins100g} × 100g skeins, base size ${project.baseSize}). Testers help me validate this per size.`;
  }
  const incentive = config.incentive ?? 'You keep the final published pattern free + credit in the pattern notes.';
  const leadWeeks = Math.max(2, Math.round(config.leadWeeks ?? 10));
  const sizeList = offered.join(', ');
  const platformNote = options.where === 'ravelry'
    ? 'I run the test through my Ravelry group so feedback stays in one place.'
    : 'Feedback and the pattern file stay in one dedicated place — no scattered threads.';
  const parts = [
    `TEST KNIT: ${project.name}${project.description ? ' — ' + project.description.trim().slice(0, 120) : ''}`,
    '',
    `Sizes needed: ${sizeList} (${slotsPerSize} tester${slotsPerSize > 1 ? 's' : ''} per size).`,
    `Project type: knitwear pattern graded across ${offered.length} sizes.`,
    yardageLine,
    '',
    `Timeline: join now, finish within ${leadWeeks} weeks of your start — please allow room for yarn orders and life.`,
    `What I ask for: honest feedback on the instructions + your actual yardage used vs the estimate.`,
    `What you get: ${incentive}`,
    '',
    platformNote,
    'To sign up: tell me your usual size and I will confirm your slot.',
  ].filter(Boolean);
  return parts.join('\n');
}

/**
 * The tester-pool health check. Industry guidance says to keep pools large
 * enough that dropouts never hurt the launch date. This flags when a size
 * has no confirmed tester or the dropout rate is climbing toward
 * launch-risk territory (≥50% of confirmed slots).
 */
export interface PoolHealthIssue {
  size?: SizeKey;
  message: string;
  severity: 'warning' | 'risk';
}

export function checkPoolHealth(slots: TesterSlot[]): PoolHealthIssue[] {
  const issues: PoolHealthIssue[] = [];
  const summary = summarizeRoster(slots);
  for (const row of summary.rows) {
    if (row.filled === 0) {
      issues.push({ size: row.size, message: `No tester confirmed for size ${row.size}.`, severity: 'risk' });
    }
  }
  if (summary.dropoutRate >= 0.5) {
    issues.push({ message: `Dropout rate is ${Math.round(summary.dropoutRate * 100)}% — add backup testers before launch.`, severity: 'risk' });
  } else if (summary.dropoutRate > 0.25) {
    issues.push({ message: `Dropout rate is ${Math.round(summary.dropoutRate * 100)}% — consider inviting one more tester per at-risk size.`, severity: 'warning' });
  }
  return issues;
}
