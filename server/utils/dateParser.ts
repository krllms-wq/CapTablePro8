/**
 * Server-side date parsing utilities - migrated to use shared dateUtils
 * @deprecated Use shared/utils/dateUtils for consistent date handling
 */

import { toDateOnlyUTC as sharedToDateOnlyUTC, fromDateOnlyUTC } from '@shared/utils/dateUtils';

/**
 * Convert a date to date-only UTC format (YYYY-MM-DD)
 * @deprecated Use shared dateUtils.toDateOnlyUTC instead
 * @param dateInput - Date string, Date object, or ISO string
 * @returns Date object set to midnight UTC on the given date
 */
export function toDateOnlyUTC(dateInput: string | Date): Date {
  const dateStr = sharedToDateOnlyUTC(dateInput);
  return fromDateOnlyUTC(dateStr);
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