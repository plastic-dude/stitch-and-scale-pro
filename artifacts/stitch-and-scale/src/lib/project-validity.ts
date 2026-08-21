/**
 * Project-wide data validity — QUEUE-017-GATE (extended audit E-04 remainder).
 *
 * The audit's verdict-trust rule: `Saved` describes persistence, never data
 * quality. A project whose measurements are impossible (non-finite, zero, or
 * negative base values) must be labeled visibly across the workspace so the
 * user cannot mistake a corrupt project for a healthy one.
 *
 * This module is the single validity analyzer the status chip consumes. It
 * composes the existing per-path validators instead of re-implementing rules:
 *   - grading-lab `invalidMeasurements` (G-09 integrity preflight rule,
 *     re-exported here so the chip uses the exact same predicate that blocks
 *     grading verdicts)
 *   - validate-field quarantine gate (the QUEUE-012 layer) for free-form lab
 *     inputs is per-card state and cannot be observed here; the chip's scope
 *     is deliberately the persistent project record only.
 *
 * Validity is derived, never stored: re-computed from the project object on
 * every render, so it can never drift out of sync with the data.
 */

import { PatternProject } from '@/lib/grading-engine';
import { invalidMeasurements } from '@/lib/grading-lab';

export type ProjectValidityLevel = 'valid' | 'invalid';

export interface ProjectValidityReport {
  level: ProjectValidityLevel;
  /** Human-readable one-line cause shown in the status chip. */
  reason: string;
  /** The exact bad measurements, capped for display. */
  badMeasurements: Array<{ label: string; baseValue: number }>;
}

const MAX_SHOWN = 3;

/**
 * A project is `invalid` when ANY persistent measurement violates the
 * integrity rule (non-finite, zero, or negative). The grading-lab path already
 * refuses to bless such a project; this makes the workspace surface say so
 * up front instead of only at grading time.
 */
export function analyzeProjectValidity(project: PatternProject): ProjectValidityReport {
  const bad = invalidMeasurements(project);
  if (bad.length === 0) return { level: 'valid', reason: '', badMeasurements: [] };
  const shown = bad.slice(0, MAX_SHOWN).map(b => `“${b.label}” (${b.baseValue})`).join(', ');
  const more = bad.length > MAX_SHOWN ? ` (+${bad.length - MAX_SHOWN} more)` : '';
  return {
    level: 'invalid',
    reason: `${bad.length} impossible measurement${bad.length > 1 ? 's' : ''}: ${shown}${more}`,
    badMeasurements: bad,
  };
}

export function isProjectValid(report: ProjectValidityReport): boolean {
  return report.level === 'valid';
}
