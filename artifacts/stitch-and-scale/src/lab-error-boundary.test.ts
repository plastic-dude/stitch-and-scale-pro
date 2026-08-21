import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Lab Error Boundary (QUEUE-017-BOUND)', () => {
  const workspacePath = path.resolve(__dirname, 'pages/project-workspace.tsx');
  const copyPath = path.resolve(__dirname, 'lib/workspace-copy.ts');

  it('ProjectWorkspace implements LabErrorBoundary around LazyPanel', () => {
    const content = fs.readFileSync(workspacePath, 'utf-8');
    expect(content).toContain('class LabErrorBoundary extends React.Component');
    expect(content).toContain('<LabErrorBoundary fallback={errorFallback}>');
    expect(content).toContain('<React.Suspense fallback=');
  });

  it('LabErrorBoundary includes retry button and localized strings', () => {
    const content = fs.readFileSync(workspacePath, 'utf-8');
    expect(content).toContain('onClick={() => window.location.reload()}');
    expect(content).toContain('copy.labLoadErrorTitle');
    expect(content).toContain('copy.labLoadErrorDesc');
    expect(content).toContain('copy.retry');
  });

  it('WorkspaceCopy includes all 4 required localization keys in all 5 locales', () => {
    const content = fs.readFileSync(copyPath, 'utf-8');
    const keys = ['loadingLab', 'labLoadErrorTitle', 'labLoadErrorDesc', 'retry'];
    const locales = ['en:', 'de:', 'fr:', 'es:', 'pt:'];

    keys.forEach(key => {
      expect(content).toContain(`${key}: string;`);
    });

    locales.forEach(locale => {
      keys.forEach(key => {
        // Simple check that the key exists within the locale block
        const localeIndex = content.indexOf(locale);
        const nextLocaleIndex = locales.findIndex(l => content.indexOf(l) > localeIndex);
        const searchEnd = nextLocaleIndex === -1 ? content.length : content.indexOf(locales[nextLocaleIndex]);
        const localeBlock = content.substring(localeIndex, searchEnd);
        expect(localeBlock).toContain(`${key}:`);
      });
    });
  });
});
