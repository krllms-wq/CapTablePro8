import { ConvertibleInstrument, ShareLedgerEntry, SecurityClass } from '../captable/types';
import { roundShares, roundMoney } from '../util/round';

export interface SafeConversionParams {
  roundValuation: number;
  roundAmount: number;
  pricePerShare: number;
  preRoundFullyDiluted: number;
}

export interface SafeConversionResult {
  sharesIssued: number;
  conversionPrice: number;
  usedDiscount: boolean;
  usedCap: boolean;
}

export function calculateSafeConversion(
  safe: ConvertibleInstrument,
  params: SafeConversionParams
): SafeConversionResult {
  if (safe.type !== 'SAFE') {
    throw new Error('Invalid instrument type for SAFE conversion');
  }

  const { roundValuation, pricePerShare, preRoundFullyDiluted } = params;
  
  let conversionPrice = pricePerShare;
  let usedDiscount = false;
  let usedCap = false;

  // Calculate discount price if discount rate exists
  let discountPrice = Infinity;
  if (safe.discountRate && safe.discountRate > 0) {
    discountPrice = pricePerShare * (1 - safe.discountRate);
    usedDiscount = true;
  }

  // Calculate cap price if valuation cap exists
  let capPrice = Infinity;
  if (safe.valuationCap && safe.valuationCap > 0) {
    if (safe.postMoney) {
      // Post-money SAFE: cap price based on post-money valuation
      capPrice = safe.valuationCap / (preRoundFullyDiluted + (safe.principal / safe.valuationCap * preRoundFullyDiluted));
    } else {
      // Pre-money SAFE: cap price based on pre-money valuation
      capPrice = safe.valuationCap / preRoundFullyDiluted;
    }
    usedCap = true;
  }

  // Use the minimum of discount price and cap price
  if (discountPrice < pricePerShare && discountPrice <= capPrice) {
    conversionPrice = discountPrice;
    usedCap = false;
  } else if (capPrice < pricePerShare && capPrice < discountPrice) {
    conversionPrice = capPrice;
    usedDiscount = false;
  } else {
    // Neither discount nor cap applies
    conversionPrice = pricePerShare;
    usedDiscount = false;
    usedCap = false;
  }

  const sharesIssued = roundShares(safe.principal / conversionPrice);

  return {
    sharesIssued,
    conversionPrice: roundMoney(conversionPrice),
    usedDiscount,
    usedCap
  };
}

export function calculatePreMoneyFullyDiluted(
  shareEntries: ShareLedgerEntry[],
  optionsOutstanding: number,
  unallocatedPool: number,
  excludeNewMoney: boolean = true
): number {
  const issuedShares = shareEntries.reduce((sum, entry) => sum + entry.quantity, 0);
  return roundShares(issuedShares + optionsOutstanding + unallocatedPool);
}

export function calculatePostMoneySafeOwnership(
  safe: ConvertibleInstrument,
  postMoneyValuation: number
): number {
  if (!safe.postMoney || !safe.valuationCap) {
    throw new Error('Post-money ownership calculation requires post-money SAFE with valuation cap');
  }

  // Post-money SAFE gets investment/cap ownership of the post-money valuation
  const targetOwnership = safe.principal / Math.min(safe.valuationCap, postMoneyValuation);
  return Math.min(targetOwnership, 1.0); // Cap at 100%
}