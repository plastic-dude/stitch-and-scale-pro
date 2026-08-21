import { TESTKNIT_SLOT_COPY } from '@/lib/testknit-slot-copy';
import { getLabStatCopy, type LabStatCopy } from '@/lib/lab-stat-copy';
import { useMemo, useState } from "react";
import { useSettings } from '@/context/SettingsContext';
import { AlertTriangle, BadgeCheck, BadgeX, HelpCircle, Info, Lightbulb, RefreshCw } from "lucide-react";
import {
  analyzeTestKnit,
  DEFAULT_TESTKNIT,
  fmt$,
  type TestKnitInput,
  type TestKnitResult,
} from "@/lib/testknit-slot-lab";
import type { PatternProject } from "@/lib/grading-engine";
import { projectStorage } from "@/lib/storage-lib";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STORAGE_KEY = "stitch-and-scale-testknit-v1";

interface StoredState {
  input: TestKnitInput;
  ts: number;
}

function loadStored(project: PatternProject): TestKnitInput {
  try {
    const handle = projectStorage<StoredState>("testknit", project.id, [STORAGE_KEY]);
    const stored = handle.read();
    if (stored && stored.input) {
      const n = (v: unknown) => (typeof v === "number" && isFinite(v) ? v : undefined);
      return {
        ...DEFAULT_TESTKNIT,
        ...stored.input,
        patternYardage: n(stored.input.patternYardage) ?? DEFAULT_TESTKNIT.patternYardage,
        sizeCount: n(stored.input.sizeCount) ?? DEFAULT_TESTKNIT.sizeCount,
        slotsPerSize: n(stored.input.slotsPerSize) ?? DEFAULT_TESTKNIT.slotsPerSize,
        testWeeks: n(stored.input.testWeeks) ?? DEFAULT_TESTKNIT.testWeeks,
        paidSlotShare: n(stored.input.paidSlotShare) ?? DEFAULT_TESTKNIT.paidSlotShare,
        flatFeeUsd: n(stored.input.flatFeeUsd) ?? DEFAULT_TESTKNIT.flatFeeUsd,
        perYardRateUsd: n(stored.input.perYardRateUsd) ?? DEFAULT_TESTKNIT.perYardRateUsd,
        yarnCostPerSkein: n(stored.input.yarnCostPerSkein) ?? DEFAULT_TESTKNIT.yarnCostPerSkein,
        yardsPerSkein: n(stored.input.yardsPerSkein) ?? DEFAULT_TESTKNIT.yardsPerSkein,
        partialSupportDiscount:
          n(stored.input.partialSupportDiscount) ?? DEFAULT_TESTKNIT.partialSupportDiscount,
        ghostRate: n(stored.input.ghostRate) ?? DEFAULT_TESTKNIT.ghostRate,
        paidRetention: n(stored.input.paidRetention) ?? DEFAULT_TESTKNIT.paidRetention,
        designerMgmtHoursPerWeek:
          n(stored.input.designerMgmtHoursPerWeek) ?? DEFAULT_TESTKNIT.designerMgmtHoursPerWeek,
        designerHourlyRate: n(stored.input.designerHourlyRate) ?? DEFAULT_TESTKNIT.designerHourlyRate,
        launchRevenueBaseline: n(stored.input.launchRevenueBaseline) ?? DEFAULT_TESTKNIT.launchRevenueBaseline,
        socialProofLiftPct: n(stored.input.socialProofLiftPct) ?? DEFAULT_TESTKNIT.socialProofLiftPct,
        launchPrice: n(stored.input.launchPrice) ?? DEFAULT_TESTKNIT.launchPrice,
        platformFeePct: n(stored.input.platformFeePct) ?? DEFAULT_TESTKNIT.platformFeePct,
        techEditScore: n(stored.input.techEditScore) ?? DEFAULT_TESTKNIT.techEditScore,
        errorCatchValueUsd: n(stored.input.errorCatchValueUsd) ?? DEFAULT_TESTKNIT.errorCatchValueUsd,
        includeSampleRow:
          typeof stored.input.includeSampleRow === "boolean"
            ? stored.input.includeSampleRow
            : DEFAULT_TESTKNIT.includeSampleRow,
      };
    }
  } catch {
    // fall through to defaults
  }
  return { ...DEFAULT_TESTKNIT };
}

