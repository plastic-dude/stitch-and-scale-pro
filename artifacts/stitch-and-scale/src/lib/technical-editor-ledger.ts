import type { PatternQualityFlag, PatternQualitySeverity } from './pattern-quality';

export type DefectStatus = 'open' | 'accepted' | 'fixed';
export type DefectDisposition = 'verified' | 'needs-designer-decision' | 'requires-test-knit';
export type DefectSource = 'pattern-qa' | 'publication-preflight' | 'technical-edit' | 'test-knit';

export interface TechnicalDefect {
  id: string;
  projectId: string;
  qaRunId: string;
  code: string;
  source: DefectSource;
  severity: PatternQualitySeverity;
  title: string;
  detail: string;
  evidence: string;
  affectedSizes: string[];
  location?: string;
  reproduction?: string;
  owner?: string;
  status: DefectStatus;
  disposition?: DefectDisposition;
  createdAt: string;
  updatedAt: string;
}

export interface TechnicalDefectLedger {
  version: 1;
  projectId: string;
  sourceRevision?: string;
  defects: TechnicalDefect[];
  updatedAt: string;
}

export interface DefectLedgerSummary {
  total: number;
  open: number;
  accepted: number;
  fixed: number;
  errors: number;
  warnings: number;
  requiringTestKnit: number;
}

export function createDefectLedger(projectId: string, sourceRevision?: string): TechnicalDefectLedger {
  return { version: 1, projectId, sourceRevision, defects: [], updatedAt: new Date().toISOString() };
}

function defectId(projectId: string, code: string, now: number): string {
  return `defect-${projectId}-${code}-${now.toString(36)}`;
}

export function addTechnicalDefect(
  ledger: TechnicalDefectLedger,
  input: Omit<TechnicalDefect, 'id' | 'createdAt' | 'updatedAt'>,
): TechnicalDefectLedger {
  const now = new Date().toISOString();
  const record: TechnicalDefect = {
    ...input,
    id: defectId(ledger.projectId, input.code, Date.now()),
    projectId: ledger.projectId,
    affectedSizes: [...new Set(input.affectedSizes)].sort(),
    createdAt: now,
    updatedAt: now,
  };
  return { ...ledger, defects: [...ledger.defects, record], updatedAt: now };
}

export function updateTechnicalDefect(
  ledger: TechnicalDefectLedger,
  id: string,
  patch: Partial<Pick<TechnicalDefect, 'evidence' | 'affectedSizes' | 'location' | 'reproduction' | 'owner' | 'status' | 'disposition'>>,
): TechnicalDefectLedger {
  const now = new Date().toISOString();
  return {
    ...ledger,
    defects: ledger.defects.map((defect) => defect.id === id
      ? { ...defect, ...patch, affectedSizes: patch.affectedSizes ? [...new Set(patch.affectedSizes)].sort() : defect.affectedSizes, updatedAt: now }
      : defect),
    updatedAt: now,
  };
}

export function removeTechnicalDefect(ledger: TechnicalDefectLedger, id: string): TechnicalDefectLedger {
  const next = ledger.defects.filter((defect) => defect.id !== id);
  return next.length === ledger.defects.length ? ledger : { ...ledger, defects: next, updatedAt: new Date().toISOString() };
}

export function importPatternQualityFlags(
  ledger: TechnicalDefectLedger,
  flags: PatternQualityFlag[],
  qaRunId: string,
): TechnicalDefectLedger {
  let next = ledger;
  for (const flag of flags) {
    const duplicate = next.defects.some((defect) => defect.qaRunId === qaRunId && defect.code === flag.code && defect.detail === flag.detail);
    if (duplicate) continue;
    next = addTechnicalDefect(next, {
      projectId: ledger.projectId,
      qaRunId,
      code: String(flag.code),
      source: flag.source === 'grading' ? 'pattern-qa' : 'pattern-qa',
      severity: flag.severity,
      title: flag.title,
      detail: flag.detail,
      evidence: `${flag.code}: ${flag.detail}`,
      affectedSizes: [],
      location: [flag.sectionId, flag.measurementId].filter(Boolean).join('/'),
      status: 'open',
    });
  }
  return next;
}

export function summarizeTechnicalDefects(ledger: TechnicalDefectLedger): DefectLedgerSummary {
  return ledger.defects.reduce<DefectLedgerSummary>((summary, defect) => {
    summary.total += 1;
    summary[defect.status] += 1;
    if (defect.severity === 'error') summary.errors += 1;
    if (defect.severity === 'warn') summary.warnings += 1;
    if (defect.disposition === 'requires-test-knit') summary.requiringTestKnit += 1;
    return summary;
  }, { total: 0, open: 0, accepted: 0, fixed: 0, errors: 0, warnings: 0, requiringTestKnit: 0 });
}
