/**
 * Kit economics — designer-side modelling for selling yarn kits.
 *
 * The only thing that turns a pattern into a kit channel is a price the
 * market accepts against a cost stack the designer actually pays. This
 * library models all three stages of the kit money trail with cited
 * economics, documented below.
 *
 * COST MODEL:
 * - Yarn: yardage from the grading engine's yardage model (CYC weight
 *   standard) at the designer's real yarn price per 100g skein. Skein
 *   counts round UP — buying partial skeins isn't a thing.
 * - Kit extras: notions, pattern printout, packaging (box + label +
 *   tissue). Cited rule of thumb (Craftybase wholesale pricing,
 *   craftybase.com/blog/pricing-handmade-products-wholesale): COGS for a
 *   kit must include materials at current prices, labour at an hourly
 *   rate (including the designer's own time), packaging, and an overhead
 *   share — makers who omit labour turn wholesale into a margin trap.
 *
 * CHANNEL MODEL (three channels, all fee models cited):
 * 1. Self-sell (direct via Etsy/Payhip): pattern-income-calculator's
 *    platformNet seam — one seam across the whole app.
 * 2. LYS consignment: the cited industry norm is a 60/40 split favouring
 *    the consignor (Puppet Vendors 2026 guide); the knitting-specific
 *    analog — Ravelry's in-store pattern sales feature — pays the
 *    designer 60% of retail with the shop taking 40% (Naluknits 2023).
 *    Payment processing (2.6–3.5%, cited Stripe/PayPal class rates) is
 *    commonly deducted BEFORE the split, so this models processor fees
 *    off the top first, then applies the split.
 * 3. LYS wholesale (keystone): the standard handmade formula is
 *    COGS × 2 = wholesale price, COGS × 4 = retail price (Craftybase
 *    2025). The retailer buys at half retail and marks to full retail,
 *    and the maker earns exactly 1× COGS per unit at wholesale — so
 *    wholesale needs ~3× the volume to equal retail gross profit.
 *
 * SANITY CHECKS:
 * - Retail-tolerance check: kit retail above ~4× yarn component cost is
 *   where buyers start comparing against sourcing separately (kits carry
 *   a convenience premium, but markets above roughly 1.6–1.9× the
 *   sum of components invite price anchoring against DIY). This is a
 *   warning flag, not a prohibition.
 * - Keystone capacity: retail ÷ 4 must exceed fully-loaded COGS before
 *   wholesale is viable (Craftybase capacity test).
 *
 * Every channel result carries a profit-per-kit and a volume-equivalence
 * figure so the designer can compare a channel against their existing
 * solo pattern income on a like-for-like basis.
 */
import { estimateYarn, YarnWeight } from './yarn-estimator';
import { PatternProject } from './grading-engine';
import { platformNet, PlatformId } from './pattern-income-calculator';

export type KitChannel = 'self-sell' | 'consignment' | 'wholesale';

export const CHANNEL_LABELS: Record<KitChannel, string> = {
  'self-sell': 'Self-sell (direct)',
  consignment: 'LYS consignment',
  wholesale: 'LYS wholesale',
};

export interface KitInput {
  /** Fully-loaded kit COGS: yarn + notions + packaging + per-kit labour. */
  kitCogs: number;
  /** Kit retail price (the price end knitters see everywhere). */
  retailPrice: number;
  /** Consignor split — 0.60 = consignor keeps 60% (industry standard). */
  consignorShare: number;
  /** Payment-processor fee deducted before the split (0.029–0.035). */
  processorFeePct: number;
  /** Estimated kits sold per month via self-sell. */
  monthlyKitSales: number;
  /** Estimated kits sold per month via consignment. */
  monthlyConsignmentSales: number;
  /** Estimated wholesale kits per order (MOQ), and orders per month. */
  wholesaleKitsPerOrder: number;
  monthlyWholesaleOrders: number;
  /** Faire-style marketplace fee on wholesale orders (0.15 new, 0 existing). */
  wholesaleMarketplaceFeePct: number;
  /** Solo pattern income baseline, $/mo, for the channel comparison. */
  soloPatternIncomeMonthly: number;
  /** Platform for the self-sell channel. */
  platform: PlatformId;
}

