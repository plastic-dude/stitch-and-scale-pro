import { safeNum } from '@/lib/numeric-guard';

/** Return a positive finite base measurement, or null for invalid input. */
export function parsePositiveMeasurement(raw: string | number): number | null {
  const value = safeNum(raw, 0);
  return value > 0 && Number.isFinite(value) ? value : null;
}
