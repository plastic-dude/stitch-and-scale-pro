import { describe, it, expect } from 'vitest';
import { analyzeReceipt, DEFAULT_SALE, DEFAULT_BRAND } from './lib/receipt-lab';
import { analyzeMembership, normalizeMembershipInput } from './lib/membership-planner';
import { analyzeWholesaleDeal } from './lib/wholesale-book-analyzer';
import { analyzeDealMath, DEAL_MATH_DEFAULTS } from './lib/collab-deal-math';

describe('Copy Quarantine (QUEUE-017-COPY)', () => {
  it('receipt isComplete is false when draft has no priced items', () => {
    const result = analyzeReceipt({ brand: DEFAULT_BRAND, draft: DEFAULT_SALE, ledger: [], materialsCost: 0 });
    expect(result.isComplete).toBe(false);
  });

  it('receipt isComplete is true when draft has priced items', () => {
    const draft = { ...DEFAULT_SALE, items: [{ name: 'Pattern', qty: 1, unitPrice: 8 }] };
    const result = analyzeReceipt({ brand: DEFAULT_BRAND, draft, ledger: [], materialsCost: 0 });
    expect(result.isComplete).toBe(true);
  });

  it('membership isComplete is false when totalMembers is 0', () => {
    const input = normalizeMembershipInput({ tiers: [{ name: 'T', price: 5, members: 0, monthlyChurnPct: 10, perks: [] }] });
    const result = analyzeMembership(input);
    expect(result.isComplete).toBe(false);
  });

  it('wholesale isComplete is false when orderQuantity is 0', () => {
    const result = analyzeWholesaleDeal({ patterns: 5, retailPrice: 8, wholesaleRate: 4, orderQuantity: 0, repeatOrderChance: 0.4, workHours: 40, exclusive: false, cashCosts: 200, yourRate: 0 });
    expect(result.isComplete).toBe(false);
  });

  it('collab deal isComplete is false when no fee or royalty set', () => {
    const result = analyzeDealMath({ ...DEAL_MATH_DEFAULTS, fixedFee: 0, royaltyPct: 0, yarnSupportValue: 0 });
    expect(result.isComplete).toBe(false);
  });
});
