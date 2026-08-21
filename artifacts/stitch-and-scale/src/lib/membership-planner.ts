/**
 * Membership Business Planner (CHK-026).
 *
 * Models a Patreon-style pattern/community membership before the designer
 * launches one — tier structure, member ramp and churn, net revenue after
 * platform and processing fees, monthly production costs for exclusive
 * patterns, breakeven math, and a cannibalization check against standalone
 * pattern sales.
 *
 * Research anchors (session 27):
 * - Patreon standard fee is 10% for creators publishing after Aug 4, 2025
 *   (older pages 8%/12%); ~5% card processing on top — a $5 tier nets ~$4.15.
 * - Average support per patron: $5.40 (Q1 2025) → $6.10 (2026, Key-G audit).
 * - Real churn behaviour: bottom tier (~$3) = ~90% of members; members join
 *   for one pattern, download, cancel.
 * - MediaPeruana cost base still cited: a sweater pattern ≈ $155 direct
 *   (tech edit $40, model $40, yarn $75) + ~55 hours.
 * - New Wave Knitting 2025: $47k gross, $43k expenses, $3k kept — gross
 *   revenue illusions are the industry default; we model everything net.
 * - Snickerdoodle's Pattern Design Circle shows memberships can target
 *   designers (B2B) as well as knitters.
 */
import { platformNet, PLATFORMS, PlatformId } from '@/lib/pattern-income-calculator';
import { safeNum } from '@/lib/numeric-guard';

export const PLATFORM_FEE_PCT = 10; // Patreon standard
export const PROCESSING_FEE_PCT = 5;
export const PLATFORM_LABEL = `Patreon-style membership`;

/** Monthly cost of producing one exclusive pattern for members.
 *  MediaPeruana base: tech edit $40 + model $40 + yarn $75. */
export const DEFAULT_EXCLUSIVE_PATTERN_COST = 155;

/** Typical effort to design + deliver one exclusive member pattern (hours). */
export const DEFAULT_EXCLUSIVE_PATTERN_HOURS = 20;

export type MembershipTier = {
  name: string;
  price: number; // $/month
  members: number; // expected active members at steady state
  monthlyChurnPct: number; // 0-100; members lost per month
  perks: string[]; // short perk strings shown in the summary
};

export type MembershipInput = {
  tiers: MembershipTier[]; // 1-5 tiers
  rampMonths: number; // months to reach steady member counts
  platformRate: number; // e.g. 10 (%)
  processingRate: number; // e.g. 5 (%)
  exclusivePatternsPerMonth: number; // member-only patterns delivered monthly
  exclusivePatternCost: number; // $/pattern production
  designerHoursPerPattern: number; // hours per exclusive pattern
  designRate: number; // $/hr labour floor
  // Cannibalization: standalone pattern parked in the membership
  parkedPatternPrice: number;
  parkedPatternMonthlySalesLost: number; // sales/mo sacrificed
  platform: PlatformId;
  parkedHorizonMonths: number; // months parked in the membership
};

export type TierNet = {
  tier: MembershipTier;
  grossMonthly: number;
  platformFee: number;
  processingFee: number;
  netMonthly: number;
  netPerMember: number;
};

export type MembershipResult = {
  tiers: TierNet[];
  grossMonthly: number;
  platformFees: number;
  processingFees: number;
  netMonthly: number; // after all fees, before production
  productionCost: number; // exclusive patterns + labour floor drag
  labourFloor: number;
  profitMonthly: number; // net - production
  rampMonths: number;
  totalMembers: number;
  monthlyChurnedMembers: number;
  breakevenMembers: number; // at current avg net per member + costs
  monthsToBreakeven: number; // ramp adjusted
  cannibalization: {
    parkedLoss: number; // net standalone sales lost over horizon
    replacementRatio: number; // monthly membership profit / monthly parked loss
    verdict: 'worth it' | 'thin' | 'net loss';
  };
  verdict: 'go' | 'maybe' | 'no';
  verdictNote: string;
  flags: string[];
  tierCopy: string; // paste-ready tier page copy
};

