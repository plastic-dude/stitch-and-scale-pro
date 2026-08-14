import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { AlertTriangle, Library, Plus, Trash2 } from 'lucide-react';
import { PatternProject } from '@/lib/grading-engine';
import { projectStorage } from '@/lib/storage-lib';
import {
  analyzeDistribution,
  DEFAULT_DISTRIBUTION,
  CHANNEL_LABELS,
  DISTRIBUTION_CHANNELS,
  type DistributionInputs,
  type DistributionChannelId,
  type ChannelAllocation,
  type ChannelNet,
} from '@/lib/subscription-distribution-lab';

function defaultStored(): DistributionInputs {
  return { ...DEFAULT_DISTRIBUTION };
}

function loadStored(handle: ReturnType<typeof projectStorage<DistributionInputs>>): DistributionInputs {
  const parsed = handle.read();
  if (parsed) {
    const merged: DistributionInputs = {
      ...defaultStored(),
      ...parsed,
      allocations: (parsed.allocations ?? DEFAULT_DISTRIBUTION.allocations).filter(
        (a) => DISTRIBUTION_CHANNELS.includes(a.channel) && Number.isFinite(a.share) && a.share > 0,
      ),
    };
    merged.allocations = merged.allocations.length > 0 ? merged.allocations : defaultStored().allocations;
    return merged;
  }
  return defaultStored();
}

const fmt$ = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });

const verdictColor = (v: string) =>
  v === 'ready' ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30' :
  v === 'blocked' ? 'bg-destructive/15 text-destructive border-destructive/30' :
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

const SALE_CHANNELS: DistributionChannelId[] = DISTRIBUTION_CHANNELS.filter(
  (c) => c !== 'library' && c !== 'club',
);

function channelNetBadge(c: ChannelNet) {
  if (c.royaltyMode) return null;
  return (
    <span className="text-xs text-muted-foreground">
      {fmt$(c.netPerSale)}/sale · {c.effectiveFeePct}% cut
    </span>
  );
}

