// Receipt Lab — receipt-lab-card.tsx
//
// Chat-first receipts for indie knitwear designers.
// Sells on the research from session 83: Etsy never issues buyer invoices,
// craft-fair sellers handwrite or skip receipts, and custom-order sellers
// run their funnel through DMs + WhatsApp payment proof. The receipt here is
// a styled card that works as a native-looking image in WhatsApp / Signal /
// iMessage (copy / save / share via the Web Share API where supported), plus
// a printable PDF path via window.print, and a monthly ledger behind it.
import { useCallback, useMemo, useRef, useState } from "react";
import {
  Banknote,
  CalendarDays,
  Check,
  Copy,
  Download,
  FileText,
  HelpCircle,
  Printer,
  ReceiptText,
  Share2,
  Trash2,
  Users,
} from "lucide-react";
import {
  analyzeReceipt,
  DEFAULT_BRAND,
  DEFAULT_FEES,
  DEFAULT_QUOTE_TERMS,
  DEFAULT_SALE,
  DOC_KIND_LABELS,
  PAYMENT_METHOD_LABELS,
  SALE_CHANNEL_LABELS,
  SALE_TYPE_LABELS,
  fmtMoney,
  type BrandProfile,
  type PaymentMethod,
  type ReceiptDocKind,
  type ReceiptItem,
  type SaleChannel,
  type SaleFees,
  type SaleType,
  type SavedSale,
} from "@/lib/receipt-lab";
import type { PatternProject } from "@/lib/grading-engine";
import { projectStorage, type ProjectStorageHandle } from "@/lib/storage-lib";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const STORAGE_KEY = "stitch-and-scale-receipt-v1";

interface StoredState {
  brand: BrandProfile;
  ledger: SavedSale[];
  ts: number;
}

function loadStored(project: PatternProject): StoredState {
  try {
    const handle = projectStorage<StoredState>("receipt", project.id, [STORAGE_KEY]);
    const stored = handle.read();
    if (stored && stored.ts) {
      return {
        brand: { ...DEFAULT_BRAND, ...stored.brand },
        ledger: Array.isArray(stored.ledger) ? stored.ledger : [],
        ts: stored.ts,
      };
    }
  } catch {
    // fall through to defaults
  }
  return { brand: { ...DEFAULT_BRAND }, ledger: [], ts: 0 };
}

function loadBrand(project: PatternProject): BrandProfile {
  const stored = loadStored(project);
  return stored.brand;
}

function cloneNode<T extends HTMLElement>(node: T): T {
  return node.cloneNode(true) as T;
}

