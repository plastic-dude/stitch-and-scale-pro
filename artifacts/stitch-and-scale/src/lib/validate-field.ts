/**
 * validate-field.ts — shared semantic validation layer (QUEUE-012 / extended audit E-01).
 *
 * One typed, pure, locale-independent validator consumed by every calculator.
 * Central gate: **no calculated recommendation may be derived from invalid input**.
 *
 * Domain rules (from the extended audit's validation-policy):
 *  - money      — non-negative currency amount (default ceiling 1e9 to catch typos like 1e12)
 *  - rate       — non-negative money-per-unit rate
 *  - percent    — 0..100 inclusive (rates like CTR/conversion stay as 0..1 on `ratio`)
 *  - ratio      — 0..1 inclusive fraction
 *  - count      — non-negative integer (yarn yards, units, people, orders)
 *  - duration   — non-negative whole number (days, weeks, months)
 *  - positive-denom — strictly positive (divisor/denominator guard)
 *  - positive   — strictly positive general number (prices above zero, gauge numbers)
 *  - date-iso   — ISO date string, must be chronological vs a reference
 *  - string     — non-empty trimmed label/name
 *
 * Usage per module:
 *   const errors = validateInputs(SPECS, input);
 *   if (!isInputValid(errors)) return quarantinedResult(errors);
 *   // ... compute freely; every numeric output still passes through numeric-guard
 *      (finiteOr / finiteNarrative) before rendering.
 */

export type FieldType =
  | 'money'
  | 'rate'
  | 'percent'
  | 'ratio'
  | 'count'
  | 'duration'
  | 'positive-denom'
  | 'positive'
  | 'date-iso'
  | 'string';

export interface FieldSpec {
  type: FieldType;
  /** Field is required; empty/missing values fail (default true). */
  required?: boolean;
  /** Explicit lower bound (>=). Overrides the type default when given. */
  min?: number;
  /** Explicit upper bound (<=). */
  max?: number;
  /** For `string`: minimum trimmed length. */
  minLength?: number;
  /** Ceiling for money fields (default 1e9). Set to Infinity to disable. */
  maxMoney?: number;
  /** For `date-iso`: reference date the value must be >= (chronological). */
  notBefore?: string;
  /** Human label used in error messages (fallback: field key). */
  label?: string;
}

export interface ValidationResult {
  field: string;
  ok: boolean;
  code:
    | 'valid'
    | 'missing-required'
    | 'not-a-number'
    | 'negative'
    | 'not-positive'
    | 'below-min'
    | 'above-max'
    | 'not-integer'
    | 'out-of-percent-range'
    | 'out-of-ratio-range'
    | 'empty-string'
    | 'invalid-date'
    | 'date-not-chronological'
    | 'money-implausible';
  message: string;
}

export const VALID: ValidationResult = {
  field: '',
  ok: true,
  code: 'valid',
  message: '',
};

const DEFAULT_MAX_MONEY = 1e9;

function labelOf(field: string, spec: FieldSpec): string {
  return spec.label ?? field;
}

/**
 * Validates a single raw value (string from an <input> or raw number) against a spec.
 * Empty/whitespace-only is only allowed when required === false.
 */
