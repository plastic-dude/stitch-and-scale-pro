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
import { SALE_CHANNEL_LABELS } from "@/lib/receipt-lab";
import { fmtMoney } from "@/lib/receipt-lab";

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

interface ReceiptStored {
  brand?: { businessName?: string; currency?: string };
  ledger?: Array<{
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
  }>;
  ts?: number;
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
      const f = row.fees ?? {};
      const feesTotal =
        (f.platformFee ?? 0) + (f.processingFee ?? 0) + (f.taxAmount ?? 0) + (f.shippingCost ?? 0);
      const eff = kind === "refund" ? -1 : 1;
      const gross = typeof row.grossTotal === "number" ? row.grossTotal : eff * 0;
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
}: {
  r: PaybackDesignResult;
  rate: number;
  currency: string;
  hours: number;
  onHours: (n: number) => void;
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
              <CheckCircle2 className="h-3 w-3" /> Paid back
            </span>
          ) : isReachable(r.recoupCopies) ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
              <Clock className="h-3 w-3" /> {r.monthsSinceLastSale >= 3 ? "Bleeding" : "Recouping"}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/40 dark:text-red-300">
              <AlertTriangle className="h-3 w-3" /> No net on sales yet
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <Stat label="Invested" value={fmtMoney(r.investment, currency)} />
          <Stat label="Net earned" value={fmtMoney(r.revenueNet, currency)} />
          <Stat label="Copies sold" value={String(r.copiesSold)} />
          <Stat
            label="Avg net / sale"
            value={fmtMoney(r.avgNetPerSale, currency)}
            muted={!isReachable(r.recoupCopies) && r.copiesSold === 0}
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {isReachable(r.recoupCopies) ? (
                <>
                  Needs <strong className="text-foreground">{r.recoupCopies}</strong> net sales to recoup
                </>
              ) : (
                <>
                  Needs <strong className="text-foreground">∞</strong> net sales at this average
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
          <MiniStat label="Out of pocket" value={fmtMoney(r.directCost, currency)} />
          <MiniStat label="Overhead share" value={fmtMoney(r.overheadShare, currency)} />
          <MiniStat label="Time cost" value={fmtMoney(r.timeCost, currency)} sub={`${hours}h × ${fmtMoney(rate, currency)}/h`} />
        </div>

        <div className="grid gap-3 text-sm sm:grid-cols-3">
          <MiniStat
            label={r.paidBack ? "Ahead by" : "Still in deficit"}
            value={r.paidBack ? "+" + fmtMoney(r.surplus, currency) : "−" + fmtMoney(r.deficit, currency)}
            accent={r.paidBack ? "emerald" : "red"}
          />
          <MiniStat label="Cost-only copies" value={isReachable(r.costCopies) ? String(r.costCopies) : "∞"} sub="recovers out-of-pocket only" />
          <MiniStat
            label="Months since last sale"
            value={r.copiesSold === 0 ? "—" : String(r.monthsSinceLastSale)}
            sub={r.lastSaleDate ? ("last sale " + r.lastSaleDate) : undefined}
          />
        </div>

        {isReachable(r.recoupCopies) && r.avgNetPerSale > 0 && (
          <div className="rounded-md border bg-muted/40 p-3 text-xs">
            <p className="mb-1.5 font-medium text-muted-foreground">What-if: price the pattern higher</p>
            <div className="flex flex-wrap gap-3">
              <span>+10% net → recoup in <strong>{whatIf10.projected}</strong> copies (was {whatIf10.current})</span>
              <span>+20% net → recoup in <strong>{whatIf20.projected}</strong> copies (was {whatIf20.current})</span>
            </div>
          </div>
        )}

        {!r.paidBack && r.monthsSinceLastSale >= 3 && r.copiesSold > 0 && (
          <p className="text-xs text-muted-foreground">
            No sale in {r.monthsSinceLastSale} months — the Promo Lab and Re-Price Lab can give this pattern a second life.
          </p>
        )}

        <div className="space-y-1">
          <Label htmlFor={"pb-hours-" + r.design.id} className="text-xs text-muted-foreground">
            Design hours (knitting + writing + revising)
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
          <TrendingUp className="h-4 w-4" /> Payback Lab
        </CardTitle>
        <CardDescription>
          Your time has a price. This lab counts every pound, dollar and hour you put into a pattern — and tells you the
          exact moment it pays you back.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {!hasData && (
          <div className="rounded-md border border-dashed bg-muted/40 p-4 text-sm text-muted-foreground">
            <PiggyBank className="mb-1.5 h-4 w-4" />
            Nothing to recoup yet. Add designs and costs in the <strong>Design Ledger</strong> tab and record sales in
            the <strong>Receipt Lab</strong> — this lab watches them both and updates automatically.
          </div>
        )}

        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Your hourly rate (currency/hour)</Label>
            <div className="flex items-center gap-2">
              <Input
                aria-label="Hourly rate"
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
                Apply
              </Button>
            </div>
            {(settings.hourlyRate ?? 0) < PAYBACK_DEFAULTS.floorHourlyRate && (
              <p className="text-xs text-muted-foreground">
                Tip: even {PAYBACK_DEFAULTS.floorHourlyRate}/h is honest — your skill took years to build.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
            <Stat label="Total invested" value={fmtMoney(result.totalInvestment, currency)} />
            <Stat label="Total net earned" value={fmtMoney(result.totalNet, currency)} />
            <Stat
              label="Patterns paid back"
              value={result.paidBackCount + " / " + result.paidBackCountOfRelevant}
              muted={result.paidBackCountOfRelevant === 0}
            />
          </div>
        </div>

        {designs.length === 0 && hasData && (
          <p className="text-sm text-muted-foreground">No pattern has recorded costs or sales yet.</p>
        )}

        <Tabs defaultValue="all">
          <TabsList className="flex-wrap">
            <TabsTrigger value="all">All patterns ({designs.length})</TabsTrigger>
            <TabsTrigger value="winners">Winners ({designs.filter((d) => d.paidBack).length})</TabsTrigger>
            <TabsTrigger value="bleeders">
              Recouping ({designs.filter((d) => !d.paidBack && (d.copiesSold > 0 || d.investment > 0)).length})
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
                  />
                ))}
            </div>
          </TabsContent>
        </Tabs>

        <p className="text-xs text-muted-foreground">
          Local-first: everything is computed from your Design Ledger and Receipt Lab data on this device. No cloud, no
          subscription, no guesswork — just the math of when your work pays you back.
        </p>
      </CardContent>
    </Card>
  );
}
