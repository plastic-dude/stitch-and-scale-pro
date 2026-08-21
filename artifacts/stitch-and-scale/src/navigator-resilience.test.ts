import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Navigator Resilience (F-07)', () => {
  const pagesDir = join(process.cwd(), 'src', 'pages');

  it('ProjectWorkspace uses the responsive TabNavigator component', () => {
    const source = readFileSync(join(pagesDir, 'project-workspace.tsx'), 'utf-8');
    expect(source).toContain("import { TabNavigator } from '../components/tab-navigator'");
    expect(source).toContain('<TabNavigator');
    expect(source).toContain('activeTab={activeTab}');
    expect(source).toContain('onTabChange={handleTabChange}');
    expect(source).toContain('language={currentLanguage}');
  });
});
