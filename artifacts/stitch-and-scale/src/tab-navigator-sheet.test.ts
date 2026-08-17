// CHK-130 regression coverage for QA issue #69.
// The mobile All Labs Sheet must close after a lab is selected; otherwise its
// modal overlay remains mounted and blocks the newly selected lab panel.
// Structural tests follow the project's fs-based convention.

import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";

const source = fs.readFileSync(
  path.resolve(__dirname, "components/tab-navigator.tsx"),
  "utf-8",
);

describe("CHK-130 — mobile All Labs selection closes the Sheet", () => {
  it("uses a controlled Sheet open state with an onOpenChange handler", () => {
    expect(source).toMatch(/const \[isSheetOpen, setIsSheetOpen\] = React\.useState\(false\)/);
    expect(source).toMatch(/<Sheet open=\{isSheetOpen\} onOpenChange=\{setIsSheetOpen\}>/);
  });

  it("closes the Sheet after forwarding the selected tab value", () => {
    const pickStart = source.indexOf("const handlePick = (value: string) => {");
    const pickEnd = source.indexOf("\n  };", pickStart);
    expect(pickStart, "handlePick must exist").toBeGreaterThan(-1);
    expect(pickEnd, "handlePick must close").toBeGreaterThan(pickStart);
    const handler = source.slice(pickStart, pickEnd);
    expect(handler).toContain("onTabChange(value)");
    expect(handler).toContain("setIsSheetOpen(false)");
    expect(handler.indexOf("onTabChange(value)")).toBeLessThan(handler.indexOf("setIsSheetOpen(false)"));
  });

  it("keeps every mobile registry entry wired to the shared selection handler", () => {
    expect(source).toContain("onClick={() => handlePick(tab.value)}");
    expect(source).toContain("entries.map((tab)");
  });
});

// Keep the file a valid module under strict TypeScript settings.
export {};

