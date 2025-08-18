import { 
  calculateSafeConversion, 
  calculatePreMoneyFullyDiluted,
  calculatePostMoneySafeOwnership 
} from './safe';
import { ConvertibleInstrument, ShareLedgerEntry } from '../captable/types';

describe('SAFE Conversions - Fixed Implementation', () => {
  const preMoneySafe: ConvertibleInstrument = {
    id: '1',
    holderId: 'investor1',
    type: 'SAFE',
    framework: 'YC pre-money SAFE',
    principal: 500000,
    issueDate: new Date('2024-01-01'),
    discountRate: 0.20, // 20% discount
    valuationCap: 5000000,
    postMoney: false
  };

  const postMoneySafe: ConvertibleInstrument = {
    id: '2',
    holderId: 'investor2', 
    type: 'SAFE',
    framework: 'YC post-money SAFE',
    principal: 1000000,
    issueDate: new Date('2024-01-01'),
    valuationCap: 10000000,
    postMoney: true
  };

  test('Pre-money SAFE with cap better than discount', () => {
    const params = {
      pricePerShare: 2.0,
      preRoundFullyDiluted: 8500000
    };

    const result = calculateSafeConversion(preMoneySafe, params);

    const discountPrice = 2.0 * (1 - 0.20); // $1.60
    const capPrice = 5000000 / 8500000; // ~$0.588

    expect(result.conversionPrice).toBeCloseTo(0.59, 2); // Cap price is better
    expect(result.usedCap).toBe(true);
    expect(result.usedDiscount).toBe(false);
    expect(result.sharesIssued).toBeCloseTo(500000 / result.conversionPrice, -4);
  });

  test('Pre-money SAFE with discount better than cap', () => {
    const expensiveRoundParams = {
      pricePerShare: 10.0,
      preRoundFullyDiluted: 1000000 // Small pre-round makes cap expensive
    };

    const result = calculateSafeConversion(preMoneySafe, expensiveRoundParams);

    const discountPrice = 10.0 * (1 - 0.20); // $8.00
    const capPrice = 5000000 / 1000000; // $5.00

    expect(result.conversionPrice).toBe(5.0); // Cap is still better
    expect(result.usedCap).toBe(true);
    expect(result.usedDiscount).toBe(false);
  });

  test('Pre-money SAFE with discount only (no cap)', () => {
    const noCap = { ...preMoneySafe, valuationCap: undefined };
    const params = {
      pricePerShare: 2.0,
      preRoundFullyDiluted: 5000000
    };

    const result = calculateSafeConversion(noCap, params);

    expect(result.conversionPrice).toBe(1.6); // 20% discount on $2
    expect(result.usedDiscount).toBe(true);
    expect(result.usedCap).toBe(false);
    expect(result.sharesIssued).toBe(312500); // $500K / $1.60
  });

  test('Post-money SAFE ownership calculation', () => {
    const params = {
      pricePerShare: 5.0, // Not used for post-money
      preRoundFullyDiluted: 8000000
    };

    const result = calculateSafeConversion(postMoneySafe, params);
    
    // $1M investment at $10M cap should get 10% ownership
    const expectedTargetOwnership = 1000000 / 10000000; // 0.1
    const expectedShares = (expectedTargetOwnership * 8000000) / (1 - expectedTargetOwnership);
    
    expect(result.usedCap).toBe(true);
    expect(result.usedDiscount).toBe(false);
    expect(result.sharesIssued).toBeCloseTo(expectedShares, 0);
  });

  test('SAFE conversion without discount or cap uses round price', () => {
    const vanillaSafe = {
      ...preMoneySafe,
      discountRate: undefined,
      valuationCap: undefined
    };

    const params = {
      pricePerShare: 2.0,
      preRoundFullyDiluted: 5000000
    };

    const result = calculateSafeConversion(vanillaSafe, params);

    expect(result.conversionPrice).toBe(2.0);
    expect(result.usedDiscount).toBe(false);
    expect(result.usedCap).toBe(false);
    expect(result.sharesIssued).toBe(250000); // $500K / $2 = 250K shares
  });

  test('Post-money SAFE requires valuation cap', () => {
    const invalidPostMoney = { ...postMoneySafe, valuationCap: undefined };
    const params = {
      pricePerShare: 2.0,
      preRoundFullyDiluted: 5000000
    };

    expect(() => {
      calculateSafeConversion(invalidPostMoney, params);
    }).toThrow('Post-money SAFE requires valuation cap');
  });

  test('Pre-money fully diluted calculation', () => {
    const mockShareEntries: ShareLedgerEntry[] = [
      {
        id: '1',
        holderId: 'founder1',
        classId: 'common',
        quantity: 8000000,
        issueDate: new Date('2024-01-01')
      }
    ];

    const preMoneyFD = calculatePreMoneyFullyDiluted(
      mockShareEntries,
      500000, // options outstanding
      200000  // unallocated pool
    );

    expect(preMoneyFD).toBe(8700000); // 8M + 500K + 200K
  });
});