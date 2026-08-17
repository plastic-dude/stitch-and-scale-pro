// CHK-125 regression — flat workspace tab strip must remain discoverable.
//
// User report (2026-08-17): "I also can't find the multiple different tabs we
// used to have in this newest version of the project".
//
// Root cause: the mobile/tablet group-chip row (introduced in CHK-120) had no
// `lg:hidden` guard and rendered at ALL widths, sitting directly above the
// flat 79-tab strip on desktop. The chips' group labels ("Design & Muster ·
// 12") read like "the tabs", so users skimming the page concluded the
// individual tabs had vanished.
//
// This suite pins the responsive contract that guarantees every tab stays
// reachable:
//
//  1. The workspace group-chip row hides on desktop (lg+) — the chips are the
//     mobile/tablet substitute for the flat strip and must never compete
//     with it where the strip renders.
//  2. The flat strip (TabsList) is the desktop surface: hidden below 1024px,
//     rendered at lg+.
//  3. The grouped navigator (sheet trigger) hides on desktop — the desktop
//     "All Labs" dropdown lives in tab-navigator.tsx.
//  4. Chip row + strip + navigator all live inside the same Tabs block, so
//     chips always select a real strip tab.
//
// Structural tests — fs-based source inspection, no DOM environment, matching
// the project's headless convention.

import { describe, expect, it } from "vitest";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), "utf-8");
}

describe("CHK-125 — workspace tab strip discoverability contract", () => {
  it("group-chip row hides on desktop (lg+) so it never competes with the flat strip", () => {
    const source = read("src/pages/project-workspace.tsx");
    const chipRow = source.match(/<div[^>]*flex flex-wrap gap-1 mb-1\.5 px-0\.5[^>]*>/);
    expect(chipRow, "group-chip row must exist").not.toBeNull();
    const cls = chipRow![0];
    expect(cls.includes("lg:hidden"), "chip row must carry lg:hidden: " + cls).toBe(true);
  });

  it("group-chip row stays visible below lg (it is the small-viewport substitute)", () => {
    const source = read("src/pages/project-workspace.tsx");
    const chipRow = source.match(/<div[^>]*flex flex-wrap gap-1 mb-1\.5 px-0\.5[^>]*>/)?.[0] ?? "";
    // It must NOT also carry a class that would hide it on mobile:
    expect(chipRow.includes("hidden lg:flex"), "chip row must not be hidden by default: " + chipRow).toBe(false);
  });

  it("flat strip (TabsList) renders at lg+ and hides below 1024px", () => {
    const source = read("src/pages/project-workspace.tsx");
    const list = source.match(/<TabsList[^>]*>/g);
    expect(list, "TabsList must exist").not.toBeNull();
    const cls = list![0];
    expect(cls.includes("hidden lg:flex"), "flat strip must be hidden lg:flex: " + cls).toBe(true);
  });

  it("grouped navigator (sheet/dropdown) hides on desktop", () => {
    const source = read("src/pages/project-workspace.tsx");
    const navWrap = source.match(/<div[^>]*className="lg:hidden mb-2"[^>]*>/);
    expect(navWrap, "navigator wrapper must carry lg:hidden").not.toBeNull();
  });

  it("chip count labels match the registry's real per-group entry counts", () => {
    // Cheap parity check: the workspace page derives chip labels from
    // TAB_GROUPS frequency, but the displayed number must equal the number of
    // registry entries in the group (a drifted count misleads users). The
    // registry is the source of truth (TAB_REGISTRY).
    const ws = read("src/pages/project-workspace.tsx");
    const reg = read("src/lib/tab-registry.ts");
    // Count registry entries per group key
    const counts: Record<string, number> = {};
    const regGroups = reg.match(/group:\s*"([^"]+)"/g) ?? [];
    for (const tok of regGroups) counts[tok.replace('group: "', "").slice(0, -1)] = (counts[tok.replace('group: "', "").slice(0, -1)] ?? 0) + 1;
    // The workspace page must render "· {count}" using a dynamic count derived
    // from the registry (filter length), not a hardcoded literal:
    const chipArea = ws.slice(ws.indexOf('workspace.group.design'));
    const countExpr = chipArea.match(/count\s*=\s*TAB_REGISTRY\.filter/);
    expect(countExpr, "chip count must be computed from TAB_REGISTRY (the strip's source of truth)").not.toBeNull();
    // Sanity: registry groups all exist as workspace.group.* copy keys used in
    // the chip row
    for (const g of Object.keys(counts)) {
      expect(
        ws.includes(`g: '${g}'`) || ws.includes(`g: "${g}"`),
        `chip row must include group '${g}'`,
      ).toBe(true);
    }
    // Expected real counts per group (registry at time of CHK-125)
    const expected = { design: 12, fit: 7, pricing: 15, launch: 13, channels: 10, business: 22 };
    for (const [g, n] of Object.entries(expected)) {
      expect(counts[g], `registry count for group '${g}'`).toBe(n);
    }
  });
});
