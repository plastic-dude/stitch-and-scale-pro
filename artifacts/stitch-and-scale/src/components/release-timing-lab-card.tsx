import { useMemo, useState, useEffect } from 'react';
import { getLabStatCopy, type LabStatCopy } from '@/lib/lab-stat-copy';
import { useSettings } from '@/context/SettingsContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CalendarDays, Flag, Lightbulb, TrendingUp } from 'lucide-react';
import { PatternProject } from '@/lib/grading-engine';
import { RELEASE_TIMING_COPY } from '@/lib/release-timing-copy';
import { projectStorage } from '@/lib/storage-lib';
import {
  analyzeReleaseTiming,
  CATEGORY_AFFINITY,
  DEFAULT_RELEASE,
  MONTH_NAMES,
  fmt$,
  type ReleaseTimingInput,
} from '@/lib/release-timing-lab';

const STORAGE_KEY = 'stitch-and-scale-release-v1';

type StoredState = ReleaseTimingInput & { ts?: number };

function defaultStored(): StoredState {
  return { ...DEFAULT_RELEASE, promo: { ...DEFAULT_RELEASE.promo } };
}

function loadStored(handle: ReturnType<typeof projectStorage<StoredState>>): StoredState {
  const parsed = handle.read();
  if (parsed) {
    return { ...defaultStored(), ...parsed, promo: { ...defaultStored().promo, ...parsed.promo }, ts: undefined };
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
  v.startsWith('Hold for') ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30' :
  v.startsWith("This season's") ? 'bg-amber-500/15 text-amber-700 border-amber-500/30' :
  v.startsWith('Ship when') ? 'bg-sky-500/15 text-sky-700 border-sky-500/30' :
  v.startsWith('No clear') ? 'bg-accent/50 text-foreground border-border' :
  'bg-emerald-500/15 text-emerald-700 border-emerald-500/30';

const categoryOptions = Object.entries(CATEGORY_AFFINITY).map(([k, v]) => ({ value: k, label: v.label }));

export function ReleaseTimingLabCard({ project }: { project: PatternProject }) {
  const handle = useMemo(() => projectStorage<StoredState>('release-timing', project.id, [STORAGE_KEY]), [project.id]);
  const [input, setInput] = useState<ReleaseTimingInput>(() => loadStored(handle));
  const { language } = useSettings();
  const ls: LabStatCopy = getLabStatCopy(language);
  const copyText = RELEASE_TIMING_COPY[language];

  useEffect(() => {
    setInput(loadStored(handle));
  }, [handle]);

  const persist = (next: ReleaseTimingInput) => {
    setInput(next);
    handle.write({ ...next, ts: Date.now() });
  };

  const result = useMemo(() => analyzeReleaseTiming(input), [input]);
  const set = <K extends keyof ReleaseTimingInput>(k: K, v: ReleaseTimingInput[K]) => persist({ ...input, [k]: v });
  const setPromo = (k: keyof typeof input.promo, v: number) => persist({ ...input, promo: { ...input.promo, [k]: v } });

  const bestMult = Math.max(...result.monthScores.filter(s => s.readyOnTime).map(s => s.effectiveMultiplier), 0);
  const readyMonths = result.monthScores.filter(s => s.readyOnTime);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base"><CalendarDays className="size-4" />Release Timing Lab</CardTitle>
        <CardDescription>When should this design actually drop? Launch checklists schedule a date and SEO tools optimize tags, but nobody prices the season itself. Knitwear demand is strongly seasonal — the October–December holiday push is most designers' highest-revenue window and summer is the lull — and a design dropped out of season earns a fraction of its potential because buyers simply don't search for it. This lab scores every month of your window, prices the 3–4 month backward-planning rule, and checks your launch promo against the ≤15% / one-week / include-a-weekend consensus.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <section className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-1.5"><TrendingUp className="size-4" />Design & calendar</h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            <SelectField id="rt-month" label={ls.earliestLaunchThisMonth} value={String(input.currentMonth)} options={MONTH_NAMES.map((n, i) => ({ value: String(i), label: n }))} onChange={v => set('currentMonth', parseInt(v, 10))} />
            <NumField id="rt-lead" label={copyText.designLeadTime} value={input.designLeadMonths} onChange={n => set('designLeadMonths', Math.max(0, n))} suffix="mo" />
            <SelectField id="rt-cat" label={ls.designCategory} value={input.categoryKey} options={categoryOptions} onChange={v => set('categoryKey', v)} />
            <NumField id="rt-price" label={copyText.patternPrice} value={input.price} onChange={n => set('price', n)} min={0.5} step={0.5} suffix="$" />
            <NumField id="rt-base" label={copyText.baselineSalesMonthFlat} value={input.baseMonthlySales} onChange={n => set('baseMonthlySales', n)} min={0} />
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <NumField id="rt-sunk" label={copyText.hoursSunkSoFar} value={input.sunkHours} onChange={n => set('sunkHours', Math.max(0, n))} />
            <NumField id="rt-rate" label={ls.opportunityRate} value={input.hourlyRate} onChange={n => set('hourlyRate', n)} suffix="$/hr" />
            <NumField id="rt-comp" label={copyText.competingDropExposure01} value={input.competingDropExposure} onChange={n => set('competingDropExposure', Math.min(1, Math.max(0, n)))} min={0} max={1} step={0.05} />
            <NumField id="rt-horizon" label={copyText.lookAheadHorizon} value={input.horizonMonths} onChange={n => set('horizonMonths', Math.min(12, Math.max(1, n)))} min={1} max={12} suffix="mo" />
          </div>
          <p className="text-xs text-muted-foreground italic">Season rhythm: fall minds shift in August, the holiday push (Oct–Dec) peaks at roughly +40% demand, spring surges again in Jan–Mar, and Jun–Aug is the lull (−15–25%). Designers plan backward — a holiday sweater should be live by September, which means it needs 3–4 months of lead time minimum.</p>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-1.5"><CalendarDays className="size-4" />Launch promo mechanics</h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            <NumField id="rt-disc" label={copyText.launchDiscount} value={input.promo.discountShare * 100} onChange={n => setPromo('discountShare', Math.min(1, Math.max(0, n / 100)))} min={0} max={100} step={1} suffix="%" />
            <NumField id="rt-days" label={copyText.discountDuration} value={input.promo.discountDays} onChange={n => setPromo('discountDays', Math.max(1, n))} suffix="days" />
            <NumField id="rt-wkend" label={copyText.weekendCoverage} value={input.promo.weekendShare * 100} onChange={n => setPromo('weekendShare', Math.min(1, Math.max(0, n / 100)))} min={0} max={100} step={5} suffix="%" />
            <NumField id="rt-lift" label={copyText.expectedVolumeLift} value={input.promo.volumeLift} onChange={n => setPromo('volumeLift', Math.max(0.5, n))} step={0.05} suffix="×" />
            <div className="flex items-end">
              <p className="text-xs text-muted-foreground leading-4">Consensus: ≤15% off, ≤1 week, and always include a weekend — discounts farm queue momentum, not launch-week profit.</p>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-1.5"><TrendingUp className="size-4" />Month-by-month scoring</h3>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-xs">
              <thead className="bg-accent/60 text-muted-foreground">
                <tr>
                  <th className="p-2 text-left">Month</th>
                  <th className="p-2 text-left">Season</th>
                  <th className="p-2 text-right">Demand mult.</th>
                  <th className="p-2 text-right">Expected units</th>
                  <th className="p-2 text-right">Expected revenue</th>
                  <th className="p-2 text-left">Ready?</th>
                </tr>
              </thead>
              <tbody>
                {result.monthScores.map(s => (
                  <tr key={`${s.month}-${s.name}`} className={`border-t ${s.month === result.bestMonth.month ? 'bg-emerald-500/10' : ''}`}>
                    <td className="p-2 font-medium">{s.name}</td>
                    <td className="p-2 text-muted-foreground">{s.effectiveMultiplier >= 1.25 ? 'Holiday push' : s.effectiveMultiplier >= 1.1 ? 'Surge' : s.effectiveMultiplier >= 0.95 ? 'Mild' : 'Lull'}</td>
                    <td className="p-2 text-right">{s.effectiveMultiplier.toFixed(2)}×</td>
                    <td className="p-2 text-right">{s.readyOnTime ? s.expectedUnits.toFixed(1) : '—'}</td>
                    <td className={`p-2 text-right ${s.readyOnTime ? '' : 'text-muted-foreground'}`}>{s.readyOnTime ? fmt$(s.expectedRevenue) : 'designing'}</td>
                    <td className="p-2">{s.readyOnTime ? <span className="text-emerald-700">ready</span> : <span className="text-muted-foreground">writing</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatBox label={ls.bestLaunchMonth} value={`${result.bestMonth.name} (rank ${result.bestMonth.rank})`} tone={readyMonths.length ? 'good' : 'default'} />
            <StatBox label={ls.twelveMoRevenueBestWindow} value={fmt$(result.bestMonth.expectedRevenue)} tone="good" />
            <StatBox label={ls.asSoonAsReadyValue} value={fmt$(result.bestMonth.expectedRevenue - result.waitValue)} />
            <StatBox label={ls.mistimingCostBestVsWorst} value={fmt$(result.mistimingCost)} tone={result.mistimingCost > 300 ? 'warn' : 'default'} />
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatBox label={ls.launchWeekDiscountedNet} value={fmt$(result.promoOutcome.promoNetRevenue)} />
            <StatBox label={ls.launchWeekFullPriceNet} value={fmt$(result.promoOutcome.fullPriceNetRevenue)} />
            <StatBox label={ls.promoAddsRevenue} value={result.promoOutcome.promoAddsRevenue ? 'yes, +' + fmt$(result.promoOutcome.promoDelta) : 'no, ' + fmt$(result.promoOutcome.promoDelta)} tone={result.promoOutcome.promoAddsRevenue ? 'good' : result.promoOutcome.promoDelta < -input.baseMonthlySales * bestMult / 4 * input.price * 0.05 ? 'bad' : 'warn'} />
            <StatBox label={ls.peakDemandMultiplier} value={`${bestMult.toFixed(2)}×`} />
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
