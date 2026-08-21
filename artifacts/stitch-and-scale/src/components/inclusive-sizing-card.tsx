import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useSettings } from '@/context/SettingsContext';
import { INCLUSIVE_SIZING_COPY } from '@/lib/inclusive-sizing-copy';
import { ClipboardCopy, Plus, Ruler, AlertTriangle, Accessibility } from 'lucide-react';
import { PatternProject } from '@/lib/grading-engine';
import {
  ADAPTIVE_MODS,
  DEFAULT_DESIGN_RATE,
  PROFESSIONAL_FLOOR,
  analyzeInclusiveSizing,
  buildInclusivePack,
} from '@/lib/inclusive-sizing-analyzer';
import { platformNet, PLATFORM_LABELS } from '@/lib/pattern-income-calculator';
import { copyTextOrThrow } from '@/lib/clipboard';

const STORAGE_KEY = 'sncis-v1';

type SizeRow = { label: string; bust: number; cup: string; broad: boolean };

type Stored = {
  platform: string;
  price: number;
  monthlySales: number;
  designRate: number;
  gradeRule: number;
  includeCupOptions: boolean;
  includePetiteTall: boolean;
  mods: string[];
  sizes: SizeRow[];
};

const DEFAULT_SIZES: SizeRow[] = [
  { label: 'XS', bust: 31, cup: '', broad: false },
  { label: 'S', bust: 34, cup: '', broad: false },
  { label: 'M', bust: 38, cup: '', broad: false },
  { label: 'L', bust: 42, cup: '', broad: false },
  { label: 'XL', bust: 46, cup: '', broad: false },
  { label: '2XL', bust: 50, cup: '', broad: false },
];

import { useProjectStorage, useProjectStorageState } from '@/lib/storage-lib';

// CHK-152: pure derivation over the raw stored value — takes no
// handle, so it can never reach for a freshly-created handle in an initializer.
function loadStored(raw: Stored | null): Stored {
  try {
    
    if (raw && typeof raw === 'object' && typeof raw.price === 'number') return raw;
  } catch {
    // fall through
  }
  return {
    platform: 'ravelry',
    price: 8,
    monthlySales: 40,
    designRate: DEFAULT_DESIGN_RATE,
    gradeRule: 2,
    includeCupOptions: false,
    includePetiteTall: false,
    mods: [],
    sizes: DEFAULT_SIZES,
  };
}

type Props = { project: PatternProject };

function Field(props: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex flex-col gap-1">
      <Label className="text-xs text-muted-foreground">{props.label}</Label>
      <Input
        type="number"
        inputMode="decimal"
        className="h-8"
        value={props.value}
        onChange={e => {
          const v = parseFloat(e.target.value);
          props.onChange(Number.isFinite(v) ? v : 0);
        }}
      />
    </div>
  );
}

