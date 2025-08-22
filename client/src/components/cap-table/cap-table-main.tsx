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
  convertibles?: Array<{ 
    id: string; 
    type: string; 
    holderName: string; 
    principal: number; 
    framework?: string; 
    discountRate?: number; 
    valuationCap?: number; 
    interestRate?: number;
    issueDate: string;
    status?: 'active' | 'converted';
    conversionDate?: string | null;
  }>;
  isLoading: boolean;
  onConvertSafe?: (convertible: any) => void;
  onConvertNote?: (convertible: any) => void;
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
        <thead className="bg-neutral-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider sticky left-0 bg-neutral-50 z-10 border-r border-neutral-200">
              Stakeholder
            </th>
            {historicalDates.map(date => (
              <th key={date} className="px-4 py-3 text-center text-xs font-semibold text-neutral-600 uppercase tracking-wider min-w-[120px]">
                {date}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200">
          {stakeholders.map((stakeholder: any, index: number) => (
            <tr key={index} className="hover:bg-neutral-50 transition-colors">
              <td className="px-6 py-4 sticky left-0 bg-white z-10 border-r border-neutral-200">
                <div className="flex items-center">
                  <div className={`w-8 h-8 ${stakeholder.stakeholder.type === "entity" ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600"} rounded-full flex items-center justify-center mr-3`}>
                    {stakeholder.stakeholder.type === "entity" ? (
                      <i className="fas fa-building text-sm"></i>
                    ) : (
                      <span className="text-sm font-semibold">
                        {stakeholder.stakeholder.name.split(" ").map((word: string) => word[0]).join("").toUpperCase().slice(0, 2)}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-neutral-900">{stakeholder.stakeholder.name}</div>
                    {stakeholder.stakeholder.title && (
                      <div className="text-sm text-neutral-500">{stakeholder.stakeholder.title}</div>
                    )}
                  </div>
                </div>
              </td>
              {historicalDates.map(date => (
                <td key={date} className="px-4 py-4 text-center">
                  <div className="text-sm font-semibold text-neutral-900">
                    {formatPercentage(stakeholder.history[date] || 0)}
                  </div>
                  <div className="text-xs text-neutral-500">
                    {((stakeholder.history[date] || 0) * 1000000).toLocaleString()} shares
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-neutral-50 border-t-2 border-neutral-300">
          <tr>
            <td className="px-6 py-4 text-sm font-semibold text-neutral-900 sticky left-0 bg-neutral-50 z-10 border-r border-neutral-200">
              Total
            </td>
            {historicalDates.map(date => (
              <td key={date} className="px-4 py-4 text-center">
                <div className="text-sm font-semibold text-neutral-900">100.00%</div>
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

export default function CapTableMain({ capTable, convertibles, isLoading, onConvertSafe, onConvertNote }: CapTableMainProps) {
  const [viewType, setViewType] = useState<"fully-diluted" | "outstanding">("fully-diluted");
  const [mode, setMode] = useState<"current" | "historical">("current");
  const [convertibleFilter, setConvertibleFilter] = useState<"active" | "all">("active");

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

  // Filter convertibles based on the selected filter
  const filteredConvertibles = convertibles?.filter(instrument => 
    convertibleFilter === "all" || instrument.status === "active"
  ) || [];

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
                  Investment
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
                  <td className="px-6 py-4 text-sm text-neutral-900 text-right font-mono">
                    {formatCurrency((row as any).investment || 0)}
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
                <td className="px-6 py-4 text-sm font-semibold text-neutral-900 text-right font-mono">
                  {formatCurrency(capTable.reduce((sum, row) => sum + ((row as any).investment || 0), 0))}
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
      ) : (
        <HistoricalCapTable capTable={capTable} />
      )}

      {/* Convertible Instruments Section */}
      {convertibles && convertibles.length > 0 && (
        <div className="border-t border-neutral-200">
          <div className="px-6 py-4 bg-neutral-50 flex items-center justify-between">
            <h4 className="text-md font-semibold text-neutral-900">Convertible Instruments</h4>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-neutral-600">Show:</span>
              <div className="flex rounded-lg border border-neutral-300 overflow-hidden">
                <button
                  onClick={() => setConvertibleFilter("active")}
                  className={`px-3 py-1 text-xs font-medium transition-colors ${
                    convertibleFilter === "active"
                      ? "bg-primary text-white"
                      : "bg-white text-neutral-600 hover:bg-neutral-50"
                  }`}
                  data-testid="filter-active-convertibles"
                >
                  Active Only
                </button>
                <button
                  onClick={() => setConvertibleFilter("all")}
                  className={`px-3 py-1 text-xs font-medium transition-colors ${
                    convertibleFilter === "all"
                      ? "bg-primary text-white"
                      : "bg-white text-neutral-600 hover:bg-neutral-50"
                  }`}
                  data-testid="filter-all-convertibles"
                >
                  All
                </button>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-25">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                    Holder
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                    Principal
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                    Valuation Cap
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                    Discount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                    Issue Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {filteredConvertibles.map((instrument, index) => (
                  <tr key={index} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mr-3">
                          <i className="fas fa-file-contract text-sm"></i>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-neutral-900">{instrument.holderName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        instrument.type === 'safe' ? 'bg-orange-100 text-orange-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {instrument.type === 'safe' ? 'SAFE' : 'Convertible Note'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-sm font-medium text-neutral-900">
                        {formatCurrency(instrument.principal)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-sm text-neutral-600">
                        {instrument.valuationCap ? formatCurrency(instrument.valuationCap) : '—'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-sm text-neutral-600">
                        {instrument.discountRate ? `${(instrument.discountRate * 100).toFixed(2)}%` : '—'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-neutral-600">
                        {new Date(instrument.issueDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          instrument.status === 'converted' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`} data-testid={`status-${instrument.status}`}>
                          {instrument.status === 'converted' ? 'Converted' : 'Active'}
                        </span>
                        {instrument.status === 'converted' && instrument.conversionDate && (
                          <div className="text-xs text-neutral-500 mt-1">
                            {new Date(instrument.conversionDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {(instrument.type === 'SAFE' || instrument.type === 'safe') && onConvertSafe && (
                        <button
                          onClick={() => onConvertSafe(instrument)}
                          disabled={instrument.status === 'converted'}
                          className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded transition-colors ${
                            instrument.status === 'converted'
                              ? 'text-neutral-400 bg-neutral-100 cursor-not-allowed'
                              : 'text-white bg-orange-600 hover:bg-orange-700'
                          }`}
                          data-testid={`button-convert-safe-${instrument.status === 'converted' ? 'disabled' : 'enabled'}`}
                        >
                          Convert
                        </button>
                      )}
                      {(instrument.type === 'note' || instrument.framework === 'Convertible Note') && onConvertNote && (
                        <button
                          onClick={() => onConvertNote(instrument)}
                          disabled={instrument.status === 'converted'}
                          className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded transition-colors ${
                            instrument.status === 'converted'
                              ? 'text-neutral-400 bg-neutral-100 cursor-not-allowed'
                              : 'text-white bg-purple-600 hover:bg-purple-700'
                          }`}
                          data-testid={`button-convert-note-${instrument.status === 'converted' ? 'disabled' : 'enabled'}`}
                        >
                          Convert
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
