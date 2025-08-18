import { useState } from "react";
import { formatNumber, formatCurrency, formatPercentage } from "@/lib/formatters";

interface CapTableRow {
  stakeholder: {
    name: string;
    title?: string;
    type?: string;
  };
  securityClass: {
    name: string;
  };
  shares: number;
  ownership: number;
  value: number;
  isOption?: boolean;
  isPool?: boolean;
}

interface CapTableMainProps {
  capTable?: CapTableRow[];
  isLoading: boolean;
}

export default function CapTableMain({ capTable, isLoading }: CapTableMainProps) {
  const [viewType, setViewType] = useState<"fully-diluted" | "outstanding">("fully-diluted");

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 mb-6">
        <div className="px-6 py-4 border-b border-neutral-200">
          <h3 className="text-lg font-semibold text-neutral-900">Capitalization Table</h3>
        </div>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-neutral-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!capTable || capTable.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 mb-6">
        <div className="px-6 py-4 border-b border-neutral-200">
          <h3 className="text-lg font-semibold text-neutral-900">Capitalization Table</h3>
        </div>
        <div className="p-6 text-center text-neutral-500">
          No cap table data available
        </div>
      </div>
    );
  }

  const getStakeholderBadgeColor = (securityClassName: string, isOption?: boolean, isPool?: boolean) => {
    if (isPool) return "bg-orange-100 text-orange-800";
    if (isOption) return "bg-green-100 text-green-800";
    if (securityClassName.includes("Preferred")) return "bg-purple-100 text-purple-800";
    if (securityClassName.includes("Common")) return "bg-blue-100 text-blue-800";
    return "bg-neutral-100 text-neutral-800";
  };

  const getStakeholderInitials = (name: string) => {
    return name
      .split(" ")
      .map(word => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getStakeholderAvatarColor = (type?: string, isPool?: boolean) => {
    if (isPool) return "bg-orange-100 text-orange-600";
    if (type === "entity") return "bg-purple-100 text-purple-600";
    return "bg-blue-100 text-blue-600";
  };

  const totalShares = capTable.reduce((sum, row) => sum + row.shares, 0);
  const totalValue = capTable.reduce((sum, row) => sum + row.value, 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 mb-6">
      <div className="px-6 py-4 border-b border-neutral-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-neutral-900">Capitalization Table</h3>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewType("fully-diluted")}
                className={`px-3 py-1 text-sm rounded-md font-medium transition-colors ${
                  viewType === "fully-diluted"
                    ? "bg-primary text-white"
                    : "text-neutral-600 hover:bg-neutral-100"
                }`}
              >
                Fully Diluted
              </button>
              <button
                onClick={() => setViewType("outstanding")}
                className={`px-3 py-1 text-sm rounded-md font-medium transition-colors ${
                  viewType === "outstanding"
                    ? "bg-primary text-white"
                    : "text-neutral-600 hover:bg-neutral-100"
                }`}
              >
                Outstanding Only
              </button>
            </div>
            <button className="p-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors">
              <i className="fas fa-filter"></i>
            </button>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-neutral-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                Stakeholder
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                Security Type
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                Shares
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                % Ownership
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                Value
              </th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {capTable.map((row, index) => (
              <tr key={index} className="hover:bg-neutral-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className={`w-8 h-8 ${getStakeholderAvatarColor(row.stakeholder.type, row.isPool)} rounded-full flex items-center justify-center mr-3`}>
                      {row.isPool ? (
                        <i className="fas fa-users text-sm"></i>
                      ) : row.stakeholder.type === "entity" ? (
                        <i className="fas fa-building text-sm"></i>
                      ) : (
                        <span className="text-sm font-semibold">
                          {getStakeholderInitials(row.stakeholder.name)}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-neutral-900">{row.stakeholder.name}</div>
                      {row.stakeholder.title && (
                        <div className="text-sm text-neutral-500">{row.stakeholder.title}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-neutral-900">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStakeholderBadgeColor(row.securityClass.name, row.isOption, row.isPool)}`}>
                    {row.securityClass.name}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-neutral-900 text-right font-mono">
                  {formatNumber(row.shares)}
                </td>
                <td className="px-6 py-4 text-sm text-neutral-900 text-right font-semibold">
                  {formatPercentage(row.ownership)}
                </td>
                <td className="px-6 py-4 text-sm text-neutral-900 text-right font-mono">
                  {formatCurrency(row.value)}
                </td>
                <td className="px-6 py-4 text-center">
                  <button className="text-neutral-400 hover:text-neutral-600 transition-colors">
                    <i className="fas fa-ellipsis-h"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-neutral-50 border-t-2 border-neutral-300">
            <tr>
              <td className="px-6 py-4 text-sm font-semibold text-neutral-900">Total</td>
              <td className="px-6 py-4"></td>
              <td className="px-6 py-4 text-sm font-semibold text-neutral-900 text-right font-mono">
                {formatNumber(totalShares)}
              </td>
              <td className="px-6 py-4 text-sm font-semibold text-neutral-900 text-right">
                100.00%
              </td>
              <td className="px-6 py-4 text-sm font-semibold text-neutral-900 text-right font-mono">
                {formatCurrency(totalValue)}
              </td>
              <td className="px-6 py-4"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
