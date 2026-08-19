import { useMemo, useState, useEffect } from 'react';
import { projectStorage, type ProjectStorageHandle } from '@/lib/storage-lib';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useSettings } from '@/context/SettingsContext';
import { getToastCopy } from '@/lib/toast-copy';
import { GraduationCap, ClipboardCopy, AlertTriangle, Scale, BarChart3 } from 'lucide-react';
import { PatternProject } from '@/lib/grading-engine';
import {
  analyzeTeachingOffer,
  analyzeHostedOffer,
  buildPricingLadder,
  DEFAULT_TEACH,
  TEACH_FORMAT_LABELS,
  type TeachFormat,
  type TeachInput,
  analyzePlatformModels,
} from '@/lib/teach-economics';

const STORAGE_KEY = 'stitch-and-scale-teach-v1';

interface StoredTeach {
  input: TeachInput;
}

function defaultStored(): StoredTeach {
  return { input: { ...DEFAULT_TEACH } };
}

function loadStored(handle: ProjectStorageHandle<StoredTeach>): StoredTeach {
  try {
    const raw = handle.read();
    if (raw) {
      const parsed = raw as StoredTeach;
      if (parsed && parsed.input && typeof parsed.input.ticketPrice === 'number') {
        return {
          ...defaultStored(),
          ...parsed,
          input: { ...defaultStored().input, ...parsed.input },
        };
      }
    }
  } catch {
    /* storage unreadable — start fresh */
  }
  return defaultStored();
}

const fmt$ = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

const verdictColor = (v: string) =>
  v === 'launch' ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30' :
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

const HOST_FORMATS: TeachFormat[] = ['guildFlatFee', 'lysClass'];

