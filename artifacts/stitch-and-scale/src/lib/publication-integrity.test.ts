import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/storage-lib', () => ({
  writeProjects: vi.fn(() => Promise.resolve()),
}));

import { makeDemoProject, projectsReducer } from '@/context/ProjectsContext';
import type { PatternProject } from './grading-engine';
import {
  SOURCE_CHANGED_ISSUE_ID,
  SOURCE_CHANGED_REASON,
  canClaimPublicationReady,
  hasPublicationSourceChanged,
  invalidatePublicationState,
  normalizePublicationPackage,
} from './publication-integrity';

function approvedProject(): PatternProject {
  const project = makeDemoProject('2026-08-22T00:00:00.000Z');
  return {
    ...project,
    humanReview: {
      status: 'approved',
      reviewerName: 'Reviewer',
      note: 'Approved after test knit.',
      reviewedAt: '2026-08-21T00:00:00.000Z',
    },
    publicationContract: {
      version: '1.0.0',
      signOffs: [
        {
          stage: 'mathematical',
          status: 'ready',
          issues: [],
          approver: 'Reviewer',
          approvedAt: '2026-08-21T00:00:00.000Z',
        },
        { stage: 'editorial', status: 'pending', issues: [] },
      ],
      isReady: true,
      updatedAt: '2026-08-21T00:00:00.000Z',
    },
    publicationPackages: [
      {
        id: 'package-1',
        version: '1.0.0',
        status: 'published',
        readinessVerdict: 'ready',
        authoritativeMetadata: {
          title: project.name,
          author: project.author,
          copyright: '© 2026 Reviewer',
          description: project.description ?? '',
          sizes: ['XS', 'S', 'M', 'L', 'XL'],
          gauge: project.gauge,
        },
        artifacts: [],
        createdAt: '2026-08-21T00:00:00.000Z',
        updatedAt: '2026-08-21T00:00:00.000Z',
      },
    ],
  };
}

describe('publication integrity', () => {
  it('ignores operational metadata when deciding whether publication source changed', () => {
    const project = approvedProject();
    const housekeepingEdit: PatternProject = {
      ...project,
      tags: ['reviewed'],
      updatedAt: '2026-08-23T00:00:00.000Z',
    };

    expect(hasPublicationSourceChanged(project, housekeepingEdit)).toBe(false);
  });

  it('treats yarn weight as publication-relevant source data', () => {
    const project = approvedProject();
    expect(hasPublicationSourceChanged(project, { ...project, yarnWeight: 'DK' })).toBe(true);
  });

  it('invalidates approvals and packages without deleting historical evidence', () => {
    const project = approvedProject();
    const invalidated = invalidatePublicationState(
      { ...project, description: 'Updated construction notes.' },
      '2026-08-23T00:00:00.000Z',
    );

    expect(invalidated.humanReview?.status).toBe('changes-requested');
    expect(invalidated.humanReview?.invalidatedAt).toBe('2026-08-23T00:00:00.000Z');
    expect(invalidated.humanReview?.note).toContain('Approved after test knit.');
    expect(invalidated.humanReview?.invalidationReason).toBe(SOURCE_CHANGED_REASON);
    expect(invalidated.publicationContract?.isReady).toBe(false);
    expect(invalidated.publicationContract?.signOffs[0]).toMatchObject({
      status: 'blocked',
      approver: undefined,
      approvedAt: undefined,
    });
    expect(invalidated.publicationContract?.signOffs[0].issues[0].id).toBe(
      `${SOURCE_CHANGED_ISSUE_ID}-mathematical`,
    );
    expect(invalidated.publicationContract?.signOffs[1].status).toBe('pending');
    expect(invalidated.publicationPackages?.[0]).toMatchObject({
      status: 'published',
      readinessVerdict: 'blocked',
      stale: true,
      staleAt: '2026-08-23T00:00:00.000Z',
    });
    expect(invalidated.publicationPackages?.[0].artifacts).toEqual([]);
  });

  it('requires current human approval and every formal stage before claiming ready', () => {
    const project = approvedProject();
    expect(canClaimPublicationReady(project)).toBe(false);

    const fullyApproved: PatternProject = {
      ...project,
      publicationContract: {
        ...project.publicationContract!,
        signOffs: project.publicationContract!.signOffs.map((signOff) => ({
          ...signOff,
          status: 'ready' as const,
        })),
      },
    };
    expect(canClaimPublicationReady(fullyApproved)).toBe(true);
    expect(canClaimPublicationReady({ ...fullyApproved, humanReview: undefined })).toBe(false);
    expect(
      canClaimPublicationReady({
        ...fullyApproved,
        humanReview: { ...fullyApproved.humanReview!, invalidatedAt: '2026-08-23T00:00:00.000Z' },
      }),
    ).toBe(false);
  });

  it('keeps a stale package blocked when a compiler update tries to restore ready', () => {
    const project = approvedProject();
    const invalidated = invalidatePublicationState(
      { ...project, description: 'Changed source.' },
      '2026-08-23T00:00:00.000Z',
    );
    const existing = invalidated.publicationPackages![0];
    const incoming = { ...existing, readinessVerdict: 'ready' as const, stale: false };
    const normalized = normalizePublicationPackage(
      invalidated,
      incoming,
      existing,
      '2026-08-24T00:00:00.000Z',
    );

    expect(normalized.readinessVerdict).toBe('blocked');
    expect(normalized.stale).toBe(true);
    expect(normalized.staleReason).toBe(SOURCE_CHANGED_REASON);
    expect(normalized.staleAt).toBe('2026-08-23T00:00:00.000Z');

    const [updated] = projectsReducer([invalidated], {
      type: 'UPDATE_PUBLICATION_PACKAGE',
      payload: { projectId: invalidated.id, pkg: incoming },
    });
    expect(updated.publicationPackages?.[0]).toMatchObject({
      readinessVerdict: 'blocked',
      stale: true,
    });
  });

  it('applies invalidation at the reducer mutation boundary', () => {
    const project = approvedProject();
    const changed: PatternProject = { ...project, description: 'Changed source.' };
    const [result] = projectsReducer([{ ...project }], { type: 'UPDATE', payload: changed });

    expect(result.humanReview?.status).toBe('changes-requested');
    expect(result.publicationContract?.isReady).toBe(false);
    expect(result.publicationPackages?.[0].stale).toBe(true);
  });

  it('does not duplicate a ready publication claim into a copied project', () => {
    const project = approvedProject();
    const [original, duplicate] = projectsReducer([project], { type: 'DUPLICATE', payload: project.id });

    expect(original).toEqual(project);
    expect(duplicate.id).not.toBe(project.id);
    expect(duplicate.humanReview?.status).toBe('changes-requested');
    expect(duplicate.publicationContract?.isReady).toBe(false);
    expect(duplicate.publicationPackages?.[0].stale).toBe(true);
  });
});
