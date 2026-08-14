/**
 * Designer-side deal evaluator — model an offer a yarn company / magazine /
 * publisher makes for the designer's pattern (flat fee, royalty, exclusivity,
 * license, yarn-support-only) and produce a verdict, term-by-term risk flags,
 * and a copy-paste terms response.
 *
 * RESEARCH BASIS (all cited, see research/competitors-session-14-wholesale-deal-evaluator.md):
 *
 * - Who Pays Knitters (whopaysknitters.com, staff writer Hannah Thiessen):
 *   accessory design rates via its crowdsourced database ran $40–$700, average
 *   $246, and "often do not include costs for technical editing, photography,
 *   and layout". Rights variants: full rights (increasingly rare and
 *   expensive), partial rights (flat fee + exclusivity typically 6–12 months,
 *   designer keeps sales after), yarn support only (no residuals).
 * - Stitchcraft Marketing (Jul 2017): the three standard structures are
 *   royalties with no exclusivity (designer sells anywhere from day one),
 *   royalties with exclusivity (3 months – 1 year), and non-exclusive license
 *   (company buys resale rights, usually wholesale + own website only, no
 *   further compensation). Full buyouts are rare and shifting away.
 * - Quince & Co. submission guide: publisher covers yarn, photography, tech
 *   editing, layout, marketing; publisher holds exclusive sales rights on its
 *   own site and Ravelry, paying royalties there; designer keeps 100% of
 *   sales on own site/Payhip; lead times longer than self-publishing.
 * - Laine Publishing: exclusive rights held 5 months, then designer free.
 * - Making Stories (Apr 2019): royalties of 30% of net Ravelry proceeds and
 *   20% net in-store.
 * - Sandi Rosner (Jul 2024): designers who self-publish must cover tech edit,
 *   photography, layout, marketing themselves; commissioned work pays a flat
 *   fee for steps 1–5 while publisher owns 6–9. Ravelry 2019 stats: 72.3% of
 *   pattern sellers earned under $50 in a month — self-publish is NOT a safe
 *   fallback assumption, which is why the evaluator asks for realistic sales.
 * - Slow Knitting (2024): fees of $0–$200 are common for newer designers;
 *   yarn support means free yarn in exchange for the design.
 *
 * DESIGN: no invented market constants beyond the cited figures. The baseline
 * for comparison is the designer's own realistic self-publish estimate (their
 * own monthly volume and price — the same numbers the Income Planner uses),
 * and every red flag is checked against the cited ranges with the designer's
 * overrides honored.
 *
 * OUTPUT: per-offer verdict (take / counter / walk away), red-flag list,
 * effective hourly rate, and a paste-ready terms response.
 */

export type DesignOfferType =
  | 'flat_fee'
  | 'royalty_no_exclusivity'
  | 'royalty_with_exclusivity'
  | 'non_exclusive_license'
  | 'yarn_support_only';

export interface DesignOfferInput {
  /** Flat fee offered, in $. Used by flat-fee offers. */
  fee?: number;
  /** Royalty share of company/net proceeds, decimal. Used by royalty offers. */
  royaltyPct?: number;
  /** Expected company-channel sales (used by royalty offers) OR the designer's own monthly sales volume when self-publishing. */
  salesVolume: number;
  /** The pattern's recommended price, in $. */
  patternPrice: number;
  /** Platform used for sales calculations (same identifiers as the income calculator). */
  platform: 'ravelry' | 'etsy' | 'ribblr' | 'payhip';
  /** Exclusivity window in months. 0 = none. */
  exclusivityMonths: number;
  /** The company covers tech editing. */
  techEditCovered: boolean;
  /** The company covers photography. */
  photographyCovered: boolean;
  /** The company covers layout/graphics. */
  layoutCovered: boolean;
  /** Designer may keep selling the pattern on their own site/Payhip. */
  keepsOwnSiteRights: boolean;
  /** Designer may sell wholesale to yarn shops (LYS) during/after the window. */
  keepsWholesaleRights: boolean;
  /** Company provides free yarn; value in $ (0 = none). */
  yarnSupportValue: number;
  /** Designer's design + grading hours for this pattern. */
  designHours: number;
  /** Designer's hourly rate, in $/hr. */
  hourlyRate: number;
  /** Designer's own production costs not covered by the company, in $. */
  uncoveredCosts: number;
}

