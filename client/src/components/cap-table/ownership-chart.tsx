import { formatPercentage } from "@/lib/formatters";

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
  investment: number; // Added missing investment field!
  value: number;
  isOption?: boolean;
  isPool?: boolean;
}

interface OwnershipChartProps {
  capTable?: CapTableRow[];
}

export default function OwnershipChart({ capTable }: OwnershipChartProps) {
  if (!capTable || capTable.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-neutral-900">Ownership Distribution</h3>
        </div>
        <div className="text-center text-neutral-500">
          No ownership data available
        </div>
      </div>
    );
  }

  // Group by category
  const foundersOwnership = capTable
    .filter(row => 
      row.stakeholder.title?.toLowerCase().includes("founder") ||
      row.stakeholder.title?.toLowerCase().includes("ceo") ||
      row.stakeholder.title?.toLowerCase().includes("cto")
    )
    .reduce((sum, row) => sum + row.ownership, 0);

  const investorsOwnership = capTable
    .filter(row => 
      row.stakeholder.type === "entity" ||
      row.stakeholder.title?.toLowerCase().includes("investor")
    )
    .reduce((sum, row) => sum + row.ownership, 0);

  const employeesOwnership = capTable
    .filter(row => 
      row.isOption ||
      (row.stakeholder.title && 
       !row.stakeholder.title.toLowerCase().includes("founder") &&
       !row.stakeholder.title.toLowerCase().includes("ceo") &&
       !row.stakeholder.title.toLowerCase().includes("cto") &&
       !row.stakeholder.title.toLowerCase().includes("investor"))
    )
    .reduce((sum, row) => sum + row.ownership, 0);

  const availablePoolOwnership = capTable
    .filter(row => row.isPool)
    .reduce((sum, row) => sum + row.ownership, 0);

  const chartData = [
    { label: "Founders", percentage: foundersOwnership, color: "bg-blue-500" },
    { label: "Investors", percentage: investorsOwnership, color: "bg-green-500" },
    { label: "Employees", percentage: employeesOwnership, color: "bg-purple-500" },
    { label: "Available Pool", percentage: availablePoolOwnership, color: "bg-yellow-500" },
  ].filter(item => item.percentage > 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-neutral-900">Ownership Distribution</h3>
        <button className="text-neutral-400 hover:text-neutral-600 transition-colors">
          <i className="fas fa-expand-alt"></i>
        </button>
      </div>
      
      {/* Simplified pie chart visualization */}
      <div className="relative w-64 h-64 mx-auto mb-6">
        <div className="absolute inset-0 rounded-full border-8 border-blue-500" 
             style={{
               borderRightColor: '#3B82F6', 
               borderBottomColor: '#10B981', 
               borderLeftColor: '#8B5CF6', 
               borderTopColor: '#F59E0B'
             }}>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold text-neutral-900">100%</div>
            <div className="text-sm text-neutral-500">Fully Diluted</div>
          </div>
        </div>
      </div>
      
      <div className="space-y-3">
        {chartData.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center">
              <div className={`w-3 h-3 ${item.color} rounded-full mr-3`}></div>
              <span className="text-sm text-neutral-700">{item.label}</span>
            </div>
            <span className="text-sm font-semibold text-neutral-900">
              {formatPercentage(item.percentage)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
