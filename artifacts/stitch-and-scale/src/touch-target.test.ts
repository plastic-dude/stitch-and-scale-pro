// CHK-123 regression — 44×44px touch-target minimum (QA LIVE-004).
//
// QA measured live: group chips (~16px hit area), the desktop tab strip
// triggers (shadcn default h-10 = 40px), dropdown menu items (h-9 = 36px),
// and several lab sub-tabs (h-10 = 40px) were all below the 44px minimum.
//
// This suite pins the class-token invariant that guarantees a ≥44px hit
// area under Tailwind v4 (min-h-11 = 44px, or min-h-[44px]):
//
//  1. Every <TabsTrigger> in the app carries min-h-11 or min-h-[44px].
//  2. Every workspace group chip (the plain <button> chip row in the
//     workspace page) carries the same token.
//  3. The tab-navigator desktop dropdown menu items and mobile sheet
//     trigger carry the token.
//
// Structural tests — they read the actual source files at test time and
// never depend on a DOM environment, matching the project's headless
// convention. A future maintainer who drops the token will fail the gate.

import { describe, expect, it } from "vitest";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), "utf-8");
}

/**
 * Extract className strings from <Tag ... className="..."> declarations,
 * line-tolerant: JSX formatters spread attributes across lines, and a naive
 * lazy regex fails because unrelated `>` characters (inside expressions)
 * truncate the match. Instead, scan line by line and accumulate an opening
 * tag until its final `>` while respecting `{...}` expression nesting.
 */
function extractClassNames(source: string, tag: string): string[] {
  const out: string[] = [];
  const lines = source.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const idx = line.indexOf(`<${tag}`);
    if (idx === -1) continue;
    let depth = 0; // brace nesting inside JSX expression attributes
    let closed = false;
    let attrBlock = line.slice(idx + tag.length + 1);
    if (attrBlock.endsWith(">")) {
      // self-contained on one line, e.g. <TabsTrigger ...>
      const attrs = attrBlock.slice(0, -1);
      const cls = attrs.match(/className="([^"]*)"/);
      if (cls) out.push(cls[1]);
      continue;
    }
    // multiline: accumulate following lines until a top-level `>`
    for (let j = i + 1; j < lines.length; j++) {
      let k = 0;
      while (k < lines[j].length && !closed) {
        const ch = lines[j][k];
        if (ch === "{") depth++;
        else if (ch === "}") depth--;
        else if (ch === ">" && depth <= 0) closed = true;
        k++;
      }
      if (closed) {
        attrBlock += "\n" + lines.slice(i + 1, j + 1).join("\n");
        const cls = attrBlock.match(/className="([^"]*)"/);
        if (cls) out.push(cls[1]);
        break;
      }
    }
  }
  return out;
}

/** Same scan as extractClassNames, but returns the raw attribute blocks. */
function extractAttrBlocks(source: string, tag: string): string[] {
  const out: string[] = [];
  const lines = source.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const idx = line.indexOf(`<${tag}`);
    if (idx === -1) continue;
    let depth = 0;
    let closed = false;
    let attrBlock = line.slice(idx + tag.length + 1);
    if (attrBlock.endsWith(">")) {
      out.push(attrBlock.slice(0, -1));
      continue;
    }
    for (let j = i + 1; j < lines.length; j++) {
      let k = 0;
      while (k < lines[j].length && !closed) {
        const ch = lines[j][k];
        if (ch === "{") depth++;
        else if (ch === "}") depth--;
        else if (ch === ">" && depth <= 0) closed = true;
        k++;
      }
      if (closed) {
        attrBlock += "\n" + lines.slice(i + 1, j + 1).join("\n");
        out.push(attrBlock);
        break;
      }
    }
  }
  return out;
}

const MIN_HIT = (cls: string) => cls.includes("min-h-11") || cls.includes("min-h-[44px]");

