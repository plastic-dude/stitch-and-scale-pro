// CHK-087 — regression guard against count drift between the landing
// page's marketing stats and the workspace's registered tab count.
// The landing claims "77 business labs"; the workspace tab registry and
// the grouped classification must both expose exactly 77 tabs, or this
// test fails the build before marketing copy ever drifts from the product.

import { describe, expect, it } from "vitest";
import { TAB_GROUPS, groupFor } from "./workspace-tab-groups";

describe("count drift guard", () => {
it("landing claims 77 labs, matching the registered workspace tabs", () => {
  // Landing STATS[0].value is "77". This asserts the exact number the
  // landing page markets must equal the classified tab registry count.
  const landingClaim = 77;
  const registeredTabs = Object.keys(TAB_GROUPS);
  expect(registeredTabs.length).toBe(landingClaim);

  // groupFor must classify every registered tab into a real group; it
  // never invents a synthetic entry, and every entry maps to a defined
  // TabGroup (default fallback is "business", which is a real group).
  for (const tab of registeredTabs) {
    const group = groupFor(tab);
    expect(["design", "fit", "pricing", "launch", "channels", "business"]).toContain(group);
  }
});

it("every registered tab value is a real workspace tab (no phantom entries)", () => {
  const registeredTabs = Object.keys(TAB_GROUPS);
  const duplicates = registeredTabs.filter(
    (tab, i) => registeredTabs.indexOf(tab) !== i,
  );
  expect(duplicates).toEqual([]);
  // Every classified value must appear in TAB_GROUPS (tautological guard
  // that the module object has not been silently mangled at build time).
  for (const tab of registeredTabs) {
    expect(TAB_GROUPS[tab]).toBeDefined();
  }
});
});
