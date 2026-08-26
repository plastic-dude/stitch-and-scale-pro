import type {
  Gauge,
  PatternProject,
  PatternSection,
  SizeKey,
  SizingStandard,
  SectionMeasurement,
  MeasurementType,
  GradingKey,
  RoundingParity,
} from './grading-engine';

const VALID_SIZES: readonly SizeKey[] = [
  'XS',
  'S',
  'M',
  'L',
  'XL',
  '2XL',
  '3XL',
  '4XL',
  '5XL',
];

const VALID_STANDARDS: readonly SizingStandard[] = [
  'CYC',
  'UK',
  'EN13402',
  'Japanese',
  'Korean',
  'Chinese',
  'Australian',
  'Custom',
];

const VALID_YARN_WEIGHTS = [
  'lace',
  'fingering',
  'sport',
  'DK',
  'worsted',
  'bulky',
  'super-bulky',
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function nonEmptyString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim().length > 0 ? value : fallback;
}

function dateString(value: unknown, fallback: string): string {
  if (typeof value === 'string' && value.trim().length > 0 && Number.isFinite(Date.parse(value))) {
    return value;
  }
  return fallback;
}

function normalizeGauge(value: unknown): Gauge {
  const raw = isRecord(value) ? value : {};
  return {
    stitchesPer4In: typeof raw.stitchesPer4In === 'number' && Number.isFinite(raw.stitchesPer4In)
      ? raw.stitchesPer4In
      : 0,
    rowsPer4In: typeof raw.rowsPer4In === 'number' && Number.isFinite(raw.rowsPer4In)
      ? raw.rowsPer4In
      : 0,
    unit: raw.unit === 'cm' ? 'cm' : 'in',
  };
}

function normalizeMeasurements(value: unknown): SectionMeasurement[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((m) => {
      if (!isRecord(m)) return null;
      const baseValue = typeof m.baseValue === 'number' && Number.isFinite(m.baseValue) && m.baseValue > 0
        ? m.baseValue
        : 0; // 0 is the 'impossible' marker that G-09 will catch

      return {
        ...m,
        id: nonEmptyString(m.id, `m-${Math.random().toString(36).slice(2, 9)}`),
        label: nonEmptyString(m.label, 'Unnamed measurement'),
        measurementType: ['width', 'circumference', 'length', 'direct'].includes(m.measurementType as string)
          ? m.measurementType as MeasurementType
          : 'circumference',
        gradingKey: typeof m.gradingKey === 'string' ? m.gradingKey as GradingKey : 'bust',
        baseValue,
        stitchRepeat: typeof m.stitchRepeat === 'number' && Number.isFinite(m.stitchRepeat) && m.stitchRepeat > 0
          ? m.stitchRepeat
          : undefined,
        rowRepeat: typeof m.rowRepeat === 'number' && Number.isFinite(m.rowRepeat) && m.rowRepeat > 0
          ? m.rowRepeat
          : undefined,
        stitchRemainder: typeof m.stitchRemainder === 'number' && Number.isFinite(m.stitchRemainder)
          ? m.stitchRemainder
          : undefined,
        rowRemainder: typeof m.rowRemainder === 'number' && Number.isFinite(m.rowRemainder)
          ? m.rowRemainder
          : undefined,
        stitchParity: ['even', 'odd'].includes(m.stitchParity as string) ? m.stitchParity as RoundingParity : undefined,
        rowParity: ['even', 'odd'].includes(m.rowParity as string) ? m.rowParity as RoundingParity : undefined,
      } as SectionMeasurement;
    })
    .filter((m): m is SectionMeasurement => m !== null);
}

function normalizeSections(value: unknown): PatternSection[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((s) => {
      if (!isRecord(s)) return null;
      return {
        ...s,
        id: nonEmptyString(s.id, `s-${Math.random().toString(36).slice(2, 9)}`),
        name: nonEmptyString(s.name, 'Unnamed section'),
        measurements: normalizeMeasurements(s.measurements),
      } as PatternSection;
    })
    .filter((s): s is PatternSection => s !== null);
}

/**
 * Repairs persisted/imported project records at the data boundary. This is
 * intentionally conservative: known valid data is retained, missing required
 * display fields get explicit draft-safe defaults, and unsafe collection
 * values become empty collections instead of reaching render code.
 */
