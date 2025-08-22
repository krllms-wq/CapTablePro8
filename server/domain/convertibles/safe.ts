import { ConvertibleInstrument, ShareLedgerEntry, SecurityClass } from '../captable/types';
import { roundShares, roundMoney } from '../util/round';

export interface SafeConversionParams {
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

  const { pricePerShare, preRoundFullyDiluted } = params;
  
  if (safe.postMoney) {
    // Post-money SAFE: compute shares so SAFE holder gets principal / PM Cap of post-money cap
    if (!safe.valuationCap) {
      throw new Error('Post-money SAFE requires valuation cap');
    }
    
    const targetOwnership = safe.principal / safe.valuationCap;
    const sharesIssued = roundShares((targetOwnership * preRoundFullyDiluted) / (1 - targetOwnership));
    const conversionPrice = safe.principal / sharesIssued;
    
    return {
      sharesIssued,
      conversionPrice: roundMoney(conversionPrice),
      usedDiscount: false,
      usedCap: true
    };
  } else {
    // Pre-money SAFE: conversion price = min(discount_price, cap_price)
    let conversionPrice = pricePerShare;
    let usedDiscount = false;
    let usedCap = false;

    // Calculate discount price if discount rate exists
    if (safe.discountRate && safe.discountRate > 0) {
      const discountPrice = pricePerShare * (1 - (safe.discountRate / 100));
      if (discountPrice < conversionPrice) {
        conversionPrice = discountPrice;
        usedDiscount = true;
        usedCap = false;
      }
    }

    // Calculate cap price if valuation cap exists
    if (safe.valuationCap && safe.valuationCap > 0) {
      const capPrice = safe.valuationCap / preRoundFullyDiluted;
      if (capPrice < conversionPrice) {
        conversionPrice = capPrice;
        usedCap = true;
        usedDiscount = false;
      }
    }

    const sharesIssued = roundShares(safe.principal / conversionPrice);

    return {
      sharesIssued,
      conversionPrice: roundMoney(conversionPrice),
      usedDiscount,
      usedCap
    };
  }
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