export function TeachEconomicsCard({ project: _project }: { project: PatternProject }) {
  // issue #4 project seam: one scoped store per project; the legacy flat key 'stitch-and-scale-teach-v1' is folded in on first read, then removed.
  const handle = useMemo(() => projectStorage<StoredTeach>('teach', _project.id, ['stitch-and-scale-teach-v1']), [_project.id]);

  const { toast } = useToast();
  const { language } = useSettings();
  const tc = getToastCopy(language);

  const [stored, setStored] = useState<StoredTeach>(() => loadStored(handle));
  const [hostedMode, setHostedMode] = useState(false);
  const [gradStudents, setGradStudents] = useState(10);

  useEffect(() => {
    handle.write(stored);
  }, [stored]);

  const patchInput = (patch: Partial<TeachInput>) =>
    setStored((s) => ({ input: { ...s.input, ...patch } }));

  const result = useMemo(() => analyzeTeachingOffer(stored.input), [stored.input]);
  const hosted = useMemo(() => analyzeHostedOffer({
    model: hostedMode ? 'perStudent' : 'flatFee',
    flatFee: stored.input.ticketPrice,
    perStudentPrice: stored.input.ticketPrice,
    students: hostedMode ? gradStudents : undefined,
    hoursPerSession: stored.input.hostedHoursPerSession ?? 4,
    sessions: Math.max(1, Math.round(stored.input.hostedSessions ?? 1)),
    hourlyRate: stored.input.hourlyRate,
    patternHourlyRate: stored.input.patternHourlyRate,
    outOfPocket: stored.input.materialCost,
  }), [hostedMode, stored.input.ticketPrice, stored.input.hourlyRate,
    stored.input.patternHourlyRate, stored.input.materialCost, gradStudents,
    stored.input.hostedHoursPerSession, stored.input.hostedSessions]);

  const ladder = useMemo(() => buildPricingLadder(stored.input.ticketPrice), [stored.input.ticketPrice]);

  // CHK-049: platform-compare inputs — five teaching-income models normalized to $/teacher-hour.
  const [pcBuyers, setPcBuyers] = useState(200);
  const [pcPlatformCost, setPcPlatformCost] = useState(468);
  const [pcSeatsPerSlot, setPcSeatsPerSlot] = useState(10);
  // Issue #39: defaults pinned to the documented ~$200/mo market average (30% of a
  // conservative $8M membership-revenue pool × 0.00013 minutes share ≈ $260/mo),
  // so the minutes-royalty row never wins at 37.5× the average out of the box.
  const [pcPoolRevenue, setPcPoolRevenue] = useState(8_000_000);
  const [pcMinutesShare, setPcMinutesShare] = useState(0.00013);
  const [pcRoyaltyMonths, setPcRoyaltyMonths] = useState(12);
  const [pcPlatformShare, setPcPlatformShare] = useState(0.15);
  // Issue #26: the headline must state the same hours the ≈$/hr rate divides by.
  const hostedTotalHours = Math.max(1, Math.round(stored.input.hostedHoursPerSession ?? 4)) *
    Math.max(1, Math.round(stored.input.hostedSessions ?? 1));

  const platformCompare = useMemo(() => analyzePlatformModels({
    listPrice: stored.input.ticketPrice,
    buyers: pcBuyers,
    productionHours: stored.input.prepHours,
    platformCost: pcPlatformCost,
    seatsPerSlot: pcSeatsPerSlot,
    poolRevenue: pcPoolRevenue,
    minutesShare: pcMinutesShare,
    royaltyMonths: pcRoyaltyMonths,
    platformShare: pcPlatformShare,
    deliveryHours: stored.input.format === 'guildFlatFee' || stored.input.format === 'lysClass' ? hostedTotalHours : 0,
    outOfPocket: stored.input.materialCost,
    patternHourlyRate: stored.input.patternHourlyRate,
  }), [stored.input.ticketPrice, stored.input.prepHours, stored.input.format,
    stored.input.materialCost, stored.input.patternHourlyRate, hostedTotalHours,
    pcBuyers, pcPlatformCost, pcSeatsPerSlot, pcPoolRevenue, pcMinutesShare,
    pcRoyaltyMonths, pcPlatformShare]);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: tc.courseCopied, description: tc.courseCopiedPaste });
    } catch {
      toast({ title: tc.copyFailed, description: tc.copyFailedDescription });
    }
  };

  const isCourse = !['guildFlatFee', 'lysClass'].includes(stored.input.format);
  const showHostedPanel = ['guildFlatFee', 'lysClass'].includes(stored.input.format);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <GraduationCap className="h-4 w-4" /> Teach It — Teaching Economics
        </CardTitle>
        <CardDescription>
          Pattern sales alone rarely sustain a designer — teaching is how most grow. This decides, for
          this pattern or collection, whether to teach it (course, cohort, Zoom series, guild flat-fee
          day, or LYS class) — and prices the offer with engineering, not gut: break-even seats against
          the ~8-student rule of thumb, production payback against your own pattern hourly rate, and
          the tier ladder the market actually pays ($500–600 flagship, $75–150/day workshops).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Format & ticket */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="teach-format" className="text-xs">Offer format</Label>
              <Select value={stored.input.format}
                onValueChange={(v) => patchInput({ format: v as TeachFormat })}>
                <SelectTrigger id="teach-format"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(TEACH_FORMAT_LABELS) as TeachFormat[]).map((f) => (
                    <SelectItem key={f} value={f}>{TEACH_FORMAT_LABELS[f]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <NumField id="teach-ticket" label={isCourse ? 'Standard price (whole offer)' : 'Price per session'}
              value={stored.input.ticketPrice} min={0} step={5}
              onChange={(n) => patchInput({ ticketPrice: n })} suffix="$" />
            <NumField id="teach-hours" label="Production hours (total)" value={stored.input.prepHours}
              min={0} step={2} onChange={(n) => patchInput({ prepHours: n })} suffix="h" />
            <NumField id="teach-list" label="Email list size" value={stored.input.emailListSize}
              min={0} onChange={(n) => patchInput({ emailListSize: n })} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <NumField id="teach-rate" label="Your hourly rate" value={stored.input.hourlyRate}
              min={0} step={5} onChange={(n) => patchInput({ hourlyRate: n })} suffix="$" />
            <NumField id="teach-pattern-rate" label="Pattern hourly rate" value={stored.input.patternHourlyRate}
              min={0} step={1} onChange={(n) => patchInput({ patternHourlyRate: n })} suffix="$" />
            <NumField id="teach-platform-cost" label="Platform/tooling / month" value={stored.input.platformMonthlyCost}
              min={0} step={1} onChange={(n) => patchInput({ platformMonthlyCost: n })} suffix="$" />
            <NumField id="teach-platform-months" label="Tooling runway (months)" value={stored.input.platformMonths}
              min={0} max={36} onChange={(n) => patchInput({ platformMonths: Math.min(36, n) })} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <NumField id="teach-materials" label="Materials / travel out-of-pocket" value={stored.input.materialCost}
              min={0} step={5} onChange={(n) => patchInput({ materialCost: n })} suffix="$" />
            <NumField id="teach-hosted-hours" label="Hours per session"
              value={stored.input.hostedHoursPerSession ?? 4} min={1} max={12}
              onChange={(n) => patchInput({ hostedHoursPerSession: Math.min(12, Math.max(1, n)) })} suffix="h" />
            <NumField id="teach-hosted-sessions" label="Sessions"
              value={stored.input.hostedSessions ?? 1} min={1} max={10}
              onChange={(n) => patchInput({ hostedSessions: Math.min(10, Math.max(1, n)) })} />
            <NumField id="teach-students" label="Expected students (0 = project from list)" value={stored.input.expectedStudents}
              min={0} onChange={(n) => patchInput({ expectedStudents: n })} />
            <NumField id="teach-conversion" label="List conversion" value={stored.input.listConversion}
              min={0} max={0.1} step={0.005}
              onChange={(n) => patchInput({ listConversion: Math.min(0.1, n) })} suffix="rate" />
            <NumField id="teach-refunds" label="Refund rate" value={stored.input.refundRate}
              min={0} max={0.5} step={0.01}
              onChange={(n) => patchInput({ refundRate: Math.min(0.5, n) })} suffix="share" />
          </div>
          {isCourse && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="teach-eb-pct" className="text-xs">Early-bird discount</Label>
              <div className="flex items-center gap-2 pt-1">
                <Slider id="teach-eb-pct" min={0} max={50} step={5}
                  value={[stored.input.earlyBirdDiscount * 100]}
                  onValueChange={(v) => patchInput({ earlyBirdDiscount: v[0] / 100 })} />
                <span className="text-xs w-9 text-right">{(stored.input.earlyBirdDiscount * 100).toFixed(0)}%</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="teach-eb-share" className="text-xs">Early-bird share of buyers</Label>
              <div className="flex items-center gap-2 pt-1">
                <Slider id="teach-eb-share" min={0} max={100} step={5}
                  value={[stored.input.earlyBirdShare * 100]}
                  onValueChange={(v) => patchInput({ earlyBirdShare: v[0] / 100 })} />
                <span className="text-xs w-9 text-right">{(stored.input.earlyBirdShare * 100).toFixed(0)}%</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="teach-ins-pct" className="text-xs">Installment premium</Label>
              <div className="flex items-center gap-2 pt-1">
                <Slider id="teach-ins-pct" min={0} max={25} step={1}
                  value={[stored.input.installmentPremium * 100]}
                  onValueChange={(v) => patchInput({ installmentPremium: v[0] / 100 })} />
                <span className="text-xs w-9 text-right">{(stored.input.installmentPremium * 100).toFixed(0)}%</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="teach-ins-share" className="text-xs">Installment share of buyers</Label>
              <div className="flex items-center gap-2 pt-1">
                <Slider id="teach-ins-share" min={0} max={100} step={5}
                  value={[stored.input.installmentShare * 100]}
                  onValueChange={(v) => patchInput({ installmentShare: v[0] / 100 })} />
                <span className="text-xs w-9 text-right">{(stored.input.installmentShare * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>
          )}
          {isCourse && (
          <p className="text-xs text-muted-foreground">
            Benchmarks baked in: hosted workshops pay teachers $300–1,000/day with break-even at ~8
            students; tickets run $75–150/day in North America; self-paced flagships cluster at
            $500–600 (Pip &amp; Pin charges $548 / $99×6); enrollment from an owned list realistically
            lands at 1–3%.
          </p>
          )}
        </div>

        {/* Verdict */}
        <div className={`rounded-lg border p-4 ${verdictColor(result.verdict)}`}>
          <div className="font-semibold text-sm flex items-center gap-2">
            <Badge className={`${verdictColor(result.verdict)} border uppercase`}>{result.verdict}</Badge>
            <span className="text-xs font-normal">{result.verdictReason}</span>
          </div>
          <p className="text-sm mt-2">{result.suggestion}</p>
        </div>

        {/* Money summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="text-xs text-muted-foreground">Projected students</div>
            <div className="text-2xl font-bold">{result.students}</div>
          </div>
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="text-xs text-muted-foreground">Gross revenue</div>
            <div className="text-2xl font-bold">{fmt$(result.gross)}</div>
          </div>
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="text-xs text-muted-foreground">Net profit (after all costs)</div>
            <div className={`text-2xl font-bold ${result.profit >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
              {fmt$(result.profit)}
            </div>
          </div>
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="text-xs text-muted-foreground">Your $/hour vs patterns</div>
            <div className={`text-2xl font-bold ${result.vsPatternMultiple >= 1 ? 'text-emerald-600' : 'text-destructive'}`}>
              {result.vsPatternMultiple}× · {fmt$(result.effectiveHourlyRate)}/hr
            </div>
          </div>
        </div>

        {/* Break-even & payback */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {isCourse ? (
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="text-xs text-muted-foreground">Break-even seats</div>
            <div className="text-xl font-bold">
              {Number.isFinite(result.breakEvenStudents) ? result.breakEvenStudents : '—'}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              of ~{result.students} projected — {result.students >= result.breakEvenStudents ? 'covers costs' : 'falls short'}
            </div>
          </div>
          ) : (
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="text-xs text-muted-foreground">Day-rate economics</div>
            <div className="text-xl font-bold">{fmt$(stored.input.ticketPrice)} / day</div>
            <div className="text-xs text-muted-foreground mt-1">
              vs market floor $300–1,000/day — {stored.input.ticketPrice >= 300 ? 'within market' : stored.input.ticketPrice > 0 ? 'below market floor' : 'no fee set'}
            </div>
          </div>
          )}
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="text-xs text-muted-foreground">Payback (weeks to recover production)</div>
            <div className="text-xl font-bold">{result.paybackWeeks !== null ? `${result.paybackWeeks}` : '—'}</div>
          </div>
          {isCourse ? (
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="text-xs text-muted-foreground">Blended ticket</div>
            <div className="text-xl font-bold">{fmt$(result.tickets.blended)}</div>
            <div className="text-xs text-muted-foreground mt-1">
              standard {fmt$(result.tickets.standard)} · early {fmt$(result.tickets.earlyBird)} ·
              installment {fmt$(result.tickets.installment)}
            </div>
          </div>
          ) : (
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="text-xs text-muted-foreground">Payback of production time</div>
            <div className="text-xl font-bold">
              {stored.input.prepHours > 0 && stored.input.ticketPrice > 0
                ? `${Math.round(stored.input.ticketPrice / Math.max(1, Math.round(stored.input.prepHours)))}$ earned per production hour`
                : '—'}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Flat-fee day pays the day's work directly — no per-student ramp needed.
            </div>
          </div>
          )}
        </div>

        {/* Hosted format panel */}
        {showHostedPanel && (
          <div className="rounded-lg border p-4 space-y-3">
            <div className="font-semibold text-sm flex items-center gap-2">
              <Scale className="h-4 w-4" /> Hosted-offer quick check
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs cursor-pointer flex items-center gap-2" htmlFor="teach-hosted-mode">
                <Input id="teach-hosted-mode" type="checkbox" checked={hostedMode}
                  onChange={(e) => setHostedMode(e.target.checked)} className="w-4 h-4" />
                Price per student (grassroots) instead of flat fee
              </Label>
              {hostedMode && (
                <NumField id="teach-grad-students" label="Students" value={gradStudents}
                  min={0} max={40} onChange={(n) => setGradStudents(Math.min(40, n))} />
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              Net: <span className="font-semibold text-foreground">{fmt$(hosted.net)}</span> over{' '}
              {hostedTotalHours}h of teaching ≈ <span className="font-semibold text-foreground">{fmt$(hosted.effectiveHourlyRate)}/hr</span>
              {' '}({hosted.vsPatternMultiple}× your pattern rate).
            </div>
            <div className="text-xs text-muted-foreground">
              Flat fee {fmt$(stored.input.ticketPrice)} minus out-of-pocket {fmt$(stored.input.materialCost)} over the session hours above.
            </div>
            <div className="rounded-lg border bg-muted/30 px-4 py-2 text-sm">{hosted.advice}</div>
          </div>
        )}

        {/* Red flags */}
        {result.redFlags.length > 0 && (
          <div className="space-y-2">
            <div className="font-semibold text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" /> Red flags
            </div>
            {result.redFlags.map((f) => (
              <div key={f.id} className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm">
                <Badge variant="outline" className="mr-2 text-xs">{f.id}</Badge>
                <span className="font-medium">{f.label}</span> — {f.detail}
              </div>
            ))}
          </div>
        )}

        {/* Pricing ladder */}
        {isCourse && (
        <div className="space-y-2">
          <div className="font-semibold text-sm">Engineered price ladder for your page</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="text-xs text-muted-foreground">Anchor (shown as list price)</div>
              <div className="text-xl font-bold">{fmt$(ladder.anchor)}</div>
            </div>
            <div className="rounded-lg border bg-emerald-500/10 border-emerald-500/30 p-4">
              <div className="text-xs text-emerald-700">Standard</div>
              <div className="text-xl font-bold">{fmt$(ladder.standard)}</div>
            </div>
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="text-xs text-muted-foreground">Early bird</div>
              <div className="text-xl font-bold">{fmt$(ladder.earlyBird)}</div>
            </div>
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="text-xs text-muted-foreground">Installments (+{(stored.input.installmentPremium * 100).toFixed(0)}%)</div>
              <div className="text-xl font-bold">{fmt$(ladder.installment)}</div>
            </div>
          </div>
        </div>
        )}

        {/* CHK-049: Platform Compare — session-49 research: no platform publishes per-teacher-hour returns */}
        <div className="rounded-lg border p-4 space-y-4">
          <div className="font-semibold text-sm flex items-center gap-2">
            <BarChart3 className="h-4 w-4" /> Platform Compare — five ways to teach, one $/hour scorecard
          </div>
          <p className="text-xs text-muted-foreground">
            Every platform hides what you actually earn per hour of your own life. This normalizes the five
            income models an indie designer realistically faces to effective net $/teacher-hour — the winner
            is highlighted, and flags cite the documented market data (SOS $24/mo library, Skillshare's
            30% minutes pool averaging ~$200/mo, Udemy's share eroding to 15–20%, hosted days at $300–1,000).
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <NumField id="pc-buyers" label="Expected students / buyers" value={pcBuyers} min={0} step={10}
              onChange={setPcBuyers} />
            <NumField id="pc-tooling" label="Platform / tooling cost (lifetime)" value={pcPlatformCost} min={0} step={12}
              onChange={setPcPlatformCost} suffix="$" />
            <NumField id="pc-seats" label="Seats per class slot" value={pcSeatsPerSlot} min={1} max={60}
              onChange={(n) => setPcSeatsPerSlot(Math.min(60, Math.max(1, n)))} />
            <NumField id="pc-pool" label="Platform membership revenue / yr" value={pcPoolRevenue} min={0} step={1000000}
              onChange={setPcPoolRevenue} suffix="$" />
            <NumField id="pc-minshare" label="Your minutes share (0.00013 ≈ $260/mo at an $8M pool)" value={pcMinutesShare} min={0} max={1} step={0.0001}
              onChange={setPcMinutesShare} />
            <NumField id="pc-roys" label="Royalty runway (months)" value={pcRoyaltyMonths} min={1} max={60}
              onChange={(n) => setPcRoyaltyMonths(Math.max(1, n))} />
            <NumField id="pc-share" label="Platform share (after coupons)" value={pcPlatformShare} min={0} max={1} step={0.01}
              onChange={setPcPlatformShare} />
          </div>
          <div className={`rounded-lg border p-3 ${verdictColor(platformCompare.verdict)}`}>
            <div className="text-sm font-semibold">
              Best model: {platformCompare.rows[platformCompare.rows.length - 1].label} — {fmt$(platformCompare.winnerHourlyNet)}/hr
            </div>
            <div className="text-xs mt-1">{platformCompare.verdictReason}</div>
            {platformCompare.suggestion && <div className="text-xs mt-1 text-muted-foreground">{platformCompare.suggestion}</div>}
          </div>
          <div className="space-y-2">
            {/* ranked worst-first so the best row reads last */}
            {platformCompare.rows.map((row) => (
              <div key={row.model} className={`rounded-lg border p-3 text-xs ${row.model === platformCompare.winner ? 'border-emerald-500/50 bg-emerald-500/5' : 'bg-muted/20'}`}>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="font-semibold">{row.label}</div>
                  <div className={`font-bold ${row.hourlyNet >= stored.input.patternHourlyRate ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                    {fmt$(row.hourlyNet)}/hr
                  </div>
                </div>
                <div className="text-muted-foreground mt-1">
                  net {fmt$(row.net)} · {row.totalHours}h teacher-time · {row.vsPattern}× pattern rate
                </div>
                <div className="text-muted-foreground mt-0.5">{row.note}</div>
                {row.redFlags.map((f) => (
                  <div key={f.id} className="text-destructive mt-1">• {f.detail}</div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Pitch copy */}
        <div className="space-y-2">
          <div className="font-semibold text-sm">
            {isCourse ? 'Copy-paste tier copy for the offer page' : 'Copy-paste booking copy for the flat-fee day'}
          </div>
                    <div className="rounded-lg border bg-muted/30 p-4 text-xs whitespace-pre-line font-mono">
            {isCourse
              ? `Early-bird tier — ${fmt$(ladder.earlyBird)} (limited seats, first ${Math.max(
                  4, Math.round(result.students * 0.25))} enrollees)\nStandard — ${fmt$(ladder.standard)}\nInstallments — ${fmt$(ladder.installment)} paid over 3 months (no interest, cancels anytime)\nIncludes: the full pattern library for this collection, lifetime access, and a 30-day refund window.`
              : `One day, one fee — ${fmt$(stored.input.ticketPrice)} for the full class.\nIncludes: all techniques taught hands-on, a printed handout for every student, and a 30-day refund window.\nMaterials: bring ${stored.input.materialCost > 0 ? fmt$(stored.input.materialCost) + ' of yarn or materials' : 'your own needles and a willingness to learn'}; everything else is on the house.`}
          </div>
          <Button variant="outline" size="sm"
            onClick={() => copy(
              isCourse
                ? `Early-bird tier — ${fmt$(ladder.earlyBird)} (limited seats, first ${Math.max(
                    4, Math.round(result.students * 0.25))} enrollees)\nStandard — ${fmt$(ladder.standard)}\nInstallments — ${fmt$(ladder.installment)} paid over 3 months (no interest, cancels anytime)\n\nIncludes: the full pattern library for this collection, lifetime access, and a 30-day refund window.`
                : `One day, one fee — ${fmt$(stored.input.ticketPrice)} for the full class.\nIncludes: all techniques taught hands-on, a printed handout for every student, and a 30-day refund window.`)}>
            <ClipboardCopy className="h-3.5 w-3.5 mr-1.5" /> Copy tier copy
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