export function validateField(spec: FieldSpec, raw: unknown, field: string): ValidationResult {
  const L = labelOf(field, spec);
  const required = spec.required ?? true;

  const rawString = typeof raw === 'string' ? raw : raw === undefined || raw === null ? '' : String(raw);
  const isTrulyEmpty = raw === undefined || raw === null || rawString.trim() === '';
  if (isTrulyEmpty) {
    // A string field with minLength was genuinely supplied-but-empty when the raw value
    // is a non-null string; report the specific emptiness failure, not a generic required one.
    if (spec.type === 'string' && typeof raw === 'string' && raw.trim() === '') {
      return { field, ok: false, code: 'empty-string', message: `${L} must not be empty.` };
    }
    return required
      ? { field, ok: false, code: 'missing-required', message: `${L} is required.` }
      : VALID;
  }

  let num: number | undefined;
  if (spec.type === 'string') {
    const s = rawString.trim();
    if (s.length < (spec.minLength ?? 1)) {
      return { field, ok: false, code: 'empty-string', message: `${L} must not be empty.` };
    }
    return VALID;
  }

  if (spec.type === 'date-iso') {
    const s = typeof raw === 'string' ? raw.trim() : String(raw).trim();
    const d = Date.parse(s);
    if (Number.isNaN(d)) {
      return { field, ok: false, code: 'invalid-date', message: `${L} is not a valid date.` };
    }
    if (spec.notBefore) {
      const ref = Date.parse(spec.notBefore);
      if (!Number.isNaN(ref) && d < ref) {
        return {
          field,
          ok: false,
          code: 'date-not-chronological',
          message: `${L} must be on or after ${spec.notBefore}.`,
        };
      }
    }
    return VALID;
  }

  num = typeof raw === 'number' ? raw : Number(String(raw).trim());
  if (!Number.isFinite(num)) {
    return { field, ok: false, code: 'not-a-number', message: `${L} must be a valid number.` };
  }

  switch (spec.type) {
    case 'percent':
      if (num < 0 || num > 100) {
        return {
          field,
          ok: false,
          code: 'out-of-percent-range',
          message: `${L} must be between 0 and 100.`,
        };
      }
      return VALID;
    case 'ratio':
      if (num < 0 || num > 1) {
        return {
          field,
          ok: false,
          code: 'out-of-ratio-range',
          message: `${L} must be between 0 and 1.`,
        };
      }
      return VALID;
    case 'count':
    case 'duration':
      if (num < 0) {
        return { field, ok: false, code: 'negative', message: `${L} cannot be negative.` };
      }
      if (!Number.isInteger(num)) {
        return { field, ok: false, code: 'not-integer', message: `${L} must be a whole number.` };
      }
      break;
    case 'positive-denom':
      if (num <= 0) {
        return {
          field,
          ok: false,
          code: 'not-positive',
          message: `${L} must be greater than zero.`,
        };
      }
      break;
    case 'positive':
      if (num <= 0) {
        return {
          field,
          ok: false,
          code: 'not-positive',
          message: `${L} must be greater than zero.`,
        };
      }
      break;
    case 'money': {
      if (num < 0) {
        return { field, ok: false, code: 'negative', message: `${L} cannot be negative.` };
      }
      const ceiling = spec.maxMoney ?? DEFAULT_MAX_MONEY;
      if (ceiling !== Infinity && num > ceiling) {
        return {
          field,
          ok: false,
          code: 'money-implausible',
          message: `${L} looks implausibly large (above ${ceiling.toLocaleString('en-US')}).`,
        };
      }
      break;
    }
    case 'rate':
      if (num < 0) {
        return { field, ok: false, code: 'negative', message: `${L} cannot be negative.` };
      }
      break;
    default:
      break;
  }

  // Explicit bounds (applied after type semantics so min=0 does not double-error negatives).
  if (spec.min !== undefined && num < spec.min) {
    return { field, ok: false, code: 'below-min', message: `${L} must be at least ${spec.min}.` };
  }
  if (spec.max !== undefined && num > spec.max) {
    return { field, ok: false, code: 'above-max', message: `${L} must be at most ${spec.max}.` };
  }
  return VALID;
}

export type FieldSpecMap<T> = Record<keyof T, FieldSpec>;

/**
 * Validates every field of an input object against its spec map.
 * Returns a result per field, in definition order.
 */
export function validateInputs<T extends Record<string, unknown>>(
  specs: FieldSpecMap<T>,
  input: T,
): ValidationResult[] {
  return (Object.keys(specs) as Array<keyof T>).map((key) =>
    validateField(specs[key], input[key], String(key)),
  );
}

export function isInputValid(results: ValidationResult[]): boolean {
  return results.every((r) => r.ok);
}

export function invalidFields(results: ValidationResult[]): ValidationResult[] {
  return results.filter((r) => !r.ok);
}

/**
 * Human-readable summary of invalid fields, joined by newline.
 * Empty string when all valid.
 */
export function invalidSummary(results: ValidationResult[]): string {
  return invalidFields(results)
    .map((r) => r.message)
    .join('\n');
}
