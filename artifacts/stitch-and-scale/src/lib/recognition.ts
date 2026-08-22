import type { PatternProject } from '@/lib/grading-engine';
import type { LabResult } from './grading-lab';
import { publicationSourceFingerprint } from './publication-integrity';

export const RECOGNITION_SCHEMA_VERSION = 1 as const;
export const FIRST_CLEAN_GRADE_KIND = 'first-clean-grade' as const;

export type RecognitionKind = typeof FIRST_CLEAN_GRADE_KIND;

export interface RecognitionEvent {
  id: `${RecognitionKind}:${string}`;
  kind: RecognitionKind;
  earnedAt: string;
  sourceFingerprint: string;
  sizeCount: number;
  acknowledgedAt: string | null;
}

export interface ProjectRecognitionStateV1 {
  version: typeof RECOGNITION_SCHEMA_VERSION;
  events: RecognitionEvent[];
}

export interface FirstCleanGradeObservation {
  state: ProjectRecognitionStateV1;
  event: RecognitionEvent | null;
}

export const EMPTY_RECOGNITION_STATE: ProjectRecognitionStateV1 = {
  version: RECOGNITION_SCHEMA_VERSION,
  events: [],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isIsoTimestamp(value: unknown): value is string {
  if (typeof value !== 'string' || value.length === 0 || value.length > 64) return false;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed);
}

function isSafeSourceFingerprint(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= 200_000;
}

function expectedId(sourceFingerprint: string): `${RecognitionKind}:${string}` {
  return `${FIRST_CLEAN_GRADE_KIND}:${sourceFingerprint}`;
}

function normalizeEvent(value: unknown): RecognitionEvent | null {
  if (!isRecord(value)) return null;
  if (value.kind !== FIRST_CLEAN_GRADE_KIND) return null;
  if (!isSafeSourceFingerprint(value.sourceFingerprint)) return null;
  if (value.id !== expectedId(value.sourceFingerprint)) return null;
  if (!isIsoTimestamp(value.earnedAt)) return null;
  const sizeCount = value.sizeCount;
  if (typeof sizeCount !== 'number' || !Number.isInteger(sizeCount) || sizeCount <= 0 || sizeCount > 100) return null;
  if (value.acknowledgedAt !== null && value.acknowledgedAt !== undefined && !isIsoTimestamp(value.acknowledgedAt)) return null;

  return {
    id: expectedId(value.sourceFingerprint),
    kind: FIRST_CLEAN_GRADE_KIND,
    earnedAt: value.earnedAt,
    sourceFingerprint: value.sourceFingerprint,
    sizeCount,
    acknowledgedAt: value.acknowledgedAt ?? null,
  };
}

/**
 * Fail closed for malformed or unknown persisted state. Recognition evidence is
 * advisory UI state only; corrupt data must never prevent the project workspace
 * from loading or change grading/export behavior.
 */
export function normalizeRecognitionState(raw: unknown): ProjectRecognitionStateV1 {
  if (!isRecord(raw) || raw.version !== RECOGNITION_SCHEMA_VERSION || !Array.isArray(raw.events)) {
    return { ...EMPTY_RECOGNITION_STATE, events: [] };
  }

  const events: RecognitionEvent[] = [];
  const seenKinds = new Set<RecognitionKind>();
  for (const candidate of raw.events) {
    const event = normalizeEvent(candidate);
    if (!event || seenKinds.has(event.kind)) continue;
    seenKinds.add(event.kind);
    events.push(event);
  }
  return { version: RECOGNITION_SCHEMA_VERSION, events };
}

/**
 * A clean grade is deliberately stricter than the visible `ready` verdict:
 * informational flags such as the inclusive-size-range note are excluded so
 * this event cannot be mistaken for inclusive-sizing recognition.
 */
export function isEligibleFirstCleanGrade(result: LabResult): boolean {
  return result.verdict === 'ready'
    && result.gradedSizeCount > 0
    && result.flags.length === 0;
}

/**
 * Record the first clean grade for this project after an explicit grading
 * observation. The state is project-scoped by the storage seam, so the first
 * event is intentionally one per project rather than repeatable per source
 * revision. The source fingerprint remains evidence of what was observed.
 */
export function observeFirstCleanGrade(
  project: PatternProject,
  result: LabResult,
  rawState: unknown,
  observedAt = new Date().toISOString(),
): FirstCleanGradeObservation {
  const state = normalizeRecognitionState(rawState);
  if (!isEligibleFirstCleanGrade(result)) return { state, event: null };
  if (state.events.some((event) => event.kind === FIRST_CLEAN_GRADE_KIND)) {
    return { state, event: null };
  }

  const sourceFingerprint = publicationSourceFingerprint(project);
  const event: RecognitionEvent = {
    id: expectedId(sourceFingerprint),
    kind: FIRST_CLEAN_GRADE_KIND,
    earnedAt: isIsoTimestamp(observedAt) ? observedAt : new Date().toISOString(),
    sourceFingerprint,
    sizeCount: result.gradedSizeCount,
    acknowledgedAt: null,
  };

  return {
    state: { version: RECOGNITION_SCHEMA_VERSION, events: [...state.events, event] },
    event,
  };
}

export function hasFirstCleanGrade(state: unknown): boolean {
  return normalizeRecognitionState(state).events.some((event) => event.kind === FIRST_CLEAN_GRADE_KIND);
}
