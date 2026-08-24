import type { PatternProject, ProjectAsset } from './grading-engine';
import { isValidLanguageCode, type LanguageCode } from './i18n';

/**
 * QUEUE-070: the local release-draft contract.
 *
 * This module is deliberately browser/runtime agnostic. It stores references and
 * review decisions, never image bytes or remote URLs, and treats browser
 * handoff as a request outcome rather than proof that another application or
 * platform saved, displayed, accepted, or published anything.
 */

export const RELEASE_DRAFT_VERSION = 1 as const;

export const RELEASE_DRAFT_LOCALES = ['en', 'de', 'fr', 'es', 'pt'] as const satisfies readonly LanguageCode[];
export type ReleaseDraftLocale = (typeof RELEASE_DRAFT_LOCALES)[number];

export const RELEASE_ARTIFACT_KINDS = ['brag-card', 'project-book', 'pattern-pdf', 'receipt'] as const;
export type ReleaseArtifactKind = (typeof RELEASE_ARTIFACT_KINDS)[number];

export const RELEASE_ARTIFACT_AVAILABILITIES = ['available', 'needs-review', 'missing'] as const;
export type ReleaseArtifactAvailability = (typeof RELEASE_ARTIFACT_AVAILABILITIES)[number];

export const RELEASE_DRAFT_PURPOSES = ['portfolio', 'pattern-preview', 'finished-work', 'private-review'] as const;
export type ReleaseDraftPurpose = (typeof RELEASE_DRAFT_PURPOSES)[number];

export const RELEASE_DRAFT_AUDIENCES = ['private', 'trusted-reviewer', 'public'] as const;
export type ReleaseDraftAudience = (typeof RELEASE_DRAFT_AUDIENCES)[number];

export const RELEASE_HANDOFF_CHANNELS = ['clipboard', 'native-share', 'download', 'print'] as const;
export type ReleaseHandoffChannel = (typeof RELEASE_HANDOFF_CHANNELS)[number];

export const RELEASE_HANDOFF_OUTCOMES = ['resolved', 'cancelled', 'denied', 'unsupported', 'failed', 'unknown'] as const;
export type ReleaseHandoffOutcome = (typeof RELEASE_HANDOFF_OUTCOMES)[number];

export const RELEASE_DRAFT_STATUSES = ['prepared', 'handed-off', 'unknown'] as const;
export type ReleaseDraftStatus = (typeof RELEASE_DRAFT_STATUSES)[number];

export const RELEASE_DRAFT_FIELDS = [
  'title',
  'description',
  'author',
  'gauge',
  'sizes',
  'grading-summary',
  'notes',
  'stitch-identity',
] as const;
export type ReleaseDraftField = (typeof RELEASE_DRAFT_FIELDS)[number];

export interface ReleaseDraftArtifact {
  id: string;
  kind: ReleaseArtifactKind;
  sourceId: string;
  label: string;
  provenance: string;
  availability: ReleaseArtifactAvailability;
  selectedAt: string;
}

export interface ReleaseDraftLocaleReview {
  text: string;
  reviewed: boolean;
  reviewedAt?: string;
}

export interface ReleaseDraftMedia {
  id: string;
  assetId: string;
  label: string;
  filename: string;
  mimeType: string;
  byteSize: number;
  caption: string;
  altTextByLocale: Record<ReleaseDraftLocale, ReleaseDraftLocaleReview>;
  selectedAt: string;
  /** Redaction omits this media from the handoff without mutating the source asset. */
  redacted: boolean;
}

export interface ReleaseDraftReview {
  status: 'not-reviewed' | 'reviewed';
  reviewedAt?: string;
}

export interface ReleaseDraftHandoff {
  state: ReleaseDraftStatus;
  attemptedAt?: string;
  /** Human-readable browser result detail; never a platform-success claim. */
  note?: string;
}

export interface ReleaseDraft {
  version: typeof RELEASE_DRAFT_VERSION;
  id: string;
  projectId: string;
  title: string;
  activeLocale: ReleaseDraftLocale;
  purpose: ReleaseDraftPurpose;
  audience: ReleaseDraftAudience;
  artifacts: ReleaseDraftArtifact[];
  media: ReleaseDraftMedia[];
  selectedFields: ReleaseDraftField[];
  redactedFields: ReleaseDraftField[];
  review: ReleaseDraftReview;
  handoffs: Partial<Record<ReleaseHandoffChannel, ReleaseDraftHandoff>>;
  status: ReleaseDraftStatus;
  createdAt: string;
  updatedAt: string;
  withdrawnAt?: string;
}

