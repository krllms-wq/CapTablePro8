/**
 * Breadcrumb navigation component with semantic markup
 */

import React from 'react';
import { Link } from 'wouter';
import { cn } from '@/lib/utils';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
  separator?: React.ReactNode;
  showHome?: boolean;
}

export function Breadcrumbs({ 
  items, 
  className, 
  separator = <ChevronRight className="h-4 w-4" />,
  showHome = true 
}: BreadcrumbsProps) {
  const breadcrumbItems = showHome 
    ? [{ label: 'Home', href: '/' }, ...items]
    : items;

  return (
    <nav 
      aria-label="Breadcrumb" 
      className={cn("flex", className)}
    >
      <ol className="flex items-center space-x-1 text-sm text-muted-foreground">
        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1;
          const isCurrent = item.current || isLast;
          
          return (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <span className="mr-1 text-muted-foreground/50" aria-hidden="true">
                  {separator}
                </span>
              )}
              
              {item.href && !isCurrent ? (
                <Link 
                  href={item.href}
                  className="hover:text-foreground transition-colors underline-offset-4 hover:underline"
                  aria-current={isCurrent ? 'page' : undefined}
                >
                  {index === 0 && showHome ? (
                    <span className="flex items-center gap-1">
                      <Home className="h-3 w-3" />
                      <span className="sr-only">{item.label}</span>
                    </span>
                  ) : (
                    item.label
                  )}
                </Link>
              ) : (
                <span 
                  className={cn(
                    isCurrent && "text-foreground font-medium",
                    !item.href && "cursor-default"
                  )}
                  aria-current={isCurrent ? 'page' : undefined}
                >
                  {index === 0 && showHome ? (
                    <span className="flex items-center gap-1">
                      <Home className="h-3 w-3" />
                      <span className="sr-only">{item.label}</span>
                    </span>
                  ) : (
                    item.label
                  )}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export interface AutoBreadcrumbsProps {
  className?: string;
  companyName?: string;
}

// Auto-generate breadcrumbs from current URL
export function AutoBreadcrumbs({ className, companyName }: AutoBreadcrumbsProps) {
  const [location] = useLocation();
  const pathSegments = location.split('/').filter(Boolean);
  
  const items: BreadcrumbItem[] = [];
  
  // Parse path segments into breadcrumb items
  for (let i = 0; i < pathSegments.length; i++) {
    const segment = pathSegments[i];
    const path = '/' + pathSegments.slice(0, i + 1).join('/');
    const isLast = i === pathSegments.length - 1;
    
    if (segment === 'companies') {
      items.push({ label: 'Companies', href: isLast ? undefined : '/companies' });
    } else if (pathSegments[i - 1] === 'companies' && segment !== 'setup') {
      // Company-specific page
      const label = companyName || `Company ${segment}`;
      items.push({ 
        label, 
        href: isLast ? undefined : path,
        current: isLast 
      });
    } else if (segment === 'stakeholders') {
      items.push({ label: 'Stakeholders', href: isLast ? undefined : path });
    } else if (segment === 'transactions') {
      items.push({ label: 'Transactions', href: isLast ? undefined : path });
    } else if (segment === 'equity-awards') {
      items.push({ label: 'Equity Awards', href: isLast ? undefined : path });
    } else if (segment === 'scenarios') {
      items.push({ label: 'Scenarios', href: isLast ? undefined : path });
    } else if (segment === 'profile') {
      items.push({ label: 'Profile', href: isLast ? undefined : path });
    } else if (segment === 'setup') {
      items.push({ label: 'Setup', href: isLast ? undefined : path });
    } else {
      // Generic segment - capitalize and clean up
      const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
      items.push({ label, href: isLast ? undefined : path });
    }
  }
  
  return <Breadcrumbs items={items} className={className} />;
}

// Import useLocation at the top of the file
import { useLocation } from 'wouter';