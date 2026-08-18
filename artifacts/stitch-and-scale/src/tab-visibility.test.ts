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
    // CHK-131: chips moved from a flex-wrap row to a deliberate two-column
    // grid; the responsive contract (lg:hidden, never competing with the flat
    // strip) is unchanged.
    const chipRow = source.match(/<div[^>]*lg:hidden grid grid-cols-2 gap-1\.5 mb-1\.5 px-0\.5[^>]*>/);
    expect(chipRow, "group-chip row must exist").not.toBeNull();
    const cls = chipRow![0];
    expect(cls.includes("lg:hidden"), "chip row must carry lg:hidden: " + cls).toBe(true);
    expect(cls.includes("grid-cols-2"), "chip row must be a two-column grid: " + cls).toBe(true);
  });

  it("group-chip row stays visible below lg (it is the small-viewport substitute)", () => {
    const source = read("src/pages/project-workspace.tsx");
    const chipRow = source.match(/<div[^>]*lg:hidden grid grid-cols-2 gap-1\.5 mb-1\.5 px-0\.5[^>]*>/)?.[0] ?? "";
    // It must NOT also carry a class that would hide it on mobile:
    expect(chipRow.includes("hidden lg:flex"), "chip row must not be hidden by default: " + chipRow).toBe(false);
  });

  it("chip row order is count-descending (densest group leads, CHK-131)", () => {
    // The chips were previously rendered in an accidental fixed order that
    // read like an arbitrary ranking. Pin the deliberate weight-descending
    // order so the densest group always leads the touch list.
    const source = read("src/pages/project-workspace.tsx");
    // The chip block starts at the first 'workspace.group.design' label key
    // and ends at the closing </div> of the chip row (the wrapper itself
    // carries the grid marker, so the anchor for the tail is a fixed token
    // inside the last chip button).
    // The chip block runs from the first group copy key to the chip's
    // "labs" count tag (rendered as "{count} labs" in a template literal).
    const labsAnchor = source.indexOf("} labs</span>");
    const chipArea = source.slice(source.indexOf("workspace.group.design"), labsAnchor);
    expect(
      chipArea.includes(".sort((a, b) => b.count - a.count)"),
      "chip row must sort groups count-descending: " + chipArea.slice(-200),
    ).toBe(true);
    // And the count must be rendered as an explicit "N labs" tag, not a bare
    // suffix that reads like a ranking:
    expect(labsAnchor > -1, "chip count must read as '{n} labs'").toBe(true);
  });

  it("flat strip (TabsList) renders at lg+ and hides below 1024px", () => {
    const source = read("src/pages/project-workspace.tsx");
    const list = source.match(/<TabsList[^>]*>/g);
    expect(list, "TabsList must exist").not.toBeNull();
    // CHK-132 (S277): the desktop-hide utility moved onto the cue-wrapper div
    // ("hidden lg:block relative") holding the right-edge scroll fade; the
    // strip mounts as lg:flex inside it.
    expect(source.includes('className="hidden lg:block relative"'), "strip wrapper must be hidden lg:block relative").toBe(true);
    const cls = list![0];
    expect(cls.includes("lg:flex"), "flat strip must render lg:flex: " + cls).toBe(true);
  });

  it("grouped navigator (sheet/dropdown) hides on desktop", () => {
    const source = read("src/pages/project-workspace.tsx");
    const navWrap = source.match(/<div[^>]*className="lg:hidden mb-2"[^>]*>/);
    expect(navWrap, "navigator wrapper must carry lg:hidden").not.toBeNull();
  });

  it("mobile navigator must NOT be a descendant of the hidden desktop TabsList (QA #64)", () => {
    // QA cycles 60+61: the mobile grouped navigator was nested INSIDE
    // <TabsList className="hidden lg:flex">, so at 360/390/430/768px the
    // entire navigator (including the All Labs 44px sheet trigger) was
    // display:none and late labs were unreachable by touch. CHK-127 moved
    // the navigator OUT of the TabsList; this guard pins that order so the
    // defect class cannot regress silently.
    // Strip JSX block comments first — the CHK-127 comment quotes the old
    // TabsList markup and must not fake a span.
    // CHK-132 (S277): the desktop-hide utility moved onto the cue-wrapper div
    // ("hidden lg:block relative") holding the right-edge scroll fade; the
    // TabsList mounts inside that wrapper. The guard therefore pins: (a) the
    // wrapper exists and contains the navigator-OUTSIDE-strip order, and
    // (b) the navigator wrapper is outside the TabsList span.
    const source = read("src/pages/project-workspace.tsx").replace(/\/\*[\s\S]*?\*\//g, "");
    const listOpen = source.indexOf('<TabsList className="lg:flex lg:flex-nowrap');
    const listClose = source.indexOf("</TabsList>", listOpen);
    const navWrap = source.indexOf('<div className="lg:hidden mb-2">');
    expect(listOpen, "desktop TabsList must exist").toBeGreaterThan(-1);
    expect(listClose, "TabsList must close").toBeGreaterThan(listOpen);
    expect(navWrap, "mobile navigator wrapper must exist").toBeGreaterThan(-1);
    expect(
      navWrap < listOpen || navWrap > listClose,
      "navigator wrapper must be OUTSIDE the flat TabsList: navigator at " +
        navWrap + ", list span [" + listOpen + ", " + listClose + "]",
    ).toBe(true);
    // The cue-wrapper (strip + scroll fade) must still render only at lg+ so
    // the entire strip surface stays hidden below 1024px.
    const cueWrap = source.indexOf('className="hidden lg:block relative"');
    expect(cueWrap, "strip cue-wrapper must be hidden lg:block relative").toBeGreaterThan(-1);
    expect(
      navWrap < cueWrap || navWrap > listClose,
      "mobile navigator must be outside the lg-only strip surface: navigator at " + navWrap + ", wrapper at " + cueWrap,
    ).toBe(true);
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
    // The workspace page must render "{count} labs" using a dynamic count derived
    // from the registry (filter length), not a hardcoded literal. Anchor the
    // chip area between the chip-row wrapper and the 'N labs' tag so the
    // .map(({ g, label }) => ({ ... count: ... })) chain is captured.
    const chipArea = ws.slice(ws.indexOf('lg:hidden grid grid-cols-2 gap-1.5'), ws.indexOf("} labs</span>"));
    const countExpr = chipArea.match(/count:\s*TAB_REGISTRY\.filter/);
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
