import type { PatternProject, SizingStandard } from "@/lib/grading-engine";
import {
  FIRST_CLEAN_GRADE_KIND,
  normalizeRecognitionState,
  type RecognitionEvent,
} from "@/lib/recognition";

export const STITCH_IDENTITY_SCHEMA_VERSION = 1 as const;
export const STITCH_SCORE_FORMULA_VERSION = "stitch-score-v1" as const;
export const SELF_REPORTED_STATUS = "self-reported" as const;

export type StitchIdentityCompleteness = "complete" | "partial";
export type StitchIdentityProjectSource =
  "manual" | "user-edited" | "sample" | "demo" | "import" | "unknown";
export type StitchIdentityTier =
  "starting" | "building" | "steady" | "established" | "broad-practice";

export type StitchIdentityMaker = {
  designerName: string;
  studioName: string;
  website: string;
  socialHandle: string;
  copyrightNotice: string;
};

export type StitchIdentityBragable = {
  kind: typeof FIRST_CLEAN_GRADE_KIND;
  projectRef: string;
  projectName: string;
  observedAt: string;
  gradedSizeCount: number;
  source: "local-recognition-record";
};

export type StitchIdentityV1 = {
  schema: {
    kind: "stitch-identity";
    version: typeof STITCH_IDENTITY_SCHEMA_VERSION;
    calculationVersion: typeof STITCH_SCORE_FORMULA_VERSION;
  };
  trust: {
    status: typeof SELF_REPORTED_STATUS;
    computedFrom: "local-project-records";
    statement: "Computed from editable records on this device. Not independently verified.";
  };
  maker: StitchIdentityMaker;
  profile: {
    projectCount: number;
    cleanGradedProjectCount: number;
    earliestLocalProjectAt: string | null;
    standardsUsed: SizingStandard[];
    yarnWeightsUsed: NonNullable<PatternProject["yarnWeight"]>[];
    cleanGradeSizeCountTotal: number;
    cleanGradeSizeCountMaximum: number;
    cleanGradeMonthCount: number;
    completeness: StitchIdentityCompleteness;
  };
  bragables: StitchIdentityBragable[];
  score: {
    value: null;
    maximum: 35;
    tier: null;
    formulaVersion: typeof STITCH_SCORE_FORMULA_VERSION;
    explanation: "Score is withheld until the product review explicitly approves the public formula.";
  };
  provenance: {
    exportedAt: string | null;
    sourceProjectRefs: string[];
    sourceRecordKinds: ["projects", "recognition"];
    limitations: string[];
  };
};

export type StitchIdentityInput = {
  /** Each record must carry an explicit source so demo/import data cannot be inferred as maker evidence. */
  projects: unknown;
  recognitionByProject?: unknown;
  maker?: unknown;
  exportedAt?: unknown;
};

type NormalizedProjects = {
  projects: PatternProject[];
  complete: boolean;
  excludedCount: number;
};

const SIZING_STANDARDS: readonly SizingStandard[] = [
  "CYC",
  "UK",
  "EN13402",
  "Japanese",
  "Korean",
  "Chinese",
  "Australian",
  "Custom",
];

const YARN_WEIGHTS: readonly NonNullable<PatternProject["yarnWeight"]>[] = [
  "lace",
  "fingering",
  "sport",
  "DK",
  "worsted",
  "bulky",
  "super-bulky",
];

const MAX_TEXT_LENGTH = 500;
const ISO_EPOCH = "1970-01-01T00:00:00.000Z";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isIsoTimestamp(value: unknown): value is string {
  if (typeof value !== "string" || value.length === 0 || value.length > 64)
    return false;
  return Number.isFinite(Date.parse(value));
}

function text(value: unknown): string {
  return typeof value === "string"
    ? value.trim().slice(0, MAX_TEXT_LENGTH)
    : "";
}

function optionalEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
): T | undefined {
  return typeof value === "string" && allowed.includes(value as T)
    ? (value as T)
    : undefined;
}

