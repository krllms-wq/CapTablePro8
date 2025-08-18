import { calculateRoundPricing, calculatePreMoneyValuation, calculateOwnershipPercentage } from './price';

describe('Round Pricing', () => {
  test('Simple round without pool top-up', () => {
    const result = calculateRoundPricing({
      investmentAmount: 2000000,
      preMoneyValuation: 8000000,
      currentIssuedShares: 8000000,
      currentOptionsOutstanding: 500000,
      currentUnallocatedPool: 500000
    });

    // Pre-money FD = 8M + 500K + 500K = 9M shares
    // PPS = $8M / 9M = $0.889
    // Shares issued = $2M / $0.889 = ~2.25M shares
    // Post-money = 9M + 2.25M = 11.25M shares * $0.889 = $10M

    expect(result.pricePerShare).toBeCloseTo(0.89, 2);
    expect(result.postMoneyValuation).toBeCloseTo(10000000, 0);
    expect(result.poolSharesCreated).toBe(0);
  });

  test('Round with pre-money pool top-up', () => {
    const result = calculateRoundPricing({
      investmentAmount: 2000000,
      preMoneyValuation: 8000000,
      poolTopUp: {
        enabled: true,
        targetPercentage: 0.20, // 20% pool
        timing: 'pre'
      },
      currentIssuedShares: 8000000,
      currentOptionsOutstanding: 500000,
      currentUnallocatedPool: 100000 // Need to top up
    });

    // Target pool = 20% of pre-money
    // If 80% = 8.6M shares (8M + 500K + 100K), then 100% = 10.75M
    // Pool should be 2.15M, currently 100K, so create 2.05M
    // Pre-money FD becomes 10.65M shares
    // PPS = $8M / 10.65M = ~$0.75

    expect(result.poolSharesCreated).toBeGreaterThan(0);
    expect(result.pricePerShare).toBeLessThan(0.89); // Lower due to pool expansion
  });

  test('Round with post-money pool top-up', () => {
    const result = calculateRoundPricing({
      investmentAmount: 2000000,
      preMoneyValuation: 8000000,
      poolTopUp: {
        enabled: true,
        targetPercentage: 0.20,
        timing: 'post'
      },
      currentIssuedShares: 8000000,
      currentOptionsOutstanding: 500000,
      currentUnallocatedPool: 100000
    });

    // Post-money pool doesn't affect investor pricing
    // PPS based on pre-money = $8M / 9M = $0.889
    // But total shares increases after to accommodate pool

    expect(result.pricePerShare).toBeCloseTo(0.89, 2);
    expect(result.poolSharesCreated).toBeGreaterThan(0);
    expect(result.totalSharesPostRound).toBeGreaterThan(11250000); // Includes pool expansion
  });

  test('Dilution calculation', () => {
    const result = calculateRoundPricing({
      investmentAmount: 1000000,
      preMoneyValuation: 4000000,
      currentIssuedShares: 4000000,
      currentOptionsOutstanding: 0,
      currentUnallocatedPool: 0
    });

    // Investment = 20% of post-money ($1M on $4M pre = $5M post)
    expect(result.dilution).toBeCloseTo(20, 1);
  });

  test('Pre-money valuation calculation', () => {
    const preMoneyVal = calculatePreMoneyValuation(10000000, 2000000);
    expect(preMoneyVal).toBe(8000000);
  });

  test('Ownership percentage calculation', () => {
    const ownership = calculateOwnershipPercentage(1000000, 10000000);
    expect(ownership).toBe(10);

    const zeroOwnership = calculateOwnershipPercentage(0, 10000000);
    expect(zeroOwnership).toBe(0);

    const divideByZero = calculateOwnershipPercentage(1000, 0);
    expect(divideByZero).toBe(0);
  });

  test('Large round with significant dilution', () => {
    const result = calculateRoundPricing({
      investmentAmount: 10000000,
      preMoneyValuation: 5000000,
      currentIssuedShares: 5000000,
      currentOptionsOutstanding: 1000000,
      currentUnallocatedPool: 0
    });

    // $10M on $5M pre = 66.67% dilution
    expect(result.dilution).toBeCloseTo(66.67, 1);
    expect(result.postMoneyValuation).toBe(15000000);
  });
});