/**
 * Enhanced toast system with better UX and accessibility
 */

import React from 'react';
import { Link } from 'wouter';
import { cn } from '@/lib/utils';
import { 
  Toast, 
  ToastClose, 
  ToastDescription, 
  ToastProvider, 
  ToastTitle, 
  ToastViewport 
} from './toast';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, AlertCircle, Info, XCircle, ExternalLink } from 'lucide-react';

export interface ToastAction {
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface EnhancedToastProps {
  title: string;
  description?: string;
  variant?: 'default' | 'success' | 'warn' | 'error' | 'info';
  duration?: number;
  action?: ToastAction;
}

const toastIcons = {
  default: null,
  success: CheckCircle,
  warn: AlertCircle,
  error: XCircle,
  info: Info,
};

const toastStyles = {
  default: '',
  success: 'border-green-200 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-100',
  warn: 'border-yellow-200 bg-yellow-50 text-yellow-900 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-100',
  error: 'border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100',
  info: 'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100',
};

export function EnhancedToaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant = 'default', ...props }) {
        const Icon = toastIcons[variant as keyof typeof toastIcons];
        
        return (
          <Toast
            key={id}
            className={cn(
              toastStyles[variant as keyof typeof toastStyles],
              "group relative flex w-full items-start justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all"
            )}
            {...props}
          >
            <div className="flex items-start space-x-3">
              {Icon && (
                <Icon className="mt-0.5 h-5 w-5 flex-shrink-0" aria-hidden="true" />
              )}
              
              <div className="flex-1 space-y-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription className="text-sm opacity-90">
                    {description}
                  </ToastDescription>
                )}
                
                {action && (
                  <div className="mt-3">
                    {action.href ? (
                      <Link
                        href={action.href}
                        className="inline-flex items-center gap-1 text-sm font-medium underline underline-offset-4 hover:no-underline"
                      >
                        {action.label}
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    ) : (
                      <button
                        onClick={action.onClick}
                        className="text-sm font-medium underline underline-offset-4 hover:no-underline"
                      >
                        {action.label}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}

// Enhanced hook for easier toast usage
export function useEnhancedToast() {
  const { toast, dismiss, toasts } = useToast();
  
  const showToast = (props: EnhancedToastProps) => {
    const { variant = 'default', duration = 5000, ...rest } = props;
    
    return toast({
      ...rest,
      variant,
      duration,
    });
  };
  
  const success = (title: string, description?: string, action?: ToastAction) => {
    return showToast({
      title,
      description,
      action,
      variant: 'success',
      duration: 4000,
    });
  };
  
  const error = (title: string, description?: string, action?: ToastAction) => {
    return showToast({
      title,
      description,
      action,
      variant: 'error',
      duration: 6000,
    });
  };
  
  const warning = (title: string, description?: string, action?: ToastAction) => {
    return showToast({
      title,
      description,
      action,
      variant: 'warning',
      duration: 5000,
    });
  };
  
  const info = (title: string, description?: string, action?: ToastAction) => {
    return showToast({
      title,
      description,
      action,
      variant: 'info',
      duration: 4000,
    });
  };
  
  // Prevent duplicate toasts
  const showUniqueToast = (props: EnhancedToastProps & { id?: string }) => {
    const { id, ...toastProps } = props;
    
    if (id) {
      // Check if toast with this ID already exists
      const existingToast = toasts.find(t => t.id === id);
      if (existingToast) {
        return existingToast;
      }
    }
    
    return showToast(toastProps);
  };
  
  return {
    toast: showToast,
    success,
    error,
    warning,
    info,
    dismiss,
    toasts,
    showUniqueToast,
  };
}