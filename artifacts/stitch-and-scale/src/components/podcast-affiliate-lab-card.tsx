import { useMemo, useState, useEffect } from 'react';
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

export function PodcastAffiliateLabCard({ project }: { project: PatternProject }) {
  const handle = useMemo(() => projectStorage<StoredState>('podcast-affiliate', project.id, [STORAGE_KEY]), [project.id]);
  const [input, setInput] = useState<PodcastInput>(() => loadStored(handle));
  const { language } = useSettings();
  const copy = PODCAST_AFFILIATE_COPY[language];

  useEffect(() => {
    setInput(loadStored(handle));
  }, [handle]);

  const persist = (next: PodcastInput) => {
    setInput(next);
    handle.write({ ...next, ts: Date.now() });
  };

  const result = useMemo(() => analyzePodcastAffiliate(input, { language }), [input, language]);
  const set = <K extends keyof PodcastInput>(k: K, v: PodcastInput[K]) => persist({ ...input, [k]: v });
  const setProgram = (i: number, patch: Partial<Program>) =>
    persist({ ...input, programs: input.programs.map((p, idx) => (idx === i ? { ...p, ...patch } : p)) });
  const addProgram = () =>
    persist({ ...input, programs: [...input.programs, { name: 'New program', commission: 0.1, clicksPerEpisode: 0, conversionRate: 0.02, aov: 50, platformCut: 0 }] });
  const removeProgram = (i: number) =>
    persist({ ...input, programs: input.programs.filter((_, idx) => idx !== i) });

  const best = result.lanes.reduce((a, b) => (a.netMonthly > b.netMonthly ? a : b), result.lanes[0] || { netMonthly: 0 });

  const verdictText = result.verdict === 'clean' ? copy.verdictClean : result.verdict === 'check' ? copy.verdictCheck : copy.verdictFix;
  const verdictCls =
    result.verdict === 'clean' ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30' :
    result.verdict === 'check' ? 'bg-amber-500/15 text-amber-700 border-amber-500/30' :
    'bg-destructive/10 text-destructive border-destructive/30';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2"><Radio className="size-4" />{copy.title}</div>
          <Badge variant="outline" className={verdictCls}>{verdictText}</Badge>
        </CardTitle>
        <CardDescription>{copy.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="grid grid-cols-2 gap-3">
              <NumField id="pa-downloads" label={copy.listenersPerEpisodeLabel} value={input.downloadsPerEpisode} onChange={n => set('downloadsPerEpisode', Math.max(0, n))} min={0} />
              <NumField id="pa-eps" label={copy.episodesPerMonthLabel} value={input.episodesPerMonth} onChange={n => set('episodesPerMonth', Math.max(1, Math.min(30, n)))} min={1} max={30} />
              <NumField id="pa-hours" label={copy.productionHoursPerEpisode} value={input.productionHoursPerEpisode} onChange={n => set('productionHoursPerEpisode', Math.max(0.5, n))} min={0.5} step={0.5} suffix="hrs" />
              <NumField id="pa-rate" label={copy.patternPriceLabel} value={input.hourlyRate} onChange={n => set('hourlyRate', Math.max(1, n))} suffix="$" />
            </div>

            <div className="space-y-3">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{copy.affiliateCommissionLabel}</Label>
              <div className="space-y-2">
                {input.programs.map((p, i) => (
                  <div key={i} className="grid grid-cols-[1.5fr_1fr_1fr_auto] items-end gap-2">
                    <Input value={p.name} onChange={e => setProgram(i, { name: e.target.value })} className="text-sm" placeholder="Program Name" />
                    <NumField id={`pa-com-${i}`} label="Comm %" value={p.commission * 100} onChange={n => setProgram(i, { commission: n / 100 })} suffix="%" />
                    <NumField id={`pa-conv-${i}`} label="Conv %" value={p.conversionRate * 100} onChange={n => setProgram(i, { conversionRate: n / 100 })} suffix="%" />
                    <Button variant="ghost" size="icon" onClick={() => removeProgram(i)} className="h-9 w-9">
                      <Minus className="size-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addProgram} className="w-full gap-2">
                  <Plus className="size-4" /> Add Program
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className={`rounded-lg border p-4 ${verdictCls}`}>
              <div className="text-xs font-bold uppercase tracking-tighter mb-2">{copy.monthlyNetLabel}</div>
              <div className="text-3xl font-bold tracking-tight">{fmt$(best.netMonthly, language)}</div>
              <div className="mt-1 text-xs font-medium opacity-80">{copy.savingsNote(Math.round(best.netMonthly / 5))}</div>
            </div>

            <div className="rounded-lg border bg-accent/30 p-4 space-y-3">
              <div className="text-xs font-semibold text-muted-foreground">{copy.marketQuoteTitle}</div>
              <div className="text-xl font-semibold">{copy.marketQuoteDetails(input.downloadsPerEpisode * input.episodesPerMonth)}</div>
            </div>
          </div>
        </section>

        {result.flags.length > 0 && (
          <div className="space-y-2 border-t pt-6">
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
            <div className="text-sm font-bold">{copy.cleanSavingsNote}</div>
            <div className="text-xs leading-relaxed opacity-90">{copy.description}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
