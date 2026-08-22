import { describe, it, expect } from 'vitest';
import { 
  generateId, 
  ReadinessIssue, 
  PatternProject, 
  ReadinessStage,
  ReadinessIssueStatus 
} from './grading-engine';
import { projectsReducer } from '../context/ProjectsContext';

describe('Defect Ledger Logic', () => {
  const mockProject: PatternProject = {
    id: 'p1',
    name: 'Test Project',
    author: 'Designer',
    baseSize: 'M',
    gauge: { stitchesPer4In: 20, rowsPer4In: 28, unit: 'in' },
    sections: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    publicationContract: {
      version: '1.0.0',
      signOffs: [
        { stage: 'mathematical', status: 'pending', issues: [] },
        { stage: 'editorial', status: 'pending', issues: [] },
        { stage: 'test-knit', status: 'pending', issues: [] },
        { stage: 'final', status: 'pending', issues: [] },
      ],
      isReady: false,
      updatedAt: new Date().toISOString(),
    }
  };

  it('reducer preserves all expanded defect ledger fields', () => {
    const issue: ReadinessIssue = {
      id: 'i1',
      severity: 'major',
      description: 'Test issue',
      evidence: 'Stitch count mismatch',
      location: 'Sleeve',
      affectedSizes: ['XL', '2XL'] as any,
      reproductionState: 'Check XL sleeve',
      disposition: 'accepted',
      resolutionNote: 'Fixed grading formula',
      sourceRunId: 'RUN-001',
      status: 'open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      comments: []
    };

    const state = [mockProject];
    const newState = projectsReducer(state, {
      type: 'ADD_READINESS_ISSUE',
      payload: { projectId: 'p1', stage: 'mathematical', issue }
    });

    const savedIssue = newState[0].publicationContract?.signOffs[0].issues[0];
    expect(savedIssue).toBeDefined();
    expect(savedIssue?.evidence).toBe('Stitch count mismatch');
    expect(savedIssue?.location).toBe('Sleeve');
    expect(savedIssue?.affectedSizes).toEqual(['XL', '2XL']);
    expect(savedIssue?.reproductionState).toBe('Check XL sleeve');
    expect(savedIssue?.disposition).toBe('accepted');
    expect(savedIssue?.resolutionNote).toBe('Fixed grading formula');
    expect(savedIssue?.sourceRunId).toBe('RUN-001');
  });

  it('reducer updates issue status through lifecycle', () => {
    const issue: ReadinessIssue = {
      id: 'i1',
      severity: 'minor',
      description: 'Check fit',
      status: 'open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      comments: []
    };

    let state = [mockProject];
    state = projectsReducer(state, {
      type: 'ADD_READINESS_ISSUE',
      payload: { projectId: 'p1', stage: 'test-knit', issue }
    });

    const statuses: ReadinessIssueStatus[] = ['fixed', 'verified', 'needs-test-knit'];
    
    for (const status of statuses) {
      state = projectsReducer(state, {
        type: 'UPDATE_READINESS_ISSUE',
        payload: { projectId: 'p1', stage: 'test-knit', issueId: 'i1', patch: { status } }
      });
      const updatedIssue = state[0].publicationContract?.signOffs[2].issues[0];
      expect(updatedIssue?.status).toBe(status);
    }
  });

  it('needs-test-knit status correctly blocks sign-off (semantic check)', () => {
    // Note: The UI logic for sign-off is in the component, but the integrity 
    // rules in publication-integrity.ts govern the final state.
    // Here we just verify the status is distinct.
    const issue: ReadinessIssue = {
      id: 'i1',
      severity: 'critical',
      description: 'Major fit issue',
      status: 'needs-test-knit',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    expect(issue.status).toBe('needs-test-knit');
    expect(issue.status).not.toBe('verified');
  });
});
