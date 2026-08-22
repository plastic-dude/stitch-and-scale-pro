import { describe, it, expect } from 'vitest';
import { generateId, PatternProject, CollaborationMember } from './grading-engine';

describe('Collaboration Schema', () => {
  it('should support adding collaborators to a project', () => {
    const project: PatternProject = {
      id: generateId(),
      name: 'Test Project',
      author: 'Test Author',
      baseSize: 'M',
      gauge: { stitchesPer4In: 20, rowsPer4In: 28, unit: 'in' },
      sections: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      collaborationRoster: []
    };

    const newMember: CollaborationMember = {
      id: generateId(),
      name: 'Jane Doe',
      role: 'editor',
      email: 'jane@example.com',
      invitedAt: new Date().toISOString(),
      status: 'invited'
    };

    project.collaborationRoster = [newMember];
    expect(project.collaborationRoster.length).toBe(1);
    expect(project.collaborationRoster[0].name).toBe('Jane Doe');
  });

  it('should support readiness issue metadata (location, assignee, comments)', () => {
    const issue = {
      id: generateId(),
      severity: 'major' as const,
      description: 'Incorrect bust grading',
      location: 'Body › Bust',
      assignee: 'Jane Doe',
      status: 'open' as const,
      comments: [
        { id: generateId(), author: 'Jane Doe', text: 'Fixed in next revision', createdAt: new Date().toISOString() }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    expect(issue.location).toBe('Body › Bust');
    expect(issue.assignee).toBe('Jane Doe');
    expect(issue.comments.length).toBe(1);
  });
});
