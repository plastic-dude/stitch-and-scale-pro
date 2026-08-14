import React, { createContext, useContext, useEffect, useReducer, useRef, useState } from 'react';
import { get, set } from 'idb-keyval';
import { PatternProject, generateId } from '@/lib/grading-engine';
// S001 fix (fix applied by review agent, verified Aug 14 2026): the reducer used
// to write localStorage directly ('stitch-and-scale-v1'), making the seam's
// writeProjects (IndexedDB + localStorage, audit-aware) a second, unsynchronized
// writer. A single writer now: both paths persist through the seam helper.
import { writeProjects } from '@/lib/storage-lib';

type ProjectsAction = 
  | { type: 'INIT'; payload: PatternProject[] }
  | { type: 'CREATE'; payload: PatternProject }
  | { type: 'UPDATE'; payload: PatternProject }
  | { type: 'DELETE'; payload: string }
  | { type: 'DUPLICATE'; payload: string };

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface ProjectsContextType {
  projects: PatternProject[];
  createProject: (project: PatternProject) => void;
  updateProject: (project: PatternProject) => void;
  deleteProject: (id: string) => void;
  duplicateProject: (id: string) => void;
  importProject: (project: PatternProject) => void;
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
    load();
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
  // Import a single project from an exported JSON file — always assigns a
  // fresh id so it can never silently collide with or overwrite an existing
  // project, even if the file was exported from this same workspace.
  const importProject = (project: PatternProject) => dispatch({
    type: 'CREATE',
    payload: { ...project, id: generateId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  });

  if (!isLoaded) return null; // Prevent rendering before state loads

  return (
    <ProjectsContext.Provider value={{ projects, createProject, updateProject, deleteProject, duplicateProject, importProject, saveStatus, recovered, dismissRecovery }}>
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

export function useProject(id?: string) {
  const { projects, updateProject, deleteProject } = useProjects();
  if (!id) return null;
  const project = projects.find(p => p.id === id);
  
  if (!project) return null;
  
  return {
    project,
    updateProject: (p: PatternProject) => updateProject(p),
    deleteProject: () => deleteProject(project.id)
  };
}
