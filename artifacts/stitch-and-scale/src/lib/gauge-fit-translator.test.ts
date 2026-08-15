// CHK-080 — Gauge & Fit Translator engine tests.
// Covers the weakness-conversion feature: a stitchscale.app-style gauge
// matcher fused with the project's own grading table.
import { describe, expect, it } from "vitest";
import {
  DEFAULT_FIT_INPUT,
  analyzeFit,
} from "@/lib/gauge-fit-translator";

const GRADING = {
  XS: { bust: 32, waist: 28, hip: 34 },
  S: { bust: 36, waist: 32, hip: 38 },
  M: { bust: 40, waist: 36, hip: 42 },
  L: { bust: 44, waist: 40, hip: 46 },
  XL: { bust: 48, waist: 44, hip: 50 },
};

function input(overrides: Partial<typeof DEFAULT_FIT_INPUT> = {}) {
  return {
    ...DEFAULT_FIT_INPUT,
    patternStitchesPer4In: 20,
    patternRowsPer4In: 28,
    grading: GRADING,
    sizeOrder: ["XS", "S", "M", "L", "XL"],
    translateKeys: ["bust"],
    ...overrides,
  } as typeof DEFAULT_FIT_INPUT & typeof overrides;
}

describe("analyzeFit — on-gauge", () => {
  const r = analyzeFit(input({ testers: [{ label: "T1", stitchesPer4In: 20, rowsPer4In: 28 }] }));

  it("translates at exactly nominal when the tester matches pattern gauge", () => {
    const t = r.testers[0];
    expect(t.stitchRatio).toBe(1);
    for (const f of t.fits) expect(f.translated).toBeCloseTo(f.nominal, 9);
  });

  it("verdict is 'on gauge — proceed' for matching testers", () => {
    expect(r.verdict).toContain("on gauge");
    expect(r.hasMaterialMismatch).toBe(false);
    expect(t(r.testers[0].flags)).toBe(0);
  });

  it("recommends the size closest to its nominal intent", () => {
    // all deltas equal (0) when on gauge — first size wins deterministically
    expect(r.testers[0].recommendedSize).toBe("XS");
  });
});

describe("analyzeFit — loose tester", () => {
  const r = analyzeFit(input({
    testers: [{ label: "Loose", stitchesPer4In: 21.5, rowsPer4In: 30 }],
  }));
  const t = r.testers[0];

  it("scales translated values by the stitch ratio", () => {
    expect(t.stitchRatio).toBeCloseTo(21.5 / 20, 9);
    // bust M nominal 40 → 43 at 1.075×
    const m = t.fits.find((f) => f.size === "M")!;
    expect(m.translated).toBeCloseTo(43, 6);
    expect(m.deltaPct).toBeCloseTo(7.5, 6);
  });

  it("fires GF-02 (5–10%+) mismatch and GF-03 (sizes run big)", () => {
    const codes = t.flags.map((f) => f.code);
    expect(codes).toContain("GF-02");
    expect(codes).toContain("GF-03");
  });

  it("row-ratio mismatch under 10% does not fire GF-05", () => {
    expect(t.flags.some((f) => f.code === "GF-05")).toBe(false);
  });
});

describe("analyzeFit — severe mismatch", () => {
  const r = analyzeFit(input({
    testers: [{ label: "Very tight", stitchesPer4In: 17, rowsPer4In: 32 }],
  }));
  const t = r.testers[0];

  it("fires GF-01 and GF-04 at ≥10% stitch drift", () => {
    const codes = t.flags.map((f) => f.code);
    expect(codes).toContain("GF-01");
    expect(codes).toContain("GF-04");
  });

  it("fires GF-05 for ≥10% row drift", () => {
    expect(t.flags.some((f) => f.code === "GF-05")).toBe(true);
  });

  it("translated values shrink by the ratio", () => {
    const m = t.fits.find((f) => f.size === "M")!;
    expect(m.translated).toBeCloseTo(40 * (17 / 20), 6);
    expect(m.deltaPct).toBeCloseTo(-15, 6);
  });
});

describe("analyzeFit — mixed testers and target", () => {
  const r = analyzeFit(input({
    testers: [
      { label: "On", stitchesPer4In: 20, rowsPer4In: 28 },
      { label: "Off", stitchesPer4In: 24, rowsPer4In: 28 },
    ],
    targetCircumference: 44,
  }));

  it("mixed verdict fires when some testers drift and some don't", () => {
    expect(r.verdict).toContain("diverge");
    expect(r.hasMaterialMismatch).toBe(true);
  });

  it("target delta reports deviation from the fit spec", () => {
    const off = r.testers[1];
    const m = off.fits.find((f) => f.size === "M")!;
    // translated 48, target 44 → delta 4
    expect(m.targetDelta).toBeCloseTo(4, 6);
  });

  it("row-only drift skips the circumference flags", () => {
    const rr = analyzeFit(input({
      testers: [{ label: "Row drift", stitchesPer4In: 20, rowsPer4In: 32 }],
    }));
    const codes = rr.testers[0].flags.map((f) => f.code);
    expect(codes).not.toContain("GF-01");
    expect(codes).not.toContain("GF-03");
    expect(codes).not.toContain("GF-04");
  });
});

describe("analyzeFit — edge cases", () => {
  it("empty tester list yields the add-tester verdict without crashing", () => {
    const r = analyzeFit(input({ testers: [] }));
    expect(r.testers).toHaveLength(0);
    expect(r.verdict).toContain("Add at least one tester");
  });

  it("zero pattern gauge guards against division by zero", () => {
    const r = analyzeFit(input({
      patternStitchesPer4In: 0,
      testers: [{ label: "T", stitchesPer4In: 20, rowsPer4In: 28 }],
    }));
    expect(r.testers[0].stitchRatio).toBe(1);
  });

  it("sizes missing the primary key are excluded from fits", () => {
    const grading = { M: { bust: 40 } };
    const r = analyzeFit({
      ...input(),
      grading,
      sizeOrder: ["S", "M", "L"],
    } as typeof DEFAULT_FIT_INPUT);
    expect(r.testers[0].fits).toHaveLength(1);
    expect(r.testers[0].fits[0].size).toBe("M");
  });
});

function t(flags: { code: string }[]): number {
  return flags.length;
}
