import { describe, it, expect, vi } from 'vitest';
import { generateId } from './lib/grading-engine';
import { TAB_REGISTRY } from './lib/tab-registry';
import { TAB_GROUPS } from './lib/workspace-tab-groups';

describe('Revision Snapshots Contract', () => {
  it('should have snapshots in the tab registry', () => {
    const snapshotsEntry = TAB_REGISTRY.find(t => t.value === 'snapshots');
    expect(snapshotsEntry).toBeDefined();
    expect(snapshotsEntry?.group).toBe('design');
    expect(snapshotsEntry?.icon).toBe('History');
  });

  it('should have snapshots in TAB_GROUPS', () => {
    expect(TAB_GROUPS['snapshots']).toBe('design');
  });

  it('should enforce registry integrity (parity with TAB_GROUPS)', () => {
    // Registry now has 80 items (79 + snapshots)
    expect(TAB_REGISTRY.length).toBe(80);
    expect(Object.keys(TAB_GROUPS).length).toBe(80);
    
    const registryValues = TAB_REGISTRY.map(t => t.value);
    const groupKeys = Object.keys(TAB_GROUPS);
    
    groupKeys.forEach(key => {
      expect(registryValues).toContain(key);
    });
  });
});
