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
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatPercentage } from "@/lib/formatters";
import { AlertTriangle } from "lucide-react";
import type { SecurityClass } from "@shared/schema";
import DerivedPill from "@/components/DerivedPill";
import AdditionalSettings from "@/components/AdditionalSettings";
import { useAdvancedOpen } from "@/components/form/useAdvancedOpen";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  parseMoneyLoose, 
  parseSharesLoose, 
  derivePpsFromValuation,
  derivePpsFromConsideration,
  reconcilePps,
  roundMoney,
  type ReconcileResult 
} from "@/utils/priceMath";

const modelRoundSchema = z.object({
  name: z.string().min(1, "Round name is required"),
  roundType: z.enum(["priced", "convertible"]),
  raiseAmount: z.string().min(1, "Raise amount is required"),
  preMoneyValuation: z.string().optional(),
  pricePerShare: z.string().optional(),
  newSecurityClassId: z.string().optional(),
  optionPoolIncrease: z.string().optional(),
});

type ModelRoundFormData = z.infer<typeof modelRoundSchema>;

interface ModelRoundDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
}

interface RoundProjection {
  preMoneyValuation: number;
  postMoneyValuation: number;
  pricePerShare: number;
  newShares: number;
  dilution: number;
  optionPoolShares?: number;
}



