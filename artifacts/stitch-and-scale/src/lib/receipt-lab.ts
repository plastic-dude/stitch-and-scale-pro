// Receipt Lab — receipt-lab.ts
//
// Chat-first receipts for indie knitwear designers.
//
// WHY THIS EXISTS (session 83, Aug 2026):
// - Etsy issues order confirmations but NEVER buyer invoices — sellers in
//   seller groups repeatedly ask how to invoice wholesale/custom buyers.
// - Craft-fair sellers still handwrite receipts or keep yellow-highlighted
//   Excel rows; QuickBooks is accounting-scariness, Square is payments-gated.
// - Custom-order sellers run their funnel through Instagram DMs -> WhatsApp
//   payment proof. The receipt lives in chat, not email. WhatsApp messages
//   have ~98% open rate vs ~20% for email (SimpleReceiptMaker data).
// - Nobody combines chat-first receipts + a sales ledger + per-sale profit
//   using the pattern's own cost data.
//
// Honest-branding guard (docs/brand-voice-brief.md Rule 1): nothing in this
// module invents designer credentials on the receipt — it renders only what
// the designer actually configured.
export type ReceiptDocKind = "receipt" | "quote" | "refund";

export const DOC_KIND_LABELS: Record<ReceiptDocKind, string> = {
  receipt: "Receipt",
  quote: "Order Quote",
  refund: "Refund Note",
};

export type PaymentMethod =
  | "cash"
  | "bank-transfer"
  | "paypal"
  | "stripe"
  | "card"
  | "other";

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Cash",
  "bank-transfer": "Bank Transfer",
  paypal: "PayPal",
  stripe: "Stripe",
  card: "Card",
  other: "Other",
};

export type SaleChannel =
  | "whatsapp"
  | "instagram"
  | "etsy"
  | "ravelry"
  | "own-site"
  | "market"
  | "boutique"
  | "other";

export const SALE_CHANNEL_LABELS: Record<SaleChannel, string> = {
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  etsy: "Etsy",
  ravelry: "Ravelry",
  "own-site": "Own Website",
  market: "Market / Craft Fair",
  boutique: "Boutique",
  other: "Other",
};

export type SaleType = "pattern" | "custom-knit" | "item";

export const SALE_TYPE_LABELS: Record<SaleType, string> = {
  pattern: "Pattern",
  "custom-knit": "Custom Knit",
  item: "Finished Item",
};

export interface ReceiptItem {
  /** e.g. "Mossy Yoke Sweater — Size M (custom knit)" */
  name: string;
  /** quantity — patterns usually 1; items can be multi */
  qty: number;
  unitPrice: number;
}

/** Fees the seller pays per sale (platform cut, payment processing). */
export interface SaleFees {
  /** platform commission %, 0-1 (Etsy listing+transaction ≈ 9.5%, Ravelry ≈ 5%) */
  platformCommissionPct: number;
  /** payment processing %, 0-1 (Stripe ~2.9%+30c; we model flat % for a sale total) */
  processingPct: number;
  /** flat processing fee per sale (e.g. Stripe 0.30) */
  processingFlat: number;
  /** sales tax / VAT %, 0-1, charged on top of the subtotal */
  taxPct: number;
  /** shipping income, $ (what the customer pays for shipping) */
  shippingCharged: number;
  /** shipping cost, $ (what the seller pays) */
  shippingCost: number;
}

export const DEFAULT_FEES: SaleFees = {
  platformCommissionPct: 0,
  processingPct: 0,
  processingFlat: 0,
  taxPct: 0,
  shippingCharged: 0,
  shippingCost: 0,
};

/** Custom-order protection fields (quote docs). */
export interface QuoteTerms {
  /** deposit fraction 0-1 (custom work commonly 30-50%) */
  depositPct: number;
  /** quoted delivery lead time, days */
  leadDays: number;
  /** what was agreed — size, yarn, colors */
  description: string;
  /** quote valid for, days */
  validDays: number;
}

export const DEFAULT_QUOTE_TERMS: QuoteTerms = {
  depositPct: 0.5,
  leadDays: 21,
  description: "",
  validDays: 14,
};

export interface BrandProfile {
  /** the designer's business name shown on the receipt */
  businessName: string;
  contact: string;
  /** currency code for fmtMoney */
  currency: string;
}

