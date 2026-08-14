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
import { GraduationCap, ClipboardCopy, AlertTriangle, Scale } from 'lucide-react';
import { PatternProject } from '@/lib/grading-engine';
import {
  analyzeTeachingOffer,
  analyzeHostedOffer,
  buildPricingLadder,
  DEFAULT_TEACH,
  TEACH_FORMAT_LABELS,
  type TeachFormat,
  type TeachInput,
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
    hoursPerSession: 4,
    sessions: 1,
    hourlyRate: stored.input.hourlyRate,
    patternHourlyRate: stored.input.patternHourlyRate,
    outOfPocket: stored.input.materialCost,
  }), [hostedMode, stored.input.ticketPrice, stored.input.hourlyRate,
    stored.input.patternHourlyRate, stored.input.materialCost, gradStudents]);

  const ladder = useMemo(() => buildPricingLadder(stored.input.ticketPrice), [stored.input.ticketPrice]);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: 'Copied — paste it into your course page or pitch email.' });
    } catch {
      toast({ title: 'Copy failed — select the text manually.' });
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
            <NumField id="teach-students" label="Expected students (0 = project from list)" value={stored.input.expectedStudents}
              min={0} onChange={(n) => patchInput({ expectedStudents: n })} />
            <NumField id="teach-conversion" label="List conversion" value={stored.input.listConversion}
              min={0} max={0.1} step={0.005}
              onChange={(n) => patchInput({ listConversion: Math.min(0.1, n) })} suffix="rate" />
            <NumField id="teach-refunds" label="Refund rate" value={stored.input.refundRate}
              min={0} max={0.5} step={0.01}
              onChange={(n) => patchInput({ refundRate: Math.min(0.5, n) })} suffix="share" />
          </div>
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
          <p className="text-xs text-muted-foreground">
            Benchmarks baked in: hosted workshops pay teachers $300–1,000/day with break-even at ~8
            students; tickets run $75–150/day in North America; self-paced flagships cluster at
            $500–600 (Pip &amp; Pin charges $548 / $99×6); enrollment from an owned list realistically
            lands at 1–3%.
          </p>
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
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="text-xs text-muted-foreground">Break-even seats</div>
            <div className="text-xl font-bold">
              {Number.isFinite(result.breakEvenStudents) ? result.breakEvenStudents : '—'}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              of ~{result.students} projected — {result.students >= result.breakEvenStudents ? 'covers costs' : 'falls short'}
            </div>
          </div>
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="text-xs text-muted-foreground">Payback (weeks to recover production)</div>
            <div className="text-xl font-bold">{result.paybackWeeks !== null ? `${result.paybackWeeks}` : '—'}</div>
          </div>
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="text-xs text-muted-foreground">Blended ticket</div>
            <div className="text-xl font-bold">{fmt$(result.tickets.blended)}</div>
            <div className="text-xs text-muted-foreground mt-1">
              standard {fmt$(result.tickets.standard)} · early {fmt$(result.tickets.earlyBird)} ·
              installment {fmt$(result.tickets.installment)}
            </div>
          </div>
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
              {Math.round(stored.input.prepHours > 0 ? Math.max(1, stored.input.prepHours / 8) * 4 : 4)}h of
              teaching ≈ <span className="font-semibold text-foreground">{fmt$(hosted.effectiveHourlyRate)}/hr</span>
              {' '}({hosted.vsPatternMultiple}× your pattern rate).
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

        {/* Pitch copy */}
        <div className="space-y-2">
          <div className="font-semibold text-sm">Copy-paste tier copy for the offer page</div>
          <div className="rounded-lg border bg-muted/30 p-4 text-xs whitespace-pre-line font-mono">
            {`Early-bird tier — ${fmt$(ladder.earlyBird)} (limited seats, first ${Math.max(
              4, Math.round(result.students * 0.25))} enrollees)
Standard — ${fmt$(ladder.standard)}
Installments — ${fmt$(ladder.installment)} paid over 3 months (no interest, cancels anytime)

Includes: the full pattern library for this collection, lifetime access, and a 30-day refund window.`}
          </div>
          <Button variant="outline" size="sm"
            onClick={() => copy(
              `Early-bird tier — ${fmt$(ladder.earlyBird)} (limited seats, first ${Math.max(
                4, Math.round(result.students * 0.25))} enrollees)\nStandard — ${fmt$(ladder.standard)}\nInstallments — ${fmt$(ladder.installment)} paid over 3 months (no interest, cancels anytime)\n\nIncludes: the full pattern library for this collection, lifetime access, and a 30-day refund window.`)}>
            <ClipboardCopy className="h-3.5 w-3.5 mr-1.5" /> Copy tier copy
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