/** Red-flag check result with a stable code, severity, and designer-facing text. */
export interface DesignOfferFlag {
  code: string;
  severity: 'error' | 'warning' | 'note';
  detail: string;
}

export interface DesignOfferVerdict {
  /** Normalised expected value of the offer, in $, for the exclusivity window. */
  estimatedOfferValue: number;
  /** Value of self-publishing the same window, in $, after the designer's own costs. */
  selfPublishValue: number;
  /** Designer's effective hourly rate on this offer, in $/hr. */
  effectiveHourlyRate: number;
  verdict: 'take' | 'counter' | 'walk_away';
  summary: string;
  flags: DesignOfferFlag[];
}

/**
 * Platform net per sale — delegated to the verified income calculator so both
 * evaluators always agree on fee math (3.5% Ravelry below $30/mo threshold
 * behaviour, Etsy 6.5% + listing, etc.).
 */
import { platformNet } from './pattern-income-calculator';

function platformNetFor(input: DesignOfferInput, units: number): number {
  if (units <= 0) return 0;
  return platformNet(input.platform, input.patternPrice, units).netRevenue;
}

/**
 * Self-publish value over the offer's window: the designer's own realistic
 * sales volume, net of platform fees. Used as the baseline every offer must
 * beat — a designer's number, never a generic "sweaters sell well" guess.
 */
function selfPublishValue(input: DesignOfferInput): number {
  return platformNetFor(input, input.salesVolume);
}

/**
 * Evaluate one design offer against the designer's own self-publish baseline.
 */
