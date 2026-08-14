import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, FileSearch } from 'lucide-react';
import { PatternProject } from '@/lib/grading-engine';
import { projectStorage } from '@/lib/storage-lib';
import {
  analyzeSubmission,
  DEFAULT_SUBMISSION,
  OFFER_TYPE_LABELS,
  DIFFICULTY_LABELS,
  LAINE_EXCLUSIVITY_MONTHS,
  MAGAZINE_SWEATER_CEILING,
  SWEATER_HOURS_RANGE,
  ACCESSORY_HOURS_RANGE,
  TECH_EDIT_COST,
  MODEL_COST,
  YARN_COST,
  KNITCRATE_MAX_ITEM_FEE,
  RAVELRY_MEDIAN_JAN,
  type OfferType,
  type Difficulty,
  type SubmissionInput,
} from '@/lib/submission-desk';

function defaultStored(): SubmissionInput {
  return { ...DEFAULT_SUBMISSION };
}

function loadStored(handle: ReturnType<typeof projectStorage<SubmissionInput>>): SubmissionInput {
  const parsed = handle.read();
  if (parsed) {
    const merged = { ...defaultStored(), ...parsed };
    merged.offerType = ['magazine', 'box', 'book'].includes(merged.offerType) ? merged.offerType : 'magazine';
    merged.difficulty = ['accessory', 'sweater', 'other'].includes(merged.difficulty) ? merged.difficulty : 'sweater';
    return merged as SubmissionInput;
  }
  return defaultStored();
}

/** Display a percentage to one decimal without a trailing .0 (same rule as the Yarn Buy fix #28). */
const fmtPct = (pct: number): string => {
  const withOne = (pct * 100).toFixed(1);
  return withOne.endsWith('.0') ? withOne.slice(0, -2) : withOne;
};

const fmt$ = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

const verdictColor = (v: string) =>
  v === 'go' ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30' :
  v === 'no' ? 'bg-destructive/15 text-destructive border-destructive/30' :
  'bg-amber-500/15 text-amber-700 border-amber-500/30';

/** Quick-load presets from session-39 research. */
const PRESETS: { label: string; input: Partial<SubmissionInput> }[] = [
  {
    label: 'Laine-style magazine (sweater)',
    input: { offerType: 'magazine', fee: 900, difficulty: 'sweater', exclusivityMonths: 5, sampleCost: 75, modelCost: 0, techEditCost: 0, labourHours: 65, yarnSupportValue: 75, royaltyPct: 0 },
  },
  {
    label: 'Box deal (design for one cohort)',
    input: { offerType: 'box', fee: 0, difficulty: 'accessory', exclusivityMonths: 0, sampleCost: 45, modelCost: 0, techEditCost: 0, labourHours: 30, yarnSupportValue: 45, royaltyPct: 0 },
  },
  {
    label: 'Anthology / book contribution',
    input: { offerType: 'book', fee: 1500, difficulty: 'sweater', exclusivityMonths: 12, sampleCost: 90, modelCost: 40, techEditCost: 40, labourHours: 80, yarnSupportValue: 0, royaltyPct: 5 },
  },
];

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