/** Walk the app source tree, returning tsx files (excluding node_modules/ui/tests). */
function walkApp(): string[] {
  const files: string[] = [];
  function walk(dir: string) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (
        entry.isDirectory() &&
        !entry.name.includes("node_modules") &&
        entry.name !== "ui" &&
        !entry.name.endsWith(".test.tsx") &&
        !entry.name.endsWith(".test.ts")
      )
        walk(full);
      else if (entry.isFile() && /\.(tsx|jsx)$/.test(entry.name)) files.push(full);
    }
  }
  walk(path.join(ROOT, "src"));
  return files;
}

describe("QA LIVE-004 — 44×44px touch-target invariant", () => {
  it("every TabsTrigger across all pages/components carries the 44px token", () => {
    const violations: string[] = [];
    for (const file of walkApp()) {
      const source = read(path.relative(ROOT, file));
      if (!source.includes("TabsTrigger")) continue;
      const open = /<TabsTrigger\b([^>]*)>/g;
      let m: RegExpExecArray | null;
      while ((m = open.exec(source)) !== null) {
        const attrs = m[1];
        if (!attrs.includes("className")) {
          // shadcn default h-10 (40px) — below the minimum
          violations.push(`${path.relative(ROOT, file)}: <TabsTrigger ${attrs.trim() || ""}> (no className)`);
          continue;
        }
        const cls = extractClassNames(`<TabsTrigger ${attrs}>`, "TabsTrigger")[0] ?? attrs;
        if (!MIN_HIT(cls)) {
          violations.push(`${path.relative(ROOT, file)}: className="${cls}"`);
        }
      }
    }
    expect(
      violations,
      `TabsTrigger declarations lack the 44px hit-area token:\n${violations.join("\n")}`,
    ).toEqual([]);
  });

  it("workspace group chips carry the 44px token on every width", () => {
    const source = read("src/pages/project-workspace.tsx");
    // Group chips are plain <button> elements in the chip row; the row is the
    // only place a button carries the `border-border/60` chip styling.
    const chips = source.match(/<button[\s\S]*?className="([^"]*border-border\/60[^"]*)"/g) || [];
    expect(chips.length).toBeGreaterThanOrEqual(1);
    const missing = chips.filter((c) => !MIN_HIT(c));
    expect(
      missing,
      `workspace group chip declarations lack the 44px token:\n${missing.join("\n")}`,
    ).toEqual([]);
  });

  it("tab-navigator desktop dropdown items carry the 44px token", () => {
    const source = read("src/components/tab-navigator.tsx");
    const cls = extractClassNames(source, "DropdownMenuItem");
    expect(cls.length).toBeGreaterThanOrEqual(1);
    expect(cls.every(MIN_HIT), `dropdown item className lacks token: ${cls.join(" | ")}`).toBe(true);
  });

  it("tab-navigator dropdown group SubTriggers carry the 44px token", () => {
    const source = read("src/components/tab-navigator.tsx");
    const cls = extractClassNames(source, "DropdownMenuSubTrigger");
    expect(cls.length).toBeGreaterThanOrEqual(1);
    expect(
      cls.every(MIN_HIT),
      `dropdown group SubTrigger className lacks token: ${cls.join(" | ")}`,
    ).toBe(true);
  });

  it("tab-navigator mobile All-labs sheet trigger carries a 44px hit area", () => {
    const source = read("src/components/tab-navigator.tsx");
    // The trigger is asChild-wrapped: the real hit element is the inner
    // <Button>, which must carry h-11 (44px) or the min-h token.
    const triggerButtonBlocks = extractAttrBlocks(source, "Button").filter((b) =>
      b.includes("tab-navigator-trigger") || b.includes("allLabsAriaLabel"),
    );
    const btns = triggerButtonBlocks.map((b) => (b.match(/className="([^"]*)"/) || [])[1] || "");
    expect(btns.length).toBeGreaterThanOrEqual(1);
    const HIT44 = (cls: string) =>
      cls.includes("h-11") || cls.includes("min-h-11") || cls.includes("min-h-[44px]") || cls.includes("h-12");
    const missing = btns.filter((c) => !HIT44(c));
    expect(
      missing,
      `navigator trigger Button lacks a 44px hit area: ${missing.join(" | ")}`,
    ).toEqual([]);
  });
});
