import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { formatNumber, formatCurrency } from "@/lib/formatters";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useUrlFilters, useUrlSort, useUrlPagination } from "@/hooks/useUrlState";
import { useHistoryState } from "@/hooks/useHistoryState";
import { useAutosave } from "@/hooks/useAutosave";
import { CsvImportDialog } from "@/components/csv/csv-import-dialog";
import { EnhancedInput } from "@/components/ui/enhanced-input";
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from "@/components/ui/breadcrumb";
import Navigation from "@/components/layout/navigation";
import { 
  Upload, Undo2, Redo2, Save, Filter, SortAsc, SortDesc, Plus, 
  Edit, Trash2, Eye, Calendar, TrendingUp, FileText, Search,
  ChevronLeft, ChevronRight
} from "lucide-react";

export default function EnhancedTransactions() {
  const { companyId } = useParams();
  const { toast } = useToast();
  
  // Enhanced state management with history and autosave
  const {
    value: transactionState,
    setValue: setTransactionState,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useHistoryState({
    selectedTransactions: [],
    bulkActionType: null,
  });

  const [filters, setFilters] = useUrlFilters({
    search: "",
    type: "all",
    dateRange: "all",
    status: "all",
  });

  const [sort, setSort] = useUrlSort({
    field: "date",
    direction: "desc" as const,
  });

  const [page, setPage] = useUrlPagination(1);
  const [showCsvImport, setShowCsvImport] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [showTransactionDialog, setShowTransactionDialog] = useState(false);

  // Autosave functionality
  const { saveStatus, statusDisplay } = useAutosave({
    key: "transactions-draft",
    data: { filters, sort, selectedTransactions: transactionState.selectedTransactions },
    interval: 3000,
    onSave: async (data) => {
      console.log("Auto-saving transaction preferences:", data);
    },
  });

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["/api/companies", companyId, "transactions", { filters, sort, page }],
    enabled: !!companyId,
  });

  const { data: company } = useQuery({
    queryKey: ["/api/companies", companyId],
    enabled: !!companyId,
  });

  const deleteTransactionMutation = useMutation({
    mutationFn: async (transactionId: string) => {
      return apiRequest(`/api/companies/${companyId}/transactions/${transactionId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId, "transactions"] });
      toast({
        title: "Transaction deleted",
        description: "Transaction removed successfully",
        variant: "success",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete transaction",
        variant: "error",
      });
    },
  });

  const handleDeleteTransaction = (transactionId: string) => {
    if (confirm("Are you sure you want to delete this transaction? This action cannot be undone.")) {
      deleteTransactionMutation.mutate(transactionId);
    }
  };

  const handleCsvImport = (data: any[]) => {
    console.log("Importing transaction data:", data);
    toast({
      title: "Import successful",
      description: `${data.length} transactions imported`,
      variant: "success",
    });
  };

  const handleViewTransaction = (transaction: any) => {
    setSelectedTransaction(transaction);
    setShowTransactionDialog(true);
  };

  const transactionData = Array.isArray(transactions) ? transactions : [];
  const totalPages = Math.ceil(transactionData.length / 10);

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'share_issuance':
        return <TrendingUp className="h-4 w-4" />;
      case 'option_grant':
        return <FileText className="h-4 w-4" />;
      case 'transfer':
        return <Calendar className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <Navigation />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-12 h-12 bg-primary/20 rounded-xl mx-auto mb-4 animate-pulse"></div>
            <p className="text-gray-600">Loading transactions...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Enhanced Breadcrumb Navigation */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/companies">Companies</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/companies/${companyId}`}>
                {company?.name || "Dashboard"}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbPage>Transactions</BreadcrumbPage>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="bg-white rounded-lg shadow-sm border">
          {/* Enhanced Header with Controls */}
          <div className="px-6 py-4 border-b border-neutral-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-neutral-900">Transaction History</h1>
                <p className="text-neutral-600 mt-1">
                  Track all equity transactions and ownership changes
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Autosave Status */}
                {statusDisplay && (
                  <Badge variant="outline" className="text-xs">
                    <Save className="h-3 w-3 mr-1" />
                    {statusDisplay}
                  </Badge>
                )}

                {/* History Controls */}
                <div className="flex items-center gap-1 border rounded-md">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={undo}
                    disabled={!canUndo}
                    title="Undo (Ctrl+Z)"
                  >
                    <Undo2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={redo}
                    disabled={!canRedo}
                    title="Redo (Ctrl+Shift+Z)"
                  >
                    <Redo2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* CSV Import */}
                <Button
                  variant="outline"
                  onClick={() => setShowCsvImport(true)}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import CSV
                </Button>

                {/* Add Transaction */}
                <Button asChild>
                  <Link href={`/companies/${companyId}/transactions/new`}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Transaction
                  </Link>
                </Button>
              </div>
            </div>

            {/* Enhanced Search and Filters */}
            <div className="flex items-center gap-4 mt-4">
              <div className="flex-1">
                <EnhancedInput
                  placeholder="Search transactions..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  inputMode="search"
                  autoComplete="off"
                />
              </div>

              <Select value={filters.type} onValueChange={(value) => setFilters({ ...filters, type: value })}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Transaction type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="share_issuance">Share Issuance</SelectItem>
                  <SelectItem value="option_grant">Option Grant</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                  <SelectItem value="conversion">Conversion</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => setSort({ 
                  ...sort, 
                  direction: sort.direction === "asc" ? "desc" : "asc" 
                })}
              >
                {sort.direction === "asc" ? (
                  <SortAsc className="h-4 w-4 mr-2" />
                ) : (
                  <SortDesc className="h-4 w-4 mr-2" />
                )}
                Sort by Date
              </Button>
            </div>
          </div>

          {/* Enhanced Transaction List */}
          <div className="divide-y divide-neutral-200">
            {transactionData.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">No transactions found</h3>
                <p className="text-neutral-600 mb-4">
                  {filters.search || filters.type !== "all" || filters.status !== "all"
                    ? "Try adjusting your filters to see more results."
                    : "Get started by creating your first transaction."}
                </p>
                <Button asChild>
                  <Link href={`/companies/${companyId}/transactions/new`}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Transaction
                  </Link>
                </Button>
              </div>
            ) : (
              transactionData.map((transaction: any) => (
                <div key={transaction.id} className="px-6 py-4 hover:bg-neutral-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        {getTransactionIcon(transaction.type)}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium text-neutral-900">
                            {transaction.description || `${transaction.type.replace('_', ' ').toUpperCase()}`}
                          </h3>
                          <Badge variant={getStatusColor(transaction.status)}>
                            {transaction.status}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 mt-1 text-sm text-neutral-600">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(transaction.date).toLocaleDateString()}
                          </span>
                          <span>{transaction.stakeholder?.name}</span>
                          <span className="font-mono">
                            {formatNumber(transaction.quantity)} shares
                          </span>
                          {transaction.pricePerShare && (
                            <span className="font-mono">
                              @ {formatCurrency(transaction.pricePerShare)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewTransaction(transaction)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                      >
                        <Link href={`/companies/${companyId}/transactions/${transaction.id}/edit`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTransaction(transaction.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Enhanced Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-neutral-200">
              <div className="flex items-center justify-between">
                <p className="text-sm text-neutral-600">
                  Showing {(page - 1) * 10 + 1} to {Math.min(page * 10, transactionData.length)} of {transactionData.length} transactions
                </p>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                      <Button
                        key={pageNum}
                        variant={pageNum === page ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setPage(pageNum)}
                        className="min-w-8"
                      >
                        {pageNum}
                      </Button>
                    ))}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Transaction Detail Dialog */}
      <Dialog open={showTransactionDialog} onOpenChange={setShowTransactionDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedTransaction && getTransactionIcon(selectedTransaction.type)}
              Transaction Details
            </DialogTitle>
            <DialogDescription>
              Complete information about this transaction
            </DialogDescription>
          </DialogHeader>
          
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Type</Label>
                  <p className="text-sm text-neutral-600 capitalize">
                    {selectedTransaction.type.replace('_', ' ')}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge variant={getStatusColor(selectedTransaction.status)} className="mt-1">
                    {selectedTransaction.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Date</Label>
                  <p className="text-sm text-neutral-600">
                    {new Date(selectedTransaction.date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Stakeholder</Label>
                  <p className="text-sm text-neutral-600">
                    {selectedTransaction.stakeholder?.name}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Quantity</Label>
                  <p className="text-sm text-neutral-600 font-mono">
                    {formatNumber(selectedTransaction.quantity)} shares
                  </p>
                </div>
                {selectedTransaction.pricePerShare && (
                  <div>
                    <Label className="text-sm font-medium">Price per Share</Label>
                    <p className="text-sm text-neutral-600 font-mono">
                      {formatCurrency(selectedTransaction.pricePerShare)}
                    </p>
                  </div>
                )}
              </div>
              
              {selectedTransaction.description && (
                <div>
                  <Label className="text-sm font-medium">Description</Label>
                  <p className="text-sm text-neutral-600">
                    {selectedTransaction.description}
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTransactionDialog(false)}>
              Close
            </Button>
            {selectedTransaction && (
              <Button asChild>
                <Link href={`/companies/${companyId}/transactions/${selectedTransaction.id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Transaction
                </Link>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CSV Import Dialog */}
      <CsvImportDialog
        open={showCsvImport}
        onOpenChange={setShowCsvImport}
        onImport={handleCsvImport}
        title="Import Transactions"
        description="Import transaction data from CSV file"
      />
    </div>
  );
}