function isProjectLike(value: unknown): value is PatternProject {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    value.id.trim().length > 0 &&
    value.id.length <= 200 &&
    typeof value.name === "string" &&
    value.name.trim().length > 0 &&
    isIsoTimestamp(value.createdAt) &&
    isIsoTimestamp(value.updatedAt)
  );
}

function normalizeProject(value: PatternProject): PatternProject {
  return {
    ...value,
    id: value.id.trim().slice(0, 200),
    name: value.name.trim().slice(0, MAX_TEXT_LENGTH),
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    sizingStandard: optionalEnum(value.sizingStandard, SIZING_STANDARDS),
    yarnWeight: optionalEnum(value.yarnWeight, YARN_WEIGHTS),
  };
}

function normalizeProjects(value: unknown): NormalizedProjects {
  if (!Array.isArray(value)) {
    return { projects: [], complete: false, excludedCount: 0 };
  }

  const projects: PatternProject[] = [];
  const seen = new Set<string>();
  let complete = true;
  let excludedCount = 0;
  for (const candidate of value) {
    if (!isRecord(candidate)) {
      complete = false;
      continue;
    }
    const source = optionalEnum(candidate.source, [
      "manual",
      "user-edited",
      "sample",
      "demo",
      "import",
      "unknown",
    ] as const);
    if (!source) {
      complete = false;
      continue;
    }
    if (source === "sample" || source === "demo" || source === "import") {
      excludedCount += 1;
      continue;
    }
    if (!isProjectLike(candidate.project)) {
      complete = false;
      continue;
    }
    const project = normalizeProject(candidate.project);
    if (seen.has(project.id)) {
      complete = false;
      continue;
    }
    seen.add(project.id);
    projects.push(project);
  }
  return { projects, complete, excludedCount };
}

function normalizeMaker(value: unknown): StitchIdentityMaker {
  const maker = isRecord(value) ? value : {};
  return {
    designerName: text(maker.designerName),
    studioName: text(maker.studioName),
    website: text(maker.website),
    socialHandle: text(maker.socialHandle),
    copyrightNotice: text(maker.copyrightNotice),
  };
}

function normalizeExportedAt(value: unknown): string | null {
  return isIsoTimestamp(value) ? value : null;
}

function recognitionEventFor(
  recognitionByProject: Record<string, unknown>,
  projectId: string,
): RecognitionEvent | null {
  const state = normalizeRecognitionState(recognitionByProject[projectId]);
  return (
    state.events.find((event) => event.kind === FIRST_CLEAN_GRADE_KIND) ?? null
  );
}

function monthKey(value: string): string {
  return new Date(value).toISOString().slice(0, 7);
}

function sortedUnique<T extends string>(values: T[], order: readonly T[]): T[] {
  const rank = new Map(order.map((value, index) => [value, index]));
  return [...new Set(values)].sort(
    (a, b) =>
      (rank.get(a) ?? Number.MAX_SAFE_INTEGER) -
      (rank.get(b) ?? Number.MAX_SAFE_INTEGER),
  );
}

function limitationsFor(
  completeness: StitchIdentityCompleteness,
  hasRecognitionInput: boolean,
  excludedCount: number,
): string[] {
  const limitations = [
    "This summary is computed from editable records on this device and is not independently verified.",
    "A project reference is local provenance, not proof of authorship or authenticity.",
    "No score is shown until its public formula receives explicit product review.",
  ];
  if (completeness === "partial") {
    limitations.unshift(
      "Some local input was missing or malformed, so the summary is partial.",
    );
  }
  if (!hasRecognitionInput) {
    limitations.unshift(
      "Recognition evidence was not supplied, so clean-grade facts are incomplete.",
    );
  }
  if (excludedCount > 0) {
    limitations.unshift(
      `${excludedCount} sample, demo, or imported record(s) were excluded from maker evidence.`,
    );
  }
  return limitations;
}

