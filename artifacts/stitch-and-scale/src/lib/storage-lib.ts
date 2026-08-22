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
import { get as idbGet, set as idbSet, keys as idbKeys, clear as idbClear } from 'idb-keyval';
import { useCallback, useEffect, useMemo, useState } from 'react';
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

/** Download JSON through a Blob when available, with a data-URI fallback for
 * older embedded browsers. Keeping this here prevents individual screens from
 * accidentally exporting stale localStorage-only data. */
export function downloadJsonFile(value: unknown, filename: string): void {
  const payload = JSON.stringify(value, null, 2);
  const blob = new Blob([payload], { type: 'application/json;charset=utf-8' });
  const canCreateObjectUrl = typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function';
  const href = canCreateObjectUrl
    ? URL.createObjectURL(blob)
    : `data:application/json;charset=utf-8,${encodeURIComponent(payload)}`;
  const anchor = document.createElement('a');
  anchor.href = href;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  if (canCreateObjectUrl && href.startsWith('blob:')) URL.revokeObjectURL(href);
}

/** Export the canonical live snapshot and record exactly what was offered to
 * the designer as a recoverable backup event. */
export async function downloadSnapshot(filename: string): Promise<StoreSnapshot> {
  const snapshot = await exportSnapshot();
  downloadJsonFile(snapshot, filename);
  recordBackupEvent(bytesOf(snapshot), snapshot.projects.length);
  return snapshot;
}

/**
 * Import into both stores, merging with existing data rather than
 * clobbering — restore can never accidentally erase projects that were
 * never part of the backup file (self-audit W3). */
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
      // CHK-151 (QUEUE-006, S160 "migration delta" repro): the old guard
      // `typeof parsed === 'object'` silently orphaned every legacy value
      // that wasn't an object — several pre-seam tabs stored primitives
      // (a count, a rate, a flag) directly, so the migration produced a
      // scoped key that stayed empty, the legacy key that stayed in place,
      // and the card reading null forever with no trace of loss. The rule
      // now: anything that parses, folds — primitives and objects alike.
      // (Corrupt JSON still falls through to the catch below.)
      let parsed = JSON.parse(raw) as T;
      // Partitioned legacy blob ({ [projectId]: state }) — the pre-seam layout
      // the trunk-show and translation-bundle tabs used: one flat key whose
      // value was an object keyed by projectId. Fold ONLY this project's
      // partition in; the rest of the blob is other projects' state and is
      // discarded rather than polluting every project with everyone's data.
      if (opts?.partition && parsed && typeof parsed === 'object') {
        const part = (parsed as unknown as Record<string, unknown>)[safeId];
        // CHK-151: the partition itself may be a primitive (e.g. a stored
        // count). Silently defaulting to {} was the second half of the
        // delta — fold whatever the partition holds, verbatim.
        if (part !== undefined && part !== null) parsed = part as T;
        else parsed = {} as T;
      }
      write(parsed);
      localStorage.removeItem(legacyKey);
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

/**
 * THE REACT SEAM (CHK-152 / QUEUE-010 — HMR crash class).
 *
 * WHY: the four lazy-loader cards (giftcard, testknit-desk, translation-
 * bundle, trunk-show) hand-built handles with `useMemo(() =>
 * projectStorage(...), [project.id])` and then fed the handle into a
 * `useState(() => loader(handle))` lazy initializer. Under Vite 7 HMR the
 * module body re-runs while the component is mid-transition, and a lazy
 * initializer that touches a freshly-disposed handle is exactly where the
 * "Cannot read properties of null (reading 'useState')" crash was born.
 *
 * THE RULE: no component may derive a useState lazy initializer from a
 * useMemo-created handle. All per-project storage state goes through the
 * two hooks below. Handles are stable by key string (independent of object
 * identity), and stored state is derived through useMemo instead — so an
 * HMR module re-evaluation can never hand a component a half-dead handle.
 */

/**
 * Stable project-storage handle for a React component.
 * Identity is stable as long as prefix + projectId stay equal — a re-render
 * or HMR module re-evaluation never hands back a new handle for the same
 * key, which is the property that killed the cards.
 */
export function useProjectStorage<T>(
  prefix: string,
  projectId: string,
  legacyKeys: string[] = [],
  opts?: { partition?: boolean },
): ProjectStorageHandle<T> {
  // useMemo keyed on the canonical string shape of every parameter — the
  // handle object identity is stable even when HMR re-runs this module.
  return useMemo(
    () => projectStorage<T>(prefix, projectId, legacyKeys, opts),
    // eslint-disable-next-line react-hooks/exhaustive-deps — projectId is the
    // cache key by identity; String() keeps it from being an opaque object.
    [prefix, String(projectId), legacyKeys.join(','), String(opts?.partition ?? false)],
  );
}

/**
 * Stored state derived from a stable project-storage handle, persisted on
 * every change. Returns [stored, setStored] with the same shape as useState,
 * so cards migrate with a two-line diff.
 *
 * Derivation rule: the loaded value always comes from a MEMOIZED derivation
 * over the handle, never from a useState lazy initializer — that was the
 * crash pattern. Persistence rides an effect keyed on the scoped-key
 * string, which survives HMR re-mounts unchanged.
 */
export function useProjectStorageState<T>(
  handle: ProjectStorageHandle<T>,
  load: (raw: T | null) => T,
): [T, (next: T | ((prev: T) => T)) => void] {
  // Memoized derivation — not a useState lazy initializer.
  const raw = useMemo(() => handle.read(), [handle.scopedKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const initial = useMemo(() => load(raw), [handle.scopedKey, raw]); // eslint-disable-line react-hooks/exhaustive-deps
  const [stored, setStored] = useState<T>(initial);
  const [storedKey, setStoredKey] = useState(handle.scopedKey);

  // A mounted card can survive a project switch. Hydrate the new scoped key
  // first; never let the previous project's state write into it during the
  // transition. The separate key guard makes this ordering explicit.
  useEffect(() => {
    if (storedKey === handle.scopedKey) return;
    setStoredKey(handle.scopedKey);
    setStored(initial);
  }, [handle.scopedKey, initial, storedKey]);

  // Persist every change through the handle's own write path. The effect
  // deps are stable strings/handle across HMR, so no re-mount replays a
  // write through a disposed handle. During a key transition, persistence is
  // paused until the hydration effect above has installed the new value.
  useEffect(() => {
    if (storedKey !== handle.scopedKey) return;
    handle.write(stored);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stored, storedKey, handle.scopedKey]);
  // Updater-function form (setState(s => ...)) keeps the seam as a drop-in
  // replacement for every card's existing useState usage.
  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      setStored((prev) => (typeof next === 'function' ? (next as (prev: T) => T)(prev) : next));
    },
    [],
  );
  return [stored, update];
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

/** Wipe all projects from both stores. Settings and backup ledger remain. */
export async function wipeProjects(): Promise<void> {
  await idbSet(PROJECTS_KEY, []);
  writeLocal(PROJECTS_KEY, []);
}

/** 
 * Wipe everything owned by the app from this origin.
 * Projects, settings, backup ledger, and all per-project lab state.
 */
export async function wipeAllData(): Promise<void> {
  // 1. IndexedDB
  await idbClear();
  
  // 2. LocalStorage — strip all app-owned keys
  if (typeof localStorage !== 'undefined') {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('stitch-and-scale-') || key.startsWith('snsp-') || key.startsWith('ksk'))) {
        keysToRemove.push(key);
      }
    }
    for (const key of keysToRemove) {
      localStorage.removeItem(key);
    }
  }
}
