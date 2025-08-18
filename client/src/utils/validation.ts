/**
 * Enhanced validation utilities and Zod schemas
 */

import { z } from 'zod';
import { parseCurrency, parsePercentage } from './parseCurrency';

/**
 * Custom Zod transforms for user-friendly inputs
 */

// Transform string input to number, handling commas and currency symbols
export const currencyTransform = z
  .union([z.string(), z.number()])
  .transform((val) => parseCurrency(val))
  .refine((val) => !isNaN(val), { message: 'Must be a valid number' });

// Transform percentage input to decimal
export const percentageTransform = z
  .union([z.string(), z.number()])
  .transform((val) => parsePercentage(val))
  .refine((val) => !isNaN(val) && val >= 0 && val <= 1, { 
    message: 'Must be a valid percentage between 0% and 100%' 
  });

// Positive currency amount
export const positiveCurrencySchema = currencyTransform
  .refine((val) => val > 0, { message: 'Must be greater than 0' });

// Non-negative currency amount
export const nonNegativeCurrencySchema = currencyTransform
  .refine((val) => val >= 0, { message: 'Must be 0 or greater' });

// Share quantity (positive integer or decimal)
export const shareQuantitySchema = currencyTransform
  .refine((val) => val > 0, { message: 'Must be greater than 0' })
  .refine((val) => val <= 1e12, { message: 'Share quantity too large' });

// Strike price (non-negative for options, zero for RSUs)
export const strikePriceSchema = nonNegativeCurrencySchema;

// Valuation amount
export const valuationSchema = positiveCurrencySchema
  .refine((val) => val >= 1000, { message: 'Valuation must be at least $1,000' });

// Interest rate (0-100%)
export const interestRateSchema = percentageTransform
  .refine((val) => val >= 0 && val <= 1, { 
    message: 'Interest rate must be between 0% and 100%' 
  });

// Discount rate (0-99%)
export const discountRateSchema = percentageTransform
  .refine((val) => val >= 0 && val < 1, { 
    message: 'Discount must be between 0% and 99%' 
  });

/**
 * Date validation schemas
 */
export const dateSchema = z
  .date()
  .refine((date) => date <= new Date(), { 
    message: 'Date cannot be in the future' 
  });

export const futureDateSchema = z
  .date()
  .refine((date) => date >= new Date(), { 
    message: 'Date must be in the future' 
  });

/**
 * Common field validation schemas
 */
export const requiredStringSchema = z
  .string()
  .min(1, { message: 'This field is required' })
  .trim();

export const optionalStringSchema = z
  .string()
  .optional()
  .transform((val) => val || undefined);

export const emailSchema = z
  .string()
  .email({ message: 'Must be a valid email address' })
  .trim()
  .toLowerCase();

/**
 * Business-specific validation schemas
 */

// Share issuance validation
export const shareIssuanceSchema = z.object({
  stakeholderId: requiredStringSchema,
  classId: requiredStringSchema,
  quantity: shareQuantitySchema,
  pricePerShare: nonNegativeCurrencySchema,
  issueDate: dateSchema,
  notes: optionalStringSchema
});

// SAFE agreement validation
export const safeSchema = z.object({
  stakeholderId: requiredStringSchema,
  principal: positiveCurrencySchema,
  valuationCap: valuationSchema.optional(),
  discount: discountRateSchema.optional(),
  postMoney: z.boolean().default(false),
  issueDate: dateSchema,
  notes: optionalStringSchema
}).refine(
  (data) => data.valuationCap || data.discount,
  {
    message: 'Must have either valuation cap or discount',
    path: ['valuationCap']
  }
);

// Convertible note validation
export const convertibleNoteSchema = z.object({
  stakeholderId: requiredStringSchema,
  principal: positiveCurrencySchema,
  interestRate: interestRateSchema,
  maturityDate: futureDateSchema,
  discount: discountRateSchema.optional(),
  valuationCap: valuationSchema.optional(),
  issueDate: dateSchema,
  notes: optionalStringSchema
});

// Equity award validation (options/RSUs)
export const equityAwardSchema = z.object({
  stakeholderId: requiredStringSchema,
  type: z.enum(['ISO', 'NQSO', 'RSU']),
  quantity: shareQuantitySchema,
  strikePrice: strikePriceSchema.optional(),
  grantDate: dateSchema,
  vestingStartDate: dateSchema,
  cliffMonths: z.number().min(0).max(120),
  totalMonths: z.number().min(1).max(240),
  notes: optionalStringSchema
}).refine(
  (data) => {
    // RSUs should not have strike price
    if (data.type === 'RSU') {
      return !data.strikePrice || data.strikePrice === 0;
    }
    // Options must have strike price
    return data.strikePrice !== undefined && data.strikePrice >= 0;
  },
  {
    message: 'RSUs cannot have strike price, options must have strike price',
    path: ['strikePrice']
  }
);

/**
 * Validation helper functions
 */

export function validateRequired(value: any, fieldName: string): string | null {
  if (value === null || value === undefined || value === '') {
    return `${fieldName} is required`;
  }
  return null;
}

export function validatePositiveNumber(value: number, fieldName: string): string | null {
  if (isNaN(value) || value <= 0) {
    return `${fieldName} must be a positive number`;
  }
  return null;
}

export function validateEmail(email: string): string | null {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Must be a valid email address';
  }
  return null;
}

export function validateDateRange(
  startDate: Date,
  endDate: Date,
  fieldName: string = 'Date range'
): string | null {
  if (startDate >= endDate) {
    return `${fieldName}: Start date must be before end date`;
  }
  return null;
}

/**
 * Form field validation state
 */
export interface FieldValidation {
  isValid: boolean;
  error: string | null;
  touched: boolean;
}

export function createFieldValidation(): FieldValidation {
  return {
    isValid: true,
    error: null,
    touched: false
  };
}

export function updateFieldValidation(
  current: FieldValidation,
  error: string | null,
  touched: boolean = true
): FieldValidation {
  return {
    isValid: error === null,
    error,
    touched
  };
}