import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { useSettings } from '@/context/SettingsContext';
import { projectStorage } from '@/lib/storage-lib';
import { getOperationalRecordsCopy } from '@/lib/operational-records-copy';
import {
  EMPTY_OPERATIONAL_RECORDS,
  addSample,
  addSubmission,
  addTestKnit,
  addWholesaleOrder,
  exportOperationalRecordsCsv,
  removeOperationalRecord,
  updateOperationalRecord,
  type OperationalRecords,
  type SampleStatus,
  type SubmissionStatus,
  type TestKnitStatus,
  type WholesaleStatus,
} from '@/lib/operational-records';
import type { PatternProject } from '@/lib/grading-engine';

const LEGACY_KEY = 'stitch-and-scale-operational-records-v1';

function StatusSelect({ label, value, options, onChange }: { label: string; value: string; options: { value: string; label: string }[]; onChange: (value: string) => void }) {
  return (
    <label className="space-y-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <NativeSelect value={value} className="min-h-11 w-full" onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </NativeSelect>
    </label>
  );
}

export function OperationalRecordsCard({ project }: { project: PatternProject }) {
  const { language } = useSettings();
  const copy = getOperationalRecordsCopy(language);
  const handle = useMemo(() => projectStorage<OperationalRecords>('operations', project.id, [LEGACY_KEY]), [project.id]);
  const [records, setRecords] = useState<OperationalRecords>(() => handle.read() ?? EMPTY_OPERATIONAL_RECORDS(project.id));
  const [sampleName, setSampleName] = useState('');
  const [sampleLocation, setSampleLocation] = useState('');
  const [sampleStatus, setSampleStatus] = useState<SampleStatus>('in-studio');
  const [tester, setTester] = useState('');
  const [testSize, setTestSize] = useState('');
  const [testYarn, setTestYarn] = useState('');
  const [testStatus, setTestStatus] = useState<TestKnitStatus>('planned');
  const [outlet, setOutlet] = useState('');
  const [deadline, setDeadline] = useState('');
  const [submissionStatus, setSubmissionStatus] = useState<SubmissionStatus>('planned');
  const [account, setAccount] = useState('');
  const [orderAmount, setOrderAmount] = useState('');
  const [orderCurrency, setOrderCurrency] = useState('USD');
  const [dueAt, setDueAt] = useState('');
  const [wholesaleStatus, setWholesaleStatus] = useState<WholesaleStatus>('draft');

  const persist = (next: OperationalRecords) => { setRecords(next); handle.write(next); };
  const exportRecords = () => {
    const blob = new Blob([exportOperationalRecordsCsv(records)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'operational-records.csv';
    link.click();
    URL.revokeObjectURL(url);
  };
  const sampleStatuses = ['in-studio', 'on-loan', 'returned', 'sold', 'missing'] as const;
  const testStatuses = ['planned', 'active', 'complete', 'blocked'] as const;
  const submissionStatuses = ['planned', 'submitted', 'accepted', 'declined', 'withdrawn'] as const;
  const wholesaleStatuses = ['draft', 'sent', 'partially-paid', 'paid', 'overdue', 'cancelled'] as const;
  const statusLabel = (status: string) => copy.statuses[status] ?? status;

  return (
    <Card data-testid="operational-records-card">
      <CardHeader>
        <CardTitle className="text-lg">{copy.title}</CardTitle>
        <CardDescription>{copy.description}</CardDescription>
        <Button type="button" variant="secondary" className="min-h-11 w-full sm:w-auto" onClick={exportRecords}>{copy.exportCsv}</Button>
      </CardHeader>
      <CardContent className="grid min-w-0 gap-4 md:grid-cols-2">
        <section className="min-w-0 rounded-lg border p-3 space-y-3">
          <h3 className="font-semibold text-sm">{copy.samples} ({records.samples.length})</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            <div><Label htmlFor="op-sample-name">{copy.name}</Label><Input id="op-sample-name" value={sampleName} onChange={(event) => setSampleName(event.target.value)} /></div>
            <div><Label htmlFor="op-sample-location">{copy.location}</Label><Input id="op-sample-location" value={sampleLocation} onChange={(event) => setSampleLocation(event.target.value)} /></div>
          </div>
          <StatusSelect label={copy.status} value={sampleStatus} options={sampleStatuses.map((status) => ({ value: status, label: statusLabel(status) }))} onChange={(value) => setSampleStatus(value as SampleStatus)} />
          <Button type="button" className="min-h-11 w-full" onClick={() => { persist(addSample(records, { name: sampleName, status: sampleStatus, location: sampleLocation, notes: '' })); setSampleName(''); setSampleLocation(''); }}>{copy.add}</Button>
          {records.samples.length === 0 ? <p className="text-xs text-muted-foreground">{copy.empty}</p> : records.samples.map((record) => <div key={record.id} className="flex items-center gap-2 rounded border p-2"><span className="min-w-0 flex-1 text-xs truncate">{record.name} · {record.location || '—'}</span><NativeSelect aria-label={`${record.name} ${copy.status}`} className="min-h-11 w-auto text-xs" value={record.status} onChange={(event) => persist(updateOperationalRecord(records, 'samples', record.id, { status: event.target.value as SampleStatus }))}>{sampleStatuses.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}</NativeSelect><button type="button" aria-label={`${copy.remove}: ${record.name}`} className="min-h-11 min-w-11" onClick={() => persist(removeOperationalRecord(records, 'samples', record.id))}>×</button></div>)}
        </section>

        <section className="min-w-0 rounded-lg border p-3 space-y-3">
          <h3 className="font-semibold text-sm">{copy.testKnits} ({records.testKnits.length})</h3>
          <div className="grid gap-2 sm:grid-cols-3">
            <div><Label htmlFor="op-tester">{copy.tester}</Label><Input id="op-tester" value={tester} onChange={(event) => setTester(event.target.value)} /></div>
            <div><Label htmlFor="op-size">{copy.size}</Label><Input id="op-size" value={testSize} onChange={(event) => setTestSize(event.target.value)} /></div>
            <div><Label htmlFor="op-yarn">{copy.yarn}</Label><Input id="op-yarn" value={testYarn} onChange={(event) => setTestYarn(event.target.value)} /></div>
          </div>
          <StatusSelect label={copy.status} value={testStatus} options={testStatuses.map((status) => ({ value: status, label: statusLabel(status) }))} onChange={(value) => setTestStatus(value as TestKnitStatus)} />
          <Button type="button" className="min-h-11 w-full" onClick={() => { persist(addTestKnit(records, { tester, size: testSize, yarn: testYarn, status: testStatus, notes: '' })); setTester(''); setTestSize(''); setTestYarn(''); }}>{copy.add}</Button>
          {records.testKnits.length === 0 ? <p className="text-xs text-muted-foreground">{copy.empty}</p> : records.testKnits.map((record) => <div key={record.id} className="flex items-center gap-2 rounded border p-2"><span className="min-w-0 flex-1 text-xs truncate">{record.tester} · {record.size} · {record.yarn || '—'}</span><NativeSelect aria-label={`${record.tester} ${copy.status}`} className="min-h-11 w-auto text-xs" value={record.status} onChange={(event) => persist(updateOperationalRecord(records, 'testKnits', record.id, { status: event.target.value as TestKnitStatus }))}>{testStatuses.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}</NativeSelect><button type="button" aria-label={`${copy.remove}: ${record.tester}`} className="min-h-11 min-w-11" onClick={() => persist(removeOperationalRecord(records, 'testKnits', record.id))}>×</button></div>)}
        </section>

        <section className="min-w-0 rounded-lg border p-3 space-y-3">
          <h3 className="font-semibold text-sm">{copy.submissions} ({records.submissions.length})</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            <div><Label htmlFor="op-outlet">{copy.outlet}</Label><Input id="op-outlet" value={outlet} onChange={(event) => setOutlet(event.target.value)} /></div>
            <div><Label htmlFor="op-deadline">{copy.deadline}</Label><Input id="op-deadline" type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} /></div>
          </div>
          <StatusSelect label={copy.status} value={submissionStatus} options={submissionStatuses.map((status) => ({ value: status, label: statusLabel(status) }))} onChange={(value) => setSubmissionStatus(value as SubmissionStatus)} />
          <Button type="button" className="min-h-11 w-full" onClick={() => { persist(addSubmission(records, { outlet, deadline: deadline || undefined, status: submissionStatus, notes: '' })); setOutlet(''); setDeadline(''); }}>{copy.add}</Button>
          {records.submissions.length === 0 ? <p className="text-xs text-muted-foreground">{copy.empty}</p> : records.submissions.map((record) => <div key={record.id} className="flex items-center gap-2 rounded border p-2"><span className="min-w-0 flex-1 text-xs truncate">{record.outlet} · {record.deadline || '—'}</span><NativeSelect aria-label={`${record.outlet} ${copy.status}`} className="min-h-11 w-auto text-xs" value={record.status} onChange={(event) => persist(updateOperationalRecord(records, 'submissions', record.id, { status: event.target.value as SubmissionStatus }))}>{submissionStatuses.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}</NativeSelect><button type="button" aria-label={`${copy.remove}: ${record.outlet}`} className="min-h-11 min-w-11" onClick={() => persist(removeOperationalRecord(records, 'submissions', record.id))}>×</button></div>)}
        </section>

        <section className="min-w-0 rounded-lg border p-3 space-y-3">
          <h3 className="font-semibold text-sm">{copy.wholesale} ({records.wholesaleOrders.length})</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            <div><Label htmlFor="op-account">{copy.account}</Label><Input id="op-account" value={account} onChange={(event) => setAccount(event.target.value)} /></div>
            <div><Label htmlFor="op-amount">{copy.amount}</Label><Input id="op-amount" type="number" min="0" step="0.01" value={orderAmount} onChange={(event) => setOrderAmount(event.target.value)} /></div>
            <div><Label htmlFor="op-currency">{copy.currency}</Label><Input id="op-currency" value={orderCurrency} onChange={(event) => setOrderCurrency(event.target.value.toUpperCase())} /></div>
            <div><Label htmlFor="op-due">{copy.dueAt}</Label><Input id="op-due" type="date" value={dueAt} onChange={(event) => setDueAt(event.target.value)} /></div>
          </div>
          <StatusSelect label={copy.status} value={wholesaleStatus} options={wholesaleStatuses.map((status) => ({ value: status, label: statusLabel(status) }))} onChange={(value) => setWholesaleStatus(value as WholesaleStatus)} />
          <Button type="button" className="min-h-11 w-full" onClick={() => { persist(addWholesaleOrder(records, { account, amount: orderAmount ? Number(orderAmount) : undefined, currency: orderCurrency || 'USD', dueAt: dueAt || undefined, status: wholesaleStatus, notes: '' })); setAccount(''); setOrderAmount(''); setDueAt(''); }}>{copy.add}</Button>
          {records.wholesaleOrders.length === 0 ? <p className="text-xs text-muted-foreground">{copy.empty}</p> : records.wholesaleOrders.map((record) => <div key={record.id} className="flex items-center gap-2 rounded border p-2"><span className="min-w-0 flex-1 text-xs truncate">{record.account} · {record.amount !== undefined ? `${record.amount.toFixed(2)} ${record.currency}` : '—'}</span><NativeSelect aria-label={`${record.account} ${copy.status}`} className="min-h-11 w-auto text-xs" value={record.status} onChange={(event) => persist(updateOperationalRecord(records, 'wholesaleOrders', record.id, { status: event.target.value as WholesaleStatus }))}>{wholesaleStatuses.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}</NativeSelect><button type="button" aria-label={`${copy.remove}: ${record.account}`} className="min-h-11 min-w-11" onClick={() => persist(removeOperationalRecord(records, 'wholesaleOrders', record.id))}>×</button></div>)}
        </section>
      </CardContent>
    </Card>
  );
}
