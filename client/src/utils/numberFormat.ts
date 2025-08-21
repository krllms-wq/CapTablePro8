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
 * Format number for display with spaces as thousands separator and dots for decimals
 * @param value - Number to format
 * @returns Formatted string with spaces
 */
export function formatNumber(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '';
  // Use French locale for space thousands separator, then replace comma with dot for decimal
  return num.toLocaleString('fr-FR', { maximumFractionDigits: 2 }).replace(',', '.');
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
 * @returns Integer quantity or undefined if invalid
 */
export function parseQuantity(value: string | number): number | undefined {
  if (value === '' || value === null || value === undefined) return undefined;
  const sanitized = typeof value === 'string' ? sanitizeNumberInput(value) : value.toString();
  if (sanitized === '') return undefined;
  const parsed = parseInt(sanitized);
  return isNaN(parsed) ? undefined : Math.max(0, parsed);
}

/**
 * Parse and validate decimal input (prices, valuations, etc.)
 * @param value - Input value  
 * @returns Decimal value or undefined if invalid
 */
export function parseDecimal(value: string | number): number | undefined {
  if (value === '' || value === null || value === undefined) return undefined;
  const sanitized = typeof value === 'string' ? sanitizeNumberInput(value) : value.toString();
  if (sanitized === '') return undefined;
  const parsed = parseFloat(sanitized);
  return isNaN(parsed) ? undefined : Math.max(0, parsed);
}