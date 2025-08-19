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

  console.log("Dashboard: companyId =", companyId);

  const { data: company, isLoading: companyLoading, error: companyError } = useQuery<Company>({
    queryKey: ["/api/companies", companyId],
    enabled: !!companyId,
  });

  const { data: capTableData, isLoading: capTableLoading } = useQuery<{
    stats: { totalShares: number; totalOptions: number; totalConvertibles: number; stakeholderCount: number };
    capTable: Array<{ stakeholder: string; shares: number; options: number; percentage: string; value: number }>;
  }>({
    queryKey: ["/api/companies", companyId, "cap-table"],
    enabled: !!companyId,
  });

  console.log("Dashboard: company =", company);
  console.log("Dashboard: companyLoading =", companyLoading);
  console.log("Dashboard: companyError =", companyError);

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
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-neutral-600">Loading company...</p>
          <p className="text-sm text-neutral-400 mt-2">Company ID: {companyId}</p>
        </div>
      </div>
    );
  }

  if (companyError) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-neutral-600">Error loading company</p>
          <p className="text-sm text-red-500 mt-2">{String(companyError)}</p>
          <p className="text-sm text-neutral-400 mt-1">Company ID: {companyId}</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-neutral-600">Company not found</p>
          <p className="text-sm text-neutral-400 mt-2">Company ID: {companyId}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* DEBUG INFO */}
        <div className="bg-green-50 border border-green-200 p-4 mb-6 rounded">
          <h3 className="font-bold text-green-800">🎉 SUCCESS! Dashboard is working!</h3>
          <p className="text-green-700">Company ID: {companyId}</p>
          <p className="text-green-700">Company: {company?.name || 'Loading...'}</p>
          <p className="text-green-700">Loading: {companyLoading ? 'Yes' : 'No'}</p>
        </div>
        
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
            ownership: parseFloat(row.percentage) / 100,
            value: row.value
          })) || []} 
          isLoading={capTableLoading}
        />

        {/* Charts and Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <OwnershipChart capTable={capTableData?.capTable?.map(row => ({
            stakeholder: { name: row.stakeholder },
            securityClass: { name: "Common Stock" },
            shares: row.shares,
            ownership: parseFloat(row.percentage) / 100,
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
