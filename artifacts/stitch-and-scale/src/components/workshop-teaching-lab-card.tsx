import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Flag, Lightbulb, Presentation, Scale, TrendingUp } from 'lucide-react';
import { PatternProject } from '@/lib/grading-engine';
import { projectStorage } from '@/lib/storage-lib';
import {
  analyzeWorkshopTeaching,
  DEFAULT_WORKSHOP,
  fmt$,
  type WorkshopTeachingInput,
} from '@/lib/workshop-teaching-lab';

const STORAGE_KEY = 'stitch-and-scale-workshop-v1';

type StoredState = WorkshopTeachingInput & { ts?: number };

function defaultStored(): StoredState {
  return { ...DEFAULT_WORKSHOP, deal: { ...DEFAULT_WORKSHOP.deal } };
}

function loadStored(handle: ReturnType<typeof projectStorage<StoredState>>): StoredState {
  const parsed = handle.read();
  if (parsed) {
    return { ...defaultStored(), ...parsed, deal: { ...defaultStored().deal, ...parsed.deal }, ts: undefined };
  }
  return defaultStored();
}

function NumField({ id, label, value, onChange, min = 0, max, step = 1, suffix }: {
  id: string; label: string; value: number;
  onChange: (n: number) => void; min?: number; max?: number; step?: number; suffix?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs">{label}</Label>
      <div className="relative">
        <Input id={id} type="number" min={min} {...(max !== undefined ? { max } : {})} step={step}
          value={value}
          onChange={e => {
            const n = parseFloat(e.target.value);
            if (Number.isFinite(n)) onChange(n);
          }}
          className="text-sm pr-8" />
        {suffix ? <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{suffix}</span> : null}
      </div>
    </div>
  );
}

