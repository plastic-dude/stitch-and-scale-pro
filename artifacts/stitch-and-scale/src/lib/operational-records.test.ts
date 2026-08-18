import { describe, expect, it } from 'vitest';
import {
  EMPTY_OPERATIONAL_RECORDS,
  addSample,
  addSubmission,
  addTestKnit,
  addWholesaleOrder,
  exportOperationalRecordsCsv,
  restoreOperationalRecords,
  serializeOperationalRecords,
  operationalRecordCounts,
  removeOperationalRecord,
  updateOperationalRecord,
} from './operational-records';

describe('operational records', () => {
  it('keeps required record identity explicit', () => {
    const records = EMPTY_OPERATIONAL_RECORDS('project-1');
    expect(addSample(records, { name: '   ', status: 'in-studio', location: '', notes: '' })).toEqual(records);
    expect(addTestKnit(records, { tester: '', size: 'M', yarn: '', status: 'planned', notes: '' })).toEqual(records);
    expect(addSubmission(records, { outlet: '', status: 'planned', notes: '' })).toEqual(records);
    expect(addWholesaleOrder(records, { account: '', currency: 'USD', status: 'draft', notes: '' })).toEqual(records);
  });

  it('creates all four record types with project scope and normalized amount', () => {
    let records = EMPTY_OPERATIONAL_RECORDS('project-1');
    records = addSample(records, { name: 'Blue sample', status: 'on-loan', location: 'Market stall', notes: '' });
    records = addTestKnit(records, { tester: 'Ari', size: 'M', yarn: 'Wool', status: 'active', notes: '' });
    records = addSubmission(records, { outlet: 'Magazine', status: 'submitted', deadline: '2026-09-01', notes: '' });
    records = addWholesaleOrder(records, { account: 'Shop', currency: 'USD', amount: 120.456, status: 'sent', notes: '' });
    expect(records.samples[0].projectId).toBe('project-1');
    expect(records.testKnits[0].projectId).toBe('project-1');
    expect(records.submissions[0].projectId).toBe('project-1');
    expect(records.wholesaleOrders[0].amount).toBe(120.46);
    expect(operationalRecordCounts(records)).toEqual({ samples: 1, testKnits: 1, submissions: 1, wholesaleOrders: 1 });
  });

  it('exports all operational record families with stable identifiers', () => {
    let records = EMPTY_OPERATIONAL_RECORDS('project-1');
    records = addSample(records, { name: 'Sample', status: 'in-studio', location: 'Studio', notes: '' });
    records = addTestKnit(records, { tester: 'Ari', size: 'M', yarn: 'Wool', status: 'planned', notes: '' });
    records = addSubmission(records, { outlet: 'Magazine', status: 'planned', notes: '' });
    records = addWholesaleOrder(records, { account: 'Shop', currency: 'USD', status: 'draft', notes: '' });
    const csv = exportOperationalRecordsCsv(records);
    expect(csv).toContain('type,id,projectId,primary,status,date,amount,currency,location,notes');
    expect(csv).toContain('sample,');
    expect(csv).toContain('test-knit,');
    expect(csv).toContain('submission,');
    expect(csv).toContain('wholesale,');
  });

  it('round-trips a versioned JSON backup and rejects foreign or corrupt data', () => {
    const records = addSample(EMPTY_OPERATIONAL_RECORDS('project-1'), { name: 'Sample', status: 'in-studio', location: 'Studio', notes: '' });
    const restored = restoreOperationalRecords(serializeOperationalRecords(records), 'project-1');
    expect(restored?.samples[0].name).toBe('Sample');
    expect(restoreOperationalRecords(serializeOperationalRecords(records), 'project-2')).toBeNull();
    expect(restoreOperationalRecords('{not-json', 'project-1')).toBeNull();
  });

  it('updates and removes a record without changing unrelated collections', () => {
    let records = addSample(EMPTY_OPERATIONAL_RECORDS('project-1'), { name: 'Sample', status: 'in-studio', location: '', notes: '' });
    const id = records.samples[0].id;
    const updated = updateOperationalRecord(records, 'samples', id, { status: 'returned', location: 'Studio shelf' });
    expect(updated.samples[0].status).toBe('returned');
    expect(updated.samples[0].location).toBe('Studio shelf');
    const removed = removeOperationalRecord(updated, 'samples', id);
    expect(removed.samples).toHaveLength(0);
    expect(removed.testKnits).toHaveLength(0);
  });
});