export interface ChannelOutcome {
  channel: KitChannel;
  /** Net income for the designer per kit at this channel. */
  netPerKit: number;
  /** Total monthly designer income through this channel. */
  monthlyNet: number;
  /** Kits per month equivalent to the solo-pattern baseline. */
  kitsToMatchBaseline: number;
  /** Effective take as % of retail. */
  takePct: number;
}

export interface KitCapacityCheck {
  /** COGS as % of retail — over 25% kills keystone wholesale margin. */
  cogsSharePct: number;
  /** Retail ÷ 4 vs COGS — must exceed for keystone viability. */
  keystoneCapacity: boolean;
  /** Retail vs yarn-cost-only multiple — convenience-premium flag. */
  retailToYarnMultiple: number;
  /** Flag: retail is above ~1.8× yarn cost — buyers may anchor DIY. */
  conveniencePremiumWarning: boolean;
}

export interface KitEconomics {
  channels: ChannelOutcome[];
  capacity: KitCapacityCheck;
  /** Best channel by monthly net, or null when no channel sells. */
  bestChannel: KitChannel | null;
  /** Best channel's monthly net vs solo baseline. */
  bestMonthlyNet: number;
  /** Whether the kit channel beats the pattern-only baseline. */
  beatsBaseline: boolean;
}

/** Build full kit COGS from the project's yardage model and per-component prices. */
export function buildKitCogs(
  project: PatternProject,
  weight: YarnWeight,
  pricePerSkein: number,
  options: { notionsCost?: number; packagingCost?: number; labourHours?: number; labourRate?: number; overheadShare?: number } = {},
): { yarnCost: number; skeins: number; notionsCost: number; packagingCost: number; labourCost: number; overheadShare: number; totalCogs: number; estimatedYards: number } {
  const yards = estimateYarn(project, weight);
  const yarnCost = Math.round(yards.skeins100g * pricePerSkein * 100) / 100;
  const notionsCost = Math.round((options.notionsCost ?? 0) * 100) / 100;
  const packagingCost = Math.round((options.packagingCost ?? 0) * 100) / 100;
  const labourCost = Math.round((options.labourHours ?? 0) * (options.labourRate ?? 0) * 100) / 100;
  const overheadShare = Math.round((options.overheadShare ?? 0) * 100) / 100;
  const totalCogs = Math.round((yarnCost + notionsCost + packagingCost + labourCost + overheadShare) * 100) / 100;
  return {
    yarnCost,
    skeins: yards.skeins100g,
    notionsCost,
    packagingCost,
    labourCost,
    overheadShare,
    totalCogs,
    estimatedYards: yards.totalYards,
  };
}

/** Yarn-only cost for the convenience-premium sanity check. */
export function yarnOnlyCost(project: PatternProject, weight: YarnWeight, pricePerSkein: number): number {
  return estimateYarn(project, weight).skeins100g * pricePerSkein;
}

/** Per-kit designer net for each of the three kit channels. */
function channelNetPerKit(input: KitInput): Record<KitChannel, number> {
  // Self-sell: retail minus full platform + processing fees (shared seam).
  const self = platformNet(input.platform, input.retailPrice, Math.max(input.monthlyKitSales, 1));
  // Consignment: processor fees off the top, then the consignor split
  // (60/40 industry standard; Ravelry's in-store channel is the cited
  // knitting analog).
  const consignedGross = input.retailPrice * (1 - input.processorFeePct);
  const consignmentNet = consignedGross * input.consignorShare;
  // Wholesale: keystone — maker's wholesale price is retail ÷ 2, less
  // marketplace fee; the retailer keeps the rest as their margin.
  const wholesalePrice = input.retailPrice / 2;
  const wholesaleNet = wholesalePrice * (1 - input.wholesaleMarketplaceFeePct);
  return {
    'self-sell': Math.round(self.netPerSale * 100) / 100,
    consignment: Math.round(consignmentNet * 100) / 100,
    wholesale: Math.round(wholesaleNet * 100) / 100,
  };
}

