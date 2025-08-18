import { Link, useLocation, useParams } from "wouter";

export default function Navigation() {
  const [location] = useLocation();
  const { companyId } = useParams();

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
    ];
  };

  const navItems = getNavItems();

  return (
    <nav className="bg-white border-b border-neutral-200 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <i className="fas fa-chart-pie text-white text-sm"></i>
            </div>
            <h1 className="text-xl font-semibold text-neutral-900">CapTable Pro</h1>
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
