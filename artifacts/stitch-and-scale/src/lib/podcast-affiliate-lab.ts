/**
 * Podcast & Affiliate Lab (CHK-068) — what is a knitting podcast (or any
 * designer audience: newsletter, Instagram, YouTube) actually worth, and
 * which monetization model should you take at your current audience size?
 *
 * Competitor flaw: no knitting-business or podcasting tool does the
 * cross-model math for a fiber-arts audience. Designers with a knitting
 * podcast, a newsletter, or a following that "gets asked about the yarn"
 * keep taking bad deals — $5 flat reads on shows that could charge
 * CPM-based rates, or exclusive affiliate links at 10% when the right
 * partner pays 15-30% (LoveCrafts runs up to 30%, in practice 15% new
 * customer / 5% returning; Knit Picks and Crochet.com pay a clean 10%).
 * Meanwhile small-show hosts chase CPM deals at 300 downloads/episode
 * where the math is hopeless (5,000 downloads × $25 CPM = $125 — the
 * threshold where CPM starts making sense) and flat-fee/affiliate would
 * out-earn them.
 *
 * This lab models the three monetization lanes side by side for the SAME
 * audience — per-episode CPM income, flat-fee deals, and affiliate income
 * (downloads × click-through × conversion × AOV × commission), nets out
 * platform/network cuts (10-30%), production hours against the designer's
 * opportunity rate, and hands back a verdict ladder: the audience size
 * where each lane wins, and the break-even download floor where any
 * sponsorship is worth the production time at all.
 */

export type DealModel = 'cpm' | 'flat' | 'affiliate' | 'hybrid';

export interface Program {
  /** Program name, e.g. "LoveCrafts". */
  name: string;
  /** Commission as a fraction of sale price, e.g. 0.15. */
  commission: number;
  /** Affiliate link clicks per episode (tracked over a window). */
  clicksPerEpisode: number;
  /** Click-to-purchase conversion, e.g. 0.02. */
  conversionRate: number;
  /** Average order value in $. */
  aov: number;
  /** Share of each commission the platform/network keeps, e.g. 0.15. */
  platformCut: number;
}

export interface PodcastInput {
  /** Downloads/listens per episode. */
  downloadsPerEpisode: number;
  /** Episodes per month. */
  episodesPerMonth: number;
  /** Production hours per episode (recording + editing + show notes). */
  productionHoursPerEpisode: number;
  /** One-off setup amortized (mic, software, hosting signup). */
  setupCosts: number;
  /** Recurring monthly costs (hosting, editing help, insurance). */
  monthlyCosts: number;
  /** CPM deal fields. */
  cpmRate: number;
  adSlotsPerEpisode: number;
  /** Share a network/marketplace takes, e.g. 0.2. */
  networkCut: number;
  /** Fill rate: share of episodes the slot actually sells, e.g. 0.8. */
  fillRate: number;
  /** Flat-fee deal fields. */
  flatFeePerRead: number;
  readsPerMonth: number;
  /** Affiliate programs modeled. */
  programs: Program[];
  /** Opportunity rate $/hr. */
  hourlyRate: number;
}

export const DEFAULT_PODCAST: PodcastInput = {
  downloadsPerEpisode: 3200,
  episodesPerMonth: 4,
  productionHoursPerEpisode: 4,
  setupCosts: 250,
  monthlyCosts: 20,
  cpmRate: 30,
  adSlotsPerEpisode: 1,
  networkCut: 0.2,
  fillRate: 0.8,
  flatFeePerRead: 150,
  readsPerMonth: 4,
  programs: [
    {
      name: 'LoveCrafts (15% new / 5% ret blended)',
      commission: 0.15,
      clicksPerEpisode: 60,
      conversionRate: 0.02,
      aov: 48,
      platformCut: 0,
    },
    {
      name: 'Knit Picks (10%)',
      commission: 0.1,
      clicksPerEpisode: 40,
      conversionRate: 0.02,
      aov: 55,
      platformCut: 0,
    },
  ],
  hourlyRate: 60,
};

