/**
 * Client-side date formatting utilities
 */

/**
 * Convert date input to date-only UTC format for server
 * @param dateInput - Date string, Date object, or picker value
 * @returns ISO string for date-only UTC
 */
export function toDateOnlyUTC(dateInput: string | Date): string {
  let date: Date;
  
  if (typeof dateInput === 'string') {
    // Handle various input formats
    if (dateInput.match(/^\d{4}-\d{2}$/)) {
      // YYYY-MM format from month picker, default to first day
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
  
  return date.toISOString();
}

/**
 * Format date for display in forms (YYYY-MM-DD)
 * @param date - Date to format
 * @returns Date string in YYYY-MM-DD format
 */
export function formatDateForInput(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
}

/**
 * Format date for display to users
 * @param date - Date to format
 * @returns Human-readable date string
 */
export function formatDateForDisplay(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return 'Invalid Date';
  return d.toLocaleDateString();
}