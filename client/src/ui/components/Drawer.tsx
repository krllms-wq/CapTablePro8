import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  title?: string;
  direction?: 'left' | 'right' | 'bottom';
  className?: string;
}

export function Drawer({ 
  open, 
  onOpenChange, 
  children, 
  title,
  direction = 'left',
  className = '' 
}: DrawerProps) {
  const [mounted, setMounted] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Focus management
  useEffect(() => {
    if (!open) return;

    const previousActiveElement = document.activeElement as HTMLElement;
    
    // Focus the close button when drawer opens
    setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 100);

    // Focus trap
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false);
        return;
      }

      if (e.key === 'Tab') {
        const focusableElements = drawerRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (!focusableElements?.length) return;

        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Restore focus when drawer closes
      previousActiveElement?.focus();
    };
  }, [open, onOpenChange]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = '0px'; // Prevent scroll jump
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [open]);

  if (!mounted) return null;

  const getDrawerClasses = () => {
    const baseClasses = 'fixed bg-white shadow-xl transition-transform duration-300 ease-in-out z-50';
    
    switch (direction) {
      case 'left':
        return `${baseClasses} top-0 left-0 h-full w-80 max-w-[85vw] ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`;
      case 'right':
        return `${baseClasses} top-0 right-0 h-full w-80 max-w-[85vw] ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`;
      case 'bottom':
        return `${baseClasses} bottom-0 left-0 right-0 max-h-[85vh] ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`;
      default:
        return baseClasses;
    }
  };

  const drawer = (
    <>
      {/* Overlay */}
      <div
        ref={overlayRef}
        className={`fixed inset-0 bg-black transition-opacity duration-300 z-40 ${
          open ? 'opacity-50' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={`${getDrawerClasses()} ${className}`}
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Drawer'}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200">
          {title && (
            <h2 className="text-lg font-semibold text-neutral-900">
              {title}
            </h2>
          )}
          <Button
            ref={closeButtonRef}
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="touch-target"
            aria-label="Close drawer"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </>
  );

  return createPortal(drawer, document.body);
}