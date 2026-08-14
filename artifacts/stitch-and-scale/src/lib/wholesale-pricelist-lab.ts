// CHK-078 — Wholesale Price List Lab engine
// Builds and stress-tests a wholesale line sheet for an indie knitwear
// designer: physical pattern cards, printed books/zines, POD pattern books,
// and accessory SKUs sold to local yarn shops (LYS), boutiques, and studios.
//
// Verified facts (session 78, Aug 2026):
// - Keystone: boutiques buy at 50% of retail and sell at full retail — the
//   standard expectation in boutique/gift retail (Craftybase, Aug 2026).
//   Formula: COGS × 2 = wholesale; COGS × 4 = retail. Designer earns 1× COGS
//   at wholesale vs 3× at retail → needs ~3× the volume to match retail
//   gross profit. Test: retail ÷ 4 must exceed fully-loaded COGS.
// - Faire: 15% commission on new orders + $10 new-customer fee (was 25%
//   pre-May 2023), 15% on reorders, +3% card fee; payout fees 1.9-3.5% +
//   $0.30. Faire Direct → 0% on maker-owned links (honor not guaranteed).
// - Net 30 = lending stores your money for 30+ days; most indie makers
//   collect 100% at order or 50/50; terms suit only big buffers or national
//   retailers (Wholesale In a Box, 1500+ makers coached).
// - Typical first-time minimum order value $150-200; unit minimums ~6/SKU;
//   freight + packaging add real per-order cost.
// - Ravelry's 151-shop in-store pattern resale runs patterns at full retail
//   with no designer wholesale economics — designer keeps the tier control.
// - Etsy Wholesale closed 2017 and stranded makers — owned line sheets are
//   the durable asset.

export type DepositMode = "upfront100" | "half50" | "net30";

export interface TierRow {
  /** display label, e.g. "Tier 1 — small orders" */
  label: string;
  /** minimum order value in USD that unlocks this tier (0 for base tier) */
  minOrderUsd: number;
  /** discount on the base wholesale price, percent, 0-100 */
  discountPct: number;
}

export interface WholesaleInput {
  /** retail price of the unit (what the shop sells it for) */
  retailPrice: number;
  /** fully-loaded cost per unit: materials + labor + packaging + overhead */
  unitCost: number;
  /** retailer keystone multiplier, 2.0 = shop sells at 2× wholesale */
  keystone: number;
  /** order value tiers the designer offers */
  tiers: TierRow[];
  /** units per typical shop order */
  avgOrderUnits: number;
  /** average order value the pipeline expects, USD */
  avgOrderValue: number;
  /** per-order costs: packaging + freight + admin per order, USD */
  perOrderCost: number;
  /** minimum order value the designer enforces, USD */
  minOrderValue: number;
  /** channel fees: marketplace commission percent (0 for direct) */
  channelCommissionPct: number;
  /** one-time new-customer marketplace fee, USD (Faire $10) */
  channelNewCustomerFee: number;
  /** payment-processing rate on received funds, percent */
  processingPct: number;
  /** share of orders paid on terms vs upfront, 0-1 */
  termsShare: number;
  /** cash-conversion days when on terms (Net 30 → 30; upfront → 0) */
  termsDays: number;
  /** cost of carrying cash per day, percent per day (working-capital cost ~10% APR → ~0.027%/day) */
  dailyCashCostPct: number;
  /** how many shop orders per month the designer expects at current effort */
  ordersPerMonth: number;
  /** your hours per shop order (quotes, packing, invoicing) */
  hoursPerOrder: number;
  /** your effective hourly rate, USD */
  hourlyRate: number;
  /** share of the retail price the designer refuses to discount wholesale
   *  below — protects the shop's keystone; 0.5 = wholesale must stay ≤ 50% of retail */
  keystoneFloorShare: number;
}

export interface TierResult {
  label: string;
  minOrderUsd: number;
  discountPct: number;
  unitWholesale: number; // wholesale price per unit at this tier
  unitGrossMargin: number; // unit wholesale − unit cost
  grossMarginPct: number; // unit margin / unit wholesale
  keystoneCompliant: boolean; // wholesale ≤ retail / keystone
  marginAfterFeesPct: number; // margin after channel + processing fees
}

export interface OrderModel {
  name: string;
  unitWholesale: number;
  netPerOrder: number; // after fees + per-order costs + your labor + cash drag
  netPerUnit: number;
  cashDragPerOrder: number; // carrying cost of terms / processing timing
}

