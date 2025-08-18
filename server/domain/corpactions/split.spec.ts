import { 
  applySplit, 
  validateSplitPreservesOwnership, 
  calculateSplitRatio,
  isReverseSplit,
  isStockSplit 
} from './split';
import { ShareLedgerEntry, EquityAward, ConvertibleInstrument, SecurityClass } from '../captable/types';

describe('Stock Split Operations', () => {
  const mockShareEntries: ShareLedgerEntry[] = [
    {
      id: '1',
      holderId: 'founder1',
      classId: 'common',
      quantity: 1000000,
      issueDate: new Date('2024-01-01'),
      consideration: 10000
    },
    {
      id: '2', 
      holderId: 'employee1',
      classId: 'common',
      quantity: 100000,
      issueDate: new Date('2024-02-01'),
      consideration: 5000
    }
  ];

  const mockEquityAwards: EquityAward[] = [
    {
      id: '1',
      holderId: 'employee1',
      type: 'ISO',
      quantityGranted: 50000,
      quantityExercised: 10000,
      quantityCanceled: 5000,
      quantityExpired: 0,
      grantDate: new Date('2024-01-01'),
      vestingStartDate: new Date('2024-01-01'),
      cliffMonths: 12,
      totalMonths: 48,
      strikePrice: 2.0
    }
  ];

  const mockConvertibles: ConvertibleInstrument[] = [
    {
      id: '1',
      holderId: 'investor1',
      type: 'SAFE',
      framework: 'YC SAFE',
      principal: 500000,
      issueDate: new Date('2024-01-01'),
      valuationCap: 5000000,
      postMoney: false
    }
  ];

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

  test('2:1 stock split doubles shares and halves prices', () => {
    const splitParams = {
      splitRatio: 2.0,
      effectiveDate: new Date('2024-06-01')
    };

    const result = applySplit(
      mockShareEntries,
      mockEquityAwards,
      mockConvertibles,
      mockSecurityClasses,
      splitParams
    );

    // Check share quantities doubled
    expect(result.adjustedShareEntries[0].quantity).toBe(2000000);
    expect(result.adjustedShareEntries[1].quantity).toBe(200000);

    // Check equity award quantities doubled and strike price halved
    expect(result.adjustedEquityAwards[0].quantityGranted).toBe(100000);
    expect(result.adjustedEquityAwards[0].quantityExercised).toBe(20000);
    expect(result.adjustedEquityAwards[0].quantityCanceled).toBe(10000);
    expect(result.adjustedEquityAwards[0].strikePrice).toBe(1.0);

    // Check convertible valuation cap doubled
    expect(result.adjustedConvertibles[0].valuationCap).toBe(10000000);

    // Check liquidation preference halved
    expect(result.adjustedSecurityClasses[0].liquidationPreferenceMultiple).toBe(0.5);
  });

  test('1:2 reverse split halves shares and doubles prices', () => {
    const splitParams = {
      splitRatio: 0.5,
      effectiveDate: new Date('2024-06-01')
    };

    const result = applySplit(
      mockShareEntries,
      mockEquityAwards,
      mockConvertibles,
      mockSecurityClasses,
      splitParams
    );

    // Check share quantities halved
    expect(result.adjustedShareEntries[0].quantity).toBe(500000);
    expect(result.adjustedShareEntries[1].quantity).toBe(50000);

    // Check equity award quantities halved and strike price doubled
    expect(result.adjustedEquityAwards[0].quantityGranted).toBe(25000);
    expect(result.adjustedEquityAwards[0].strikePrice).toBe(4.0);

    // Check convertible valuation cap halved
    expect(result.adjustedConvertibles[0].valuationCap).toBe(2500000);

    // Check liquidation preference doubled
    expect(result.adjustedSecurityClasses[0].liquidationPreferenceMultiple).toBe(2.0);
  });

  test('Split preserves ownership percentages', () => {
    const splitParams = {
      splitRatio: 3.0, // 3:1 split
      effectiveDate: new Date('2024-06-01')
    };

    const result = applySplit(
      mockShareEntries,
      mockEquityAwards,
      mockConvertibles,
      mockSecurityClasses,
      splitParams
    );

    const isValid = validateSplitPreservesOwnership(
      mockShareEntries,
      result.adjustedShareEntries,
      3.0
    );

    expect(isValid).toBe(true);
  });

  test('Split ratio calculations', () => {
    expect(calculateSplitRatio(2, 1)).toBe(2.0); // 2:1 split
    expect(calculateSplitRatio(1, 2)).toBe(0.5); // 1:2 reverse split
    expect(calculateSplitRatio(3, 2)).toBe(1.5); // 3:2 split

    expect(() => calculateSplitRatio(1, 0)).toThrow('Cannot calculate split ratio with zero old shares');
  });

  test('Split type identification', () => {
    expect(isStockSplit(2.0)).toBe(true);
    expect(isStockSplit(1.5)).toBe(true);
    expect(isStockSplit(1.0)).toBe(false);
    expect(isStockSplit(0.5)).toBe(false);

    expect(isReverseSplit(0.5)).toBe(true);
    expect(isReverseSplit(0.25)).toBe(true);
    expect(isReverseSplit(1.0)).toBe(false);
    expect(isReverseSplit(2.0)).toBe(false);
  });

  test('Fractional share handling in splits', () => {
    const fractionalShares: ShareLedgerEntry[] = [
      {
        id: '1',
        holderId: 'founder1',
        classId: 'common',
        quantity: 333333, // Results in 666666 after 2:1 split
        issueDate: new Date('2024-01-01')
      }
    ];

    const splitParams = {
      splitRatio: 2.0,
      effectiveDate: new Date('2024-06-01')
    };

    const result = applySplit(
      fractionalShares,
      [],
      [],
      mockSecurityClasses,
      splitParams
    );

    // Should handle rounding properly
    expect(result.adjustedShareEntries[0].quantity).toBe(666666);
  });

  test('Split with zero strike price options', () => {
    const zeroStrikeAward: EquityAward = {
      ...mockEquityAwards[0],
      strikePrice: undefined
    };

    const splitParams = {
      splitRatio: 2.0,
      effectiveDate: new Date('2024-06-01')
    };

    const result = applySplit(
      [],
      [zeroStrikeAward],
      [],
      [],
      splitParams
    );

    // Should handle undefined strike price gracefully
    expect(result.adjustedEquityAwards[0].strikePrice).toBeUndefined();
    expect(result.adjustedEquityAwards[0].quantityGranted).toBe(100000); // Still doubled
  });
});