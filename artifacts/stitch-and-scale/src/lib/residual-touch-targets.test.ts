import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const source = (relativePath: string) =>
  fs.readFileSync(path.resolve(__dirname, relativePath), "utf8");

// CHK-132 — guard that interactive h-8 controls keep a 44px (min-h-11) hit
// area; a regression to h-8-only re-opens the S275/#68 defect class.

describe("residual mobile touch-target guards", () => {
  it("keeps section and measurement actions at least 44px", () => {
    const workspace = source("../pages/project-workspace.tsx");

    expect(workspace).toContain(
      'className="min-h-11 min-w-11 text-destructive hover:text-destructive hover:bg-destructive/10"',
    );
    expect(workspace).toContain(
      'className="min-h-11 min-w-11 h-10 w-10 text-muted-foreground opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity" onClick={() => handleEditMeasurement',
    );
    expect(workspace).toContain(
      'className="min-h-11 min-w-11 h-10 w-10 text-muted-foreground opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity" aria-label={copy.deleteMeasurement',
    );
  });

  it("keeps every Brag Cards accent selector at least 44px", () => {
    const bragCards = source("../components/brag-card-card.tsx");

    expect(bragCards).toContain(
      'className="h-8 w-8 min-h-11 min-w-11 rounded-full border-2 transition-all"',
    );
    expect(bragCards).not.toContain(
      'className="h-8 w-8 rounded-full border-2 transition-all"',
    );
  });

  it("keeps Brag Card caption, share, and download actions at least 44px", () => {
    const bragCards = source("../components/brag-card-card.tsx");

    expect(bragCards).toContain(
      '<Button size="sm" className="min-h-11" onClick={copyCaption} disabled={!hasData}>',
    );
    expect(bragCards).toContain(
      '<Button size="sm" variant="outline" className="min-h-11" onClick={shareNative} disabled={!hasData}>',
    );
    expect(bragCards).toContain(
      '<Button size="sm" variant="outline" className="min-h-11" onClick={downloadPng} disabled={!hasData}>',
    );
  });

  it("keeps the shared Radix Sheet close affordance at least 44px", () => {
    const sheet = source("../components/ui/sheet.tsx");

    expect(sheet).toContain(
      'className="absolute right-4 top-4 h-11 w-11 p-0 rounded-sm',
    );
    expect(sheet).toContain('<span className="sr-only">Close</span>');
  });
});


  it("keeps lab-card SelectTrigger/Button controls at least 44px", () => {
    // CHK-132 (S275): interactive h-8 controls must pair h-8 with min-h-11
    // across the lab cards and PDF control panel.
    expect(source("../components/collab-deal-math-card.tsx")).toContain(
      'className="h-8 min-h-11 text-sm"',
    );
    expect(source("../components/collab-evaluator-card.tsx")).toContain(
      'className="gap-2 h-8 min-h-11"',
    );
    expect(source("../components/partner-economics-card.tsx")).toContain(
      'className="h-8 min-h-11 w-36 text-sm"',
    );
    expect(source("../components/partner-economics-card.tsx")).toContain(
      'className="h-8 min-h-11 w-8 text-muted-foreground hover:text-destructive"',
    );
    expect(source("../components/wholesale-lab-card.tsx")).toContain(
      'className="h-8 min-h-11 text-sm"',
    );
    expect(source("../components/giftcard-lab-card.tsx")).toContain(
      'className="h-8 min-h-11 bg-background"',
    );
    expect(source("../components/convention-booth-lab-card.tsx")).toContain(
      'className="text-sm h-8 min-h-11"',
    );
    expect(source("../pages/project-pdf.tsx")).toContain(
      'className="gap-1.5 -ml-1.5 h-8 min-h-11 px-2"',
    );
    expect(source("../pages/project-pdf.tsx")).toContain(
      'className="h-8 min-h-11 w-8 shrink-0 text-muted-foreground hover:text-destructive"',
    );
  });
