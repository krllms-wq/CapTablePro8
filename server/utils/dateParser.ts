/**
 * Utility functions for parsing and normalizing dates
 */

/**
 * Convert a date to date-only UTC format (YYYY-MM-DD)
 * @param dateInput - Date string, Date object, or ISO string
 * @returns Date object set to midnight UTC on the given date
 */
export function toDateOnlyUTC(dateInput: string | Date): Date {
  let date: Date;
  
  if (typeof dateInput === 'string') {
    // Handle various input formats
    if (dateInput.match(/^\d{4}-\d{2}$/)) {
      // YYYY-MM format, default to first day
      date = new Date(`${dateInput}-01T00:00:00.000Z`);
    } else if (dateInput.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // YYYY-MM-DD format
      date = new Date(`${dateInput}T00:00:00.000Z`);
    } else {
      // Try to parse as-is and extract date part
      const parsed = new Date(dateInput);
      if (isNaN(parsed.getTime())) {
        throw new Error(`Invalid date format: ${dateInput}`);
      }
      date = new Date(Date.UTC(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()));
    }
  } else {
    // Date object - convert to UTC date-only
    date = new Date(Date.UTC(dateInput.getFullYear(), dateInput.getMonth(), dateInput.getDate()));
  }
  
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${dateInput}`);
  }
  
  return date;
}

/**
 * Format a date for database storage (ISO string)
 * @param date - Date to format
 * @returns ISO string in UTC
 */
export function formatDateForDB(date: Date): string {
  return date.toISOString();
}

/**
 * Format a date for display (YYYY-MM-DD)
 * @param date - Date to format
 * @returns Date string in YYYY-MM-DD format
 */
export function formatDateForDisplay(date: Date): string {
  return date.toISOString().split('T')[0];
}