import { useState, useEffect, useMemo } from 'react';
import { useProjectStorage, useProjectStorageState } from '@/lib/storage-lib';
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
import { useSettings } from '@/context/SettingsContext';
import { PRICE_WINDOW_COPY } from '@/lib/price-window-copy';
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

function loadStored(raw: StoredPriceWindow | null): StoredPriceWindow {
  try {
    if (raw && raw.input && typeof raw.input.listPrice === 'number') {
      return {
        ...defaultStored(),
        ...raw,
        input: { ...defaultStored().input, ...raw.input },
      };
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
  const { language } = useSettings();
  const copyText = PRICE_WINDOW_COPY[language];
  // issue #4 project seam: scoped store per project; flat key folded in on first read, then removed.
  const handle = useProjectStorage<StoredPriceWindow>('pricewin', project.id, [STORAGE_KEY]);
  const { toast } = useToast();
  const [stored, setStored] = useProjectStorageState(handle, (raw) => loadStored(raw));

  const patchInput = (patch: Partial<PriceWindowInput>) =>
    setStored((s) => ({ ...s, input: { ...s.input, ...patch } }));

  const result = useMemo(() => analyzePriceWindow(stored.input), [stored.input]);

  const seasonId = MONTH_SEASON[stored.launchMonth] ?? 'novdec';
  const seasonInfo = SEASON_MULTIPLIERS[seasonId as SeasonId];

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: copyText.copied });
    } catch {
      toast({ title: copyText.copyFailed });
    }
  };

  const salePrice = Math.round(stored.input.listPrice * (1 - stored.input.launchDiscountPct / 100) * 100) / 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <CalendarDays className="h-4 w-4" /> {copyText.title}
        </CardTitle>
        <CardDescription>
          {copyText.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Baseline inputs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="pw-price" className="text-xs">{copyText.price}</Label>
            <Input id="pw-price" type="number" min={1} step={0.5}
              value={stored.input.listPrice}
              onChange={(e) => patchInput({ listPrice: Number(e.target.value) || 0 })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pw-platform" className="text-xs">{copyText.sellWhere}</Label>
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
            <Label htmlFor="pw-baseline" className="text-xs">{copyText.baseline}</Label>
            <Input id="pw-baseline" type="number" min={0}
              value={stored.input.baselineMonthlySales}
              onChange={(e) => patchInput({ baselineMonthlySales: Number(e.target.value) || 0 })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pw-faves" className="text-xs">{copyText.queue}</Label>
            <Input id="pw-faves" type="number" min={0}
              value={stored.input.faveQueue}
              onChange={(e) => patchInput({ faveQueue: Number(e.target.value) || 0 })} />
          </div>
        </div>

        {/* Discount sliders */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">{copyText.launchDiscount(stored.input.launchDiscountPct)}</Label>
              <span className="text-xs text-muted-foreground">
                {copyText.salePrice(fmt$(salePrice), fmt$(stored.input.listPrice))}
              </span>
            </div>
            <Slider min={0} max={60} step={5}
              value={[stored.input.launchDiscountPct]}
              onValueChange={([v]) => patchInput({ launchDiscountPct: v })} />
            <p className="text-[11px] text-muted-foreground">
              {copyText.discountHint}
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">{copyText.saleRuns(stored.input.launchWeeks)}</Label>
              <span className="text-xs text-muted-foreground">
                {copyText.conversion(stored.input.fullPriceConversionPct, stored.input.discountUpliftMultiple.toFixed(1))}
              </span>
            </div>
            <Slider min={0} max={12} step={1}
              value={[stored.input.launchWeeks]}
              onValueChange={([v]) => patchInput({ launchWeeks: v })} />
            <p className="text-[11px] text-muted-foreground">
              {copyText.saleHint}
            </p>
          </div>
        </div>

        {/* Launch month / season */}
        <div className="space-y-2">
          <Label className="text-xs">{copyText.launchMonth}</Label>
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
          <p className="text-[11px] text-muted-foreground">{seasonInfo.note} {copyText.seasonApplied(seasonInfo.mult.toFixed(2), seasonInfo.note)}</p>
        </div>

        {/* Advanced inputs */}
        <details className="text-sm">
          <summary className="cursor-pointer text-xs text-muted-foreground select-none">
            {copyText.advanced}
          </summary>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
            <div className="space-y-1.5">
              <Label className="text-xs">{copyText.queueConversion}</Label>
              <Input type="number" min={0} step={0.5}
                value={stored.input.fullPriceConversionPct}
                onChange={(e) => patchInput({ fullPriceConversionPct: Number(e.target.value) || 0 })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{copyText.uplift}</Label>
              <Input type="number" min={1} step={0.5}
                value={stored.input.discountUpliftMultiple}
                onChange={(e) => patchInput({ discountUpliftMultiple: Number(e.target.value) || 1 })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{copyText.promoLift}</Label>
              <Input type="number" min={0} step={0.5}
                value={stored.input.promoThreadLiftPerWeek}
                onChange={(e) => patchInput({ promoThreadLiftPerWeek: Number(e.target.value) || 0 })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{copyText.liftMonths}</Label>
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
            {copyText.launchVsFull} <span className={`font-semibold ${result.launchDelta > 0 ? 'text-emerald-600' : 'text-destructive'}`}>
              {fmt$(result.launchDelta)}
            </span> over {result.horizonMonths} month(s)
          </div>
        </div>

        {/* Discount trap */}
        {result.trap.items.length > 0 && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-destructive">
              <AlertTriangle className="h-4 w-4" /> {copyText.trap}
            </div>
            {result.trap.items.map((item, i) => (
              <p key={i} className="text-xs text-muted-foreground">{item}</p>
            ))}
          </div>
        )}

        {/* Season table */}
        <div className="rounded-lg border bg-muted/30 p-4">
          <div className="text-sm font-semibold mb-2">{copyText.seasonMap}</div>
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
            <Label className="text-sm font-semibold">{copyText.listing}</Label>
            <Button variant="outline" size="sm" onClick={() => copy(result.listingCopy)}
              className="gap-1 text-xs"><ClipboardCopy className="h-3 w-3" /> {copyText.copy}</Button>
          </div>
          <pre className="whitespace-pre-wrap rounded-lg border bg-muted/40 p-3 text-xs">{result.listingCopy}</pre>
        </div>
      </CardContent>
    </Card>
  );
}
