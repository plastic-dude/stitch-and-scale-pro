import { useMemo } from 'react';
import { getLabStatCopy, type LabStatCopy } from '@/lib/lab-stat-copy';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { AlertTriangle, Users } from 'lucide-react';
import { PatternProject, ALL_SIZES } from '@/lib/grading-engine';
import { useProjectStorage, useProjectStorageState } from '@/lib/storage-lib';
import {
  analyzeTestKnit, DEFAULT_TESTKNIT, formatUsd,
  type TestKnitInputs, type TesterInput, type SizeCoverage,
} from '@/lib/testknit-desk';
import { useSettings } from '@/context/SettingsContext';
import { testknitDeskTestersEmptyState } from '@/lib/testknit-desk-copy';

function defaultStored(): TestKnitInputs {
  return {
    ...DEFAULT_TESTKNIT,
    testers: DEFAULT_TESTKNIT.testers,
  };
}

// CHK-152: pure derivation over the raw stored value — takes no handle, so
// it can never reach for a freshly-created handle inside an initializer.
function loadStored(raw: TestKnitInputs | null): TestKnitInputs {
  if (raw && Array.isArray(raw.testers)) {
    const merged = { ...defaultStored(), ...raw };
    return merged as TestKnitInputs;
  }
  return defaultStored();
}

const verdictColor = (v: string) =>
  v === 'ready' ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30' :
  v === 'blocked' ? 'bg-destructive/15 text-destructive border-destructive/30' :
  'bg-amber-500/15 text-amber-700 border-amber-500/30';

const sizeBadge = (c: SizeCoverage) =>
  c.gap ? 'bg-destructive/15 text-destructive border-destructive/40' :
  c.testers >= 2 && c.doubleTarget ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/40' :
  c.covered ? 'bg-sky-500/15 text-sky-700 border-sky-500/40' :
  'bg-muted text-muted-foreground border-border';

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

