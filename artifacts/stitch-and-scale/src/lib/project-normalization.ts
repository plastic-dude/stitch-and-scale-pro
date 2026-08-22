import type {
  Gauge,
  PatternProject,
  PatternSection,
  SizeKey,
  SizingStandard,
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

function normalizeSections(value: unknown): PatternSection[] {
  return Array.isArray(value) ? value as PatternSection[] : [];
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
    isArchived: typeof value.isArchived === 'boolean' ? value.isArchived : undefined,
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
