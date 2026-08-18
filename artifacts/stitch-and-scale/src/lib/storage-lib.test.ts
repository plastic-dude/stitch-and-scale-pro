// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as idbKeyval from 'idb-keyval';

// Mock idb-keyval so tests verify logic against a controlled in-memory IDB.
const memory = new Map<string, unknown>();
vi.mock('idb-keyval', () => ({
  get: vi.fn(async (key: string) => memory.get(key)),
  set: vi.fn(async (key: string, value: unknown) => { memory.set(key, value); }),
  keys: vi.fn(async () => Array.from(memory.keys())),
}));

// Mock modules imported transitively are not needed; storage-lib only uses
// idb-keyval, localStorage, and grading-engine types (no DOM-side effects).

import {
  readProjects, writeProjects, exportSnapshot, importSnapshot, inspectSnapshot,
  auditStores, reconcileStores, recordBackupEvent, readBackupLedger,
  projectStorage,
  PROJECTS_KEY, SETTINGS_KEY, BACKUPS_KEY,
} from './storage-lib';
import { PatternProject } from './grading-engine';
import { EMPTY_OPERATIONAL_RECORDS, addSample } from './operational-records';

function project(id: string, name: string): PatternProject {
  return {
    id, name, author: 'Tester', baseSize: 'M',
    gauge: { stitchesPer4In: 18, rowsPer4In: 24, unit: 'in' },
    sections: [], createdAt: '2026-08-14T00:00:00Z', updatedAt: '2026-08-14T00:00:00Z',
  };
}

beforeEach(() => {
  memory.clear();
  window.localStorage.clear();
});

describe('readProjects canonical order', () => {
  it('prefers IDB over localStorage', async () => {
    memory.set(PROJECTS_KEY, [project('idb-1', 'IDB Only')]);
    window.localStorage.setItem(PROJECTS_KEY, JSON.stringify([project('ls-1', 'LS Only')]));
    const projects = await readProjects();
    expect(projects.map(p => p.id)).toEqual(['idb-1']);
  });

  it('falls back to localStorage when IDB is empty', async () => {
    window.localStorage.setItem(PROJECTS_KEY, JSON.stringify([project('ls-1', 'LS Only')]));
    const projects = await readProjects();
    expect(projects.map(p => p.id)).toEqual(['ls-1']);
  });

  it('migrates projects missing gauge/sections fields', async () => {
    memory.set(PROJECTS_KEY, [{ id: 'p1', name: 'Bare', sections: undefined }]);
    const projects = await readProjects();
    expect(projects[0].gauge).toBeDefined();
    expect(projects[0].sections).toEqual([]);
  });
});

describe('writeProjects dual-store', () => {
  it('writes to both IDB and localStorage', async () => {
    const p = [project('p1', 'Dual')];
    await writeProjects(p);
    // IDB stores the object directly (not JSON-stringified); localStorage
    // stores a JSON string. Both must carry the same project.
    expect((memory.get(PROJECTS_KEY) as PatternProject[])[0].name).toBe('Dual');
    expect(JSON.parse(window.localStorage.getItem(PROJECTS_KEY)!)[0].name).toBe('Dual');
  });
});

describe('exportSnapshot', () => {
  it('exports from live stores, not stale sources', async () => {
    await writeProjects([project('p1', 'Live')]);
    const records = addSample(EMPTY_OPERATIONAL_RECORDS('p1'), { name: 'Sample', status: 'in-studio', location: 'Studio', notes: '' });
    projectStorage('operations', 'p1').write(records);
    const snap = await exportSnapshot();
    expect(snap.projects[0].name).toBe('Live');
    expect(snap.settings).toEqual({});
    expect(snap.operationalRecords.p1.samples[0].name).toBe('Sample');
  });
});

