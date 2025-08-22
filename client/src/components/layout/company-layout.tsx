import { useParams, Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Company } from "@shared/schema";

interface CompanyLayoutProps {
  children: React.ReactNode;
}

export default function CompanyLayout({ children }: CompanyLayoutProps) {
  const { companyId } = useParams();
  const [location] = useLocation();

  const { data: company, isLoading: companyLoading, error: companyError } = useQuery<Company>({
    queryKey: ["/api/companies", companyId],
    enabled: !!companyId,
  });

  // Navigation array with all items including Activity and Settings
  const navigation = [
    { name: 'Companies', href: '/companies', icon: '🏢', current: false },
    { name: 'Dashboard', href: `/companies/${companyId}`, icon: '📊', current: location === `/companies/${companyId}` },
    { name: 'Stakeholders', href: `/companies/${companyId}/stakeholders`, icon: '👥', current: location.includes('/stakeholders') },
    { name: 'Equity Awards', href: `/companies/${companyId}/equity-awards`, icon: '🎁', current: location.includes('/equity-awards') },
    { name: 'Transactions', href: `/companies/${companyId}/transactions`, icon: '📈', current: location.includes('/transactions') },
    { name: 'Scenarios', href: `/companies/${companyId}/scenarios`, icon: '🔄', current: location.includes('/scenarios') },
    { name: 'Activity', href: `/companies/${companyId}/activity`, icon: '📋', current: location.includes('/activity') },
    { name: 'Settings', href: `/companies/${companyId}/settings`, icon: '⚙️', current: location.includes('/settings') },
  ];

  if (!companyId) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-neutral-600">No company selected</p>
        </div>
      </div>
    );
  }

  if (companyLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  if (companyError) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center">
        <div className="text-center bg-red-100 p-8 rounded border">
          <h2 className="text-2xl font-bold text-red-800">ERROR LOADING COMPANY</h2>
          <p className="text-red-700 mt-2">Company ID: {companyId}</p>
          <p className="text-red-600 text-sm mt-2">{String(companyError)}</p>
          <p className="text-red-500 text-xs mt-2">If you see this, there's an API error.</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="text-center bg-blue-100 p-8 rounded border">
          <h2 className="text-2xl font-bold text-blue-800">COMPANY NOT FOUND</h2>
          <p className="text-blue-700 mt-2">Company ID: {companyId}</p>
          <p className="text-blue-600 text-sm mt-2">API call finished but no company data returned.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      {/* Left Sidebar */}
      <div className="w-64 bg-white border-r border-neutral-200 flex flex-col">
        <div className="p-6 border-b border-neutral-200">
          <h2 className="text-xl font-bold text-neutral-900">Cap Table</h2>
        </div>
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navigation.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    item.current
                      ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-700'
                      : 'text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900'
                  }`}
                  data-testid={`nav-${item.name.toLowerCase().replace(' ', '-')}`}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Company Info at Bottom */}
        <div className="p-4 border-t border-neutral-200">
          <div className="text-sm">
            <p className="font-medium text-neutral-900 truncate">{company.name}</p>
            <p className="text-neutral-600 text-xs truncate">{company.description}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-6 py-6 bg-neutral-50">
          {/* Company Header */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-neutral-900">{company.name}</h2>
                <p className="text-neutral-600 mt-1">{company.description}</p>
              </div>
            </div>
          </div>

          {/* Page Content */}
          {children}
        </div>
      </div>
    </div>
  );
}