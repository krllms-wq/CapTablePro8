import { useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

export interface ErrorDetails {
  message: string;
  code?: string;
  field?: string;
  details?: any;
}

export function useErrorHandler() {
  const { toast } = useToast();

  const handleError = useCallback((error: any, context?: string) => {
    console.error(`Error in ${context || 'application'}:`, error);

    // Extract meaningful error message
    let errorMessage = "An unexpected error occurred";
    let errorDetails: ErrorDetails | null = null;

    if (error?.response?.data) {
      const data = error.response.data;
      errorMessage = data.error || data.message || errorMessage;
      errorDetails = {
        message: errorMessage,
        code: data.code,
        details: data.details
      };
    } else if (error?.message) {
      errorMessage = error.message;
      errorDetails = {
        message: errorMessage,
        code: error.code
      };
    } else if (typeof error === 'string') {
      errorMessage = error;
      errorDetails = {
        message: errorMessage
      };
    }

    // Show user-friendly toast
    toast({
      title: "Error",
      description: errorMessage,
      variant: "error",
    });

    return errorDetails;
  }, [toast]);

  const handleValidationError = useCallback((errors: any[]) => {
    const firstError = errors[0];
    const fieldName = firstError.path?.join('.') || 'field';
    const message = `${fieldName}: ${firstError.message}`;
    
    toast({
      title: "Validation Error",
      description: message,
      variant: "error",
    });

    return {
      message,
      field: fieldName,
      details: errors
    };
  }, [toast]);

  const handleNetworkError = useCallback(() => {
    toast({
      title: "Connection Error",
      description: "Please check your internet connection and try again.",
      variant: "error",
    });
  }, [toast]);

  return {
    handleError,
    handleValidationError,
    handleNetworkError
  };
}