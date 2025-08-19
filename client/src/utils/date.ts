/**
 * Client-side date formatting utilities
 * Updated to use shared date-only UTC utilities for consistency
 */

import { 
  toDateOnlyUTC, 
  fromDateOnlyUTC, 
  formatDateOnlyUTC,
  isValidDateOnlyFormat 
} from '@shared/utils/dateUtils';

/**
 * Format date consistently for display
 * @param date - Date object, ISO string, or date-only string
 * @returns Formatted date string (MM/DD/YYYY)
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '';
  
  try {
    // If it's already a date-only string, use it directly
    if (typeof date === 'string' && isValidDateOnlyFormat(date)) {
      return formatDateOnlyUTC(date, 'en-US');
    }
    
    // Convert to date-only format first for consistency
    const dateOnly = toDateOnlyUTC(date);
    const d = fromDateOnlyUTC(dateOnly);
    
    return d.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit', 
      year: 'numeric'
    });
  } catch {
    return '';
  }
}

/**
 * Format date for input fields (YYYY-MM-DD)
 * @param date - Date object, ISO string, or date-only string
 * @returns Date string in YYYY-MM-DD format
 */
export function formatDateForInput(date: Date | string | null | undefined): string {
  if (!date) return '';
  
  try {
    return toDateOnlyUTC(date);
  } catch {
    return '';
  }
}

/**
 * Parse date from various formats
 * @param input - Date string or Date object
 * @returns Date object or null if invalid
 */
export function parseDate(input: string | Date | null | undefined): Date | null {
  if (!input) return null;
  
  const date = typeof input === 'string' ? new Date(input) : input;
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Format relative time (e.g., "2 days ago", "just now")
 * @param date - Date object or ISO string
 * @returns Relative time string
 */
export function formatRelativeTime(date: Date | string): string {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  
  const now = new Date();
  const diffInMs = now.getTime() - d.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  
  if (diffInMinutes < 1) return 'just now';
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
  if (diffInDays < 7) return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
  if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
  }
  if (diffInDays < 365) {
    const months = Math.floor(diffInDays / 30);
    return `${months} month${months === 1 ? '' : 's'} ago`;
  }
  
  const years = Math.floor(diffInDays / 365);
  return `${years} year${years === 1 ? '' : 's'} ago`;
}