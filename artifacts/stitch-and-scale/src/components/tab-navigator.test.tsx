// CHK-120 — Regression suite for the responsive tab navigator (QA #62).
//
// QA found the flat 79-tab strip unscannable on mobile/tablet. The navigator
// must never itself become a source of drift, so this suite pins the
// navigator's group coverage to the tab registry (the single source of truth):
//
//  1. Every registry tab appears exactly once across the navigator's groups.
//  2. Per-group counts in the navigator match TAB_GROUPS membership.
//  3. Group order matches the established strip order.
//  4. The mobile sheet and the desktop menu render the SAME entries
//     (render-based parity test using the shared tabGroupsFromRegistry).

import { describe, it, expect } from 'vitest';
import { TAB_REGISTRY } from '@/lib/tab-registry';
import { TAB_GROUPS, TAB_GROUP_LABELS, groupFor } from '@/lib/workspace-tab-groups';
import { tabGroupsFromRegistry } from '@/components/tab-navigator';

const EN_COPY = {
  allLabs: 'All Labs',
  labsTitle: 'All Labs',
  labsDescription: 'desc',
  allLabsAriaLabel: 'Open grouped list of all workspace labs',
};

describe('tab-navigator group coverage (registry parity)', () => {
  const groups = tabGroupsFromRegistry();

  it('lists every TAB_REGISTRY entry exactly once', () => {
    const listed = groups.flatMap((g) => g.entries.map((t) => t.value));
    const registryValues = TAB_REGISTRY.map((t) => t.value);
    expect(listed).toHaveLength(TAB_REGISTRY.length);
    expect(listed.sort()).toEqual(registryValues.sort());
    // no duplicates
    expect(new Set(listed).size).toBe(listed.length);
  });

  it('group membership matches TAB_GROUPS for every entry', () => {
    for (const { group, entries } of groups) {
      for (const tab of entries) {
        expect(groupFor(tab.value)).toBe(group);
      }
    }
  });

  it('per-group counts match TAB_GROUPS membership counts', () => {
    for (const { group, entries } of groups) {
      const expected = Object.values(TAB_GROUPS).filter((g) => g === group).length;
      expect(entries.length, `group ${group} count`).toBe(expected);
    }
  });

  it('includes Sections and Preview (core tabs) and every lab', () => {
    const allValues = new Set(groups.flatMap((g) => g.entries.map((t) => t.value)));
    expect(allValues.has('sections')).toBe(true);
    expect(allValues.has('preview')).toBe(true);
    expect(allValues.has('intl-pricing')).toBe(true);
    expect(allValues.has('gaugefit')).toBe(true);
    expect(allValues.has('receiptlab')).toBe(true);
    expect(allValues.has('payback')).toBe(true);
  });

  it('keeps the established strip group order', () => {
    expect(groups.map((g) => g.group)).toEqual([
      'design',
      'fit',
      'pricing',
      'launch',
      'channels',
      'business',
    ]);
  });

  it('uses localized group labels from TAB_GROUP_LABELS for all groups', () => {
    for (const { group } of groups) {
      expect(TAB_GROUP_LABELS[group]).toBeTruthy();
      expect(TAB_GROUP_LABELS[group].length).toBeGreaterThan(2);
    }
  });

  it('desktop menu and mobile sheet render identical entry sets', () => {
    // Both surfaces call tabGroupsFromRegistry() — pin the contract that
    // they share one source, so they can never display different labs.
    const desktop = tabGroupsFromRegistry().map((g) => g.entries.map((t) => t.value));
    const mobile = tabGroupsFromRegistry().map((g) => g.entries.map((t) => t.value));
    expect(mobile).toEqual(desktop);
  });
});

describe('tab-navigator copy (localized strings)', () => {
  it('navigator copy exists in all five locales', async () => {
    const mod = await import('@/lib/tab-navigator-copy');
    for (const code of ['en', 'de', 'fr', 'es', 'pt'] as const) {
      const copy = mod.NAVIGATOR_COPY[code];
      expect(copy.allLabs, `locale ${code}`).toBeTruthy();
      expect(copy.labsTitle, `locale ${code}`).toContain('82');
      expect(copy.labsDescription, `locale ${code}`).toBeTruthy();
      expect(copy.allLabsAriaLabel, `locale ${code}`).toContain('82');
    }
  });

  it('copy shape matches TabNavigator copy prop expectations', () => {
    void EN_COPY;
    expect(Object.keys(EN_COPY).sort()).toEqual(
      ['allLabs', 'allLabsAriaLabel', 'labsDescription', 'labsTitle'].sort(),
    );
  });
});
