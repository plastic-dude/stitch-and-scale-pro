import React, { createContext, useContext, useEffect, useReducer, useRef, useState } from 'react';
import { get, set } from 'idb-keyval';
import { type PatternProject, generateId, type PublicationPackage, type PublicationArtifact, type ArtifactInspectionReport, type EaseProfileReference, type SizingStandardMetadata, type CollaborationMember, type ReadinessStage, type ReadinessIssue, type ReadinessComment, type PatternDocumentContent, type TestKnitRound, type ProjectSample, type ProjectSubmission, type WholesaleOrder } from '@/lib/grading-engine';
export type { PatternProject };
import { getSampleCrewNeckSweater } from '@/lib/sample-projects';
import { LanguageCode } from '@/lib/i18n';
// CHK-119: landing CTAs link to /project/{DEMO_PROJECT_ID} promising a no-signup
// live demo — but nothing ever created that project, so a clean profile saw
// "Project Not Found" (QA #61). The demo now seeds lazily on first request for
// the demo id: a landing CTA click counts as the explicit request (nothing is
// seeded on launch). The sample crew neck is re-id'd to the canonical demo id
// so every demo entry point (workspace, grading table, PDF) resolves.
// S001 fix (fix applied by review agent, verified Aug 14 2026): the reducer used
// to write localStorage directly ('stitch-and-scale-v1'), making the seam's
// writeProjects (IndexedDB + localStorage, audit-aware) a second, unsynchronized
// writer. A single writer now: both paths persist through the seam helper.
import { writeProjects } from '@/lib/storage-lib';
import { ORIGIN_MIGRATION_RESTORED_EVENT } from '@/lib/origin-migration';
import {
  hasPublicationSourceChanged,
  invalidatePublicationState,
  normalizePublicationPackage,
} from '@/lib/publication-integrity';
import { normalizeProjectRecord, normalizeProjectRecords } from '@/lib/project-normalization';
import { artifactQualitySnapshot, normalizeArtifactInspectionReport } from '@/lib/artifact-inspection';
import { useSettings } from './SettingsContext';

