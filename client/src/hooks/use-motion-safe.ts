/**
 * Hook for respecting user's motion preferences
 */

import { useState, useEffect } from 'react';

export function useMotionSafe() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    
    // Set initial value
    setPrefersReducedMotion(mediaQuery.matches);
    
    // Listen for changes
    mediaQuery.addEventListener('change', handleChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);
  
  return {
    prefersReducedMotion,
    motionSafe: !prefersReducedMotion,
  };
}

// Utility function for conditional animation classes
export function motionSafe(
  motionClasses: string, 
  reducedMotionClasses: string = '',
  prefersReducedMotion?: boolean
) {
  if (prefersReducedMotion === undefined) {
    // Use CSS approach when hook value is not available
    return `motion-safe:${motionClasses.split(' ').join(' motion-safe:')} ${reducedMotionClasses}`;
  }
  
  return prefersReducedMotion ? reducedMotionClasses : motionClasses;
}