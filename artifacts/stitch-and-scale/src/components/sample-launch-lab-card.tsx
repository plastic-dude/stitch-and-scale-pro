/**
 * CHK-051 — Sample & Launch Window Lab card (49th workspace tab).
 *
 * Prices the two revenue assets nobody else prices: the physical sample garment
 * (yarn + knit hours recovered through a sample sale across four channels) and
 * the launch-week burst (a timed launch catches Ravelry Hot Right Now; the week
 * carries most of month-1 sales before demand tails off).
 * Session-51 research — sources in lib/sample-launch-lab.ts header.
 */
import { useMemo, useState, useEffect } from 'react';
import { projectStorage, type ProjectStorageHandle } from '@/lib/storage-lib';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Sparkles, TrendingDown, CalendarDays, CheckCircle2, XCircle } from 'lucide-react';
import { PatternProject } from '@/lib/grading-engine';
import {
  SAMPLE_LAB_DEFAULTS,
  SAMPLE_CHANNEL_LABELS,
  analyzeSampleLab,
  type SampleLabInput,
  type SampleSaleChannel,
} from '@/lib/sample-launch-lab';

const STORAGE_KEY = 'stitch-and-scale-samplelaunch-v1';

interface StoredSampleLaunch {
  input: SampleLabInput;
  garmentSeason: 'fall' | 'winter' | 'spring' | 'summer';
  launchMonth: number;
}

function defaultStored(): StoredSampleLaunch {
  return { input: { ...SAMPLE_LAB_DEFAULTS }, garmentSeason: 'fall', launchMonth: 7 };
}

function loadStored(handle: ProjectStorageHandle<StoredSampleLaunch>): StoredSampleLaunch {
  try {
    const raw = handle.read();
    if (raw) {
      const parsed = raw as StoredSampleLaunch;
      if (parsed && parsed.input && typeof parsed.input.knitHours === 'number') {
        return {
          ...defaultStored(),
          ...parsed,
          input: { ...defaultStored().input, ...parsed.input },
        };
      }
    }
  } catch {
    /* storage unreadable — start fresh */
  }
  return defaultStored();
}

const fmt$ = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });

