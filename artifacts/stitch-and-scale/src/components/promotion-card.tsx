import { useEffect, useMemo, useState } from 'react';
import { projectStorage, type ProjectStorageHandle } from '@/lib/storage-lib';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { ClipboardCopy, Megaphone, TrendingDown, TrendingUp } from 'lucide-react';
import { PatternProject } from '@/lib/grading-engine';
import { PLATFORMS, PLATFORM_LABELS, PlatformId } from '@/lib/pattern-income-calculator';
import {
  analyzePromotion,
  CHANNEL_LABELS,
  CHANNEL_NOTES,
  DEFAULT_KILL_THRESHOLD,
  DEFAULT_HORIZON,
  PromotionInput,
  ChannelParams,
  ChannelResult,
  PromoChannelId,
} from '@/lib/promotion-planner';

const STORAGE_KEY = 'promo-v1';

interface StoredPromotion {
  price: number;
  platform: PlatformId;
  monthlySales: number;
  horizonMonths: number;
  killThreshold: number;
  channels: { id: PromoChannelId; patch: Partial<ChannelParams> }[];
}

const DEFAULT_CHANNEL_PATCHES: Partial<ChannelParams>[] = [
  { enabled: false, budget: 150, cpc: 0.35, conversionPct: 3 },
  { enabled: true, budget: 0, offsiteCommissionPct: 15 },
  { enabled: true, budget: 10, hourlyRate: 25, clicksPerHour: 40, organicConversionPct: 1.5 },
  { enabled: true, budget: 4, hourlyRate: 25, clicksPerHour: 25, organicConversionPct: 4 },
  { enabled: false, budget: 5, hourlyRate: 25, clicksPerHour: 30, organicConversionPct: 2 },
];

function defaultStored(): StoredPromotion {
  const ids: PromoChannelId[] = ['etsyOnsite', 'etsyOffsite', 'pinterest', 'newsletter', 'freePattern'];
  return {
    price: 8,
    platform: 'etsy',
    monthlySales: 10,
    horizonMonths: DEFAULT_HORIZON,
    killThreshold: DEFAULT_KILL_THRESHOLD,
    channels: ids.map((id, i) => ({ id, patch: DEFAULT_CHANNEL_PATCHES[i] })),
  };
}

