import { describe, expect, it } from 'vitest';
import { generateCSVTemplate, parseMeasurementsCSV } from './csv-import';
import { generateId } from './grading-engine';

function validRow(base: string): string {
  return `Body,Bust circumference,circumference,bust,${base},Exact,,,,`;
}

// The template carries 3 example rows, so an appended data row is row 5
// in the parser's 1-indexed error reporting.
function templateWith(base: string): string {
  return [generateCSVTemplate(), validRow(base)].join('\n');
}

describe('csv-import base-value integrity (CHK-144, audit 2026-08-21 F-01)', () => {
  it('rejects a negative base value with a positive-number error', () => {
    const r = parseMeasurementsCSV(templateWith('-5'));
    expect(r.errors.length).toBe(1);
    expect(r.errors[0]).toMatch(/Row 5/);
    expect(r.errors[0]).toMatch(/positive number/i);
  });

  it('rejects a zero base value', () => {
    const r = parseMeasurementsCSV(templateWith('0'));
    expect(r.errors.length).toBe(1);
    expect(r.errors[0]).toMatch(/positive number/i);
  });

  it('rejects a non-numeric base value', () => {
    const r = parseMeasurementsCSV(templateWith('abc'));
    expect(r.errors.length).toBe(1);
    expect(r.errors[0]).toMatch(/valid number/i);
  });

  it('rejects Infinity', () => {
    const r = parseMeasurementsCSV(templateWith('Infinity'));
    expect(r.errors.length).toBe(1);
    expect(r.errors[0]).toMatch(/positive number/i);
  });

  it('accepts a strictly positive base value alongside template examples', () => {
    const r = parseMeasurementsCSV(templateWith('45'));
    expect(r.errors).toHaveLength(0);
    expect(r.rows).toHaveLength(4);
    expect(r.rows[3].measurement.baseValue).toBe(45);
  });

  it('accepts fractional positive values', () => {
    const r = parseMeasurementsCSV(templateWith('45.75'));
    expect(r.errors).toHaveLength(0);
    expect(r.rows[3].measurement.baseValue).toBeCloseTo(45.75, 2);
  });

  it('handles generateId uniqueness (coverage for the id helpers)', () => {
    const a = generateId();
    const b = generateId();
    expect(a).not.toBe(b);
  });
});
