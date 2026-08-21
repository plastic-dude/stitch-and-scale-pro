import React, { useMemo, useState, useEffect } from 'react';
import { useSettings } from '@/context/SettingsContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { AlertTriangle, Flag, Tag, Layers, Lightbulb, Copy, CheckCircle2 } from 'lucide-react';
import { PatternProject } from '@/lib/grading-engine';
import { PRICING_PSYCHOLOGY_COPY } from '@/lib/pricing-psychology-copy';
import { projectStorage } from '@/lib/storage-lib';
import { safeNum } from '@/lib/numeric-guard';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import {
  analyzePricingPsychology,
  DEFAULT_PRICING_PSYCHOLOGY,
  estimateEditorSavings,
  generatePreEditSummary,
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
    .map(s => safeNum(s.replace(/[^0-9.]/g, ''), 0))
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
            const n = safeNum(e.target.value, 0);
            onChange(n);
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

export function PricingPsychologyLabCard({ project }: { project: PatternProject }) {
  const handle = useMemo(() => projectStorage<StoredState>('price-psych', project.id, [STORAGE_KEY]), [project.id]);
  const [input, setInput] = useState<PricingPsychologyInput>(() => loadStored(handle));
  const { language } = useSettings();
  const copy = PRICING_PSYCHOLOGY_COPY[language];
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

  const result = useMemo(() => analyzePricingPsychology(input, { language }), [input, language]);
  const set = <K extends keyof PricingPsychologyInput>(k: K, v: PricingPsychologyInput[K]) => persist({ ...input, [k]: v });

  const { savings, note } = useMemo(() => estimateEditorSavings(result, 50, language), [result, language]);
  const isBundling = input.componentPrice > 0 && input.bundleCandidateTotal > 0 && input.bundleSize >= 2;

  const copyRationale = async () => {
    const text = generatePreEditSummary(input, result, language);
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: copy.copyForEditor, description: copy.cleanSweep });
    } catch {
      toast({ title: 'Copy failed', variant: 'destructive' });
    }
  };

  const verdictText = result.verdict === 'clean' ? copy.verdictClean : result.verdict === 'check' ? copy.verdictCheck : copy.verdictFix;
  const verdictTone = result.verdict === 'clean' ? 'good' : result.verdict === 'check' ? 'warn' : 'bad';
  const verdictCls =
    result.verdict === 'clean' ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30' :
    result.verdict === 'check' ? 'bg-amber-500/15 text-amber-700 border-amber-500/30' :
    'bg-destructive/10 text-destructive border-destructive/30';

  const endingLabel = (e: string) =>
    e === 'charm-99' ? copy.charm99Label :
    e === 'round-00' ? copy.round00Label :
    copy.mixedLabel;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2"><Tag className="size-4" />{copy.title}</div>
          <Badge variant="outline" className={verdictCls}>{verdictText}</Badge>
        </CardTitle>
        <CardDescription>{copy.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="pp-name" className="text-xs">{copy.patternNameLabel}</Label>
                <Input id="pp-name" value={input.patternName}
                  onChange={e => set('patternName', e.target.value)}
                  className="text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pp-position" className="text-xs">{copy.tierPositioningLabel}</Label>
                <select
                  id="pp-position"
                  value={input.tierPositioning}
                  onChange={e => set('tierPositioning', (e.target.value as PricingPsychologyInput['tierPositioning']))}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm">
                  <option value="bargain">{copy.bargainLabel}</option>
                  <option value="mainstream">{copy.mainstreamLabel}</option>
                  <option value="premium">{copy.premiumLabel}</option>
                </select>
              </div>
              <NumField id="pp-current" label={copy.currentPriceLabel} value={input.currentPrice} onChange={n => set('currentPrice', Math.max(0.5, n))} min={0.5} step={0.01} suffix="$" />
              <NumField id="pp-candidate" label={copy.candidatePriceLabel} value={input.candidatePrice} onChange={n => set('candidatePrice', Math.max(0.5, n))} min={0.5} step={0.01} suffix="$" />
              <NumField id="pp-units" label={copy.monthlyUnitsLabel} value={input.unitsPerMonth} onChange={n => set('unitsPerMonth', Math.max(0, n))} min={0} />
              <NumField id="pp-take" label={copy.platformTakeRateLabel} value={input.platformTakeRate * 100} onChange={n => set('platformTakeRate', Math.max(0, Math.min(1, n / 100)))} min={0} max={100} step={1} suffix="%" />
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{copy.multiTierShopLabel}</Label>
                <Switch id="pp-multitier" checked={input.multiTierShop} onCheckedChange={v => set('multiTierShop', v)} />
              </div>
              {input.multiTierShop && (
                <div className="space-y-1.5">
                  <Label htmlFor="pp-tiers" className="text-xs">{copy.shopTiersLabel}</Label>
                  <Input id="pp-tiers" value={tiersRaw} onChange={e => setTiers(e.target.value)} className="text-sm" />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className={`rounded-lg border p-4 ${verdictCls}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-bold uppercase tracking-tighter">{copy.monthlyNetLabel}</div>
                {result.score >= 90 && <CheckCircle2 className="size-4 text-emerald-600" />}
              </div>
              <div className="text-3xl font-bold tracking-tight">${result.candidate.monthlyNet.toFixed(2)}</div>
              <div className="mt-1 text-xs font-medium opacity-80">
                {/* Removed invalid call to findingPp06Title which is a copy key, not a result property */}
              </div>
            </div>

            <div className="rounded-lg border bg-accent/30 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-muted-foreground">{copy.marketQuoteTitle}</div>
                <Badge variant="secondary" className="text-[10px]">{copy.impliedUnitsLabel}</Badge>
              </div>
              <div className="text-xl font-semibold">{result.candidate.impliedUnits.toFixed(1)}/mo</div>
              <p className="text-[11px] leading-relaxed text-muted-foreground">{copy.marketQuoteDetails(2, 14)}</p>
            </div>

            <Button onClick={copyRationale} variant="outline" size="sm" className="w-full gap-2 text-xs">
              <Copy className="size-3" />
              {copy.copyForEditor}
            </Button>
          </div>
        </section>

        <section className="space-y-3 border-t pt-6">
          <h3 className="text-sm font-semibold flex items-center gap-1.5"><Layers className="size-4" />{copy.bundleSectionTitle}</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <NumField id="pp-bsize" label={copy.bundleSizeLabel} value={input.bundleSize} onChange={n => set('bundleSize', Math.max(0, n))} min={0} />
            <NumField id="pp-component" label={copy.componentPriceLabel} value={input.componentPrice} onChange={n => set('componentPrice', Math.max(0, n))} step={0.01} suffix="$" />
            <NumField id="pp-btotal" label={copy.bundleTotalLabel} value={input.bundleCandidateTotal} onChange={n => set('bundleCandidateTotal', Math.max(0, n))} step={0.01} suffix="$" />
            <NumField id="pp-bunits" label={copy.bundleUnitsLabel} value={input.bundleUnitsPerMonth} onChange={n => set('bundleUnitsPerMonth', Math.max(0, n))} min={0} />
            <NumField id="pp-cunits" label={copy.componentUnitsLabel} value={input.componentUnitsPerMonth} onChange={n => set('componentUnitsPerMonth', Math.max(0, n))} min={0} />
          </div>
        </section>

        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatBox label={copy.leftDigitChangeLabel} value={result.candidate.leftDigitChange > 0 ? `-${result.candidate.leftDigitChange}` : '0'} tone={result.candidate.leftDigitChange > 0 ? 'good' : 'default'} />
          <StatBox label={copy.recommendedEndingLabel} value={endingLabel(result.recommendedEnding)} />
          <StatBox label={copy.highestAnchorLabel} value={result.highestShopAnchor > 0 ? `$${result.highestShopAnchor.toFixed(2)}` : '—'} />
          <StatBox label={copy.bundleNetLabel} value={result.bundle ? `$${result.bundle.bundleNet.toFixed(2)}` : '—'} tone={result.bundle && result.bundle.bundleNet > result.bundle.singleNet ? 'good' : 'default'} />
        </section>

        {result.flags.length > 0 && (
          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{copy.outstandingItemsLabel(result.flags.length)}</Label>
            <div className="grid gap-2">
              {result.flags.map(f => (
                <div key={f.code} className="flex items-start gap-3 rounded-md border border-amber-500/20 bg-amber-500/5 p-3 text-sm">
                  <AlertTriangle className="size-4 text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <div className="font-semibold text-amber-900">{f.title}</div>
                    <div className="text-xs text-amber-800/80 leading-relaxed mt-0.5">{f.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className={`rounded-lg border p-4 flex items-start gap-3 ${verdictCls}`}>
          <Lightbulb className="size-5 mt-0.5 shrink-0 opacity-80" />
          <div className="space-y-1">
            <div className="text-sm font-bold">{copy.editorBillSaved}</div>
            <div className="text-xs leading-relaxed opacity-90">{note}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
