import { Link, useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth, logout } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  LogOut, 
  User, 
  BarChart3,
  Users,
  FileText,
  Award,
  GitBranch,
  Activity,
  Cog
} from "lucide-react";
import type { Company } from "@shared/schema";

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const [location, navigate] = useLocation();
  const { companyId } = useParams();
  const { user } = useAuth();
  
  // Get current company data
  const { data: company } = useQuery<Company>({
    queryKey: ["/api/companies", companyId],
    enabled: !!companyId,
  });
  
  // Get all companies for switcher
  const { data: companies } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
  });
  
  const handleCompanyChange = (newCompanyId: string) => {
    if (newCompanyId === "create-new") {
      navigate("/companies");
      return;
    }
    // Navigate to dashboard of selected company
    navigate(`/companies/${newCompanyId}`);
  };

  const sidebarItems = [
    { 
      id: "cap-table", 
      name: "Cap Table", 
      href: `/companies/${companyId}`, 
      icon: BarChart3,
      current: location === `/companies/${companyId}`
    },
    { 
      id: "stakeholders", 
      name: "Stakeholders", 
      href: `/companies/${companyId}/stakeholders`, 
      icon: Users,
      current: location.includes('/stakeholders')
    },
    { 
      id: "transactions", 
      name: "Transactions", 
      href: `/companies/${companyId}/transactions`, 
      icon: FileText,
      current: location.includes('/transactions')
    },
    { 
      id: "equity-awards", 
      name: "Equity Awards", 
      href: `/companies/${companyId}/equity-awards`, 
      icon: Award,
      current: location.includes('/equity-awards')
    },
    { 
      id: "scenarios", 
      name: "Scenarios", 
      href: `/companies/${companyId}/scenarios`, 
      icon: GitBranch,
      current: location.includes('/scenarios')
    },
    { 
      id: "activity", 
      name: "Activity", 
      href: `/companies/${companyId}/activity`, 
      icon: Activity,
      current: location.includes('/activity')
    },
    { 
      id: "settings", 
      name: "Settings", 
      href: `/companies/${companyId}/settings`, 
      icon: Cog,
      current: location.includes('/settings')
    },
  ];

  return (
    <div className="min-h-screen bg-bg">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="container-app">
          <div className="flex items-center justify-between h-16">
            {/* Left: Logo + Company Switcher */}
            <div className="flex items-center gap-xl">
              <Link href="/companies" className="flex items-center gap-md">
                <div className="w-8 h-8 bg-slate-600 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <span className="text-h3 font-semibold text-slate-800">CapTable Pro</span>
              </Link>
              
              {companyId && companies && (
                <Select value={companyId} onValueChange={handleCompanyChange}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select company">
                      {company?.name || "Select company"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((comp) => (
                      <SelectItem key={comp.id} value={comp.id}>
                        {comp.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="create-new">+ Create New Company</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Right: Avatar Menu */}
            <div className="ml-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-10 w-10 rounded-full">
                    <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-semibold">
                        {user?.email?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium text-sm">{user?.email}</p>
                      {user?.firstName && user?.lastName && (
                        <p className="text-xs text-muted">
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
                    className="text-danger focus:text-danger cursor-pointer"
                    onClick={() => logout()}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Left Sidebar */}
        {companyId && (
          <aside className="w-64 bg-card border-r border-border min-h-screen">
            <nav className="p-lg">
              <div className="space-y-sm">
                {sidebarItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link 
                      key={item.id} 
                      href={item.href}
                      className="block"
                      data-testid={`nav-${item.id}`}
                    >
                      <div className={`
                        group flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-lg
                        transition-all duration-200 ease-in-out relative
                        ${item.current 
                          ? 'text-slate-900 bg-slate-50/80 shadow-sm border-l-3 border-l-slate-300 font-semibold' 
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50/50'
                        }
                      `}>
                        <Icon className={`mr-3 w-5 h-5 transition-colors duration-200 ${
                          item.current ? 'text-slate-700' : 'text-slate-500 group-hover:text-slate-700'
                        }`} />
                        <span className="transition-all duration-200">{item.name}</span>
                        {item.current && (
                          <div className="absolute right-3 w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </nav>
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1">
          <div className="container-app py-xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}