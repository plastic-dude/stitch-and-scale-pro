/**
 * Payback Lab card (CHK-093) — per-pattern lifetime recoup tracker.
 *
 * THE PAIN: every designer answers the same question manually — "I spent X
 * hours and $Y on this pattern; how many sales until it pays me back?" No
 * bookkeeping tool on the market (Wave, Zoho, QuickBooks, Xero, Craftybase,
 * Ardent Seller) computes a per-design recoup point against live sales.
 *
 * WATCHES TWO OTHER LABS (read-only):
 * - Design Ledger: designs + design-scoped expenses + overhead expenses
 * - Receipt Lab: sales matched to designs by name (substring rule)
 * Everything renders live from those stores; this tab writes only its own
 * settings (design hours + hourly rate) to its own storage key.
 *
 * LOCAL-FIRST: pure read of sibling labs + localStorage for settings.
 */
import { useMemo, useState } from "react";
import { useSettings } from '@/context/SettingsContext';
import { PAYBACK_COPY, type PaybackCopy } from '@/lib/payback-copy';
import { TrendingUp, AlertTriangle, CheckCircle2, Clock, PiggyBank } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  computePayback,
  isReachable,
  whatIfRecoup,
  PAYBACK_DEFAULTS,
  type PaybackInput,
  type PaybackDesignResult,
} from "@/lib/payback-lab";
import { projectStorage } from "@/lib/storage-lib";
import type { PatternProject } from "@/lib/grading-engine";
import { EXPENSE_CATEGORY_LABELS } from "@/lib/design-ledger";
import { analyzeReceiptFees, fmtMoney, SALE_CHANNEL_LABELS, type SavedSale } from "@/lib/receipt-lab";

function paybackTwoDec(n: number): number {
  return Math.round(n * 100) / 100;
}
function paybackClamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

/*
  Resolve the gross total of a stored Receipt Lab row, covering both shapes:
  rows carrying an explicit grossTotal, and Receipt Lab's actual SavedSale
  rows (which have no grossTotal at all — see issue #57 / ledger S273).
  For the missing case, gross is derived the same way the canonical analyzer
  does: items subtotal + tax + shipping charged.
*/
export function resolveStoredReceiptGross(row: ReceiptStoredRow): number {
  if (typeof row.grossTotal === "number") return row.grossTotal;
  const f = row.fees ?? {};
  const subtotal = (row.items ?? []).reduce((s, it) => s + ((it.qty ?? 0) * (it.unitPrice ?? 0)), 0);
  const taxAmount = paybackTwoDec(subtotal * paybackClamp(f.taxPct ?? 0, 0, 1));
  return paybackTwoDec(subtotal + taxAmount + paybackClamp(f.shippingCharged ?? 0, 0, 1e9));
}
const DESIGN_LEDGER_LEGACY_KEY = "stitch-and-scale-designledger-v1";
const RECEIPT_LEGACY_KEY = "stitch-and-scale-receipt-v1";
const PAYBACK_LEGACY_KEY = "stitch-and-scale-payback-v1";

interface LedgerStored {
  studioName?: string;
  currency?: string;
  ts?: number;
  designs?: Array<{
    id: string;
    name?: string;
    status?: string;
    createdAt?: string;
  }>;
  expenses?: Array<{
    id: string;
    designId?: string;
    category?: string;
    description?: string;
    amount?: number;
    currency?: string;
    date?: string;
  }>;
}

export interface ReceiptStoredRow {
  id?: string;
  kind?: string;
  date?: string;
  createdAt?: string;
  patternName?: string;
  saleType?: string;
  items?: Array<{ name?: string; qty?: number; unitPrice?: number }>;
  fees?: {
    platformCommissionPct?: number;
    processingPct?: number;
    processingFlat?: number;
    taxPct?: number;
    shippingCharged?: number;
    shippingCost?: number;
    platformFee?: number;
    processingFee?: number;
    taxAmount?: number;
  };
  grossTotal?: number;
  profit?: number;
}

interface ReceiptStored {
  brand?: { businessName?: string; currency?: string };
  ledger?: ReceiptStoredRow[];
  ts?: number;
}

