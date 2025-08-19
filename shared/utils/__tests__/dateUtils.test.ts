/**
 * Unit tests for date-only UTC utilities
 * Tests roundtrip stability and edge cases
 */

import {
  toDateOnlyUTC,
  fromDateOnlyUTC,
  getCurrentDateUTC,
  isValidDateOnlyFormat,
  compareDateOnlyUTC,
  addDaysUTC,
  daysDifferenceUTC,
  formatDateOnlyUTC,
  transformDateInput,
  parseUserDateInput
} from '../dateUtils';

describe('Date-Only UTC Utilities', () => {
  describe('toDateOnlyUTC', () => {
    test('converts Date object to YYYY-MM-DD format', () => {
      const date = new Date('2023-06-15T14:30:00.000Z');
      expect(toDateOnlyUTC(date)).toBe('2023-06-15');
    });

    test('converts string date to YYYY-MM-DD format', () => {
      expect(toDateOnlyUTC('2023-06-15T14:30:00.000Z')).toBe('2023-06-15');
      expect(toDateOnlyUTC('2023-06-15')).toBe('2023-06-15');
    });

    test('handles timezone edge cases consistently', () => {
      // Test dates that might shift across timezone boundaries
      const edgeCases = [
        '2023-01-01T00:00:00.000Z', // New Year UTC midnight
        '2023-12-31T23:59:59.999Z', // New Year's Eve UTC
        '2023-06-15T23:30:00-08:00', // Pacific time that might shift
        '2023-06-16T01:30:00+02:00'  // European time
      ];

      edgeCases.forEach(dateStr => {
        const result = toDateOnlyUTC(dateStr);
        expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });
    });

    test('handles leap year dates correctly', () => {
      expect(toDateOnlyUTC('2024-02-29T12:00:00.000Z')).toBe('2024-02-29');
      expect(toDateOnlyUTC('2023-02-28T12:00:00.000Z')).toBe('2023-02-28');
    });
  });

  describe('fromDateOnlyUTC', () => {
    test('converts YYYY-MM-DD string to UTC Date', () => {
      const result = fromDateOnlyUTC('2023-06-15');
      expect(result.getUTCFullYear()).toBe(2023);
      expect(result.getUTCMonth()).toBe(5); // 0-indexed
      expect(result.getUTCDate()).toBe(15);
      expect(result.getUTCHours()).toBe(0);
      expect(result.getUTCMinutes()).toBe(0);
      expect(result.getUTCSeconds()).toBe(0);
    });

    test('handles edge case dates', () => {
      const newYear = fromDateOnlyUTC('2023-01-01');
      expect(newYear.getUTCFullYear()).toBe(2023);
      expect(newYear.getUTCMonth()).toBe(0);
      expect(newYear.getUTCDate()).toBe(1);

      const leapDay = fromDateOnlyUTC('2024-02-29');
      expect(leapDay.getUTCFullYear()).toBe(2024);
      expect(leapDay.getUTCMonth()).toBe(1);
      expect(leapDay.getUTCDate()).toBe(29);
    });
  });

  describe('Roundtrip Stability', () => {
    test('toDateOnlyUTC -> fromDateOnlyUTC -> toDateOnlyUTC is stable', () => {
      const testDates = [
        '2023-01-01',
        '2023-06-15',
        '2023-12-31',
        '2024-02-29', // Leap year
        '2000-01-01', // Y2K
        '1999-12-31'
      ];

      testDates.forEach(dateStr => {
        const roundtrip = toDateOnlyUTC(fromDateOnlyUTC(dateStr));
        expect(roundtrip).toBe(dateStr);
      });
    });

    test('Date -> toDateOnlyUTC -> fromDateOnlyUTC preserves date part', () => {
      const testCases = [
        new Date('2023-06-15T00:00:00.000Z'),
        new Date('2023-06-15T12:30:45.123Z'),
        new Date('2023-06-15T23:59:59.999Z')
      ];

      testCases.forEach(originalDate => {
        const dateStr = toDateOnlyUTC(originalDate);
        const reconstructed = fromDateOnlyUTC(dateStr);
        
        expect(reconstructed.getUTCFullYear()).toBe(originalDate.getUTCFullYear());
        expect(reconstructed.getUTCMonth()).toBe(originalDate.getUTCMonth());
        expect(reconstructed.getUTCDate()).toBe(originalDate.getUTCDate());
      });
    });

    test('handles multiple timezone conversions consistently', () => {
      const baseDate = '2023-06-15';
      const timezones = [
        'T00:00:00.000Z',
        'T14:30:00-08:00', // PST
        'T09:30:00+05:30', // IST
        'T22:00:00+02:00', // CEST
        'T12:00:00-05:00'  // EST
      ];

      timezones.forEach(tz => {
        const fullDate = baseDate + tz;
        const converted = toDateOnlyUTC(fullDate);
        const backToDate = fromDateOnlyUTC(converted);
        const finalStr = toDateOnlyUTC(backToDate);
        
        expect(finalStr).toBe(converted);
      });
    });
  });

  describe('isValidDateOnlyFormat', () => {
    test('validates correct YYYY-MM-DD format', () => {
      expect(isValidDateOnlyFormat('2023-06-15')).toBe(true);
      expect(isValidDateOnlyFormat('2024-02-29')).toBe(true); // Leap year
      expect(isValidDateOnlyFormat('2000-01-01')).toBe(true);
    });

    test('rejects invalid formats', () => {
      expect(isValidDateOnlyFormat('2023-6-15')).toBe(false); // Single digit month
      expect(isValidDateOnlyFormat('23-06-15')).toBe(false); // Short year
      expect(isValidDateOnlyFormat('2023/06/15')).toBe(false); // Wrong separator
      expect(isValidDateOnlyFormat('2023-13-01')).toBe(false); // Invalid month
      expect(isValidDateOnlyFormat('2023-02-30')).toBe(false); // Invalid day
      expect(isValidDateOnlyFormat('not-a-date')).toBe(false);
      expect(isValidDateOnlyFormat('')).toBe(false);
    });

    test('rejects invalid leap year dates', () => {
      expect(isValidDateOnlyFormat('2023-02-29')).toBe(false); // Not a leap year
      expect(isValidDateOnlyFormat('2024-02-29')).toBe(true);  // Valid leap year
    });
  });

  describe('compareDateOnlyUTC', () => {
    test('compares dates correctly', () => {
      expect(compareDateOnlyUTC('2023-06-14', '2023-06-15')).toBe(-1);
      expect(compareDateOnlyUTC('2023-06-15', '2023-06-14')).toBe(1);
      expect(compareDateOnlyUTC('2023-06-15', '2023-06-15')).toBe(0);
    });

    test('handles year and month boundaries', () => {
      expect(compareDateOnlyUTC('2022-12-31', '2023-01-01')).toBe(-1);
      expect(compareDateOnlyUTC('2023-01-31', '2023-02-01')).toBe(-1);
    });
  });

  describe('addDaysUTC', () => {
    test('adds positive days correctly', () => {
      expect(addDaysUTC('2023-06-15', 1)).toBe('2023-06-16');
      expect(addDaysUTC('2023-06-15', 7)).toBe('2023-06-22');
      expect(addDaysUTC('2023-06-15', 30)).toBe('2023-07-15');
    });

    test('adds negative days correctly', () => {
      expect(addDaysUTC('2023-06-15', -1)).toBe('2023-06-14');
      expect(addDaysUTC('2023-06-15', -15)).toBe('2023-05-31');
    });

    test('handles month and year boundaries', () => {
      expect(addDaysUTC('2023-01-31', 1)).toBe('2023-02-01');
      expect(addDaysUTC('2023-12-31', 1)).toBe('2024-01-01');
      expect(addDaysUTC('2024-02-29', 1)).toBe('2024-03-01'); // Leap year
    });
  });

  describe('daysDifferenceUTC', () => {
    test('calculates positive differences correctly', () => {
      expect(daysDifferenceUTC('2023-06-15', '2023-06-16')).toBe(1);
      expect(daysDifferenceUTC('2023-06-15', '2023-06-22')).toBe(7);
      expect(daysDifferenceUTC('2023-06-15', '2023-07-15')).toBe(30);
    });

    test('calculates negative differences correctly', () => {
      expect(daysDifferenceUTC('2023-06-16', '2023-06-15')).toBe(-1);
      expect(daysDifferenceUTC('2023-06-22', '2023-06-15')).toBe(-7);
    });

    test('handles same date', () => {
      expect(daysDifferenceUTC('2023-06-15', '2023-06-15')).toBe(0);
    });
  });

  describe('getCurrentDateUTC', () => {
    test('returns valid date format', () => {
      const current = getCurrentDateUTC();
      expect(isValidDateOnlyFormat(current)).toBe(true);
      expect(current).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    test('returns consistent format within same day', () => {
      const date1 = getCurrentDateUTC();
      const date2 = getCurrentDateUTC();
      // Should be same day (allowing for potential midnight crossing)
      const diff = Math.abs(daysDifferenceUTC(date1, date2));
      expect(diff).toBeLessThanOrEqual(1);
    });
  });

  describe('transformDateInput', () => {
    test('handles Date objects', () => {
      const date = new Date('2023-06-15T14:30:00.000Z');
      expect(transformDateInput(date)).toBe('2023-06-15');
    });

    test('handles date strings', () => {
      expect(transformDateInput('2023-06-15')).toBe('2023-06-15');
      expect(transformDateInput('2023-06-15T14:30:00.000Z')).toBe('2023-06-15');
    });

    test('handles undefined input', () => {
      const result = transformDateInput(undefined);
      expect(isValidDateOnlyFormat(result)).toBe(true);
    });
  });

  describe('parseUserDateInput', () => {
    test('handles valid date strings', () => {
      expect(parseUserDateInput('2023-06-15')).toBe('2023-06-15');
      expect(parseUserDateInput('June 15, 2023')).toBe('2023-06-15');
    });

    test('handles empty or invalid input', () => {
      const result1 = parseUserDateInput('');
      const result2 = parseUserDateInput('invalid-date');
      
      expect(isValidDateOnlyFormat(result1)).toBe(true);
      expect(isValidDateOnlyFormat(result2)).toBe(true);
    });

    test('handles various date formats consistently', () => {
      const formats = [
        '2023-06-15',
        '06/15/2023',
        'June 15, 2023',
        '15 Jun 2023'
      ];

      formats.forEach(format => {
        const result = parseUserDateInput(format);
        expect(isValidDateOnlyFormat(result)).toBe(true);
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('handles extreme dates', () => {
      const extremeDates = [
        '1900-01-01',
        '2100-12-31',
        '1970-01-01', // Unix epoch
        '2038-01-19'  // Near 32-bit timestamp limit
      ];

      extremeDates.forEach(dateStr => {
        const roundtrip = toDateOnlyUTC(fromDateOnlyUTC(dateStr));
        expect(roundtrip).toBe(dateStr);
      });
    });

    test('maintains consistency across DST boundaries', () => {
      // Test dates around DST changes
      const dstDates = [
        '2023-03-12', // Spring forward in US
        '2023-11-05'  // Fall back in US
      ];

      dstDates.forEach(dateStr => {
        const asDate = fromDateOnlyUTC(dateStr);
        const backToString = toDateOnlyUTC(asDate);
        expect(backToString).toBe(dateStr);
      });
    });
  });
});