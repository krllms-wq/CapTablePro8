import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, RotateCcw, AlertTriangle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, formatNumber } from '@/utils/formatting';
import { format } from 'date-fns';

interface Transaction {
  id: string;
  type: string;
  description: string;
  stakeholderName: string;
  securityClassName: string;
  date: string;
  quantity: number;
  value: number;
  status: string;
  canRollback?: boolean;
}

interface TransactionHistoryProps {
  companyId: string;
  onBack: () => void;
}

export function TransactionHistory({ companyId, onBack }: TransactionHistoryProps) {
  const [rollbackReason, setRollbackReason] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch transaction history (share ledger entries)
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['/api/companies', companyId, 'share-ledger'],
    queryFn: async () => {
      const response = await apiRequest(`/api/companies/${companyId}/share-ledger`);
      
      // Enrich with stakeholder and security class names
      const [stakeholders, securityClasses] = await Promise.all([
        apiRequest(`/api/companies/${companyId}/stakeholders`),
        apiRequest(`/api/companies/${companyId}/security-classes`)
      ]);

      return response.map((entry: any) => {
        const stakeholder = stakeholders.find((s: any) => s.id === entry.holderId);
        const securityClass = securityClasses.find((sc: any) => sc.id === entry.classId);
        
        return {
          id: entry.id,
          type: 'Share Transaction',
          description: `Issued ${formatNumber(entry.quantity)} shares`,
          stakeholderName: stakeholder?.name || 'Unknown',
          securityClassName: securityClass?.name || 'Unknown',
          date: entry.issueDate,
          quantity: entry.quantity,
          value: entry.consideration || 0,
          status: 'Completed',
          canRollback: true
        };
      });
    }
  });

  const rollbackMutation = useMutation({
    mutationFn: async ({ transactionId, reason }: { transactionId: string; reason: string }) => {
      return apiRequest(`/api/companies/${companyId}/transactions/${transactionId}/rollback`, {
        method: 'POST',
        body: JSON.stringify({ reason })
      });
    },
    onSuccess: () => {
      toast({
        title: "Transaction Rolled Back",
        description: "The transaction has been successfully rolled back."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/companies', companyId] });
      setSelectedTransaction(null);
      setRollbackReason('');
    },
    onError: (error: any) => {
      toast({
        title: "Rollback Failed",
        description: error.message || "Failed to rollback transaction",
        variant: "destructive"
      });
    }
  });

  const handleRollback = () => {
    if (!selectedTransaction) return;
    
    rollbackMutation.mutate({
      transactionId: selectedTransaction.id,
      reason: rollbackReason
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading transaction history...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Transaction History</h2>
          <p className="text-muted-foreground">
            Review and manage all company transactions
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
          <CardDescription>
            Complete history of share issuances, conversions, and other equity transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No transactions found
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Stakeholder</TableHead>
                  <TableHead>Security Class</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">{transaction.type}</TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell>{transaction.stakeholderName}</TableCell>
                    <TableCell>{transaction.securityClassName}</TableCell>
                    <TableCell>
                      {transaction.date ? format(new Date(transaction.date), 'MMM d, yyyy') : 'Unknown'}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(transaction.quantity)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(transaction.value)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={transaction.status === 'Completed' ? 'default' : 'secondary'}>
                        {transaction.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {transaction.canRollback && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2"
                              onClick={() => setSelectedTransaction(transaction)}
                              data-testid={`rollback-${transaction.id}`}
                            >
                              <RotateCcw className="h-3 w-3" />
                              Rollback
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-destructive" />
                                Rollback Transaction
                              </DialogTitle>
                              <DialogDescription>
                                This will permanently reverse this transaction. The shares will be removed 
                                and any associated conversions will be undone. This action cannot be reversed.
                              </DialogDescription>
                            </DialogHeader>
                            
                            <div className="space-y-4">
                              <div className="p-4 bg-muted rounded-lg">
                                <h4 className="font-medium">Transaction Details</h4>
                                <p className="text-sm text-muted-foreground">
                                  {transaction.description} to {transaction.stakeholderName}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {formatNumber(transaction.quantity)} shares for {formatCurrency(transaction.value)}
                                </p>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="rollback-reason">Reason for Rollback</Label>
                                <Textarea
                                  id="rollback-reason"
                                  value={rollbackReason}
                                  onChange={(e) => setRollbackReason(e.target.value)}
                                  placeholder="Explain why this transaction is being rolled back..."
                                  data-testid="rollback-reason-input"
                                />
                              </div>
                            </div>

                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => setSelectedTransaction(null)}
                              >
                                Cancel
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={handleRollback}
                                disabled={rollbackMutation.isPending || !rollbackReason.trim()}
                                data-testid="confirm-rollback"
                              >
                                {rollbackMutation.isPending ? 'Rolling back...' : 'Rollback Transaction'}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
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