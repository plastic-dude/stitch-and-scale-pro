/**
 * Yarn Pool Lab (CHK-059) — the 57th workspace tab.
 *
 * Competitor flaw (session-59 research): every tool tells designers to
 * "buy wholesale" but none answers what to order, with whom, and whether
 * the cash locked in yarn is worth it. Mills want 10–50 kg per colorway;
 * an indie needs 2–5 kg. This lab aggregates yarn demand across a
 * catalog (or a pool of designers), walks the price ladder from retail
 * to mill-direct, and prices the cash lock-up honestly.
 */
import React, { useMemo, useState, useEffect } from 'react';
import { projectStorage, type ProjectStorageHandle } from '@/lib/storage-lib';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  analyzeYarnPool,
  DEFAULT_POOL,
  DEFAULT_COLORWAY,
  TIER_LABELS,
  type YarnPoolInput,
  type YarnColorway,
  type PoolMember,
  type SourceTier,
} from '@/lib/yarn-pool-lab';
import { PatternProject } from '@/lib/grading-engine';
import {
  Boxes,
  Flag,
  Lightbulb,
  TrendingUp,
  Trash2,
  Plus,
  Package,
  Users,
} from 'lucide-react';

const STORAGE_KEY = 'stitch-and-scale-yarnpool-v1';

interface StoredState {
  input?: YarnPoolInput;
}

function loadStored(handle: ProjectStorageHandle<StoredState>): StoredState {
  try {
    const parsed = handle.read();
    if (parsed?.input && Array.isArray((parsed as StoredState).input?.colorways)) return parsed as StoredState;
  } catch {
    /* storage unreadable — start fresh */
  }
  return { input: DEFAULT_POOL };
}

function numField(value: string): number {
  const n = parseFloat(value);
  return isFinite(n) ? n : 0;
}

function StatBox({ label, value, tone }: { label: string; value: string; tone?: 'good' | 'warn' | 'bad' }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p
        className={cn(
          'text-lg font-semibold',
          tone === 'good' && 'text-emerald-600',
          tone === 'warn' && 'text-amber-600',
          tone === 'bad' && 'text-red-600',
        )}
      >
        {value}
      </p>
    </div>
  );
}

const TIER_TONES: Record<SourceTier, 'good' | 'warn' | 'bad'> = {
  millDirect: 'good',
  wholesale: 'good',
  retailBulk: 'warn',
  retail: 'bad',
};

