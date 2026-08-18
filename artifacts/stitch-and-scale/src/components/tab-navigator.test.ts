import { describe, expect, it } from 'vitest';
import { filterTabGroups, tabGroupsFromRegistry } from './tab-navigator';

describe('tab navigator search', () => {
  it('finds late labs through the shared registry', () => {
    const groups = filterTabGroups(tabGroupsFromRegistry(), 'receipt', (_value, fallback) => fallback);
    const values = groups.flatMap((group) => group.entries.map((entry) => entry.value));
    expect(values).toContain('receiptlab');
    expect(values).not.toContain('gradinglab');
  });

  it('returns no groups for a non-match', () => {
    expect(filterTabGroups(tabGroupsFromRegistry(), 'does-not-exist', (_value, fallback) => fallback)).toEqual([]);
  });

  it('treats an empty query as the full registry', () => {
    const groups = filterTabGroups(tabGroupsFromRegistry(), '', (_value, fallback) => fallback);
    expect(groups.reduce((total, group) => total + group.entries.length, 0)).toBeGreaterThan(70);
  });
});
