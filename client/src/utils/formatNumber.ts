/**
 * Number and currency formatting utilities
 */

export interface FormatNumberOptions {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  currency?: string;
  style?: 'decimal' | 'currency' | 'percent';
  locale?: string;
}

/**
 * Format a number with commas as thousand separators
 */
export function formatNumber(
  value: number | string,
  options: FormatNumberOptions = {}
): string {
  const {
    minimumFractionDigits = 0,
    maximumFractionDigits = 2,
    style = 'decimal',
    locale = 'en-US',
    currency = 'USD'
  } = options;

  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) return '0';

  const formatter = new Intl.NumberFormat(locale, {
    style,
    currency: style === 'currency' ? currency : undefined,
    minimumFractionDigits,
    maximumFractionDigits
  });

  return formatter.format(numValue);
}

/**
 * Format a currency value
 */
export function formatCurrency(
  value: number | string,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  return formatNumber(value, {
    style: 'currency',
    currency,
    locale,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Format share count with appropriate decimal places
 */
export function formatShares(
  value: number | string,
  maxDecimals: number = 2
): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) return '0';

  // Use no decimals for whole numbers, up to maxDecimals for fractional
  const isWhole = numValue % 1 === 0;
  const decimals = isWhole ? 0 : maxDecimals;

  return formatNumber(numValue, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals
  });
}

/**
 * Format percentage values
 */
export function formatPercentage(
  value: number | string,
  decimals: number = 2
): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) return '0%';

  return formatNumber(numValue, {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals
  });
}

/**
 * Format large numbers with K/M/B suffixes
 */
export function formatCompactNumber(
  value: number | string,
  decimals: number = 1
): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) return '0';

  const absValue = Math.abs(numValue);
  const sign = numValue < 0 ? '-' : '';

  if (absValue >= 1e9) {
    return `${sign}${(absValue / 1e9).toFixed(decimals)}B`;
  } else if (absValue >= 1e6) {
    return `${sign}${(absValue / 1e6).toFixed(decimals)}M`;
  } else if (absValue >= 1e3) {
    return `${sign}${(absValue / 1e3).toFixed(decimals)}K`;
  }

  return formatNumber(numValue, { maximumFractionDigits: decimals });
}