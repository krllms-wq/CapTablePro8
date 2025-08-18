/**
 * Hook for undo/redo functionality with keyboard shortcuts
 */

import { useState, useCallback, useEffect, useRef } from 'react';

export interface UseUndoRedoOptions<T> {
  maxHistorySize?: number;
  onUndo?: (state: T) => void;
  onRedo?: (state: T) => void;
  enableKeyboardShortcuts?: boolean;
}

export function useUndoRedo<T>(
  initialState: T,
  options: UseUndoRedoOptions<T> = {}
) {
  const {
    maxHistorySize = 50,
    onUndo,
    onRedo,
    enableKeyboardShortcuts = true,
  } = options;
  
  const [history, setHistory] = useState<T[]>([initialState]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentStateRef = useRef(initialState);
  
  const currentState = history[currentIndex];
  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;
  
  // Add new state to history
  const pushState = useCallback((newState: T) => {
    const stateString = JSON.stringify(newState);
    const currentString = JSON.stringify(currentStateRef.current);
    
    // Don't add if state hasn't changed
    if (stateString === currentString) {
      return;
    }
    
    setHistory(prev => {
      const newHistory = prev.slice(0, currentIndex + 1);
      newHistory.push(newState);
      
      // Limit history size
      if (newHistory.length > maxHistorySize) {
        return newHistory.slice(-maxHistorySize);
      }
      
      return newHistory;
    });
    
    setCurrentIndex(prev => {
      const newIndex = Math.min(prev + 1, maxHistorySize - 1);
      return newIndex;
    });
    
    currentStateRef.current = newState;
  }, [currentIndex, maxHistorySize]);
  
  // Undo to previous state
  const undo = useCallback(() => {
    if (!canUndo) return;
    
    const newIndex = currentIndex - 1;
    const prevState = history[newIndex];
    
    setCurrentIndex(newIndex);
    currentStateRef.current = prevState;
    
    if (onUndo) {
      onUndo(prevState);
    }
    
    return prevState;
  }, [canUndo, currentIndex, history, onUndo]);
  
  // Redo to next state
  const redo = useCallback(() => {
    if (!canRedo) return;
    
    const newIndex = currentIndex + 1;
    const nextState = history[newIndex];
    
    setCurrentIndex(newIndex);
    currentStateRef.current = nextState;
    
    if (onRedo) {
      onRedo(nextState);
    }
    
    return nextState;
  }, [canRedo, currentIndex, history, onRedo]);
  
  // Clear history
  const clearHistory = useCallback(() => {
    setHistory([currentState]);
    setCurrentIndex(0);
    currentStateRef.current = currentState;
  }, [currentState]);
  
  // Jump to specific index
  const jumpTo = useCallback((index: number) => {
    if (index < 0 || index >= history.length) return;
    
    const targetState = history[index];
    setCurrentIndex(index);
    currentStateRef.current = targetState;
    
    return targetState;
  }, [history]);
  
  // Keyboard shortcuts
  useEffect(() => {
    if (!enableKeyboardShortcuts) return;
    
    const handleKeyDown = (event: KeyboardEvent) => {
      const isCtrlOrCmd = event.ctrlKey || event.metaKey;
      
      if (isCtrlOrCmd && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        undo();
      } else if (
        isCtrlOrCmd && 
        (event.key === 'y' || (event.key === 'z' && event.shiftKey))
      ) {
        event.preventDefault();
        redo();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, enableKeyboardShortcuts]);
  
  return {
    currentState,
    pushState,
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
    jumpTo,
    history: history.map((state, index) => ({
      state,
      index,
      isCurrent: index === currentIndex,
    })),
    historyLength: history.length,
    currentIndex,
  };
}