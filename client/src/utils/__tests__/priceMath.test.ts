/**
 * Unit tests for Price Math Helper
 */

import {
  parseMoneyLoose,
  parseSharesLoose,
  roundMoney,
  roundShares,
  derivePpsFromValuation,
  derivePpsFromConsideration,
  reconcilePps,
  type ReconcileResult
} from '../priceMath';

describe('parseMoneyLoose', () => {
  test('parses string with currency symbols and commas', () => {
    expect(parseMoneyLoose('$1,234.50')).toBe(1234.5);
    expect(parseMoneyLoose('£10,000')).toBe(10000);
    expect(parseMoneyLoose('€500.75')).toBe(500.75);
    expect(parseMoneyLoose('¥1,000,000')).toBe(1000000);
  });

  test('parses string with spaces and formatting', () => {
    expect(parseMoneyLoose(' 1 234.50 ')).toBe(1234.5);
    expect(parseMoneyLoose('1,000,000.00')).toBe(1000000);
    expect(parseMoneyLoose('123')).toBe(123);
  });

  test('handles positive numbers', () => {
    expect(parseMoneyLoose(1234.5)).toBe(1234.5);
    expect(parseMoneyLoose(0.01)).toBe(0.01);
  });

  test('rejects negative numbers and zero', () => {
    expect(parseMoneyLoose(-100)).toBeUndefined();
    expect(parseMoneyLoose(0)).toBeUndefined();
    expect(parseMoneyLoose('-$100')).toBeUndefined();
  });

  test('handles null, undefined, and invalid inputs', () => {
    expect(parseMoneyLoose(null)).toBeUndefined();
    expect(parseMoneyLoose(undefined)).toBeUndefined();
    expect(parseMoneyLoose('')).toBeUndefined();
    expect(parseMoneyLoose('invalid')).toBeUndefined();
    expect(parseMoneyLoose('$')).toBeUndefined();
  });
});

describe('parseSharesLoose', () => {
  test('parses string with commas and decimals', () => {
    expect(parseSharesLoose('10,000.123456')).toBe(10000.123456);
    expect(parseSharesLoose('1,000,000')).toBe(1000000);
    expect(parseSharesLoose('500.5')).toBe(500.5);
  });

  test('parses string with spaces', () => {
    expect(parseSharesLoose(' 10 000.123 ')).toBe(10000.123);
    expect(parseSharesLoose('1 000 000')).toBe(1000000);
  });

  test('handles positive numbers with up to 6 decimals', () => {
    expect(parseSharesLoose(10000.123456)).toBe(10000.123456);
    expect(parseSharesLoose(1)).toBe(1);
    expect(parseSharesLoose(0.000001)).toBe(0.000001);
  });

  test('rejects negative numbers and zero', () => {
    expect(parseSharesLoose(-1000)).toBeUndefined();
    expect(parseSharesLoose(0)).toBeUndefined();
    expect(parseSharesLoose('-1,000')).toBeUndefined();
  });

  test('handles null, undefined, and invalid inputs', () => {
    expect(parseSharesLoose(null)).toBeUndefined();
    expect(parseSharesLoose(undefined)).toBeUndefined();
    expect(parseSharesLoose('')).toBeUndefined();
    expect(parseSharesLoose('invalid')).toBeUndefined();
  });
});

describe('roundMoney', () => {
  test('rounds to 4 decimal places by default', () => {
    expect(roundMoney(1.23456789)).toBe(1.2346);
    expect(roundMoney(1.99995)).toBe(2.0000);
    expect(roundMoney(1.00001)).toBe(1.0000);
  });

  test('rounds to specified decimal places', () => {
    expect(roundMoney(1.23456, 2)).toBe(1.23);
    expect(roundMoney(1.23456, 3)).toBe(1.235);
    expect(roundMoney(1.23456, 5)).toBe(1.23456);
  });

  test('handles edge cases', () => {
    expect(roundMoney(0)).toBe(0);
    expect(roundMoney(1.5)).toBe(1.5000);
    expect(roundMoney(1000000.12345)).toBe(1000000.1235);
  });
});

describe('roundShares', () => {
  test('rounds to 6 decimal places by default', () => {
    expect(roundShares(1000.1234567)).toBe(1000.123457);
    expect(roundShares(1.9999995)).toBe(2.000000);
    expect(roundShares(1.000001)).toBe(1.000001);
  });

  test('rounds to specified decimal places', () => {
    expect(roundShares(1000.123456, 2)).toBe(1000.12);
    expect(roundShares(1000.123456, 4)).toBe(1000.1235);
    expect(roundShares(1000.123456, 8)).toBe(1000.123456);
  });

  test('handles edge cases', () => {
    expect(roundShares(0)).toBe(0);
    expect(roundShares(1.5)).toBe(1.500000);
    expect(roundShares(10000000.123456)).toBe(10000000.123456);
  });
});

