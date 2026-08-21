import { copyTextOrThrow } from '@/lib/clipboard';
import { useMemo, useState, useEffect } from 'react';
import { useProjectStorage, useProjectStorageState } from '@/lib/storage-lib';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Users, ClipboardCopy, AlertTriangle, HeartHandshake } from 'lucide-react';
import { PatternProject } from '@/lib/grading-engine';
import { useSettings } from '@/context/SettingsContext';
import { RETENTION_COPY } from '@/lib/retention-copy';
import {
  analyzeRetention,
  DEFAULT_RETENTION,
  EMAIL_TIERS,
  tierForListSize,
  type RetentionInput,
} from '@/lib/retention-planner';
import { PLATFORMS, PLATFORM_LABELS, type PlatformId } from '@/lib/pattern-income-calculator';

const STORAGE_KEY = 'rtpl-v1';

interface StoredRetention {
  input: RetentionInput;
}

function defaultStored(): StoredRetention {
  return { input: { ...DEFAULT_RETENTION } };
}

function loadStored(raw: StoredRetention | null): StoredRetention {
  try {
    
    
      if (raw && raw.input && typeof raw.input.listSize === 'number') {
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

export function RetentionCard({ project: _project }: { project: PatternProject }) {
  const { language } = useSettings();
  const copyText = RETENTION_COPY[language];
  // issue #4 project seam: scoped store per project; flat key folded in on first read, then removed.
  const handle = useProjectStorage<StoredRetention>('retain', _project.id, [STORAGE_KEY]);
  const { toast } = useToast();
  const [stored, setStored] = useProjectStorageState(handle, (raw) => loadStored(raw));

  const patchInput = (patch: Partial<RetentionInput>) =>
    setStored((s) => ({ input: { ...s.input, ...patch } }));

  const result = useMemo(() => analyzeRetention(stored.input), [stored.input]);

  const copy = async (text: string) => {
    try {
      await copyTextOrThrow(text);
      toast({ title: copyText.copied });
    } catch {
      toast({ title: copyText.copyFailed });
    }
  };

  const suggestedTier = tierForListSize(stored.input.listSize);
  const tierMonthly = Number(
    String(stored.input.emailToolingMonthly)
  ) === 0 ? 0 : stored.input.emailToolingMonthly;
  void tierMonthly;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <HeartHandshake className="h-4 w-4" /> {copyText.title}
        </CardTitle>
        <CardDescription>
          {copyText.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* List inputs */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <NumField id="rt-list" label={copyText.list} value={stored.input.listSize} min={0}
              onChange={(n) => patchInput({ listSize: n })} />
            <NumField id="rt-active" label={copyText.active} value={stored.input.activeRatePct} min={0} max={100}
              onChange={(n) => patchInput({ activeRatePct: Math.min(100, n) })} suffix="%" />
            <NumField id="rt-release-rate" label={copyText.buysEach} value={stored.input.releasePurchaseRatePct}
              min={0} max={100} step={0.5} onChange={(n) => patchInput({ releasePurchaseRatePct: Math.min(100, n) })}
              suffix="%" />
            <NumField id="rt-repeat" label={copyText.repeat} value={stored.input.repeatPurchaseRatePct}
              min={0} max={100} step={1} onChange={(n) => patchInput({ repeatPurchaseRatePct: Math.min(100, n) })}
              suffix="%" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <NumField id="rt-releases" label={copyText.releases} value={stored.input.releasesPerMonth} min={0}
              step={0.5} onChange={(n) => patchInput({ releasesPerMonth: n })} />
            <NumField id="rt-price" label={copyText.price} value={stored.input.avgPrice} min={0} step={0.5}
              onChange={(n) => patchInput({ avgPrice: n })} suffix="$" />
            <NumField id="rt-growth" label={copyText.signups} value={stored.input.listGrowthPerMonth} min={0}
              onChange={(n) => patchInput({ listGrowthPerMonth: n })} />
            <NumField id="rt-consumption" label={copyText.consumed}
              value={stored.input.patternsConsumedPerQuarter} min={0} onChange={(n) => patchInput({ patternsConsumedPerQuarter: n })} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="rt-platform" className="text-xs">{copyText.sellWhere}</Label>
              <Select value={stored.input.platform}
                onValueChange={(v) => patchInput({ platform: v as PlatformId })}>
                <SelectTrigger id="rt-platform"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((p) => (
                    <SelectItem key={p} value={p}>{PLATFORM_LABELS[p]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rt-tooling" className="text-xs">{copyText.tooling}</Label>
              <Select value={String(stored.input.emailToolingMonthly)}
                onValueChange={(v) => patchInput({ emailToolingMonthly: Number(v) })}>
                <SelectTrigger id="rt-tooling"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EMAIL_TIERS.map((t) => (
                    <SelectItem key={t.monthly} value={String(t.monthly)}>
                      {t.label} — {t.monthly === 0 ? 'free' : fmt$(t.monthly)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <NumField id="rt-acq" label={copyText.acq} value={stored.input.acquisitionCostPerFan}
              min={0} step={0.5} onChange={(n) => patchInput({ acquisitionCostPerFan: n })} suffix="$" />
          </div>
          <p className="text-xs text-muted-foreground">
            {copyText.suggested(stored.input.listSize.toLocaleString(), suggestedTier.label)} {copyText.benchmark}
          </p>
        </div>

        {/* Verdict */}
        <div className={`rounded-lg border p-4 ${verdictColor(result.verdict)}`}>
          <div className="font-semibold text-sm flex items-center gap-2">
            <Badge className={`${verdictColor(result.verdict)} border uppercase`}>{result.verdict}</Badge>
          </div>
          <p className="text-sm mt-2">{result.verdictNote}</p>
        </div>

        {/* Monthly summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="text-xs text-muted-foreground">{copyText.buyers}</div>
            <div className="text-2xl font-bold">{result.monthlyBuyers.toFixed(1)}</div>
          </div>
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="text-xs text-muted-foreground">{copyText.revenue}</div>
            <div className="text-2xl font-bold">{fmt$(result.monthlyListRevenue)}</div>
          </div>
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="text-xs text-muted-foreground">{copyText.motion}</div>
            <div className="text-2xl font-bold">{fmt$(result.monthlyCost)}</div>
          </div>
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="text-xs text-muted-foreground">{copyText.profit}</div>
            <div className={`text-2xl font-bold ${result.monthlyProfit >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
              {fmt$(result.monthlyProfit)}
            </div>
          </div>
        </div>

        {/* Retained vs acquired */}
        <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
          <div className="font-semibold text-sm flex items-center gap-2">
            <Users className="h-4 w-4" /> {copyText.advantage}
          </div>
          <div className="text-sm text-muted-foreground">
            A retained sale costs about ${result.costPerRetainedSale < 1
              ? `${(result.costPerRetainedSale * 100).toFixed(0)}¢` : fmt$(result.costPerRetainedSale)}
            (tooling spread across the list).
            An acquired sale carries the full fan cost of {fmt$(result.costPerAcquiredSale)} —
            {result.retentionAdvantageMultiple > 0
              ? ` roughly ${result.retentionAdvantageMultiple}× more expensive per sale.`
              : ' far more expensive per sale.'}
            That is the 5–10× gap the benchmark studies keep finding.
          </div>
        </div>

        {/* Cohort ladder */}
        <div className="space-y-2">
          <div className="font-semibold text-sm">{copyText.ladder}</div>
          <div className="grid gap-2">
            {result.cohortLadder.map((step) => (
              <div key={step.label} className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-2 text-sm">
                <span className="font-medium">{step.label}</span>
                <span className="text-muted-foreground">
                  {step.buyers.toFixed(1)} buyers · {fmt$(step.netRevenue)} net
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 12-month projection */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="text-xs text-muted-foreground">{copyText.month12}</div>
            <div className="text-xl font-bold">{fmt$(result.twelveMonthListRevenue)}</div>
          </div>
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="text-xs text-muted-foreground">12-month net</div>
            <div className={`text-xl font-bold ${result.twelveMonthNet >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
              {fmt$(result.twelveMonthNet)}
            </div>
          </div>
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="text-xs text-muted-foreground">Cold-acquisition cost of the same buyers</div>
            <div className="text-xl font-bold">
              {Number.isFinite(result.twelveMonthColdAcquisitionCost)
                ? fmt$(result.twelveMonthColdAcquisitionCost)
                : '—'}
            </div>
            {!Number.isFinite(result.twelveMonthColdAcquisitionCost) && (
              <p className="text-xs text-muted-foreground mt-1">
                No cold-acquisition comparison: a zero net per sale makes the ratio meaningless —
                set a real average price first.
              </p>
            )}
          </div>
        </div>

        {/* Watch-outs */}
        {result.watchOut.items.length > 0 && (
          <div className="space-y-2">
            <div className="font-semibold text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" /> Watch-outs
            </div>
            {result.watchOut.items.map((item) => (
              <div key={item} className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm">
                {item}
              </div>
            ))}
          </div>
        )}

        {/* Emails */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="font-semibold text-sm">Welcome email (free-pattern opt-in)</div>
            <div className="rounded-lg border bg-muted/30 p-4 text-xs whitespace-pre-line font-mono">
              {result.welcomeEmail}
            </div>
            <Button variant="outline" size="sm" onClick={() => copy(result.welcomeEmail)}>
              <ClipboardCopy className="h-3.5 w-3.5 mr-1.5" /> Copy
            </Button>
          </div>
          <div className="space-y-2">
            <div className="font-semibold text-sm">Next-release email</div>
            <div className="rounded-lg border bg-muted/30 p-4 text-xs whitespace-pre-line font-mono">
              {result.releaseEmail}
            </div>
            <Button variant="outline" size="sm" onClick={() => copy(result.releaseEmail)}>
              <ClipboardCopy className="h-3.5 w-3.5 mr-1.5" /> Copy
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
