import { useState, useEffect, useCallback } from "react"
import { useLocation } from "wouter"

interface UrlStateOptions<T> {
  key: string
  defaultValue: T
  serialize?: (value: T) => string
  deserialize?: (value: string) => T
}

export function useUrlState<T>({
  key,
  defaultValue,
  serialize = JSON.stringify,
  deserialize = JSON.parse,
}: UrlStateOptions<T>) {
  const [location, setLocation] = useLocation()
  
  const getValueFromUrl = useCallback(() => {
    const params = new URLSearchParams(window.location.search)
    const value = params.get(key)
    
    if (value === null) {
      return defaultValue
    }
    
    try {
      return deserialize(value)
    } catch {
      return defaultValue
    }
  }, [key, defaultValue, deserialize])

  const [state, setState] = useState<T>(getValueFromUrl)

  const updateState = useCallback((newValue: T | ((prev: T) => T)) => {
    const value = typeof newValue === 'function' ? (newValue as (prev: T) => T)(state) : newValue
    setState(value)
    
    const params = new URLSearchParams(window.location.search)
    
    if (value === defaultValue) {
      params.delete(key)
    } else {
      params.set(key, serialize(value))
    }
    
    const newSearch = params.toString()
    const newUrl = `${window.location.pathname}${newSearch ? `?${newSearch}` : ''}`
    
    // Update URL without triggering navigation
    window.history.replaceState({}, '', newUrl)
  }, [key, state, defaultValue, serialize])

  // Listen for popstate events (back/forward navigation)
  useEffect(() => {
    const handlePopState = () => {
      setState(getValueFromUrl())
    }
    
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [getValueFromUrl])

  // Listen for URL changes
  useEffect(() => {
    setState(getValueFromUrl())
  }, [location, getValueFromUrl])

  return [state, updateState] as const
}

// Helper hooks for common use cases
export function useUrlFilters<T extends Record<string, any>>(defaultFilters: T) {
  return useUrlState({
    key: 'filters',
    defaultValue: defaultFilters,
  })
}

export function useUrlSort(defaultSort: { field: string; direction: 'asc' | 'desc' }) {
  return useUrlState({
    key: 'sort',
    defaultValue: defaultSort,
  })
}

export function useUrlPagination(defaultPage: number = 1) {
  return useUrlState({
    key: 'page',
    defaultValue: defaultPage,
    serialize: String,
    deserialize: (value) => {
      const num = parseInt(value, 10)
      return isNaN(num) ? defaultPage : num
    },
  })
}