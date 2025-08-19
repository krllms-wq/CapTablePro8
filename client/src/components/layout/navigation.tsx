import { Link, useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";

export default function Navigation() {
  const [location] = useLocation();
  const { companyId } = useParams();
  
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
          
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-semibold">JD</span>
            </div>
            <span className="hidden sm:block text-sm font-medium text-neutral-700">John Doe</span>
          </div>
        </div>
      </div>
    </nav>
  );
}
