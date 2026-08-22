import { describe, expect, it } from 'vitest';
import {
  normalizeProjectRecord,
  normalizeProjectRecords,
} from './project-normalization';

const NOW = '2026-08-22T06:10:00.000Z';

function legacyRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: 'legacy-project',
    name: 'Legacy Cardigan',
    author: 'Designer',
    baseSize: 'M',
    gauge: { stitchesPer4In: 20, rowsPer4In: 28, unit: 'in' },
    sections: [],
    createdAt: '2026-08-20T00:00:00.000Z',
    updatedAt: '2026-08-21T00:00:00.000Z',
    ...overrides,
  };
}

describe('project normalization', () => {
  it('repairs the legacy required fields that render and sort paths depend on', () => {
    const project = normalizeProjectRecord(legacyRecord({ name: undefined, author: undefined, updatedAt: undefined }), NOW);

    expect(project).not.toBeNull();
    expect(project).toMatchObject({
      name: 'Untitled pattern',
      author: '',
      createdAt: '2026-08-20T00:00:00.000Z',
      updatedAt: '2026-08-20T00:00:00.000Z',
      sections: [],
    });
  });

  it('repairs invalid timestamps before render and sort consumers see them', () => {
    const project = normalizeProjectRecord(legacyRecord({
      createdAt: 'not-a-date',
      updatedAt: 'also-not-a-date',
    }), NOW);

    expect(project).toMatchObject({
      createdAt: NOW,
      updatedAt: NOW,
    });
    expect(Number.isFinite(Date.parse(project!.createdAt))).toBe(true);
    expect(Number.isFinite(Date.parse(project!.updatedAt))).toBe(true);

    const fallbackProject = normalizeProjectRecord(legacyRecord({
      createdAt: 'not-a-date',
      updatedAt: undefined,
    }), 'also-not-a-date');
    expect(fallbackProject).toMatchObject({
      createdAt: '1970-01-01T00:00:00.000Z',
      updatedAt: '1970-01-01T00:00:00.000Z',
    });
  });

  it('uses deterministic safe defaults for malformed collections and enum fields', () => {
    const project = normalizeProjectRecord(legacyRecord({
      gauge: null,
      sections: null,
      baseSize: 'not-a-size',
      sizingStandard: 'not-a-standard',
      tags: 'not-an-array',
      snapshots: {},
    }), NOW);

    expect(project).toMatchObject({
      baseSize: 'M',
      gauge: { stitchesPer4In: 0, rowsPer4In: 0, unit: 'in' },
      sections: [],
      sizingStandard: undefined,
      tags: undefined,
      snapshots: undefined,
    });
  });

  it('preserves valid project data rather than rewriting intentional values', () => {
    const source = legacyRecord({
      description: 'Keep the designer notes',
      yarnWeight: 'DK',
      tags: ['winter'],
      isArchived: true,
    });
    const project = normalizeProjectRecord(source, NOW);

    expect(project).toMatchObject({
      id: 'legacy-project',
      name: 'Legacy Cardigan',
      author: 'Designer',
      description: 'Keep the designer notes',
      yarnWeight: 'DK',
      tags: ['winter'],
      isArchived: true,
    });
  });

  it('normalizes only project records and gives malformed records unique migration ids', () => {
    const projects = normalizeProjectRecords([
      legacyRecord({ id: undefined, name: undefined }),
      legacyRecord({ id: undefined, author: undefined }),
      null,
      'not-a-project',
    ], NOW);

    expect(projects).toHaveLength(2);
    expect(projects[0].id).not.toBe(projects[1].id);
    expect(projects.every((project) => project.name && typeof project.author === 'string')).toBe(true);
  });

  it('normalizes nested sections and measurements', () => {
    const p = normalizeProjectRecord({
      sections: [
        {
          id: 's1',
          name: ' ',
          measurements: [
            { id: 'm1', label: 'Bust', baseValue: -5, measurementType: 'circumference' },
            { id: 'm2', label: ' ', baseValue: 40, measurementType: 'invalid' },
          ],
        },
      ],
    });

    expect(p?.sections[0].name).toBe('Unnamed section');
    expect(p?.sections[0].measurements[0].baseValue).toBe(0);
    expect(p?.sections[0].measurements[1].label).toBe('Unnamed measurement');
    expect(p?.sections[0].measurements[1].measurementType).toBe('circumference');
  });
});
