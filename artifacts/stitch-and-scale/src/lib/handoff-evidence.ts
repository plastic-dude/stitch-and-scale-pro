import { ALL_SIZES, type PatternProject } from './grading-engine';
import type { ReadinessResult } from './pattern-readiness';
import type { AuditSummary } from './tech-edit-audit';

/** Stable identifier for the calculation contract represented by this packet. */
export const HANDOFF_ENGINE_VERSION = 'grading-engine-v1';

export interface HandoffEvidence {
  schemaVersion: 1;
  generatedAt: string;
  project: {
    id: string;
    name: string;
    author: string;
    updatedAt: string;
  };
  calculation: {
    engineVersion: string;
    sizingStandard: string;
    customStandardSnapshotPresent: boolean;
    baseSize: string;
    targetSizes: string[];
    gauge: {
      stitchesPer4In: number;
      rowsPer4In: number;
      unit: string;
    };
    sections: number;
    measurements: number;
    constrainedMeasurements: number;
  };
  automatedReview: {
    readiness: {
      ready: boolean;
      errors: number;
      warnings: number;
    };
    technicalEdit: {
      score: number;
      verdict: string;
      errors: number;
      warnings: number;
      info: number;
      pass: number;
    };
  };
  humanReview: {
    status: string;
    reviewerName: string;
    reviewedAt: string;
    note: string;
  };
  provenance: {
    statement: string;
    valuesAreDerivedFrom: string[];
  };
}

/**
 * Builds a handoff packet from already-computed canonical outputs. This function
 * deliberately does not grade or mutate the project; it only makes the inputs
 * and decisions that produced the current screen/export inspectable.
 */
export function buildHandoffEvidence(
  project: PatternProject,
  readiness: ReadinessResult,
  audit: AuditSummary,
  generatedAt: string = new Date().toISOString(),
): HandoffEvidence {
  const measurements = project.sections.reduce((total, section) => total + section.measurements.length, 0);
  const constrainedMeasurements = project.sections.reduce(
    (total, section) => total + section.measurements.filter((measurement) =>
      measurement.stitchRepeat !== undefined ||
      measurement.rowRepeat !== undefined ||
      measurement.stitchParity !== undefined ||
      measurement.rowParity !== undefined,
    ).length,
    0,
  );

  return {
    schemaVersion: 1,
    generatedAt,
    project: {
      id: project.id,
      name: project.name,
      author: project.author,
      updatedAt: project.updatedAt,
    },
    calculation: {
      engineVersion: HANDOFF_ENGINE_VERSION,
      sizingStandard: project.sizingStandard ?? 'CYC',
      customStandardSnapshotPresent: Boolean(project.customStandardSnapshot),
      baseSize: project.baseSize,
      targetSizes: [...ALL_SIZES],
      gauge: {
        stitchesPer4In: project.gauge.stitchesPer4In,
        rowsPer4In: project.gauge.rowsPer4In,
        unit: project.gauge.unit,
      },
      sections: project.sections.length,
      measurements,
      constrainedMeasurements,
    },
    automatedReview: {
      readiness: {
        ready: readiness.ready,
        errors: readiness.errorCount,
        warnings: readiness.warningCount,
      },
      technicalEdit: {
        score: audit.score,
        verdict: audit.verdict,
        errors: audit.findingCounts.error,
        warnings: audit.findingCounts.warning,
        info: audit.findingCounts.info,
        pass: audit.findingCounts.pass,
      },
    },
    humanReview: {
      status: project.humanReview?.status ?? 'not-reviewed',
      reviewerName: project.humanReview?.reviewerName ?? '',
      reviewedAt: project.humanReview?.reviewedAt ?? '',
      note: project.humanReview?.note ?? '',
    },
    provenance: {
      statement: 'This packet describes the current project snapshot and automated evidence. It is not a replacement for reading the exported pattern and completing the human prose, chart, and sample review.',
      valuesAreDerivedFrom: [
        'project sizing standard and frozen custom snapshot when present',
        'base size, gauge, measurements, and explicit repeat/parity constraints',
        'grading engine version and current automated readiness/technical-edit results',
        'explicit human-review record stored on the project',
      ],
    },
  };
}

export function serializeHandoffEvidence(evidence: HandoffEvidence): string {
  return JSON.stringify(evidence, null, 2);
}
