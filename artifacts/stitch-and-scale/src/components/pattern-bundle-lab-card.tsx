import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Flag, Layers, Lightbulb, Minus, Plus, Presentation } from 'lucide-react';
import { PatternProject } from '@/lib/grading-engine';
import { projectStorage } from '@/lib/storage-lib';
import {
  analyzePatternBundle,
  DEFAULT_BUNDLE,
  fmt$,
  type PatternBundleInput,
  type SplitMode,
} from '@/lib/pattern-bundle-lab';

const STORAGE_KEY = 'stitch-and-scale-bundle-v1';

type StoredState = PatternBundleInput & { ts?: number };

function defaultStored(): StoredState {
  return { ...DEFAULT_BUNDLE, patterns: DEFAULT_BUNDLE.patterns.map(p => ({ ...p })) };
}

function loadStored(handle: ReturnType<typeof projectStorage<StoredState>>): StoredState {
  const parsed = handle.read();
  if (parsed) {
    return {
      ...defaultStored(),
      ...parsed,
      patterns: (parsed.patterns ?? defaultStored().patterns).map(p => ({ ...defaultStored().patterns[0], ...p })),
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
  v.startsWith('Host this launch') ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30' :
  v.startsWith('Worth it, but make') ? 'bg-sky-500/15 text-sky-700 border-sky-500/30' :
  v.startsWith('Teach it') ? 'bg-amber-500/15 text-amber-700 border-amber-500/30' :
  v.startsWith('Not yet') ? 'bg-amber-500/15 text-amber-700 border-amber-500/30' :
  'bg-destructive/10 text-destructive border-destructive/30';

export function PatternBundleLabCard({ project }: { project: PatternProject }) {
  const handle = useMemo(() => projectStorage<StoredState>('pattern-bundle', project.id, [STORAGE_KEY]), [project.id]);
  const [input, setInput] = useState<PatternBundleInput>(() => loadStored(handle));

  useEffect(() => {
    setInput(loadStored(handle));
  }, [handle]);

  const persist = (next: PatternBundleInput) => {
    setInput(next);
    handle.write({ ...next, ts: Date.now() });
  };

  const result = useMemo(() => analyzePatternBundle(input), [input]);
  const set = <K extends keyof PatternBundleInput>(k: K, v: PatternBundleInput[K]) => persist({ ...input, [k]: v });
  const setPattern = (i: number, patch: Partial<(typeof input.patterns)[number]>) =>
    persist({ ...input, patterns: input.patterns.map((p, idx) => (idx === i ? { ...p, ...patch } : p)) });
  const addPattern = () =>
    persist({ ...input, patterns: [...input.patterns, { price: 7, monthlySales: 5 }] });
  const removePattern = (i: number) =>
    persist({ ...input, patterns: input.patterns.filter((_, idx) => idx !== i) });

  const realistic = result.scenarios[1];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base"><Presentation className="size-4" />Pattern Bundle Lab</CardTitle>
        <CardDescription>Should you host a designer-run pattern bundle — and does the split actually pay? Bundle hosts and craft platforms run launches with 10–25% organizer commissions and opaque per-designer splits, and no tool projects your own net before you sign. A $25 bundle at 200 sales is $5,000 gross — the fastest spike a long-tail designer gets — but a bundle that discounts without adding volume loses every designer money. This lab models weighted vs equal splits, the discount-depth norm (40–60% off), break-even and host-floor sales, launch promo labor, and the audience capture that is the real long-term payout.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <section className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-1.5"><Layers className="size-4" />Your patterns in this bundle</h3>
          <div className="space-y-2">
            {input.patterns.map((p, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
                <NumField id={`pb-price-${i}`} label={`Pattern ${i + 1} — standalone price`} value={p.price} onChange={n => setPattern(i, { price: n })} min={0.5} step={0.5} suffix="$" />
                <NumField id={`pb-sales-${i}`} label="Realistic solo sales / month" value={p.monthlySales} onChange={n => setPattern(i, { monthlySales: n })} min={0} />
                {input.patterns.length > 1 ? (
                  <Button type="button" variant="ghost" size="icon" className="mb-0.5 h-9 w-9" onClick={() => removePattern(i)} aria-label={`Remove pattern ${i + 1}`}>
                    <Minus className="size-4" />
                  </Button>
                ) : <div />}
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addPattern} className="w-full">
              <Plus className="size-4" /> Add another pattern
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <NumField id="pb-bundle" label="Bundle price" value={input.bundlePrice} onChange={n => set('bundlePrice', n)} min={1} step={0.5} suffix="$" />
            <NumField id="pb-host" label="Host commission" value={input.hostCommission} onChange={n => set('hostCommission', Math.min(0.5, Math.max(0, n)))} step={0.01} suffix="%" />
            <SelectField id="pb-split" label="Split mode" value={input.splitMode}
              options={[{ value: 'weighted', label: 'Weighted by price (norm)' }, { value: 'equal', label: 'Equal split' }]}
              onChange={v => set('splitMode', v as SplitMode)} />
            <NumField id="pb-months" label="Launch window" value={input.launchMonths} onChange={n => set('launchMonths', Math.max(1, Math.min(6, n)))} min={1} max={6} suffix="mo" />
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-1.5"><Presentation className="size-4" />Launch volume & labor</h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            <NumField id="pb-worst" label="Worst-case sales" value={input.bundleSalesWorst} onChange={n => set('bundleSalesWorst', n)} min={0} />
            <NumField id="pb-real" label="Realistic sales" value={input.bundleSales} onChange={n => set('bundleSales', n)} min={0} />
            <NumField id="pb-best" label="Best-case sales" value={input.bundleSalesBest} onChange={n => set('bundleSalesBest', n)} min={0} />
            <NumField id="pb-solo" label="Solo sales per pattern in window" value={input.soloSalesPerPattern} onChange={n => set('soloSalesPerPattern', n)} min={0} />
            <NumField id="pb-promo" label="Your promo hours" value={input.promoHours} onChange={n => set('promoHours', Math.max(0, n))} suffix="hrs" />
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <NumField id="pb-rate" label="Opportunity rate" value={input.hourlyRate} onChange={n => set('hourlyRate', n)} suffix="$/hr" />
            <NumField id="pb-email" label="New email leads gained" value={input.emailGained} onChange={n => set('emailGained', Math.max(0, n))} />
            <NumField id="pb-emailv" label="Value per new lead (1st year)" value={input.emailValue} onChange={n => set('emailValue', n)} min={0} step={0.25} suffix="$" />
            <div className="flex items-end">
              <p className="text-xs text-muted-foreground leading-4">The deal norm: 40–60% off the sum of standalone prices, host commissions of 10–25%, and a launch week where every designer stacks their lists and socials.</p>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-1.5"><Presentation className="size-4" />Deal math & scenario table</h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatBox label="Standalone sum" value={fmt$(result.standaloneSum)} />
            <StatBox label="Discount vs sum" value={`${(result.discountShare * 100).toFixed(0)}% off`} tone={result.discountShare >= 0.4 && result.discountShare <= 0.6 ? 'good' : 'warn'} />
            <StatBox label="Break-even bundle sales" value={result.breakEvenSales === Infinity ? '∞' : String(result.breakEvenSales)} tone={result.breakEvenSales <= (realistic?.sales ?? 0) ? 'good' : 'warn'} />
            <StatBox label="Host floor to demand" value={result.floorSales === Infinity ? '∞' : String(result.floorSales)} />
          </div>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-xs">
              <thead className="bg-accent/60 text-muted-foreground">
                <tr>
                  <th className="p-2 text-left">Scenario</th>
                  <th className="p-2 text-right">Bundle sales</th>
                  <th className="p-2 text-right">Your share</th>
                  <th className="p-2 text-right">Your gross</th>
                  <th className="p-2 text-right">Your net (labor + leads)</th>
                  <th className="p-2 text-right">Solo window</th>
                  <th className="p-2 text-right">Bundle gain / loss</th>
                  <th className="p-2 text-right">Effective $/hr</th>
                </tr>
              </thead>
              <tbody>
                {result.scenarios.map(s => (
                  <tr key={s.label} className={`border-t ${s.label === 'realistic' ? 'bg-emerald-500/10' : ''}`}>
                    <td className="p-2 font-medium capitalize">{s.label}</td>
                    <td className="p-2 text-right">{s.sales.toLocaleString('en-US')}</td>
                    <td className="p-2 text-right">{(s.designers[0].share * 100).toFixed(0)}%</td>
                    <td className="p-2 text-right">{fmt$(s.designers[0].grossTake)}</td>
                    <td className="p-2 text-right">{fmt$(s.designers[0].netTake)}</td>
                    <td className="p-2 text-right">{fmt$(s.designers[0].soloBaseline)}</td>
                    <td className={`p-2 text-right ${s.designers[0].incremental >= 0 ? 'text-emerald-700' : 'text-destructive'}`}>{s.designers[0].incremental >= 0 ? '+' : '−'}{fmt$(Math.abs(s.designers[0].incremental))}</td>
                    <td className="p-2 text-right">{s.effectiveHourly.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {result.scenarios.length === 0 && (
            <p className="text-xs text-muted-foreground">Add patterns above for the lab to model the bundle.</p>
          )}
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