export const DEFAULT_BRAND: BrandProfile = {
  businessName: "",
  contact: "",
  currency: "USD",
};

export interface SavedSale {
  id: string;
  kind: ReceiptDocKind;
  docNumber: string;
  customerName: string;
  /** YYYY-MM-DD */
  date: string;
  channel: SaleChannel;
  saleType: SaleType;
  patternName: string;
  items: ReceiptItem[];
  fees: SaleFees;
  /** deposit amount already received for custom orders (for balance tracking) */
  depositReceived: number;
  note: string;
  /** when the sale was recorded in local storage */
  createdAt: string;
  /** quote-specific terms — present only when kind === "quote" */
  quoteTerms?: QuoteTerms;
}

export interface ReceiptLabInput {
  brand: BrandProfile;
  /** currently configured sale (not yet saved) */
  draft: SavedSale;
  /** existing ledger rows */
  ledger: SavedSale[];
  /** optional materials cost for the item — drives per-sale profit */
  materialsCost: number;
}

export interface FeeBreakdown {
  subtotal: number;
  taxAmount: number;
  shippingCharged: number;
  grossTotal: number;
  platformFee: number;
  processingFee: number;
  shippingCost: number;
  netAfterFees: number;
}

export interface ReceiptLine {
  /** rendered label */
  label: string;
  /** rendered value */
  value: string;
  /** emphasize (bold) on the doc */
  emphasis?: boolean;
}

export interface ReceiptDocument {
  kind: ReceiptDocKind;
  docNumber: string;
  lines: ReceiptLine[];
  /** chat-first card title: "Receipt · Mossy Yoke Sweater" */
  title: string;
  /** one-line summary for the ledger + share card */
  summary: string;
  /** net profit of this sale: price - materials - fees - shipping net cost */
  profit: number;
  /** the customer-facing total */
  total: number;
  /** balance still due on a quote */
  balanceDue: number;
}

export interface MonthlyLedgerRow {
  /** YYYY-MM */
  month: string;
  salesCount: number;
  revenue: number;
  refunds: number;
  grossRevenue: number;
  feesPaid: number;
  profit: number;
}

export interface ReceiptLabResult {
  document: ReceiptDocument;
  fees: FeeBreakdown;
  ledger: MonthlyLedgerRow[];
  /** lifetime totals across all months */
  totals: {
    salesCount: number;
    revenue: number;
    refunds: number;
    profit: number;
  };
  nextDocNumber: string;
}

// --- helpers -----------------------------------------------------------------

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

function sumItems(items: ReceiptItem[]): number {
  return items.reduce((s, it) => s + clamp(it.qty, 0, 999) * clamp(it.unitPrice, 0, 1e9), 0);
}

