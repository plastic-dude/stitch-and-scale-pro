import { describe, it, expect } from 'vitest';
import { estimateContributionMargin, projectRevenue, PRICING_MODELS } from './revenue-growth-planner';

describe('revenue-growth-planner', () => {
  it('projects revenue correctly', () => {
    expect(projectRevenue(10, 5)).toBe(50);
    expect(projectRevenue(0, 100)).toBe(0);
  });

  it('estimates contribution margin with digital fees', () => {
    // 5% + $0.30 per transaction
    // $10 * 10 = $100 gross
    // Fees: $100 * 0.05 ($5) + 10 * 0.30 ($3) = $8
    // Margin: $100 - $8 = $92
    expect(estimateContributionMargin(10, 10)).toBe(92);
    expect(estimateContributionMargin(0, 100)).toBe(0);
  });

  it('has valid pricing hypotheses', () => {
    expect(PRICING_MODELS.length).toBeGreaterThan(0);
    PRICING_MODELS.forEach(model => {
      expect(model.id).toBeDefined();
      expect(model.name).toBeDefined();
      expect(model.price).toBeGreaterThanOrEqual(0);
      expect(model.included.length).toBeGreaterThan(0);
    });
  });
});
