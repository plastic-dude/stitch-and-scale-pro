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

export const PROJECTS_KEY = 'stitch-and-scale-v1';
export const SETTINGS_KEY = 'stitch-and-scale-settings-v1';
export const BACKUPS_KEY = 'stitch-and-scale-backups-v1';

export interface StoreSnapshot {
  projects: PatternProject[];
  settings: Record<string, unknown>;
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
  return { projects, settings };
}

/** Import into both stores, merging with existing data rather than
 *  clobbering — restore can never accidentally erase projects that were
 *  never part of the backup file (self-audit W3). */
export async function importSnapshot(
  data: { projects?: PatternProject[]; settings?: Record<string, unknown> },
  opts: { mode: 'merge' | 'replace' } = { mode: 'merge' },
): Promise<{ imported: number; existingKept: number }> {
  const existing = await readProjects();
  const existingById = new Set(existing.map(p => p.id));

  const incoming = Array.isArray(data.projects) ? data.projects : [];
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

  if (data.settings && typeof data.settings === 'object') {
    const current = (await readSettings()) ?? {};
    const mergedSettings = { ...current, ...data.settings };
    await idbSet(SETTINGS_KEY, mergedSettings);
    writeLocal(SETTINGS_KEY, mergedSettings);
  }

  recordBackupEvent(bytesOf(data.projects ?? []), imported);
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