export function InclusiveSizingCard({ project }: Props) {
  const { toast } = useToast();
  const { language } = useSettings();
  const copy = INCLUSIVE_SIZING_COPY[language];
  // issue #4 project seam: one scoped store per project; the legacy flat key 'sncis-v1' is folded in on first read, then removed.
  // CHK-152 (QUEUE-010): the old useMemo handle + `useState(() =>
// loadStored(handle))` lazy initializer was the crash class under HMR.
// Now flows through the shared seam: stable handle, memoized derivation.
const handle = useProjectStorage<Stored>('incsizing', project.id, ['sncis-v1']);
  const [stored, setStored] = useProjectStorageState(handle, (raw) => loadStored(raw));
  // CHK-152: persistence owned by the seam's state hook — a manual
  // write-on-change effect would double-write every update.

  const sizeRows = stored.sizes.length > 0 ? stored.sizes : DEFAULT_SIZES;

  const result = useMemo(() => {
    if (!project) return null;
    return analyzeInclusiveSizing({
      project,
      yarnWeight: (project.yarnWeight as never) || 'worsted',
      platform: stored.platform as never,
      patternPrice: stored.price,
      monthlySales: stored.monthlySales,
      designRate: stored.designRate,
      sizeOptions: sizeRows.map(s => ({
        label: s.label,
        bust: s.bust,
        cup: s.cup ? (s.cup as never) : undefined,
        broadShoulders: s.broad,
      })),
      includeCupOptions: stored.includeCupOptions,
      includePetiteTall: stored.includePetiteTall,
      gradeRule: stored.gradeRule,
      mods: stored.mods,
    });
  }, [project, stored, sizeRows]);

  const pack = useMemo(() => (result ? buildInclusivePack(result) : null), [result]);

  const update = (patch: Partial<Stored>) => setStored(s => ({ ...s, ...patch }));

  const copyToClipboard = (text: string) => {
    copyTextOrThrow(text)
      .then(() => toast({ title: copy.copied }))
      .catch(() => toast({ title: copy.copyManual }));
  };

  const verdictBadge = (verdict: string) => {
    if (verdict === 'genuinely-inclusive')
      return <Badge variant="default" className="bg-emerald-700">{copy.inclusive}</Badge>;
    if (verdict === 'partial')
      return <Badge variant="outline" className="border-amber-500 text-amber-700">{copy.partial}</Badge>;
    if (verdict === 'naive-scaling')
      return <Badge variant="outline" className="border-rose-500 text-rose-700">{copy.naive}</Badge>;
    return <Badge variant="outline" className="border-rose-500 text-rose-700">{copy.notInclusive}</Badge>;
  };

  if (!project || !result || !pack) return null;

  const yardageTotal = result.effort.yardageBySize.reduce((s, y) => s + y.yards, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Accessibility className="h-4 w-4" />
          {copy.title}
        </CardTitle>
        <CardDescription className="text-xs leading-relaxed">
          {copy.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label={copy.price} value={stored.price} onChange={v => update({ price: v })} />
          <Field label={copy.monthlySales} value={stored.monthlySales} onChange={v => update({ monthlySales: v })} />
          <Field label={copy.designRate} value={stored.designRate} onChange={v => update({ designRate: v })} />
          <Field label={copy.gradeRule} value={stored.gradeRule} onChange={v => update({ gradeRule: v })} />
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">{copy.salePlatform}</Label>
            <select
              className="h-8 rounded-md border bg-background px-2 text-sm"
              value={stored.platform}
              onChange={e => update({ platform: e.target.value })}
            >
              {Object.entries(PLATFORM_LABELS).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col justify-end gap-2 pb-1">
            <label className="flex items-center gap-2 text-xs">
              <Switch
                checked={stored.includeCupOptions}
                onCheckedChange={v => update({ includeCupOptions: v })}
              />
              {copy.cupOptions}
            </label>
            <label className="flex items-center gap-2 text-xs">
              <Switch
                checked={stored.includePetiteTall}
                onCheckedChange={v => update({ includePetiteTall: v })}
              />
              {copy.petiteTall}
            </label>
          </div>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground">{copy.sizeRange}</Label>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {sizeRows.map((s, i) => (
              <div key={i} className="flex items-center gap-1 rounded-md border bg-card px-1.5 py-0.5">
                <input
                  className="w-12 bg-transparent text-xs outline-none"
                  value={s.label}
                  onChange={e => {
                    const rows = [...sizeRows];
                    rows[i] = { ...rows[i], label: e.target.value };
                    update({ sizes: rows });
                  }}
                />
                <input
                  className="w-9 bg-transparent text-xs outline-none"
                  type="number"
                  inputMode="decimal"
                  value={s.bust}
                  onChange={e => {
                    const v = parseFloat(e.target.value);
                    const rows = [...sizeRows];
                    rows[i] = { ...rows[i], bust: Number.isFinite(v) ? v : rows[i].bust };
                    update({ sizes: rows });
                  }}
                />
                <span className="text-[10px] text-muted-foreground">bust</span>
                <button
                  className="rounded px-0.5 text-[10px] hover:bg-muted"
                  title="Cup option"
                  onClick={() => {
                    const rows = [...sizeRows];
                    rows[i] = { ...rows[i], cup: rows[i].cup ? '' : 'C' };
                    update({ sizes: rows });
                  }}
                >
                  {s.cup ? s.cup : '○'}
                </button>
                <button
                  className="rounded px-0.5 text-[10px] hover:bg-muted"
                  title="Broad shoulders"
                  onClick={() => {
                    const rows = [...sizeRows];
                    rows[i] = { ...rows[i], broad: !rows[i].broad };
                    update({ sizes: rows });
                  }}
                >
                  {s.broad ? '⊂' : '○'}
                </button>
                <button
                  className="rounded px-0.5 text-[10px] text-rose-600 hover:bg-rose-50"
                  onClick={() => update({ sizes: sizeRows.filter((_, j) => j !== i) })}
                >
                  ×
                </button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="h-6 gap-1 px-2 text-xs"
              onClick={() => {
                const max = Math.max(...sizeRows.map(s => s.bust));
                const nextLabel = `${Math.floor(max / 4) + 1}XL`;
                update({ sizes: [...sizeRows, { label: nextLabel, bust: max + 4, cup: '', broad: false }] });
              }}
            >
              <Plus className="h-3 w-3" /> {copy.addSize}
            </Button>
          </div>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground">{copy.adaptiveMods}</Label>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {ADAPTIVE_MODS.map(m => (
              <label
                key={m.id}
                className={`flex cursor-pointer items-center gap-1 rounded-md border px-2 py-1 text-xs ${stored.mods.includes(m.id) ? 'border-emerald-600 bg-emerald-50' : 'bg-card'}`}
              >
                <Switch
                  checked={stored.mods.includes(m.id)}
                  onCheckedChange={v =>
                    update({ mods: v ? [...stored.mods, m.id] : stored.mods.filter(x => x !== m.id) })
                  }
                />
                {m.label}
                <span className="text-[10px] text-muted-foreground">${Math.round(m.hours * (stored.designRate || DEFAULT_DESIGN_RATE))}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-md border bg-muted/40 p-3 md:grid-cols-4">
          <div>
            <div className="text-xs text-muted-foreground">{copy.audit}</div>
            <div className="text-lg font-semibold">
              {result.audit.score}/6 {verdictBadge(result.audit.verdict)}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">{copy.effortHours}</div>
            <div className="text-lg font-semibold">{result.effort.totalEffortHours.toFixed(1)}hr</div>
            <div className="text-xs text-muted-foreground">
              {result.effort.gradingHours.toFixed(1)} grade · {result.effort.yardageReestimateHours.toFixed(1)} yardage ·{' '}
              {result.effort.testKnitHours.toFixed(1)} test knit
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">{copy.effortCost}</div>
            <div className="text-lg font-semibold">${result.effort.effortCost.toFixed(0)}</div>
            <div className="text-xs text-muted-foreground">+ ${result.effort.techEditCost} tech edit</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">{copy.launchBaseline}</div>
            <div className="text-lg font-semibold">${result.pricing.marketPrice.toFixed(0)}</div>
            <div className={`text-xs ${result.pricing.shortfall > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
              {result.pricing.shortfall > 0 ? `Shortfall $${result.pricing.shortfall.toFixed(0)}` : 'Range effort covered'}
            </div>
          </div>
        </div>

        {result.effort.wolcottFlag && (
          <p className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-2 text-xs text-amber-800">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {result.effort.wolcottFlag}
          </p>
        )}

        <div>
          <Label className="text-xs text-muted-foreground">{copy.yardage}</Label>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {result.effort.yardageBySize.map((y, i) => (
              <span key={i} className="rounded-md border bg-card px-2 py-1 text-xs">
                <strong>{y.label}</strong> {y.bust}" bust — {y.yards.toLocaleString()}yd
                {y.yarnCostNote ? (
                  <span className="ml-1 text-rose-600">⚠ grown</span>
                ) : null}
              </span>
            ))}
            <span className="self-center text-xs text-muted-foreground">
              Σ {yardageTotal.toLocaleString()}yd across the range
            </span>
          </div>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground">{copy.pricing}</Label>
          <ul className="mt-1 flex flex-col gap-1">
            {result.pricing.strategy.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                <Ruler className="mt-0.5 h-3 w-3 shrink-0" /> {s}
              </li>
            ))}
            {result.mods.length > 0 && (
              <li className="flex items-start gap-2 text-xs text-muted-foreground">
                <Accessibility className="mt-0.5 h-3 w-3 shrink-0" />
                Adaptive mods quoted: $${result.totalModFee} total ({result.mods.length} technique
                {result.mods.length === 1 ? '' : 's'} at {Math.max(stored.designRate, PROFESSIONAL_FLOOR)}/hr)
              </li>
            )}
          </ul>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground">{copy.auditLabel}</Label>
          <ul className="mt-1 flex flex-col gap-1">
            {pack.items.map((item, i) => (
              <li key={i} className={`flex items-start gap-2 text-xs ${item.flag ? 'text-rose-600' : 'text-muted-foreground'}`}>
                <span>{item.flag ? '✗' : '✓'}</span>
                <span>
                  {item.check}
                  <span className="block text-[11px] text-muted-foreground/80">{item.rationale}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">{copy.launchCopy}</Label>
          <pre className="whitespace-pre-wrap rounded-md border bg-card p-2 text-xs text-foreground">
            {pack.launchCopy}
          </pre>
          <Button variant="outline" size="sm" className="w-fit gap-1" onClick={() => copyToClipboard(pack.launchCopy)}>
            <ClipboardCopy className="h-3.5 w-3.5" /> {copy.copyLaunch}
          </Button>
        </div>

        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">{copy.notes}</Label>
          <ul className="flex flex-col gap-0.5">
            {result.notes.map((n, i) => (
              <li key={i} className="text-[11px] leading-relaxed text-muted-foreground">— {n}</li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
