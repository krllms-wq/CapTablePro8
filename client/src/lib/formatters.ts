// Formatting utilities for financial and numerical data

export function formatCurrency(amount: number, currency: string = "USD"): string {
  if (isNaN(amount)) return "$0";
  
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCurrencyDetailed(amount: number, currency: string = "USD"): string {
  if (isNaN(amount)) return "$0.00";
  
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(num: number): string {
  if (isNaN(num)) return "0";
  
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatNumberDetailed(num: number, decimals: number = 2): string {
  if (isNaN(num)) return "0";
  
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

export function formatPercentage(percentage: number, decimals: number = 2): string {
  if (isNaN(percentage)) return "0.00%";
  
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(percentage / 100);
}

export function formatShares(shares: number): string {
  if (isNaN(shares)) return "0";
  
  if (shares >= 1000000) {
    return `${(shares / 1000000).toFixed(1)}M`;
  } else if (shares >= 1000) {
    return `${(shares / 1000).toFixed(1)}K`;
  }
  
  return formatNumber(shares);
}

export function formatDate(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(dateObj);
}

export function formatDateLong(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(dateObj);
}

export function formatValuation(valuation: number): string {
  if (valuation >= 1000000000) {
    return `$${(valuation / 1000000000).toFixed(1)}B`;
  } else if (valuation >= 1000000) {
    return `$${(valuation / 1000000).toFixed(1)}M`;
  } else if (valuation >= 1000) {
    return `$${(valuation / 1000).toFixed(1)}K`;
  }
  
  return formatCurrency(valuation);
}

export function formatPricePerShare(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(price);
}

export function parseNumberInput(value: string): number {
  const cleaned = value.replace(/[^\d.-]/g, "");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

export function formatRatio(ratio: number): string {
  if (ratio === 1) return "1:1";
  if (ratio > 1) return `${ratio.toFixed(2)}:1`;
  return `1:${(1/ratio).toFixed(2)}`;
}
