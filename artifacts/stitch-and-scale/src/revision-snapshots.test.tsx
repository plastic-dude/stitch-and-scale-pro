import { describe, it, expect, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
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
    expect(TAB_REGISTRY.length).toBeGreaterThan(0);
    expect(Object.keys(TAB_GROUPS).length).toBe(TAB_REGISTRY.length);
    
    const registryValues = TAB_REGISTRY.map(t => t.value);
    const groupKeys = Object.keys(TAB_GROUPS);
    
    groupKeys.forEach(key => {
      expect(registryValues).toContain(key);
    });
  });

  it('should be wired correctly in ProjectWorkspace.tsx', () => {
    const workspacePath = path.resolve(__dirname, 'pages/project-workspace.tsx');
    const content = fs.readFileSync(workspacePath, 'utf8');
    
    // Verify lazy import exists
    expect(content).toContain("snapshots: React.lazy(cardLazy(() => import('@/components/project-snapshots-card')))");
    
    // Verify case in TabPanel switch exists and passes correct props
    expect(content).toContain("case 'snapshots':");
    expect(content).toContain("createSnapshot={createSnapshot}");
    expect(content).toContain("restoreSnapshot={restoreSnapshot}");
    expect(content).toContain("deleteSnapshot={deleteSnapshot}");
  });
});
