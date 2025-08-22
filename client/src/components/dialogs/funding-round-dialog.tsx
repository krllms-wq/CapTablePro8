import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
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
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, AlertTriangle, DollarSign } from "lucide-react";
import type { Stakeholder } from "@shared/schema";
import { parseMoneyLoose, roundMoney } from "@/utils/priceMath";

const investorSchema = z.object({
  stakeholderId: z.string().min(1, "Please select a stakeholder"),
  investment: z.string().min(1, "Investment amount is required").refine(val => {
    const parsed = parseMoneyLoose(val);
    return parsed !== undefined && parsed > 0;
  }, "Please enter a valid investment amount"),
});

const fundingRoundSchema = z.object({
  name: z.string().min(1, "Round name is required"),
  closeDate: z.string().min(1, "Close date is required"),
  preMoneyValuation: z.string().min(1, "Pre-money valuation is required").refine(val => {
    const parsed = parseMoneyLoose(val);
    return parsed !== undefined && parsed > 0;
  }, "Please enter a valid pre-money valuation"),
  raiseAmount: z.string().min(1, "Raise amount is required").refine(val => {
    const parsed = parseMoneyLoose(val);
    return parsed !== undefined && parsed > 0;
  }, "Please enter a valid raise amount"),
  roundType: z.enum(["priced", "bridge", "secondary", "recap"]),
  newSecurityClassName: z.string().optional(),
  optionPoolIncrease: z.string().optional(),
  optionPoolTiming: z.enum(["pre-money", "post-money"]).default("pre-money"),
  antiDilutionProvisions: z.enum(["broad-based", "narrow-based", "full-ratchet", "none"]).default("broad-based"),
  payToPlay: z.boolean().default(false),
  investors: z.array(investorSchema).min(1, "At least one investor is required"),
});

type FundingRoundFormData = z.infer<typeof fundingRoundSchema>;

interface FundingRoundDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
}

