import { useMemo, useState } from 'react';
import {
  Store,
  Tag,
  AlertTriangle,
  AlertCircle,
  Info,
  Package,
  CalendarClock,
  TrendingDown,
  Banknote,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  analyzeReprice,
  type RepriceInput,
  hydrateRepriceState,
  applyRepricePatch,
  REPRICE_DEFAULTS,
} from '@/lib/consignment-reprice-lab';
import { projectStorage } from '@/lib/storage-lib';
import { PatternProject } from '@/lib/grading-engine';
import { useSettings } from '@/context/SettingsContext';
import { safeNum } from '@/lib/numeric-guard';
import { CONSIGNMENT_REPRICE_COPY, localizeConsignmentResult } from '@/lib/consignment-reprice-copy';

const STORAGE_KEY = 'stitch-and-scale-reprice-v1';

type StoredState = RepriceInput & { ts?: number };

const channelOptions: { value: RepriceInput['channel']; label: string }[] = [
  { value: 'ravelry-instore', label: 'Ravelry In-Store (60/40)' },
  { value: 'consignment-direct', label: 'Direct consignment (45/55)' },
  { value: 'own-shop', label: 'Own shop / online (97/3)' },
];

const seasonOptions: { value: RepriceInput['seasonBand']; label: string }[] = [
  { value: 'winter', label: 'Winter (peak Oct–Dec)' },
  { value: 'spring', label: 'Spring (peak Jan–Mar)' },
  { value: 'summer', label: 'Summer (peak Apr–Jun)' },
  { value: 'yearround', label: 'Year-round' },
];

// QA #60 (S260): the reset path shares the canonical defaults exported by
// the lib, so hydration and reset can never drift apart.
const defaultStored: StoredState = { ...REPRICE_DEFAULTS };

