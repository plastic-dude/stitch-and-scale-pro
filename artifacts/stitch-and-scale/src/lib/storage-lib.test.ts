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
  readProjects, writeProjects, exportSnapshot, importSnapshot,
  auditStores, reconcileStores, recordBackupEvent, readBackupLedger,
  PROJECTS_KEY, SETTINGS_KEY, BACKUPS_KEY,
} from './storage-lib';
import { PatternProject } from './grading-engine';

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
    const snap = await exportSnapshot();
    expect(snap.projects[0].name).toBe('Live');
    expect(snap.settings).toEqual({});
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
