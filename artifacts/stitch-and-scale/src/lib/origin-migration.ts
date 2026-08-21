import { exportSnapshot, importSnapshot, downloadJsonFile, recordBackupEvent } from '@/lib/storage-lib';
import type { PatternProject } from '@/lib/grading-engine';

export const ORIGIN_MIGRATION_FORMAT = 'stitch-and-scale-origin-migration';
export const ORIGIN_MIGRATION_VERSION = 1;
export const DEFAULT_MIGRATION_FILENAME = 'stitch-and-scale-origin-migration.json';
export const MAX_MIGRATION_BYTES = 8 * 1024 * 1024;
export const MAX_MIGRATION_STORAGE_ENTRIES = 2500;
export const MAX_MIGRATION_ENTRY_BYTES = 512 * 1024;
export const ORIGIN_MIGRATION_RESTORED_EVENT = 'stitch-and-scale-origin-migration-restored';

/** Browser state that is disposable or tied to the old origin rather than user work. */
const NON_PORTABLE_EXACT_KEYS = new Set([
  'hide-storage-warning',
  'stitch-and-scale-session-flag',
  'stitch-and-scale-early-access-queue-v1',
]);

const NON_PORTABLE_PREFIXES = [
  'stitch-and-scale-install-',
];

// Only app-owned namespaces may cross an origin boundary. The legacy keys are
// intentionally explicit: several pre-seam labs used short global names, and
// dropping them would make an old backup look valid while silently losing lab
// inputs. Unknown same-origin keys (including other apps and extensions) stay
// out of the export by default.
const PORTABLE_PREFIXES = [
  'stitch-and-scale-',
];

const PORTABLE_LEGACY_KEYS = new Set([
  'snsp-v1',
  'kskroi-v1',
  'kskchannels-v1',
  'rtpl-v1',
  'promo-v1',
  'mspl-v1',
  'prcw-v1',
  'pslc-v1',
  'kskhirevsself-v1',
  'kskwsb-v1',
  'kskclubrev-v1',
  'sncis-v1',
  'pmix-v1',
]);

export interface PortableStorageEntry {
  key: string;
  /** The raw localStorage string is retained so each card can parse its own schema. */
  value: string;
}

export interface OriginMigrationPackage {
  format: typeof ORIGIN_MIGRATION_FORMAT;
  version: typeof ORIGIN_MIGRATION_VERSION;
  exportedAt: string;
  sourceOrigin: string | null;
  snapshot: {
    projects: PatternProject[];
    settings: Record<string, unknown>;
  };
  localStorage: PortableStorageEntry[];
}

export type MigrationValidationResult = {
  ok: true;
  value: OriginMigrationPackage;
  warnings: string[];
} | {
  ok: false;
  error: string;
};

