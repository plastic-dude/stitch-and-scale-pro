/**
 * Pattern Licensing & Rights Marketplace Planner (CHK-025).
 *
 * Prices a licence offer on an existing self-owned pattern — non-exclusive,
 * extended commercial-use, royalty-based, and full exclusive buyout — against
 * what self-publishing the same pattern would earn over the rights window.
 *
 * Research anchors (session 26):
 * - Stitchcraft Marketing (industry broker): the 3 real yarn-company structures —
 *   royalties with no exclusivity, royalties with exclusivity (3–12 month window),
 *   and non-exclusive licence purchase; buyouts have been "shifted away from"
 *   (led by designers refusing to give work away for free).
 * - The Pattern Cloud (2026): on marketplaces "exclusive" always means a full,
 *   permanent, worldwide rights transfer (a buyout). Time-limited or
 *   territory-limited exclusivity where the designer keeps ownership is NOT a
 *   platform product — it must be negotiated directly.
 * - Slow Knitting (2024): Vogue Knitting paid a $500 flat fee for a magazine
 *   design with yarn support; 70%+ of designers make <$50/mo on patterns.
 * - Tendyke sample rate $0.25/yd; small-design fee band $80–140 (CHK-019);
 *   net per sale on platforms from platformNet (Ravelry $5.70 @ $8).
 */
import { PatternProject } from '@/lib/grading-engine';
import { estimateYarn } from '@/lib/yarn-estimator';
import { platformNet, PlatformId } from '@/lib/pattern-income-calculator';

export const PROFESSIONAL_FLOOR = 12;
export const DEFAULT_DESIGN_RATE = 25;

/** Exclusive buyout price relative to a non-exclusive one-off fee — the
 *  surface-design practice TPC's own pricing tab relies on: an exclusive sale
 *  kills the self-sell stream permanently, so it must be a multiple. */
export const EXCLUSIVE_FLOOR_MULTIPLE = 4;

export type LicenceType =
  | 'nonExclusive'
  | 'extendedNonExclusive'
  | 'royaltyNonExclusive'
  | 'royaltyExclusive'
  | 'exclusiveBuyout';

export const LICENCE_LABELS: Record<LicenceType, string> = {
  nonExclusive: 'Non-exclusive (one-off fee)',
  extendedNonExclusive: 'Extended commercial-use',
  royaltyNonExclusive: 'Royalties, no exclusivity',
  royaltyExclusive: 'Royalties + exclusivity window',
  exclusiveBuyout: 'Full rights transfer (buyout)',
};

export type LicenceOffer = {
  type: LicenceType;
  fee: number; // one-off fee (0 for royalty-only offers)
  royaltyPercent: number; // per-sale royalty the licensor pays on their sales
  licensorMonthlySales: number; // expected monthly sales on the licensor's channel
  exclusivityMonths: number; // 0 for no-exclusivity structures
  licensorPaysProduction: boolean; // sample / photo / tech-edit covered
  productionCost: number; // designer-side production cost if not covered
  marketingIncluded: boolean;
  derivativeRightsTransferred: boolean; // do expanded sizes / derivatives belong to licensor
  worldwide: boolean; // worldwide vs territory-limited
  paymentTimingMonths: number; // 0 = on signing; >0 = on delivery/payment lag
  creditAndPromotionRights: boolean; // designer keeps promotion/credit rights
};

export type LicenceInput = {
  project: PatternProject;
  yarnWeight: string;
  platform: PlatformId;
  price: number;
  monthlySales: number; // pattern's expected self-sell rate
  designRate: number;
  effortHours: number; // hours the designer already invested
  horizonMonths: number; // comparison horizon (default 24)
  offer: LicenceOffer;
};

export type RightsCheck = {
  check: string;
  pass: boolean;
  note: string;
};

