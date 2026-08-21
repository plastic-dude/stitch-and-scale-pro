import { describe, expect, it } from 'vitest';
import { prepareMcpTakeRateCalculation } from './mcp-calculation-workflow';

const calculation = {
  currency: 'USD', currencySymbol: '$', sellerRegion: 'us', offsiteAdsRate: 0.15,
  ravelryPayPalPct: 0.029, ravelryPayPalFixed: 0.3, ravelryHighTier: false,
  channels: [{ id: 'etsy', label: 'Etsy', unitsPerMonth: 40, price: 6.5, offsiteAdsShare: 0.15, hasAudience: true }],
};

describe('MCP module-backed calculations', () => {
  it('rejects incomplete assumptions instead of applying hidden defaults', () => {
    const result = prepareMcpTakeRateCalculation({ calculation: { channels: calculation.channels } });
    expect(result.valid).toBe(false);
    expect(result.result).toBeUndefined();
    expect(result.issues.some(issue => issue.path === 'calculation.sellerRegion')).toBe(true);
  });

  it('returns the canonical take-rate engine result and supplied assumptions', () => {
    const result = prepareMcpTakeRateCalculation({ calculation });
    expect(result.valid).toBe(true);
    expect(result.input).toMatchObject({ sellerRegion: 'us', offsiteAdsRate: 0.15 });
    expect(result.result?.channels[0]).toMatchObject({ channel: 'etsy', revenue: 260 });
    expect(result.result?.totalNet).toBeGreaterThan(0);
    expect(result.caveats.join(' ')).toContain('canonical fee schedule');
  });
});
