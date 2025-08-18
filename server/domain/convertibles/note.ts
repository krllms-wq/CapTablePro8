import { ConvertibleInstrument } from '../captable/types';
import { roundShares, roundMoney } from '../util/round';

export interface NoteConversionParams {
  pricePerShare: number;
  conversionDate: Date;
}

export interface NoteConversionResult {
  principalAmount: number;
  interestAmount: number;
  totalAmount: number;
  sharesIssued: number;
  conversionPrice: number;
}

export function calculateNoteInterest(
  note: ConvertibleInstrument,
  asOfDate: Date = new Date()
): number {
  if (!note.interestRate || note.interestRate === 0) {
    return 0;
  }

  const daysDiff = Math.floor((asOfDate.getTime() - note.issueDate.getTime()) / (24 * 60 * 60 * 1000));
  const interest = note.principal * (note.interestRate / 100) * (daysDiff / 365);
  
  return roundMoney(interest);
}

export function calculateNoteConversion(
  note: ConvertibleInstrument,
  params: NoteConversionParams
): NoteConversionResult {
  if (note.type !== 'NOTE') {
    throw new Error('Invalid instrument type for note conversion');
  }

  const { pricePerShare, conversionDate } = params;
  
  const principalAmount = note.principal;
  const interestAmount = calculateNoteInterest(note, conversionDate);
  const totalAmount = principalAmount + interestAmount;

  let conversionPrice = pricePerShare;

  // Apply discount if available
  if (note.discountRate && note.discountRate > 0) {
    const discountPrice = pricePerShare * (1 - note.discountRate);
    conversionPrice = Math.min(conversionPrice, discountPrice);
  }

  // Apply cap if available
  if (note.valuationCap && note.valuationCap > 0) {
    // For notes, cap price calculation would need additional context
    // This is a simplified implementation
    const capPrice = note.valuationCap / 1000000; // Placeholder calculation
    conversionPrice = Math.min(conversionPrice, capPrice);
  }

  const sharesIssued = roundShares(totalAmount / conversionPrice);

  return {
    principalAmount: roundMoney(principalAmount),
    interestAmount: roundMoney(interestAmount),
    totalAmount: roundMoney(totalAmount),
    sharesIssued,
    conversionPrice: roundMoney(conversionPrice)
  };
}

export function shouldNoteConvert(
  note: ConvertibleInstrument,
  currentDate: Date = new Date()
): { shouldConvert: boolean; reason: string } {
  // Check if matured
  if (note.maturityDate && currentDate >= note.maturityDate) {
    return { shouldConvert: true, reason: 'maturity' };
  }

  // Check if equity financing trigger (would be determined by external context)
  // This is a placeholder - in real implementation, this would check for qualifying financing rounds
  
  return { shouldConvert: false, reason: 'no_trigger' };
}