function BoolField({ id, label, value, onChange }: {
  id: string; label: string; value: boolean; onChange: (b: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
      <Label htmlFor={id} className="text-xs cursor-pointer">{label}</Label>
      <Switch id={id} checked={value} onCheckedChange={onChange} />
    </div>
  );
}

export function TestKnitDeskCard({ project }: { project: PatternProject }) {
  const { language } = useSettings();
  const ls: LabStatCopy = getLabStatCopy(language);
  // CHK-152 (QUEUE-010): old pattern — useMemo handle + `useState(() =>
  // loadStored(handle))` lazy initializer — created a fresh handle on every
  // HMR module re-run and touched it mid-transition; the crash class. Now
  // flows through the shared seam: stable handle, memoized derivation.
  const handle = useProjectStorage<TestKnitInputs>('testknit', project.id || '', []);
  const [stored, setStored] = useProjectStorageState(handle, (raw) => loadStored(raw));

  const patch = (patch: Partial<TestKnitInputs>) => setStored((s) => ({ ...s, ...patch }));

  const updateTester = (idx: number, t: Partial<TesterInput>) =>
    setStored((s) => ({
      ...s,
      testers: s.testers.map((x, i) => (i === idx ? { ...x, ...t } : x)),
    }));

  const addTester = (size: string) =>
    setStored((s) => ({
      ...s,
      testers: [
        ...s.testers,
        {
          handle: `tester-${size.toLowerCase()}-${s.testers.length + 1}`,
          size, ratePerYard: 0.18, yarnSupport: 0, extras: [], feedback: '',
          status: 'invited',
        },
      ],
    }));

  const removeTester = (idx: number) =>
    setStored((s) => ({ ...s, testers: s.testers.filter((_, i) => i !== idx) }));

  const result = useMemo(() => analyzeTestKnit(project, stored), [project, stored]);

  const errors = result.flags.filter(f => f.severity === 'error').length;
  const warnings = result.flags.filter(f => f.severity === 'warning').length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-4 w-4" /> Test Knit Desk
        </CardTitle>
        <CardDescription>
          Test knits run on a Google-sheets/Instagram patchwork — Yarnpond (2018) is the only
          dedicated coordinator and its own users report testers ghosting. This desk prices the
          call for testers against your project&apos;s graded sizes: size coverage with the
          size-inclusive double-coverage standard, the documented $0.10–$0.40/yard market band,
          unpaid-reward fairness, sample-knitter cost (finished-object surrender), and
          pre-launch audit readiness — all before you post the call.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Verdict */}
        <div className={`rounded-lg border p-4 ${verdictColor(result.verdict)}`}>
          <Badge className={`${verdictColor(result.verdict)} border uppercase`}>{result.verdict}</Badge>
          <p className="text-sm mt-2">{result.verdictReason}</p>
          <p className="text-xs mt-2 text-muted-foreground">
            {errors} error(s) · {warnings} warning(s) · {result.coverage.length} graded size(s)
          </p>
        </div>

        {/* Coverage strip */}
        <div className="space-y-2">
          <div className="font-semibold text-sm flex items-center gap-2">
            <Users className="h-4 w-4" /> Size coverage — every graded size needs a tester
          </div>
          <div className="flex flex-wrap gap-2">
            {result.coverage.map((c) => (
              <Badge key={c.size} variant="outline"
                className={`border px-3 py-1 ${sizeBadge(c)}`}>
                {c.size} ×{c.testers}
                {c.doubleTarget && ' (×2 target)'}
              </Badge>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {ALL_SIZES.filter(size =>
              !result.coverage.some(c => c.size === size)).map(size => (
              <Button key={size} variant="outline" size="sm"
                onClick={() => addTester(size)} className="h-7 text-xs">
                + tester for {size}
              </Button>
            ))}
          </div>
        </div>

        {/* Roster */}
        <div className="space-y-2">
          <div className="font-semibold text-sm">Tester roster</div>
          {stored.testers.length === 0 && (
            <p className="text-xs text-muted-foreground">
              {testknitDeskTestersEmptyState(language)}
            </p>
          )}
          <div className="space-y-2">
            {stored.testers.map((t, idx) => (
              <div key={idx} className="grid grid-cols-[80px_1fr_90px_90px_100px_60px] gap-2 items-center rounded-lg border p-2.5">
                <Badge variant="outline" className="justify-center">{t.size}</Badge>
                <div className="relative">
                  <Input value={t.handle} onChange={(e) => updateTester(idx, { handle: e.target.value })}
                    placeholder={ls.handleNamePlaceholder} className="h-8 text-xs" />
                </div>
                <div className="relative">
                  <Input type="number" min={0} step={0.01} value={t.ratePerYard}
                    onChange={(e) => updateTester(idx, { ratePerYard: Number(e.target.value) || 0 })}
                    placeholder={ls.dollarPerYdPlaceholder} className="h-8 text-xs pr-6" />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                    $/yd{t.ratePerYard === 0 ? ' (unpaid)' : ''}
                  </span>
                </div>
                <div className="relative">
                  <Input type="number" min={0} step={1} value={t.yarnSupport}
                    onChange={(e) => updateTester(idx, { yarnSupport: Number(e.target.value) || 0 })}
                    placeholder={ls.yarnDollarPlaceholder} className="h-8 text-xs" />
                </div>
                <select value={t.status}
                  onChange={(e) => updateTester(idx, { status: e.target.value as TesterInput['status'] })}
                  className="h-8 rounded-md border text-xs px-2 bg-background">
                  <option value="invited">invited</option>
                  <option value="active">active</option>
                  <option value="done">done</option>
                  <option value="ghosted">ghosted</option>
                </select>
                <Button variant="ghost" size="icon"
                  onClick={() => removeTester(idx)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                  ×
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Paid-rate band + economics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <NumField id="tk-samplerate" label={ls.sampleKnitterRate} value={stored.ratePerYard}
            min={0} max={1} step={0.01} onChange={(n) => patch({ ratePerYard: Math.min(1, n) })} suffix="$/yd" />
          <NumField id="tk-deadline" label={ls.deadline} value={stored.deadlineDays}
            min={1} max={90} onChange={(n) => patch({ deadlineDays: Math.min(90, Math.max(1, n)) })} suffix="days" />
          <NumField id="tk-feedback" label={ls.feedbackDue} value={stored.feedbackDays}
            min={1} max={30} onChange={(n) => patch({ feedbackDays: Math.min(30, Math.max(1, n)) })} suffix="days" />
          <NumField id="tk-sampleknitters" label={ls.paidSampleKnitters} value={stored.sampleKnitters}
            min={0} max={20} onChange={(n) => patch({ sampleKnitters: Math.min(20, n) })} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <BoolField id="tk-free" label={ls.freeFinalPattern} value={stored.freeFinalPattern}
            onChange={(b) => patch({ freeFinalPattern: b })} />
          <BoolField id="tk-social" label={ls.socialFeature} value={stored.socialFeature}
            onChange={(b) => patch({ socialFeature: b })} />
          <BoolField id="tk-early" label={ls.earlyAccess} value={stored.earlyAccess}
            onChange={(b) => patch({ earlyAccess: b })} />
          <NumField id="tk-extra" label={ls.extraPatternValue} value={stored.extraPatternValue}
            min={0} step={1} onChange={(n) => patch({ extraPatternValue: n })} suffix="$" />
          <NumField id="tk-yarnsupp" label={ls.yarnSupportUnpaid} value={stored.yarnSupportPerTester}
            min={0} step={1} onChange={(n) => patch({ yarnSupportPerTester: n })} suffix="$" />
        </div>
        <p className="text-xs text-muted-foreground">
          Benchmarks baked in (research session 43): the paid band is $0.10–$0.40/yard with a
          $0.18 fair floor (r/craftsnark, r/AdvancedKnitting); sweater tests typically run 3–4 weeks;
          a typical test budget is $75–250 plus a free final pattern (the documented minimum reward);
          sample knitters surrender the finished object; Yarnpond&apos;s documented failure mode is
          testers ghosting on underpaid or overpromised calls.
        </p>

        {/* KPI tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="text-xs text-muted-foreground">Total cash out</div>
            <div className={`text-2xl font-bold ${result.cashTotal > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
              {formatUsd(result.cashTotal)}
            </div>
            <div className="text-xs text-muted-foreground">
              paid {formatUsd(result.paidTotal)} + yarn support {formatUsd(result.yarnSupportTotal)}
            </div>
          </div>
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="text-xs text-muted-foreground">Non-cash reward pool</div>
            <div className="text-2xl font-bold text-emerald-600">{formatUsd(result.rewardValue)}</div>
            <div className="text-xs text-muted-foreground">
              ≈ {formatUsd(result.rewardPerUnpaidTester)} per unpaid tester
            </div>
          </div>
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="text-xs text-muted-foreground">Sample-knitter estimate</div>
            <div className="text-2xl font-bold">{formatUsd(result.samplePay.sampleKnitterPay)}</div>
            <div className="text-xs text-muted-foreground">
              {Math.round(result.samplePay.yards)} yds · typical {formatUsd(result.samplePay.typicalLow)}–{formatUsd(result.samplePay.typicalHigh)}
            </div>
          </div>
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="text-xs text-muted-foreground">Deadline / gaps</div>
            <div className="text-2xl font-bold">{stored.deadlineDays} days</div>
            <div className="text-xs text-muted-foreground">
              {result.uncoveredSizes.length > 0
                ? `${result.uncoveredSizes.length} size(s) uncovered`
                : 'all sizes covered'}
            </div>
          </div>
        </div>

        {/* Flags */}
        {result.flags.length > 0 && (
          <div className="space-y-2">
            <div className="font-semibold text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" /> Desk flags — R-01 to R-06
            </div>
            {result.flags.map((f, i) => (
              <div key={i} className={`rounded-lg border p-3 text-sm ${
                f.severity === 'error' ? 'border-destructive/30 bg-destructive/5' :
                f.severity === 'warning' ? 'border-amber-500/30 bg-amber-500/5' :
                'border-border bg-muted/30'}`}>
                <div className="font-medium">{f.code} <span className="text-xs text-muted-foreground">({f.severity})</span></div>
                <div className="text-muted-foreground text-xs mt-1">{f.message}</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
