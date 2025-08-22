import { ConvertibleInstrument } from '../captable/types';
import { roundShares, roundMoney } from '../util/round';
import { differenceInDays } from 'date-fns';

export interface NoteConversionParams {
  pricePerShare: number;
  conversionDate: Date;
  preRoundFullyDiluted: number;
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

  // Use Actual/365 day count convention
  const daysDiff = differenceInDays(asOfDate, note.issueDate);
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

  const { pricePerShare, conversionDate, preRoundFullyDiluted } = params;
  
  const principalAmount = note.principal;
  const interestAmount = calculateNoteInterest(note, conversionDate);
  const totalAmount = principalAmount + interestAmount;

  let conversionPrice = pricePerShare;

  // Apply discount if available
  if (note.discountRate && note.discountRate > 0) {
    const discountPrice = pricePerShare * (1 - (note.discountRate / 100));
    conversionPrice = Math.min(conversionPrice, discountPrice);
  }

  // Apply cap if available
  if (note.valuationCap && note.valuationCap > 0) {
    const capPrice = note.valuationCap / preRoundFullyDiluted;
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
  currentDate: Date = new Date(),
  financingOccurred: boolean = false
): { shouldConvert: boolean; reason: string } {
  // Check if matured
  if (note.maturityDate && currentDate >= note.maturityDate) {
    return { shouldConvert: true, reason: 'maturity' };
  }

  // Check if equity financing trigger
  if (financingOccurred) {
    return { shouldConvert: true, reason: 'financing' };
  }
  
  return { shouldConvert: false, reason: 'no_trigger' };
}