export function SubmissionDeskCard({ project }: { project: PatternProject }) {
  const handle = useMemo(
    () => projectStorage<SubmissionInput>('submissions', project.id || '', []),
    [project.id],
  );
  const [stored, setStored] = useState<SubmissionInput>(() => loadStored(handle));

  useEffect(() => {
    handle.write(stored);
  }, [stored, handle]);

  const patch = (patch: Partial<SubmissionInput>) => setStored((s) => ({ ...s, ...patch }));
  const applyPreset = (preset: Partial<SubmissionInput>) => setStored((s) => ({ ...s, ...preset }));

  const result = useMemo(() => analyzeSubmission(stored), [stored]);

  const hoursRange = stored.difficulty === 'accessory' ? ACCESSORY_HOURS_RANGE : SWEATER_HOURS_RANGE;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileSearch className="h-4 w-4" /> Submissions
        </CardTitle>
        <CardDescription>
          No tool in the market prices a call-for-submissions — designers answer &quot;design for our box&quot; and
          &quot;submit to our issue&quot; offers on gut feel. This prices the deal against the alternative you&apos;re
          giving up: self-publishing. The offer&apos;s fee is weighed against your labour floor, the sales you surrender
          during the exclusive window, and the tail that comes back when rights return — with the red flags that
          KnitCrate and the exposure-only trap taught the industry.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quick-load presets */}
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <Badge key={p.label} variant="outline" className="cursor-pointer hover:bg-muted"
              onClick={() => applyPreset(p.input)}>
              {p.label}
            </Badge>
          ))}
        </div>

        {/* Offer type + difficulty */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="sub-type" className="text-xs">Offer type</Label>
            <Select value={stored.offerType} onValueChange={(v) => patch({ offerType: v as OfferType })}>
              <SelectTrigger id="sub-type"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(OFFER_TYPE_LABELS) as OfferType[]).map((t) => (
                  <SelectItem key={t} value={t}>{OFFER_TYPE_LABELS[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sub-difficulty" className="text-xs">Difficulty</Label>
            <Select value={stored.difficulty} onValueChange={(v) => patch({ difficulty: v as Difficulty })}>
              <SelectTrigger id="sub-difficulty"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(DIFFICULTY_LABELS) as Difficulty[]).map((d) => (
                  <SelectItem key={d} value={d}>{DIFFICULTY_LABELS[d]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Money side */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <NumField id="sub-fee" label="Flat fee the offer pays" value={stored.fee}
            min={0} step={50} onChange={(n) => patch({ fee: n })} suffix="$" />
          <NumField id="sub-exclusivity" label="Exclusivity window" value={stored.exclusivityMonths}
            min={0} max={24} onChange={(n) => patch({ exclusivityMonths: Math.min(24, n) })} suffix="mo" />
          <NumField id="sub-yarn" label="Yarn support value" value={stored.yarnSupportValue}
            min={0} step={5} onChange={(n) => patch({ yarnSupportValue: n })} suffix="$" />
          <NumField id="sub-royalty" label="Royalty share (box deals)" value={stored.royaltyPct}
            min={0} max={100} step={0.5} onChange={(n) => patch({ royaltyPct: Math.min(100, n) })} suffix="%" />
        </div>

        {/* Costs side */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <NumField id="sub-sample" label="Sample cost (you fund)" value={stored.sampleCost}
            min={0} step={5} onChange={(n) => patch({ sampleCost: n })} suffix="$" />
          <NumField id="sub-model" label="Model / photography (you fund)" value={stored.modelCost}
            min={0} step={5} onChange={(n) => patch({ modelCost: n })} suffix="$" />
          <NumField id="sub-techedit" label="Tech editing (you fund)" value={stored.techEditCost}
            min={0} step={5} onChange={(n) => patch({ techEditCost: n })} suffix="$" />
          <NumField id="sub-price" label="Own-store pattern price" value={stored.patternPrice}
            min={0} step={0.5} onChange={(n) => patch({ patternPrice: n })} suffix="$" />
        </div>

        {/* Labour + own store */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <NumField id="sub-hours" label="Your total hours" value={stored.labourHours}
            min={0} onChange={(n) => patch({ labourHours: n })} suffix="hrs" />
          <NumField id="sub-rate" label="Your hourly rate (floor)" value={stored.hourlyRate}
            min={0} step={1} onChange={(n) => patch({ hourlyRate: n })} suffix="$/hr" />
          <NumField id="sub-weekly" label="Weekly own-store sales (copies)" value={stored.weeklyOwnSales}
            min={0} step={0.5} onChange={(n) => patch({ weeklyOwnSales: n })} suffix="wk" />
        </div>

        <p className="text-xs text-muted-foreground">
          Benchmarks baked in: magazines pay by difficulty and cap around ${MAGAZINE_SWEATER_CEILING} for a sweater
          ({SWEATER_HOURS_RANGE.min}–{SWEATER_HOURS_RANGE.max}h; accessories {ACCESSORY_HOURS_RANGE.min}–{ACCESSORY_HOURS_RANGE.max}h);
          the standard cost stack is ${TECH_EDIT_COST} tech edit / ${MODEL_COST} model / ${YARN_COST} yarn (MediaPeruana BTS);
          Laine-style exclusivity runs {LAINE_EXCLUSIVITY_MONTHS} months from publication; KnitCrate — the cautionary tale,
          collapsed Dec 2022 owing artists, having paid a max of ${KNITCRATE_MAX_ITEM_FEE} per item — is the reason the
          box-channel flag exists; median Ravelry income is ${RAVELRY_MEDIAN_JAN} in a good January, so self-publish rates
          are entered honestly.
        </p>

        {/* Verdict */}
        <div className={`rounded-lg border p-4 ${verdictColor(result.verdict)}`}>
          <Badge className={`${verdictColor(result.verdict)} border uppercase`}>{result.verdict}</Badge>
          <p className="text-sm mt-2">{result.verdictReason}</p>
          <p className="text-sm mt-2 text-muted-foreground">{result.suggestion}</p>
        </div>

        {/* KPI tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="text-xs text-muted-foreground">Net outcome (incl. tail, excl. labour priced in)</div>
            <div className={`text-2xl font-bold ${result.netOutcome >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
              {fmt$(result.netOutcome)}
            </div>
          </div>
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="text-xs text-muted-foreground">Effective rate per hour</div>
            <div className={`text-2xl font-bold ${result.effectiveHourly >= stored.hourlyRate ? 'text-emerald-600' : 'text-destructive'}`}>
              {fmt$(result.effectiveHourly)}/hr
            </div>
            <div className="text-xs text-muted-foreground mt-1">vs your ${stored.hourlyRate}/hr floor</div>
          </div>
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="text-xs text-muted-foreground">Exclusivity dead-loss ({stored.exclusivityMonths} mo)</div>
            <div className={`text-2xl font-bold ${result.exclusivityDeadLoss > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
              {fmt$(result.exclusivityDeadLoss)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">own-store sales silenced</div>
          </div>
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="text-xs text-muted-foreground">Rights-return tail (8-week ramp)</div>
            <div className="text-2xl font-bold">{fmt$(result.rightsReturnTail)}</div>
            <div className="text-xs text-muted-foreground mt-1">break-even fee: {fmt$(result.breakEvenFee)}</div>
          </div>
        </div>

        {/* Labour math */}
        <div className="rounded-lg border p-4 space-y-2">
          <div className="font-semibold text-sm flex items-center gap-2">
            <FileSearch className="h-4 w-4 text-sky-600" /> The two sides of the ledger
          </div>
          <p className="text-sm text-muted-foreground">
            Your labour floor is {fmt$(result.floorFee)} ({stored.labourHours}h × ${stored.hourlyRate}/hr) — the
            absolute minimum the fee should clear. The offer nets {fmt$(result.netOutcome)} after sample, model and
            tech-edit costs, and your exclusive window silences {fmt$(result.exclusivityDeadLoss)} of own-store sales.
            When rights return, an 8-week ramp recovers roughly {fmt$(result.rightsReturnTail)} — the tail is why a
            negotiated short window ({LAINE_EXCLUSIVITY_MONTHS} months, the Laine standard) so often flips a deal
            from no to go.
          </p>
        </div>

        {/* Red flags */}
        {result.redFlags.length > 0 && (
          <div className="space-y-2">
            <div className="font-semibold text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" /> Red flags — S-01 to S-07
            </div>
            {result.redFlags.map((f) => (
              <div key={f.id} className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm">
                <div className="font-medium">{f.label} <span className="text-xs text-muted-foreground">({f.id})</span></div>
                <div className="text-muted-foreground text-xs mt-1">{f.detail}</div>
              </div>
            ))}
          </div>
        )}

        {/* Royalty note */}
        {stored.royaltyPct > 0 && stored.offerType === 'box' && (
          <p className="text-xs text-muted-foreground">
            Royalty counted as a tail over a ~2-month box-cohort run at your own-store price × weekly sales. Most box
            deals pay one-time flat fees; a royalty clause is a real advantage — but check the solvency of the box
            before trusting it (see S-06).
          </p>
        )}
      </CardContent>
    </Card>
  );
}