export function SubscriptionDistributionLabCard({ project }: { project: PatternProject }) {
  const handle = useMemo(
    () => projectStorage<DistributionInputs>('subdistlab', project.id || '', []),
    [project.id],
  );
  const [stored, setStored] = useState<DistributionInputs>(() => loadStored(handle));
  useEffect(() => {
    handle.write(stored);
  }, [stored, handle]);

  const result = useMemo(() => analyzeDistribution(stored), [stored]);
  const alloc = (ch: DistributionChannelId): number =>
    stored.allocations.find((a) => a.channel === ch)?.share ?? 0;
  const saleSum = SALE_CHANNELS.reduce((s, ch) => s + alloc(ch), 0);

  const setShare = (ch: DistributionChannelId, share: number) => {
    setStored((s) => {
      const others = s.allocations.filter((a) => a.channel !== ch);
      const allocations: ChannelAllocation[] = share > 0
        ? [...others, { channel: ch, share }]
        : others.filter((a) => DISTRIBUTION_CHANNELS.includes(a.channel) && a.share > 0);
      return { ...s, allocations: allocations.length > 0 ? allocations : s.allocations };
    });
  };

  const toggleChannel = (ch: DistributionChannelId, on: boolean) => {
    if (ch === 'library' || ch === 'club') {
      // royalty channels: add/remove without share math
      setStored((s) => {
        const present = s.allocations.some((a) => a.channel === ch);
        const allocations = present !== on
          ? (on ? [...s.allocations, { channel: ch, share: 1 }] : s.allocations.filter((a) => a.channel !== ch))
          : s.allocations;
        return { ...s, allocations: allocations.length > 0 ? allocations : s.allocations };
      });
      return;
    }
    setShare(ch, on ? 0.1 : 0);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Library className="h-4 w-4" /> Subscription &amp; Distribution Lab
        </CardTitle>
        <CardDescription>
          No tool in the market prices the whole distribution portfolio on one page — GoSadi syncs
          listings without economics, and LoveCrafts, Ribblr and the libraries are storefronts, not
          planners. Same $6 pattern nets ~$5.70 on Ravelry below the commission line, ~$4.98 on Etsy
          and ~$5.68 on LoveCrafts below the selling-fee band — and library placements pay $0.01–$0.45 per download against that. This lab prices
          every channel, the concentration risk of the split (one-channel designers are one policy
          change away from a revenue cliff), and whether your own pattern club beats library
          royalties at the same traffic.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* KPI tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-md border bg-muted/40 p-3 space-y-1">
            <div className="text-xs text-muted-foreground">Monthly gross</div>
            <div className="text-lg font-semibold">{fmt$(result.totalGross)}</div>
            <div className="text-xs text-muted-foreground">{stored.monthlyUnits} units/mo · {fmt$(stored.price)}/sale</div>
          </div>
          <div className="rounded-md border bg-muted/40 p-3 space-y-1">
            <div className="text-xs text-muted-foreground">Monthly net</div>
            <div className="text-lg font-semibold">{fmt$(result.totalNet)}</div>
            <div className="text-xs text-muted-foreground">after {fmt$(result.totalFees)} in fees</div>
          </div>
          <div className="rounded-md border bg-muted/40 p-3 space-y-1">
            <div className="text-xs text-muted-foreground">Lifetime net ({stored.lifetimeMonths} mo)</div>
            <div className="text-lg font-semibold">{fmt$(result.lifetimeNet)}</div>
            <div className="text-xs text-muted-foreground">concentration HHI {result.hhi.toFixed(2)}</div>
          </div>
          <div className="rounded-md border bg-muted/40 p-3 space-y-1">
            <div className="text-xs text-muted-foreground">Months to recover build</div>
            <div className="text-lg font-semibold">{Number.isFinite(result.monthsToRecover) ? `${result.monthsToRecover.toFixed(1)} mo` : '—'}</div>
            <div className="text-xs text-muted-foreground">of {fmt$(stored.buildCost)} build cost</div>
          </div>
        </div>

        {/* Verdict banner */}
        <div className={`rounded-md border p-3 ${verdictColor(result.verdict)}`}>
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <div className="text-sm">
              <span className="font-semibold capitalize">{result.verdict}</span>
              {result.verdict === 'ready' && ' — '}
              <span className="ml-1">{result.verdictReason}</span>
            </div>
          </div>
        </div>

        {/* Channel allocation */}
        <div className="space-y-3">
          <div className="text-sm font-medium">Sale channels — share of expected monthly units</div>
          <div className="space-y-2">
            {SALE_CHANNELS.map((ch) => {
              const share = alloc(ch);
              const entry = result.channels.find((c) => c.channel === ch);
              const on = share > 0;
              return (
                <div key={ch} className={`rounded-md border p-3 space-y-2 ${on ? '' : 'opacity-60'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Switch id={`ch-${ch}`} checked={on} onCheckedChange={(v) => toggleChannel(ch, v)} />
                      <Label htmlFor={`ch-${ch}`} className="text-sm font-medium">{CHANNEL_LABELS[ch]}</Label>
                      {on && entry && channelNetBadge(entry)}
                    </div>
                    {on && (
                      <span className="text-xs text-muted-foreground shrink-0">
                        {((share / (saleSum || 1)) * 100).toFixed(0)}% of sales · {Math.round(share * stored.monthlyUnits / (saleSum || 1))} units
                      </span>
                    )}
                  </div>
                  {on && (
                    <Slider
                      value={[share]} min={0.02} max={1} step={0.02}
                      onValueChange={(v) => setShare(ch, v[0])}
                    />
                  )}
                  {on && entry && (
                    <p className="text-xs text-muted-foreground leading-relaxed">{entry.note}</p>
                  )}
                </div>
              );
            })}
          </div>
          <div className="text-xs text-muted-foreground">
            Shares re-normalize to 100% across active sale channels; {Math.round(stored.monthlyUnits)} units/mo spread by share.
          </div>
        </div>

        {/* Royalty channels */}
        <div className="space-y-3">
          <div className="text-sm font-medium">Royalty channels — additive, no share math</div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className={`rounded-md border p-3 space-y-2 ${alloc('library') > 0 ? '' : 'opacity-60'}`}>
              <div className="flex items-center justify-between">
                <Label htmlFor="ch-library" className="text-sm font-medium">{CHANNEL_LABELS.library}</Label>
                <Switch id="ch-library" checked={alloc('library') > 0} onCheckedChange={(v) => toggleChannel('library', v)} />
              </div>
              <NumField id="dist-library-royalty" label="Royalty per download" value={stored.libraryRoyaltyPerDownload}
                onChange={(n) => setStored((s) => ({ ...s, libraryRoyaltyPerDownload: n }))} step={0.01} suffix="/dl" />
              {alloc('library') > 0 && result.channels.find((c) => c.channel === 'library') && (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {result.channels.find((c) => c.channel === 'library')!.note}
                </p>
              )}
            </div>
            <div className={`rounded-md border p-3 space-y-2 ${alloc('club') > 0 ? '' : 'opacity-60'}`}>
              <div className="flex items-center justify-between">
                <Label htmlFor="ch-club" className="text-sm font-medium">{CHANNEL_LABELS.club}</Label>
                <Switch id="ch-club" checked={alloc('club') > 0} onCheckedChange={(v) => toggleChannel('club', v)} />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <NumField id="dist-club-members" label="Members" value={stored.clubMembers}
                  onChange={(n) => setStored((s) => ({ ...s, clubMembers: n }))} step={1} />
                <NumField id="dist-club-dlrate" label="Downloads/member/mo" value={stored.clubDownloadsPerMember}
                  onChange={(n) => setStored((s) => ({ ...s, clubDownloadsPerMember: Math.min(n, 1) }))} step={0.05} />
                <NumField id="dist-club-rate" label="Rate per pattern" value={stored.clubRate}
                  onChange={(n) => setStored((s) => ({ ...s, clubRate: n }))} step={0.5} suffix="$" />
              </div>
              {alloc('club') > 0 && (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {result.channels.find((c) => c.channel === 'club')?.note}
                </p>
              )}
            </div>
          </div>
          {result.subscription.clubMonthlyNet > 0 && (
            <div className="rounded-md border bg-muted/40 p-3 text-xs space-y-1">
              <div className="font-medium text-sm">Club vs library at current traffic</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div>Club monthly <span className="font-semibold">{fmt$(result.subscription.clubMonthlyNet)}</span></div>
                <div>Club annual <span className="font-semibold">{fmt$(result.subscription.clubAnnualNet)}</span></div>
                <div>Library annual at {stored.monthlyUnits} units/mo <span className="font-semibold">{fmt$(result.subscription.libraryAnnualNetAtUnits)}</span></div>
                <div>Library needs <span className="font-semibold">
                  {Number.isFinite(result.subscription.libraryBreakevenUnits) ? `${result.subscription.libraryBreakevenUnits.toFixed(1)} dl/mo` : '—'}
                </span> to match club</div>
              </div>
            </div>
          )}
        </div>

        {/* Settings */}
        <div className="space-y-3">
          <div className="text-sm font-medium">Pricing &amp; volume</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <NumField id="dist-price" label="Pattern price" value={stored.price}
              onChange={(n) => setStored((s) => ({ ...s, price: n }))} min={0.5} step={0.5} suffix="$" />
            <NumField id="dist-monthly" label="Expected monthly units" value={stored.monthlyUnits}
              onChange={(n) => setStored((s) => ({ ...s, monthlyUnits: n }))} step={1} />
            <NumField id="dist-lifetime" label="Pattern lifetime" value={stored.lifetimeMonths}
              onChange={(n) => setStored((s) => ({ ...s, lifetimeMonths: n }))} min={1} step={1} suffix="mo" />
            <NumField id="dist-buildcost" label="Build cost to recover" value={stored.buildCost}
              onChange={(n) => setStored((s) => ({ ...s, buildCost: n }))} step={5} suffix="$" />
          </div>
        </div>

        {/* Flags */}
        {result.flags.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Flags</div>
            {result.flags.map((f, i) => (
              <div key={i} className={`rounded-md border p-2.5 text-xs flex gap-2 ${
                f.severity === 'error' ? 'border-destructive/40 bg-destructive/10' :
                f.severity === 'warning' ? 'border-amber-500/40 bg-amber-500/10' :
                'border-border bg-muted/40'}`}>
                <Badge variant="outline" className="shrink-0">{f.code}</Badge>
                <span>{f.message}</span>
              </div>
            ))}
          </div>
        )}

        {/* Money line */}
        <p className="text-xs text-muted-foreground leading-relaxed border-t pt-3">{result.moneyLine}</p>

        {/* Sources */}
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Sources: Ravelry, Etsy, Ribblr and Payhip fee pages + platformNet seams; LoveCrafts
          designer handbook (May 2026, 2% + $0.20 plus 3.5% selling fee between $40–$1,500/mo,
          ~30-day payment lag); subscription-library royalty band $0.01–$0.45/download from
          designer anecdotes documented in session-46 research. All figures are planning models,
          not promises.
        </p>
      </CardContent>
    </Card>
  );
}
