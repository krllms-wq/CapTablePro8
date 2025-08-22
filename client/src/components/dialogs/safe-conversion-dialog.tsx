import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency, formatNumber } from "@/lib/formatters";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface SAFEConversionDialogProps {
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
  };
}

interface ConversionCalculation {
  conversionPrice: number;
  sharesIssued: number;
  calculationMethod: 'discount' | 'cap' | 'mfn';
  details: {
    principal: number;
    effectivePrice: number;
    reasoning: string;
  };
}

export function SAFEConversionDialog({
  open,
  onOpenChange,
  companyId,
  convertible,
}: SAFEConversionDialogProps) {
  const [roundPricePerShare, setRoundPricePerShare] = useState("1.00");
  const [roundPreMoneyValuation, setRoundPreMoneyValuation] = useState("5000000");
  const [calculation, setCalculation] = useState<ConversionCalculation | null>(null);
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
        title: "Ошибка расчета",
        description: error.message || "Не удалось рассчитать конвертацию",
        variant: "destructive",
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
        title: "SAFE конвертирован",
        description: `${convertible.holderName} получил ${formatNumber(calculation?.sharesIssued || 0)} акций`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId, "cap-table"] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId, "convertibles"] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка конвертации",
        description: error.message || "Не удалось выполнить конвертацию",
        variant: "destructive",
      });
    },
  });

  const handleCalculate = () => {
    setIsCalculating(true);
    calculateMutation.mutate();
  };

  const handleConvert = () => {
    if (calculation) {
      convertMutation.mutate();
    }
  };

  const resetForm = () => {
    setCalculation(null);
    setIsCalculating(false);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => { onOpenChange(open); if (!open) resetForm(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Convert SAFE to Shares</DialogTitle>
          <DialogDescription>
            Convert {convertible.holderName}'s SAFE ({formatCurrency(convertible.principal)}) to common shares
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* SAFE Details */}
          <div className="bg-slate-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">SAFE Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-600">Investor:</span> {convertible.holderName}
              </div>
              <div>
                <span className="text-slate-600">Principal:</span> {formatCurrency(convertible.principal)}
              </div>
              <div>
                <span className="text-slate-600">Discount:</span> {convertible.discountRate ? `${convertible.discountRate}%` : 'None'}
              </div>
              <div>
                <span className="text-slate-600">Valuation Cap:</span> {convertible.valuationCap ? formatCurrency(convertible.valuationCap) : 'None'}
              </div>
            </div>
          </div>

          {/* Latest Round Info Alert */}
          {capTableData?.stats && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <span>
                    Latest round data: ${capTableData.stats.pricePerShare || roundPricePerShare} per share, 
                    {formatCurrency(capTableData.stats.currentValuation || parseInt(roundPreMoneyValuation))} valuation
                    {capTableData.stats.valuationSource && ` (${capTableData.stats.valuationSource})`}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setUseLatestRoundData(!useLatestRoundData)}
                  >
                    {useLatestRoundData ? 'Modify Terms' : 'Use Round Data'}
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Round Parameters */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="roundPrice">Round Price Per Share ($)</Label>
              <Input
                id="roundPrice"
                type="number"
                step="0.01"
                value={roundPricePerShare}
                onChange={(e) => {
                  setRoundPricePerShare(e.target.value);
                  setUseLatestRoundData(false); // Manual change disables auto-sync
                }}
                placeholder="1.00"
                disabled={useLatestRoundData}
              />
            </div>
            <div>
              <Label htmlFor="preMoneyVal">Pre-money Valuation ($)</Label>
              <Input
                id="preMoneyVal"
                value={roundPreMoneyValuation}
                onChange={(e) => {
                  setRoundPreMoneyValuation(e.target.value);
                  setUseLatestRoundData(false); // Manual change disables auto-sync
                }}
                placeholder="5,000,000"
                disabled={useLatestRoundData}
              />
            </div>
          </div>

          {/* Calculate Button */}
          <Button 
            onClick={handleCalculate} 
            disabled={calculateMutation.isPending}
            className="w-full"
          >
            {calculateMutation.isPending ? "Рассчитываем..." : "Рассчитать конвертацию"}
          </Button>

          {/* Calculation Results */}
          {calculation && (
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-3">Результаты конвертации</h3>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-green-700">Цена конвертации:</span>
                  <div className="font-mono font-semibold">${calculation.conversionPrice.toFixed(4)}</div>
                </div>
                <div>
                  <span className="text-green-700">Акций к выпуску:</span>
                  <div className="font-mono font-semibold">{formatNumber(calculation.sharesIssued)}</div>
                </div>
              </div>
              
              <div className="mt-3 p-3 bg-white rounded border">
                <div className="text-xs text-green-700 mb-1">Объяснение:</div>
                <div className="text-sm">{calculation.details.reasoning}</div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          {calculation && (
            <Button 
              onClick={handleConvert}
              disabled={convertMutation.isPending}
            >
              {convertMutation.isPending ? "Конвертируем..." : "Выполнить конвертацию"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}