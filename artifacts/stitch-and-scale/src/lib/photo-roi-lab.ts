/**
 * Pattern Photo ROI Lab — CHK-053 (51st workspace feature).
 *
 * Answers the question every knitwear designer faces before a pattern ships:
 * DIY the photos, or hire a pro? Session-53 market facts:
 * - DIY costs hidden designer time (~2.5h/pattern: 1-2h shoot + 1.5h editing) and
 *   a gear stack ($1,500+ camera, lenses, replacement cycle) amortized over the library.
 *   Source: Woolly Wormhead, "The true cost of a pattern" (~£20/pattern DIY direct cost;
 *   49 full-price copies to break even at £3).
 * - Pros charge $25-100/hr (generalist), $200-500/hr (experienced), $5-10k/day (top tier);
 *   most common is per-image tiered pricing, or a day/half-day rate for lifestyle shoots.
 *   Source: Mark Mendoza Photography, 2025 pricing guide.
 * - Ravelry lets you upload unlimited photos; the first photo is the search thumbnail and
 *   drives click-through. Etsy's own high-earner community names photography their #1
 *   selling point. (CTR effects are modeled conservatively — see thumbCtrLift.)
 */

export type PhotoStyle = 'catalog' | 'lifestyle';

export interface PhotoRoiInput {
  /** Patterns to shoot in this session (batch size). */
  patterns: number;
  /** Images per pattern (hero + angles + detail). */
  imagesPerPattern: number;
  /** Designer's own hourly rate ($/hr). */
  hourlyRate: number;
  /** DIY hours per pattern (shoot + edit). WKW average ~2.5h. */
  diyHoursPerPattern: number;
  /** DIY gear stack value ($) amortized. WKW camera alone £1,500+. */
  gearValue: number;
  /** Patterns to amortize the gear stack over (library size). */
  gearLibrarySize: number;
  /** Model pay ($/hour) if DIY uses hired models. 0 = friend/self. */
  modelHourlyRate: number;
  /** Model hours per pattern. */
  modelHoursPerPattern: number;
  /** Pro style of shoot. */
  photoStyle: PhotoStyle;
  /** Pro per-image rate ($) for catalog pricing. */
  proPerImageRate: number;
  /** Pro half-day rate ($) for lifestyle pricing. */
  proHalfDayRate: number;
  /** Patterns a half-day shoot covers (batch efficiency). */
  patternsPerHalfDay: number;
  /** Pro retouch/extra per image ($) — hands in frame, props, advanced retouch. */
  proExtrasPerImage: number;
  /** Pattern price ($) — used for break-even. */
  patternPrice: number;
  /** Platform fee pct effective (kept simple: use 0.15 Ravelry store norm). */
  platformFeePct: number;
  /** CTR lift from a better first photo (0-1). Etsy's $2k+/mo sellers name
   *  photography their #1 driver; industry creative lifts run 10-30%. */
  thumbCtrLift: number;
  /** Current monthly sales (units) — CTR lift applied on top. */
  monthlySales: number;
  /** Months of sales runway to evaluate the CTR lift. */
  liftMonths: number;
}

export interface PhotoRoiOption {
  id: 'diy' | 'proCatalog' | 'proLifestyle';
  label: string;
  /** Total out-of-pocket + time cost ($). */
  totalCost: number;
  /** Cash out-of-pocket ($), excluding time. */
  cashCost: number;
  /** Time cost ($), excluding cash. */
  timeCost: number;
  /** Cost per pattern ($). */
  perPattern: number;
  /** Break-even units at the designer's price after platform fees. */
  breakEvenUnits: number;
  /** Red flags for this option. */
  redFlags: { id: string; detail: string }[];
}

export interface PhotoRoiResult {
  options: PhotoRoiOption[];
  best: 'diy' | 'proCatalog' | 'proLifestyle';
  /** Extra units/month the thumbnail lift buys, rounded. */
  extraSalesPerMonth: number;
  /** Extra revenue over the lift runway, after fees, rounded. */
  liftRevenue: number;
  /** Verdict banner text. */
  verdict: string;
  suggestion: string;
}

export const PHOTO_STYLE_LABELS: Record<PhotoStyle, string> = {
  catalog: 'Per-image catalog shoot',
  lifestyle: 'Half-day lifestyle shoot',
};

