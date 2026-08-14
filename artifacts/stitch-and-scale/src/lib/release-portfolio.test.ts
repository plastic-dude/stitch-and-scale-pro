import { describe, it, expect } from 'vitest';
import {
  scoreReadiness,
  buildPortfolioLine,
  findBundles,
  buildPortfolio,
} from './release-portfolio';
import { type PatternProject } from './grading-engine';
import { SAMPLE_CREW_NECK_SWEATER } from './sample-projects';

function makeProject(overrides: Partial<PatternProject> = {}): PatternProject {
  const base = SAMPLE_CREW_NECK_SWEATER;
  return { ...base, ...overrides } as never;
}

const defaultInputs = {
  itemType: 'sweater',
  skillLevel: 'intermediate',
  marketTarget: 'standard' as const,
  hoursWorked: 20,
  hourlyRate: 25,
  currentPrice: 8,
};

describe('scoreReadiness', () => {
  it('returns 100 for a fully passing result', () => {
    expect(scoreReadiness({ checks: [], ready: true, errorCount: 0, warningCount: 0 })).toBe(100);
  });

  it('deducts 25 per error and 10 per warning, floored at 0', () => {
    const threeErrors = { checks: [], ready: false, errorCount: 3, warningCount: 1 };
    expect(scoreReadiness(threeErrors)).toBe(15);
    const fiveErrors = { checks: [], ready: false, errorCount: 5, warningCount: 2 };
    expect(scoreReadiness(fiveErrors)).toBe(0);
  });
});

describe('buildPortfolioLine', () => {
  const project = makeProject({ name: 'Test Crewneck', yarnWeight: 'worsted' });

  it('returns a line with realistic pricing anchored in the documented bands', () => {
    const line = buildPortfolioLine(project, defaultInputs);
    expect(line.name).toBe('Test Crewneck');
    expect(line.pricing.recommendedPrice).toBeGreaterThanOrEqual(5);
    expect(line.pricing.recommendedPrice).toBeLessThanOrEqual(10);
    expect(line.netPerUnitBest).toBeGreaterThan(0);
    expect(line.netPerUnitWorst).toBeGreaterThan(0);
    expect(line.netPerUnitWorst).toBeLessThanOrEqual(line.netPerUnitBest);
    expect(line.yarnWeightClass).toBe('worsted');
  });

  it('scores readiness and computes a launch score in 0-100', () => {
    const line = buildPortfolioLine(project, defaultInputs);
    expect(line.readinessScore).toBeGreaterThanOrEqual(0);
    expect(line.readinessScore).toBeLessThanOrEqual(100);
    expect(line.launchScore).toBeGreaterThan(0);
    expect(line.launchScore).toBeLessThanOrEqual(100);
  });

  it('falls back to a gauge-anchored weight class when yarnWeight is unset', () => {
    const fineGauge = makeProject({ yarnWeight: undefined as never, gauge: { stitchesPer4In: 6.5, rowsPer4In: 9, unit: 'in' } });
    const line = buildPortfolioLine(fineGauge, defaultInputs);
    expect(['lace', 'fingering', 'sport', 'dk', 'worsted', 'bulky', 'superBulky']).toContain(line.yarnWeightClass);
  });

  it('defaults yarn weight class to unknown when neither weight nor gauge exists', () => {
    const bare = makeProject({ yarnWeight: undefined as never, gauge: { stitchesPer4In: 0, rowsPer4In: 0, unit: "in" } });
    expect(buildPortfolioLine(bare, defaultInputs).yarnWeightClass).toBe('unknown');
  });
  it('maps a typical worsted gauge (20 sts/4in) to worsted, never lace (issue #12)', () => {
    const worstedGauge = makeProject({ yarnWeight: undefined as never, gauge: { stitchesPer4In: 20, rowsPer4In: 28, unit: 'in' } });
    expect(buildPortfolioLine(worstedGauge, defaultInputs).yarnWeightClass).toBe('worsted');
    const fineGauge = makeProject({ yarnWeight: undefined as never, gauge: { stitchesPer4In: 27, rowsPer4In: 36, unit: 'in' } });
    expect(buildPortfolioLine(fineGauge, defaultInputs).yarnWeightClass).toBe('fingering');
  });

  it('flags listing readiness by errors and note length', () => {
    const thickNotes = makeProject({ description: 'A relaxed crewneck worked flat with drop shoulders.' });
    expect(buildPortfolioLine(thickNotes, defaultInputs).listingReady).toBe(
      buildPortfolioLine(thickNotes, defaultInputs).readiness.errorCount === 0,
    );
    const thinNotes = makeProject({ description: 'x' });
    expect(buildPortfolioLine(thinNotes, defaultInputs).listingReady).toBe(false);
  });
});

describe('findBundles', () => {
  const fingeringHat = makeProject({ name: 'Fingering Hat', yarnWeight: 'fingering' });
  const fingeringSocks = makeProject({ name: 'Fingering Socks', yarnWeight: 'fingering' });
  const fingeringMitts = makeProject({ name: 'Fingering Mitts', yarnWeight: 'fingering' });
  const worstedSweater = makeProject({ name: 'Worsted Crewneck', yarnWeight: 'worsted' });

  it('groups same-weight patterns into matching-set bundles at ~29% below sum of parts', () => {
    const lines = [fingeringHat, fingeringSocks, fingeringMitts, worstedSweater]
      .map(p => buildPortfolioLine(p, defaultInputs));
    const bundles = findBundles(lines);
    expect(bundles.length).toBeGreaterThan(0);
    const set = bundles.find(b => b.patterns.every(p => p.name.startsWith('Fingering')));
    expect(set).toBeTruthy();
    const sum = set!.patterns.reduce((s, p) => s + p.price, 0);
    expect(set!.bundlePrice).toBeCloseTo(sum * 0.71, 0);
    expect(set!.sumOfParts).toBe(sum);
  });

  it('returns no bundles when fewer than two patterns share a weight class', () => {
    const lines = [worstedSweater].map(p => buildPortfolioLine(p, defaultInputs));
    expect(findBundles(lines)).toHaveLength(0);
  });

  it('caps output at four candidates ordered by catalogue value', () => {
    const many = Array.from({ length: 8 }, (_, i) =>
      makeProject({ name: `P${i}`, yarnWeight: 'fingering' as never }),
    );
    const lines = many.map(p => buildPortfolioLine(p, defaultInputs));
    expect(findBundles(lines).length).toBeLessThanOrEqual(4);
  });
});

describe('buildPortfolio', () => {
  it('aggregates the catalogue with ready-to-launch ordering', () => {
    const projects = [
      makeProject({ name: 'Sweater' }),
      makeProject({ name: 'Hat', yarnWeight: 'fingering' }),
      makeProject({ name: 'Socks', yarnWeight: 'fingering' }),
    ];
    const portfolio = buildPortfolio(projects, defaultInputs);
    expect(portfolio.lines).toHaveLength(3);
    expect(portfolio.totalCatalogueValue).toBeGreaterThan(10);
    expect(portfolio.recommendedCadence).toBeTruthy();
    for (let i = 1; i < portfolio.lines.length; i++) {
      expect(portfolio.lines[i - 1].launchScore).toBeGreaterThanOrEqual(portfolio.lines[i].launchScore);
    }
  });
});
