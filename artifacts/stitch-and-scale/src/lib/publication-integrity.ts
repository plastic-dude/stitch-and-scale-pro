import type {
  PatternProject,
  PublicationContract,
  PublicationPackage,
  ReadinessIssue,
} from './grading-engine';

export const SOURCE_CHANGED_ISSUE_ID = 'system-source-changed-after-approval';
export const SOURCE_CHANGED_REASON =
  'Project source changed after approval; re-run checks and complete human review again.';

/**
 * Stable fingerprint of the inputs that can change a published pattern's meaning.
 * Operational metadata such as tags, archive state, and timestamps deliberately do
 * not participate, so housekeeping cannot invalidate a release unnecessarily.
 */
export function publicationSourceFingerprint(project: PatternProject): string {
  return JSON.stringify({
    name: project.name,
    author: project.author,
    description: project.description ?? '',
    baseSize: project.baseSize,
    gauge: project.gauge,
    yarnWeight: project.yarnWeight ?? null,
    sections: project.sections,
    sizingStandard: project.sizingStandard ?? 'CYC',
    customStandardSnapshot: project.customStandardSnapshot ?? null,
    easeProfile: project.easeProfile ?? null,
    standardMetadata: project.standardMetadata ?? null,
  });
}

function sourceChangedIssue(stage: string, now: string): ReadinessIssue {
  return {
    id: `${SOURCE_CHANGED_ISSUE_ID}-${stage}`,
    severity: 'major',
    description: SOURCE_CHANGED_REASON,
    correction: 'Re-run automated checks and obtain a fresh human sign-off.',
    status: 'open',
    createdAt: now,
    updatedAt: now,
  };
}

function invalidateContract(
  contract: PublicationContract,
  now: string,
): PublicationContract {
  return {
    ...contract,
    signOffs: contract.signOffs.map((signOff) => {
      const hadApproval =
        signOff.status === 'ready' ||
        signOff.approver !== undefined ||
        signOff.approvedAt !== undefined;
      if (!hadApproval) return signOff;

      const withoutPreviousSystemIssue = signOff.issues.filter(
        (issue) => !issue.id.startsWith(SOURCE_CHANGED_ISSUE_ID),
      );
      return {
        ...signOff,
        status: 'blocked',
        approver: undefined,
        approvedAt: undefined,
        issues: [
          ...withoutPreviousSystemIssue,
          sourceChangedIssue(signOff.stage, now),
        ],
      };
    }),
    isReady: false,
    updatedAt: now,
  };
}

function invalidatePackage(pkg: PublicationPackage, now: string): PublicationPackage {
  return {
    ...pkg,
    readinessVerdict: 'blocked',
    stale: true,
    staleAt: now,
    staleReason: SOURCE_CHANGED_REASON,
    updatedAt: now,
  };
}

/**
 * Downgrades dependent trust claims after a source mutation. It does not delete
 * review notes, packages, artifacts, or compiler output; those remain valuable
 * historical evidence but are explicitly marked as no longer current.
 */
export function invalidatePublicationState(
  project: PatternProject,
  now = new Date().toISOString(),
): PatternProject {
  const nextHumanReview = project.humanReview?.status === 'approved'
    ? {
        ...project.humanReview,
        status: 'changes-requested' as const,
        invalidatedAt: now,
        invalidationReason: SOURCE_CHANGED_REASON,
      }
    : project.humanReview;

  return {
    ...project,
    humanReview: nextHumanReview,
    publicationContract: project.publicationContract
      ? invalidateContract(project.publicationContract, now)
      : project.publicationContract,
    publicationPackages: project.publicationPackages?.map((pkg) =>
      pkg.stale ? pkg : invalidatePackage(pkg, now),
    ),
  };
}

/** True when the source fields that affect publication output changed. */
export function hasPublicationSourceChanged(
  previous: PatternProject,
  next: PatternProject,
): boolean {
  return publicationSourceFingerprint(previous) !== publicationSourceFingerprint(next);
}

/**
 * A package may claim ready only when every formal stage and the human review
 * record are current. This stays fail-closed for legacy or partially migrated
 * records whose top-level `isReady` flag is inconsistent with their sign-offs.
 */
export function canClaimPublicationReady(project: PatternProject): boolean {
  const contract = project.publicationContract;
  const signOffsAreReady = Boolean(
    contract &&
      contract.signOffs.length > 0 &&
      contract.signOffs.every((signOff) => signOff.status === 'ready'),
  );

  return (
    contract?.isReady === true &&
    signOffsAreReady &&
    project.humanReview?.status === 'approved' &&
    project.humanReview.invalidatedAt === undefined
  );
}

/**
 * Prevent package mutations from silently restoring a ready claim. Existing
 * stale metadata wins over an incoming compiler/package payload; a fresh but
 * not-yet-reviewed package is downgraded to pending instead.
 */
export function normalizePublicationPackage(
  project: PatternProject,
  pkg: PublicationPackage,
  existing?: PublicationPackage,
  now = new Date().toISOString(),
): PublicationPackage {
  const wasStale = existing?.stale === true || pkg.stale === true;
  if (wasStale) {
    return {
      ...pkg,
      readinessVerdict: 'blocked',
      stale: true,
      staleAt: existing?.staleAt ?? pkg.staleAt ?? now,
      staleReason: existing?.staleReason ?? pkg.staleReason ?? SOURCE_CHANGED_REASON,
    };
  }

  if (pkg.readinessVerdict === 'ready' && !canClaimPublicationReady(project)) {
    return { ...pkg, readinessVerdict: 'pending' };
  }

  return pkg;
}
