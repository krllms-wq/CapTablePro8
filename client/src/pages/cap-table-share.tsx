import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatNumber, formatCurrency, formatPercentage } from "@/lib/formatters";

interface SharedCapTableData {
  company: {
    name: string;
    description: string;
  };
  shareInfo: {
    title: string;
    description: string;
    permissions: any;
  };
  capTable: Array<{
    stakeholder: {
      name: string;
      type: string;
    };
    securityClass: {
      name: string;
    };
    shares: number;
    ownership: number;
    value: number;
  }>;
}

export default function CapTableShare() {
  const { token } = useParams<{ token: string }>();

  const { data: sharedData, isLoading, error } = useQuery({
    queryKey: ["/api/shared/cap-table", token],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="w-12 h-12 bg-primary/20 rounded-xl mx-auto mb-4"></div>
          <p className="text-gray-600">Loading cap table...</p>
        </div>
      </div>
    );
  }

  if (error || !sharedData) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">Access Denied</CardTitle>
            <CardDescription>
              This cap table share link is invalid, expired, or has been revoked.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => window.location.href = "/"}>
              Go to CapTable Pro
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { company, shareInfo, capTable } = sharedData as SharedCapTableData;

  const totalShares = capTable.reduce((sum, row) => sum + row.shares, 0);
  const totalValue = capTable.reduce((sum, row) => sum + row.value, 0);

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                  <i className="fas fa-chart-pie text-white"></i>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
                  <p className="text-gray-600">{company.description}</p>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h2 className="font-semibold text-blue-900 mb-1">{shareInfo.title}</h2>
                {shareInfo.description && (
                  <p className="text-blue-700 text-sm">{shareInfo.description}</p>
                )}
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-sm text-gray-500 mb-1">Powered by</p>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-primary rounded-lg flex items-center justify-center">
                  <i className="fas fa-chart-pie text-white text-xs"></i>
                </div>
                <span className="font-semibold text-gray-900">CapTable Pro</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cap Table */}
      <div className="max-w-7xl mx-auto py-6 px-6">
        <div className="mb-6">
          <div className="grid grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">Total Outstanding Shares</p>
                  <p className="text-2xl font-bold text-gray-900">{formatNumber(totalShares)}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">Total Company Value</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalValue)}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">Stakeholders</p>
                  <p className="text-2xl font-bold text-gray-900">{capTable.length}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Capitalization Table</CardTitle>
            <CardDescription>
              Current ownership distribution and shareholding details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                      Stakeholder
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                      Security Class
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                      Shares
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                      Ownership %
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                      Value
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {capTable.map((row, index) => (
                    <tr key={index} className="hover:bg-neutral-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className={`w-8 h-8 ${row.stakeholder.type === "entity" ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600"} rounded-full flex items-center justify-center mr-3`}>
                            {row.stakeholder.type === "entity" ? (
                              <i className="fas fa-building text-sm"></i>
                            ) : (
                              <span className="text-sm font-semibold">
                                {row.stakeholder.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-neutral-900">{row.stakeholder.name}</p>
                            <p className="text-xs text-neutral-500 capitalize">{row.stakeholder.type}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-900">
                        {row.securityClass.name}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium text-neutral-900">
                        {formatNumber(row.shares)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium text-neutral-900">
                        {formatPercentage(row.ownership)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium text-neutral-900">
                        {formatCurrency(row.value)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}