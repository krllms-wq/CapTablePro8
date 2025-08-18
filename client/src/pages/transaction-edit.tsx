import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Navigation from "@/components/layout/navigation";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function TransactionEdit() {
  const { companyId, transactionId } = useParams();
  const { toast } = useToast();

  const { data: transaction, isLoading } = useQuery({
    queryKey: ["/api/companies", companyId, "transactions", transactionId],
    enabled: !!companyId && !!transactionId,
  });

  const { data: stakeholders } = useQuery({
    queryKey: ["/api/companies", companyId, "stakeholders"],
    enabled: !!companyId,
  });

  const { data: securityClasses } = useQuery({
    queryKey: ["/api/companies", companyId, "security-classes"],
    enabled: !!companyId,
  });

  const [formData, setFormData] = useState({
    type: "",
    date: "",
    stakeholderId: "",
    securityClassId: "",
    quantity: "",
    pricePerShare: "",
    value: "",
    certificateNumber: "",
    notes: "",
  });

  // Update form data when transaction loads
  React.useEffect(() => {
    if (transaction) {
      setFormData({
        type: transaction.type || "",
        date: transaction.date ? new Date(transaction.date).toISOString().split('T')[0] : "",
        stakeholderId: transaction.stakeholderId || "",
        securityClassId: transaction.securityClassId || "",
        quantity: transaction.quantity?.toString() || "",
        pricePerShare: transaction.pricePerShare?.toString() || "",
        value: transaction.value?.toString() || "",
        certificateNumber: transaction.certificateNumber || "",
        notes: transaction.notes || "",
      });
    }
  }, [transaction]);

  const updateTransactionMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("PUT", `/api/companies/${companyId}/transactions/${transactionId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId, "transactions"] });
      toast({
        title: "Success",
        description: "Transaction updated successfully",
      });
      // Navigate back to transaction detail
      window.location.href = `/companies/${companyId}/transactions/${transactionId}`;
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update transaction",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const updateData = {
      ...formData,
      quantity: formData.quantity ? parseInt(formData.quantity) : null,
      pricePerShare: formData.pricePerShare ? parseFloat(formData.pricePerShare) : null,
      value: formData.value ? parseFloat(formData.value) : null,
      date: formData.date ? new Date(formData.date).toISOString() : null,
    };

    updateTransactionMutation.mutate(updateData);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-neutral-200 rounded w-1/3"></div>
              <div className="space-y-3">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-10 bg-neutral-200 rounded"></div>
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
              <h1 className="text-2xl font-semibold text-neutral-900">Edit Transaction</h1>
              <p className="text-neutral-600">Update transaction information</p>
            </div>
            <Button 
              variant="outline"
              onClick={() => window.location.href = `/companies/${companyId}/transactions/${transactionId}`}
            >
              <i className="fas fa-arrow-left mr-2"></i>
              Back to Details
            </Button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
            <div className="px-6 py-4 border-b border-neutral-200">
              <h3 className="text-lg font-semibold text-neutral-900">Transaction Information</h3>
            </div>
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="type">Transaction Type</Label>
                    <Select 
                      value={formData.type} 
                      onValueChange={(value) => setFormData({...formData, type: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select transaction type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="issuance">Share Issuance</SelectItem>
                        <SelectItem value="transfer">Share Transfer</SelectItem>
                        <SelectItem value="conversion">Conversion</SelectItem>
                        <SelectItem value="cancellation">Cancellation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="stakeholder">Stakeholder</Label>
                    <Select 
                      value={formData.stakeholderId} 
                      onValueChange={(value) => setFormData({...formData, stakeholderId: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select stakeholder" />
                      </SelectTrigger>
                      <SelectContent>
                        {stakeholders?.map((stakeholder: any) => (
                          <SelectItem key={stakeholder.id} value={stakeholder.id}>
                            {stakeholder.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="securityClass">Security Class</Label>
                    <Select 
                      value={formData.securityClassId} 
                      onValueChange={(value) => setFormData({...formData, securityClassId: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select security class" />
                      </SelectTrigger>
                      <SelectContent>
                        {securityClasses?.map((securityClass: any) => (
                          <SelectItem key={securityClass.id} value={securityClass.id}>
                            {securityClass.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                      placeholder="Number of shares"
                    />
                  </div>

                  <div>
                    <Label htmlFor="pricePerShare">Price Per Share</Label>
                    <Input
                      id="pricePerShare"
                      type="number"
                      step="0.01"
                      value={formData.pricePerShare}
                      onChange={(e) => setFormData({...formData, pricePerShare: e.target.value})}
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <Label htmlFor="value">Total Value</Label>
                    <Input
                      id="value"
                      type="number"
                      step="0.01"
                      value={formData.value}
                      onChange={(e) => setFormData({...formData, value: e.target.value})}
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <Label htmlFor="certificateNumber">Certificate Number</Label>
                    <Input
                      id="certificateNumber"
                      value={formData.certificateNumber}
                      onChange={(e) => setFormData({...formData, certificateNumber: e.target.value})}
                      placeholder="e.g., CS-001"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="notes">Notes</Label>
                    <textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      placeholder="Additional notes about this transaction"
                      rows={3}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={() => window.location.href = `/companies/${companyId}/transactions/${transactionId}`}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={updateTransactionMutation.isPending}
                  >
                    {updateTransactionMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}