export interface MigrationRestoreResult {
  imported: number;
  existingKept: number;
  auxiliaryImported: number;
  settings: Record<string, unknown>;
  warnings: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isPatternProject(value: unknown): value is PatternProject {
  if (!isRecord(value)) return false;
  return typeof value.id === 'string'
    && value.id.length > 0
    && value.id.length <= 160
    && typeof value.name === 'string'
    && value.name.length <= 500
    && Array.isArray(value.sections);
}

function isPortableKey(key: string): boolean {
  if (!key || key.length > 512) return false;
  if (NON_PORTABLE_EXACT_KEYS.has(key)) return false;
  if (NON_PORTABLE_PREFIXES.some((prefix) => key.startsWith(prefix))) return false;
  return PORTABLE_LEGACY_KEYS.has(key) || PORTABLE_PREFIXES.some((prefix) => key.startsWith(prefix));
}

function byteLength(value: string): number {
  try {
    return new TextEncoder().encode(value).byteLength;
  } catch {
    return value.length;
  }
}

function serializedSize(value: unknown): number {
  try {
    return byteLength(JSON.stringify(value));
  } catch {
    return Number.POSITIVE_INFINITY;
  }
}

function currentOrigin(): string | null {
  return typeof window !== 'undefined' && typeof window.location?.origin === 'string'
    ? window.location.origin
    : null;
}

function readPortableLocalStorage(): PortableStorageEntry[] {
  if (typeof localStorage === 'undefined') return [];
  const entries: PortableStorageEntry[] = [];
  for (let index = 0; index < localStorage.length && entries.length < MAX_MIGRATION_STORAGE_ENTRIES; index += 1) {
    const key = localStorage.key(index);
    if (!key || !isPortableKey(key)) continue;
    const value = localStorage.getItem(key);
    if (value === null || byteLength(value) > MAX_MIGRATION_ENTRY_BYTES) continue;
    entries.push({ key, value });
  }
  return entries;
}

/** Build a self-contained file that can move between any two browser origins. */
export async function createOriginMigrationPackage(): Promise<OriginMigrationPackage> {
  const snapshot = await exportSnapshot();
  const migration: OriginMigrationPackage = {
    format: ORIGIN_MIGRATION_FORMAT,
    version: ORIGIN_MIGRATION_VERSION,
    exportedAt: new Date().toISOString(),
    sourceOrigin: currentOrigin(),
    snapshot,
    localStorage: readPortableLocalStorage(),
  };
  if (serializedSize(migration) > MAX_MIGRATION_BYTES) {
    throw new Error('This backup is too large for a safe browser migration file. Export smaller project groups first.');
  }
  return migration;
}

export function validateOriginMigrationPackage(raw: unknown): MigrationValidationResult {
  if (!isRecord(raw)) return { ok: false, error: 'The migration file is not a JSON object.' };

  // Existing Settings exports predate this package and contain only
  // { projects, settings }. Accepting that shape preserves recovery for users
  // who exported before the custom-domain migration was introduced. New exports
  // always use the explicit versioned format below.
  const isLegacySnapshot = raw.format === undefined
    && (Array.isArray(raw.projects) || isRecord(raw.settings));
  const normalized = isLegacySnapshot
    ? {
        format: ORIGIN_MIGRATION_FORMAT,
        version: ORIGIN_MIGRATION_VERSION,
        exportedAt: 'legacy-backup',
        sourceOrigin: null,
        snapshot: {
          projects: Array.isArray(raw.projects) ? raw.projects : [],
          settings: isRecord(raw.settings) ? raw.settings : {},
        },
        localStorage: [],
      }
    : raw;

  if (normalized.format !== ORIGIN_MIGRATION_FORMAT) return { ok: false, error: 'This is not a Stitch & Scale origin migration file.' };
  if (normalized.version !== ORIGIN_MIGRATION_VERSION) return { ok: false, error: 'This migration file uses an unsupported version.' };
  if (!isRecord(normalized.snapshot)) return { ok: false, error: 'The migration file has no valid workspace snapshot.' };
  if (!Array.isArray(normalized.snapshot.projects)) return { ok: false, error: 'The migration file has no valid project list.' };
  if (!isRecord(normalized.snapshot.settings)) return { ok: false, error: 'The migration file has no valid settings object.' };
  if (!Array.isArray(normalized.localStorage)) return { ok: false, error: 'The migration file has no valid auxiliary state list.' };
  if (typeof normalized.exportedAt !== 'string' || normalized.exportedAt.length > 100) return { ok: false, error: 'The migration timestamp is invalid.' };
  if (normalized.sourceOrigin !== null && normalized.sourceOrigin !== undefined && typeof normalized.sourceOrigin !== 'string') {
    return { ok: false, error: 'The migration source origin is invalid.' };
  }

  const projects = normalized.snapshot.projects.filter(isPatternProject);
  if (projects.length !== normalized.snapshot.projects.length) {
    return { ok: false, error: 'The migration contains a malformed project and was not imported.' };
  }

  const localStorageEntries: PortableStorageEntry[] = [];
  const warnings: string[] = isLegacySnapshot ? ['This older backup format was imported; future exports will include cross-origin auxiliary state.'] : [];
  for (const entry of normalized.localStorage) {
    if (!isRecord(entry) || typeof entry.key !== 'string' || typeof entry.value !== 'string') {
      warnings.push('One malformed auxiliary entry was skipped.');
      continue;
    }
    if (!isPortableKey(entry.key) || byteLength(entry.value) > MAX_MIGRATION_ENTRY_BYTES) {
      warnings.push(`Auxiliary entry ${entry.key.slice(0, 80)} was skipped because it is not portable or is too large.`);
      continue;
    }
    localStorageEntries.push({ key: entry.key, value: entry.value });
    if (localStorageEntries.length >= MAX_MIGRATION_STORAGE_ENTRIES) {
      warnings.push('The auxiliary state list was capped at the safe entry limit.');
      break;
    }
  }

  const value: OriginMigrationPackage = {
    format: ORIGIN_MIGRATION_FORMAT,
    version: ORIGIN_MIGRATION_VERSION,
    exportedAt: normalized.exportedAt,
    sourceOrigin: typeof normalized.sourceOrigin === 'string' ? normalized.sourceOrigin : null,
    snapshot: { projects, settings: normalized.snapshot.settings },
    localStorage: localStorageEntries,
  };
  if (serializedSize(value) > MAX_MIGRATION_BYTES) {
    return { ok: false, error: 'The migration file is too large for a safe browser restore.' };
  }
  return { ok: true, value, warnings };
}

/**
 * Restore into the current origin. Existing auxiliary keys are never overwritten;
 * project/settings restore keeps the canonical storage seam's merge semantics.
 */
export async function restoreOriginMigrationPackage(raw: unknown): Promise<MigrationRestoreResult> {
  const validation = validateOriginMigrationPackage(raw);
  if (!validation.ok) throw new Error(validation.error);

  const { value, warnings } = validation;
  const snapshotResult = await importSnapshot(value.snapshot, { mode: 'merge' });
  let auxiliaryImported = 0;
  if (typeof localStorage !== 'undefined') {
    for (const entry of value.localStorage) {
      if (localStorage.getItem(entry.key) !== null) continue;
      try {
        localStorage.setItem(entry.key, entry.value);
        auxiliaryImported += 1;
      } catch {
        warnings.push(`Auxiliary entry ${entry.key.slice(0, 80)} could not be restored in this browser.`);
      }
    }
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(ORIGIN_MIGRATION_RESTORED_EVENT));
  }
  return { ...snapshotResult, auxiliaryImported, settings: value.snapshot.settings, warnings };
}

export async function downloadOriginMigrationPackage(filename = DEFAULT_MIGRATION_FILENAME): Promise<OriginMigrationPackage> {
  const migration = await createOriginMigrationPackage();
  const safeFilename = filename.replace(/[^a-z0-9._-]+/gi, '-').slice(0, 120) || DEFAULT_MIGRATION_FILENAME;
  downloadJsonFile(migration, safeFilename.endsWith('.json') ? safeFilename : `${safeFilename}.json`);
  recordBackupEvent(serializedSize(migration), migration.snapshot.projects.length);
  return migration;
}
