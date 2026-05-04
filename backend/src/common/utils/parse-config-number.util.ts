/**
 * Parses numeric configuration values from env/config with validation.
 * Missing/invalid strings yield the default; values are clamped to bounds.
 */

function coerceToNumber(raw: unknown): number {
  if (raw === undefined || raw === null) {
    return NaN;
  }
  if (typeof raw === 'number') {
    return raw;
  }
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed === '') {
      return NaN;
    }
    return Number(trimmed);
  }
  return Number(raw);
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/**
 * Integer settings (Prisma take/skip, counts). Non-finite input uses defaultValue.
 */
export function parseConfigInt(
  raw: unknown,
  defaultValue: number,
  bounds: { min: number; max: number },
): number {
  const n = coerceToNumber(raw);
  const base = Number.isFinite(n) ? Math.trunc(n) : defaultValue;
  return clamp(base, bounds.min, bounds.max);
}

/**
 * Floating-point settings (scores, thresholds). Non-finite input uses defaultValue.
 */
export function parseConfigFloat(
  raw: unknown,
  defaultValue: number,
  bounds: { min: number; max: number },
): number {
  const n = coerceToNumber(raw);
  const base = Number.isFinite(n) ? n : defaultValue;
  return clamp(base, bounds.min, bounds.max);
}
