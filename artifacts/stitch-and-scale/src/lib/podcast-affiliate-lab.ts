import { LanguageCode } from './i18n';
import { PODCAST_AFFILIATE_COPY } from './podcast-affiliate-copy';

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
  verdict: 'clean' | 'check' | 'fix';
  score: number;
}

export interface PodcastConfig {
  language?: LanguageCode;
}

export function fmt$(n: number, lang: LanguageCode = 'en'): string {
  const rounded = Math.round(Math.abs(n) * 100) / 100;
  const currency = lang === 'en' ? '$' : '€';
  const locale = lang === 'en' ? 'en-US' : 
                 lang === 'de' ? 'de-DE' : 
                 lang === 'fr' ? 'fr-FR' : 
                 lang === 'es' ? 'es-ES' : 
                 'pt-PT';
  return `${n < 0 ? '−' : ''}${currency}${rounded.toLocaleString(locale, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function netPerMonth(gross: number, cutFraction: number, monthlyCosts: number, setupCosts: number): number {
  return gross * (1 - cutFraction) - monthlyCosts - setupCosts / 12;
}

export function analyzePodcastAffiliate(input: PodcastInput, config: PodcastConfig = {}): PodcastResult {
  const lang = config.language || 'en';
  const copy = PODCAST_AFFILIATE_COPY[lang];
  const flags: Flag[] = [];

  if (input.downloadsPerEpisode <= 0 || input.episodesPerMonth <= 0) {
    return {
      lanes: [],
      cpmBenchmarkLow: 18,
      cpmBenchmarkHigh: 50,
      cpmBreakEvenDownloads: Infinity,
      flatFeeEquivalent: 0,
      flags: [],
      verdict: 'fix',
      score: 0,
    };
  }

  const slotsPerMonth = input.adSlotsPerEpisode * input.episodesPerMonth * input.fillRate;

  // Lane 1: CPM
  const cpmGross = (input.downloadsPerEpisode / 1000) * slotsPerMonth * input.cpmRate;
  const cpmNet = netPerMonth(cpmGross, input.networkCut, input.monthlyCosts, input.setupCosts);

  // Lane 2: flat fee
  const flatGross = input.readsPerMonth * input.flatFeePerRead;
  const flatNet = netPerMonth(flatGross, input.networkCut, input.monthlyCosts, input.setupCosts);

  // Lane 3: affiliate
  const affGross = input.programs.reduce(
    (s, p) => s + p.clicksPerEpisode * input.episodesPerMonth * Math.max(0, Math.min(1, p.conversionRate)) * p.aov * p.commission,
    0,
  );
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
  const cpmHours = showHours + slotsPerMonth * 0.25;
  const flatHours = showHours + input.readsPerMonth * 0.5;
  const affHours = showHours + input.programs.length * 0.25;

  const laneLabels: Record<LanguageCode, { cpm: string; flat: string; affiliate: string }> = {
    en: { cpm: 'CPM sponsorship', flat: 'Flat-fee reads', affiliate: 'Affiliate programs' },
    de: { cpm: 'CPM-Sponsoring', flat: 'Flat-Fee-Reads', affiliate: 'Affiliate-Programme' },
    fr: { cpm: 'Sponsoring CPM', flat: 'Lectures à forfait', affiliate: 'Programmes d\'affiliation' },
    es: { cpm: 'Patrocinio CPM', flat: 'Lecturas de tarifa plana', affiliate: 'Programas de afiliados' },
    pt: { cpm: 'Patrocínio CPM', flat: 'Leituras de taxa fixa', affiliate: 'Programas de afiliados' },
  };

  const ll = laneLabels[lang];

  const lanes: ModelLane[] = [
    {
      label: ll.cpm,
      grossMonthly: cpmGross,
      netMonthly: cpmNet,
      hoursPerMonth: cpmHours,
      effectiveHourly: cpmHours > 0 ? cpmNet / cpmHours : 0,
    },
    {
      label: ll.flat,
      grossMonthly: flatGross,
      netMonthly: flatNet,
      hoursPerMonth: flatHours,
      effectiveHourly: flatHours > 0 ? flatNet / flatHours : 0,
    },
    {
      label: ll.affiliate,
      grossMonthly: affGross,
      netMonthly: affNet,
      hoursPerMonth: affHours,
      effectiveHourly: affHours > 0 ? affNet / affHours : 0,
    },
  ];

  // PA-01 — audience size
  if (input.cpmRate > 0 && slotsPerMonth > 0) {
    const cpmPerEp = (input.downloadsPerEpisode / 1000) * input.adSlotsPerEpisode * input.cpmRate;
    if (cpmPerEp < 10) {
      flags.push({
        code: 'PA-01',
        title: copy.findingPa01Title,
        detail: copy.findingPa01Detail,
      });
    }
  }

  // PA-02 — conversion barrier
  if (input.programs.length > 0 && input.programs.some(p => p.conversionRate > 0.01)) {
    flags.push({
      code: 'PA-02',
      title: copy.findingPa02Title,
      detail: copy.findingPa02Detail,
    });
  }

  const score = Math.max(0, 100 - flags.length * 20);
  const verdict = score >= 80 ? 'clean' : score >= 50 ? 'check' : 'fix';

  return {
    lanes,
    cpmBenchmarkLow: 18,
    cpmBenchmarkHigh: 50,
    cpmBreakEvenDownloads: 5000,
    flatFeeEquivalent: (input.downloadsPerEpisode / 1000) * 25,
    flags,
    verdict,
    score,
  };
}
