/**
 * Hook for managing URL state with localStorage fallback
 */

import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';

export interface UseUrlStateOptions<T> {
  defaultValue: T;
  serialize?: (value: T) => string;
  deserialize?: (value: string) => T;
  storageKey?: string; // For localStorage fallback
}

export function useUrlState<T>(
  key: string,
  options: UseUrlStateOptions<T>
) {
  const [location, setLocation] = useLocation();
  const { defaultValue, serialize, deserialize, storageKey } = options;
  
  // Default serializers
  const defaultSerialize = (value: T): string => {
    if (typeof value === 'string') return value;
    return JSON.stringify(value);
  };
  
  const defaultDeserialize = (value: string): T => {
    try {
      return JSON.parse(value);
    } catch {
      return value as unknown as T;
    }
  };
  
  const serializeFn = serialize || defaultSerialize;
  const deserializeFn = deserialize || defaultDeserialize;
  
  // Parse current URL params
  const getUrlParams = useCallback(() => {
    const searchParams = new URLSearchParams(window.location.search);
    return searchParams;
  }, []);
  
  // Get value from URL or localStorage
  const getValue = useCallback((): T => {
    const urlParams = getUrlParams();
    const urlValue = urlParams.get(key);
    
    if (urlValue !== null) {
      try {
        return deserializeFn(urlValue);
      } catch {
        // Fall back to localStorage if URL param is invalid
      }
    }
    
    // Try localStorage as fallback
    if (storageKey) {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored !== null) {
          return deserializeFn(stored);
        }
      } catch {
        // Ignore localStorage errors
      }
    }
    
    return defaultValue;
  }, [key, deserializeFn, storageKey, defaultValue, getUrlParams]);
  
  const [value, setValue] = useState<T>(getValue);
  
  // Update URL and localStorage when value changes
  const updateValue = useCallback((newValue: T) => {
    setValue(newValue);
    
    const urlParams = getUrlParams();
    const serialized = serializeFn(newValue);
    
    // Update URL
    if (serialized === serializeFn(defaultValue)) {
      // Remove param if it's the default value
      urlParams.delete(key);
    } else {
      urlParams.set(key, serialized);
    }
    
    const newSearch = urlParams.toString();
    const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : '');
    
    // Update URL without triggering navigation
    window.history.replaceState(null, '', newUrl);
    
    // Update localStorage
    if (storageKey) {
      try {
        localStorage.setItem(storageKey, serialized);
      } catch {
        // Ignore localStorage errors
      }
    }
  }, [key, serializeFn, defaultValue, storageKey, getUrlParams]);
  
  // Sync with URL changes (back/forward navigation)
  useEffect(() => {
    const handlePopState = () => {
      setValue(getValue());
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [getValue]);
  
  // Sync when location changes
  useEffect(() => {
    setValue(getValue());
  }, [location, getValue]);
  
  return [value, updateValue] as const;
}

// Specialized hooks for common use cases
export function useUrlStringState(key: string, defaultValue: string = '', storageKey?: string) {
  return useUrlState(key, {
    defaultValue,
    serialize: (value) => value,
    deserialize: (value) => value,
    storageKey,
  });
}

export function useUrlNumberState(key: string, defaultValue: number = 0, storageKey?: string) {
  return useUrlState(key, {
    defaultValue,
    serialize: (value) => value.toString(),
    deserialize: (value) => {
      const num = parseFloat(value);
      return isNaN(num) ? defaultValue : num;
    },
    storageKey,
  });
}

export function useUrlBooleanState(key: string, defaultValue: boolean = false, storageKey?: string) {
  return useUrlState(key, {
    defaultValue,
    serialize: (value) => value ? 'true' : 'false',
    deserialize: (value) => value === 'true',
    storageKey,
  });
}

export function useUrlArrayState<T>(key: string, defaultValue: T[] = [], storageKey?: string) {
  return useUrlState(key, {
    defaultValue,
    serialize: (value) => JSON.stringify(value),
    deserialize: (value) => {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : defaultValue;
      } catch {
        return defaultValue;
      }
    },
    storageKey,
  });
}