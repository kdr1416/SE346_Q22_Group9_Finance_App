/**
 * Parse a money string to a positive integer.
 * Strips commas, dots, and spaces (common VND formatting).
 * Returns null if input is empty, non-numeric, zero, or negative.
 *
 * Examples:
 *   parseMoney('50000')     → 50000
 *   parseMoney('1,000,000') → 1000000
 *   parseMoney('1.000.000') → 1000000
 *   parseMoney('50 000')    → 50000
 *   parseMoney('123abc')    → null
 *   parseMoney('')          → null
 *   parseMoney('-500')      → null
 */
export function parseMoney(value) {
  if (!value || typeof value !== 'string') return null;
  const cleaned = value.replace(/[\s,.\u00a0]/g, '');
  if (cleaned === '' || !/^\d+$/.test(cleaned)) return null;
  const num = Number(cleaned);
  return num > 0 ? num : null;
}

/**
 * Validate a day of month (1-31).
 * Returns the day as integer, or null if invalid.
 */
export function isDayOfMonth(value) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > 31) return null;
  return n;
}

/**
 * Validate a month of year (1-12).
 * Returns the month as integer, or null if invalid.
 */
export function isMonth(value) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > 12) return null;
  return n;
}
