/**
 * Domain utility functions for robust monetary representation in integer cents.
 * Prevents floating-point drift in arithmetic.
 */

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Format integer cents into USD currency string (e.g. 1250 -> "$12.50")
 */
export function formatCents(cents: number): string {
  if (!Number.isFinite(cents)) return "$0.00";
  return usdFormatter.format(cents / 100);
}

/**
 * Convert integer cents into a standard decimal string (e.g. 1250 -> "12.50")
 */
export function centsToDecimalString(cents: number): string {
  if (!Number.isFinite(cents)) return "0.00";
  return (cents / 100).toFixed(2);
}

/**
 * Parse a dollar string or number input into integer cents.
 * Handles inputs like "$12.50", "12.5", "100", "0.99".
 * Rejects negative values or invalid numbers (returns 0).
 */
export function parseCurrencyToCents(input: string | number): number {
  if (typeof input === "number") {
    if (!Number.isFinite(input) || input < 0) return 0;
    return Math.round(input * 100);
  }

  if (typeof input !== "string") return 0;

  // Clean string: remove '$', commas, whitespace
  const cleaned = input.replace(/[$,\s]/g, "");
  if (!cleaned) return 0;

  const parsed = parseFloat(cleaned);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;

  return Math.round(parsed * 100);
}

/**
 * Safely round an arbitrary number to integer cents.
 */
export function roundToCents(amount: number): number {
  if (!Number.isFinite(amount)) return 0;
  return Math.round(amount);
}
