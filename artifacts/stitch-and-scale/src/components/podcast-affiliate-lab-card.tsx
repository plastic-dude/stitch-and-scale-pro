import { useMemo, useState, useEffect } from 'react';
import { getLabStatCopy, type LabStatCopy } from '@/lib/lab-stat-copy';
import { useSettings } from '@/context/SettingsContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Flag, Layers, Lightbulb, Minus, Plus, Radio } from 'lucide-react';
import { PatternProject } from '@/lib/grading-engine';
import { PODCAST_AFFILIATE_COPY } from '@/lib/podcast-affiliate-copy';
import { projectStorage } from '@/lib/storage-lib';
import {
  analyzePodcastAffiliate,
  DEFAULT_PODCAST,
  fmt$,
  type PodcastInput,
  type Program,
} from '@/lib/podcast-affiliate-lab';

const STORAGE_KEY = 'stitch-and-scale-podcast-v1';

type StoredState = PodcastInput & { ts?: number };

function defaultStored(): StoredState {
  return {
    ...DEFAULT_PODCAST,
    programs: DEFAULT_PODCAST.programs.map(p => ({ ...p })),
  };
}

function loadStored(handle: ReturnType<typeof projectStorage<StoredState>>): StoredState {
  const parsed = handle.read();
  if (parsed) {
    return {
      ...defaultStored(),
      ...parsed,
      programs: ((parsed as StoredState).programs ?? defaultStored().programs).map(
        p => ({ ...defaultStored().programs[0], ...p }),
      ),
      ts: undefined,
    };
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
  v.startsWith('Audience is an asset') ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30' :
  v.startsWith('Growing audience') ? 'bg-sky-500/15 text-sky-700 border-sky-500/30' :
  v.startsWith('Small-audience') ? 'bg-sky-500/15 text-sky-700 border-sky-500/30' :
  v.startsWith('Monetize at all') ? 'bg-amber-500/15 text-amber-700 border-amber-500/30' :
  v.startsWith('The show currently') ? 'bg-destructive/10 text-destructive border-destructive/30' :
  'bg-amber-500/15 text-amber-700 border-amber-500/30';

function programLaneTone(net: number): 'good' | 'bad' {
  return net >= 0 ? 'good' : 'bad';
}

export function PodcastAffiliateLabCard({ project }: { project: PatternProject }) {
  const handle = useMemo(() => projectStorage<StoredState>('podcast-affiliate', project.id, [STORAGE_KEY]), [project.id]);
  const [input, setInput] = useState<PodcastInput>(() => loadStored(handle));
  const { language } = useSettings();
  const ls: LabStatCopy = getLabStatCopy(language);
  const copyText = PODCAST_AFFILIATE_COPY[language];

  useEffect(() => {
    setInput(loadStored(handle));
  }, [handle]);

  const persist = (next: PodcastInput) => {
    setInput(next);
    handle.write({ ...next, ts: Date.now() });
  };

  const result = useMemo(() => analyzePodcastAffiliate(input), [input]);
  const set = <K extends keyof PodcastInput>(k: K, v: PodcastInput[K]) => persist({ ...input, [k]: v });
  const setProgram = (i: number, patch: Partial<Program>) =>
    persist({ ...input, programs: input.programs.map((p, idx) => (idx === i ? { ...p, ...patch } : p)) });
  const addProgram = () =>
    persist({ ...input, programs: [...input.programs, { name: 'New program', commission: 0.1, clicksPerEpisode: 0, conversionRate: 0.02, aov: 50, platformCut: 0 }] });
  const removeProgram = (i: number) =>
    persist({ ...input, programs: input.programs.filter((_, idx) => idx !== i) });

  const cpm = result.lanes.find(l => l.label === 'CPM sponsorship')!;
  const flat = result.lanes.find(l => l.label === 'Flat-fee reads')!;
  const aff = result.lanes.find(l => l.label === 'Affiliate programs')!;
  const best = result.lanes.reduce((a, b) => (a.netMonthly > b.netMonthly ? a : b), result.lanes[0]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base"><Radio className="size-4" />Podcast & Affiliate Lab</CardTitle>
        <CardDescription>What is your knitting podcast, newsletter, or following actually worth — and which lane should you take at your current audience size? Industry CPM rates run $18 for a 30-sec pre-roll and $25 for a 60-sec mid-roll, with host-read mid-rolls at niche fiber-arts shows trading at $25–50 (a craft audience is a targeting premium, not a discount). Affiliate programs pay 10% (Knit Picks, Crochet.com) up to 30% (LoveCrafts). CPM deals only make sense from around 5,000 downloads/episode — below that, flat-fee reads and affiliate links are where small relevant shows actually profit. This lab models all three lanes side by side, nets out the 10–30% network cuts, prices your production hours against your real rate, and flags the exact deal terms to renegotiate.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <section className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-1.5"><Layers className="size-4" />Your show & audience</h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <NumField id="pa-downloads" label={copyText.downloadsPerEpisode} value={input.downloadsPerEpisode} onChange={n => set('downloadsPerEpisode', Math.max(0, n))} min={0} />
            <NumField id="pa-eps" label={copyText.episodesPerMonth} value={input.episodesPerMonth} onChange={n => set('episodesPerMonth', Math.max(1, Math.min(30, n)))} min={1} max={30} />
            <NumField id="pa-hours" label={copyText.productionHoursPerEpisode} value={input.productionHoursPerEpisode} onChange={n => set('productionHoursPerEpisode', Math.max(0.5, n))} min={0.5} step={0.5} suffix="hrs" />
            <NumField id="pa-rate" label={ls.opportunityRate} value={input.hourlyRate} onChange={n => set('hourlyRate', Math.max(1, n))} suffix="$/hr" />
            <NumField id="pa-setup" label={copyText.oneOffSetupCostsMic} value={input.setupCosts} onChange={n => set('setupCosts', Math.max(0, n))} suffix="$" />
            <NumField id="pa-monthly" label={copyText.recurringMonthlyCostsHosting} value={input.monthlyCosts} onChange={n => set('monthlyCosts', Math.max(0, n))} suffix="$/mo" />
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-1.5"><Radio className="size-4" />CPM sponsorship lane</h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <NumField id="pa-cpm" label={copyText.yourQuotedCpm} value={input.cpmRate} onChange={n => set('cpmRate', Math.max(0, n))} suffix="$/1,000 listens" />
            <NumField id="pa-slots" label={copyText.adSlotsPerEpisode} value={input.adSlotsPerEpisode} onChange={n => set('adSlotsPerEpisode', Math.max(0, Math.min(4, n)))} min={0} max={4} />
            <NumField id="pa-network" label={copyText.networkMarketplaceCut} value={input.networkCut * 100} onChange={n => set('networkCut', Math.max(0, Math.min(1, n / 100)))} min={0} max={100} step={5} suffix="%" />
            <NumField id="pa-fill" label={copyText.fillRateShareOf} value={input.fillRate * 100} onChange={n => set('fillRate', Math.max(0, Math.min(1, n / 100)))} min={0} max={100} step={5} suffix="%" />
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-1.5"><Radio className="size-4" />Flat-fee reads lane</h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <NumField id="pa-flat" label={copyText.flatFeePerRead} value={input.flatFeePerRead} onChange={n => set('flatFeePerRead', Math.max(0, n))} suffix="$" />
            <NumField id="pa-reads" label={copyText.sponsoredReadsPerMonth} value={input.readsPerMonth} onChange={n => set('readsPerMonth', Math.max(0, Math.min(12, n)))} min={0} max={12} />
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-1.5"><Radio className="size-4" />Affiliate programs lane</h3>
          <div className="space-y-2">
            {input.programs.map((p, i) => (
              <div key={i} className="grid grid-cols-[1.3fr_1fr_1fr_1fr_1fr_1fr_auto] items-end gap-2">
                <div className="space-y-1.5">
                  <Label htmlFor={`pa-name-${i}`} className="text-xs">Program</Label>
                  <Input id={`pa-name-${i}`} value={p.name}
                    onChange={e => setProgram(i, { name: e.target.value })}
                    className="text-sm" placeholder={ls.affilPlaceholder} />
                </div>
                <NumField id={`pa-com-${i}`} label={copyText.commission} value={p.commission * 100} onChange={n => setProgram(i, { commission: Math.max(0, Math.min(1, n / 100)) })} min={0} max={100} step={1} suffix="%" />
                <NumField id={`pa-clicks-${i}`} label={copyText.clicksPerEpisode} value={p.clicksPerEpisode} onChange={n => setProgram(i, { clicksPerEpisode: Math.max(0, n) })} min={0} />
                <NumField id={`pa-conv-${i}`} label={copyText.conversion} value={p.conversionRate * 100} onChange={n => setProgram(i, { conversionRate: Math.max(0, Math.min(1, n / 100)) })} min={0} max={100} step={0.5} suffix="%" />
                <NumField id={`pa-aov-${i}`} label={copyText.avgOrderValue} value={p.aov} onChange={n => setProgram(i, { aov: Math.max(0, n) })} suffix="$" />
                <NumField id={`pa-cut-${i}`} label={copyText.platformCut} value={p.platformCut * 100} onChange={n => setProgram(i, { platformCut: Math.max(0, Math.min(1, n / 100)) })} min={0} max={100} step={5} suffix="%" />
                {input.programs.length > 1 ? (
                  <Button type="button" variant="ghost" size="icon" className="mb-0.5 h-9 w-9" onClick={() => removeProgram(i)} aria-label={`Remove program ${i + 1}`}>
                    <Minus className="size-4" />
                  </Button>
                ) : <div />}
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addProgram} className="w-full">
              <Plus className="size-4" /> Add another program
            </Button>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-1.5"><Radio className="size-4" />Lane comparison</h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatBox label={ls.cpmNetPerMonth} value={fmt$(cpm.netMonthly)} tone={programLaneTone(cpm.netMonthly)} />
            <StatBox label={ls.flatFeesNetPerMonth} value={fmt$(flat.netMonthly)} tone={programLaneTone(flat.netMonthly)} />
            <StatBox label={ls.affiliateNetPerMonth} value={fmt$(aff.netMonthly)} tone={programLaneTone(aff.netMonthly)} />
            <StatBox label={ls.bestLanePerHr} value={best.effectiveHourly.toFixed(1)} tone={best.effectiveHourly >= input.hourlyRate ? 'good' : best.effectiveHourly >= 35 ? 'warn' : 'bad'} />
          </div>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-xs">
              <thead className="bg-accent/60 text-muted-foreground">
                <tr>
                  <th className="p-2 text-left">Lane</th>
                  <th className="p-2 text-right">Gross / month</th>
                  <th className="p-2 text-right">Net / month</th>
                  <th className="p-2 text-right">Hours / month</th>
                  <th className="p-2 text-right">Effective $/hr</th>
                </tr>
              </thead>
              <tbody>
                {result.lanes.map(l => (
                  <tr key={l.label} className={`border-t ${l.label === best.label ? 'bg-emerald-500/10' : ''}`}>
                    <td className="p-2 font-medium">{l.label}</td>
                    <td className="p-2 text-right">{fmt$(l.grossMonthly)}</td>
                    <td className={`p-2 text-right ${l.netMonthly >= 0 ? 'text-emerald-700' : 'text-destructive'}`}>{fmt$(l.netMonthly)}</td>
                    <td className="p-2 text-right">{l.hoursPerMonth.toFixed(1)}</td>
                    <td className="p-2 text-right">{l.effectiveHourly.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatBox label={ls.cpmBenchmarkBand} value={`$${result.cpmBenchmarkLow}–$${result.cpmBenchmarkHigh}`} />
            <StatBox label={ls.fairFlatFeePerRead} value={fmt$(result.flatFeeEquivalent)} />
            <StatBox label={ls.cpmBreakEvenAudience} value={`${Math.round(result.cpmBreakEvenDownloads).toLocaleString()} downloads/ep`} tone={input.downloadsPerEpisode >= result.cpmBreakEvenDownloads ? 'good' : 'warn'} />
            <StatBox label={ls.bestMonthlyNetAllLanes} value={fmt$(result.lanes.reduce((s, l) => s + l.netMonthly, 0))} tone={result.lanes.reduce((s, l) => s + l.netMonthly, 0) >= 0 ? 'good' : 'bad'} />
          </div>
          {result.lanes.length === 0 && (
            <p className="text-xs text-muted-foreground">Enter your downloads per episode and episode cadence for the lab to model the three lanes.</p>
          )}
          <p className="text-xs text-muted-foreground leading-4">Market sanity: host-read mid-rolls trade $25–50 with host-read premium over programmatic ($15–25); industry standards are $18 pre-roll / $25 mid-roll. Network cuts run ~30%, marketplaces 10–20% (Podcorn 10%, Gumball 20%). Sponsorship is not worth pitching below ~200 downloads/episode and CPM starts working from ~5,000. Keep ad reads to 30–60 seconds and no more than ~10% of episode length — listener trust is the asset that makes host-read ads pay a premium.</p>
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
