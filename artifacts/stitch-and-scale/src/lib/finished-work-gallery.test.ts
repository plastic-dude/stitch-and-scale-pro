import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ASSETS_COPY } from '@/lib/assets-copy';
import { DASHBOARD_COPY } from '@/lib/dashboard-copy';
import { gradePattern, type ProjectAsset } from '@/lib/grading-engine';
import { SAMPLE_CREW_NECK_SWEATER } from '@/lib/sample-projects';
import { renderDocument } from '@/lib/pdf/renderer';
import { resolveTheme } from '@/lib/pdf/themes';

const SOURCE_ROOT = new URL('../', import.meta.url);
const readSource = (relativePath: string) => readFileSync(new URL(relativePath, SOURCE_ROOT), 'utf8');

const FINISHED_IMAGE: ProjectAsset = {
  id: 'finished-front',
  type: 'image',
  label: 'Finished front',
  filename: 'finished-front.png',
  mimeType: 'image/png',
  size: 68,
  dataUrl: 'data:image/png;base64,ZmFrZS1pbWFnZQ==',
  category: 'photo',
  createdAt: '2026-08-23T00:00:00.000Z',
  caption: 'Front view after blocking',
  isFinishedWork: true,
  isFeatured: true,
  includeInPdf: true,
};

const REFERENCE_IMAGE: ProjectAsset = {
  ...FINISHED_IMAGE,
  id: 'reference-photo',
  label: 'Reference photo',
  caption: 'Reference only',
  isFinishedWork: false,
};

describe('finished-work gallery contracts', () => {
  it('keeps archive empty-state copy populated in every supported locale', () => {
    for (const locale of Object.keys(DASHBOARD_COPY) as Array<keyof typeof DASHBOARD_COPY>) {
      expect(DASHBOARD_COPY[locale].archiveEmpty).toBeTruthy();
      expect(DASHBOARD_COPY[locale].archiveEmptyBody).toBeTruthy();
      expect(DASHBOARD_COPY[locale].archiveCreateHint).toBeTruthy();
      expect(DASHBOARD_COPY[locale].archiveRestore).toBeTruthy();
    }
  });

  it('keeps finished-work gallery copy populated in every supported locale', () => {
    for (const locale of Object.keys(ASSETS_COPY) as Array<keyof typeof ASSETS_COPY>) {
      expect(ASSETS_COPY[locale].finishedWorkTitle).toBeTruthy();
      expect(ASSETS_COPY[locale].finishedWorkDescription).toBeTruthy();
      expect(ASSETS_COPY[locale].addFinishedPhoto).toBeTruthy();
      expect(ASSETS_COPY[locale].caption).toBeTruthy();
      expect(ASSETS_COPY[locale].includeInPdf).toBeTruthy();
    }
  });

  it('renders opted-in finished photos and omits ordinary reference photos', () => {
    const project = { ...SAMPLE_CREW_NECK_SWEATER, assets: [FINISHED_IMAGE, REFERENCE_IMAGE] };
    const html = renderDocument({
      theme: resolveTheme('minimal'),
      pattern: project,
      gradingResult: gradePattern(project),
      finishedWorkPhotos: project.assets,
      includeFinishedPhotos: true,
      locale: 'en',
    });

    expect(html).toContain('Finished Work Photos');
    expect(html).toContain('Front view after blocking');
    expect(html).not.toContain('Reference only');
  });

  it('keeps the archive entry point and gallery metadata controls wired in source', () => {
    const dashboard = readSource('pages/dashboard.tsx');
    const assetsPanel = readSource('components/assets-panel.tsx');
    const projectPdf = readSource('pages/project-pdf.tsx');
    const tabLabels = readSource('lib/workspace-tab-labels.ts');
    const tabRegistry = readSource('lib/tab-registry.ts');

    expect(dashboard).toContain('data-testid="archive-empty-state"');
    expect(dashboard).toContain('data-testid="button-show-archived-empty"');
    expect(dashboard).toContain('copy.archiveCreateHint');
    expect(assetsPanel).toContain('data-testid="finished-work-gallery"');
    expect(assetsPanel).toContain('isFinishedWork');
    expect(assetsPanel).toContain('includeInPdf');
    expect(projectPdf).toContain('asset.isFinishedWork === true');
    expect(projectPdf).toContain('labels.patternNotes');
    expect(tabLabels).toContain("assets: 'Gallery & Assets'");
    expect(tabRegistry).toContain('label: "Gallery & Assets"');
  });
});
