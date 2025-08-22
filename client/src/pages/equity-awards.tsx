import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatNumber, formatCurrency } from "@/lib/formatters";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/layout/navigation";
import GrantOptionsDialog from "@/components/dialogs/grant-options-dialog";

export default function EquityAwards() {
  const { companyId } = useParams();
  const { toast } = useToast();
  const [showGrantDialog, setShowGrantDialog] = useState(false);

  const { data: equityAwards, isLoading } = useQuery({
    queryKey: ["/api/companies", companyId, "equity-awards"],
    enabled: !!companyId,
  });

  // Mutation for cancelling equity awards
  const cancelAwardMutation = useMutation({
    mutationFn: async (awardId: string) => {
      return apiRequest(`/api/companies/${companyId}/equity-awards/${awardId}/cancel`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId, "equity-awards"] });
      toast({
        title: "Success",
        description: "Equity award cancelled successfully",
        variant: "success",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error", 
        description: error.message || "Failed to cancel equity award",
        variant: "error",
      });
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-semibold text-neutral-900">Equity Awards</h1>
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

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-neutral-900">Equity Awards</h1>
            <Button onClick={() => setShowGrantDialog(true)} data-testid="button-grant-options">
              <i className="fas fa-plus mr-2"></i>
              Grant Options
            </Button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
            <div className="px-6 py-4 border-b border-neutral-200">
              <h3 className="text-lg font-semibold text-neutral-900">Option Grants</h3>
              <p className="text-sm text-neutral-500">Employee stock options and restricted stock units</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Recipient
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Granted
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Exercised
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Outstanding
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Strike Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-200">
                  {Array.isArray(equityAwards) && equityAwards.map((award: any) => {
                    const outstanding = award.quantityGranted - award.quantityExercised - award.quantityCanceled;
                    return (
                      <tr key={award.id} className="hover:bg-neutral-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-neutral-900">
                            {award.holderName || "Unknown"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            award.type === "stock_option" 
                              ? "bg-blue-100 text-blue-800"
                              : "bg-green-100 text-green-800"
                          }`}>
                            {award.type === "stock_option" ? "Options" : "RSU"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 text-right">
                          {formatNumber(award.quantityGranted)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 text-right">
                          {formatNumber(award.quantityExercised)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 text-right">
                          {formatNumber(outstanding)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 text-right">
                          {award.strikePrice ? formatCurrency(parseFloat(award.strikePrice)) : "—"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            outstanding > 0 ? "bg-green-100 text-green-800" : "bg-neutral-100 text-neutral-800"
                          }`}>
                            {outstanding > 0 ? "Active" : "Exercised"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button 
                            className="text-primary hover:text-primary-dark mr-3"
                            data-testid={`button-edit-${award.id}`}
                            onClick={() => {
                              // TODO: Implement edit functionality
                              toast({
                                title: "Coming Soon",
                                description: "Edit functionality will be added soon",
                                variant: "info",
                              });
                            }}
                          >
                            Edit
                          </button>
                          <button 
                            className="text-red-600 hover:text-red-900"
                            data-testid={`button-cancel-${award.id}`}
                            onClick={() => {
                              if (confirm("Are you sure you want to cancel this equity award?")) {
                                cancelAwardMutation.mutate(award.id);
                              }
                            }}
                            disabled={cancelAwardMutation.isPending}
                          >
                            {cancelAwardMutation.isPending ? "Cancelling..." : "Cancel"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {(!Array.isArray(equityAwards) || equityAwards.length === 0) && (
                <div className="text-center py-12">
                  <p className="text-neutral-500">No equity awards found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Grant Options Dialog */}
      <GrantOptionsDialog
        open={showGrantDialog}
        onOpenChange={setShowGrantDialog}
        companyId={companyId!}
      />
    </div>
  );
}