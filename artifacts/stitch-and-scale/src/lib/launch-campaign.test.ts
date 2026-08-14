import { describe, expect, it } from 'vitest';
import {
  buildCampaign,
  buildReadinessGates,
  milestoneDate,
  postLaunchReviewTemplate,
} from './launch-campaign';
import { SAMPLE_CREW_NECK_SWEATER, SAMPLE_BASIC_BEANIE } from './sample-projects';
import { PatternProject } from './grading-engine';
import { TesterSlot } from './test-knit-programme';

const LAUNCH = '2026-10-02';

function makeSlots(statuses: TesterSlot['status'][]): TesterSlot[] {
  return statuses.map((status, i) => ({
    id: `M-${i}`,
    size: 'M',
    status,
  } as TesterSlot));
}

describe('buildCampaign', () => {
  it('produces the full standard 10-milestone plan', () => {
    const plan = buildCampaign(SAMPLE_CREW_NECK_SWEATER, { launchDate: LAUNCH });
    expect(plan.milestones.length).toBe(10);
    const offsets = plan.milestones.map(m => m.dayOffset);
    expect(offsets).toEqual([-21, -14, -7, -2, -1, 0, 1, 3, 7, 14]);
    const phases = plan.milestones.map(m => m.phase);
    expect(phases.slice(0, 5).every(p => p === 'pre')).toBe(true);
    expect(phases[5]).toBe('launch');
    expect(phases.slice(6).every(p => p === 'post')).toBe(true);
  });

  it('anchors milestones to correct calendar dates', () => {
    const plan = buildCampaign(SAMPLE_CREW_NECK_SWEATER, { launchDate: LAUNCH });
    expect(plan.launchDate).toBe(LAUNCH);
    expect(milestoneDate(LAUNCH, 0)).toContain('October 2');
    expect(milestoneDate(LAUNCH, -2)).toContain('September 30');
    expect(milestoneDate(LAUNCH, 14)).toContain('October 16');
    // Oct 2 2026 is a Friday.
    expect(milestoneDate(LAUNCH, 0)).toMatch(/^Friday/);
  });

  it('embeds the pattern yarn data in milestone copy', () => {
    const plan = buildCampaign(SAMPLE_CREW_NECK_SWEATER, {
      launchDate: LAUNCH,
      yarnCompany: 'Blue Faced Yarn Co',
    });
    const companyMilestone = plan.milestones.find(m => m.dayOffset === -14);
    expect(companyMilestone?.copy).toContain('Blue Faced Yarn Co');
    expect(companyMilestone?.copy).toContain('yd');
    expect(companyMilestone?.copy).toContain('m');
    const launchMilestone = plan.milestones.find(m => m.dayOffset === 0);
    expect(launchMilestone?.copy.toLowerCase()).toContain('worsted');
    // Copy has no double spaces (regex whitespace replacement worked).
    expect(plan.milestones.every(m => !/  /.test(m.copy))).toBe(true);
  });

  it('embeds the market price band in launch-day copy', () => {
    const plan = buildCampaign(SAMPLE_CREW_NECK_SWEATER, { launchDate: LAUNCH });
    const launch = plan.milestones.find(m => m.dayOffset === 0)!;
    expect(launch.copy).toMatch(/\$[\d.]+–\$[\d.]+/);
  });

  it('honours coupon overrides', () => {
    const plan = buildCampaign(SAMPLE_CREW_NECK_SWEATER, {
      launchDate: LAUNCH,
      couponCode: 'FALL10',
      couponPercent: 10,
    });
    const dayMinus1 = plan.milestones.find(m => m.dayOffset === -1)!;
    expect(dayMinus1.copy).toContain('FALL10');
    expect(dayMinus1.copy).toContain('10%');
    const launch = plan.milestones.find(m => m.dayOffset === 0)!;
    expect(launch.copy).toContain('FALL10');
    expect(launch.copy).toContain('10%');
  });

  it('uses marketplace URLs when provided', () => {
    const plan = buildCampaign(SAMPLE_CREW_NECK_SWEATER, {
      launchDate: LAUNCH,
      ravelryUrl: 'https://ravelry.com/patterns/library/crew',
      etsyUrl: 'https://etsy.com/listing/123',
    });
    const pre = plan.milestones.find(m => m.dayOffset === -21)!;
    expect(pre.copy).toContain('ravelry.com/patterns/library/crew');
    expect(pre.copy).toContain('etsy.com/listing/123');
  });

  it('includes the sales target in the review milestone', () => {
    const plan = buildCampaign(SAMPLE_CREW_NECK_SWEATER, {
      launchDate: LAUNCH,
      salesTarget: 80,
    });
    const review = plan.milestones.find(m => m.dayOffset === 14)!;
    expect(review.copy).toContain('80');
  });

  it('defaults gracefully for a project with no yarn weight', () => {
    const noYarn: PatternProject = {
      ...SAMPLE_CREW_NECK_SWEATER,
      name: 'Mystery Scarf',
      yarnWeight: undefined,
    };
    const plan = buildCampaign(noYarn, { launchDate: LAUNCH });
    const launch = plan.milestones.find(m => m.dayOffset === 0)!;
    expect(launch.copy.toLowerCase()).toContain('worsted'); // default weight used
  });

  it('detects garment type from the pattern name for seasonal notes', () => {
    const outOfSeason = buildCampaign(
      { ...SAMPLE_CREW_NECK_SWEATER, name: 'Woolly Winter Sweater' },
      { launchDate: '2026-03-05' }, // March is outside autumn launch window
    );
    expect(outOfSeason.seasonalNote).toContain('outside the usual launch window');
    const inSeason = buildCampaign(
      { ...SAMPLE_CREW_NECK_SWEATER, name: 'Woolly Winter Sweater' },
      { launchDate: '2026-08-01' },
    );
    expect(inSeason.seasonalNote).toContain('sits well');
    const hatProject = buildCampaign(
      { ...SAMPLE_CREW_NECK_SWEATER, name: 'Cable Beanie' },
      { launchDate: LAUNCH },
    );
    expect(hatProject.seasonalNote).toContain('Autumn/winter');
  });

  it('runs KAL mode with 4 weekly clue milestones', () => {
    const plan = buildCampaign(SAMPLE_CREW_NECK_SWEATER, {
      launchDate: LAUNCH,
      kalMode: true,
    });
    expect(plan.kalClues).toBeDefined();
    expect(plan.kalClues!.length).toBe(4);
    const kalOffsets = plan.kalClues!.map(m => m.dayOffset);
    expect(kalOffsets).toEqual([-7, 0, 7, 14]);
    // KAL mode replaces the standard beats.
    const offsets = plan.milestones.map(m => m.dayOffset);
    expect(offsets).toEqual([-7, 0, 7, 14]);
    expect(plan.kalClues![3].copy).toContain('clue');
  });

  it('uses project sections as KAL clue names when present', () => {
    const plan = buildCampaign(SAMPLE_CREW_NECK_SWEATER, {
      launchDate: LAUNCH,
      kalMode: true,
    });
    // Sections are listed Body, Sleeve, Neckline; the start clue doesn't name a section, so clue 1 uses the second section.
    const clueNames = plan.kalClues!.map(m => m.copy);
    expect(clueNames.some(c => c.includes('Sleeve'))).toBe(true);
  });
});

