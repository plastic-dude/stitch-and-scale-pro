import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

/**
 * CHK-124 regression suite — Grading Print Sheet print-contrast contract.
 *
 * The print surface must never render faint/low-contrast text in @media print.
 * Rather than depend on a fragile runtime render, these structural tests pin
 * the exact invariants that guarantee it, in the project's established
 * fs-based structural-test convention.
 *
 * Invariant 1: the sheet root carries a stable id so print overrides can be
 *              scoped above Tailwind v4's print: utility cascade.
 * Invariant 2: a scoped print stylesheet forces white background + black text
 *              on every descendant (id selector + !important outranks any
 *              print: utility).
 * Invariant 3: the Print Sheet button is excluded from print output.
 */

const GRADING_PAGE = join(__dirname, "pages", "project-grading.tsx");
const SRC = readFileSync(GRADING_PAGE, "utf8");

// Normalize the JSX template-literal escape so selector text is inspectable
const srcForSelectors = SRC.replace(/\\\\/g, "\\");

describe("Grading Print Sheet print-contrast contract", () => {
  it("sheets the printable region under a stable id (#sas-print-sheet) on the page root", () => {
    const match = SRC.match(/<div[^>]*id="sas-print-sheet"[^>]*>/);
    expect(match, "page root must carry id=\"sas-print-sheet\"").not.toBeNull();
    // the id must be on the outermost page container, not a deep descendant:
    // anchor on the main render path (after `const { project }`),
    // not the "Project Not Found" fallback branch in the same file.
    // The id sits inside the root container's own opening tag, so the first
    // `<div` on the main path must itself carry the id.
    const mainReturnIdx = SRC.indexOf("const { project");
    const mainChunk = SRC.slice(mainReturnIdx);
    const firstDiv = mainChunk.indexOf("<div");
    const firstDivTag = mainChunk.slice(firstDiv, mainChunk.indexOf(">", firstDiv) + 1);
    expect(firstDivTag, "the first <div on the main render path must be the print sheet root").toContain('id="sas-print-sheet"');
  });

  it("forces black-on-white across the whole sheet in @media print (scoped, !important)", () => {
    const printBlock = SRC.match(/@media print \{[\s\S]*?\n      `\}\} \/>/);
    expect(printBlock, "inline @media print style block must exist").not.toBeNull();
    const block = printBlock![0];
    expect(block).toContain("#sas-print-sheet, #sas-print-sheet *");
    expect(block).toContain("background: white !important");
    expect(block).toContain("color: black !important");
    expect(block).toContain("border-color: #d1d5db !important");
    expect(block).toContain("box-shadow: none !important");
  });

  it("keeps the base-size header badge legible in print (black bg, white text)", () => {
    const block = srcForSelectors.match(/@media print \{[\s\S]*?\n      `\}\} \/>/)?.[0] ?? "";
    expect(block).toContain("th.print\\3a bg-black");
    expect(block).toContain("background: #000 !important");
    expect(block).toContain("color: #fff !important");
  });

  it("excludes the Print Sheet button from print output", () => {
    const block = SRC.match(/@media print \{[\s\S]*?\n      `\}\} \/>/)?.[0] ?? "";
    expect(block).toContain('[data-testid="button-print"]');
    expect(block).toContain("display: none");
  });

  it("keeps the standard print hygiene: landscape page, app shell hidden, break avoidance", () => {
    const block = SRC.match(/@media print \{[\s\S]*?\n      `\}\} \/>/)?.[0] ?? "";
    expect(block).toContain("@page { size: landscape");
    expect(block).toContain("header, nav, footer { display: none !important; }");
    expect(block).toContain("break-inside: avoid");
  });
});
