export type DateTimeValue = Date | string | number | null | undefined;

/** Formats a date/time value, returning an empty string when it is missing or invalid. */
export function formatDateTime(
  value: DateTimeValue,
  options: Intl.DateTimeFormatOptions = {},
  locales?: string | string[],
): string {
  if (value === null || value === undefined || value === '') return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(locales, options).format(date);
}
