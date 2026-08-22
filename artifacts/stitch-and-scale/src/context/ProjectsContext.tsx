import React, { createContext, useContext, useEffect, useReducer, useRef, useState } from 'react';
import { get, set } from 'idb-keyval';
import { type PatternProject, generateId, type PublicationPackage, type PublicationArtifact, type EaseProfileReference, type SizingStandardMetadata } from '@/lib/grading-engine';
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
import { useSettings } from './SettingsContext';

type ProjectsAction = 
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
  | { type: 'BATCH_DELETE'; payload: string[] }
  | { type: 'BATCH_ARCHIVE'; payload: { ids: string[]; archived: boolean } }
  | { type: 'BATCH_TAG'; payload: { ids: string[]; tags: string[] } }
  | { type: 'SET_FIT_GOVERNANCE'; payload: { projectId: string; easeProfile?: EaseProfileReference; standardMetadata?: SizingStandardMetadata } };

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
  batchDelete: (ids: string[]) => void;
  batchArchive: (ids: string[], archived: boolean) => void;
  batchTag: (ids: string[], tags: string[]) => void;
  setFitGovernance: (projectId: string, easeProfile?: EaseProfileReference, standardMetadata?: SizingStandardMetadata) => void;
  saveStatus: SaveStatus;
  recovered: boolean;
  dismissRecovery: () => void;
}

const SESSION_KEY = 'stitch-and-scale-session-flag';

const ProjectsContext = createContext<ProjectsContextType | undefined>(undefined);

function projectsReducer(state: PatternProject[], action: ProjectsAction): PatternProject[] {
  let newState: PatternProject[];
  switch (action.type) {
    case 'INIT':
      return action.payload;
    case 'CREATE':
      newState = [...state, action.payload];
      break;
    case 'UPDATE':
      newState = state.map(p => p.id === action.payload.id ? { ...action.payload, updatedAt: new Date().toISOString() } : p);
      break;
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
      newState = [...state, duplicated];
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
        return {
          ...snapshot.data,
          id: p.id, // Ensure id stays consistent
          snapshots: p.snapshots,
          updatedAt: new Date().toISOString(),
        };
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
          publicationPackages: [action.payload.pkg, ...(p.publicationPackages || [])],
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
            pkg.id === action.payload.pkg.id ? action.payload.pkg : pkg
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
      newState = state.map(p => 
        p.id === action.payload.projectId 
          ? { 
              ...p, 
              easeProfile: action.payload.easeProfile, 
              standardMetadata: action.payload.standardMetadata, 
              updatedAt: new Date().toISOString() 
            } 
          : p
      );
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
          const migrated = parsed.map((p: any) => ({
            ...p,
            gauge: p.gauge || { stitchesPer4In: 0, rowsPer4In: 0, unit: 'in' },
            sections: p.sections || []
          }));
          dispatch({ type: 'INIT', payload: migrated });
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

  // Import a single project from an exported JSON file — always assigns a
  // fresh id so it can never silently collide with or overwrite an existing
  // project, even if the file was exported from this same workspace.
  const importProject = (project: PatternProject) => dispatch({
    type: 'CREATE',
    payload: { ...project, id: generateId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  });

  if (!isLoaded) return null; // Prevent rendering before state loads

  return (
    <ProjectsContext.Provider value={{ 
      projects, createProject, updateProject, deleteProject, duplicateProject, importProject, 
      createSnapshot, restoreSnapshot, deleteSnapshot, updateContract,
      createPublicationPackage, updatePublicationPackage, deletePublicationPackage, addPublicationArtifact,
      batchDelete, batchArchive,       batchTag,
      setFitGovernance,
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
    createPublicationPackage, updatePublicationPackage, deletePublicationPackage, addPublicationArtifact, setFitGovernance
  } = useProjects();
  if (!id) return null;
  const existing = projects.find(p => p.id === id);

  // CHK-119: first visit to the demo id with no stored project seeds the demo.
  if (!existing && id === DEMO_PROJECT_ID) {
    const { language } = useSettings();
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
      setFitGovernance: (ease?: EaseProfileReference, meta?: SizingStandardMetadata) => setFitGovernance(DEMO_PROJECT_ID, ease, meta),
    };
  }

  if (!existing) return null;

  return {
    project: existing,
    updateProject: (p: PatternProject) => updateProject(p),
    deleteProject: () => deleteProject(existing.id),
    createSnapshot: (name: string, note: string) => createSnapshot(existing.id, name, note),
    restoreSnapshot: (snapshotId: string) => restoreSnapshot(existing.id, snapshotId),
    deleteSnapshot: (snapshotId: string) => deleteSnapshot(existing.id, snapshotId),
    updateContract: (contract: any) => updateContract(existing.id, contract),
    createPublicationPackage: (pkg: any) => createPublicationPackage(existing.id, pkg),
    updatePublicationPackage: (pkg: any) => updatePublicationPackage(existing.id, pkg),
    deletePublicationPackage: (packageId: string) => deletePublicationPackage(existing.id, packageId),
    addPublicationArtifact: (packageId: string, artifact: PublicationArtifact) => addPublicationArtifact(existing.id, packageId, artifact),
    setFitGovernance: (ease?: EaseProfileReference, meta?: SizingStandardMetadata) => setFitGovernance(existing.id, ease, meta),
  };
}
