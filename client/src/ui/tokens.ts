// Breakpoint tokens
export const breakpoints = {
  xs: 0,
  sm: 481,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

export type Breakpoint = keyof typeof breakpoints;

// Media query strings
export const mediaQueries = {
  xs: `(max-width: ${breakpoints.sm - 1}px)`,
  sm: `(min-width: ${breakpoints.sm}px) and (max-width: ${breakpoints.md - 1}px)`,
  md: `(min-width: ${breakpoints.md}px) and (max-width: ${breakpoints.lg - 1}px)`,
  lg: `(min-width: ${breakpoints.lg}px) and (max-width: ${breakpoints.xl - 1}px)`,
  xl: `(min-width: ${breakpoints.xl}px)`,
  mobile: `(max-width: ${breakpoints.md - 1}px)`,
  desktop: `(min-width: ${breakpoints.xl}px)`,
} as const;

// Touch target sizes
export const touchTargets = {
  min: 44,
  comfortable: 48,
  large: 56,
} as const;

// Spacing scale for mobile
export const spacing = {
  mobile: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
  },
  desktop: {
    xs: '0.5rem',
    sm: '0.75rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
  },
} as const;