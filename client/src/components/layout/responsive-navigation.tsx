import { Link, useLocation, useParams } from "wouter";
import { AppShell } from "@/ui/components/AppShell";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { useIsMobile, useIsDesktop } from "@/ui/hooks/useMedia";

interface NavigationItem {
  path: string;
  label: string;
  icon: string;
}

interface ResponsiveNavigationProps {
  children: React.ReactNode;
}

export default function ResponsiveNavigation({ children }: ResponsiveNavigationProps) {
  const [location] = useLocation();
  const { companyId } = useParams();
  const isMobile = useIsMobile();
  const isDesktop = useIsDesktop();

  const getNavItems = (): NavigationItem[] => {
    if (!companyId) {
      return [
        { path: "/", label: "Companies", icon: "fas fa-building" },
      ];
    }
    
    return [
      { path: `/companies/${companyId}`, label: "Cap Table", icon: "fas fa-table" },
      { path: `/companies/${companyId}/stakeholders`, label: "Stakeholders", icon: "fas fa-users" },
      { path: `/companies/${companyId}/transactions`, label: "Transactions", icon: "fas fa-file-text" },
      { path: `/companies/${companyId}/equity-awards`, label: "Equity Awards", icon: "fas fa-gift" },
      { path: `/companies/${companyId}/scenarios`, label: "Scenarios", icon: "fas fa-exchange-alt" },
    ];
  };

  const navItems = getNavItems();

  // Sidebar content
  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo/Brand */}
      <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <i className="fas fa-chart-pie text-white text-sm"></i>
          </div>
          {!isMobile && (
            <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">CapTable Pro</h1>
          )}
        </div>
      </div>
      
      {/* Navigation Items */}
      <nav className="flex-1 p-4">
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.path;
            return (
              <Link key={item.path} href={item.path}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className={`
                    w-full justify-start touch-target
                    ${isActive ? "bg-primary text-primary-foreground" : ""}
                  `}
                >
                  <i className={`${item.icon} mr-3 text-sm`}></i>
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </div>
      </nav>
      
      {/* Theme and User section */}
      <div className="p-4 border-t border-neutral-200 dark:border-neutral-700">
        <div className="flex items-center justify-between mb-3">
          <ThemeToggle />
        </div>
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-semibold">JD</span>
          </div>
          {!isMobile && (
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">John Doe</div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400 truncate">john@company.com</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Header content for mobile
  const headerContent = isMobile ? (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center space-x-3">
        <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
          <i className="fas fa-chart-pie text-white text-xs"></i>
        </div>
        <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">CapTable Pro</h1>
      </div>
      <ThemeToggle />
    </div>
  ) : null;

  return (
    <AppShell
      sidebar={sidebarContent}
      header={headerContent}
    >
      {children}
    </AppShell>
  );
}