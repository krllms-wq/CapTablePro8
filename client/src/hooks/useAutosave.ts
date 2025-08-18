import { useState, useEffect, useRef, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"

interface AutosaveOptions<T> {
  key: string
  data: T
  onSave?: (data: T) => Promise<void>
  interval?: number
  enabled?: boolean
}

export function useAutosave<T>({
  key,
  data,
  onSave,
  interval = 5000,
  enabled = true,
}: AutosaveOptions<T>) {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [queuedData, setQueuedData] = useState<T | null>(null)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error' | 'offline'>('idle')
  const intervalRef = useRef<NodeJS.Timeout>()
  const lastSavedRef = useRef<string>('')
  const { toast } = useToast()

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      if (queuedData && onSave) {
        // Sync queued data when back online
        handleSave(queuedData)
        setQueuedData(null)
      }
    }

    const handleOffline = () => {
      setIsOnline(false)
      setSaveStatus('offline')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [queuedData, onSave])

  // Save to localStorage
  const saveToLocal = useCallback((data: T) => {
    try {
      localStorage.setItem(`autosave_${key}`, JSON.stringify({
        data,
        timestamp: Date.now(),
      }))
    } catch (error) {
      console.warn('Failed to save to localStorage:', error)
    }
  }, [key])

  // Load from localStorage
  const loadFromLocal = useCallback((): T | null => {
    try {
      const saved = localStorage.getItem(`autosave_${key}`)
      if (saved) {
        const parsed = JSON.parse(saved)
        return parsed.data
      }
    } catch (error) {
      console.warn('Failed to load from localStorage:', error)
    }
    return null
  }, [key])

  // Clear localStorage
  const clearLocal = useCallback(() => {
    try {
      localStorage.removeItem(`autosave_${key}`)
    } catch (error) {
      console.warn('Failed to clear localStorage:', error)
    }
  }, [key])

  // Handle save operation
  const handleSave = useCallback(async (dataToSave: T) => {
    if (!enabled) return

    setSaveStatus('saving')
    
    try {
      if (isOnline && onSave) {
        await onSave(dataToSave)
        setSaveStatus('saved')
        clearLocal()
        
        // Show brief "saved" status
        setTimeout(() => {
          setSaveStatus('idle')
        }, 2000)
      } else {
        // Save offline
        saveToLocal(dataToSave)
        setQueuedData(dataToSave)
        setSaveStatus('offline')
        
        toast({
          title: "Saved offline",
          description: "Changes will sync when you're back online",
          variant: "info",
        })
      }
    } catch (error) {
      setSaveStatus('error')
      console.error('Autosave failed:', error)
      
      toast({
        title: "Save failed",
        description: "Your changes are saved locally and will retry automatically",
        variant: "warn",
      })
      
      // Fallback to localStorage
      saveToLocal(dataToSave)
      setQueuedData(dataToSave)
    }
  }, [enabled, isOnline, onSave, saveToLocal, clearLocal, toast])

  // Auto-save effect
  useEffect(() => {
    if (!enabled) return

    const dataString = JSON.stringify(data)
    
    // Skip if data hasn't changed
    if (dataString === lastSavedRef.current) {
      return
    }

    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    // Set new interval for autosave
    intervalRef.current = setTimeout(() => {
      handleSave(data)
      lastSavedRef.current = dataString
    }, interval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [data, enabled, interval, handleSave])

  // Manual save function
  const saveNow = useCallback(() => {
    handleSave(data)
    lastSavedRef.current = JSON.stringify(data)
  }, [data, handleSave])

  // Get status display
  const getStatusDisplay = () => {
    switch (saveStatus) {
      case 'saving':
        return 'Saving...'
      case 'saved':
        return 'Saved'
      case 'offline':
        return 'Saved offline'
      case 'error':
        return 'Save failed'
      default:
        return ''
    }
  }

  return {
    saveStatus,
    statusDisplay: getStatusDisplay(),
    isOnline,
    saveNow,
    loadFromLocal,
    clearLocal,
    hasUnsavedChanges: queuedData !== null,
  }
}