/**
 * Derive a stable, local-only identity snapshot from explicit caller-owned input.
 * Each project must be wrapped as `{ project, source }`; unknown sources fail closed,
 * while explicit sample/demo/import sources are excluded. This function never reads
 * storage, performs I/O, sends data, or treats exports, calculator usage, repeated
 * edits, or social activity as evidence.
 */
export function deriveStitchIdentity(
  input: StitchIdentityInput,
): StitchIdentityV1 {
  const normalized = normalizeProjects(input.projects);
  const recognitionInput = isRecord(input.recognitionByProject)
    ? input.recognitionByProject
    : null;
  const maker = normalizeMaker(input.maker);
  const events: Array<{ project: PatternProject; event: RecognitionEvent }> =
    [];

  for (const project of normalized.projects) {
    if (!recognitionInput) continue;
    const event = recognitionEventFor(recognitionInput, project.id);
    if (event) events.push({ project, event });
  }

  const standardsUsed = sortedUnique(
    normalized.projects.flatMap((project) =>
      project.sizingStandard ? [project.sizingStandard] : [],
    ),
    SIZING_STANDARDS,
  ) as SizingStandard[];
  const yarnWeightsUsed = sortedUnique(
    normalized.projects.flatMap((project) =>
      project.yarnWeight ? [project.yarnWeight] : [],
    ),
    YARN_WEIGHTS,
  ) as NonNullable<PatternProject["yarnWeight"]>[];
  const cleanGradeMonths = new Set(
    events.map(({ event }) => monthKey(event.earnedAt)),
  );
  const earliestLocalProjectAt = normalized.projects.length
    ? normalized.projects.reduce((earliest, project) =>
        Date.parse(project.createdAt) < Date.parse(earliest.createdAt)
          ? project
          : earliest,
      ).createdAt
    : null;
  const completeness: StitchIdentityCompleteness =
    normalized.complete && recognitionInput !== null ? "complete" : "partial";

  return {
    schema: {
      kind: "stitch-identity",
      version: STITCH_IDENTITY_SCHEMA_VERSION,
      calculationVersion: STITCH_SCORE_FORMULA_VERSION,
    },
    trust: {
      status: SELF_REPORTED_STATUS,
      computedFrom: "local-project-records",
      statement:
        "Computed from editable records on this device. Not independently verified.",
    },
    maker,
    profile: {
      projectCount: normalized.projects.length,
      cleanGradedProjectCount: events.length,
      earliestLocalProjectAt,
      standardsUsed,
      yarnWeightsUsed,
      cleanGradeSizeCountTotal: events.reduce(
        (sum, item) => sum + item.event.sizeCount,
        0,
      ),
      cleanGradeSizeCountMaximum: events.reduce(
        (maximum, item) => Math.max(maximum, item.event.sizeCount),
        0,
      ),
      cleanGradeMonthCount: cleanGradeMonths.size,
      completeness,
    },
    bragables: events.map(({ project, event }) => ({
      kind: FIRST_CLEAN_GRADE_KIND,
      projectRef: project.id,
      projectName: project.name,
      observedAt: event.earnedAt,
      gradedSizeCount: event.sizeCount,
      source: "local-recognition-record",
    })),
    score: {
      value: null,
      maximum: 35,
      tier: null,
      formulaVersion: STITCH_SCORE_FORMULA_VERSION,
      explanation:
        "Score is withheld until the product review explicitly approves the public formula.",
    },
    provenance: {
      exportedAt: normalizeExportedAt(input.exportedAt),
      sourceProjectRefs: normalized.projects.map((project) => project.id),
      sourceRecordKinds: ["projects", "recognition"],
      limitations: limitationsFor(
        completeness,
        recognitionInput !== null,
        normalized.excludedCount,
      ),
    },
  };
}

export function emptyStitchIdentity(): StitchIdentityV1 {
  return deriveStitchIdentity({
    projects: [],
    recognitionByProject: {},
    maker: {},
    exportedAt: ISO_EPOCH,
  });
}
