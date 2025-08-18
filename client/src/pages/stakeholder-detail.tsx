import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, User, Building, Calendar, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate, formatShares, formatPercentage } from "@/lib/formatters";
import type { Stakeholder, ShareLedgerEntry, EquityAward, SecurityClass } from "@shared/schema";

interface Transaction {
  id: string;
  date: string;
  type: "share_issuance" | "equity_award" | "exercise" | "transfer";
  description: string;
  shares?: number;
  consideration?: string;
  securityClass?: string;
}

export default function StakeholderDetail() {
  const { companyId, stakeholderId } = useParams();

  const { data: stakeholder } = useQuery<Stakeholder>({
    queryKey: ["/api/companies", companyId, "stakeholders", stakeholderId],
    enabled: !!companyId && !!stakeholderId,
  });

  const { data: shareLedger } = useQuery<ShareLedgerEntry[]>({
    queryKey: ["/api/companies", companyId, "share-ledger"],
    enabled: !!companyId,
  });

  const { data: equityAwards } = useQuery<EquityAward[]>({
    queryKey: ["/api/companies", companyId, "equity-awards"],
    enabled: !!companyId,
  });

  const { data: securityClasses } = useQuery<SecurityClass[]>({
    queryKey: ["/api/companies", companyId, "security-classes"],
    enabled: !!companyId,
  });

  if (!stakeholder) {
    return (
      <div className="p-6">
        <div className="text-center">Loading stakeholder details...</div>
      </div>
    );
  }

  // Filter transactions for this stakeholder
  const stakeholderShares = shareLedger?.filter(entry => entry.holderId === stakeholderId) || [];
  const stakeholderEquity = equityAwards?.filter(award => award.holderId === stakeholderId) || [];

  // Build transaction history
  const transactions: Transaction[] = [
    ...stakeholderShares.map(entry => {
      const securityClass = securityClasses?.find(sc => sc.id === entry.classId);
      return {
        id: entry.id,
        date: entry.issueDate.toString(),
        type: "share_issuance" as const,
        description: `Issued ${formatShares(entry.quantity)} ${securityClass?.name || 'shares'}`,
        shares: entry.quantity,
        consideration: entry.consideration || undefined,
        securityClass: securityClass?.name,
      };
    }),
    ...stakeholderEquity.map(award => ({
      id: award.id,
      date: award.grantDate.toString(),
      type: "equity_award" as const,
      description: `Granted ${formatShares(award.quantityGranted)} ${award.type} options`,
      shares: award.quantityGranted,
      consideration: award.strikePrice || undefined,
      securityClass: "Options",
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Calculate totals
  const totalShares = stakeholderShares.reduce((sum, entry) => sum + entry.quantity, 0);
  const totalOptions = stakeholderEquity.reduce((sum, award) => sum + award.quantityGranted, 0);
  const totalConsideration = stakeholderShares.reduce((sum, entry) => {
    const consideration = entry.consideration ? parseFloat(entry.consideration) : 0;
    return sum + consideration;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/companies/${companyId}/stakeholders`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Stakeholders
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-muted rounded-lg">
            {stakeholder.type === "person" ? (
              <User className="h-6 w-6" />
            ) : (
              <Building className="h-6 w-6" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{stakeholder.name}</h1>
            <p className="text-muted-foreground">
              {stakeholder.title && `${stakeholder.title} • `}
              <Badge variant="secondary">
                {stakeholder.type === "person" ? "Individual" : "Entity"}
              </Badge>
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Shares</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatShares(totalShares)}</div>
            <p className="text-xs text-muted-foreground">
              Across {stakeholderShares.length} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Option Awards</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatShares(totalOptions)}</div>
            <p className="text-xs text-muted-foreground">
              Across {stakeholderEquity.length} grants
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Investment</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalConsideration)}</div>
            <p className="text-xs text-muted-foreground">
              Cash and non-cash consideration
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Contact Information */}
      {(stakeholder.email || stakeholder.address) && (
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stakeholder.email && (
              <div>
                <span className="text-sm font-medium">Email:</span>{" "}
                <span className="text-sm text-muted-foreground">{stakeholder.email}</span>
              </div>
            )}
            {stakeholder.address && (
              <div>
                <span className="text-sm font-medium">Address:</span>{" "}
                <span className="text-sm text-muted-foreground">{stakeholder.address}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            Complete history of all share issuances, option grants, and other equity transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No transactions found for this stakeholder
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Security Class</TableHead>
                  <TableHead className="text-right">Shares/Options</TableHead>
                  <TableHead className="text-right">Consideration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-mono text-sm">
                      {formatDate(transaction.date)}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={transaction.type === "share_issuance" ? "default" : "secondary"}
                      >
                        {transaction.type === "share_issuance" ? "Share Issuance" : "Option Grant"}
                      </Badge>
                    </TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell>{transaction.securityClass}</TableCell>
                    <TableCell className="text-right font-mono">
                      {transaction.shares ? formatShares(transaction.shares) : "-"}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {transaction.consideration ? formatCurrency(parseFloat(transaction.consideration)) : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}