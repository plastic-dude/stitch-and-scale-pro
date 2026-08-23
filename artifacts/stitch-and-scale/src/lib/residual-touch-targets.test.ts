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

  it("keeps Project Grading export and print actions at least 44px", () => {
    const grading = source("../pages/project-grading.tsx");

    expect(grading).toContain(
      'className="rounded-full bg-background min-h-11" data-testid="button-copy-table"',
    );
    expect(grading).toContain(
      'className="rounded-full bg-background min-h-11" data-testid="button-download-csv"',
    );
    expect(grading).toContain(
      'className="rounded-full bg-background min-h-11" data-testid="button-download-handoff"',
    );
    expect(grading).toContain(
      'className="bg-primary hover:bg-primary/90 rounded-full px-6 shadow-sm min-h-11" data-testid="button-print"',
    );
  });

  it("keeps Assets actions discoverable and at least 44px on touch devices", () => {
    const assets = source("../components/assets-panel.tsx");

    expect(assets).toContain('<Button onClick={() => startAdd(false)} className="gap-2 min-h-11 self-start sm:self-auto">');
    expect(assets).toContain('<Button variant="ghost" className="min-h-11" onClick={cancelAdd}>');
    expect(assets).toContain('<Button className="min-h-11" onClick={handleSave}');
    expect(assets).toContain('opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 focus-within:opacity-100');
    expect(assets).toMatch(/h-8 w-8 min-h-11 min-w-11[^"]*rounded-full/);
    expect(assets).toContain('aria-label={copy.viewAsset}');
    expect(assets).toContain('aria-label={copy.downloadAsset}');
    expect(assets).toContain('className="h-7 w-7 min-h-11 min-w-11 shrink-0 text-muted-foreground hover:text-destructive"');
    expect(assets).toContain('aria-label={copy.deleteAsset}');
    expect(assets).not.toContain('opacity-0 group-hover:opacity-100');
  });

  it("keeps the shared Radix Sheet close affordance at least 44px", () => {
    const sheet = source("../components/ui/sheet.tsx");

    expect(sheet).toContain(
      'className="absolute right-4 top-4 h-11 w-11 p-0 rounded-sm',
    );
    expect(sheet).toContain('<span className="sr-only">Close</span>');
  });

  it("keeps Design Ledger production-control actions at least 44px", () => {
    const ledger = source("../components/design-ledger-card.tsx");

    expect(ledger.match(/className="min-h-11"/g)?.length).toBeGreaterThanOrEqual(5);
    expect(ledger).toContain(
      '<Button size="sm" variant="secondary" className="min-h-11" onClick={exportCsv}>',
    );
    expect(ledger).toContain(
      '<Button size="sm" variant="secondary" className="min-h-11" onClick={copySummary}>',
    );
    expect(ledger).toContain(
      'className="min-h-11 min-w-11 text-muted-foreground hover:text-destructive"',
    );
    expect(ledger).toContain(
      'className="ml-auto min-h-11 min-w-11 text-muted-foreground hover:text-destructive"',
    );
    expect(ledger).toContain(
      '<Button size="sm" variant="ghost" className="min-h-11" onClick={commitNotes}>',
    );
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
