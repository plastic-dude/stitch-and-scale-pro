import { describe, it, expect } from 'vitest';
import { generateId, type TestKnitRound, type PatternProject } from '../grading-engine';

describe('TestKnitRound Schema', () => {
  it('should create a valid TestKnitRound object', () => {
    const round: TestKnitRound = {
      id: generateId(),
      testerName: 'Alice',
      size: 'M',
      status: 'in-progress',
      startDate: '2026-08-22',
      gauge: {
        stitchesPer4In: 20,
        rowsPer4In: 28,
        unit: 'in'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    expect(round.testerName).toBe('Alice');
    expect(round.size).toBe('M');
    expect(round.gauge?.stitchesPer4In).toBe(20);
  });
});

describe('Project with TestKnitRounds', () => {
  it('should support testKnitRounds array in PatternProject', () => {
    const project: Partial<PatternProject> = {
      id: 'p1',
      testKnitRounds: [
        {
          id: 'r1',
          testerName: 'Bob',
          size: 'L',
          status: 'completed',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]
    };

    expect(project.testKnitRounds?.length).toBe(1);
    expect(project.testKnitRounds?.[0].testerName).toBe('Bob');
  });
});
