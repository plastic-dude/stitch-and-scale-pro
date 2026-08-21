import { useMemo, useState, useEffect } from 'react';
import { getLabStatCopy, type LabStatCopy } from '@/lib/lab-stat-copy';
import { useSettings } from '@/context/SettingsContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Flag, Layers, Lightbulb, Minus, Plus, Tent } from 'lucide-react';
import { PatternProject } from '@/lib/grading-engine';
import { RETREAT_TEACHING_COPY } from '@/lib/retreat-teaching-copy';
import { projectStorage } from '@/lib/storage-lib';
import {
  analyzeRetreatTeaching,
  DEFAULT_RETREAT,
  fmt$,
  type RetreatInput,
  type RetreatRole,
} from '@/lib/retreat-teaching-lab';

const STORAGE_KEY = 'stitch-and-scale-retreat-v1';

type StoredState = RetreatInput & { ts?: number };

function defaultStored(): StoredState {
  return {
    ...DEFAULT_RETREAT,
    classes: DEFAULT_RETREAT.classes.map(c => ({ ...c })),
  };
}

function loadStored(handle: ReturnType<typeof projectStorage<StoredState>>): StoredState {
  const parsed = handle.read();
  if (parsed) {
    return {
      ...defaultStored(),
      ...parsed,
      classes: ((parsed as StoredState).classes ?? defaultStored().classes).map(
        c => ({ ...defaultStored().classes[0], ...c }),
      ),
      ts: undefined,
    };
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

function SelectField({ id, label, value, options, onChange }: {
  id: string; label: string; value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs">{label}</Label>
      <select id={id} value={value}
        onChange={e => onChange(e.target.value)}
        className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
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
  v.startsWith('Premium tier') ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30' :
  v.startsWith('Worth it') ? 'bg-sky-500/15 text-sky-700 border-sky-500/30' :
  v.startsWith('Take it as') ? 'bg-sky-500/15 text-sky-700 border-sky-500/30' :
  v.startsWith('Host only') ? 'bg-amber-500/15 text-amber-700 border-amber-500/30' :
  v.startsWith('Not worth') ? 'bg-destructive/10 text-destructive border-destructive/30' :
  v.startsWith('Walk away') ? 'bg-destructive/10 text-destructive border-destructive/30' :
  'bg-amber-500/15 text-amber-700 border-amber-500/30';

export function RetreatTeachingLabCard({ project }: { project: PatternProject }) {
  const handle = useMemo(() => projectStorage<StoredState>('retreat-teaching', project.id, [STORAGE_KEY]), [project.id]);
  const [input, setInput] = useState<RetreatInput>(() => loadStored(handle));
  const { language } = useSettings();
  const ls: LabStatCopy = getLabStatCopy(language);
  const copyText = RETREAT_TEACHING_COPY[language];

  useEffect(() => {
    setInput(loadStored(handle));
  }, [handle]);

  const persist = (next: RetreatInput) => {
    setInput(next);
    handle.write({ ...next, ts: Date.now() });
  };

  const result = useMemo(() => analyzeRetreatTeaching(input), [input]);
  const set = <K extends keyof RetreatInput>(k: K, v: RetreatInput[K]) => persist({ ...input, [k]: v });
  const setClass = (i: number, patch: Partial<(typeof input.classes)[number]>) =>
    persist({ ...input, classes: input.classes.map((c, idx) => (idx === i ? { ...c, ...patch } : c)) });
  const addClass = () =>
    persist({ ...input, classes: [...input.classes, { title: 'New class', hours: 4, developmentHours: 8 }] });
  const removeClass = (i: number) =>
    persist({ ...input, classes: input.classes.filter((_, idx) => idx !== i) });

  const realistic = result.scenarios[1];
  const isHost = input.role === 'host';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base"><Tent className="size-4" />Retreat & Cruise Teaching Lab</CardTitle>
        <CardDescription>Should you say yes as a guest teacher at someone's retreat or cruise, or host your own — and at what price does the trip actually pay? Top instructors run a $125/class-hr guest baseline plus travel, meals and lodging (and it still nets $25–30/hr after 5–40 hrs of class development per class), while host retreats price to a $100/person/day profit floor against minimum attendance. Verified market tuition runs from $235 weekend formats through $1,075 tuition-only 3-day retreats to $2,999 all-inclusive. This lab models guest-fee vs host economics, development and prep hours, materials fees, cruise-design sales, alumni conversion value, and cancellation risk — so you never accept an "exposure" deal again.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <section className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-1.5"><Layers className="size-4" />{ls.yourRoleAndTrip}</h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <SelectField id="rt-role" label={ls.yourRole} value={input.role}
              options={[
                { value: 'guest', label: ls.guestTeacherAtRetreat },
                { value: 'cruise-guest', label: ls.featuredTeacherOnCruise },
                { value: 'host', label: ls.hostingMyOwnRetreat },
              ]}
              onChange={v => set('role', v as RetreatRole)} />
            <NumField id="rt-days" label={copyText.tripLength} value={input.days} onChange={n => set('days', Math.max(1, Math.min(14, n)))} min={1} max={14} suffix="days" />
            <NumField id="rt-min" label={copyText.studentsMinimumCancelLine} value={input.studentsMin} onChange={n => set('studentsMin', Math.max(1, n))} min={1} suffix="ppl" />
            <NumField id="rt-real" label={copyText.realisticStudents} value={input.studentsReal} onChange={n => set('studentsReal', Math.max(1, n))} min={1} suffix="ppl" />
            <NumField id="rt-best" label={copyText.bestCaseStudents} value={input.studentsBest} onChange={n => set('studentsBest', Math.max(1, n))} min={1} suffix="ppl" />
            <NumField id="rt-rate" label={ls.opportunityRate} value={input.hourlyRate} onChange={n => set('hourlyRate', Math.max(1, n))} suffix="$/hr" />
            <NumField id="rt-travel" label={copyText.travelHoursRoundTrip} value={input.travelHours} onChange={n => set('travelHours', Math.max(0, n))} suffix="hrs" />
            <NumField id="rt-extra" label={copyText.extraWorkingHrsAt} value={input.extraWorkingHours} onChange={n => set('extraWorkingHours', Math.max(0, n))} suffix="hrs" />
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-1.5"><Tent className="size-4" />{ls.yourClasses}</h3>
          <div className="space-y-2">
            {input.classes.map((c, i) => (
              <div key={i} className="grid grid-cols-[1.4fr_1fr_1fr_auto] items-end gap-2">
                <div className="space-y-1.5">
                  <Label htmlFor={`rt-title-${i}`} className="text-xs">{ls.classTitle}</Label>
                  <Input id={`rt-title-${i}`} value={c.title}
                    onChange={e => setClass(i, { title: e.target.value })}
                    className="text-sm" placeholder={ls.classTitleExample} />
                </div>
                <NumField id={`rt-hours-${i}`} label={copyText.contactHours} value={c.hours} onChange={n => setClass(i, { hours: Math.max(0.5, n) })} min={0.5} step={0.5} suffix="hrs" />
                <NumField id={`rt-dev-${i}`} label={copyText.developmentHours} value={c.developmentHours} onChange={n => setClass(i, { developmentHours: Math.max(0, n) })} suffix="hrs" />
                {input.classes.length > 1 ? (
                  <Button type="button" variant="ghost" size="icon" className="mb-0.5 h-9 w-9" onClick={() => removeClass(i)} aria-label={`Remove class ${i + 1}`}>
                    <Minus className="size-4" />
                  </Button>
                ) : <div />}
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addClass} className="w-full">
              <Plus className="size-4" /> {ls.addAnotherClass}
            </Button>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-1.5"><Tent className="size-4" />
            {isHost ? ls.hostEconomics : ls.compensationAndCompPackage}</h3>
          {isHost ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <NumField id="rt-tuition" label={copyText.tuitionPerStudent} value={input.tuitionPerStudent} onChange={n => set('tuitionPerStudent', Math.max(0, n))} suffix="$" />
              <NumField id="rt-matfee" label={copyText.materialsFeePerStudent} value={input.materialsFeePerStudent} onChange={n => set('materialsFeePerStudent', Math.max(0, n))} suffix="$" />
              <NumField id="rt-matcost" label={copyText.materialsCostPerStudent} value={input.materialsCostPerStudent} onChange={n => set('materialsCostPerStudent', Math.max(0, n))} suffix="$" />
              <NumField id="rt-var" label={copyText.yourVariableCostPer} value={input.hostVariablePerStudent} onChange={n => set('hostVariablePerStudent', Math.max(0, n))} suffix="$" />
              <NumField id="rt-fixed" label={copyText.fixedCostsVenueMinimum} value={input.fixedCosts} onChange={n => set('fixedCosts', Math.max(0, n))} suffix="$" />
              <NumField id="rt-prep" label={copyText.prepHoursPerClass} value={input.prepRatio} onChange={n => set('prepRatio', Math.max(0, Math.min(4, n)))} step={0.25} suffix="hrs/hr" />
              <NumField id="rt-design" label={copyText.cruiseDesignPatternUnitsSold} value={input.cruiseDesignUnits} onChange={n => set('cruiseDesignUnits', Math.max(0, n))} />
              <NumField id="rt-designp" label={copyText.cruiseDesignPrice} value={input.cruiseDesignPrice} onChange={n => set('cruiseDesignPrice', Math.max(0, n))} suffix="$" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <NumField id="rt-fee" label={copyText.cashFeePerClass} value={input.feePerClassHour} onChange={n => set('feePerClassHour', Math.max(0, n))} suffix="$/hr" />
              <NumField id="rt-reimb" label={copyText.travelReimbursement} value={input.travelReimbursement} onChange={n => set('travelReimbursement', Math.max(0, n))} suffix="$" />
              <NumField id="rt-comp" label={copyText.valueOfCompedLodging} value={input.lodgingMealComp} onChange={n => set('lodgingMealComp', Math.max(0, n))} suffix="$" />
              <NumField id="rt-design" label={copyText.cruiseDesignPatternUnitsSold} value={input.cruiseDesignUnits} onChange={n => set('cruiseDesignUnits', Math.max(0, n))} />
              <NumField id="rt-designp" label={copyText.cruiseDesignPrice} value={input.cruiseDesignPrice} onChange={n => set('cruiseDesignPrice', Math.max(0, n))} suffix="$" />
              <NumField id="rt-prep" label={copyText.prepHoursPerClass} value={input.prepRatio} onChange={n => set('prepRatio', Math.max(0, Math.min(4, n)))} step={0.25} suffix="hrs/hr" />
              <NumField id="rt-leads" label={copyText.alumniLeadsPerStudent} value={input.leadsPerStudent} onChange={n => set('leadsPerStudent', Math.max(0, Math.min(1, n)))} step={0.05} />
              <NumField id="rt-leadv" label={copyText.valuePerLead1st} value={input.leadValue} onChange={n => set('leadValue', Math.max(0, n))} suffix="$" />
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-1.5"><Tent className="size-4" />{ls.dealMathAndScenarioTable}</h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatBox label={ls.realisticNetCash} value={fmt$(realistic?.netCash ?? 0)} tone={(realistic?.netCash ?? 0) >= 0 ? 'good' : 'bad'} />
            <StatBox label={ls.effectivePerHrAllIn} value={(realistic?.effectiveHourly ?? 0).toFixed(1)} tone={realistic ? (realistic.effectiveHourly >= input.hourlyRate ? 'good' : realistic.effectiveHourly >= 35 ? 'warn' : 'bad') : 'default'} />
            <StatBox label={ls.guestRateBenchmark} value={`${result.guestRateBenchmark}$/class-hr`} />
            {isHost ? (
              <StatBox label={ls.breakEvenTargetStudents} value={`${result.breakEvenStudents === Infinity ? '∞' : result.breakEvenStudents} / ${result.targetStudents === Infinity ? '∞' : result.targetStudents}`} tone={result.breakEvenStudents <= input.studentsMin ? 'good' : 'warn'} />
            ) : (
              <StatBox label={ls.alumniConversionValue} value={fmt$(realistic?.conversionValue ?? 0)} />
            )}
          </div>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-xs">
              <thead className="bg-accent/60 text-muted-foreground">
                <tr>
                  <th className="p-2 text-left">Scenario</th>
                  <th className="p-2 text-right">Students</th>
                  <th className="p-2 text-right">Gross</th>
                  <th className="p-2 text-right">Hard costs</th>
                  <th className="p-2 text-right">Net cash</th>
                  <th className="p-2 text-right">+ conversion value</th>
                  <th className="p-2 text-right">All-in hours</th>
                  <th className="p-2 text-right">Effective $/hr</th>
                </tr>
              </thead>
              <tbody>
                {result.scenarios.map(s => (
                  <tr key={s.label} className={`border-t ${s.label === 'realistic' ? 'bg-emerald-500/10' : ''}`}>
                    <td className="p-2 font-medium capitalize">{s.label}</td>
                    <td className="p-2 text-right">{s.students}</td>
                    <td className="p-2 text-right">{fmt$(s.gross)}</td>
                    <td className="p-2 text-right">{fmt$(s.hardCosts)}</td>
                    <td className={`p-2 text-right ${s.netCash >= 0 ? 'text-emerald-700' : 'text-destructive'}`}>{fmt$(s.netCash)}</td>
                    <td className="p-2 text-right">{fmt$(s.conversionValue)}</td>
                    <td className="p-2 text-right">{s.totalHours.toFixed(0)}</td>
                    <td className="p-2 text-right">{s.effectiveHourly.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {result.scenarios.length === 0 && (
            <p className="text-xs text-muted-foreground">Add at least one class with hours for the lab to model the trip.</p>
          )}
          <p className="text-xs text-muted-foreground leading-4">Market tuition check: budget formats land around $118/day (e.g. $235 weekend with meals), tuition-only 3-day retreats run ~$358/day, and all-inclusive destination formats reach $750/day ($2,999/4 days). Hourly benchmark: $125/class-hr + travel and lodging is the top-of-market guest rate.</p>
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
