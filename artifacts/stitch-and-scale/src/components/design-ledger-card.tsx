/**
 * Design Ledger card (CHK-086) — the record room.
 *
 * Four surfaces: Studio (settings + ledger-wide numbers), Designs (the
 * pipeline of every design with status life-cycle), Costs (expense log),
 * and Export (accountant-ready CSV + summary). Sales roll in read-only
 * from the Receipt Lab's stored state on the same project.
 *
 * Fewest-possible-fields rule: adding a design asks for a name only; the
 * rest defaults.
 */
import { useMemo, useRef, useState } from "react";
import {
  addDesign,
  addExpense,
  breakEven,
  DEFAULT_DESIGN_LEDGER,
  DESIGN_STATUS_LABELS,
  DESIGN_STATUS_ORDER,
  EXPENSE_CATEGORY_LABELS as ExpenseCategoryLabels,
  exportLedgerCsv,
  exportLedgerSummary,
  removeDesign,
  removeExpense,
  rollup,
  type DesignEntry,
  type DesignLedgerSaleRow,
  type DesignStatus,
  type ExpenseCategory,
  type ExpenseEntry,
} from "@/lib/design-ledger";
import { fmtMoney } from "@/lib/receipt-lab";
import { projectStorage, type ProjectStorageHandle } from "@/lib/storage-lib";
import type { PatternProject } from "@/lib/grading-engine";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { BookMarked, Copy, Download, FileSpreadsheet, Plus, Trash2 } from "lucide-react";
import { useSettings } from "@/context/SettingsContext";
import { DESIGN_LEDGER_COPY, type DesignLedgerCopy } from "@/lib/design-ledger-copy";
// CHK-132 (ledger S272): reuse the same stored-row resolvers payback uses so
// Receipt Lab's actual SavedSale shape (no grossTotal, fees never persisted)
// no longer silently resolves to $0 gross and $0 fees.
import {
  resolveStoredReceiptFees,
  resolveStoredReceiptGross,
} from "@/components/payback-lab-card";

const LEGACY_STORAGE_KEY = "stitch-and-scale-designledger-v1";

interface StoredState {
  studioName: string;
  currency: string;
  authId: string;
  designs: DesignEntry[];
  expenses: ExpenseEntry[];
  ts: number;
}

function loadStored(project: PatternProject): StoredState {
  try {
    const handle = projectStorage<StoredState>("designledger", project.id, [LEGACY_STORAGE_KEY]);
    const stored = handle.read();
    if (stored && stored.ts) {
      return {
        studioName: stored.studioName ?? DEFAULT_DESIGN_LEDGER.studioName,
        currency: stored.currency || DEFAULT_DESIGN_LEDGER.currency,
        authId: stored.authId ?? DEFAULT_DESIGN_LEDGER.authId,
        designs: Array.isArray(stored.designs) ? stored.designs : [],
        expenses: Array.isArray(stored.expenses) ? stored.expenses : [],
        ts: stored.ts,
      };
    }
  } catch {
    // fall through to defaults
  }
  return { ...DEFAULT_DESIGN_LEDGER, ts: 0 };
}

/** Read-only view of the Receipt Lab's stored state — sales flow in,
 *  never out. Same projectStorage seam, no cross-module imports. */
interface ReceiptStoredState {
  brand?: { businessName?: string; currency?: string };
  ledger?: Array<{
    id: string;
    kind: string;
    patternName?: string;
    items?: Array<{ qty?: number; unitPrice?: number }>;
    fees?: {
      platformFee?: number;
      processingFee?: number;
      taxAmount?: number;
      shippingCost?: number;
    };
    grossTotal?: number;
    profit?: number;
    date?: string;
    createdAt?: string;
  }>;
  ts?: number;
}

function loadReceiptStored(project: PatternProject): ReceiptStoredState {
  try {
    const handle = projectStorage<ReceiptStoredState>("receipt", project.id, [`stitch-and-scale-receipt-${project.id}`]);
    return handle.read() ?? {};
  } catch {
    return {};
  }
}

