import { LanguageCode } from './i18n';
import { POD_PATTERNS_COPY } from './pod-patterns-copy';

export type PodPlatform =
  | 'kdp-amazon'
  | 'kdp-expanded'
  | 'ingramspark'
  | 'lulu-direct'
  | 'etsy-self';

export interface PodPatternsInput {
  /** Title of the collection, e.g. "Capsule Sweaters booklet". */
  title: string;
  /** Total page count of the physical product (incl. cover interior, intro, etc.). */
  pageCount: number;
  /** Pages printed in color (0 = all black & white). */
  colorPages: number;
  /** Whether to print as color booklet (forces color ink cost on all pages). */
  colorInk: boolean;
  /** Paperbound vs hardbound. */
  hardcover: boolean;
  /** List price the designer intends to charge. */
  listPrice: number;
  /** Which channel the physical copy ships through. */
  platform: PodPlatform;
  /** Cover + layout design cost allocated to this title ($). 0 if already sunk. */
  coverLayoutCost: number;
  /** Price of the same patterns sold as a digital PDF. */
  digitalPdfPrice: number;
  /** Monthly digital units sold at the digital PDF price. */
  digitalUnitsPerMonth: number;
  /** Expected monthly physical units sold at the list price. */
  expectedUnitsPerMonth: number;
  /** Share of physical sales cannibalizing digital (0-1). */
  cannibalShare: number;
  /** Designer's effective hourly rate, for the production-hours verdict. */
  hourlyRate: number;
  /** Hours spent on cover + layout + formatting (per-title one-time). */
  productionHours: number;
}

export const DEFAULT_POD_PATTERNS: PodPatternsInput = {
  title: 'Capsule Sweaters Collection',
  pageCount: 60,
  colorPages: 0,
  colorInk: false,
  hardcover: false,
  listPrice: 18.99,
  platform: 'kdp-amazon',
  coverLayoutCost: 0,
  digitalPdfPrice: 8.0,
  digitalUnitsPerMonth: 60,
  expectedUnitsPerMonth: 12,
  cannibalShare: 0.3,
  hourlyRate: 45,
  productionHours: 10,
};

export interface Flag {
  code: string;
  title: string;
  detail: string;
}

export interface PodPatternsResult {
  monthlyNet: number;
  marginPerUnit: number;
  flags: Flag[];
  verdict: 'clean' | 'check' | 'fix';
  score: number;
}

export interface PodPatternsConfig {
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
  return `${n < 0 ? '−' : ''}${currency}${rounded.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function analyzePODPatterns(input: PodPatternsInput, config: PodPatternsConfig = {}): PodPatternsResult {
  const lang = config.language || 'en';
  const copy = POD_PATTERNS_COPY[lang];
  const flags: Flag[] = [];

  // Simple POD math for the lab
  const podCost = input.pageCount * 0.05 + 2.50; // Simple linear model for print cost
  const shipping = 5.00;
  const marginPerUnit = input.listPrice - podCost - shipping;
  const monthlyNet = marginPerUnit * input.expectedUnitsPerMonth;

  if (marginPerUnit < 0) {
    flags.push({
      code: 'POD-01',
      title: copy.findingPod01Title,
      detail: copy.findingPod01Detail,
    });
  }

  if (input.expectedUnitsPerMonth < 5) {
    flags.push({
      code: 'POD-02',
      title: copy.findingPod02Title,
      detail: copy.findingPod02Detail,
    });
  }

  const score = Math.max(0, 100 - flags.length * 30);
  const verdict = score >= 70 ? 'clean' : score >= 40 ? 'check' : 'fix';

  return {
    monthlyNet,
    marginPerUnit,
    flags,
    verdict,
    score,
  };
}