function twoDec(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * fmtMoney — every currency renders its own symbol (QA #49 rule from the Intl
 * Pricing Lab applies here too). Compound keys are NOT used in this module.
 */
export function fmtMoney(n: number, currency: string): string {
  let prefix = "";
  let suffix = "";
  if (currency === "USD" || currency === "CAD" || currency === "AUD" || currency === "NZD") {
    prefix = "$";
  } else if (currency === "GBP") {
    prefix = "£";
  } else if (currency === "EUR") {
    prefix = "€";
  } else if (currency === "CHF") {
    prefix = "CHF ";
  } else if (currency === "BRL") {
    prefix = "R$ ";
  } else if (currency === "INR") {
    prefix = "₹";
  } else if (currency === "JPY" || currency === "CNY" || currency === "KRW") {
    prefix = "¥";
  } else if (currency === "NOK" || currency === "SEK" || currency === "DKK" || currency === "ISK") {
    suffix = " kr";
  }
  const rounded = n >= 1000 ? Math.round(n) : twoDec(n);
  return prefix + rounded.toFixed(rounded >= 100 ? 0 : 2).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + suffix;
}

export function analyzeReceiptFees(draft: SavedSale): FeeBreakdown {
  const f = draft.fees ?? DEFAULT_FEES;
  const subtotal = sumItems(draft.items);
  const taxAmount = twoDec(subtotal * clamp(f.taxPct, 0, 1));
  const grossTotal = twoDec(subtotal + taxAmount + clamp(f.shippingCharged, 0, 1e9));
  const platformFee = twoDec(grossTotal * clamp(f.platformCommissionPct, 0, 1));
  const processingFee = twoDec(grossTotal * clamp(f.processingPct, 0, 1) + clamp(f.processingFlat, 0, 1e6));
  const shippingCost = clamp(f.shippingCost, 0, 1e9);
  const netAfterFees = twoDec(grossTotal - platformFee - processingFee - shippingCost);
  return { subtotal, taxAmount, shippingCharged: clamp(f.shippingCharged, 0, 1e9), grossTotal, platformFee, processingFee, shippingCost, netAfterFees };
}

export function analyzeReceipt(input: ReceiptLabInput): ReceiptLabResult {
  const brand = { ...DEFAULT_BRAND, ...input.brand };
  const draft = input.draft;
  const ledger = input.ledger ?? [];

  const fees = analyzeReceiptFees(draft);

  // materials cost applies per line item (patterns usually 1 item). Custom
  // knits may list yarn+notions as a single item — divide evenly.
  const itemCount = Math.max(draft.items.length, 1);
  const materialsPerItem = clamp(input.materialsCost, 0, 1e9) / itemCount;
  const materialsTotal = twoDec(materialsPerItem * draft.items.reduce((s, it) => s + clamp(it.qty, 0, 999), 0));

  const profit = twoDec(fees.netAfterFees - materialsTotal);

  const lines: ReceiptLine[] = [];
  const f = draft.fees ?? DEFAULT_FEES;

  lines.push(
    { label: "Document", value: DOC_KIND_LABELS[draft.kind] + " #" + draft.docNumber },
    { label: "Date", value: draft.date || new Date().toISOString().slice(0, 10) },
    { label: "Customer", value: draft.customerName || "—" },
    { label: "Channel", value: SALE_CHANNEL_LABELS[draft.channel] },
    { label: "Type", value: SALE_TYPE_LABELS[draft.saleType] },
  );

  if (draft.patternName) {
    lines.push({ label: "Pattern", value: draft.patternName });
  }

  if (draft.items.length > 0) {
    lines.push({ label: "", value: "" });
    draft.items.forEach((it) => {
      const lineTotal = twoDec(clamp(it.qty, 0, 999) * clamp(it.unitPrice, 0, 1e9));
      lines.push({
        label: it.name || "Item",
        value: "×" + clamp(it.qty, 0, 999) + " @ " + fmtMoney(it.unitPrice, brand.currency) + " = " + fmtMoney(lineTotal, brand.currency),
      });
    });
    lines.push({
      label: "Subtotal",
      value: fmtMoney(fees.subtotal, brand.currency),
      emphasis: true,
    });
    if (f.taxPct > 0) {
      lines.push({
        label: "Tax (" + (f.taxPct * 100).toFixed(0) + "%)",
        value: fmtMoney(fees.taxAmount, brand.currency),
      });
    }
    if (f.shippingCharged > 0) {
      lines.push({ label: "Shipping", value: fmtMoney(f.shippingCharged, brand.currency) });
    }
    lines.push({
      label: "Total",
      value: fmtMoney(fees.grossTotal, brand.currency),
      emphasis: true,
    });
  }

  if (draft.kind === "receipt" || draft.kind === "refund") {
    if (f.platformCommissionPct > 0) {
      lines.push({ label: "Platform fee", value: "−" + fmtMoney(fees.platformFee, brand.currency) });
    }
    if (f.processingPct > 0 || f.processingFlat > 0) {
      lines.push({ label: "Processing fee", value: "−" + fmtMoney(fees.processingFee, brand.currency) });
    }
    if (f.shippingCost > 0) {
      lines.push({ label: "Shipping cost", value: "−" + fmtMoney(fees.shippingCost, brand.currency) });
    }
    lines.push({
      label: "Profit on this sale",
      value: fmtMoney(profit, brand.currency) + (input.materialsCost > 0 ? "  (after materials −" + fmtMoney(materialsTotal, brand.currency) + ")" : "  (no materials cost set)"),
      emphasis: true,
    });
  }

  if (draft.kind === "quote") {
    const terms = { ...DEFAULT_QUOTE_TERMS, ...(draft as unknown as { quoteTerms?: QuoteTerms }).quoteTerms };
    if (terms) {
      lines.push({ label: "", value: "" });
      lines.push({ label: "Terms", value: "Deposit " + (terms.depositPct * 100).toFixed(0) + "% · lead time " + terms.leadDays + " days · quote valid " + terms.validDays + " days" });
      if (terms.description) {
        lines.push({ label: "Agreed", value: terms.description });
      }
      const deposit = twoDec(fees.grossTotal * clamp(terms.depositPct, 0, 1));
      lines.push({
        label: "Deposit due",
        value: fmtMoney(deposit, brand.currency),
        emphasis: true,
      });
    }
  }

  if (draft.kind === "refund") {
    lines.push({ label: "Refund amount", value: fmtMoney(fees.grossTotal, brand.currency), emphasis: true });
  }

  if (draft.note) {
    lines.push({ label: "Note", value: draft.note });
  }

  // --- ledger: monthly rows + lifetime totals ------------------------------
  const monthMap = new Map<string, MonthlyLedgerRow>();
  let salesCount = 0;
  let revenue = 0;
  let refunds = 0;
  let profitTotal = 0;

  // The draft may already exist in the ledger (right after "Save to ledger", the
  // same sale is both the persisted row and the still-mounted form state).
  // De-duplicate in two passes:
  // 1. Rows matching the draft's own id are skipped (saved drafts carry ids).
  // 2. Unsafed drafts (id === "") are matched against the ledger by a sales
  //    fingerprint (kind + date + item list). Exactly one ledger row with the
  //    same fingerprint is dropped so identical separate sales are kept.
  const draftId = draft.id || "";
  let fingerprint = "";
  const draftItemsSig = (draft.items || [])
    .map((i) => i.name + "@" + i.qty + "x" + i.unitPrice)
    .join(";");
  if (!draftId) {
    fingerprint =
      (draft.kind || "") + "|" + (draft.date || "") + "|" + draftItemsSig;
  }
  let fingerprintMatched = false;
  const filteredLedger = ledger.filter((r) => {
    if (!r || !r.kind) return false;
    if (r.id && r.id === draftId) return false;
    if (fingerprint) {
      const rowSig =
        r.kind + "|" + (r.date || "") + "|" + (r.items || [])
          .map((i) => i.name + "@" + i.qty + "x" + i.unitPrice)
          .join(";");
      if (rowSig === fingerprint && !fingerprintMatched) {
        fingerprintMatched = true;
        return false;
      }
    }
    return true;
  });
  // A draft with no priced items is an empty form, not a sale — skip it in
  // the totals (it still renders the live preview card).
  const isEffectiveSale = (r: SavedSale): boolean =>
    (r.items || []).some((i) => (i.qty || 0) > 0 && (i.unitPrice || 0) > 0);
  const allRows = [...filteredLedger, draft].filter((r) => r && r.kind);
  for (const row of allRows) {
    const month = (row.date || "").slice(0, 7);
    if (!month) continue;
    if (row === draft && !isEffectiveSale(draft)) continue;
    const existing = analyzeReceiptFees(row);
    // Ledger rows don't carry materials cost at load time — profit shown per
    // sale is conservative (net of fees only). Materials-aware profit lives on
    // the saved-sale note for the designer's reference.
    const rowNet = existing.netAfterFees;
    const entry = monthMap.get(month) ?? { month, salesCount: 0, revenue: 0, refunds: 0, grossRevenue: 0, feesPaid: 0, profit: 0 };
    entry.grossRevenue = twoDec(entry.grossRevenue + existing.grossTotal);
    entry.feesPaid = twoDec(entry.feesPaid + existing.platformFee + existing.processingFee);
    if (row.kind === "receipt") {
      entry.salesCount += 1;
      entry.revenue = twoDec(entry.revenue + existing.grossTotal);
      entry.profit = twoDec(entry.profit + rowNet);
      salesCount += 1;
      revenue = twoDec(revenue + existing.grossTotal);
      profitTotal = twoDec(profitTotal + rowNet);
    } else if (row.kind === "refund") {
      entry.refunds = twoDec(entry.refunds + existing.grossTotal);
      entry.revenue = twoDec(entry.revenue - existing.grossTotal);
      entry.profit = twoDec(entry.profit - rowNet);
      refunds = twoDec(refunds + existing.grossTotal);
      profitTotal = twoDec(profitTotal - rowNet);
    } else {
      // quotes don't count as revenue yet
    }
    monthMap.set(month, entry);
  }

  const led = Array.from(monthMap.values()).sort((a, b) => (a.month < b.month ? -1 : a.month > b.month ? 1 : 0));
  const title = DOC_KIND_LABELS[draft.kind] + " · " + (draft.patternName || draft.items[0]?.name || "Sale") + " #" + draft.docNumber;
  const total = fees.grossTotal;
  const balanceDue = draft.kind === "quote" ? total - clamp(draft.depositReceived, 0, total) : 0;


  return {
    document: {
      kind: draft.kind,
      docNumber: draft.docNumber,
      lines,
      title,
      summary:
        DOC_KIND_LABELS[draft.kind] + " #" + draft.docNumber + " for " + (draft.customerName || "customer") + " — " + fmtMoney(total, brand.currency) +
        (profit !== 0 && draft.kind !== "quote" ? " (profit " + fmtMoney(profit, brand.currency) + ")" : ""),
      profit,
      total,
      balanceDue,
    },
    fees,
    ledger: led,
    totals: { salesCount, revenue, refunds, profit: profitTotal },
    nextDocNumber: nextDocNumber(ledger, draft.kind),
  };
}

/** Next sequential doc number for a kind: REC-001, QUO-001, REF-001. */
export function nextDocNumber(ledger: SavedSale[], kind: ReceiptDocKind, current?: string): string {
  const prefix = kind === "receipt" ? "REC" : kind === "quote" ? "QUO" : "REF";
  const existing = ledger.filter((r) => r.kind === kind).map((r) => r.docNumber);
  if (current) existing.push(current);
  let max = 0;
  for (const n of existing) {
    if (!n.startsWith(prefix + "-")) continue;
    const num = parseInt(n.slice(prefix.length + 1), 10);
    if (isFinite(num) && num > max) max = num;
  }
  return prefix + "-" + String(max + 1).padStart(3, "0");
}

/**
 * Canonical monthly ledger rows from raw saved sales — the exact math the
 * Receipt Lab shows (quotes excluded; refunds subtract; month = date.slice(0,7)).
 * Reused by the Brag Card engine (CHK-091) so cards always match the lab.
 */
export function computeMonthlyLedgerRows(ledger: SavedSale[]): MonthlyLedgerRow[] {
  const monthMap = new Map<string, MonthlyLedgerRow>();
  const rows = (ledger ?? []).filter((r) => r && r.kind);
  for (const row of rows) {
    const month = (row.date || "").slice(0, 7);
    if (!month) continue;
    if (row.kind !== "receipt" && row.kind !== "refund") continue;
    const existing = analyzeReceiptFees(row);
    const entry = monthMap.get(month) ?? { month, salesCount: 0, revenue: 0, refunds: 0, grossRevenue: 0, feesPaid: 0, profit: 0 };
    entry.grossRevenue = twoDec(entry.grossRevenue + existing.grossTotal);
    entry.feesPaid = twoDec(entry.feesPaid + existing.platformFee + existing.processingFee);
    if (row.kind === "receipt") {
      entry.salesCount += 1;
      entry.revenue = twoDec(entry.revenue + existing.grossTotal);
      entry.profit = twoDec(entry.profit + existing.netAfterFees);
    } else if (row.kind === "refund") {
      entry.refunds = twoDec(entry.refunds + existing.grossTotal);
      entry.revenue = twoDec(entry.revenue - existing.grossTotal);
      entry.profit = twoDec(entry.profit - existing.netAfterFees);
    }
    monthMap.set(month, entry);
  }
  return Array.from(monthMap.values()).sort((a, b) => (a.month < b.month ? -1 : a.month > b.month ? 1 : 0));
}

export const DEFAULT_SALE: SavedSale = {
  id: "",
  kind: "receipt",
  docNumber: "REC-001",
  customerName: "",
  date: new Date().toISOString().slice(0, 10),
  channel: "whatsapp",
  saleType: "custom-knit",
  patternName: "",
  items: [{ name: "", qty: 1, unitPrice: 0 }],
  fees: { ...DEFAULT_FEES },
  depositReceived: 0,
  note: "",
  createdAt: "",
};
