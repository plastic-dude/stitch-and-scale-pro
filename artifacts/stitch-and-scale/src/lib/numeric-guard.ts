/**
 * Numeric guard helpers (CHK-146, extended-audit E-02).
 *
 * Extended audit 2026-08-21 proved that non-finite math results (`NaN`,
 * `Infinity`) leak into user-facing prose and stat boxes across calculators
 * (wholesale breakeven "Sell Infinity copies", retention planner
 * "$NaN" cold-acquisition cost, ad break-even "∞" ROAS presented inside
 * a ranking that still names a "best paid channel" under invalid inputs).
 *
 * This module is the single, importable boundary-layer contract:
 *
 *   1. `safeNumber(n)` — normalizes a raw input to a usable number or null
 *      (null means "not a usable number"; the caller owns the fallback).
 *   2. `finite(v, fallback)` — display substitute for any computed result.
 *   3. `isFinitePositive(v)` / `isFiniteNonNegative(v)` — domain guards.
 *   4. `finiteNarrative(pieces, fallback)` — builds prose that refuses to
 *      stringify a non-finite value; a single non-finite piece replaces
 *      the whole sentence with the fallback instead of leaking "Infinity".
 *
 * Per-module math stays unchanged; surfaces consume these helpers at the
 * boundary between computation and rendering.
 */

export type FiniteNumber = number;

/** True when `n` is a real, usable number (not NaN / ±Infinity). */
export function isFiniteNumber(n: unknown): n is FiniteNumber {
  return typeof n === 'number' && Number.isFinite(n);
}

/** True when `n` is finite and strictly positive (denominators, counts...). */
export function isFinitePositive(n: unknown): boolean {
  return isFiniteNumber(n) && n > 0;
}

/** True when `n` is finite and non-negative (money floors, quantities...). */
export function isFiniteNonNegative(n: unknown): boolean {
  return isFiniteNumber(n) && n >= 0;
}

/**
 * Normalize a raw value (string input, empty field, NaN, undefined) into a
 * usable number, or `null` when it is unusable. `fallbackForMissing` is
 * applied ONLY when the value is genuinely absent/empty — never to repair
 * NaN or Infinity; those must surface as `null` so the caller can render
 * an explicit invalid state instead of silently substituting a number.
 */
export function safeNumber(
  raw: unknown,
  fallbackForMissing: number,
): FiniteNumber | null {
  if (raw === undefined || raw === null) return fallbackForMissing;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed === '') return fallbackForMissing;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (typeof raw !== 'number') return null;
  if (!Number.isFinite(raw)) return null;
  return raw;
}

/** Display substitute: `fallback` (default "—") when `v` is non-finite. */
export function finite(v: unknown, fallback = '—'): string {
  return isFiniteNumber(v) ? String(v) : fallback;
}

/** Currency display substitute, mirroring the app's `fmt$` shape. */
export function finiteMoney(
  v: unknown,
  fallback = '—',
  digits = 0,
): string {
  if (!isFiniteNumber(v)) return fallback;
  return v.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: digits,
  });
}

/**
 * Prose builder: each piece must be finite, otherwise the whole sentence
 * falls back to `invalidFallback` instead of stringifying `Infinity`/`NaN`.
 *
 *   const sentence = finiteNarrative(
 *     [`Sell`, volumeBreakeven, `copies direct at your`, yourRateFmt, `net.`],
 *     `No comparison available until your self-sell rate and quantities are real numbers.`,
 *   );
 */
export function finiteNarrative(
  pieces: unknown[],
  invalidFallback: string,
): string {
  if (pieces.some((p) => isFiniteNumber(p) === false && typeof p !== 'string' && p !== undefined)) {
    return invalidFallback;
  }
  return pieces
    .map((p) => (p === undefined ? '' : isFiniteNumber(p) ? String(p) : String(p)))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}
