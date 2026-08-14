import { useEffect, useMemo, useState } from 'react';
import { projectStorage, type ProjectStorageHandle } from '@/lib/storage-lib';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ClipboardCopy, Users, Plus, Trash2 } from 'lucide-react';
import { PatternProject } from '@/lib/grading-engine';
import { PLATFORMS, PLATFORM_LABELS, PlatformId } from '@/lib/pattern-income-calculator';
import {
  analyzeMembership,
  DEFAULT_EXCLUSIVE_PATTERN_COST,
  DEFAULT_EXCLUSIVE_PATTERN_HOURS,
  PLATFORM_FEE_PCT,
  PROCESSING_FEE_PCT,
  MembershipInput,
  MembershipTier,
} from '@/lib/membership-planner';

const STORAGE_KEY = 'mspl-v1';

interface StoredMembership {
  tiers: MembershipTier[];
  rampMonths: number;
  platformRate: number;
  processingRate: number;
  exclusivePatternsPerMonth: number;
  exclusivePatternCost: number;
  designerHoursPerPattern: number;
  designRate: number;
  parkedPatternPrice: number;
  parkedPatternMonthlySalesLost: number;
  platform: PlatformId;
  parkedHorizonMonths: number;
}

function defaultStored(): StoredMembership {
  return {
    tiers: [
      { name: 'Stitch Along', price: 3, members: 60, monthlyChurnPct: 15, perks: ['Exclusive monthly mini-pattern', 'Behind-the-scenes posts'] },
      { name: 'Pattern Club', price: 5, members: 30, monthlyChurnPct: 10, perks: ['Full monthly pattern', '20% off all shop patterns'] },
      { name: 'Design Inner Circle', price: 10, members: 10, monthlyChurnPct: 8, perks: ['Everything above', 'KAL access', 'Early pattern releases'] },
    ],
    rampMonths: 6,
    platformRate: PLATFORM_FEE_PCT,
    processingRate: PROCESSING_FEE_PCT,
    exclusivePatternsPerMonth: 1,
    exclusivePatternCost: DEFAULT_EXCLUSIVE_PATTERN_COST,
    designerHoursPerPattern: DEFAULT_EXCLUSIVE_PATTERN_HOURS,
    designRate: 12,
    parkedPatternPrice: 8,
    parkedPatternMonthlySalesLost: 20,
    platform: 'ravelry',
    parkedHorizonMonths: 12,
  };
}

function loadStored(handle: ProjectStorageHandle<StoredMembership>): StoredMembership {
  try {
    const parsed = handle.read();
    if (parsed) {
      if (parsed && Array.isArray(parsed.tiers) && parsed.tiers.length > 0) {
        return { ...defaultStored(), ...parsed, tiers: parsed.tiers.map((t: Partial<MembershipTier>) => ({ ...defaultStored().tiers[0], ...t })) };
      }
    }
  } catch {
    /* storage unreadable — start fresh */
  }
  return defaultStored();
}

