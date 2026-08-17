import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const source = (relativePath: string) =>
  fs.readFileSync(path.resolve(__dirname, relativePath), "utf8");

describe("CHK-131 residual mobile touch-target guards", () => {
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

  it("keeps the shared Radix Sheet close affordance at least 44px", () => {
    const sheet = source("../components/ui/sheet.tsx");

    expect(sheet).toContain(
      'className="absolute right-4 top-4 h-11 w-11 p-0 rounded-sm',
    );
    expect(sheet).toContain('<span className="sr-only">Close</span>');
  });
});

