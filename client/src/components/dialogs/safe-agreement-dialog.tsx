import { useState } from "react";
import { useParams } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus } from "lucide-react";

interface SafeAgreementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SafeAgreementDialog({ open, onOpenChange }: SafeAgreementDialogProps) {
  const { companyId } = useParams();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    holderId: "",
    framework: "YC pre-money SAFE",
    principal: "",
    discountRate: "",
    valuationCap: "",
    mfn: false,
    proRataRights: false,
    postMoney: false,
    issueDate: new Date().toISOString().split('T')[0]
  });

  const [showNewStakeholder, setShowNewStakeholder] = useState(false);
  const [newStakeholder, setNewStakeholder] = useState({
    name: "",
    email: "",
    type: "individual" as "individual" | "entity"
  });

  const { data: stakeholders } = useQuery({
    queryKey: ["/api/companies", companyId, "stakeholders"],
    enabled: !!companyId,
  });

  const createStakeholderMutation = useMutation({
    mutationFn: async (stakeholderData: any) => {
      return apiRequest(`/api/companies/${companyId}/stakeholders`, {
        method: "POST",
        body: stakeholderData
      });
    }
  });

  const createSafeMutation = useMutation({
    mutationFn: async (data: any) => {
      let holderId = data.holderId;
      
      // Create new stakeholder if needed
      if (data.holderId === "new") {
        const newStakeholderResult = await createStakeholderMutation.mutateAsync(newStakeholder);
        holderId = newStakeholderResult.id;
      }

      return apiRequest(`/api/companies/${companyId}/convertibles`, {
        method: "POST",
        body: {
          holderId,
          type: "safe",
          framework: data.framework,
          principal: parseFloat(data.principal) || 0,
          discountRate: parseFloat(data.discountRate) || 0,
          valuationCap: data.valuationCap ? parseFloat(data.valuationCap) : null,
          mfn: data.mfn,
          proRataRights: data.proRataRights,
          postMoney: data.postMoney,
          issueDate: new Date(data.issueDate),
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId, "convertibles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId, "stakeholders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId, "cap-table"] });
      onOpenChange(false);
      setFormData({
        holderId: "",
        framework: "YC pre-money SAFE",
        principal: "",
        discountRate: "",
        valuationCap: "",
        mfn: false,
        proRataRights: false,
        postMoney: false,
        issueDate: new Date().toISOString().split('T')[0]
      });
      setNewStakeholder({
        name: "",
        email: "",
        type: "individual"
      });
      setShowNewStakeholder(false);
      toast({
        title: "Success",
        description: "SAFE agreement created successfully",
      });
    },
    onError: (error: any) => {
      console.error("SAFE creation error:", error);
      toast({
        title: "Error",
        description: "Failed to create SAFE agreement",
        variant: "error",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.holderId || !formData.principal) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "error",
      });
      return;
    }

    if (formData.holderId === "new" && !newStakeholder.name) {
      toast({
        title: "Error",
        description: "Please enter stakeholder name",
        variant: "error",
      });
      return;
    }

    createSafeMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Issue SAFE Agreement</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="stakeholder">Stakeholder *</Label>
            <Select 
              value={formData.holderId} 
              onValueChange={(value) => {
                setFormData({...formData, holderId: value});
                setShowNewStakeholder(value === "new");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select stakeholder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add New Stakeholder
                  </div>
                </SelectItem>
                {stakeholders?.map((stakeholder: any) => (
                  <SelectItem key={stakeholder.id} value={stakeholder.id}>
                    {stakeholder.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {showNewStakeholder && (
            <div className="space-y-3 border rounded-lg p-4 bg-gray-50">
              <h4 className="font-medium text-sm">New Stakeholder Details</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="newStakeholderName">Name *</Label>
                  <Input
                    id="newStakeholderName"
                    value={newStakeholder.name}
                    onChange={(e) => setNewStakeholder({...newStakeholder, name: e.target.value})}
                    placeholder="Enter name"
                  />
                </div>
                <div>
                  <Label htmlFor="newStakeholderEmail">Email</Label>
                  <Input
                    id="newStakeholderEmail"
                    type="email"
                    value={newStakeholder.email}
                    onChange={(e) => setNewStakeholder({...newStakeholder, email: e.target.value})}
                    placeholder="Enter email"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="newStakeholderType">Type</Label>
                <Select 
                  value={newStakeholder.type} 
                  onValueChange={(value: "individual" | "entity") => setNewStakeholder({...newStakeholder, type: value})}
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
            <Label htmlFor="framework">SAFE Framework</Label>
            <Select 
              value={formData.framework} 
              onValueChange={(value) => setFormData({...formData, framework: value})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="YC pre-money SAFE">YC Pre-money SAFE</SelectItem>
                <SelectItem value="YC post-money SAFE">YC Post-money SAFE</SelectItem>
                <SelectItem value="custom">Custom SAFE</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="principal">Investment Amount ($) *</Label>
              <Input
                id="principal"
                type="number"
                step="0.01"
                value={formData.principal}
                onChange={(e) => setFormData({...formData, principal: e.target.value})}
                placeholder="25000.00"
              />
            </div>
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
          </div>

          <div>
            <Label htmlFor="valuationCap">Valuation Cap ($)</Label>
            <Input
              id="valuationCap"
              type="number"
              step="0.01"
              value={formData.valuationCap}
              onChange={(e) => setFormData({...formData, valuationCap: e.target.value})}
              placeholder="10000000.00"
            />
          </div>

          <div>
            <Label htmlFor="issueDate">Issue Date</Label>
            <Input
              id="issueDate"
              type="date"
              value={formData.issueDate}
              onChange={(e) => setFormData({...formData, issueDate: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="mfn"
                checked={formData.mfn}
                onChange={(e) => setFormData({...formData, mfn: e.target.checked})}
                className="rounded"
              />
              <Label htmlFor="mfn">Most Favored Nation (MFN)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="proRataRights"
                checked={formData.proRataRights}
                onChange={(e) => setFormData({...formData, proRataRights: e.target.checked})}
                className="rounded"
              />
              <Label htmlFor="proRataRights">Pro Rata Rights</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="postMoney"
                checked={formData.postMoney}
                onChange={(e) => setFormData({...formData, postMoney: e.target.checked})}
                className="rounded"
              />
              <Label htmlFor="postMoney">Post-money SAFE</Label>
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
              disabled={createSafeMutation.isPending}
            >
              {createSafeMutation.isPending ? "Creating..." : "Create SAFE"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}