export function analyzeKitChannels(input: KitInput): KitEconomics {
  const nets = channelNetPerKit(input);
  const monthlyNets: Record<KitChannel, number> = {
    'self-sell': Math.round(nets['self-sell'] * input.monthlyKitSales * 100) / 100,
    consignment: Math.round(nets.consignment * input.monthlyConsignmentSales * 100) / 100,
    wholesale: Math.round(
      (nets.wholesale * input.wholesaleKitsPerOrder * input.monthlyWholesaleOrders) * 100,
    ) / 100,
  };
  const channels: ChannelOutcome[] = (['self-sell', 'consignment', 'wholesale'] as KitChannel[]).map(
    channel => ({
      channel,
      netPerKit: nets[channel],
      monthlyNet: monthlyNets[channel],
      kitsToMatchBaseline: nets[channel] > 0 && input.soloPatternIncomeMonthly > 0
        ? Math.ceil(input.soloPatternIncomeMonthly / nets[channel])
        : Infinity,
      takePct: input.retailPrice > 0
        ? Math.round((nets[channel] / input.retailPrice) * 1000) / 10
        : 0,
    }),
  );
  let bestChannel: KitChannel | null = null;
  let bestMonthlyNet = 0;
  for (const c of channels) {
    if (c.monthlyNet > bestMonthlyNet) {
      bestChannel = c.channel;
      bestMonthlyNet = c.monthlyNet;
    }
  }
  return {
    channels,
    capacity: {
      cogsSharePct: input.retailPrice > 0
        ? Math.round((input.kitCogs / input.retailPrice) * 1000) / 10
        : 0,
      keystoneCapacity: input.retailPrice / 4 > input.kitCogs,
      retailToYarnMultiple: input.kitCogs > 0
        ? Math.round((input.retailPrice / input.kitCogs) * 10) / 10
        : 0,
      conveniencePremiumWarning: input.retailPrice > 1.8 * input.kitCogs,
    },
    bestChannel,
    bestMonthlyNet,
    beatsBaseline: bestMonthlyNet > input.soloPatternIncomeMonthly,
  };
}

/** Consignment-agreement clause checklist — the protections a designer should get in writing. */
export function consignmentClauseChecklist(options: {
  shopName: string;
  consignorShare: number;
  paymentTermDays?: number;
  unsoldReturnDays?: number;
} = { shopName: 'the yarn shop', consignorShare: 0.6 }): string[] {
  const sharePct = Math.round(options.consignorShare * 100);
  const shopPct = 100 - sharePct;
  const paymentDays = options.paymentTermDays ?? 30;
  const returnDays = options.unsoldReturnDays ?? 90;
  return [
    `${sharePct}/${shopPct} split written into the agreement, with the split applied AFTER payment-processor fees are deducted from the sale price.`,
    `Payment remitted within ${paymentDays} days of sale, with an itemized report of units sold, prices, and fees.`,
    `Unsold stock returnable (or purchasable at wholesale) after ${returnDays} days — inventory risk stays with the designer only while stock sits on a shelf.`,
    `Shop sets retail within a published price band and agrees not to discount below it; any promotion is approved in writing first.`,
    `The pattern's printout/insert remains the designer's copyrighted work — the shop may not photocopy it, re-sell it as a standalone PDF, or include it in bundles without a written license.`,
    `Stock counts reconciled monthly so unsold units don't quietly accumulate into "lost" inventory.`,
  ];
}

/** Paste-ready outreach note to a yarn shop proposing kits. */
export function generateKitProposal(
  project: PatternProject,
  kitRetail: number,
  wholesalePrice: number,
  options: { shopName?: string; designerName?: string } = {},
): string {
  const name = project.name || 'my pattern';
  const shop = options.shopName || '[shop name]';
  const designer = options.designerName || '[Designer name]';
  return (
    `Re: yarn kits from ${name}\n\n` +
    `Hi [shop contact],\n\n` +
    `I design ${name}, and I think it would make a lovely kit for ${shop}: your yarn plus my tech-edited pattern, packed and labelled, ready for your knitters. The retail price is $${kitRetail.toFixed(2)}, which puts a healthy keystone margin in the shop's pocket.\n\n` +
    `Two ways to run it:\n` +
    `1. Wholesale — you buy kits from me at $${wholesalePrice.toFixed(2)} (half retail, standard keystone), mark them to $${kitRetail.toFixed(2)}, and keep the difference on every sale. A typical first order would be [quantity] kits.\n` +
    `2. Consignment — stock on your shelves at the usual consignor split (I'd propose 60/40 after processor fees, in line with how the in-store channel is typically run), payment remitted monthly against an itemized sales report.\n\n` +
    `Each kit includes the full pattern insert (print or card), notions if needed, and packaging — no extra assembly time for your staff.\n\n` +
    `Happy to send a sample kit. What quantities and terms would work for ${shop}?\n\n` +
    `Warmly,\n${designer}\n`
  );
}
