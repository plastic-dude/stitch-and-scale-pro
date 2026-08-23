import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const WORKSPACE = join(__dirname, '..', 'pages', 'project-workspace.tsx');
const COMPILER = join(__dirname, '..', 'components', 'project-compiler-card.tsx');

const workspaceSource = readFileSync(WORKSPACE, 'utf8');
const compilerSource = readFileSync(COMPILER, 'utf8');

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

  it('keeps compiler validation local and package-scoped', () => {
    expect(compilerSource).toContain("import { compileProject } from '@/lib/pattern-compiler'");
    expect(compilerSource).toContain('updatePublicationPackage({');
    expect(compilerSource).not.toMatch(/fetch\s*\(/);
    expect(compilerSource).not.toMatch(/axios/);
    expect(compilerSource).not.toMatch(/XMLHttpRequest/);
  });
});
