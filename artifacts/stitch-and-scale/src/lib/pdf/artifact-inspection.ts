export const PUBLICATION_ARTIFACT_VERSION = 1;

export type PublicationArtifactSeverity = 'error' | 'warn' | 'info';
export type PublicationArtifactCode = 'A-001' | 'A-002' | 'A-003' | 'A-004' | 'A-005' | 'A-006' | 'A-007';
export type CoverThemeId = 'minimal' | 'luxury' | 'craft' | 'technical' | 'unknown';

export interface CoverBudgetAnalysis {
  themeId: CoverThemeId;
  locale: string;
  titleCharacters: number;
  coverTextCharacters: number;
  titleLimit: number;
  coverTextLimit: number;
  titleRisk: boolean;
  coverTextRisk: boolean;
  status: 'safe' | 'blocked';
}

export interface PublicationArtifactIssue {
  code: PublicationArtifactCode;
  severity: PublicationArtifactSeverity;
  detail: string;
}

export interface PublicationArtifactInspection {
  version: number;
  htmlBytes: number;
  textCharacters: number;
  headingCount: number;
  tableCount: number;
  imageCount: number;
  imagesMissingAlt: number;
  pageMarkerCount: number;
  coverTextCharacters: number;
  coverBudget: CoverBudgetAnalysis;
  readyForReview: boolean;
  issues: PublicationArtifactIssue[];
}

export interface PublicationArtifactInspectionOptions {
  themeId?: string;
  locale?: string;
}

const THEME_LIMITS: Record<CoverThemeId, { title: number; cover: number }> = {
  minimal: { title: 108, cover: 780 },
  luxury: { title: 84, cover: 690 },
  craft: { title: 90, cover: 950 },
  technical: { title: 104, cover: 760 },
  unknown: { title: 90, cover: 900 },
};

const LOCALE_FACTORS: Record<string, number> = { en: 1, de: 0.94, fr: 0.95, es: 0.98, pt: 0.98 };

function stripMarkup(html: string): string {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function countMatches(html: string, pattern: RegExp): number {
  return html.match(pattern)?.length ?? 0;
}

function normalizeTheme(themeId: string | undefined): CoverThemeId {
  return themeId && themeId in THEME_LIMITS ? themeId as CoverThemeId : 'unknown';
}

function normalizeLocale(source: string, locale: string | undefined): string {
  const htmlLocale = source.match(/<html\b[^>]*\blang\s*=\s*["']([^"']+)["']/i)?.[1];
  return (locale ?? htmlLocale ?? 'en').toLowerCase().split('-')[0];
}

function makeCoverBudget(source: string, coverMarkup: string, options: PublicationArtifactInspectionOptions): CoverBudgetAnalysis {
  const themeId = normalizeTheme(options.themeId);
  const locale = normalizeLocale(source, options.locale);
  const base = THEME_LIMITS[themeId];
  const localeFactor = LOCALE_FACTORS[locale] ?? 0.96;
  const titleMatch = source.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  const titleCharacters = titleMatch ? stripMarkup(titleMatch[1]).length : 0;
  const coverTextCharacters = stripMarkup(coverMarkup).length;
  const titleLimit = Math.floor(base.title * localeFactor);
  const coverTextLimit = Math.floor(base.cover * localeFactor);
  const titleRisk = titleCharacters > titleLimit;
  const coverTextRisk = coverTextCharacters > coverTextLimit;
  return { themeId, locale, titleCharacters, coverTextCharacters, titleLimit, coverTextLimit, titleRisk, coverTextRisk, status: titleRisk || coverTextRisk ? 'blocked' : 'safe' };
}

export function inspectPublicationArtifact(html: string, options: PublicationArtifactInspectionOptions = {}): PublicationArtifactInspection {
  const source = html ?? '';
  const textCharacters = stripMarkup(source).length;
  const headingCount = countMatches(source, /<h[1-6]\b[^>]*>/gi);
  const tableCount = countMatches(source, /<table\b[^>]*>/gi);
  const imageTags = source.match(/<img\b[^>]*>/gi) ?? [];
  const imagesMissingAlt = imageTags.filter((tag) => !/\balt\s*=\s*["'][^"']*["']/i.test(tag)).length;
  const pageMarkerCount = countMatches(source, /(?:page-break|page-break-after|class\s*=\s*["'][^"']*\bpage\b)/gi);
  const coverMarkup = source.split('<div class="page">', 1)[0] ?? source;
  const coverTextCharacters = stripMarkup(coverMarkup).length;
  const titleMatch = source.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  const hasTitle = /<title\b[^>]*>\s*[^<]+\s*<\/title>|<h1\b[^>]*>\s*[^<]+\s*<\/h1>/i.test(source);
  const coverBudget = makeCoverBudget(source, coverMarkup, options);
  const issues: PublicationArtifactIssue[] = [];

  if (textCharacters === 0) issues.push({ code: 'A-001', severity: 'error', detail: 'The rendered publication artifact contains no readable text.' });
  if (!hasTitle) issues.push({ code: 'A-002', severity: 'error', detail: 'The rendered publication artifact has no non-empty title or level-one heading.' });
  if (headingCount < 2) issues.push({ code: 'A-003', severity: 'warn', detail: 'The rendered publication artifact has fewer than two structural headings.' });
  if (imagesMissingAlt > 0) issues.push({ code: 'A-004', severity: 'warn', detail: `${imagesMissingAlt} rendered image(s) do not expose an alt attribute for review.` });
  if (tableCount === 0) issues.push({ code: 'A-005', severity: 'info', detail: 'No HTML table was detected; verify that measurement and grading content is represented deliberately.' });
  if (pageMarkerCount === 0) issues.push({ code: 'A-006', severity: 'info', detail: 'No explicit page-break marker was detected; review pagination in the print artifact.' });
  if (coverBudget.status === 'blocked') {
    const cause = [coverBudget.titleRisk ? `title ${coverBudget.titleCharacters}/${coverBudget.titleLimit}` : '', coverBudget.coverTextRisk ? `cover ${coverBudget.coverTextCharacters}/${coverBudget.coverTextLimit}` : ''].filter(Boolean).join('; ');
    issues.push({ code: 'A-007', severity: 'error', detail: `Cover content exceeds the ${coverBudget.themeId}/${coverBudget.locale} conservative budget (${cause}); review title and optional notes before printing to prevent footer collision.` });
  }

  return {
    version: PUBLICATION_ARTIFACT_VERSION,
    htmlBytes: new TextEncoder().encode(source).byteLength,
    textCharacters,
    headingCount,
    tableCount,
    imageCount: imageTags.length,
    imagesMissingAlt,
    pageMarkerCount,
    coverTextCharacters,
    coverBudget,
    readyForReview: !issues.some((issue) => issue.severity === 'error'),
    issues,
  };
}
