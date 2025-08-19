// Client-side formatting utilities test
import {
  sanitizeMoneyInput,
  sanitizeSharesInput,
  formatDisplayValue,
  formatMoney,
  formatShares,
  formatDateForInput,
  createMoneyBlurHandler,
  createSharesBlurHandler
} from '@/utils/formatters';

describe('Number Formatting Utilities', () => {
  describe('sanitizeMoneyInput', () => {
    test('removes dollar signs and commas', () => {
      expect(sanitizeMoneyInput('$1,000.00')).toBe('1000');
      expect(sanitizeMoneyInput('$10,000,000')).toBe('10000000');
      expect(sanitizeMoneyInput('1,234.56')).toBe('1234.56');
    });

    test('handles various input formats', () => {
      expect(sanitizeMoneyInput('1000')).toBe('1000');
      expect(sanitizeMoneyInput('1,000')).toBe('1000');
      expect(sanitizeMoneyInput('$ 1,000.00 ')).toBe('1000');
      expect(sanitizeMoneyInput('1000.50')).toBe('1000.5');
    });

    test('enforces non-negative values', () => {
      expect(sanitizeMoneyInput('-1000')).toBe('0');
      expect(sanitizeMoneyInput('1000')).toBe('1000');
    });

    test('handles invalid input', () => {
      expect(sanitizeMoneyInput('')).toBe('');
      expect(sanitizeMoneyInput('abc')).toBe('');
      expect(sanitizeMoneyInput('$$$')).toBe('');
    });
  });

  describe('sanitizeSharesInput', () => {
    test('removes commas and keeps integers', () => {
      expect(sanitizeSharesInput('1,000,000')).toBe('1000000');
      expect(sanitizeSharesInput('1,000')).toBe('1000');
      expect(sanitizeSharesInput('1000')).toBe('1000');
    });

    test('removes decimal points', () => {
      expect(sanitizeSharesInput('1000.50')).toBe('1000');
      expect(sanitizeSharesInput('1,000.99')).toBe('1000');
    });

    test('handles invalid input', () => {
      expect(sanitizeSharesInput('')).toBe('');
      expect(sanitizeSharesInput('abc')).toBe('');
      expect(sanitizeSharesInput('1,000 shares')).toBe('1000');
    });
  });

  describe('formatDisplayValue', () => {
    test('formats numbers with proper decimals', () => {
      expect(formatDisplayValue(1000, 2)).toBe('1,000.00');
      expect(formatDisplayValue(1000000, 0)).toBe('1,000,000');
      expect(formatDisplayValue('1234.567', 2)).toBe('1,234.57');
    });
  });

  describe('formatMoney', () => {
    test('formats currency with $ symbol', () => {
      expect(formatMoney(1000)).toBe('$1,000.00');
      expect(formatMoney('1234.56')).toBe('$1,234.56');
      expect(formatMoney(0)).toBe('$0.00');
    });
  });

  describe('formatShares', () => {
    test('formats shares without decimals', () => {
      expect(formatShares(1000000)).toBe('1,000,000');
      expect(formatShares('1000')).toBe('1,000');
      expect(formatShares(0)).toBe('0');
    });
  });

  describe('formatDateForInput', () => {
    test('formats dates for input fields', () => {
      const date = new Date('2023-06-15T00:00:00.000Z');
      expect(formatDateForInput(date)).toBe('2023-06-15');
      expect(formatDateForInput('2023-06-15')).toBe('2023-06-15');
    });
  });

  describe('Blur handlers', () => {
    test('createMoneyBlurHandler formats on blur', () => {
      const mockField = { onChange: jest.fn() };
      const mockEvent = {
        target: { value: '$1,000.00' }
      };
      
      const handler = createMoneyBlurHandler(mockField);
      handler(mockEvent as any);
      
      expect(mockField.onChange).toHaveBeenCalledWith('1000');
      expect(mockEvent.target.value).toBe('1,000.00');
    });

    test('createSharesBlurHandler formats on blur', () => {
      const mockField = { onChange: jest.fn() };
      const mockEvent = {
        target: { value: '1,000,000' }
      };
      
      const handler = createSharesBlurHandler(mockField);
      handler(mockEvent as any);
      
      expect(mockField.onChange).toHaveBeenCalledWith('1000000');
      expect(mockEvent.target.value).toBe('1,000,000');
    });
  });
});