const fmt$ = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export function MembershipCard({ project }: { project: PatternProject }) {
  // issue #4 project seam: one scoped store per project; the legacy flat key 'mspl-v1' is folded in on first read, then removed.
  const handle = useMemo(() => projectStorage<StoredMembership>('membership', project.id, ['mspl-v1']), [project.id]);
  const { toast } = useToast();
  const [stored, setStored] = useState(() => loadStored(handle));

  useEffect(() => {
    handle.write(stored);
  }, [stored]);

  const input = useMemo<MembershipInput>(() => ({ ...stored, platform: stored.platform }), [stored]);
  const result = useMemo(() => analyzeMembership(input), [input]);

  const setTier = (index: number, patch: Partial<MembershipTier>) =>
    setStored((s) => ({ ...s, tiers: s.tiers.map((t, i) => (i === index ? { ...t, ...patch } : t)) }));
  const addTier = () =>
    setStored((s) => ({
      ...s,
      tiers: [...s.tiers, { name: 'New Tier', price: 5, members: 10, monthlyChurnPct: 10, perks: ['Monthly pattern'] }],
    }));
  const removeTier = (index: number) =>
    setStored((s) => ({ ...s, tiers: s.tiers.filter((_, i) => i !== index) }));
  const setField = (patch: Partial<StoredMembership>) => setStored((s) => ({ ...s, ...patch }));

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: 'Copied to clipboard' });
    } catch {
      toast({ title: 'Select and copy manually' });
    }
  };

  const verdictColor =
    result.verdict === 'go' ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30' :
    result.verdict === 'no' ? 'bg-destructive/15 text-destructive border-destructive/30' :
    'bg-amber-500/15 text-amber-700 border-amber-500/30';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" /> Membership Planner
        </CardTitle>
        <CardDescription>
          Thinking about a Patreon-style membership? Model the tiers net of platform fees, the cost of
          monthly exclusive patterns, and what a parked pattern really costs your shop — before you commit.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tiers */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">Membership tiers (1–5)</h4>
            <Button
              variant="outline"
              size="sm"
              disabled={stored.tiers.length >= 5}
              onClick={addTier}
            >
              <Plus className="h-4 w-4" /> Add tier
            </Button>
          </div>
          {stored.tiers.map((tier, index) => (
            <div key={index} className="rounded-lg border bg-muted/30 p-4 space-y-3">
              <div className="flex flex-wrap items-end gap-3">
                <div className="min-w-24 grow space-y-1.5">
                  <Label className="text-xs">Tier name</Label>
                  <Input
                    value={tier.name}
                    onChange={(e) => setTier(index, { name: e.target.value })}
                  />
                </div>
                <div className="w-20 min-w-20 space-y-1.5">
                  <Label className="text-xs">Price ($/mo)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={tier.price}
                    onChange={(e) => setTier(index, { price: Number(e.target.value) })}
                  />
                </div>
                <div className="w-20 min-w-20 space-y-1.5">
                  <Label className="text-xs">Members</Label>
                  <Input
                    type="number"
                    min={0}
                    value={tier.members}
                    onChange={(e) => setTier(index, { members: Number(e.target.value) })}
                  />
                </div>
                <div className="w-20 min-w-20 space-y-1.5">
                  <Label className="text-xs">Churn %/mo</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={tier.monthlyChurnPct}
                    onChange={(e) => setTier(index, { monthlyChurnPct: Number(e.target.value) })}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="mt-4 shrink-0"
                  disabled={stored.tiers.length <= 1}
                  onClick={() => removeTier(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Perks (one per line)</Label>
                <textarea
                  className="flex min-h-14 w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={tier.perks.join('\n')}
                  onChange={(e) =>
                    setTier(index, { perks: e.target.value.split('\n').filter((p) => p.trim()) })
                  }
                />
              </div>
            </div>
          ))}
        </div>

        {/* Economics inputs */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="mp-platform">Where you'd self-sell</Label>
            <select
              id="mp-platform"
              className="flex h-9 w-full rounded-md border bg-background px-3 py-1 text-sm"
              value={stored.platform}
              onChange={(e) => setField({ platform: e.target.value as PlatformId })}
            >
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>{PLATFORM_LABELS[p]}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mp-ramp">Ramp to steady state (months)</Label>
            <Input
              id="mp-ramp"
              type="number"
              min={1}
              max={36}
              value={stored.rampMonths}
              onChange={(e) => setField({ rampMonths: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mp-prate">Platform rate (%)</Label>
            <Input
              id="mp-prate"
              type="number"
              min={0}
              max={30}
              value={stored.platformRate}
              onChange={(e) => setField({ platformRate: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mp-pcrate">Processing rate (%)</Label>
            <Input
              id="mp-pcrate"
              type="number"
              min={0}
              max={15}
              value={stored.processingRate}
              onChange={(e) => setField({ processingRate: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mp-eppm">Exclusive patterns / month</Label>
            <Input
              id="mp-eppm"
              type="number"
              min={0}
              max={6}
              value={stored.exclusivePatternsPerMonth}
              onChange={(e) => setField({ exclusivePatternsPerMonth: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mp-epcost">Pattern production cost ($)</Label>
            <Input
              id="mp-epcost"
              type="number"
              min={0}
              value={stored.exclusivePatternCost}
              onChange={(e) => setField({ exclusivePatternCost: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mp-eph">Hours per exclusive pattern</Label>
            <Input
              id="mp-eph"
              type="number"
              min={0}
              value={stored.designerHoursPerPattern}
              onChange={(e) => setField({ designerHoursPerPattern: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mp-rate">Design rate ($/hr)</Label>
            <Input
              id="mp-rate"
              type="number"
              min={12}
              value={stored.designRate}
              onChange={(e) => setField({ designRate: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mp-parked-price">Parked pattern price ($)</Label>
            <Input
              id="mp-parked-price"
              type="number"
              min={0}
              value={stored.parkedPatternPrice}
              onChange={(e) => setField({ parkedPatternPrice: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mp-parked-sales">Sales lost / month</Label>
            <Input
              id="mp-parked-sales"
              type="number"
              min={0}
              value={stored.parkedPatternMonthlySalesLost}
              onChange={(e) => setField({ parkedPatternMonthlySalesLost: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mp-parked-horizon">Parked horizon (months)</Label>
            <Input
              id="mp-parked-horizon"
              type="number"
              min={1}
              max={60}
              value={stored.parkedHorizonMonths}
              onChange={(e) => setField({ parkedHorizonMonths: Number(e.target.value) })}
            />
          </div>
        </div>

        {/* Verdict */}
        <div className="space-y-3 rounded-lg border bg-muted/40 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <Badge className={`${verdictColor} border text-base px-3 py-1 uppercase`}>{result.verdict}</Badge>
            <span className="text-sm font-medium">{result.totalMembers} members · ~{result.monthlyChurnedMembers.toFixed(0)} churn/mo</span>
            <span className="text-sm text-muted-foreground">Breakeven ≈ {result.breakevenMembers} members</span>
          </div>
          <p className="text-sm text-muted-foreground">{result.verdictNote}</p>
          <div className="grid gap-2 sm:grid-cols-5 text-sm">
            <div>Gross/mo<div className="font-semibold">{fmt$(result.grossMonthly)}</div></div>
            <div>Platform fees<div className="font-semibold">{fmt$(result.platformFees)}</div></div>
            <div>Processing<div className="font-semibold">{fmt$(result.processingFees)}</div></div>
            <div>Net/mo<div className="font-semibold">{fmt$(result.netMonthly)}</div></div>
            <div>Production<div className="font-semibold">{fmt$(result.productionCost)}</div></div>
          </div>
          <div className="text-sm">
            <span className={result.profitMonthly >= 0 ? 'text-emerald-700' : 'text-destructive'}>
              Profit/mo after production: <span className="font-semibold">{fmt$(result.profitMonthly)}</span>
            </span>
            {result.cannibalization.parkedLoss > 0 && (
              <span className="ml-2 text-muted-foreground">
                Parked pattern loses {fmt$(result.cannibalization.parkedLoss)} over {stored.parkedHorizonMonths} months
                (replaces lost sales {result.cannibalization.replacementRatio.toFixed(2)}× — {result.cannibalization.verdict}).
              </span>
            )}
          </div>
        </div>

        {/* Flags */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Watch-outs</h4>
          {result.flags.length === 0 && (
            <p className="text-sm text-muted-foreground">Tier structure looks healthy — no red flags.</p>
          )}
          {result.flags.map((f) => (
            <div key={f} className="rounded-md border bg-background p-3 text-sm text-muted-foreground">
              <span className="mr-2">⚠</span>{f}
            </div>
          ))}
        </div>

        {/* Tier page copy */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">Tier page copy (paste-ready)</h4>
            <Button variant="outline" size="sm" onClick={() => copy(result.tierCopy)}>
              <ClipboardCopy className="h-4 w-4" /> Copy
            </Button>
          </div>
          <pre className="whitespace-pre-wrap rounded-md border bg-background p-4 text-sm">
            {result.tierCopy || 'Add tiers to generate copy.'}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}
