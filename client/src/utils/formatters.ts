/**
 * Client-side formatting utilities for consistent number and date display
 */

/**
 * Sanitize money input by removing commas, dollar signs, and other symbols
 * @param value Input value from user
 * @returns Clean numeric string
 */
export function sanitizeMoneyInput(value: string): string {
  if (!value || typeof value !== 'string') {
    return '';
  }
  
  // Remove commas, dollar signs, spaces, and other currency symbols
  const cleaned = value
    .replace(/[$,\s]/g, '') // Remove $, commas, spaces
    .replace(/[^\d.-]/g, '') // Keep only digits, decimal point, and minus sign
    .trim();
  
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? '' : Math.max(0, parsed).toString(); // Enforce >= 0
}

/**
 * Sanitize shares input by removing commas and keeping integers
 * @param value Input value from user  
 * @returns Clean integer string
 */
export function sanitizeSharesInput(value: string): string {
  if (!value || typeof value !== 'string') {
    return '';
  }
  
  // Remove commas and spaces, keep only digits
  const cleaned = value
    .replace(/[,\s]/g, '') // Remove commas, spaces
    .replace(/[^\d]/g, '') // Keep only digits
    .trim();
  
  const parsed = parseInt(cleaned);
  return isNaN(parsed) ? '' : Math.max(0, parsed).toString(); // Enforce >= 0
}

/**
 * Format number for display with commas and proper decimal places
 * @param value Numeric value to format
 * @param decimals Number of decimal places (default: 2 for money, 0 for shares)
 * @returns Formatted string for display
 */
export function formatDisplayValue(value: string | number, decimals: number = 2): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) {
    return '';
  }
  
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

/**
 * Format money value for display with $ symbol and commas
 * @param value Numeric value to format
 * @returns Formatted string like "$1,000.00"
 */
export function formatMoney(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) {
    return '$0.00';
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(num);
}

/**
 * Format shares for display with commas (no decimals)
 * @param value Numeric value to format
 * @returns Formatted string like "1,000,000"
 */
export function formatShares(value: string | number): string {
  const num = typeof value === 'string' ? parseInt(value) : Math.floor(value);
  if (isNaN(num)) {
    return '0';
  }
  
  return new Intl.NumberFormat('en-US').format(num);
}

/**
 * Format date for display in YYYY-MM-DD format
 * @param date Date value to format
 * @returns Formatted date string
 */
export function formatDateForInput(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) {
    return '';
  }
  
  return d.toISOString().split('T')[0]; // Returns YYYY-MM-DD
}

/**
 * Create onBlur handler for money inputs
 * @param field React Hook Form field object
 * @returns onBlur handler function
 */
export function createMoneyBlurHandler(field: any) {
  return (e: React.FocusEvent<HTMLInputElement>) => {
    const sanitized = sanitizeMoneyInput(e.target.value);
    field.onChange(sanitized);
    e.target.value = formatDisplayValue(sanitized, 2);
  };
}

/**
 * Create onBlur handler for share inputs  
 * @param field React Hook Form field object
 * @returns onBlur handler function
 */
export function createSharesBlurHandler(field: any) {
  return (e: React.FocusEvent<HTMLInputElement>) => {
    const sanitized = sanitizeSharesInput(e.target.value);
    field.onChange(sanitized);
    e.target.value = formatDisplayValue(sanitized, 0);
  };
}