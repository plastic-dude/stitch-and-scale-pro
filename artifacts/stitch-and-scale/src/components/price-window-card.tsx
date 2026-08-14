import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { CalendarDays, ClipboardCopy, AlertTriangle, TrendingUp } from 'lucide-react';
import { PatternProject } from '@/lib/grading-engine';
import {
  analyzePriceWindow,
  MONTH_SEASON,
  SEASON_MULTIPLIERS,
  PLATFORMS,
  DEFAULT_PRICE_WINDOW,
  PriceWindowInput,
  type SeasonId,
} from '@/lib/price-window-optimizer';
import { PLATFORM_LABELS, type PlatformId } from '@/lib/pattern-income-calculator';

const STORAGE_KEY = 'prcw-v1';

interface StoredPriceWindow {
  input: PriceWindowInput;
  launchMonth: number;
}

function defaultStored(): StoredPriceWindow {
  return {
    input: { ...DEFAULT_PRICE_WINDOW },
    launchMonth: new Date().getMonth() + 1,
  };
}

function loadStored(): StoredPriceWindow {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.input && typeof parsed.input.listPrice === 'number') {
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
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

const verdictColor = (v: string) =>
  v === 'go' ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30' :
  v === 'no' ? 'bg-destructive/15 text-destructive border-destructive/30' :
  'bg-amber-500/15 text-amber-700 border-amber-500/30';

function PathRow({ name, netRevenue, sales, verdict, note }: {
  name: string; netRevenue: number; sales: number; verdict: string; note: string;
}) {
  return (
    <div className="rounded-lg border bg-muted/30 p-4 space-y-1">
      <div className="flex items-center justify-between gap-2">
        <div className="font-semibold text-sm">{name}</div>
        <Badge className={`${verdictColor(verdict)} border uppercase`}>{verdict}</Badge>
      </div>
      <div className="text-sm text-muted-foreground">
        Net ${netRevenue.toLocaleString('en-US', { maximumFractionDigits: 0 })} · {sales.toFixed(0)} sales over the window
      </div>
      <div className="text-xs text-muted-foreground/80">{note}</div>
    </div>
  );
}

export function PriceWindowCard({ project }: { project: PatternProject }) {
  const { toast } = useToast();
  const [stored, setStored] = useState<StoredPriceWindow>(() => loadStored());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  }, [stored]);

  const patchInput = (patch: Partial<PriceWindowInput>) =>
    setStored((s) => ({ ...s, input: { ...s.input, ...patch } }));

  const result = useMemo(() => analyzePriceWindow(stored.input), [stored.input]);

  const seasonId = MONTH_SEASON[stored.launchMonth] ?? 'novdec';
  const seasonInfo = SEASON_MULTIPLIERS[seasonId as SeasonId];

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: 'Copied — paste it into your listing or newsletter.' });
    } catch {
      toast({ title: 'Copy failed — select the text manually.' });
    }
  };

  const salePrice = Math.round(stored.input.listPrice * (1 - stored.input.launchDiscountPct / 100) * 100) / 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <CalendarDays className="h-4 w-4" /> Price Window & Discount Optimizer
        </CardTitle>
        <CardDescription>
          The launch discount&apos;s real job is converting the fave queue in week one — then getting out of the way.
          This models three paths (full price, launch window, forever sale) net of the platform fee stack, and
          calls out the two traps designers keep falling into: sales with no end date, and discounts deep enough
          to teach buyers to wait for the next one.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Baseline inputs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="pw-price" className="text-xs">Pattern price ($)</Label>
            <Input id="pw-price" type="number" min={1} step={0.5}
              value={stored.input.listPrice}
              onChange={(e) => patchInput({ listPrice: Number(e.target.value) || 0 })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pw-platform" className="text-xs">Where you sell</Label>
            <Select value={stored.input.platform}
              onValueChange={(v) => patchInput({ platform: v as PlatformId })}>
              <SelectTrigger id="pw-platform"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PLATFORMS.map((p) => (
                  <SelectItem key={p} value={p}>{PLATFORM_LABELS[p]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pw-baseline" className="text-xs">Baseline sales / month</Label>
            <Input id="pw-baseline" type="number" min={0}
              value={stored.input.baselineMonthlySales}
              onChange={(e) => patchInput({ baselineMonthlySales: Number(e.target.value) || 0 })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pw-faves" className="text-xs">Fave queue at launch</Label>
            <Input id="pw-faves" type="number" min={0}
              value={stored.input.faveQueue}
              onChange={(e) => patchInput({ faveQueue: Number(e.target.value) || 0 })} />
          </div>
        </div>

        {/* Discount sliders */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Launch discount: {stored.input.launchDiscountPct}%</Label>
              <span className="text-xs text-muted-foreground">
                Sale price {fmt$(salePrice)} → {fmt$(stored.input.listPrice)}
              </span>
            </div>
            <Slider min={0} max={60} step={5}
              value={[stored.input.launchDiscountPct]}
              onValueChange={([v]) => patchInput({ launchDiscountPct: v })} />
            <p className="text-[11px] text-muted-foreground">
              The competitive band is 15–25%. Past that, buyers learn the pattern is always on sale.
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Sale runs {stored.input.launchWeeks} week(s)</Label>
              <span className="text-xs text-muted-foreground">
                Fave conversion {stored.input.fullPriceConversionPct}%/wk × {stored.input.discountUpliftMultiple.toFixed(1)} during sale
              </span>
            </div>
            <Slider min={0} max={12} step={1}
              value={[stored.input.launchWeeks]}
              onValueChange={([v]) => patchInput({ launchWeeks: v })} />
            <p className="text-[11px] text-muted-foreground">
              Two weeks is the standard: long enough to reach promo threads, short enough to hold urgency.
            </p>
          </div>
        </div>

        {/* Launch month / season */}
        <div className="space-y-2">
          <Label className="text-xs">Launch month</Label>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(SEASON_MULTIPLIERS).map(([id, s]) => {
              const active = seasonId === id;
              return (
                <button key={id}
                  type="button"
                  onClick={() => {
                    const month = Object.entries(MONTH_SEASON).find(([, v]) => v === id)?.[0];
                    if (month) setStored((st) => ({ ...st, launchMonth: Number(month) }));
                  }}
                  className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                    active ? 'bg-primary text-primary-foreground border-primary' :
                    'bg-muted/40 hover:bg-muted border-border'
                  }`}>
                  {s.label} · {s.mult.toFixed(2)}×
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-muted-foreground">{seasonInfo.note} Season multiplier applied: {seasonInfo.mult.toFixed(2)}×</p>
        </div>

        {/* Advanced inputs */}
        <details className="text-sm">
          <summary className="cursor-pointer text-xs text-muted-foreground select-none">
            Advanced — conversion rates & promo lift
          </summary>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Queue conversion (%/wk)</Label>
              <Input type="number" min={0} step={0.5}
                value={stored.input.fullPriceConversionPct}
                onChange={(e) => patchInput({ fullPriceConversionPct: Number(e.target.value) || 0 })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Discount uplift (×)</Label>
              <Input type="number" min={1} step={0.5}
                value={stored.input.discountUpliftMultiple}
                onChange={(e) => patchInput({ discountUpliftMultiple: Number(e.target.value) || 1 })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Promo-thread lift (sales/wk)</Label>
              <Input type="number" min={0} step={0.5}
                value={stored.input.promoThreadLiftPerWeek}
                onChange={(e) => patchInput({ promoThreadLiftPerWeek: Number(e.target.value) || 0 })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Promo lift months</Label>
              <Input type="number" min={1} max={12} step={1}
                value={stored.input.promoThreadMonths}
                onChange={(e) => patchInput({ promoThreadMonths: Number(e.target.value) || 1 })} />
            </div>
          </div>
        </details>

        {/* Verdict paths */}
        <div className="space-y-3">
          <PathRow {...result.fullPricePath} />
          <PathRow {...result.launchDiscountPath} />
          <PathRow {...result.permanentDiscountPath} />
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <TrendingUp className="h-3.5 w-3.5" />
            Launch window vs full price: <span className={`font-semibold ${result.launchDelta > 0 ? 'text-emerald-600' : 'text-destructive'}`}>
              {fmt$(result.launchDelta)}
            </span> over {result.horizonMonths} month(s)
          </div>
        </div>

        {/* Discount trap */}
        {result.trap.items.length > 0 && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-destructive">
              <AlertTriangle className="h-4 w-4" /> Discount train detected
            </div>
            {result.trap.items.map((item, i) => (
              <p key={i} className="text-xs text-muted-foreground">{item}</p>
            ))}
          </div>
        )}

        {/* Season table */}
        <div className="rounded-lg border bg-muted/30 p-4">
          <div className="text-sm font-semibold mb-2">Season map — plan releases around these windows</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {Object.entries(SEASON_MULTIPLIERS)
              .sort((a, b) => b[1].mult - a[1].mult)
              .map(([id, s]) => (
                <div key={id} className={`rounded-md border p-2 ${seasonId === id ? 'border-primary' : 'border-border'}`}>
                  <div className="text-xs font-medium">{s.label}</div>
                  <div className="text-lg font-bold">{s.mult.toFixed(2)}×</div>
                  <div className="text-[10px] text-muted-foreground">{s.note}</div>
                </div>
              ))}
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">{result.seasonNote}</p>
        </div>

        {/* Launch copy */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold">Paste-ready launch listing copy</Label>
            <Button variant="outline" size="sm" onClick={() => copy(result.listingCopy)}
              className="gap-1 text-xs"><ClipboardCopy className="h-3 w-3" /> Copy</Button>
          </div>
          <pre className="whitespace-pre-wrap rounded-lg border bg-muted/40 p-3 text-xs">{result.listingCopy}</pre>
        </div>
      </CardContent>
    </Card>
  );
}