export function defaultTiers(): MembershipTier[] {
  return [
    {
      name: 'Stitch Along',
      price: 3,
      members: 60,
      monthlyChurnPct: 15,
      perks: ['Exclusive monthly mini-pattern', 'Behind-the-scenes posts'],
    },
    {
      name: 'Pattern Club',
      price: 5,
      members: 30,
      monthlyChurnPct: 10,
      perks: ['Full monthly pattern', '20% off all shop patterns', 'Monthly pattern drop'],
    },
    {
      name: 'Design Inner Circle',
      price: 10,
      members: 10,
      monthlyChurnPct: 8,
      perks: ['Everything above', 'KAL access with designer', 'Early pattern releases'],
    },
  ];
}

function bounded(raw: unknown, min: number, max: number, fallback: number): number {
  const value = safeNum(typeof raw === 'number' ? raw : String(raw ?? ''), fallback);
  return Math.min(max, Math.max(min, value));
}

export function normalizeMembershipInput(input: Partial<MembershipInput> = {}): MembershipInput {
  const base = {
    tiers: defaultTiers(),
    rampMonths: 6,
    platformRate: PLATFORM_FEE_PCT,
    processingRate: PROCESSING_FEE_PCT,
    exclusivePatternsPerMonth: 1,
    exclusivePatternCost: DEFAULT_EXCLUSIVE_PATTERN_COST,
    designerHoursPerPattern: DEFAULT_EXCLUSIVE_PATTERN_HOURS,
    designRate: 12,
    parkedPatternPrice: 8,
    parkedPatternMonthlySalesLost: 20,
    platform: 'ravelry' as PlatformId,
    parkedHorizonMonths: 12,
  };
  const raw = { ...base, ...input };
  const tiers = Array.isArray(raw.tiers) && raw.tiers.length > 0
    ? raw.tiers.slice(0, 5).map((tier, index) => {
        const fallback = base.tiers[Math.min(index, base.tiers.length - 1)];
        return {
          ...fallback,
          ...tier,
          name: typeof tier.name === 'string' ? tier.name.slice(0, 120) : fallback.name,
          price: bounded(tier.price, 0, 10_000, fallback.price),
          members: Math.round(bounded(tier.members, 0, 10_000_000, fallback.members)),
          monthlyChurnPct: bounded(tier.monthlyChurnPct, 0, 100, fallback.monthlyChurnPct),
          perks: Array.isArray(tier.perks)
            ? tier.perks.filter((perk): perk is string => typeof perk === 'string').slice(0, 20).map((perk) => perk.slice(0, 240))
            : fallback.perks,
        };
      })
    : base.tiers;
  const platform = (PLATFORMS as readonly PlatformId[]).includes(raw.platform) ? raw.platform : base.platform;
  return {
    tiers,
    rampMonths: Math.round(bounded(raw.rampMonths, 1, 36, base.rampMonths)),
    platformRate: bounded(raw.platformRate, 0, 100, base.platformRate),
    processingRate: bounded(raw.processingRate, 0, 100, base.processingRate),
    exclusivePatternsPerMonth: Math.round(bounded(raw.exclusivePatternsPerMonth, 0, 6, base.exclusivePatternsPerMonth)),
    exclusivePatternCost: bounded(raw.exclusivePatternCost, 0, 1_000_000, base.exclusivePatternCost),
    designerHoursPerPattern: bounded(raw.designerHoursPerPattern, 0, 1_000, base.designerHoursPerPattern),
    designRate: bounded(raw.designRate, 12, 10_000, base.designRate),
    parkedPatternPrice: bounded(raw.parkedPatternPrice, 0, 1_000_000, base.parkedPatternPrice),
    parkedPatternMonthlySalesLost: Math.round(bounded(raw.parkedPatternMonthlySalesLost, 0, 1_000_000, base.parkedPatternMonthlySalesLost)),
    platform,
    parkedHorizonMonths: Math.round(bounded(raw.parkedHorizonMonths, 1, 60, base.parkedHorizonMonths)),
  };
}

function netPerMember(price: number, platformRate: number, processingRate: number): number {
  // Platform takes platformRate% of gross; processing ~processingRate% of what's left
  const afterPlatform = price * (1 - platformRate / 100);
  const net = afterPlatform * (1 - processingRate / 100);
  return Math.round(net * 100) / 100;
}