/*
  Keep the old output-shaped rows readable, but normalize the exact input shape
  written by Receipt Lab through its canonical fee analyzer. This retires the
  silent $0-fee path without changing stored data or the calculation contract.
*/
export function resolveStoredReceiptFees(row: ReceiptStoredRow): number {
  const f = row.fees ?? {};
  const hasResolvedOutputFees = typeof f.platformFee === "number" || typeof f.processingFee === "number" || typeof f.taxAmount === "number";
  if (hasResolvedOutputFees) {
    return (f.platformFee ?? 0) + (f.processingFee ?? 0) + (f.taxAmount ?? 0) + (f.shippingCost ?? 0);
  }
  const savedSale = {
    id: row.id ?? "",
    kind: (row.kind === "refund" ? "refund" : "receipt") as SavedSale["kind"],
    docNumber: "",
    customerName: "",
    date: row.date ?? (row.createdAt ?? "").slice(0, 10),
    channel: "other" as SavedSale["channel"],
    saleType: (row.saleType === "custom-knit" || row.saleType === "item" ? row.saleType : "pattern") as SavedSale["saleType"],
    patternName: row.patternName ?? "",
    items: (row.items ?? []).map((item) => ({ name: item.name ?? "", qty: item.qty ?? 0, unitPrice: item.unitPrice ?? 0 })),
    fees: {
      platformCommissionPct: f.platformCommissionPct ?? 0,
      processingPct: f.processingPct ?? 0,
      processingFlat: f.processingFlat ?? 0,
      taxPct: f.taxPct ?? 0,
      shippingCharged: f.shippingCharged ?? 0,
      shippingCost: f.shippingCost ?? 0,
    },
    depositReceived: 0,
    note: "",
    createdAt: row.createdAt ?? row.date ?? "",
  } satisfies SavedSale;
  const breakdown = analyzeReceiptFees(savedSale);
  return Math.round((breakdown.grossTotal - breakdown.netAfterFees) * 100) / 100;
}

interface PaybackStored {
  hoursMap?: Record<string, number>;
  hourlyRate?: number;
  ts?: number;
}

interface DesignLedgerSaleRow {
  id: string;
  kind: "receipt" | "refund";
  date: string;
  patternName: string;
  itemsQtyTotal: number;
  grossTotal: number;
  feesTotal: number;
}

function readLedger(project: PatternProject): { currency: string; designs: LedgerStored["designs"]; expenses: LedgerStored["expenses"] } {
  try {
    const handle = projectStorage<LedgerStored>("designledger", project.id, [DESIGN_LEDGER_LEGACY_KEY]);
    const stored = handle.read();
    return {
      currency: stored?.currency || "USD",
      designs: stored?.designs ?? [],
      expenses: stored?.expenses ?? [],
    };
  } catch {
    return { currency: "USD", designs: [], expenses: [] };
  }
}

function readReceipts(project: PatternProject): { currency: string; sales: DesignLedgerSaleRow[] } {
  try {
    const handle = projectStorage<ReceiptStored>("receipt", project.id, [RECEIPT_LEGACY_KEY]);
    const stored = handle.read();
    const sales: DesignLedgerSaleRow[] = [];
    const ledger = stored?.ledger ?? [];
    for (const row of ledger) {
      const kind = row.kind;
      if (kind !== "receipt" && kind !== "refund") continue;
      const feesTotal = resolveStoredReceiptFees(row);
      const eff = kind === "refund" ? -1 : 1;
      const gross = resolveStoredReceiptGross(row);
      sales.push({
        id: row.id ?? "",
        kind: kind as "receipt" | "refund",
        date: row.date || (row.createdAt ?? "").slice(0, 10) || new Date().toISOString().slice(0, 10),
        patternName: row.patternName ?? "",
        itemsQtyTotal: (row.items ?? []).reduce((s, it) => s + (it.qty ?? 0), 0),
        grossTotal: eff * (typeof gross === "number" ? gross : 0),
        feesTotal: eff * feesTotal,
      });
    }
    return { currency: stored?.brand?.currency || "USD", sales };
  } catch {
    return { currency: "USD", sales: [] };
  }
}