export type LicenceResult = {
  type: LicenceType;
  // Value legs
  selfSellValue: number; // what self-publishing earns over the exclusivity window
  licensorIncomeValue: number; // fee + royalties (net of production cost)
  labourValue: number; // effortHours × designRate
  totalOfferValue: number;
  verdict: 'go' | 'maybe' | 'no';
  verdictNote: string;
  // Rights audit
  rightsAudit: RightsCheck[];
  rightsScore: number; // passed / total
  // Comparison
  keepVsSell: {
    selfSell24: number; // 24-month self-publish value
    sellValue: number; // total value of selling now
    difference: number; // positive = sell wins
  };
  notes: string[];
  offerLetter: string;
};

function netPerSale(input: { platform: PlatformId; price: number; monthlySales: number }): number {
  return platformNet(input.platform, input.price, input.monthlySales).netPerSale;
}

export function analyzeLicenseOffer(input: LicenceInput): LicenceResult {
  const { price, monthlySales, designRate, effortHours, horizonMonths, offer } = input;
  const rate = Math.max(designRate || DEFAULT_DESIGN_RATE, PROFESSIONAL_FLOOR);
  const nps = netPerSale({ platform: input.platform, price, monthlySales });

  // Self-sell value: the income sacrificed during the exclusivity window.
  // A buyout is permanent, so it costs the full horizon — the designer loses
  // the pattern forever, not just for a window.
  const isBuyout = offer.type === 'exclusiveBuyout';
  const window = isBuyout
    ? horizonMonths
    : Math.max(offer.exclusivityMonths, 0);
  const selfSellValue = Math.round(nps * monthlySales * Math.min(window, horizonMonths) * 100) / 100;

  // Licensor income leg: fee + royalties on licensor-side sales (quarterly reporting lag →
  // conservative: apply a 10% haircut for reporting/payment delay)
  const royaltySales = Math.round(
    offer.royaltyPercent / 100 * nps * offer.licensorMonthlySales * horizonMonths * 0.9 * 100,
  ) / 100;
  const productionDrag = offer.licensorPaysProduction ? 0 : (offer.productionCost || 0);
  const licensorIncomeValue = Math.round((offer.fee + royaltySales - productionDrag) * 100) / 100;

  // Labour floor: what the hours invested must clear at the professional floor
  const labourValue = Math.round(rate * effortHours * 100) / 100;

  // Total offer value: licensor income, but for a buyout we add the premium that a
  // permanent transfer deserves over a simple fee (the designer loses the pattern
  // forever — the self-sell stream continues past any window).
  const buyoutPremium = isBuyout
    ? Math.round(selfSellValue * (EXCLUSIVE_FLOOR_MULTIPLE - 1) * 100) / 100
    : 0;
  const totalOfferValue = Math.round((licensorIncomeValue + buyoutPremium) * 100) / 100;

  // --- Rights audit (8 checks) ---
  const rightsAudit: RightsCheck[] = [];

  const isRoyaltyOnly = offer.type === 'royaltyNonExclusive' || offer.type === 'royaltyExclusive';
  rightsAudit.push({
    check: 'Fee + royalty structure',
    pass: offer.fee >= 80 || royaltySales > 200,
    note: isRoyaltyOnly
      ? 'Royalty-only with no minimum fee is the classic trap — if the licensor sells nothing, you earned nothing for your hours. Anchor with a minimum guarantee.'
      : offer.fee < 80
        ? `The $${offer.fee} fee sits under the $80–140 small-design band. Royalty income helps, but verify the licensor actually sells patterns at volume.`
        : `Fee ${offer.fee >= 80 ? 'meets the small-design floor' : 'below floor'}; royalties on top cover channel growth.`,
  });

  rightsAudit.push({
    check: 'Exclusivity window within 12 months',
    pass: offer.exclusivityMonths <= 12 || offer.exclusivityMonths === 0,
    note:
      offer.exclusivityMonths > 12
        ? `A ${offer.exclusivityMonths}-month window exceeds the industry standard (Stitchcraft: 3–12 months). Longer windows are a slow buyout without buyout pay.`
        : offer.exclusivityMonths === 0
          ? 'No exclusivity — the design can be sold to any number of licensees at once.'
          : `${offer.exclusivityMonths}-month window sits inside the 3–12 month industry norm.`,
  });

  rightsAudit.push({
    check: isBuyout ? 'Buyout price multiple vs non-exclusive value' : 'Rights scope matches the pay',
    pass: isBuyout ? totalOfferValue >= selfSellValue * EXCLUSIVE_FLOOR_MULTIPLE : true,
    note: isBuyout
      ? `A permanent worldwide transfer at $${offer.fee} must cover ${EXCLUSIVE_FLOOR_MULTIPLE}× the self-sell window value ($${selfSellValue.toFixed(0)}) — otherwise keeping the pattern and selling it for years beats the offer. On marketplaces like TPC, "exclusive" always means a full buyout; there is no half-buyout.`
      : 'Scope is contractual — spell out whether the buyer resells the pattern, bundles it with yarn, or prints it in a book, and in which channels.',
  });

  rightsAudit.push({
    check: 'Territory and duration defined',
    pass: offer.worldwide === false || isBuyout,
    note:
      offer.worldwide && !isBuyout
        ? 'Worldwide rights for a non-buyout licence without a term are open-ended — cap it with an expiry date and named channels, or price it as a buyout.'
        : offer.worldwide && isBuyout
          ? 'Worldwide permanent transfer — exactly what a buyout should be, if the multiple is met.'
          : 'Territory-limited licence — cheaper for the buyer and safer for you; re-license other territories separately.',
  });

  rightsAudit.push({
    check: 'Derivative and grading rights stay with designer',
    pass: !offer.derivativeRightsTransferred,
    note: offer.derivativeRightsTransferred
      ? 'Transferring derivative rights means every future size expansion, restyle or bundle you make belongs to the buyer. Keep these — size expansions are where indie sales actually live.'
      : 'Derivatives retained — you can still release expanded sizes, bundles and translations of this pattern.',
  });

  rightsAudit.push({
    check: 'Designer keeps credit and promotion rights',
    pass: offer.creditAndPromotionRights,
    note: offer.creditAndPromotionRights
      ? 'Credit and self-promotion rights kept — the licence doubles as marketing for your own shop.'
      : 'Losing credit/promotion rights means the buyer benefits from your name and your release gets nothing back. This is worth money.',
  });

  rightsAudit.push({
    check: 'Payment schedule: fee on signing or delivery',
    pass: offer.paymentTimingMonths <= 3,
    note:
      offer.paymentTimingMonths > 3
        ? `${offer.paymentTimingMonths}-month payment lag is long for an indie licence. Quarterly royalty reporting is normal; fee payment should not wait that long.`
        : offer.paymentTimingMonths === 0
          ? 'Fee on signing — the strongest position for the designer.'
          : `Payment within ${offer.paymentTimingMonths} month(s) of signing — acceptable for a small licence.`,
  });

  rightsAudit.push({
    check: 'Production costs carried by licensor',
    pass: offer.licensorPaysProduction,
    note: offer.licensorPaysProduction
      ? 'Licensor covers sample / photography / tech edit — the Vogue Knitting model: $500 design plus yarn support, effectively cost-neutral to the designer.'
      : `Designer covers $${productionDrag} of production out of the fee — subtract it from the fee before judging it against the self-sell baseline.`,
  });

  const rightsScore = rightsAudit.filter(c => c.pass).length;

  // Buyout floor: 4× the self-sell window value, because a buyout is permanent.
  const buyoutFloor = Math.round(selfSellValue * EXCLUSIVE_FLOOR_MULTIPLE * 100) / 100;

  // --- Verdict ---
  // Net gain vs self-sell window for exclusive structures; vs labour floor for
  // non-exclusive deals (no window cost → judge the fee against invested hours).
  const netGain = window > 0 ? totalOfferValue - selfSellValue : totalOfferValue - labourValue;
  const hourly = effortHours > 0 ? totalOfferValue / effortHours : 0;
  let verdict: LicenceResult['verdict'] = 'go';
  let verdictNote = '';

  if (isBuyout) {
    if (totalOfferValue >= buyoutFloor && rightsScore >= 7) {
      verdict = 'go';
      verdictNote = `Buyout pays $${totalOfferValue.toFixed(0)} vs $${selfSellValue.toFixed(0)} self-sell window value — ${EXCLUSIVE_FLOOR_MULTIPLE}× multiple met, rights audit ${rightsScore}/8.`;
    } else if (netGain >= -labourValue * 0.2 && rightsScore >= 5) {
      verdict = 'maybe';
      verdictNote = `Buyout is close: $${totalOfferValue.toFixed(0)} total vs $${selfSellValue.toFixed(0)} window value. Counter at ${EXCLUSIVE_FLOOR_MULTIPLE}× the window value or split the difference on the window.`;
    } else {
      verdict = 'no';
      verdictNote = `Buyout at $${offer.fee} undersells the pattern: ${EXCLUSIVE_FLOOR_MULTIPLE}× the $${selfSellValue.toFixed(0)} window value is $${(selfSellValue * EXCLUSIVE_FLOOR_MULTIPLE).toFixed(0)}, and rights audit is ${rightsScore}/8. Keep it and self-sell.`;
    }
  } else if (netGain >= 0 && rightsScore >= 6) {
    verdict = 'go';
    verdictNote = window > 0
      ? `Offer nets $${totalOfferValue.toFixed(0)} against $${selfSellValue.toFixed(0)} window cost — that's $${netGain.toFixed(0)} clear of self-sell, at $${hourly.toFixed(1)}/hr on your invested hours.`
      : `Fee clears your $${labourValue.toFixed(0)} labour floor with $${netGain.toFixed(0)} to spare, at $${hourly.toFixed(1)}/hr on your invested hours. Self-publishing in parallel is fully protected.`;
  } else if (netGain >= -labourValue * 0.25 && rightsScore >= 5) {
    verdict = 'maybe';
    verdictNote = window > 0
      ? `Offer is break-even-to-slightly-negative vs self-sell ($${netGain.toFixed(0)}). Worth it only if the licensor's marketing reach is genuinely bigger than yours — verify they promote indie patterns well.`
      : `Fee covers most of your $${labourValue.toFixed(0)} labour floor at $${hourly.toFixed(1)}/hr — acceptable for exposure, but self-publishing would pay more over time.`;
  } else {
    verdict = 'no';
    verdictNote = window > 0
      ? `Offer nets $${totalOfferValue.toFixed(0)} but costs $${selfSellValue.toFixed(0)} of self-sell — $${Math.abs(netGain).toFixed(0)} in the hole at $${hourly.toFixed(1)}/hr. Self-publish or counter.`
      : `Fee of $${offer.fee.toFixed(0)} sits far below your $${labourValue.toFixed(0)} labour floor ($${hourly.toFixed(1)}/hr on invested hours). Counter or self-publish.`;
  }

  // --- 24-month keep-vs-sell comparison ---
  const selfSell24 = Math.round(nps * monthlySales * 24 * 100) / 100;
  const sellValue = Math.round((totalOfferValue + selfSellValue * (offer.type === 'nonExclusive' || offer.type === 'extendedNonExclusive' ? 0 : 0) + selfSell24 * (offer.exclusivityMonths === 0 ? 1 : 0)) * 100) / 100;
  const keepVsSell = {
    selfSell24,
    sellValue,
    difference: Math.round((sellValue - selfSell24) * 100) / 100,
  };

  const notes: string[] = [];
  notes.push(
    `Self-sell window value $${selfSellValue.toFixed(0)} = $${nps.toFixed(2)}/sale net × ${monthlySales}/mo × ${window || '0 (no exclusivity)'} mo.`,
  );
  notes.push(
    'Designers rejected buyouts as an industry model (Stitchcraft, 2017) — only accept one at a buyout multiple, because a buyout is permanent.',
  );
  notes.push(
    'Vogue Knitting pays $500 flat plus yarn support for a magazine design — use it as the floor for a "design for us" fee with full production covered.',
  );
  if (monthlySales <= 0) {
    notes.push(
      'With no self-sell history, judge the offer against your invested hours at the $12/hr floor rather than a sales baseline — an unknown pattern is worth its labour, not a projection.',
    );
  }

  // --- Counteroffer letter ---
  const feeFloor = Math.max(offer.fee, Math.round((selfSellValue + labourValue * 0.5) * 100) / 100);
  const wantedFee = isBuyout ? buyoutFloor : Math.max(offer.fee, feeFloor);

  let letter = '';
  if (verdict === 'no' || wantedFee > offer.fee) {
    letter = [
      `Thanks so much for the offer on ${input.project?.name || 'the pattern'} — I love what you\u2019re doing with it.`,
      isBuyout
        ? `Since a full transfer is permanent, my buyout rate is based on the pattern's lifetime value: I'd come in at $${buyoutFloor.toFixed(0)} (${EXCLUSIVE_FLOOR_MULTIPLE}× the pattern's exclusivity-window baseline of $${selfSellValue.toFixed(0)}), or alternatively a 12-month exclusive at $${feeFloor.toFixed(0)} with self-sell resuming after.`
        : `Based on the pattern's self-sell baseline ($${selfSellValue.toFixed(0)} over the exclusivity window) plus my production contribution, I'd need $${wantedFee.toFixed(0)} to make this work — ${offer.licensorPaysProduction ? 'with sample, photography and tech edit covered by you' : `or $${(wantedFee + (offer.productionCost || 0)).toFixed(0)} if I'm covering $${offer.productionCost || 0} of production`}.`,
      ...(!offer.creditAndPromotionRights
        ? [`Also, I'll need credit on the listing and the right to promote my work from it — that exposure is part of what makes these deals worth doing.`]
        : []),
      ...(offer.derivativeRightsTransferred
        ? [`To be clear: expanded sizes, bundles and translations of this design stay with me.`]
        : []),
      "Happy to chat about structure — I'd rather we both come out of this feeling good about it.",
    ].join('\n\n');
  } else {
    letter = [
      `Thanks so much for the offer on ${input.project?.name || 'the pattern'} — the terms land well for me.`,
      `To confirm my read: ${LICENCE_LABELS[offer.type]}, fee $${offer.fee.toFixed(0)}${royaltySales > 0 ? ` plus ${offer.royaltyPercent}% royalty on your sales` : ''}${offer.exclusivityMonths > 0 ? `, ${offer.exclusivityMonths}-month exclusivity` : ', no exclusivity'}, ${offer.licensorPaysProduction ? 'production covered by you' : ''}.`,
      `Send the agreement over and I'll turn it around within the week.`,
    ].join('\n\n');
  }

  return {
    type: offer.type,
    selfSellValue,
    licensorIncomeValue,
    labourValue,
    totalOfferValue,
    verdict,
    verdictNote,
    rightsAudit,
    rightsScore,
    keepVsSell,
    notes,
    offerLetter: letter,
  };
}

/** Side-by-side: keep the pattern and self-publish for `horizonMonths` vs sell
 *  it under the given offer structure now. */
export function keepVsLicense(input: {
  platform: PlatformId;
  price: number;
  monthlySales: number;
  horizonMonths: number;
  offer: LicenceOffer;
  selfSell24: number;
  sellValue: number;
}): { keepValue: number; sellValue: number; winner: 'keep' | 'sell'; } {
  return {
    keepValue: input.selfSell24,
    sellValue: input.sellValue,
    winner: input.sellValue > input.selfSell24 ? 'sell' : 'keep',
  };
}
