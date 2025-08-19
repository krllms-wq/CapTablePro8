/**
 * RSU Validation Tests
 * Tests RSU-specific handling where strike price should be null/ignored
 */

import { insertEquityAwardSchema } from '../shared/schema';

describe('RSU Strike Price Validation', () => {
  describe('RSU Creation', () => {
    test('RSU without strike price should pass validation', () => {
      const rsuData = {
        companyId: 'test-company',
        holderId: 'test-holder',
        type: 'RSU',
        quantityGranted: 1000,
        grantDate: new Date('2023-06-15'),
        vestingStartDate: new Date('2023-06-15'),
        cliffMonths: 12,
        totalMonths: 48,
        strikePrice: null,
      };

      const result = insertEquityAwardSchema.safeParse(rsuData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.strikePrice).toBeNull();
        expect(result.data.type).toBe('RSU');
        expect(result.data.quantityGranted).toBe(1000);
      }
    });

    test('RSU with undefined strike price should pass validation', () => {
      const rsuData = {
        companyId: 'test-company',
        holderId: 'test-holder',
        type: 'RSU',
        quantityGranted: 1000,
        grantDate: new Date('2023-06-15'),
        vestingStartDate: new Date('2023-06-15'),
        cliffMonths: 12,
        totalMonths: 48,
        // strikePrice: undefined (omitted)
      };

      const result = insertEquityAwardSchema.safeParse(rsuData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.strikePrice).toBeUndefined();
        expect(result.data.type).toBe('RSU');
      }
    });

    test('RSU with strike price should fail validation', () => {
      const rsuData = {
        companyId: 'test-company',
        holderId: 'test-holder',
        type: 'RSU',
        quantityGranted: 1000,
        grantDate: new Date('2023-06-15'),
        vestingStartDate: new Date('2023-06-15'),
        cliffMonths: 12,
        totalMonths: 48,
        strikePrice: 2.50,
      };

      const result = insertEquityAwardSchema.safeParse(rsuData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['strikePrice'],
              message: expect.stringContaining('RSUs cannot have strike prices'),
            }),
          ])
        );
      }
    });
  });

  describe('Stock Option Creation', () => {
    test('ISO with strike price should pass validation', () => {
      const optionData = {
        companyId: 'test-company',
        holderId: 'test-holder',
        type: 'ISO',
        quantityGranted: 5000,
        grantDate: new Date('2023-06-15'),
        vestingStartDate: new Date('2023-06-15'),
        cliffMonths: 12,
        totalMonths: 48,
        strikePrice: 2.50,
      };

      const result = insertEquityAwardSchema.safeParse(optionData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.strikePrice).toBe(2.50);
        expect(result.data.type).toBe('ISO');
        expect(result.data.quantityGranted).toBe(5000);
      }
    });

    test('NSO with strike price should pass validation', () => {
      const optionData = {
        companyId: 'test-company',
        holderId: 'test-holder',
        type: 'NSO',
        quantityGranted: 2500,
        grantDate: new Date('2023-06-15'),
        vestingStartDate: new Date('2023-06-15'),
        cliffMonths: 6,
        totalMonths: 36,
        strikePrice: 1.75,
      };

      const result = insertEquityAwardSchema.safeParse(optionData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.strikePrice).toBe(1.75);
        expect(result.data.type).toBe('NSO');
      }
    });

    test('ISO without strike price should fail validation', () => {
      const optionData = {
        companyId: 'test-company',
        holderId: 'test-holder',
        type: 'ISO',
        quantityGranted: 5000,
        grantDate: new Date('2023-06-15'),
        vestingStartDate: new Date('2023-06-15'),
        cliffMonths: 12,
        totalMonths: 48,
        strikePrice: null,
      };

      const result = insertEquityAwardSchema.safeParse(optionData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['strikePrice'],
              message: expect.stringContaining('Options must have positive strike prices'),
            }),
          ])
        );
      }
    });

    test('NSO with zero strike price should fail validation', () => {
      const optionData = {
        companyId: 'test-company',
        holderId: 'test-holder',
        type: 'NSO',
        quantityGranted: 2500,
        grantDate: new Date('2023-06-15'),
        vestingStartDate: new Date('2023-06-15'),
        cliffMonths: 12,
        totalMonths: 48,
        strikePrice: 0,
      };

      const result = insertEquityAwardSchema.safeParse(optionData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['strikePrice'],
              message: expect.stringContaining('Options must have positive strike prices'),
            }),
          ])
        );
      }
    });
  });

  describe('Edge Cases', () => {
    test('RSU with empty string strike price should pass validation', () => {
      const rsuData = {
        companyId: 'test-company',
        holderId: 'test-holder',
        type: 'RSU',
        quantityGranted: 750,
        grantDate: new Date('2023-06-15'),
        vestingStartDate: new Date('2023-06-15'),
        cliffMonths: 0,
        totalMonths: 12,
        strikePrice: '', // Empty string should be preprocessed to null
      };

      const result = insertEquityAwardSchema.safeParse(rsuData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.strikePrice).toBeNull();
        expect(result.data.type).toBe('RSU');
      }
    });

    test('Stock option with string strike price should parse correctly', () => {
      const optionData = {
        companyId: 'test-company',
        holderId: 'test-holder',
        type: 'ISO',
        quantityGranted: 10000,
        grantDate: new Date('2023-06-15'),
        vestingStartDate: new Date('2023-06-15'),
        cliffMonths: 12,
        totalMonths: 48,
        strikePrice: '3.75', // String should be parsed to number
      };

      const result = insertEquityAwardSchema.safeParse(optionData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.strikePrice).toBe(3.75);
        expect(typeof result.data.strikePrice).toBe('number');
      }
    });

    test('SAR without strike price should fail validation', () => {
      const sarData = {
        companyId: 'test-company',
        holderId: 'test-holder',
        type: 'SAR',
        quantityGranted: 1500,
        grantDate: new Date('2023-06-15'),
        vestingStartDate: new Date('2023-06-15'),
        cliffMonths: 12,
        totalMonths: 48,
        // No strike price
      };

      const result = insertEquityAwardSchema.safeParse(sarData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['strikePrice'],
              message: expect.stringContaining('Options must have positive strike prices'),
            }),
          ])
        );
      }
    });
  });
});