import { describe, it, expect } from 'vitest';
import { gridRowToDef } from './chart-lab';

describe('gridRowToDef', () => {
  it('compresses a row of symbols correctly', () => {
    const cells = ['knit', 'knit', 'purl', 'yo', 'yo', 'knit'];
    const def = gridRowToDef(0, cells);
    
    expect(def.row).toBe(1);
    expect(def.symbols).toEqual([
      { symbolId: 'knit', count: 2 },
      { symbolId: 'purl', count: 1 },
      { symbolId: 'yo', count: 2 },
      { symbolId: 'knit', count: 1 }
    ]);
  });

  it('handles empty rows', () => {
    const def = gridRowToDef(5, []);
    expect(def.row).toBe(6);
    expect(def.symbols).toEqual([]);
  });

  it('handles single symbol rows', () => {
    const def = gridRowToDef(2, ['purl', 'purl', 'purl']);
    expect(def.symbols).toEqual([{ symbolId: 'purl', count: 3 }]);
  });
});
