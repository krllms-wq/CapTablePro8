import { computePpsFromConsideration, ensurePricePerShare } from '../price';

describe('Server-side Price Calculation Utilities', () => {
  describe('computePpsFromConsideration', () => {
    test('should compute correct PPS from valid consideration and quantity', () => {
      const result = computePpsFromConsideration(1000000, 500000);
      expect(result).toBe(2.0);
    });

    test('should handle fractional results with proper rounding to 4 decimal places', () => {
      const result = computePpsFromConsideration(100000, 33333);
      expect(result).toBe(3.0000); // 100000/33333 = 3.000030003... rounds to 3.0000
    });

    test('should return undefined for zero consideration', () => {
      const result = computePpsFromConsideration(0, 1000);
      expect(result).toBeUndefined();
    });

    test('should return undefined for negative consideration', () => {
      const result = computePpsFromConsideration(-1000, 1000);
      expect(result).toBeUndefined();
    });

    test('should return undefined for zero quantity', () => {
      const result = computePpsFromConsideration(1000, 0);
      expect(result).toBeUndefined();
    });

    test('should return undefined for negative quantity', () => {
      const result = computePpsFromConsideration(1000, -500);
      expect(result).toBeUndefined();
    });

    test('should return undefined for undefined consideration', () => {
      const result = computePpsFromConsideration(undefined, 1000);
      expect(result).toBeUndefined();
    });

    test('should return undefined for undefined quantity', () => {
      const result = computePpsFromConsideration(1000, undefined);
      expect(result).toBeUndefined();
    });

    test('should return undefined for both undefined', () => {
      const result = computePpsFromConsideration(undefined, undefined);
      expect(result).toBeUndefined();
    });
  });

  describe('ensurePricePerShare', () => {
    test('should return original data when pricePerShare already provided', () => {
      const data = {
        consideration: 1000000,
        quantity: 500000,
        pricePerShare: 1.5,
        otherField: 'test'
      };

      const result = ensurePricePerShare(data);
      expect(result).toEqual(data);
      expect(result.pricePerShare).toBe(1.5);
    });

    test('should compute and add pricePerShare when missing but derivable', () => {
      const data = {
        consideration: 1000000,
        quantity: 500000,
        otherField: 'test'
      };

      const result = ensurePricePerShare(data);
      expect(result).toEqual({
        ...data,
        pricePerShare: 2.0
      });
    });

    test('should return original data when pricePerShare not derivable', () => {
      const data = {
        consideration: 0,
        quantity: 500000,
        otherField: 'test'
      };

      const result = ensurePricePerShare(data);
      expect(result).toEqual(data);
      expect('pricePerShare' in result).toBe(false);
    });

    test('should return original data when consideration missing', () => {
      const data = {
        quantity: 500000,
        otherField: 'test'
      };

      const result = ensurePricePerShare(data);
      expect(result).toEqual(data);
      expect('pricePerShare' in result).toBe(false);
    });

    test('should return original data when quantity missing', () => {
      const data = {
        consideration: 1000000,
        otherField: 'test'
      };

      const result = ensurePricePerShare(data);
      expect(result).toEqual(data);
      expect('pricePerShare' in result).toBe(false);
    });

    test('should handle zero pricePerShare as already provided', () => {
      const data = {
        consideration: 1000000,
        quantity: 500000,
        pricePerShare: 0,
        otherField: 'test'
      };

      const result = ensurePricePerShare(data);
      expect(result).toEqual(data);
      expect(result.pricePerShare).toBe(0);
    });

    test('should preserve all other fields in the data object', () => {
      const data = {
        consideration: 1000000,
        quantity: 500000,
        stakeholderId: 'stake-123',
        securityClassId: 'sec-456',
        issueDate: '2024-01-01',
        notes: 'Test transaction'
      };

      const result = ensurePricePerShare(data);
      expect(result).toEqual({
        ...data,
        pricePerShare: 2.0
      });
      expect(result.stakeholderId).toBe('stake-123');
      expect(result.securityClassId).toBe('sec-456');
      expect(result.issueDate).toBe('2024-01-01');
      expect(result.notes).toBe('Test transaction');
    });
  });

  describe('Edge Cases and Integration', () => {
    test('should handle very small values correctly', () => {
      const result = computePpsFromConsideration(0.01, 0.001);
      expect(result).toBe(10.0);
    });

    test('should handle very large values correctly', () => {
      const result = computePpsFromConsideration(1000000000, 100000000);
      expect(result).toBe(10.0);
    });

    test('should maintain precision for complex calculations', () => {
      const consideration = 1234567.89;
      const quantity = 987654.321;
      const expected = Math.round((consideration / quantity) * 10000) / 10000;
      
      const result = computePpsFromConsideration(consideration, quantity);
      expect(result).toBe(expected);
    });
  });
});