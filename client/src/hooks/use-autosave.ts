/**
 * Hook for autosave functionality with localStorage backup
 */

import { useEffect, useRef, useCallback } from 'react';
import type { UseFormReturn } from 'react-hook-form';

export interface UseAutosaveOptions<T extends Record<string, any>> {
  form: UseFormReturn<T>;
  onSave?: (data: T) => Promise<void> | void;
  delay?: number; // Debounce delay in ms
  storageKey: string;
  enabled?: boolean;
}

export function useAutosave<T extends Record<string, any>>({
  form,
  onSave,
  delay = 3000,
  storageKey,
  enabled = true,
}: UseAutosaveOptions<T>) {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const lastSavedRef = useRef<string>('');
  const isOnlineRef = useRef(navigator.onLine);
  
  // Queue for offline saves
  const offlineQueueRef = useRef<T[]>([]);
  
  // Save to localStorage
  const saveToStorage = useCallback((data: T) => {
    try {
      const serialized = JSON.stringify({
        data,
        timestamp: Date.now(),
        isDraft: true,
      });
      localStorage.setItem(storageKey, serialized);
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  }, [storageKey]);
  
  // Load from localStorage
  const loadFromStorage = useCallback((): T | null => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) return null;
      
      const parsed = JSON.parse(stored);
      if (parsed.isDraft && parsed.data) {
        return parsed.data;
      }
    } catch (error) {
      console.warn('Failed to load from localStorage:', error);
    }
    return null;
  }, [storageKey]);
  
  // Clear localStorage draft
  const clearStorageDraft = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }
  }, [storageKey]);
  
  // Save function
  const performSave = useCallback(async (data: T) => {
    const currentData = JSON.stringify(data);
    
    // Skip if data hasn't changed
    if (currentData === lastSavedRef.current) {
      return;
    }
    
    // Always save to localStorage first
    saveToStorage(data);
    
    if (onSave) {
      try {
        if (isOnlineRef.current) {
          await onSave(data);
          lastSavedRef.current = currentData;
          
          // Clear localStorage draft after successful save
          clearStorageDraft();
        } else {
          // Queue for later if offline
          offlineQueueRef.current.push(data);
        }
      } catch (error) {
        console.warn('Autosave failed:', error);
        // Keep in localStorage for retry
      }
    } else {
      lastSavedRef.current = currentData;
    }
  }, [onSave, saveToStorage, clearStorageDraft]);
  
  // Debounced save
  const debouncedSave = useCallback((data: T) => {
    if (!enabled) return;
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      performSave(data);
    }, delay);
  }, [performSave, delay, enabled]);
  
  // Watch form values and trigger autosave
  const formValues = form.watch();
  
  useEffect(() => {
    debouncedSave(formValues);
  }, [formValues, debouncedSave]);
  
  // Handle online/offline status
  useEffect(() => {
    const handleOnline = async () => {
      isOnlineRef.current = true;
      
      // Process offline queue
      if (offlineQueueRef.current.length > 0 && onSave) {
        const queue = [...offlineQueueRef.current];
        offlineQueueRef.current = [];
        
        for (const data of queue) {
          try {
            await onSave(data);
            lastSavedRef.current = JSON.stringify(data);
          } catch (error) {
            console.warn('Failed to sync offline data:', error);
            // Re-queue failed items
            offlineQueueRef.current.push(data);
          }
        }
      }
    };
    
    const handleOffline = () => {
      isOnlineRef.current = false;
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [onSave]);
  
  // Load draft on mount
  useEffect(() => {
    const draft = loadFromStorage();
    if (draft) {
      form.reset(draft);
    }
  }, [form, loadFromStorage]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  return {
    saveNow: () => performSave(formValues),
    clearDraft: clearStorageDraft,
    hasDraft: () => loadFromStorage() !== null,
    isOnline: isOnlineRef.current,
    queueLength: offlineQueueRef.current.length,
  };
}