function NumField(props: {
  label: string;
  value: number;
  step: number;
  min?: number;
  max?: number;
  prefix?: string;
  suffix?: string;
  hint?: string;
  onChange: (v: number) => void;
}) {
  const { label, value, step, min = 0, max, prefix, suffix, hint, onChange } = props;
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      <div className="flex items-center gap-1.5">
        {prefix && <span className="text-xs text-muted-foreground">{prefix}</span>}
        <Input
          type="number"
          step={step}
          min={min}
          max={max}
          value={Math.round(value * 100) / 100}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            if (isFinite(v)) onChange(Math.round(v * 100) / 100);
          }}
          className="h-8 bg-background"
        />
        {suffix && <span className="text-xs text-muted-foreground whitespace-nowrap">{suffix}</span>}
      </div>
      {hint && <p className="text-[11px] leading-tight text-muted-foreground">{hint}</p>}
    </div>
  );
}

function StatBox(props: { label: string; value: string; tone?: "good" | "warn" | "bad"; hint?: string }) {
  const { label, value, tone = "good", hint } = props;
  const toneCls =
    tone === "good"
      ? "text-emerald-600 dark:text-emerald-400"
      : tone === "warn"
        ? "text-amber-600 dark:text-amber-400"
        : "text-destructive";
  return (
    <div className="rounded-lg border bg-card/60 p-3">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`text-lg font-semibold tabular-nums ${toneCls}`}>{value}</p>
      {hint && <p className="mt-1 text-[11px] leading-tight text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function TestKnitSlotLabCard({ project }: { project: PatternProject }) {
  const [input, setInput] = useState<TestKnitInput>(() => loadStored(project));
  const { language } = useSettings();
  const ls: LabStatCopy = getLabStatCopy(language);
  const copyText = TESTKNIT_SLOT_COPY[language];

  const result: TestKnitResult = useMemo(() => analyzeTestKnit(input), [input]);

  const persist = (next: TestKnitInput) => {
    setInput(next);
    try {
      const handle = projectStorage<StoredState>("testknit", project.id, [STORAGE_KEY]);
      handle.write({ input: next, ts: Date.now() });
    } catch {
      // storage unavailable — UI still works in memory
    }
  };

  const set = <K extends keyof TestKnitInput>(key: K, value: TestKnitInput[K]) =>
    persist({ ...input, [key]: value });

  const verdictTone = (() => {
    switch (result.verdict) {
      case "Yarn support buys the reliability your free pool loses to ghosting":
        return "good" as const;
      case "Pay flat cash for launch-critical sizes":
        return "good" as const;
      case "Hire a sample knitter — the FO photos offset the cash":
        return "good" as const;
      case "Free pool covers it — launch too small for paid slots":
        return "warn" as const;
      default:
        return "bad" as const;
    }
  })();

  const highFlags = result.flags.filter((f) => f.severity === "high");
  const otherFlags = result.flags.filter((f) => f.severity !== "high");

  const recommendedLabel =
    result.rows.find((r) => r.model === result.recommended)?.label ?? result.recommended;

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="space-y-4 pt-5">
          <div className="flex items-start gap-2">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <p className="text-xs leading-relaxed text-muted-foreground">
              Prices your test-knit program against the free pool's hidden costs. Unpaid slots look free but
              surrender slots to ghosting, ship sizes unverified, and slow the launch — Woolly Wormhead pays
              ~£35/pattern with 2 testers, sample knitting runs $0.10-0.40/yd, and yarn support (full or
              wholesale-rate) is the emerging compensation norm. This lab compares seven models on net outcome:
              cost, size coverage, error-catch value, and the launch-day social proof your tester FO photos
              and reviews actually buy.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <NumField
              label={copyText.patternYardage}
              value={input.patternYardage}
              step={50}
              hint={copyText.totalYardageAcrossOne}
              suffix="yd"
              onChange={(v) => set("patternYardage", v)}
            />
            <NumField
              label={copyText.gradedSizes}
              value={input.sizeCount}
              step={1}
              min={1}
              max={40}
              hint={copyText.sizesThisPatternShips}
              onChange={(v) => set("sizeCount", Math.round(v))}
            />
            <NumField
              label={copyText.testerSlotsPerSize}
              value={input.slotsPerSize}
              step={1}
              min={1}
              max={6}
              hint={copyText.testersRecruitedPerSize}
              onChange={(v) => set("slotsPerSize", Math.round(v))}
            />
            <NumField
              label={copyText.testDuration}
              value={input.testWeeks}
              step={1}
              min={1}
              max={52}
              hint={copyText.garmentTestsRun812}
              suffix="wk"
              onChange={(v) => set("testWeeks", Math.round(v))}
            />
            <NumField
              label={copyText.shareOfSlotsTo}
              value={input.paidSlotShare * 100}
              step={5}
              max={100}
              suffix="%"
              hint={copyText.whichShareOfThe}
              onChange={(v) => set("paidSlotShare", Math.min(1, v / 100))}
            />
            <NumField
              label={copyText.flatCashFeePer}
              value={input.flatFeeUsd}
              step={5}
              prefix="$"
              hint={copyText.paidBenchmarksCluster3570}
              onChange={(v) => set("flatFeeUsd", v)}
            />
            <NumField
              label={copyText.perYardSampleRate}
              value={input.perYardRateUsd}
              step={0.01}
              prefix="$"
              suffix="/yd"
              hint={copyText.fairSampleKnitRangeDollar0}
              onChange={(v) => set("perYardRateUsd", v)}
            />
            <NumField
              label={copyText.yarnCostPerSkein}
              value={input.yarnCostPerSkein}
              step={1}
              prefix="$"
              suffix="/skein"
              hint={copyText.retailPriceOfThe}
              onChange={(v) => set("yarnCostPerSkein", v)}
            />
            <NumField
              label={copyText.yardsPerSkein}
              value={input.yardsPerSkein}
              step={25}
              suffix="yd"
              hint={copyText.skeinSizeUsedTo}
              onChange={(v) => set("yardsPerSkein", v)}
            />
            <NumField
              label={copyText.partialSupportDiscount}
              value={input.partialSupportDiscount * 100}
              step={5}
              max={100}
              suffix="%"
              hint={copyText.wholesaleDiscountForPartial}
              onChange={(v) => set("partialSupportDiscount", Math.min(1, v / 100))}
            />
            <NumField
              label={copyText.freePoolGhostRate}
              value={input.ghostRate * 100}
              step={1}
              max={100}
              suffix="%"
              hint={copyText.shareOfUnpaidSlots}
              onChange={(v) => set("ghostRate", Math.min(1, v / 100))}
            />
            <NumField
              label={copyText.paidSlotRetention}
              value={input.paidRetention * 100}
              step={1}
              max={100}
              suffix="%"
              hint={copyText.shareOfPaidSlots}
              onChange={(v) => set("paidRetention", Math.min(1, v / 100))}
            />
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-3">
            <NumField
              label={copyText.managementHoursPerWeek}
              value={input.designerMgmtHoursPerWeek}
              step={0.5}
              suffix="hr"
              hint={copyText.checkInsFittingQA}
              onChange={(v) => set("designerMgmtHoursPerWeek", v)}
            />
            <NumField
              label={ls.yourHourlyRate}
              value={input.designerHourlyRate}
              step={5}
              prefix="$"
              hint={copyText.whatYourDesignTime}
              onChange={(v) => set("designerHourlyRate", v)}
            />
            <NumField
              label={copyText.launchRevenueBaseline}
              value={input.launchRevenueBaseline}
              step={50}
              prefix="$"
              hint={copyText.expectedLaunchPeriodPatternSales}
              onChange={(v) => set("launchRevenueBaseline", v)}
            />
            <NumField
              label={copyText.socialProofLiftFromTester}
              value={input.socialProofLiftPct}
              step={1}
              max={50}
              suffix="%"
              hint={copyText.revenueLiftTesterPhotos}
              onChange={(v) => set("socialProofLiftPct", Math.min(50, v))}
            />
            <NumField
              label={ls.patternPrice}
              value={input.launchPrice}
              step={1}
              prefix="$"
              hint={copyText.retailPricePerCopy}
              onChange={(v) => set("launchPrice", v)}
            />
            <NumField
              label={copyText.platformTake}
              value={input.platformFeePct}
              step={0.5}
              max={30}
              suffix="%"
              hint="Ravelry 5%, Etsy 6.5%, LoveCrafts 15%."
              onChange={(v) => set("platformFeePct", v)}
            />
            <NumField
              label={copyText.techEditQualityScore}
              value={input.techEditScore}
              step={5}
              min={0}
              max={100}
              suffix="/100"
              hint={copyText.fromTheTechEdit}
              onChange={(v) => set("techEditScore", Math.round(v))}
            />
            <NumField
              label={copyText.valueOfOneCaught}
              value={input.errorCatchValueUsd}
              step={10}
              prefix="$"
              hint={copyText.supportReputationCostA}
              onChange={(v) => set("errorCatchValueUsd", v)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <label className="flex items-center gap-2 text-xs">
              <Switch
                checked={input.includeSampleRow}
                onCheckedChange={(v) => set("includeSampleRow", v)}
              />
              Price a sample knitter (FO returns for launch photos)
            </label>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs"
              onClick={() => persist({ ...DEFAULT_TESTKNIT })}
            >
              <RefreshCw className="h-3 w-3" /> Reset to demo
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatBox
          label={ls.freePoolNet}
          value={fmt$(result.baseFreeRow.netOutcome)}
          hint={`${Math.round(result.baseFreeRow.churnAdjustedSlots)} slots lost to ghosting`}
        />
        <StatBox
          label={ls.bestPaidModelNet}
          value={fmt$(result.rows.reduce((a, b) => (b.netOutcome > a.netOutcome ? b : a), result.rows[0]).netOutcome)}
          hint={`Recommended: ${recommendedLabel}`}
        />
        <StatBox
          label={ls.sizeCoverageFree}
          value={`${Math.round(result.baseFreeRow.sizeCoverage * 100)}%`}
          tone={result.baseFreeRow.sizeCoverage >= 0.9 ? "good" : "warn"}
          hint={copyText.shareOfSizesWith}
        />
        <StatBox
          label={ls.errorsCaught}
          value={`${result.errorCatchValueTotal.toFixed(0)} worth`}
          hint={`${result.baseFreeRow.expectedErrorsCaught.toFixed(1)} expected error points`}
        />
        <StatBox
          label={ls.yourTimeCost}
          value={fmt$(result.designerTimeCost)}
          hint={`${result.totalDesignerTimeHours.toFixed(0)} h of management`}
        />
        <StatBox
          label={ls.paidSlots}
          value={`${result.paidSlotsCount}`}
          hint={`${result.ghostedSlots} free slots ghost at ${Math.round(input.ghostRate * 100)}%`}
        />
      </div>

      <Card>
        <CardContent className="pt-5">
          <div className="mb-3 flex items-center gap-2">
            <h3 className="text-sm font-semibold">Compensation model comparison</h3>
            <span className="text-[11px] text-muted-foreground">net outcome = proof + error value − cost</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-1.5 pr-3 font-medium">Model</th>
                  <th className="py-1.5 pr-3 font-medium">Cash</th>
                  <th className="py-1.5 pr-3 font-medium">Yarn</th>
                  <th className="py-1.5 pr-3 font-medium">Your time</th>
                  <th className="py-1.5 pr-3 font-medium">Slots lost</th>
                  <th className="py-1.5 pr-3 font-medium">Coverage</th>
                  <th className="py-1.5 pr-3 font-medium">Proof value</th>
                  <th className="py-1.5 font-medium">Net</th>
                </tr>
              </thead>
              <tbody>
                {result.rows
                  .filter((r) => r.model !== "sample" || input.includeSampleRow)
                  .map((r) => (
                    <tr key={r.model} className="border-b last:border-0">
                      <td className="py-1.5 pr-3 font-medium">
                        {r.model === result.recommended ? `${r.label} ★` : r.label}
                      </td>
                      <td className="py-1.5 pr-3 tabular-nums">{fmt$(r.cashCost)}</td>
                      <td className="py-1.5 pr-3 tabular-nums">{fmt$(r.yarnCost)}</td>
                      <td className="py-1.5 pr-3 tabular-nums">{fmt$(r.timeCost)}</td>
                      <td className="py-1.5 pr-3 tabular-nums">{Math.round(r.churnAdjustedSlots)}</td>
                      <td className="py-1.5 pr-3 tabular-nums">{Math.round(r.sizeCoverage * 100)}%</td>
                      <td className="py-1.5 pr-3 tabular-nums">{fmt$(r.socialProofValue)}</td>
                      <td
                        className={`py-1.5 tabular-nums font-semibold ${
                          r.netOutcome >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"
                        }`}
                      >
                        {fmt$(r.netOutcome)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5">
          <div className="mb-3 flex items-center gap-2">
            <h3 className="text-sm font-semibold">Watch-out flags ({result.flags.length})</h3>
            {highFlags.length > 0 && (
              <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive">
                {highFlags.length} high
              </span>
            )}
          </div>
          {result.flags.length === 0 ? (
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <BadgeCheck className="h-4 w-4 text-emerald-500" /> No flags — program structure is clean.
            </p>
          ) : (
            <div className="space-y-2">
              {[...highFlags, ...otherFlags].map((f) => (
                <div key={f.code} className="flex items-start gap-2 rounded-md border bg-muted/40 p-2.5">
                  {f.severity === "high" ? (
                    <BadgeX className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
                  ) : f.severity === "mid" ? (
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                  ) : (
                    <HelpCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  )}
                  <p className="text-xs leading-relaxed">
                    <span className="font-semibold">{f.code} — {f.title}.</span> {f.note}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card
        className={
          verdictTone === "good"
            ? "border-emerald-500/40 bg-emerald-500/5"
            : verdictTone === "warn"
              ? "border-amber-500/40 bg-amber-500/5"
              : "border-destructive/40 bg-destructive/5"
        }
      >
        <CardContent className="pt-5">
          <div className="mb-2 flex items-center gap-2">
            <Lightbulb
              className={
                verdictTone === "good"
                  ? "h-4 w-4 text-emerald-500"
                  : verdictTone === "warn"
                    ? "h-4 w-4 text-amber-500"
                    : "h-4 w-4 text-destructive"
              }
            />
            <h3 className="text-sm font-semibold">Verdict</h3>
          </div>
          <p
            className={`text-sm font-medium ${
              verdictTone === "good"
                ? "text-emerald-700 dark:text-emerald-400"
                : verdictTone === "warn"
                  ? "text-amber-700 dark:text-amber-400"
                  : "text-destructive"
            }`}
          >
            {result.verdict}
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{result.verdictNote}</p>
          <Separator className="my-3" />
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            The books don't print this: unpaid testing isn't free — ghosted slots, thin size coverage, and
            tester-side red flags (mini-deadlines, mandatory yarn purchases, fines) repel the best knitters and
            cost the launch its proof. When a test pencil-outs, put paid slots on the sizes that matter most
            (extremes first), pay sample knitters per yard with the FO returned for launch photos, and keep
            the group to 10-15 testers so the management hours stay cheap.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
