import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatNumber, formatDate } from "@/lib/formatters";
import Navigation from "@/components/layout/navigation";
import IssueSharesDialog from "@/components/dialogs/issue-shares-dialog";
import GrantOptionsDialog from "@/components/dialogs/grant-options-dialog";
import SafeAgreementDialog from "@/components/dialogs/safe-agreement-dialog";
import ConvertibleNoteDialog from "@/components/dialogs/convertible-note-dialog";
import { SecondaryTransactionDialog } from "@/components/dialogs/secondary-transaction-dialog";
import { Plus, FileText, TrendingUp, ArrowRightLeft, DollarSign, Shield } from "lucide-react";

export default function TransactionsPage() {
  const { companyId } = useParams();
  const [selectedTransactionType, setSelectedTransactionType] = useState<string | null>(null);

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

  const stakeholderMap = new Map((stakeholders || []).map((s: any) => [s.id, s.name]));
  const securityClassMap = new Map((securityClasses || []).map((sc: any) => [sc.id, sc.name]));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-6 py-6">
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
        </div>
      </div>
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
    <div className="min-h-screen bg-neutral-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-neutral-900">Transactions</h1>
            <Select onValueChange={setSelectedTransactionType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="New Transaction" />
              </SelectTrigger>
              <SelectContent>
                {transactionTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    <div className="flex items-center gap-2">
                      <type.icon className={`h-4 w-4 ${type.color}`} />
                      {type.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Transaction Type Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {transactionTypes.map((type) => {
              const getBgColor = (color: string) => {
                switch(color) {
                  case "text-emerald-600": return "bg-emerald-50 border-emerald-200";
                  case "text-indigo-600": return "bg-indigo-50 border-indigo-200";
                  case "text-violet-600": return "bg-violet-50 border-violet-200";
                  case "text-amber-600": return "bg-amber-50 border-amber-200";
                  case "text-teal-600": return "bg-teal-50 border-teal-200";
                  default: return "bg-neutral-50 border-neutral-200";
                }
              };
              
              return (
                <Card key={type.id} className={`hover:shadow-md transition-shadow cursor-pointer border-2 ${getBgColor(type.color)}`} onClick={() => setSelectedTransactionType(type.id)}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-white/70 backdrop-blur-sm">
                        <type.icon className={`h-5 w-5 ${type.color}`} />
                      </div>
                      <div>
                        <CardTitle className="text-base">{type.name}</CardTitle>
                        <p className="text-sm text-neutral-600 mt-1">{type.description}</p>
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
                            <Badge className={getStatusColor(transaction.status)}>
                              {transaction.status}
                            </Badge>
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
    </div>
  );
}