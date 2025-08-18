import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useParams } from "wouter";
import ResponsiveNavigation from "@/components/layout/responsive-navigation";
import CapTableStats from "@/components/cap-table/cap-table-stats";
import CapTableMain from "@/components/cap-table/cap-table-main";
import OwnershipChart from "@/components/cap-table/ownership-chart";
import RecentActivity from "@/components/cap-table/recent-activity";
import QuickActions from "@/components/cap-table/quick-actions";
import IssueSharesDialog from "@/components/dialogs/issue-shares-dialog";
import GrantOptionsDialog from "@/components/dialogs/grant-options-dialog";
import type { Company } from "@shared/schema";
import { Plus, Download } from "lucide-react";

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
    <ResponsiveNavigation>
      <div className="max-w-7xl mx-auto responsive-padding">
        {/* Company Header */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 p-4 lg:p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl lg:text-2xl font-bold text-neutral-900 dark:text-neutral-100">{company.name}</h2>
              <p className="text-neutral-600 dark:text-neutral-400 mt-1">{company.description}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <button 
                  onClick={() => setShowTransactionMenu(!showTransactionMenu)}
                  className="w-full sm:w-auto touch-target px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors flex items-center justify-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Transaction
                </button>
                {showTransactionMenu && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 z-10">
                    <button
                      onClick={() => {
                        setShowIssueShares(true);
                        setShowTransactionMenu(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-700 first:rounded-t-lg text-neutral-900 dark:text-neutral-100"
                    >
                      <Plus className="h-4 w-4 mr-2 text-primary inline" />
                      Issue Shares
                    </button>
                    <button
                      onClick={() => {
                        setShowGrantOptions(true);
                        setShowTransactionMenu(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-700 last:rounded-b-lg text-neutral-900 dark:text-neutral-100"
                    >
                      <Plus className="h-4 w-4 mr-2 text-secondary inline" />
                      Grant Options
                    </button>
                  </div>
                )}
              </div>
              <button className="w-full sm:w-auto touch-target px-4 py-2 border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 rounded-lg font-medium hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors flex items-center justify-center">
                <Download className="h-4 w-4 mr-2" />
                Export
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
    </ResponsiveNavigation>
  );
}