describe('inspectSnapshot', () => {
  it('summarizes project-wide contents without mutating storage', () => {
    const records = addSample(EMPTY_OPERATIONAL_RECORDS('p1'), { name: 'Sample', status: 'in-studio', location: '', notes: '' });
    expect(inspectSnapshot({ projects: [project('p1', 'One')], settings: { theme: 'dark' }, operationalRecords: { p1: records } })).toEqual({ projectCount: 1, operationalProjectCount: 1, operationalRecordCount: 1, hasSettings: true });
  });

  it('rejects malformed operational partitions instead of previewing partial data', () => {
    expect(inspectSnapshot({ projects: [project('p1', 'One')], operationalRecords: { p1: { version: 1, projectId: 'other', samples: [], testKnits: [], submissions: [], wholesaleOrders: [] } } })).toBeNull();
    expect(inspectSnapshot({ random: true })).toBeNull();
  });
});

describe('importSnapshot merge semantics', () => {
  it('never overwrites an existing project id (merge mode)', async () => {
    await writeProjects([project('existing-1', 'Keep Me')]);
    const result = await importSnapshot({
      projects: [project('existing-1', 'Overwrite Me'), project('new-1', 'New')],
    });
    // The new id lands; the colliding incoming entry is skipped, and the
    // pre-existing project is preserved (existingKept counts it).
    expect(result.imported).toBe(1);
    expect(result.existingKept).toBe(1);
    const after = await readProjects();
    expect(after.find(p => p.id === 'existing-1')?.name).toBe('Keep Me');
    expect(after.find(p => p.id === 'new-1')?.name).toBe('New');
  });

  it('replace mode installs the file as-is', async () => {
    await writeProjects([project('existing-1', 'Gone')]);
    await importSnapshot({ projects: [project('file-1', 'File')] }, { mode: 'replace' });
    const after = await readProjects();
    expect(after.map(p => p.id)).toEqual(['file-1']);
  });

  it('merges settings additively', async () => {
    await idbKeyval.set(SETTINGS_KEY, { unit: 'in', theme: 'light' });
    await importSnapshot({ projects: [], settings: { theme: 'dark', pdfDefaults: { a: 1 } } });
    const settings = (await idbKeyval.get(SETTINGS_KEY)) as Record<string, unknown>;
    expect(settings.unit).toBe('in');
    expect(settings.theme).toBe('dark');
  });

  it('restores operational records only for newly landed projects in merge mode', async () => {
    await writeProjects([project('existing-1', 'Keep')]);
    const existingRecords = addSample(EMPTY_OPERATIONAL_RECORDS('existing-1'), { name: 'Current', status: 'in-studio', location: '', notes: '' });
    projectStorage('operations', 'existing-1').write(existingRecords);
    const incomingRecords = addSample(EMPTY_OPERATIONAL_RECORDS('existing-1'), { name: 'Incoming collision', status: 'sold', location: '', notes: '' });
    const newRecords = addSample(EMPTY_OPERATIONAL_RECORDS('new-1'), { name: 'New backup', status: 'planned', location: '', notes: '' });
    await importSnapshot({ projects: [project('existing-1', 'Incoming'), project('new-1', 'New')], operationalRecords: { 'existing-1': incomingRecords, 'new-1': newRecords } });
    expect(projectStorage('operations', 'existing-1').read()?.samples[0].name).toBe('Current');
    expect(projectStorage('operations', 'new-1').read()?.samples[0].name).toBe('New backup');
  });

  it('restores incoming operational records and removes orphaned keys in replace mode', async () => {
    await writeProjects([project('old-1', 'Old')]);
    projectStorage('operations', 'old-1').write(addSample(EMPTY_OPERATIONAL_RECORDS('old-1'), { name: 'Orphan', status: 'missing', location: '', notes: '' }));
    const incoming = addSample(EMPTY_OPERATIONAL_RECORDS('new-1'), { name: 'Restored', status: 'complete', location: '', notes: '' });
    await importSnapshot({ projects: [project('new-1', 'New')], operationalRecords: { 'new-1': incoming } }, { mode: 'replace' });
    expect(projectStorage('operations', 'old-1').read()).toBeNull();
    expect(projectStorage('operations', 'new-1').read()?.samples[0].name).toBe('Restored');
  });

  it('records the backup event in the ledger', async () => {
    await importSnapshot({ projects: [project('p1', 'One')] });
    const ledger = readBackupLedger();
    expect(ledger.length).toBe(1);
    // projectCount in the ledger records how many projects were imported in
    // this event — exactly the one entry that landed in the store.
    expect(ledger[0].projectCount).toBe(1);
  });
});

