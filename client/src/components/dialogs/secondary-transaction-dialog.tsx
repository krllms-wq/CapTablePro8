import { useState } from "react";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface SecondaryTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
}

export function SecondaryTransactionDialog({ open, onOpenChange, companyId }: SecondaryTransactionDialogProps) {
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    sellerId: "",
    buyerId: "",
    buyerType: "existing", // existing or new
    newBuyerName: "",
    newBuyerEmail: "",
    newBuyerType: "individual",
    classId: "",
    quantity: "",
    pricePerShare: "",
    transactionDate: new Date().toISOString().split('T')[0]
  });

  const { data: stakeholders } = useQuery({
    queryKey: ["/api/companies", companyId, "stakeholders"],
    enabled: !!companyId,
  });

  const { data: securityClasses } = useQuery({
    queryKey: ["/api/companies", companyId, "security-classes"],
    enabled: !!companyId,
  });

  const createSecondaryTransactionMutation = useMutation({
    mutationFn: async (data: any) => {
      let buyerId = data.buyerId;
      
      // If it's a new buyer, create the stakeholder first
      if (data.buyerType === "new") {
        const newStakeholder = await apiRequest(`/api/companies/${companyId}/stakeholders`, {
          method: "POST",
          body: {
            name: data.newBuyerName,
            email: data.newBuyerEmail || null,
            type: data.newBuyerType,
          }
        });
        buyerId = newStakeholder.id;
      }

      // Use new atomic secondary transfer endpoint
      const result = await apiRequest(`/api/companies/${companyId}/secondary-transfer`, {
        method: "POST",
        body: {
          sellerId: data.sellerId,
          buyerId,
          classId: data.classId,
          quantity: data.quantity, // Server will sanitize formatted numbers
          pricePerShare: data.pricePerShare, // Server will sanitize formatted numbers
          transactionDate: data.transactionDate
        }
      });

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId, "stakeholders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId, "share-ledger"] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId, "cap-table"] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId, "transactions"] });
      onOpenChange(false);
      setFormData({
        sellerId: "",
        buyerId: "",
        buyerType: "existing",
        newBuyerName: "",
        newBuyerEmail: "",
        newBuyerType: "individual",
        classId: "",
        quantity: "",
        pricePerShare: "",
        transactionDate: new Date().toISOString().split('T')[0]
      });
      toast({
        title: "Success",
        description: "Secondary transaction recorded successfully",
      });
    },
    onError: (error: any) => {
      console.error("Secondary transaction error:", error);
      let errorMessage = "Failed to record secondary transaction";
      
      if (error?.code === "INSUFFICIENT_SHARES") {
        errorMessage = `Insufficient shares for transfer. Available: ${error.details?.available || 0}, Requested: ${error.details?.requested || 0}`;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "error",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.sellerId || !formData.classId || !formData.quantity || !formData.pricePerShare) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "error",
      });
      return;
    }

    if (formData.buyerType === "existing" && !formData.buyerId) {
      toast({
        title: "Error",
        description: "Please select a buyer",
        variant: "error",
      });
      return;
    }

    if (formData.buyerType === "new" && !formData.newBuyerName) {
      toast({
        title: "Error",
        description: "Please enter buyer name",
        variant: "error",
      });
      return;
    }

    createSecondaryTransactionMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Record Secondary Transaction</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="seller">Seller *</Label>
            <Select 
              value={formData.sellerId} 
              onValueChange={(value) => setFormData({...formData, sellerId: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select seller" />
              </SelectTrigger>
              <SelectContent>
                {stakeholders && Array.isArray(stakeholders) && stakeholders.map((stakeholder: any) => (
                  <SelectItem key={stakeholder.id} value={stakeholder.id}>
                    {stakeholder.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Buyer Type</Label>
            <Select 
              value={formData.buyerType} 
              onValueChange={(value) => setFormData({...formData, buyerType: value, buyerId: "", newBuyerName: "", newBuyerEmail: ""})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="existing">Existing Stakeholder</SelectItem>
                <SelectItem value="new">New Stakeholder</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.buyerType === "existing" ? (
            <div>
              <Label htmlFor="buyer">Buyer *</Label>
              <Select 
                value={formData.buyerId} 
                onValueChange={(value) => setFormData({...formData, buyerId: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select buyer" />
                </SelectTrigger>
                <SelectContent>
                  {stakeholders && Array.isArray(stakeholders) && stakeholders.filter((s: any) => s.id !== formData.sellerId).map((stakeholder: any) => (
                    <SelectItem key={stakeholder.id} value={stakeholder.id}>
                      {stakeholder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="newBuyerName">Buyer Name *</Label>
                  <Input
                    id="newBuyerName"
                    value={formData.newBuyerName}
                    onChange={(e) => setFormData({...formData, newBuyerName: e.target.value})}
                    placeholder="Enter buyer name"
                  />
                </div>
                <div>
                  <Label htmlFor="newBuyerEmail">Buyer Email</Label>
                  <Input
                    id="newBuyerEmail"
                    type="email"
                    value={formData.newBuyerEmail}
                    onChange={(e) => setFormData({...formData, newBuyerEmail: e.target.value})}
                    placeholder="Enter buyer email"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="newBuyerType">Buyer Type</Label>
                <Select 
                  value={formData.newBuyerType} 
                  onValueChange={(value) => setFormData({...formData, newBuyerType: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="entity">Entity</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="securityClass">Security Class *</Label>
            <Select 
              value={formData.classId} 
              onValueChange={(value) => setFormData({...formData, classId: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select security class" />
              </SelectTrigger>
              <SelectContent>
                {securityClasses && Array.isArray(securityClasses) && securityClasses.map((secClass: any) => (
                  <SelectItem key={secClass.id} value={secClass.id}>
                    {secClass.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quantity">Number of Shares *</Label>
              <Input
                id="quantity"
                type="text"
                value={formData.quantity}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  const formatted = value ? parseInt(value).toLocaleString() : '';
                  e.target.value = formatted;
                  setFormData({...formData, quantity: value});
                }}
                placeholder="1,000"
              />
            </div>
            <div>
              <Label htmlFor="pricePerShare">Price per Share ($) *</Label>
              <Input
                id="pricePerShare"
                type="text"
                value={formData.pricePerShare}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9.]/g, '');
                  const formatted = value ? parseFloat(value).toLocaleString() : '';
                  e.target.value = formatted;
                  setFormData({...formData, pricePerShare: value});
                }}
                placeholder="4.47"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="transactionDate">Transaction Date</Label>
            <Input
              id="transactionDate"
              type="date"
              value={formData.transactionDate}
              onChange={(e) => setFormData({...formData, transactionDate: e.target.value})}
            />
          </div>

          {formData.quantity && formData.pricePerShare && (
            <div className="bg-gray-50 p-3 rounded-md">
              <div className="text-sm text-gray-600">Transaction Summary</div>
              <div className="font-medium">
                Total Value: ${(parseFloat(formData.quantity || "0") * parseFloat(formData.pricePerShare || "0")).toLocaleString()}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={createSecondaryTransactionMutation.isPending}
            >
              {createSecondaryTransactionMutation.isPending ? "Recording..." : "Record Transaction"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}