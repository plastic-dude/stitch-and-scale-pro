/**
 * storage-lib — the single seam for all persistent storage in Stitch & Scale.
 *
 * WHY THIS EXISTS (self-audit W1/W2, 2026-08-14):
 * ProjectsContext persists projects IndexedDB-first (idb-keyval) and only
 * falls back to localStorage on load, while the old export/import helpers
 * in SettingsContext read/write localStorage exclusively. That mismatch
 * meant a "Back up all patterns" export could silently omit the data the
 * app actually runs on, and a restore could land in the wrong store.
 *
 * THE FIX:
 * Every read goes IDB → localStorage fallback (order of record). Every
 * write goes to BOTH stores (idempotent, both stores always valid
 * independently, so each can serve as the other's recovery path).
 *
 * THE FUTURE SEAM:
 * Cloud storage / auth (Supabase) will land here and ONLY here. When it
 * arrives, components call the same functions below — nothing in the UI
 * layer knows storage moved. Local-first remains the base layer even
 * after sync is added (offline-first, same reconciliation model).
 */
import { get as idbGet, set as idbSet, keys as idbKeys } from 'idb-keyval';
import { PatternProject } from '@/lib/grading-engine';
import type { OperationalRecords } from '@/lib/operational-records';

export const PROJECTS_KEY = 'stitch-and-scale-v1';
export const SETTINGS_KEY = 'stitch-and-scale-settings-v1';
export const BACKUPS_KEY = 'stitch-and-scale-backups-v1';

export const OPERATIONAL_RECORDS_PREFIX = 'stitch-and-scale-operations-';

export const WORKSPACE_BACKUP_KIND = 'stitch-and-scale-workspace-backup';
export const WORKSPACE_BACKUP_VERSION = 1;

export interface StoreSnapshot {
  kind: typeof WORKSPACE_BACKUP_KIND;
  version: typeof WORKSPACE_BACKUP_VERSION;
  createdAt: string;
  projects: PatternProject[];
  settings: Record<string, unknown>;
  operationalRecords: Record<string, OperationalRecords>;
}

export interface StoreSnapshotInput {
  kind?: unknown;
  version?: unknown;
  createdAt?: unknown;
  projects?: PatternProject[];
  settings?: Record<string, unknown>;
  operationalRecords?: Record<string, OperationalRecords>;
}