export function YarnPoolLabCard({ project }: { project: PatternProject }) {
  const handle = useMemo(() => projectStorage<StoredState>('yarnpool', project.id, [STORAGE_KEY]), [project.id]);
  const { toast } = useToast();
  const [stored, setStored] = useState<StoredState>(() => loadStored(handle));
  useEffect(() => {
    handle.write(stored);
  }, [stored]);

  const input = stored.input ?? DEFAULT_POOL;

  const updateInput = (patch: Partial<YarnPoolInput>) => setStored(s => ({ input: { ...s.input!, ...patch } }));
  const updateColorway = (idx: number, patch: Partial<YarnColorway>) =>
    setStored(s => ({
      input: {
        ...s.input!,
        colorways: (s.input?.colorways ?? []).map((c, i) => (i === idx ? { ...c, ...patch } : c)),
      },
    }));
  const updateMember = (idx: number, patch: Partial<PoolMember>) =>
    setStored(s => ({
      input: {
        ...s.input!,
        members: (s.input?.members ?? []).map((m, i) => (i === idx ? { ...m, ...patch } : m)),
      },
    }));

  const analysis = useMemo(() => analyzeYarnPool(input), [input]);

  const [cwName, setCwName] = useState('');
  const [cwGrams, setCwGrams] = useState('');
  const [cwRetail, setCwRetail] = useState('');
  const [cwMill, setCwMill] = useState('');

  const addColorway = () => {
    if (!cwGrams || (input.colorways || []).length >= 6) {
      toast({ title: 'Add grams needed (max 6 colorways).' });
      return;
    }
    setStored(s => ({
      input: {
        ...s.input!,
        colorways: [
          ...(s.input?.colorways ?? []),
          {
            ...DEFAULT_COLORWAY,
            name: cwName || `Colorway ${(s.input?.colorways?.length ?? 0) + 1}`,
            gramsNeeded: numField(cwGrams),
            retailPricePerKg: numField(cwRetail) || 45,
            millPricePerKg: numField(cwMill) || 24,
          },
        ],
      },
    }));
    setCwName('');
    setCwGrams('');
    setCwRetail('');
    setCwMill('');
  };

  const removeColorway = (i: number) => {
    if ((input.colorways || []).length <= 1) return;
    setStored(s => ({
      input: { ...s.input!, colorways: (s.input?.colorways ?? []).filter((_, idx) => idx !== i) },
    }));
  };

  const [mName, setMName] = useState('');
  const [mGrams, setMGrams] = useState('');

  const addMember = () => {
    if (!mGrams || (input.members || []).length >= 8) {
      toast({ title: 'Add grams needed (max 8 pool members).' });
      return;
    }
    setStored(s => ({
      input: {
        ...s.input!,
        members: [
          ...(s.input?.members ?? []),
          { name: mName || `Pattern ${(s.input?.members?.length ?? 0) + 1}`, gramsNeeded: numField(mGrams) },
        ],
      },
    }));
    setMName('');
    setMGrams('');
  };

  const removeMember = (i: number) => {
    if ((input.members || []).length <= 1) return;
    setStored(s => ({
      input: { ...s.input!, members: (s.input?.members ?? []).filter((_, idx) => idx !== i) },
    }));
  };

  const fmt$ = (n: number) =>
    n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  const fmtKg = (g: number) => `${(g / 1000).toFixed(2)} kg`;
  const fmtM = (n: number) => (isFinite(n) ? Math.max(1, Math.round(n)).toString() : '∞');

  const colorways = input.colorways ?? [DEFAULT_COLORWAY];
  const members = input.members ?? DEFAULT_POOL.members;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Boxes className="size-5" />
          Yarn Pool Lab
        </CardTitle>
        <CardDescription>
          Competitors say "buy wholesale" but never answer what to order or whether the cash locked
          in yarn is worth it. Mills want 20+ kg per colorway; you need 2–5. This lab pools your
          catalog's demand, walks the price ladder to mill-direct, and prices the cash lock-up.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* ---- Colorways ---- */}
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Package className="size-4" />
            <Label className="text-base font-semibold">Colorways (one row per dye lot)</Label>
          </div>
          <div className="space-y-4">
            {colorways.map((c, i) => (
              <div key={i} className="grid gap-3 rounded-lg border p-4 sm:grid-cols-5">
                <div>
                  <Label htmlFor={`yp-cw-name-${i}`}>Colorway name</Label>
                  <Input
                    id={`yp-cw-name-${i}`}
                    value={c.name}
                    onChange={e => updateColorway(i, { name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor={`yp-cw-grams-${i}`}>Yarn need (g)</Label>
                  <Input
                    id={`yp-cw-grams-${i}`}
                    type="number"
                    min={0}
                    value={c.gramsNeeded.toString()}
                    onChange={e => updateColorway(i, { gramsNeeded: numField(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor={`yp-cw-retail-${i}`}>Retail $/kg</Label>
                  <Input
                    id={`yp-cw-retail-${i}`}
                    type="number"
                    min={0}
                    step={0.5}
                    value={c.retailPricePerKg.toString()}
                    onChange={e => updateColorway(i, { retailPricePerKg: numField(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor={`yp-cw-mill-${i}`}>Mill $/kg</Label>
                  <Input
                    id={`yp-cw-mill-${i}`}
                    type="number"
                    min={0}
                    step={0.5}
                    value={c.millPricePerKg.toString()}
                    onChange={e => updateColorway(i, { millPricePerKg: numField(e.target.value) })}
                  />
                </div>
                <div className="flex items-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground"
                    onClick={() => removeColorway(i)}
                    disabled={colorways.length <= 1}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
            {colorways.length < 6 && (
              <div className="grid gap-3 rounded-lg border border-dashed p-4 sm:grid-cols-5">
                <Input placeholder="New colorway" value={cwName} onChange={e => setCwName(e.target.value)} />
                <Input placeholder="Grams" type="number" value={cwGrams} onChange={e => setCwGrams(e.target.value)} />
                <Input placeholder="Retail $/kg" type="number" value={cwRetail} onChange={e => setCwRetail(e.target.value)} />
                <Input placeholder="Mill $/kg" type="number" value={cwMill} onChange={e => setCwMill(e.target.value)} />
                <Button type="button" size="sm" onClick={addColorway}>
                  <Plus className="size-4" /> Add
                </Button>
              </div>
            )}
            <p className="text-[11px] text-muted-foreground">
              Mill tiers default to 20 kg/colorway MOQ, $250 dealer minimum, and 1 kg bulk minimum —
              adjust in the advanced fields below each colorway if your suppliers differ.
            </p>
          </div>
        </div>

        {/* ---- Pool members ---- */}
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Users className="size-4" />
            <Label className="text-base font-semibold">Pool members (patterns + designers)</Label>
          </div>
          <div className="space-y-3">
            {members.map((m, i) => (
              <div key={i} className="flex items-end gap-3">
                <div className="grow">
                  <Label htmlFor={`yp-m-name-${i}`}>Member</Label>
                  <Input
                    id={`yp-m-name-${i}`}
                    value={m.name}
                    onChange={e => updateMember(i, { name: e.target.value })}
                  />
                </div>
                <div className="w-40">
                  <Label htmlFor={`yp-m-grams-${i}`}>Yarn (g)</Label>
                  <Input
                    id={`yp-m-grams-${i}`}
                    type="number"
                    min={0}
                    value={m.gramsNeeded.toString()}
                    onChange={e => updateMember(i, { gramsNeeded: numField(e.target.value) })}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mb-px text-muted-foreground"
                  onClick={() => removeMember(i)}
                  disabled={members.length <= 1}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
            {members.length < 8 && (
              <div className="flex items-end gap-3">
                <Input className="grow" placeholder="Pattern or designer" value={mName} onChange={e => setMName(e.target.value)} />
                <Input className="w-40" placeholder="Grams" type="number" value={mGrams} onChange={e => setMGrams(e.target.value)} />
                <Button type="button" size="sm" onClick={addMember}>
                  <Plus className="size-4" /> Add
                </Button>
              </div>
            )}
            <p className="text-[11px] text-muted-foreground">
              Each member's grams aggregate into their colorway's pool — that's what unlocks the tier.
            </p>
          </div>
        </div>

        {/* ---- Context ---- */}
        <div>
          <div className="mb-3 flex items-center gap-2">
            <TrendingUp className="size-4" />
            <Label className="text-base font-semibold">Cash and timing context</Label>
          </div>
          <div className="grid gap-4 sm:grid-cols-4">
            <div>
              <Label htmlFor="yp-months">Monthly revenue ($)</Label>
              <Input
                id="yp-months"
                type="number"
                min={0}
                value={input.monthlyRevenue.toString()}
                onChange={e => updateInput({ monthlyRevenue: numField(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="yp-runway">Production runway (months)</Label>
              <Input
                id="yp-runway"
                type="number"
                min={1}
                max={36}
                value={input.productionRunwayMonths.toString()}
                onChange={e => updateInput({ productionRunwayMonths: numField(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="yp-stash">Stash on hand (g)</Label>
              <Input
                id="yp-stash"
                type="number"
                min={0}
                value={input.stashGrams.toString()}
                onChange={e => updateInput({ stashGrams: numField(e.target.value) })}
              />
            </div>
            <div className="flex items-end gap-2 pb-1">
              <input
                id="yp-groupbuy"
                type="checkbox"
                checked={input.groupBuyAvailable}
                onChange={e => updateInput({ groupBuyAvailable: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="yp-groupbuy" className="cursor-pointer">
                A group buy / co-op path is open
              </Label>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Yarn bought today is cash that can't pay test-knitters or tech editors next month —
            the lab measures how many months of revenue the outlay locks up.
          </p>
        </div>

        {/* ---- Results ---- */}
        <div>
          <div className="mb-3 flex items-center gap-2">
            <TrendingUp className="size-4" />
            <Label className="text-base font-semibold">The pooled numbers</Label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatBox label="Total yarn needed" value={fmtKg(analysis.totalGrams)} />
            <StatBox label="Pooled order cost" value={fmt$(analysis.totalCost)} tone={analysis.totalCost > 0 ? 'warn' : undefined} />
            <StatBox
              label="Savings vs everyone buying retail"
              value={fmt$(analysis.totalSavings)}
              tone={analysis.totalSavings > 0 ? 'good' : 'bad'}
            />
            <StatBox
              label="Cash locked vs monthly revenue"
              value={isFinite(analysis.cashLockedMonths) ? `≈${fmtM(analysis.cashLockedMonths)} mo` : '∞'}
              tone={isFinite(analysis.cashLockedMonths) && analysis.cashLockedMonths > input.productionRunwayMonths ? 'bad' : isFinite(analysis.cashLockedMonths) ? 'warn' : undefined}
            />
          </div>
          <div className="mt-4 overflow-hidden rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Colorway</th>
                  <th className="px-3 py-2 text-right font-medium">Need</th>
                  <th className="px-3 py-2 text-right font-medium">Tier reached</th>
                  <th className="px-3 py-2 text-right font-medium">$/kg</th>
                  <th className="px-3 py-2 text-right font-medium">Cost</th>
                  <th className="px-3 py-2 text-right font-medium">Saved</th>
                </tr>
              </thead>
              <tbody>
                {analysis.colorways.map(c => (
                  <tr key={c.key} className="border-t">
                    <td className="px-3 py-2">{c.name}</td>
                    <td className="px-3 py-2 text-right">{fmtKg(c.gramsNeeded)}</td>
                    <td className="px-3 py-2 text-right">
                      <Badge variant="outline" className={cn(TIER_TONES[c.tierReached] === 'good' && 'border-emerald-300 text-emerald-700', TIER_TONES[c.tierReached] === 'warn' && 'border-amber-300 text-amber-700', TIER_TONES[c.tierReached] === 'bad' && 'border-red-300 text-red-700')}>
                        {TIER_LABELS[c.tierReached]}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-right">{fmt$(c.pricePerKg)}</td>
                    <td className="px-3 py-2 text-right">{fmt$(c.cost)}</td>
                    <td className={cn('px-3 py-2 text-right', c.savings > 0 ? 'text-emerald-600' : 'text-muted-foreground')}>{fmt$(c.savings)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ---- Flags ---- */}
        {analysis.flags.length > 0 && (
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Flag className="size-4" />
              <Label className="text-base font-semibold">Warnings</Label>
            </div>
            <div className="space-y-2">
              {analysis.flags.map(f => (
                <div key={f.code} className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <Badge variant="outline" className="bg-amber-100 text-amber-800 shrink-0">{f.code}</Badge>
                  <div>
                    <p className="text-sm font-medium">{f.title}</p>
                    <p className="text-xs text-muted-foreground">{f.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ---- Verdict ---- */}
        <div
          className={cn(
            'rounded-lg border p-4',
            analysis.verdict.startsWith('Mill it') && 'border-emerald-200 bg-emerald-50',
            (analysis.verdict.includes('wholesale tier') || analysis.verdict.includes('dealer')) && 'border-emerald-200 bg-emerald-50',
            analysis.verdict.startsWith('Pool it') && !analysis.verdict.includes('wholesale tier') && 'border-amber-200 bg-amber-50',
            analysis.verdict.startsWith('Too small') && 'border-red-200 bg-red-50',
            analysis.verdict.startsWith('Nothing') && 'border-gray-200 bg-gray-50',
          )}
        >
          <div className="flex items-center gap-2">
            <Lightbulb className={cn('size-4', analysis.verdict.includes('Mill it') || analysis.verdict.includes('wholesale tier') || analysis.verdict.includes('dealer') ? 'text-emerald-600' : 'text-amber-600')} />
            <span className={cn('text-lg font-semibold', analysis.verdict.includes('Mill it') || analysis.verdict.includes('wholesale tier') || analysis.verdict.includes('dealer') ? 'text-emerald-700' : analysis.verdict.startsWith('Too small') ? 'text-red-700' : 'text-amber-700')}>
              {analysis.verdict}
            </span>
          </div>
          <p className="mt-2 text-sm leading-relaxed">{analysis.verdictNote}</p>
        </div>
      </CardContent>
    </Card>
  );
}
