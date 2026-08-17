import { useMemo, useState } from "react";
import { AlertTriangle, BadgeCheck, BadgeX, HelpCircle, Info, Lightbulb, RefreshCw } from "lucide-react";
import {
  analyzeGiftCard,
  DEFAULT_GIFTCARD,
  fmt$,
  type GiftCardInput,
  type GiftCardResult,
} from "@/lib/giftcard-lab";
import type { PatternProject } from "@/lib/grading-engine";
import { useSettings } from "@/context/SettingsContext";
import { GIFTCARD_COPY, giftCardFlagNote, giftCardFlagTitle, giftCardVerdictLabel, giftCardVerdictNote } from "@/lib/giftcard-copy";
import { projectStorage } from "@/lib/storage-lib";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

const STORAGE_KEY = "stitch-and-scale-giftcard-v1";

interface StoredState {
  input: GiftCardInput;
  ts: number;
}

function loadStored(project: PatternProject): GiftCardInput {
  try {
    const handle = projectStorage<StoredState>("giftcard", project.id, [STORAGE_KEY]);
    const stored = handle.read();
    if (stored && stored.input) {
      const n = (v: unknown) => (typeof v === "number" && isFinite(v) ? v : undefined);
      return {
        ...DEFAULT_GIFTCARD,
        ...stored.input,
        cardSalesPerMonth: n(stored.input.cardSalesPerMonth) ?? DEFAULT_GIFTCARD.cardSalesPerMonth,
        refundCreditPerMonth: n(stored.input.refundCreditPerMonth) ?? DEFAULT_GIFTCARD.refundCreditPerMonth,
        redemptionRate: n(stored.input.redemptionRate) ?? DEFAULT_GIFTCARD.redemptionRate,
        spendUpliftPct: n(stored.input.spendUpliftPct) ?? DEFAULT_GIFTCARD.spendUpliftPct,
        redemptionLagMonths: n(stored.input.redemptionLagMonths) ?? DEFAULT_GIFTCARD.redemptionLagMonths,
        dormancyMonths: n(stored.input.dormancyMonths) ?? DEFAULT_GIFTCARD.dormancyMonths,
        escheatTakePct: n(stored.input.escheatTakePct) ?? DEFAULT_GIFTCARD.escheatTakePct,
        cashBackThreshold: n(stored.input.cashBackThreshold) ?? DEFAULT_GIFTCARD.cashBackThreshold,
        processingPct: n(stored.input.processingPct) ?? DEFAULT_GIFTCARD.processingPct,
        redeemedCostPct: n(stored.input.redeemedCostPct) ?? DEFAULT_GIFTCARD.redeemedCostPct,
        breakageAssumption: n(stored.input.breakageAssumption) ?? DEFAULT_GIFTCARD.breakageAssumption,
        adminHoursPerMonth: n(stored.input.adminHoursPerMonth) ?? DEFAULT_GIFTCARD.adminHoursPerMonth,
        hourlyRate: n(stored.input.hourlyRate) ?? DEFAULT_GIFTCARD.hourlyRate,
        horizonMonths: n(stored.input.horizonMonths) ?? DEFAULT_GIFTCARD.horizonMonths,
        feeIncomePerMonth: n(stored.input.feeIncomePerMonth) ?? DEFAULT_GIFTCARD.feeIncomePerMonth,
      };
    }
  } catch {
    // fall through to defaults
  }
  return { ...DEFAULT_GIFTCARD };
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

function effectiveEscheatTake(input: GiftCardInput): number {
  // mirrors the engine's absolute-mode resolution (see issue #48):
  // full = 100%, none = 0%, the 60%-class reads the percent field
  if (input.escheatMode === "full") return 1;
  if (input.escheatMode === "none") return 0;
  return input.escheatTakePct;
}

export function GiftCardLabCard({ project }: { project: PatternProject }) {
  const { language } = useSettings();
  const copy = GIFTCARD_COPY[language];
  const [input, setInput] = useState<GiftCardInput>(() => loadStored(project));

  const result: GiftCardResult = useMemo(() => analyzeGiftCard(input), [input]);

  const persist = (next: GiftCardInput) => {
    setInput(next);
    try {
      const handle = projectStorage<StoredState>("giftcard", project.id, [STORAGE_KEY]);
      handle.write({ input: next, ts: Date.now() });
    } catch {
      // storage unavailable — UI still works in memory
    }
  };

  const set = <K extends keyof GiftCardInput>(key: K, value: GiftCardInput[K]) =>
    persist({ ...input, [key]: value });

  const escheatOptions = [
    { value: "none", label: "Exempt (merchandise-credit state)" },
    { value: "partial60", label: "60% of face value" },
    { value: "full", label: "100% of face value" },
  ];

  const verdictTone = (() => {
    switch (result.verdict) {
      case "Strong program — uplift alone justifies it":
        return "good" as const;
      case "Worth running — float + breakage beat the cost of the liability":
        return "good" as const;
      case "Treat as pure float — keep it small and simple":
        return "warn" as const;
      case "Sell small — refund-credit loop dominates":
        return "warn" as const;
      default:
        return "bad" as const;
    }
  })();

  const highFlags = result.flags.filter((f) => f.severity === "high");
  const otherFlags = result.flags.filter((f) => f.severity !== "high");

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="space-y-4 pt-5">
          <div className="flex items-start gap-2">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <p className="text-xs leading-relaxed text-muted-foreground">
              {copy.intro}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <NumField
              label={copy.cardSales}
              value={input.cardSalesPerMonth}
              step={25}
              hint="New gift cards sold — this is your float."
              prefix="$"
              onChange={(v) => set("cardSalesPerMonth", v)}
            />
            <NumField
              label={copy.refundCredit}
              value={input.refundCreditPerMonth}
              step={10}
              hint="Store credit given for returns — pure liability, no new cash."
              prefix="$"
              onChange={(v) => set("refundCreditPerMonth", v)}
            />
            <NumField
              label={copy.redemption}
              value={input.redemptionRate}
              step={0.01}
              max={1}
              hint="Share of balances that come back to the shop; industry average 80-90%."
              suffix="pct"
              onChange={(v) => set("redemptionRate", Math.min(1, v))}
            />
            <NumField
              label={copy.uplift}
              value={input.spendUpliftPct}
              step={0.01}
              max={1}
              hint="Extra spend beyond face value — measured 20-30% of basket."
              suffix="pct"
              onChange={(v) => set("spendUpliftPct", Math.min(1, v))}
            />
            <NumField
              label={copy.lag}
              value={input.redemptionLagMonths}
              step={1}
              hint="Average months between a card sale and its redemption."
              suffix="mo"
              onChange={(v) => set("redemptionLagMonths", v)}
            />
            <NumField
              label={copy.dormancy}
              value={input.dormancyMonths}
              step={1}
              hint="Months of inactivity before the balance escheats or expires — typically 3-5 years."
              suffix="mo"
              onChange={(v) => set("dormancyMonths", v)}
            />
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">{copy.escheat}</Label>
              <Select
                value={input.escheatMode}
                onValueChange={(v) =>
                  set("escheatMode", v as GiftCardInput["escheatMode"])
                }
              >
                <SelectTrigger className="h-8 bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {escheatOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] leading-tight text-muted-foreground">
                Share of unredeemed balances the state takes: {Math.round(effectiveEscheatTake(input) * 100)}%.
              </p>
            </div>
            <NumField
              label="Cash-back threshold"
              value={input.cashBackThreshold}
              step={1}
              hint="Balances under this must be paid out in cash (federal <$10; California <$15 from Apr 2026)."
              prefix="$"
              onChange={(v) => set("cashBackThreshold", v)}
            />
            <NumField
              label="Processing cost on sales"
              value={input.processingPct * 100}
              step={0.1}
              suffix="%"
              hint="Issuing-platform or payment processing fee on card sales."
              onChange={(v) => set("processingPct", v / 100)}
            />
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-3">
            <NumField
              label="Redemption cost share"
              value={input.redeemedCostPct * 100}
              step={1}
              suffix="%"
              hint="Cost of each redeemed dollar — 0% for digital-only pattern shops."
              onChange={(v) => set("redeemedCostPct", v / 100)}
            />
            <NumField
              label="Breakage assumption"
              value={input.breakageAssumption * 100}
              step={1}
              suffix="%"
              hint="Expected share of balances never redeemed; measured 10-19%."
              onChange={(v) => set("breakageAssumption", v / 100)}
            />
            <NumField
              label="Program admin hours per month"
              value={input.adminHoursPerMonth}
              step={0.5}
              hint="Codes, disputes, fraud checks."
              suffix="hr"
              onChange={(v) => set("adminHoursPerMonth", v)}
            />
            <NumField
              label="Your hourly rate"
              value={input.hourlyRate}
              step={5}
              prefix="$"
              onChange={(v) => set("hourlyRate", v)}
            />
            <NumField
              label="Fees income per month (if allowed)"
              value={input.feeIncomePerMonth}
              step={5}
              prefix="$"
              hint="Only legal where expiry/dormancy fees are permitted."
              onChange={(v) => set("feeIncomePerMonth", v)}
            />
            <NumField
              label="View horizon"
              value={input.horizonMonths}
              step={1}
              suffix="mo"
              hint="Months of the program plan being priced."
              onChange={(v) => set("horizonMonths", v)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <label className="flex items-center gap-2 text-xs">
              <Switch
                checked={input.expiryAndFeesAllowed}
                onCheckedChange={(v) => set("expiryAndFeesAllowed", v)}
              />
              Expiry dates & dormancy fees legal in your state
            </label>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs"
              onClick={() => persist({ ...DEFAULT_GIFTCARD })}
            >
              <RefreshCw className="h-3 w-3" /> {copy.reset}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatBox label={copy.cash} value={fmt$(result.totalCashIn)} hint="Card sales minus processing" />
        <StatBox
          label={copy.redemptions}
          value={fmt$(result.expectedRedemptions)}
          hint={`Uplift value ${fmt$(result.upliftValue)}`}
        />
        <StatBox
          label={copy.breakage}
          value={fmt$(result.keptBreakage)}
          tone={result.escheatSurrender > 0 ? "warn" : "good"}
          hint={`Escheat surrender ${fmt$(result.escheatSurrender)}`}
        />
        <StatBox
          label={copy.liability}
          value={fmt$(result.endingLiability)}
          tone={result.endingLiability > input.cardSalesPerMonth * 4 ? "bad" : "warn"}
          hint={`Peak ${fmt$(result.peakLiability)}`}
        />
        <StatBox
          label={copy.profit}
          value={fmt$(result.netProgramProfit)}
          tone={result.netProgramProfit >= 0 ? "good" : "bad"}
          hint={`Margin ${result.effectiveMarginPct.toFixed(1)}% of face value`}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatBox
          label="Refund-credit liability"
          value={fmt$(result.refundCreditLiability)}
          tone={result.refundCreditLiability > 0 ? "warn" : "good"}
          hint="Pure liability — no cash ever arrives for this"
        />
        <StatBox
          label="Cash-back payouts owed"
          value={fmt$(result.cashBackPayouts)}
          tone={result.cashBackPayouts > 0 ? "warn" : "good"}
          hint="Small-balance legal cash redemptions"
        />
        <StatBox
          label="Stabilization"
          value={`${result.stabilizationMonths} mo`}
          hint="Until new cash-in ≈ monthly redemptions"
        />
      </div>

      <Card>
        <CardContent className="pt-5">
          <div className="mb-3 flex items-center gap-2">
            <h3 className="text-sm font-semibold">{copy.flags} ({result.flags.length})</h3>
            {highFlags.length > 0 && (
              <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive">
                {highFlags.length} high
              </span>
            )}
          </div>
          {result.flags.length === 0 ? (
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <BadgeCheck className="h-4 w-4 text-emerald-500" /> {copy.noFlags}
            </p>
          ) : (
            <div className="space-y-2">
              {result.flags.map((f) => (
                <div
                  key={f.code}
                  className="flex items-start gap-2 rounded-md border bg-muted/40 p-2.5"
                >
                  {f.severity === "high" ? (
                    <BadgeX className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
                  ) : f.severity === "mid" ? (
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                  ) : (
                    <HelpCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  )}
                  <p className="text-xs leading-relaxed">
                    <span className="font-semibold">{f.code} — {giftCardFlagTitle(language, f.code, f.title)}.</span>{" "}
                    {giftCardFlagNote(language, f.code, {
                      refunds: fmt$(input.refundCreditPerMonth),
                      sales: fmt$(input.cardSalesPerMonth),
                      refundSharePct: String(Math.round((input.refundCreditPerMonth / Math.max(input.cardSalesPerMonth, 1)) * 100)),
                      escheatPct: String(Math.round(input.escheatTakePct * 100)),
                      dormancyYears: String(Math.round(input.dormancyMonths / 12)),
                      cashBackThreshold: fmt$(input.cashBackThreshold),
                      netProfit: fmt$(result.netProgramProfit),
                      horizonMonths: String(input.horizonMonths),
                      redemptionPct: String(Math.round(input.redemptionRate * 100)),
                      redeemedCostPct: String(Math.round(input.redeemedCostPct * 100)),
                      peakLiability: fmt$(result.peakLiability),
                      monthlySales: String(Math.round(result.peakLiability / Math.max(input.cardSalesPerMonth, 1))),
                      breakagePct: String(Math.round(input.breakageAssumption * 100)),
                      totalEscheat: fmt$(result.escheatSurrender),
                    }, f.note)}
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
            <h3 className="text-sm font-semibold">{copy.verdict}</h3>
          </div>
          <p className={`text-sm font-medium ${verdictTone === "good" ? "text-emerald-700 dark:text-emerald-400" : verdictTone === "warn" ? "text-amber-700 dark:text-amber-400" : "text-destructive"}`}>
            {giftCardVerdictLabel(language, result.verdict)}
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
            {giftCardVerdictNote(language, result.verdict, {
              refunds: fmt$(input.refundCreditPerMonth),
              sales: fmt$(input.cardSalesPerMonth),
              netProfit: fmt$(result.netProgramProfit),
              horizonMonths: String(input.horizonMonths),
              upliftValue: fmt$(result.upliftValue),
              hasRefundCredit: input.refundCreditPerMonth > 0,
            }, result.verdictNote)}
          </p>
          <Separator className="my-3" />
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Checklist the books don't print: codes longer than 12 characters, no gift-card refunds paid out as
            cash (that's how the refund-to-cash loop happens), keep small balances visible in reporting so
            cash-back liability doesn't surprise you, and confirm your state's merchandise-credit exemption
            before counting breakage as profit — H&M paid New York $36M for holding onto unused card funds it
            thought were breakage.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
