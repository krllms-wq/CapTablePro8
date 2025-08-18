import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  Users,
  CreditCard,
  TrendingUp,
  Settings,
  Search,
  Plus,
  Home,
} from 'lucide-react';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const { user } = useAuth();
  const [search, setSearch] = useState('');

  const { data: companies = [] } = useQuery({
    queryKey: ['/api/companies'],
    enabled: open && !!user,
  }) as { data: Array<{ id: string; name: string }> };

  const runCommand = (command: () => void) => {
    onOpenChange(false);
    command();
  };

  // Global keyboard shortcuts
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
      if (e.key === '/' && !open) {
        e.preventDefault();
        onOpenChange(true);
      }
      if (e.key === 't' && (e.metaKey || e.ctrlKey) && !open) {
        e.preventDefault();
        // TODO: Toggle theme
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [onOpenChange, open]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Type a command or search..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => runCommand(() => window.location.href = '/')}>
            <Home className="mr-2 h-4 w-4" />
            <span>Home</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => window.location.href = '/companies')}>
            <Building2 className="mr-2 h-4 w-4" />
            <span>Companies</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => window.location.href = '/profile')}>
            <Users className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </CommandItem>
        </CommandGroup>

        <CommandGroup heading="Quick Actions">
          <CommandItem onSelect={() => runCommand(() => window.location.href = '/setup')}>
            <Plus className="mr-2 h-4 w-4" />
            <span>Create Company</span>
          </CommandItem>
        </CommandGroup>

        {companies.length > 0 && (
          <CommandGroup heading="Companies">
            {companies.slice(0, 5).map((company) => (
              <CommandItem
                key={company.id}
                onSelect={() => runCommand(() => window.location.href = `/companies/${company.id}`)}
              >
                <Building2 className="mr-2 h-4 w-4" />
                <span>{company.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}

export function useCommandPalette() {
  const [open, setOpen] = useState(false);

  const toggle = () => setOpen(!open);
  const close = () => setOpen(false);
  
  return {
    open,
    setOpen,
    toggle,
    close,
    CommandPalette: (props: Omit<CommandPaletteProps, 'open' | 'onOpenChange'>) => (
      <CommandPalette {...props} open={open} onOpenChange={setOpen} />
    ),
  };
}