export interface FlagDetail { code: string; title: string; note: string; severity: "high" | "mid" | "low" }

export interface WholesaleResult {
  tiers: TierResult[];
  baseUnitWholesale: number; // Tier 0 wholesale price (recommended base)
  impliedRetailAtKeystone: number; // retail that lets shops hit keystone from the base price
  baseNetPerUnit: number;
  orders: OrderModel[];
  monthlyNet: number;
  monthlyLaborCost: number;
  monthlyCashDrag: number;
  breakEvenOrdersPerMonth: number;
  annualNet: number;
  minOrderGate: string;
  flags: FlagDetail[];
  verdict:
    | "Pricing fails — fix COGS or retail before quoting wholesale"
    | "Wholesale-ready — your keystone math holds"
    | "Only profitable on bigger orders — raise the minimum"
    | "Terms are eating you — tighten payment terms"
    | "Margins too thin — cut the channel fee or raise the floor";
  verdictNote: string;
}

export const DEFAULT_WHOLESALE: WholesaleInput = {
  // A printed pattern card / mini zine: COGS ~ $2.40 incl. printing, photo card,
  // poly sleeve, and a fair labor share. Retail $12 → wholesale $6 (keystone 2.0).
  retailPrice: 12,
  unitCost: 2.4,
  keystone: 2.0,
  tiers: [
    { label: "Base", minOrderUsd: 0, discountPct: 0 },
    { label: "$150+", minOrderUsd: 150, discountPct: 0 },
    { label: "$300+", minOrderUsd: 300, discountPct: 5 },
    { label: "$750+", minOrderUsd: 750, discountPct: 10 },
  ],
  avgOrderUnits: 25,
  avgOrderValue: 150,
  perOrderCost: 8, // packaging materials + freight + invoicing/printing
  minOrderValue: 150,
  channelCommissionPct: 0, // direct line sheet; set 15 for Faire first orders
  channelNewCustomerFee: 0,
  processingPct: 2.9,
  termsShare: 0,
  termsDays: 0,
  dailyCashCostPct: 0.027, // ~10% APR working-capital cost
  ordersPerMonth: 2,
  hoursPerOrder: 2,
  hourlyRate: 25,
  keystoneFloorShare: 0.5,
};

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

