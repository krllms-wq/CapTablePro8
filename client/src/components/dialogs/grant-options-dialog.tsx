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
import type { Stakeholder } from "@shared/schema";

const grantOptionsSchema = z.object({
  holderId: z.string().min(1, "Please select a stakeholder"),
  type: z.enum(["ISO", "NSO"], { required_error: "Please select option type" }),
  quantityGranted: z.string().min(1, "Quantity is required").transform(val => parseInt(val)),
  strikePrice: z.string().min(0, "Strike price must be positive").transform(val => parseFloat(val)),
  cliffMonths: z.string().transform(val => parseInt(val) || 12),
  totalMonths: z.string().transform(val => parseInt(val) || 48),
});

type GrantOptionsFormData = z.infer<typeof grantOptionsSchema>;

interface GrantOptionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
}

export default function GrantOptionsDialog({ open, onOpenChange, companyId }: GrantOptionsDialogProps) {
  const { toast } = useToast();

  const { data: stakeholders } = useQuery<Stakeholder[]>({
    queryKey: ["/api/companies", companyId, "stakeholders"],
    enabled: !!companyId && open,
  });

  const form = useForm<GrantOptionsFormData>({
    resolver: zodResolver(grantOptionsSchema),
    defaultValues: {
      holderId: "",
      type: "ISO",
      quantityGranted: "",
      strikePrice: "",
      cliffMonths: "12",
      totalMonths: "48",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: GrantOptionsFormData) => {
      const payload = {
        ...data,
        grantDate: new Date().toISOString(),
        vestingStartDate: new Date().toISOString(),
        quantityExercised: 0,
        quantityCanceled: 0,
        earlyExerciseAllowed: false,
        cadence: "monthly",
        postTerminationExerciseWindowDays: 90,
        iso100kLimitTracking: data.type === "ISO",
      };
      return apiRequest("POST", `/api/companies/${companyId}/equity-awards`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId] });
      toast({
        title: "Success",
        description: "Options granted successfully",
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to grant options",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: GrantOptionsFormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Grant Options</DialogTitle>
          <DialogDescription>
            Grant stock options to an employee or advisor. Standard vesting schedule is 4 years with 1 year cliff.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="holderId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recipient</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select recipient" />
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
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Option Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select option type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ISO">ISO (Incentive Stock Option)</SelectItem>
                      <SelectItem value="NSO">NSO (Non-Qualified Stock Option)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="quantityGranted"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Options</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 50000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="strikePrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Strike Price ($)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="e.g., 4.47" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="cliffMonths"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliff (Months)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="12" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="totalMonths"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Vesting (Months)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="48" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                {mutation.isPending ? "Granting..." : "Grant Options"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
