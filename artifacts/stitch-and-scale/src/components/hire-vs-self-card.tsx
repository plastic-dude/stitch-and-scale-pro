import { copyTextOrThrow } from '@/lib/clipboard';
import { useMemo, useState } from 'react';
import { useProjectStorage, useProjectStorageState } from '@/lib/storage-lib';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ClipboardCopy, Scissors, Pencil } from 'lucide-react';
import { PatternProject } from '@/lib/grading-engine';
import { useSettings } from '@/context/SettingsContext';
import { HIRE_VS_SELF_COPY } from '@/lib/hire-vs-self-copy';
import {
  analyzeHireDecision,
  buildHiringPack,
  DEFAULT_DESIGNER_OPPORTUNITY_RATE,
  SAMPLE_KNIT_RATE_PER_YARD,
  TECH_EDIT_HOURLY_LOW,
} from '@/lib/hire-vs-self-analyzer';

const STORAGE_KEY = 'kskhirevsself-v1';

interface StoredHire {
  opportunityRate: number;
  sampleRatePerYard: number;
  shipping: number;
  flatSampleFee: number;
  selfEditHours: number;
  editorRate: number;
  showListing: boolean;
}

function defaults(): StoredHire {
  return {
    opportunityRate: DEFAULT_DESIGNER_OPPORTUNITY_RATE,
    sampleRatePerYard: 0,
    shipping: 8,
    flatSampleFee: 0,
    selfEditHours: 0,
    editorRate: 0,
    showListing: false,
  };
}

// CHK-152: pure derivation over the raw stored value — takes no
// handle, so it can never reach for a freshly-created handle in an initializer.
function loadStored(raw: StoredHire | null): StoredHire {
  try {
    
    if (raw) {
      if (raw && typeof raw.opportunityRate === 'number') {
        return { ...defaults(), ...raw };
      }
    }
  } catch {
    /* storage unreadable — start fresh */
  }
  return defaults();
}

const fmt$ = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const fmtDec = (n: number, digits = 1) =>
  n.toLocaleString('en-US', { maximumFractionDigits: digits });

