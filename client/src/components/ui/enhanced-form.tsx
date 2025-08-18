/**
 * Enhanced form components with better UX and validation
 */

import React, { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { Input } from './input';
import { Label } from './label';
import { Button } from './button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';
import { HelpCircle, Calendar as CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Calendar } from './calendar';
import { formatInputValue, getInputExample } from '@/utils/parseCurrency';
import { formatDate, dateToISOString, parseISODate } from '@/utils/dateHelpers';
import { generateId } from '@/utils/accessibility';

export interface EnhancedInputProps {
  id?: string;
  name: string;
  label: string;
  type?: 'currency' | 'number' | 'percentage' | 'shares' | 'text' | 'email';
  placeholder?: string;
  helpText?: string;
  required?: boolean;
  disabled?: boolean;
  form: UseFormReturn<any>;
  className?: string;
  min?: number;
  max?: number;
  step?: number;
  autoComplete?: string;
  'aria-describedby'?: string;
}

export function EnhancedInput({
  id,
  name,
  label,
  type = 'text',
  placeholder,
  helpText,
  required = false,
  disabled = false,
  form,
  className,
  min,
  max,
  step,
  autoComplete,
  'aria-describedby': ariaDescribedBy,
  ...props
}: EnhancedInputProps) {
  const fieldId = id || generateId(name);
  const helpId = `${fieldId}-help`;
  const errorId = `${fieldId}-error`;
  
  const {
    register,
    formState: { errors, touchedFields },
    setValue,
    watch
  } = form;
  
  const fieldError = errors[name];
  const isTouched = touchedFields[name];
  const currentValue = watch(name);
  
  // Handle numeric input formatting
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    if (type === 'currency' || type === 'number' || type === 'shares') {
      // Allow user to type freely, but format for display
      const formatted = formatInputValue(value, type === 'currency' ? 'currency' : 'number');
      setValue(name, formatted, { shouldValidate: isTouched });
    } else if (type === 'percentage') {
      setValue(name, value, { shouldValidate: isTouched });
    } else {
      setValue(name, value, { shouldValidate: isTouched });
    }
  };

  // Get appropriate input mode for mobile keyboards
  const getInputMode = (): React.HTMLAttributes<HTMLInputElement>['inputMode'] => {
    switch (type) {
      case 'currency':
      case 'number':
      case 'shares':
      case 'percentage':
        return 'numeric';
      case 'email':
        return 'email';
      default:
        return 'text';
    }
  };

  // Get example text
  const exampleText = placeholder || getInputExample(
    type === 'currency' ? 'currency' :
    type === 'shares' ? 'shares' :
    type === 'percentage' ? 'percentage' :
    type === 'number' ? 'currency' : 'currency'
  );

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2">
        <Label 
          htmlFor={fieldId}
          className={cn(
            "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
            fieldError && isTouched && "text-destructive"
          )}
        >
          {label}
          {required && <span className="text-destructive ml-1" aria-label="required">*</span>}
        </Label>
        
        {helpText && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 text-muted-foreground hover:text-foreground"
                  aria-describedby={helpId}
                >
                  <HelpCircle className="h-3 w-3" />
                  <span className="sr-only">Help for {label}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-sm">{helpText}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      
      <Input
        {...register(name, {
          required: required ? `${label} is required` : false,
          min: min ? { value: min, message: `Must be at least ${min}` } : undefined,
          max: max ? { value: max, message: `Must be at most ${max}` } : undefined,
        })}
        id={fieldId}
        type={type === 'currency' || type === 'number' || type === 'shares' || type === 'percentage' ? 'text' : type}
        placeholder={exampleText}
        disabled={disabled}
        inputMode={getInputMode()}
        autoComplete={autoComplete}
        step={step}
        className={cn(
          fieldError && isTouched && "border-destructive focus-visible:ring-destructive"
        )}
        aria-describedby={cn(
          helpText && helpId,
          fieldError && isTouched && errorId,
          ariaDescribedBy
        )}
        aria-invalid={fieldError && isTouched ? 'true' : 'false'}
        aria-required={required}
        onChange={handleInputChange}
        {...props}
      />
      
      {/* Helper text */}
      {exampleText && !fieldError && (
        <p id={helpId} className="text-xs text-muted-foreground">
          {exampleText}
        </p>
      )}
      
      {/* Error message */}
      {fieldError && isTouched && (
        <p id={errorId} className="text-xs text-destructive" role="alert">
          {typeof fieldError === 'string' ? fieldError : fieldError?.message}
        </p>
      )}
    </div>
  );
}

