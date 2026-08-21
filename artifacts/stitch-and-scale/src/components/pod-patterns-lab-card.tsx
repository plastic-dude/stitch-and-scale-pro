import { useMemo, useState, useEffect } from 'react';
import { useSettings } from '@/context/SettingsContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, BookOpen, Layers, Lightbulb } from 'lucide-react';
import { PatternProject } from '@/lib/grading-engine';
import { POD_PATTERNS_COPY } from '@/lib/pod-patterns-copy';
import { projectStorage } from '@/lib/storage-lib';
import {
  analyzePODPatterns,
  DEFAULT_POD_PATTERNS,
  fmt$,
  type PodPatternsInput,
} from '@/lib/pod-patterns-lab';

const STORAGE_KEY = 'stitch-and-scale-pod-v1';

type StoredState = PodPatternsInput & { ts?: number };

function defaultStored(): StoredState {
  return { ...DEFAULT_POD_PATTERNS };
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

export function PodPatternsLabCard({ project }: { project: PatternProject }) {
  const handle = useMemo(() => projectStorage<StoredState>('pod-patterns', project.id, [STORAGE_KEY]), [project.id]);
  const [input, setInput] = useState<PodPatternsInput>(() => loadStored(handle));
  const { language } = useSettings();
  const copy = POD_PATTERNS_COPY[language];

  useEffect(() => {
    setInput(loadStored(handle));
  }, [handle]);

  const persist = (next: PodPatternsInput) => {
    setInput(next);
    handle.write({ ...next, ts: Date.now() });
  };

  const result = useMemo(() => analyzePODPatterns(input, { language }), [input, language]);
  const set = <K extends keyof PodPatternsInput>(k: K, v: PodPatternsInput[K]) => persist({ ...input, [k]: v });

  const verdictText = result.verdict === 'clean' ? copy.verdictClean : result.verdict === 'check' ? copy.verdictCheck : copy.verdictFix;
  const verdictCls =
    result.verdict === 'clean' ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30' :
    result.verdict === 'check' ? 'bg-amber-500/15 text-amber-700 border-amber-500/30' :
    'bg-destructive/10 text-destructive border-destructive/30';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2"><BookOpen className="size-4" />{copy.title}</div>
          <Badge variant="outline" className={verdictCls}>{verdictText}</Badge>
        </CardTitle>
        <CardDescription>{copy.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="pod-name" className="text-xs">{copy.patternNameLabel}</Label>
                <Input id="pod-name" value={input.title} onChange={e => set('title', e.target.value)} className="text-sm" />
              </div>
              <NumField id="pod-price" label={copy.basePriceLabel} value={input.listPrice} onChange={n => set('listPrice', n)} suffix="$" />
              <NumField id="pod-sales" label={copy.monthlySalesLabel} value={input.expectedUnitsPerMonth} onChange={n => set('expectedUnitsPerMonth', n)} />
              <NumField id="pod-base" label={copy.podPlatformFeeLabel} value={10.00} onChange={() => {}} suffix="$" />
            </div>
          </div>

          <div className="space-y-4">
            <div className={`rounded-lg border p-4 ${verdictCls}`}>
              <div className="text-xs font-bold uppercase tracking-tighter mb-2">{copy.monthlyNetLabel}</div>
              <div className="text-3xl font-bold tracking-tight">{fmt$(result.monthlyNet, language)}</div>
              <div className="mt-1 text-xs font-medium opacity-80">{copy.savingsNote(result.marginPerUnit)}</div>
            </div>

            <div className="rounded-lg border bg-accent/30 p-4 space-y-3">
              <div className="text-xs font-semibold text-muted-foreground">{copy.marketQuoteTitle}</div>
              <div className="text-xl font-semibold">{copy.marketQuoteDetails(input.expectedUnitsPerMonth)}</div>
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
