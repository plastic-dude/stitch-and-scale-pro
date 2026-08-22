import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const DASHBOARD_SOURCE = fs.readFileSync(
  path.resolve(__dirname, 'dashboard.tsx'),
  'utf8',
);

describe('dashboard batch-selection controls', () => {
  it('keeps project selectors visible on touch/coarse-pointer devices', () => {
    expect(DASHBOARD_SOURCE).toMatch(
      /data-testid=\{`button-select-project-\$\{project\.id\}`}[\s\S]{0,220}opacity-100 \[@media\(pointer:fine\)\]:opacity-0/,
    );
    expect(DASHBOARD_SOURCE).not.toContain(
      "bg-card border-border group-hover:border-accent/50 opacity-0 group-hover:opacity-100",
    );
  });

  it('gives each project selector a stateful accessible name and stable test hook', () => {
    expect(DASHBOARD_SOURCE).toContain('aria-label={`${selectedIds.has(project.id) ? copy.batchDeselectAll : copy.batchSelectAll}: ${project.name}`}');
    expect(DASHBOARD_SOURCE).toContain('data-testid={`button-select-project-${project.id}`}');
    expect(DASHBOARD_SOURCE).toContain('type="button"');
  });
});

describe('dashboard batch-selection safety', () => {
  it('stops selector clicks from navigating into the project card', () => {
    expect(DASHBOARD_SOURCE).toMatch(/e\.preventDefault\(\);\s*e\.stopPropagation\(\);\s*toggleSelect\(project\.id\)/);
  });
});