export interface ReleaseDraftValidation {
  ok: boolean;
  issues: string[];
  draft?: ReleaseDraft;
}

export interface LocalMediaSelectionIssue {
  assetId: string;
  code: 'not-found' | 'malformed' | 'not-local-image';
}

export interface LocalMediaSelection {
  selected: ReleaseDraftMedia[];
  omitted: LocalMediaSelectionIssue[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
}

function isDateString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0 && Number.isFinite(Date.parse(value));
}

function safeDate(value?: string): string {
  return isDateString(value) ? value : new Date().toISOString();
}

function isOneOf<T extends readonly string[]>(values: T, value: unknown): value is T[number] {
  return typeof value === 'string' && values.includes(value);
}

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}

function isReleaseDraftField(value: unknown): value is ReleaseDraftField {
  return isOneOf(RELEASE_DRAFT_FIELDS, value);
}

function emptyLocaleReviews(): Record<ReleaseDraftLocale, ReleaseDraftLocaleReview> {
  return Object.fromEntries(
    RELEASE_DRAFT_LOCALES.map((locale) => [locale, { text: '', reviewed: false }]),
  ) as Record<ReleaseDraftLocale, ReleaseDraftLocaleReview>;
}

function normalizeLocaleReviews(value: unknown): Record<ReleaseDraftLocale, ReleaseDraftLocaleReview> {
  const raw = isRecord(value) ? value : {};
  const result = emptyLocaleReviews();

  for (const locale of RELEASE_DRAFT_LOCALES) {
    const entry = raw[locale];
    if (!isRecord(entry)) continue;
    result[locale] = {
      text: typeof entry.text === 'string' ? entry.text.trim() : '',
      reviewed: entry.reviewed === true,
      reviewedAt: isDateString(entry.reviewedAt) ? entry.reviewedAt : undefined,
    };
  }

  return result;
}

function isUsableLocalImageAsset(value: unknown): value is ProjectAsset {
  if (!isRecord(value)) return false;
  return (
    nonEmptyString(value.id) &&
    nonEmptyString(value.label) &&
    nonEmptyString(value.filename) &&
    typeof value.mimeType === 'string' &&
    value.mimeType.toLowerCase().startsWith('image/') &&
    typeof value.size === 'number' &&
    Number.isFinite(value.size) &&
    value.size > 0 &&
    typeof value.dataUrl === 'string' &&
    value.dataUrl.startsWith('data:')
  );
}

/**
 * Resolve only explicitly selected, still-local image assets. The returned
 * records intentionally omit dataUrl so a draft never duplicates or broadens
 * the source media payload. Missing or malformed selections are reported, not
 * substituted with a sample/demo or remote asset.
 */
export function resolveLocalMediaSelection(
  project: Pick<PatternProject, 'assets'> | null | undefined,
  assetIds: readonly string[],
  selectedAt = new Date().toISOString(),
): LocalMediaSelection {
  const assets = Array.isArray(project?.assets) ? project.assets : [];
  const byId = new Map(assets.map((asset) => [asset?.id, asset]));
  const selected: ReleaseDraftMedia[] = [];
  const omitted: LocalMediaSelectionIssue[] = [];

  for (const assetId of unique(assetIds)) {
    if (!nonEmptyString(assetId)) continue;
    const asset = byId.get(assetId);
    if (asset === undefined) {
      omitted.push({ assetId, code: 'not-found' });
      continue;
    }
    if (!isRecord(asset)) {
      omitted.push({ assetId, code: 'malformed' });
      continue;
    }
    if (!isUsableLocalImageAsset(asset)) {
      omitted.push({ assetId, code: 'not-local-image' });
      continue;
    }

    selected.push({
      id: `media-${asset.id}`,
      assetId: asset.id,
      label: asset.label.trim(),
      filename: asset.filename.trim(),
      mimeType: asset.mimeType.trim(),
      byteSize: asset.size,
      caption: typeof asset.caption === 'string' ? asset.caption.trim() : '',
      altTextByLocale: emptyLocaleReviews(),
      selectedAt: safeDate(selectedAt),
      redacted: false,
    });
  }

  return { selected, omitted };
}

