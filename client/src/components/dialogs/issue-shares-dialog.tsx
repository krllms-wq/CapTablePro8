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

type IssueSharesFormData = z.infer<typeof issueSharesSchema>;

interface IssueSharesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
}

export default function IssueSharesDialog({ open, onOpenChange, companyId }: IssueSharesDialogProps) {
  const { toast } = useToast();

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
      </DialogContent>
    </Dialog>
  );
}
