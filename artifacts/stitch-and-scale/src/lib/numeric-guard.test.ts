import { describe, it, expect } from 'vitest';
import {
  isFiniteNumber,
  isFinitePositive,
  isFiniteNonNegative,
  safeNumber,
  finite,
  finiteMoney,
  finiteNarrative,
} from './numeric-guard';

describe('numeric-guard boundary helpers (CHK-146)', () => {
  describe('isFiniteNumber / isFinitePositive / isFiniteNonNegative', () => {
    it('accepts normal numbers', () => {
      expect(isFiniteNumber(42)).toBe(true);
      expect(isFiniteNumber(0)).toBe(true);
      expect(isFiniteNumber(-3.5)).toBe(true);
      expect(isFiniteNumber(1e-9)).toBe(true);
    });
    it('rejects NaN and Infinity variants', () => {
      expect(isFiniteNumber(NaN)).toBe(false);
      expect(isFiniteNumber(Infinity)).toBe(false);
      expect(isFiniteNumber(-Infinity)).toBe(false);
    });
    it('rejects non-numbers', () => {
      expect(isFiniteNumber('7')).toBe(false);
      expect(isFiniteNumber(undefined)).toBe(false);
      expect(isFiniteNumber(null)).toBe(false);
    });
    it('domain guards behave', () => {
      expect(isFinitePositive(1)).toBe(true);
      expect(isFinitePositive(0)).toBe(false);
      expect(isFinitePositive(-1)).toBe(false);
      expect(isFinitePositive(Infinity)).toBe(false);
      expect(isFiniteNonNegative(0)).toBe(true);
      expect(isFiniteNonNegative(-0.5)).toBe(false);
    });
  });

  describe('safeNumber', () => {
    it('passes valid numbers through', () => {
      expect(safeNumber(5, 0)).toBe(5);
    });
    it('uses the missing fallback only for absent/empty values', () => {
      expect(safeNumber(undefined, 0)).toBe(0);
      expect(safeNumber(null, 10)).toBe(10);
      expect(safeNumber('', 0)).toBe(0);
      expect(safeNumber('   ', 4)).toBe(4);
    });
    it('refuses to silently repair NaN or Infinity', () => {
      expect(safeNumber(NaN, 0)).toBeNull();
      expect(safeNumber(Infinity, 0)).toBeNull();
      expect(safeNumber(-Infinity, 0)).toBeNull();
    });
    it('refuses unparseable strings', () => {
      expect(safeNumber('abc', 0)).toBeNull();
      expect(safeNumber('1,000', 0)).toBeNull();
    });
    it('parses plain numeric strings', () => {
      expect(safeNumber('3.5', 0)).toBe(3.5);
    });
  });

  describe('finite / finiteMoney', () => {
    it('stringifies finite values', () => {
      expect(finite(3)).toBe('3');
      expect(finite(0)).toBe('0');
    });
    it('renders the fallback for non-finite values', () => {
      expect(finite(NaN)).toBe('—');
      expect(finite(Infinity)).toBe('—');
      expect(finite(-Infinity)).toBe('—');
      expect(finite('oops')).toBe('—');
      expect(finite(NaN, 'Unavailable')).toBe('Unavailable');
    });
    it('formats currency and falls back on non-finite', () => {
      expect(finiteMoney(1200)).toBe('$1,200');
      expect(finiteMoney(1.234, '—', 2)).toBe('$1.23');
      expect(finiteMoney(NaN)).toBe('—');
      expect(finiteMoney(Infinity)).toBe('—');
    });
  });

  describe('finiteNarrative', () => {
    it('joins finite pieces normally', () => {
      const s = finiteNarrative(['Sell', 42, 'copies at', '$8'], 'fallback');
      expect(s).toBe('Sell 42 copies at $8');
    });
    it('collapses extra whitespace', () => {
      const s = finiteNarrative(['Sell', 42, '', 'copies'], 'fallback');
      expect(s).toBe('Sell 42 copies');
    });
    it('replaces the whole sentence when any value is non-finite', () => {
      expect(finiteNarrative(['Sell', Infinity, 'copies'], 'No comparison available.')).toBe(
        'No comparison available.',
      );
      expect(finiteNarrative(['Cost', NaN, 'per unit'], 'No comparison available.')).toBe(
        'No comparison available.',
      );
    });
    it('does not confuse a literal string "Infinity" with the number', () => {
      const s = finiteNarrative(['Note: Infinity is the ceiling'], 'fallback');
      expect(s).toBe('Note: Infinity is the ceiling');
    });
  });
});