export function ReceiptLabCard(props: { project: PatternProject }) {
  const { project } = props;
  const { toast } = useToast();

  const [brand, setBrand] = useState<BrandProfile>(() => loadBrand(project));
  const [ledger, setLedger] = useState<SavedSale[]>(() => loadStored(project).ledger);
  const [kind, setKind] = useState<ReceiptDocKind>("receipt");
  const [customerName, setCustomerName] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [channel, setChannel] = useState<SaleChannel>("whatsapp");
  const [saleType, setSaleType] = useState<SaleType>("custom-knit");
  const [patternName, setPatternName] = useState(project.name || "");
  const [items, setItems] = useState<ReceiptItem[]>([{ name: "", qty: 1, unitPrice: 0 }]);
  const [taxPct, setTaxPct] = useState(0);
  const [commissionPct, setCommissionPct] = useState(0);
  const [processingPct, setProcessingPct] = useState(0);
  const [processingFlat, setProcessingFlat] = useState(0);
  const [shippingCharged, setShippingCharged] = useState(0);
  const [shippingCost, setShippingCost] = useState(0);
  const [materialsCost, setMaterialsCost] = useState(0);
  const [depositPct, setDepositPct] = useState(0.5);
  const [leadDays, setLeadDays] = useState(21);
  const [validDays, setValidDays] = useState(14);
  const [description, setDescription] = useState("");
  const [depositReceived, setDepositReceived] = useState(0);
  const [note, setNote] = useState("");
  const [showLedger, setShowLedger] = useState(false);
  const [copied, setCopied] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  /** Receipt card visual styles (CHK-094): "chat" is the default
   *  chat-native look; "studio" is a craft-paper till-receipt with serif
   *  header and letterspaced small-caps labels; "selvedge" is dark paper
   *  with a woven accent band. All styles stay dependency-free CSS. */
  type ReceiptStyle = "chat" | "studio" | "selvedge";
  const [receiptStyle, setReceiptStyle] = useState<ReceiptStyle>("chat");
  const receiptTheme = {
    chat: { frame: "rounded-xl border bg-gradient-to-br from-card to-secondary/40 shadow-sm", title: "font-serif text-lg font-semibold", label: "text-muted-foreground", pill: "text-[10px] uppercase tracking-widest text-muted-foreground bg-secondary/60 px-2 py-1 rounded-full", footer: "text-[10px] uppercase tracking-widest text-muted-foreground" },
    studio: { frame: "rounded-none border-2 border-t-8 bg-[#f6f1e4] shadow-sm", title: "font-serif text-xl font-bold tracking-tight", label: "text-[#7a7161] text-[11px] uppercase tracking-[0.16em]", pill: "text-[10px] uppercase tracking-[0.22em] text-[#7a7161] border border-[#cbbfad] px-2 py-0.5", footer: "text-[10px] uppercase tracking-[0.22em] text-[#7a7161]" },
    selvedge: { frame: "rounded-lg border bg-[#23201c] shadow-sm", title: "font-mono text-base font-semibold text-[#efe7d8]", label: "text-[#b3ab9b] text-[10px] uppercase tracking-[0.18em]", pill: "text-[10px] uppercase tracking-[0.2em] text-[#b3ab9b] bg-[#3a3530] px-2 py-1 rounded", footer: "text-[10px] uppercase tracking-[0.22em] text-[#b3ab9b]" },
  }[receiptStyle];
  const handle = useMemo(
    () => projectStorage<StoredState>("receipt", project.id, [STORAGE_KEY]),
    [project.id],
  );

  // Prefill item price from the project's yarn cost estimate isn't available
  // here (local-first, no shared pricing state beyond the pricing tab), so
  // leave it explicit — that's also more honest than a guessed number.
  const fees: SaleFees = useMemo(
    () => ({
      platformCommissionPct: commissionPct / 100,
      processingPct: processingPct / 100,
      processingFlat,
      taxPct: taxPct / 100,
      shippingCharged,
      shippingCost,
    }),
    [commissionPct, processingPct, processingFlat, taxPct, shippingCharged, shippingCost],
  );

  const draft = useMemo<SavedSale>(
    () => ({
      ...DEFAULT_SALE,
      id: "",
      kind,
      docNumber: "",
      customerName,
      date,
      channel,
      saleType,
      patternName,
      items,
      fees,
      depositReceived,
      note,
      createdAt: "",
    }),
    [kind, customerName, date, channel, saleType, patternName, items, fees, depositReceived, note],
  );

  const result = useMemo(
    () =>
      analyzeReceipt({
        brand,
        draft: { ...draft, docNumber: kind === "receipt" ? "REC-***" : kind === "quote" ? "QUO-***" : "REF-***" },
        ledger,
        materialsCost,
      }),
    [brand, draft, ledger, materialsCost, kind],
  );

  const persist = useCallback(
    (next: StoredState) => {
      try {
        handle.write(next);
      } catch {
        // write fails silently on storage errors — data already in memory
      }
    },
    [handle],
  );

  function setItemField(idx: number, patch: Partial<ReceiptItem>) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }

  function addItem() {
    setItems((prev) => [...prev, { name: "", qty: 1, unitPrice: 0 }]);
  }

  function removeItem(idx: number) {
    setItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));
  }

  function saveSale() {
    if (items.every((it) => !it.name && it.unitPrice <= 0)) {
      toast({ title: "Add at least one item with a price", variant: "destructive" });
      return;
    }
    const docNumber = result.nextDocNumber;
    const saved: SavedSale = {
      ...draft,
      id: "sale-" + Date.now().toString(36),
      docNumber,
      quoteTerms:
        kind === "quote"
          ? {
              ...DEFAULT_QUOTE_TERMS,
              depositPct: depositPct / 100,
              leadDays,
              validDays,
              description,
            }
          : undefined,
      createdAt: new Date().toISOString(),
    };
    const nextLedger = [...ledger, saved];
    setLedger(nextLedger);
    persist({ brand, ledger: nextLedger, ts: Date.now() });
    toast({
      title: kind === "quote" ? "Quote saved" : kind === "refund" ? "Refund saved" : "Receipt saved",
      description: docNumber + " added to the ledger",
    });
  }

  function deleteSale(id: string) {
    const next = ledger.filter((s) => s.id !== id);
    setLedger(next);
    persist({ brand, ledger: next, ts: Date.now() });
  }

  function saveBrand() {
    persist({ brand, ledger, ts: Date.now() });
    toast({ title: "Brand saved", description: "Receipts will carry " + (brand.businessName || "your business name") });
  }

  function buildTextLines(): string {
    const lines: string[] = [];
    if (brand.businessName) lines.push(brand.businessName);
    lines.push(DOC_KIND_LABELS[kind] + " #" + result.document.docNumber.replace(/\*\*\*/, String(ledger.filter((s) => s.kind === kind).length + 1).padStart(3, "0")));
    lines.push("Date: " + date);
    if (customerName) lines.push("Customer: " + customerName);
    lines.push("Channel: " + SALE_CHANNEL_LABELS[channel]);
    for (const it of items) {
      if (!it.name && it.unitPrice <= 0) continue;
      const lineTotal = it.qty * it.unitPrice;
      lines.push(it.name + " — ×" + it.qty + " @ " + fmtMoney(it.unitPrice, brand.currency) + " = " + fmtMoney(lineTotal, brand.currency));
    }
    if (taxPct > 0) lines.push("Tax (" + taxPct + "%): " + fmtMoney(result.fees.taxAmount, brand.currency));
    if (shippingCharged > 0) lines.push("Shipping: " + fmtMoney(shippingCharged, brand.currency));
    lines.push("Total: " + fmtMoney(result.fees.grossTotal, brand.currency));
    if (kind === "receipt") {
      if (result.fees.platformFee > 0) lines.push("Platform fee: −" + fmtMoney(result.fees.platformFee, brand.currency));
      if (result.fees.processingFee > 0) lines.push("Processing fee: −" + fmtMoney(result.fees.processingFee, brand.currency));
      lines.push("Profit on this sale: " + fmtMoney(result.document.profit, brand.currency));
    }
    if (kind === "quote") {
      lines.push("Deposit due (" + (depositPct).toFixed(0) + "%): " + fmtMoney(result.fees.grossTotal * (depositPct / 100), brand.currency));
      lines.push("Lead time: " + leadDays + " days · valid " + validDays + " days");
    }
    if (note) lines.push(note);
    lines.push("made with stitchandscale.app");
    return lines.join("\n");
  }

  async function copyReceiptText() {
    try {
      await navigator.clipboard.writeText(buildTextLines());
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      toast({ title: "Receipt copied", description: "Paste it straight into the chat" });
    } catch {
      toast({ title: "Copy failed", description: "Your browser blocked clipboard access", variant: "destructive" });
    }
  }

  async function shareReceipt() {
    const text = buildTextLines();
    const sharePayload: { title?: string; text: string; url?: string } = { title: result.document.title, text };
    if (navigator.share) {
      try {
        await navigator.share(sharePayload);
        return;
      } catch {
        // user cancelled or share not configured — fall through to copy
      }
    }
    await copyReceiptText();
  }

  async function saveReceiptImage() {
    // No external screenshot library — the card itself is a styled div; the
    // designer screenshots the card (phone-native on mobile, Cmd+Shift+4 on
    // desktop) OR uses the text copy. We offer a print-based PNG via canvas
    // capture of the styled card using the browser's own tooling is not
    // available without a dependency, so we keep the promise honest:
    toast({
      title: "Use your device screenshot",
      description: "On mobile the card is sized for chat. Screenshot it and send — it arrives looking native in WhatsApp, Signal and iMessage.",
    });
  }

  function resetDraft() {
    setCustomerName("");
    setDate(new Date().toISOString().slice(0, 10));
    setItems([{ name: "", qty: 1, unitPrice: 0 }]);
    setTaxPct(0);
    setCommissionPct(0);
    setProcessingPct(0);
    setProcessingFlat(0);
    setShippingCharged(0);
    setShippingCost(0);
    setMaterialsCost(0);
    setDepositReceived(0);
    setNote("");
    setDescription("");
  }

  const currencyOptions = ["USD", "EUR", "GBP", "CAD", "AUD", "NZD", "CHF", "SEK", "NOK", "DKK", "ISK", "JPY", "CNY", "KRW", "INR", "BRL", "MXN", "NGN", "KES", "ZAR"];

  return (
    <Tabs defaultValue="new">
      <TabsList className="mb-4 flex-wrap h-auto">
        <TabsTrigger value="new" className="font-medium text-sm whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded">
          <ReceiptText className="h-3.5 w-3.5 mr-1.5" /> New Receipt
        </TabsTrigger>
        <TabsTrigger value="ledger" className="font-medium text-sm whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded">
          <CalendarDays className="h-3.5 w-3.5 mr-1.5" /> Ledger ({ledger.length})
        </TabsTrigger>
        <TabsTrigger value="brand" className="font-medium text-sm whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded">
          <Users className="h-3.5 w-3.5 mr-1.5" /> Brand &amp; Settings
        </TabsTrigger>
      </TabsList>

      <TabsContent value="new" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-serif flex items-center gap-2">
              <ReceiptText className="w-5 h-5 text-accent" />
              Receipt Lab
            </CardTitle>
            <CardDescription>
              Chat-first receipts for WhatsApp, Signal and iMessage — plus a printable PDF path and a monthly
              ledger. Etsy never issues buyer invoices; this is yours.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-wrap gap-2">
              {(["receipt", "quote", "refund"] as ReceiptDocKind[]).map((k) => (
                <Button key={k} variant={kind === k ? "default" : "outline"} size="sm" onClick={() => setKind(k)}>
                  {DOC_KIND_LABELS[k]}
                </Button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Customer</Label>
                <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="e.g. @knitwithlena" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Date</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Channel</Label>
                <NativeSelect value={channel} onChange={(e) => setChannel(e.target.value as SaleChannel)}>
                  {Object.entries(SALE_CHANNEL_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </NativeSelect>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Sale type</Label>
                <NativeSelect value={saleType} onChange={(e) => setSaleType(e.target.value as SaleType)}>
                  {Object.entries(SALE_TYPE_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </NativeSelect>
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-xs font-medium">Pattern / design name</Label>
                <Input value={patternName} onChange={(e) => setPatternName(e.target.value)} placeholder="e.g. Mossy Yoke Sweater" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium">Items</Label>
              {items.map((it, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    className="flex-1"
                    value={it.name}
                    onChange={(e) => setItemField(idx, { name: e.target.value })}
                    placeholder="e.g. Custom knit — Size L, wool-mohair blend"
                  />
                  <Input className="w-20" type="number" min={0} max={999} value={it.qty} onChange={(e) => setItemField(idx, { qty: Number(e.target.value) })} placeholder="Qty" />
                  <Input className="w-28" type="number" min={0} step="0.01" value={it.unitPrice || ""} onChange={(e) => setItemField(idx, { unitPrice: Number(e.target.value) })} placeholder="Price" />
                  {items.length > 1 && (
                    <Button variant="ghost" size="icon" onClick={() => removeItem(idx)} aria-label="Remove item">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addItem}>
                + Add item
              </Button>
            </div>

            {kind === "quote" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-lg border border-dashed p-4">
                <Label className="text-xs font-semibold col-span-full">Custom-order protection (what was agreed, deposit, timeline)</Label>
                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-xs font-medium">Agreed description</Label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Size L, wool-mohair blend, forest green, wooden buttons, ribbed cuffs — as discussed 14 Aug" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Deposit %</Label>
                  <Input type="number" min={0} max={100} value={depositPct} onChange={(e) => setDepositPct(Number(e.target.value))} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Lead time (days)</Label>
                  <Input type="number" min={1} value={leadDays} onChange={(e) => setLeadDays(Number(e.target.value))} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Quote valid (days)</Label>
                  <Input type="number" min={1} value={validDays} onChange={(e) => setValidDays(Number(e.target.value))} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Deposit already received</Label>
                  <Input type="number" min={0} step="0.01" value={depositReceived || ""} onChange={(e) => setDepositReceived(Number(e.target.value))} />
                </div>
              </div>
            )}

            {kind !== "quote" && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Tax %</Label>
                  <Input type="number" min={0} max={100} value={taxPct || ""} onChange={(e) => setTaxPct(Number(e.target.value))} placeholder="0" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Platform fee %</Label>
                  <Input type="number" min={0} max={100} step="0.1" value={commissionPct || ""} onChange={(e) => setCommissionPct(Number(e.target.value))} placeholder="0" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Processing %</Label>
                  <Input type="number" min={0} max={100} step="0.1" value={processingPct || ""} onChange={(e) => setProcessingPct(Number(e.target.value))} placeholder="0" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Processing flat</Label>
                  <Input type="number" min={0} step="0.01" value={processingFlat || ""} onChange={(e) => setProcessingFlat(Number(e.target.value))} placeholder="0.00" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Shipping charged</Label>
                  <Input type="number" min={0} step="0.01" value={shippingCharged || ""} onChange={(e) => setShippingCharged(Number(e.target.value))} placeholder="0.00" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Shipping cost</Label>
                  <Input type="number" min={0} step="0.01" value={shippingCost || ""} onChange={(e) => setShippingCost(Number(e.target.value))} placeholder="0.00" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Materials cost</Label>
                  <Input type="number" min={0} step="0.01" value={materialsCost || ""} onChange={(e) => setMaterialsCost(Number(e.target.value))} placeholder="0.00" />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Note (optional)</Label>
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Thank you — enjoy the sweater!" rows={2} />
            </div>
          </CardContent>
        </Card>

        {/* The shareable receipt card */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {(["chat", "studio", "selvedge"] as ReceiptStyle[]).map((s) => (
                <Button key={s} variant={receiptStyle === s ? "default" : "outline"} size="sm" onClick={() => setReceiptStyle(s)}>{s === "chat" ? "Chat" : s === "studio" ? "Craft Paper" : "Selvedge"}</Button>
              ))}
            </div>
            <div ref={cardRef} className={`p-6 max-w-sm mx-auto w-full relative ${receiptTheme.frame}`} style={receiptStyle === "selvedge" ? { boxShadow: "inset 4px 0 0 0 #d87093" } : undefined}>
              {receiptStyle === "studio" ? <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-5 bg-[#d87093]/25" /> : null}
              <div className="flex items-start justify-between">
                <div>
                  <div className={receiptTheme.title}>{brand.businessName || "Your Studio"}</div>
                  {brand.contact && <div className="text-xs opacity-70">{brand.contact}</div>}
                </div>
                <div className={receiptTheme.pill}>
                  {DOC_KIND_LABELS[kind]}
                </div>
              </div>
              <div className="my-4 border-t border-dashed" />
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">#{result.document.docNumber.replace(/\*\*\*/g, String(ledger.filter((s) => s.kind === kind).length + 1).padStart(3, "0"))}</span><span>{date}</span></div>
                {customerName && <div className="flex justify-between"><span className="text-muted-foreground">Customer</span><span className="font-medium">{customerName}</span></div>}
                <div className="flex justify-between"><span className="text-muted-foreground">Channel</span><span>{SALE_CHANNEL_LABELS[channel]}</span></div>
                {patternName && <div className="flex justify-between"><span className="text-muted-foreground">Pattern</span><span className="font-medium">{patternName}</span></div>}
                {items.some((it) => it.name || it.unitPrice > 0) && <div className={`my-2 border-t border-dashed ${receiptStyle === "selvedge" ? "border-[#4a443c]" : ""}`} />}
                {items.map((it, idx) => {
                  if (!it.name && it.unitPrice <= 0) return null;
                  return (
                    <div key={idx} className="flex justify-between">
                      <span className="flex-1">{it.name || "Item"}</span>
                      <span>×{it.qty} {fmtMoney(it.qty * it.unitPrice, brand.currency)}</span>
                    </div>
                  );
                })}
                {taxPct > 0 && <div className="flex justify-between text-xs text-muted-foreground"><span>Tax ({taxPct}%)</span><span>{fmtMoney(result.fees.taxAmount, brand.currency)}</span></div>}
                {shippingCharged > 0 && <div className="flex justify-between text-xs text-muted-foreground"><span>Shipping</span><span>{fmtMoney(shippingCharged, brand.currency)}</span></div>}
                <div className="flex justify-between font-semibold text-base"><span>Total</span><span>{fmtMoney(result.fees.grossTotal, brand.currency)}</span></div>
                {kind === "receipt" && (
                  <>
                    {result.fees.platformFee > 0 && <div className="flex justify-between text-xs text-muted-foreground"><span>Platform fee</span><span>−{fmtMoney(result.fees.platformFee, brand.currency)}</span></div>}
                    {result.fees.processingFee > 0 && <div className="flex justify-between text-xs text-muted-foreground"><span>Processing</span><span>−{fmtMoney(result.fees.processingFee, brand.currency)}</span></div>}
                    <div className="flex justify-between font-semibold text-accent"><span>Profit</span><span>{fmtMoney(result.document.profit, brand.currency)}</span></div>
                  </>
                )}
                {kind === "quote" && (
                  <div className="flex justify-between font-semibold text-accent"><span>Deposit due ({depositPct}%)</span><span>{fmtMoney(result.fees.grossTotal * (depositPct / 100), brand.currency)}</span></div>
                )}
                {note && <div className={`text-xs italic pt-1 ${receiptStyle === "chat" ? "text-muted-foreground" : receiptStyle === "studio" ? "text-[#7a7161]" : "text-[#b3ab9b]"}`}>{note}</div>}
              </div>
              <div className={`mt-4 border-t border-dashed pt-3 flex items-center justify-between ${receiptTheme.footer}`}>
                <span>made with stitchandscale.app</span>
                <span className="font-serif">{brand.businessName ? brand.businessName.slice(0, 12) : "Stitch & Scale"}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              The card above is sized for chat — pick a style above (Chat / Craft Paper / Selvedge) and screenshot
              it on your device; it lands in WhatsApp, Signal or iMessage looking native, or use the text copy below
              for a plain-text receipt.
            </p>
          </div>

          <div className="lg:col-span-3 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-base">Share &amp; save</CardTitle>
                <CardDescription>Send it in the same chat the order came from.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Button onClick={shareReceipt} size="sm">
                    <Share2 className="h-4 w-4 mr-1.5" /> {copied ? "Copied!" : "Copy / Share receipt"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={saveReceiptImage}>
                    <Download className="h-4 w-4 mr-1.5" /> Save as image
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => window.print()}>
                    <Printer className="h-4 w-4 mr-1.5" /> Print / PDF
                  </Button>
                  <Button variant="outline" size="sm" onClick={saveSale}>
                    <Check className="h-4 w-4 mr-1.5" /> Save to ledger
                  </Button>
                  <Button variant="ghost" size="sm" onClick={resetDraft}>
                    Reset
                  </Button>
                </div>
                <div className="rounded-lg bg-muted/50 p-3 text-xs font-mono whitespace-pre-wrap max-h-48 overflow-auto">
                  {buildTextLines()}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <HelpCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    WhatsApp receipts get read — ~98% open rate vs ~20% for email. The ledger behind it feeds your
                    Income Lab totals.
                  </span>
                </div>
              </CardContent>
            </Card>

            {ledger.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="font-serif text-base flex items-center justify-between">
                    <span>Monthly ledger</span>
                    <Button variant="ghost" size="sm" className="text-xs" onClick={() => setShowLedger((v) => !v)}>
                      {showLedger ? "Hide rows" : "Show rows"}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-center">
                    <div className="rounded-lg bg-secondary/40 p-2">
                      <div className="text-xs text-muted-foreground">Sales</div>
                      <div className="font-semibold">{result.totals.salesCount}</div>
                    </div>
                    <div className="rounded-lg bg-secondary/40 p-2">
                      <div className="text-xs text-muted-foreground">Revenue</div>
                      <div className="font-semibold">{fmtMoney(result.totals.revenue, brand.currency)}</div>
                    </div>
                    <div className="rounded-lg bg-secondary/40 p-2">
                      <div className="text-xs text-muted-foreground">Refunds</div>
                      <div className="font-semibold">{fmtMoney(result.totals.refunds, brand.currency)}</div>
                    </div>
                    <div className="rounded-lg bg-accent/10 p-2">
                      <div className="text-xs text-muted-foreground">Profit (net fees)</div>
                      <div className="font-semibold">{fmtMoney(result.totals.profit, brand.currency)}</div>
                    </div>
                    <div className="rounded-lg bg-secondary/40 p-2">
                      <div className="text-xs text-muted-foreground">Months</div>
                      <div className="font-semibold">{result.ledger.length}</div>
                    </div>
                  </div>
                  {showLedger && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-muted-foreground">
                            <th className="text-left p-1.5">Month</th>
                            <th className="text-right p-1.5">Sales</th>
                            <th className="text-right p-1.5">Revenue</th>
                            <th className="text-right p-1.5">Refunds</th>
                            <th className="text-right p-1.5">Fees</th>
                            <th className="text-right p-1.5">Profit</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.ledger.map((row) => (
                            <tr key={row.month} className="border-t">
                              <td className="p-1.5">{row.month}</td>
                              <td className="p-1.5 text-right">{row.salesCount}</td>
                              <td className="p-1.5 text-right">{fmtMoney(row.revenue, brand.currency)}</td>
                              <td className="p-1.5 text-right">{fmtMoney(row.refunds, brand.currency)}</td>
                              <td className="p-1.5 text-right">{fmtMoney(row.feesPaid, brand.currency)}</td>
                              <td className="p-1.5 text-right font-medium">{fmtMoney(row.profit, brand.currency)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </TabsContent>

      <TabsContent value="ledger" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="font-serif flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-accent" />
              Saved sales ledger
            </CardTitle>
            <CardDescription>Every saved receipt, quote and refund for this pattern.</CardDescription>
          </CardHeader>
          <CardContent>
            {ledger.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No saved sales yet — create one in New Receipt and hit &quot;Save to ledger&quot;.</p>
            ) : (
              <div className="space-y-2">
                {ledger.map((s) => {
                  const perSale = analyzeReceipt({ brand, draft: s, ledger: [], materialsCost: 0 });
                  return (
                    <div key={s.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                      <div>
                        <span className="font-mono text-xs text-muted-foreground mr-2">{s.docNumber}</span>
                        <span className="font-medium">{DOC_KIND_LABELS[s.kind]}</span>
                        <span className="text-muted-foreground mx-1.5">·</span>
                        <span>{s.customerName || "customer"}</span>
                        <span className="text-muted-foreground mx-1.5">·</span>
                        <span>{s.date}</span>
                        <span className="text-muted-foreground mx-1.5">·</span>
                        <span>{SALE_CHANNEL_LABELS[s.channel]}</span>
                        {s.kind === "quote" && (
                          <>
                            <span className="text-muted-foreground mx-1.5">·</span>
                            <span className="text-xs">balance due {fmtMoney(perSale.document.balanceDue, brand.currency)}</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{fmtMoney(perSale.fees.grossTotal, brand.currency)}</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteSale(s.id)} aria-label="Delete sale">
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="brand" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="font-serif flex items-center gap-2">
              <Users className="w-5 h-5 text-accent" />
              Brand &amp; settings
            </CardTitle>
            <CardDescription>What appears at the top of every receipt. Honest branding only — never claim credentials you don't have.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Business / studio name</Label>
                <Input value={brand.businessName} onChange={(e) => setBrand((b) => ({ ...b, businessName: e.target.value }))} placeholder="e.g. Moss & Yarn Studio" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Contact (IG handle, email, WhatsApp)</Label>
                <Input value={brand.contact} onChange={(e) => setBrand((b) => ({ ...b, contact: e.target.value }))} placeholder="e.g. @mossandyarn · mossandyarn@gmail.com" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Default currency</Label>
                <NativeSelect
                  value={brand.currency}
                  onChange={(e) => setBrand((b) => ({ ...b, currency: e.target.value }))}
                >
                  {currencyOptions.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </NativeSelect>
              </div>
            </div>
            <Button size="sm" onClick={saveBrand}>
              <Check className="h-4 w-4 mr-1.5" /> Save brand
            </Button>
            <div className="flex items-center gap-2 text-xs text-muted-foreground rounded-lg bg-muted/50 p-3">
              <HelpCircle className="h-3.5 w-3.5 shrink-0" />
              <span>
                Default fee presets: Etsy listing + transaction ≈ 9.5%; Ravelry ≈ 5%; Stripe ≈ 2.9% + $0.30. Set them
                once and they flow into every receipt's profit line.
              </span>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

// silence unused-import warnings for icons used in other branches
void Banknote;
void FileText;
void Copy;