export default function ModelRoundDialog({ open, onOpenChange, companyId }: ModelRoundDialogProps) {
  const { toast } = useToast();
  const [projection, setProjection] = useState<RoundProjection | null>(null);
  const [overridePps, setOverridePps] = useState(false);
  const [ppsReconcileResult, setPpsReconcileResult] = useState<ReconcileResult>({ source: "unknown" });
  const [derivedPps, setDerivedPps] = useState<number | undefined>();

  const { data: securityClasses } = useQuery<SecurityClass[]>({
    queryKey: ["/api/companies", companyId, "security-classes"],
    enabled: !!companyId && open,
  });

  // Get current cap table for display
  const { data: capTableData } = useQuery<{
    stats: { totalShares: number; totalOptions: number; totalConvertibles: number; stakeholderCount: number };
    capTable: Array<{ stakeholder: string; shares: number; options: number; convertibles?: number; percentage: string; value: number }>;
    convertibles: Array<{ id: string; type: string; holderName: string; principal: number; framework?: string; discountRate?: number; valuationCap?: number; issueDate: string }>;
  }>({
    queryKey: ["/api/companies", companyId, "cap-table"],
    enabled: !!companyId && open,
  });

  const form = useForm<ModelRoundFormData>({
    resolver: zodResolver(modelRoundSchema),
    defaultValues: {
      name: "",
      roundType: "priced",
      raiseAmount: "",
      preMoneyValuation: "",
      pricePerShare: "",
      newSecurityClassId: "",
      optionPoolIncrease: "",
    },
  });

  // Advanced fields accordion state
  const advancedOpen = useAdvancedOpen({
    errors: form.formState.errors,
    values: { ...form.watch(), overridePps },
    advancedFields: ['newSecurityClassId', 'optionPoolIncrease', 'overridePps'],
    defaultValues: {
      newSecurityClassId: "",
      optionPoolIncrease: "",
      overridePps: false,
    },
  });

  const modelMutation = useMutation({
    mutationFn: async (data: ModelRoundFormData) => {
      // Transform data for API
      const payload = {
        ...data,
        raiseAmount: parseMoneyLoose(data.raiseAmount) || 0,
        preMoneyValuation: data.preMoneyValuation ? parseMoneyLoose(data.preMoneyValuation) : undefined,
        pricePerShare: data.pricePerShare ? parseMoneyLoose(data.pricePerShare) : undefined,
        optionPoolIncrease: data.optionPoolIncrease ? parseFloat(data.optionPoolIncrease) / 100 : undefined,
      };
      return apiRequest(`/api/companies/${companyId}/rounds/model`, {
        method: "POST",
        body: payload,
      });
    },
    onSuccess: (data: RoundProjection) => {
      setProjection(data);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to model round",
        variant: "error",
      });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ModelRoundFormData) => {
      // Transform data for API
      const payload = {
        ...data,
        raiseAmount: parseMoneyLoose(data.raiseAmount) || 0,
        preMoneyValuation: data.preMoneyValuation ? parseMoneyLoose(data.preMoneyValuation) : undefined,
        pricePerShare: data.pricePerShare ? parseMoneyLoose(data.pricePerShare) : undefined,
        optionPoolIncrease: data.optionPoolIncrease ? parseFloat(data.optionPoolIncrease) / 100 : undefined,
        closeDate: new Date().toISOString(),
      };
      return apiRequest(`/api/companies/${companyId}/rounds`, {
        method: "POST",
        body: payload,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId] });
      toast({
        title: "Success",
        description: "Round created successfully",
      });
      form.reset();
      setProjection(null);
      setOverridePps(false);
      setPpsReconcileResult({ source: "unknown" });
      setDerivedPps(undefined);
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create round",
        variant: "error",
      });
    },
  });

  const onModelRound = (data: ModelRoundFormData) => {
    modelMutation.mutate(data);
  };

  const onCreateRound = () => {
    const formData = form.getValues();
    createMutation.mutate(formData);
  };

  // Enhanced price calculation using priceMath utilities
  const updateDerivedPps = () => {
    const current = form.getValues();
    
    // Parse values using priceMath utilities
    const preMoney = parseMoneyLoose(current.preMoneyValuation);
    const raiseAmount = parseMoneyLoose(current.raiseAmount);
    const preRoundFD = 10_000_000; // Assumed fully diluted shares
    
    // Derive PPS from different sources
    const fromValuation = derivePpsFromValuation({ valuation: preMoney, preRoundFD });
    const fromConsideration = derivePpsFromConsideration({ 
      consideration: raiseAmount, 
      quantity: raiseAmount && fromValuation ? raiseAmount / fromValuation : undefined 
    });
    const overridePpsValue = overridePps ? parseMoneyLoose(current.pricePerShare) : undefined;
    
    // Reconcile PPS sources
    const result = reconcilePps({
      fromValuation,
      fromConsideration,
      overridePps: overridePpsValue,
      toleranceBps: 50 // 0.5% tolerance
    });
    
    setPpsReconcileResult(result);
    setDerivedPps(result.pps);
    
    // Update form with derived PPS if not overriding
    if (!overridePps && result.pps !== undefined) {
      form.setValue('pricePerShare', result.pps.toString());
    }
  };

  // Watch form changes to update derived PPS
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (['preMoneyValuation', 'raiseAmount'].includes(name || '')) {
        updateDerivedPps();
      }
    });
    return () => subscription.unsubscribe();
  }, [form, overridePps]);

  // Input sanitization helpers
  const sanitizeMoneyInput = (value: string) => {
    const sanitized = parseMoneyLoose(value);
    return sanitized !== undefined ? sanitized.toString() : "";
  };

  const formatDisplayValue = (value: string) => {
    const parsed = parseMoneyLoose(value);
    return parsed !== undefined ? parsed.toLocaleString() : value;
  };

  const watchedRoundType = form.watch("roundType");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Model Funding Round</DialogTitle>
          <DialogDescription>
            Model the impact of a new funding round on ownership and dilution.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onModelRound)} className="space-y-6">
              {/* Basic Section - Enhanced with pre-money valuation and PPS */}
              <div className="space-y-4 border-b pb-4">
                <h4 className="font-medium text-sm">Basic</h4>
                
                {/* Round Name and Type */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Round Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Series A, Seed Round" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="roundType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Round Type *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select round type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="priced">Priced Round</SelectItem>
                            <SelectItem value="convertible">Convertible Round</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Raise Amount */}
                <FormField
                  control={form.control}
                  name="raiseAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Raise Amount ($) *</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="5,000,000"
                          {...field}
                          onBlur={(e) => {
                            const sanitized = sanitizeMoneyInput(e.target.value);
                            field.onChange(sanitized);
                            e.target.value = formatDisplayValue(sanitized);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {watchedRoundType === "priced" && (
                  <>
                    {/* Pre-Money Valuation - Now in Basic section */}
                    <FormField
                      control={form.control}
                      name="preMoneyValuation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pre-Money Valuation ($)</FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              placeholder="20,000,000"
                              {...field}
                              onBlur={(e) => {
                                const sanitized = sanitizeMoneyInput(e.target.value);
                                field.onChange(sanitized);
                                e.target.value = formatDisplayValue(sanitized);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Price per Share - Enhanced with derivation */}
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
                                    ? `Valuation vs. raise amount PPS differ by ~${ppsReconcileResult.warningDeltaPct}%`
                                    : "Calculated from pre-money & pre-round FD"
                                }
                              />
                            )}
                          </FormLabel>
                          <FormControl>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Input
                                    type="text"
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
                                    <p>Derived from pre-money valuation</p>
                                  </TooltipContent>
                                )}
                              </Tooltip>
                            </TooltipProvider>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />



                    {/* PPS Divergence Warning */}
                    {ppsReconcileResult.warningDeltaPct && (
                      <Alert className="border-amber-200 bg-amber-50">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        <AlertDescription className="text-amber-800">
                          Price per share calculated from valuation and raise amount diverge by {ppsReconcileResult.warningDeltaPct}%. 
                          You may want to verify your inputs.
                        </AlertDescription>
                      </Alert>
                    )}
                  </>
                )}
              </div>

              {/* Additional Settings */}
              <AdditionalSettings
                open={advancedOpen.isOpen}
                onOpenChange={advancedOpen.setIsOpen}
                title="Additional Settings"
                description="Optional round configuration and advanced options"
              >
                {/* Override PPS Checkbox - moved to additional settings */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="override-pps-model-advanced"
                    checked={overridePps}
                    onCheckedChange={(checked) => {
                      setOverridePps(!!checked);
                      if (!checked) {
                        // Reset to derived value when disabling override
                        updateDerivedPps();
                      }
                    }}
                  />
                  <Label htmlFor="override-pps-model-advanced" className="text-sm cursor-pointer">
                    Override price per share calculations
                  </Label>
                </div>

                {watchedRoundType === "priced" && (
                  <>
                    <FormField
                      control={form.control}
                      name="newSecurityClassId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Security Class</FormLabel>
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
                      name="optionPoolIncrease"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Option Pool Increase (%)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.1"
                              placeholder="e.g., 15"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
              </AdditionalSettings>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={modelMutation.isPending}>
                  {modelMutation.isPending ? "Modeling..." : "Model Round"}
                </Button>
              </div>
            </form>
          </Form>

          {/* Current Cap Table */}
          <Card>
            <CardHeader>
              <CardTitle>Current Cap Table</CardTitle>
            </CardHeader>
            <CardContent>
              {capTableData && capTableData.capTable ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Stakeholder</TableHead>
                      <TableHead>Security Class</TableHead>
                      <TableHead>Shares</TableHead>
                      <TableHead>Ownership %</TableHead>
                      <TableHead>Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {capTableData.capTable.map((row: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{row.stakeholder?.name || 'Unknown'}</TableCell>
                        <TableCell>{row.securityClass?.name || 'Unknown'}</TableCell>
                        <TableCell>{row.shares?.toLocaleString() || 0}</TableCell>
                        <TableCell>{((row.ownership || 0) * 100).toFixed(2)}%</TableCell>
                        <TableCell>{formatCurrency(row.value || 0)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  No cap table data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Projection Results */}
          {projection && (
            <Card>
              <CardHeader>
                <CardTitle>Round Projection</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Pre-Money Valuation</div>
                    <div className="text-2xl font-bold">{formatCurrency(projection.preMoneyValuation)}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Post-Money Valuation</div>
                    <div className="text-2xl font-bold">{formatCurrency(projection.postMoneyValuation)}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Price Per Share</div>
                    <div className="text-2xl font-bold">{formatCurrency(projection.pricePerShare)}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">New Shares Issued</div>
                    <div className="text-2xl font-bold">{projection.newShares?.toLocaleString() || 0}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Dilution</div>
                    <div className="text-2xl font-bold">{formatPercentage(projection.dilution)}</div>
                  </div>
                  {projection.optionPoolShares && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Option Pool Shares</div>
                      <div className="text-2xl font-bold">{projection.optionPoolShares?.toLocaleString() || 0}</div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    onClick={onCreateRound}
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? "Creating..." : "Create Round"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}