export default function FundingRoundDialog({ open, onOpenChange, companyId }: FundingRoundDialogProps) {
  const { toast } = useToast();
  const [showNewStakeholder, setShowNewStakeholder] = useState(false);
  const [newStakeholder, setNewStakeholder] = useState({
    name: "",
    email: "",
    type: "entity" as "individual" | "entity"
  });

  const { data: stakeholders = [] } = useQuery<Stakeholder[]>({
    queryKey: [`/api/companies/${companyId}/stakeholders`],
    enabled: open,
  });

  const form = useForm<FundingRoundFormData>({
    resolver: zodResolver(fundingRoundSchema),
    mode: "onSubmit",
    defaultValues: {
      name: "Series A",
      closeDate: new Date().toISOString().split('T')[0],
      preMoneyValuation: "5000000",
      raiseAmount: "2000000",
      roundType: "priced",
      newSecurityClassName: "Series A Preferred",
      optionPoolIncrease: "",
      optionPoolTiming: "pre-money",
      antiDilutionProvisions: "broad-based",
      payToPlay: false,
      investors: [{ stakeholderId: "", investment: "2000000" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "investors",
  });

  // Watch values for real-time calculations
  const watchedValues = form.watch();
  const totalInvestment = watchedValues.investors?.reduce((sum, investor) => {
    const amount = parseMoneyLoose(investor.investment) || 0;
    return sum + amount;
  }, 0) || 0;

  const raiseAmount = parseMoneyLoose(watchedValues.raiseAmount) || 0;
  const preMoneyValuation = parseMoneyLoose(watchedValues.preMoneyValuation) || 0;
  const postMoneyValuation = preMoneyValuation + raiseAmount;

  const createStakeholderMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest(`/api/companies/${companyId}/stakeholders`, {
        method: "POST",
        body: data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/companies/${companyId}/stakeholders`] });
      setShowNewStakeholder(false);
      setNewStakeholder({ name: "", email: "", type: "entity" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create stakeholder",
        variant: "destructive",
      });
    }
  });

  const fundingRoundMutation = useMutation({
    mutationFn: async (data: FundingRoundFormData) => {
      const payload = {
        ...data,
        preMoneyValuation: parseMoneyLoose(data.preMoneyValuation),
        raiseAmount: parseMoneyLoose(data.raiseAmount),
        optionPoolIncrease: data.optionPoolIncrease ? parseFloat(data.optionPoolIncrease) : undefined,
        investors: data.investors.map(inv => ({
          stakeholderId: inv.stakeholderId,
          investment: parseMoneyLoose(inv.investment)
        }))
      };

      return apiRequest(`/api/companies/${companyId}/funding-rounds`, {
        method: "POST",
        body: payload,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/companies/${companyId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/companies/${companyId}/cap-table`] });
      queryClient.invalidateQueries({ queryKey: [`/api/companies/${companyId}/audit-logs`] });
      
      toast({
        title: "Success",
        description: "Funding round created successfully",
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create funding round",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FundingRoundFormData) => {
    // Final validation
    if (Math.abs(totalInvestment - raiseAmount) > 0.01) {
      toast({
        title: "Validation Error",
        description: "Total investor commitments must equal raise amount",
        variant: "destructive",
      });
      return;
    }

    fundingRoundMutation.mutate(data);
  };

  const handleCreateStakeholder = () => {
    if (!newStakeholder.name.trim()) {
      toast({
        title: "Error",
        description: "Stakeholder name is required",
        variant: "destructive",
      });
      return;
    }

    createStakeholderMutation.mutate({
      companyId,
      name: newStakeholder.name,
      email: newStakeholder.email || null,
      type: newStakeholder.type,
    });
  };

  const addInvestor = () => {
    append({ stakeholderId: "", investment: "0" });
  };

  const removeInvestor = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  // Update raise amount when total investment changes
  useEffect(() => {
    if (totalInvestment > 0 && Math.abs(totalInvestment - raiseAmount) > 0.01) {
      form.setValue("raiseAmount", totalInvestment.toString());
    }
  }, [totalInvestment]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Funding Round</DialogTitle>
          <DialogDescription>
            Create a comprehensive funding round with multiple investors. This will create the round record and individual share transactions for each investor.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Round Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Round Details</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Round Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Series A" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="closeDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Close Date *</FormLabel>
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
                  name="preMoneyValuation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pre-Money Valuation *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="$5,000,000"
                          inputMode="numeric"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="raiseAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Raise Amount *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="$2,000,000"
                          inputMode="numeric"
                          {...field}
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
                  name="roundType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Round Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="priced">Priced Round</SelectItem>
                          <SelectItem value="bridge">Bridge Round</SelectItem>
                          <SelectItem value="secondary">Secondary</SelectItem>
                          <SelectItem value="recap">Recapitalization</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="newSecurityClassName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Security Class Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Series A Preferred" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Investors Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Investors</h3>
                <Button type="button" variant="outline" size="sm" onClick={addInvestor}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Investor
                </Button>
              </div>

              {fields.map((field, index) => (
                <div key={field.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Investor {index + 1}</h4>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeInvestor(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`investors.${index}.stakeholderId`}
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

                    <FormField
                      control={form.control}
                      name={`investors.${index}.investment`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Investment Amount *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="$1,000,000"
                              inputMode="numeric"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ))}

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
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleCreateStakeholder}
                      disabled={createStakeholderMutation.isPending}
                    >
                      {createStakeholderMutation.isPending ? "Creating..." : "Create Stakeholder"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowNewStakeholder(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Summary Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Round Summary</h3>
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label className="text-sm text-gray-600">Total Investment</Label>
                  <div className="text-lg font-semibold">${totalInvestment.toLocaleString()}</div>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Post-Money Valuation</Label>
                  <div className="text-lg font-semibold">${postMoneyValuation.toLocaleString()}</div>
                </div>
              </div>

              {/* Validation Alert */}
              {Math.abs(totalInvestment - raiseAmount) > 0.01 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Total investor commitments (${totalInvestment.toLocaleString()}) must equal raise amount (${raiseAmount.toLocaleString()})
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={fundingRoundMutation.isPending || Math.abs(totalInvestment - raiseAmount) > 0.01}
              >
                {fundingRoundMutation.isPending ? "Creating Round..." : "Create Funding Round"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}