const severityIcon = {
  critical: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const severityColor = {
  critical: 'text-destructive border-destructive/40 bg-destructive/5',
  warning: 'text-amber-600 border-amber-400/40 bg-amber-500/5',
  info: 'text-muted-foreground border-border bg-secondary/40',
};

export function ConsignmentRepriceLabCard({ project }: { project: PatternProject }) {
  const { language } = useSettings();
  const copyText = CONSIGNMENT_REPRICE_COPY[language];
  const handle = useMemo(
    () => projectStorage<StoredState>('reprice', project.id, [STORAGE_KEY]),
    [project.id],
  );
  const [stored, setStored] = useState<StoredState>(() => {
    // QA #60 (S260): inputs must stay controlled for the lifetime of the
    // component. An input's `value` coming from `stored.*` can only become
    // undefined if a stale storage blob is missing a key, or a patch carried
    // one. `hydrateRepriceState` folds the blob over the defaults and strips
    // any undefined values (the card keeps `defaultStored` for the reset
    // button; both carry the same defaults).
    const normalized = hydrateRepriceState(handle.read());
    handle.write({ ...normalized, ts: Date.now() });
    return { ...normalized, ts: Date.now() };
  });

  const setState = (patch: Partial<StoredState>) => {
    setStored(prev => {
      // QA #60 (S260): a controlled input's `value` must never flip to
      // undefined. `applyRepricePatch` silently drops undefined entries so a
      // merge can never clobber a defined field.
      const next = { ...applyRepricePatch(prev, patch), ts: Date.now() };
      handle.write(next);
      return next;
    });
  };

  const result = useMemo(() => localizeConsignmentResult(analyzeReprice(stored as RepriceInput), language), [stored, language]);

  const num = (
    v: string,
    key: keyof RepriceInput,
    opts: { min?: number; max?: number; allowEmpty?: boolean } = {},
  ) => {
    if (v === '' && opts.allowEmpty) {
      setState({ [key]: undefined } as Partial<StoredState>);
      return;
    }
    const n = safeNum(v, 0);
    const clamped = Math.min(Math.max(n, opts.min ?? 0), opts.max ?? Infinity);
    setState({ [key]: clamped } as Partial<StoredState>);
  };

  const monthsOfStock =
    result.monthsOfStock === Infinity
      ? '— (not moving)'
      : `${result.monthsOfStock.toFixed(1)} mo`;

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <Store className="mt-1 h-5 w-5 shrink-0 text-primary" />
        <div className="space-y-1">
          <h3 className="text-base font-semibold">{copyText.title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{copyText.description}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-3 rounded-lg border p-4">
          <h4 className="text-sm font-medium">{copyText.printRun}</h4>
          <div className="space-y-1">
            <Label htmlFor="crp-retail">{copyText.retail}</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">$</span>
              <Input
                id="crp-retail"
                type="number"
                step="0.01"
                value={stored.retailPrice}
                onChange={e => num(e.target.value, 'retailPrice', { min: 0.5 })}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="crp-channel">{copyText.channel}</Label>
            <select
              id="crp-channel"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
              value={stored.channel}
              onChange={e =>
                setState({ channel: e.target.value as RepriceInput['channel'] })
              }
            >
              {channelOptions.map(o => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="crp-print">{copyText.printCost}</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">$</span>
              <Input
                id="crp-print"
                type="number"
                step="0.01"
                value={stored.printCostPerUnit}
                onChange={e => num(e.target.value, 'printCostPerUnit', { min: 0 })}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label>
              {copyText.printShare}: {((stored.printCostPerUnit / stored.retailPrice) * 100).toFixed(0)}% {copyText.ofRetail}
            </Label>
          </div>
        </div>

        <div className="space-y-3 rounded-lg border p-4">
          <h4 className="text-sm font-medium">{copyText.shelfLife}</h4>
          <div className="space-y-1">
            <Label htmlFor="crp-units">{copyText.units}</Label>
            <Input
              id="crp-units"
              type="number"
              value={stored.unitsAtShop}
              onChange={e => num(e.target.value, 'unitsAtShop', { min: 0 })}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="crp-sold">{copyText.sold}</Label>
            <Input
              id="crp-sold"
              type="number"
              step="0.1"
              value={stored.unitsSoldPerMonth}
              onChange={e =>
                num(e.target.value, 'unitsSoldPerMonth', { min: 0, allowEmpty: true })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>
              {copyText.months}: {stored.monthsInShop}
            </Label>
            <Slider
              value={[stored.monthsInShop]}
              min={0}
              max={24}
              step={1}
              onValueChange={v => setState({ monthsInShop: v[0] })}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="crp-season">{copyText.season}</Label>
            <select
              id="crp-season"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
              value={stored.seasonBand}
              onChange={e =>
                setState({ seasonBand: e.target.value as RepriceInput['seasonBand'] })
              }
            >
              {seasonOptions.map(o => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-3 rounded-lg border p-4 sm:col-span-2">
          <h4 className="text-sm font-medium">{copyText.repriceCost}</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="crp-rate">{copyText.hourly}</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">$</span>
                <Input
                  id="crp-rate"
                  type="number"
                  value={stored.opportunityRate}
                  onChange={e => num(e.target.value, 'opportunityRate', { min: 1 })}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="crp-hours">{copyText.hours}</Label>
              <Input
                id="crp-hours"
                type="number"
                step="0.5"
                value={stored.repriceHours}
                onChange={e => num(e.target.value, 'repriceHours', { min: 0 })}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Banknote className="h-4 w-4" />
            {copyText.netNow}
          </div>
          <div className="mt-1 text-2xl font-semibold">
            ${result.currentNetPerUnit.toFixed(2)}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {copyText.afterCosts}
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Package className="h-4 w-4" />
            {copyText.stock}
          </div>
          <div className="mt-1 text-2xl font-semibold">{monthsOfStock}</div>
          <p className="mt-1 text-xs text-muted-foreground">
            {copyText.atUnits.replace('{units}', String(stored.unitsAtShop)).replace('{sold}', String(stored.unitsSoldPerMonth))}
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingDown className="h-4 w-4" />
            {copyText.deadRisk}
          </div>
          <div className="mt-1 text-2xl font-semibold">
            ${result.deadStockRisk.toFixed(2)}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {copyText.sunkCost}
          </p>
        </div>
      </div>

      <div className="rounded-lg border">
        <div className="border-b px-4 py-2.5">
          <h4 className="text-sm font-medium">{copyText.channelHeading.replace('{price}', `$${stored.retailPrice.toFixed(2)}`)}</h4>
        </div>
        <div className="divide-y">
          {result.channelNets.map(c => (
            <div
              key={c.channel}
              className="flex items-center justify-between px-4 py-2 text-sm"
            >
              <span className="text-muted-foreground">
                {c.channel} · {c.designerSharePct}% {copyText.toYou}
              </span>
              <span className="font-medium">
                ${c.netPerUnit.toFixed(2)}
                <span className="ml-2 text-xs text-muted-foreground">
                  ({copyText.fees} ${c.platformFeePerUnit.toFixed(2)})
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border">
        <div className="border-b px-4 py-2.5">
          <h4 className="text-sm font-medium">{copyText.ladder}</h4>
          <p className="text-xs text-muted-foreground">
            {copyText.ladderDescription.replace('{units}', String(stored.unitsAtShop))}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="px-4 py-2">{copyText.step}</th>
                <th className="px-4 py-2">{copyText.price}</th>
                <th className="px-4 py-2">{copyText.netUnit}</th>
                <th className="px-4 py-2">{copyText.monthsClear}</th>
                <th className="px-4 py-2">{copyText.totalNet}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {result.ladder.map(step => {
                // QA #45 (S255): with zero sell-through every step nets $0.00 —
                // crowning a BEST step would read as "this recovers money" when
                // no step moves any stock. The CR-04 critical flag already urges
                // markdown/pull-back; keep the crown off until something sells.
                const best =
                  step.label === result.bestStep.label && !result.zeroSellThrough;
                return (
                  <tr
                    key={step.label}
                    className={
                      best
                        ? 'bg-primary/5 font-medium'
                        : 'text-muted-foreground'
                    }
                  >
                    <td className="px-4 py-2">
                      {step.label}
                      {best && (
                        <span className="ml-2 rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                          {copyText.best}
                        </span>
                      )}
                      {result.zeroSellThrough && step.label === result.bestStep.label && (
                        <span className="ml-2 rounded bg-destructive/10 px-1.5 py-0.5 text-[10px] font-semibold text-destructive">
                          $0.00 at zero sell-through
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {step.pricePctOfRetail > 0
                        ? `$${step.price.toFixed(2)}`
                        : `$${step.price.toFixed(2)} (${copyText.online})`}
                    </td>
                    <td className="px-4 py-2">${step.netPerUnit.toFixed(2)}</td>
                    <td className="px-4 py-2">{step.monthsToClear} {copyText.mo}</td>
                    <td className="px-4 py-2">
                      ${step.totalNetOnCurrentStock.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="border-t px-4 py-3 text-xs text-muted-foreground">
          {result.zeroSellThrough
            ? copyText.zeroStockFooter
            : result.bestStep.rationale}
        </div>
      </div>

      {result.flags.length > 0 && (
        <div className="space-y-2">
          <h4 className="flex items-center gap-2 text-sm font-medium">
            <Tag className="h-4 w-4" />
            {copyText.watchOuts}
          </h4>
          {result.flags.map((f, i) => {
            const Icon = severityIcon[f.severity];
            return (
              <div
                key={`${f.code}-${i}`}
                className={`rounded-md border px-3 py-2 text-sm ${severityColor[f.severity]}`}
              >
                <div className="flex items-center gap-2 font-medium">
                  <Icon className="h-4 w-4 shrink-0" />
                  {f.code} · {f.title}
                </div>
                <p className="mt-0.5 text-xs opacity-80">{f.detail}</p>
              </div>
            );
          })}
        </div>
      )}

      <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
        <div className="flex items-start gap-3">
          <CalendarClock className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-semibold">{copyText.verdict}</p>
            <p className="mt-1 text-sm leading-relaxed">{result.verdict}</p>
          </div>
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setState({ ...defaultStored, ts: Date.now() });
        }}
      >
        {copyText.reset}
      </Button>
    </div>
  );
}
