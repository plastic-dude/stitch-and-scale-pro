import { WHOLESALE_PRICELIST_COPY } from '@/lib/wholesale-pricelist-copy';
import { getLabStatCopy, type LabStatCopy } from '@/lib/lab-stat-copy';
// CHK-078 — Wholesale Price List Lab card
// Builds and stress-tests a wholesale line sheet for an indie knitwear
// designer: pattern cards, POD books, mini zines, and accessory SKUs sold to
// LYS/boutiques. Mirrors the giftcard-lab-card structure and conventions.
import { useMemo, useState } from "react";
import { useSettings } from '@/context/SettingsContext';
import {
  AlertTriangle,
  BadgeCheck,
  BadgeX,
  HelpCircle,
  Info,
  Lightbulb,
  Minus,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import {
  analyzeWholesale,
  DEFAULT_WHOLESALE,
  type TierRow,
  type WholesaleInput,
  type WholesaleResult,
} from "@/lib/wholesale-pricelist-lab";
import type { PatternProject } from "@/lib/grading-engine";
import { projectStorage } from "@/lib/storage-lib";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

const STORAGE_KEY = "stitch-and-scale-wholesalepricelist-v1";

interface StoredState {
  input: WholesaleInput;
  ts: number;
}

function loadStored(project: PatternProject): WholesaleInput {
  try {
    const handle = projectStorage<StoredState>("wholesalepricelist", project.id, [STORAGE_KEY]);
    const stored = handle.read();
    if (stored && stored.input) {
      const n = (v: unknown) => (typeof v === "number" && isFinite(v) ? v : undefined);
      const tiers = Array.isArray(stored.input.tiers)
        ? stored.input.tiers
            .filter((t) => t && typeof t.label === "string")
            .map(
              (t) =>
                ({
                  label: t.label,
                  minOrderUsd: n(t.minOrderUsd) ?? 0,
                  discountPct: n(t.discountPct) ?? 0,
                }) satisfies TierRow,
            )
        : DEFAULT_WHOLESALE.tiers;
      return {
        ...DEFAULT_WHOLESALE,
        ...stored.input,
        retailPrice: n(stored.input.retailPrice) ?? DEFAULT_WHOLESALE.retailPrice,
        unitCost: n(stored.input.unitCost) ?? DEFAULT_WHOLESALE.unitCost,
        keystone: n(stored.input.keystone) ?? DEFAULT_WHOLESALE.keystone,
        tiers,
        avgOrderUnits: n(stored.input.avgOrderUnits) ?? DEFAULT_WHOLESALE.avgOrderUnits,
        avgOrderValue: n(stored.input.avgOrderValue) ?? DEFAULT_WHOLESALE.avgOrderValue,
        perOrderCost: n(stored.input.perOrderCost) ?? DEFAULT_WHOLESALE.perOrderCost,
        minOrderValue: n(stored.input.minOrderValue) ?? DEFAULT_WHOLESALE.minOrderValue,
        channelCommissionPct: n(stored.input.channelCommissionPct) ?? DEFAULT_WHOLESALE.channelCommissionPct,
        channelNewCustomerFee: n(stored.input.channelNewCustomerFee) ?? DEFAULT_WHOLESALE.channelNewCustomerFee,
        processingPct: n(stored.input.processingPct) ?? DEFAULT_WHOLESALE.processingPct,
        termsShare: n(stored.input.termsShare) ?? DEFAULT_WHOLESALE.termsShare,
        termsDays: n(stored.input.termsDays) ?? DEFAULT_WHOLESALE.termsDays,
        dailyCashCostPct: n(stored.input.dailyCashCostPct) ?? DEFAULT_WHOLESALE.dailyCashCostPct,
        ordersPerMonth: n(stored.input.ordersPerMonth) ?? DEFAULT_WHOLESALE.ordersPerMonth,
        hoursPerOrder: n(stored.input.hoursPerOrder) ?? DEFAULT_WHOLESALE.hoursPerOrder,
        hourlyRate: n(stored.input.hourlyRate) ?? DEFAULT_WHOLESALE.hourlyRate,
        keystoneFloorShare: n(stored.input.keystoneFloorShare) ?? DEFAULT_WHOLESALE.keystoneFloorShare,
      };
    }
  } catch {
    // fall through to defaults
  }
  return { ...DEFAULT_WHOLESALE };
}

function fmt$(n: number): string {
  const rounded = n >= 1000 ? Math.round(n) : Math.round(n * 100) / 100;
  return "$" + rounded.toFixed(rounded >= 100 ? 0 : 2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
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

export function WholesalePricelistLabCard({ project }: { project: PatternProject }) {
  const [input, setInput] = useState<WholesaleInput>(() => loadStored(project));
  const { language } = useSettings();
  const ls: LabStatCopy = getLabStatCopy(language);
  const copyText = WHOLESALE_PRICELIST_COPY[language];

  const result: WholesaleResult = useMemo(() => analyzeWholesale(input), [input]);

  const persist = (next: WholesaleInput) => {
    setInput(next);
    try {
      const handle = projectStorage<StoredState>("wholesalepricelist", project.id, [STORAGE_KEY]);
      handle.write({ input: next, ts: Date.now() });
    } catch {
      // storage unavailable — UI still works in memory
    }
  };

  const set = <K extends keyof WholesaleInput>(key: K, value: WholesaleInput[K]) =>
    persist({ ...input, [key]: value });

  const verdictTone = (() => {
    if (result.verdict.startsWith("Wholesale-ready")) return "good" as const;
    if (result.verdict.startsWith("Pricing fails")) return "bad" as const;
    return "warn" as const;
  })();

  const highFlags = result.flags.filter((f) => f.severity === "high");

  const tierRows = useMemo(() => {
    const rows = [...result.tiers];
    if (rows.length > 0 && rows[0].discountPct === 0) {
      return rows.map((r, i) => ({ ...r, base: i === 0 }));
    }
    return rows.map((r) => ({ ...r, base: false }));
  }, [result.tiers]);

  const keystoneFloor = input.retailPrice * (1 - input.keystoneFloorShare);

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="space-y-4 pt-5">
          <div className="flex items-start gap-2">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <p className="text-xs leading-relaxed text-muted-foreground">
              Builds the wholesale side of the business — the line sheet you hand to yarn shops, boutiques,
              and studios. Boutiques expect keystone (buy at 50% of retail), so the test that matters is
              COGS × 4 ≤ retail: if your fully-loaded cost eats more than a quarter of the retail price,
              wholesale is volunteer work at normal volume. This lab also prices the per-order admin that
              nobody counts — packaging, freight, invoicing, Net 30 cash drag, and marketplace commissions
              like Faire's 15% + $10 first-order fee — and tells you where your minimum order value actually
              needs to sit.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <NumField
              label={copyText.retailPrice}
              value={input.retailPrice}
              step={0.5}
              hint={copyText.whatTheShopSells}
              prefix="$"
              onChange={(v) => set("retailPrice", v)}
            />
            <NumField
              label={copyText.fullyLoadedCostPerUnit}
              value={input.unitCost}
              step={0.1}
              hint={copyText.materialsLaborPackagingOverhead}
              prefix="$"
              onChange={(v) => set("unitCost", v)}
            />
            <NumField
              label={copyText.retailerKeystone}
              value={input.keystone}
              step={0.1}
              min={1.5}
              max={4}
              hint={copyText.shopMarkup20}
              suffix="×"
              onChange={(v) => set("keystone", v)}
            />
            <NumField
              label={copyText.keystoneFloorShare}
              value={input.keystoneFloorShare * 100}
              step={5}
              max={80}
              suffix="%"
              hint={copyText.wholesaleCanTExceed}
              onChange={(v) => set("keystoneFloorShare", v / 100)}
            />
            <NumField
              label={copyText.minOrderValue}
              value={input.minOrderValue}
              step={25}
              hint={copyText.smallestOrderYouLl}
              prefix="$"
              onChange={(v) => set("minOrderValue", v)}
            />
            <NumField
              label={copyText.averageOrderValue}
              value={input.avgOrderValue}
              step={25}
              hint={copyText.whatYourPipelineRealistically}
              prefix="$"
              onChange={(v) => set("avgOrderValue", v)}
            />
            <NumField
              label={copyText.unitsPerTypicalOrder}
              value={input.avgOrderUnits}
              step={1}
              hint={copyText.forPerUnitEconomicsAnd}
              suffix="units"
              onChange={(v) => set("avgOrderUnits", v)}
            />
            <NumField
              label={copyText.perOrderCost}
              value={input.perOrderCost}
              step={1}
              hint={copyText.packagingFreightInvoicingPer}
              prefix="$"
              onChange={(v) => set("perOrderCost", v)}
            />
            <NumField
              label={copyText.processingOnReceivedFunds}
              value={input.processingPct * 100}
              step={0.1}
              suffix="%"
              hint={copyText.cardPaymentProcessingOn}
              onChange={(v) => set("processingPct", v / 100)}
            />
          </div>

          <Separator />

          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Order-value tiers (discount rungs)
              </h3>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 gap-1 text-[11px]"
                onClick={() => {
                  if (input.tiers.length >= 6) return;
                  set("tiers", [
                    ...input.tiers,
                    {
                      label: `Tier ${input.tiers.length + 1}`,
                      minOrderUsd: Math.round((input.tiers[input.tiers.length - 1]?.minOrderUsd ?? 0) * 1.5 + 50),
                      discountPct: Math.min(40, (input.tiers[input.tiers.length - 1]?.discountPct ?? 0) + 5),
                    },
                  ]);
                }}
              >
                <Plus className="h-3 w-3" /> Add rung
              </Button>
            </div>
            <div className="space-y-2">
              {input.tiers.map((t, i) => (
                <div key={i} className="grid grid-cols-[1fr_110px_100px_90px] items-center gap-2">
                  <Input
                    value={t.label}
                    onChange={(e) => {
                      const tiers = input.tiers.map((x, j) => (j === i ? { ...x, label: e.target.value } : x));
                      set("tiers", tiers);
                    }}
                    className="h-8 bg-background"
                    aria-label={`Tier ${i + 1} label`}
                  />
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-muted-foreground">$</span>
                    <Input
                      type="number"
                      step={25}
                      value={t.minOrderUsd}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        const tiers = input.tiers.map((x, j) =>
                          j === i ? { ...x, minOrderUsd: isFinite(v) ? v : 0 } : x,
                        );
                        set("tiers", tiers);
                      }}
                      className="h-8 bg-background"
                      aria-label={`Tier ${i + 1} minimum order USD`}
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      step={1}
                      min={0}
                      max={40}
                      value={t.discountPct}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        const tiers = input.tiers.map((x, j) =>
                          j === i ? { ...x, discountPct: Math.min(40, Math.max(0, isFinite(v) ? v : 0)) } : x,
                        );
                        set("tiers", tiers);
                      }}
                      className="h-8 bg-background"
                      aria-label={`Tier ${i + 1} discount percent`}
                    />
                    <span className="text-[11px] text-muted-foreground">%</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground"
                    disabled={input.tiers.length <= 1}
                    onClick={() => set("tiers", input.tiers.filter((_, j) => j !== i))}
                    aria-label={`Remove tier ${i + 1}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-3">
            <NumField
              label={copyText.channelCommission}
              value={input.channelCommissionPct}
              step={1}
              max={50}
              suffix="%"
              hint={copyText.marketplaceCutFaire15Pct}
              onChange={(v) => set("channelCommissionPct", v)}
            />
            <NumField
              label={copyText.newCustomerMarketplaceFee}
              value={input.channelNewCustomerFee}
              step={1}
              hint={copyText.faireChargesDollar10Per}
              prefix="$"
              onChange={(v) => set("channelNewCustomerFee", v)}
            />
            <NumField
              label={copyText.ordersOnNetTerms}
              value={input.termsShare * 100}
              step={10}
              max={100}
              suffix="%"
              hint={copyText.shareOfOrdersPaid}
              onChange={(v) => set("termsShare", v / 100)}
            />
            <NumField
              label={copyText.termsLength}
              value={input.termsDays}
              step={15}
              max={180}
              suffix="days"
              hint={copyText.net30Net60}
              onChange={(v) => set("termsDays", v)}
            />
            <NumField
              label={copyText.workingCapitalCost}
              value={input.dailyCashCostPct * 1000}
              step={0.1}
              hint={copyText.k10PctApr0027Pct}
              suffix="¢/day"
              onChange={(v) => set("dailyCashCostPct", v / 1000)}
            />
            <NumField
              label={copyText.shopOrdersPerMonth}
              value={input.ordersPerMonth}
              step={1}
              suffix="/mo"
              hint={copyText.yourRealisticWholesaleOrder}
              onChange={(v) => set("ordersPerMonth", v)}
            />
            <NumField
              label={copyText.hoursPerShopOrder}
              value={input.hoursPerOrder}
              step={0.5}
              suffix="hr"
              hint={copyText.quotingPackingInvoicingThe}
              onChange={(v) => set("hoursPerOrder", v)}
            />
            <NumField
              label={ls.yourHourlyRate}
              value={input.hourlyRate}
              step={5}
              prefix="$"
              hint={copyText.whatYourTimeIs}
              onChange={(v) => set("hourlyRate", v)}
            />
            <div className="flex items-end pb-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-xs"
                onClick={() => persist({ ...DEFAULT_WHOLESALE })}
              >
                <RefreshCw className="h-3 w-3" /> Reset to demo
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatBox
          label={ls.baseWholesaleKeystoneFloor}
          value={fmt$(result.baseUnitWholesale)}
          tone={result.tiers.some((t) => !t.keystoneCompliant) ? "warn" : "good"}
          hint={`Keystone floor ${fmt$(keystoneFloor)} · implied retail ${fmt$(result.impliedRetailAtKeystone)}`}
        />
        <StatBox
          label={ls.netPerUnitBase}
          value={fmt$(result.baseNetPerUnit)}
          tone={result.baseNetPerUnit > 0 ? "good" : "bad"}
          hint={copyText.baseWholesaleMinusFullyLoaded}
        />
        <StatBox
          label={ls.monthlyNetWholesale}
          value={fmt$(result.monthlyNet)}
          tone={result.monthlyNet >= 0 ? "good" : "bad"}
          hint={`After admin (${fmt$(result.monthlyLaborCost)}) and cash drag (${fmt$(result.monthlyCashDrag)})`}
        />
        <StatBox
          label={ls.breakEvenOrders}
          value={isFinite(result.breakEvenOrdersPerMonth) ? `${result.breakEvenOrdersPerMonth}/mo` : "∞"}
          tone={result.breakEvenOrdersPerMonth <= Math.max(input.ordersPerMonth, 1) ? "good" : "warn"}
          hint={copyText.ordersMonthNeededTo}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <StatBox
          label={ls.annualWholesaleNet}
          value={fmt$(result.annualNet)}
          tone={result.annualNet >= 0 ? "good" : "bad"}
          hint={copyText.k12CurrentMonthlyAt}
        />
        <StatBox
          label={ls.minimumOrderGate}
          value={result.minOrderGate.length > 90 ? "See below" : result.minOrderGate}
          tone={result.minOrderGate.includes("profitable") ? "good" : "bad"}
        />
      </div>

      <Card>
        <CardContent className="pt-5">
          <h3 className="mb-3 text-sm font-semibold">Tier table</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                  <th className="py-1.5 pr-2">Tier</th>
                  <th className="py-1.5 pr-2">Min order</th>
                  <th className="py-1.5 pr-2">Discount</th>
                  <th className="py-1.5 pr-2">Wholesale/unit</th>
                  <th className="py-1.5 pr-2">Gross margin</th>
                  <th className="py-1.5 pr-2">Margin %</th>
                  <th className="py-1.5 pr-2">Keystone OK</th>
                  <th className="py-1.5">After fees</th>
                </tr>
              </thead>
              <tbody>
                {tierRows.map((t, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-1.5 pr-2 font-medium">
                      {t.base && <BadgeCheck className="mr-1 inline h-3 w-3 text-emerald-500" />}
                      {t.label}
                    </td>
                    <td className="py-1.5 pr-2 tabular-nums">
                      {t.minOrderUsd > 0 ? `$${t.minOrderUsd}` : "—"}
                    </td>
                    <td className="py-1.5 pr-2 tabular-nums">{t.discountPct > 0 ? `${t.discountPct}%` : "—"}</td>
                    <td className="py-1.5 pr-2 font-medium tabular-nums">{fmt$(t.unitWholesale)}</td>
                    <td className="py-1.5 pr-2 tabular-nums">{fmt$(t.unitGrossMargin)}</td>
                    <td className="py-1.5 pr-2 tabular-nums">{t.grossMarginPct.toFixed(0)}%</td>
                    <td className="py-1.5 pr-2">
                      {t.keystoneCompliant ? (
                        <BadgeCheck className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <BadgeX className="h-3.5 w-3.5 text-destructive" />
                      )}
                    </td>
                    <td className="py-1.5 tabular-nums">
                      {t.unitWholesale > 0 ? `${t.marginAfterFeesPct.toFixed(0)}%` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[11px] leading-tight text-muted-foreground">
            Keystone OK = wholesale stays at or below {fmt$(keystoneFloor)} so the shop keeps its full markup.
            After fees includes the {input.channelCommissionPct}% channel commission and{" "}
            {input.processingPct.toFixed(1)}% processing on the tier's wholesale price.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5">
          <h3 className="mb-3 text-sm font-semibold">Order models</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                  <th className="py-1.5 pr-2">Model</th>
                  <th className="py-1.5 pr-2">Net per order</th>
                  <th className="py-1.5 pr-2">Net per unit</th>
                  <th className="py-1.5">Cash drag/order</th>
                </tr>
              </thead>
              <tbody>
                {result.orders.map((o, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-1.5 pr-2 font-medium">{o.name}</td>
                    <td className={`py-1.5 pr-2 tabular-nums ${o.netPerOrder >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
                      {fmt$(o.netPerOrder)}
                    </td>
                    <td className="py-1.5 pr-2 tabular-nums">{fmt$(o.netPerUnit)}</td>
                    <td className="py-1.5 tabular-nums">
                      {o.cashDragPerOrder > 0 ? fmt$(o.cashDragPerOrder) : <Minus className="h-3 w-3 text-muted-foreground" />}
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
              <BadgeCheck className="h-4 w-4 text-emerald-500" /> No flags — line sheet structure is clean.
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
            The numbers that matter most on a line sheet: base wholesale at or under retail ÷ keystone so the
            shop keeps its markup, a minimum order that still nets positive after packaging + freight + admin
            (typical first orders run $150-200 for gift retail), 100%-at-order or 50/50 payment terms unless
            the buyer is a buffer-rich national account, and your own line sheet as the durable asset — owned
            customer relationships don't get stranded when a platform shuts down (Etsy Wholesale closed 2017).
            Quote marketplaces for net-new discovery, route reorders to the 0%-channel direct line sheet.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
