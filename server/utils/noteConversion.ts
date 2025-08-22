import { ConvertibleInstrument } from "@shared/schema";
import { calculateNoteConversion, calculateNoteInterest } from "../domain/convertibles/note";

export interface NoteConversionCalculation {
  conversionPrice: number;
  sharesIssued: number;
  calculationMethod: 'discount' | 'cap' | 'round';
  discountPrice?: number;
  capPrice?: number;
  roundPricePerShare: number;
  principalAmount: number;
  interestAmount: number;
  totalAmount: number;
  details: {
    principal: number;
    interestAccrued: number;
    discountRate?: number;
    valuationCap?: number;
    effectivePrice: number;
    reasoning: string;
  };
}

export function calculateNoteConversionForUI(
  note: ConvertibleInstrument,
  roundPricePerShare: number,
  conversionDate: Date = new Date(),
  preRoundFullyDiluted: number = 1000000 // Default, should be calculated properly
): NoteConversionCalculation {
  const principal = Number(note.principal || 0);
  const discountRate = Number(note.discountRate || 0); // Already in decimal format (0.30 = 30%)
  const valuationCap = Number(note.valuationCap || 0);
  
  // Calculate interest
  const interestAmount = calculateNoteInterest(note as any, conversionDate);
  const totalAmount = principal + interestAmount;

  // Calculate discount price (if discount exists)
  const discountPrice = discountRate > 0 
    ? roundPricePerShare * (1 - discountRate)
    : null;

  // Calculate cap price (if valuation cap exists)
  const capPrice = valuationCap > 0
    ? valuationCap / preRoundFullyDiluted
    : null;

  // Use the most favorable price for investor (lowest price)
  let conversionPrice: number;
  let calculationMethod: 'discount' | 'cap' | 'round';
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
    calculationMethod = 'round';
    reasoning = `No discount or cap applicable, converting at round price`;
  }

  // Calculate shares issued using total amount (principal + interest)
  const sharesIssued = Math.floor(totalAmount / conversionPrice);

  return {
    conversionPrice,
    sharesIssued,
    calculationMethod,
    discountPrice: discountPrice || undefined,
    capPrice: capPrice || undefined,
    roundPricePerShare,
    principalAmount: principal,
    interestAmount,
    totalAmount,
    details: {
      principal,
      interestAccrued: interestAmount,
      discountRate: discountRate > 0 ? discountRate : undefined,
      valuationCap: valuationCap > 0 ? valuationCap : undefined,
      effectivePrice: conversionPrice,
      reasoning
    }
  };
}

export function validateNoteConversion(note: ConvertibleInstrument): { valid: boolean; reason?: string } {
  if (!note.principal || Number(note.principal) <= 0) {
    return { valid: false, reason: 'Note must have a positive principal amount' };
  }

  if (note.type !== 'note') {
    return { valid: false, reason: 'Only convertible notes can be converted using this method' };
  }

  return { valid: true };
}

export function formatNoteConversionSummary(calc: NoteConversionCalculation): string {
  const interestInfo = calc.interestAmount > 0 
    ? ` (${calc.principalAmount.toLocaleString()} principal + ${calc.interestAmount.toLocaleString()} interest)`
    : '';
    
  return `${calc.sharesIssued.toLocaleString()} shares at $${calc.conversionPrice.toFixed(4)} per share for $${calc.totalAmount.toLocaleString()}${interestInfo}`;
}