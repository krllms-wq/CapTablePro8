/**
 * Date utilities for enforcing date-only UTC handling across the application
 * Ensures consistent date storage and retrieval without timezone issues
 */

/**
 * Convert any date input to a date-only UTC string (YYYY-MM-DD)
 * This ensures consistent storage regardless of user timezone
 */
export function toDateOnlyUTC(input: Date | string): string {
  if (typeof input === 'string') {
    // If it's already in YYYY-MM-DD format, assume it's the intended date
    if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
      return input;
    }
    // Otherwise parse as local date (e.g., from HTML date input)
    const [year, month, day] = input.split('-').map(Number);
    if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }
  
  const date = input instanceof Date ? input : new Date(input);
  
  // For Date objects, use local time components to prevent timezone shift
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Convert date-only string to UTC Date object at midnight
 * Ensures consistent parsing from stored date strings
 */
export function fromDateOnlyUTC(dateString: string): Date {
  // Parse as UTC to avoid timezone interpretation
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

/**
 * Get current date as date-only UTC string
 * Useful for default values and current date operations
 */
export function getCurrentDateUTC(): string {
  return toDateOnlyUTC(new Date());
}

/**
 * Validate if a string is a valid date-only format (YYYY-MM-DD)
 */
export function isValidDateOnlyFormat(dateString: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) return false;
  
  const date = fromDateOnlyUTC(dateString);
  return toDateOnlyUTC(date) === dateString;
}

/**
 * Compare two date-only strings (returns -1, 0, or 1)
 */
export function compareDateOnlyUTC(date1: string, date2: string): number {
  if (date1 < date2) return -1;
  if (date1 > date2) return 1;
  return 0;
}

/**
 * Add days to a date-only UTC string
 */
export function addDaysUTC(dateString: string, days: number): string {
  const date = fromDateOnlyUTC(dateString);
  date.setUTCDate(date.getUTCDate() + days);
  return toDateOnlyUTC(date);
}

/**
 * Calculate difference in days between two date-only strings
 */
export function daysDifferenceUTC(startDate: string, endDate: string): number {
  const start = fromDateOnlyUTC(startDate);
  const end = fromDateOnlyUTC(endDate);
  const diffTime = end.getTime() - start.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Format date-only string for display
 */
export function formatDateOnlyUTC(dateString: string, locale: string = 'en-US'): string {
  const date = fromDateOnlyUTC(dateString);
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC'
  });
}

/**
 * Transform date input for form handling - ensures consistent date-only format
 */
export function transformDateInput(input: Date | string | undefined): Date {
  console.log(`transformDateInput called with:`, input, typeof input);
  
  if (!input) {
    const defaultDate = new Date();
    console.log(`No input, using current date:`, defaultDate.toISOString());
    return defaultDate;
  }
  
  if (input instanceof Date) {
    console.log(`Already a Date object:`, input.toISOString());
    return input;
  }
  
  if (typeof input === 'string') {
    // Handle YYYY-MM-DD format (common from HTML date inputs)
    if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
      const result = new Date(input + 'T00:00:00.000Z');
      console.log(`Converted "${input}" to Date:`, result.toISOString());
      return result;
    }
    
    // Handle other date formats
    const parsed = new Date(input);
    if (isNaN(parsed.getTime())) {
      console.error(`Invalid date format: ${input}, using current date`);
      return new Date();
    }
    console.log(`Parsed "${input}" to Date:`, parsed.toISOString());
    return parsed;
  }
  
  console.error(`Expected date or string, got ${typeof input}:`, input, `using current date`);
  return new Date();
}

/**
 * Parse user date input with fallback handling
 * Specifically handles HTML date input (YYYY-MM-DD) to prevent timezone issues
 */
export function parseUserDateInput(input: string): string {
  if (!input.trim()) return getCurrentDateUTC();
  
  try {
    // If it's already in YYYY-MM-DD format (from HTML date input), use directly
    if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
      return input; // Don't parse through Date constructor to avoid timezone issues
    }
    
    // Handle other input formats by parsing and normalizing
    const parsed = new Date(input);
    if (isNaN(parsed.getTime())) {
      return getCurrentDateUTC();
    }
    return toDateOnlyUTC(parsed);
  } catch {
    return getCurrentDateUTC();
  }
}