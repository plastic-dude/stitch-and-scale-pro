import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Flag, FileText, Layers, Lightbulb } from 'lucide-react';
import { PatternProject } from '@/lib/grading-engine';
import { useSettings } from '@/context/SettingsContext';
import { MAGAZINE_SUBMISSION_COPY } from '@/lib/magazine-submission-copy';
import { projectStorage } from '@/lib/storage-lib';
import {
  analyzeMagazineSubmission,
  DEFAULT_MAGAZINE,
  fmt$,
  type DealModel,
  type MagazineInput,
} from '@/lib/magazine-submission-lab';

const STORAGE_KEY = 'stitch-and-scale-magazine-v1';

type StoredState = MagazineInput & { ts?: number };

function defaultStored(): StoredState {
  return { ...DEFAULT_MAGAZINE };
}

function loadStored(handle: ReturnType<typeof projectStorage<StoredState>>): StoredState {
  const parsed = handle.read();
  if (parsed) {
    return { ...defaultStored(), ...parsed, ts: undefined };
  }
  return defaultStored();
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

const verdictColor = (v: string) =>
  v.startsWith('Decline') ? 'bg-destructive/10 text-destructive border-destructive/30' :
  v.startsWith('Weak deal') ? 'bg-amber-500/15 text-amber-700 border-amber-500/30' :
  v.startsWith('Fair deal') ? 'bg-sky-500/15 text-sky-700 border-sky-500/30' :
  v.startsWith('Strong deal') ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30' :
  v.startsWith('Price your hours') ? 'bg-accent/50 text-muted-foreground border-border' :
  'bg-amber-500/15 text-amber-700 border-amber-500/30';

export function MagazineSubmissionLabCard({ project }: { project: PatternProject }) {
  const { language } = useSettings();
  const copyText = MAGAZINE_SUBMISSION_COPY[language];
  const dealModelOptions: { value: DealModel; label: string }[] = [
    { value: 'flat', label: copyText.flat },
    { value: 'royalty', label: copyText.royalty },
    { value: 'fee-and-royalty', label: copyText.feeRoyalty },
    { value: 'lease', label: copyText.lease },
    { value: 'outright-sale', label: copyText.outright },
  ];
  const handle = useMemo(() => projectStorage<StoredState>('magazine-submission', project.id, [STORAGE_KEY]), [project.id]);
  const [input, setInput] = useState<MagazineInput>(() => loadStored(handle));

  useEffect(() => {
    setInput(loadStored(handle));
  }, [handle]);

  const persist = (next: MagazineInput) => {
    setInput(next);
    handle.write({ ...next, ts: Date.now() });
  };

  const result = useMemo(() => analyzeMagazineSubmission(input), [input]);
  const set = <K extends keyof MagazineInput>(k: K, v: MagazineInput[K]) => persist({ ...input, [k]: v });

  const isRoyalty = input.dealModel === 'royalty' || input.dealModel === 'fee-and-royalty';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base"><FileText className="size-4" />{copyText.title}</CardTitle>
        <CardDescription>{copyText.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <section className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-1.5"><Layers className="size-4" />{copyText.dealStructure}</h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="space-y-1.5">
              <Label htmlFor="mag-deal" className="text-xs">{copyText.dealModel}</Label>
              <select
                id="mag-deal"
                value={input.dealModel}
                onChange={e => set('dealModel', (e.target.value as DealModel))}
                className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm">
                {dealModelOptions.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <NumField id="mag-fee" label={copyText.flatFee} value={input.flatFee} onChange={n => set('flatFee', Math.max(0, n))} suffix="$" />
            <NumField id="mag-kill" label={copyText.killFee} value={input.killFeePct * 100} onChange={n => set('killFeePct', Math.max(0, Math.min(1, n / 100)))} min={0} max={100} step={5} suffix="%" />
            <NumField id="mag-lag" label={copyText.paymentLag} value={input.paymentLagMonths} onChange={n => set('paymentLagMonths', Math.max(0, Math.min(24, n)))} min={0} max={24} suffix="mo" />
            <NumField id="mag-window" label={copyText.exclusivity} value={input.exclusivityMonths} onChange={n => set('exclusivityMonths', Math.max(1, Math.min(36, n)))} min={1} max={36} suffix="mo" />
            <NumField id="mag-sale" label={copyText.outrightTerm} value={input.outrightSaleMonths} onChange={n => set('outrightSaleMonths', Math.max(0, Math.min(60, n)))} min={0} max={60} suffix="mo" />
          </div>
        </section>

        {isRoyalty && (
          <section className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-1.5"><FileText className="size-4" />{copyText.royaltyStream}</h3>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <NumField id="mag-copies" label={copyText.copies} value={input.copiesPrinted} onChange={n => set('copiesPrinted', Math.max(0, n))} min={0} step={1000} />
              <NumField id="mag-through" label={copyText.sellThrough} value={input.sellThrough * 100} onChange={n => set('sellThrough', Math.max(0, Math.min(1, n / 100)))} min={0} max={100} step={5} suffix="%" />
              <NumField id="mag-royalty" label={copyText.royaltyRate} value={input.royaltyPct * 100} onChange={n => set('royaltyPct', Math.max(0, Math.min(1, n / 100)))} min={0} max={100} step={1} suffix="%" />
              <NumField id="mag-revpc" label={copyText.revenueCopy} value={input.revenuePerCopy} onChange={n => set('revenuePerCopy', Math.max(0, n))} step={0.5} suffix="$" />
              <NumField id="mag-digital" label={copyText.digitalRoyalty} value={input.digitalRoyalty} onChange={n => set('digitalRoyalty', Math.max(0, n))} suffix="$" />
            </div>
          </section>
        )}

        <section className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-1.5"><Layers className="size-4" />{copyText.coverage}</h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <NumField id="mag-techedit" label={copyText.techEdit} value={input.publisherCoveredTechEdit} onChange={n => set('publisherCoveredTechEdit', Math.max(0, n))} suffix="$" />
            <NumField id="mag-photo" label={copyText.photography} value={input.publisherCoveredPhotography} onChange={n => set('publisherCoveredPhotography', Math.max(0, n))} suffix="$" />
            <NumField id="mag-testknit" label={copyText.testKnit} value={input.publisherCoveredTestKnit} onChange={n => set('publisherCoveredTestKnit', Math.max(0, n))} suffix="$" />
            <NumField id="mag-yarnpub" label={copyText.yarn} value={input.publisherCoveredYarn} onChange={n => set('publisherCoveredYarn', Math.max(0, n))} suffix="$" />
            <NumField id="mag-prodcost" label={copyText.production} value={input.yourProductionCost} onChange={n => set('yourProductionCost', Math.max(0, n))} suffix="$" />
            <NumField id="mag-hours" label={copyText.designHours} value={input.designHours} onChange={n => set('designHours', Math.max(0.5, n))} min={0.5} step={0.5} suffix="hrs" />
            <NumField id="mag-rate" label={copyText.opportunityRate} value={input.hourlyRate} onChange={n => set('hourlyRate', Math.max(1, n))} suffix="$/hr" />
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-1.5"><FileText className="size-4" />{copyText.baseline}</h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <NumField id="mag-spprice" label={copyText.selfPrice} value={input.selfPublishPrice} onChange={n => set('selfPublishPrice', Math.max(0.5, n))} min={0.5} step={0.5} suffix="$" />
            <NumField id="mag-spunits" label={copyText.selfUnits} value={input.selfPublishUnitsPerMonth} onChange={n => set('selfPublishUnitsPerMonth', Math.max(0, n))} min={0} suffix="units/mo" />
            <NumField id="mag-prestige" label={copyText.prestige} value={input.prestigeUnitsPerMonth} onChange={n => set('prestigeUnitsPerMonth', Math.max(0, n))} min={0} suffix="units/mo" />
            <NumField id="mag-prestmo" label={copyText.upliftDuration} value={input.prestigeMonths} onChange={n => set('prestigeMonths', Math.max(0, Math.min(24, n)))} min={0} max={24} suffix="mo" />
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-1.5"><FileText className="size-4" />{copyText.dealVsSelf}</h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatBox label={copyText.cashPublisher} value={fmt$(result.deal.dealCash)} tone="good" />
            <StatBox label={copyText.coverageAbsorbed} value={fmt$(result.deal.avoidedCosts)} tone="good" />
            <StatBox label={copyText.lockup} value={fmt$(result.deal.opportunityCost)} tone={result.deal.opportunityCost > result.deal.dealCash ? 'bad' : 'warn'} />
            <StatBox label={copyText.prestigeValue} value={fmt$(result.deal.prestigeValue)} tone="good" />
            <StatBox label={copyText.netVsSelf} value={fmt$(result.deal.netVersusSelf)} tone={result.deal.netVersusSelf > 0 ? 'good' : 'bad'} />
            <StatBox label={copyText.effectiveRate} value={result.deal.effectiveHourly.toFixed(1)} tone={result.deal.effectiveHourly >= input.hourlyRate ? 'good' : result.deal.effectiveHourly >= input.hourlyRate * 0.5 ? 'warn' : 'bad'} />
            <StatBox label={copyText.selfNet} value={fmt$(result.selfPublishNet)} tone={result.selfPublishNet >= result.deal.netVersusSelf ? 'bad' : 'good'} />
            {isRoyalty && (
              <StatBox label={copyText.breakEven} value={result.royaltyBreakEvenCopies === Infinity ? copyText.infiniteRoyalty : `${Math.round(result.royaltyBreakEvenCopies).toLocaleString()}`} tone={result.royaltyBreakEvenCopies === Infinity ? 'bad' : 'warn'} />
            )}
            {!isRoyalty && <StatBox label={copyText.feeBand} value={`$${result.feeBandMin}–$${result.feeBandMax}`} />}
          </div>
          {result.deal.netVersusSelf <= 0 && (
            <p className="text-xs text-muted-foreground">{copyText.negative}</p>
          )}
          <p className="text-xs text-muted-foreground leading-4">{copyText.marketNote}</p>
        </section>

        {result.flags.length > 0 && (
          <section className="space-y-2">
            <h3 className="text-sm font-semibold flex items-center gap-1.5"><Flag className="size-4" />{copyText.watchouts}</h3>
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
          <div className="flex items-center gap-2 font-semibold"><Lightbulb className="size-4" />{copyText.verdict}: {result.verdict}</div>
          <p className="mt-1.5 text-sm">{result.verdictNote}</p>
        </section>
      </CardContent>
    </Card>
  );
}