export function evaluateDesignOffer(input: DesignOfferInput): DesignOfferVerdict {
  const flags: DesignOfferFlag[] = [];
  const timeCost = Math.max(input.designHours * input.hourlyRate, 0);

  // --- Offer value: what the designer receives, window-adjusted. ----------
  let offerValue = 0;
  if (input.fee !== undefined) offerValue += Math.max(input.fee, 0);
  offerValue += Math.max(input.yarnSupportValue || 0, 0);

  if (input.royaltyPct !== undefined && input.royaltyPct > 0) {
    // Royalties run on the COMPANY's net proceeds (Making Stories structure).
    const companyNet = platformNetFor(input, input.salesVolume);
    offerValue += companyNet * Math.min(Math.max(input.royaltyPct, 0), 1);
  }

  // --- Self-publish baseline ------------------------------------------------
  const base = selfPublishValue(input);

  // --- Term flags -----------------------------------------------------------
  // 1. Perpetual / full buyout: Stitchcraft Marketing — full buyouts are rare
  //    and expensive; below the cited accessory floor ($246 avg WPK, floor ~$250)
  //    they're underpriced, and a floor below even yarn-support value is a
  //    giveaway.
  if (input.fee !== undefined && input.royaltyPct === undefined) {
    const noRights = !input.keepsOwnSiteRights && !input.keepsWholesaleRights;
    if (noRights && input.fee < 250) {
      flags.push({
        code: 'DO-01',
        severity: 'error',
        detail: `A flat fee of $${Math.round(input.fee)} with no resale rights is below the cited flat-fee floor (~$250, WPK accessory average $246 excluding tech edit/photo/layout). Whoever Pays Knitters treats flat-fee + exclusivity of 6–12 months as the floor — a full buyout below that is giving the pattern away.`,
      });
    }
    if (input.exclusivityMonths >= 24) {
      flags.push({
        code: 'DO-02',
        severity: noRights ? 'error' : 'warning',
        detail: `${input.exclusivityMonths}-month exclusivity exceeds the cited 6–12 month range (WPK/Stitchcraft Marketing). Stitchcraft notes exclusivity runs 3 months – 1 year; beyond 12 months the company is buying a long slice of your catalogue for a one-off fee${noRights ? ' while holding your resale rights too' : ''}.`,
      });
    }
    if (input.fee <= 0 && (input.yarnSupportValue || 0) > 0 && input.keepsOwnSiteRights) {
      flags.push({
        code: 'DO-03',
        severity: 'note',
        detail: `No fee — this is the "yarn support only" arrangement (WPK): you cover your own costs and receive no residuals. Fair only if you wanted the exposure anyway and the yarn value is worth more to you than your time.`,
      });
    }
  }

  // 2. Rights checks — Quince & Co. sets the fair benchmark: company gets its
  //    site + Ravelry exclusively, designer keeps own site/Payhip at 100%.
  if (input.royaltyPct !== undefined && input.royaltyPct > 0) {
    if (!input.keepsOwnSiteRights) {
      flags.push({
        code: 'DO-04',
        severity: 'error',
        detail: `Royalty deal but you're banned from your own site/Payhip. The cited fair structure (Quince & Co.) pays royalties on company-channel sales while the designer keeps 100% of their own-site sales. Ask for your own channel back.`,
      });
    }
    if (input.royaltyPct < 0.2) {
      flags.push({
        code: 'DO-05',
        severity: 'warning',
        detail: `Royalty of ${Math.round((input.royaltyPct || 0) * 100)}% is below the cited range (Making Stories paid 30% net Ravelry / 20% net in-store). Below 20% the company's channel reach has to be very large to be worth the exclusivity.`,
      });
    }
  }

  // 3. Production-cost coverage — the single biggest line item (Media Peruana:
  //    $40–65 tech edit alone; WPK notes flat fees often exclude all three).
  if (!input.techEditCovered && input.fee !== undefined) {
    flags.push({
      code: 'DO-06',
      severity: 'warning',
      detail: `Tech editing isn't covered and flat-fee offers commonly exclude it (WPK). Budget $40–65+ on top of this fee (your own Tech Edit tab computes the real number for this pattern).`,
    });
  }
  if (!input.photographyCovered && input.fee !== undefined) {
    flags.push({
      code: 'DO-07',
      severity: 'note',
      detail: `Photography isn't covered — professional shoots run $100–300+ per pattern. If you can't do photos, that comes out of this fee.`,
    });
  }

  // 4. "Free pattern" trap — the slow-knitting variant of yarn support where
  //    the company also requires the pattern to be free to knitters.
  if ((input.yarnSupportValue || 0) > 0 && input.fee === 0 && !input.keepsOwnSiteRights) {
    flags.push({
      code: 'DO-08',
      severity: 'warning',
      detail: `Yarn only, no fee, and no resale rights: the company gets a permanent exclusive pattern for the price of one skein. Even yarn-support deals (WPK) keep the designer's sales rights — ask to self-sell at least.`,
    });
  }

  // 5. Value check — the offer must beat self-publishing or come close; the
  //    Ravelry 2019 stats warn that self-publishing < $50/month is common, so
  //    the baseline uses the designer's own stated volume, not a guess.
  let verdict: DesignOfferVerdict['verdict'];
  let summary: string;
  if (offerValue >= base) {
    verdict = 'take';
    summary = `The offer is worth ~$${Math.round(offerValue)} over the window — better than your own-channel baseline of ~$${Math.round(base)}. Terms are workable as offered; watch the flagged rights items.`;
  } else if (offerValue >= base * 0.7) {
    const gap = Math.round(base - offerValue);
    verdict = 'counter';
    summary = `The offer is worth ~$${Math.round(offerValue)} vs ~$${Math.round(base)} self-publishing — close, but counter for the $${gap} gap (e.g. higher fee, royalty %, or shorter exclusivity).`;
  } else {
    const gap = Math.round(base - offerValue);
    verdict = 'walk_away';
    summary = `The offer is worth ~$${Math.round(offerValue)} vs ~$${Math.round(base)} self-publishing — a $${gap} gap that rights concessions won't close. Self-publish or wait for a better structure.`;
  }

  // 6. Effective hourly rate — the designer's own money number.
  const effectiveHourlyRate =
    input.designHours > 0 ? Math.round((offerValue / input.designHours) * 100) / 100 : 0;
  if (effectiveHourlyRate > 0 && effectiveHourlyRate < input.hourlyRate * 0.5) {
    flags.push({
      code: 'DO-09',
      severity: 'warning',
      detail: `Effective rate is $${effectiveHourlyRate.toFixed(2)}/hr against your $${input.hourlyRate}/hr rate — under half your usual rate even before any uncovered costs.`,
    });
  }

  return {
    estimatedOfferValue: Math.round(offerValue * 100) / 100,
    selfPublishValue: Math.round(base * 100) / 100,
    effectiveHourlyRate,
    verdict,
    summary,
    flags,
  };
}

