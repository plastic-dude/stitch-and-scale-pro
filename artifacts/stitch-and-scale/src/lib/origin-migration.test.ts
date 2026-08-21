// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as idbKeyval from 'idb-keyval';

const memory = new Map<string, unknown>();
vi.mock('idb-keyval', () => ({
  get: vi.fn(async (key: string) => memory.get(key)),
  set: vi.fn(async (key: string, value: unknown) => { memory.set(key, value); }),
  keys: vi.fn(async () => Array.from(memory.keys())),
}));

import { writeProjects, PROJECTS_KEY } from './storage-lib';
import type { PatternProject } from './grading-engine';
import {
  MAX_MIGRATION_ENTRY_BYTES,
  createOriginMigrationPackage,
  restoreOriginMigrationPackage,
  validateOriginMigrationPackage,
} from './origin-migration';

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

describe('origin migration package', () => {
  it('captures canonical projects/settings and portable auxiliary state', async () => {
    await writeProjects([project('p1', 'One')]);
    await idbKeyval.set('stitch-and-scale-settings-v1', { language: 'fr' });
    window.localStorage.setItem('stitch-and-scale-submitpipe-p1', JSON.stringify({ seats: 4 }));
    window.localStorage.setItem('stitch-and-scale-session-flag', 'crashed');
    window.localStorage.setItem('hide-storage-warning', 'true');
    window.localStorage.setItem('stitch-and-scale-early-access-queue-v1', '["designer@example.com"]');
    window.localStorage.setItem('other-app-token', 'must-not-cross-origin');

    const migration = await createOriginMigrationPackage();
    expect(migration.format).toBe('stitch-and-scale-origin-migration');
    expect(migration.snapshot.projects).toHaveLength(1);
    expect(migration.snapshot.settings).toEqual({ language: 'fr' });
    expect(migration.localStorage).toContainEqual({
      key: 'stitch-and-scale-submitpipe-p1', value: JSON.stringify({ seats: 4 }),
    });
    expect(migration.localStorage.some((entry) => entry.key === 'stitch-and-scale-session-flag')).toBe(false);
    expect(migration.localStorage.some((entry) => entry.key === 'hide-storage-warning')).toBe(false);
    expect(migration.localStorage.some((entry) => entry.key === 'stitch-and-scale-early-access-queue-v1')).toBe(false);
    expect(migration.localStorage.some((entry) => entry.key === 'other-app-token')).toBe(false);
  });

  it('restores projects through merge semantics and never overwrites current auxiliary state', async () => {
    await writeProjects([project('existing', 'Current')]);
    window.localStorage.setItem('stitch-and-scale-submitpipe-existing', 'current');
    const migration = {
      format: 'stitch-and-scale-origin-migration', version: 1, exportedAt: '2026-08-21T00:00:00Z',
      sourceOrigin: 'https://old.example',
      snapshot: { projects: [project('existing', 'Old'), project('new', 'New')], settings: {} },
      localStorage: [
        { key: 'stitch-and-scale-submitpipe-existing', value: 'old' },
        { key: 'stitch-and-scale-submitpipe-new', value: JSON.stringify({ seats: 8 }) },
        { key: 'stitch-and-scale-session-flag', value: 'do-not-import' },
      ],
    } as const;

    const result = await restoreOriginMigrationPackage(migration);
    expect(result.imported).toBe(1);
    expect(result.existingKept).toBe(1);
    expect(result.auxiliaryImported).toBe(1);
    expect(window.localStorage.getItem('stitch-and-scale-submitpipe-existing')).toBe('current');
    expect(window.localStorage.getItem('stitch-and-scale-submitpipe-new')).toContain('seats');
    expect(window.localStorage.getItem('stitch-and-scale-session-flag')).toBeNull();
  });

  it('rejects malformed projects instead of importing a partial destructive file', () => {
    const result = validateOriginMigrationPackage({
      format: 'stitch-and-scale-origin-migration', version: 1, exportedAt: '2026-08-21T00:00:00Z',
      sourceOrigin: null, snapshot: { projects: [{ id: 'p1' }], settings: {} }, localStorage: [],
    });
    expect(result.ok).toBe(false);
  });

  it('rejects malformed human-review records instead of importing unsafe project data', () => {
    const base = project('review', 'Review Project');
    const malformed = {
      ...base,
      humanReview: {
        status: 'approved',
        reviewerName: 'Editor',
        note: { toString: () => 'hostile' },
        reviewedAt: '2026-08-21T00:00:00Z',
      },
    };
    const result = validateOriginMigrationPackage({
      format: 'stitch-and-scale-origin-migration', version: 1, exportedAt: '2026-08-21T00:00:00Z',
      sourceOrigin: null, snapshot: { projects: [malformed], settings: {} }, localStorage: [],
    });
    expect(result.ok).toBe(false);
  });

  it('preserves a valid human-review record through migration validation', () => {
    const reviewed = {
      ...project('review', 'Review Project'),
      humanReview: {
        status: 'approved' as const,
        reviewerName: 'Editor',
        note: 'Checked clarity and finishing.',
        reviewedAt: '2026-08-21T00:00:00Z',
      },
    };
    const result = validateOriginMigrationPackage({
      format: 'stitch-and-scale-origin-migration', version: 1, exportedAt: '2026-08-21T00:00:00Z',
      sourceOrigin: null, snapshot: { projects: [reviewed], settings: {} }, localStorage: [],
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.snapshot.projects[0].humanReview?.status).toBe('approved');
  });

  it('skips oversized and non-portable auxiliary entries with warnings', () => {
    const result = validateOriginMigrationPackage({
      format: 'stitch-and-scale-origin-migration', version: 1, exportedAt: '2026-08-21T00:00:00Z',
      sourceOrigin: null, snapshot: { projects: [], settings: {} },
      localStorage: [
        { key: 'stitch-and-scale-session-flag', value: 'bad' },
        { key: 'stitch-and-scale-big', value: 'x'.repeat(MAX_MIGRATION_ENTRY_BYTES + 1) },
        { key: 'stitch-and-scale-early-access-queue-v1', value: '["designer@example.com"]' },
        { key: 'other-app-token', value: 'must-not-cross-origin' },
        { key: 'stitch-and-scale-safe', value: 'ok' },
      ],
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.localStorage).toEqual([{ key: 'stitch-and-scale-safe', value: 'ok' }]);
      expect(result.warnings.length).toBe(4);
    }
  });
});
