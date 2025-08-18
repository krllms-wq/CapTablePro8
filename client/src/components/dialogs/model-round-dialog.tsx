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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatPercentage } from "@/lib/formatters";
import type { SecurityClass } from "@shared/schema";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const modelRoundSchema = z.object({
  name: z.string().min(1, "Round name is required"),
  roundType: z.enum(["priced", "convertible"]),
  raiseAmount: z.string().min(1, "Raise amount is required").transform(val => parseFloat(val)),
  preMoneyValuation: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  pricePerShare: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  newSecurityClassId: z.string().optional(),
  optionPoolIncrease: z.string().optional().transform(val => val ? parseFloat(val) / 100 : undefined),
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

  const { data: securityClasses } = useQuery<SecurityClass[]>({
    queryKey: ["/api/companies", companyId, "security-classes"],
    enabled: !!companyId && open,
  });

  // Get current cap table for display
  const { data: capTableData } = useQuery({
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

  const modelMutation = useMutation({
    mutationFn: async (data: ModelRoundFormData) => {
      return apiRequest("POST", `/api/companies/${companyId}/rounds/model`, data);
    },
    onSuccess: (data: RoundProjection) => {
      setProjection(data);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to model round",
        variant: "destructive",
      });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ModelRoundFormData) => {
      const payload = {
        ...data,
        closeDate: new Date().toISOString(),
      };
      return apiRequest("POST", `/api/companies/${companyId}/rounds`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId] });
      toast({
        title: "Success",
        description: "Round created successfully",
      });
      form.reset();
      setProjection(null);
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create round",
        variant: "destructive",
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
            <form onSubmit={form.handleSubmit(onModelRound)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Round Name</FormLabel>
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
                    <FormLabel>Round Type</FormLabel>
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

              <FormField
                control={form.control}
                name="raiseAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Raise Amount ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="e.g., 5000000"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {watchedRoundType === "priced" && (
                <>
                  <FormField
                    control={form.control}
                    name="preMoneyValuation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pre-Money Valuation ($)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="e.g., 20000000"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
              {capTableData?.capTable ? (
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