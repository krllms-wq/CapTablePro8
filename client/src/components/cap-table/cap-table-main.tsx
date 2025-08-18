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
  issueDate?: string;
}

interface CapTableMainProps {
  capTable?: CapTableRow[];
  isLoading: boolean;
}

// Historical Cap Table Component  
function HistoricalCapTable({ capTable }: { capTable: CapTableRow[] }) {
  // Extract actual transaction dates from the cap table data
  const transactionDates = capTable
    .filter(row => row.issueDate) // Only rows with issue dates
    .map(row => new Date(row.issueDate!))
    .sort((a, b) => a.getTime() - b.getTime())
    .map(date => date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }));
  
  // Remove duplicates and keep only unique months
  const uniqueDates = Array.from(new Set(transactionDates));
  
  // If no transactions, show current month only
  const historicalDates = uniqueDates.length > 0 
    ? uniqueDates 
    : [new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short' })];
  
  // Group stakeholders for historical view based on actual transactions
  const stakeholderHistory = capTable.reduce((acc, row) => {
    if (!acc[row.stakeholder.name]) {
      acc[row.stakeholder.name] = {
        stakeholder: row.stakeholder,
        history: {}
      };
    }
    
    // Calculate ownership for each actual transaction date
    historicalDates.forEach((date) => {
      // For now, show current ownership for all dates (can be enhanced with actual historical calculation)
      acc[row.stakeholder.name].history[date] = row.ownership;
    });
    
    return acc;
  }, {} as any);

  const stakeholders = Object.values(stakeholderHistory) as any[];

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-neutral-50 dark:bg-neutral-800">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider sticky left-0 bg-neutral-50 dark:bg-neutral-800 z-10 border-r border-neutral-200 dark:border-neutral-700">
              Stakeholder
            </th>
            {historicalDates.map(date => (
              <th key={date} className="px-4 py-3 text-center text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider min-w-[120px]">
                {date}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
          {stakeholders.map((stakeholder: any, index: number) => (
            <tr key={index} className="hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
              <td className="px-6 py-4 sticky left-0 bg-white dark:bg-neutral-900 z-10 border-r border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center">
                  <div className={`w-8 h-8 ${stakeholder.stakeholder.type === "entity" ? "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" : "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"} rounded-full flex items-center justify-center mr-3`}>
                    {stakeholder.stakeholder.type === "entity" ? (
                      <i className="fas fa-building text-sm"></i>
                    ) : (
                      <span className="text-sm font-semibold">
                        {stakeholder.stakeholder.name.split(" ").map((word: string) => word[0]).join("").toUpperCase().slice(0, 2)}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{stakeholder.stakeholder.name}</div>
                    {stakeholder.stakeholder.title && (
                      <div className="text-sm text-neutral-500 dark:text-neutral-400">{stakeholder.stakeholder.title}</div>
                    )}
                  </div>
                </div>
              </td>
              {historicalDates.map(date => (
                <td key={date} className="px-4 py-4 text-center">
                  <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    {formatPercentage(stakeholder.history[date] || 0)}
                  </div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">
                    {((stakeholder.history[date] || 0) * 1000000).toLocaleString()} shares
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-neutral-50 dark:bg-neutral-800 border-t-2 border-neutral-300 dark:border-neutral-600">
          <tr>
            <td className="px-6 py-4 text-sm font-semibold text-neutral-900 dark:text-neutral-100 sticky left-0 bg-neutral-50 dark:bg-neutral-800 z-10 border-r border-neutral-200 dark:border-neutral-700">
              Total
            </td>
            {historicalDates.map(date => (
              <td key={date} className="px-4 py-4 text-center">
                <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">100.00%</div>
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

export default function CapTableMain({ capTable, isLoading }: CapTableMainProps) {
  const [viewType, setViewType] = useState<"fully-diluted" | "outstanding">("fully-diluted");
  const [mode, setMode] = useState<"current" | "historical">("current");

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
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-neutral-900">Capitalization Table</h3>
          <div className="flex items-center space-x-2">
            <div className="flex rounded-lg border border-neutral-200 overflow-hidden">
              <button
                onClick={() => setMode("current")}
                className={`px-3 py-1 text-sm font-medium transition-colors ${
                  mode === "current"
                    ? "bg-primary text-white"
                    : "bg-white text-neutral-600 hover:bg-neutral-50"
                }`}
              >
                Current
              </button>
              <button
                onClick={() => setMode("historical")}
                className={`px-3 py-1 text-sm font-medium transition-colors ${
                  mode === "historical"
                    ? "bg-primary text-white"
                    : "bg-white text-neutral-600 hover:bg-neutral-50"
                }`}
              >
                Historical
              </button>
            </div>
          </div>
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
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold text-neutral-900">Capitalization Table</h3>
            <div className="flex rounded-lg border border-neutral-300 overflow-hidden">
              <button
                onClick={() => setMode("current")}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  mode === "current"
                    ? "bg-primary text-white"
                    : "bg-white text-neutral-700 hover:bg-neutral-50"
                }`}
              >
                Current
              </button>
              <button
                onClick={() => setMode("historical")}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  mode === "historical"
                    ? "bg-primary text-white"
                    : "bg-white text-neutral-700 hover:bg-neutral-50"
                }`}
              >
                Historical
              </button>
            </div>
          </div>
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
      
      {mode === "current" ? (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 dark:bg-neutral-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                    Stakeholder
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                    Security Type
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                    Shares
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                    Investment
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                    % Ownership
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                    Value
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                {capTable.map((row, index) => (
                  <tr key={index} className="hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
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
                          <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{row.stakeholder.name}</div>
                          {row.stakeholder.title && (
                            <div className="text-sm text-neutral-500 dark:text-neutral-400">{row.stakeholder.title}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-900 dark:text-neutral-100">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStakeholderBadgeColor(row.securityClass.name, row.isOption, row.isPool)}`}>
                        {row.securityClass.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-900 dark:text-neutral-100 text-right font-mono">
                      {formatNumber(row.shares)}
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-900 dark:text-neutral-100 text-right font-mono">
                      {formatCurrency((row as any).investmentAmount || 0)}
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-900 dark:text-neutral-100 text-right font-semibold">
                      {formatPercentage(row.ownership)}
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-900 dark:text-neutral-100 text-right font-mono">
                      {formatCurrency(row.value)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors">
                        <i className="fas fa-ellipsis-h"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-neutral-50 dark:bg-neutral-800 border-t-2 border-neutral-300 dark:border-neutral-600">
                <tr>
                  <td className="px-6 py-4 text-sm font-semibold text-neutral-900 dark:text-neutral-100">Total</td>
                  <td className="px-6 py-4"></td>
                  <td className="px-6 py-4 text-sm font-semibold text-neutral-900 dark:text-neutral-100 text-right font-mono">
                    {formatNumber(totalShares)}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-neutral-900 dark:text-neutral-100 text-right font-mono">
                    {formatCurrency(capTable.reduce((sum, row) => sum + ((row as any).investmentAmount || 0), 0))}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-neutral-900 dark:text-neutral-100 text-right">
                    100.00%
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-neutral-900 dark:text-neutral-100 text-right font-mono">
                    {formatCurrency(totalValue)}
                  </td>
                  <td className="px-6 py-4"></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
            {capTable.map((row, index) => (
              <div key={index} className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div className={`w-10 h-10 ${getStakeholderAvatarColor(row.stakeholder.type, row.isPool)} rounded-full flex items-center justify-center mr-3`}>
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
                      <div className="text-base font-medium text-neutral-900 dark:text-neutral-100">{row.stakeholder.name}</div>
                      {row.stakeholder.title && (
                        <div className="text-sm text-neutral-500 dark:text-neutral-400">{row.stakeholder.title}</div>
                      )}
                    </div>
                  </div>
                  <button className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors touch-target">
                    <i className="fas fa-ellipsis-v"></i>
                  </button>
                </div>

                <div className="flex items-center mb-3">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStakeholderBadgeColor(row.securityClass.name, row.isOption, row.isPool)}`}>
                    {row.securityClass.name}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-neutral-500 dark:text-neutral-400 text-xs uppercase tracking-wider font-medium mb-1">Shares</div>
                    <div className="text-neutral-900 dark:text-neutral-100 font-mono font-medium">{formatNumber(row.shares)}</div>
                  </div>
                  <div>
                    <div className="text-neutral-500 dark:text-neutral-400 text-xs uppercase tracking-wider font-medium mb-1">Investment</div>
                    <div className="text-neutral-900 dark:text-neutral-100 font-mono font-medium">{formatCurrency((row as any).investmentAmount || 0)}</div>
                  </div>
                  <div>
                    <div className="text-neutral-500 dark:text-neutral-400 text-xs uppercase tracking-wider font-medium mb-1">Ownership</div>
                    <div className="text-neutral-900 dark:text-neutral-100 font-semibold text-primary">{formatPercentage(row.ownership)}</div>
                  </div>
                  <div>
                    <div className="text-neutral-500 dark:text-neutral-400 text-xs uppercase tracking-wider font-medium mb-1">Value</div>
                    <div className="text-neutral-900 dark:text-neutral-100 font-mono font-medium">{formatCurrency(row.value)}</div>
                  </div>
                </div>
              </div>
            ))}

            {/* Mobile Totals Card */}
            <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg border-2 border-neutral-300 dark:border-neutral-600 p-4 mt-4">
              <div className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-3">Total</div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-neutral-500 dark:text-neutral-400 text-xs uppercase tracking-wider font-medium mb-1">Total Shares</div>
                  <div className="text-neutral-900 dark:text-neutral-100 font-mono font-semibold">{formatNumber(totalShares)}</div>
                </div>
                <div>
                  <div className="text-neutral-500 dark:text-neutral-400 text-xs uppercase tracking-wider font-medium mb-1">Total Investment</div>
                  <div className="text-neutral-900 dark:text-neutral-100 font-mono font-semibold">{formatCurrency(capTable.reduce((sum, row) => sum + ((row as any).investmentAmount || 0), 0))}</div>
                </div>
                <div>
                  <div className="text-neutral-500 dark:text-neutral-400 text-xs uppercase tracking-wider font-medium mb-1">Total Ownership</div>
                  <div className="text-neutral-900 dark:text-neutral-100 font-semibold text-primary">100.00%</div>
                </div>
                <div>
                  <div className="text-neutral-500 dark:text-neutral-400 text-xs uppercase tracking-wider font-medium mb-1">Total Value</div>
                  <div className="text-neutral-900 dark:text-neutral-100 font-mono font-semibold">{formatCurrency(totalValue)}</div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <HistoricalCapTable capTable={capTable} />
      )}
    </div>
  );
}
