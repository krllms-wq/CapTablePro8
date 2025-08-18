/**
 * Currency and number parsing utilities
 * Sanitizes user input to extract clean numeric values
 */

/**
 * Parse user-friendly number input (with commas, currency symbols, etc.)
 * Examples:
 * - "$1,234,567.89" -> 1234567.89
 * - "10,000,000" -> 10000000
 * - "1.5M" -> 1500000
 * - "2.3K" -> 2300
 */
export function parseCurrency(input: string | number): number {
  if (typeof input === 'number') return input;
  if (!input || typeof input !== 'string') return 0;

  // Remove currency symbols, spaces, and common prefixes
  let cleaned = input
    .replace(/[$€£¥₹₽¢]/g, '') // Currency symbols
    .replace(/[,\s]/g, '') // Commas and spaces
    .replace(/[()]/g, '') // Parentheses
    .trim();

  // Handle negative numbers in parentheses (accounting format)
  const isNegative = input.includes('(') && input.includes(')');

  // Handle K/M/B suffixes
  const multipliers: Record<string, number> = {
    k: 1000,
    m: 1000000,
    b: 1000000000,
    t: 1000000000000
  };

  const lastChar = cleaned.slice(-1).toLowerCase();
  if (lastChar in multipliers) {
    const number = parseFloat(cleaned.slice(0, -1));
    if (!isNaN(number)) {
      const result = number * multipliers[lastChar];
      return isNegative ? -result : result;
    }
  }

  // Parse as regular number
  const number = parseFloat(cleaned);
  if (isNaN(number)) return 0;

  return isNegative ? -number : number;
}

/**
 * Parse percentage input (converts to decimal)
 * Examples:
 * - "8%" -> 0.08
 * - "8" -> 0.08
 * - "0.08" -> 0.08
 */
export function parsePercentage(input: string | number): number {
  if (typeof input === 'number') {
    // If already a decimal (< 1), return as-is, otherwise convert
    return input <= 1 ? input : input / 100;
  }

  if (!input || typeof input !== 'string') return 0;

  const cleaned = input.replace(/[%\s]/g, '').trim();
  const number = parseFloat(cleaned);
  
  if (isNaN(number)) return 0;

  // If the input had a % symbol or is > 1, treat as percentage
  const hasPercent = input.includes('%');
  const shouldConvert = hasPercent || number > 1;
  
  return shouldConvert ? number / 100 : number;
}

/**
 * Validate and sanitize numeric input
 */
export function sanitizeNumericInput(
  input: string | number,
  options: {
    allowNegative?: boolean;
    maxDecimals?: number;
    min?: number;
    max?: number;
  } = {}
): number {
  const {
    allowNegative = true,
    maxDecimals = 2,
    min,
    max
  } = options;

  let value = parseCurrency(input);

  // Handle negative values
  if (!allowNegative && value < 0) {
    value = Math.abs(value);
  }

  // Round to specified decimal places
  if (maxDecimals >= 0) {
    const factor = Math.pow(10, maxDecimals);
    value = Math.round(value * factor) / factor;
  }

  // Apply min/max constraints
  if (typeof min === 'number') {
    value = Math.max(value, min);
  }
  if (typeof max === 'number') {
    value = Math.min(value, max);
  }

  return value;
}

/**
 * Format input for display while typing (progressive formatting)
 */
export function formatInputValue(value: string, type: 'currency' | 'number' | 'percentage' = 'number'): string {
  if (!value) return '';

  // Parse the current value
  const numValue = type === 'percentage' 
    ? parsePercentage(value) * 100 
    : parseCurrency(value);

  if (isNaN(numValue)) return value;

  // Format based on type
  switch (type) {
    case 'currency':
      return numValue.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      });
    case 'percentage':
      return numValue.toString();
    default:
      return numValue.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 6
      });
  }
}

/**
 * Get example text for input placeholders
 */
export function getInputExample(type: 'currency' | 'shares' | 'percentage' | 'valuation'): string {
  switch (type) {
    case 'currency':
      return 'e.g., $1,000 or 1000';
    case 'shares':
      return 'e.g., 1,000,000 or 1M';
    case 'percentage':
      return 'e.g., 8% or 0.08';
    case 'valuation':
      return 'e.g., $10,000,000 or 10M';
    default:
      return 'e.g., 1,000';
  }
}