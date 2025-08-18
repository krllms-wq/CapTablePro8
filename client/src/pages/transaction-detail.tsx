import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/formatters";
import Navigation from "@/components/layout/navigation";

export default function TransactionDetail() {
  const { companyId, transactionId } = useParams();

  const { data: transaction, isLoading } = useQuery({
    queryKey: ["/api/companies", companyId, "transactions", transactionId],
    enabled: !!companyId && !!transactionId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-neutral-200 rounded w-1/3"></div>
              <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
              <div className="space-y-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-4 bg-neutral-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 text-center">
            <h2 className="text-xl font-semibold text-neutral-900 mb-2">Transaction Not Found</h2>
            <p className="text-neutral-600">The requested transaction could not be found.</p>
            <Button 
              onClick={() => window.location.href = `/companies/${companyId}/transactions`}
              className="mt-4"
            >
              Back to Transactions
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navigation />
      <div className="max-w-4xl mx-auto px-6 py-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-neutral-900">Transaction Details</h1>
              <p className="text-neutral-600">View transaction information and history</p>
            </div>
            <div className="flex space-x-3">
              <Button 
                variant="outline"
                onClick={() => window.location.href = `/companies/${companyId}/transactions/${transactionId}/edit`}
              >
                <i className="fas fa-edit mr-2"></i>
                Edit Transaction
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.location.href = `/companies/${companyId}/transactions`}
              >
                <i className="fas fa-arrow-left mr-2"></i>
                Back to Transactions
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
            <div className="px-6 py-4 border-b border-neutral-200">
              <h3 className="text-lg font-semibold text-neutral-900">Transaction Information</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Transaction Type
                  </label>
                  <p className="text-sm text-neutral-900 capitalize">
                    {transaction.type || "—"}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Date
                  </label>
                  <p className="text-sm text-neutral-900">
                    {transaction.date ? formatDate(transaction.date) : "—"}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Stakeholder
                  </label>
                  <p className="text-sm text-neutral-900">
                    {transaction.stakeholder?.name || "—"}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Security Class
                  </label>
                  <p className="text-sm text-neutral-900">
                    {transaction.securityClass?.name || "—"}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Quantity
                  </label>
                  <p className="text-sm text-neutral-900 font-mono">
                    {transaction.quantity?.toLocaleString() || "—"}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Value
                  </label>
                  <p className="text-sm text-neutral-900 font-mono">
                    {transaction.value ? formatCurrency(transaction.value) : "—"}
                  </p>
                </div>

                {transaction.pricePerShare && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Price Per Share
                    </label>
                    <p className="text-sm text-neutral-900 font-mono">
                      {formatCurrency(transaction.pricePerShare)}
                    </p>
                  </div>
                )}

                {transaction.certificateNumber && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Certificate Number
                    </label>
                    <p className="text-sm text-neutral-900">
                      {transaction.certificateNumber}
                    </p>
                  </div>
                )}

                {transaction.notes && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Notes
                    </label>
                    <p className="text-sm text-neutral-900">
                      {transaction.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}