function StatBox({ label, value, tone = 'default' }: { label: string; value: string; tone?: 'default' | 'good' | 'warn' | 'bad' }) {
  const toneCls =
    tone === 'good' ? 'text-emerald-700 bg-emerald-500/10 border-emerald-500/30' :
    tone === 'warn' ? 'text-amber-700 bg-amber-500/10 border-amber-500/30' :
    tone === 'bad' ? 'text-destructive bg-destructive/10 border-destructive/30' :
    'text-foreground bg-accent/50 border-border';
  return (
    <div className={`rounded-md border p-3 ${toneCls}`}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}

const verdictColor = (v: string) =>
  v.startsWith('Great deal') ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30' :
  v.startsWith('Worth teaching') ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30' :
  v.startsWith('Borderline') ? 'bg-amber-500/15 text-amber-700 border-amber-500/30' :
  v.startsWith('Teach for audience') ? 'bg-amber-500/10 text-amber-700 border-amber-500/30' :
  v.startsWith('Not confirmed') ? 'bg-sky-500/15 text-sky-700 border-sky-500/30' :
  'bg-destructive/10 text-destructive border-destructive/30';

export function WorkshopTeachingLabCard({ project }: { project: PatternProject }) {
  const handle = useMemo(() => projectStorage<StoredState>('workshop', project.id, [STORAGE_KEY]), [project.id]);
  const [input, setInput] = useState<WorkshopTeachingInput>(() => loadStored(handle));

  useEffect(() => {
    setInput(loadStored(handle));
  }, [handle]);

  const persist = (next: WorkshopTeachingInput) => {
    setInput(next);
    handle.write({ ...next, ts: Date.now() });
  };

  const result = useMemo(() => analyzeWorkshopTeaching(input), [input]);
  const setDeal = (k: keyof typeof input.deal, v: number) => persist({ ...input, deal: { ...input.deal, [k]: v } });
  const set = <K extends keyof WorkshopTeachingInput>(k: K, v: WorkshopTeachingInput[K]) => persist({ ...input, [k]: v });

  const perStudentNet = input.deal.feePerStudent * (1 - input.deal.venueCut) - input.deal.materialsPerStudent;
  const hourlyTone = (h: number) =>
    h >= input.hourlyRate * 1.5 ? 'good' : h >= input.hourlyRate ? 'good' : h >= input.hourlyRate * 0.6 ? 'warn' : 'bad';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base"><Presentation className="size-4" />Workshop Teaching Lab</CardTitle>
        <CardDescription>Is this in-person class worth your hours — and where does the money actually go? Festival contracts now pay per student with no guaranteed floor and the teacher funding their own travel (#FairFiberWage exists for a reason), while LYS classes keep most of the ticket with zero travel. This lab prices the whole event: deal net, break-even students, slot-risk exposure, follow-up pattern attach, and the same hours rerouted to pattern work.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <section className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-1.5"><Scale className="size-4" />The deal on the table</h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            <NumField id="wt-fee" label="Fee per student" value={input.deal.feePerStudent} onChange={n => setDeal('feePerStudent', n)} min={0} suffix="$" />
            <NumField id="wt-cut" label="Venue / organizer cut" value={input.deal.venueCut} onChange={n => setDeal('venueCut', Math.min(1, Math.max(0, n)))} step={0.01} suffix="%" />
            <NumField id="wt-guarantee" label="Guaranteed minimum payout" value={input.deal.guarantee} onChange={n => setDeal('guarantee', Math.max(0, n))} min={0} suffix="$" />
            <NumField id="wt-travel" label="Travel + lodging total" value={input.deal.travelCost} onChange={n => setDeal('travelCost', Math.max(0, n))} suffix="$" />
            <NumField id="wt-mats" label="Materials you cover / student" value={input.deal.materialsPerStudent} onChange={n => setDeal('materialsPerStudent', Math.max(0, n))} suffix="$" />
          </div>
          <p className="text-xs text-muted-foreground italic">Net per student at these terms: {fmt$(perStudentNet)}. Festival benchmarks: $22–45/student half-days, $60–90/student full-days after typical 20–40% cuts. Deals without a floor are standard post-#FairFiberWage — that floor is what protects you at travel-day slots.</p>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-1.5"><Presentation className="size-4" />Class & your hours</h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <NumField id="wt-min" label="Confirmed minimum students" value={input.studentsMin} onChange={n => set('studentsMin', Math.max(1, n))} min={1} />
            <NumField id="wt-real" label="Realistic expected students" value={input.studentsRealistic} onChange={n => set('studentsRealistic', Math.max(1, n))} min={1} />
            <NumField id="wt-max" label="Venue max capacity" value={input.studentsMax} onChange={n => set('studentsMax', Math.max(1, n))} min={1} />
            <NumField id="wt-class" label="Class hours" value={input.classHours} onChange={n => set('classHours', Math.max(0.5, n))} step={0.5} suffix="hr" />
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <NumField id="wt-prep" label="Prep hours (new content)" value={input.prepHours} onChange={n => set('prepHours', Math.max(0, n))} />
            <NumField id="wt-rate" label="Opportunity rate" value={input.hourlyRate} onChange={n => set('hourlyRate', n)} suffix="$/hr" />
            <NumField id="wt-attach" label="Follow-up pattern attach" value={input.followUpAttach} onChange={n => set('followUpAttach', Math.min(1, Math.max(0, n)))} step={0.01} suffix="%" />
            <NumField id="wt-attachp" label="Follow-up pattern price" value={input.followUpPrice} onChange={n => set('followUpPrice', Math.max(0, n))} suffix="$" />
          </div>
          <p className="text-xs text-muted-foreground italic">Prep for new content typically runs 2–4× the class hours; repeats run 1–2×. Attendees are warm buyers — 10–30% attach to the class pattern at full price is a normal follow-up, and LYS classes add immediate project-yarn sales on top.</p>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-1.5"><TrendingUp className="size-4" />Deal math — worst / realistic / best</h3>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-xs">
              <thead className="bg-accent/60 text-muted-foreground">
                <tr>
                  <th className="p-2 text-left">Scenario</th>
                  <th className="p-2 text-right">Students</th>
                  <th className="p-2 text-right">Gross tickets</th>
                  <th className="p-2 text-right">Deal net</th>
                  <th className="p-2 text-right">Pattern attach</th>
                  <th className="p-2 text-right">Total value</th>
                  <th className="p-2 text-right">Effective /hr</th>
                </tr>
              </thead>
              <tbody>
                {result.snapshots.map(s => (
                  <tr key={s.label} className={`border-t ${s.label === 'realistic' ? 'bg-emerald-500/10' : ''}`}>
                    <td className="p-2 font-medium capitalize">{s.label}</td>
                    <td className="p-2 text-right">{s.students}</td>
                    <td className="p-2 text-right">{fmt$(s.grossRevenue)}</td>
                    <td className={`p-2 text-right ${s.netDeal < 0 ? 'text-destructive' : ''}`}>{fmt$(s.netDeal)}</td>
                    <td className="p-2 text-right">{fmt$(s.followUpValue)}</td>
                    <td className="p-2 text-right font-medium">{fmt$(s.totalValue)}</td>
                    <td className={`p-2 text-right font-medium ${s.effectiveHourly >= input.hourlyRate ? 'text-emerald-700' : 'text-destructive'}`}>{fmt$(s.effectiveHourly)}/hr</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatBox label="Break-even students" value={result.breakEvenStudents === Infinity ? 'not reachable' : String(result.breakEvenStudents)} tone={result.breakEvenStudents === Infinity ? 'bad' : 'default'} />
            <StatBox label="Students to clear your rate" value={result.profitableStudents === Infinity ? 'not reachable' : String(result.profitableStudents)} tone={result.profitableStudents === Infinity ? 'bad' : 'default'} />
            <StatBox label="Realistic effective rate" value={fmt$(result.realisticHourly) + '/hr'} tone={hourlyTone(result.realisticHourly)} />
            <StatBox label="Worst-case effective rate" value={fmt$(result.worstHourly) + '/hr'} tone={result.worstHourly >= 0 ? (result.worstHourly >= input.hourlyRate ? 'good' : 'warn') : 'bad'} />
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <StatBox label="Travel share of realistic take-home" value={result.travelBurden > 0 ? (result.travelBurden * 100).toFixed(0) + '%' : '—'} tone={result.travelBurden > 0.4 ? 'warn' : 'default'} />
            <StatBox label="Realistic vs opportunity cost" value={fmt$(result.opportunityGap)} tone={result.opportunityGap >= 0 ? 'good' : 'bad'} />
            <StatBox label="Hours invested (prep + class)" value={String(result.snapshots[1].totalHours) + ' hr'} />
          </div>
        </section>

        {result.flags.length > 0 && (
          <section className="space-y-2">
            <h3 className="text-sm font-semibold flex items-center gap-1.5"><Flag className="size-4" />Watch-outs</h3>
            <div className="flex flex-wrap gap-2">
              {result.flags.map(f => (
                <Badge key={f.code} variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-700 gap-1.5 py-1.5">
                  <AlertTriangle className="size-3" />
                  <span className="font-medium">{f.code}</span> — {f.title}
                </Badge>
              ))}
            </div>
          </section>
        )}

        <section className={`rounded-md border p-4 ${verdictColor(result.verdict)}`}>
          <div className="flex items-center gap-2 font-semibold"><Lightbulb className="size-4" />{result.verdict}</div>
          <p className="mt-1.5 text-sm">{result.verdictNote}</p>
        </section>
      </CardContent>
    </Card>
  );
}
