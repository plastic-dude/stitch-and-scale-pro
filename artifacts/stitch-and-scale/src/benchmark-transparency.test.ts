import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Benchmark Transparency (F-12)', () => {
  const componentsDir = join(process.cwd(), 'src', 'components');

  it('TeachEconomicsCard includes benchmark methodology disclosure', () => {
    const source = readFileSync(join(componentsDir, 'teach-economics-card.tsx'), 'utf-8');
    expect(source).toContain('BenchmarkFooter');
    expect(source).toContain('sourceLabel={workspaceCopy.sourceMethodology}');
    expect(source).toContain('methodology={workspaceCopy.methodologyTeach}');
  });

  it('SubmissionDeskCard includes benchmark methodology disclosure', () => {
    const source = readFileSync(join(componentsDir, 'submission-desk-card.tsx'), 'utf-8');
    expect(source).toContain('BenchmarkFooter');
    expect(source).toContain('sourceLabel={copy.sourceMethodology}');
    expect(source).toContain('methodology={copy.methodologySubmissions}');
  });

  it('TestKnitDeskCard includes benchmark methodology disclosure', () => {
    const source = readFileSync(join(componentsDir, 'testknit-desk-card.tsx'), 'utf-8');
    expect(source).toContain('BenchmarkFooter');
    expect(source).toContain('sourceLabel={copy.sourceMethodology}');
    expect(source).toContain('methodology={copy.methodologyTestknit}');
  });

  it('KalPlannerCard includes benchmark methodology disclosure', () => {
    const source = readFileSync(join(componentsDir, 'kal-planner-card.tsx'), 'utf-8');
    expect(source).toContain('BenchmarkFooter');
    expect(source).toContain('sourceLabel={workspaceCopy.sourceMethodology}');
    expect(source).toContain('methodology={workspaceCopy.methodologyKal}');
  });
  
  it('DealsTabCard includes benchmark methodology disclosure', () => {
    const source = readFileSync(join(componentsDir, 'deals-tab-card.tsx'), 'utf-8');
    expect(source).toContain('BenchmarkFooter');
    expect(source).toContain('sourceLabel={workspaceCopy.sourceMethodology}');
    expect(source).toContain('methodology={workspaceCopy.methodologyDeals}');
  });

  it('SpecSheetLabCard includes benchmark methodology disclosure', () => {
    const source = readFileSync(join(componentsDir, 'spec-sheet-lab-card.tsx'), 'utf-8');
    expect(source).toContain('BenchmarkFooter');
    expect(source).toContain('sourceLabel={workspaceCopy.sourceMethodology}');
    expect(source).toContain('methodology={workspaceCopy.methodologySubmissions}');
  });

  it('RetreatTeachingLabCard includes benchmark methodology disclosure', () => {
    const source = readFileSync(join(componentsDir, 'retreat-teaching-lab-card.tsx'), 'utf-8');
    expect(source).toContain('BenchmarkFooter');
    expect(source).toContain('sourceLabel={workspaceCopy.sourceMethodology}');
    expect(source).toContain('methodology={workspaceCopy.methodologyTeach}');
  });

  it('WorkshopTeachingLabCard includes benchmark methodology disclosure', () => {
    const source = readFileSync(join(componentsDir, 'workshop-teaching-lab-card.tsx'), 'utf-8');
    expect(source).toContain('BenchmarkFooter');
    expect(source).toContain('sourceLabel={workspaceCopy.sourceMethodology}');
    expect(source).toContain('methodology={workspaceCopy.methodologyTeach}');
  });
});
