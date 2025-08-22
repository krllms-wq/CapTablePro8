import { useState, useEffect } from "react";
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
import { toDateOnlyUTC } from "@shared/utils/dateUtils";
import { parseMoneyLoose, parseSharesLoose } from "@/utils/priceMath";

const grantOptionsSchema = z.object({
  holderId: z.string().min(1, "Please select a stakeholder"),
  type: z.string().min(1, "Please select option type"),
  quantityGranted: z.string().min(1, "Quantity is required").refine(val => {
    const parsed = parseMoneyLoose(val); // Using parseMoneyLoose for shares too as it handles commas
    return parsed !== undefined && parsed > 0;
  }, "Please enter a valid quantity (accepts commas: 1,000)"),
  strikePrice: z.string().optional().or(z.literal('')).refine(val => {
    if (!val || val.trim() === '') return true;
    const parsed = parseMoneyLoose(val);
    return parsed !== undefined && parsed > 0;
  }, "Please enter a valid strike price (accepts $1.00)"),
  grantDate: z.string().min(1, "Grant date is required"),
  vestingStartDate: z.string().min(1, "Vesting start date is required"),
  vestingCliff: z.string().optional(),
  vestingPeriod: z.string().optional(),
}).refine((data) => {
  // RSUs should not require strike price, other types should
  if (data.type === 'RSU') {
    return true; // RSUs don't need strike price validation
  } else {
    return data.strikePrice && data.strikePrice.trim() !== '';
  }
}, {
  message: "Strike price is required for stock options (accepts $1.00)",
  path: ["strikePrice"],
});

type GrantOptionsFormData = z.infer<typeof grantOptionsSchema>;

interface GrantOptionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
}

export default function GrantOptionsDialog({ open, onOpenChange, companyId }: GrantOptionsDialogProps) {
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

  const form = useForm<GrantOptionsFormData>({
    resolver: zodResolver(grantOptionsSchema),
    mode: "onSubmit", // Only validate on submit, not on change
    defaultValues: {
      holderId: "",
      type: "stock_option",
      quantityGranted: "1000", // Provide reasonable default
      strikePrice: "1.00", // Provide reasonable default 
      grantDate: new Date().toISOString().split('T')[0],
      vestingStartDate: new Date().toISOString().split('T')[0],
      vestingCliff: "12", // 12 months default cliff
      vestingPeriod: "48", // 48 months default vesting period
    },
  });

  // Watch for type changes and clear strike price for RSUs
  const watchedType = form.watch("type");
  useEffect(() => {
    if (watchedType === "RSU") {
      form.setValue("strikePrice", "");
    } else if (watchedType === "stock_option" && form.getValues("strikePrice") === "") {
      form.setValue("strikePrice", "1.00");
    }
  }, [watchedType, form]);

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

  const grantOptionsMutation = useMutation({
    mutationFn: async (data: GrantOptionsFormData) => {
      let holderId = data.holderId;
      
      if (data.holderId === "new") {
        if (!newStakeholder.name.trim()) {
          throw new Error("Stakeholder name is required");
        }
        
        // Check if stakeholder with this name already exists to prevent duplicates
        const duplicate = stakeholders.find((s: Stakeholder) => 
          s.name.toLowerCase().trim() === newStakeholder.name.toLowerCase().trim()
        );
        
        if (duplicate) {
          throw new Error(`Stakeholder "${newStakeholder.name}" already exists. Please select from the dropdown.`);
        }
        
        const stakeholder = await createStakeholderMutation.mutateAsync({
          name: newStakeholder.name,
          email: newStakeholder.email || null,
          type: newStakeholder.type,
        });
        holderId = stakeholder.id;
      }

      return apiRequest(`/api/companies/${companyId}/equity-awards`, {
        method: "POST",
        body: {
          holderId,
          type: data.type,
          quantityGranted: parseInt(data.quantityGranted.replace(/,/g, '')),
          quantityExercised: 0,
          quantityCanceled: 0,
          strikePrice: data.type === 'RSU' ? null : parseFloat(data.strikePrice?.replace(/,/g, '') || '0'),
          grantDate: toDateOnlyUTC(data.grantDate),
          vestingStartDate: toDateOnlyUTC(data.vestingStartDate),
          cliffMonths: parseInt(data.vestingCliff || "0"),
          totalMonths: parseInt(data.vestingPeriod || "0"),
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId] });
      toast({
        title: "Success",
        description: "Options granted successfully",
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
        description: error.message || "Failed to grant options",
        variant: "error",
      });
    }
  });

  const onSubmit = (data: GrantOptionsFormData) => {
    grantOptionsMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Grant Options</DialogTitle>
          <DialogDescription>
            Grant stock options to employees or advisors
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

            {/* Option Details */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Option Type *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="stock_option">Stock Option</SelectItem>
                        <SelectItem value="RSU">RSU</SelectItem>
                        <SelectItem value="warrant">Warrant</SelectItem>
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
                    <FormLabel>Quantity *</FormLabel>
                    <FormControl>
                      <Input type="number" inputMode="numeric" placeholder="" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {form.watch("type") !== "RSU" && (
                <FormField
                  control={form.control}
                  name="strikePrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        Strike Price ($) *
                        <HelpBubble 
                          term="Strike Price" 
                          definition="The fixed price at which stock options can be exercised to purchase shares. Usually set at the fair market value when the options are granted."
                          example="Options with $2 strike price allow purchase of shares at $2 each, regardless of current market value"
                        />
                      </FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" inputMode="numeric" placeholder="" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <FormField
                control={form.control}
                name="grantDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grant Date *</FormLabel>
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
              name="vestingStartDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vesting Start Date *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="vestingCliff"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      Cliff Period (months)
                      <HelpBubble 
                        term="Cliff Vesting" 
                        definition="The initial period during which no equity vests, followed by a large portion vesting all at once. Typically used to ensure employee commitment."
                        example="1-year cliff means no options vest for 12 months, then 25% vests immediately"
                      />
                    </FormLabel>
                    <FormControl>
                      <Input type="number" inputMode="numeric" placeholder="" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="vestingPeriod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      Total Vesting Period (months)
                      <HelpBubble 
                        term="Vesting Schedule" 
                        definition="The timeline over which stock options become exercisable. Common schedule is 4 years with 1-year cliff, then monthly vesting."
                        example="48-month vesting: 25% after 1 year, then 1/48th (2.08%) every month"
                      />
                    </FormLabel>
                    <FormControl>
                      <Input type="number" inputMode="numeric" placeholder="" {...field} />
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
                disabled={grantOptionsMutation.isPending}
              >
                {grantOptionsMutation.isPending ? "Granting..." : "Grant Options"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}