function loadStored(handle: ProjectStorageHandle<StoredPromotion>): StoredPromotion {
  try {
    const parsed = handle.read();
    if (parsed) {
      if (parsed && parsed.platform && Array.isArray(parsed.channels) && parsed.channels.length > 0) {
        const defs = defaultStored();
        // Merge per-channel so stale stored records (pre-enabled-flag) pick up
        // the default values for any missing keys instead of carrying dead state.
        const channels = defs.channels.map((def, i) => ({
          ...def,
          patch: { ...def.patch, ...(parsed.channels[i]?.patch || {}) },
        }));
        return { ...defs, ...parsed, channels };
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

function ChannelRow({ result, params, onToggle, onPatch }: {
  result: ChannelResult;
  params: ChannelParams;
  onToggle: (enabled: boolean) => void;
  onPatch: (patch: Partial<ChannelParams>) => void;
}) {
  const isPaid = params.id === 'etsyOnsite' || params.id === 'etsyOffsite';
  return (
    <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Switch checked={params.enabled} onCheckedChange={onToggle} />
          <div>
            <div className="text-sm font-semibold">{result.label}</div>
            <div className="text-xs text-muted-foreground max-w-md">{CHANNEL_NOTES[params.id]}</div>
          </div>
        </div>
        <Badge className={`${verdictColor(result.verdict)} border uppercase`}>{result.verdict}</Badge>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
        {params.id === 'etsyOnsite' && (
          <>
            <div className="space-y-1.5">
              <Label className="text-xs">Daily budget ($)</Label>
              <Input
                type="number"
                min={1}
                value={Math.round(params.budget / 30)}
                onChange={(e) => onPatch({ budget: Number(e.target.value) * 30 })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">CPC ($)</Label>
              <Input
                type="number"
                step="0.05"
                min={0.05}
                value={params.cpc}
                onChange={(e) => onPatch({ cpc: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Conv. rate (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={params.conversionPct}
                onChange={(e) => onPatch({ conversionPct: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Break-even CPC ($)</Label>
              <Input readOnly value={result.breakevenCpc.toFixed(2)} className="bg-muted" />
            </div>
          </>
        )}
        {params.id === 'etsyOffsite' && (
          <div className="space-y-1.5">
            <Label className="text-xs">Commission rate (%)</Label>
            <Input
              type="number"
              min={0}
              max={30}
              value={params.offsiteCommissionPct}
              onChange={(e) => onPatch({ offsiteCommissionPct: Number(e.target.value) })}
            />
          </div>
        )}
        {isPaid === false && (
          <>
            <div className="space-y-1.5">
              <Label className="text-xs">Hours/month</Label>
              <Input
                type="number"
                min={0}
                value={params.budget}
                onChange={(e) => onPatch({ budget: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Your rate ($/hr)</Label>
              <Input
                type="number"
                min={0}
                value={params.hourlyRate}
                onChange={(e) => onPatch({ hourlyRate: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Clicks per hour</Label>
              <Input
                type="number"
                min={0}
                value={params.clicksPerHour}
                onChange={(e) => onPatch({ clicksPerHour: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Conv. rate (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={params.organicConversionPct}
                onChange={(e) => onPatch({ organicConversionPct: Number(e.target.value) })}
              />
            </div>
          </>
        )}
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
        <span>{result.clicks.toFixed(0)} clicks → {result.expectedSales.toFixed(1)} sales</span>
        {isPaid && result.spend > 0 && <span>Revenue ROAS {result.revenueRoas.toFixed(2)}×</span>}
        <span>Expected profit <span className={result.expectedProfit >= 0 ? 'text-emerald-700 font-medium' : 'text-destructive font-medium'}>{fmt$(result.expectedProfit)}</span></span>
      </div>
      <p className="text-sm text-muted-foreground">{result.verdictNote}</p>
    </div>
  );
}

export function PromotionCard({ project }: { project: PatternProject }) {
  // issue #4 project seam: one scoped store per project; the legacy flat key 'promo-v1' is folded in on first read, then removed.
  const handle = useMemo(() => projectStorage<StoredPromotion>('promo', project.id, ['promo-v1']), [project.id]);
  const { toast } = useToast();
  const [stored, setStored] = useState(() => loadStored(handle));

  useEffect(() => {
    handle.write(stored);
  }, [stored]);

  const input = useMemo<PromotionInput>(() => {
    const ids: PromoChannelId[] = ['etsyOnsite', 'etsyOffsite', 'pinterest', 'newsletter', 'freePattern'];
    return {
      price: stored.price,
      platform: stored.platform,
      monthlySales: stored.monthlySales,
      horizonMonths: stored.horizonMonths,
      killSpendThreshold: stored.killThreshold,
      channels: ids.map((id, i) => {
        const st = stored.channels.find((c) => c.id === id);
        const def = DEFAULT_CHANNEL_PATCHES[i];
        return { ...def, ...(st?.patch || {}), id } as ChannelParams;
      }),
    };
  }, [stored]);

  const result = useMemo(() => analyzePromotion(input), [input]);

  const setChannel = (id: PromoChannelId, patch: Partial<ChannelParams>) =>
    setStored((s) => ({
      ...s,
      channels: s.channels.map((c) => (c.id === id ? { id, patch: { ...c.patch, ...patch } } : c)),
    }));

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: 'Copied to clipboard' });
    } catch {
      toast({ title: 'Select and copy manually' });
    }
  };

  const topChannel = result.channels[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Megaphone className="h-5 w-5" /> Promotion Budget Planner
        </CardTitle>
        <CardDescription>
          Plan the promo budget channel by channel — paid clicks, pay-on-sale offsite ads, and the
          organic ladder — always against the pattern's true net margin. The $182-spend-seller lesson
          is built in: gross-positive ROAS that loses money after the fee stack gets called out.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basics */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-1.5">
            <Label htmlFor="pm-price">Pattern price ($)</Label>
            <Input id="pm-price" type="number" min={1} value={stored.price}
              onChange={(e) => setStored((s) => ({ ...s, price: Number(e.target.value) }))} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pm-platform">Where you sell</Label>
            <select id="pm-platform" className="flex h-9 w-full rounded-md border bg-background px-3 py-1 text-sm"
              value={stored.platform}
              onChange={(e) => setStored((s) => ({ ...s, platform: e.target.value as PlatformId }))}>
              {PLATFORMS.map((p) => (<option key={p} value={p}>{PLATFORM_LABELS[p]}</option>))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pm-sales">Baseline sales / month</Label>
            <Input id="pm-sales" type="number" min={0} value={stored.monthlySales}
              onChange={(e) => setStored((s) => ({ ...s, monthlySales: Number(e.target.value) }))} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pm-horizon">Campaign horizon (months)</Label>
            <Input id="pm-horizon" type="number" min={1} max={24} value={stored.horizonMonths}
              onChange={(e) => setStored((s) => ({ ...s, horizonMonths: Number(e.target.value) }))} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pm-kill">Kill threshold ($ / 0 orders)</Label>
            <Input id="pm-kill" type="number" min={10} value={stored.killThreshold}
              onChange={(e) => setStored((s) => ({ ...s, killThreshold: Number(e.target.value) }))} />
          </div>
        </div>

        {/* Verdict */}
        <div className="space-y-3 rounded-lg border bg-muted/40 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <Badge className={`${verdictColor(result.verdict)} border text-base px-3 py-1 uppercase`}>{result.verdict}</Badge>
            <span className="text-sm font-medium">
              Total spend {fmt$(result.totalSpend)} · projected net <span className={result.totalExpectedProfit >= 0 ? 'text-emerald-700' : 'text-destructive'}>{fmt$(result.totalExpectedProfit)}</span>
            </span>
            <span className="text-sm text-muted-foreground">
              On top of the {fmt$(result.grossBaseline)} baseline · kill rule: {result.killRule}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{result.verdictNote}</p>
        </div>

        {/* Channels */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold">Channels</h4>
          {result.channels.map((cr) => {
            const ids: PromoChannelId[] = ['etsyOnsite', 'etsyOffsite', 'pinterest', 'newsletter', 'freePattern'];
            const params = input.channels[ids.indexOf(cr.id)];
            const share = result.budgetSplit.find((s) => s.id === cr.id)?.recommendedSharePct ?? 0;
            return (
              <div key={cr.id} className="relative">
                {params.enabled && params.id === 'etsyOnsite' && share > 0 && (
                  <Badge variant="outline" className="absolute -top-2 -right-2 z-10 bg-background">
                    ~{share}% of plan
                  </Badge>
                )}
                <ChannelRow
                  result={cr}
                  params={params}
                  onToggle={(enabled) => setChannel(cr.id, { enabled })}
                  onPatch={(patch) => setChannel(cr.id, patch)}
                />
              </div>
            );
          })}
        </div>

        {/* Ranked plan */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Suggested order</h4>
          {result.bestChannels.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing carries the plan right now — rework the listing or budget first.</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Rank by expected profit per dollar/hour: {result.bestChannels.map((id, i) => (
                <span key={id}>{i + 1}. {CHANNEL_LABELS[id]}{i < result.bestChannels.length - 1 ? ', ' : ''}</span>
              ))}
            </p>
          )}
        </div>

        {/* Fee stack reminder */}
        <div className="flex items-start gap-2 rounded-md border bg-background p-3 text-sm text-muted-foreground">
          <TrendingDown className="h-4 w-4 mt-0.5 shrink-0" />
          <p>
            Always subtract the fee stack before calling an ad profitable: transaction ~6.5%, processing
            ~3% + $0.25, offsite commission 12–15%, and the listing fee. A revenue ROAS of 3× can still be
            breakeven at pattern price points — the per-channel rows above already account for your net per sale.
          </p>
        </div>

        {/* Test plan */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold flex items-center gap-2"><TrendingUp className="h-4 w-4" /> 30-day test protocol</h4>
            <Button variant="outline" size="sm" onClick={() => copy(result.testPlan)}>
              <ClipboardCopy className="h-4 w-4" /> Copy
            </Button>
          </div>
          <pre className="whitespace-pre-wrap rounded-md border bg-background p-4 text-sm">{result.testPlan}</pre>
        </div>
      </CardContent>
    </Card>
  );
}