function readPaybackSettings(project: PatternProject): PaybackStored {
  try {
    const handle = projectStorage<PaybackStored>("payback", project.id, [PAYBACK_LEGACY_KEY]);
    const stored = handle.read();
    return {
      hoursMap: stored?.hoursMap ?? {},
      hourlyRate: stored?.hourlyRate ?? PAYBACK_DEFAULTS.floorHourlyRate,
      ts: stored?.ts ?? 0,
    };
  } catch {
    return { hoursMap: {}, hourlyRate: PAYBACK_DEFAULTS.floorHourlyRate, ts: 0 };
  }
}

function DesignPaybackCard({
  r,
  rate,
  currency,
  hours,
  onHours,
  copy,
}: {
  r: PaybackDesignResult;
  rate: number;
  currency: string;
  hours: number;
  onHours: (n: number) => void;
  copy: PaybackCopy;
}) {
  const whatIf10 = whatIfRecoup(r.investment, r.avgNetPerSale, r.avgNetPerSale * 1.1);
  const whatIf20 = whatIfRecoup(r.investment, r.avgNetPerSale, r.avgNetPerSale * 1.2);
  const progressPct =
    r.copiesSold > 0 && isReachable(r.recoupCopies)
      ? Math.min(100, Math.round((r.copiesSold / r.recoupCopies) * 100))
      : r.copiesSold > 0 && r.recoupCopies === Infinity
        ? 100
        : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">{r.design.name}</CardTitle>
            <CardDescription>{r.design.status}</CardDescription>
          </div>
          {r.paidBack ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
              <CheckCircle2 className="h-3 w-3" /> {copy.paidBackBadge}
            </span>
          ) : isReachable(r.recoupCopies) ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
              <Clock className="h-3 w-3" /> {r.monthsSinceLastSale >= 3 ? copy.bleedingBadge : copy.recoupingBadge}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/40 dark:text-red-300">
              <AlertTriangle className="h-3 w-3" /> {copy.noNet}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <Stat label={copy.invested} value={fmtMoney(r.investment, currency)} />
          <Stat label={copy.netEarned} value={fmtMoney(r.revenueNet, currency)} />
          <Stat label={copy.copiesSold} value={String(r.copiesSold)} />
          <Stat
            label={copy.avgNet}
            value={fmtMoney(r.avgNetPerSale, currency)}
            muted={!isReachable(r.recoupCopies) && r.copiesSold === 0}
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {isReachable(r.recoupCopies) ? (
                <>
                  {copy.needs(String(r.recoupCopies)).split(String(r.recoupCopies))[0]}<strong className="text-foreground">{r.recoupCopies}</strong>{copy.needs(String(r.recoupCopies)).split(String(r.recoupCopies))[1]}
                </>
              ) : (
                <>
                  {copy.netSalesAtAverage}
                </>
              )}
            </span>
            <span className="text-muted-foreground">
              {r.copiesSold} / {isReachable(r.recoupCopies) ? r.recoupCopies : "∞"}
            </span>
          </div>
          <Progress value={progressPct} />
        </div>

        <div className="grid gap-3 text-sm sm:grid-cols-3">
          <MiniStat label={copy.outOfPocket} value={fmtMoney(r.directCost, currency)} />
          <MiniStat label={copy.overhead} value={fmtMoney(r.overheadShare, currency)} />
          <MiniStat label={copy.timeCost} value={fmtMoney(r.timeCost, currency)} sub={`${hours}h × ${fmtMoney(rate, currency)}/h`} />
        </div>

        <div className="grid gap-3 text-sm sm:grid-cols-3">
          <MiniStat
            label={r.paidBack ? copy.aheadBy : copy.deficit}
            value={r.paidBack ? "+" + fmtMoney(r.surplus, currency) : "−" + fmtMoney(r.deficit, currency)}
            accent={r.paidBack ? "emerald" : "red"}
          />
          <MiniStat label={copy.costCopies} value={isReachable(r.costCopies) ? String(r.costCopies) : "∞"} sub={copy.costOnly} />
          <MiniStat
            label={copy.monthsSinceSale}
            value={r.copiesSold === 0 ? "—" : String(r.monthsSinceLastSale)}
            sub={r.lastSaleDate ? `${copy.lastSale} ${r.lastSaleDate}` : undefined}
          />
        </div>

        {isReachable(r.recoupCopies) && r.avgNetPerSale > 0 && (
          <div className="rounded-md border bg-muted/40 p-3 text-xs">
            <p className="mb-1.5 font-medium text-muted-foreground">{copy.whatIf}</p>
            <div className="flex flex-wrap gap-3">
              <span>{copy.plus10(String(whatIf10.projected), String(whatIf10.current))}</span>
              <span>{copy.plus20(String(whatIf20.projected), String(whatIf20.current))}</span>
            </div>
          </div>
        )}

        {!r.paidBack && r.monthsSinceLastSale >= 3 && r.copiesSold > 0 && (
          <p className="text-xs text-muted-foreground">
            {copy.staleSale(r.monthsSinceLastSale)}
          </p>
        )}

        <div className="space-y-1">
          <Label htmlFor={"pb-hours-" + r.design.id} className="text-xs text-muted-foreground">
            {copy.designHours}
          </Label>
          <Input
            id={"pb-hours-" + r.design.id}
            type="number"
            min={0}
            value={hours}
            onChange={(e) => onHours(Math.max(0, Number(e.target.value) || 0))}
            className="h-8 w-32 text-sm"
          />
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={"font-semibold " + (muted ? "text-muted-foreground" : "")}>{value}</p>
    </div>
  );
}

