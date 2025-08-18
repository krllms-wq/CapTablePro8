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
  type: z.enum(["ISO", "NSO"]),
  holderId: z.string().min(1, "Please select a stakeholder"),
  strikePrice: z.string().min(0, "Strike price must be positive").transform(val => parseFloat(val)),
  quantityGranted: z.string().min(1, "Quantity is required").transform(val => parseInt(val)),
  cliffMonths: z.string().min(0, "Cliff months must be positive").transform(val => parseInt(val)),
  totalMonths: z.string().min(1, "Total months is required").transform(val => parseInt(val)),
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
      type: "ISO",
      holderId: "",
      strikePrice: "0.01",
      quantityGranted: "1000",
      cliffMonths: "12",
      totalMonths: "48",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: GrantOptionsFormData) => {
      const grantDate = new Date();
      const vestingStartDate = new Date(grantDate);
      const vestingEndDate = new Date(grantDate);
      vestingEndDate.setMonth(vestingEndDate.getMonth() + data.totalMonths);

      const payload = {
        ...data,
        grantDate: grantDate.toISOString(),
        vestingStartDate: vestingStartDate.toISOString(),
        vestingEndDate: vestingEndDate.toISOString(),
        quantityExercised: 0,
        quantityCanceled: 0,
        earlyExerciseAllowed: false,
        iso100kLimitTracking: data.type === "ISO",
      };
      return apiRequest("POST", `/api/companies/${companyId}/equity-awards`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId] });
      toast({
        title: "Success",
        description: "Stock options granted successfully",
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
          <DialogTitle>Grant Stock Options</DialogTitle>
          <DialogDescription>
            Create a new stock option grant for an employee or stakeholder.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                      <SelectItem value="ISO">Incentive Stock Option (ISO)</SelectItem>
                      <SelectItem value="NSO">Non-Qualified Stock Option (NSO)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                          {stakeholder.name}
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
              name="quantityGranted"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter number of options"
                      {...field}
                    />
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
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Enter strike price"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cliffMonths"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliff Period (Months)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter cliff period in months"
                      {...field}
                    />
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
                  <FormLabel>Total Vesting Period (Months)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter total vesting period"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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