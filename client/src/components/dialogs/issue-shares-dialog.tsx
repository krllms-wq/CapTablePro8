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
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpBubble } from "@/components/ui/help-bubble";
import { Label } from "@/components/ui/label";

import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, AlertTriangle } from "lucide-react";
import type { Stakeholder, SecurityClass } from "@shared/schema";
import DerivedPill from "@/components/DerivedPill";
import { toDateOnlyUTC } from "@shared/utils/dateUtils";
import AdditionalSettings from "@/components/AdditionalSettings";
import { useAdvancedOpen } from "@/components/form/useAdvancedOpen";
import { 
  parseMoneyLoose, 
  parseSharesLoose, 
  derivePpsFromValuation,
  derivePpsFromConsideration,
  deriveValuationFromPps,
  reconcilePps,
  reconcileValuation,
  roundMoney,
  formatReconcileResult,
  type ReconcileResult,
  type ReconcileValuationResult 
} from "@/utils/priceMath";
import { 
  sanitizeMoneyInput, 
  formatDisplayValue, 
  createMoneyBlurHandler, 
  createSharesBlurHandler 
} from "@/utils/formatters";

const issueSharesSchema = z.object({
  holderId: z.string().min(1, "Please select a stakeholder"),
  classId: z.string().min(1, "Please select a security class"),
  consideration: z.string().min(1, "Consideration is required").refine(val => {
    const parsed = parseMoneyLoose(val);
    return parsed !== undefined && parsed > 0;
  }, "Please enter a valid consideration amount (accepts $1,000,000)"),
  valuation: z.string().min(1, "Company valuation is required").refine(val => {
    const parsed = parseMoneyLoose(val);
    return parsed !== undefined && parsed > 0;
  }, "Please enter a valid valuation (accepts $1,000,000)"),
  roundName: z.string().min(1, "Round name is required"),
  issueDate: z.string().min(1, "Issue date is required"),
  quantity: z.string().optional().refine(val => {
    if (!val || val.trim() === '') return true;
    const parsed = parseSharesLoose(val);
    return parsed !== undefined && parsed > 0;
  }, "Please enter a valid quantity (accepts commas: 1,000,000)"),
  pricePerShare: z.string().optional().refine(val => {
    if (!val || val.trim() === '') return true;
    const parsed = parseMoneyLoose(val);
    return parsed !== undefined && parsed > 0;
  }, "Please enter a valid price per share (accepts $1.00)"),
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
  const [showNewSecurityClass, setShowNewSecurityClass] = useState(false);
  const [overridePps, setOverridePps] = useState(false);
  const [overrideQuantity, setOverrideQuantity] = useState(false);
  const [ppsReconcileResult, setPpsReconcileResult] = useState<ReconcileResult>({ source: "unknown" });
  const [quantityReconcileResult, setQuantityReconcileResult] = useState<{ quantity?: number; source: string }>({ source: "unknown" });
  const [derivedPps, setDerivedPps] = useState<number | undefined>();
  const [derivedQuantity, setDerivedQuantity] = useState<number | undefined>();
  
  const [newStakeholder, setNewStakeholder] = useState({
    name: "",
    email: "",
    type: "individual" as "individual" | "entity"
  });
  const [newSecurityClass, setNewSecurityClass] = useState({
    name: "",
    liquidationPreferenceMultiple: "1.0",
    participating: false,
    votingRights: "1.0"
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
    mode: "onSubmit", // Only validate on submit, not on change
    defaultValues: {
      holderId: "",
      classId: "",
      quantity: "100000", // Reasonable default quantity
      consideration: "100000", // Reasonable default consideration
      roundName: "Seed Round", // Default round name
      issueDate: new Date().toISOString().split('T')[0],
      valuation: "1000000", // $1M default pre-money valuation
      pricePerShare: "1.00", // $1 default price per share
      certificateNo: "",
    },
  });

  // Advanced fields accordion state
  const advancedOpen = useAdvancedOpen({
    errors: form.formState.errors,
    values: { ...form.watch(), overridePps, overrideQuantity },
    advancedFields: ['certificateNo', 'overridePps', 'overrideQuantity'],
    defaultValues: {
      certificateNo: "",
      overridePps: false,
      overrideQuantity: false,
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

  const createSecurityClassMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest(`/api/companies/${companyId}/security-classes`, {
        method: "POST",
        body: data
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create security class",
        variant: "error",
      });
    }
  });

  const issueSharesMutation = useMutation({
    mutationFn: async (data: IssueSharesFormData) => {
      let holderId = data.holderId;
      let classId = data.classId;
      
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

      // If creating new security class, create it first
      if (data.classId === "new") {
        if (!newSecurityClass.name.trim()) {
          throw new Error("Security class name is required");
        }
        
        // Check if security class with same name already exists
        const existingClass = securityClasses?.find(sc => 
          sc.name.toLowerCase().trim() === newSecurityClass.name.toLowerCase().trim()
        );
        
        if (existingClass) {
          // Use existing security class instead of creating a new one
          classId = existingClass.id;
        } else {
          // Create new security class
          const securityClass = await createSecurityClassMutation.mutateAsync({
            name: newSecurityClass.name,
            liquidationPreferenceMultiple: newSecurityClass.liquidationPreferenceMultiple,
            participating: newSecurityClass.participating,
            votingRights: newSecurityClass.votingRights,
            companyId: companyId,
          });
          classId = securityClass.id;
        }
      }

      // Create share ledger entry
      return apiRequest(`/api/companies/${companyId}/share-ledger`, {
        method: "POST",
        body: {
          holderId,
          classId: classId,
          quantity: parseInt((data.quantity || "0").replace(/,/g, '')),
          issueDate: toDateOnlyUTC(data.issueDate),
          consideration: (data.consideration || "").replace(/,/g, ''),
          considerationType: "cash",
          certificateNo: data.certificateNo || null,
          sourceTransactionId: `round-${Date.now()}`,
        }
      });
    },
    onSuccess: () => {
      // Invalidate and refetch all cap table related queries
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId, "cap-table"] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId, "stakeholders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId, "share-ledger"] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId, "activity"] });
      
      toast({
        title: "Success",
        description: "Shares issued successfully",
        variant: "success",
      });
      onOpenChange(false);
      form.reset();
      setNewStakeholder({ name: "", email: "", type: "individual" });
      setShowNewStakeholder(false);
      setNewSecurityClass({ name: "", liquidationPreferenceMultiple: "1.0", participating: false, votingRights: "1.0" });
      setShowNewSecurityClass(false);
      setOverridePps(false);
      setOverrideQuantity(false);
      setPpsReconcileResult({ source: "unknown" });
      setQuantityReconcileResult({ source: "unknown" });
      setDerivedPps(undefined);
      setDerivedQuantity(undefined);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to issue shares",
        variant: "error",
      });
      // Re-enable button on error
      form.clearErrors();
    }
  });

  // Enhanced calculation: from consideration + valuation → quantity + PPS
  const updateDerivedValues = () => {
    const current = form.getValues();
    
    // Parse input values
    const consideration = parseMoneyLoose(current.consideration);
    const valuation = parseMoneyLoose(current.valuation);
    const quantityRaw = parseSharesLoose(current.quantity);
    const ppsRaw = parseMoneyLoose(current.pricePerShare);
    const preRoundFD = 10_000_000; // Assumed fully diluted shares
    
    let finalPps: number | undefined;
    let finalQuantity: number | undefined;
    
    // Calculate PPS from valuation (valuation / preRoundFD)
    const ppsFromValuation = valuation && preRoundFD ? valuation / preRoundFD : undefined;
    
    if (!overridePps && !overrideQuantity) {
      // Both derived: calculate from consideration + valuation
      if (consideration && valuation && preRoundFD) {
        // PPS = valuation / preRoundFD
        finalPps = roundMoney(valuation / preRoundFD);
        
        // Quantity = consideration / PPS
        finalQuantity = consideration && finalPps ? Math.round(consideration / finalPps) : undefined;
        
        setPpsReconcileResult({ 
          pps: finalPps, 
          source: "valuation"
        });
        
        setQuantityReconcileResult({
          quantity: finalQuantity,
          source: "derived"
        });
      }
    } else if (overridePps && !overrideQuantity) {
      // PPS override, quantity derives from consideration / PPS
      finalPps = ppsRaw;
      finalQuantity = consideration && finalPps ? Math.round(consideration / finalPps) : undefined;
      
      setPpsReconcileResult({ 
        pps: finalPps, 
        source: "override" 
      });
      
      setQuantityReconcileResult({
        quantity: finalQuantity,
        source: "derived"
      });
    } else if (!overridePps && overrideQuantity) {
      // Quantity override, PPS derives from consideration / quantity
      finalQuantity = quantityRaw;
      finalPps = consideration && finalQuantity ? roundMoney(consideration / finalQuantity) : undefined;
      
      // Check if PPS matches valuation-derived PPS
      const valuationPps = ppsFromValuation;
      let hasConflict = false;
      let warningDeltaPct: number | undefined;
      
      if (finalPps && valuationPps) {
        const avg = (finalPps + valuationPps) / 2;
        const delta = Math.abs(finalPps - valuationPps);
        const deltaPct = (delta / avg) * 100;
        
        if (deltaPct > 0.5) {
          hasConflict = true;
          warningDeltaPct = Math.round(deltaPct * 100) / 100;
        }
      }
      
      setPpsReconcileResult({
        pps: finalPps,
        source: "consideration",
        hasConflict,
        warningDeltaPct,
        conflictMessage: hasConflict 
          ? `PPS from consideration/quantity ($${finalPps?.toFixed(4)}) differs from valuation-based PPS ($${valuationPps?.toFixed(4)}) by ${warningDeltaPct}%`
          : undefined
      });
      
      setQuantityReconcileResult({
        quantity: finalQuantity,
        source: "override"
      });
    } else {
      // Both overrides: use manual values, show warnings if inconsistent
      finalPps = ppsRaw;
      finalQuantity = quantityRaw;
      
      // Check consistency: consideration should equal quantity * PPS
      const expectedConsideration = finalQuantity && finalPps ? finalQuantity * finalPps : undefined;
      const actualConsideration = consideration;
      
      let hasConflict = false;
      let warningDeltaPct: number | undefined;
      
      if (expectedConsideration && actualConsideration) {
        const avg = (expectedConsideration + actualConsideration) / 2;
        const delta = Math.abs(expectedConsideration - actualConsideration);
        const deltaPct = (delta / avg) * 100;
        
        if (deltaPct > 0.5) {
          hasConflict = true;
          warningDeltaPct = Math.round(deltaPct * 100) / 100;
        }
      }
      
      setPpsReconcileResult({
        pps: finalPps,
        source: "override",
        hasConflict,
        warningDeltaPct,
        conflictMessage: hasConflict 
          ? `Manual quantity × PPS (${finalQuantity?.toLocaleString()} × $${finalPps?.toFixed(4)} = $${expectedConsideration?.toLocaleString()}) doesn't match consideration ($${actualConsideration?.toLocaleString()})`
          : undefined
      });
      
      setQuantityReconcileResult({
        quantity: finalQuantity,
        source: "override"
      });
    }
    
    // Update derived state
    setDerivedPps(finalPps);
    setDerivedQuantity(finalQuantity);
    
    // Update form fields if not overriding (but don't trigger validation to avoid loops)
    if (!overridePps && finalPps !== undefined) {
      form.setValue('pricePerShare', finalPps.toString(), { shouldValidate: false });
    }
    if (!overrideQuantity && finalQuantity !== undefined) {
      form.setValue('quantity', finalQuantity.toString(), { shouldValidate: false });
    }
  };

  // Watch form changes to update derived values
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (['valuation', 'consideration'].includes(name || '')) {
        updateDerivedValues();
      }
    });
    return () => subscription.unsubscribe();
  }, [form, overridePps, overrideQuantity]);

  // Input sanitization helpers
  const sanitizeMoneyInput = (value: string) => {
    const sanitized = parseMoneyLoose(value);
    return sanitized !== undefined ? sanitized.toString() : "";
  };

  const sanitizeSharesInput = (value: string) => {
    const sanitized = parseSharesLoose(value);
    return sanitized !== undefined ? sanitized.toString() : "";
  };

  const formatDisplayValue = (value: string, isShares = false) => {
    const parsed = isShares ? parseSharesLoose(value) : parseMoneyLoose(value);
    return parsed !== undefined ? parsed.toLocaleString() : value;
  };

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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Section - Enhanced with valuation and PPS */}
            <div className="space-y-4 border-b pb-4">
              <h4 className="font-medium text-sm">Basic</h4>
              
              {/* Round Name and Issue Date */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="roundName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        Round Name *
                        <HelpBubble 
                          term="Round Name" 
                          definition="A descriptive name for this funding round or share issuance event."
                          example="Seed Round, Series A, Employee Grant #123"
                        />
                      </FormLabel>
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
                      <FormLabel className="flex items-center gap-2">
                        Issue Date *
                        <HelpBubble 
                          term="Issue Date" 
                          definition="The date when the shares are officially issued to the stakeholder."
                          example="The transaction date for the share issuance"
                        />
                      </FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
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
                    <FormLabel className="flex items-center gap-2">
                      Stakeholder *
                      <HelpBubble 
                        term="Stakeholder" 
                        definition="Any individual or entity that owns or has rights to equity in the company, including founders, employees, investors, and advisors."
                        example="John Doe (founder), Acme Ventures (investor), or Jane Smith (employee with stock options)"
                      />
                    </FormLabel>
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

              {/* Security Class Selection */}
              <FormField
                control={form.control}
                name="classId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      Security Class *
                      <HelpBubble 
                        term="Security Class" 
                        definition="Different types of equity with varying rights and preferences. Common stock typically has voting rights, while preferred stock often has liquidation preferences and other protective provisions."
                        example="Common Stock for founders and employees, Series A Preferred for investors"
                      />
                    </FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        setShowNewSecurityClass(value === "new");
                      }} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select security class" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="new">
                          <div className="flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            Add New Security Class
                          </div>
                        </SelectItem>
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

              {/* New Security Class Form */}
              {showNewSecurityClass && (
                <div className="space-y-3 border rounded-lg p-4 bg-gray-50">
                  <h4 className="font-medium text-sm">New Security Class Details</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Class Name *</Label>
                      <Input
                        value={newSecurityClass.name}
                        onChange={(e) => setNewSecurityClass({...newSecurityClass, name: e.target.value})}
                        placeholder="e.g., Series A Preferred"
                      />
                    </div>
                    <div>
                      <Label>Liquidation Preference</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={newSecurityClass.liquidationPreferenceMultiple}
                        onChange={(e) => setNewSecurityClass({...newSecurityClass, liquidationPreferenceMultiple: e.target.value})}
                        placeholder=""
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Participating</Label>
                      <Select 
                        value={newSecurityClass.participating ? "true" : "false"} 
                        onValueChange={(value) => 
                          setNewSecurityClass({...newSecurityClass, participating: value === "true"})
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="false">Non-participating</SelectItem>
                          <SelectItem value="true">Participating</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Voting Rights</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={newSecurityClass.votingRights}
                        onChange={(e) => setNewSecurityClass({...newSecurityClass, votingRights: e.target.value})}
                        placeholder=""
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Consideration and Valuation Inputs */}
              <div className="grid grid-cols-2 gap-4">
                {/* Consideration */}
                <FormField
                  control={form.control}
                  name="consideration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        Consideration ($) *
                        <HelpBubble 
                          term="Consideration" 
                          definition="The value received in exchange for issuing shares, which can be cash, services, intellectual property, or other assets."
                          example="$100,000 cash payment for shares"
                        />
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="text"
                          inputMode="numeric"
                          placeholder="Enter amount" 
                          {...field}
                          onBlur={createMoneyBlurHandler(field)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Company Valuation */}
                <FormField
                  control={form.control}
                  name="valuation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        Company Valuation ($) *
                        <HelpBubble 
                          term="Company Valuation" 
                          definition="The pre-money valuation of the company, used to calculate price per share and ownership percentages."
                          example="$10M valuation determines price per share"
                        />
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="text"
                          inputMode="numeric"
                          placeholder="Enter valuation" 
                          {...field}
                          onBlur={createMoneyBlurHandler(field)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Calculated Quantity and Price Per Share Section */}
              <div className="space-y-4 border rounded-lg p-4 bg-blue-50/30">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm text-blue-900">Calculated Values</h4>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="override-quantity-basic"
                        checked={overrideQuantity}
                        onCheckedChange={(checked) => {
                          setOverrideQuantity(!!checked);
                          if (!checked) updateDerivedValues();
                        }}
                        className="h-3 w-3"
                      />
                      <Label htmlFor="override-quantity-basic" className="cursor-pointer text-xs">
                        Override quantity
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="override-pps-basic"
                        checked={overridePps}
                        onCheckedChange={(checked) => {
                          setOverridePps(!!checked);
                          if (!checked) updateDerivedValues();
                        }}
                        className="h-3 w-3"
                      />
                      <Label htmlFor="override-pps-basic" className="cursor-pointer text-xs">
                        Override price per share
                      </Label>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {/* Quantity */}
                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          Quantity
                          {!overrideQuantity && (
                            <DerivedPill 
                              variant="default"
                              title="Calculated from consideration ÷ price per share"
                            />
                          )}
                          <HelpBubble 
                            term="Share Quantity" 
                            definition="The number of shares being issued to the stakeholder. This directly affects ownership percentage and dilution of existing shareholders."
                            example="Calculated as consideration amount divided by price per share"
                          />
                        </FormLabel>
                        <FormControl>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Input 
                                  type="text"
                                  inputMode="numeric"
                                  placeholder="Auto-calculated"
                                  {...field}
                                  value={overrideQuantity ? field.value : (derivedQuantity ? derivedQuantity.toString() : "")}
                                  readOnly={!overrideQuantity}
                                  className={!overrideQuantity ? "bg-gray-50 cursor-default" : ""}
                                  onBlur={overrideQuantity ? createSharesBlurHandler(field) : undefined}
                                />
                              </TooltipTrigger>
                              {!overrideQuantity && (
                                <TooltipContent>
                                  <p>Calculated from consideration ÷ price per share</p>
                                </TooltipContent>
                              )}
                            </Tooltip>
                          </TooltipProvider>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Price per Share */}
                  <FormField
                    control={form.control}
                    name="pricePerShare"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          Price per share ($)
                          {!overridePps && (
                            <DerivedPill 
                              variant={ppsReconcileResult.warningDeltaPct ? "warning" : "default"}
                              title={
                                ppsReconcileResult.warningDeltaPct 
                                  ? `Price calculation conflict: ${ppsReconcileResult.warningDeltaPct}% difference`
                                  : "Calculated from company valuation"
                              }
                            />
                          )}
                          <HelpBubble 
                            term="Price per Share" 
                            definition="The calculated or set price for each share, derived from company valuation divided by fully diluted shares."
                            example="$10M valuation ÷ 10M shares = $1.00 per share"
                          />
                        </FormLabel>
                        <FormControl>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Input 
                                  type="text"
                                  inputMode="numeric"
                                  placeholder="Auto-calculated"
                                  {...field}
                                  value={overridePps ? field.value : (derivedPps ? derivedPps.toString() : "")}
                                  readOnly={!overridePps}
                                  className={!overridePps ? "bg-gray-50 cursor-default" : ""}
                                  onBlur={overridePps ? (e) => {
                                    const sanitized = sanitizeMoneyInput(e.target.value);
                                    field.onChange(sanitized);
                                    e.target.value = formatDisplayValue(sanitized);
                                  } : undefined}
                                />
                              </TooltipTrigger>
                              {!overridePps && (
                                <TooltipContent>
                                  <p>Calculated from company valuation</p>
                                </TooltipContent>
                              )}
                            </Tooltip>
                          </TooltipProvider>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Warning Messages for Calculation Conflicts */}
                {ppsReconcileResult.hasConflict && ppsReconcileResult.conflictMessage && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <div className="text-yellow-800">
                        <strong>Calculation Warning:</strong> {ppsReconcileResult.conflictMessage}
                      </div>
                    </div>
                  </div>
                )}
              </div>



              {/* Override Mode Controls */}
              {overridePps && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-amber-600">Manual price override active</span>
                  <button
                    type="button"
                    onClick={() => {
                      setOverridePps(false);
                      updateDerivedValues();
                    }}
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    Revert to auto-calculation
                  </button>
                </div>
              )}

              {/* Quantity Override Mode Controls */}
              {overrideQuantity && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-amber-600">Manual quantity override active</span>
                  <button
                    type="button"
                    onClick={() => {
                      setOverrideQuantity(false);
                      updateDerivedValues();
                    }}
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    Revert to auto-calculation
                  </button>
                </div>
              )}
            </div>

            {/* Additional Settings */}
            <AdditionalSettings
              open={advancedOpen.isOpen}
              onOpenChange={advancedOpen.setIsOpen}
              title="Additional Settings"
              description="Optional certificate details and advanced configuration"
            >
              <FormField
                control={form.control}
                name="certificateNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Certificate Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Optional certificate identifier" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Override PPS Checkbox */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="override-pps-advanced"
                  checked={overridePps}
                  onCheckedChange={(checked) => {
                    setOverridePps(!!checked);
                    if (!checked) {
                      // Reset to derived value when disabling override
                      updateDerivedValues();
                    }
                  }}
                />
                <Label htmlFor="override-pps-advanced" className="text-sm cursor-pointer">
                  Override price per share calculations
                </Label>
              </div>

              {/* Override Quantity Checkbox */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="override-quantity-advanced"
                  checked={overrideQuantity}
                  onCheckedChange={(checked) => {
                    setOverrideQuantity(!!checked);
                    if (!checked) {
                      // Reset to derived value when disabling override
                      updateDerivedValues();
                    }
                  }}
                />
                <Label htmlFor="override-quantity-advanced" className="text-sm cursor-pointer">
                  Override quantity calculations
                </Label>
              </div>
            </AdditionalSettings>

            {/* Form Actions */}
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