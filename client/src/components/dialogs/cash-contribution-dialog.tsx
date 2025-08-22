import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/formatters";

const cashContributionSchema = z.object({
  contributorId: z.string().min(1, "Please select a contributor"),
  amount: z.string().min(1, "Amount is required").refine((val) => {
    const num = parseFloat(val.replace(/[$,]/g, ''));
    return !isNaN(num) && num > 0;
  }, "Amount must be a positive number"),
  contributionDate: z.string().min(1, "Date is required"),
  description: z.string().optional()
});

type CashContributionFormData = z.infer<typeof cashContributionSchema>;

interface CashContributionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
}

export default function CashContributionDialog({ 
  open, 
  onOpenChange,
  companyId 
}: CashContributionDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CashContributionFormData>({
    resolver: zodResolver(cashContributionSchema),
    defaultValues: {
      contributorId: "",
      amount: "",
      contributionDate: new Date().toISOString().split('T')[0],
      description: ""
    }
  });

  // Load stakeholders for selection
  const { data: stakeholders } = useQuery({
    queryKey: ["/api/companies", companyId, "stakeholders"],
    enabled: !!companyId
  });

  // Create cash contribution mutation
  const createContributionMutation = useMutation({
    mutationFn: async (data: CashContributionFormData) => {
      const amount = parseFloat(data.amount.replace(/[$,]/g, ''));
      return apiRequest(`/api/companies/${companyId}/cash-contributions`, {
        method: "POST",
        body: {
          contributorId: data.contributorId,
          amount: amount,
          contributionDate: data.contributionDate,
          description: data.description || null
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId] });
      toast({ title: "Cash contribution recorded successfully" });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to record cash contribution", 
        description: error.message,
        variant: "error"
      });
    }
  });

  const onSubmit = (data: CashContributionFormData) => {
    createContributionMutation.mutate(data);
  };

  const handleClose = () => {
    onOpenChange(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" data-testid="cash-contribution-dialog">
        <DialogHeader>
          <DialogTitle>Record Cash Contribution</DialogTitle>
          <DialogDescription>
            Record actual cash investments from founders, bridge loans, or other funding separate from share issuance.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Contributor Selection */}
            <FormField
              control={form.control}
              name="contributorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contributor</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="contributor-select">
                        <SelectValue placeholder="Select contributor" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {stakeholders?.map((stakeholder: any) => (
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

            {/* Amount */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="$50,000"
                      inputMode="numeric"
                      data-testid="amount-input"
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^\d.]/g, '');
                        const num = parseFloat(value);
                        field.onChange(isNaN(num) ? '' : formatCurrency(num).replace('$', ''));
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date */}
            <FormField
              control={form.control}
              name="contributionDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contribution Date</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="date"
                      data-testid="date-input"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Bridge loan to cover operating expenses..."
                      rows={3}
                      data-testid="description-input"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                data-testid="cancel-button"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createContributionMutation.isPending}
                data-testid="submit-button"
              >
                {createContributionMutation.isPending ? "Recording..." : "Record Contribution"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}