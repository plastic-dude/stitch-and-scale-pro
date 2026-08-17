import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("new-project mobile touch targets", () => {
  it("keeps the existing Back/Cancel control at the 44px minimum", () => {
    const source = fs.readFileSync(path.resolve(__dirname, "new-project.tsx"), "utf8");
    const backButton = source.match(
      /<Button\s+variant="ghost"\s+onClick=\{step === 1 \? \(\) => setLocation\('\/'\) : handleBack\}\s+className="([^"]+)"\s+data-testid="button-back"/s,
    );

    expect(backButton).not.toBeNull();
    expect(backButton?.[1]).toContain("min-h-11");
    expect(backButton?.[1]).toContain("min-w-11");
  });
});