export function normalizeProjectRecord(
  value: unknown,
  now = new Date().toISOString(),
  fallbackId = `legacy-${now}`,
): PatternProject | null {
  if (!isRecord(value)) return null;

  const safeNow = dateString(now, new Date(0).toISOString());
  const rawName = nonEmptyString(value.name, 'Untitled pattern');
  const rawAuthor = typeof value.author === 'string' ? value.author : '';
  const baseSize = VALID_SIZES.includes(value.baseSize as SizeKey)
    ? value.baseSize as SizeKey
    : 'M';
  const sizingStandard = VALID_STANDARDS.includes(value.sizingStandard as SizingStandard)
    ? value.sizingStandard as SizingStandard
    : undefined;
  const yarnWeight = VALID_YARN_WEIGHTS.includes(value.yarnWeight as typeof VALID_YARN_WEIGHTS[number])
    ? value.yarnWeight as PatternProject['yarnWeight']
    : undefined;

  return {
    ...value,
    id: nonEmptyString(value.id, fallbackId),
    name: rawName,
    author: rawAuthor,
    baseSize,
    gauge: normalizeGauge(value.gauge),
    sections: normalizeSections(value.sections),
    createdAt: dateString(value.createdAt, safeNow),
    updatedAt: dateString(value.updatedAt, dateString(value.createdAt, safeNow)),
    description: typeof value.description === 'string' ? value.description : undefined,
    sizingStandard,
    yarnWeight,
    tags: Array.isArray(value.tags)
      ? value.tags.filter((tag): tag is string => typeof tag === 'string')
      : undefined,
    snapshots: Array.isArray(value.snapshots) ? value.snapshots : undefined,
    publicationPackages: Array.isArray(value.publicationPackages)
      ? value.publicationPackages
      : undefined,
    collaborationRoster: Array.isArray(value.collaborationRoster)
      ? value.collaborationRoster
      : undefined,
    assets: Array.isArray(value.assets) ? value.assets : undefined,
    testKnitRounds: Array.isArray(value.testKnitRounds) ? value.testKnitRounds : undefined,
    samples: Array.isArray(value.samples) ? value.samples : undefined,
    submissions: Array.isArray(value.submissions) ? value.submissions : undefined,
    wholesaleOrders: Array.isArray(value.wholesaleOrders) ? value.wholesaleOrders : undefined,
    releaseDrafts: Array.isArray(value.releaseDrafts) ? value.releaseDrafts.map(normalizeReleaseDraft).filter(Boolean) : undefined,
    isArchived: typeof value.isArchived === 'boolean' ? value.isArchived : undefined,
  };
}

function normalizeReleaseDraft(draft: any): any {
  if (!draft || typeof draft !== 'object') return null;
  
  return {
    id: typeof draft.id === 'string' ? draft.id : Math.random().toString(36).substring(2, 11),
    projectId: typeof draft.projectId === 'string' ? draft.projectId : '',
    selectedArtifactIds: Array.isArray(draft.selectedArtifactIds) ? draft.selectedArtifactIds : [],
    selectedAssetIds: Array.isArray(draft.selectedAssetIds) ? draft.selectedAssetIds : [],
    reviewedAltText: typeof draft.reviewedAltText === 'string' ? draft.reviewedAltText : undefined,
    caption: typeof draft.caption === 'string' ? draft.caption : undefined,
    audience: typeof draft.audience === 'string' ? draft.audience : undefined,
    purpose: typeof draft.purpose === 'string' ? draft.purpose : undefined,
    redactedPaths: Array.isArray(draft.redactedPaths) ? draft.redactedPaths : [],
    handoffStatus: ['prepared', 'handed-off', 'unknown'].includes(draft.handoffStatus) ? draft.handoffStatus : 'prepared',
    handoffResult: typeof draft.handoffResult === 'string' ? draft.handoffResult : undefined,
    reviewedAt: typeof draft.reviewedAt === 'string' ? draft.reviewedAt : undefined,
    lastHandoffAt: typeof draft.lastHandoffAt === 'string' ? draft.lastHandoffAt : undefined,
    withdrawnAt: typeof draft.withdrawnAt === 'string' ? draft.withdrawnAt : undefined,
    createdAt: typeof draft.createdAt === 'string' ? draft.createdAt : new Date().toISOString(),
    updatedAt: typeof draft.updatedAt === 'string' ? draft.updatedAt : new Date().toISOString(),
  };
}

/**
 * Normalizes a collection while dropping records that cannot be represented
 * as projects. The fallback id is made unique per record by the caller when
 * needed; existing ids are preserved for migration stability.
 */
export function normalizeProjectRecords(value: unknown, now = new Date().toISOString()): PatternProject[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((record, index) => normalizeProjectRecord(record, now, `legacy-${now}-${index}`))
    .filter((project): project is PatternProject => project !== null);
}
