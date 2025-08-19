import { Link, useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth, logout } from "@/hooks/useAuth";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User, Settings } from "lucide-react";

export default function Navigation() {
  const [location] = useLocation();
  const { companyId } = useParams();
  const { user } = useAuth();
  
  const { data: company } = useQuery<{ name: string; id: string }>({
    queryKey: ["/api/companies", companyId],
    enabled: !!companyId,
  });

  const getNavItems = () => {
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
      { path: `/companies/${companyId}/activity`, label: "Activity", icon: "fas fa-history" },
      { path: `/companies/${companyId}/settings`, label: "Settings", icon: "fas fa-cog" },
    ];
  };

  const navItems = getNavItems();

  return (
    <nav className="bg-white border-b border-neutral-200 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <Link href="/">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center cursor-pointer hover:bg-primary-dark transition-colors">
                <i className="fas fa-chart-pie text-white text-sm"></i>
              </div>
            </Link>
            <div className="flex flex-col">
              <Link href="/" className="text-xl font-semibold text-neutral-900 hover:text-primary transition-colors cursor-pointer">
                CapTable Pro
              </Link>
              {companyId && company?.name && (
                <span className="text-sm text-neutral-600">
                  {company.name}
                </span>
              )}
            </div>
          </div>
          
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = location === item.path;
              return (
                <Link key={item.path} href={item.path}>
                  <button
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      isActive
                        ? "text-primary bg-primary/10"
                        : "text-neutral-600 hover:bg-neutral-100"
                    }`}
                  >
                    <i className={`${item.icon} mr-2`}></i>
                    {item.label}
                  </button>
                </Link>
              );
            })}
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <button className="p-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors">
            <i className="fas fa-bell text-lg"></i>
          </button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center space-x-2 cursor-pointer hover:bg-neutral-50 rounded-lg p-2 transition-colors">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <span className="hidden sm:block text-sm font-medium text-neutral-700">
                  {user?.email || 'User'}
                </span>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium text-sm">{user?.email}</p>
                  {user?.firstName && user?.lastName && (
                    <p className="text-xs text-muted-foreground">
                      {user.firstName} {user.lastName}
                    </p>
                  )}
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
                className="text-red-600 focus:text-red-600 cursor-pointer"
                onClick={() => {
                  logout();
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