export function createReleaseDraft(input: {
  id: string;
  projectId: string;
  title: string;
  activeLocale: LanguageCode;
  purpose: ReleaseDraftPurpose;
  audience: ReleaseDraftAudience;
  now?: string;
}): ReleaseDraft | null {
  if (
    !nonEmptyString(input.id) ||
    !nonEmptyString(input.projectId) ||
    !nonEmptyString(input.title) ||
    !isValidLanguageCode(input.activeLocale) ||
    !isOneOf(RELEASE_DRAFT_PURPOSES, input.purpose) ||
    !isOneOf(RELEASE_DRAFT_AUDIENCES, input.audience)
  ) {
    return null;
  }

  const now = safeDate(input.now);
  return {
    version: RELEASE_DRAFT_VERSION,
    id: input.id.trim(),
    projectId: input.projectId.trim(),
    title: input.title.trim(),
    activeLocale: input.activeLocale,
    purpose: input.purpose,
    audience: input.audience,
    artifacts: [],
    media: [],
    selectedFields: [],
    redactedFields: [],
    review: { status: 'not-reviewed' },
    handoffs: {},
    status: 'prepared',
    createdAt: now,
    updatedAt: now,
  };
}

function normalizeArtifact(value: unknown): ReleaseDraftArtifact | null {
  if (!isRecord(value)) return null;
  if (
    !nonEmptyString(value.id) ||
    !isOneOf(RELEASE_ARTIFACT_KINDS, value.kind) ||
    !nonEmptyString(value.sourceId) ||
    !nonEmptyString(value.label) ||
    !nonEmptyString(value.provenance) ||
    !isOneOf(RELEASE_ARTIFACT_AVAILABILITIES, value.availability) ||
    !isDateString(value.selectedAt)
  ) return null;

  return {
    id: value.id.trim(),
    kind: value.kind,
    sourceId: value.sourceId.trim(),
    label: value.label.trim(),
    provenance: value.provenance.trim(),
    availability: value.availability,
    selectedAt: value.selectedAt,
  };
}

function normalizeMedia(value: unknown): ReleaseDraftMedia | null {
  if (!isRecord(value)) return null;
  if (
    !nonEmptyString(value.id) ||
    !nonEmptyString(value.assetId) ||
    !nonEmptyString(value.label) ||
    !nonEmptyString(value.filename) ||
    typeof value.mimeType !== 'string' ||
    !value.mimeType.toLowerCase().startsWith('image/') ||
    typeof value.byteSize !== 'number' ||
    !Number.isFinite(value.byteSize) ||
    value.byteSize <= 0 ||
    !isDateString(value.selectedAt)
  ) return null;

  return {
    id: value.id.trim(),
    assetId: value.assetId.trim(),
    label: value.label.trim(),
    filename: value.filename.trim(),
    mimeType: value.mimeType.trim(),
    byteSize: value.byteSize,
    caption: typeof value.caption === 'string' ? value.caption.trim() : '',
    altTextByLocale: normalizeLocaleReviews(value.altTextByLocale),
    selectedAt: value.selectedAt,
    redacted: value.redacted === true,
  };
}

function normalizeHandoffs(value: unknown): Partial<Record<ReleaseHandoffChannel, ReleaseDraftHandoff>> | null {
  if (!isRecord(value)) return null;
  const result: Partial<Record<ReleaseHandoffChannel, ReleaseDraftHandoff>> = {};

  for (const channel of RELEASE_HANDOFF_CHANNELS) {
    if (!(channel in value)) continue;
    const entry = value[channel];
    if (!isRecord(entry) || !isOneOf(RELEASE_DRAFT_STATUSES, entry.state)) return null;
    result[channel] = {
      state: entry.state,
      attemptedAt: isDateString(entry.attemptedAt) ? entry.attemptedAt : undefined,
      note: optionalString(entry.note),
    };
  }

  return result;
}

function deriveStatus(handoffs: Partial<Record<ReleaseHandoffChannel, ReleaseDraftHandoff>>): ReleaseDraftStatus {
  const states = Object.values(handoffs).map((entry) => entry?.state).filter(Boolean);
  if (states.includes('unknown')) return 'unknown';
  if (states.includes('handed-off')) return 'handed-off';
  return 'prepared';
}

/**
 * Normalize an imported/local record into the current shape. Unknown versions,
 * malformed required records, and malformed handoff maps fail closed as null.
 * Missing locale review entries are filled as unreviewed, never assumed safe.
 */
