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
import { HelpBubble } from "@/components/ui/help-bubble";
import { Plus } from "lucide-react";
import type { Stakeholder } from "@shared/schema";

const convertibleNoteSchema = z.object({
  holderId: z.string().min(1, "Please select a stakeholder"),
  principal: z.string().min(1, "Principal amount is required"),
  interestRate: z.string().min(1, "Interest rate is required"),
  maturityDate: z.string().min(1, "Maturity date is required"),
  discountRate: z.string().optional(),
  valuationCap: z.string().optional(),
  issueDate: z.string().min(1, "Issue date is required"),
});

type ConvertibleNoteFormData = z.infer<typeof convertibleNoteSchema>;

interface ConvertibleNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
}

export default function ConvertibleNoteDialog({ open, onOpenChange, companyId }: ConvertibleNoteDialogProps) {
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

  const form = useForm<ConvertibleNoteFormData>({
    resolver: zodResolver(convertibleNoteSchema),
    defaultValues: {
      holderId: "",
      principal: "",
      interestRate: "",
      maturityDate: "",
      discountRate: "",
      valuationCap: "",
      issueDate: new Date().toISOString().split('T')[0],
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

  const createConvertibleNoteMutation = useMutation({
    mutationFn: async (data: ConvertibleNoteFormData) => {
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

      // Create the convertible note
      return apiRequest(`/api/companies/${companyId}/convertibles`, {
        method: "POST",
        body: {
          type: "convertible_note",
          holderId,
          principal: parseFloat(data.principal.replace(/,/g, '')),
          framework: "Standard Convertible Note",
          interestRate: parseFloat(data.interestRate.replace(/,/g, '')),
          maturityDate: data.maturityDate,
          discountRate: data.discountRate ? parseFloat(data.discountRate.replace(/,/g, '')) : null,
          valuationCap: data.valuationCap ? parseFloat(data.valuationCap.replace(/,/g, '')) : null,
          issueDate: data.issueDate,
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId] });
      toast({
        title: "Success",
        description: "Convertible note created successfully",
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
        description: error.message || "Failed to create convertible note",
        variant: "error",
      });
    }
  });

  const onSubmit = (data: ConvertibleNoteFormData) => {
    createConvertibleNoteMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Convertible Note</DialogTitle>
          <DialogDescription>
            Issue a convertible note to an investor
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

            {/* Convertible Note Details */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="principal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Principal Amount ($) *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" inputMode="numeric" placeholder="500000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="interestRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Interest Rate (%) *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" inputMode="numeric" placeholder="e.g., 8" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
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
              <FormField
                control={form.control}
                name="maturityDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maturity Date *</FormLabel>
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
                name="discountRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discount Rate (%)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" inputMode="numeric" placeholder="e.g., 20" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="valuationCap"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valuation Cap ($)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" inputMode="numeric" placeholder="Optional" {...field} />
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
                disabled={createConvertibleNoteMutation.isPending}
              >
                {createConvertibleNoteMutation.isPending ? "Creating..." : "Create Note"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}