import { useState, useEffect, useMemo } from 'react';
import { useProjectStorage, useProjectStorageState } from '@/lib/storage-lib';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Store, ClipboardCopy, AlertTriangle, DollarSign } from 'lucide-react';
import { PatternProject } from '@/lib/grading-engine';
import {
  analyzePlatformMix,
  DEFAULT_MIX,
  type PlatformMixInput,
} from '@/lib/platform-mix-planner';
import { PLATFORM_LABELS, type PlatformId } from '@/lib/pattern-income-calculator';
import { useSettings } from '@/context/SettingsContext';
import { PLATFORM_MIX_COPY } from '@/lib/platform-mix-copy';

const STORAGE_KEY = 'pmix-v1';

interface StoredMix {
  input: PlatformMixInput;
}

function defaultStored(): StoredMix {
  return { input: { ...DEFAULT_MIX, platforms: DEFAULT_MIX.platforms.map((p) => ({ ...p })) } };
}

function loadStored(raw: StoredMix | null): StoredMix {
  try {
    
    
      if (raw && raw.input && Array.isArray(raw.input.platforms)) {
        return {
          input: {
            ...defaultStored().input,
            ...raw.input,
            platforms: raw.input.platforms.map((p: { platform: PlatformId; salesSharePct: number; enabled?: boolean }) => ({
              ...defaultStored().input.platforms.find((d) => d.platform === p.platform)!,
              ...p,
            })),
          },
        };
      }
  } catch {
    /* storage unreadable — start fresh */
  }
  return defaultStored();
}

const fmt$ = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

const fmtDec = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });

export function PlatformMixCard({ project }: { project: PatternProject }) {
  // issue #4 project seam: scoped store per project; flat key folded in on first read, then removed.
  const handle = useProjectStorage<StoredMix>('pmix', project.id, [STORAGE_KEY]);
  const { toast } = useToast();
  const { language } = useSettings();
  const copyText = PLATFORM_MIX_COPY[language];
  const [stored, setStored] = useProjectStorageState(handle, (raw) => loadStored(raw));

  const patchInput = (patch: Partial<PlatformMixInput>) =>
    setStored((s) => ({ input: { ...s.input, ...patch } }));

  const setPlatform = (platform: PlatformId, patch: { salesSharePct?: number; enabled?: boolean }) =>
    setStored((s) => ({
      input: {
        ...s.input,
        platforms: s.input.platforms.map((p) =>
          p.platform === platform ? { ...p, ...patch } : p),
      },
    }));

  const result = useMemo(() => analyzePlatformMix(stored.input), [stored.input]);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: copyText.copied });
    } catch {
      toast({ title: copyText.copyFailed });
    }
  };

  const mixCopy = [
    `Platform mix — ${result.recommendation}`,
    '',
    ...result.perPlatform
      .filter((p) => p.enabled)
      .map((p) =>
        `${PLATFORM_LABELS[p.platform]}: ${p.sales.toFixed(1)} sales/mo · gross ${fmtDec(p.gross)} · net ${fmtDec(p.netRevenue)} · maintenance ${p.maintenanceHours}h (${fmtDec(p.maintenanceCost)}) → ${fmtDec(p.netAfterMaintenance)}/mo after everything`),
    '',
    `TOTAL: ${fmtDec(result.totalGross)} gross · ${fmtDec(result.totalNetAfterMaintenance)} net after fees & maintenance`,
    result.recommendation,
  ].join('\n');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Store className="h-4 w-4" /> {copyText.title}
        </CardTitle>
        <CardDescription>
          {copyText.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Store-wide inputs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="pm-sales" className="text-xs">{copyText.sales}</Label>
            <Input id="pm-sales" type="number" min={0}
              value={stored.input.monthlySales}
              onChange={(e) => patchInput({ monthlySales: Number(e.target.value) || 0 })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pm-price" className="text-xs">{copyText.price}</Label>
            <Input id="pm-price" type="number" min={0} step={0.5}
              value={stored.input.avgPrice}
              onChange={(e) => patchInput({ avgPrice: Number(e.target.value) || 0 })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pm-rate" className="text-xs">{copyText.rate}</Label>
            <Input id="pm-rate" type="number" min={0} step={1}
              value={stored.input.designRate}
              onChange={(e) => patchInput({ designRate: Number(e.target.value) || 0 })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pm-hours" className="text-xs">{copyText.hours}</Label>
            <Input id="pm-hours" type="number" min={0} step={1}
              value={stored.input.marketingHoursAvailable}
              onChange={(e) => patchInput({ marketingHoursAvailable: Number(e.target.value) || 0 })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pm-intl" className="text-xs">{copyText.international}</Label>
            <Input id="pm-intl" type="number" min={0} max={100}
              value={stored.input.internationalSalesPct}
              onChange={(e) => patchInput({ internationalSalesPct: Number(e.target.value) || 0 })} />
          </div>
          <div className="space-y-1.5 col-span-2 flex items-center gap-3 pt-5">
            <Switch id="pm-offsite" checked={stored.input.subjectToOffsiteAds}
              onCheckedChange={(v) => patchInput({ subjectToOffsiteAds: v })} />
            <Label htmlFor="pm-offsite" className="text-xs cursor-pointer">
              {copyText.offsite}
            </Label>
          </div>
        </div>

        {/* Totals strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{copyText.gross}</div>
            <div className="text-xl font-bold">{fmt$(result.totalGross)}</div>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{copyText.fees}</div>
            <div className="text-xl font-bold text-destructive">{fmt$(result.totalFees)}</div>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{copyText.maintenance}</div>
            <div className="text-xl font-bold text-destructive">{fmt$(result.totalMaintenanceCost)}</div>
          </div>
          <div className="rounded-lg border bg-primary/10 border-primary/30 p-3">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{copyText.net}</div>
            <div className={`text-xl font-bold ${result.totalNetAfterMaintenance >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
              {fmt$(result.totalNetAfterMaintenance)}
            </div>
          </div>
        </div>

        {/* Per-platform rows */}
        <div className="space-y-3">
          {result.perPlatform.map((p) => {
            const storedPlatform = stored.input.platforms.find((sp) => sp.platform === p.platform)!;
            return (
            <div key={p.platform} className={`rounded-lg border p-4 space-y-3 ${p.enabled ? 'bg-muted/30' : 'bg-muted/15 opacity-80'}`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Switch checked={p.enabled}
                    onCheckedChange={(v) => setPlatform(p.platform, { enabled: v })} />
                  <div>
                    <div className="font-semibold text-sm">{PLATFORM_LABELS[p.platform]}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {p.maintenanceHours}h/mo maintenance · VAT {p.vatValueNote.split('—')[0].replace('Handles VAT/GST for you', 'handled').replace('VAT/GST remittance is your responsibility for international sales', 'self-remit')}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-bold text-sm ${p.netAfterMaintenance >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                    {fmt$(p.netAfterMaintenance)}/mo
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {p.sales.toFixed(1)} sales · net {fmtDec(p.netRevenue)} · maint {fmtDec(p.maintenanceCost)}
                    {p.offsiteAdsCost > 0 ? ` · offsite ads ${fmtDec(p.offsiteAdsCost)}` : ''}
                  </div>
                </div>
              </div>
              {p.enabled && (
                <div className="flex items-center gap-3">
                  <Label htmlFor={`pm-share-${p.platform}`} className="text-xs shrink-0">Share: {storedPlatform.salesSharePct}%</Label>
                  <Input id={`pm-share-${p.platform}`} type="range" min={0} max={100} step={5}
                    className="h-4"
                    value={storedPlatform.salesSharePct}
                    onChange={(e) => setPlatform(p.platform, { salesSharePct: Number(e.target.value) || 0 })} />
                </div>
              )}
            </div>
          );})}
        </div>

        {/* Watch-outs */}
        {(result.singlePlatformRisk || result.vatBurden || result.marketingCapacityWarning || result.watchOut.items.length > 0) && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-destructive">
              <AlertTriangle className="h-4 w-4" /> Watch-outs
            </div>
            {result.watchOut.items.map((item, i) => (
              <p key={i} className="text-xs text-muted-foreground">{item}</p>
            ))}
          </div>
        )}

        {/* Recommendation */}
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <DollarSign className="h-4 w-4" /> Recommendation
            </div>
            <Button variant="outline" size="sm" onClick={() => copy(mixCopy)}
              className="gap-1 text-xs"><ClipboardCopy className="h-3 w-3" /> Copy</Button>
          </div>
          <p className="text-sm">{result.recommendation}</p>
        </div>
      </CardContent>
    </Card>
  );
}
