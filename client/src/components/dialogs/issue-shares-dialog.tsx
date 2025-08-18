import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { HelpBubble } from "@/components/ui/help-bubble";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";
import type { Stakeholder, SecurityClass } from "@shared/schema";

const issueSharesSchema = z.object({
  holderId: z.string().min(1, "Please select a stakeholder"),
  classId: z.string().min(1, "Please select a security class"),
  quantity: z.string().min(1, "Quantity is required"),
  consideration: z.string().min(1, "Consideration is required"),
  roundName: z.string().min(1, "Round name is required"),
  issueDate: z.string().min(1, "Issue date is required"),
  valuation: z.string().min(1, "Valuation is required"),
  certificateNo: z.string().optional(),
});

type IssueSharesFormData = z.infer<typeof issueSharesSchema>;

interface IssueSharesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
}

export default function IssueSharesDialog({ open, onOpenChange, companyId }: IssueSharesDialogProps) {
  const { toast } = useToast();
  const [showNewStakeholder, setShowNewStakeholder] = useState(false);
  const [showNewSecurityClass, setShowNewSecurityClass] = useState(false);
  const [newStakeholder, setNewStakeholder] = useState({
    name: "",
    email: "",
    type: "individual" as "individual" | "entity"
  });
  const [newSecurityClass, setNewSecurityClass] = useState({
    name: "",
    liquidationPreferenceMultiple: "1.0",
    participating: false,
    votingRights: "1.0"
  });

  const { data: stakeholders } = useQuery<Stakeholder[]>({
    queryKey: ["/api/companies", companyId, "stakeholders"],
    enabled: !!companyId && open,
  });

  const { data: securityClasses } = useQuery<SecurityClass[]>({
    queryKey: ["/api/companies", companyId, "security-classes"],
    enabled: !!companyId && open,
  });

  const form = useForm<IssueSharesFormData>({
    resolver: zodResolver(issueSharesSchema),
    defaultValues: {
      holderId: "",
      classId: "",
      quantity: "",
      consideration: "",
      roundName: "",
      issueDate: new Date().toISOString().split('T')[0],
      valuation: "",
      certificateNo: "",
    },
  });

  const createStakeholderMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest(`/api/companies/${companyId}/stakeholders`, {
        method: "POST",
        body: data
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create stakeholder",
        variant: "error",
      });
    }
  });

  const createSecurityClassMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest(`/api/companies/${companyId}/security-classes`, {
        method: "POST",
        body: data
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create security class",
        variant: "error",
      });
    }
  });

  const issueSharesMutation = useMutation({
    mutationFn: async (data: IssueSharesFormData) => {
      let holderId = data.holderId;
      let classId = data.classId;
      
      // If creating new stakeholder, create it first
      if (data.holderId === "new") {
        if (!newStakeholder.name.trim()) {
          throw new Error("Stakeholder name is required");
        }
        
        const stakeholder = await createStakeholderMutation.mutateAsync({
          name: newStakeholder.name,
          email: newStakeholder.email || null,
          type: newStakeholder.type,
        });
        holderId = stakeholder.id;
      }

      // If creating new security class, create it first
      if (data.classId === "new") {
        if (!newSecurityClass.name.trim()) {
          throw new Error("Security class name is required");
        }
        
        const securityClass = await createSecurityClassMutation.mutateAsync({
          name: newSecurityClass.name,
          liquidationPreferenceMultiple: newSecurityClass.liquidationPreferenceMultiple,
          participating: newSecurityClass.participating,
          votingRights: newSecurityClass.votingRights,
          companyId: companyId,
        });
        classId = securityClass.id;
      }

      // Create share ledger entry
      return apiRequest(`/api/companies/${companyId}/share-ledger`, {
        method: "POST",
        body: {
          holderId,
          classId: classId,
          quantity: parseInt(data.quantity.replace(/,/g, '')),
          issueDate: data.issueDate,
          consideration: data.consideration.replace(/,/g, ''),
          considerationType: "cash",
          certificateNo: data.certificateNo || null,
          sourceTransactionId: `round-${Date.now()}`,
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId] });
      toast({
        title: "Success",
        description: "Shares issued successfully",
        variant: "success",
      });
      onOpenChange(false);
      form.reset();
      setNewStakeholder({ name: "", email: "", type: "individual" });
      setShowNewStakeholder(false);
      setNewSecurityClass({ name: "", liquidationPreferenceMultiple: "1.0", participating: false, votingRights: "1.0" });
      setShowNewSecurityClass(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to issue shares",
        variant: "error",
      });
    }
  });

  // Auto-calculate quantities based on valuation and consideration
  const handleCalculation = (field: string, value: string) => {
    const current = form.getValues();
    const valuation = parseFloat(current.valuation) || 0;
    const consideration = parseFloat(current.consideration) || 0;
    
    if (field === 'consideration' && valuation > 0) {
      const quantity = Math.round((parseFloat(value) / valuation) * 1000000); // Assuming 1M authorized shares
      form.setValue('quantity', quantity.toString());
    } else if (field === 'valuation' && consideration > 0) {
      const quantity = Math.round((consideration / parseFloat(value)) * 1000000);
      form.setValue('quantity', quantity.toString());
    }
  };

  const formatNumber = (value: string) => {
    const num = parseFloat(value.replace(/,/g, ''));
    return isNaN(num) ? '' : num.toLocaleString();
  };

  const onSubmit = (data: IssueSharesFormData) => {
    issueSharesMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Issue Shares</DialogTitle>
          <DialogDescription>
            Issue new shares to a stakeholder for a funding round
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Round Information */}
            <div className="space-y-4 border-b pb-4">
              <h4 className="font-medium text-sm">Round Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="roundName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Round Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Seed Round" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="issueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Issue Date *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="valuation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Valuation ($) *</FormLabel>
                    <FormControl>
                      <Input 
                        type="text" 
                        placeholder="10,000,000" 
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9.]/g, '');
                          const formatted = value ? parseFloat(value).toLocaleString() : '';
                          e.target.value = formatted;
                          field.onChange(value);
                          handleCalculation('valuation', value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Stakeholder Selection */}
            <FormField
              control={form.control}
              name="holderId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    Stakeholder *
                    <HelpBubble 
                      term="Stakeholder" 
                      definition="Any individual or entity that owns or has rights to equity in the company, including founders, employees, investors, and advisors."
                      example="John Doe (founder), Acme Ventures (investor), or Jane Smith (employee with stock options)"
                    />
                  </FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value);
                      setShowNewStakeholder(value === "new");
                    }} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select stakeholder" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="new">
                        <div className="flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          Add New Stakeholder
                        </div>
                      </SelectItem>
                      {stakeholders?.map((stakeholder) => (
                        <SelectItem key={stakeholder.id} value={stakeholder.id}>
                          {stakeholder.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* New Stakeholder Form */}
            {showNewStakeholder && (
              <div className="space-y-3 border rounded-lg p-4 bg-gray-50">
                <h4 className="font-medium text-sm">New Stakeholder Details</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Name *</Label>
                    <Input
                      value={newStakeholder.name}
                      onChange={(e) => setNewStakeholder({...newStakeholder, name: e.target.value})}
                      placeholder="Enter name"
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={newStakeholder.email}
                      onChange={(e) => setNewStakeholder({...newStakeholder, email: e.target.value})}
                      placeholder="Enter email"
                    />
                  </div>
                </div>
                <div>
                  <Label>Type</Label>
                  <Select 
                    value={newStakeholder.type} 
                    onValueChange={(value: "individual" | "entity") => 
                      setNewStakeholder({...newStakeholder, type: value})
                    }
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

            {/* Share Details */}
            {/* Security Class Selection */}
            <FormField
              control={form.control}
              name="classId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    Security Class *
                    <HelpBubble 
                      term="Security Class" 
                      definition="Different types of equity with varying rights and preferences. Common stock typically has voting rights, while preferred stock often has liquidation preferences and other protective provisions."
                      example="Common Stock for founders and employees, Series A Preferred for investors"
                    />
                  </FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value);
                      setShowNewSecurityClass(value === "new");
                    }} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select security class" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="new">
                        <div className="flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          Add New Security Class
                        </div>
                      </SelectItem>
                      {securityClasses?.map((securityClass) => (
                        <SelectItem key={securityClass.id} value={securityClass.id}>
                          {securityClass.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* New Security Class Form */}
            {showNewSecurityClass && (
              <div className="space-y-3 border rounded-lg p-4 bg-gray-50 mb-4">
                <h4 className="font-medium text-sm">New Security Class Details</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Class Name *</Label>
                    <Input
                      value={newSecurityClass.name}
                      onChange={(e) => setNewSecurityClass({...newSecurityClass, name: e.target.value})}
                      placeholder="e.g., Series A Preferred"
                    />
                  </div>
                  <div>
                    <Label>Liquidation Preference</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={newSecurityClass.liquidationPreferenceMultiple}
                      onChange={(e) => setNewSecurityClass({...newSecurityClass, liquidationPreferenceMultiple: e.target.value})}
                      placeholder="1.0"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Participating</Label>
                    <Select 
                      value={newSecurityClass.participating ? "true" : "false"} 
                      onValueChange={(value) => 
                        setNewSecurityClass({...newSecurityClass, participating: value === "true"})
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="false">Non-participating</SelectItem>
                        <SelectItem value="true">Participating</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Voting Rights</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={newSecurityClass.votingRights}
                      onChange={(e) => setNewSecurityClass({...newSecurityClass, votingRights: e.target.value})}
                      placeholder="1.0"
                    />
                  </div>
                </div>
              </div>
            )}
            
            {/* Share Quantities and Financials */}
            <div className="grid grid-cols-2 gap-4">

              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      Quantity *
                      <HelpBubble 
                        term="Share Quantity" 
                        definition="The number of shares being issued to the stakeholder. This directly affects ownership percentage and dilution of existing shareholders."
                        example="Issuing 100,000 shares out of 1,000,000 total gives the holder 10% ownership"
                      />
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="text" 
                        placeholder="100,000" 
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9]/g, '');
                          const formatted = value ? parseInt(value).toLocaleString() : '';
                          e.target.value = formatted;
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="consideration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      Consideration ($) *
                      <HelpBubble 
                        term="Consideration" 
                        definition="The value received in exchange for issuing shares, which can be cash, services, intellectual property, or other assets. This determines the price per share."
                        example="$100,000 cash payment for 10,000 shares = $10 per share consideration"
                      />
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="text" 
                        placeholder="1,000,000" 
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9.]/g, '');
                          const formatted = value ? parseFloat(value).toLocaleString() : '';
                          e.target.value = formatted;
                          field.onChange(value);
                          handleCalculation('consideration', value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="certificateNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Certificate Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Optional" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={issueSharesMutation.isPending}
              >
                {issueSharesMutation.isPending ? "Issuing..." : "Issue Shares"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}