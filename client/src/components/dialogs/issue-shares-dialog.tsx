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
import type { Stakeholder, SecurityClass } from "@shared/schema";

const issueSharesSchema = z.object({
  holderId: z.string().min(1, "Please select a stakeholder"),
  classId: z.string().min(1, "Please select a security class"),
  quantity: z.string().min(1, "Quantity is required"),
  consideration: z.string().min(0, "Consideration must be positive"),
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
  const [newStakeholder, setNewStakeholder] = useState({
    name: "",
    email: "",
    type: "individual" as "individual" | "entity"
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

  const issueSharesMutation = useMutation({
    mutationFn: async (data: IssueSharesFormData) => {
      let holderId = data.holderId;
      
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

      // Create share ledger entry
      return apiRequest(`/api/companies/${companyId}/share-ledger`, {
        method: "POST",
        body: {
          holderId,
          classId: data.classId,
          quantity: parseInt(data.quantity),
          issueDate: new Date(data.issueDate),
          consideration: parseFloat(data.consideration),
          considerationType: "cash",
          certificateNo: data.certificateNo || null,
          sourceTransactionId: `round-${Date.now()}`,
          notes: `${data.roundName} - Valuation: $${data.valuation}`
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
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to issue shares",
        variant: "error",
      });
    }
  });

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
                      <Input type="number" placeholder="e.g., 10000000" {...field} />
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
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="classId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Security Class *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select class" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {securityClasses?.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity *</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="100000" {...field} />
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
                    <FormLabel>Consideration ($) *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="1000000" {...field} />
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