// Formatting utilities for financial and cap table data

export function formatCurrency(value: number | string | null | undefined, currency = 'USD'): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (numValue == null || isNaN(numValue)) return '-';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(numValue);
}

export function formatNumber(value: number | string | null | undefined): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (numValue == null || isNaN(numValue)) return '-';
  
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(numValue);
}

export function formatPercentage(value: number | string | null | undefined): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (numValue == null || isNaN(numValue)) return '-';
  
  // Server already returns percentages as numbers (60.00, not 0.60)
  // so we just need to add the % sign, no division needed
  return `${numValue.toFixed(2)}%`;
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '-';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return '-';
  
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatShares(shares: number | string | null | undefined): string {
  const numShares = typeof shares === 'string' ? parseFloat(shares) : shares;
  if (numShares == null || isNaN(numShares)) return '-';
  
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numShares);
}