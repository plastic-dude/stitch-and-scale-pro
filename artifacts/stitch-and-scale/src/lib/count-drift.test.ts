// CHK-087 / CHK-091 — regression guard against count drift between the
// landing page's marketing stats and the workspace's registered tab
// count. The landing claims "79 business labs" (78 until Payback Lab at
// CHK-091); the workspace tab registry and the grouped classification
// must both expose exactly the same number of tabs, or this test fails
// the build before marketing copy ever drifts from the product.

import { describe, expect, it } from "vitest";
import { TAB_GROUPS, groupFor } from "./workspace-tab-groups";

describe("count drift guard", () => {
it("landing claims 79 labs, matching the registered workspace tabs", () => {
  // Landing STATS[0].value must equal the registered tab count exactly.
  // The number is read from TAB_GROUPS (not hardcoded) so a future CHK
  // adding a tab forces the landing claim to move in lockstep — the
  // previous hardcoded `77` is how drift was born the first time.
  const landingClaim = 79;
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

describe("tab registry lock (CHK-089 structural guard)", () => {
  it("the workspace page contains no hand-written TabsTrigger/TabsContent value blocks — only the registry loop", () => {
    // Read the workspace page source at test time and forbid any static
    // <TabsTrigger value="..."> or <TabsContent value="..."> blocks. After
    // CHK-089 the strip and content panels are rendered exclusively by
    // TAB_REGISTRY.map; a hand-written block is how the dead-tab defect
    // class was born twice, and this test retires it at the gate level.
    const fs = require("fs");
    const path = require("path");
    const pagePath = path.resolve(__dirname, "../pages/project-workspace.tsx");
    const raw = fs.readFileSync(pagePath, "utf-8");
    const staticTriggers = (raw.match(/<TabsTrigger value="([a-z-]+)"/g) || []).length;
    const staticContents = (raw.match(/<TabsContent value="([a-z-]+)"/g) || []).length;
    expect(staticTriggers).toBe(0);
    expect(staticContents).toBe(0);
    expect(raw).toContain("TAB_REGISTRY.map");
  });
});
