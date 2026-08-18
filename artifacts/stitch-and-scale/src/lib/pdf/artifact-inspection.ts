export const PUBLICATION_ARTIFACT_VERSION = 1;

export type PublicationArtifactSeverity = 'error' | 'warn' | 'info';
export type PublicationArtifactCode = 'A-001' | 'A-002' | 'A-003' | 'A-004' | 'A-005' | 'A-006';

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
  readyForReview: boolean;
  issues: PublicationArtifactIssue[];
}

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

export function inspectPublicationArtifact(html: string): PublicationArtifactInspection {
  const source = html ?? '';
  const textCharacters = stripMarkup(source).length;
  const headingCount = countMatches(source, /<h[1-6]\b[^>]*>/gi);
  const tableCount = countMatches(source, /<table\b[^>]*>/gi);
  const imageTags = source.match(/<img\b[^>]*>/gi) ?? [];
  const imagesMissingAlt = imageTags.filter((tag) => !/\balt\s*=\s*["'][^"']*["']/i.test(tag)).length;
  const pageMarkerCount = countMatches(source, /(?:page-break|page-break-after|class\s*=\s*["'][^"']*\bpage\b)/gi);
  const hasTitle = /<title\b[^>]*>\s*[^<]+\s*<\/title>|<h1\b[^>]*>\s*[^<]+\s*<\/h1>/i.test(source);
  const issues: PublicationArtifactIssue[] = [];

  if (textCharacters === 0) {
    issues.push({ code: 'A-001', severity: 'error', detail: 'The rendered publication artifact contains no readable text.' });
  }
  if (!hasTitle) {
    issues.push({ code: 'A-002', severity: 'error', detail: 'The rendered publication artifact has no non-empty title or level-one heading.' });
  }
  if (headingCount < 2) {
    issues.push({ code: 'A-003', severity: 'warn', detail: 'The rendered publication artifact has fewer than two structural headings.' });
  }
  if (imagesMissingAlt > 0) {
    issues.push({ code: 'A-004', severity: 'warn', detail: `${imagesMissingAlt} rendered image(s) do not expose an alt attribute for review.` });
  }
  if (tableCount === 0) {
    issues.push({ code: 'A-005', severity: 'info', detail: 'No HTML table was detected; verify that measurement and grading content is represented deliberately.' });
  }
  if (pageMarkerCount === 0) {
    issues.push({ code: 'A-006', severity: 'info', detail: 'No explicit page-break marker was detected; review pagination in the print artifact.' });
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
    readyForReview: !issues.some((issue) => issue.severity === 'error'),
    issues,
  };
}
