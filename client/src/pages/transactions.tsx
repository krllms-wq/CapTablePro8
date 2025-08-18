import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { formatNumber, formatCurrency } from "@/lib/formatters";
import Navigation from "@/components/layout/navigation";

export default function Transactions() {
  const { companyId } = useParams();

  const { data: shareLedger, isLoading: ledgerLoading } = useQuery({
    queryKey: ["/api/companies", companyId, "share-ledger"],
    enabled: !!companyId,
  });

  const { data: auditLogs, isLoading: auditLoading } = useQuery({
    queryKey: ["/api/companies", companyId, "audit-logs"],
    enabled: !!companyId,
  });

  const isLoading = ledgerLoading || auditLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-semibold text-neutral-900">Transaction History</h1>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
              <div className="animate-pulse space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-neutral-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getTransactionIcon = (action?: string) => {
    if (!action) return "fas fa-question";
    if (action.includes("issue")) return "fas fa-plus text-green-500";
    if (action.includes("transfer")) return "fas fa-exchange-alt text-blue-500";
    if (action.includes("exercise")) return "fas fa-arrow-right text-orange-500";
    if (action.includes("cancel")) return "fas fa-times text-red-500";
    return "fas fa-file-alt text-neutral-500";
  };

  // Combine share ledger entries and audit logs into unified transaction view
  const combinedTransactions = [
    ...(shareLedger || []).map((entry: any) => ({
      id: entry.id,
      type: "share_transaction",
      action: entry.action,
      description: `${entry.action} transaction`,
      date: new Date(entry.transactionDate),
      amount: entry.quantity,
      pricePerShare: entry.pricePerShare,
      value: entry.quantity * parseFloat(entry.pricePerShare || "0"),
    })),
    ...(auditLogs || []).map((log: any) => ({
      id: log.id,
      type: "audit_log",
      action: log.action,
      description: log.description,
      date: new Date(log.timestamp),
      amount: null,
      pricePerShare: null,
      value: null,
    }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-neutral-900">Transaction History</h1>
            <Button>
              <i className="fas fa-plus mr-2"></i>
              Add Transaction
            </Button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
            <div className="px-6 py-4 border-b border-neutral-200">
              <h3 className="text-lg font-semibold text-neutral-900">All Transactions</h3>
              <p className="text-sm text-neutral-500">Complete history of equity transactions and company activities</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Transaction
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Shares
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Price/Share
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Total Value
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-200">
                  {combinedTransactions.map((transaction: any) => (
                    <tr key={transaction.id} className="hover:bg-neutral-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-neutral-100 rounded-full flex items-center justify-center mr-3">
                            <i className={getTransactionIcon(transaction.action)}></i>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-neutral-900">
                              {transaction.action ? transaction.action.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase()) : "Unknown Action"}
                            </div>
                            <div className="text-sm text-neutral-500">
                              {transaction.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-neutral-900">
                          {transaction.date.toLocaleDateString()}
                        </div>
                        <div className="text-xs text-neutral-500">
                          {formatDistanceToNow(transaction.date, { addSuffix: true })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 text-right">
                        {transaction.amount ? formatNumber(transaction.amount) : "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 text-right">
                        {transaction.pricePerShare ? formatCurrency(parseFloat(transaction.pricePerShare)) : "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 text-right">
                        {transaction.value ? formatCurrency(transaction.value) : "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button className="text-primary hover:text-primary-dark mr-3">
                          View
                        </button>
                        <button className="text-red-600 hover:text-red-900">
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(!combinedTransactions || combinedTransactions.length === 0) && (
                <div className="text-center py-12">
                  <p className="text-neutral-500">No transactions found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}