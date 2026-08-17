import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, CalendarClock } from 'lucide-react';
import { PatternProject } from '@/lib/grading-engine';
import { projectStorage } from '@/lib/storage-lib';
import { useSettings } from '@/context/SettingsContext';
import { KAL_PLANNER_COPY } from '@/lib/kal-planner-copy';
import { analyzeKal, DEFAULT_KAL, KAL_FORMAT_LABELS, type KalFormat, type KalInput } from '@/lib/kal-planner';

function defaultStored(): KalInput {
  return { ...DEFAULT_KAL };
}

function loadStored(handle: ReturnType<typeof projectStorage<KalInput>>): KalInput {
  const parsed = handle.read();
  if (parsed) {
    const merged = { ...defaultStored(), ...parsed };
    merged.format = ['launch', 'mystery', 'guild', 'seasonal'].includes(merged.format) ? merged.format : 'launch';
    return merged as KalInput;
  }
  return defaultStored();
}

const fmt$ = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

const verdictColor = (v: string) =>
  v === 'go' ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30' :
  v === 'skip' ? 'bg-destructive/15 text-destructive border-destructive/30' :
  'bg-amber-500/15 text-amber-700 border-amber-500/30';

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

export function KalPlannerCard({ project }: { project: PatternProject }) {
  const { language } = useSettings();
  const copy = KAL_PLANNER_COPY[language];
  const handle = useMemo(
    () => projectStorage<KalInput>('kalplanner', project.id || '', []),
    [project.id],
  );
  const [stored, setStored] = useState<KalInput>(() => loadStored(handle));

  useEffect(() => {
    handle.write(stored);
  }, [stored, handle]);

  const patch = (patch: Partial<KalInput>) => setStored((s) => ({ ...s, ...patch }));

  const result = useMemo(() => analyzeKal(stored), [stored]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2 text-lg">
          <CalendarClock className="h-4 w-4 shrink-0" /> {copy.title}
        </CardTitle>
        <CardDescription>
          {copy.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Format + prices */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="kal-format" className="text-xs">{copy.format}</Label>
            <Select value={stored.format}
              onValueChange={(v) => patch({ format: v as KalFormat })}>
              <SelectTrigger id="kal-format"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(KAL_FORMAT_LABELS) as KalFormat[]).map((f) => (
                  <SelectItem key={f} value={f}>{KAL_FORMAT_LABELS[f]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <NumField id="kal-price" label={copy.price} value={stored.patternPrice}
            min={0} step={0.5} onChange={(n) => patch({ patternPrice: n })} suffix="$" />
        </div>

        {/* Sales & duration */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <NumField id="kal-base" label={copy.baseSales} value={stored.baseWeeklySales}
            min={0} step={0.5} onChange={(n) => patch({ baseWeeklySales: n })} suffix="wk" />
          <NumField id="kal-duration" label={copy.duration} value={stored.durationWeeks}
            min={1} max={12} onChange={(n) => patch({ durationWeeks: Math.min(12, Math.max(1, n)) })} suffix="wks" />
          <NumField id="kal-lift" label={copy.lift} value={stored.launchLiftFactor}
            min={1} max={10} step={0.1} onChange={(n) => patch({ launchLiftFactor: Math.min(10, Math.max(1, n)) })} suffix="×" />
          <NumField id="kal-afterglow" label={copy.afterglow} value={stored.afterglowFactor}
            min={1} max={2} step={0.05} onChange={(n) => patch({ afterglowFactor: Math.min(2, Math.max(1, n)) })} suffix="×" />
        </div>

        {/* Prizes & costs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <NumField id="kal-prizes" label={copy.prizes} value={stored.prizeCount}
            min={0} max={50} onChange={(n) => patch({ prizeCount: Math.min(50, n) })} />
          <NumField id="kal-prize-value" label={copy.prizeValue} value={stored.prizeValue}
            min={0} step={5} onChange={(n) => patch({ prizeValue: n })} suffix="$" />
          <NumField id="kal-sponsor" label={copy.sponsor} value={stored.yarnSponsorValue}
            onChange={(n) => patch({ yarnSponsorValue: n })} suffix="$" />
          <NumField id="kal-sample" label={copy.sample} value={stored.sampleCost}
            min={0} step={5} onChange={(n) => patch({ sampleCost: n })} suffix="$" />
        </div>

        {/* Hours & guild fees */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <NumField id="kal-hours" label={copy.hours} value={stored.totalHours}
            min={0} onChange={(n) => patch({ totalHours: n })} suffix="hrs" />
          <NumField id="kal-hourly" label={copy.hourly} value={stored.hourlyCost}
            min={0} step={1} onChange={(n) => patch({ hourlyCost: n })} suffix="$/hr" />
          <NumField id="kal-fee" label={copy.sessionFee}
            value={stored.sessionFeeIncome ?? 0} onChange={(n) => patch({ sessionFeeIncome: n })} suffix="$" />
          <NumField id="kal-sessions" label={copy.sessions}
            value={stored.sessionCount ?? 0} onChange={(n) => patch({ sessionCount: n })} />
        </div>
        {stored.format === 'mystery' && (
          <NumField id="kal-clue-hours" label={copy.clueHours}
            value={stored.mysteryHoursPerClue ?? 4} min={1} max={12}
            onChange={(n) => patch({ mysteryHoursPerClue: Math.min(12, Math.max(1, n)) })} suffix="hrs" />
        )}
        <p className="text-xs text-muted-foreground">
          Benchmarks baked in: Ravelry&apos;s best-ever January averaged $203/designer across the whole site;
          a sweater pattern costs ~55 hours and ~$155 to produce; typical KAL prizes are $10–50 gift cards
          (sponsor donors like Malabrigo/Hobbii are common); mystery KALs run 4 weekly clues; a well-run
          launch KAL roughly 2–4×s the base weekly rate inside its window, decaying back to baseline, with an
          ~8-week afterglow tail.
        </p>

        {/* Verdict */}
        <div className={`rounded-lg border p-4 ${verdictColor(result.verdict)}`}>
          <Badge className={`${verdictColor(result.verdict)} border uppercase`}>{result.verdict}</Badge>
          <p className="text-sm mt-2">{result.verdictReason}</p>
          <p className="text-sm mt-2 text-muted-foreground">{result.suggestion}</p>
        </div>

        {/* P&L tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="text-xs text-muted-foreground">{copy.netPnl}</div>
            <div className={`text-2xl font-bold ${result.net >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
              {fmt$(result.net)}
            </div>
          </div>
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="text-xs text-muted-foreground">{copy.launchSales}</div>
            <div className="text-2xl font-bold">{result.launchWindowSales}</div>
            <div className="text-xs text-muted-foreground">{fmt$(result.launchWindowRevenue)}</div>
          </div>
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="text-xs text-muted-foreground">{copy.afterglowSales}</div>
            <div className="text-2xl font-bold">{result.afterglowSales}</div>
            <div className="text-xs text-muted-foreground">{fmt$(result.afterglowRevenue)}</div>
          </div>
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="text-xs text-muted-foreground">{copy.prizeSpend}</div>
            <div className={`text-2xl font-bold ${result.totalPrizeSpend > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
              {fmt$(result.totalPrizeSpend)}
            </div>
            <div className="text-xs text-muted-foreground">
              {Number.isFinite(result.prizeRecoveryCopies)
                ? `${copy.recovers} ${result.prizeRecoveryCopies} copies / ${result.prizeRecoveryWeeks} wks`
                : copy.never}
            </div>
          </div>
        </div>

        {/* Mystery clue timeline */}
        {result.clueTimeline && (
          <div className="space-y-2">
            <div className="font-semibold text-sm flex flex-wrap items-center gap-2">
              <CalendarClock className="h-4 w-4 shrink-0" /> {copy.clueCalendar}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {result.clueTimeline.map((c) => (
                <div key={c.clueNumber} className="rounded-lg border bg-muted/30 p-3">
                  <div className="text-xs font-semibold">{copy.clue} {c.clueNumber} — {copy.week} {c.week}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {copy.drafting} {c.draftingHours}h · {copy.techEdit} {c.techEditHours}h
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {copy.reveal}
            </p>
          </div>
        )}

        {/* Red flags */}
        {result.redFlags.length > 0 && (
          <div className="space-y-2">
            <div className="font-semibold text-sm flex flex-wrap items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" /> {copy.redFlags}
            </div>
            {result.redFlags.map((f) => (
              <div key={f.id} className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm">
                <div className="font-medium">{f.label} <span className="text-xs text-muted-foreground">({f.id})</span></div>
                <div className="text-muted-foreground text-xs mt-1">{f.detail}</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
