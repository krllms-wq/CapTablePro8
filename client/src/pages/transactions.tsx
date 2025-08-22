import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { formatNumber, formatDate } from "@/lib/formatters";
import CompanyLayout from "@/components/layout/company-layout";
import IssueSharesDialog from "@/components/dialogs/issue-shares-dialog";
import GrantOptionsDialog from "@/components/dialogs/grant-options-dialog";
import SafeAgreementDialog from "@/components/dialogs/safe-agreement-dialog";
import ConvertibleNoteDialog from "@/components/dialogs/convertible-note-dialog";
import { SecondaryTransactionDialog } from "@/components/dialogs/secondary-transaction-dialog";
import { Plus, FileText, TrendingUp, ArrowRightLeft, DollarSign, Shield } from "lucide-react";
import { useConfirmation } from "@/components/ui/confirmation-dialog";

export default function TransactionsPage() {
  const { companyId } = useParams();
  const [selectedTransactionType, setSelectedTransactionType] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { confirm, ConfirmationComponent } = useConfirmation();

  // Rollback transaction mutation
  const rollbackMutation = useMutation({
    mutationFn: async (transactionId: string) => {
      return apiRequest(`/api/companies/${companyId}/transactions/${transactionId}/rollback`, {
        method: 'POST',
        body: { reason: 'Manual rollback from transactions page' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/companies', companyId] });
      toast({ title: "Transaction rolled back successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to rollback transaction", 
        description: error.message || "Unknown error",
        variant: "destructive"
      });
    }
  });

  const handleRollback = (transactionId: string) => {
    console.log('Attempting rollback for transaction:', transactionId);
    confirm({
      title: "Rollback Transaction",
      description: "Are you sure you want to rollback this transaction? This action cannot be undone.",
      confirmText: "Rollback",
      variant: "destructive",
      onConfirm: () => rollbackMutation.mutate(transactionId)
    });
  };

  const { data: shareLedger, isLoading: ledgerLoading } = useQuery({
    queryKey: ["/api/companies", companyId, "share-ledger"],
    enabled: !!companyId,
  });

  const { data: equityAwards, isLoading: equityLoading } = useQuery({
    queryKey: ["/api/companies", companyId, "equity-awards"],
    enabled: !!companyId,
  });

  const { data: convertibles, isLoading: convertiblesLoading } = useQuery({
    queryKey: ["/api/companies", companyId, "convertibles"],
    enabled: !!companyId,
  });

  const { data: stakeholders } = useQuery({
    queryKey: ["/api/companies", companyId, "stakeholders"],
    enabled: !!companyId,
  });

  const { data: securityClasses } = useQuery({
    queryKey: ["/api/companies", companyId, "security-classes"],
    enabled: !!companyId,
  });

  const isLoading = ledgerLoading || equityLoading || convertiblesLoading;

  const stakeholderMap = new Map(Array.isArray(stakeholders) ? stakeholders.map((s: any) => [s.id, s.name]) : []);
  const securityClassMap = new Map(Array.isArray(securityClasses) ? securityClasses.map((sc: any) => [sc.id, sc.name]) : []);

  if (isLoading) {
    return (
      <CompanyLayout>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-semibold text-neutral-900">Transactions</h1>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
              <div className="animate-pulse space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-neutral-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
      </CompanyLayout>
    );
  }

  const transactionTypes = [
    {
      id: "shares",
      name: "Issue Shares",
      description: "Issue common or preferred shares",
      icon: DollarSign,
      color: "text-emerald-600"
    },
    {
      id: "options",
      name: "Grant Options",
      description: "Grant stock options or RSUs",
      icon: TrendingUp,
      color: "text-indigo-600"
    },
    {
      id: "safe",
      name: "SAFE Agreement",
      description: "Issue SAFE (Simple Agreement for Future Equity)",
      icon: Shield,
      color: "text-violet-600"
    },
    {
      id: "convertible",
      name: "Convertible Note",
      description: "Issue convertible debt instrument",
      icon: FileText,
      color: "text-amber-600"
    },
    {
      id: "secondary",
      name: "Secondary Transaction",
      description: "Transfer shares between stakeholders",
      icon: ArrowRightLeft,
      color: "text-teal-600"
    }
  ];

  // Combine all transactions
  const allTransactions = [
    ...(Array.isArray(shareLedger) ? shareLedger : []).map((entry: any) => ({
      id: entry.id,
      type: "Share Transaction",
      description: `${entry.quantity > 0 ? 'Issued' : 'Transferred'} ${Math.abs(entry.quantity)} shares`,
      stakeholder: stakeholderMap.get(entry.holderId) || "Unknown",
      securityClass: securityClassMap.get(entry.classId) || "Unknown",
      date: new Date(entry.issueDate),
      quantity: Math.abs(entry.quantity),
      value: entry.consideration || 0,
      status: "Completed"
    })),
    ...(Array.isArray(equityAwards) ? equityAwards : []).map((award: any) => ({
      id: award.id,
      type: "Equity Award",
      description: `Granted ${award.quantityGranted} ${award.type} options`,
      stakeholder: stakeholderMap.get(award.holderId) || "Unknown",
      securityClass: "Options",
      date: new Date(award.grantDate),
      quantity: award.quantityGranted,
      value: (award.quantityGranted * parseFloat(award.strikePrice || "0")),
      status: "Active"
    })),
    ...(Array.isArray(convertibles) ? convertibles : []).map((conv: any) => ({
      id: conv.id,
      type: conv.type === "safe" ? "SAFE Agreement" : "Convertible Note",
      description: `${conv.type === "safe" ? "SAFE" : "Note"} for $${formatNumber(conv.principal)}`,
      stakeholder: stakeholderMap.get(conv.holderId) || "Unknown",
      securityClass: conv.framework || "Convertible",
      date: new Date(conv.issueDate),
      quantity: 0,
      value: conv.principal || 0,
      status: "Outstanding"
    }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed": return "bg-green-100 text-green-800";
      case "Active": return "bg-blue-100 text-blue-800";
      case "Outstanding": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <CompanyLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-neutral-900">Transactions</h1>
          </div>

          {/* Quick Action Cards */}
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {transactionTypes.map((type) => {
              const getBgColor = (color: string) => {
                switch(color) {
                  case "text-emerald-600": return "bg-emerald-50 hover:bg-emerald-100 border-emerald-200 hover:border-emerald-300";
                  case "text-indigo-600": return "bg-indigo-50 hover:bg-indigo-100 border-indigo-200 hover:border-indigo-300";
                  case "text-violet-600": return "bg-violet-50 hover:bg-violet-100 border-violet-200 hover:border-violet-300";
                  case "text-amber-600": return "bg-amber-50 hover:bg-amber-100 border-amber-200 hover:border-amber-300";
                  case "text-teal-600": return "bg-teal-50 hover:bg-teal-100 border-teal-200 hover:border-teal-300";
                  default: return "bg-neutral-50 hover:bg-neutral-100 border-neutral-200 hover:border-neutral-300";
                }
              };
              
              return (
                <Card 
                  key={type.id} 
                  className={`hover:shadow-md transition-all duration-200 cursor-pointer border ${getBgColor(type.color)} group h-20`} 
                  onClick={() => setSelectedTransactionType(type.id)}
                  data-testid={`transaction-card-${type.id}`}
                >
                  <CardHeader className="p-2.5 h-full flex items-center justify-center">
                    <div className="flex flex-col items-center text-center gap-1">
                      <div className={`p-1.5 rounded-md bg-white/80 backdrop-blur-sm shadow-sm group-hover:shadow-md transition-shadow ${type.color}`}>
                        <type.icon className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <CardTitle className="text-xs font-medium leading-tight">{type.name}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>

          {/* Transactions Table */}
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              {allTransactions.length === 0 ? (
                <div className="text-center py-8 text-neutral-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-neutral-300" />
                  <p className="text-lg mb-2">No transactions yet</p>
                  <p className="text-sm">Create your first transaction using the options above</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-neutral-200">
                        <th className="text-left py-3 px-4 font-medium text-neutral-700">Type</th>
                        <th className="text-left py-3 px-4 font-medium text-neutral-700">Description</th>
                        <th className="text-left py-3 px-4 font-medium text-neutral-700">Stakeholder</th>
                        <th className="text-left py-3 px-4 font-medium text-neutral-700">Security Class</th>
                        <th className="text-left py-3 px-4 font-medium text-neutral-700">Date</th>
                        <th className="text-right py-3 px-4 font-medium text-neutral-700">Quantity</th>
                        <th className="text-right py-3 px-4 font-medium text-neutral-700">Value</th>
                        <th className="text-left py-3 px-4 font-medium text-neutral-700">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allTransactions.map((transaction) => (
                        <tr key={transaction.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                          <td className="py-3 px-4">
                            <Badge variant="outline">{transaction.type}</Badge>
                          </td>
                          <td className="py-3 px-4">{transaction.description}</td>
                          <td className="py-3 px-4">{transaction.stakeholder}</td>
                          <td className="py-3 px-4">{transaction.securityClass}</td>
                          <td className="py-3 px-4">{formatDate(transaction.date)}</td>
                          <td className="py-3 px-4 text-right">
                            {transaction.quantity > 0 ? formatNumber(transaction.quantity) : "-"}
                          </td>
                          <td className="py-3 px-4 text-right">
                            ${formatNumber(transaction.value)}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Badge className={getStatusColor(transaction.status)}>
                                {transaction.status}
                              </Badge>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-red-600 border-red-300 hover:bg-red-50"
                                onClick={() => handleRollback(transaction.id)}
                                data-testid={`rollback-transaction-${transaction.id}`}
                              >
                                Rollback
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      {/* Transaction Dialogs */}
      <IssueSharesDialog
        open={selectedTransactionType === "shares"}
        onOpenChange={() => setSelectedTransactionType(null)}
        companyId={companyId || ""}
      />
      
      <GrantOptionsDialog
        open={selectedTransactionType === "options"}
        onOpenChange={() => setSelectedTransactionType(null)}
        companyId={companyId || ""}
      />

      <SafeAgreementDialog
        open={selectedTransactionType === "safe"}
        onOpenChange={() => setSelectedTransactionType(null)}
        companyId={companyId || ""}
      />

      <ConvertibleNoteDialog
        open={selectedTransactionType === "convertible"}
        onOpenChange={() => setSelectedTransactionType(null)}
        companyId={companyId || ""}
      />

      <SecondaryTransactionDialog
        open={selectedTransactionType === "secondary"}
        onOpenChange={() => setSelectedTransactionType(null)}
        companyId={companyId || ""}
      />

      {ConfirmationComponent}
    </div>
  );
}