/**
 * Utility functions for sanitizing and parsing numbers from user input
 */

/**
 * Sanitize a number string by removing commas, currency symbols, and whitespace
 * @param value - The value to sanitize (can be string or number)
 * @returns Sanitized numeric value
 */
export function sanitizeNumber(value: string | number): number {
  if (typeof value === 'number') {
    return value;
  }
  
  if (!value || typeof value !== 'string') {
    return 0;
  }
  
  // Remove commas, dollar signs, spaces, and other currency symbols
  const cleaned = value
    .replace(/[$,\s]/g, '') // Remove $, commas, spaces
    .replace(/[^\d.-]/g, '') // Keep only digits, decimal point, and minus sign
    .trim();
  
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : Math.max(0, parsed); // Enforce >= 0
}

/**
 * Sanitize a decimal string for database storage
 * @param value - The value to sanitize
 * @returns String representation suitable for decimal fields
 */
export function sanitizeDecimal(value: string | number): string {
  const num = sanitizeNumber(value);
  return num.toFixed(2);
}

/**
 * Format a number for user display with commas
 * @param value - The number to format
 * @returns Formatted string with commas
 */
export function formatNumber(value: number): string {
  return value.toLocaleString();
}

/**
 * Parse integer quantities (shares, options, etc.)
 * @param value - The value to parse
 * @returns Integer value
 */
export function sanitizeQuantity(value: string | number): number {
  const num = sanitizeNumber(value);
  return Math.floor(num); // Ensure integer
}