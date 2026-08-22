import { describe, it, expect } from 'vitest';
import { analyzeReceipt, DEFAULT_FEES, DEFAULT_SALE } from './lib/receipt-lab';
import { validateInputs } from './lib/validate-field';

describe('Receipt Lab Tax Safety (CHK-178)', () => {
  it('should not crash on negative tax rates', () => {
    const sale = {
      ...DEFAULT_SALE,
      items: [{ name: 'Test', qty: 1, unitPrice: 100 }],
      fees: { ...DEFAULT_FEES, taxPct: -0.2 }
    };
    
    // Engine should clamp to 0 (existing behavior, verifying it holds)
    const result = analyzeReceipt({ 
      brand: { businessName: 'Test', contact: '', currency: 'USD' },
      draft: sale,
      ledger: [],
      materialsCost: 0
    });
    
    expect(result.fees.taxAmount).toBe(0);
    expect(result.fees.grossTotal).toBe(100);
  });

  it('should not crash on extreme tax rates (divide by zero or infinity risk)', () => {
    const sale = {
      ...DEFAULT_SALE,
      items: [{ name: 'Test', qty: 1, unitPrice: 100 }],
      fees: { ...DEFAULT_FEES, taxPct: 1e12 }
    };
    
    const result = analyzeReceipt({ 
      brand: { businessName: 'Test', contact: '', currency: 'USD' },
      draft: sale,
      ledger: [],
      materialsCost: 0
    });
    
    // Clamped to 100% (1.0)
    expect(result.fees.taxAmount).toBe(100);
    expect(result.fees.grossTotal).toBe(200);
    expect(Number.isFinite(result.fees.grossTotal)).toBe(true);
  });
});
