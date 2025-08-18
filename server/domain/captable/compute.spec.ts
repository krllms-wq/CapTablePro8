import { computeCapTable, validateNoDuplicateCounting, calculateAntiDilution } from './compute';
import { 
  ShareLedgerEntry, 
  EquityAward, 
  ConvertibleInstrument, 
  SecurityClass, 
  OptionPlan,
  FullyDilutedOptions 
} from './types';

describe('Cap Table Computation - Fixed Implementation', () => {
  const mockSecurityClasses: SecurityClass[] = [
    {
      id: 'common',
      name: 'Common Stock',
      liquidationPreferenceMultiple: 1.0,
      participating: false,
      votingRights: 1.0,
      seniorityTier: 0
    }
  ];

  const mockStakeholders = new Map([
    ['founder1', { name: 'Founder 1' }],
    ['employee1', { name: 'Employee 1' }],
    ['investor1', { name: 'Investor 1' }]
  ]);

  const mockShareEntries: ShareLedgerEntry[] = [
    {
      id: '1',
      holderId: 'founder1',
      classId: 'common',
      quantity: 8000000,
      issueDate: new Date('2024-01-01'),
      consideration: 0.001
    }
  ];

  const mockEquityAwards: EquityAward[] = [
    {
      id: '1',
      holderId: 'employee1',
      type: 'ISO',
      quantityGranted: 100000,
      quantityExercised: 0,
      quantityCanceled: 0,
      quantityExpired: 0,
      grantDate: new Date('2024-02-01'),
      vestingStartDate: new Date('2024-02-01'),
      cliffMonths: 12,
      totalMonths: 48,
      strikePrice: 1.0
    }
  ];

  const mockOptionPlans: OptionPlan[] = [
    {
      id: '1',
      name: '2024 Equity Plan',
      totalShares: 1000000,
      allocatedShares: 100000,
      availableShares: 900000,
      issuedShares: 0
    }
  ];

  test('AsIssued view only includes issued shares', () => {
    const result = computeCapTable(
      mockShareEntries,
      mockEquityAwards,
      [],
      mockSecurityClasses,
      mockOptionPlans,
      mockStakeholders,
      new Date('2024-12-01'),
      'AsIssued'
    );

    expect(result.totalShares).toBe(8000000);
    expect(result.fullyDilutedShares).toBeUndefined();
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].holderId).toBe('founder1');
    expect(result.entries[0].ownership).toBe(100);
  });

  test('FullyDiluted view includes options and pool', () => {
    const fdOptions: FullyDilutedOptions = {
      includeUnallocatedPool: true,
      includeRSUs: 'granted',
      includeWarrants: true
    };

    const result = computeCapTable(
      mockShareEntries,
      mockEquityAwards,
      [],
      mockSecurityClasses,
      mockOptionPlans,
      mockStakeholders,
      new Date('2024-12-01'),
      'FullyDiluted',
      fdOptions
    );

    expect(result.totalShares).toBe(8000000);
    expect(result.fullyDilutedShares).toBe(9000000); // 8M shares + 100K options + 900K pool
    
    // Check no double counting - pool not added as separate holder
    const poolEntry = result.entries.find(e => e.holderId === 'pool');
    expect(poolEntry).toBeUndefined();
    
    // Validate calculation integrity
    expect(validateNoDuplicateCounting(result, 900000, 100000)).toBe(true);
  });

  test('AsConverted includes SAFE and note conversions', () => {
    const mockSafe: ConvertibleInstrument = {
      id: '1',
      holderId: 'investor1',
      type: 'SAFE',
      framework: 'YC SAFE',
      principal: 500000,
      issueDate: new Date('2024-01-01'),
      valuationCap: 5000000,
      postMoney: false
    };

    const result = computeCapTable(
      mockShareEntries,
      mockEquityAwards,
      [mockSafe],
      mockSecurityClasses,
      mockOptionPlans,
      mockStakeholders,
      new Date('2024-12-01'),
      'AsConverted'
    );

    expect(result.totalShares).toBe(8000000);
    expect(result.fullyDilutedShares).toBeGreaterThan(8000000); // Includes conversions
    
    // Should have entries for founder and SAFE investor
    expect(result.entries.length).toBeGreaterThanOrEqual(2);
    const safeInvestor = result.entries.find(e => e.holderId === 'investor1');
    expect(safeInvestor).toBeDefined();
    expect(safeInvestor!.shares).toBeGreaterThan(0);
  });

  test('RSU inclusion options work correctly', () => {
    const rsuAward: EquityAward = {
      id: '2',
      holderId: 'employee1',
      type: 'RSU',
      quantityGranted: 50000,
      quantityExercised: 0, // RSUs don't get exercised
      quantityCanceled: 0,
      quantityExpired: 0,
      grantDate: new Date('2024-01-01'),
      vestingStartDate: new Date('2024-01-01'),
      cliffMonths: 12,
      totalMonths: 48,
      strikePrice: 0
    };

    // Test with no RSUs
    let result = computeCapTable(
      mockShareEntries,
      [...mockEquityAwards, rsuAward],
      [],
      mockSecurityClasses,
      mockOptionPlans,
      mockStakeholders,
      new Date('2024-12-01'),
      'FullyDiluted',
      { includeUnallocatedPool: false, includeRSUs: 'none', includeWarrants: true }
    );
    expect(result.fullyDilutedShares).toBe(8100000); // Only options, no RSUs

    // Test with granted RSUs
    result = computeCapTable(
      mockShareEntries,
      [...mockEquityAwards, rsuAward],
      [],
      mockSecurityClasses,
      mockOptionPlans,
      mockStakeholders,
      new Date('2024-12-01'),
      'FullyDiluted',
      { includeUnallocatedPool: false, includeRSUs: 'granted', includeWarrants: true }
    );
    expect(result.fullyDilutedShares).toBe(8150000); // Options + granted RSUs
  });

  test('Anti-dilution calculations - full ratchet', () => {
    const newPrice = calculateAntiDilution(2.0, 1.0, 1000000, 500000, 'full-ratchet');
    expect(newPrice).toBe(1.0);
  });

  test('Anti-dilution calculations - broad-based weighted average', () => {
    const newPrice = calculateAntiDilution(2.0, 1.0, 1000000, 500000, 'broad-based');
    expect(newPrice).toBeLessThan(2.0);
    expect(newPrice).toBeGreaterThan(1.0);
    
    // With options included, should provide more dilution protection
    const newPriceWithOptions = calculateAntiDilution(
      2.0, 1.0, 1000000, 500000, 'broad-based', true, false, 200000, 0
    );
    expect(newPriceWithOptions).toBeGreaterThan(newPrice);
  });

  test('Broad-based with pool inclusion', () => {
    const basePrice = calculateAntiDilution(2.0, 1.0, 1000000, 500000, 'broad-based');
    const priceWithPool = calculateAntiDilution(
      2.0, 1.0, 1000000, 500000, 'broad-based', false, true, 0, 300000
    );
    
    // Including pool should provide more protection (higher adjusted price)
    expect(priceWithPool).toBeGreaterThan(basePrice);
  });

  test('No double-counting validation', () => {
    const fdOptions: FullyDilutedOptions = {
      includeUnallocatedPool: true,
      includeRSUs: 'granted',
      includeWarrants: true
    };

    const result = computeCapTable(
      mockShareEntries,
      mockEquityAwards,
      [],
      mockSecurityClasses,
      mockOptionPlans,
      mockStakeholders,
      new Date('2024-12-01'),
      'FullyDiluted',
      fdOptions
    );

    // Ensure total calculated shares match expected fully diluted
    const totalStakeholderShares = result.entries.reduce((sum, entry) => sum + entry.shares, 0);
    expect(totalStakeholderShares).toBeLessThanOrEqual(result.fullyDilutedShares!);
    
    // The difference should be unallocated pool (not assigned to any stakeholder)
    const poolSize = mockOptionPlans.reduce((sum, plan) => sum + plan.availableShares, 0);
    expect(result.fullyDilutedShares! - totalStakeholderShares).toBe(poolSize);
  });
});