/**
 * Accessibility utilities and helpers
 */

/**
 * Generate a unique ID for form elements
 */
export function generateId(prefix: string = 'field'): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Manage focus trap for modals and dialogs
 */
export function trapFocus(element: HTMLElement): () => void {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  ) as NodeListOf<HTMLElement>;
  
  if (focusableElements.length === 0) return () => {};
  
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  
  function handleKeyDown(e: KeyboardEvent) {
    if (e.key !== 'Tab') return;
    
    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastElement) {
        firstElement.focus();
        e.preventDefault();
      }
    }
  }
  
  element.addEventListener('keydown', handleKeyDown);
  firstElement.focus();
  
  return () => {
    element.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Announce content to screen readers
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Skip link component props
 */
export interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Manage keyboard shortcuts
 */
export class KeyboardShortcuts {
  private shortcuts = new Map<string, () => void>();
  
  constructor() {
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
  }
  
  register(key: string, callback: () => void): void {
    this.shortcuts.set(key.toLowerCase(), callback);
  }
  
  unregister(key: string): void {
    this.shortcuts.delete(key.toLowerCase());
  }
  
  private handleKeyDown(e: KeyboardEvent): void {
    // Don't trigger shortcuts when typing in inputs
    if (e.target instanceof HTMLInputElement || 
        e.target instanceof HTMLTextAreaElement || 
        e.target instanceof HTMLSelectElement) {
      return;
    }
    
    const key = this.getKeyString(e);
    const callback = this.shortcuts.get(key);
    
    if (callback) {
      e.preventDefault();
      callback();
    }
  }
  
  private getKeyString(e: KeyboardEvent): string {
    const parts: string[] = [];
    
    if (e.ctrlKey || e.metaKey) parts.push('cmd');
    if (e.shiftKey) parts.push('shift');
    if (e.altKey) parts.push('alt');
    
    parts.push(e.key.toLowerCase());
    
    return parts.join('+');
  }
  
  destroy(): void {
    document.removeEventListener('keydown', this.handleKeyDown);
    this.shortcuts.clear();
  }
}

/**
 * ARIA label helpers
 */
export function getAriaLabel(type: string, value?: string | number): string {
  switch (type) {
    case 'close':
      return 'Close dialog';
    case 'menu':
      return 'Open menu';
    case 'edit':
      return `Edit ${value || 'item'}`;
    case 'delete':
      return `Delete ${value || 'item'}`;
    case 'required':
      return 'Required field';
    case 'optional':
      return 'Optional field';
    case 'loading':
      return 'Loading...';
    case 'error':
      return 'Error message';
    case 'success':
      return 'Success message';
    default:
      return type;
  }
}

/**
 * Focus management utilities
 */
export function focusElement(selector: string, delay: number = 0): void {
  setTimeout(() => {
    const element = document.querySelector(selector) as HTMLElement;
    if (element && typeof element.focus === 'function') {
      element.focus();
    }
  }, delay);
}

export function saveFocus(): () => void {
  const activeElement = document.activeElement as HTMLElement;
  
  return () => {
    if (activeElement && typeof activeElement.focus === 'function') {
      activeElement.focus();
    }
  };
}