export interface Flag {
  code: string;
  title: string;
  detail: string;
}

export interface ModelLane {
  label: string;
  /** Gross monthly income from this lane. */
  grossMonthly: number;
  /** After network/platform cuts and monthly costs (prorated setup over 12 months). */
  netMonthly: number;
  /** All hours per month spent on this lane. */
  hoursPerMonth: number;
  /** (netMonthly) / hoursPerMonth. */
  effectiveHourly: number;
}

export interface PodcastResult {
  lanes: ModelLane[];
  /** Buzzsprout/industry floor: $18 pre-roll, $25 60-sec mid-roll industry standard. */
  cpmBenchmarkLow: number;
  cpmBenchmarkHigh: number;
  /** Downloads per episode where CPM beats the designer's opportunity rate. */
  cpmBreakEvenDownloads: number;
  /** Flat-fee equivalent at current audience using the CPM formula. */
  flatFeeEquivalent: number;
  flags: Flag[];
  verdict: string;
  verdictNote: string;
}

export function fmt$(n: number): string {
  const rounded = Math.round(Math.abs(n) * 100) / 100;
  return `${n < 0 ? '−' : ''}$${rounded.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function netPerMonth(gross: number, cutFraction: number, monthlyCosts: number, setupCosts: number): number {
  return gross * (1 - cutFraction) - monthlyCosts - setupCosts / 12;
}

export function analyzePodcastAffiliate(input: PodcastInput): PodcastResult {
  if (input.downloadsPerEpisode <= 0 || input.episodesPerMonth <= 0) {
    return {
      lanes: [],
      cpmBenchmarkLow: 18,
      cpmBenchmarkHigh: 50,
      cpmBreakEvenDownloads: Infinity,
      flatFeeEquivalent: 0,
      flags: [],
      verdict: 'Add your audience numbers',
      verdictNote: 'Tell this lab your downloads per episode and episode cadence before it can model the three monetization lanes.',
    };
  }

  const slotsPerMonth = input.adSlotsPerEpisode * input.episodesPerMonth * input.fillRate;

  // Lane 1: CPM — (downloads ÷ 1000) × slots × CPM, minus network cut.
  const cpmGross = (input.downloadsPerEpisode / 1000) * slotsPerMonth * input.cpmRate;
  const cpmNet = netPerMonth(cpmGross, input.networkCut, input.monthlyCosts, input.setupCosts);

  // Lane 2: flat fee — reads per month × fee, minus network cut if brokered.
  const flatGross = input.readsPerMonth * input.flatFeePerRead;
  const flatNet = netPerMonth(flatGross, input.networkCut, input.monthlyCosts, input.setupCosts);

  // Lane 3: affiliate — clicks × conversion × AOV × commission, minus platform cuts + show costs.
  const affClicks = input.programs.reduce((s, p) => s + p.clicksPerEpisode, 0) * input.episodesPerMonth;
  const affGross = input.programs.reduce(
    (s, p) => s + p.clicksPerEpisode * input.episodesPerMonth * Math.max(0, Math.min(1, p.conversionRate)) * p.aov * p.commission,
    0,
  );
  // S182 fix: the platform cut prices the SALES a program produces (converted
  // clicks), not raw clicks — so the cut numerator must carry the same
  // conversionRate weighting as affGross. Clicks never converted sell nothing,
  // so no platform takes anything on them.
  const affCut =
    affGross > 0
      ? input.programs.reduce(
          (s, p) =>
            s +
            p.clicksPerEpisode *
              input.episodesPerMonth *
              Math.max(0, Math.min(1, p.conversionRate)) *
              p.aov *
              p.commission *
              p.platformCut,
          0,
        ) /
        affGross
      : 0;
  const affNet = affGross * (1 - (input.programs.length > 0 ? affCut : 0)) - input.monthlyCosts - input.setupCosts / 12;

  const showHours = input.productionHoursPerEpisode * input.episodesPerMonth;

  // Hours attributed per lane: production hours split proportionally to the
  // sponsor work involved (CPM read ~15 min/slot prep, flat read ~30 min,
  // affiliate link drops ~10 min each — market practice for integrated reads).
  const cpmHours = showHours + slotsPerMonth * 0.25;
  const flatHours = showHours + input.readsPerMonth * 0.5;
  const affHours = showHours + input.programs.length * 0.25;

  const lanes: ModelLane[] = [
    {
      label: 'CPM sponsorship',
      grossMonthly: cpmGross,
      netMonthly: cpmNet,
      hoursPerMonth: cpmHours,
      effectiveHourly: cpmHours > 0 ? cpmNet / cpmHours : 0,
    },
    {
      label: 'Flat-fee reads',
      grossMonthly: flatGross,
      netMonthly: flatNet,
      hoursPerMonth: flatHours,
      effectiveHourly: flatHours > 0 ? flatNet / flatHours : 0,
    },
    {
      label: 'Affiliate programs',
      grossMonthly: affGross,
      netMonthly: affNet,
      hoursPerMonth: affHours,
      effectiveHourly: affHours > 0 ? affNet / affHours : 0,
    },
  ];

  const flags: Flag[] = [];

  // PA-01 — CPM math is hopeless at this audience size.
  if (input.cpmRate > 0 && slotsPerMonth > 0) {
    const cpmPerEp = (input.downloadsPerEpisode / 1000) * input.adSlotsPerEpisode * input.cpmRate;
    if (cpmPerEp < 10) {
      flags.push({
        code: 'PA-01',
        title: 'Audience too small for CPM deals',
        detail: `At ${input.downloadsPerEpisode.toLocaleString()} downloads/episode a $${input.cpmRate} CPM pays $${cpmPerEp.toFixed(0)} per episode before the network's ${(input.networkCut * 100).toFixed(0)}% cut. Industry CPM deals start making sense around 5,000 downloads/episode; below ~200/episode sponsorship isn't worth pitching at all. At your size, flat-fee or affiliate wins — see the lane comparison below.`,
      });
    }
  }

  // PA-02 — CPM rate below market band ($25-50 host-read mid-roll; $18/$25 pre/mid industry standard).
  if (input.cpmRate > 0 && input.cpmRate < 25) {
    flags.push({
      code: 'PA-02',
      title: 'CPM rate below the market band',
      detail: `You're asking $${input.cpmRate} where host-read mid-rolls trade at $25-50 and the industry standards are $18 (30-sec pre-roll) / $25 (60-sec mid-roll). A niche craft audience is a targeting premium, not a discount — advertisers pay MORE for fiber-arts listeners than general audiences. Re-anchor at $25-35 for a show your size.`,
    });
  }

  // PA-03 — flat fee below the CPM-based equivalent.
  if (slotsPerMonth > 0) {
    const flatEq = (input.downloadsPerEpisode / 1000) * input.adSlotsPerEpisode * Math.max(input.cpmRate, 25);
    if (input.flatFeePerRead > 0 && input.flatFeePerRead < flatEq * 0.6) {
      flags.push({
        code: 'PA-03',
        title: 'Flat fee underpriced vs audience value',
        detail: `Your audience is worth ~$${flatEq.toFixed(0)} per read at a fair $25+ CPM-equivalent, and you're taking $${input.flatFeePerRead}. Small relevant shows regularly command flat $250-500 reads because a fiber-arts audience converts — a 200-listener show can net $500 per mention vs $4 at strict CPM. Re-quote.`,
      });
    }
  }

  // PA-04 — affiliate conversion too low or zero.
  const totalAffClicks = input.programs.reduce((s, p) => s + p.clicksPerEpisode, 0);
  if (input.programs.length > 0 && totalAffClicks === 0) {
    flags.push({
      code: 'PA-04',
      title: 'No affiliate clicks modeled',
      detail: 'You listed programs but set zero clicks per episode — if nobody clicks, there is no affiliate lane. A knitting podcast mentioning yarn brands typically gets 30-80 clicks/episode from a mid-size show; even 2% conversion at a $48 AOV with 15% commission is ~$1.40/episode per 60 clicks. Add real click numbers and re-run.',
    });
  } else if (input.programs.length > 0 && input.programs.every(p => p.conversionRate < 0.01 && p.clicksPerEpisode > 0)) {
    flags.push({
      code: 'PA-04',
      title: 'Affiliate conversion below bench',
      detail: `All your programs convert under 1% — e-commerce affiliate conversion averages 2.5-3%. Either the products don't match listener intent or the links are buried. Move links to show notes, pin a "yarn I used" list, and use one strong CTA per episode.`,
    });
  }

  // PA-05 — commission left on the table vs top programs.
  if (input.programs.length > 0 && input.programs.every(p => p.commission < 0.1)) {
    flags.push({
      code: 'PA-05',
      title: 'Commissions below top programs',
      detail: 'You\'re earning under 10% everywhere when LoveCrafts\' affiliate program pays up to 30% (blended ~15% new / 5% returning) and yarn-tool brands pay 10-15%. Same audience, same mentions, more than double the income per sale. Switch or stack programs. Knit Picks and Crochet.com pay a clean 10% with no posting requirements.',
    });
  }

  // PA-06 — network/platform cut above the market norm.
  if (input.networkCut > 0.3) {
    flags.push({
      code: 'PA-06',
      title: 'Network cut above market',
      detail: `Networks typically take ~30% and marketplaces 10-20% (Podcorn 10%, Gumball 20%). Your ${(input.networkCut * 100).toFixed(0)}% cut is eating more than the deal is worth — pitch brands directly and keep 100%, or move to a 10-20% marketplace.`,
    });
  }

  // PA-07 — production hours underpaid relative to opportunity rate.
  if (showHours > 0 && input.hourlyRate > 0) {
    const bestLane = lanes.reduce((a, b) => (a.effectiveHourly > b.effectiveHourly ? a : b), lanes[0]);
    if (bestLane.effectiveHourly < input.hourlyRate * 0.5 && bestLane.netMonthly > 0) {
      flags.push({
        code: 'PA-07',
        title: 'Show hours underpaid vs your rate',
        detail: `Your best lane earns $${bestLane.effectiveHourly.toFixed(0)}/hr across ${bestLane.hoursPerMonth.toFixed(0)} show hours/month against your $${input.hourlyRate}/hr opportunity rate. Same hours on patterns earn $${(bestLane.hoursPerMonth * input.hourlyRate).toFixed(0)}/month. Either the show needs to be a growth asset (new customers who buy patterns) or the monetization needs to change.`,
      });
    }
  }

  // PA-08 — affiliate lane not modeled at all.
  if (input.programs.length === 0 && input.readsPerMonth === 0 && slotsPerMonth === 0) {
    flags.push({
      code: 'PA-08',
      title: 'No monetization modeled',
      detail: 'You have not entered any CPM slots, flat reads, or affiliate programs — right now this show is pure cost. Affiliate marketing is the one lane with zero download requirements: LoveCrafts, Knit Picks, Lion Brand (Impact), Etsy (Awin) all accept designers. Start with one program and track clicks.',
    });
  }

  // PA-09 — ad load above the 10% of episode length norm.
  if (input.productionHoursPerEpisode >= 1 && (slotsPerMonth + input.readsPerMonth) / input.episodesPerMonth > 2) {
    flags.push({
      code: 'PA-09',
      title: 'Too many ad reads per episode',
      detail: 'The podcasting norm is no more than ~10% of episode length in ads — roughly one to two reads of 30-60 seconds. More than that and listener trust (the only asset that makes host-read ads work at a premium) starts to break. Cut the lowest-paying read and re-price the rest higher.',
    });
  }

  // Flat-fee equivalent at current audience (CPM formula with market-standard rate).
  const flatFeeEquivalent = (input.downloadsPerEpisode / 1000) * Math.max(input.adSlotsPerEpisode, 1) * Math.max(input.cpmRate, 25);

  // Downloads where CPM lane at market rate matches the designer's opportunity
  // rate, assuming 1 slot/month sold at 100% fill and market mid-roll $25 CPM
  // net of a 20% network cut: downloads × (1/1000) × 25 × 0.8 = hourlyRate × showHours/ep.
  const cpmBreakEvenDownloads =
    input.productionHoursPerEpisode > 0
      ? (input.hourlyRate * input.productionHoursPerEpisode) / (0.001 * 25 * 0.8)
      : Infinity;

  // ---- Verdict ladder ----
  const bestLane = lanes.length > 0 ? lanes.reduce((a, b) => (a.netMonthly > b.netMonthly ? a : b), lanes[0]) : undefined;
  const totalNet = lanes.reduce((s, l) => s + l.netMonthly, 0);
  let verdict: string;
  let verdictNote: string;

  if (lanes.length === 0 || totalNet <= 0) {
    verdict = 'The show currently costs you money';
    verdictNote = `All three lanes are at or below zero — a show at $${(input.monthlyCosts + input.productionHoursPerEpisode * input.episodesPerMonth * input.hourlyRate).toFixed(0)}/month in costs against no revenue. Run the audience-growth lane first: CPM only makes sense from ~5,000 downloads/episode, but affiliate links earn from episode one with zero download threshold.`;
  } else if (!bestLane || bestLane.effectiveHourly <= 0) {
    verdict = 'Monetize at all before pricing the deals';
    verdictNote = `You're earning something ($${totalNet.toFixed(0)}/month) but your best lane prices at $${(bestLane?.effectiveHourly ?? 0).toFixed(0)}/hr — below cost of time. The fastest fix: one affiliate program with real clicks and one flat-fee read at the $${flatFeeEquivalent.toFixed(0)} audience-equivalent.`;
  } else if (bestLane.effectiveHourly < 35) {
    verdict = 'Small-audience lane: affiliate + flat fee only';
    verdictNote = `Your best lane earns $${bestLane.effectiveHourly.toFixed(0)}/hr. At ${input.downloadsPerEpisode.toLocaleString()} downloads/episode CPM is the wrong game — flat-fee reads and affiliate links are where small niche shows actually profit, because a relevant fiber-arts audience is worth more than a big one. Re-price flat reads at $${flatFeeEquivalent.toFixed(0)} and move to LoveCrafts-style 15-30% commissions.`;
  } else if (bestLane.effectiveHourly < input.hourlyRate) {
    verdict = 'Growing audience: take the flat fee, price up the CPM';
    verdictNote = `$${bestLane.effectiveHourly.toFixed(0)}/hr is real money but under your $${input.hourlyRate}/hr rate. You're near the 5,000-download threshold where CPM starts working — hold flat-fee deals, start pitching mid-rolls at $25-35, and stack affiliate links in every episode's show notes.`;
  } else {
    verdict = 'Audience is an asset: stack all three lanes';
    verdictNote = `$${bestLane.effectiveHourly.toFixed(0)}/hr puts your best lane above your opportunity rate. Niche fiber-arts shows at this size are the ones advertisers pay premium CPMs for — run CPM at $25-50 mid-roll, flat fees for evergreen sponsors, and 15-30% affiliate programs in every episode. Protect the trust: max two reads per episode.`;
  }

  return {
    lanes,
    cpmBenchmarkLow: 18,
    cpmBenchmarkHigh: 50,
    cpmBreakEvenDownloads,
    flatFeeEquivalent,
    flags,
    verdict,
    verdictNote,
  };
}
