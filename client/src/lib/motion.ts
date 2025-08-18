/**
 * Motion utility that respects prefers-reduced-motion
 * Disables transitions/animations when user prefers reduced motion
 */

let reducedMotionQuery: MediaQueryList | null = null;

if (typeof window !== 'undefined') {
  reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
}

export function prefersReducedMotion(): boolean {
  return reducedMotionQuery?.matches ?? false;
}

export function getMotionProps(motionProps: Record<string, any>) {
  if (prefersReducedMotion()) {
    return {};
  }
  return motionProps;
}

export function getTransition(duration: string = "200ms", easing: string = "ease-in-out"): string {
  if (prefersReducedMotion()) {
    return "none";
  }
  return `all ${duration} ${easing}`;
}

export function getAnimationClass(animationClass: string): string {
  if (prefersReducedMotion()) {
    return "";
  }
  return animationClass;
}

// Hook to listen for motion preference changes
export function useReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  
  const [prefersReduced, setPrefersReduced] = React.useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReduced(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReduced;
}

// Import React for the hook
import * as React from 'react';