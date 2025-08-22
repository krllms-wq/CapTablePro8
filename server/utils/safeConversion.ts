import { ConvertibleInstrument } from "@shared/schema";

export interface SAFEConversionCalculation {
  conversionPrice: number;
  sharesIssued: number;
  calculationMethod: 'discount' | 'cap' | 'mfn';
  discountPrice?: number;
  capPrice?: number;
  roundPricePerShare: number;
  details: {
    principal: number;
    discountRate?: number;
    valuationCap?: number;
    effectivePrice: number;
    reasoning: string;
  };
}

/**
 * Calculate SAFE conversion based on discount rate and valuation cap
 * Uses the most favorable price for the investor (lowest price)
 */
export function calculateSAFEConversion(
  safe: ConvertibleInstrument,
  roundPricePerShare: number,
  roundPreMoneyValuation: number
): SAFEConversionCalculation {
  const principal = Number(safe.principal || 0);
  const discountRate = Number(safe.discountRate || 0) / 100; // Convert percentage to decimal
  const valuationCap = Number(safe.valuationCap || 0);

  // Calculate discount price (if discount exists)
  const discountPrice = discountRate > 0 
    ? roundPricePerShare * (1 - discountRate)
    : null;

  // Calculate cap price (if valuation cap exists)
  const capPrice = valuationCap > 0
    ? valuationCap / roundPreMoneyValuation * roundPricePerShare
    : null;

  // Use the most favorable price for investor (lowest price)
  let conversionPrice: number;
  let calculationMethod: 'discount' | 'cap' | 'mfn';
  let reasoning: string;

  if (discountPrice && capPrice) {
    if (discountPrice < capPrice) {
      conversionPrice = discountPrice;
      calculationMethod = 'discount';
      reasoning = `Discount price ($${discountPrice.toFixed(4)}) is more favorable than cap price ($${capPrice.toFixed(4)})`;
    } else {
      conversionPrice = capPrice;
      calculationMethod = 'cap';
      reasoning = `Valuation cap price ($${capPrice.toFixed(4)}) is more favorable than discount price ($${discountPrice.toFixed(4)})`;
    }
  } else if (discountPrice) {
    conversionPrice = discountPrice;
    calculationMethod = 'discount';
    reasoning = `Using ${(discountRate * 100).toFixed(1)}% discount on round price`;
  } else if (capPrice) {
    conversionPrice = capPrice;
    calculationMethod = 'cap';
    reasoning = `Using valuation cap of $${valuationCap.toLocaleString()}`;
  } else {
    // No discount or cap - convert at round price
    conversionPrice = roundPricePerShare;
    calculationMethod = 'mfn';
    reasoning = `No discount or cap applicable, converting at round price`;
  }

  // Calculate shares issued
  const sharesIssued = Math.floor(principal / conversionPrice);

  return {
    conversionPrice,
    sharesIssued,
    calculationMethod,
    discountPrice: discountPrice || undefined,
    capPrice: capPrice || undefined,
    roundPricePerShare,
    details: {
      principal,
      discountRate: discountRate > 0 ? discountRate : undefined,
      valuationCap: valuationCap > 0 ? valuationCap : undefined,
      effectivePrice: conversionPrice,
      reasoning
    }
  };
}

/**
 * Validate if SAFE is eligible for conversion
 */
export function validateSAFEConversion(safe: ConvertibleInstrument): { valid: boolean; reason?: string } {
  if (!safe.principal || Number(safe.principal) <= 0) {
    return { valid: false, reason: 'SAFE must have a positive principal amount' };
  }

  if (safe.type !== 'SAFE') {
    return { valid: false, reason: 'Only SAFE instruments can be converted using this method' };
  }

  return { valid: true };
}

/**
 * Format conversion calculation for display
 */
export function formatConversionSummary(calculation: SAFEConversionCalculation): string {
  const { details } = calculation;
  
  return `Конвертация SAFE $${details.principal.toLocaleString()} → ${calculation.sharesIssued.toLocaleString()} акций по цене $${calculation.conversionPrice.toFixed(4)} за акцию (${details.reasoning})`;
}