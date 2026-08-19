import { useMemo, useState, useEffect } from 'react';
import { useSettings } from '@/context/SettingsContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { AlertTriangle, Flag, Tag, Layers, Lightbulb } from 'lucide-react';
import { PatternProject } from '@/lib/grading-engine';
import { PRICING_PSYCHOLOGY_COPY } from '@/lib/pricing-psychology-copy';
import { projectStorage } from '@/lib/storage-lib';
import {
  analyzePricingPsychology,
  DEFAULT_PRICING_PSYCHOLOGY,
  fmt$,
  type PricingPsychologyInput,
} from '@/lib/pricing-psychology-lab';

const STORAGE_KEY = 'stitch-and-scale-price-psych-v1';

type StoredState = PricingPsychologyInput & { ts?: number };

function defaultStored(): StoredState {
  return { ...DEFAULT_PRICING_PSYCHOLOGY };
}

function loadStored(handle: ReturnType<typeof projectStorage<StoredState>>): StoredState {
  const parsed = handle.read();
  if (parsed) {
    return { ...defaultStored(), ...parsed, ts: undefined };
  }
  return defaultStored();
}

function parseTiers(raw: string): number[] {
  return raw
    .split(/[,\s]+/)
    .map(s => parseFloat(s.replace(/[^0-9.]/g, '')))
    .filter(n => Number.isFinite(n) && n > 0)
    .slice(0, 5);
}

function tiersToString(tiers: number[]): string {
  return tiers.map(t => t.toFixed(2)).join(', ');
}

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
          onChange={e => {
            const n = parseFloat(e.target.value);
            if (Number.isFinite(n)) onChange(n);
          }}
          className="text-sm pr-8" />
        {suffix ? <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{suffix}</span> : null}
      </div>
    </div>
  );
}

