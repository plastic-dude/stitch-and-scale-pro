import { describe, expect, it } from 'vitest';
import { parsePositiveMeasurement } from './measurement-validation';

describe('parsePositiveMeasurement', () => {
  it('preserves a valid 40-inch input without truncation or scaling', () => {
    expect(parsePositiveMeasurement('40')).toBe(40);
    expect(parsePositiveMeasurement('40.125')).toBe(40.125);
  });

  it('rejects empty, malformed, non-finite, zero, and negative values', () => {
    expect(parsePositiveMeasurement('')).toBeNull();
    expect(parsePositiveMeasurement('not-a-measurement')).toBeNull();
    expect(parsePositiveMeasurement(NaN)).toBeNull();
    expect(parsePositiveMeasurement(Infinity)).toBeNull();
    expect(parsePositiveMeasurement('0')).toBeNull();
    expect(parsePositiveMeasurement('-4')).toBeNull();
  });
});