export function normalizeReleaseDraft(
  value: unknown,
  now = new Date().toISOString(),
  fallbackId = `release-draft-${safeDate(now)}`,
): ReleaseDraft | null {
  if (!isRecord(value) || value.version !== RELEASE_DRAFT_VERSION) return null;
  if (
    !nonEmptyString(value.id) ||
    !nonEmptyString(value.projectId) ||
    !nonEmptyString(value.title) ||
    !isValidLanguageCode(String(value.activeLocale)) ||
    !isOneOf(RELEASE_DRAFT_PURPOSES, value.purpose) ||
    !isOneOf(RELEASE_DRAFT_AUDIENCES, value.audience) ||
    !Array.isArray(value.artifacts) ||
    !Array.isArray(value.media) ||
    !Array.isArray(value.selectedFields) ||
    !Array.isArray(value.redactedFields) ||
    !isRecord(value.review)
  ) return null;

  const artifacts = value.artifacts.map(normalizeArtifact);
  const media = value.media.map(normalizeMedia);
  const handoffs = normalizeHandoffs(value.handoffs ?? {});
  if (artifacts.some((artifact) => artifact === null) || media.some((item) => item === null) || handoffs === null) return null;
  if (value.review.status !== 'not-reviewed' && value.review.status !== 'reviewed') return null;

  const selectedFields = unique(value.selectedFields.filter(isReleaseDraftField));
  const redactedFields = unique(value.redactedFields.filter(isReleaseDraftField));
  const createdAt = isDateString(value.createdAt) ? value.createdAt : safeDate(now);
  const updatedAt = isDateString(value.updatedAt) ? value.updatedAt : createdAt;

  return {
    version: RELEASE_DRAFT_VERSION,
    id: nonEmptyString(value.id) ? value.id.trim() : fallbackId,
    projectId: value.projectId.trim(),
    title: value.title.trim(),
    activeLocale: value.activeLocale as ReleaseDraftLocale,
    purpose: value.purpose,
    audience: value.audience,
    artifacts: artifacts as ReleaseDraftArtifact[],
    media: media as ReleaseDraftMedia[],
    selectedFields,
    redactedFields,
    review: {
      status: value.review.status,
      reviewedAt: isDateString(value.review.reviewedAt) ? value.review.reviewedAt : undefined,
    },
    handoffs,
    status: deriveStatus(handoffs),
    createdAt,
    updatedAt,
    withdrawnAt: isDateString(value.withdrawnAt) ? value.withdrawnAt : undefined,
  };
}

function hasDuplicate(values: readonly string[]): boolean {
  return new Set(values).size !== values.length;
}

function hasForbiddenExternalReference(value: string): boolean {
  return /^(?:https?:|data:|blob:)/i.test(value) || /:\/\//.test(value);
}

/**
 * Validate a draft before preview/handoff. The result is intentionally verbose
 * so the future UI can show needs-review causes instead of disabling a button
 * without explanation.
 */
export function validateReleaseDraft(value: unknown): ReleaseDraftValidation {
  const draft = normalizeReleaseDraft(value);
  if (!draft) return { ok: false, issues: ['malformed-draft'] };

  const issues: string[] = [];
  if (draft.artifacts.length === 0) issues.push('artifact-required');
  if (hasDuplicate(draft.artifacts.map((artifact) => artifact.id))) issues.push('duplicate-artifact-id');
  if (hasDuplicate(draft.artifacts.map((artifact) => artifact.sourceId))) issues.push('duplicate-artifact-source');
  if (draft.artifacts.some((artifact) => artifact.availability !== 'available')) issues.push('artifact-needs-review');
  if (draft.artifacts.some((artifact) => hasForbiddenExternalReference(artifact.sourceId))) issues.push('external-artifact-reference');
  if (draft.artifacts.some((artifact) => hasForbiddenExternalReference(artifact.provenance))) issues.push('external-provenance-reference');

  if (hasDuplicate(draft.media.map((item) => item.id))) issues.push('duplicate-media-id');
  if (hasDuplicate(draft.media.map((item) => item.assetId))) issues.push('duplicate-media-source');
  for (const media of draft.media) {
    if (media.redacted) continue;
    const localeReview = media.altTextByLocale[draft.activeLocale];
    if (!localeReview || !nonEmptyString(localeReview.text) || !localeReview.reviewed) {
      issues.push(`media-alt-text-needs-review:${media.assetId}:${draft.activeLocale}`);
    }
    for (const locale of RELEASE_DRAFT_LOCALES) {
      const review = media.altTextByLocale[locale];
      if (review.reviewed && !nonEmptyString(review.text)) issues.push(`empty-reviewed-alt-text:${media.assetId}:${locale}`);
    }
  }

  if (hasDuplicate(draft.selectedFields)) issues.push('duplicate-selected-field');
  if (hasDuplicate(draft.redactedFields)) issues.push('duplicate-redacted-field');
  if (draft.selectedFields.some((field) => draft.redactedFields.includes(field))) issues.push('selected-field-redacted');

  if (draft.review.status !== 'reviewed' || !isDateString(draft.review.reviewedAt)) issues.push('draft-review-required');
  if (draft.withdrawnAt) issues.push('draft-withdrawn');

  if (draft.status === 'handed-off' && !Object.values(draft.handoffs).some((entry) => entry?.state === 'handed-off')) {
    issues.push('handoff-state-inconsistent');
  }

  return issues.length === 0 ? { ok: true, issues: [], draft } : { ok: false, issues, draft };
}

