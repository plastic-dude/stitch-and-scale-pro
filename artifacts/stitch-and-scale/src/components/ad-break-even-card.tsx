/**
 * CHK-050 — Ad Break-Even Lab card (48th workspace tab).
 *
 * Paid-marketing channel economics: per-channel break-even CPC / ROAS,
 * Offsite Ads marginal fee, email-baseline comparison, budget verdict.
 * Session-50 research — sources in lib/ad-break-even-lab.ts header.
 */
import { useMemo, useState, useEffect } from 'react';
import { projectStorage, type ProjectStorageHandle } from '@/lib/storage-lib';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Target, Mail, TrendingUp, TrendingDown, AlertTriangle, Zap } from 'lucide-react';
import { PatternProject } from '@/lib/grading-engine';
import { PLATFORMS, PLATFORM_LABELS, type PlatformId } from '@/lib/pattern-income-calculator';
import {
  AD_CHANNEL_LABELS,
  AD_LAB_DEFAULTS,
  analyzeAdSpend,
  type AdChannel,
  type AdLabInput,
} from '@/lib/ad-break-even-lab';

const STORAGE_KEY = 'stitch-and-scale-adlab-v1';
interface StoredAdLab {
  input: AdLabInput;
}
function defaultStored(): StoredAdLab {
  return { input: { ...AD_LAB_DEFAULTS } };
}
function loadStored(handle: ProjectStorageHandle<StoredAdLab>): StoredAdLab {
  try {
    const raw = handle.read();
    if (raw) {
      const parsed = raw as StoredAdLab;
      if (parsed && parsed.input && typeof parsed.input.price === 'number') {
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
const fmt2 = (n: number) => (Math.round(n * 100) / 100).toFixed(2);

const verdictBadge = (v: string) => {
  switch (v) {
    case 'strong': return { cls: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30', label: 'Fund it' };
    case 'avoid': return { cls: 'bg-destructive/15 text-destructive border-destructive/30', label: 'Avoid' };
    case 'baseline': return { cls: 'bg-blue-500/15 text-blue-700 border-blue-500/30', label: 'Baseline' };
    default: return { cls: 'bg-amber-500/15 text-amber-700 border-amber-500/30', label: 'Marginal' };
  }
};
const budgetBadge = (v: string) =>
  v === 'fund' ? { cls: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30', label: 'Fund the budget' } :
  v === 'skip' ? { cls: 'bg-destructive/15 text-destructive border-destructive/30', label: 'Skip — feed the list instead' } :
  { cls: 'bg-amber-500/15 text-amber-700 border-amber-500/30', label: 'Test small (≤$5/day)' };

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

function ChannelRow({ ch }: { ch: ReturnType<typeof analyzeAdSpend>['channels'][number] }) {
  const badge = verdictBadge(ch.verdict);
  return (
    <div className="border rounded-lg p-3 space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-sm">{AD_CHANNEL_LABELS[ch.channel]}</span>
        <Badge variant="outline" className={`text-xs border ${badge.cls}`}>{badge.label}</Badge>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>Net / sale: <span className="text-foreground font-medium">{fmt$(ch.netPerSale)}</span></span>
        {ch.verdict !== 'baseline' && ch.verdict !== 'avoid' && ch.expectedDailyProfit !== null && (
          <span>
            Projected orders/day: <span className="text-foreground font-medium">{ch.expectedOrdersPerDay?.toFixed(2)}</span>
          </span>
        )}
        {ch.channel !== 'etsy_offsite' && ch.channel !== 'ravelry_featured_source' && ch.channel !== 'email_list' && (
          <span>
            Max break-even CPC: <span className="text-foreground font-medium">{fmt$(ch.maxBreakEvenCpc)}</span>
          </span>
        )}
        <span>
          Break-even ROAS: <span className="text-foreground font-medium">
            {Number.isFinite(ch.breakEvenRoas) ? `${fmt2(ch.breakEvenRoas)}x` : '∞'}
          </span>
        </span>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{ch.reason}</p>
    </div>
  );
}

export function AdBreakEvenCard({ project }: { project: PatternProject }) {
  // Issue #4 project seam: scoped store per project; legacy flat key folded in on first read then removed.
  const handle = useMemo(() => projectStorage<StoredAdLab>('adlab', project.id, [STORAGE_KEY]), [project.id]);
  const { toast } = useToast();
  const [stored, setStored] = useState<StoredAdLab>(() => loadStored(handle));
  const [platform, setPlatform] = useState<PlatformId>(stored.input.platform);
  useEffect(() => {
    handle.write(stored);
  }, [stored]);
  const patchInput = (patch: Partial<AdLabInput>) =>
    setStored((s) => ({ input: { ...s.input, ...patch } }));

  const result = useMemo(() => analyzeAdSpend(stored.input), [stored.input]);
  const emailCh = result.channels.find((c) => c.channel === 'email_list')!;
  const paidSorted = [...result.channels.filter((c) => c.channel !== 'email_list')]
    .sort((a, b) => (b.expectedDailyProfit ?? -Infinity) - (a.expectedDailyProfit ?? -Infinity));
  const budgetB = budgetBadge(result.budget.verdict);
  const best = paidSorted[0];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Target className="h-4 w-4" /> Ad Break-Even Lab
        </CardTitle>
        <CardDescription>
          The ceiling a click is worth before you buy it. Per-channel break-even CPC, ROAS and
          the 15%/12% Offsite-Ads haircut, benchmarked against the ~$36/$1 email baseline —
          session-50 market research (Etsy/Meta/Google/Pinterest/Ravelry, 2026).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Input grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Sale completes on</Label>
            <select
              value={platform}
              onChange={(e) => {
                const p = e.target.value as PlatformId;
                setPlatform(p);
                patchInput({ platform: p });
              }}
              className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring">
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>{PLATFORM_LABELS[p]}</option>
              ))}
            </select>
          </div>
          <NumField id="ad-price" label="Pattern price" value={stored.input.price}
            onChange={(n) => patchInput({ price: n })} min={0.01} step={0.5} suffix="USD" />
          <NumField id="ad-cpc" label="Typical CPC (Etsy digital)" value={stored.input.typicalCpc}
            onChange={(n) => patchInput({ typicalCpc: n })} min={0.01} step={0.05} suffix="$/click" />
          <NumField id="ad-conv" label="Click → order rate" value={stored.input.clickToOrder}
            onChange={(n) => patchInput({ clickToOrder: n })} min={0} max={1} step={0.005} />
          <NumField id="ad-budget" label="Daily ad budget" value={stored.input.dailyBudget}
            onChange={(n) => patchInput({ dailyBudget: n })} min={0} max={100} suffix="$/day" />
          <NumField id="ad-email" label="Email list size" value={stored.input.emailListSize}
            onChange={(n) => patchInput({ emailListSize: n })} step={10} />
          <NumField id="ad-emailconv" label="Email conversion" value={stored.input.emailConversion}
            onChange={(n) => patchInput({ emailConversion: n })} min={0} max={1} step={0.005} />
          <NumField id="ad-revenue" label="Annual shop revenue" value={stored.input.annualShopRevenue}
            onChange={(n) => patchInput({ annualShopRevenue: n })} min={0} step={1000} suffix="$/yr" />
        </div>

        {/* Offsite tier banner */}
        <div className={`flex items-start gap-2 text-xs rounded-md border p-3 ${
          result.offsiteTier === 'fifteen_pct'
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-800'
            : 'bg-destructive/10 border-destructive/30 text-destructive'
        }`}>
          <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <p>
            <strong>Offsite Ads tier: {result.offsiteTier === 'fifteen_pct' ? '15% (under $10k/yr)' : '12% (≥$10k/yr — mandatory for the lifetime of the shop)'}</strong>.
            Any Etsy sale within 30 days of an Offsite Ad click loses this share on top of the
            standard fees; it is a margin haircut, not an ad you control. Every channel row below
            prices this in.
          </p>
        </div>

        {/* Budget verdict */}
        <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/40 p-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            <div className="text-sm">
              <span className="font-medium">Budget verdict — </span>
              <span>{result.budget.reason}</span>
            </div>
          </div>
          <Badge variant="outline" className={`whitespace-nowrap border ${budgetB.cls}`}>{budgetB.label}</Badge>
        </div>

        {/* Channel rows — email baseline first */}
        <div className="space-y-2.5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Channels, ordered by projected daily profit
          </h3>
          <ChannelRow ch={emailCh} />
          {paidSorted.map((ch) => (
            <ChannelRow key={ch.channel} ch={ch} />
          ))}
        </div>

        {/* Email vs ads summary */}
        <div className="grid md:grid-cols-2 gap-3">
          <div className="rounded-lg border p-3 space-y-1 text-sm">
            <div className="flex items-center gap-2 font-medium">
              <Mail className="h-4 w-4" /> Email baseline (one warm send)
            </div>
            <p className="text-xs text-muted-foreground">
              {result.email.expectedOrders} expected orders → {fmt$(result.email.netRevenue)} net · {emailCh.reason}
            </p>
          </div>
          <div className="rounded-lg border p-3 space-y-1 text-sm">
            <div className="flex items-center gap-2 font-medium">
              <TrendingUp className="h-4 w-4" /> Best paid channel
            </div>
            <p className="text-xs text-muted-foreground">
              {best ? `${AD_CHANNEL_LABELS[best.channel]} · ${fmt$(best.expectedDailyProfit ?? 0)}/day · ${result.budget.spendableClicksPerDay} clicks/day at ${fmt$(stored.input.typicalCpc)} — anything above ${fmt$(result.budget.wastefulSpendThreshold)}/day is wasted spend.`
                : 'No paid channel clears at the assumed conversion.'}
              {result.emailBeatsAllAds && (
                <span className="block mt-1 font-medium text-blue-700">
                  <TrendingDown className="h-3.5 w-3.5 inline mr-1" />
                  Your email list outsells a month of paid spend — grow it first.
                </span>
              )}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
