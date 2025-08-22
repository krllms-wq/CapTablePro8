import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { 
  Search, 
  LogOut, 
  User, 
  Settings, 
  Menu,
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
  const [searchQuery, setSearchQuery] = useState("");
  
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
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <span className="text-h3 font-semibold text-fg">CapTable Pro</span>
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

            {/* Center: Search */}
            <div className="flex-1 max-w-md mx-xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted" />
                <Input
                  placeholder="Search transactions, stakeholders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Right: Avatar Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-10 w-10 rounded-full">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
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
                      <Button
                        variant={item.current ? "secondary" : "ghost"}
                        className="w-full justify-start font-medium"
                      >
                        <Icon className="mr-3 w-5 h-5" />
                        {item.name}
                      </Button>
                    </Link>
                  );
                })}
              </div>
            </nav>
            
            {/* Company info at bottom */}
            {company && (
              <div className="absolute bottom-0 left-0 right-0 w-64 p-lg border-t border-border bg-card">
                <div className="text-sm">
                  <p className="font-medium text-fg truncate">{company.name}</p>
                  <p className="text-muted text-xs truncate">{company.description}</p>
                </div>
              </div>
            )}
          </aside>
        )}

        {/* Main Content */}
        <main className={`flex-1 ${companyId ? 'pb-20' : ''}`}>
          <div className="container-app py-xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}