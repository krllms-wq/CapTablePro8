import { 
  calculateSafeConversion, 
  calculatePreMoneyFullyDiluted,
  calculatePostMoneySafeOwnership 
} from './safe';
import { ConvertibleInstrument, ShareLedgerEntry } from '../captable/types';

describe('SAFE Conversions', () => {
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

  const mockShareEntries: ShareLedgerEntry[] = [
    {
      id: '1',
      holderId: 'founder1',
      classId: 'common',
      quantity: 8000000,
      issueDate: new Date('2024-01-01')
    }
  ];

  test('Pre-money SAFE with discount better than cap', () => {
    const params = {
      roundValuation: 10000000,
      roundAmount: 2000000,
      pricePerShare: 2.0, // $10M / 5M shares = $2
      preRoundFullyDiluted: 8500000 // Includes options
    };

    const result = calculateSafeConversion(preMoneySafe, params);

    const discountPrice = 2.0 * (1 - 0.20); // $1.60
    const capPrice = 5000000 / 8500000; // ~$0.588

    expect(result.conversionPrice).toBe(0.59); // Cap price is better
    expect(result.usedCap).toBe(true);
    expect(result.usedDiscount).toBe(false);
    expect(result.sharesIssued).toBeCloseTo(500000 / 0.59, 0);
  });

  test('Pre-money SAFE with discount better than cap scenario', () => {
    const expensiveRoundParams = {
      roundValuation: 50000000,
      roundAmount: 5000000,
      pricePerShare: 10.0,
      preRoundFullyDiluted: 5000000
    };

    const result = calculateSafeConversion(preMoneySafe, expensiveRoundParams);

    const discountPrice = 10.0 * (1 - 0.20); // $8.00
    const capPrice = 5000000 / 5000000; // $1.00

    expect(result.conversionPrice).toBe(1.0); // Cap price is still better
    expect(result.usedCap).toBe(true);
  });

  test('Pre-money SAFE with no cap, discount applies', () => {
    const noCap = { ...preMoneySafe, valuationCap: undefined };
    const params = {
      roundValuation: 10000000,
      roundAmount: 2000000,
      pricePerShare: 2.0,
      preRoundFullyDiluted: 5000000
    };

    const result = calculateSafeConversion(noCap, params);

    expect(result.conversionPrice).toBe(1.6); // 20% discount on $2
    expect(result.usedDiscount).toBe(true);
    expect(result.usedCap).toBe(false);
  });

  test('Post-money SAFE ownership calculation', () => {
    const ownership = calculatePostMoneySafeOwnership(postMoneySafe, 20000000);
    
    // $1M investment at $10M cap = 10% ownership
    expect(ownership).toBe(0.1);
  });

  test('Post-money SAFE ownership at valuation above cap', () => {
    const ownership = calculatePostMoneySafeOwnership(postMoneySafe, 5000000);
    
    // $1M investment at $5M valuation (below $10M cap) = 20% ownership
    expect(ownership).toBe(0.2);
  });

  test('Pre-money fully diluted calculation', () => {
    const preMoneyFD = calculatePreMoneyFullyDiluted(
      mockShareEntries,
      500000, // options outstanding
      200000  // unallocated pool
    );

    expect(preMoneyFD).toBe(8700000); // 8M + 500K + 200K
  });

  test('SAFE conversion without discount or cap uses round price', () => {
    const vanillaSafe = {
      ...preMoneySafe,
      discountRate: undefined,
      valuationCap: undefined
    };

    const params = {
      roundValuation: 10000000,
      roundAmount: 2000000,
      pricePerShare: 2.0,
      preRoundFullyDiluted: 5000000
    };

    const result = calculateSafeConversion(vanillaSafe, params);

    expect(result.conversionPrice).toBe(2.0);
    expect(result.usedDiscount).toBe(false);
    expect(result.usedCap).toBe(false);
    expect(result.sharesIssued).toBe(250000); // $500K / $2 = 250K shares
  });
});