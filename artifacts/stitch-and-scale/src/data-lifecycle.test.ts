/** @vitest-environment happy-dom */
import { describe, it, expect, vi } from 'vitest';

vi.mock('idb-keyval', () => ({
  get: vi.fn(),
  set: vi.fn(),
  clear: vi.fn(),
  keys: vi.fn(),
}));

import { wipeProjects, wipeAllData, PROJECTS_KEY, SETTINGS_KEY } from './lib/storage-lib';
import { validateOriginMigrationPackage } from './lib/origin-migration';

describe('Data Lifecycle Controls', () => {
  describe('storage-lib wipe primitives', () => {
    it('wipeProjects should clear projects but leave settings', async () => {
      localStorage.setItem(PROJECTS_KEY, JSON.stringify([{ id: 'p1' }]));
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ theme: 'dark' }));
      
      await wipeProjects();
      
      expect(JSON.parse(localStorage.getItem(PROJECTS_KEY) || 'null')).toEqual([]);
      expect(JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null')).toEqual({ theme: 'dark' });
    });

    it('wipeAllData should clear all app-owned keys', async () => {
      localStorage.setItem(PROJECTS_KEY, JSON.stringify([{ id: 'p1' }]));
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ theme: 'dark' }));
      localStorage.setItem('stitch-and-scale-lab-state', 'true');
      localStorage.setItem('other-app-key', 'keep');
      
      await wipeAllData();
      
      expect(localStorage.getItem(PROJECTS_KEY)).toBeNull();
      expect(localStorage.getItem(SETTINGS_KEY)).toBeNull();
      expect(localStorage.getItem('stitch-and-scale-lab-state')).toBeNull();
      expect(localStorage.getItem('other-app-key')).toBe('keep');
    });
  });

  describe('origin-migration validation', () => {
    it('should validate legacy snapshot format', () => {
      const legacy = {
        projects: [{ id: 'p1', name: 'Test', sections: [] }],
        settings: { theme: 'light' }
      };
      
      const result = validateOriginMigrationPackage(legacy);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.snapshot.projects).toHaveLength(1);
        expect(result.value.snapshot.settings.theme).toBe('light');
      }
    });

    it('should reject malformed projects', () => {
      const malformed = {
        format: 'stitch-and-scale-origin-migration',
        version: 1,
        exportedAt: new Date().toISOString(),
        snapshot: {
          projects: [{ id: '', name: 'Missing ID' }],
          settings: {}
        },
        localStorage: []
      };
      
      const result = validateOriginMigrationPackage(malformed);
      expect(result.ok).toBe(false);
    });
  });
});
