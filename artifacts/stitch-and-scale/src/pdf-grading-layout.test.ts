import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { getPdfLabels } from '@/lib/pdf/labels';
import { renderDocument } from '@/lib/pdf/renderer';
import { resolveTheme } from '@/lib/pdf/themes';
import { gradePattern } from '@/lib/grading-engine';
import { SAMPLE_CREW_NECK_SWEATER } from '@/lib/sample-projects';

const readSource = (relativePath: string) => fs.readFileSync(
  path.resolve(__dirname, relativePath),
  'utf8',
);

const pdfPageSource = readSource('pages/project-pdf.tsx');
const gradingPageSource = readSource('pages/project-grading.tsx');
const rendererSource = readSource('lib/pdf/renderer.ts');

function renderSamplePdf(): string {
  return renderDocument({
    theme: resolveTheme('minimal'),
    pattern: SAMPLE_CREW_NECK_SWEATER,
    gradingResult: gradePattern(SAMPLE_CREW_NECK_SWEATER),
    locale: 'en',
  });
}

describe('full-document PDF preview contract', () => {
  it('measures the complete same-origin srcDoc rather than cropping to one page', () => {
    expect(pdfPageSource).toContain('const [previewHeight, setPreviewHeight]');
    expect(pdfPageSource).toContain('iframe.contentDocument?.documentElement');
    expect(pdfPageSource).toContain('Math.max(documentRoot.scrollHeight, documentBody.scrollHeight)');
    expect(pdfPageSource).toContain('setPreviewHeight(Math.ceil(documentHeight * scale))');
    expect(pdfPageSource).toContain('className="shadow-2xl rounded-sm overflow-visible"');
    expect(pdfPageSource).not.toContain('height: 1123');
    expect(pdfPageSource).not.toContain('container.style.height = `${Math.round(1123 * scale)}px`');
  });

  it('explains that the visible preview and export both cover the complete document', () => {
    expect(pdfPageSource).toContain('data-testid="pdf-preview-status"');
    expect(pdfPageSource).toContain('data-testid="pdf-preview-hint"');
    for (const locale of ['en', 'de', 'fr', 'es', 'pt']) {
      const labels = getPdfLabels(locale);
      expect(labels.fullDocumentPreview, locale).toBeTruthy();
      expect(labels.previewScrollHint, locale).toBeTruthy();
    }
  });
});

describe('grading matrix responsive and print contract', () => {
  it('renders all sizes in a dedicated landscape grading page with safe table fragmentation', () => {
    const html = renderSamplePdf();
    expect(rendererSource).toContain('@page grading-landscape { size: letter landscape; margin: 0; }');
    expect(rendererSource).toContain('.grading-page { page: grading-landscape;');
    expect(rendererSource).toContain('.grading-matrix { width: 100%; table-layout: fixed; }');
    expect(rendererSource).toContain('.grading-matrix .grading-row { page-break-inside: avoid; break-inside: avoid; }');
    expect(html).toContain('class="page grading-page"');
    expect(html).toContain('class="grading-matrix"');
    expect(html).toContain('>4XL</th>');
    expect(html).toContain('>5XL</th>');
    expect((html.match(/<col class="size-col">/g) ?? []).length).toBeGreaterThanOrEqual(9);
  });

  it('keeps the live table scrollable but makes continuation and keyboard access explicit', () => {
    expect(gradingPageSource).toContain('className="grading-table-region overflow-x-auto print:overflow-visible"');
    expect(gradingPageSource).toContain('role="region"');
    expect(gradingPageSource).toContain('tabIndex={0}');
    expect(gradingPageSource).toContain('aria-describedby={`grading-table-hint-${section.sectionId}`}');
    expect(gradingPageSource).toContain('{gradingCopy.tableScrollHint}');
    expect(gradingPageSource).toContain('className="sticky left-0 z-20');
    expect(gradingPageSource).toContain('className="grading-table w-full min-w-[1050px]');
    expect(gradingPageSource.indexOf('<HumanReviewCard')).toBeLessThan(gradingPageSource.indexOf('<McpGradingAssistantCard'));
  });
});
