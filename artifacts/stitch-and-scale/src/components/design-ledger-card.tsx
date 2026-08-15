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

function receiptSaleRows(receiptStored: ReceiptStoredState, currency: string): DesignLedgerSaleRow[] {
  const ledger = receiptStored.ledger ?? [];
  return ledger
    .filter((row) => row && typeof row.kind === "string" && (row.kind === "receipt" || row.kind === "refund"))
    .map((row) => {
      const qtyTotal = (row.items ?? []).reduce((s, it) => s + (it.qty ?? 0), 0);
      const feesTotal =
        (row.fees?.platformFee ?? 0) + (row.fees?.processingFee ?? 0) + (row.fees?.taxAmount ?? 0) + (row.fees?.shippingCost ?? 0);
      const gross = typeof row.grossTotal === "number" ? row.grossTotal : 0;
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
  const handle = useMemo(
    () => projectStorage<StoredState>("designledger", project.id, [LEGACY_STORAGE_KEY]),
    [project.id],
  );
  const [state, setState] = useState<StoredState>(() => loadStored(project));
  const [receiptStored, setReceiptStored] = useState<ReceiptStoredState>(() => {
    try {
      const r = localStorage.getItem(`stitch-and-scale-receipt-${project.id}`);
      return r ? (JSON.parse(r) as ReceiptStoredState) : {};
    } catch {
      return {};
    }
  });
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
    toast({ title: "Ledger exported", description: "design-ledger.csv downloaded — accountant-ready." });
  };

  const copySummary = async () => {
    const summary = exportLedgerSummary(roll, studioName);
    try {
      await navigator.clipboard.writeText(summary);
      toast({ title: "Summary copied", description: "Paste it anywhere — tax chats, DMs, notes." });
    } catch {
      toast({ title: "Could not copy", description: "Use the CSV export instead." });
    }
  };

  return (
    <div ref={cardRef} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-serif flex items-center gap-2">
            <BookMarked className="h-5 w-5" /> Design Ledger
          </CardTitle>
          <CardDescription>
            The record room — every design, every cost, every sale in one place.
            Sales flow in automatically from the Receipt Lab. Local-first; when
            sign-in arrives, your account id links this ledger to your cloud
            copy with no re-creation needed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="studio">
            <TabsList className="flex-wrap h-auto">
              <TabsTrigger value="studio">Studio</TabsTrigger>
              <TabsTrigger value="designs">Designs ({state.designs.length})</TabsTrigger>
              <TabsTrigger value="costs">Costs ({state.expenses.length})</TabsTrigger>
              <TabsTrigger value="export">Export</TabsTrigger>
            </TabsList>

            <TabsContent value="studio" className="space-y-4 pt-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <Label htmlFor="dl-studio-name">Studio name</Label>
                  <Input
                    id="dl-studio-name"
                    value={state.studioName}
                    placeholder="Your brand / studio"
                    onChange={(e) => persist({ ...state, studioName: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="dl-currency">Currency</Label>
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
                  <Label htmlFor="dl-auth-bridge">Account bridge</Label>
                  <Input
                    id="dl-auth-bridge"
                    value={state.authId || "not signed in yet"}
                    readOnly
                    className="text-muted-foreground"
                  />
                </div>
              </div>

              <div className="grid gap-3 pt-2 sm:grid-cols-2 lg:grid-cols-5">
                <Stat label="Pipeline designs" value={String(state.designs.length)} />
                <Stat label="Published" value={String(roll.publishedCount)} />
                <Stat label="Sales" value={String(roll.totalSales)} />
                <Stat label="Revenue" value={fmt(roll.totalRevenue)} />
                <Stat label="Profit after fees &amp; costs" value={fmt(roll.totalProfit)} strong />
              </div>

              {roll.monthly.length > 0 && (
                <div className="pt-2">
                  <div className="text-sm font-medium mb-2">Monthly P&amp;L</div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-muted-foreground border-b">
                          <th className="text-left py-1 pr-4">Month</th>
                          <th className="text-right py-1 pr-4">Revenue</th>
                          <th className="text-right py-1 pr-4">Design costs</th>
                          <th className="text-right py-1">Profit</th>
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
                  placeholder="Design name — e.g. Mossy Yoke Sweater"
                  onChange={(e) => setDesignName(e.target.value)}
                  className="max-w-xs"
                />
                <Input
                  value={designNotes}
                  placeholder="Notes (optional)"
                  onChange={(e) => setDesignNotes(e.target.value)}
                  className="max-w-xs"
                />
                <Button
                  size="sm"
                  onClick={() => {
                    if (!designName.trim()) {
                      toast({ title: "Name required", description: "A design needs at least a name." });
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
                    toast({ title: "Design added", description: "It starts at Concept — move it along as it grows." });
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add design
                </Button>
              </div>

              {state.designs.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No designs recorded yet. Add your first — one name is enough.
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
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="costs" className="space-y-4 pt-4">
              <div className="flex flex-wrap items-end gap-2">
                <div>
                  <Label htmlFor="dl-cost-design">Design (optional — studio overhead if empty)</Label>
                  <NativeSelect
                    id="dl-cost-design"
                    value={expDesign}
                    onChange={(e) => setExpDesign(e.target.value)}
                  >
                    <option value="">— overhead —</option>
                    {state.designs.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </NativeSelect>
                </div>
                <div>
                  <Label htmlFor="dl-cost-cat">Category</Label>
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
                  <Label htmlFor="dl-cost-desc">What for</Label>
                  <Input id="dl-cost-desc" value={expDesc} placeholder="e.g. sample yarn" onChange={(e) => setExpDesc(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="dl-cost-amt">Amount</Label>
                  <Input id="dl-cost-amt" type="number" min="0" step="0.01" value={expAmount} placeholder="0.00" onChange={(e) => setExpAmount(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="dl-cost-date">Date</Label>
                  <Input id="dl-cost-date" type="date" value={expDate} onChange={(e) => setExpDate(e.target.value)} />
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    const amount = parseFloat(expAmount);
                    if (!(amount > 0)) {
                      toast({ title: "Amount required", description: "Enter the cost as a positive number." });
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
                    toast({ title: "Cost recorded" });
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" /> Record cost
                </Button>
              </div>

              {state.expenses.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No costs recorded yet. Yarn for samples, tech edits, test-knit
                  fees — log each once and the ledger does the rest.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-muted-foreground border-b">
                        <th className="text-left py-1 pr-4">Date</th>
                        <th className="text-left py-1 pr-4">Design</th>
                        <th className="text-left py-1 pr-4">Category</th>
                        <th className="text-left py-1 pr-4">What for</th>
                        <th className="text-right py-1 pr-4">Amount</th>
                        <th className="py-1" />
                      </tr>
                    </thead>
                    <tbody>
                      {[...state.expenses].reverse().map((e) => (
                        <tr key={e.id} className="border-b">
                          <td className="py-1.5 pr-4">{e.date}</td>
                          <td className="py-1.5 pr-4">
                            {state.designs.find((d) => d.id === e.designId)?.name || "—"}
                          </td>
                          <td className="py-1.5 pr-4">{ExpenseCategoryLabels[e.category]}</td>
                          <td className="py-1.5 pr-4">{e.description || "—"}</td>
                          <td className="py-1.5 pr-4 text-right">{fmtMoney(e.amount, e.currency || state.currency)}</td>
                          <td className="py-1.5">
                            <button
                              aria-label="Remove cost"
                              className="text-muted-foreground hover:text-destructive"
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
                Accountant-ready. The CSV lists every design, cost, and sale
                with dates and categories; the summary is a one-glance number
                sheet you can paste into any message.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={exportCsv}>
                  <FileSpreadsheet className="h-4 w-4 mr-1" /> Download CSV
                </Button>
                <Button size="sm" variant="secondary" onClick={copySummary}>
                  <Copy className="h-4 w-4 mr-1" /> Copy summary
                </Button>
              </div>
              <div className="text-sm">
                <BreakEvenPanel
                  cost={roll.totalCost}
                  currency={state.currency}
                  price={breakEvenPrice}
                  onPrice={setBreakEvenPrice}
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
}) {
  const { design, currency, summary, onStatus, onNotes, onRemove } = props;
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
            cost {fmtMoney(summary.costTotal, currency)} · revenue{" "}
            {fmtMoney(summary.revenueTotal, currency)} · sales {summary.salesCount} ·
            profit {fmtMoney(summary.profitAttributed, currency)}
          </span>
        )}
        <button
          aria-label="Remove design"
          className="ml-auto text-muted-foreground hover:text-destructive"
          onClick={onRemove}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="mt-2 flex gap-2">
        <Textarea
          value={notes}
          placeholder="Notes — swatch yarn, sizes planned, launch ideas…"
          className="min-h-[56px]"
          onChange={(e) => {
            setNotes(e.target.value);
            setNoteSet(false);
          }}
          onBlur={commitNotes}
        />
        {!noteSet && notes !== design.notes && (
          <Button size="sm" variant="ghost" onClick={commitNotes}>
            Save notes
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
}) {
  const price = parseFloat(props.price);
  const be = breakEven(props.cost, isNaN(price) ? 0 : price);
  return (
    <div className="mt-4 space-y-2">
      <div className="font-medium">Break-even against recorded costs ({fmtMoney(props.cost, props.currency)})</div>
      <div className="flex flex-wrap items-center gap-2">
        <Label htmlFor="dl-be-price" className="sr-only">
          Price per copy
        </Label>
        <Input
          id="dl-be-price"
          type="number"
          min="0"
          step="0.01"
          placeholder="Price per copy, e.g. 12.00"
          value={props.price}
          onChange={(e) => props.onPrice(e.target.value)}
          className="max-w-[200px]"
        />
        <span className="text-sm text-muted-foreground">
          {be.reachable
            ? `You need ${be.copies} sale${be.copies === 1 ? "" : "s"} at this price to cover every cost in this ledger.`
            : "Set a price first — the ledger is waiting."}
        </span>
      </div>
    </div>
  );
}