function receiptSaleRows(receiptStored: ReceiptStoredState, currency: string): DesignLedgerSaleRow[] {
  const ledger = receiptStored.ledger ?? [];
  return ledger
    .filter((row) => row && typeof row.kind === "string" && (row.kind === "receipt" || row.kind === "refund"))
    .map((row) => {
      const qtyTotal = (row.items ?? []).reduce((s, it) => s + (it.qty ?? 0), 0);
      const feesTotal = resolveStoredReceiptFees(row);
      const gross = resolveStoredReceiptGross(row);
      const profit = typeof row.profit === "number" ? row.profit : gross - feesTotal;
      return {
        id: row.id ?? "",
        kind: row.kind as "receipt" | "refund",
        date: row.date || row.createdAt?.slice(0, 10) || new Date().toISOString().slice(0, 10),
        patternName: row.patternName ?? "",
        itemsQtyTotal: qtyTotal,
        grossTotal: gross,
        feesTotal,
        profit,
      } satisfies DesignLedgerSaleRow;
    });
}

export function DesignLedgerCard(props: { project: PatternProject }) {
  const { project } = props;
  const { toast } = useToast();
  const { language } = useSettings();
  const copy = DESIGN_LEDGER_COPY[language];
  const handle = useMemo(
    () => projectStorage<StoredState>("designledger", project.id, [LEGACY_STORAGE_KEY]),
    [project.id],
  );
  const [state, setState] = useState<StoredState>(() => loadStored(project));
  const [receiptStored, setReceiptStored] = useState<ReceiptStoredState>(() => loadReceiptStored(project));
  const [designName, setDesignName] = useState("");
  const [designNotes, setDesignNotes] = useState("");
  const [expDesign, setExpDesign] = useState("");
  const [expCategory, setExpCategory] = useState<ExpenseCategory>("yarn");
  const [expDesc, setExpDesc] = useState("");
  const [expAmount, setExpAmount] = useState("");
  const [expDate, setExpDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [breakEvenPrice, setBreakEvenPrice] = useState("");
  const cardRef = useRef<HTMLDivElement>(null);

  const persist = (next: Omit<StoredState, "ts">) => {
    setState({ ...next, ts: Date.now() });
    handle.write({ ...next, ts: Date.now() });
  };

  const sales = useMemo(() => receiptSaleRows(receiptStored, state.currency), [receiptStored, state.currency]);
  const roll = useMemo(
    () =>
      rollup({
        designs: state.designs,
        expenses: state.expenses,
        sales,
      }),
    [state.designs, state.expenses, sales],
  );

  const fmt = (n: number) => fmtMoney(n, state.currency);

  const studioName = state.studioName || project.name || "Studio";

  const exportCsv = () => {
    const csv = exportLedgerCsv(
      { designs: state.designs, expenses: state.expenses, sales },
      studioName,
    );
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "design-ledger.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: copy.export, description: copy.csvDownloaded });
  };

  const copySummary = async () => {
    const summary = exportLedgerSummary(roll, studioName);
    try {
      await navigator.clipboard.writeText(summary);
      toast({ title: copy.export, description: copy.summaryCopied });
    } catch {
      toast({ title: copy.export, description: copy.summaryCopyFailed });
    }
  };

  return (
    <div ref={cardRef} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-serif flex items-center gap-2">
            <BookMarked className="h-5 w-5" /> {copy.title}
          </CardTitle>
          <CardDescription>
            {copy.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* CHK-123 (QA LIVE-004): triggers were shadcn-default h-10 (40px) —
              below the 44×44px touch-target minimum. min-h-11 fixes hit area. */}
          <Tabs defaultValue="studio">
            <TabsList className="flex-wrap h-auto">
              <TabsTrigger value="studio" className="min-h-11">{copy.studio}</TabsTrigger>
              <TabsTrigger value="designs" className="min-h-11">{copy.designs} ({state.designs.length})</TabsTrigger>
              <TabsTrigger value="costs" className="min-h-11">{copy.costs} ({state.expenses.length})</TabsTrigger>
              <TabsTrigger value="export" className="min-h-11">{copy.export}</TabsTrigger>
            </TabsList>

            <TabsContent value="studio" className="space-y-4 pt-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <Label htmlFor="dl-studio-name">{copy.studioName}</Label>
                  <Input
                    id="dl-studio-name"
                    value={state.studioName}
                    placeholder={copy.studioPlaceholder}
                    onChange={(e) => persist({ ...state, studioName: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="dl-currency">{copy.currency}</Label>
                  <NativeSelect
                    id="dl-currency"
                    value={state.currency}
                    onChange={(e) => persist({ ...state, currency: e.target.value })}
                  >
                    <option value="USD">USD $</option>
                    <option value="EUR">EUR €</option>
                    <option value="GBP">GBP £</option>
                    <option value="NGN">NGN ₦</option>
                    <option value="CAD">CAD $</option>
                    <option value="AUD">AUD $</option>
                    <option value="SEK">SEK kr</option>
                    <option value="NOK">NOK kr</option>
                    <option value="DKK">DKK kr</option>
                    <option value="CHF">CHF</option>
                    <option value="INR">INR ₹</option>
                    <option value="JPY">JPY ¥</option>
                    <option value="BRL">BRL R$</option>
                  </NativeSelect>
                </div>
                <div>
                  <Label htmlFor="dl-auth-bridge">{copy.accountBridge}</Label>
                  <Input
                    id="dl-auth-bridge"
                    value={state.authId || copy.notSignedIn}
                    readOnly
                    className="text-muted-foreground"
                  />
                </div>
              </div>

              <div className="grid gap-3 pt-2 sm:grid-cols-2 lg:grid-cols-5">
                <Stat label={copy.pipeline} value={String(state.designs.length)} />
                <Stat label={copy.published} value={String(roll.publishedCount)} />
                <Stat label={copy.sales} value={String(roll.totalSales)} />
                <Stat label={copy.revenue} value={fmt(roll.totalRevenue)} />
                <Stat label={copy.profit} value={fmt(roll.totalProfit)} strong />
              </div>

              {roll.monthly.length > 0 && (
                <div className="pt-2">
                  <div className="text-sm font-medium mb-2">{copy.monthly}</div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-muted-foreground border-b">
                          <th className="text-left py-1 pr-4">{copy.month}</th>
                          <th className="text-right py-1 pr-4">{copy.revenueHeader}</th>
                          <th className="text-right py-1 pr-4">{copy.designCosts}</th>
                          <th className="text-right py-1">{copy.profitHeader}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {roll.monthly.map((m) => (
                          <tr key={m.month} className="border-b">
                            <td className="py-1.5 pr-4">{m.month}</td>
                            <td className="py-1.5 pr-4 text-right">{fmt(m.revenue)}</td>
                            <td className="py-1.5 pr-4 text-right">{fmt(m.cost)}</td>
                            <td className="py-1.5 text-right font-medium">{fmt(m.profit)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="designs" className="space-y-4 pt-4">
              <div className="flex flex-wrap gap-2">
                <Input
                  value={designName}
                  placeholder={copy.designPlaceholder}
                  onChange={(e) => setDesignName(e.target.value)}
                  className="max-w-xs"
                />
                <Input
                  value={designNotes}
                  placeholder={copy.notesPlaceholder}
                  onChange={(e) => setDesignNotes(e.target.value)}
                  className="max-w-xs"
                />
                <Button
                  size="sm"
                  className="min-h-11"
                  onClick={() => {
                    if (!designName.trim()) {
                      toast({ title: copy.nameRequired, description: copy.nameRequiredDescription });
                      return;
                    }
                    persist({
                      designs: addDesign(state.designs, { name: designName, notes: designNotes }),
                      expenses: state.expenses,
                      studioName: state.studioName,
                      currency: state.currency,
                      authId: state.authId,
                    });
                    setDesignName("");
                    setDesignNotes("");
                    toast({ title: copy.designAdded, description: copy.designAddedDescription });
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" /> {copy.addDesign}
                </Button>
              </div>

              {state.designs.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {copy.noDesigns}
                </p>
              ) : (
                <div className="space-y-2">
                  {state.designs.map((d) => (
                    <DesignRow
                      key={d.id}
                      design={d}
                      currency={state.currency}
                      summary={roll.designs.find((s) => s.design.id === d.id)}
                      onStatus={(status) =>
                        persist({
                          ...state,
                          designs: state.designs.map((x) => (x.id === d.id ? { ...x, status, updatedAt: new Date().toISOString() } : x)),
                        })
                      }
                      onNotes={(notes) =>
                        persist({
                          ...state,
                          designs: state.designs.map((x) => (x.id === d.id ? { ...x, notes, updatedAt: new Date().toISOString() } : x)),
                        })
                      }
                      onRemove={() =>
                        persist({ ...state, designs: removeDesign(state.designs, d.id) })
                      }
                      copy={copy}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="costs" className="space-y-4 pt-4">
              <div className="flex flex-wrap items-end gap-2">
                <div>
                  <Label htmlFor="dl-cost-design">{copy.designOptional}</Label>
                  <NativeSelect
                    id="dl-cost-design"
                    value={expDesign}
                    onChange={(e) => setExpDesign(e.target.value)}
                  >
                    <option value="">{copy.overhead}</option>
                    {state.designs.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </NativeSelect>
                </div>
                <div>
                  <Label htmlFor="dl-cost-cat">{copy.category}</Label>
                  <NativeSelect
                    id="dl-cost-cat"
                    value={expCategory}
                    onChange={(e) => setExpCategory(e.target.value as ExpenseCategory)}
                  >
                    {(Object.keys(ExpenseCategoryLabels) as ExpenseCategory[]).map((c) => (
                      <option key={c} value={c}>
                        {ExpenseCategoryLabels[c]}
                      </option>
                    ))}
                  </NativeSelect>
                </div>
                <div>
                  <Label htmlFor="dl-cost-desc">{copy.whatFor}</Label>
                  <Input id="dl-cost-desc" value={expDesc} placeholder={copy.whatFor} onChange={(e) => setExpDesc(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="dl-cost-amt">{copy.amount}</Label>
                  <Input id="dl-cost-amt" type="number" min="0" step="0.01" value={expAmount} placeholder="0.00" onChange={(e) => setExpAmount(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="dl-cost-date">{copy.date}</Label>
                  <Input id="dl-cost-date" type="date" value={expDate} onChange={(e) => setExpDate(e.target.value)} />
                </div>
                  <Button
                    size="sm"
                    className="min-h-11"
                    onClick={() => {
                      const amount = parseFloat(expAmount);
                    if (!(amount > 0)) {
                      toast({ title: copy.amountRequired, description: copy.amountRequiredDescription });
                      return;
                    }
                    persist({
                      ...state,
                      expenses: addExpense(state.expenses, {
                        designId: expDesign,
                        category: expCategory,
                        description: expDesc,
                        amount,
                        currency: state.currency,
                        date: expDate,
                      }),
                    });
                    setExpDesc("");
                    setExpAmount("");
                    setExpDate(new Date().toISOString().slice(0, 10));
                    toast({ title: copy.costRecorded });
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" /> {copy.recordCost}
                </Button>
              </div>

              {state.expenses.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {copy.noCosts}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-muted-foreground border-b">
                        <th className="text-left py-1 pr-4">{copy.date}</th>
                        <th className="text-left py-1 pr-4">{copy.designs}</th>
                        <th className="text-left py-1 pr-4">{copy.category}</th>
                        <th className="text-left py-1 pr-4">{copy.whatFor}</th>
                        <th className="text-right py-1 pr-4">{copy.amount}</th>
                        <th className="py-1" />
                      </tr>
                    </thead>
                    <tbody>
                      {[...state.expenses].reverse().map((e) => (
                        <tr key={e.id} className="border-b">
                          <td className="py-1.5 pr-4">{e.date}</td>
                          <td className="py-1.5 pr-4">
                            {state.designs.find((d) => d.id === e.designId)?.name || copy.noDesign}
                          </td>
                          <td className="py-1.5 pr-4">{ExpenseCategoryLabels[e.category]}</td>
                          <td className="py-1.5 pr-4">{e.description || "—"}</td>
                          <td className="py-1.5 pr-4 text-right">{fmtMoney(e.amount, e.currency || state.currency)}</td>
                          <td className="py-1.5">
                            <button
                              aria-label={copy.removeCost}
                              className="min-h-11 min-w-11 inline-flex items-center justify-center text-muted-foreground hover:text-destructive"
                              onClick={() => persist({ ...state, expenses: removeExpense(state.expenses, e.id) })}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="export" className="space-y-4 pt-4">
              <p className="text-sm text-muted-foreground">
                {copy.exportDescription}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" className="min-h-11" onClick={exportCsv}>
                  <FileSpreadsheet className="h-4 w-4 mr-1" /> {copy.downloadCsv}
                </Button>
                <Button size="sm" variant="secondary" className="min-h-11" onClick={copySummary}>
                  <Copy className="h-4 w-4 mr-1" /> {copy.copySummary}
                </Button>
              </div>
              <div className="text-sm">
                <BreakEvenPanel
                  cost={roll.totalCost}
                  currency={state.currency}
                  price={breakEvenPrice}
                  onPrice={setBreakEvenPrice}
                  copy={copy}
                />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat(props: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="rounded-md border px-3 py-2">
      <div className="text-xs text-muted-foreground">{props.label}</div>
      <div className={props.strong ? "font-semibold text-base" : "font-medium text-base"}>
        {props.value}
      </div>
    </div>
  );
}

function DesignRow(props: {
  design: DesignEntry;
  currency: string;
  summary: ReturnType<typeof rollup>["designs"][number] | undefined;
  onStatus: (s: DesignStatus) => void;
  onNotes: (n: string) => void;
  onRemove: () => void;
  copy: DesignLedgerCopy;
}) {
  const { design, currency, summary, onStatus, onNotes, onRemove, copy } = props;
  const [notes, setNotes] = useState(design.notes);
  const [noteSet, setNoteSet] = useState(false);
  const commitNotes = () => {
    onNotes(notes);
    setNoteSet(true);
  };
  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">{design.name}</span>
        <NativeSelect value={design.status} onChange={(e) => onStatus(e.target.value as DesignStatus)}>
          {DESIGN_STATUS_ORDER.map((s) => (
            <option key={s} value={s}>
              {DESIGN_STATUS_LABELS[s]}
            </option>
          ))}
        </NativeSelect>
        {summary && (
          <span className="text-xs text-muted-foreground">
            {copy.rowCost} {fmtMoney(summary.costTotal, currency)} · {copy.rowRevenue} {fmtMoney(summary.revenueTotal, currency)} · {copy.rowSales} {summary.salesCount} · {copy.rowProfit} {fmtMoney(summary.profitAttributed, currency)}
          </span>
        )}
        <button
          aria-label={copy.removeDesign}
          className="ml-auto min-h-11 min-w-11 inline-flex items-center justify-center text-muted-foreground hover:text-destructive"
          onClick={onRemove}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="mt-2 flex gap-2">
        <Textarea
          value={notes}
          placeholder={copy.notesPlaceholder}
          className="min-h-[56px]"
          onChange={(e) => {
            setNotes(e.target.value);
            setNoteSet(false);
          }}
          onBlur={commitNotes}
        />
        {!noteSet && notes !== design.notes && (
          <Button size="sm" variant="ghost" className="min-h-11" onClick={commitNotes}>
            {copy.saveNotes}
          </Button>
        )}
      </div>
    </Card>
  );
}

function BreakEvenPanel(props: {
  cost: number;
  currency: string;
  price: string;
  onPrice: (v: string) => void;
  copy: DesignLedgerCopy;
}) {
  const { copy } = props;
  const price = parseFloat(props.price);
  const be = breakEven(props.cost, isNaN(price) ? 0 : price);
  return (
    <div className="mt-4 space-y-2">
      <div className="font-medium">{copy.breakEven} ({fmtMoney(props.cost, props.currency)})</div>
      <div className="flex flex-wrap items-center gap-2">
        <Label htmlFor="dl-be-price" className="sr-only">
          {copy.pricePerCopy}
        </Label>
        <Input
          id="dl-be-price"
          type="number"
          min="0"
          step="0.01"
          placeholder={copy.pricePerCopy}
          value={props.price}
          onChange={(e) => props.onPrice(e.target.value)}
          className="max-w-[200px] min-h-11"
        />
        <span className="text-sm text-muted-foreground">
          {be.reachable
            ? copy.breakEvenNeed.replace('{copies}', String(be.copies))
            : copy.breakEvenSetPrice}
        </span>
      </div>
    </div>
  );
}