/**
 * Paste-ready response a designer can send back about a design offer, grounded
 * strictly in the computed numbers — nothing claimed that isn't.
 */
export function generateOfferResponse(input: DesignOfferInput, verdict: DesignOfferVerdict): string {
  const lines: string[] = [];
  lines.push(
    `Thanks so much for the offer — I've modeled it against what this pattern would do on my own channel ` +
    `(${input.salesVolume} sales at $${Math.round(input.patternPrice)} over the same window, ${fmtVerdictValue(verdict.selfPublishValue)} net after platform fees).`,
  );
  lines.push(
    `For this design I'm investing ${input.designHours} hours of design and grading work ` +
    `${!input.techEditCovered ? 'plus tech editing I\u2019d need to commission' : ''}${!input.photographyCovered ? ' and photography' : ''}.`,
  );
  if (input.exclusivityMonths > 0) {
    lines.push(
      `The ${input.exclusivityMonths}-month exclusivity also holds back my direct sales during that window.`,
    );
  }
  if (verdict.verdict === 'take') {
    lines.push(
      `On these terms the offer works out to ${fmtVerdictValue(verdict.estimatedOfferValue)} for me, which clears my ` +
      `baseline — happy to proceed. Can we put the rights and coverage items (${verdict.flags
        .map(f => f.detail.slice(0, 60))
        .join('; ') || 'as discussed'}) in writing?`,
    );
  } else if (verdict.verdict === 'counter') {
    const gap = Math.round(verdict.selfPublishValue - verdict.estimatedOfferValue);
    lines.push(
      `Right now the offer comes to about ${fmtVerdictValue(verdict.estimatedOfferValue)} against my ` +
      `${fmtVerdictValue(verdict.selfPublishValue)} baseline — a gap of about $${gap}. ` +
      `If we can close that with a higher fee${input.royaltyPct !== undefined ? ' or a royalty share closer to the 20–30% net structure common for this work' : ''}, ` +
      `I'm in.`,
    );
  } else {
    lines.push(
      `As it stands, the offer doesn't cover the window it holds back from my own channel — ` +
      `I think self-publishing this one is the better fit for now, and I'd love to work together on something else.`,
    );
  }
  return lines.join(' ');
}

function fmtVerdictValue(n: number): string {
  return `$${Math.round(n).toLocaleString('en-US')}`;
}

export const DESIGN_OFFER_TYPES: DesignOfferType[] = [
  'flat_fee',
  'royalty_no_exclusivity',
  'royalty_with_exclusivity',
  'non_exclusive_license',
  'yarn_support_only',
];

export const DESIGN_OFFER_TYPE_LABELS: Record<DesignOfferType, string> = {
  flat_fee: 'Flat fee',
  royalty_no_exclusivity: 'Royalty, no exclusivity',
  royalty_with_exclusivity: 'Royalty + exclusivity',
  non_exclusive_license: 'Non-exclusive license',
  yarn_support_only: 'Yarn support only',
};
