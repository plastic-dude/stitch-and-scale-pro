import { describe, expect, it } from 'vitest';
import {
  invalidFields,
  invalidSummary,
  isInputValid,
  validateField,
  validateInputs,
  type FieldSpec,
} from './validate-field';

const specs = {
  price: { type: 'money' as const, label: 'Pattern price' },
  cpc: { type: 'rate' as const, label: 'CPC' },
  ctr: { type: 'percent' as const, label: 'Click rate' },
  conv: { type: 'ratio' as const, label: 'Conversion' },
  units: { type: 'count' as const, label: 'Units' },
  weeks: { type: 'duration' as const, label: 'Weeks' },
  perUnit: { type: 'positive-denom' as const, label: 'Per unit' },
  gauge: { type: 'positive' as const, label: 'Gauge' },
  launchDate: { type: 'date-iso' as const, label: 'Launch date', notBefore: '2026-01-01' },
  name: { type: 'string' as const, label: 'Name', minLength: 2 },
} as const;

describe('validateField — money', () => {
  it.each([0, 9.99, 1e6])('accepts plausible money %s', (v) => {
    expect(validateField(specs.price, v, 'price').ok).toBe(true);
  });
  it('rejects negative', () => {
    expect(validateField(specs.price, -1, 'price').code).toBe('negative');
  });
  it('rejects implausible money above default ceiling 1e9', () => {
    expect(validateField(specs.price, 2e12, 'price').code).toBe('money-implausible');
  });
  it('respects custom maxMoney', () => {
    const s: FieldSpec = { type: 'money', maxMoney: 100 };
    expect(validateField(s, 101, 'x').code).toBe('money-implausible');
    expect(validateField(s, 100, 'x').ok).toBe(true);
    const unlimited: FieldSpec = { type: 'money', maxMoney: Infinity };
    expect(validateField(unlimited, 1e15, 'x').ok).toBe(true);
  });
});

describe('validateField — percent / ratio', () => {
  it('accepts boundaries 0/100 for percent', () => {
    expect(validateField(specs.ctr, 0, 'ctr').ok).toBe(true);
    expect(validateField(specs.ctr, 100, 'ctr').ok).toBe(true);
  });
  it('rejects percent outside 0..100', () => {
    expect(validateField(specs.ctr, 150, 'ctr').code).toBe('out-of-percent-range');
    expect(validateField(specs.ctr, -1, 'ctr').code).toBe('out-of-percent-range');
  });
  it('enforces ratio 0..1', () => {
    expect(validateField(specs.conv, 1, 'conv').ok).toBe(true);
    expect(validateField(specs.conv, 1.01, 'conv').code).toBe('out-of-ratio-range');
  });
});

describe('validateField — count / duration / positive-denom / positive', () => {
  it('count requires non-negative integer', () => {
    expect(validateField(specs.units, 0, 'units').ok).toBe(true);
    expect(validateField(specs.units, 3.5, 'units').code).toBe('not-integer');
    expect(validateField(specs.units, -1, 'units').code).toBe('negative');
  });
  it('duration requires non-negative integer', () => {
    expect(validateField(specs.weeks, 0, 'weeks').ok).toBe(true);
    expect(validateField(specs.weeks, 2.2, 'weeks').code).toBe('not-integer');
  });
  it('positive-denom rejects zero and negative', () => {
    expect(validateField(specs.perUnit, 0, 'perUnit').code).toBe('not-positive');
    expect(validateField(specs.perUnit, -2, 'perUnit').code).toBe('not-positive');
    expect(validateField(specs.perUnit, 0.001, 'perUnit').ok).toBe(true);
  });
  it('positive rejects zero', () => {
    expect(validateField(specs.gauge, 0, 'gauge').code).toBe('not-positive');
    expect(validateField(specs.gauge, 22.5, 'gauge').ok).toBe(true);
  });
});

describe('validateField — date-iso and string', () => {
  it('rejects garbage dates', () => {
    expect(validateField(specs.launchDate, 'nope', 'launchDate').code).toBe('invalid-date');
  });
  it('enforces chronological order vs notBefore', () => {
    expect(validateField(specs.launchDate, '2025-12-31', 'launchDate').code).toBe(
      'date-not-chronological',
    );
    expect(validateField(specs.launchDate, '2026-06-01', 'launchDate').ok).toBe(true);
  });
  it('string requires non-empty trimmed value with minLength', () => {
    expect(validateField(specs.name, '', 'name').code).toBe('empty-string');
    expect(validateField(specs.name, 'a', 'name').code).toBe('empty-string');
    expect(validateField(specs.name, '  ', 'name').code).toBe('empty-string');
    expect(validateField(specs.name, 'Abc', 'name').ok).toBe(true);
  });
});

describe('validateField — NaN/Infinity and emptiness', () => {
  it('rejects NaN and Infinity for numeric types', () => {
    expect(validateField(specs.price, NaN, 'price').code).toBe('not-a-number');
    expect(validateField(specs.price, Infinity, 'price').code).toBe('not-a-number');
    expect(validateField(specs.price, -Infinity, 'price').code).toBe('not-a-number');
  });
  it('rejects missing required fields', () => {
    expect(validateField(specs.price, '', 'price').code).toBe('missing-required');
    expect(validateField(specs.price, undefined, 'price').code).toBe('missing-required');
    expect(validateField(specs.price, '   ', 'price').code).toBe('missing-required');
  });
  it('allows missing when required=false', () => {
    const opt: FieldSpec = { type: 'money', required: false };
    expect(validateField(opt, '', 'x').ok).toBe(true);
    expect(validateField(opt, undefined, 'x').ok).toBe(true);
    expect(validateField(opt, -5, 'x').code).toBe('negative'); // invalid value still fails
  });
  it('explicit min/max bounds apply after type semantics', () => {
    const s: FieldSpec = { type: 'count', min: 5, max: 20 };
    expect(validateField(s, 4, 'x').code).toBe('below-min');
    expect(validateField(s, 21, 'x').code).toBe('above-max');
    expect(validateField(s, 5, 'x').ok).toBe(true);
    expect(validateField(s, 20, 'x').ok).toBe(true);
  });
});

describe('validateInputs batch', () => {
  it('validates every field and returns definition order', () => {
    const r = validateInputs(specs, {
      price: 9.99,
      cpc: 0.3,
      ctr: 2,
      conv: 0.02,
      units: 500,
      weeks: 4,
      perUnit: 0.5,
      gauge: 22,
      launchDate: '2026-08-01',
      name: 'Sweater',
    });
    expect(r).toHaveLength(Object.keys(specs).length);
    expect(r.map((v) => v.ok).every(Boolean)).toBe(true);
  });

  it('isInputValid / invalidFields / invalidSummary agree', () => {
    const r = validateInputs(specs, {
      price: -5,
      cpc: 0.3,
      ctr: 200,
      conv: 0.02,
      units: 500,
      weeks: 4,
      perUnit: 0.5,
      gauge: 22,
      launchDate: '2026-08-01',
      name: 'Sweater',
    });
    expect(isInputValid(r)).toBe(false);
    expect(invalidFields(r)).toHaveLength(2);
    expect(invalidSummary(r)).toContain('Pattern price');
    expect(invalidSummary(r)).toContain('Click rate');
  });
});
