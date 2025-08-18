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
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";
import type { Stakeholder } from "@shared/schema";

const safeAgreementSchema = z.object({
  holderId: z.string().min(1, "Please select a stakeholder"),
  principal: z.string().min(1, "Investment amount is required"),
  framework: z.string().min(1, "Framework is required"),
  valuationCap: z.string().optional(),
  discountRate: z.string().optional(),
  interestRate: z.string().optional(),
  issueDate: z.string().min(1, "Issue date is required"),
  maturityDate: z.string().optional(),
});

type SafeAgreementFormData = z.infer<typeof safeAgreementSchema>;

interface SafeAgreementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
}

export default function SafeAgreementDialog({ open, onOpenChange, companyId }: SafeAgreementDialogProps) {
  const { toast } = useToast();
  const [showNewStakeholder, setShowNewStakeholder] = useState(false);
  const [newStakeholder, setNewStakeholder] = useState({
    name: "",
    email: "",
    type: "individual" as "individual" | "entity"
  });

  const { data: stakeholders = [] } = useQuery<Stakeholder[]>({
    queryKey: ["/api/companies", companyId, "stakeholders"],
    enabled: !!companyId && open,
  });

  const form = useForm<SafeAgreementFormData>({
    resolver: zodResolver(safeAgreementSchema),
    defaultValues: {
      holderId: "",
      principal: "",
      framework: "YC pre-money SAFE",
      valuationCap: "",
      discountRate: "",
      interestRate: "",
      issueDate: new Date().toISOString().split('T')[0],
      maturityDate: "",
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

  const createSafeAgreementMutation = useMutation({
    mutationFn: async (data: SafeAgreementFormData) => {
      let holderId = data.holderId;
      
      // If it's a new stakeholder, create the stakeholder first
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

      // Create the SAFE agreement
      return apiRequest(`/api/companies/${companyId}/convertibles`, {
        method: "POST",
        body: {
          type: "SAFE",
          holderId,
          principal: parseFloat(data.principal),
          framework: data.framework,
          valuationCap: data.valuationCap ? parseFloat(data.valuationCap) : null,
          discountRate: data.discountRate ? parseFloat(data.discountRate) / 100 : null,
          interestRate: data.interestRate ? parseFloat(data.interestRate) / 100 : null,
          issueDate: new Date(data.issueDate),
          maturityDate: data.maturityDate ? new Date(data.maturityDate) : null,
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId] });
      toast({
        title: "Success",
        description: "SAFE agreement created successfully",
        variant: "success",
      });
      onOpenChange(false);
      form.reset();
      setNewStakeholder({ name: "", email: "", type: "individual" });
      setShowNewStakeholder(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create SAFE agreement",
        variant: "error",
      });
    }
  });

  const onSubmit = (data: SafeAgreementFormData) => {
    createSafeAgreementMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create SAFE Agreement</DialogTitle>
          <DialogDescription>
            Issue a Simple Agreement for Future Equity (SAFE) to an investor
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Stakeholder Selection */}
            <FormField
              control={form.control}
              name="holderId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stakeholder *</FormLabel>
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
                      {stakeholders.map((stakeholder) => (
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

            {/* SAFE Details */}
            <FormField
              control={form.control}
              name="framework"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SAFE Framework *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="YC pre-money SAFE">YC Pre-money SAFE</SelectItem>
                      <SelectItem value="YC post-money SAFE">YC Post-money SAFE</SelectItem>
                      <SelectItem value="custom">Custom SAFE</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="principal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Investment Amount ($) *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="100000" {...field} />
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="valuationCap"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valuation Cap ($)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="Optional" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="discountRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discount Rate (%)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="e.g., 20" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="interestRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Interest Rate (%)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="e.g., 2" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="maturityDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maturity Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
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
                disabled={createSafeAgreementMutation.isPending}
              >
                {createSafeAgreementMutation.isPending ? "Creating..." : "Create SAFE"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}