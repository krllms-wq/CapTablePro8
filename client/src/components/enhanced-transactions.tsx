import { useState } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { TransactionsEmptyState } from "@/components/ui/empty-state";
import Navigation from "@/components/layout/navigation";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function EnhancedTransactions() {
  const { companyId } = useParams();
  const [showAddTransaction, setShowAddTransaction] = useState(false);

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["/api/companies", companyId, "share-ledger"],
    enabled: !!companyId,
  });

  const { data: company } = useQuery({
    queryKey: ["/api/companies", companyId],
    enabled: !!companyId,
  });

  const handleAddTransaction = () => {
    setShowAddTransaction(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-neutral-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-neutral-900">Transaction History</h1>
              <p className="text-neutral-600 mt-1">
                Complete history of equity transactions and company activities
              </p>
            </div>
            <Button onClick={handleAddTransaction} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Transaction
            </Button>
          </div>

          {(!transactions || (transactions as any[]).length === 0) ? (
            <TransactionsEmptyState onAddTransaction={handleAddTransaction} />
          ) : (
            <div className="bg-white rounded-xl shadow-sm border">
              {/* Regular transactions table would go here */}
              <div className="p-6">
                <p>Transactions table content would be here</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}