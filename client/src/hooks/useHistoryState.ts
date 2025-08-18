import { useState, useCallback, useRef, useEffect } from "react"

interface HistoryAction<T> {
  type: 'set' | 'update'
  value: T
  previousValue: T
  timestamp: number
}

interface UseHistoryStateOptions {
  maxHistory?: number
}

export function useHistoryState<T>(
  initialValue: T,
  options: UseHistoryStateOptions = {}
) {
  const { maxHistory = 50 } = options
  
  const [value, setValue] = useState<T>(initialValue)
  const history = useRef<HistoryAction<T>[]>([])
  const currentIndex = useRef(-1)

  // Add action to history
  const addToHistory = useCallback((action: HistoryAction<T>) => {
    // Remove any future history if we're not at the end
    if (currentIndex.current < history.current.length - 1) {
      history.current = history.current.slice(0, currentIndex.current + 1)
    }

    // Add new action
    history.current.push(action)
    currentIndex.current = history.current.length - 1

    // Trim history if it exceeds maxHistory
    if (history.current.length > maxHistory) {
      history.current = history.current.slice(-maxHistory)
      currentIndex.current = history.current.length - 1
    }
  }, [maxHistory])

  // Set value and add to history
  const setValueWithHistory = useCallback((newValue: T | ((prev: T) => T)) => {
    setValue(prevValue => {
      const actualNewValue = typeof newValue === 'function' 
        ? (newValue as (prev: T) => T)(prevValue) 
        : newValue

      // Only add to history if value actually changed
      if (JSON.stringify(actualNewValue) !== JSON.stringify(prevValue)) {
        addToHistory({
          type: 'set',
          value: actualNewValue,
          previousValue: prevValue,
          timestamp: Date.now(),
        })
      }

      return actualNewValue
    })
  }, [addToHistory])

  // Undo function
  const undo = useCallback(() => {
    if (currentIndex.current > 0) {
      currentIndex.current--
      const previousAction = history.current[currentIndex.current]
      setValue(previousAction.previousValue)
      return true
    }
    return false
  }, [])

  // Redo function
  const redo = useCallback(() => {
    if (currentIndex.current < history.current.length - 1) {
      currentIndex.current++
      const nextAction = history.current[currentIndex.current]
      setValue(nextAction.value)
      return true
    }
    return false
  }, [])

  // Check if undo/redo is available
  const canUndo = currentIndex.current > 0
  const canRedo = currentIndex.current < history.current.length - 1

  // Clear history
  const clearHistory = useCallback(() => {
    history.current = []
    currentIndex.current = -1
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
        event.preventDefault()
        
        if (event.shiftKey) {
          redo()
        } else {
          undo()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo])

  return {
    value,
    setValue: setValueWithHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
    historyLength: history.current.length,
    currentHistoryIndex: currentIndex.current,
  }
}