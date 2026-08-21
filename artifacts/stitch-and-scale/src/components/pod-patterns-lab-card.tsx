import { useMemo, useState, useEffect } from 'react';
import { getLabStatCopy, type LabStatCopy } from '@/lib/lab-stat-copy';
import { useSettings } from '@/context/SettingsContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Flag, BookOpen, Layers, Lightbulb } from 'lucide-react';
import { PatternProject } from '@/lib/grading-engine';
import { POD_PATTERNS_COPY } from '@/lib/pod-patterns-copy';
import { projectStorage } from '@/lib/storage-lib';
import {
  analyzePODPatterns,
  DEFAULT_POD_PATTERNS,
  fmt$,
  type PodPlatform,
  type PodPatternsInput,
} from '@/lib/pod-patterns-lab';

const STORAGE_KEY = 'stitch-and-scale-pod-v1';

type StoredState = PodPatternsInput & { ts?: number };

function defaultStored(): StoredState {
  return { ...DEFAULT_POD_PATTERNS };
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

const platformOptions: { value: PodPlatform; label: string }[] = [
  { value: 'kdp-amazon', label: 'KDP — Amazon.com (60% royalty)' },
  { value: 'kdp-expanded', label: 'KDP — Expanded distribution (40% cut)' },
  { value: 'ingramspark', label: 'IngramSpark (~55% wholesale discount)' },
  { value: 'lulu-direct', label: 'Lulu — direct to readers (20% cut)' },
  { value: 'etsy-self', label: 'Etsy / own site — self-shipped (~11% fees)' },
];

const verdictColor = (v: string) =>
  v.startsWith('Do not print') ? 'bg-destructive/10 text-destructive border-destructive/30' :
  v.startsWith('Print volume below') ? 'bg-amber-500/15 text-amber-700 border-amber-500/30' :
  v.startsWith('Switch channels') ? 'bg-sky-500/15 text-sky-700 border-sky-500/30' :
  v.startsWith('Go hybrid') ? 'bg-violet-500/15 text-violet-700 border-violet-500/30' :
  v.startsWith('Worth printing') ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30' :
  'bg-accent/50 text-muted-foreground border-border';

export function PodPatternsLabCard({ project }: { project: PatternProject }) {
  const handle = useMemo(() => projectStorage<StoredState>('pod-patterns', project.id, [STORAGE_KEY]), [project.id]);
  const [input, setInput] = useState<PodPatternsInput>(() => loadStored(handle));
  const { language } = useSettings();
  const ls: LabStatCopy = getLabStatCopy(language);
  const copyText = POD_PATTERNS_COPY[language];

  useEffect(() => {
    setInput(loadStored(handle));
  }, [handle]);

  const persist = (next: PodPatternsInput) => {
    setInput(next);
    handle.write({ ...next, ts: Date.now() });
  };

  const result = useMemo(() => analyzePODPatterns(input), [input]);
  const set = <K extends keyof PodPatternsInput>(k: K, v: PodPatternsInput[K]) => persist({ ...input, [k]: v });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base"><BookOpen className="size-4" />POD Patterns Lab</CardTitle>
        <CardDescription>Would a printed booklet of your patterns actually make money — or silently cannibalize your PDF sales while the print cost eats the margin? The spec is verified: KDP charges a flat $2.30 per copy through 110 black-and-white pages then $0.012/page, the 60% royalty band only applies at $9.99+ list, color ink runs $0.065/page, the paperback floor is 24 pages, and IngramSpark's ~55% wholesale discount means direct-reader sales through it net ~$0.70–2.40/copy where Lulu direct nets $5.50–12.70 on the same price. Designers have paid KDP print bills that left $1/copy against a $6 PDF — this lab prices the spec, the channel, and the cannibalization before you commit.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <section className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-1.5"><Layers className="size-4" />The physical spec</h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <NumField id="pod-pages" label={copyText.totalPages} value={input.pageCount} onChange={n => set('pageCount', Math.max(1, Math.min(828, n)))} min={1} max={828} suffix="pg" />
            <NumField id="pod-colorpages" label={copyText.colorPages} value={input.colorPages} onChange={n => set('colorPages', Math.max(0, Math.min(n, input.pageCount)))} min={0} suffix="pg" />
            <NumField id="pod-list" label={copyText.listPrice} value={input.listPrice} onChange={n => set('listPrice', Math.max(0.5, n))} min={0.5} step={0.5} suffix="$" />
            <div className="space-y-1.5">
              <Label htmlFor="pod-platform" className="text-xs">Channel</Label>
              <select
                id="pod-platform"
                value={input.platform}
                onChange={e => set('platform', e.target.value as PodPlatform)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm">
                {platformOptions.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col justify-end gap-3 pb-1">
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={input.colorInk} onChange={e => set('colorInk', e.target.checked)} />
                Full-color interior (all pages)
              </label>
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={input.hardcover} onChange={e => set('hardcover', e.target.checked)} />
                Hardcover (+$3.35 base)
              </label>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-1.5"><Layers className="size-4" />Production & sales expectations</h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <NumField id="pod-cover" label={copyText.coverLayoutCost0} value={input.coverLayoutCost} onChange={n => set('coverLayoutCost', Math.max(0, n))} suffix="$" />
            <NumField id="pod-prodhrs" label={copyText.coverLayoutHours} value={input.productionHours} onChange={n => set('productionHours', Math.max(0.5, n))} min={0.5} step={0.5} suffix="hrs" />
            <NumField id="pod-physunits" label={copyText.expectedPhysicalUnitsMo} value={input.expectedUnitsPerMonth} onChange={n => set('expectedUnitsPerMonth', Math.max(0, n))} min={0} suffix="units/mo" />
            <NumField id="pod-digunits" label={copyText.currentDigitalUnitsMo} value={input.digitalUnitsPerMonth} onChange={n => set('digitalUnitsPerMonth', Math.max(0, n))} min={0} suffix="units/mo" />
            <NumField id="pod-digprice" label={copyText.digitalPdfPrice} value={input.digitalPdfPrice} onChange={n => set('digitalPdfPrice', Math.max(0.5, n))} min={0.5} step={0.5} suffix="$" />
            <NumField id="pod-cannibal" label={copyText.cannibalShare} value={input.cannibalShare} onChange={n => set('cannibalShare', Math.max(0, Math.min(1, n)))} step={0.05} suffix="%" />
            <NumField id="pod-rate" label={copyText.opportunityRate} value={input.hourlyRate} onChange={n => set('hourlyRate', Math.max(1, n))} suffix="$/hr" />
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-1.5"><BookOpen className="size-4" />Print economics vs the PDF baseline</h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatBox label={ls.printingCostPerCopy} value={fmt$(result.unit.printingCost)} tone="default" />
            <StatBox label={ls.netRoyaltyPerCopy} value={fmt$(result.unit.netPerUnit)} tone={result.unit.netPerUnit > 0 ? 'good' : 'bad'} />
            <StatBox label={ls.cannibalizationDragPerMo} value={fmt$(result.unit.cannibalDrag)} tone={result.unit.cannibalDrag > 0 ? 'warn' : 'default'} />
            <StatBox label={ls.monthlyNetAfterDrag} value={fmt$(result.unit.monthlyNet)} tone={result.unit.monthlyNet > 0 ? 'good' : 'bad'} />
            <StatBox label={ls.minimumList60Band} value={fmt$(result.minListPrice)} tone={input.listPrice >= result.minListPrice ? 'good' : 'warn'} />
            <StatBox label={ls.royaltyBand} value={`${(result.royaltyRate * 100).toFixed(0)}%`} tone={result.royaltyRate >= 0.6 ? 'good' : 'warn'} />
            <StatBox label={ls.breakEvenUnitsPerMo} value={result.breakEvenUnits === Infinity ? '∞' : Math.ceil(result.breakEvenUnits).toLocaleString()} tone={input.expectedUnitsPerMonth >= Math.ceil(result.breakEvenUnits) ? 'good' : 'warn'} />
            <StatBox label={ls.physicalVsDigitalRatio} value={result.physicalToDigitalRatio.toFixed(2) + '×'} tone={result.physicalToDigitalRatio >= 1.5 ? 'good' : 'warn'} />
            <StatBox label={ls.digitalNetPerSale} value={fmt$(result.digital.digitalNetPerSale)} tone="default" />
            <StatBox label={ls.digitalNetPerMonthNow} value={fmt$(result.digital.digitalMonthlyNet)} tone="good" />
            <StatBox label={ls.monthsOfPhysicalToMatch1DigitalMonth} value={result.digital.monthsToDigitalMonth === Infinity ? '∞' : result.digital.monthsToDigitalMonth.toFixed(1)} tone={result.digital.monthsToDigitalMonth < 12 ? 'good' : 'warn'} />
          </div>
          {result.unit.monthlyNet <= 0 && (
            <p className="text-xs text-muted-foreground">Negative monthly net means the physical title loses money every month at this volume — either raise the list, cut pages, or reserve the booklet purely as a marketing funnel for the PDF.</p>
          )}
          <p className="text-xs text-muted-foreground leading-4">Verified anchors: KDP B&W ≤110 pages is a flat $2.30/copy ($5.65 hardcover base, +$0.012/page above 110); color ink $0.065/page; the 60% royalty band needs $9.99+ list, else 50%; KDP takes 30% on Amazon.com (40% on expanded distribution); IngramSpark ≈ 55% wholesale discount (direct-reader residual ≈ list × 5%); Lulu direct ≈ 20% cut; Etsy ≈ 11% blended. Physical pattern booklets sell $12–25; a printed copy typically cannibalizes ~30% of a digital sale of the same design.</p>
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
