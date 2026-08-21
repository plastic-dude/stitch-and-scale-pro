import type { PatternProject } from '@/lib/grading-engine';

/** Build the project payload written by explicit save, blur save, and autosave. */
export function withNotes(project: PatternProject, draft: string): PatternProject {
  return {
    ...project,
    description: draft.trim() || undefined,
  };
}

/** True when the visible draft differs from the persisted project description. */
export function notesNeedSave(project: PatternProject, draft: string): boolean {
  return draft !== (project.description || '');
}

/**
 * Notes are intentionally not normalized while typing: preserving the draft
 * in the textarea feels natural. The persisted form is trimmed and omits an
 * empty description so exports do not carry meaningless whitespace.
 */
export function normalizedNotes(draft: string): string | undefined {
  return draft.trim() || undefined;
}
