import { ShareLedgerEntry, EquityAward, ConvertibleInstrument, SecurityClass } from '../captable/types';
import { roundShares, roundMoney } from '../util/round';

export interface StockSplitParams {
  splitRatio: number; // e.g., 2.0 for 2:1 split, 0.5 for 1:2 reverse split
  effectiveDate: Date;
}

export interface SplitAdjustmentResult {
  adjustedShareEntries: ShareLedgerEntry[];
  adjustedEquityAwards: EquityAward[];
  adjustedConvertibles: ConvertibleInstrument[];
  adjustedSecurityClasses: SecurityClass[];
}

export function applySplit(
  shareEntries: ShareLedgerEntry[],
  equityAwards: EquityAward[],
  convertibles: ConvertibleInstrument[],
  securityClasses: SecurityClass[],
  params: StockSplitParams
): SplitAdjustmentResult {
  const { splitRatio } = params;
  
  // Adjust share ledger entries
  const adjustedShareEntries = shareEntries.map(entry => ({
    ...entry,
    quantity: roundShares(entry.quantity * splitRatio)
  }));

  // Adjust equity awards
  const adjustedEquityAwards = equityAwards.map(award => ({
    ...award,
    quantityGranted: roundShares(award.quantityGranted * splitRatio),
    quantityExercised: roundShares(award.quantityExercised * splitRatio),
    quantityCanceled: roundShares(award.quantityCanceled * splitRatio),
    quantityExpired: roundShares(award.quantityExpired * splitRatio),
    strikePrice: award.strikePrice ? roundMoney(award.strikePrice / splitRatio) : undefined
  }));

  // Adjust convertible instruments - do NOT adjust valuationCap or liquidationPreferenceMultiple
  const adjustedConvertibles = convertibles.map(convertible => ({
    ...convertible,
    // Principal and discount rates remain unchanged per specification
  }));

  // Security classes - do NOT adjust liquidation preferences per specification
  const adjustedSecurityClasses = securityClasses.map(secClass => ({
    ...secClass
    // liquidationPreferenceMultiple remains unchanged per specification
  }));

  return {
    adjustedShareEntries,
    adjustedEquityAwards,
    adjustedConvertibles,
    adjustedSecurityClasses
  };
}

export function validateSplitPreservesOwnership(
  originalEntries: ShareLedgerEntry[],
  adjustedEntries: ShareLedgerEntry[],
  splitRatio: number
): boolean {
  if (originalEntries.length !== adjustedEntries.length) {
    return false;
  }

  const originalTotal = originalEntries.reduce((sum, entry) => sum + entry.quantity, 0);
  const adjustedTotal = adjustedEntries.reduce((sum, entry) => sum + entry.quantity, 0);
  
  const expectedTotal = roundShares(originalTotal * splitRatio);
  
  return Math.abs(adjustedTotal - expectedTotal) < 0.000001; // Allow for minor rounding differences
}

export function calculateSplitRatio(newShares: number, oldShares: number): number {
  if (oldShares === 0) {
    throw new Error('Cannot calculate split ratio with zero old shares');
  }
  return roundMoney(newShares / oldShares);
}

export function isReverseSplit(splitRatio: number): boolean {
  return splitRatio < 1.0;
}

export function isStockSplit(splitRatio: number): boolean {
  return splitRatio > 1.0;
}