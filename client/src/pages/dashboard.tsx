import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useParams } from "wouter";
import Navigation from "@/components/layout/navigation";
import CapTableStats from "@/components/cap-table/cap-table-stats";
import CapTableMain from "@/components/cap-table/cap-table-main";
import OwnershipChart from "@/components/cap-table/ownership-chart";
import RecentActivity from "@/components/cap-table/recent-activity";
import QuickActions from "@/components/cap-table/quick-actions";
import IssueSharesDialog from "@/components/dialogs/issue-shares-dialog";
import GrantOptionsDialog from "@/components/dialogs/grant-options-dialog";
import type { Company } from "@shared/schema";

export default function Dashboard() {
  const { companyId } = useParams();
  const [showIssueShares, setShowIssueShares] = useState(false);
  const [showGrantOptions, setShowGrantOptions] = useState(false);
  const [showTransactionMenu, setShowTransactionMenu] = useState(false);

  const { data: company } = useQuery<Company>({
    queryKey: ["/api/companies", companyId],
    enabled: !!companyId,
  });

  const { data: capTableData, isLoading: capTableLoading } = useQuery({
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

  if (!company) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-neutral-600">No company found</p>
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
              <div className="relative">
                <button 
                  onClick={() => setShowTransactionMenu(!showTransactionMenu)}
                  className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors"
                >
                  <i className="fas fa-plus mr-2"></i>New Transaction
                </button>
                {showTransactionMenu && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-neutral-200 z-10">
                    <button
                      onClick={() => {
                        setShowIssueShares(true);
                        setShowTransactionMenu(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-neutral-50 first:rounded-t-lg"
                    >
                      <i className="fas fa-plus-circle mr-2 text-primary"></i>Issue Shares
                    </button>
                    <button
                      onClick={() => {
                        setShowGrantOptions(true);
                        setShowTransactionMenu(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-neutral-50 last:rounded-b-lg"
                    >
                      <i className="fas fa-gift mr-2 text-secondary"></i>Grant Options
                    </button>
                  </div>
                )}
              </div>
              <button className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg font-medium hover:bg-neutral-50 transition-colors">
                <i className="fas fa-download mr-2"></i>Export
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <CapTableStats 
          stats={capTableData?.stats || {}} 
          isLoading={capTableLoading} 
        />

        {/* Main Cap Table */}
        <CapTableMain 
          capTable={capTableData?.capTable || []} 
          isLoading={capTableLoading}
        />

        {/* Charts and Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <OwnershipChart capTable={capTableData?.capTable || []} />
          <RecentActivity companyId={companyId!} />
        </div>

        {/* Quick Actions */}
        <QuickActions companyId={companyId!} />
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