export function setReleaseDraftReview(draft: ReleaseDraft, reviewed: boolean, reviewedAt?: string): ReleaseDraft {
  const updatedAt = safeDate(reviewedAt);
  return {
    ...draft,
    review: reviewed
      ? { status: 'reviewed', reviewedAt: updatedAt }
      : { status: 'not-reviewed' },
    status: deriveStatus(draft.handoffs),
    updatedAt,
  };
}

export function recordReleaseHandoff(
  draft: ReleaseDraft,
  channel: ReleaseHandoffChannel,
  outcome: ReleaseHandoffOutcome,
  attemptedAt?: string,
  note?: string,
): ReleaseDraft {
  const timestamp = safeDate(attemptedAt);
  const state: ReleaseDraftStatus = outcome === 'resolved' ? 'handed-off' : 'unknown';
  const handoffs = {
    ...draft.handoffs,
    [channel]: {
      state,
      attemptedAt: timestamp,
      note: optionalString(note),
    },
  } satisfies Partial<Record<ReleaseHandoffChannel, ReleaseDraftHandoff>>;

  return {
    ...draft,
    handoffs,
    status: deriveStatus(handoffs),
    updatedAt: timestamp,
  };
}

export function withdrawReleaseDraft(draft: ReleaseDraft, withdrawnAt?: string): ReleaseDraft {
  const timestamp = safeDate(withdrawnAt);
  return {
    ...draft,
    withdrawnAt: timestamp,
    status: 'unknown',
    updatedAt: timestamp,
  };
}

/**
 * Build the only handoff payload currently supported by the UI: plain text
 * copied to the user's clipboard. It deliberately includes no image bytes,
 * remote URL, token, or platform-success language, and it excludes anything
 * redacted or not reviewed for the active locale.
 */
export interface ReleaseDraftHandoffLabels {
  purpose: string;
  audience: string;
  artifacts: string;
  fields?: string;
  fieldLabel?: (field: ReleaseDraftField) => string;
  reviewedMedia: string;
  preparedNote: string;
}

export type ReleaseDraftFieldValues = Partial<Record<ReleaseDraftField, string>>;

export function buildReleaseDraftHandoffText(
  draft: ReleaseDraft,
  labels: ReleaseDraftHandoffLabels = {
    purpose: 'Purpose',
    audience: 'Audience',
    artifacts: 'Artifacts:',
    fields: 'Selected fields:',
    fieldLabel: (field) => field,
    reviewedMedia: 'Reviewed media alt text:',
    preparedNote: 'Prepared locally. Verify the destination yourself; no platform delivery is claimed.',
  },
  fieldValues: ReleaseDraftFieldValues = {},
): string {
  const validation = validateReleaseDraft(draft);
  if (!validation.ok || !validation.draft) return '';
  const current = validation.draft;
  const activeAlt = (media: ReleaseDraftMedia) => current.media.find((item) => item.id === media.id)?.altTextByLocale[current.activeLocale];
  const lines = [
    current.title,
    `${labels.purpose}: ${current.purpose}`,
    `${labels.audience}: ${current.audience}`,
    labels.artifacts,
    ...current.artifacts.filter((artifact) => artifact.availability === 'available').map((artifact) => `- ${artifact.label}`),
  ];
  const fieldLines = current.selectedFields.map((field) => {
    const value = fieldValues[field]?.trim();
    const label = labels.fieldLabel?.(field) ?? field;
    return value ? `- ${label}: ${value}` : `- ${label}`;
  });
  if (fieldLines.length > 0) lines.push(labels.fields ?? 'Selected fields:', ...fieldLines);

  const mediaLines = current.media
    .filter((media) => !media.redacted)
    .map((media) => {
      const review = activeAlt(media);
      return review?.reviewed && review.text ? `- ${media.label}: ${review.text}` : null;
    })
    .filter((line): line is string => Boolean(line));
  if (mediaLines.length > 0) lines.push(labels.reviewedMedia, ...mediaLines);
  lines.push(labels.preparedNote);
  return lines.join('\n');
}