describe('auditStores', () => {
  it('reports in-sync state when stores match', async () => {
    await writeProjects([project('p1', 'Synced')]);
    const report = await auditStores();
    expect(report.inSync).toBe(true);
    expect(report.idbProjectCount).toBe(1);
    expect(report.localStorageProjectCount).toBe(1);
  });

  it('detects out-of-sync stores', async () => {
    memory.set(PROJECTS_KEY, [project('p1', 'IDB')]);
    window.localStorage.setItem(PROJECTS_KEY, JSON.stringify([project('p2', 'LS')]));
    const report = await auditStores();
    expect(report.inSync).toBe(false);
  });

  it('reports bytes and days-since-backup', async () => {
    await writeProjects([project('p1', 'Audited')]);
    recordBackupEvent(1024, 1);
    const report = await auditStores();
    expect(report.idbBytes).toBeGreaterThan(0);
    expect(report.localStorageBytes).toBeGreaterThan(0);
    expect(report.daysSinceBackup).toBe(0);
    expect(report.lastExportedAt).toBeTruthy();
  });
});

describe('reconcileStores', () => {
  it('makes both stores hold the canonical snapshot', async () => {
    memory.set(PROJECTS_KEY, [project('p1', 'IDB Wins')]);
    window.localStorage.setItem(PROJECTS_KEY, JSON.stringify([project('p2', 'LS Stale')]));
    await reconcileStores();
    const report = await auditStores();
    expect(report.inSync).toBe(true);
    const projects = await readProjects();
    expect(projects.map(p => p.name)).toEqual(['IDB Wins']);
  });
});

