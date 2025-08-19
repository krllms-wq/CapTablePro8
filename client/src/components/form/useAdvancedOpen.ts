import { useState, useEffect } from 'react';
import { FieldErrors } from 'react-hook-form';

interface UseAdvancedOpenOptions {
  /** Form errors object from react-hook-form */
  errors: FieldErrors;
  /** Form values to check for non-default values */
  values: Record<string, any>;
  /** Field names that are considered "advanced" and should trigger accordion open */
  advancedFields: string[];
  /** Default values to compare against for auto-opening */
  defaultValues?: Record<string, any>;
  /** Whether to auto-open on errors in advanced fields */
  autoOpenOnErrors?: boolean;
  /** Whether to auto-open when advanced fields have non-default values */
  autoOpenOnValues?: boolean;
}

/**
 * Hook to manage advanced settings accordion state
 * Auto-opens when advanced fields have errors or non-default values
 */
export function useAdvancedOpen({
  errors,
  values,
  advancedFields,
  defaultValues = {},
  autoOpenOnErrors = true,
  autoOpenOnValues = true,
}: UseAdvancedOpenOptions) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check for errors in advanced fields
    if (autoOpenOnErrors) {
      const hasAdvancedErrors = advancedFields.some(field => errors[field]);
      if (hasAdvancedErrors && !isOpen) {
        setIsOpen(true);
        return;
      }
    }

    // Check for non-default values in advanced fields
    if (autoOpenOnValues) {
      const hasNonDefaultValues = advancedFields.some(field => {
        const currentValue = values[field];
        const defaultValue = defaultValues[field];
        
        // Consider a field as having a non-default value if:
        // 1. It has a truthy value and no default was set
        // 2. It differs from the specified default value
        if (defaultValue === undefined || defaultValue === null) {
          return currentValue && currentValue !== '' && currentValue !== '0';
        }
        
        return currentValue !== defaultValue;
      });
      
      if (hasNonDefaultValues && !isOpen) {
        setIsOpen(true);
      }
    }
  }, [errors, values, advancedFields, defaultValues, autoOpenOnErrors, autoOpenOnValues, isOpen]);

  return {
    isOpen,
    setIsOpen,
    /** Manually open the accordion */
    open: () => setIsOpen(true),
    /** Manually close the accordion */
    close: () => setIsOpen(false),
    /** Toggle the accordion state */
    toggle: () => setIsOpen(prev => !prev),
  };
}