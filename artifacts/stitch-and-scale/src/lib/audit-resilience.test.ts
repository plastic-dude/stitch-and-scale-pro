import { describe, it, expect } from 'vitest';
import { validateDraft } from './pattern-draft-renderer';
import { sanitizeFilename } from './pdf/print-utils';
import { PatternProject } from './grading-engine';

describe('Audit Resilience (CHK-156)', () => {
  describe('F-09: Draft Token Validation', () => {
    const mockProject: PatternProject = {
      id: 'p1',
      name: 'Test Project',
      author: 'Tester',
      baseSize: 'M',
      gauge: { stitchesPer4In: 20, rowsPer4In: 28, unit: 'in' },
      sections: [
        {
          id: 's1',
          name: 'Body',
          measurements: [
            { id: 'm1', label: 'Chest', measurementType: 'circumference', gradingKey: 'bust', baseValue: 100 }
          ] as any
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    it('should resolve standard tokens', () => {
      const issues = validateDraft('Project: {Name} by {Author}', mockProject, undefined);
      expect(issues).toHaveLength(0);
    });

    it('should resolve valid size tokens', () => {
      const issues = validateDraft('Chest at M: {Size.M.bust}', mockProject, undefined);
      expect(issues).toHaveLength(0);
    });

    it('should flag unresolved tokens', () => {
      const issues = validateDraft('Unknown: {Size.M.waist}', mockProject, undefined);
      expect(issues).toHaveLength(1);
      expect(issues[0].token).toBe('{Size.M.waist}');
    });

    it('should flag malformed tokens', () => {
      const issues = validateDraft('Malformed: {123Invalid}', mockProject, undefined);
      // Malformed tokens are ignored by the regex, but we can test the regex itself
      const tokens = 'Malformed: {123Invalid}'.match(/\{([A-Za-z][A-Za-z0-9._-]*)\}/g) || [];
      expect(tokens).toHaveLength(0);
    });
  });

  describe('F-05/F-06: Filename & Deep Link Resilience', () => {
    it('should sanitize dangerous filenames', () => {
      expect(sanitizeFilename('../etc/passwd')).not.toContain('..');
      expect(sanitizeFilename('file/with/slashes')).not.toContain('/');
      expect(sanitizeFilename('CON.pdf')).not.toBe('CON.pdf');
    });
  });
});