describe('projectStorage project-scoped seam (issue #4, S018/S042/S045/S049)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('enforces the scoped key shape stitch-and-scale-{prefix}-{projectId}', () => {
    const h = projectStorage('submitpipe', 'proj-A');
    expect(h.scopedKey).toBe('stitch-and-scale-submitpipe-proj-A');
    h.write({ seats: 3 });
    expect(JSON.parse(window.localStorage.getItem('stitch-and-scale-submitpipe-proj-A')!)).toEqual({ seats: 3 });
  });

  it('scopes state by project: two projects never share a value', () => {
    const a = projectStorage('submitpipe', 'proj-A');
    const b = projectStorage('submitpipe', 'proj-B');
    a.write({ seats: 3 });
    expect(a.read()).toEqual({ seats: 3 });
    expect(b.read()).toBeNull();
    b.write({ seats: 7 });
    expect(a.read()).toEqual({ seats: 3 });
    expect(b.read()).toEqual({ seats: 7 });
  });

  it('migrates a legacy flat key into the scoped key (reads-once)', () => {
    window.localStorage.setItem('snsp-v1', JSON.stringify({ queue: ['old'] }));
    const h = projectStorage('submitpipe', 'proj-A', ['snsp-v1']);
    expect(h.read()).toEqual({ queue: ['old'] });
    // Legacy key is consumed: gone from storage, data now under the scoped key.
    expect(window.localStorage.getItem('snsp-v1')).toBeNull();
    expect(h.scopedKey).not.toBe('snsp-v1');
  });

  it('prefers the scoped key when both legacy and scoped hold data', () => {
    window.localStorage.setItem('snsp-v1', JSON.stringify({ queue: ['legacy-stale'] }));
    const scopedKey = 'stitch-and-scale-submitpipe-proj-A';
    window.localStorage.setItem(scopedKey, JSON.stringify({ queue: ['scoped-newer'] }));
    const h = projectStorage('submitpipe', 'proj-A', ['snsp-v1']);
    expect(h.read()).toEqual({ queue: ['scoped-newer'] });
    expect(window.localStorage.getItem('snsp-v1')).toBeNull(); // stale legacy dropped
  });

  it('skips migration gracefully when no legacy data exists', () => {
    const h = projectStorage('kalroi', 'proj-A', ['kskroi-v1']);
    expect(h.read()).toBeNull();
    expect(window.localStorage.getItem('kskroi-v1')).toBeNull();
  });

  it('tolerates a corrupt legacy key without throwing', () => {
    window.localStorage.setItem('kskroi-v1', 'not-json{');
    const h = projectStorage('kalroi', 'proj-A', ['kskroi-v1']);
    expect(h.read()).toBeNull(); // unreadable legacy is ignored
    expect(window.localStorage.getItem('kskroi-v1')).toBe('not-json{'); // left alone
  });

  it('never migrates a legacy key into itself', () => {
    const h = projectStorage('kalroi', 'stitch-and-scale-kalroi-evil');
    window.localStorage.setItem('stitch-and-scale-kalroi-evil', JSON.stringify({ n: 1 }));
    // No legacyKeys given, so migration never runs; read still works via scoped key.
    expect(h.read()).toEqual({ n: 1 });
  });

  it('migrates only this project\'s partition from a partitioned legacy blob', () => {
    window.localStorage.setItem(
      'stitch-and-scale-trunk-show',
      JSON.stringify({
        'proj-A': { trunk: { visitorsPerDay: 20 }, licensePrices: { '1': 45 } },
        'proj-B': { trunk: { visitorsPerDay: 99 } }, // other project's state — must NOT leak
      }),
    );
    const h = projectStorage<Record<string, unknown>>('trunkshow', 'proj-A', ['stitch-and-scale-trunk-show'], { partition: true });
    expect(h.read()).toEqual({ trunk: { visitorsPerDay: 20 }, licensePrices: { '1': 45 } });
    expect(window.localStorage.getItem('stitch-and-scale-trunk-show')).toBeNull(); // flat blob consumed
    // proj-B's data is discarded, never folded into proj-A's scoped key.
    const scoped = window.localStorage.getItem(h.scopedKey);
    expect(scoped).not.toContain('proj-B');
    expect(JSON.parse(scoped as string).trunk.visitorsPerDay).toBe(20);
  });

  it('starts empty when the partitioned legacy blob has no entry for this project', () => {
    window.localStorage.setItem(
      'stitch-and-scale-trunk-show',
      JSON.stringify({ 'proj-B': { trunk: { visitorsPerDay: 99 } } }),
    );
    const h = projectStorage<Record<string, unknown>>('trunkshow', 'proj-A', ['stitch-and-scale-trunk-show'], { partition: true });
    expect(h.read()).toEqual({});
    expect(window.localStorage.getItem('stitch-and-scale-trunk-show')).toBeNull(); // consumed anyway
  });

  it('tolerates a corrupt partitioned legacy blob without throwing', () => {
    window.localStorage.setItem('stitch-and-scale-trunk-show', 'not-json{');
    const h = projectStorage<Record<string, unknown>>('trunkshow', 'proj-A', ['stitch-and-scale-trunk-show'], { partition: true });
    expect(h.read()).toBeNull();
    expect(window.localStorage.getItem('stitch-and-scale-trunk-show')).toBe('not-json{');
  });

  it('covers every legacy flat key listed by the review ledger', () => {
    // Guard: when any of these keys is passed to projectStorage for a real
    // projectId, its name must differ from the produced scoped key — and the
    // migration must fold its value over. This documents the invariant the
    // sweep enforces (issue #4): no tab may keep a bare global key.
    const legacyKeys = [
      'snsp-v1', 'kskroi-v1', 'kskchannels-v1', 'rtpl-v1', 'promo-v1',
      'mspl-v1', 'prcw-v1', 'pslc-v1', 'kskhirevsself-v1', 'kskwsb-v1',
      'kskclubrev-v1', 'sncis-v1', 'pmix-v1', 'stitch-and-scale-testknit',
    ];
    for (const legacy of legacyKeys) {
      window.localStorage.clear();
      window.localStorage.setItem(legacy, JSON.stringify({ migrated: legacy }));
      const h = projectStorage(legacy.replace(/-v1|-.+$/, ''), 'proj-99', [legacy]);
      expect(h.scopedKey).not.toBe(legacy);
      expect(h.read()).toEqual({ migrated: legacy });
      expect(window.localStorage.getItem(legacy)).toBeNull();
    }
  });
});
