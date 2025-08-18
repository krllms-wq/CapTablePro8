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
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Stakeholder, SecurityClass } from "@shared/schema";

const issueSharesSchema = z.object({
  holderId: z.string().min(1, "Please select a stakeholder"),
  classId: z.string().min(1, "Please select a security class"),
  quantity: z.string().min(1, "Quantity is required").transform(val => parseInt(val)),
  consideration: z.string().min(0, "Consideration must be positive").transform(val => parseFloat(val)),
  certificateNo: z.string().optional(),
});

const newStakeholderSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["individual", "entity"]),
  email: z.string().email().optional(),
  title: z.string().optional(),
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
  const [newStakeholderName, setNewStakeholderName] = useState("");
  const [newStakeholderType, setNewStakeholderType] = useState<"individual" | "entity">("individual");

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
      certificateNo: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: IssueSharesFormData) => {
      const payload = {
        ...data,
        issueDate: new Date().toISOString(),
        considerationType: "cash",
      };
      return apiRequest("POST", `/api/companies/${companyId}/share-ledger`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId] });
      toast({
        title: "Success",
        description: "Shares issued successfully",
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to issue shares",
        variant: "destructive",
      });
    },
  });

  const createStakeholderMutation = useMutation({
    mutationFn: async (data: z.infer<typeof newStakeholderSchema>) => {
      return apiRequest("POST", `/api/companies/${companyId}/stakeholders`, data);
    },
    onSuccess: (newStakeholder) => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId, "stakeholders"] });
      form.setValue("holderId", newStakeholder.id);
      setShowNewStakeholder(false);
      setNewStakeholderName("");
      toast({
        title: "Success",
        description: "New stakeholder created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create stakeholder",
        variant: "destructive",
      });
    },
  });

  const handleCreateStakeholder = () => {
    if (!newStakeholderName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a stakeholder name",
        variant: "destructive",
      });
      return;
    }

    createStakeholderMutation.mutate({
      name: newStakeholderName,
      type: newStakeholderType,
    });
  };

  const onSubmit = (data: IssueSharesFormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Issue Shares</DialogTitle>
          <DialogDescription>
            Issue new shares to a stakeholder. This will update the cap table immediately.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="holderId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stakeholder</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select stakeholder" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {stakeholders?.map((stakeholder) => (
                        <SelectItem key={stakeholder.id} value={stakeholder.id}>
                          {stakeholder.name} {stakeholder.title && `(${stakeholder.title})`}
                        </SelectItem>
                      ))}
                      <div className="border-t border-neutral-200 mt-1 pt-1">
                        <button
                          type="button"
                          onClick={() => setShowNewStakeholder(true)}
                          className="w-full text-left px-2 py-1.5 text-sm text-primary hover:bg-primary/5 rounded flex items-center"
                        >
                          <i className="fas fa-plus mr-2"></i>
                          Add New Stakeholder
                        </button>
                      </div>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="classId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Security Class</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select security class" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
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

            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Shares</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 100000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="consideration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purchase Price ($)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="e.g., 1000.00" {...field} />
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
                  <FormLabel>Certificate Number (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., CS-001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={mutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Issuing..." : "Issue Shares"}
              </Button>
            </div>
          </form>
        </Form>

        {/* New Stakeholder Modal */}
        {showNewStakeholder && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96 max-w-[90vw]">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">Add New Stakeholder</h3>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="newName" className="block text-sm font-medium text-neutral-700 mb-1">
                    Name
                  </label>
                  <Input
                    id="newName"
                    value={newStakeholderName}
                    onChange={(e) => setNewStakeholderName(e.target.value)}
                    placeholder="Enter stakeholder name"
                  />
                </div>

                <div>
                  <label htmlFor="newType" className="block text-sm font-medium text-neutral-700 mb-1">
                    Type
                  </label>
                  <Select value={newStakeholderType} onValueChange={(value: "individual" | "entity") => setNewStakeholderType(value)}>
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

              <div className="flex justify-end space-x-3 mt-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowNewStakeholder(false);
                    setNewStakeholderName("");
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateStakeholder}
                  disabled={createStakeholderMutation.isPending}
                >
                  {createStakeholderMutation.isPending ? "Creating..." : "Create"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
