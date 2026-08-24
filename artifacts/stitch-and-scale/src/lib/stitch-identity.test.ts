import { describe, expect, it } from "vitest";
import { deriveStitchIdentity, emptyStitchIdentity } from "./stitch-identity";
import type { PatternProject } from "./grading-engine";

const project = (overrides: Partial<PatternProject> = {}): PatternProject => ({
  id: "project-alpine",
  name: "Alpine Cardigan",
  author: "Maker",
  baseSize: "M",
  gauge: { stitchesPer4In: 20, rowsPer4In: 28, unit: "in" },
  sections: [],
  createdAt: "2026-01-12T10:00:00.000Z",
  updatedAt: "2026-01-12T10:00:00.000Z",
  sizingStandard: "CYC",
  yarnWeight: "DK",
  ...overrides,
});

const recognition = (
  projectId: string,
  sizeCount: number,
  earnedAt: string,
) => ({
  [projectId]: {
    version: 1,
    events: [
      {
        id: `first-clean-grade:fingerprint-${projectId}`,
        kind: "first-clean-grade",
        earnedAt,
        sourceFingerprint: `fingerprint-${projectId}`,
        sizeCount,
        acknowledgedAt: null,
      },
    ],
  },
});

describe("stitch identity derivation", () => {
  it("derives deterministic local facts and keeps the score withheld pending review", () => {
    const projects = [
      project(),
      project({
        id: "project-sage",
        name: "Sage Pullover",
        createdAt: "2026-02-03T10:00:00.000Z",
        updatedAt: "2026-02-03T10:00:00.000Z",
        sizingStandard: "Custom",
        yarnWeight: "fingering",
      }),
    ];
    const identity = deriveStitchIdentity({
      projects: projects.map((item) => ({
        source: "manual" as const,
        project: item,
      })),
      recognitionByProject: {
        ...recognition("project-alpine", 5, "2026-01-20T10:00:00.000Z"),
        ...recognition("project-sage", 8, "2026-02-20T10:00:00.000Z"),
      },
      maker: {
        designerName: "  Ada Maker  ",
        studioName: "North Loop",
        website: "https://example.test",
        socialHandle: "@northloop",
        copyrightNotice: "© Ada Maker",
      },
      exportedAt: "2026-08-24T12:00:00.000Z",
    });

    expect(identity.schema).toEqual({
      kind: "stitch-identity",
      version: 1,
      calculationVersion: "stitch-score-v1",
    });
    expect(identity.trust.status).toBe("self-reported");
    expect(identity.trust.statement).toContain("Not independently verified");
    expect(identity.maker.designerName).toBe("Ada Maker");
    expect(identity.profile).toMatchObject({
      projectCount: 2,
      cleanGradedProjectCount: 2,
      earliestLocalProjectAt: "2026-01-12T10:00:00.000Z",
      standardsUsed: ["CYC", "Custom"],
      yarnWeightsUsed: ["fingering", "DK"],
      cleanGradeSizeCountTotal: 13,
      cleanGradeSizeCountMaximum: 8,
      cleanGradeMonthCount: 2,
      completeness: "complete",
    });
    expect(identity.bragables).toEqual([
      {
        kind: "first-clean-grade",
        projectRef: "project-alpine",
        projectName: "Alpine Cardigan",
        observedAt: "2026-01-20T10:00:00.000Z",
        gradedSizeCount: 5,
        source: "local-recognition-record",
      },
      {
        kind: "first-clean-grade",
        projectRef: "project-sage",
        projectName: "Sage Pullover",
        observedAt: "2026-02-20T10:00:00.000Z",
        gradedSizeCount: 8,
        source: "local-recognition-record",
      },
    ]);
    expect(identity.score).toMatchObject({
      value: null,
      maximum: 35,
      tier: null,
      formulaVersion: "stitch-score-v1",
    });
    expect(identity.provenance).toMatchObject({
      exportedAt: "2026-08-24T12:00:00.000Z",
      sourceProjectRefs: ["project-alpine", "project-sage"],
      sourceRecordKinds: ["projects", "recognition"],
    });
  });

  it("fails closed for malformed project and recognition records and marks the result partial", () => {
    const identity = deriveStitchIdentity({
      projects: [
        { source: "manual" as const, project: project() },
        {
          source: "manual" as const,
          project: { id: "bad-project", name: "Missing dates" },
        },
        {
          source: "manual" as const,
          project: project({ id: "project-alpine", name: "Duplicate ID" }),
        },
      ],
      recognitionByProject: {
        ...recognition("project-alpine", 5, "2026-01-20T10:00:00.000Z"),
        "unknown-project": {
          version: 99,
          events: [{ kind: "first-clean-grade", sizeCount: 999 }],
        },
      },
      exportedAt: "not-a-date",
    });

    expect(identity.profile.projectCount).toBe(1);
    expect(identity.profile.completeness).toBe("partial");
    expect(identity.bragables).toHaveLength(1);
    expect(identity.provenance.exportedAt).toBeNull();
    expect(
      identity.provenance.limitations.some((item) => item.includes("partial")),
    ).toBe(true);
  });

  it("does not invent recognition from project repetition, calculator fields, or export metadata", () => {
    const identity = deriveStitchIdentity({
      projects: [
        {
          source: "manual" as const,
          project: project({
            id: "project-one",
            name: "Repeated edit",
            description:
              "calculator opened 12 times; exported PDF successfully",
          }),
        },
        {
          source: "sample" as const,
          project: project({ id: "sample-project", name: "Sample" }),
        },
        {
          source: "demo" as const,
          project: project({ id: "demo-project", name: "Demo" }),
        },
        {
          source: "import" as const,
          project: project({ id: "import-project", name: "Import" }),
        },
        {
          source: "unknown" as const,
          project: project({ id: "unknown-project", name: "Unknown" }),
        },
      ],
      maker: { designerName: "Maker" },
    });

    expect(identity.profile.cleanGradedProjectCount).toBe(0);
    expect(identity.profile.cleanGradeSizeCountTotal).toBe(0);
    expect(identity.bragables).toEqual([]);
    expect(identity.profile.completeness).toBe("partial");
    expect(identity.provenance.limitations.join(" ")).toContain(
      "Recognition evidence was not supplied",
    );
    expect(identity.provenance.limitations.join(" ")).toContain(
      "sample, demo, or imported record(s) were excluded",
    );
  });

  it("counts distinct recognition months rather than observations or streaks", () => {
    const identity = deriveStitchIdentity({
      projects: [
        { source: "manual", project: project({ id: "january-one" }) },
        { source: "manual", project: project({ id: "january-two" }) },
        { source: "manual", project: project({ id: "march-one" }) },
      ],
      recognitionByProject: {
        ...recognition("january-one", 3, "2026-01-05T10:00:00.000Z"),
        ...recognition("january-two", 4, "2026-01-27T10:00:00.000Z"),
        ...recognition("march-one", 6, "2026-03-01T10:00:00.000Z"),
      },
    });

    expect(identity.profile.cleanGradedProjectCount).toBe(3);
    expect(identity.profile.cleanGradeMonthCount).toBe(2);
  });

  it("ignores recognition for projects outside the explicit project snapshot", () => {
    const identity = deriveStitchIdentity({
      projects: [{ source: "manual" as const, project: project() }],
      recognitionByProject: recognition(
        "not-in-snapshot",
        10,
        "2026-03-01T10:00:00.000Z",
      ),
    });

    expect(identity.profile.cleanGradedProjectCount).toBe(0);
    expect(identity.bragables).toEqual([]);
    expect(identity.provenance.sourceProjectRefs).toEqual(["project-alpine"]);
  });

  it("provides an explicit empty complete snapshot without a false score", () => {
    const identity = emptyStitchIdentity();

    expect(identity.profile).toMatchObject({
      projectCount: 0,
      cleanGradedProjectCount: 0,
      completeness: "complete",
    });
    expect(identity.score.value).toBeNull();
    expect(identity.trust.status).toBe("self-reported");
    expect(identity.provenance.exportedAt).toBe("1970-01-01T00:00:00.000Z");
  });
});
