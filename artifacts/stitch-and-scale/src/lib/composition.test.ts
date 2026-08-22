import { describe, it, expect } from 'vitest';
import { gradePattern, ALL_SIZES } from './grading-engine';
import type { PatternProject, PatternDocumentContent } from './grading-engine';

describe('Pattern Composition', () => {
  const mockProject: PatternProject = {
    id: 'test-p',
    name: 'Test Project',
    author: 'Test Author',
    baseSize: 'M',
    gauge: { stitches: 20, rows: 28 },
    sections: [],
    updatedAt: Date.now(),
    isArchived: false,
    tags: []
  };

  const mockContent: PatternDocumentContent = {
    sections: [
      {
        id: 's1',
        name: 'Back',
        steps: ['Cast on 100 sts.', 'Work in st st for 10 in.']
      }
    ],
    abbreviations: [
      { term: 'st(s)', definition: 'stitch(es)' },
      { term: 'st st', definition: 'stockinette stitch' }
    ],
    construction: ['Knit back.', 'Knit front.', 'Knit sleeves.'],
    finishing: 'Weave in ends.',
    care: 'Hand wash cold.'
  };

  it('should allow setting draft content', () => {
    const project = { ...mockProject, draftContent: mockContent };
    expect(project.draftContent?.sections.length).toBe(1);
    expect(project.draftContent?.abbreviations.length).toBe(2);
  });

  it('should allow compiling a publication package', () => {
    const project: PatternProject = {
      ...mockProject,
      draftContent: mockContent,
      publicationPackage: {
        id: 'pkg-1',
        projectId: 'test-p',
        version: '1.0.0',
        compiledAt: Date.now(),
        compiledContent: mockContent,
        artifacts: [],
        readiness: {
          score: 100,
          verdict: 'clean',
          checks: []
        }
      }
    };

    expect(project.publicationPackage?.compiledContent?.sections[0].name).toBe('Back');
  });
});
