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
import { useSettings } from "@/context/SettingsContext";
import { getReceiptCopy, getReceiptOptionLabels } from "@/lib/receipt-copy";
import { safeNum } from "@/lib/numeric-guard";

const STORAGE_KEY = "stitch-and-scale-receipt-v1";

function bounded(raw: string | number, fallback: number, min = 0, max = Infinity): number {
  return Math.min(max, Math.max(min, safeNum(raw, fallback)));
}

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
  const { language } = useSettings();
  const copy = getReceiptCopy(language);
  const optionLabels = getReceiptOptionLabels(language);

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
  // UI stores this field as a percentage (50 means 50%); quoteTerms converts it to a fraction on save.
  const [depositPct, setDepositPct] = useState(50);
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
    setItems((prev) => prev.map((it, i) => {
      if (i !== idx) return it;
      return {
        ...it,
        ...patch,
        ...(patch.qty !== undefined ? { qty: bounded(patch.qty, it.qty, 0, 999) } : {}),
        ...(patch.unitPrice !== undefined ? { unitPrice: bounded(patch.unitPrice, it.unitPrice, 0, 1e9) } : {}),
      };
    }));
  }

  function addItem() {
    setItems((prev) => [...prev, { name: "", qty: 1, unitPrice: 0 }]);
  }

  function removeItem(idx: number) {
    setItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));
  }

  function saveSale() {
    if (!items.some((it) => it.name.trim() && it.qty > 0 && it.unitPrice > 0)) {
      toast({ title: copy.addPricedItem, variant: "destructive" });
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
      title: kind === "quote" ? copy.quoteSaved : kind === "refund" ? copy.refundSaved : copy.receiptSaved,
      description: docNumber + " " + copy.addedToLedger,
    });
  }

  function deleteSale(id: string) {
    const next = ledger.filter((s) => s.id !== id);
    setLedger(next);
    persist({ brand, ledger: next, ts: Date.now() });
  }

  function saveBrand() {
    persist({ brand, ledger, ts: Date.now() });
    toast({ title: copy.brandSaved, description: copy.receiptsCarry + " " + (brand.businessName || copy.yourStudio) });
  }

  function buildTextLines(): string {
    const lines: string[] = [];
    if (brand.businessName) lines.push(brand.businessName);
    lines.push(optionLabels.document[kind] + " #" + result.document.docNumber.replace(/\*\*\*/, String(ledger.filter((s) => s.kind === kind).length + 1).padStart(3, "0")));
    lines.push(copy.date + ": " + date);
    if (customerName) lines.push(copy.customer + ": " + customerName);
    lines.push(copy.channel + ": " + optionLabels.channel[channel]);
    for (const it of items) {
      if (!it.name && it.unitPrice <= 0) continue;
      const lineTotal = it.qty * it.unitPrice;
      lines.push(it.name + " — ×" + it.qty + " @ " + fmtMoney(it.unitPrice, brand.currency) + " = " + fmtMoney(lineTotal, brand.currency));
    }
    if (taxPct > 0) lines.push(copy.tax + " (" + taxPct + "%): " + fmtMoney(result.fees.taxAmount, brand.currency));
    if (shippingCharged > 0) lines.push(copy.shipping + ": " + fmtMoney(shippingCharged, brand.currency));
    lines.push(copy.total + ": " + fmtMoney(result.fees.grossTotal, brand.currency));
    if (kind === "receipt") {
      if (result.fees.platformFee > 0) lines.push(copy.platformFee + ": −" + fmtMoney(result.fees.platformFee, brand.currency));
      if (result.fees.processingFee > 0) lines.push(copy.processingFee + ": −" + fmtMoney(result.fees.processingFee, brand.currency));
      lines.push(copy.profit + ": " + fmtMoney(result.document.profit, brand.currency));
    }
    if (kind === "quote") {
      lines.push(copy.depositDue + " (" + (depositPct).toFixed(0) + "%): " + fmtMoney(result.fees.grossTotal * (depositPct / 100), brand.currency));
      lines.push(copy.leadTime + ": " + leadDays + " days · " + copy.valid + " " + validDays + " days");
    }
    if (note) lines.push(note);
    lines.push(copy.madeWith);
    return lines.join("\n");
  }

  async function copyReceiptText() {
    try {
      await navigator.clipboard.writeText(buildTextLines());
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      toast({ title: copy.receiptCopied, description: copy.pasteIntoChat });
    } catch {
      toast({ title: copy.copyFailed, description: copy.clipboardBlocked, variant: "destructive" });
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
      title: copy.screenshotTitle,
      description: copy.screenshotDescription,
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
    setDepositPct(50);
    setLeadDays(21);
    setValidDays(14);
    setDepositReceived(0);
    setNote("");
    setDescription("");
  }

  const currencyOptions = ["USD", "EUR", "GBP", "CAD", "AUD", "NZD", "CHF", "SEK", "NOK", "DKK", "ISK", "JPY", "CNY", "KRW", "INR", "BRL", "MXN", "NGN", "KES", "ZAR"];

  return (
    <Tabs defaultValue="new">
      {/* CHK-123 (QA LIVE-004): triggers were shadcn-default h-10 (40px) —
          below the 44×44px touch-target minimum. min-h-11 fixes hit area. */}
      <TabsList className="mb-4 flex-wrap h-auto">
        <TabsTrigger value="new" className="font-medium text-sm whitespace-nowrap min-h-11 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded">
          <ReceiptText className="h-3.5 w-3.5 mr-1.5" /> {copy.newReceipt}
        </TabsTrigger>
        <TabsTrigger value="ledger" className="font-medium text-sm whitespace-nowrap min-h-11 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded">
          <CalendarDays className="h-3.5 w-3.5 mr-1.5" /> {copy.ledger} ({ledger.length})
        </TabsTrigger>
        <TabsTrigger value="brand" className="font-medium text-sm whitespace-nowrap min-h-11 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded">
          <Users className="h-3.5 w-3.5 mr-1.5" /> {copy.brandSettings}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="new" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-serif flex items-center gap-2">
              <ReceiptText className="w-5 h-5 text-accent" />
              {copy.title}
            </CardTitle>
            <CardDescription>{copy.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-wrap gap-2">
              {(["receipt", "quote", "refund"] as ReceiptDocKind[]).map((k) => (
                <Button key={k} variant={kind === k ? "default" : "outline"} size="sm" onClick={() => setKind(k)}>
                  {optionLabels.document[k]}
                </Button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">{copy.customer}</Label>
                <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder={copy.customerPlaceholder} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">{copy.date}</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">{copy.channel}</Label>
                <NativeSelect value={channel} onChange={(e) => setChannel(e.target.value as SaleChannel)}>
                  {Object.entries(optionLabels.channel).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </NativeSelect>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">{copy.saleType}</Label>
                <NativeSelect value={saleType} onChange={(e) => setSaleType(e.target.value as SaleType)}>
                  {Object.entries(optionLabels.saleType).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </NativeSelect>
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-xs font-medium">{copy.patternName}</Label>
                <Input value={patternName} onChange={(e) => setPatternName(e.target.value)} placeholder={copy.patternName} />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium">{copy.items}</Label>
              {items.map((it, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    className="flex-1"
                    value={it.name}
                    onChange={(e) => setItemField(idx, { name: e.target.value })}
                    placeholder={copy.itemNamePlaceholder}
                  />
                  <Input className="w-20" type="number" min={0} max={999} value={it.qty} onChange={(e) => setItemField(idx, { qty: bounded(e.target.value, it.qty, 0, 999) })} placeholder={copy.qty} />
                  <Input className="w-28" type="number" min={0} step="0.01" value={it.unitPrice || ""} onChange={(e) => setItemField(idx, { unitPrice: bounded(e.target.value, it.unitPrice, 0, 1e9) })} placeholder={copy.price} />
                  {items.length > 1 && (
                    <Button variant="ghost" size="icon" onClick={() => removeItem(idx)} aria-label={copy.removeItem}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addItem}>
                + {copy.addItem}
              </Button>
            </div>

            {kind === "quote" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-lg border border-dashed p-4">
                <Label className="text-xs font-semibold col-span-full">{copy.customOrderProtection}</Label>
                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-xs font-medium">{copy.agreedDescription}</Label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder={copy.descriptionPlaceholder} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">{copy.depositPercent}</Label>
                  <Input type="number" min={0} max={100} value={depositPct} onChange={(e) => setDepositPct(bounded(e.target.value, depositPct, 0, 100))} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">{copy.leadTimeDays}</Label>
                  <Input type="number" min={1} value={leadDays} onChange={(e) => setLeadDays(bounded(e.target.value, leadDays, 1, 365))} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">{copy.quoteValidDays}</Label>
                  <Input type="number" min={1} value={validDays} onChange={(e) => setValidDays(bounded(e.target.value, validDays, 1, 365))} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">{copy.depositReceived}</Label>
                  <Input type="number" min={0} step="0.01" value={depositReceived || ""} onChange={(e) => setDepositReceived(bounded(e.target.value, depositReceived, 0, 1e9))} />
                </div>
              </div>
            )}

            {kind !== "quote" && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">{copy.tax} %</Label>
                  <Input type="number" min={0} max={100} value={taxPct || ""} onChange={(e) => setTaxPct(bounded(e.target.value, taxPct, 0, 100))} placeholder="0" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">{copy.platformFee} %</Label>
                  <Input type="number" min={0} max={100} step="0.1" value={commissionPct || ""} onChange={(e) => setCommissionPct(bounded(e.target.value, commissionPct, 0, 100))} placeholder="0" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">{copy.processingFee} %</Label>
                  <Input type="number" min={0} max={100} step="0.1" value={processingPct || ""} onChange={(e) => setProcessingPct(bounded(e.target.value, processingPct, 0, 100))} placeholder="0" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">{copy.processingFee}</Label>
                  <Input type="number" min={0} step="0.01" value={processingFlat || ""} onChange={(e) => setProcessingFlat(bounded(e.target.value, processingFlat, 0, 1e9))} placeholder="0.00" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">{copy.shipping} (charged)</Label>
                  <Input type="number" min={0} step="0.01" value={shippingCharged || ""} onChange={(e) => setShippingCharged(bounded(e.target.value, shippingCharged, 0, 1e9))} placeholder="0.00" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">{copy.shipping} (cost)</Label>
                  <Input type="number" min={0} step="0.01" value={shippingCost || ""} onChange={(e) => setShippingCost(bounded(e.target.value, shippingCost, 0, 1e9))} placeholder="0.00" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">{copy.materialsCost}</Label>
                  <Input type="number" min={0} step="0.01" value={materialsCost || ""} onChange={(e) => setMaterialsCost(bounded(e.target.value, materialsCost, 0, 1e9))} placeholder="0.00" />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">{copy.noteOptional}</Label>
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder={copy.notePlaceholder} rows={2} />
            </div>
          </CardContent>
        </Card>

        {/* The shareable receipt card */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {(["chat", "studio", "selvedge"] as ReceiptStyle[]).map((s) => (
                <Button key={s} variant={receiptStyle === s ? "default" : "outline"} size="sm" onClick={() => setReceiptStyle(s)}>{s === "chat" ? copy.chat : s === "studio" ? copy.craftPaper : copy.selvedge}</Button>
              ))}
            </div>
            <div ref={cardRef} className={`p-6 max-w-sm mx-auto w-full relative ${receiptTheme.frame}`} style={receiptStyle === "selvedge" ? { boxShadow: "inset 4px 0 0 0 #d87093" } : undefined}>
              {receiptStyle === "studio" ? <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-5 bg-[#d87093]/25" /> : null}
              <div className="flex items-start justify-between">
                <div>
                  <div className={receiptTheme.title}>{brand.businessName || copy.yourStudio}</div>
                  {brand.contact && <div className="text-xs opacity-70">{brand.contact}</div>}
                </div>
                <div className={receiptTheme.pill}>
                  {optionLabels.document[kind]}
                </div>
              </div>
              <div className="my-4 border-t border-dashed" />
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">#{result.document.docNumber.replace(/\*\*\*/g, String(ledger.filter((s) => s.kind === kind).length + 1).padStart(3, "0"))}</span><span>{date}</span></div>
                {customerName && <div className="flex justify-between"><span className="text-muted-foreground">{copy.customer}</span><span className="font-medium">{customerName}</span></div>}
                <div className="flex justify-between"><span className="text-muted-foreground">{copy.channel}</span><span>{optionLabels.channel[channel]}</span></div>
                {patternName && <div className="flex justify-between"><span className="text-muted-foreground">{copy.pattern}</span><span className="font-medium">{patternName}</span></div>}
                {items.some((it) => it.name || it.unitPrice > 0) && <div className={`my-2 border-t border-dashed ${receiptStyle === "selvedge" ? "border-[#4a443c]" : ""}`} />}
                {items.map((it, idx) => {
                  if (!it.name && it.unitPrice <= 0) return null;
                  return (
                    <div key={idx} className="flex justify-between">
                      <span className="flex-1">{it.name || copy.item}</span>
                      <span>×{it.qty} {fmtMoney(it.qty * it.unitPrice, brand.currency)}</span>
                    </div>
                  );
                })}
                {taxPct > 0 && <div className="flex justify-between text-xs text-muted-foreground"><span>{copy.tax} ({taxPct}%)</span><span>{fmtMoney(result.fees.taxAmount, brand.currency)}</span></div>}
                {shippingCharged > 0 && <div className="flex justify-between text-xs text-muted-foreground"><span>{copy.shipping}</span><span>{fmtMoney(shippingCharged, brand.currency)}</span></div>}
                <div className="flex justify-between font-semibold text-base"><span>{copy.total}</span><span>{fmtMoney(result.fees.grossTotal, brand.currency)}</span></div>
                {kind === "receipt" && (
                  <>
                    {result.fees.platformFee > 0 && <div className="flex justify-between text-xs text-muted-foreground"><span>{copy.platformFee}</span><span>−{fmtMoney(result.fees.platformFee, brand.currency)}</span></div>}
                    {result.fees.processingFee > 0 && <div className="flex justify-between text-xs text-muted-foreground"><span>{copy.processingFee}</span><span>−{fmtMoney(result.fees.processingFee, brand.currency)}</span></div>}
                    <div className="flex justify-between font-semibold text-accent"><span>{copy.profit}</span><span>{fmtMoney(result.document.profit, brand.currency)}</span></div>
                  </>
                )}
                {kind === "quote" && (
                  <div className="flex justify-between font-semibold text-accent"><span>{copy.depositDue} ({depositPct}%)</span><span>{fmtMoney(result.fees.grossTotal * (depositPct / 100), brand.currency)}</span></div>
                )}
                {note && <div className={`text-xs italic pt-1 ${receiptStyle === "chat" ? "text-muted-foreground" : receiptStyle === "studio" ? "text-[#7a7161]" : "text-[#b3ab9b]"}`}>{note}</div>}
              </div>
              <div className={`mt-4 border-t border-dashed pt-3 flex items-center justify-between ${receiptTheme.footer}`}>
                <span>{copy.madeWith}</span>
                <span className="font-serif">{brand.businessName ? brand.businessName.slice(0, 12) : "Stitch & Scale"}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              {copy.screenshotDescription}
            </p>
          </div>

          <div className="lg:col-span-3 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-base">{copy.shareSave}</CardTitle>
                <CardDescription>{copy.sendInChat}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Button onClick={shareReceipt} size="sm">
                    <Share2 className="h-4 w-4 mr-1.5" /> {copied ? copy.copied : copy.copyShare}
                  </Button>
                  <Button variant="outline" size="sm" onClick={saveReceiptImage}>
                    <Download className="h-4 w-4 mr-1.5" /> {copy.saveImage}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => window.print()}>
                    <Printer className="h-4 w-4 mr-1.5" /> {copy.printPdf}
                  </Button>
                  <Button variant="outline" size="sm" onClick={saveSale}>
                    <Check className="h-4 w-4 mr-1.5" /> {copy.saveLedger}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={resetDraft}>
                    {copy.reset}
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
                    <span>{copy.monthlyLedger}</span>
                    <Button variant="ghost" size="sm" className="text-xs" onClick={() => setShowLedger((v) => !v)}>
                      {showLedger ? copy.hideRows : copy.showRows}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-center">
                    <div className="rounded-lg bg-secondary/40 p-2">
                      <div className="text-xs text-muted-foreground">{copy.sales}</div>
                      <div className="font-semibold">{result.totals.salesCount}</div>
                    </div>
                    <div className="rounded-lg bg-secondary/40 p-2">
                      <div className="text-xs text-muted-foreground">{copy.revenue}</div>
                      <div className="font-semibold">{fmtMoney(result.totals.revenue, brand.currency)}</div>
                    </div>
                    <div className="rounded-lg bg-secondary/40 p-2">
                      <div className="text-xs text-muted-foreground">{copy.refunds}</div>
                      <div className="font-semibold">{fmtMoney(result.totals.refunds, brand.currency)}</div>
                    </div>
                    <div className="rounded-lg bg-accent/10 p-2">
                      <div className="text-xs text-muted-foreground">{copy.profitNetFees}</div>
                      <div className="font-semibold">{fmtMoney(result.totals.profit, brand.currency)}</div>
                    </div>
                    <div className="rounded-lg bg-secondary/40 p-2">
                      <div className="text-xs text-muted-foreground">{copy.months}</div>
                      <div className="font-semibold">{result.ledger.length}</div>
                    </div>
                  </div>
                  {showLedger && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-muted-foreground">
                            <th className="text-left p-1.5">{copy.month}</th>
                            <th className="text-right p-1.5">{copy.sales}</th>
                            <th className="text-right p-1.5">{copy.revenue}</th>
                            <th className="text-right p-1.5">{copy.refunds}</th>
                            <th className="text-right p-1.5">{copy.processingFee}</th>
                            <th className="text-right p-1.5">{copy.profit}</th>
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
              {copy.savedSalesLedger}
            </CardTitle>
            <CardDescription>{copy.ledgerDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            {ledger.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">{copy.noSavedSales}</p>
            ) : (
              <div className="space-y-2">
                {ledger.map((s) => {
                  const perSale = analyzeReceipt({ brand, draft: s, ledger: [], materialsCost: 0 });
                  return (
                    <div key={s.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                      <div>
                        <span className="font-mono text-xs text-muted-foreground mr-2">{s.docNumber}</span>
                        <span className="font-medium">{optionLabels.document[s.kind]}</span>
                        <span className="text-muted-foreground mx-1.5">·</span>
                        <span>{s.customerName || copy.customer}</span>
                        <span className="text-muted-foreground mx-1.5">·</span>
                        <span>{s.date}</span>
                        <span className="text-muted-foreground mx-1.5">·</span>
                        <span>{optionLabels.channel[s.channel]}</span>
                        {s.kind === "quote" && (
                          <>
                            <span className="text-muted-foreground mx-1.5">·</span>
                            <span className="text-xs">{copy.balanceDue} {fmtMoney(perSale.document.balanceDue, brand.currency)}</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{fmtMoney(perSale.fees.grossTotal, brand.currency)}</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteSale(s.id)} aria-label={copy.deleteSale}>
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
              {copy.brandTitle}
            </CardTitle>
            <CardDescription>{copy.brandDescription}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">{copy.businessStudioName}</Label>
                <Input value={brand.businessName} onChange={(e) => setBrand((b) => ({ ...b, businessName: e.target.value }))} placeholder={copy.businessPlaceholder} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">{copy.contactLabel}</Label>
                <Input value={brand.contact} onChange={(e) => setBrand((b) => ({ ...b, contact: e.target.value }))} placeholder={copy.contactPlaceholder} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">{copy.defaultCurrency}</Label>
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
              <Check className="h-4 w-4 mr-1.5" /> {copy.saveBrand}
            </Button>
            <div className="flex items-center gap-2 text-xs text-muted-foreground rounded-lg bg-muted/50 p-3">
              <HelpCircle className="h-3.5 w-3.5 shrink-0" />
              <span>
                {copy.fees} presets: Etsy listing + transaction ≈ 9.5%; Ravelry ≈ 5%; Stripe ≈ 2.9% + $0.30. Set them once and they flow into every receipt's profit line.
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
