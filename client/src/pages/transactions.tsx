import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/formatters";
import Navigation from "@/components/layout/navigation";

export default function TransactionsPage() {
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
    ...(Array.isArray(shareLedger) ? shareLedger : []).map((entry: any) => ({
      id: entry.id,
      type: "share_transaction",
      action: entry.action,
      description: `${entry.action} transaction`,
      date: entry.transactionDate ? new Date(entry.transactionDate) : new Date(),
      amount: entry.quantity,
      pricePerShare: entry.pricePerShare,
      value: entry.quantity * parseFloat(entry.pricePerShare || "0"),
    })),
    ...(Array.isArray(auditLogs) ? auditLogs : []).map((log: any) => ({
      id: log.id,
      type: "audit_log",
      action: log.action,
      description: log.description,
      date: log.timestamp ? new Date(log.timestamp) : new Date(),
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
              <h3 className="text-lg font-semibold text-neutral-900">Recent Transactions</h3>
            </div>
            
            {combinedTransactions.length === 0 ? (
              <div className="p-8 text-center text-neutral-500">
                <i className="fas fa-file-alt text-4xl mb-4 text-neutral-300"></i>
                <p>No transactions found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Value
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-neutral-200">
                    {combinedTransactions.map((transaction: any) => (
                      <tr key={`${transaction.type}-${transaction.id}`} className="hover:bg-neutral-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <i className={`${getTransactionIcon(transaction.action)} mr-3`}></i>
                            <Badge variant={transaction.type === "share_transaction" ? "default" : "secondary"}>
                              {transaction.type === "share_transaction" ? "Share" : "Audit"}
                            </Badge>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-neutral-900">
                            {transaction.action}
                          </div>
                          <div className="text-sm text-neutral-500">
                            {transaction.description}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                          {transaction.date.toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 text-right">
                          {transaction.amount ? formatNumber(transaction.amount) : "—"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 text-right">
                          {transaction.value ? `$${formatNumber(transaction.value)}` : "—"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button className="text-primary hover:text-primary-dark mr-3">
                            View
                          </button>
                          {transaction.type === "share_transaction" && (
                            <button className="text-primary hover:text-primary-dark">
                              Edit
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}