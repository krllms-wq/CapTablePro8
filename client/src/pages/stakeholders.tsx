import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/formatters";
import Navigation from "@/components/layout/navigation";

export default function Stakeholders() {
  const { companyId } = useParams();

  const { data: stakeholders, isLoading } = useQuery({
    queryKey: ["/api/companies", companyId, "stakeholders"],
    enabled: !!companyId,
  });

  const { data: capTableData } = useQuery({
    queryKey: ["/api/companies", companyId, "cap-table"],
    enabled: !!companyId,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-neutral-900">Stakeholders</h1>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-neutral-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const stakeholderData = stakeholders?.map((stakeholder: any) => {
    const ownership = capTableData?.capTable?.find((row: any) => 
      row.stakeholder.name === stakeholder.name
    );
    return {
      ...stakeholder,
      shares: ownership?.shares || 0,
      ownership: ownership?.ownership || 0,
      value: ownership?.value || 0,
    };
  }) || [];

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-neutral-900">Stakeholders</h1>
            <Button>
              <i className="fas fa-plus mr-2"></i>
              Add Stakeholder
            </Button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
            <div className="px-6 py-4 border-b border-neutral-200">
              <h3 className="text-lg font-semibold text-neutral-900">All Stakeholders</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Shares
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Ownership %
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Value
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {stakeholderData.map((stakeholder: any) => (
                <tr key={stakeholder.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-semibold">
                          {stakeholder.name.charAt(0)}
                        </span>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-neutral-900">
                          {stakeholder.name}
                        </div>
                        <div className="text-sm text-neutral-500">
                          {stakeholder.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                    {stakeholder.title || "—"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      stakeholder.type === "person" 
                        ? "bg-blue-100 text-blue-800"
                        : "bg-green-100 text-green-800"
                    }`}>
                      {stakeholder.type === "person" ? "Individual" : "Entity"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 text-right">
                    {formatNumber(stakeholder.shares)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 text-right">
                    {stakeholder.ownership.toFixed(2)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 text-right">
                    ${formatNumber(stakeholder.value)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => window.location.href = `/companies/${companyId}/stakeholders/${stakeholder.id}`}
                      className="text-primary hover:text-primary-dark mr-3"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this stakeholder?')) {
                          // TODO: Implement delete functionality
                          console.log('Delete stakeholder:', stakeholder.id);
                        }
                      }}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}