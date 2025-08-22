import { useState, useEffect } from "react";
import { formatNumber, formatCurrency, formatPercentage } from "@/lib/formatters";
import { Button } from "@/components/ui/button";

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
  companyId?: string;
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
function HistoricalCapTable({ companyId }: { companyId: string }) {
  const [historicalData, setHistoricalData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistoricalData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/companies/${companyId}/cap-table/historical`);
        if (!response.ok) {
          throw new Error('Failed to fetch historical data');
        }
        const data = await response.json();
        setHistoricalData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        console.error('Error fetching historical cap table:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistoricalData();
  }, [companyId]);

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 rounded w-1/3 mx-auto"></div>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-12 bg-slate-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-600 mb-4">
          <i className="fas fa-exclamation-triangle text-2xl mb-2"></i>
          <p className="text-sm">Failed to load historical data: {error}</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => window.location.reload()}
        >
          <i className="fas fa-refresh mr-2"></i>
          Retry
        </Button>
      </div>
    );
  }

  if (!historicalData?.milestones?.length) {
    return (
      <div className="p-8 text-center text-slate-600">
        <i className="fas fa-chart-line text-3xl mb-4 text-slate-400"></i>
        <p>No historical data available</p>
        <p className="text-sm text-slate-500 mt-2">Historical view will populate as transactions are recorded</p>
      </div>
    );
  }

  // Get all unique stakeholders from all milestones
  const allStakeholders = new Map<string, { name: string; type?: string }>();
  historicalData.milestones.forEach((milestone: any) => {
    milestone.entries.forEach((entry: any) => {
      if (!allStakeholders.has(entry.stakeholderId)) {
        allStakeholders.set(entry.stakeholderId, { 
          name: entry.stakeholder,
          type: historicalData.stakeholders.find((s: any) => s.id === entry.stakeholderId)?.type 
        });
      }
    });
  });

  const stakeholders = Array.from(allStakeholders.entries()).map(([id, data]) => ({ id, ...data }));

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-slate-50/80">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider sticky left-0 bg-slate-50/80 z-10 border-r border-slate-200">
              Stakeholder
            </th>
            {historicalData.milestones.map((milestone: any) => (
              <th key={milestone.date} className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[120px]">
                {milestone.displayDate}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {stakeholders.map((stakeholder: any) => (
            <tr key={stakeholder.id} className="hover:bg-slate-50/50 transition-colors">
              <td className="px-6 py-4 sticky left-0 bg-white z-10 border-r border-slate-200">
                <div className="flex items-center">
                  <div className={`w-8 h-8 ${
                    stakeholder.type === "entity" 
                      ? "bg-purple-100 text-purple-600" 
                      : "bg-blue-100 text-blue-600"
                  } rounded-full flex items-center justify-center mr-3`}>
                    {stakeholder.type === "entity" ? (
                      <i className="fas fa-building text-sm"></i>
                    ) : (
                      <span className="text-sm font-semibold">
                        {stakeholder.name.split(" ").map((word: string) => word[0]).join("").toUpperCase().slice(0, 2)}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-900">{stakeholder.name}</div>
                  </div>
                </div>
              </td>
              {historicalData.milestones.map((milestone: any) => {
                const entry = milestone.entries.find((e: any) => e.stakeholderId === stakeholder.id);
                const ownership = entry ? entry.ownership : 0;
                const shares = entry ? entry.shares : 0;
                
                return (
                  <td key={milestone.date} className="px-4 py-4 text-center">
                    <div className="text-sm font-semibold text-slate-900">
                      {(ownership * 100).toFixed(2)}%
                    </div>
                    <div className="text-xs text-slate-500">
                      {shares.toLocaleString()} shares
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-slate-50/80 border-t-2 border-slate-300">
          <tr>
            <td className="px-6 py-4 text-sm font-semibold text-slate-900 sticky left-0 bg-slate-50/80 z-10 border-r border-slate-200">
              Total
            </td>
            {historicalData.milestones.map((milestone: any) => (
              <td key={milestone.date} className="px-4 py-4 text-center">
                <div className="text-sm font-semibold text-slate-900">100.00%</div>
                <div className="text-xs text-slate-500">
                  {milestone.fullyDilutedShares?.toLocaleString() || milestone.totalShares?.toLocaleString()} shares
                </div>
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

export default function CapTableMain({ companyId, capTable, convertibles, isLoading, onConvertSafe, onConvertNote }: CapTableMainProps) {
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
              <Button
                size="sm"
                variant={mode === "current" ? "default" : "outline"}
                onClick={() => setMode("current")}
                className="rounded-none rounded-l-lg"
              >
                Current
              </Button>
              <Button
                size="sm"
                variant={mode === "historical" ? "default" : "outline"}
                onClick={() => setMode("historical")}
                className="rounded-none rounded-r-lg border-l-0"
              >
                Historical
              </Button>
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
              <Button
                size="sm"
                variant={mode === "current" ? "default" : "outline"}
                onClick={() => setMode("current")}
                className="rounded-none rounded-l-lg"
              >
                Current
              </Button>
              <Button
                size="sm"
                variant={mode === "historical" ? "default" : "outline"}
                onClick={() => setMode("historical")}
                className="rounded-none rounded-r-lg border-l-0"
              >
                Historical
              </Button>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant={viewType === "fully-diluted" ? "default" : "ghost"}
                onClick={() => setViewType("fully-diluted")}
              >
                Fully Diluted
              </Button>
              <Button
                size="sm"
                variant={viewType === "outstanding" ? "default" : "ghost"}
                onClick={() => setViewType("outstanding")}
              >
                Outstanding Only
              </Button>
            </div>
            <Button variant="ghost" size="icon">
              <i className="fas fa-filter"></i>
            </Button>
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
        <HistoricalCapTable companyId={companyId || ''} />
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
