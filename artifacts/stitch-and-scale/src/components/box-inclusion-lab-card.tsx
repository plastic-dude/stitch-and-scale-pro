import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Flag, Package, Layers, Lightbulb } from 'lucide-react';
import { PatternProject } from '@/lib/grading-engine';
import { projectStorage } from '@/lib/storage-lib';
import {
  analyzeBoxInclusion,
  DEFAULT_BOX_INCLUSION,
  type BoxInclusionInput,
} from '@/lib/box-inclusion-lab';

const STORAGE_KEY = 'stitch-and-scale-boxincl-v1';

type StoredState = BoxInclusionInput & { ts?: number };

function defaultStored(): StoredState {
  return { ...DEFAULT_BOX_INCLUSION };
}

function loadStored(handle: ReturnType<typeof projectStorage<StoredState>>): StoredState {
  const parsed = handle.read();
  if (parsed) {
    return { ...defaultStored(), ...parsed, ts: undefined };
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

const FMT = (n: number) => `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
const FMT2 = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const verdictColor = (v: string) =>
  v.startsWith('Skip') ? 'bg-destructive/10 text-destructive border-destructive/30' :
  v.startsWith('Fee below') ? 'bg-amber-500/15 text-amber-700 border-amber-500/30' :
  v.startsWith('Marginally') ? 'bg-amber-500/10 text-amber-700 border-amber-500/30' :
  v.startsWith('Take it') ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30' :
  'bg-sky-500/15 text-sky-700 border-sky-500/30';

export function BoxInclusionLabCard({ project }: { project: PatternProject }) {
  const handle = useMemo(() => projectStorage<StoredState>('box-inclusion', project.id, [STORAGE_KEY]), [project.id]);
  const [input, setInput] = useState<BoxInclusionInput>(() => loadStored(handle));

  useEffect(() => {
    setInput(loadStored(handle));
  }, [handle]);

  const persist = (next: BoxInclusionInput) => {
    setInput(next);
    handle.write({ ...next, ts: Date.now() });
  };

  const result = useMemo(() => analyzeBoxInclusion(input), [input]);
  const set = <K extends keyof BoxInclusionInput>(k: K, v: BoxInclusionInput[K]) => persist({ ...input, [k]: v });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base"><Package className="size-4" />Box Inclusion Lab</CardTitle>
        <CardDescription>A yarn box offers to feature your pattern. Is it a payday, a marketing deal, or the KnitCrate trap? KnitCrate — the biggest US knit box — paid contributing makers a maximum of $3 per item, demanded ~85% wholesale discounts, called itself a "friend to indie dyers and makers", and closed in November 2022 owing $2.95M in SBA loans, with featured designers receiving nothing after closure. This lab prices the offer's fee, exposure funnel, time cost, and exclusivity lock against your self-publish baseline, then discounts everything by the box's survival odds (industry churn averages 10–12% of subscribers monthly; well-run boxes hold under 5%).</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <section className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-1.5"><Layers className="size-4" />The box & the offer</h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="space-y-1.5 col-span-2">
              <Label htmlFor="box-name" className="text-xs">Box name</Label>
              <Input id="box-name" value={input.boxName} onChange={e => set('boxName', e.target.value)} className="text-sm" />
            </div>
            <NumField id="box-subs" label="Subscribers" value={input.subs} onChange={n => set('subs', Math.max(0, Math.round(n)))} min={0} suffix="subs" />
            <NumField id="box-price" label="Box price / month" value={input.boxPrice} onChange={n => set('boxPrice', Math.max(1, n))} min={1} step={0.01} suffix="$" />
            <NumField id="box-fee" label="Flat design fee" value={input.designerFee} onChange={n => set('designerFee', Math.max(0, n))} suffix="$" />
            <NumField id="box-royalty" label="Royalty / box shipped" value={input.royaltyPerBox} onChange={n => set('royaltyPerBox', Math.max(0, n))} step={0.01} suffix="$" />
            <NumField id="box-lock" label="Exclusivity lock" value={input.exclusiveMonths} onChange={n => set('exclusiveMonths', Math.max(0, Math.min(12, n)))} min={0} max={12} suffix="mo" />
            <NumField id="box-hrs" label="Design + swatch hours" value={input.designHours} onChange={n => set('designHours', Math.max(0.5, n))} min={0.5} step={0.5} suffix="hrs" />
            <NumField id="box-rate" label="Your hourly rate" value={input.hourlyRate} onChange={n => set('hourlyRate', Math.max(1, n))} suffix="$/hr" />
            <NumField id="box-wavefreq" label="Feature frequency" value={input.waveFreqMonths} onChange={n => set('waveFreqMonths', Math.max(0.25, n))} step={0.5} suffix="mo/wave" />
            <NumField id="box-goods" label="Free/discounted goods" value={input.extraGoodsValue} onChange={n => set('extraGoodsValue', Math.max(0, n))} suffix="$" />
            <NumField id="box-health" label="Box health (0 = frail / 1 = stable)" value={input.boxHealth} onChange={n => set('boxHealth', Math.max(0, Math.min(1, n)))} step={0.05} />
            <div className="flex flex-col justify-end gap-3 pb-1">
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={input.byline === 1} onChange={e => set('byline', e.target.checked ? 1 : 0)} />
                Pattern credits you by name
              </label>
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={input.rightsAssignment === 1} onChange={e => set('rightsAssignment', e.target.checked ? 1 : 0)} />
                Contract demands rights / first-publication assignment
              </label>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-1.5"><Layers className="size-4" />Your exposure funnel & baseline</h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <NumField id="box-signup" label="Exposed → joins your list" value={input.listSignupsPct} onChange={n => set('listSignupsPct', Math.max(0, Math.min(1, n)))} step={0.01} suffix="%" />
            <NumField id="box-salet" label="List → buys pattern (12 mo)" value={input.listToSalePct} onChange={n => set('listToSalePct', Math.max(0, Math.min(1, n)))} step={0.01} suffix="%" />
            <NumField id="box-digprice" label="Your digital price" value={input.patternPrice} onChange={n => set('patternPrice', Math.max(0.5, n))} min={0.5} step={0.5} suffix="$" />
            <NumField id="box-selfpub" label="Your shop earnings / month now" value={input.selfPublishEarningsMonthly} onChange={n => set('selfPublishEarningsMonthly', Math.max(0, n))} suffix="$/mo" />
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-1.5"><Package className="size-4" />What the offer is actually worth</h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatBox label="Direct income / wave" value={FMT(result.feeIncomePerWave)} tone="good" />
            <StatBox label="Wave reach (with byline)" value={result.exposure.waveReach.toLocaleString()} tone="default" />
            <StatBox label="List joins / wave" value={result.exposure.listSignups.toFixed(1)} tone={result.exposure.listSignups > 0 ? 'good' : 'bad'} />
            <StatBox label="Funnel sales / wave" value={result.exposure.funnelSales.toFixed(1)} tone={result.exposure.funnelSales > 0 ? 'good' : 'bad'} />
            <StatBox label="Funnel revenue / wave" value={FMT2(result.exposure.funnelRevenue)} tone={result.exposure.funnelRevenue > 0 ? 'good' : 'bad'} />
            <StatBox label="Your time cost (this design)" value={FMT(result.timeCost)} tone="default" />
            <StatBox label="Exclusivity drag / yr" value={'−' + FMT(result.exclusivityDragPerYear)} tone={result.exclusivityDragPerYear > 0 ? 'warn' : 'default'} />
            <StatBox label="Annual net EV (health-weighted)" value={(result.annualNetEv >= 0 ? '' : '−') + '$' + Math.abs(result.annualNetEv).toLocaleString('en-US', { maximumFractionDigits: 0 })} tone={result.annualNetEv > 0 ? 'good' : 'bad'} />
            <StatBox label="Break-even fee / wave" value={FMT(result.breakEvenFee)} tone={input.designerFee >= result.breakEvenFee ? 'good' : 'warn'} />
            <StatBox label="Fair floor fee (6% of retail)" value={FMT2(result.fairFloorFee)} tone="default" />
            <StatBox label="Avg subscriber life" value={`${result.avgSubscriberLifeMonths.toFixed(0)} mo`} tone={result.avgSubscriberLifeMonths >= 12 ? 'good' : 'warn'} />
            <StatBox label="Health weight applied" value={`${(result.healthMultiplier * 100).toFixed(0)}%`} tone={result.healthMultiplier >= 0.8 ? 'good' : 'warn'} />
          </div>
          <p className="text-xs text-muted-foreground leading-4">Industry anchors: boxes run $10–$225/mo (average US box ~$43); subscriber churn 10–12%/mo (well-run &lt;5% → ~20-month lifetimes); CAC $70–135/subscriber (sustainable ≤25–35% of CLTV); gross margin must stay ≥40–50% per box — below 30% is a KnitCrate-style death spiral. KnitCrate's own value sheet priced patterns at $3–5 each. A fee near the fair floor with royalties ≈2% of box price is what a healthy operator can afford.</p>
        </section>

        {result.flags.length > 0 && (
          <section className="space-y-2">
            <h3 className="text-sm font-semibold flex items-center gap-1.5"><Flag className="size-4" />Watch-outs</h3>
            <div className="flex flex-wrap gap-2">
              {result.flags.map(f => (
                <Badge key={f.id} variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-700 gap-1.5 py-1.5">
                  <AlertTriangle className="size-3" />
                  <span className="font-medium">{f.id}</span> — {f.title}
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