describe('buildReadinessGates', () => {
  it('opens all three gates for a healthy project with a finished tester', () => {
    const gates = buildReadinessGates(SAMPLE_CREW_NECK_SWEATER, makeSlots(['finished', 'finished']));
    expect(gates.every(g => g.ok)).toBe(true);
    expect(gates).toHaveLength(3);
    expect(gates[2].why).toContain('2 testers finished');
  });

  it('flags the test-knit gate when no roster exists', () => {
    const gates = buildReadinessGates(SAMPLE_CREW_NECK_SWEATER);
    expect(gates.find(g => g.label.includes('Test-knit'))?.ok).toBe(false);
  });

  it('flags the test-knit gate when no tester has finished', () => {
    const gates = buildReadinessGates(
      SAMPLE_CREW_NECK_SWEATER,
      makeSlots(['invited', 'knitting']),
    );
    expect(gates.find(g => g.label.includes('Test-knit'))?.ok).toBe(false);
    expect(gates.find(g => g.label.includes('Test-knit'))?.why).toContain('no finished test knits');
  });

  it('summarises gate counts in the campaign plan', () => {
    const plan = buildCampaign(
      SAMPLE_CREW_NECK_SWEATER,
      { launchDate: LAUNCH },
      makeSlots(['finished']),
    );
    expect(plan.gateSummary).toContain('3/3');
    const partial = buildCampaign(
      SAMPLE_CREW_NECK_SWEATER,
      { launchDate: LAUNCH },
      makeSlots(['invited']),
    );
    expect(partial.gateSummary).toMatch(/^2\/3/);
  });

  it('handles an empty project without throwing', () => {
    const empty: PatternProject = {
      id: 'x', name: 'e', author: 'a', baseSize: 'M',
      gauge: { stitchesPer4In: 20, rowsPer4In: 26, unit: 'in' },
      sections: [], createdAt: '', updatedAt: '',
    };
    const plan = buildCampaign(empty, { launchDate: LAUNCH });
    expect(plan.milestones.length).toBeGreaterThan(0);
  });
});

describe('postLaunchReviewTemplate', () => {
  it('emits the reflection block structure', () => {
    const tpl = postLaunchReviewTemplate();
    expect(tpl).toContain('POST-LAUNCH REVIEW');
    expect(tpl).toContain('Best-performing channel:');
    expect(tpl).toContain('What flopped:');
  });
});
