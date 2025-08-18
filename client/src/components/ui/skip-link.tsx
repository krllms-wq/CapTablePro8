/**
 * Skip link component for keyboard accessibility
 */

import React from 'react';
import { cn } from '@/lib/utils';

export interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export function SkipLink({ href, children, className }: SkipLinkProps) {
  return (
    <a
      href={href}
      className={cn(
        "sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50",
        "bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        className
      )}
    >
      {children}
    </a>
  );
}