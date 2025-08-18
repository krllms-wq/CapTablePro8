import { useState, useEffect } from 'react';
import { breakpoints, type Breakpoint } from '../tokens';

// SSR-safe media query hook
export function useMedia(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    // SSR-safe: return false during server-side rendering
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Set initial value
    setMatches(mediaQuery.matches);

    // Listen for changes
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

// Breakpoint-specific hooks
export function useBreakpoint(breakpoint: Breakpoint): boolean {
  const query = `(min-width: ${breakpoints[breakpoint]}px)`;
  return useMedia(query);
}

export function useIsMobile(): boolean {
  return useMedia('(max-width: 767px)');
}

export function useIsTablet(): boolean {
  return useMedia('(min-width: 768px) and (max-width: 1023px)');
}

export function useIsDesktop(): boolean {
  return useMedia('(min-width: 1280px)');
}

// Current breakpoint hook
export function useCurrentBreakpoint(): Breakpoint {
  const isXl = useBreakpoint('xl');
  const isLg = useBreakpoint('lg');
  const isMd = useBreakpoint('md');
  const isSm = useBreakpoint('sm');

  if (isXl) return 'xl';
  if (isLg) return 'lg';
  if (isMd) return 'md';
  if (isSm) return 'sm';
  return 'xs';
}

// Responsive value hook
export function useResponsiveValue<T>(values: Partial<Record<Breakpoint, T>>): T | undefined {
  const currentBreakpoint = useCurrentBreakpoint();
  
  // Find the best matching value by checking current and smaller breakpoints
  const breakpointOrder: Breakpoint[] = ['xl', 'lg', 'md', 'sm', 'xs'];
  const currentIndex = breakpointOrder.indexOf(currentBreakpoint);
  
  for (let i = currentIndex; i < breakpointOrder.length; i++) {
    const bp = breakpointOrder[i];
    if (values[bp] !== undefined) {
      return values[bp];
    }
  }
  
  return undefined;
}