function fmt(n: number): string {
  const rounded = n >= 1000 ? Math.round(n) : Math.round(n * 100) / 100;
  return "$" + rounded.toFixed(rounded >= 100 ? 0 : 2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function analyzeWholesale(input: WholesaleInput): WholesaleResult {
  const flags: FlagDetail[] = [];

  const retail = Math.max(input.retailPrice, 0.01);
  const unitCost = Math.max(input.unitCost, 0);
  const keystone = clamp(input.keystone, 1.5, 4);
  const floorShare = clamp(input.keystoneFloorShare, 0.1, 0.8);
  const floorPrice = retail * (1 - floorShare); // wholesale must not exceed this to leave the shop keystone room

  // --- The keystone gate: can COGS support wholesale at all? ---
  // Wholesale = retail ÷ keystone; designer keeps wholesale − COGS per unit.
  // Craftybase test: retail ÷ 4 (keystone 2) must exceed fully-loaded COGS.
  const baseWholesale = retail / keystone;
  const baseMargin = baseWholesale - unitCost;

  // If wholesale at the keystone-protected floor is below COGS, nothing works.
  const floorWholesale = Math.min(baseWholesale, floorPrice);
  const floorMargin = floorWholesale - unitCost;

  // --- Per-tier table ---
  const tiers: TierResult[] = input.tiers.map((t) => {
    const unitWholesale = Math.max(baseWholesale * (1 - clamp(t.discountPct, 0, 40) / 100), 0);
    const grossMargin = unitWholesale - unitCost;
    const commission = clamp(input.channelCommissionPct, 0, 50) / 100;
    const processing = clamp(input.processingPct, 0, 20) / 100;
    const afterFees = unitWholesale * (1 - commission - processing) - unitCost;
    return {
      label: t.label,
      minOrderUsd: t.minOrderUsd,
      discountPct: clamp(t.discountPct, 0, 40),
      unitWholesale: Math.round(unitWholesale * 100) / 100,
      unitGrossMargin: Math.round(grossMargin * 100) / 100,
      grossMarginPct: unitWholesale > 0 ? (grossMargin / unitWholesale) * 100 : 0,
      keystoneCompliant: unitWholesale <= floorPrice,
      marginAfterFeesPct: unitWholesale > 0 ? (afterFees / unitWholesale) * 100 : 0,
    };
  });

  // --- Order model comparison: direct vs marketplace vs terms ---
  const avgOrderValue = Math.max(input.avgOrderValue, 1);
  const units = Math.max(input.avgOrderUnits, 1);
  const commission = clamp(input.channelCommissionPct, 0, 50) / 100;
  const processing = clamp(input.processingPct, 0, 20) / 100;

  const directNetPerOrder = avgOrderValue * (1 - processing) - input.perOrderCost;
  const marketNetPerOrder = avgOrderValue * (1 - commission - processing) - input.perOrderCost - input.channelNewCustomerFee;
  const laborPerOrder = input.hoursPerOrder * Math.max(input.hourlyRate, 0);

  // Cash drag: on terms, the designer funds the order's COGS + per-order cost
  // for `termsDays`; plus processing timing on funds.
  const termsDragPerOrder = avgOrderValue * (clamp(input.termsDays, 0, 180) * clamp(input.dailyCashCostPct, 0, 1) / 100) * clamp(input.termsShare, 0, 1);

  const orders: OrderModel[] = [
    {
      name: "Direct line sheet (" + (input.termsShare > 0.5 ? "Net " + input.termsDays : "paid upfront") + ")",
      unitWholesale: Math.round(floorWholesale * 100) / 100,
      netPerOrder: directNetPerOrder - laborPerOrder - termsDragPerOrder,
      netPerUnit: (directNetPerOrder - laborPerOrder - termsDragPerOrder) / units,
      cashDragPerOrder: termsDragPerOrder,
    },
    {
      name: input.channelCommissionPct > 0 ? "Marketplace first order" : "Marketplace first order (15% + $10)",
      unitWholesale: Math.round(floorWholesale * 100) / 100,
      netPerOrder: marketNetPerOrder - laborPerOrder - termsDragPerOrder,
      netPerUnit: (marketNetPerOrder - laborPerOrder - termsDragPerOrder) / units,
      cashDragPerOrder: termsDragPerOrder,
    },
    {
      name: "Reorder (0% channel, marketplace or direct)",
      unitWholesale: Math.round(floorWholesale * 100) / 100,
      netPerOrder: avgOrderValue * (1 - processing) - input.perOrderCost - laborPerOrder,
      netPerUnit: (avgOrderValue * (1 - processing) - input.perOrderCost - laborPerOrder) / units,
      cashDragPerOrder: 0,
    },
  ];

  const perOrderLabor = laborPerOrder;
  const monthlyLabor = perOrderLabor * clamp(input.ordersPerMonth, 0, 1000);
  const monthlyCashDrag = termsDragPerOrder * clamp(input.ordersPerMonth, 0, 1000);
  // Monthly net uses the direct model as the reference channel.
  const monthlyNet = (directNetPerOrder - perOrderLabor - termsDragPerOrder) * clamp(input.ordersPerMonth, 0, 1000);

  // Break-even: how many orders/month cover the labor committed to wholesale?
  const netBeforeLabor = directNetPerOrder - termsDragPerOrder;
  const breakEvenOrders = netBeforeLabor > 0 ? monthlyLabor / netBeforeLabor : Infinity;

  // Minimum-order gate: the smallest allowed order must still be profitable
  // after packaging + freight + labor on it.
  const minUnitsOnMinOrder = input.minOrderValue / (floorWholesale || 1);
  const minOrderNet =
    input.minOrderValue * (1 - processing) - input.perOrderCost - laborPerOrder - termsDragPerOrder;
  const minOrderGate =
    minOrderNet > 0
      ? "Your $" + input.minOrderValue + " minimum nets " + fmt(minOrderNet) + " — profitable. Keep it enforced."
      : "Your $" + input.minOrderValue + " minimum LOSES " + fmt(Math.abs(minOrderNet)) + " once packaging, freight, and ~" + input.hoursPerOrder + "h of admin are in it. Raise the minimum to " + fmt(Math.ceil(((input.perOrderCost + laborPerOrder + termsDragPerOrder) / (1 - processing)) / 10) * 10) + ".";

  // --- Flags ---
  const impliedCoGs4 = retail / 4;
  if (unitCost > impliedCoGs4) {
    flags.push({
      code: "WL-01",
      title: "COGS fails the wholesale gate",
      note: "Fully-loaded cost " + fmt(unitCost) + " exceeds the keystone-2 ceiling of " + fmt(impliedCoGs4) + " (retail ÷ 4). At wholesale you'd earn under 1× COGS per unit vs 3× at retail — you need ~3× the volume to break even with your shop channel. Raise retail, cut COGS, or skip wholesale for this SKU.",
      severity: "high",
    });
  }
  if (floorMargin < unitCost) {
    flags.push({
      code: "WL-02",
      title: "Keystone-protected price can't be honored",
      note: "To let the shop hit keystone (×" + keystone + ") on a " + fmt(retail) + " retail, your wholesale must stay at or below " + fmt(floorPrice) + ". At " + fmt(unitCost) + " cost that leaves only " + fmt(floorMargin) + "/unit — below your own COGS. The shop can't make margin and neither can you at this retail.",
      severity: "high",
    });
  }
  if (input.channelCommissionPct > 0) {
    const firstVsDirect = directNetPerOrder - marketNetPerOrder;
    flags.push({
      code: "WL-03",
      title: "Marketplace tax on new stockists",
      note: "A first-time Faire order costs you " + fmt(input.channelNewCustomerFee) + " + " + input.channelCommissionPct.toFixed(0) + "% vs a direct order — " + fmt(firstVsDirect) + " less per " + fmt(avgOrderValue) + " order. Send stockists your Faire Direct / own-line-sheet link on reorders (0% channel) and reserve the marketplace for net-new discovery.",
      severity: "mid",
    });
  }
  if (termsDragPerOrder > 0) {
    const pctOfNet = termsDragPerOrder / Math.max(directNetPerOrder - laborPerOrder, 1);
    flags.push({
      code: "WL-04",
      title: termsDragPerOrder > 5 ? "Net terms are silently funding your stockists" : "Terms carry a cash cost",
      note: (input.termsShare * 100).toFixed(0) + "% of orders on Net " + input.termsDays + " ties up ~" + fmt(avgOrderValue * input.termsShare) + " in floating receivables, dragging " + fmt(termsDragPerOrder) + "/order (" + (pctOfNet * 100).toFixed(1) + "% of net). Most indie makers collect 100% upfront or 50/50; save terms for big buffer + prompt-payer shops.",
      severity: termsDragPerOrder > 5 ? "high" : "mid",
    });
  }
  if (breakEvenOrders !== Infinity && breakEvenOrders > Math.max(input.ordersPerMonth, 1) * 1.5) {
    flags.push({
      code: "WL-05",
      title: "Wholesale labor is underwater at current volume",
      note: "At ~" + input.hoursPerOrder + "h/order and " + fmt(input.hourlyRate) + "/h, you need " + breakEvenOrders.toFixed(1) + " orders/mo just to cover wholesale admin. You're at " + input.ordersPerMonth + "/mo — either batch-quote (lower hours/order), raise the minimum, or park the channel until the pipeline grows.",
      severity: "mid",
    });
  }
  const thinTiers = tiers.filter((t) => t.marginAfterFeesPct < 30 && t.unitWholesale > 0);
  if (thinTiers.length > 0 && input.channelCommissionPct > 10) {
    flags.push({
      code: "WL-06",
      title: "Channel fee thins the deep tiers",
      note:
        '"' + thinTiers.map((t) => t.label).join('", "') + '" drop under 30% margin after the ' +
        input.channelCommissionPct.toFixed(0) +
        '% channel + processing — volume discounts on a marketplace double-charge you. Put the deep tiers on the direct line sheet only.',

      severity: "mid",
    });
  }
  if (input.avgOrderValue < input.minOrderValue * 0.8) {
    flags.push({
      code: "WL-07",
      title: "Expected orders fall below your minimum",
      note:
        "Expected " + fmt(avgOrderValue) + " orders are under your " + fmt(input.minOrderValue) +
        " minimum — either your pipeline math is optimistic, or the minimum is scaring orders away. Wholesale In a Box's typical first-order value is $150-200 for gift retail; set the minimum where 60-80% of real orders land.",
      severity: "mid",
    });
  }
  const deepDiscounts = input.tiers.filter((t) => t.discountPct > 15);
  if (deepDiscounts.length > 0) {
    flags.push({
      code: "WL-08",
      title: "Rung discounts may break keystone",
      note: deepDiscounts
        .map(
          (t) =>
            '"' + t.label + '" cuts wholesale ' + t.discountPct +
            "% — check the tier table: the shop's margin on a discounted order stays healthy only if the discount rung still clears your cost after channel fees.",
        )
        .join(" "),
      severity: "low",
    });
  }

  // --- Verdict ladder ---
  let verdict: WholesaleResult["verdict"];
  let verdictNote: string;

  if (unitCost > impliedCoGs4 || floorMargin <= 0) {
    verdict = "Pricing fails — fix COGS or retail before quoting wholesale";
    verdictNote =
      "COGS " + fmt(unitCost) + " vs keystone ceiling " + fmt(impliedCoGs4) +
      ", and the keystone-protected wholesale " + fmt(floorWholesale) + " leaves " + fmt(floorMargin) + "/unit " +
      (floorMargin <= 0 ? "(a loss)" : "") +
      ". Wholesale isn't \"half of retail\" — it's 4× COGS or it doesn't hold. Raise this SKU's retail ~" +
      ((unitCost * 4 - retail) / Math.max(retail, 1) * 100).toFixed(0) + "% first, then re-quote.";
  } else if (monthlyNet >= 0 && minOrderNet > 0 && termsDragPerOrder <= 2 && (monthlyLabor <= 0 || monthlyNet >= monthlyLabor * 0.5)) {
    verdict = "Wholesale-ready — your keystone math holds";
    verdictNote =
      "Base wholesale " + fmt(Math.round(floorWholesale * 100) / 100) + " (retail ÷ " + keystone + ") clears cost by " +
      fmt(baseMargin) + "/unit; your $" + input.minOrderValue + " minimum nets " + fmt(minOrderNet) + "; terms drag is " +
      fmt(termsDragPerOrder) + "/order. Publish the line sheet with the tier table, the keystone floor, and 100%-or-50/50 payment in writing.";
  } else if (minOrderNet <= 0) {
    verdict = "Only profitable on bigger orders — raise the minimum";
    verdictNote =
      "At the current minimum your net is " + fmt(minOrderNet) + "/order after packaging, freight, and labor. Wholesale's fixed per-order costs make small orders volunteer work — the minimum order must cover admin, not just product.";
  } else if (termsDragPerOrder > 2) {
    verdict = "Terms are eating you — tighten payment terms";
    verdictNote =
      "Net terms drag " + fmt(termsDragPerOrder) + "/order and monthly cash drag is " + fmt(monthlyCashDrag) +
      ". Collect 100% at order or 50/50 at ship; use terms only for buffer-rich, prompt-payer stockists or national accounts.";
  } else if (monthlyLabor > 0 && monthlyNet < monthlyLabor * 0.5) {
    verdict = "Margins too thin — cut the channel fee or raise the floor";
    verdictNote =
      "Keystone holds but after fees and labor wholesale nets only " + fmt(monthlyNet) + "/month against " +
      fmt(monthlyLabor) + " of committed labor. Move deep tiers to the direct line sheet (0% channel), raise the minimum order value, and quote the marketplace only for net-new discovery.";
  } else {
    verdict = "Margins too thin — cut the channel fee or raise the floor";
    verdictNote =
      "Keystone holds but after fees and labor the reference channel nets " +
      fmt((directNetPerOrder - laborPerOrder - termsDragPerOrder) / Math.max(units, 1)) +
      "/unit. Move deep tiers to the direct line sheet (0% channel), raise the minimum order value, and quote the marketplace only for net-new discovery.";
  }

  return {
    tiers,
    baseUnitWholesale: Math.round(floorWholesale * 100) / 100,
    impliedRetailAtKeystone: Math.round(retail * 100) / 100,
    baseNetPerUnit: Math.round(baseMargin * 100) / 100,
    orders,
    monthlyNet: Math.round(monthlyNet * 100) / 100,
    monthlyLaborCost: Math.round(monthlyLabor * 100) / 100,
    monthlyCashDrag: Math.round(monthlyCashDrag * 100) / 100,
    breakEvenOrdersPerMonth: Math.round(breakEvenOrders * 10) / 10,
    annualNet: Math.round(monthlyNet * 1200) / 100,
    minOrderGate,
    flags,
    verdict,
    verdictNote,
  };
}