export function analyzePhotoRoi(input: Partial<PhotoRoiInput> = {}): PhotoRoiResult {
  const patterns = Math.max(1, Math.round(input.patterns ?? 1));
  const imagesPerPattern = Math.max(1, Math.round(input.imagesPerPattern ?? 5));
  const hourlyRate = Math.max(0, input.hourlyRate ?? 25);
  const diyHoursPerPattern = Math.max(0, input.diyHoursPerPattern ?? 2.5);
  const gearValue = Math.max(0, input.gearValue ?? 1800);
  const gearLibrarySize = Math.max(1, Math.round(input.gearLibrarySize ?? 50));
  const modelHourlyRate = Math.max(0, input.modelHourlyRate ?? 35);
  const modelHoursPerPattern = Math.max(0, input.modelHoursPerPattern ?? 1);
  const proPerImageRate = Math.max(0, input.proPerImageRate ?? 25);
  const proHalfDayRate = Math.max(0, input.proHalfDayRate ?? 400);
  const patternsPerHalfDay = Math.max(1, Math.round(input.patternsPerHalfDay ?? 4));
  const proExtrasPerImage = Math.max(0, input.proExtrasPerImage ?? 0);
  const patternPrice = Math.max(0, input.patternPrice ?? 8);
  const platformFeePct = Math.max(0, Math.min(1, input.platformFeePct ?? 0.15));
  const thumbCtrLift = Math.max(0, Math.min(1, input.thumbCtrLift ?? 0.15));
  const monthlySales = Math.max(0, Math.round(input.monthlySales ?? 25));
  const liftMonths = Math.max(1, Math.round(input.liftMonths ?? 12));

  const netPerSale = patternPrice * (1 - platformFeePct);

  // --- Option A: DIY. Cash = model pay (if any) + gear amortization per pattern.
  // Time = designer hours (the WKW 2.5h block).
  const diyCashPerPattern = modelHourlyRate * modelHoursPerPattern + gearValue / gearLibrarySize;
  const diyTimeCost = diyHoursPerPattern * hourlyRate;
  const diyTotalPerPattern = diyCashPerPattern + diyTimeCost;

  // --- Option B: pro catalog (per-image tiered). Extras (hands/props/retouch) add per image.
  const proCatalogPerPattern = imagesPerPattern * (proPerImageRate + proExtrasPerImage);

  // --- Option C: pro lifestyle (half-day batched across N patterns).
  // A half-day is charged once; if the batch under-fills it, the whole rate divides
  // across the actual batch — the designer still pays for the booked half-day.
  const proLifestylePerPattern = (proHalfDayRate / Math.min(patterns, patternsPerHalfDay)) +
    imagesPerPattern * proExtrasPerImage;

  const buildOption = (opt: Omit<PhotoRoiOption, 'redFlags'>, redFlags: PhotoRoiOption['redFlags']): PhotoRoiOption => ({ ...opt, redFlags });

  const options: PhotoRoiOption[] = [
    buildOption({
      id: 'diy',
      label: 'DIY (your time + model)',
      totalCost: Math.round(diyTotalPerPattern * patterns * 100) / 100,
      cashCost: Math.round(diyCashPerPattern * patterns * 100) / 100,
      timeCost: Math.round(diyTimeCost * patterns * 100) / 100,
      perPattern: Math.round(diyTotalPerPattern * 100) / 100,
      breakEvenUnits: netPerSale > 0 ? Math.ceil(diyTotalPerPattern / netPerSale) : 0,
    }, [
      ...(diyHoursPerPattern > 4 ? [{ id: 'PR-01', detail: `At ${diyHoursPerPattern}h/pattern the DIY block is the second-largest time cost of the pattern after knitting — WKW's whole production is ~34.5h.` }] : []),
      ...(gearValue > 0 && gearLibrarySize > 0 && gearValue / gearLibrarySize > 50 ? [{ id: 'PR-02', detail: `Gear amortization is $${(gearValue / gearLibrarySize).toFixed(0)}/pattern — the WKW camera stack ran £1,500+ and never stops depreciating.` }] : []),
      ...(modelHourlyRate === 0 && diyHoursPerPattern > 0 ? [{ id: 'PR-03', detail: 'No model budget: only works if you can model your own designs.' }] : []),
    ]),
    buildOption({
      id: 'proCatalog',
      label: PHOTO_STYLE_LABELS.catalog,
      totalCost: Math.round(proCatalogPerPattern * patterns * 100) / 100,
      cashCost: Math.round(proCatalogPerPattern * patterns * 100) / 100,
      timeCost: 0,
      perPattern: Math.round(proCatalogPerPattern * 100) / 100,
      breakEvenUnits: netPerSale > 0 ? Math.ceil(proCatalogPerPattern / netPerSale) : 0,
    }, [
      ...(proPerImageRate < 10 ? [{ id: 'PR-04', detail: 'Per-image quotes under ~$10 are the per-product-pricing red flag — check the portfolio before trusting the quote.' }] : []),
      ...(proPerImageRate > 100 ? [{ id: 'PR-05', detail: 'Per-image rates above $100 are experienced-pro territory; only justify at high-volume patterns.' }] : []),
      ...(imagesPerPattern > 8 ? [{ id: 'PR-06', detail: 'Tiered per-image pricing rewards fewer, stronger shots — 5-6 beats 10+ at this rate.' }] : []),
    ]),
    buildOption({
      id: 'proLifestyle',
      label: PHOTO_STYLE_LABELS.lifestyle,
      totalCost: Math.round(proLifestylePerPattern * patterns * 100) / 100,
      cashCost: Math.round(proLifestylePerPattern * patterns * 100) / 100,
      timeCost: 0,
      perPattern: Math.round(proLifestylePerPattern * 100) / 100,
      breakEvenUnits: netPerSale > 0 ? Math.ceil(proLifestylePerPattern / netPerSale) : 0,
    }, [
      ...(patternsPerHalfDay >= patterns && patterns > 1 ? [{ id: 'PR-07', detail: 'Batch everything in one half-day — the lifestyle rate is paid once, not per pattern.' }] : []),
      ...(proHalfDayRate > 1500 ? [{ id: 'PR-08', detail: 'Day rates above $1,500 are top-tier territory ($5-10k/day is the ceiling); half-day keeps you mid-band.' }] : []),
    ]),
  ];

  const best = [...options].sort((a, b) => a.totalCost - b.totalCost)[0].id as PhotoRoiResult['best'];

  // Thumbnail-lift economics: the first photo is the search thumbnail; Etsy's highest earners
  // name photography their #1 selling point. Applied conservatively on top of existing sales.
  const extraSalesPerMonth = Math.round(monthlySales * thumbCtrLift * 100) / 100;
  const liftRevenue = Math.round(extraSalesPerMonth * netPerSale * liftMonths * 100) / 100;

  const bestOpt = options.find(o => o.id === best)!;
  let verdict = '';
  let suggestion = '';
  if (bestOpt.totalCost <= 0 && bestOpt.breakEvenUnits === 0) {
    verdict = 'Nearly free to shoot — the photos pay for themselves with the first sale.';
    suggestion = 'Even a near-zero shoot buys the thumbnail; the first photo is the pattern\u2019s click-through engine.';
  } else if (bestOpt.breakEvenUnits <= Math.max(1, monthlySales)) {
    verdict = `The best shoot costs $${bestOpt.totalCost.toFixed(0)} — a month of sales at your velocity covers it. Shoot first, sell second.`;
    suggestion = 'Batch every shootable pattern into one session; the fixed cost divides across the batch.';
  } else if (bestOpt.breakEvenUnits <= Math.max(1, monthlySales * 3)) {
    verdict = `Break-even at ~${bestOpt.breakEvenUnits} copies — reachable within a season if the pattern is on-trend. The thumbnail lift ($${liftRevenue.toFixed(0)} over ${liftMonths}mo) sweetens the case.`;
    suggestion = thumbCtrLift >= 0.2
      ? 'Your CTR-lift assumption is aggressive (20%+); keep the thumbnail strong but don\u2019t bank the lift in the plan.'
      : 'A stronger first photo compounds across every future month the pattern sells.';
  } else {
    verdict = `Break-even needs ~${bestOpt.breakEvenUnits} copies — beyond your current velocity. Either shrink the shoot scope or wait until the pattern has a built-in audience.`;
    suggestion = patterns >= 2
      ? 'Cut the batch size to 1, shoot DIY, and reinvest the save into a pro half-day for your flagship pattern only.'
      : 'Start with the DIY option and pay yourself in practice: the WKW gear stack cost £1,500+ but bought years of shoots.';
  }

  return { options, best, extraSalesPerMonth, liftRevenue, verdict, suggestion };
}
