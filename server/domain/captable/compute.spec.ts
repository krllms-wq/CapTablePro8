import { computeCapTable, validateNoDuplicateCounting, calculateAntiDilution } from './compute';
import { 
  ShareLedgerEntry, 
  EquityAward, 
  ConvertibleInstrument, 
  SecurityClass, 
  OptionPlan,
  FullyDilutedOptions 
} from './types';

describe('Cap Table Computation', () => {
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
      availableShares: 900000
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
    expect(result.entries.length).toBeGreaterThan(1);
    
    // Check no double counting
    expect(validateNoDuplicateCounting(result, 900000, 100000)).toBe(true);
  });

  test('RSU inclusion options work correctly', () => {
    const rsuAward: EquityAward = {
      id: '2',
      holderId: 'employee1',
      type: 'RSU',
      quantityGranted: 50000,
      quantityExercised: 0,
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

  test('Anti-dilution calculations', () => {
    // Full ratchet
    const fullRatchet = calculateAntiDilution(2.0, 1.0, 1000000, 500000, 'full-ratchet');
    expect(fullRatchet).toBe(1.0);

    // Broad-based without options
    const broadBased = calculateAntiDilution(2.0, 1.0, 1000000, 500000, 'broad-based');
    expect(broadBased).toBeLessThan(2.0);
    expect(broadBased).toBeGreaterThan(1.0);

    // Broad-based with options
    const broadBasedWithOptions = calculateAntiDilution(
      2.0, 1.0, 1000000, 500000, 'broad-based', true, false, 200000, 0
    );
    expect(broadBasedWithOptions).toBeLessThan(broadBased); // More dilution protection
  });
});