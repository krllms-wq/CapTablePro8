/**
 * Client-side number parsing and formatting utilities
 */

/**
 * Parse a number from a string, handling common formats
 * @param input - String that may contain numbers, commas, currency symbols
 * @returns Parsed number or NaN if invalid
 */
export function parseNumberLoose(input: string | number): number {
  if (typeof input === 'number') return input;
  if (!input || typeof input !== 'string') return NaN;
  
  // Remove common formatting: commas, dollar signs, spaces
  const cleaned = input.toString().replace(/[$,\s]/g, '').trim();
  return parseFloat(cleaned);
}

/**
 * Format shares quantity with commas
 * @param shares - Number of shares
 * @returns Formatted string
 */
export function formatShares(shares: number | string): string {
  const num = typeof shares === 'string' ? parseNumberLoose(shares) : shares;
  if (isNaN(num)) return '0';
  return Math.round(num).toLocaleString();
}

/**
 * Format money amount with currency symbol
 * @param amount - Money amount
 * @param currency - Currency symbol (default: '$')
 * @returns Formatted string
 */
export function formatMoney(amount: number | string, currency: string = '$'): string {
  const num = typeof amount === 'string' ? parseNumberLoose(amount) : amount;
  if (isNaN(num)) return `${currency}0`;
  
  return `${currency}${num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

/**
 * Format percentage with specified decimal places
 * @param value - Percentage value (already as percentage, e.g., 60.00 for 60%)
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number | string, decimals: number = 2): string {
  const num = typeof value === 'string' ? parseNumberLoose(value) : value;
  if (isNaN(num)) return '0%';
  
  // Server already returns percentages as numbers (60.00, not 0.60)
  // so we just need to add the % sign, no multiplication needed
  return `${num.toFixed(decimals)}%`;
}

/**
 * Parse quantity input (handles formatted strings)
 * @param input - Input string or number
 * @returns Integer quantity
 */
export function parseQuantity(input: string | number): number {
  const num = parseNumberLoose(input);
  return isNaN(num) ? 0 : Math.max(0, Math.round(num));
}

/**
 * Parse decimal input (handles formatted strings) 
 * @param input - Input string or number
 * @returns Decimal value
 */
export function parseDecimal(input: string | number): number {
  const num = parseNumberLoose(input);
  return isNaN(num) ? 0 : Math.max(0, num);
}