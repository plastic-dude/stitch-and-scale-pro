export type SampleStatus = 'in-studio' | 'on-loan' | 'returned' | 'sold' | 'missing';
export type TestKnitStatus = 'planned' | 'active' | 'complete' | 'blocked';
export type SubmissionStatus = 'planned' | 'submitted' | 'accepted' | 'declined' | 'withdrawn';
export type WholesaleStatus = 'draft' | 'sent' | 'partially-paid' | 'paid' | 'overdue' | 'cancelled';

export interface SampleRecord {
  id: string;
  projectId: string;
  name: string;
  status: SampleStatus;
  location: string;
  borrower?: string;
  loanedAt?: string;
  dueAt?: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface TestKnitRecord {
  id: string;
  projectId: string;
  tester: string;
  size: string;
  yarn: string;
  gauge?: string;
  status: TestKnitStatus;
  startedAt?: string;
  completedAt?: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubmissionRecord {
  id: string;
  projectId: string;
  outlet: string;
  deadline?: string;
  status: SubmissionStatus;
  submittedAt?: string;
  responseAt?: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface WholesaleOrderRecord {
  id: string;
  projectId: string;
  account: string;
  orderRef?: string;
  amount?: number;
  currency: string;
  terms?: string;
  dueAt?: string;
  status: WholesaleStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface OperationalRecords {
  version: 1;
  projectId: string;
  samples: SampleRecord[];
  testKnits: TestKnitRecord[];
  submissions: SubmissionRecord[];
  wholesaleOrders: WholesaleOrderRecord[];
  updatedAt: string;
}

export const EMPTY_OPERATIONAL_RECORDS = (projectId: string): OperationalRecords => ({
  version: 1,
  projectId,
  samples: [],
  testKnits: [],
  submissions: [],
  wholesaleOrders: [],
  updatedAt: new Date().toISOString(),
});

function makeId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function stamp<T extends { createdAt: string; updatedAt: string }>(record: T): T {
  const now = new Date().toISOString();
  return { ...record, createdAt: record.createdAt || now, updatedAt: now };
}

export function addSample(records: OperationalRecords, input: Omit<SampleRecord, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>): OperationalRecords {
  if (!input.name.trim()) return records;
  const record = stamp({ ...input, id: makeId('sample'), projectId: records.projectId, createdAt: '', updatedAt: '' });
  return { ...records, samples: [...records.samples, record], updatedAt: record.updatedAt };
}

export function addTestKnit(records: OperationalRecords, input: Omit<TestKnitRecord, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>): OperationalRecords {
  if (!input.tester.trim() || !input.size.trim()) return records;
  const record = stamp({ ...input, id: makeId('test-knit'), projectId: records.projectId, createdAt: '', updatedAt: '' });
  return { ...records, testKnits: [...records.testKnits, record], updatedAt: record.updatedAt };
}

export function addSubmission(records: OperationalRecords, input: Omit<SubmissionRecord, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>): OperationalRecords {
  if (!input.outlet.trim()) return records;
  const record = stamp({ ...input, id: makeId('submission'), projectId: records.projectId, createdAt: '', updatedAt: '' });
  return { ...records, submissions: [...records.submissions, record], updatedAt: record.updatedAt };
}

export function addWholesaleOrder(records: OperationalRecords, input: Omit<WholesaleOrderRecord, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>): OperationalRecords {
  if (!input.account.trim()) return records;
  const amount = input.amount !== undefined && input.amount >= 0 ? Math.round(input.amount * 100) / 100 : undefined;
  const record = stamp({ ...input, amount, id: makeId('wholesale'), projectId: records.projectId, createdAt: '', updatedAt: '' });
  return { ...records, wholesaleOrders: [...records.wholesaleOrders, record], updatedAt: record.updatedAt };
}

export function updateOperationalRecord<K extends keyof Pick<OperationalRecords, 'samples' | 'testKnits' | 'submissions' | 'wholesaleOrders'>>(
  records: OperationalRecords,
  collection: K,
  id: string,
  patch: Partial<OperationalRecords[K][number]>,
): OperationalRecords {
  const next = records[collection].map((record) => record.id === id ? stamp({ ...record, ...patch }) : record) as OperationalRecords[K];
  return next === records[collection] ? records : { ...records, [collection]: next, updatedAt: new Date().toISOString() };
}

export function removeOperationalRecord<K extends keyof Pick<OperationalRecords, 'samples' | 'testKnits' | 'submissions' | 'wholesaleOrders'>>(
  records: OperationalRecords,
  collection: K,
  id: string,
): OperationalRecords {
  const next = records[collection].filter((record) => record.id !== id) as OperationalRecords[K];
  return next.length === records[collection].length ? records : { ...records, [collection]: next, updatedAt: new Date().toISOString() };
}

export function operationalRecordCounts(records: OperationalRecords) {
  return {
    samples: records.samples.length,
    testKnits: records.testKnits.length,
    submissions: records.submissions.length,
    wholesaleOrders: records.wholesaleOrders.length,
  };
}

export function exportOperationalRecordsCsv(records: OperationalRecords): string {
  const escape = (value: unknown) => {
    const text = value == null ? '' : String(value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const lines = ['type,id,projectId,primary,status,date,amount,currency,location,notes'];
  for (const record of records.samples) lines.push(['sample', record.id, record.projectId, record.name, record.status, record.loanedAt ?? record.createdAt.slice(0, 10), '', '', record.location, record.notes].map(escape).join(','));
  for (const record of records.testKnits) lines.push(['test-knit', record.id, record.projectId, record.tester, record.status, record.startedAt ?? record.createdAt.slice(0, 10), '', '', `${record.size}${record.yarn ? ` / ${record.yarn}` : ''}`, record.notes].map(escape).join(','));
  for (const record of records.submissions) lines.push(['submission', record.id, record.projectId, record.outlet, record.status, record.deadline ?? record.createdAt.slice(0, 10), '', '', '', record.notes].map(escape).join(','));
  for (const record of records.wholesaleOrders) lines.push(['wholesale', record.id, record.projectId, record.account, record.status, record.dueAt ?? record.createdAt.slice(0, 10), record.amount ?? '', record.currency, record.terms ?? '', record.notes].map(escape).join(','));
  return lines.join('\n');
}
