// CHK-074 — Yarn Licensing Lab engine
// Prices a yarn-company licensing offer (flat fee / royalty / hybrid) against the
// designer's own self-publish long tail, adjusted for exclusivity drag, the value
// of yarn goods and publisher-paid services, and industry fair-value bands.
//
// Verified facts (session 74, Aug 2026):
// - Farm & Fiber Knits: flat $200-400 accessories, $400-750 garments; 1-yr exclusive.
// - Knit Picks IDP: no exclusivity, brand keeps 15% of pattern sale price.
// - Interweave Knits reports: flats $200-600; royalties 20% (non-exclusive) to
//   40% (semi-exclusive) of pattern sale price; rights revert after 10-12 months.
// - Malabrigo Quickies: unpaid "exposure" calls still issued by major brands.
// - Pattern Observer (2026): full-category exclusivity ≈ 2x the non-exclusive fee.
// - Royalty norm on kits: 5-15% of kit price; on pattern sales via publisher: 20-40%.
// - Self-publish: keep ~96.5-97%; pattern price $4-10; Ravelry Jan-2019: 72.3% of
//   sellers earned <$50/mo; 304 earned >=$1,000/mo; 93 earned >=$3,000/mo.

export type LicenseScope = "single-pattern" | "collection" | "full-catalog";
export type ReachTier = 1 | 2 | 3 | 4 | 5; // 1 = micro-indie; 5 = major brand

export interface YarnLicensingInput {
  brandName: string;
  scope: LicenseScope;
  /** total license term in months (0 = perpetual) */
  termMonths: number;
  /** months of exclusivity within the term; 0 = non-exclusive */
  exclusivityMonths: number;
  /** flat fee offered, $ (0 if none) */
  flatFee: number;
  /** royalty % of each unit sale the brand pays the designer (0-100) */
  royaltyPct: number;
  /** expected units (kits or pattern downloads) sold per month by the brand */
  expectedUnitsPerMonth: number;
  /** price per unit the brand sells at */
  unitPrice: number;
  /** retail value of free yarn / goods supplied, $ */
  yarnGoodsValue: number;
  /** value of services the brand pays for (tech edit, photo, layout, marketing) */
  brandPaidServices: number;
  /** designer's own design + sample hours for this work */
  designHours: number;
  /** designer's hourly rate */
  hourlyRate: number;
  /** designer's current self-publish earnings / month that this design supports, $ */
  ownMonthlyRevenue: number;
  /** brand reach tier — higher = royalty stream more trustworthy */
  brandReach: ReachTier;
  /** does the contract credit the designer by name (brand lift) */
  attribution: boolean;
  /** does the contract transfer/assign the copyright outright */
  copyrightTransfer: boolean;
}

export const DEFAULT_YARN_LICENSING: YarnLicensingInput = {
  brandName: "Indie Yarn Co.",
  scope: "single-pattern",
  termMonths: 12,
  exclusivityMonths: 12,
  flatFee: 350,
  royaltyPct: 0,
  expectedUnitsPerMonth: 40,
  unitPrice: 24,
  yarnGoodsValue: 60,
  brandPaidServices: 400,
  designHours: 30,
  hourlyRate: 45,
  ownMonthlyRevenue: 60,
  brandReach: 3,
  attribution: true,
  copyrightTransfer: false,
};

export interface FlagDetail { code: string; title: string; note: string; severity: "high" | "mid" | "low" }

export interface YarnLicensingResult {
  flatEV: number; // flat fee received during term
  royaltyEV: number; // royalty stream received during term (before risk discount)
  royaltyEVRiskAdjusted: number;
  yarnGoodsEV: number;
  servicesEV: number;
  totalOfferEV: number; // everything the brand gives you
  yourTimeCost: number;
  exclusivityDrag: number; // self-publish revenue lost during the exclusive window
  netEV: number; // totalOfferEV - timeCost - exclusivityDrag
  baselineEV: number; // what self-publishing this design earns over the same window
  yearsOfBaselineEarnings: number; // totalOfferEV expressed in months of baseline
  reachDiscount: number; // 0..1 risk haircut on the royalty stream
  minFlatToJustify: number; // flat fee that would clear baseline + time cost
  minRoyaltyPct: number; // royalty % that would clear baseline + time cost instead
  exclusivityPremium: number; // extra fee the lock is worth (2x industry rule)
  flags: FlagDetail[];
  verdict:
    | "Skip — exposure-only"
    | "Skip — below your baseline"
    | "Take the flat — royalty stream too speculative"
    | "Negotiate royalty share instead"
    | "Flat + royalty hybrid — worth it"
    | "Take it — clear win";
  verdictNote: string;
}

const REACH_DISCOUNT: Record<ReachTier, number> = { 1: 0.5, 2: 0.3, 3: 0.15, 4: 0.08, 5: 0.04 };
// Payment-risk haircut on royalty streams: micro brands pay ~half of what they
// report; missed late royalty checks are documented (F+W Media, late 2018).