function StatBox({ label, value, tone = 'default' }: { label: string; value: string; tone?: 'default' | 'good' | 'warn' | 'bad' }) {
  const toneCls =
    tone === 'good' ? 'text-emerald-700 bg-emerald-500/10 border-emerald-500/30' :
    tone === 'warn' ? 'text-amber-700 bg-amber-500/10 border-amber-500/30' :
    tone === 'bad' ? 'text-destructive bg-destructive/10 border-destructive/30' :
    'text-foreground bg-accent/50 border-border';
  return (
    <div className={`rounded-md border p-3 ${toneCls}`}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}

const positioningOptions: { value: PricingPsychologyInput['tierPositioning']; label: string }[] = [
  { value: 'bargain', label: 'Bargain (accessories / gifts)' },
  { value: 'mainstream', label: 'Mainstream (garments)' },
  { value: 'premium', label: 'Premium (heirloom / signature)' },
];

const endingLabel = (e: string) =>
  e === 'charm-99' ? '.99 (bargain signal)' :
  e === 'round-00' ? '.00 (quality signal)' :
  'Mixed — match per tier';

const verdictColor = (v: string) =>
  v.startsWith('Cross the barrier') ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30' :
  v.startsWith('The ending costs') ? 'bg-destructive/10 text-destructive border-destructive/30' :
  v.startsWith('Marginal') ? 'bg-amber-500/15 text-amber-700 border-amber-500/30' :
  v.startsWith('Keep the price') ? 'bg-amber-500/15 text-amber-700 border-amber-500/30' :
  v.startsWith('Raise the volume') ? 'bg-accent/50 text-muted-foreground border-border' :
  v.startsWith('Enter your volume') ? 'bg-accent/50 text-muted-foreground border-border' :
  'bg-amber-500/15 text-amber-700 border-amber-500/30';

export function PricingPsychologyLabCard({ project }: { project: PatternProject }) {
  const handle = useMemo(() => projectStorage<StoredState>('price-psych', project.id, [STORAGE_KEY]), [project.id]);
  const [input, setInput] = useState<PricingPsychologyInput>(() => loadStored(handle));
  const { language } = useSettings();
  const copyText = PRICING_PSYCHOLOGY_COPY[language];
  const [tiersRaw, setTiersRaw] = useState<string>(() => tiersToString(loadStored(handle).shopTiers));

  useEffect(() => {
    setInput(loadStored(handle));
    setTiersRaw(tiersToString(loadStored(handle).shopTiers));
  }, [handle]);

  const persist = (next: PricingPsychologyInput) => {
    setInput(next);
    handle.write({ ...next, ts: Date.now() });
  };

  const setTiers = (raw: string) => {
    setTiersRaw(raw);
    persist({ ...input, shopTiers: parseTiers(raw) });
  };

  const result = useMemo(() => analyzePricingPsychology(input), [input]);
  const set = <K extends keyof PricingPsychologyInput>(k: K, v: PricingPsychologyInput[K]) => persist({ ...input, [k]: v });

  const delta = result.candidate.monthlyNet - result.current.monthlyNet;
  const isBundling = input.componentPrice > 0 && input.bundleCandidateTotal > 0 && input.bundleSize >= 2;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base"><Tag className="size-4" />Price Psychology Lab</CardTitle>
        <CardDescription>Is $9.99 actually better than $10.00 — and is $64.99 quietly hurting a premium design? Field experiments show nine-endings outselling identical rounded prices by ~8% at zero discount (Sori & Widjaja) and lifting apparel demand 10–30% in catalog trials (Schindler & Kibarian), but the effect FLIPS at higher price points where .99 endings damage quality perception. This lab prices the left-digit barrier ($10 → $9.99 crosses the "under ten" line), the charm-vs-premium flip, decoy tier placement inside your shop, and the proven bundle-endings rule (even component prices + odd bundle total, Baumgartner & Hähnchen 2016) — each scored against your real unit volume and marketplace take rate.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <section className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-1.5"><Tag className="size-4" />The price change</h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="space-y-1.5">
              <Label htmlFor="pp-name" className="text-xs">Pattern name</Label>
              <Input id="pp-name" value={input.patternName}
                onChange={e => set('patternName', e.target.value)}
                className="text-sm" />
            </div>
            <NumField id="pp-current" label={copyText.currentPrice} value={input.currentPrice} onChange={n => set('currentPrice', Math.max(0.5, n))} min={0.5} step={0.01} suffix="$" />
            <NumField id="pp-candidate" label={copyText.candidatePrice} value={input.candidatePrice} onChange={n => set('candidatePrice', Math.max(0.5, n))} min={0.5} step={0.01} suffix="$" />
            <NumField id="pp-units" label={copyText.unitsSoldMonth} value={input.unitsPerMonth} onChange={n => set('unitsPerMonth', Math.max(0, n))} min={0} suffix="units/mo" />
            <NumField id="pp-take" label={copyText.marketplaceTakeRate} value={input.platformTakeRate * 100} onChange={n => set('platformTakeRate', Math.max(0, Math.min(1, n / 100)))} min={0} max={100} step={1} suffix="%" />
            <div className="space-y-1.5">
              <Label htmlFor="pp-position" className="text-xs">Design positioning</Label>
              <select
                id="pp-position"
                value={input.tierPositioning}
                onChange={e => set('tierPositioning', (e.target.value as PricingPsychologyInput['tierPositioning']))}
                className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm">
                {positioningOptions.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-1.5"><Layers className="size-4" />Shop anchors & decoys</h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="pp-tiers" className="text-xs">Other tier prices in the shop (comma-separated, up to 5)</Label>
              <Input id="pp-tiers" value={tiersRaw}
                onChange={e => setTiers(e.target.value)}
                placeholder="5.00, 8.00, 14.00"
                className="text-sm" />
            </div>
            <div className="col-span-2 flex items-end pb-1">
              <label htmlFor="pp-multitier" className="flex cursor-pointer items-center gap-2 text-sm">
                <Switch id="pp-multitier" checked={input.multiTierShop}
                  onCheckedChange={v => set('multiTierShop', v)} />
                I sell multiple price tiers (anchor/decoy math)
              </label>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-1.5"><Layers className="size-4" />Bundle endings (optional)</h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <NumField id="pp-component" label={copyText.componentPrice0No} value={input.componentPrice} onChange={n => set('componentPrice', Math.max(0, n))} step={0.01} suffix="$" />
            <NumField id="pp-btotal" label={copyText.bundleCandidateTotal} value={input.bundleCandidateTotal} onChange={n => set('bundleCandidateTotal', Math.max(0, n))} step={0.01} suffix="$" />
            <NumField id="pp-bsize" label={copyText.patternsInBundle} value={input.bundleSize} onChange={n => set('bundleSize', Math.max(0, Math.min(12, n)))} min={0} max={12} suffix="pcs" />
            <NumField id="pp-bunits" label={copyText.bundleUnitsMonth} value={input.bundleUnitsPerMonth} onChange={n => set('bundleUnitsPerMonth', Math.max(0, n))} min={0} suffix="units/mo" />
            <NumField id="pp-cunits" label={copyText.componentUnitsMonthEach} value={input.componentUnitsPerMonth} onChange={n => set('componentUnitsPerMonth', Math.max(0, n))} min={0} suffix="units/mo" />
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-1.5"><Tag className="size-4" />{input.patternName}: current vs candidate</h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatBox label="Current monthly net" value={fmt$(result.current.monthlyNet)} />
            <StatBox label="Candidate monthly net" value={fmt$(result.candidate.monthlyNet)} tone={delta >= 0 ? 'good' : 'bad'} />
            <StatBox label="Change vs current" value={`${delta >= 0 ? '+' : ''}${fmt$(delta)}/mo`} tone={delta > 0 ? 'good' : delta < 0 ? 'bad' : 'default'} />
            <StatBox label="Current implied units" value={`${result.current.impliedUnits.toFixed(1)}/mo`} />
            <StatBox label="Candidate implied units" value={`${result.candidate.impliedUnits.toFixed(1)}/mo`} tone={result.candidate.impliedUnits > result.current.impliedUnits ? 'good' : 'default'} />
            <StatBox label="Left digit moves" value={result.current.leftDigitChange > 0 ? `${Math.floor(input.currentPrice)} → ${Math.floor(input.candidatePrice)} (−${result.current.leftDigitChange})` : 'No digit change'} tone={result.current.leftDigitChange > 0 ? 'good' : 'warn'} />
            <StatBox label="Recommended ending" value={endingLabel(result.recommendedEnding)} />
            <StatBox label="Highest shop anchor" value={result.highestShopAnchor > 0 ? `$${result.highestShopAnchor.toFixed(2)}` : 'None set'} tone={result.highestShopAnchor >= input.candidatePrice * 1.5 ? 'good' : 'warn'} />
            <StatBox label="Barrier below" value={`$${result.barriers.below.toFixed(2)}`} />
            <StatBox label="Barrier above" value={`$${result.barriers.above.toFixed(2)}`} />
          </div>
          {isBundling && result.bundle && (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <StatBox label="Singles net (all components)" value={fmt$(result.bundle.singleNet)} />
              <StatBox label="Bundle net" value={fmt$(result.bundle.bundleNet)} tone={result.bundle.bundleNet >= result.bundle.singleNet ? 'good' : 'bad'} />
              <StatBox label="Bundle total ends odd (.99)" value={result.bundle.totalEndsOdd ? 'Yes — best-selling config' : 'No — shift to .99'} tone={result.bundle.totalEndsOdd ? 'good' : 'bad'} />
              <StatBox label="Components end even (.00)" value={result.bundle.componentsEndEven ? 'Yes — paired correctly' : 'No — end components .00'} tone={result.bundle.componentsEndEven ? 'good' : 'warn'} />
            </div>
          )}
          <p className="text-xs text-muted-foreground leading-4">Market anchors: nine-endings lifted identical-garment sales ~8% at zero discount (Sori & Widjaja field experiment) and 10–30% in catalog trials (Schindler & Kibarian); the effect flips at high price points where .99 damages perceived quality; 0/5 endings process easier and signal quality (Lynn et al. 2013); bundles sell best with even component prices and an odd bundle total (Baumgartner & Hähnchen 2016); the first (highest) price a buyer sees anchors everything below it.</p>
        </section>

        {result.flags.length > 0 && (
          <section className="space-y-2">
            <h3 className="text-sm font-semibold flex items-center gap-1.5"><Flag className="size-4" />Watch-outs</h3>
            <div className="flex flex-wrap gap-2">
              {result.flags.map(f => (
                <Badge key={f.code} variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-700 gap-1.5 py-1.5">
                  <AlertTriangle className="size-3" />
                  <span className="font-medium">{f.code}</span> — {f.title}
                </Badge>
              ))}
            </div>
          </section>
        )}

        <section className={`rounded-md border p-4 ${verdictColor(result.verdict)}`}>
          <div className="flex items-center gap-2 font-semibold"><Lightbulb className="size-4" />{result.verdict}</div>
          <p className="mt-1.5 text-sm">{result.verdictNote}</p>
        </section>
      </CardContent>
    </Card>
  );
}