export interface EnhancedDatePickerProps {
  id?: string;
  name: string;
  label: string;
  placeholder?: string;
  helpText?: string;
  required?: boolean;
  disabled?: boolean;
  form: UseFormReturn<any>;
  className?: string;
  minDate?: Date;
  maxDate?: Date;
}

export function EnhancedDatePicker({
  id,
  name,
  label,
  placeholder = "Select a date",
  helpText,
  required = false,
  disabled = false,
  form,
  className,
  minDate,
  maxDate,
  ...props
}: EnhancedDatePickerProps) {
  const fieldId = id || generateId(name);
  const helpId = `${fieldId}-help`;
  const errorId = `${fieldId}-error`;
  const [isOpen, setIsOpen] = useState(false);
  
  const {
    formState: { errors, touchedFields },
    setValue,
    watch
  } = form;
  
  const fieldError = errors[name];
  const isTouched = touchedFields[name];
  const currentValue = watch(name);
  
  // Parse current value to Date
  const selectedDate = currentValue ? parseISODate(currentValue) : null;
  
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      // Convert to ISO string in UTC, stripped of time
      const isoString = dateToISOString(date);
      setValue(name, isoString, { shouldValidate: isTouched });
    } else {
      setValue(name, null, { shouldValidate: isTouched });
    }
    setIsOpen(false);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2">
        <Label 
          htmlFor={fieldId}
          className={cn(
            "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
            fieldError && isTouched && "text-destructive"
          )}
        >
          {label}
          {required && <span className="text-destructive ml-1" aria-label="required">*</span>}
        </Label>
        
        {helpText && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 text-muted-foreground hover:text-foreground"
                >
                  <HelpCircle className="h-3 w-3" />
                  <span className="sr-only">Help for {label}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-sm">{helpText}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id={fieldId}
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !selectedDate && "text-muted-foreground",
              fieldError && isTouched && "border-destructive"
            )}
            disabled={disabled}
            aria-describedby={cn(
              helpText && helpId,
              fieldError && isTouched && errorId
            )}
            aria-invalid={fieldError && isTouched ? 'true' : 'false'}
            aria-required={required}
            aria-expanded={isOpen}
            aria-haspopup="dialog"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedDate ? formatDate(selectedDate) : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate || undefined}
            onSelect={handleDateSelect}
            disabled={(date) => {
              if (minDate && date < minDate) return true;
              if (maxDate && date > maxDate) return true;
              return false;
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      
      {/* Helper text */}
      {helpText && !fieldError && (
        <p id={helpId} className="text-xs text-muted-foreground">
          {helpText}
        </p>
      )}
      
      {/* Error message */}
      {fieldError && isTouched && (
        <p id={errorId} className="text-xs text-destructive" role="alert">
          {typeof fieldError === 'string' ? fieldError : fieldError?.message}
        </p>
      )}
    </div>
  );
}

export interface StickyFormFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function StickyFormFooter({ children, className }: StickyFormFooterProps) {
  return (
    <div className={cn(
      "sticky bottom-0 z-10 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-6 mt-6",
      className
    )}>
      {children}
    </div>
  );
}

export interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormSection({ title, description, children, className }: FormSectionProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-1">
        <h3 className="text-lg font-medium">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}