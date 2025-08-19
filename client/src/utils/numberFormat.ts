/**
 * Client-side number formatting and sanitization utilities
 */

/**
 * Sanitize user input for numbers (remove commas, currency symbols)
 * @param value - Input value from form field
 * @returns Clean numeric string
 */
export function sanitizeNumberInput(value: string): string {
  if (!value || typeof value !== 'string') {
    return '';
  }
  
  // Remove commas, dollar signs, spaces, and other currency symbols
  return value
    .replace(/[$,\s]/g, '') // Remove $, commas, spaces
    .replace(/[^\d.-]/g, '') // Keep only digits, decimal point, and minus sign
    .trim();
}

/**
 * Format number for display with commas
 * @param value - Number to format
 * @returns Formatted string with commas
 */
export function formatNumber(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0';
  return num.toLocaleString();
}

/**
 * Handle number input change with automatic formatting
 * @param value - Raw input value
 * @param onChange - Callback with sanitized value
 * @returns Display value for the input field
 */
export function handleNumberInput(value: string, onChange: (sanitized: string) => void): string {
  const sanitized = sanitizeNumberInput(value);
  onChange(sanitized);
  
  // Return formatted value for display while editing
  const num = parseFloat(sanitized);
  if (isNaN(num)) return '';
  return formatNumber(num);
}

/**
 * Parse and validate quantity input (integer shares, options, etc.)
 * @param value - Input value
 * @returns Integer quantity
 */
export function parseQuantity(value: string | number): number {
  const sanitized = typeof value === 'string' ? sanitizeNumberInput(value) : value.toString();
  const parsed = parseInt(sanitized);
  return isNaN(parsed) ? 0 : Math.max(0, parsed);
}

/**
 * Parse and validate decimal input (prices, valuations, etc.)
 * @param value - Input value  
 * @returns Decimal value
 */
export function parseDecimal(value: string | number): number {
  const sanitized = typeof value === 'string' ? sanitizeNumberInput(value) : value.toString();
  const parsed = parseFloat(sanitized);
  return isNaN(parsed) ? 0 : Math.max(0, parsed);
}