export interface StoreSnapshotPreview {
  projectCount: number;
  operationalProjectCount: number;
  operationalRecordCount: number;
  hasSettings: boolean;
  createdAt: string | null;
  version: number;
  legacy: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizeSnapshot(data: unknown): { snapshot: StoreSnapshotInput; legacy: boolean } | null {
  if (!isRecord(data)) return null;
  const parsed = data as StoreSnapshotInput;
  const hasEnvelope = parsed.kind !== undefined || parsed.version !== undefined || parsed.createdAt !== undefined;
  const legacy = !hasEnvelope;
  if (!legacy && (parsed.kind !== WORKSPACE_BACKUP_KIND || parsed.version !== WORKSPACE_BACKUP_VERSION || typeof parsed.createdAt !== 'string' || Number.isNaN(Date.parse(parsed.createdAt)))) return null;
  if (parsed.projects !== undefined && !Array.isArray(parsed.projects)) return null;
  if (parsed.settings !== undefined && !isRecord(parsed.settings)) return null;
  if (parsed.operationalRecords !== undefined && !isRecord(parsed.operationalRecords)) return null;
  if (parsed.projects === undefined && parsed.settings === undefined && parsed.operationalRecords === undefined) return null;
  const operationalRecords = parsed.operationalRecords ?? {};
  const entries = Object.entries(operationalRecords);
  for (const [projectId, value] of entries) {
    if (!isRecord(value)) return null;
    const records = value as Partial<OperationalRecords>;
    if (records.projectId !== projectId || records.version !== 1 || !Array.isArray(records.samples) || !Array.isArray(records.testKnits) || !Array.isArray(records.submissions) || !Array.isArray(records.wholesaleOrders)) return null;
  }
  return { snapshot: parsed, legacy };
}

export function inspectSnapshot(data: unknown): StoreSnapshotPreview | null {
  const normalized = normalizeSnapshot(data);
  if (!normalized) return null;
  const snapshot = normalized.snapshot;
  const entries = Object.entries(snapshot.operationalRecords ?? {});
  const operationalRecordCount = entries.reduce((total, [, value]) => {
    const records = value as OperationalRecords;
    return total + records.samples.length + records.testKnits.length + records.submissions.length + records.wholesaleOrders.length;
  }, 0);
  return {
    projectCount: snapshot.projects?.length ?? 0,
    operationalProjectCount: entries.length,
    operationalRecordCount,
    hasSettings: isRecord(snapshot.settings),
    createdAt: typeof snapshot.createdAt === 'string' ? snapshot.createdAt : null,
    version: typeof snapshot.version === 'number' ? snapshot.version : 0,
    legacy: normalized.legacy,
  };
}

export interface AuditReport {
  idbBytes: number;
  localStorageBytes: number;
  idbProjectCount: number;
  localStorageProjectCount: number;
  inSync: boolean;
  lastExportedAt: string | null;
  daysSinceBackup: number | null;
}

function bytesOf(value: unknown): number {
  try {
    return new Blob([JSON.stringify(value)]).size;
  } catch {
    return 0;
  }
}

async function readLocal<T>(key: string): Promise<T | null> {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeLocal(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

/** Read projects with the canonical fallback order: IDB first, localStorage second. */
export async function readProjects(): Promise<PatternProject[]> {
  let parsed: PatternProject[] | null = null;
  const idbStored = await idbGet(PROJECTS_KEY);
  if (idbStored) {
    parsed = Array.isArray(idbStored) ? idbStored : null;
  }
  if (!parsed) {
    parsed = await readLocal<PatternProject[]>(PROJECTS_KEY);
  }
  return (parsed ?? []).map((p: any) => ({
    ...p,
    gauge: p.gauge || { stitchesPer4In: 0, rowsPer4In: 0, unit: 'in' },
    sections: p.sections || [],
  }));
}

/** Write projects to BOTH stores so each independently stays valid and recoverable. */
export async function writeProjects(projects: PatternProject[]): Promise<void> {
  const serializable = projects.map(({ ...p }) => p);
  await idbSet(PROJECTS_KEY, serializable);
  writeLocal(PROJECTS_KEY, serializable);
}

export async function readSettings(): Promise<Record<string, unknown> | null> {
  const idbStored = await idbGet(SETTINGS_KEY);
  if (idbStored && typeof idbStored === 'object') return idbStored as Record<string, unknown>;
  return readLocal<Record<string, unknown>>(SETTINGS_KEY);
}

/** Takes a full snapshot (projects + settings) the way export needs it —
 *  always from the live stores, never from a cached/stale source. */
export async function exportSnapshot(): Promise<StoreSnapshot> {
  const projects = await readProjects();
  const settings = (await readSettings()) ?? {};
  const operationalRecords = Object.fromEntries(
    projects.flatMap((project) => {
      const value = projectStorage<OperationalRecords>('operations', project.id).read();
      return value ? [[project.id, value] as const] : [];
    }),
  );
  return { kind: WORKSPACE_BACKUP_KIND, version: WORKSPACE_BACKUP_VERSION, createdAt: new Date().toISOString(), projects, settings, operationalRecords };
}

/** Import into both stores, merging with existing data rather than
 *  clobbering — restore can never accidentally erase projects that were
 *  never part of the backup file (self-audit W3). */
export async function importSnapshot(
  data: StoreSnapshotInput,
  opts: { mode: 'merge' | 'replace' } = { mode: 'merge' },
): Promise<{ imported: number; existingKept: number }> {
  const normalized = normalizeSnapshot(data);
  if (!normalized) throw new Error('Invalid Stitch & Scale workspace backup');
  const snapshot = normalized.snapshot;
  const existing = await readProjects();
  const existingById = new Set(existing.map(p => p.id));

  const incoming = Array.isArray(snapshot.projects) ? snapshot.projects : [];
  const incomingById = new Map(incoming.map(p => [p.id, p]));

  const merged =
    opts.mode === 'replace'
      ? incoming
      : existing.concat(
          incoming.filter(p => !existingById.has(p.id)),
        ); // merge mode NEVER lets an incoming entry clobber an existing one —
           // a collide-id entry from the backup file is silently dropped,
           // because the workspace copy is always the designer's current truth

  // imported = incoming entries that actually landed in the store (merge
  // mode counts only genuinely-new ids; replace mode counts all of them).
  const imported =
    opts.mode === 'replace'
      ? incoming.length
      : incoming.filter(p => !existingById.has(p.id)).length;
  // existingKept = existing projects that were preserved untouched by the
  // import, including those where the incoming file tried to overwrite them.
  const existingKept = existing.filter(p => incomingById.has(p.id)).length;

  await writeProjects(merged);

  const landedProjectIds = new Set(opts.mode === 'replace' ? incoming.map((project) => project.id) : incoming.filter((project) => !existingById.has(project.id)).map((project) => project.id));
  if (opts.mode === 'replace') {
    for (let index = localStorage.length - 1; index >= 0; index -= 1) {
      const key = localStorage.key(index);
      if (key?.startsWith(OPERATIONAL_RECORDS_PREFIX) && !landedProjectIds.has(key.slice(OPERATIONAL_RECORDS_PREFIX.length))) localStorage.removeItem(key);
    }
  }
  for (const [projectId, records] of Object.entries(snapshot.operationalRecords ?? {})) {
    if (landedProjectIds.has(projectId) && records.projectId === projectId && records.version === 1) projectStorage<OperationalRecords>('operations', projectId).write(records);
  }

  if (snapshot.settings && typeof snapshot.settings === 'object') {
    const current = (await readSettings()) ?? {};
    const mergedSettings = { ...current, ...snapshot.settings };
    await idbSet(SETTINGS_KEY, mergedSettings);
    writeLocal(SETTINGS_KEY, mergedSettings);
  }

  recordBackupEvent(bytesOf(snapshot), imported);
  return { imported, existingKept };
}

export interface BackupLedgerEntry {
  exportedAt: string;
  projectCount: number;
  sizeBytes: number;
}

export function readBackupLedger(): BackupLedgerEntry[] {
  const raw = localStorage.getItem(BACKUPS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as BackupLedgerEntry[];
  } catch {
    return [];
  }
}

/**
 * THE PROJECT-SCOPED SEAM (reviewer finding S018/S042/S045/S049 + issue #4).
 *
 * WHY: 18 tabs had 18 hand-rolled localStorage keys — and several of them
 * were FLAT global keys (snsp-v1, kskroi-v1, kskchannels-v1, rtpl-v1,
 * promo-v1, mspl-v1, prcw-v1, pslc-v1, kskhirevsself-v1, kskwsb-v1,
 * kskclubrev-v1, sncis-v1, pmix-v1, stitch-and-scale-testknit), so a
 * setting saved for project A silently became the default for project B.
 *
 * THE RULE: every tab that stores per-project UI state MUST go through
 * projectStorage<T>(prefix, projectId) — it enforces the key shape
 * stitch-and-scale-{prefix}-{projectId}, and folds any legacy flat key
 * into the scoped one on first read (reads-once migration) before
 * removing the legacy key. New tabs get a clean scoped key and skip the
 * migration path entirely. Cloud storage lands here too when it arrives.
 */
export interface ProjectStorageHandle<T> {
  /** Scoped key actually used — always stitch-and-scale-{prefix}-{projectId}. */
  readonly scopedKey: string;
  read(): T | null;
  write(value: T): void;
  /** Fold a legacy flat key into the scoped key (reads-once migration).
   *  `opts.partition` folds only this project's partition from a
   *  `{ [projectId]: state }` legacy blob. */
  migrateFrom(legacyKey: string, opts?: { partition?: boolean }): void;
}

export function projectStorage<T>(
  prefix: string,
  projectId: string,
  legacyKeys: string[] = [],
  opts?: { partition?: boolean },
): ProjectStorageHandle<T> {
  // `partition`: the legacy keys are projectId-partitioned blobs ({ [projectId]:
  // state }), not flat single-project values. Only this project's partition is
  // folded into the scoped key; the rest of the blob is discarded. (The pre-seam
  // layout used by the trunk-show and translation-bundle tabs.)
  const partition = opts?.partition ?? false;
  // Defensive: if a hostile or already-composed id carries the full scoped
  // shape (e.g. projectId === 'stitch-and-scale-kalroi-evil'), never
  // double-embed it — strip the prefix so the final key stays canonical.
  const prefixPrefix = `stitch-and-scale-${prefix}-`;
  const safeId = projectId.startsWith(prefixPrefix) && projectId.length > prefixPrefix.length
    ? projectId.slice(prefixPrefix.length)
    : projectId;
  const scopedKey = `stitch-and-scale-${prefix}-${safeId}`;
  const read = (): T | null => {
    try {
      const raw = localStorage.getItem(scopedKey);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  };
  const write = (value: T): void => {
    localStorage.setItem(scopedKey, JSON.stringify(value));
  };
  const migrateFrom = (legacyKey: string, opts?: { partition?: boolean }): void => {
    if (legacyKey === scopedKey) return; // never migrate into self
    try {
      const raw = localStorage.getItem(legacyKey);
      if (!raw) return; // no legacy data — clean path, nothing to fold
      // Scoped key already holds newer data: legacy is stale, drop it.
      if (read() !== null) {
        localStorage.removeItem(legacyKey);
        return;
      }
      // Scoped key is empty: fold the legacy value over, then remove it.
      let parsed = JSON.parse(raw) as T;
      // Partitioned legacy blob ({ [projectId]: state }) — the pre-seam layout
      // the trunk-show and translation-bundle tabs used: one flat key whose
      // value was an object keyed by projectId. Fold ONLY this project's
      // partition in; the rest of the blob is other projects' state and is
      // discarded rather than polluting every project with everyone's data.
      if (opts?.partition && parsed && typeof parsed === 'object') {
        const part = (parsed as unknown as Record<string, unknown>)[safeId];
        if (part && typeof part === 'object') parsed = part as T;
        else parsed = {} as T;
      }
      if (parsed && typeof parsed === 'object') {
        write(parsed);
        localStorage.removeItem(legacyKey);
      }
    } catch {
      // Corrupt legacy key: leave it alone, drop from migration.
    }
  };
  const handle: ProjectStorageHandle<T> = { scopedKey, read, write, migrateFrom };
  // Reads-once migration: every legacy key gets one attempt the first time
  // this handle is created for a projectId that hasn't written yet.
  for (const legacy of legacyKeys) handle.migrateFrom(legacy, { partition });
  return handle;
}

export function recordBackupEvent(sizeBytes = 0, projectCount = 0): void {
  const ledger = readBackupLedger();
  ledger.push({
    exportedAt: new Date().toISOString(),
    projectCount,
    sizeBytes,
  });
  // Keep the last 20 entries — enough history to trust, too small to bloat
  localStorage.setItem(BACKUPS_KEY, JSON.stringify(ledger.slice(-20)));
}

/** Self-audit W2: full audit of both stores so the designer can see, in
 *  plain numbers, exactly where their work lives and whether it's safe. */
export async function auditStores(): Promise<AuditReport> {
  const idbProjects = await idbGet<PatternProject[]>(PROJECTS_KEY);
  const localProjects = await readLocal<PatternProject[]>(PROJECTS_KEY);
  const idbBytes = bytesOf(idbProjects);
  const localStorageBytes = bytesOf(localProjects);
  const inSync =
    JSON.stringify(idbProjects ?? null) === JSON.stringify(localProjects ?? null);

  const ledger = readBackupLedger();
  const lastExportedAt = ledger.length > 0 ? ledger[ledger.length - 1].exportedAt : null;
  let daysSinceBackup: number | null = null;
  if (lastExportedAt) {
    daysSinceBackup = Math.floor(
      (Date.now() - new Date(lastExportedAt).getTime()) / 86_400_000,
    );
  }

  return {
    idbBytes,
    localStorageBytes,
    idbProjectCount: (idbProjects ?? []).length,
    localStorageProjectCount: (localProjects ?? []).length,
    inSync,
    lastExportedAt,
    daysSinceBackup,
  };
}

/** Reconcile the two stores to the canonical snapshot — self-audit W1's
 *  one-click cure. Both stores end up holding the same, most-complete data. */
export async function reconcileStores(): Promise<void> {
  const projects = await readProjects(); // canonical read: IDB → localStorage
  await writeProjects(projects);
}
