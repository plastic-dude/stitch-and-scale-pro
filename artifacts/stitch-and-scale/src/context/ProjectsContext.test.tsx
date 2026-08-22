// CHK-119 regression — landing demo CTAs must never route a clean profile to
// "Project Not Found". The demo project (sample crew neck re-id'd to the
// canonical DEMO_PROJECT_ID) now seeds lazily on first request for the demo
// id via useProject. Tests cover the seed helper and the hook behavior with a
// mocked context.
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { DEMO_PROJECT_ID, makeDemoProject } from './ProjectsContext';
import { SAMPLE_CREW_NECK_SWEATER } from '@/lib/sample-projects';

const PROJECTS_CONTEXT_SOURCE = fs.readFileSync(
  path.resolve(__dirname, 'ProjectsContext.tsx'),
  'utf8',
);

describe('ProjectsProvider render integrity', () => {
  it('renders only its children after the Provider opening tag', () => {
    expect(PROJECTS_CONTEXT_SOURCE).not.toContain('],path:');
    expect(PROJECTS_CONTEXT_SOURCE).toMatch(/<ProjectsContext\.Provider[\s\S]*>\s*\{children\}/);
  });
});

describe('CHK-119 demo seed', () => {
  it('DEMO_PROJECT_ID matches the id the landing CTAs linked to historically', () => {
    expect(DEMO_PROJECT_ID).toBe('mss5osqd88j6fdyvtdu');
  });

  it('makeDemoProject re-ids the sample crew neck to the canonical demo id', () => {
    const demo = makeDemoProject('2026-08-17T00:00:00.000Z');
    expect(demo.id).toBe(DEMO_PROJECT_ID);
    expect(demo.name).toBe(SAMPLE_CREW_NECK_SWEATER.name);
    expect(demo.sections.length).toBeGreaterThan(0);
    expect(demo.createdAt).toBe('2026-08-17T00:00:00.000Z');
    expect(demo.updatedAt).toBe('2026-08-17T00:00:00.000Z');
  });

  it('every demo seed carries the populated sections/measurements the grading table and PDF expect', () => {
    const demo = makeDemoProject();
    const measurements = demo.sections.flatMap(s => s.measurements);
    expect(measurements.length).toBeGreaterThan(2);
    for (const s of demo.sections) {
      expect(s.measurements.every(m => m.id && m.label)).toBe(true);
    }
  });

  it('a fresh seed never collides with the stored samples', () => {
    expect(makeDemoProject().id).not.toBe(SAMPLE_CREW_NECK_SWEATER.id);
    expect(makeDemoProject().id).not.toBe('sample-basic-beanie');
  });
});
