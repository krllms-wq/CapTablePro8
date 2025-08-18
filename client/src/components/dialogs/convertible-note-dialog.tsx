import { useState } from "react";
import { useParams } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface ConvertibleNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConvertibleNoteDialog({ open, onOpenChange }: ConvertibleNoteDialogProps) {
  const { companyId } = useParams();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    holderId: "",
    principal: "",
    interestRate: "",
    maturityDate: "",
    discountRate: "",
    valuationCap: "",
    compounding: "simple",
    issueDate: new Date().toISOString().split('T')[0]
  });

  const { data: stakeholders } = useQuery({
    queryKey: ["/api/companies", companyId, "stakeholders"],
    enabled: !!companyId,
  });

  const createNoteMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest(`/api/companies/${companyId}/convertibles`, {
        method: "POST",
        body: {
          ...data,
          type: "note",
          principal: parseFloat(data.principal) || 0,
          interestRate: parseFloat(data.interestRate) || 0,
          discountRate: parseFloat(data.discountRate) || 0,
          valuationCap: parseFloat(data.valuationCap) || null,
          issueDate: new Date(data.issueDate),
          maturityDate: data.maturityDate ? new Date(data.maturityDate) : null,
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId, "convertibles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId, "cap-table"] });
      onOpenChange(false);
      setFormData({
        holderId: "",
        principal: "",
        interestRate: "",
        maturityDate: "",
        discountRate: "",
        valuationCap: "",
        compounding: "simple",
        issueDate: new Date().toISOString().split('T')[0]
      });
      toast({
        title: "Success",
        description: "Convertible note created successfully",
      });
    },
    onError: (error: any) => {
      console.error("Note creation error:", error);
      toast({
        title: "Error",
        description: "Failed to create convertible note",
        variant: "error",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.holderId || !formData.principal || !formData.interestRate) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "error",
      });
      return;
    }
    createNoteMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Issue Convertible Note</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="stakeholder">Stakeholder *</Label>
            <Select 
              value={formData.holderId} 
              onValueChange={(value) => setFormData({...formData, holderId: value})}
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="principal">Principal Amount ($) *</Label>
              <Input
                id="principal"
                type="number"
                step="0.01"
                value={formData.principal}
                onChange={(e) => setFormData({...formData, principal: e.target.value})}
                placeholder="100000.00"
              />
            </div>
            <div>
              <Label htmlFor="interestRate">Interest Rate (%) *</Label>
              <Input
                id="interestRate"
                type="number"
                step="0.1"
                value={formData.interestRate}
                onChange={(e) => setFormData({...formData, interestRate: e.target.value})}
                placeholder="8.0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="discountRate">Discount Rate (%)</Label>
              <Input
                id="discountRate"
                type="number"
                step="0.1"
                value={formData.discountRate}
                onChange={(e) => setFormData({...formData, discountRate: e.target.value})}
                placeholder="20.0"
              />
            </div>
            <div>
              <Label htmlFor="valuationCap">Valuation Cap ($)</Label>
              <Input
                id="valuationCap"
                type="number"
                step="0.01"
                value={formData.valuationCap}
                onChange={(e) => setFormData({...formData, valuationCap: e.target.value})}
                placeholder="5000000.00"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="compounding">Interest Compounding</Label>
            <Select 
              value={formData.compounding} 
              onValueChange={(value) => setFormData({...formData, compounding: value})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="simple">Simple Interest</SelectItem>
                <SelectItem value="compounded">Compound Interest</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="issueDate">Issue Date</Label>
              <Input
                id="issueDate"
                type="date"
                value={formData.issueDate}
                onChange={(e) => setFormData({...formData, issueDate: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="maturityDate">Maturity Date</Label>
              <Input
                id="maturityDate"
                type="date"
                value={formData.maturityDate}
                onChange={(e) => setFormData({...formData, maturityDate: e.target.value})}
              />
            </div>
          </div>

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
              disabled={createNoteMutation.isPending}
            >
              {createNoteMutation.isPending ? "Creating..." : "Create Note"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}