describe('derivePpsFromValuation', () => {
  test('calculates PPS from valuation and fully diluted shares', () => {
    expect(derivePpsFromValuation({ valuation: 10_000_000, preRoundFD: 10_000_000 })).toBe(1.0000);
    expect(derivePpsFromValuation({ valuation: 20_000_000, preRoundFD: 10_000_000 })).toBe(2.0000);
    expect(derivePpsFromValuation({ valuation: 5_000_000, preRoundFD: 2_500_000 })).toBe(2.0000);
  });

  test('handles decimal results with proper rounding', () => {
    expect(derivePpsFromValuation({ valuation: 10_000_000, preRoundFD: 3_000_000 })).toBe(3.3333);
    expect(derivePpsFromValuation({ valuation: 1_000_000, preRoundFD: 7_000_000 })).toBe(0.1429);
  });

  test('returns undefined for invalid inputs', () => {
    expect(derivePpsFromValuation({ valuation: 0, preRoundFD: 10_000_000 })).toBeUndefined();
    expect(derivePpsFromValuation({ valuation: 10_000_000, preRoundFD: 0 })).toBeUndefined();
    expect(derivePpsFromValuation({ valuation: -1000, preRoundFD: 10_000_000 })).toBeUndefined();
    expect(derivePpsFromValuation({ valuation: 10_000_000, preRoundFD: -1000 })).toBeUndefined();
    expect(derivePpsFromValuation({})).toBeUndefined();
  });
});

describe('derivePpsFromConsideration', () => {
  test('calculates PPS from consideration and quantity', () => {
    expect(derivePpsFromConsideration({ consideration: 1_000_000, quantity: 1_000_000 })).toBe(1.0000);
    expect(derivePpsFromConsideration({ consideration: 2_000_000, quantity: 1_000_000 })).toBe(2.0000);
    expect(derivePpsFromConsideration({ consideration: 500_000, quantity: 250_000 })).toBe(2.0000);
  });

  test('handles decimal results with proper rounding', () => {
    expect(derivePpsFromConsideration({ consideration: 1_000_000, quantity: 300_000 })).toBe(3.3333);
    expect(derivePpsFromConsideration({ consideration: 100_000, quantity: 700_000 })).toBe(0.1429);
  });

  test('returns undefined for invalid inputs', () => {
    expect(derivePpsFromConsideration({ consideration: 0, quantity: 1_000_000 })).toBeUndefined();
    expect(derivePpsFromConsideration({ consideration: 1_000_000, quantity: 0 })).toBeUndefined();
    expect(derivePpsFromConsideration({ consideration: -1000, quantity: 1_000_000 })).toBeUndefined();
    expect(derivePpsFromConsideration({ consideration: 1_000_000, quantity: -1000 })).toBeUndefined();
    expect(derivePpsFromConsideration({})).toBeUndefined();
  });
});

describe('reconcilePps', () => {
  test('prefers override when provided', () => {
    const result = reconcilePps({
      fromValuation: 1.0000,
      fromConsideration: 1.1000,
      overridePps: 1.2500
    });
    
    expect(result.pps).toBe(1.2500);
    expect(result.source).toBe('override');
    expect(result.warningDeltaPct).toBeUndefined();
  });

  test('prefers valuation when both sources present and within tolerance', () => {
    const result = reconcilePps({
      fromValuation: 1.0000,
      fromConsideration: 1.0040, // 0.4% difference, within default 0.5% tolerance
      toleranceBps: 50
    });
    
    expect(result.pps).toBe(1.0000);
    expect(result.source).toBe('valuation');
    expect(result.warningDeltaPct).toBeUndefined();
  });

  test('shows warning when divergence exceeds tolerance', () => {
    const result = reconcilePps({
      fromValuation: 1.0000,
      fromConsideration: 1.1000, // 9.52% difference, exceeds 0.5% tolerance
      toleranceBps: 50
    });
    
    expect(result.pps).toBe(1.0000);
    expect(result.source).toBe('valuation');
    expect(result.warningDeltaPct).toBe(9.52);
  });

  test('uses custom tolerance in basis points', () => {
    const result1 = reconcilePps({
      fromValuation: 1.0000,
      fromConsideration: 1.0200, // 2% difference
      toleranceBps: 100 // 1% tolerance
    });
    
    expect(result1.warningDeltaPct).toBe(1.98);

    const result2 = reconcilePps({
      fromValuation: 1.0000,
      fromConsideration: 1.0200, // 2% difference
      toleranceBps: 300 // 3% tolerance
    });
    
    expect(result2.warningDeltaPct).toBeUndefined();
  });

  test('uses single source when only one available', () => {
    const resultValuation = reconcilePps({
      fromValuation: 1.0000
    });
    
    expect(resultValuation.pps).toBe(1.0000);
    expect(resultValuation.source).toBe('valuation');

    const resultConsideration = reconcilePps({
      fromConsideration: 1.5000
    });
    
    expect(resultConsideration.pps).toBe(1.5000);
    expect(resultConsideration.source).toBe('consideration');
  });

  test('returns unknown source when no valid inputs', () => {
    const result = reconcilePps({});
    
    expect(result.pps).toBeUndefined();
    expect(result.source).toBe('unknown');
    expect(result.warningDeltaPct).toBeUndefined();
  });

  test('ignores invalid (zero/negative) sources', () => {
    const result = reconcilePps({
      fromValuation: 0,
      fromConsideration: -1,
      overridePps: 1.0000
    });
    
    expect(result.pps).toBe(1.0000);
    expect(result.source).toBe('override');
  });
});