const MONTH_LABELS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const SEASON_OPTIONS: Array<{ value: StoredSampleLaunch['garmentSeason']; label: string }> = [
  { value: 'fall', label: 'Fall knitwear (sweaters, cowls)' },
  { value: 'winter', label: 'Winter knitwear (heavy knits, gift season)' },
  { value: 'spring', label: 'Spring knitwear (lace, light yarns)' },
  { value: 'summer', label: 'Summer knitwear (cottons, tees)' },
];

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
          onChange={(e) => onChange(Number(e.target.value) >= 0 ? Number(e.target.value) : 0)}
          className={suffix ? 'pr-8' : undefined} />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function SampleRow({ row, isBest }: { row: ReturnType<typeof analyzeSampleLab>['samples'][number]; isBest: boolean }) {
  return (
    <div className={`rounded-lg border p-3 space-y-1.5 ${isBest ? 'border-emerald-500/40 bg-emerald-500/5' : ''}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-sm">{row.label}</span>
        {isBest && (
          <Badge variant="outline" className="text-xs border border-emerald-500/30 bg-emerald-500/15 text-emerald-700">
            Best net
          </Badge>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>Gross: <span className="text-foreground font-medium">{fmt$(row.gross)}</span></span>
        <span>Fees: <span className="text-foreground font-medium">{fmt$(row.fees)}</span></span>
        <span>Net: <span className="text-foreground font-medium">{fmt$(row.net)}</span></span>
        <span>
          vs {fmt$(row.costBasis)} basis: <span className={`font-medium ${row.recoveredVsCost >= 0 ? 'text-emerald-700' : 'text-destructive'}`}>
            {fmt$(row.recoveredVsCost)}
          </span>
        </span>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{row.note}</p>
    </div>
  );
}

export function SampleLaunchLabCard({ project }: { project: PatternProject }) {
  const handle = useMemo(
    () => projectStorage<StoredSampleLaunch>(STORAGE_KEY, project.id || '', []),
    [project.id],
  );
  const [stored, setStored] = useState<StoredSampleLaunch>(() => loadStored(handle));
  useEffect(() => {
    handle.write(stored);
  }, [stored, handle]);

  const { input, garmentSeason, launchMonth } = stored;
  const setInput = (patch: Partial<SampleLabInput>) =>
    setStored((s) => ({ ...s, input: { ...s.input, ...patch } }));

  const result = useMemo(
    () => analyzeSampleLab(input, garmentSeason, launchMonth),
    [input, garmentSeason, launchMonth],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-4 w-4" /> Sample &amp; Launch Window Lab
        </CardTitle>
        <CardDescription>
          No tool prices the sample garment or the launch-week burst — Ravelry treats a sample as a
          sunk cost and launch tools stop at "post consistently". A sweater sample is the largest
          single cost block of a pattern (≈30 knit hours + $75 yarn ≈ $525 at a $15/hr basis), and a
          well-timed launch caught Hot Right Now and sold 76 copies in under 5 days against 109 in a
          whole month for the designer's previous best. This lab prices the sample across four sale
          channels and prices the launch week before the tail.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sample economics */}
        <div className="space-y-3">
          <div className="text-sm font-medium">The sample — what did it cost, what can it recover?</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <NumField id="sl-knithours" label="Knit hours (sample)" value={input.knitHours}
              onChange={(n) => setInput({ knitHours: n })} step={1} suffix="h" />
            <NumField id="sl-yarncost" label="Yarn & materials" value={input.yarnCost}
              onChange={(n) => setInput({ yarnCost: n })} step={5} suffix="$" />
            <NumField id="sl-knithourly" label="Your knit hourly rate" value={input.knitHourlyRate}
              onChange={(n) => setInput({ knitHourlyRate: n })} step={1} suffix="$" />
            <NumField id="sl-monthlysales" label="Expected month-1 pattern sales" value={input.monthlySales}
              onChange={(n) => setInput({ monthlySales: Math.round(n) })} step={1} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <NumField id="sl-ask" label="Custom/new garment ask price" value={input.askPrice}
              onChange={(n) => setInput({ askPrice: n })} min={1} step={5} suffix="$" />
            <NumField id="sl-sample" label="Sample-sale price" value={input.samplePrice}
              onChange={(n) => setInput({ samplePrice: n })} min={1} step={5} suffix="$" />
            <NumField id="sl-booth" label="Booth cost (fairs)" value={input.boothCost}
              onChange={(n) => setInput({ boothCost: n })} step={5} suffix="$" />
            <NumField id="sl-days" label="Days after release for sale" value={input.daysAfterRelease}
              onChange={(n) => setInput({ daysAfterRelease: Math.round(n) })} step={1} suffix="d" />
          </div>
        </div>

        {/* Sample verdict banner */}
        <div className={`rounded-md border p-3 ${result.sampleVerdict.ok ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700' : 'border-amber-500/30 bg-amber-500/10 text-amber-700'}`}>
          <div className="flex items-start gap-2 text-sm">
            {result.sampleVerdict.ok ? <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" /> : <XCircle className="h-4 w-4 mt-0.5 shrink-0" />}
            <span>{result.sampleVerdict.reason}</span>
          </div>
        </div>

        {/* Channel comparison */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Sample sale by channel — nets compared against the cost basis</div>
          {result.samples.map((row) => (
            <SampleRow key={row.channel} row={row} isBest={row === result.best} />
          ))}
          <p className="text-xs text-muted-foreground leading-relaxed">{result.keepVsSellNote}</p>
        </div>

        {/* Launch window */}
        <div className="space-y-3">
          <div className="text-sm font-medium">The launch window — week-one burst vs the tail</div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="sl-season" className="text-xs">Garment season</Label>
              <select id="sl-season" value={garmentSeason}
                onChange={(e) => setStored((s) => ({ ...s, garmentSeason: e.target.value as StoredSampleLaunch['garmentSeason'] }))}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                {SEASON_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sl-launchmonth" className="text-xs">Planned release month</Label>
              <select id="sl-launchmonth" value={launchMonth}
                onChange={(e) => setStored((s) => ({ ...s, launchMonth: Number(e.target.value) }))}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                {MONTH_LABELS.map((m, i) => (
                  <option key={m} value={i}>{m}</option>
                ))}
              </select>
            </div>
          </div>
          <div className={`rounded-md border p-3 space-y-2 ${result.burst.seasonFactor >= 1 ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-amber-500/30 bg-amber-500/5'}`}>
            <div className="flex items-center gap-2 text-sm font-medium">
              <CalendarDays className="h-4 w-4" /> Launch burst at season factor {result.burst.seasonFactor.toFixed(2)}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>
                Week-one sales: <span className="text-foreground font-semibold">{result.burst.weekOneSales}</span>
                <span className="ml-1">({Math.round(result.burst.firstWeekMultiple * 100)}% of month)</span>
              </span>
              <span>
                Tail sales: <span className="text-foreground font-semibold">{result.burst.tailSales}</span>
              </span>
              <span>
                Weekly value at {fmt$(input.samplePrice)}: <span className="text-foreground font-semibold">{fmt$(result.burst.weekOneSales * input.samplePrice)}</span>
              </span>
              <span className="flex items-center gap-1">
                <TrendingDown className="h-3 w-3" /> Then the tail takes over — sales decline through the month.
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{result.burst.note}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
