/**
 * Date handling utilities to prevent timezone offset bugs
 */

/**
 * Convert a Date object to ISO string in UTC, stripped of time
 * Prevents day-offset bugs when sending dates to API
 */
export function dateToISOString(date: Date | null | undefined): string | null {
  if (!date) return null;
  
  // Create a new date in UTC with the same year/month/day
  const utcDate = new Date(Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    0, 0, 0, 0
  ));
  
  return utcDate.toISOString();
}

/**
 * Parse an ISO date string to a Date object
 * Handles both full ISO strings and date-only strings
 */
export function parseISODate(isoString: string | null | undefined): Date | null {
  if (!isoString) return null;
  
  try {
    // Handle date-only strings (YYYY-MM-DD)
    if (isoString.length === 10) {
      const [year, month, day] = isoString.split('-').map(Number);
      return new Date(year, month - 1, day); // month is 0-indexed
    }
    
    // Handle full ISO strings
    return new Date(isoString);
  } catch {
    return null;
  }
}

/**
 * Format a date for display
 */
export function formatDate(
  date: Date | string | null | undefined,
  options: Intl.DateTimeFormatOptions = {}
): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? parseISODate(date) : date;
  if (!dateObj) return '';
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  };
  
  return dateObj.toLocaleDateString('en-US', defaultOptions);
}

/**
 * Get today's date as a Date object (local time)
 */
export function today(): Date {
  return new Date();
}

/**
 * Check if a date is valid
 */
export function isValidDate(date: any): date is Date {
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Create a date from year, month, day (local time)
 */
export function createDate(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day); // month is 0-indexed
}

/**
 * Get the start of today (00:00:00 local time)
 */
export function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/**
 * Calculate difference in days between two dates
 */
export function daysBetween(start: Date, end: Date): number {
  const diffTime = end.getTime() - start.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calculate difference in months between two dates
 */
export function monthsBetween(start: Date, end: Date): number {
  const yearDiff = end.getFullYear() - start.getFullYear();
  const monthDiff = end.getMonth() - start.getMonth();
  return yearDiff * 12 + monthDiff;
}