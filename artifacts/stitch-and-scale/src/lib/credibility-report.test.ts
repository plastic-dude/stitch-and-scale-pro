import { describe, expect, it } from 'vitest';
import {
  computeCredibility,
  generateCredibilityStatement,
} from './credibility-report';
import { SAMPLE_CREW_NECK_SWEATER } from './sample-projects';

function thinProject() {
  // A "pattern" that is all words, no data — structurally what an AI PDF is.
  return {
    ...SAMPLE_CREW_NECK_SWEATER,
    name: 'Sloppy AI-ish Pattern',
    description: 'A lovely cozy sweater perfect for all seasons enjoy the process',
    sections: [],
    yarnWeight: undefined as never,
    gauge: { stitchesPer4In: 0, rowsPer4In: 0, unit: 'in' as const },
  };
}

describe('computeCredibility', () => {
  it('scores the healthy sample project high and marks it credible', () => {
    const result = computeCredibility(SAMPLE_CREW_NECK_SWEATER);
    expect(result.score).toBeGreaterThanOrEqual(60);
    expect(result.verdict).toBe('credible');
    expect(result.sizeCount).toBeGreaterThanOrEqual(2);
    expect(result.totalYards).toBeGreaterThan(0);
    const graded = result.checks.find(c => c.id === 'graded-sizes');
    expect(graded?.passed).toBe(true);
    expect(graded?.proof).toMatch(/\d+ sizes/);
  });

  it('drops an AI-style project (words, no data) to the thin band', () => {
    const result = computeCredibility(thinProject());
    // An AI-style project (words, no data) fails the trust checks and cannot
    //  earn credibility from wording alone.
    expect(result.verdict).toBe('thin');
    expect(result.totalYards).toBeNull();
    expect(result.sizeCount).toBe(0);
    // The three trust checks that AI PDFs always fail.
    for (const id of ['graded-sizes', 'yardage-math', 'tech-edit']) {
      expect(result.checks.find(c => c.id === id)?.passed).toBe(false);
    }
  });

  it('never produces negative or out-of-range scores under accumulated cuts', () => {
    const result = computeCredibility(thinProject());
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('passes score ceiling only when the checklist data supports it', () => {
    const result = computeCredibility(thinProject());
    if (result.checks.some(c => !c.passed)) {
      expect(result.score).toBeLessThan(100);
    }
  });

  it('generates a statement only from passed checks — no unsupported claims', () => {
    const statement = generateCredibilityStatement(thinProject());
    // Nothing from failing checks can leak into the statement:
    expect(statement).not.toContain('Graded across');
    expect(statement).not.toContain('Yarn yardage estimated');
    // A healthy project's statement leads with earned proof.
    const healthy = generateCredibilityStatement(SAMPLE_CREW_NECK_SWEATER);
    expect(healthy).toContain('credibility (');
    expect(healthy).toContain('sizes');
    // Score header matches the computed score.
    const score = computeCredibility(SAMPLE_CREW_NECK_SWEATER).score;
    expect(healthy).toContain(`(${score}/100)`);
  });
});