export function analyzeMembership(input: MembershipInput): MembershipResult {
  input = normalizeMembershipInput(input);
  const rampMonths = Math.max(input.rampMonths, 1);
  const platformRate = input.platformRate || PLATFORM_FEE_PCT;
  const processingRate = input.processingRate || PROCESSING_FEE_PCT;

  const tierNets: TierNet[] = input.tiers.map((tier) => {
    const grossMonthly = tier.price * tier.members;
    const platformFee = Math.round((grossMonthly * platformRate / 100) * 100) / 100;
    const afterPlatform = grossMonthly - platformFee;
    const processingFee = Math.round((afterPlatform * processingRate / 100) * 100) / 100;
    const netMonthly = Math.round((grossMonthly - platformFee - processingFee) * 100) / 100;
    const netPerMember = tier.members > 0 ? Math.round((netMonthly / tier.members) * 100) / 100 : 0;
    return { tier, grossMonthly, platformFee, processingFee, netMonthly, netPerMember };
  });

  const grossMonthly = Math.round(tierNets.reduce((s, t) => s + t.grossMonthly, 0) * 100) / 100;
  const platformFees = Math.round(tierNets.reduce((s, t) => s + t.platformFee, 0) * 100) / 100;
  const processingFees = Math.round(tierNets.reduce((s, t) => s + t.processingFee, 0) * 100) / 100;
  const netMonthly = Math.round(tierNets.reduce((s, t) => s + t.netMonthly, 0) * 100) / 100;

  const exclusivePatterns = Math.max(input.exclusivePatternsPerMonth, 0);
  const productionCost = Math.round(
    (exclusivePatterns * (input.exclusivePatternCost || DEFAULT_EXCLUSIVE_PATTERN_COST)
      + exclusivePatterns * (input.designerHoursPerPattern || DEFAULT_EXCLUSIVE_PATTERN_HOURS)
        * Math.max(input.designRate || 12, 12)) * 100,
  ) / 100;
  const labourFloor = Math.round(
    exclusivePatterns * (input.designerHoursPerPattern || DEFAULT_EXCLUSIVE_PATTERN_HOURS)
      * Math.max(input.designRate || 12, 12) * 100,
  ) / 100;

  const profitMonthly = Math.round((netMonthly - productionCost) * 100) / 100;

  const totalMembers = input.tiers.reduce((s, t) => s + Math.max(t.members, 0), 0);
  const monthlyChurnedMembers = Math.round(
    input.tiers.reduce((s, t) => s + t.members * (Math.max(t.monthlyChurnPct, 0) / 100), 0) * 10,
  ) / 10;

  // Breakeven: members needed so net revenue covers production at the current
  // weighted net-per-member.
  const weightedNetPerMember = totalMembers > 0
    ? Math.round((netMonthly / totalMembers) * 100) / 100
    : 0;
  const breakevenMembers = weightedNetPerMember > 0
    ? Math.ceil(productionCost / weightedNetPerMember)
    : 0;
  // Months of current profit needed to recover monthly production cost (0 when
  // already profitable, i.e. breakeven needs no catch-up).
  const monthsToBreakeven = profitMonthly >= 0 || productionCost <= 0
    ? 0
    : Math.ceil(productionCost / Math.abs(profitMonthly));

  // Cannibalization: the pattern parked in the membership stops selling standalone
  const parkedNetPerSale = platformNet(
    input.platform,
    input.parkedPatternPrice,
    Math.max(input.parkedPatternMonthlySalesLost, 0),
  ).netPerSale;
  const parkedLoss = Math.round(
    parkedNetPerSale * Math.max(input.parkedPatternMonthlySalesLost, 0)
      * Math.max(input.parkedHorizonMonths, 0) * 100,
  ) / 100;
  const parkedMonthlyLoss = parkedLoss / Math.max(input.parkedHorizonMonths, 1);
  const replacementRatio = parkedMonthlyLoss > 0
    ? Math.round((profitMonthly / parkedMonthlyLoss) * 100) / 100
    : 0;
  let cannabVerdict: MembershipResult['cannibalization']['verdict'] = 'worth it';
  if (parkedLoss > 0 && replacementRatio < 1) cannabVerdict = 'net loss';
  else if (parkedLoss > 0 && replacementRatio < 2) cannabVerdict = 'thin';

  // Verdict
  const flags: string[] = [];
  const bottomTier = [...input.tiers].sort((a, b) => a.price - b.price)[0];
  if (bottomTier && bottomTier.price <= 3 && bottomTier.members > totalMembers * 0.8) {
    flags.push(
      `${bottomTier.name} ($${bottomTier.price}) holds ${Math.round((bottomTier.members / totalMembers) * 100)}% of members — that's the classic churn trap: members join for one pattern, download, cancel. Rebalance perks so the middle tier earns its keep.`,
    );
  }
  const bottomNetPerMember = bottomTier
    ? netPerMember(bottomTier.price, platformRate, processingRate)
    : 0;
  if (bottomNetPerMember < 2) {
    flags.push(
      `Your bottom tier nets $${bottomNetPerMember.toFixed(2)}/member after the ${platformRate}% platform + ~${processingRate}% processing — below meaningful economics. Consider $5 as the floor tier or gate the best perks behind it.`,
    );
  }
  if (platformRate > 12) {
    flags.push(
      `Platform rate ${platformRate}% is above Patreon's standard 10% — check if you're on a legacy plan or a pricier platform (Kajabi etc.).`,
    );
  }
  if (exclusivePatterns > 0 && profitMonthly < 0) {
    flags.push(
      `Delivering ${exclusivePatterns} exclusive pattern(s)/month costs $${productionCost.toFixed(0)} — the membership loses $${Math.abs(profitMonthly).toFixed(0)}/mo. Either raise prices, cut deliverables, or cap exclusive patterns at what the member base funds.`,
    );
  }
  if (monthlyChurnedMembers > totalMembers * 0.15 && totalMembers > 0) {
    flags.push(
      `${monthlyChurnedMembers.toFixed(0)} members churn monthly (>15% of base). Growth stalls unless you're onboarding that many new members — plan a launch cadence or a launch-month bonus pattern.`,
    );
  }

  let verdict: MembershipResult['verdict'] = 'go';
  let verdictNote = '';
  if (netMonthly <= 0) {
    verdict = 'no';
    verdictNote = `Projected net is $${netMonthly.toFixed(0)}/mo — don't launch yet. Raise tier prices or grow the audience first.`;
  } else if (profitMonthly < 0 && cannabVerdict === 'net loss') {
    verdict = 'no';
    verdictNote = `Membership loses $${Math.abs(profitMonthly).toFixed(0)}/mo after production AND eats $${parkedMonthlyLoss.toFixed(0)}/mo of standalone sales. Reprice or reduce deliverables.`;
  } else if (profitMonthly < 0) {
    verdict = 'maybe';
    verdictNote = `Membership nets $${netMonthly.toFixed(0)}/mo but production costs $${productionCost.toFixed(0)} — $${Math.abs(profitMonthly).toFixed(0)}/mo short. Breakeven needs ~${breakevenMembers} members at today's tier mix.`;
  } else if (cannabVerdict === 'thin' || flags.length > 0) {
    verdict = 'maybe';
    verdictNote = `Membership profits $${profitMonthly.toFixed(0)}/mo at ${totalMembers} members, but watch the flags — ${cannabVerdict === 'thin' ? `the parked pattern's lost sales ($${parkedMonthlyLoss.toFixed(0)}/mo) are only ${replacementRatio.toFixed(2)}× covered` : 'tier structure leaks value to churn'}.`;
  } else {
    verdict = 'go';
    verdictNote = `Membership profits $${profitMonthly.toFixed(0)}/mo with ${totalMembers} members — breakeven at ~${breakevenMembers} members, reached ${cannabVerdict === 'worth it' ? 'and beyond the parked pattern\'s $' + parkedMonthlyLoss.toFixed(0) + '/mo lost sales' : ''}.`;
  }

  // Tier page copy
  const tierCopy = input.tiers.map((t) => {
    const tn = tierNets.find((x) => x.tier === t);
    return [
      `— ${t.name} · $${t.price}/month —`,
      ...t.perks.map((p) => `  • ${p}`),
      '',
    ].join('\n');
  }).join('\n');

  return {
    tiers: tierNets,
    grossMonthly,
    platformFees,
    processingFees,
    netMonthly,
    productionCost,
    labourFloor,
    profitMonthly,
    rampMonths,
    totalMembers,
    monthlyChurnedMembers,
    breakevenMembers,
    monthsToBreakeven,
    cannibalization: { parkedLoss, replacementRatio, verdict: cannabVerdict },
    verdict,
    verdictNote,
    flags,
    tierCopy,
  };
}
