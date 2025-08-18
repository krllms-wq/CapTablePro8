/**
 * Utility functions for consistent rounding and monetary calculations
 */

export function toMinorUnits(amount: number): number {
  return Math.round(amount * 100);
}

export function fromMinorUnits(minorUnits: number): number {
  return minorUnits / 100;
}

export function roundShares(shares: number): number {
  // Round shares to 6 decimal places using half-up rounding
  const factor = 1000000;
  return Math.round((shares + Number.EPSILON) * factor) / factor;
}

export function roundMoney(amount: number): number {
  // Round money to 2 decimal places using half-up rounding
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

export function roundPercentage(percentage: number): number {
  // Round percentage to 4 decimal places
  return Math.round((percentage + Number.EPSILON) * 10000) / 10000;
}

export function calculatePercentage(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return roundPercentage((numerator / denominator) * 100);
}