const SCOPE_RISK: Record<LicenseScope, number> = { "single-pattern": 1, collection: 1.15, "full-catalog": 1.4 };

export function fmt$(n: number): string {
  return (
    (n < 0 ? "-$" : "$") +
    Math.abs(n)
      .toFixed(2)
      .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  );
}

export function analyzeYarnLicensing(input: YarnLicensingInput): YarnLicensingResult {
  const flags: FlagDetail[] = [];
  const term = input.termMonths > 0 ? input.termMonths : 120; // perpetual → 10yr horizon
  const exclusive = Math.min(Math.max(input.exclusivityMonths, 0), term);

  const flatEV = Math.max(input.flatFee, 0);

  // Royalty stream over the term, before risk haircut.
  const rawRoyaltyEV =
    (Math.max(input.expectedUnitsPerMonth, 0) *
      Math.max(input.unitPrice, 0) *
      clamp0100(input.royaltyPct) /
      100) *
    term;

  const reachDiscount = REACH_DISCOUNT[input.brandReach] * SCOPE_RISK[input.scope];
  const royaltyEVRiskAdjusted = rawRoyaltyEV * (1 - reachDiscount);

  const yarnGoodsEV = Math.max(input.yarnGoodsValue, 0);
  const servicesEV = Math.max(input.brandPaidServices, 0);
  const totalOfferEV = flatEV + royaltyEVRiskAdjusted + yarnGoodsEV + servicesEV;

  const yourTimeCost = input.designHours * input.hourlyRate;
  const baselineEV = input.ownMonthlyRevenue * term; // self-publish long tail over the same window
  const exclusivityDrag = input.ownMonthlyRevenue * exclusive;

  // Full buyout of a long-tail asset: compare against many years of baseline.
  const yearsOfBaselineEarnings =
    baselineEV > 0 ? totalOfferEV / input.ownMonthlyRevenue / 12 : 0;

  // Fair-value benchmarks (session-74 industry anchors):
  // accessory $200-400 / garment $400-750 flat; exclusivity ≈ 2x premium;
  // kit royalties 5-15%, pattern-sale royalties 20-40%.
  const exclusivityPremium = flatEV > 0 ? flatEV * 0.2 : 0; // 2x rule: the lock is worth ~1x the non-exclusive fee on top
  const minFlatToJustify = baselineEV + yourTimeCost - yarnGoodsEV - servicesEV - royaltyEVRiskAdjusted;
  const denomUnits = term * Math.max(input.expectedUnitsPerMonth, 1) * Math.max(input.unitPrice, 1);
  const minRoyaltyPct =
    denomUnits > 0
      ? Math.max((baselineEV + yourTimeCost - yarnGoodsEV - servicesEV - flatEV) / denomUnits, 0) * 100
      : 0;

  const netEV = totalOfferEV - yourTimeCost - exclusivityDrag;

  if (flatEV === 0 && royaltyEVRiskAdjusted === 0) {
    flags.push({
      code: "YL-01",
      title: "Exposure-only offer",
      note: "No money changes hands — even Malabrigo-style major brands issue unpaid calls. Yarn goods alone are not a license fee; you are donating a sellable asset.",
      severity: "high",
    });
  }
  if (input.copyrightTransfer) {
    flags.push({
      code: "YL-02",
      title: "Copyright transfer",
      note: "Outright assignment kills your long tail forever. The industry has shifted strongly away from buyouts — refuse, or price the deal as if it pays your baseline earnings for many years.",
      severity: "high",
    });
  }
  if (input.scope === "full-catalog") {
    flags.push({
      code: "YL-03",
      title: "Full-catalog sweep",
      note: "One agreement licensing your whole library is a $1,000-2,000-per-pattern deal at exclusivity-premium rates — do not accept per-pattern flat pricing on a catalog.",
      severity: "high",
    });
  }
  if (
    royaltyEVRiskAdjusted > 0 &&
    input.royaltyPct > 0 &&
    input.unitPrice > 0 &&
    input.royaltyPct < 5
  ) {
    flags.push({
      code: "YL-04",
      title: "Royalty below kit floor",
      note: `${input.royaltyPct}% is under the 5-15% kit-royalty norm — a $${input.unitPrice.toFixed(2)} unit returns pennies. At ${input.royaltyPct}% you need ${(1000 / (input.unitPrice * (input.royaltyPct / 100))).toFixed(0)} unit sales to earn $1,000.`,
      severity: "mid",
    });
  }
  if (flatEV > 0 && flatEV < 200) {
    flags.push({
      code: "YL-05",
      title: "Flat below accessory floor",
      note: `$${flatEV.toFixed(0)} is below the $200 accessory floor (accessories $200-400, garments $400-750). Even a hat fetched $200 from Interweave Knits.`,
      severity: "mid",
    });
  }
  if (exclusive > 0 && exclusive > 12) {
    flags.push({
      code: "YL-06",
      title: "Exclusivity over 12 months",
      note: `A ${exclusive}-month lock exceeds the standard 3-12 month window and the 10-12 month rights-reversion norm. Every month of lock burns ${fmt$(input.ownMonthlyRevenue)} of your own shop revenue.`,
      severity: "mid",
    });
  }
  if (input.brandReach <= 2 && royaltyEVRiskAdjusted > flatEV) {
    flags.push({
      code: "YL-07",
      title: "Micro-brand royalty bet",
      note: `Small-brand royalty streams carry a ~${(REACH_DISCOUNT[input.brandReach] * 100).toFixed(0)}% risk haircut (documented missed royalty payments). Prefer a flat fee from this counterparty.`,
      severity: "high",
    });
  }
  if (!input.attribution) {
    flags.push({
      code: "YL-08",
      title: "No attribution",
      note: "Uncredited work produces zero brand lift — you get neither money nor customers. Non-exclusive with byline is strictly better for a low fee.",
      severity: "mid",
    });
  }
  if (netEV < 0) {
    flags.push({
      code: "YL-09",
      title: "Deal loses money",
      note: `After your time cost and the exclusivity drag (${fmt$(exclusivityDrag)}), this offer nets ${fmt$(netEV)}. Self-publishing the same design earns more over the same window.`,
      severity: "high",
    });
  }

  let verdict: YarnLicensingResult["verdict"];
  let verdictNote: string;

  if (flatEV === 0 && royaltyEVRiskAdjusted === 0) {
    verdict = "Skip — exposure-only";
    verdictNote =
      totalOfferEV <= yourTimeCost
        ? `${fmt$(totalOfferEV)} in goods/services against ${fmt$(yourTimeCost)} of your time. Exposure-only calls from even major brands are documented — this deal pays you nothing.`
        : `${fmt$(totalOfferEV)} of goods and services helps, but the long tail of your pattern is worth far more than exposure.`;
  } else if (netEV < 0 || totalOfferEV < baselineEV) {
    verdict = "Skip — below your baseline";
    verdictNote =
      netEV < 0
        ? `${fmt$(netEV)} net after ${fmt$(yourTimeCost)} of your time and ${fmt$(exclusivityDrag)} of exclusivity drag. ${fmt$(baselineEV)} from your own shop over the same window.`
        : `The offer totals ${fmt$(totalOfferEV)} against ${fmt$(baselineEV)} of self-publish revenue over the same window — keep selling it yourself.`;
  } else if (flatEV > 0 && royaltyEVRiskAdjusted === 0) {
    verdict = "Take the flat — royalty stream too speculative";
    verdictNote = `Cash ${fmt$(flatEV)} now against a ${input.brandReach <= 3 ? "risk-rated" : "small"} royalty stream. The flat clears ${fmt$(yearsOfBaselineEarnings)} years of your baseline — but the ${exclusive}-month lock still costs ${fmt$(exclusivityDrag)}.`;
  } else if (royaltyEVRiskAdjusted > 0 && flatEV === 0) {
    verdict = "Negotiate royalty share instead";
    verdictNote = `A royalty-only deal puts all the risk on you. Ask for a flat fee of at least ${fmt$(Math.max(minFlatToJustify, 0))} on top, or raise the royalty toward the 5-15% kit norm.`;
  } else if (flatEV > 0 && royaltyEVRiskAdjusted > 0 && netEV > baselineEV * 0.5) {
    verdict = "Flat + royalty hybrid — worth it";
    verdictNote = `${fmt$(totalOfferEV)} total offer against ${fmt$(baselineEV)} baseline over the window. The hybrid structure hedges counterparty risk — this beats your shop during the exclusive period.`;
  } else {
    verdict = "Take it — clear win";
    verdictNote = `${fmt$(totalOfferEV)} total offer nets ${fmt$(netEV)} after time cost and exclusivity drag, against ${fmt$(baselineEV)} from your own shop. The deal earns ${(totalOfferEV / yourTimeCost).toFixed(1)}x your time rate.`;
  }

  return {
    flatEV,
    royaltyEV: rawRoyaltyEV,
    royaltyEVRiskAdjusted,
    yarnGoodsEV,
    servicesEV,
    totalOfferEV,
    yourTimeCost,
    exclusivityDrag,
    netEV,
    baselineEV,
    yearsOfBaselineEarnings,
    reachDiscount,
    minFlatToJustify,
    minRoyaltyPct,
    exclusivityPremium,
    flags,
    verdict,
    verdictNote,
  };
}

function clamp0100(n: number): number {
  return Math.min(100, Math.max(0, n));
}