function MiniStat({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: "emerald" | "red";
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={
          "font-semibold " +
          (accent === "emerald"
            ? "text-emerald-600 dark:text-emerald-400"
            : accent === "red"
              ? "text-red-600 dark:text-red-400"
              : "")
        }
      >
        {value}
      </p>
      {sub ? <p className="text-xs text-muted-foreground">{sub}</p> : null}
    </div>
  );
}

export function PaybackLabCard(props: { project: PatternProject }) {
  const { project } = props;
  const { language } = useSettings();
  const copy = PAYBACK_COPY[language];
  const [settings, setSettings] = useState<PaybackStored>(() => readPaybackSettings(project));
  const [rateInput, setRateInput] = useState<string>(() => String(settings.hourlyRate ?? PAYBACK_DEFAULTS.floorHourlyRate));

  const ledger = useMemo(() => readLedger(project), [project]);
  const receipts = useMemo(() => readReceipts(project), [project]);
  const currency = ledger.currency || receipts.currency || "USD";

  const input: PaybackInput = useMemo(
    () => ({
      designs: (ledger.designs ?? []).map((d) => ({
        id: d.id ?? "",
        name: d.name ?? "",
        status: d.status ?? "concept",
        hours: settings.hoursMap?.[d.id ?? ""] ?? 0,
        createdAt: d.createdAt ?? "",
      })),
      expenses: (ledger.expenses ?? []).map((e) => ({
        designId: e.designId ?? "",
        amount: e.amount ?? 0,
        currency: e.currency ?? "USD",
        date: e.date ?? "",
      })),
      sales: receipts.sales.map((s) => ({
        kind: s.kind,
        date: s.date,
        patternName: s.patternName,
        qty: Math.max(0, Math.round(s.itemsQtyTotal)),
        gross: Math.max(0, s.grossTotal),
        fees: Math.max(0, s.feesTotal),
      })),
      hourlyRate: settings.hourlyRate ?? PAYBACK_DEFAULTS.floorHourlyRate,
    }),
    [ledger, receipts, settings],
  );

  const result = useMemo(() => computePayback(input), [input]);

  const persistSettings = (patch: Partial<PaybackStored>) => {
    const next: PaybackStored = {
      hoursMap: settings.hoursMap ?? {},
      hourlyRate: settings.hourlyRate ?? PAYBACK_DEFAULTS.floorHourlyRate,
      ts: Date.now(),
      ...patch,
    };
    setSettings(next);
    try {
      const handle = projectStorage<PaybackStored>("payback", project.id, [PAYBACK_LEGACY_KEY]);
      handle.write(next);
    } catch {
      // storage write failure must not break rendering
    }
  };

  const setHours = (designId: string, hours: number) => {
    persistSettings({ hoursMap: { ...(settings.hoursMap ?? {}), [designId]: hours } });
  };

  const commitRate = () => {
    const n = Number(rateInput);
    persistSettings({ hourlyRate: Number.isFinite(n) && n >= 0 ? Math.max(0, n) : PAYBACK_DEFAULTS.floorHourlyRate });
  };

  const designs = result.designs.filter((d) => d.directCost > 0 || d.timeCost > 0 || d.copiesSold > 0 || d.investment > 0);
  const hasData = (ledger.designs?.length ?? 0) > 0 || receipts.sales.length > 0;

  return (
    <Card className="mt-3">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-4 w-4" /> {copy.title}
        </CardTitle>
        <CardDescription>
          {copy.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {!hasData && (
          <div className="rounded-md border border-dashed bg-muted/40 p-4 text-sm text-muted-foreground">
            <PiggyBank className="mb-1.5 h-4 w-4" />
            {copy.empty.replace('Design Ledger', copy.designLedger).replace('Receipt Lab', copy.receiptLab)}
          </div>
        )}

        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{copy.rateLabel}</Label>
            <div className="flex items-center gap-2">
              <Input
                aria-label={copy.rateAria}
                type="number"
                min={0}
                value={rateInput}
                onChange={(e) => setRateInput(e.target.value)}
                onBlur={commitRate}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitRate();
                }}
                className="h-8 w-28 text-sm"
              />
              <Button variant="outline" size="sm" onClick={commitRate}>
                {copy.apply}
              </Button>
            </div>
            {(settings.hourlyRate ?? 0) < PAYBACK_DEFAULTS.floorHourlyRate && (
              <p className="text-xs text-muted-foreground">
                {copy.rateTip(PAYBACK_DEFAULTS.floorHourlyRate)}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
            <Stat label={copy.totalInvested} value={fmtMoney(result.totalInvestment, currency)} />
            <Stat label={copy.totalNet} value={fmtMoney(result.totalNet, currency)} />
            <Stat
              label={copy.paidBack}
              value={result.paidBackCount + " / " + result.paidBackCountOfRelevant}
              muted={result.paidBackCountOfRelevant === 0}
            />
          </div>
        </div>

        {designs.length === 0 && hasData && (
          <p className="text-sm text-muted-foreground">{copy.noCosts}</p>
        )}

        <Tabs defaultValue="all">
          <TabsList className="flex-wrap">
            <TabsTrigger value="all">{copy.all} ({designs.length})</TabsTrigger>
            <TabsTrigger value="winners">{copy.winners} ({designs.filter((d) => d.paidBack).length})</TabsTrigger>
            <TabsTrigger value="bleeders">
              {copy.recouping} ({designs.filter((d) => !d.paidBack && (d.copiesSold > 0 || d.investment > 0)).length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="mt-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {designs.map((d) => (
                <DesignPaybackCard
                  key={d.design.id}
                  r={d}
                  rate={settings.hourlyRate ?? PAYBACK_DEFAULTS.floorHourlyRate}
                  currency={currency}
                  hours={settings.hoursMap?.[d.design.id] ?? 0}
                  onHours={(n) => setHours(d.design.id, n)}
                  copy={copy}
                />
              ))}
            </div>
          </TabsContent>
          <TabsContent value="winners" className="mt-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {designs
                .filter((d) => d.paidBack)
                .map((d) => (
                  <DesignPaybackCard
                    key={d.design.id}
                    r={d}
                    rate={settings.hourlyRate ?? PAYBACK_DEFAULTS.floorHourlyRate}
                    currency={currency}
                    hours={settings.hoursMap?.[d.design.id] ?? 0}
                    onHours={(n) => setHours(d.design.id, n)}
                    copy={copy}
                  />
                ))}
            </div>
          </TabsContent>
          <TabsContent value="bleeders" className="mt-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {designs
                .filter((d) => !d.paidBack && (d.copiesSold > 0 || d.investment > 0))
                .map((d) => (
                  <DesignPaybackCard
                    key={d.design.id}
                    r={d}
                    rate={settings.hourlyRate ?? PAYBACK_DEFAULTS.floorHourlyRate}
                    currency={currency}
                    hours={settings.hoursMap?.[d.design.id] ?? 0}
                    onHours={(n) => setHours(d.design.id, n)}
                    copy={copy}
                  />
                ))}
            </div>
          </TabsContent>
        </Tabs>

        <p className="text-xs text-muted-foreground">
          {copy.localFirst}
        </p>
      </CardContent>
    </Card>
  );
}
