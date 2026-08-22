import { describe, expect, it } from 'vitest';
import { projectsReducer } from '@/context/ProjectsContext';
import {
  artifactQualitySnapshot,
  normalizeArtifactInspectionReport,
} from './artifact-inspection';
import {
  type PatternProject,
  type ArtifactInspectionReport,
} from './grading-engine';

function testProject(): PatternProject {
  return {
    id: 'p1',
    name: 'Test Project',
    author: 'Designer',
    baseSize: 'M',
    gauge: { stitchesPer4In: 20, rowsPer4In: 28, unit: 'in' },
    sections: [],
    updatedAt: new Date().toISOString(),
    publicationPackages: [
      {
        id: 'pkg1',
        version: '1.0.0',
        status: 'draft',
        readinessVerdict: 'pending',
        authoritativeMetadata: {
          title: 'Test Pkg',
          author: 'Designer',
          copyright: '© 2026',
          description: '',
          sizes: ['M'],
          gauge: { stitchesPer4In: 20, rowsPer4In: 28, unit: 'in' },
        },
        artifacts: [
          {
            id: 'art1',
            type: 'pdf',
            label: 'Pattern PDF',
            filename: 'pattern.pdf',
            timestamp: new Date().toISOString(),
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    ]
  };
}

describe('artifact inspection logic', () => {
  it('applies inspection report and updates quality snapshot', () => {
    const project = testProject();
    const report: ArtifactInspectionReport = {
      pageCount: 12,
      hasBlankPages: false,
      hasTitle: true,
      hasHeadings: true,
      hasTableContinuity: true,
      rendererVersion: '1.0.0',
      templateId: 'standard',
      locale: 'en',
      inspectedAt: new Date().toISOString(),
      inspector: 'human',
      verdict: 'pass',
      notes: 'Looks great.'
    };

    const [updated] = projectsReducer([project], {
      type: 'INSPECT_ARTIFACT',
      payload: { 
        projectId: 'p1', 
        packageId: 'pkg1', 
        artifactId: 'art1', 
        report 
      }
    });

    const artifact = updated.publicationPackages![0].artifacts[0];
    expect(artifact.inspectionReport).toEqual(report);
    expect(artifact.qualitySnapshot).toBe('pass');
  });

  it('preserves explicit false checklist values and downgrades an incomplete pass', () => {
    const report = normalizeArtifactInspectionReport({
      pageCount: 0,
      hasBlankPages: false,
      hasTitle: false,
      hasHeadings: false,
      hasTableContinuity: false,
      rendererVersion: '1.0.0',
      templateId: 'standard-v1',
      locale: 'en',
      inspectedAt: new Date().toISOString(),
      inspector: 'human',
      verdict: 'pass',
    });

    expect(report.hasTitle).toBe(false);
    expect(report.hasHeadings).toBe(false);
    expect(report.hasTableContinuity).toBe(false);
    expect(report.verdict).toBe('fail');
    expect(artifactQualitySnapshot(report)).toBe('fail');
  });

  it('keeps unknown blank-page evidence pending', () => {
    const report = normalizeArtifactInspectionReport({
      pageCount: 4,
      hasTitle: true,
      hasHeadings: true,
      hasTableContinuity: true,
      rendererVersion: '1.0.0',
      templateId: 'standard-v1',
      locale: 'en',
      inspectedAt: new Date().toISOString(),
      inspector: 'human',
      verdict: 'pass',
    });

    expect(report.verdict).toBe('warning');
    expect(artifactQualitySnapshot(report)).toBe('pending');
  });

  it('keeps a complete report green when it has a positive page count', () => {
    const report = normalizeArtifactInspectionReport({
      pageCount: 4,
      hasBlankPages: false,
      hasTitle: true,
      hasHeadings: true,
      hasTableContinuity: true,
      rendererVersion: '1.0.0',
      templateId: 'standard-v1',
      locale: 'en',
      inspectedAt: new Date().toISOString(),
      inspector: 'human',
      verdict: 'pass',
    });

    expect(report.verdict).toBe('pass');
    expect(artifactQualitySnapshot(report)).toBe('pass');
  });

  it('downgrades a fully checked report with zero pages to pending', () => {
    const report = normalizeArtifactInspectionReport({
      pageCount: 0,
      hasBlankPages: false,
      hasTitle: true,
      hasHeadings: true,
      hasTableContinuity: true,
      rendererVersion: '1.0.0',
      templateId: 'standard-v1',
      locale: 'en',
      inspectedAt: new Date().toISOString(),
      inspector: 'human',
      verdict: 'pass',
    });

    expect(report.verdict).toBe('warning');
    expect(artifactQualitySnapshot(report)).toBe('pending');
  });

  it('forces a failed quality snapshot when a pass payload contains a blank page', () => {
    const project = testProject();
    const report: ArtifactInspectionReport = {
      pageCount: 12,
      hasBlankPages: true,
      hasTitle: true,
      hasHeadings: true,
      hasTableContinuity: true,
      rendererVersion: '1.0.0',
      templateId: 'standard-v1',
      locale: 'en',
      inspectedAt: new Date().toISOString(),
      inspector: 'human',
      verdict: 'pass',
    };

    const [updated] = projectsReducer([project], {
      type: 'INSPECT_ARTIFACT',
      payload: { projectId: 'p1', packageId: 'pkg1', artifactId: 'art1', report },
    });

    const artifact = updated.publicationPackages![0].artifacts[0];
    expect(artifact.inspectionReport?.verdict).toBe('fail');
    expect(artifact.qualitySnapshot).toBe('fail');
  });

  it('sets quality snapshot to fail when verdict is fail', () => {
    const project = testProject();
    const report: ArtifactInspectionReport = {
      rendererVersion: '1.0.0',
      templateId: 'standard',
      locale: 'en',
      inspectedAt: new Date().toISOString(),
      inspector: 'human',
      verdict: 'fail',
    };

    const [updated] = projectsReducer([project], {
      type: 'INSPECT_ARTIFACT',
      payload: { 
        projectId: 'p1', 
        packageId: 'pkg1', 
        artifactId: 'art1', 
        report 
      }
    });

    const artifact = updated.publicationPackages![0].artifacts[0];
    expect(artifact.qualitySnapshot).toBe('fail');
  });
});
