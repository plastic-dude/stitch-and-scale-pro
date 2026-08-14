import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Flag, FileText, Layers, Lightbulb } from 'lucide-react';
import { PatternProject } from '@/lib/grading-engine';
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

const dealModelOptions: { value: DealModel; label: string }[] = [
  { value: 'flat', label: 'Flat fee (work-for-hire)' },
  { value: 'royalty', label: 'Royalty only' },
  { value: 'fee-and-royalty', label: 'Fee + royalty' },
  { value: 'lease', label: 'Lease (fee, rights revert)' },
  { value: 'outright-sale', label: 'Outright sale of rights' },
];

const verdictColor = (v: string) =>
  v.startsWith('Decline') ? 'bg-destructive/10 text-destructive border-destructive/30' :
  v.startsWith('Weak deal') ? 'bg-amber-500/15 text-amber-700 border-amber-500/30' :
  v.startsWith('Fair deal') ? 'bg-sky-500/15 text-sky-700 border-sky-500/30' :
  v.startsWith('Strong deal') ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30' :
  v.startsWith('Price your hours') ? 'bg-accent/50 text-muted-foreground border-border' :
  'bg-amber-500/15 text-amber-700 border-amber-500/30';

export function MagazineSubmissionLabCard({ project }: { project: PatternProject }) {
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
        <CardTitle className="flex items-center gap-2 text-base"><FileText className="size-4" />Magazine Submission Lab</CardTitle>
        <CardDescription>Is this magazine offer worth signing compared to self-publishing the same design? A flat fee of $300 sounds fine until a 12-month exclusivity window eats ~$150/month of your own-store sales — or until the publisher's tech-edit and photography coverage is worth more than the cash. Verified anchors: Knitty pays $250–350 with ~3-month exclusivity; Making Stories €100–550 with 4 months; Laine pays on completion with 5 months. Flat fees run $100–550 by tier, designers have been paid as little as $30 to lease a design, exclusivity windows run 3–12 months, and kill-fee protection sits at ~50%. This lab prices every lever: fee vs royalty vs lease vs outright sale, kill fees, copy-floor audits, payment lag, and the prestige uplift after the window.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <section className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-1.5"><Layers className="size-4" />The deal structure</h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="space-y-1.5">
              <Label htmlFor="mag-deal" className="text-xs">Deal model</Label>
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
            <NumField id="mag-fee" label="Flat fee" value={input.flatFee} onChange={n => set('flatFee', Math.max(0, n))} suffix="$" />
            <NumField id="mag-kill" label="Kill fee protection" value={input.killFeePct} onChange={n => set('killFeePct', Math.max(0, Math.min(1, n)))} step={0.05} suffix="%" />
            <NumField id="mag-lag" label="Payment lag" value={input.paymentLagMonths} onChange={n => set('paymentLagMonths', Math.max(0, Math.min(24, n)))} min={0} max={24} suffix="mo" />
            <NumField id="mag-window" label="Exclusivity window" value={input.exclusivityMonths} onChange={n => set('exclusivityMonths', Math.max(1, Math.min(36, n)))} min={1} max={36} suffix="mo" />
            <NumField id="mag-sale" label="Outright-sale term (0 = lease)" value={input.outrightSaleMonths} onChange={n => set('outrightSaleMonths', Math.max(0, Math.min(60, n)))} min={0} max={60} suffix="mo" />
          </div>
        </section>

        {isRoyalty && (
          <section className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-1.5"><FileText className="size-4" />Royalty stream</h3>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <NumField id="mag-copies" label="Copies printed (0 = unaudited)" value={input.copiesPrinted} onChange={n => set('copiesPrinted', Math.max(0, n))} min={0} step={1000} />
              <NumField id="mag-through" label="Sell-through" value={input.sellThrough} onChange={n => set('sellThrough', Math.max(0, Math.min(1, n)))} step={0.05} suffix="%" />
              <NumField id="mag-royalty" label="Royalty rate" value={input.royaltyPct} onChange={n => set('royaltyPct', Math.max(0, Math.min(1, n)))} step={0.01} suffix="%" />
              <NumField id="mag-revpc" label="Revenue per copy" value={input.revenuePerCopy} onChange={n => set('revenuePerCopy', Math.max(0, n))} step={0.5} suffix="$" />
              <NumField id="mag-digital" label="Digital / archive royalty" value={input.digitalRoyalty} onChange={n => set('digitalRoyalty', Math.max(0, n))} suffix="$" />
            </div>
          </section>
        )}

        <section className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-1.5"><Layers className="size-4" />Coverage & your costs</h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <NumField id="mag-techedit" label="Publisher covers tech edit" value={input.publisherCoveredTechEdit} onChange={n => set('publisherCoveredTechEdit', Math.max(0, n))} suffix="$" />
            <NumField id="mag-photo" label="Publisher covers photography" value={input.publisherCoveredPhotography} onChange={n => set('publisherCoveredPhotography', Math.max(0, n))} suffix="$" />
            <NumField id="mag-testknit" label="Publisher covers test knit" value={input.publisherCoveredTestKnit} onChange={n => set('publisherCoveredTestKnit', Math.max(0, n))} suffix="$" />
            <NumField id="mag-yarnpub" label="Publisher covers yarn" value={input.publisherCoveredYarn} onChange={n => set('publisherCoveredYarn', Math.max(0, n))} suffix="$" />
            <NumField id="mag-prodcost" label="Your production cost" value={input.yourProductionCost} onChange={n => set('yourProductionCost', Math.max(0, n))} suffix="$" />
            <NumField id="mag-hours" label="All-in design hours" value={input.designHours} onChange={n => set('designHours', Math.max(0.5, n))} min={0.5} step={0.5} suffix="hrs" />
            <NumField id="mag-rate" label="Opportunity rate" value={input.hourlyRate} onChange={n => set('hourlyRate', Math.max(1, n))} suffix="$/hr" />
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-1.5"><FileText className="size-4" />Your self-publish baseline</h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <NumField id="mag-spprice" label="Self-publish price" value={input.selfPublishPrice} onChange={n => set('selfPublishPrice', Math.max(0.5, n))} min={0.5} step={0.5} suffix="$" />
            <NumField id="mag-spunits" label="Your units per month" value={input.selfPublishUnitsPerMonth} onChange={n => set('selfPublishUnitsPerMonth', Math.max(0, n))} min={0} suffix="units/mo" />
            <NumField id="mag-prestige" label="Prestige uplift (post-window)" value={input.prestigeUnitsPerMonth} onChange={n => set('prestigeUnitsPerMonth', Math.max(0, n))} min={0} suffix="units/mo" />
            <NumField id="mag-prestmo" label="Uplift duration" value={input.prestigeMonths} onChange={n => set('prestigeMonths', Math.max(0, Math.min(24, n)))} min={0} max={24} suffix="mo" />
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-1.5"><FileText className="size-4" />Deal vs self-publishing</h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatBox label="Cash from the publisher" value={fmt$(result.deal.dealCash)} tone="good" />
            <StatBox label="Coverage the publisher absorbs" value={fmt$(result.deal.avoidedCosts)} tone="good" />
            <StatBox label="Lock-up opportunity cost" value={fmt$(result.deal.opportunityCost)} tone={result.deal.opportunityCost > result.deal.dealCash ? 'bad' : 'warn'} />
            <StatBox label="Post-window prestige uplift" value={fmt$(result.deal.prestigeValue)} tone="good" />
            <StatBox label="This deal nets vs self-publishing" value={fmt$(result.deal.netVersusSelf)} tone={result.deal.netVersusSelf > 0 ? 'good' : 'bad'} />
            <StatBox label="Effective $/hr of the deal" value={result.deal.effectiveHourly.toFixed(1)} tone={result.deal.effectiveHourly >= input.hourlyRate ? 'good' : result.deal.effectiveHourly >= input.hourlyRate * 0.5 ? 'warn' : 'bad'} />
            <StatBox label="Self-publish net over same window" value={fmt$(result.selfPublishNet)} tone={result.selfPublishNet >= result.deal.netVersusSelf ? 'bad' : 'good'} />
            {isRoyalty && (
              <StatBox label="Royalty break-even copies" value={result.royaltyBreakEvenCopies === Infinity ? '∞ (no royalty)' : `${Math.round(result.royaltyBreakEvenCopies).toLocaleString()}`} tone={result.royaltyBreakEvenCopies === Infinity ? 'bad' : 'warn'} />
            )}
            {!isRoyalty && <StatBox label="Fee band (market sanity)" value={`$${result.feeBandMin}–$${result.feeBandMax}`} />}
          </div>
          {result.deal.netVersusSelf <= 0 && (
            <p className="text-xs text-muted-foreground">Negative means the fee plus coverage does not cover your foregone self-sales during the window — self-publishing this design pays better.</p>
          )}
          <p className="text-xs text-muted-foreground leading-4">Market sanity: flat fees run $100–550 by tier and complexity (Knitty $250–350; Making Stories €100–550; Who Pays Knitters average $246, range $40–700). Exclusivity windows run 3–12 months (3mo Knitty, 4mo Making Stories, 5mo Laine, 12mo top). Kill fees sit at ~50% of the contracted fee. Lease norms start as low as $30 — that is a floor, not a benchmark; selling rights outright should cost the publisher 1.5–2× the fee-plus-window equivalent.</p>
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
