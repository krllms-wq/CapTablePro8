/**
 * Mobile navigation component with hamburger menu
 */

import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './sheet';
import { ScrollArea } from './scroll-area';
import { 
  Menu, 
  Home, 
  Users, 
  Receipt, 
  Award, 
  Settings,
  Building,
  TrendingUp
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

export interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export interface MobileNavProps {
  items: NavItem[];
  currentPath?: string;
  className?: string;
}

export const defaultNavItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/companies', label: 'Companies', icon: Building },
  { href: '/stakeholders', label: 'Stakeholders', icon: Users },
  { href: '/transactions', label: 'Transactions', icon: Receipt },
  { href: '/equity-awards', label: 'Equity Awards', icon: Award },
  { href: '/scenarios', label: 'Scenarios', icon: TrendingUp },
  { href: '/profile', label: 'Profile', icon: Settings },
];

export function MobileNav({ 
  items = defaultNavItems, 
  currentPath, 
  className 
}: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();
  const isMobile = useIsMobile();
  
  const activePath = currentPath || location;
  
  // Close menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location]);
  
  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);
  
  if (!isMobile) {
    return null; // Use desktop navigation
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("md:hidden", className)}
          aria-label="Open navigation menu"
          aria-expanded={isOpen}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      
      <SheetContent side="left" className="w-[300px] p-0">
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle className="text-left">Navigation</SheetTitle>
        </SheetHeader>
        
        <ScrollArea className="flex-1 px-6 py-4">
          <nav className="space-y-2" role="navigation" aria-label="Main navigation">
            {items.map((item) => {
              const isActive = activePath === item.href || activePath.startsWith(item.href + '/');
              const Icon = item.icon;
              
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-3 h-12",
                      isActive && "bg-secondary text-secondary-foreground font-medium"
                    )}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                    {item.badge && (
                      <span className="ml-auto text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </Button>
                </Link>
              );
            })}
          </nav>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

export interface MobileNavProviderProps {
  children: React.ReactNode;
  items?: NavItem[];
}

export function MobileNavProvider({ children, items = defaultNavItems }: MobileNavProviderProps) {
  const [location] = useLocation();
  
  return (
    <div className="flex min-h-screen flex-col">
      {/* Mobile header */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
        <div className="container flex h-14 items-center justify-between px-4">
          <MobileNav items={items} currentPath={location} />
          
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-semibold">CapTable</span>
          </Link>
          
          <div className="w-8" /> {/* Spacer for visual balance */}
        </div>
      </header>
      
      {/* Main content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}