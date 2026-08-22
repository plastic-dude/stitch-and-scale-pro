// CHK-089 — registry integrity tests. The single declarative tab registry
// must stay in lockstep with TAB_GROUPS classification, the strip trigger
// set, and the content panel set — or this file fails the build.

import { describe, expect, it } from "vitest";
import { TAB_REGISTRY, assertTabRegistryIntegrity } from "./tab-registry";
import { TAB_GROUPS, GROUP_ORDER } from "./workspace-tab-groups";

describe("tab registry integrity", () => {
  it("runtime assertTabRegistryIntegrity passes without throwing", () => {
    expect(() => assertTabRegistryIntegrity()).not.toThrow();
  });

  it("contains exactly 88 entries matching TAB_GROUPS one-to-one", () => {
    const values = TAB_REGISTRY.map((t) => t.value);
    const keys = Object.keys(TAB_GROUPS);
    expect(values.length).toBe(88);
    expect(values.length).toBe(keys.length);
    const dupes = values.filter((v, i) => values.indexOf(v) !== i);
    expect(dupes).toEqual([]);
    expect(values.sort()).toEqual(keys.sort());
  });

  it("declares the same group classification as TAB_GROUPS for every entry", () => {
    for (const t of TAB_REGISTRY) {
      expect(TAB_GROUPS[t.value]).toBe(t.group);
    }
    // every group value is a real, ordered group
    for (const t of TAB_REGISTRY) {
      expect(GROUP_ORDER).toContain(t.group);
    }
  });

  it("every entry's strip label is non-empty text", () => {
    for (const t of TAB_REGISTRY) {
      expect(t.label.trim().length).toBeGreaterThan(0);
    }
  });
});