export type ProjectsAction =
  | { type: 'INIT'; payload: PatternProject[] }
  | { type: 'CREATE'; payload: PatternProject }
  | { type: 'UPDATE'; payload: PatternProject }
  | { type: 'DELETE'; payload: string }
  | { type: 'DUPLICATE'; payload: string }
  | { type: 'CREATE_SNAPSHOT'; payload: { projectId: string; name: string; note: string } }
  | { type: 'RESTORE_SNAPSHOT'; payload: { projectId: string; snapshotId: string } }
  | { type: 'DELETE_SNAPSHOT'; payload: { projectId: string; snapshotId: string } }
  | { type: 'UPDATE_CONTRACT'; payload: { projectId: string; contract: any } }
  | { type: 'CREATE_PUBLICATION_PACKAGE'; payload: { projectId: string; pkg: any } }
  | { type: 'UPDATE_PUBLICATION_PACKAGE'; payload: { projectId: string; pkg: any } }
  | { type: 'DELETE_PUBLICATION_PACKAGE'; payload: { projectId: string; packageId: string } }
  | { type: 'ADD_PUBLICATION_ARTIFACT'; payload: { projectId: string; packageId: string; artifact: PublicationArtifact } }
  | { type: 'INSPECT_ARTIFACT'; payload: { projectId: string; packageId: string; artifactId: string; report: ArtifactInspectionReport } }
  | { type: 'BATCH_DELETE'; payload: string[] }
  | { type: 'BATCH_ARCHIVE'; payload: { ids: string[]; archived: boolean } }
  | { type: 'BATCH_TAG'; payload: { ids: string[]; tags: string[] } }
  | { type: 'SET_FIT_GOVERNANCE'; payload: { projectId: string; easeProfile?: EaseProfileReference; standardMetadata?: SizingStandardMetadata } }
  | { type: 'ADD_COLLABORATOR'; payload: { projectId: string; member: CollaborationMember } }
  | { type: 'UPDATE_COLLABORATOR'; payload: { projectId: string; memberId: string; patch: Partial<CollaborationMember> } }
  | { type: 'DELETE_COLLABORATOR'; payload: { projectId: string; memberId: string } }
  | { type: 'ADD_READINESS_ISSUE'; payload: { projectId: string; stage: ReadinessStage; issue: ReadinessIssue } }
  | { type: 'UPDATE_READINESS_ISSUE'; payload: { projectId: string; stage: ReadinessStage; issueId: string; patch: Partial<ReadinessIssue> } }
  | { type: 'ADD_ISSUE_COMMENT'; payload: { projectId: string; stage: ReadinessStage; issueId: string; comment: ReadinessComment } }
  | { type: 'ADD_ASSET'; payload: { projectId: string; asset: any } }
  | { type: 'DELETE_ASSET'; payload: { projectId: string; assetId: string } }
  | { type: 'UPDATE_ASSET'; payload: { projectId: string; assetId: string; patch: any } }
  | { type: 'SET_DRAFT_CONTENT'; payload: { projectId: string; content: PatternDocumentContent } }
  | { type: 'COMPILE_PACKAGE'; payload: { projectId: string; packageId: string; content: PatternDocumentContent } }
  | { type: 'ADD_TEST_KNIT_ROUND'; payload: { projectId: string; round: TestKnitRound } }
  | { type: 'UPDATE_TEST_KNIT_ROUND'; payload: { projectId: string; roundId: string; patch: Partial<TestKnitRound> } }
  | { type: 'DELETE_TEST_KNIT_ROUND'; payload: { projectId: string; roundId: string } }
  | { type: 'ADD_SAMPLE'; payload: { projectId: string; sample: ProjectSample } }
  | { type: 'UPDATE_SAMPLE'; payload: { projectId: string; sampleId: string; patch: Partial<ProjectSample> } }
  | { type: 'DELETE_SAMPLE'; payload: { projectId: string; sampleId: string } }
  | { type: 'ADD_SUBMISSION'; payload: { projectId: string; submission: ProjectSubmission } }
  | { type: 'UPDATE_SUBMISSION'; payload: { projectId: string; submissionId: string; patch: Partial<ProjectSubmission> } }
  | { type: 'DELETE_SUBMISSION'; payload: { projectId: string; submissionId: string } }
  | { type: 'ADD_WHOLESALE_ORDER'; payload: { projectId: string; order: WholesaleOrder } }
  | { type: 'UPDATE_WHOLESALE_ORDER'; payload: { projectId: string; orderId: string; patch: Partial<WholesaleOrder> } }
  | { type: 'DELETE_WHOLESALE_ORDER'; payload: { projectId: string; orderId: string } };

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface ProjectsContextType {
  projects: PatternProject[];
  createProject: (project: PatternProject) => void;
  updateProject: (project: PatternProject) => void;
  deleteProject: (id: string) => void;
  duplicateProject: (id: string) => void;
  importProject: (project: PatternProject) => void;
  createSnapshot: (projectId: string, name: string, note: string) => void;
  restoreSnapshot: (projectId: string, snapshotId: string) => void;
  deleteSnapshot: (projectId: string, snapshotId: string) => void;
  updateContract: (projectId: string, contract: any) => void;
  createPublicationPackage: (projectId: string, pkg: any) => void;
  updatePublicationPackage: (projectId: string, pkg: any) => void;
  deletePublicationPackage: (projectId: string, packageId: string) => void;
  addPublicationArtifact: (projectId: string, packageId: string, artifact: PublicationArtifact) => void;
  inspectArtifact: (projectId: string, packageId: string, artifactId: string, report: ArtifactInspectionReport) => void;
  batchDelete: (ids: string[]) => void;
  batchArchive: (ids: string[], archived: boolean) => void;
  batchTag: (ids: string[], tags: string[]) => void;
  setFitGovernance: (projectId: string, easeProfile?: EaseProfileReference, standardMetadata?: SizingStandardMetadata) => void;
  addCollaborator: (projectId: string, member: CollaborationMember) => void;
  updateCollaborator: (projectId: string, memberId: string, patch: Partial<CollaborationMember>) => void;
  deleteCollaborator: (projectId: string, memberId: string) => void;
  addReadinessIssue: (projectId: string, stage: ReadinessStage, issue: ReadinessIssue) => void;
  updateReadinessIssue: (projectId: string, stage: ReadinessStage, issueId: string, patch: Partial<ReadinessIssue>) => void;
  addIssueComment: (projectId: string, stage: ReadinessStage, issueId: string, comment: ReadinessComment) => void;
  addAsset: (projectId: string, asset: any) => void;
  deleteAsset: (projectId: string, assetId: string) => void;
  updateAsset: (projectId: string, assetId: string, patch: any) => void;
  setDraftContent: (projectId: string, content: PatternDocumentContent) => void;
  compilePackage: (projectId: string, packageId: string, content: PatternDocumentContent) => void;
  addTestKnitRound: (projectId: string, round: TestKnitRound) => void;
  updateTestKnitRound: (projectId: string, roundId: string, patch: Partial<TestKnitRound>) => void;
  deleteTestKnitRound: (projectId: string, roundId: string) => void;
  addSample: (projectId: string, sample: ProjectSample) => void;
  updateSample: (projectId: string, sampleId: string, patch: Partial<ProjectSample>) => void;
  deleteSample: (projectId: string, sampleId: string) => void;
  addSubmission: (projectId: string, submission: ProjectSubmission) => void;
  updateSubmission: (projectId: string, submissionId: string, patch: Partial<ProjectSubmission>) => void;
  deleteSubmission: (projectId: string, submissionId: string) => void;
  addWholesaleOrder: (projectId: string, order: WholesaleOrder) => void;
  updateWholesaleOrder: (projectId: string, orderId: string, patch: Partial<WholesaleOrder>) => void;
  deleteWholesaleOrder: (projectId: string, orderId: string) => void;
  saveStatus: SaveStatus;
  recovered: boolean;
  dismissRecovery: () => void;
}

const SESSION_KEY = 'stitch-and-scale-session-flag';

const ProjectsContext = createContext<ProjectsContextType | undefined>(undefined);

