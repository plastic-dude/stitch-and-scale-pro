export type ReleaseEvidenceKey = 'physical-print' | 'chart-readability' | 'schematic-scale' | 'test-knit';
export type ReleaseEvidenceStatus = 'not-started' | 'in-review' | 'passed' | 'blocked';

export interface ReleaseEvidenceItem {
  key: ReleaseEvidenceKey;
  status: ReleaseEvidenceStatus;
  note: string;
  evidence: string;
  updatedAt: string;
}

export interface ReleaseEvidenceChecklist {
  version: 1;
  projectId: string;
  sourceRevision?: string;
  items: Record<ReleaseEvidenceKey, ReleaseEvidenceItem>;
  updatedAt: string;
}

export interface ReleaseEvidenceSummary {
  total: number;
  passed: number;
  inReview: number;
  blocked: number;
  notStarted: number;
  certificationReady: boolean;
}

const KEYS: ReleaseEvidenceKey[] = ['physical-print', 'chart-readability', 'schematic-scale', 'test-knit'];

export function createReleaseEvidenceChecklist(projectId: string, sourceRevision?: string): ReleaseEvidenceChecklist {
  const now = new Date().toISOString();
  const items = Object.fromEntries(KEYS.map((key) => [key, { key, status: 'not-started', note: '', evidence: '', updatedAt: now }])) as Record<ReleaseEvidenceKey, ReleaseEvidenceItem>;
  return { version: 1, projectId, sourceRevision, items, updatedAt: now };
}

export function updateReleaseEvidenceItem(
  checklist: ReleaseEvidenceChecklist,
  key: ReleaseEvidenceKey,
  patch: Partial<Pick<ReleaseEvidenceItem, 'status' | 'note' | 'evidence'>>,
): ReleaseEvidenceChecklist {
  const now = new Date().toISOString();
  return {
    ...checklist,
    items: { ...checklist.items, [key]: { ...checklist.items[key], ...patch, updatedAt: now } },
    updatedAt: now,
  };
}

export function summarizeReleaseEvidence(checklist: ReleaseEvidenceChecklist): ReleaseEvidenceSummary {
  const statuses = Object.values(checklist.items).map((item) => item.status);
  const passed = statuses.filter((status) => status === 'passed').length;
  const inReview = statuses.filter((status) => status === 'in-review').length;
  const blocked = statuses.filter((status) => status === 'blocked').length;
  const notStarted = statuses.filter((status) => status === 'not-started').length;
  return { total: statuses.length, passed, inReview, blocked, notStarted, certificationReady: statuses.length === KEYS.length && passed === KEYS.length };
}

export function isReleaseEvidenceChecklist(value: unknown, projectId: string): value is ReleaseEvidenceChecklist {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<ReleaseEvidenceChecklist>;
  if (candidate.version !== 1 || candidate.projectId !== projectId || !candidate.items || typeof candidate.items !== 'object') return false;
  return KEYS.every((key) => {
    const item = candidate.items?.[key];
    return Boolean(item && item.key === key && ['not-started', 'in-review', 'passed', 'blocked'].includes(item.status) && typeof item.note === 'string' && typeof item.evidence === 'string' && typeof item.updatedAt === 'string');
  });
}
