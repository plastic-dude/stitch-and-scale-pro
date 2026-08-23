import type { ArtifactInspectionReport, PublicationArtifact } from './grading-engine';

export const UNKNOWN_ARTIFACT_PROVENANCE = 'not-recorded';

type ArtifactProvenanceSource = Pick<PublicationArtifact, 'rendererVersion' | 'templateId' | 'locale'>;

/**
 * Resolve persisted artifact provenance without treating a legacy or metadata-
 * incomplete record as if it came from a known renderer/template/locale.
 */
export function getArtifactInspectionProvenance(
  artifact: ArtifactProvenanceSource,
): Pick<ArtifactInspectionReport, 'rendererVersion' | 'templateId' | 'locale'> {
  return {
    rendererVersion: artifact.rendererVersion?.trim() || UNKNOWN_ARTIFACT_PROVENANCE,
    templateId: artifact.templateId?.trim() || UNKNOWN_ARTIFACT_PROVENANCE,
    locale: artifact.locale?.trim() || UNKNOWN_ARTIFACT_PROVENANCE,
  };
}

const hasBlockingChecklistFailure = (report: Pick<ArtifactInspectionReport, 'hasBlankPages' | 'hasTitle' | 'hasHeadings' | 'hasTableContinuity'>) =>
  report.hasBlankPages === true ||
  report.hasTitle === false ||
  report.hasHeadings === false ||
  report.hasTableContinuity === false;

const hasIncompleteChecklist = (report: Pick<ArtifactInspectionReport, 'hasBlankPages' | 'hasTitle' | 'hasHeadings' | 'hasTableContinuity'>) =>
  report.hasBlankPages !== false ||
  report.hasTitle !== true ||
  report.hasHeadings !== true ||
  report.hasTableContinuity !== true;

/**
 * Normalize reports at the state boundary so legacy or programmatic payloads
 * cannot turn an unchecked artifact into a publication-quality pass.
 */
export function normalizeArtifactInspectionReport(report: ArtifactInspectionReport): ArtifactInspectionReport {
  const pageCount = Number.isFinite(report.pageCount)
    ? Math.max(0, Math.floor(report.pageCount ?? 0))
    : 0;
  const normalized: ArtifactInspectionReport = {
    ...report,
    pageCount,
    notes: report.notes?.trim() || undefined,
  };

  const blockingFailure = hasBlockingChecklistFailure(normalized);
  const incomplete = pageCount < 1 || hasIncompleteChecklist(normalized);
  const verdict = blockingFailure
    ? 'fail'
    : incomplete && normalized.verdict === 'pass'
      ? 'warning'
      : normalized.verdict;

  return { ...normalized, verdict };
}

/**
 * Map a normalized report to the persisted artifact quality state. `pass` is
 * reserved for a complete report with no blocking checklist failure.
 */
export function artifactQualitySnapshot(report: ArtifactInspectionReport): 'pass' | 'fail' | 'pending' {
  const normalized = normalizeArtifactInspectionReport(report);
  if (normalized.verdict === 'fail' || hasBlockingChecklistFailure(normalized)) return 'fail';
  if (normalized.verdict === 'warning' || (normalized.pageCount ?? 0) < 1 || hasIncompleteChecklist(normalized)) return 'pending';
  return 'pass';
}