export function projectsReducer(state: PatternProject[], action: ProjectsAction): PatternProject[] {
  let newState: PatternProject[];
  switch (action.type) {
    case 'INIT':
      return normalizeProjectRecords(action.payload);
    case 'CREATE': {
      const project = normalizeProjectRecord(action.payload);
      if (!project) return state;
      newState = [...state, project];
      break;
    }
    case 'UPDATE': {
      const project = normalizeProjectRecord(action.payload);
      if (!project) return state;
      newState = state.map(p => {
        if (p.id !== project.id) return p;
        const now = new Date().toISOString();
        const next = { ...project, updatedAt: now };
        return hasPublicationSourceChanged(p, next)
          ? invalidatePublicationState(next, now)
          : next;
      });
      break;
    }
    case 'DELETE':
      newState = state.filter(p => p.id !== action.payload);
      break;
    case 'DUPLICATE':
      const toDuplicate = state.find(p => p.id === action.payload);
      if (!toDuplicate) return state;
      const duplicated = {
        ...toDuplicate,
        id: generateId(),
        name: `${toDuplicate.name} (Copy)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sections: toDuplicate.sections.map(s => ({
          ...s,
          id: generateId(),
          measurements: s.measurements.map(m => ({ ...m, id: generateId() }))
        })),
        // The outer spread above is shallow - without this, the duplicate's
        // customStandardSnapshot would be the exact same object reference as
        // the original's, not an independent copy. Nothing currently mutates
        // it in place, so this isn't an active bug, but it's exactly the kind
        // of shared-reference footgun that becomes one the moment a future
        // feature edits a project's snapshot directly.
        customStandardSnapshot: toDuplicate.customStandardSnapshot
          ? JSON.parse(JSON.stringify(toDuplicate.customStandardSnapshot))
          : undefined,
      };
      newState = [...state, invalidatePublicationState(duplicated)];
      break;
    case 'CREATE_SNAPSHOT':
      newState = state.map(p => {
        if (p.id !== action.payload.projectId) return p;
        const { snapshots, ...data } = p;
        const newSnapshot = {
          id: generateId(),
          name: action.payload.name,
          note: action.payload.note,
          createdAt: new Date().toISOString(),
          data: JSON.parse(JSON.stringify(data)),
        };
        return {
          ...p,
          snapshots: [newSnapshot, ...(p.snapshots || [])],
          updatedAt: new Date().toISOString(),
        };
      });
      break;
    case 'RESTORE_SNAPSHOT':
      newState = state.map(p => {
        if (p.id !== action.payload.projectId) return p;
        const snapshot = p.snapshots?.find(s => s.id === action.payload.snapshotId);
        if (!snapshot) return p;
        // Restore project data but preserve the snapshots history itself.
        const now = new Date().toISOString();
        return invalidatePublicationState({
          ...snapshot.data,
          id: p.id, // Ensure id stays consistent
          snapshots: p.snapshots,
          updatedAt: now,
        }, now);
      });
      break;
    case 'DELETE_SNAPSHOT':
      newState = state.map(p => {
        if (p.id !== action.payload.projectId) return p;
        return {
          ...p,
          snapshots: (p.snapshots || []).filter(s => s.id !== action.payload.snapshotId),
          updatedAt: new Date().toISOString(),
        };
      });
      break;
    case 'UPDATE_CONTRACT':
      newState = state.map(p => {
        if (p.id !== action.payload.projectId) return p;
        return {
          ...p,
          publicationContract: action.payload.contract,
          updatedAt: new Date().toISOString(),
        };
      });
      break;
    case 'CREATE_PUBLICATION_PACKAGE':
      newState = state.map(p => {
        if (p.id !== action.payload.projectId) return p;
        return {
          ...p,
          publicationPackages: [
            normalizePublicationPackage(p, action.payload.pkg),
            ...(p.publicationPackages || []),
          ],
          updatedAt: new Date().toISOString(),
        };
      });
      break;
    case 'UPDATE_PUBLICATION_PACKAGE':
      newState = state.map(p => {
        if (p.id !== action.payload.projectId) return p;
        return {
          ...p,
          publicationPackages: (p.publicationPackages || []).map(pkg =>
            pkg.id === action.payload.pkg.id
              ? normalizePublicationPackage(p, action.payload.pkg, pkg)
              : pkg,
          ),
          updatedAt: new Date().toISOString(),
        };
      });
      break;
    case 'DELETE_PUBLICATION_PACKAGE':
      newState = state.map(p => {
        if (p.id !== action.payload.projectId) return p;
        return {
          ...p,
          publicationPackages: (p.publicationPackages || []).filter(pkg => 
            pkg.id !== action.payload.packageId
          ),
          updatedAt: new Date().toISOString(),
        };
      });
      break;
    case 'ADD_PUBLICATION_ARTIFACT':
      newState = state.map(p => {
        if (p.id !== action.payload.projectId) return p;
        return {
          ...p,
          publicationPackages: (p.publicationPackages || []).map(pkg => 
            pkg.id === action.payload.packageId 
              ? { ...pkg, artifacts: [action.payload.artifact, ...(pkg.artifacts || [])], updatedAt: new Date().toISOString() }
              : pkg
          ),
          updatedAt: new Date().toISOString(),
        };
      });
      break;
    case 'INSPECT_ARTIFACT':
      newState = state.map(p => {
        if (p.id !== action.payload.projectId) return p;
        return {
          ...p,
          publicationPackages: (p.publicationPackages || []).map(pkg => 
            pkg.id === action.payload.packageId 
              ? { 
                  ...pkg, 
                  artifacts: (pkg.artifacts || []).map(a => 
                    a.id === action.payload.artifactId 
                      ? (() => {
                          const report = normalizeArtifactInspectionReport(action.payload.report);
                          return { ...a, inspectionReport: report, qualitySnapshot: artifactQualitySnapshot(report) };
                        })()
                      : a
                  ),
                  updatedAt: new Date().toISOString() 
                }
              : pkg
          ),
          updatedAt: new Date().toISOString(),
        };
      });
      break;
    case 'BATCH_DELETE':
      newState = state.filter(p => !action.payload.includes(p.id));
      break;
    case 'BATCH_ARCHIVE':
      newState = state.map(p => 
        action.payload.ids.includes(p.id) 
          ? { ...p, isArchived: action.payload.archived, updatedAt: new Date().toISOString() } 
          : p
      );
      break;
    case 'BATCH_TAG':
      newState = state.map(p => 
        action.payload.ids.includes(p.id) 
          ? { ...p, tags: action.payload.tags, updatedAt: new Date().toISOString() } 
          : p
      );
      break;
    case 'SET_FIT_GOVERNANCE':
      newState = state.map(p => {
        if (p.id !== action.payload.projectId) return p;
        const now = new Date().toISOString();
        const next = {
          ...p,
          easeProfile: action.payload.easeProfile,
          standardMetadata: action.payload.standardMetadata,
          updatedAt: now,
        };
        return hasPublicationSourceChanged(p, next)
          ? invalidatePublicationState(next, now)
          : next;
      });
      break;
    case 'ADD_COLLABORATOR':
      newState = state.map(p => p.id === action.payload.projectId ? { ...p, collaborationRoster: [...(p.collaborationRoster || []), action.payload.member], updatedAt: new Date().toISOString() } : p);
      break;
    case 'UPDATE_COLLABORATOR':
      newState = state.map(p => p.id === action.payload.projectId ? { ...p, collaborationRoster: (p.collaborationRoster || []).map(m => m.id === action.payload.memberId ? { ...m, ...action.payload.patch } : m), updatedAt: new Date().toISOString() } : p);
      break;
    case 'DELETE_COLLABORATOR':
      newState = state.map(p => p.id === action.payload.projectId ? { ...p, collaborationRoster: (p.collaborationRoster || []).filter(m => m.id !== action.payload.memberId), updatedAt: new Date().toISOString() } : p);
      break;
    case 'ADD_READINESS_ISSUE':
      newState = state.map(p => p.id === action.payload.projectId ? {
        ...p,
        publicationContract: p.publicationContract ? {
          ...p.publicationContract,
          signOffs: p.publicationContract.signOffs.map(s => s.stage === action.payload.stage ? { ...s, issues: [...s.issues, action.payload.issue] } : s),
          updatedAt: new Date().toISOString()
        } : p.publicationContract,
        updatedAt: new Date().toISOString()
      } : p);
      break;
    case 'UPDATE_READINESS_ISSUE':
      newState = state.map(p => p.id === action.payload.projectId ? {
        ...p,
        publicationContract: p.publicationContract ? {
          ...p.publicationContract,
          signOffs: p.publicationContract.signOffs.map(s => s.stage === action.payload.stage ? {
            ...s,
            issues: s.issues.map(i => i.id === action.payload.issueId ? { ...i, ...action.payload.patch, updatedAt: new Date().toISOString() } : i)
          } : s),
          updatedAt: new Date().toISOString()
        } : p.publicationContract,
        updatedAt: new Date().toISOString()
      } : p);
      break;
    case 'ADD_ISSUE_COMMENT':
      newState = state.map(p => p.id === action.payload.projectId ? {
        ...p,
        publicationContract: p.publicationContract ? {
          ...p.publicationContract,
          signOffs: p.publicationContract.signOffs.map(s => s.stage === action.payload.stage ? {
            ...s,
            issues: s.issues.map(i => i.id === action.payload.issueId ? {
              ...i,
              comments: [...(i.comments || []), action.payload.comment],
              updatedAt: new Date().toISOString()
            } : i)
          } : s),
          updatedAt: new Date().toISOString()
        } : p.publicationContract,
        updatedAt: new Date().toISOString()
      } : p);
      break;
    case 'ADD_ASSET':
      newState = state.map(p => p.id === action.payload.projectId ? {
        ...p,
        assets: [action.payload.asset, ...(p.assets || [])],
        updatedAt: new Date().toISOString()
      } : p);
      break;
    case 'DELETE_ASSET':
      newState = state.map(p => p.id === action.payload.projectId ? {
        ...p,
        assets: (p.assets || []).filter(a => a.id !== action.payload.assetId),
        updatedAt: new Date().toISOString()
      } : p);
      break;
    case 'UPDATE_ASSET':
      newState = state.map(p => p.id === action.payload.projectId ? {
        ...p,
        assets: (p.assets || []).map(a => a.id === action.payload.assetId ? { ...a, ...action.payload.patch } : a),
        updatedAt: new Date().toISOString()
      } : p);
      break;
    case 'SET_DRAFT_CONTENT':
      newState = state.map(p => p.id === action.payload.projectId ? {
        ...p,
        draftContent: action.payload.content,
        updatedAt: new Date().toISOString()
      } : p);
      break;
    case 'COMPILE_PACKAGE':
      newState = state.map(p => p.id === action.payload.projectId ? {
        ...p,
        publicationPackages: (p.publicationPackages || []).map(pkg => 
          pkg.id === action.payload.packageId ? { ...pkg, compiledContent: action.payload.content, status: 'review', updatedAt: new Date().toISOString() } : pkg
        ),
        updatedAt: new Date().toISOString()
      } : p);
      break;
    case 'ADD_TEST_KNIT_ROUND':
      newState = state.map(p => p.id === action.payload.projectId ? {
        ...p,
        testKnitRounds: [action.payload.round, ...(p.testKnitRounds || [])],
        updatedAt: new Date().toISOString()
      } : p);
      break;
    case 'UPDATE_TEST_KNIT_ROUND':
      newState = state.map(p => p.id === action.payload.projectId ? {
        ...p,
        testKnitRounds: (p.testKnitRounds || []).map(r => r.id === action.payload.roundId ? { ...r, ...action.payload.patch, updatedAt: new Date().toISOString() } : r),
        updatedAt: new Date().toISOString()
      } : p);
      break;
    case 'DELETE_TEST_KNIT_ROUND':
      newState = state.map(p => p.id === action.payload.projectId ? {
        ...p,
        testKnitRounds: (p.testKnitRounds || []).filter(r => r.id !== action.payload.roundId),
        updatedAt: new Date().toISOString()
      } : p);
      break;
    case 'ADD_SAMPLE':
      newState = state.map(p => p.id === action.payload.projectId ? {
        ...p,
        samples: [action.payload.sample, ...(p.samples || [])],
        updatedAt: new Date().toISOString()
      } : p);
      break;
    case 'UPDATE_SAMPLE':
      newState = state.map(p => p.id === action.payload.projectId ? {
        ...p,
        samples: (p.samples || []).map(s => 
          s.id === action.payload.sampleId ? { ...s, ...action.payload.patch, updatedAt: new Date().toISOString() } : s
        ),
        updatedAt: new Date().toISOString()
      } : p);
      break;
    case 'DELETE_SAMPLE':
      newState = state.map(p => p.id === action.payload.projectId ? {
        ...p,
        samples: (p.samples || []).filter(s => s.id !== action.payload.sampleId),
        updatedAt: new Date().toISOString()
      } : p);
      break;
    case 'ADD_SUBMISSION':
      newState = state.map(p => p.id === action.payload.projectId ? {
        ...p,
        submissions: [action.payload.submission, ...(p.submissions || [])],
        updatedAt: new Date().toISOString()
      } : p);
      break;
    case 'UPDATE_SUBMISSION':
      newState = state.map(p => p.id === action.payload.projectId ? {
        ...p,
        submissions: (p.submissions || []).map(s => 
          s.id === action.payload.submissionId ? { ...s, ...action.payload.patch, updatedAt: new Date().toISOString() } : s
        ),
        updatedAt: new Date().toISOString()
      } : p);
      break;
    case 'DELETE_SUBMISSION':
      newState = state.map(p => p.id === action.payload.projectId ? {
        ...p,
        submissions: (p.submissions || []).filter(s => s.id !== action.payload.submissionId),
        updatedAt: new Date().toISOString()
      } : p);
      break;
    case 'ADD_WHOLESALE_ORDER':
      newState = state.map(p => p.id === action.payload.projectId ? {
        ...p,
        wholesaleOrders: [action.payload.order, ...(p.wholesaleOrders || [])],
        updatedAt: new Date().toISOString()
      } : p);
      break;
    case 'UPDATE_WHOLESALE_ORDER':
      newState = state.map(p => p.id === action.payload.projectId ? {
        ...p,
        wholesaleOrders: (p.wholesaleOrders || []).map(o => 
          o.id === action.payload.orderId ? { ...o, ...action.payload.patch, updatedAt: new Date().toISOString() } : o
        ),
        updatedAt: new Date().toISOString()
      } : p);
      break;
    case 'DELETE_WHOLESALE_ORDER':
      newState = state.map(p => p.id === action.payload.projectId ? {
        ...p,
        wholesaleOrders: (p.wholesaleOrders || []).filter(o => o.id !== action.payload.orderId),
        updatedAt: new Date().toISOString()
      } : p);
      break;
    default:
      return state;
  }

  writeProjects(newState).catch(err => console.error('[ProjectsContext] persistence failed', err));
  return newState;
}

export function ProjectsProvider({ children }: { children: React.ReactNode }) {
  const [projects, dispatch] = useReducer(projectsReducer, []);
  const [isLoaded, setIsLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [recovered, setRecovered] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const clearTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Session-dirty flag: if this flag is still set on next load, the previous
  // session didn't close cleanly (crash, force-quit, killed tab). Saves are
  // already synchronous-on-change (see the reducer above), so this is a
  // confidence signal for the user, not a data-recovery mechanism — the data
  // itself is already safe by the time this flag would ever matter.
  useEffect(() => {
    const wasDirty = localStorage.getItem(SESSION_KEY) === '1';
    if (wasDirty) setRecovered(true);
    localStorage.setItem(SESSION_KEY, '1');

    const clearFlag = () => localStorage.removeItem(SESSION_KEY);
    window.addEventListener('beforeunload', clearFlag);
    return () => window.removeEventListener('beforeunload', clearFlag);
  }, []);

  const dismissRecovery = () => setRecovered(false);

  useEffect(() => {
    async function load() {
      try {
        let parsed = null;
        const stored = await get('stitch-and-scale-v1');
        
        if (stored) {
          parsed = typeof stored === 'string' ? JSON.parse(stored) : stored;
        } else {
          // Fallback to migrate from localStorage
          const localStored = localStorage.getItem('stitch-and-scale-v1');
          if (localStored) {
            parsed = JSON.parse(localStored);
          }
        }

        if (parsed) {
          dispatch({ type: 'INIT', payload: normalizeProjectRecords(parsed) });
        }
      } catch (e) {
        console.error('Failed to load projects', e);
      } finally {
        setIsLoaded(true);
      }
    }

    const handleMigrationRestore = () => {
      void load();
    };
    window.addEventListener(ORIGIN_MIGRATION_RESTORED_EVENT, handleMigrationRestore);
    void load();
    return () => window.removeEventListener(ORIGIN_MIGRATION_RESTORED_EVENT, handleMigrationRestore);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    setSaveStatus('saving');
    clearTimeout(clearTimer.current);
    clearTimeout(saveTimer.current);

    // Debounce so rapid successive edits (typing) don't flicker the indicator
    saveTimer.current = setTimeout(() => {
      set('stitch-and-scale-v1', projects)
        .then(() => {
          setSaveStatus('saved');
          clearTimer.current = setTimeout(() => setSaveStatus('idle'), 2000);
        })
        .catch((e: unknown) => {
          console.error('Failed to save projects', e);
          setSaveStatus('error');
        });
    }, 400);

    return () => clearTimeout(saveTimer.current);
  }, [projects, isLoaded]);

  const createProject = (project: PatternProject) => dispatch({ type: 'CREATE', payload: project });
  const updateProject = (project: PatternProject) => dispatch({ type: 'UPDATE', payload: project });
  const deleteProject = (id: string) => dispatch({ type: 'DELETE', payload: id });
  const duplicateProject = (id: string) => dispatch({ type: 'DUPLICATE', payload: id });
  const createSnapshot = (projectId: string, name: string, note: string) => dispatch({ type: 'CREATE_SNAPSHOT', payload: { projectId, name, note } });
  const restoreSnapshot = (projectId: string, snapshotId: string) => dispatch({ type: 'RESTORE_SNAPSHOT', payload: { projectId, snapshotId } });
  const deleteSnapshot = (projectId: string, snapshotId: string) => dispatch({ type: 'DELETE_SNAPSHOT', payload: { projectId, snapshotId } });
  const updateContract = (projectId: string, contract: any) => dispatch({ type: 'UPDATE_CONTRACT', payload: { projectId, contract } });
  const createPublicationPackage = (projectId: string, pkg: any) => dispatch({ type: 'CREATE_PUBLICATION_PACKAGE', payload: { projectId, pkg } });
  const updatePublicationPackage = (projectId: string, pkg: any) => dispatch({ type: 'UPDATE_PUBLICATION_PACKAGE', payload: { projectId, pkg } });
  const deletePublicationPackage = (projectId: string, packageId: string) => dispatch({ type: 'DELETE_PUBLICATION_PACKAGE', payload: { projectId, packageId } });
  const addPublicationArtifact = (projectId: string, packageId: string, artifact: PublicationArtifact) => dispatch({ type: 'ADD_PUBLICATION_ARTIFACT', payload: { projectId, packageId, artifact } });
  const batchDelete = (ids: string[]) => dispatch({ type: 'BATCH_DELETE', payload: ids });
  const batchArchive = (ids: string[], archived: boolean) => dispatch({ type: 'BATCH_ARCHIVE', payload: { ids, archived } });
  const batchTag = (ids: string[], tags: string[]) => dispatch({ type: 'BATCH_TAG', payload: { ids, tags } });
  const setFitGovernance = (projectId: string, easeProfile?: EaseProfileReference, standardMetadata?: SizingStandardMetadata) => 
    dispatch({ type: 'SET_FIT_GOVERNANCE', payload: { projectId, easeProfile, standardMetadata } });
  const addCollaborator = (projectId: string, member: CollaborationMember) => dispatch({ type: 'ADD_COLLABORATOR', payload: { projectId, member } });
  const updateCollaborator = (projectId: string, memberId: string, patch: Partial<CollaborationMember>) => dispatch({ type: 'UPDATE_COLLABORATOR', payload: { projectId, memberId, patch } });
  const deleteCollaborator = (projectId: string, memberId: string) => dispatch({ type: 'DELETE_COLLABORATOR', payload: { projectId, memberId } });
  const addReadinessIssue = (projectId: string, stage: ReadinessStage, issue: ReadinessIssue) => dispatch({ type: 'ADD_READINESS_ISSUE', payload: { projectId, stage, issue } });
  const updateReadinessIssue = (projectId: string, stage: ReadinessStage, issueId: string, patch: Partial<ReadinessIssue>) => dispatch({ type: 'UPDATE_READINESS_ISSUE', payload: { projectId, stage, issueId, patch } });
  const addIssueComment = (projectId: string, stage: ReadinessStage, issueId: string, comment: ReadinessComment) => dispatch({ type: 'ADD_ISSUE_COMMENT', payload: { projectId, stage, issueId, comment } });
    const addAsset = (projectId: string, asset: any) => dispatch({ type: 'ADD_ASSET', payload: { projectId, asset } });
    const deleteAsset = (projectId: string, assetId: string) => dispatch({ type: 'DELETE_ASSET', payload: { projectId, assetId } });
    const updateAsset = (projectId: string, assetId: string, patch: any) => dispatch({ type: 'UPDATE_ASSET', payload: { projectId, assetId, patch } });
    const addTestKnitRound = (projectId: string, round: TestKnitRound) => dispatch({ type: 'ADD_TEST_KNIT_ROUND', payload: { projectId, round } });
    const updateTestKnitRound = (projectId: string, roundId: string, patch: Partial<TestKnitRound>) => dispatch({ type: 'UPDATE_TEST_KNIT_ROUND', payload: { projectId, roundId, patch } });
    const deleteTestKnitRound = (projectId: string, roundId: string) => dispatch({ type: 'DELETE_TEST_KNIT_ROUND', payload: { projectId, roundId } });
    const addSample = (projectId: string, sample: ProjectSample) => dispatch({ type: 'ADD_SAMPLE', payload: { projectId, sample } });
    const updateSample = (projectId: string, sampleId: string, patch: Partial<ProjectSample>) => dispatch({ type: 'UPDATE_SAMPLE', payload: { projectId, sampleId, patch } });
    const deleteSample = (projectId: string, sampleId: string) => dispatch({ type: 'DELETE_SAMPLE', payload: { projectId, sampleId } });
    const addSubmission = (projectId: string, submission: ProjectSubmission) => dispatch({ type: 'ADD_SUBMISSION', payload: { projectId, submission } });
    const updateSubmission = (projectId: string, submissionId: string, patch: Partial<ProjectSubmission>) => dispatch({ type: 'UPDATE_SUBMISSION', payload: { projectId, submissionId, patch } });
    const deleteSubmission = (projectId: string, submissionId: string) => dispatch({ type: 'DELETE_SUBMISSION', payload: { projectId, submissionId } });
    const addWholesaleOrder = (projectId: string, order: WholesaleOrder) => dispatch({ type: 'ADD_WHOLESALE_ORDER', payload: { projectId, order } });
    const updateWholesaleOrder = (projectId: string, orderId: string, patch: Partial<WholesaleOrder>) => dispatch({ type: 'UPDATE_WHOLESALE_ORDER', payload: { projectId, orderId, patch } });
    const deleteWholesaleOrder = (projectId: string, orderId: string) => dispatch({ type: 'DELETE_WHOLESALE_ORDER', payload: { projectId, orderId } });

  // Import a single project from an exported JSON file — always assigns a
  // fresh id so it can never silently collide with or overwrite an existing
  // project, even if the file was exported from this same workspace.
  const importProject = (project: PatternProject) => {
    const now = new Date().toISOString();
    const imported = normalizeProjectRecord({
      ...project,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    }, now);
    if (imported) dispatch({ type: 'CREATE', payload: imported });
  };

  if (!isLoaded) return null; // Prevent rendering before state loads

  return (
    <ProjectsContext.Provider value={{ 
      projects, createProject, updateProject, deleteProject, duplicateProject, importProject, 
      createSnapshot, restoreSnapshot, deleteSnapshot, updateContract,
      createPublicationPackage, updatePublicationPackage, deletePublicationPackage,       addPublicationArtifact,
      inspectArtifact: (projectId: string, packageId: string, artifactId: string, report: ArtifactInspectionReport) => dispatch({ type: 'INSPECT_ARTIFACT', payload: { projectId, packageId, artifactId, report } }),
      batchDelete, batchArchive,       batchTag,
      setFitGovernance,
      addCollaborator, updateCollaborator, deleteCollaborator,
      addReadinessIssue, updateReadinessIssue, addIssueComment,
      addAsset, deleteAsset, updateAsset,
      addTestKnitRound, updateTestKnitRound, deleteTestKnitRound,
      addSample, updateSample, deleteSample,
      addSubmission, updateSubmission, deleteSubmission,
      addWholesaleOrder, updateWholesaleOrder, deleteWholesaleOrder,
      setDraftContent: (projectId: string, content: PatternDocumentContent) => dispatch({ type: 'SET_DRAFT_CONTENT', payload: { projectId, content } }),
      compilePackage: (projectId: string, packageId: string, content: PatternDocumentContent) => dispatch({ type: 'COMPILE_PACKAGE', payload: { projectId, packageId, content } }),
      saveStatus, recovered, dismissRecovery 
    }}>
      {children}
    </ProjectsContext.Provider>
  );
}

export function useProjects() {
  const context = useContext(ProjectsContext);
  if (context === undefined) {
    throw new Error('useProjects must be used within a ProjectsProvider');
  }
  return context;
}

// Canonical demo project id shared with the landing page CTAs.
export const DEMO_PROJECT_ID = 'mss5osqd88j6fdyvtdu';

// Build the populated demo project (sample crew neck re-id'd) — exported so the
// seed logic and its regression tests share one definition. Timestamps are
// injected at seed time, not baked into the module, so tests can freeze time.
export function makeDemoProject(langOrTimestamp: any = 'en', nowOverride?: string): PatternProject {
  // Handle backward compatibility: if the first argument looks like a timestamp, treat it as such
  const isTimestamp = typeof langOrTimestamp === 'string' && langOrTimestamp.includes('T');
  const lang = isTimestamp ? 'en' : (langOrTimestamp as LanguageCode);
  const now = nowOverride || (isTimestamp ? langOrTimestamp : new Date().toISOString());

  return { ...getSampleCrewNeckSweater(lang), id: DEMO_PROJECT_ID, createdAt: now, updatedAt: now };
}

export function useProject(id?: string) {
  const { 
    projects, createProject, updateProject, deleteProject, 
    createSnapshot, restoreSnapshot, deleteSnapshot, updateContract,
    createPublicationPackage, updatePublicationPackage, deletePublicationPackage, addPublicationArtifact, 
    inspectArtifact: inspectArtifactFn,
    setFitGovernance,
    addCollaborator, updateCollaborator, deleteCollaborator,
    addReadinessIssue, updateReadinessIssue, addIssueComment,
    addAsset, deleteAsset, updateAsset,
    addTestKnitRound, updateTestKnitRound, deleteTestKnitRound,
    addSample, updateSample, deleteSample,
    addSubmission, updateSubmission, deleteSubmission,
    addWholesaleOrder, updateWholesaleOrder, deleteWholesaleOrder,
    setDraftContent, compilePackage
  } = useProjects();
  if (!id) return null;
  const existing = projects.find(p => p.id === id);

  const { language } = useSettings();
  
  // CHK-119: first visit to the demo id with no stored project seeds the demo.
  if (!existing && id === DEMO_PROJECT_ID) {
    const demo = makeDemoProject(language);
    createProject(demo);
    return {
      project: demo,
      updateProject: (p: PatternProject) => updateProject(p),
      deleteProject: () => deleteProject(DEMO_PROJECT_ID),
      createSnapshot: (name: string, note: string) => createSnapshot(DEMO_PROJECT_ID, name, note),
      restoreSnapshot: (snapshotId: string) => restoreSnapshot(DEMO_PROJECT_ID, snapshotId),
      deleteSnapshot: (snapshotId: string) => deleteSnapshot(DEMO_PROJECT_ID, snapshotId),
      updateContract: (contract: any) => updateContract(DEMO_PROJECT_ID, contract),
      createPublicationPackage: (pkg: any) => createPublicationPackage(DEMO_PROJECT_ID, pkg),
      updatePublicationPackage: (pkg: any) => updatePublicationPackage(DEMO_PROJECT_ID, pkg),
      deletePublicationPackage: (packageId: string) => deletePublicationPackage(DEMO_PROJECT_ID, packageId),
      addPublicationArtifact: (packageId: string, artifact: PublicationArtifact) => addPublicationArtifact(DEMO_PROJECT_ID, packageId, artifact),
      inspectArtifact: (packageId: string, artifactId: string, report: ArtifactInspectionReport) => inspectArtifactFn(DEMO_PROJECT_ID, packageId, artifactId, report),
      setFitGovernance: (ease?: EaseProfileReference, meta?: SizingStandardMetadata) => setFitGovernance(DEMO_PROJECT_ID, ease, meta),
      addCollaborator: (member: CollaborationMember) => addCollaborator(DEMO_PROJECT_ID, member),
      updateCollaborator: (memberId: string, patch: Partial<CollaborationMember>) => updateCollaborator(DEMO_PROJECT_ID, memberId, patch),
      deleteCollaborator: (memberId: string) => deleteCollaborator(DEMO_PROJECT_ID, memberId),
      addReadinessIssue: (stage: ReadinessStage, issue: ReadinessIssue) => addReadinessIssue(DEMO_PROJECT_ID, stage, issue),
      updateReadinessIssue: (stage: ReadinessStage, issueId: string, patch: Partial<ReadinessIssue>) => updateReadinessIssue(DEMO_PROJECT_ID, stage, issueId, patch),
      addIssueComment: (stage: ReadinessStage, issueId: string, comment: ReadinessComment) => addIssueComment(DEMO_PROJECT_ID, stage, issueId, comment),
    addAsset: (asset: any) => addAsset(DEMO_PROJECT_ID, asset),
      deleteAsset: (assetId: string) => deleteAsset(DEMO_PROJECT_ID, assetId),
      updateAsset: (assetId: string, patch: any) => updateAsset(DEMO_PROJECT_ID, assetId, patch),
      addTestKnitRound: (round: TestKnitRound) => addTestKnitRound(DEMO_PROJECT_ID, round),
      updateTestKnitRound: (roundId: string, patch: Partial<TestKnitRound>) => updateTestKnitRound(DEMO_PROJECT_ID, roundId, patch),
      deleteTestKnitRound: (roundId: string) => deleteTestKnitRound(DEMO_PROJECT_ID, roundId),
      addSample: (sample: ProjectSample) => addSample(DEMO_PROJECT_ID, sample),
      updateSample: (sampleId: string, patch: Partial<ProjectSample>) => updateSample(DEMO_PROJECT_ID, sampleId, patch),
      deleteSample: (sampleId: string) => deleteSample(DEMO_PROJECT_ID, sampleId),
      addSubmission: (submission: ProjectSubmission) => addSubmission(DEMO_PROJECT_ID, submission),
      updateSubmission: (submissionId: string, patch: Partial<ProjectSubmission>) => updateSubmission(DEMO_PROJECT_ID, submissionId, patch),
      deleteSubmission: (submissionId: string) => deleteSubmission(DEMO_PROJECT_ID, submissionId),
      addWholesaleOrder: (order: WholesaleOrder) => addWholesaleOrder(DEMO_PROJECT_ID, order),
      updateWholesaleOrder: (orderId: string, patch: Partial<WholesaleOrder>) => updateWholesaleOrder(DEMO_PROJECT_ID, orderId, patch),
      deleteWholesaleOrder: (orderId: string) => deleteWholesaleOrder(DEMO_PROJECT_ID, orderId),
      setDraftContent: (content: PatternDocumentContent) => setDraftContent(DEMO_PROJECT_ID, content),
      compilePackage: (packageId: string, content: PatternDocumentContent) => compilePackage(DEMO_PROJECT_ID, packageId, content),
    };
  }

  if (!existing) return null;

  return {
    project: existing,
    updateProject: (p: PatternProject) => updateProject(p),
    deleteProject: () => deleteProject(id),
    createSnapshot: (name: string, note: string) => createSnapshot(id, name, note),
    restoreSnapshot: (snapshotId: string) => restoreSnapshot(id, snapshotId),
    deleteSnapshot: (snapshotId: string) => deleteSnapshot(id, snapshotId),
    updateContract: (contract: any) => updateContract(id, contract),
    createPublicationPackage: (pkg: any) => createPublicationPackage(id, pkg),
    updatePublicationPackage: (pkg: any) => updatePublicationPackage(id, pkg),
    deletePublicationPackage: (packageId: string) => deletePublicationPackage(id, packageId),
    addPublicationArtifact: (packageId: string, artifact: PublicationArtifact) => addPublicationArtifact(id, packageId, artifact),
    inspectArtifact: (packageId: string, artifactId: string, report: ArtifactInspectionReport) => inspectArtifactFn(id, packageId, artifactId, report),
    setFitGovernance: (ease?: EaseProfileReference, meta?: SizingStandardMetadata) => setFitGovernance(id, ease, meta),
    addCollaborator: (member: CollaborationMember) => addCollaborator(id, member),
    updateCollaborator: (memberId: string, patch: Partial<CollaborationMember>) => updateCollaborator(id, memberId, patch),
    deleteCollaborator: (memberId: string) => deleteCollaborator(id, memberId),
    addReadinessIssue: (stage: ReadinessStage, issue: ReadinessIssue) => addReadinessIssue(id, stage, issue),
    updateReadinessIssue: (stage: ReadinessStage, issueId: string, patch: Partial<ReadinessIssue>) => updateReadinessIssue(id, stage, issueId, patch),
    addIssueComment: (stage: ReadinessStage, issueId: string, comment: ReadinessComment) => addIssueComment(id, stage, issueId, comment),
    addAsset: (asset: any) => addAsset(id, asset),
    deleteAsset: (assetId: string) => deleteAsset(id, assetId),
    updateAsset: (assetId: string, patch: any) => updateAsset(id, assetId, patch),
    addTestKnitRound: (round: TestKnitRound) => addTestKnitRound(id, round),
    updateTestKnitRound: (roundId: string, patch: Partial<TestKnitRound>) => updateTestKnitRound(id, roundId, patch),
    deleteTestKnitRound: (roundId: string) => deleteTestKnitRound(id, roundId),
    addSample: (sample: ProjectSample) => addSample(id, sample),
    updateSample: (sampleId: string, patch: Partial<ProjectSample>) => updateSample(id, sampleId, patch),
    deleteSample: (sampleId: string) => deleteSample(id, sampleId),
      addSubmission: (submission: ProjectSubmission) => addSubmission(id, submission),
      updateSubmission: (submissionId: string, patch: Partial<ProjectSubmission>) => updateSubmission(id, submissionId, patch),
      deleteSubmission: (submissionId: string) => deleteSubmission(id, submissionId),
      addWholesaleOrder: (order: WholesaleOrder) => addWholesaleOrder(id, order),
      updateWholesaleOrder: (orderId: string, patch: Partial<WholesaleOrder>) => updateWholesaleOrder(id, orderId, patch),
      deleteWholesaleOrder: (orderId: string) => deleteWholesaleOrder(id, orderId),
      setDraftContent: (content: PatternDocumentContent) => setDraftContent(id, content),
    compilePackage: (packageId: string, content: PatternDocumentContent) => compilePackage(id, packageId, content),
  };
}
