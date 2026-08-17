import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Flag, Lightbulb, Tent, Users, Plus, Minus } from 'lucide-react';
import { PatternProject } from '@/lib/grading-engine';
import { useSettings } from '@/context/SettingsContext';
import { CONVENTION_BOOTH_COPY } from '@/lib/convention-booth-copy';
import { projectStorage } from '@/lib/storage-lib';
import {
  analyzeConventionBooth,
  DEFAULT_BOOTH,
  SHOW_SIZE_HINTS,
  fmt$,
  type ConventionBoothInput,
  type ProductMixItem,
} from '@/lib/convention-booth-lab';

const STORAGE_KEY = 'stitch-and-scale-booth-v1';

type StoredState = ConventionBoothInput & { ts?: number };

function defaultStored(): StoredState {
  return { ...DEFAULT_BOOTH, mix: DEFAULT_BOOTH.mix.map((m) => ({ ...m })) };
}

function loadStored(handle: ReturnType<typeof projectStorage<StoredState>>): StoredState {
  const parsed = handle.read();
  if (parsed) {
    const loaded = { ...defaultStored(), ...parsed, ts: undefined };
    return { ...loaded, mix: loaded.mix.map((m) => ({ ...DEFAULT_BOOTH.mix[0], ...m })) };
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
  v.startsWith('Run it') ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30' :
  v.startsWith('Skip') || v.startsWith('No traffic') ? 'bg-destructive/15 text-destructive border-destructive/30' :
  v.startsWith('Borderline') || v.startsWith('Only as') ? 'bg-amber-500/15 text-amber-700 border-amber-500/30' :
  'bg-sky-500/15 text-sky-700 border-sky-500/30';

export function ConventionBoothLabCard({ project }: { project: PatternProject }) {
  const { language } = useSettings();
  const copyText = CONVENTION_BOOTH_COPY[language];
  const handle = useMemo(() => projectStorage<StoredState>('booth', project.id, [STORAGE_KEY]), [project.id]);
  const [input, setInput] = useState<ConventionBoothInput>(() => loadStored(handle));

  useEffect(() => {
    setInput(loadStored(handle));
  }, [handle]);

  const persist = (next: ConventionBoothInput) => {
    setInput(next);
    handle.write({ ...next, ts: Date.now() });
  };

  const result = useMemo(() => analyzeConventionBooth(input), [input]);
  const realistic = result.scenarios[1];

  const set = <K extends keyof ConventionBoothInput>(k: K, v: ConventionBoothInput[K]) => persist({ ...input, [k]: v });
  const setCosts = (k: keyof typeof input.showCosts, v: number) => persist({ ...input, showCosts: { ...input.showCosts, [k]: v } });

  const totalMixShare = input.mix.reduce((s, m) => s + m.share, 0);

  const updateMix = (idx: number, patch: Partial<ProductMixItem>) =>
    persist({ ...input, mix: input.mix.map((m, i) => (i === idx ? { ...m, ...patch } : m)) });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base"><Tent className="size-4" />{copyText.title}</CardTitle>
        <CardDescription>{copyText.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <section className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-1.5"><Users className="size-4" />{copyText.costsTraffic}</h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            <NumField id="cb-booth" label={copyText.boothFee} value={input.showCosts.boothFee} onChange={n => setCosts('boothFee', n)} suffix="$" />
            <NumField id="cb-app" label={copyText.applicationFee} value={input.showCosts.applicationFee} onChange={n => setCosts('applicationFee', n)} suffix="$" />
            <NumField id="cb-travel" label={copyText.travel} value={input.showCosts.travelLodging} onChange={n => setCosts('travelLodging', n)} suffix="$" />
            <NumField id="cb-display" label={copyText.display} value={input.showCosts.displayPackingCost} onChange={n => setCosts('displayPackingCost', n)} suffix="$" />
            <NumField id="cb-days" label={copyText.showDays} value={input.days} onChange={n => set('days', Math.max(1, n))} min={1} />
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            <NumField id="cb-shoppers" label={copyText.shoppers} value={input.shoppersPerDay} onChange={n => set('shoppersPerDay', Math.max(0, n))} />
            <NumField id="cb-conv-w" label={copyText.conversionWorst} value={input.conversionWorst} onChange={n => set('conversionWorst', n)} min={0} max={100} step={0.25} suffix="%" />
            <NumField id="cb-conv-r" label={copyText.conversionRealistic} value={input.conversionRealistic} onChange={n => set('conversionRealistic', n)} min={0} max={100} step={0.25} suffix="%" />
            <NumField id="cb-conv-b" label={copyText.conversionBest} value={input.conversionBest} onChange={n => set('conversionBest', n)} min={0} max={100} step={0.25} suffix="%" />
            <NumField id="cb-hours" label={copyText.prepHours} value={input.prepSetupTeardownHours} onChange={n => set('prepSetupTeardownHours', n)} />
          </div>
          <p className="text-xs text-muted-foreground italic">Traffic heuristics: {SHOW_SIZE_HINTS.small} · {SHOW_SIZE_HINTS.medium} · {SHOW_SIZE_HINTS.large}. Ask the organizer — it is the single biggest number in this math. Industry per-vendor conversion averages 1-2% of show footfall.</p>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-1.5"><Users className="size-4" />{copyText.productMix}</h3>
          <div className="space-y-2">
            {input.mix.map((m, idx) => (
              <div key={idx} className="grid grid-cols-1 gap-2 md:grid-cols-12 items-end border rounded-md p-2">
                <div className="md:col-span-3">
                  <Label className="text-xs">{copyText.item}</Label>
                  <Input value={m.label} onChange={e => updateMix(idx, { label: e.target.value })} className="text-sm h-8" />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-xs">{copyText.price}</Label>
                  <Input type="number" min={0} value={m.price} onChange={e => {
                    const n = parseFloat(e.target.value);
                    if (Number.isFinite(n)) updateMix(idx, { price: n });
                  }} className="text-sm h-8" />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-xs">{copyText.share}</Label>
                  <Input type="number" min={0} max={100} step={1} value={m.share} onChange={e => {
                    const n = parseFloat(e.target.value);
                    if (Number.isFinite(n)) updateMix(idx, { share: n });
                  }} className="text-sm h-8" />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-xs">{copyText.hoursUnit}</Label>
                  <Input type="number" min={0} step={0.5} value={m.hoursPerUnit} onChange={e => {
                    const n = parseFloat(e.target.value);
                    if (Number.isFinite(n)) updateMix(idx, { hoursPerUnit: n });
                  }} className="text-sm h-8" />
                </div>
                <div className="md:col-span-2 flex gap-1 items-center">
                  {idx === 0 ? null : (
                    <button type="button" onClick={() => persist({ ...input, mix: input.mix.filter((_, i) => i !== idx) })}
                      className="rounded-md border p-1.5 text-muted-foreground hover:text-destructive"><Minus className="size-3.5" /></button>
                  )}
                  <button type="button" onClick={() => persist({ ...input, mix: [...input.mix, { label: `Item ${input.mix.length + 1}`, price: 20, share: 10, hoursPerUnit: 2 }] })}
                    className="rounded-md border p-1.5 text-muted-foreground hover:text-emerald-600"><Plus className="size-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
          <div className={`grid grid-cols-2 gap-3 md:grid-cols-4 text-xs ${totalMixShare !== 100 ? 'text-amber-600' : 'text-muted-foreground'}`}>
            <div>{copyText.mixTotal}: <span className="font-semibold">{totalMixShare}%</span>{totalMixShare !== 100 ? ` (${copyText.not100})` : ''}</div>
            <div>{copyText.opportunity}: ${input.hourlyRate}/hr</div>
            <div>{copyText.units}: {input.unitsAvailable}</div>
            <div>{copyText.cardFee}: {input.cardFeePct}%</div>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <NumField id="cb-rate" label={copyText.opportunity} value={input.hourlyRate} onChange={n => set('hourlyRate', n)} suffix="$/hr" />
            <NumField id="cb-units" label={copyText.units} value={input.unitsAvailable} onChange={n => set('unitsAvailable', Math.max(1, n))} min={1} />
            <NumField id="cb-card" label={copyText.cardFee} value={input.cardFeePct} onChange={n => set('cardFeePct', n)} suffix="%" step={0.1} />
            <NumField id="cb-captures" label={copyText.emailCaptures} value={input.emailCaptures} onChange={n => set('emailCaptures', Math.max(0, n))} />
          </div>
          <NumField id="cb-followup" label={copyText.followup} value={input.followupConversionPct} onChange={n => set('followupConversionPct', n)} suffix="%" step={1} />
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-1.5"><Users className="size-4" />{copyText.numbers}</h3>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-xs">
              <thead className="bg-accent/60 text-muted-foreground">
                <tr>
                  <th className="p-2 text-left">{copyText.scenario}</th>
                  <th className="p-2 text-right">{copyText.shoppersTable}</th>
                  <th className="p-2 text-right">{copyText.customers}</th>
                  <th className="p-2 text-right">{copyText.unitsSold}</th>
                  <th className="p-2 text-right">{copyText.revenue}</th>
                  <th className="p-2 text-right">{copyText.production}</th>
                  <th className="p-2 text-right">{copyText.netProfit}</th>
                  <th className="p-2 text-right">{copyText.perHour}</th>
                </tr>
              </thead>
              <tbody>
                {result.scenarios.map(s => (
                  <tr key={s.label} className="border-t">
                    <td className="p-2 capitalize">{s.label}</td>
                    <td className="p-2 text-right">{s.shoppers.toLocaleString('en-US')}</td>
                    <td className="p-2 text-right">{s.customers.toFixed(0)}</td>
                    <td className="p-2 text-right">{s.sellableUnits}</td>
                    <td className="p-2 text-right">{fmt$(s.revenue)}</td>
                    <td className="p-2 text-right">{fmt$(s.productionCost)}</td>
                    <td className={`p-2 text-right font-medium ${s.netProfit >= 0 ? 'text-emerald-700' : 'text-destructive'}`}>{fmt$(s.netProfit)}</td>
                    <td className="p-2 text-right">{fmt$(s.effectiveHourly)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatBox label={copyText.fixedCosts} value={fmt$(result.fixedCosts)} />
            <StatBox label={copyText.breakEven} value={result.breakEvenUnits === Infinity ? '∞' : result.breakEvenUnits.toLocaleString('en-US')} tone={result.breakEvenUnits <= realistic.sellableUnits ? 'good' : 'warn'} />
            <StatBox label={copyText.multiple7} value={`${result.sevenXMultiple.toFixed(1)}×`} tone={result.sevenXMultiple >= 7 ? 'good' : result.sevenXMultiple >= 5 ? 'warn' : 'bad'} />
            <StatBox label={copyText.emailEV} value={fmt$(realistic.emailLongTail)} />
          </div>
        </section>

        {result.flags.length > 0 && (
          <section className="space-y-2">
            <h3 className="text-sm font-semibold flex items-center gap-1.5"><Flag className="size-4" />{copyText.watchOuts}</h3>
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