export function HireVsSelfCard({ project }: { project: PatternProject }) {
  // issue #4 project seam: one scoped store per project; the legacy flat key 'kskhirevsself-v1' is folded in on first read, then removed.
  // CHK-152 (QUEUE-010): the old useMemo handle + `useState(() =>
// loadStored(handle))` lazy initializer was the crash class under HMR.
// Now flows through the shared seam: stable handle, memoized derivation.
const handle = useProjectStorage<StoredHire>('hirevsself', project.id, ['kskhirevsself-v1']);
  const { toast } = useToast();
  const { language } = useSettings();
  const copyText = HIRE_VS_SELF_COPY[language];
  const [stored, setStored] = useProjectStorageState(handle, (raw) => loadStored(raw));
  // CHK-152: persistence owned by the seam's state hook — a manual
  // write-on-change effect would double-write every update.

  const result = useMemo(
    () =>
      analyzeHireDecision({
        project,
        yarnWeight: project.yarnWeight ?? 'worsted',
        opportunityRate: stored.opportunityRate,
        sampleRatePerYard: stored.sampleRatePerYard,
        shipping: stored.shipping,
        flatSampleFee: stored.flatSampleFee,
        selfEditHours: stored.selfEditHours,
        editorRate: stored.editorRate,
        editHours: 0,
      }),
    [project, stored]
  );
  const pack = useMemo(() => buildHiringPack(
    {
      project,
      yarnWeight: project.yarnWeight ?? 'worsted',
      opportunityRate: stored.opportunityRate,
      sampleRatePerYard: stored.sampleRatePerYard,
      shipping: stored.shipping,
      flatSampleFee: stored.flatSampleFee,
      selfEditHours: stored.selfEditHours,
      editorRate: stored.editorRate,
      editHours: 0,
    },
    result
  ), [project, stored, result]);

  const copy = async (text: string) => {
    try {
      await copyTextOrThrow(text);
      toast({ title: copyText.copied });
    } catch {
      toast({ title: copyText.copyFailed });
    }
  };

  const verdictBadge =
    result.overallVerdict === 'go'
      ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30'
      : result.overallVerdict === 'no'
        ? 'bg-destructive/15 text-destructive border-destructive/30'
        : 'bg-amber-500/15 text-amber-700 border-amber-500/30';

  const legBadge = (v: 'hire' | 'self' | 'either') =>
    v === 'hire'
      ? 'bg-blue-500/15 text-blue-700 border-blue-500/30'
      : v === 'self'
        ? 'bg-slate-500/15 text-slate-700 border-slate-500/30'
        : 'bg-amber-500/15 text-amber-700 border-amber-500/30';

  const num = (e: React.ChangeEvent<HTMLInputElement>) => Number(e.target.value);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scissors className="h-5 w-5" /> {copyText.title}
        </CardTitle>
        <CardDescription>
          {copyText.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* ---------------------------------------------------------------- */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {copyText.rates}
          </h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="hvs-opp">
                {copyText.opportunity}
              </Label>
              <Input
                id="hvs-opp"
                type="number"
                className="h-9"
                value={stored.opportunityRate}
                onChange={(e) => setStored((s) => ({ ...s, opportunityRate: num(e) }))}
              />
              <p className="text-[11px] text-muted-foreground">
                {copyText.opportunityHint}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="hvs-rate">
                {copyText.sampleRate}
              </Label>
              <Input
                id="hvs-rate"
                type="number"
                step="0.01"
                className="h-9"
                value={stored.sampleRatePerYard}
                onChange={(e) => setStored((s) => ({ ...s, sampleRatePerYard: num(e) }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="hvs-flat">
                {copyText.flatFee}
              </Label>
              <Input
                id="hvs-flat"
                type="number"
                className="h-9"
                value={stored.flatSampleFee}
                onChange={(e) => setStored((s) => ({ ...s, flatSampleFee: num(e) }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="hvs-ship">
                {copyText.shipping}
              </Label>
              <Input
                id="hvs-ship"
                type="number"
                className="h-9"
                value={stored.shipping}
                onChange={(e) => setStored((s) => ({ ...s, shipping: num(e) }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="hvs-editor">
                {copyText.editorRate}
              </Label>
              <Input
                id="hvs-editor"
                type="number"
                className="h-9"
                value={stored.editorRate}
                onChange={(e) => setStored((s) => ({ ...s, editorRate: num(e) }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="hvs-edithrs">
                {copyText.selfEdit}
              </Label>
              <Input
                id="hvs-edithrs"
                type="number"
                className="h-9"
                value={stored.selfEditHours}
                onChange={(e) => setStored((s) => ({ ...s, selfEditHours: num(e) }))}
              />
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        <section className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {copyText.verdict}
          </h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-md border bg-card/50 p-3">
              <p className="text-xs text-muted-foreground">{copyText.yardage}</p>
              <p className="text-lg font-semibold">{result.sampleYards.toLocaleString()} yd</p>
              <p className="text-[11px] text-muted-foreground">≈ {fmtDec(result.selfKnitHours)} hr at 30 yd/hr</p>
            </div>
            <div className="rounded-md border bg-card/50 p-3">
              <p className="text-xs text-muted-foreground">{copyText.hireSample}</p>
              <p className="text-lg font-semibold">{fmt$(result.hireSampleCost)}</p>
              <Badge variant="outline" className={`mt-1 border ${legBadge(result.sampleVerdict)}`}>
                {result.sampleVerdict === 'hire' ? 'HIRE' : result.sampleVerdict === 'self' ? 'SELF' : 'EITHER'}
              </Badge>
            </div>
            <div className="rounded-md border bg-card/50 p-3">
              <p className="text-xs text-muted-foreground">{copyText.editScope}</p>
              <p className="text-lg font-semibold">
                {fmtDec(result.editHours)} hr · {fmt$(result.hireEditCost)}
              </p>
              <Badge variant="outline" className={`mt-1 border ${legBadge(result.editVerdict)}`}>
                {result.editVerdict === 'hire' ? 'HIRE' : result.editVerdict === 'self' ? 'SELF' : 'EITHER'}
              </Badge>
            </div>
            <div className="rounded-md border bg-card/50 p-3">
              <p className="text-xs text-muted-foreground">{copyText.hoursFreed}</p>
              <p className="text-lg font-semibold">{fmtDec(result.hoursFreed)} hr</p>
              <p className="text-[11px] text-muted-foreground">≈ {fmt$(result.freedIncomePotential)} at your rate</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{copyText.overall}</span>
            <Badge variant="outline" className={`border ${verdictBadge}`}>
              {result.overallVerdict.toUpperCase()} — self costs {fmt$(result.totalSelfCost)}, hiring costs{' '}
              {fmt$(result.totalHireCost)}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {result.savings >= 0 ? `outsourcing nets ≈ ${fmt$(result.savings)} of opportunity value` : `self-knitting saves ≈ ${fmt$(-result.savings)}`}
            </span>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        <section className="space-y-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {copyText.reasoning}
          </h3>
          <ul className="space-y-2">
            {result.sampleNotes.map((n, i) => (
              <li key={`s${i}`} className="rounded-md border bg-card/50 p-2.5 text-sm leading-relaxed">
                {n}
              </li>
            ))}
            {result.editNotes.map((n, i) => (
              <li key={`e${i}`} className="rounded-md border bg-card/50 p-2.5 text-sm leading-relaxed">
                {n}
              </li>
            ))}
          </ul>
        </section>

        {/* ---------------------------------------------------------------- */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {copyText.checklist} ({pack.items.filter((i) => !i.flag).length}/{pack.items.length} {copyText.clear})
            </h3>
          </div>
          <ul className="space-y-2">
            {pack.items.map((item, i) => (
              <li
                key={i}
                className={`rounded-md border p-2.5 text-sm leading-relaxed ${
                  item.flag ? 'border-destructive/40 bg-destructive/5' : 'bg-card/50'
                }`}
              >
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 text-emerald-600">{item.flag ? '✗' : '✓'}</span>
                  <div>
                    <p className="font-medium">{item.check}</p>
                    <p className="text-xs text-muted-foreground">{item.rationale}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-2">
            <Switch
              id="hvs-listing"
              checked={stored.showListing}
              onCheckedChange={(v) => setStored((s) => ({ ...s, showListing: v }))}
            />
            <Label htmlFor="hvs-listing" className="text-sm">
              {copyText.listing}
            </Label>
          </div>
          {stored.showListing && (
            <div className="relative rounded-md border bg-muted/50 p-3">
              <pre className="whitespace-pre-wrap text-sm font-mono">{pack.sampleKnitListing}</pre>
              <Button
                size="sm"
                variant="outline"
                className="absolute right-2 top-2"
                onClick={() => copy(pack.sampleKnitListing)}
              >
                <ClipboardCopy className="h-3.5 w-3.5" /> {copyText.copy}
              </Button>
            </div>
          )}
        </section>

        {/* ---------------------------------------------------------------- */}
        <section className="rounded-md border border-dashed p-3 text-xs leading-relaxed text-muted-foreground">
          <Pencil className="mb-1 inline h-3.5 w-3.5" /> Pay standards cited in every verdict: $0.12/yard knit sample
          pay (Tendyke; 12p/metre at Sloan/Ford), ~$80 flat per sweater, $30–40/hr tech editing with sweaters at ~4
          hours and fixed-rate editors at $30 hats / $50 garments +$5 per extra size (Works of Our Hands, Storta).
          Test knits are normally unpaid with credit — paid flat fees are the better practice.
        </section>
      </CardContent>
    </Card>
  );
}
