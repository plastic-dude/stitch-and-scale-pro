import { describe, it, expect } from 'vitest';
import {
  buildPipeline,
  scoreOffer,
  submissionPackChecklist,
  generateSubmissionLetter,
  DEFAULT_PRODUCTION_RATES,
  PipelineCall,
  PipelineInput,
} from './submission-pipeline';
import { PatternProject } from './grading-engine';

function sampleProject(): PatternProject {
  return {
    id: 'test-crew-neck',
    name: 'Test Sweater',
    author: 'Manus',
    baseSize: 'M',
    gauge: { stitchesPer4In: 20, rowsPer4In: 24, unit: 'in' },
    yarnWeight: 'worsted',
    sections: [
      {
        id: 'body',
        name: 'Body',
        measurements: [
          { id: 'bust', label: 'Bust Circumference', measurementType: 'circumference', gradingKey: 'bust', baseValue: 42 },
          { id: 'len', label: 'Body Length', measurementType: 'length', gradingKey: 'backLength', baseValue: 26 },
        ],
      },
      {
        id: 'sleeve',
        name: 'Sleeve',
        measurements: [
          { id: 'sleeve-len', label: 'Sleeve Length', measurementType: 'length', gradingKey: 'sleeveLength', baseValue: 17 },
        ],
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function makingStoriesCall(daysAhead: number): PipelineCall {
  // Making Stories Issue 11 shape: submission deadline → decision 3 days
  // later → pattern due ~3 months after → sample due ~5 months after →
  // launch ~12 months after submission; 4-month exclusivity (cited).
  const deadline = new Date(Date.now() + daysAhead * 86400000).toISOString().slice(0, 10);
  const d = (offsetDays: number) => new Date(Date.now() + (daysAhead + offsetDays) * 86400000).toISOString().slice(0, 10);
  return {
    publication: 'Making Stories',
    issue: 'Issue 11',
    submissionDeadline: deadline,
    decisionDate: d(3),
    patternDue: d(90),
    sampleDue: d(150),
    launchDate: d(365),
    exclusiveMonths: 4,
    fee: 400,
    magazineCoversTechEdit: true,
    yarnSupport: true,
  };
}

const project = sampleProject();
const rates = DEFAULT_PRODUCTION_RATES;
const baseline = { platform: 'ravelry' as const, monthlyUnits: 40, price: 8 };

describe('submission-pipeline', () => {
  it('builds milestones with relative days from a reachable call', () => {
    const summary = buildPipeline({ call: makingStoriesCall(60), project, rates, baseline });
    const deadline = summary.milestones.find((m) => m.name === 'Submission deadline');
    expect(deadline?.state).toBe('due-soon');
    expect(deadline?.daysFromNow).toBeGreaterThanOrEqual(59);
    expect(deadline?.daysFromNow).toBeLessThanOrEqual(61);
    const decision = summary.milestones.find((m) => m.name === 'Editor decision');
    expect(decision?.daysFromNow).not.toBeNull();
  });

  it('flags past milestones as past', () => {
    const summary = buildPipeline({ call: makingStoriesCall(-10), project, rates });
    const deadline = summary.milestones.find((m) => m.name === 'Submission deadline');
    expect(deadline?.state).toBe('past');
    expect((deadline?.daysFromNow as number)).toBeLessThan(0);
  });

  it('computes production hours from the yardage model', () => {
    const summary = buildPipeline({ call: makingStoriesCall(60), project, rates });
    // 30 yd/hr default: a worsted sweater (~800-1200 yd) should need tens of hours.
    expect(summary.production.sampleKnitHours).toBeGreaterThan(20);
    expect(summary.production.totalProductionHours).toBe(
      summary.production.sampleKnitHours + rates.patternWriteHours + rates.swatchHours
    );
    expect(summary.production.requiredWeeks).toBeGreaterThan(0);
  });

  it('declares infeasible when the timeline is too short', () => {
    const call = makingStoriesCall(2); // 2 days until submission deadline
    const summary = buildPipeline({ call, project, rates, baseline });
    expect(summary.production.feasible).toBe(false);
    expect(summary.production.note.toLowerCase()).toContain('weeks');
    expect(summary.production.mustStartBy).toBeNull();
    expect(summary.production.weeksUntilFirstDue).not.toBeNull();
    expect(summary.production.weeksUntilFirstDue).toBeLessThan(summary.production.requiredWeeks);
  });

  it('declares feasible with a computed latest start when time suffices', () => {
    const call = makingStoriesCall(120); // ~17 weeks until deadline
    const summary = buildPipeline({ call, project, rates });
    expect(summary.production.feasible).toBe(true);
    expect(summary.production.mustStartBy).not.toBeNull();
  });

  it('handles calls with no due dates gracefully', () => {
    const call: PipelineCall = {
      publication: 'TBD', issue: 'Future issue', submissionDeadline: '',
      exclusiveMonths: 3, fee: 100, magazineCoversTechEdit: false, yarnSupport: false,
    };
    const summary = buildPipeline({ call, project, rates });
    expect(summary.production.feasible).toBe(true);
    expect(summary.milestones[0].state).toBe('unknown');
    expect(summary.milestones[0].daysFromNow).toBeNull();
  });

  it('scores a Knitty-style offer go (no exclusivity, fee is pure gain)', () => {
    const call = makingStoriesCall(60);
    call.exclusiveMonths = 0;
    call.fee = 300;
    const summary = buildPipeline({ call, project, rates, baseline });
    const offer = summary.offer as NonNullable<typeof summary.offer>;
    expect(offer.verdict).toBe('go');
    expect(offer.netVsSolo).toBeGreaterThan(300); // fee plus post-exclusivity income
    expect(offer.lostSoloMonths).toBe(0);
  });

  it('scores a heavy exclusivity window skip when the fee does not cover lost sales', () => {
    const call = makingStoriesCall(300);
    call.exclusiveMonths = 12;
    call.fee = 100;
    const summary = buildPipeline({ call, project, rates, baseline });
    const offer = summary.offer as NonNullable<typeof summary.offer>;
    expect(offer.verdict).toBe('skip');
    expect(offer.netVsSolo).toBeLessThan(0);
    expect(offer.lostSoloIncome).toBeGreaterThan(offer.postExclusivityIncome);
  });

  it('scores a balanced offer review when net is positive but hourly rate is thin', () => {
    const call = makingStoriesCall(300);
    call.exclusiveMonths = 6;
    call.fee = 350;
    const summary = buildPipeline({ call, project, rates, baseline });
    const offer = summary.offer as NonNullable<typeof summary.offer>;
    // net positive (fee beats lost sales) but rate below the $12/hr bar → review
    expect(offer.netVsSolo).toBeGreaterThan(0);
    expect(offer.effectiveHourlyRate).toBeLessThan(12);
    expect(offer.verdict).toBe('review');
  });

  it('scores a strong offer go (covers lost sales and clears the rate bar)', () => {
    const call = makingStoriesCall(300);
    call.exclusiveMonths = 5; // Laine-style
    call.fee = 2500;
    const summary = buildPipeline({ call, project, rates, baseline });
    const offer = summary.offer as NonNullable<typeof summary.offer>;
    expect(offer.verdict).toBe('go');
    expect(offer.effectiveHourlyRate).toBeGreaterThan(12);
  });

  it('defaults to the project yarn weight when none given', () => {
    const s1 = buildPipeline({ call: makingStoriesCall(60), project, rates });
    const s2 = buildPipeline({ call: makingStoriesCall(60), project, rates, yarnWeight: 'fingering' });
    expect(s2.production.sampleKnitHours).toBeGreaterThan(s1.production.sampleKnitHours);
  });

  it('falls back to worsted when the project has no yarn weight', () => {
    const bare: PatternProject = { ...project, yarnWeight: undefined };
    const summary = buildPipeline({ call: makingStoriesCall(60), project: bare, rates });
    expect(summary.production.sampleKnitHours).toBeGreaterThan(0);
  });

  it('produces the 6-part submission pack checklist with cited items', () => {
    const checklist = submissionPackChecklist({
      publication: 'Making Stories',
      issue: 'Issue 11',
      theme: 'Seashore',
      designName: 'Tide Pool',
      designerName: 'Jane',
      swatchYarn: 'Plucky Crew DK, Forest',
      swatchNeedle: 'US 6',
      swatchGauge: '22 sts × 30 rows / 4 in',
    });
    expect(checklist).toHaveLength(6);
    expect(checklist.join(' ')).toMatch(/inspiration photo/i);
    expect(checklist.join(' ')).toMatch(/croquis/i);
    expect(checklist.join(' ')).toMatch(/swatch/gi);
    expect(checklist.join(' ')).toMatch(/contact/i);
  });

  it('generates a paste-ready cover letter with all parts', () => {
    const letter = generateSubmissionLetter({
      publication: 'Laine',
      issue: 'Issue 34',
      theme: '',
      designName: 'Boreal',
      designerName: 'Jane',
    });
    expect(letter).toMatch(/Dear Laine editorial team/);
    expect(letter).toMatch(/"Boreal"/);
    expect(letter).toMatch(/Warmly,\nJane/);
  });
});
