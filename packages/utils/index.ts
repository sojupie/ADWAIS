// Pure helper functions for the Motillo ADWAIS project

/** Format a revenue value (whole SEK) into a locale currency string */
export function formatCurrency(value: number, currency = 'SEK'): string {
  return new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

/** Compact number: 1 200 000 → "1,2M", 71 000 → "71k" */
export function formatCompact(value: number): string {
  return new Intl.NumberFormat('sv-SE', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

/** Format a number with thousand separators */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('sv-SE').format(value);
}

/**
 * Returns a signed percentage string, e.g. "+6.37%" or "-2.10%"
 * Used for PoP (Period-over-Period) display.
 */
export function formatPoP(pop: number): string {
  const sign = pop >= 0 ? '+' : '';
  return `${sign}${pop.toFixed(2)}%`;
}

/** True if PoP value is positive (used for colour coding) */
export function isPoPPositive(pop: number): boolean {
  return pop >= 0;
}

/** Format an ISO date string as "Day N" or short date */
export function formatDate(isoDate: string): string {
  const d = new Date(isoDate);
  return new Intl.DateTimeFormat('sv-SE', { month: 'short', day: 'numeric' }).format(d);
}

export { formatChartLabel, inferBinSize } from './formatChartLabel';
