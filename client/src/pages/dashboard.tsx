import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useParams } from "wouter";
import Navigation from "@/components/layout/navigation";
import CapTableStats from "@/components/cap-table/cap-table-stats";
import CapTableMain from "@/components/cap-table/cap-table-main";
import OwnershipChart from "@/components/cap-table/ownership-chart";
import RecentActivity from "@/components/cap-table/recent-activity";
import NewTransactionButton from "@/components/new-transaction-button";
import { Button } from "@/components/ui/button";
import IssueSharesDialog from "@/components/dialogs/issue-shares-dialog";
import GrantOptionsDialog from "@/components/dialogs/grant-options-dialog";
import type { Company } from "@shared/schema";

export default function Dashboard() {
  const { companyId } = useParams();
  const [showIssueShares, setShowIssueShares] = useState(false);
  const [showGrantOptions, setShowGrantOptions] = useState(false);

  const { data: company, isLoading: companyLoading, error: companyError } = useQuery<Company>({
    queryKey: ["/api/companies", companyId],
    enabled: !!companyId,
  });

  const { data: capTableData, isLoading: capTableLoading } = useQuery<{
    stats: { totalShares: number; totalOptions: number; totalConvertibles: number; stakeholderCount: number };
    capTable: Array<{ stakeholder: string; shares: number; options: number; convertibles?: number; percentage: string; value: number }>;
    convertibles: Array<{ id: string; type: string; holderName: string; principal: number; framework?: string; discountRate?: number; valuationCap?: number; issueDate: string }>;
  }>({
    queryKey: ["/api/companies", companyId, "cap-table"],
    enabled: !!companyId,
  });

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
      <div className="min-h-screen bg-yellow-50 flex items-center justify-center">
        <div className="text-center bg-yellow-100 p-8 rounded border">
          <h2 className="text-2xl font-bold text-yellow-800">LOADING COMPANY...</h2>
          <p className="text-yellow-700 mt-2">Company ID: {companyId}</p>
          <p className="text-yellow-600 text-sm mt-2">If you see this, the page is working but still loading data.</p>
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
    <div className="min-h-screen bg-neutral-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-6 py-6">

        
        {/* Company Header */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-neutral-900">{company.name}</h2>
              <p className="text-neutral-600 mt-1">{company.description}</p>
            </div>
            <div className="flex space-x-3">
              <NewTransactionButton 
                onTransactionSelect={(type) => {
                  if (type === "shares") setShowIssueShares(true);
                  if (type === "options") setShowGrantOptions(true);
                  // Add more transaction types as needed
                }}
              />
              <button className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg font-medium hover:bg-neutral-50 transition-colors">
                <i className="fas fa-download mr-2"></i>Export
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <CapTableStats 
          stats={capTableData?.stats ? {
            totalShares: capTableData.stats.totalShares,
            fullyDilutedShares: capTableData.stats.totalShares + capTableData.stats.totalOptions,
            currentValuation: 0, // Default valuation - can be enhanced later
            optionPoolAvailable: capTableData.stats.totalOptions
          } : undefined} 
          isLoading={capTableLoading} 
        />

        {/* Main Cap Table */}
        <CapTableMain 
          capTable={capTableData?.capTable?.map(row => ({
            stakeholder: { name: row.stakeholder },
            securityClass: { name: "Common Stock" }, // Default security class
            shares: row.shares,
            ownership: parseFloat(row.percentage),
            value: row.value,
            convertibles: row.convertibles || 0
          })) || []} 
          convertibles={capTableData?.convertibles || []}
          isLoading={capTableLoading}
        />

        {/* Charts and Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <OwnershipChart capTable={capTableData?.capTable?.map(row => ({
            stakeholder: { name: row.stakeholder },
            securityClass: { name: "Common Stock" },
            shares: row.shares,
            ownership: parseFloat(row.percentage),
            value: row.value
          })) || []} />
          <RecentActivity companyId={companyId!} />
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            <NewTransactionButton 
              onTransactionSelect={(type) => {
                if (type === "shares") setShowIssueShares(true);
                if (type === "options") setShowGrantOptions(true);
                // Add more transaction types as needed
              }}
            />
            <Button variant="outline">
              Add Stakeholder
            </Button>
            <Button variant="outline">
              View Activity
            </Button>
          </div>
        </div>
      </div>

      {/* Transaction Dialogs */}
      <IssueSharesDialog
        open={showIssueShares}
        onOpenChange={setShowIssueShares}
        companyId={companyId!}
      />

      <GrantOptionsDialog
        open={showGrantOptions}
        onOpenChange={setShowGrantOptions}
        companyId={companyId!}
      />
    </div>
  );
}
