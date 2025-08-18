import { 
  calculateNoteInterest, 
  calculateNoteConversion,
  shouldNoteConvert 
} from './note';
import { ConvertibleInstrument } from '../captable/types';

describe('Convertible Note Calculations - Fixed Implementation', () => {
  const testNote: ConvertibleInstrument = {
    id: '1',
    holderId: 'investor1',
    type: 'NOTE',
    framework: 'Simple Convertible Note',
    principal: 250000,
    issueDate: new Date('2024-01-01'),
    maturityDate: new Date('2026-01-01'),
    interestRate: 8, // 8% annual
    discountRate: 0.20, // 20% discount
    valuationCap: 5000000,
    postMoney: false
  };

  test('Interest accrual using Actual/365', () => {
    const asOfDate = new Date('2024-07-01'); // 6 months later (~181 days)
    const interest = calculateNoteInterest(testNote, asOfDate);
    
    // Expected: $250K * 8% * (actual days/365)
    expect(interest).toBeCloseTo(9900, -3); // Allow for day calculation variance
  });

  test('Interest accrual over full year', () => {
    const asOfDate = new Date('2025-01-01'); // Exactly 1 year
    const interest = calculateNoteInterest(testNote, asOfDate);
    
    // Expected: $250K * 8% * actual days/365
    expect(interest).toBeCloseTo(20000, -3); // Allow for leap year variance
  });

  test('Note conversion with discount better than cap', () => {
    const params = {
      pricePerShare: 10.0,
      conversionDate: new Date('2024-07-01'),
      preRoundFullyDiluted: 1000000 // Small pre-round makes cap expensive
    };

    const result = calculateNoteConversion(testNote, params);

    const discountPrice = 10.0 * (1 - 0.20); // $8.00
    const capPrice = 5000000 / 1000000; // $5.00
    const expectedConversionPrice = Math.min(10.0, discountPrice, capPrice); // $5.00 (cap wins)
    
    const interest = calculateNoteInterest(testNote, params.conversionDate);
    const totalAmount = 250000 + interest;
    
    expect(result.conversionPrice).toBe(5.0);
    expect(result.totalAmount).toBe(totalAmount);
    expect(result.sharesIssued).toBeCloseTo(totalAmount / 5.0, 0);
  });

  test('Note conversion with discount only', () => {
    const noCap = { ...testNote, valuationCap: undefined };
    const params = {
      pricePerShare: 2.0,
      conversionDate: new Date('2024-07-01'),
      preRoundFullyDiluted: 5000000
    };

    const result = calculateNoteConversion(noCap, params);

    expect(result.conversionPrice).toBe(1.6); // 20% discount on $2
    
    const interest = calculateNoteInterest(noCap, params.conversionDate);
    const totalAmount = 250000 + interest;
    expect(result.totalAmount).toBe(totalAmount);
    expect(result.sharesIssued).toBeCloseTo(totalAmount / 1.6, 0);
  });

  test('Note conversion uses round price when no discount/cap', () => {
    const vanilla = { 
      ...testNote, 
      discountRate: undefined, 
      valuationCap: undefined 
    };
    const params = {
      pricePerShare: 3.0,
      conversionDate: new Date('2024-07-01'),
      preRoundFullyDiluted: 5000000
    };

    const result = calculateNoteConversion(vanilla, params);

    expect(result.conversionPrice).toBe(3.0);
  });

  test('Note should convert on maturity', () => {
    const maturityDate = new Date('2026-01-01');
    const checkDate = new Date('2026-06-01'); // After maturity
    
    const result = shouldNoteConvert(testNote, checkDate, false);
    
    expect(result.shouldConvert).toBe(true);
    expect(result.reason).toBe('maturity');
  });

  test('Note should convert on financing trigger', () => {
    const checkDate = new Date('2024-06-01'); // Before maturity
    
    const result = shouldNoteConvert(testNote, checkDate, true);
    
    expect(result.shouldConvert).toBe(true);
    expect(result.reason).toBe('financing');
  });

  test('Note should not convert without trigger', () => {
    const checkDate = new Date('2024-06-01'); // Before maturity
    
    const result = shouldNoteConvert(testNote, checkDate, false);
    
    expect(result.shouldConvert).toBe(false);
    expect(result.reason).toBe('no_trigger');
  });

  test('Zero interest rate note', () => {
    const zeroInterest = { ...testNote, interestRate: 0 };
    const asOfDate = new Date('2025-01-01');
    
    const interest = calculateNoteInterest(zeroInterest, asOfDate);
    expect(interest).toBe(0);
  });

  test('Note without interest rate', () => {
    const noInterest = { ...testNote, interestRate: undefined };
    const asOfDate = new Date('2025-01-01');
    
    const interest = calculateNoteInterest(noInterest, asOfDate);
    expect(interest).toBe(0);
  });
});