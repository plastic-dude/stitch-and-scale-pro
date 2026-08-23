import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const WORKSPACE = join(__dirname, '..', 'pages', 'project-workspace.tsx');
const COMPILER = join(__dirname, '..', 'components', 'project-compiler-card.tsx');
const PDF_PAGE = join(__dirname, '..', 'pages', 'project-pdf.tsx');

const workspaceSource = readFileSync(WORKSPACE, 'utf8');
const compilerSource = readFileSync(COMPILER, 'utf8');
const pdfSource = readFileSync(PDF_PAGE, 'utf8');

describe('publication package workflow wiring', () => {
  it('lazy-loads the deterministic compiler alongside the package surface', () => {
    expect(workspaceSource).toContain("compiler: React.lazy(cardLazy(() => import('@/components/project-compiler-card')))");

    const packagesCase = workspaceSource.slice(
      workspaceSource.indexOf("case 'packages':"),
      workspaceSource.indexOf("case 'assets':"),
    );
    expect(packagesCase).toContain('const Compiler = LAB.compiler');
    expect(packagesCase).toContain('<Compiler');
    expect(packagesCase).toContain('project={project}');
    expect(packagesCase).toContain('updatePublicationPackage={updatePublicationPackage}');
  });

  it('records PDF provenance at print preparation without claiming a saved file', () => {
    expect(pdfSource).toContain("import { PDF_RENDERER_VERSION, renderDocument } from '@/lib/pdf/renderer';");
    expect(pdfSource).toContain('rendererVersion: PDF_RENDERER_VERSION');
    expect(pdfSource).toContain('templateId: selectedTheme');
    expect(pdfSource).toContain('locale: language');
    expect(pdfSource).toContain('metadata-only');
    expect(pdfSource).toContain('never that the user saved a PDF');
  });

  it('records PDF provenance on the current draft package, not a stale first package', () => {
    expect(pdfSource).toContain("publicationPackages.find(candidate => candidate.status === 'draft')");
    expect(pdfSource).toContain('fall back to the newest package for legacy data');
    expect(pdfSource).not.toContain('const pkg = projectHook.project.publicationPackages[0];');
  });

  it('keeps compiler validation local and package-scoped', () => {
    expect(compilerSource).toContain("import { compileProject } from '@/lib/pattern-compiler'");
    expect(compilerSource).toContain('updatePublicationPackage({');
    expect(compilerSource).not.toMatch(/fetch\s*\(/);
    expect(compilerSource).not.toMatch(/axios/);
    expect(compilerSource).not.toMatch(/XMLHttpRequest/);
  });
});
