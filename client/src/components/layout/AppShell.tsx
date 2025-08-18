import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Building2,
  Search,
  Moon,
  Sun,
  Monitor,
  User,
  LogOut,
  Menu,
  X,
  Home,
  Users,
  CreditCard,
  TrendingUp,
  Settings,
  ChevronRight,
} from 'lucide-react';

interface AppShellProps {
  children: ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

export function AppShell({ children, breadcrumbs }: AppShellProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const companyId = location.match(/\/companies\/([^\/]+)/)?.[1];

  const navigation = [
    { name: 'Companies', href: '/companies', icon: Building2, current: location === '/companies' || location === '/' },
    ...(companyId ? [
      { name: 'Dashboard', href: `/companies/${companyId}`, icon: Home, current: location === `/companies/${companyId}` },
      { name: 'Stakeholders', href: `/companies/${companyId}/stakeholders`, icon: Users, current: location.includes('/stakeholders') },
      { name: 'Equity Awards', href: `/companies/${companyId}/equity-awards`, icon: CreditCard, current: location.includes('/equity-awards') },
      { name: 'Transactions', href: `/companies/${companyId}/transactions`, icon: TrendingUp, current: location.includes('/transactions') },
      { name: 'Scenarios', href: `/companies/${companyId}/scenarios`, icon: Settings, current: location.includes('/scenarios') },
    ] : [])
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement global search
    console.log('Search:', searchQuery);
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'light': return Sun;
      case 'dark': return Moon;
      default: return Monitor;
    }
  };

  const ThemeIcon = getThemeIcon();

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="sticky top-0 z-fixed bg-surface border-b border-border">
        <div className="flex h-16 items-center gap-4 px-4 lg:px-6">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>

          {/* Logo */}
          <Link href="/companies" className="flex items-center gap-2 font-semibold">
            <Building2 className="h-6 w-6" />
            <span className="hidden sm:inline">Cap Table</span>
          </Link>

          {/* Breadcrumbs */}
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav className="hidden md:flex items-center space-x-1 text-sm text-text-muted">
              {breadcrumbs.map((crumb, index) => (
                <div key={index} className="flex items-center">
                  {index > 0 && <ChevronRight className="h-4 w-4 mx-1" />}
                  {crumb.href ? (
                    <Link href={crumb.href} className="hover:text-text">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-text">{crumb.label}</span>
                  )}
                </div>
              ))}
            </nav>
          )}

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-sm ml-auto">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <Input
                type="search"
                placeholder="Search... (⌘K)"
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </form>

          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="w-9 px-0"
          >
            <ThemeIcon className="h-4 w-4" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium">{user?.email}</p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile" className="flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-destructive focus:text-destructive"
                onClick={() => {
                  localStorage.removeItem('token');
                  window.location.href = '/';
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`
          fixed inset-y-0 left-0 z-sticky w-64 bg-surface-muted border-r border-border
          transform transition-transform duration-200 ease-in-out
          md:relative md:transform-none
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          <div className="flex h-full flex-col gap-y-5 overflow-y-auto pt-4">
            <nav className="px-4">
              <ul role="list" className="space-y-1">
                {navigation.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`
                        flex gap-x-3 rounded-md px-3 py-2 text-sm font-medium
                        transition-colors duration-200
                        ${item.current
                          ? 'bg-primary text-primary-text'
                          : 'text-text-muted hover:text-text hover:bg-surface-hover'
                        }
                      `}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </aside>

        {/* Mobile backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-modalBackdrop bg-gray-900/50 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 md:pl-0">
          {children}
        </main>
      </div>
    </div>
  );
}