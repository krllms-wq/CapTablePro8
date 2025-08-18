import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { FileText, Plus, Edit, Eye, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Navigation from "@/components/layout/navigation";
import IssueSharesDialog from "@/components/dialogs/issue-shares-dialog";
import GrantOptionsDialog from "@/components/dialogs/grant-options-dialog";
import type { EquityAward, ShareLedgerEntry } from "@shared/schema";
import { formatCurrency, formatDate } from "@/lib/formatters";

interface Transaction {
  id: string;
  type: "share_issuance" | "option_grant";
  stakeholderName: string;
  securityClassName: string;
  shares: number;
  pricePerShare?: number;
  totalValue: number;
  date: string;
  status: "completed" | "pending" | "cancelled";
}

export default function Transactions() {
  // Get the actual company ID from the companies list
  const { data: companies } = useQuery<{ id: string; name: string }[]>({
    queryKey: ["/api/companies"],
  });
  const companyId = companies?.[0]?.id;
  const [showIssueShares, setShowIssueShares] = useState(false);
  const [showGrantOptions, setShowGrantOptions] = useState(false);

  // Get share ledger entries (share issuances)
  const { data: shareEntries } = useQuery<ShareLedgerEntry[]>({
    queryKey: ["/api/companies", companyId, "share-ledger"],
    enabled: !!companyId,
  });

  // Get equity awards (option grants)
  const { data: equityAwards } = useQuery<EquityAward[]>({
    queryKey: ["/api/companies", companyId, "equity-awards"],
    enabled: !!companyId,
  });

  // Combine and format transactions
  const transactions: Transaction[] = [
    ...(shareEntries?.map(entry => ({
      id: entry.id,
      type: "share_issuance" as const,
      stakeholderName: entry.stakeholderId, // This would be resolved to actual name in real app
      securityClassName: entry.securityClassId, // This would be resolved to actual name in real app
      shares: entry.shares,
      pricePerShare: entry.pricePerShare,
      totalValue: entry.shares * (entry.pricePerShare || 0),
      date: entry.issuedAt || new Date().toISOString(),
      status: "completed" as const,
    })) || []),
    ...(equityAwards?.map(award => ({
      id: award.id,
      type: "option_grant" as const,
      stakeholderName: award.stakeholderId, // This would be resolved to actual name in real app
      securityClassName: award.securityClassId, // This would be resolved to actual name in real app
      shares: award.grantedShares,
      pricePerShare: award.exercisePrice,
      totalValue: award.grantedShares * (award.exercisePrice || 0),
      date: award.grantDate || new Date().toISOString(),
      status: "completed" as const,
    })) || []),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalTransactions = transactions.length;
  const totalSharesIssued = transactions
    .filter(t => t.type === "share_issuance")
    .reduce((sum, t) => sum + t.shares, 0);
  const totalOptionsGranted = transactions
    .filter(t => t.type === "option_grant")
    .reduce((sum, t) => sum + t.shares, 0);

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-3">
                <FileText className="h-8 w-8" />
                All Transactions
              </h1>
              <p className="text-neutral-600 mt-1">
                View and manage all equity transactions for your company
              </p>
            </div>
            <div className="flex space-x-3">
              <Button onClick={() => setShowIssueShares(true)} className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Issue Shares
              </Button>
              <Button onClick={() => setShowGrantOptions(true)} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Grant Options
              </Button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTransactions}</div>
              <p className="text-xs text-muted-foreground">
                All equity transactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Shares Issued</CardTitle>
              <Plus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSharesIssued.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Through share issuances
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Options Granted</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalOptionsGranted.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Through option grants
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No transactions yet</h3>
                <p className="mb-4">Start by issuing shares or granting options to stakeholders</p>
                <div className="flex justify-center gap-2">
                  <Button onClick={() => setShowIssueShares(true)} size="sm">
                    Issue Shares
                  </Button>
                  <Button onClick={() => setShowGrantOptions(true)} variant="outline" size="sm">
                    Grant Options
                  </Button>
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Stakeholder</TableHead>
                    <TableHead>Security Class</TableHead>
                    <TableHead>Shares</TableHead>
                    <TableHead>Price per Share</TableHead>
                    <TableHead>Total Value</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <Badge variant={transaction.type === "share_issuance" ? "default" : "secondary"}>
                          {transaction.type === "share_issuance" ? "Share Issuance" : "Option Grant"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {transaction.stakeholderName}
                      </TableCell>
                      <TableCell>{transaction.securityClassName}</TableCell>
                      <TableCell>{transaction.shares.toLocaleString()}</TableCell>
                      <TableCell>
                        {transaction.pricePerShare ? formatCurrency(transaction.pricePerShare) : "-"}
                      </TableCell>
                      <TableCell>{formatCurrency(transaction.totalValue)}</TableCell>
                      <TableCell>{formatDate(transaction.date)}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            transaction.status === "completed" ? "default" :
                            transaction.status === "pending" ? "secondary" : "destructive"
                          }
                        >
                          {transaction.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Transaction Dialogs */}
      <IssueSharesDialog
        open={showIssueShares}
        onOpenChange={setShowIssueShares}
        companyId={companyId}
      />

      <GrantOptionsDialog
        open={showGrantOptions}
        onOpenChange={setShowGrantOptions}
        companyId={companyId}
      />
    </div>
  );
}