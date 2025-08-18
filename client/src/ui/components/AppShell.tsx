import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile, useIsTablet, useIsDesktop } from '../hooks/useMedia';
import { Drawer } from './Drawer';

interface AppShellProps {
  sidebar: React.ReactNode;
  children: React.ReactNode;
  header?: React.ReactNode;
}

export function AppShell({ sidebar, children, header }: AppShellProps) {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isDesktop = useIsDesktop();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Mobile layout (xs/sm)
  if (isMobile) {
    return (
      <div className="min-h-screen bg-neutral-50">
        {/* Mobile header */}
        <header className="bg-white border-b border-neutral-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileMenuOpen(true)}
            className="touch-target"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          {header && (
            <div className="flex-1 ml-4">
              {header}
            </div>
          )}
        </header>

        {/* Mobile navigation drawer */}
        <Drawer
          open={mobileMenuOpen}
          onOpenChange={setMobileMenuOpen}
          title="Navigation"
          direction="left"
        >
          {sidebar}
        </Drawer>

        {/* Mobile content */}
        <main className="pb-safe-area-inset-bottom">
          {children}
        </main>
      </div>
    );
  }

  // Tablet layout (md)
  if (isTablet) {
    return (
      <div className="min-h-screen bg-neutral-50 flex">
        {/* Compact sidebar for tablet */}
        <aside className="w-16 bg-white border-r border-neutral-200 flex flex-col">
          <div className="p-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(true)}
              className="touch-target w-full"
              aria-label="Expand navigation"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
          
          {/* Compact nav icons could go here */}
        </aside>

        {/* Tablet navigation drawer */}
        <Drawer
          open={mobileMenuOpen}
          onOpenChange={setMobileMenuOpen}
          title="Navigation"
          direction="left"
        >
          {sidebar}
        </Drawer>

        {/* Tablet content */}
        <div className="flex-1 flex flex-col">
          {header && (
            <header className="bg-white border-b border-neutral-200 px-6 py-4">
              {header}
            </header>
          )}
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    );
  }

  // Desktop layout (lg/xl) - preserve existing layout
  if (isDesktop) {
    return (
      <div className="min-h-screen bg-neutral-50 flex">
        {/* Full sidebar for desktop - preserve existing */}
        <aside className="w-64 bg-white border-r border-neutral-200">
          {sidebar}
        </aside>

        {/* Desktop content - preserve existing */}
        <div className="flex-1 flex flex-col">
          {header && (
            <header className="bg-white border-b border-neutral-200 px-6 py-4">
              {header}
            </header>
          )}
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    );
  }

  // Fallback layout
  return (
    <div className="min-h-screen bg-neutral-50">
      {children}
    </div>
  );
}