import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatMoney } from "@/utils/formatters";
import { Switch } from "@/components/ui/switch";

interface NoteConversionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  convertible: {
    id: string;
    holderName: string;
    principal: number;
    framework: string;
    discountRate?: number;
    valuationCap?: number;
    interestRate?: number;
    issueDate: string;
  };
}

interface NoteConversionCalculation {
  conversionPrice: number;
  sharesIssued: number;
  calculationMethod: 'discount' | 'cap' | 'round';
  principalAmount: number;
  interestAmount: number;
  totalAmount: number;
  details: {
    principal: number;
    interestAccrued: number;
    discountRate?: number;
    valuationCap?: number;
    effectivePrice: number;
    reasoning: string;
  };
}

export function NoteConversionDialog({
  open,
  onOpenChange,
  companyId,
  convertible,
}: NoteConversionDialogProps) {
  const [roundPricePerShare, setRoundPricePerShare] = useState("1.00");
  const [roundPreMoneyValuation, setRoundPreMoneyValuation] = useState("5000000");
  const [calculation, setCalculation] = useState<NoteConversionCalculation | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [useLatestRoundData, setUseLatestRoundData] = useState(true);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch cap table data to get latest round information
  const { data: capTableData } = useQuery<{
    stats: { pricePerShare?: number; currentValuation?: number; valuationSource?: string };
  }>({
    queryKey: ["/api/companies", companyId, "cap-table"],
    enabled: !!companyId && open,
  });

  // Auto-populate with latest round data when dialog opens
  useEffect(() => {
    if (open && capTableData?.stats && useLatestRoundData) {
      if (capTableData.stats.pricePerShare) {
        setRoundPricePerShare(capTableData.stats.pricePerShare.toString());
      }
      if (capTableData.stats.currentValuation) {
        setRoundPreMoneyValuation(capTableData.stats.currentValuation.toString());
      }
    }
  }, [open, capTableData, useLatestRoundData]);

  // Calculate conversion
  const calculateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(`/api/companies/${companyId}/convertibles/${convertible.id}/calculate-conversion`, {
        method: "POST",
        body: {
          roundPricePerShare: parseFloat(roundPricePerShare),
          roundPreMoneyValuation: parseFloat(roundPreMoneyValuation.replace(/,/g, ''))
        }
      });
      return response.calculation;
    },
    onSuccess: (calc) => {
      setCalculation(calc);
    },
    onError: (error: any) => {
      toast({
        title: "Calculation Error",
        description: error?.message || "Failed to calculate conversion",
        variant: "error",
      });
    },
  });

  // Execute conversion
  const convertMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/companies/${companyId}/convertibles/${convertible.id}/convert`, {
        method: "POST",
        body: {
          roundPricePerShare: parseFloat(roundPricePerShare),
          roundPreMoneyValuation: parseFloat(roundPreMoneyValuation.replace(/,/g, ''))
        }
      });
    },
    onSuccess: () => {
      toast({
        title: "Note Converted Successfully",
        description: `Convertible note has been converted to ${calculation?.sharesIssued.toLocaleString()} shares`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId, "convertibles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId, "cap-table"] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId, "activity"] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Conversion Failed",
        description: error?.message || "Failed to execute conversion",
        variant: "error",
      });
    },
  });

  // Auto-calculate when inputs change
  useEffect(() => {
    if (roundPricePerShare && roundPreMoneyValuation && open) {
      const price = parseFloat(roundPricePerShare);
      const valuation = parseFloat(roundPreMoneyValuation.replace(/,/g, ''));
      
      if (price > 0 && valuation > 0) {
        setIsCalculating(true);
        calculateMutation.mutate();
        setIsCalculating(false);
      }
    }
  }, [roundPricePerShare, roundPreMoneyValuation]);

  // Reset when dialog opens
  useEffect(() => {
    if (open) {
      setCalculation(null);
      setIsCalculating(false);
    }
  }, [open]);

  const daysSinceIssue = convertible.issueDate 
    ? Math.floor((new Date().getTime() - new Date(convertible.issueDate).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Convert Convertible Note</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Note Details */}
          <div className="bg-neutral-50 p-4 rounded-lg">
            <h3 className="font-semibold text-sm text-neutral-700 mb-3">Note Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-neutral-600">Holder:</span>
                <p className="font-medium">{convertible.holderName}</p>
              </div>
              <div>
                <span className="text-neutral-600">Principal:</span>
                <p className="font-medium">{formatMoney(convertible.principal)}</p>
              </div>
              <div>
                <span className="text-neutral-600">Interest Rate:</span>
                <p className="font-medium">{convertible.interestRate ? `${convertible.interestRate}%` : 'N/A'}</p>
              </div>
              <div>
                <span className="text-neutral-600">Days Accrued:</span>
                <p className="font-medium">{daysSinceIssue} days</p>
              </div>
              {convertible.discountRate && (
                <div>
                  <span className="text-neutral-600">Discount Rate:</span>
                  <p className="font-medium">{convertible.discountRate}%</p>
                </div>
              )}
              {convertible.valuationCap && (
                <div>
                  <span className="text-neutral-600">Valuation Cap:</span>
                  <p className="font-medium">{formatMoney(convertible.valuationCap)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Round Parameters */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch 
                checked={useLatestRoundData} 
                onCheckedChange={setUseLatestRoundData}
                data-testid="switch-use-latest-round"
              />
              <Label htmlFor="use-latest" className="text-sm">
                Use latest round data {capTableData?.stats?.valuationSource && `(${capTableData.stats.valuationSource})`}
              </Label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price-per-share">Round Price per Share</Label>
                <Input
                  id="price-per-share"
                  type="text"
                  inputMode="decimal"
                  value={roundPricePerShare}
                  onChange={(e) => setRoundPricePerShare(e.target.value)}
                  placeholder="1.00"
                  data-testid="input-round-price-per-share"
                />
              </div>
              <div>
                <Label htmlFor="pre-money-valuation">Pre-Money Valuation</Label>
                <Input
                  id="pre-money-valuation"
                  type="text"
                  inputMode="numeric"
                  value={roundPreMoneyValuation}
                  onChange={(e) => setRoundPreMoneyValuation(e.target.value)}
                  placeholder="5,000,000"
                  data-testid="input-pre-money-valuation"
                />
              </div>
            </div>
          </div>

          {/* Conversion Calculation */}
          {(isCalculating || calculateMutation.isPending) && (
            <div className="text-center py-4">
              <p className="text-neutral-600">Calculating conversion...</p>
            </div>
          )}

          {calculation && !isCalculating && !calculateMutation.isPending && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-sm text-blue-900 mb-3">Conversion Result</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-700">Principal Amount:</span>
                  <span className="font-medium">{formatMoney(calculation.principalAmount)}</span>
                </div>
                {calculation.interestAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-blue-700">Accrued Interest:</span>
                    <span className="font-medium">{formatMoney(calculation.interestAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold border-t pt-2">
                  <span className="text-blue-700">Total Converting:</span>
                  <span>{formatMoney(calculation.totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Conversion Price:</span>
                  <span className="font-medium">${calculation.conversionPrice.toFixed(4)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span className="text-blue-700">Shares Issued:</span>
                  <span>{calculation.sharesIssued.toLocaleString()}</span>
                </div>
                
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs text-blue-600">
                    <strong>Method:</strong> {calculation.details.reasoning}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-conversion">
            Cancel
          </Button>
          {calculation && (
            <Button 
              onClick={() => convertMutation.mutate()}
              disabled={convertMutation.isPending}
              data-testid="button-execute-conversion"
            >
              {convertMutation.isPending ? "Converting..." : "Execute Conversion"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}