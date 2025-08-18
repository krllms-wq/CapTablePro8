import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatNumber, formatCurrency, formatPercentage } from "@/lib/formatters";
import { apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/layout/navigation";
import { useToast } from "@/hooks/use-toast";

interface Investor {
  id: string;
  name: string;
  investmentAmount: number;
}

interface ModelingResults {
  beforeCapTable: any[];
  afterCapTable: any[];
  newShares: number;
  totalRaised: number;
  postMoneyValuation: number;
}

export default function Scenarios() {
  const { companyId } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [roundAmount, setRoundAmount] = useState("");
  const [premoney, setPremoney] = useState("");
  const [investors, setInvestors] = useState<Investor[]>([
    { id: "1", name: "", investmentAmount: 0 }
  ]);
  const [modelingResults, setModelingResults] = useState<ModelingResults | null>(null);

  const { data: company } = useQuery({
    queryKey: ["/api/companies", companyId],
    enabled: !!companyId,
  });

  const { data: capTable } = useQuery({
    queryKey: ["/api/companies", companyId, "cap-table"],
    enabled: !!companyId,
  });

  // Format number input with commas
  const formatNumberInput = (value: string) => {
    // Remove non-numeric characters except dots
    const cleanValue = value.replace(/[^\d.]/g, '');
    // Split by decimal point
    const parts = cleanValue.split('.');
    // Add commas to integer part
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    // Return formatted value
    return parts.length > 1 ? `${parts[0]}.${parts[1]}` : parts[0];
  };

  // Parse formatted number back to numeric value
  const parseFormattedNumber = (value: string) => {
    return parseFloat(value.replace(/,/g, '')) || 0;
  };

  const handleRoundAmountChange = (value: string) => {
    setRoundAmount(formatNumberInput(value));
  };

  const handlePremoneyChange = (value: string) => {
    setPremoney(formatNumberInput(value));
  };

  const addInvestor = () => {
    const newInvestor: Investor = {
      id: Date.now().toString(),
      name: "",
      investmentAmount: 0
    };
    setInvestors([...investors, newInvestor]);
  };

  const removeInvestor = (id: string) => {
    if (investors.length > 1) {
      setInvestors(investors.filter(inv => inv.id !== id));
    }
  };

  const updateInvestor = (id: string, field: keyof Investor, value: string | number) => {
    setInvestors(investors.map(inv => 
      inv.id === id 
        ? { ...inv, [field]: field === 'investmentAmount' ? parseFormattedNumber(value as string) : value }
        : inv
    ));
  };

  const modelRoundMutation = useMutation({
    mutationFn: async () => {
      const totalInvestment = investors.reduce((sum, inv) => sum + inv.investmentAmount, 0);
      const premoneyVal = parseFormattedNumber(premoney);
      
      return apiRequest("POST", `/api/companies/${companyId}/rounds/model`, {
        roundAmount: totalInvestment,
        premoney: premoneyVal,
        investors: investors.filter(inv => inv.name && inv.investmentAmount > 0)
      });
    },
    onSuccess: (data: any) => {
      setModelingResults(data);
      toast({
        title: "Round modeled successfully",
        description: "Review the before and after cap table comparison below",
      });
    },
    onError: (error) => {
      toast({
        title: "Error modeling round",
        description: "Please check your inputs and try again",
        variant: "destructive",
      });
    },
  });

  const totalInvestment = investors.reduce((sum, inv) => sum + inv.investmentAmount, 0);

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-neutral-900">Funding Round Modeling</h1>
            <Button onClick={() => setModelingResults(null)}>
              <i className="fas fa-plus mr-2"></i>
              New Scenario
            </Button>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Input Panel */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
              <div className="px-6 py-4 border-b border-neutral-200">
                <h3 className="text-lg font-semibold text-neutral-900">Round Parameters</h3>
                <p className="text-sm text-neutral-500">Configure the funding round details</p>
              </div>
              <div className="p-6 space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="premoney">Pre-money Valuation</Label>
                    <Input
                      id="premoney"
                      value={premoney}
                      onChange={(e) => handlePremoneyChange(e.target.value)}
                      placeholder="e.g., 10,000,000"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">Investors</Label>
                    <Button onClick={addInvestor} size="sm" variant="outline">
                      <i className="fas fa-plus mr-2"></i>
                      Add Investor
                    </Button>
                  </div>
                  
                  {investors.map((investor, index) => (
                    <div key={investor.id} className="bg-neutral-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-neutral-700">
                          Investor {index + 1}
                        </span>
                        {investors.length > 1 && (
                          <Button
                            onClick={() => removeInvestor(investor.id)}
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:text-red-700"
                          >
                            <i className="fas fa-trash"></i>
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        <div>
                          <Label htmlFor={`investor-name-${investor.id}`}>Investor Name</Label>
                          <Input
                            id={`investor-name-${investor.id}`}
                            value={investor.name}
                            onChange={(e) => updateInvestor(investor.id, 'name', e.target.value)}
                            placeholder="e.g., Acme Ventures"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`investor-amount-${investor.id}`}>Investment Amount</Label>
                          <Input
                            id={`investor-amount-${investor.id}`}
                            value={formatNumberInput(investor.investmentAmount.toString())}
                            onChange={(e) => updateInvestor(investor.id, 'investmentAmount', e.target.value)}
                            placeholder="e.g., 1,000,000"
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-blue-900">Total Round Size</span>
                      <span className="text-lg font-semibold text-blue-900">
                        {formatCurrency(totalInvestment)}
                      </span>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={() => modelRoundMutation.mutate()}
                  disabled={!totalInvestment || !parseFormattedNumber(premoney) || modelRoundMutation.isPending}
                  className="w-full"
                >
                  {modelRoundMutation.isPending ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Modeling Round...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-calculator mr-2"></i>
                      Model Round
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Results Panel */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
              <div className="px-6 py-4 border-b border-neutral-200">
                <h3 className="text-lg font-semibold text-neutral-900">Modeling Results</h3>
                <p className="text-sm text-neutral-500">Round impact analysis</p>
              </div>
              <div className="p-6">
                {!modelingResults ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <i className="fas fa-calculator text-2xl text-neutral-400"></i>
                    </div>
                    <p className="text-neutral-500">Configure round parameters and click "Model Round" to see results</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-green-50 rounded-lg p-4">
                        <div className="text-sm text-green-700 font-medium">Total Raised</div>
                        <div className="text-xl font-semibold text-green-900">
                          {formatCurrency(modelingResults.totalRaised)}
                        </div>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="text-sm text-blue-700 font-medium">Post-Money Valuation</div>
                        <div className="text-xl font-semibold text-blue-900">
                          {formatCurrency(modelingResults.postMoneyValuation)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="text-sm text-purple-700 font-medium">New Shares Issued</div>
                      <div className="text-xl font-semibold text-purple-900">
                        {formatNumber(modelingResults.newShares)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Cap Table Comparison */}
          {modelingResults && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-neutral-900">Cap Table Comparison</h2>
              
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Before */}
                <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
                  <div className="px-6 py-4 border-b border-neutral-200">
                    <h3 className="text-lg font-semibold text-neutral-900">Before Round</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-neutral-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase">
                            Stakeholder
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-600 uppercase">
                            Shares
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-600 uppercase">
                            %
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-200">
                        {(modelingResults.beforeCapTable || []).map((row: any, index: number) => (
                          <tr key={index} className="hover:bg-neutral-50">
                            <td className="px-4 py-3 text-sm font-medium text-neutral-900">
                              {row.stakeholder?.name || "Unknown"}
                            </td>
                            <td className="px-4 py-3 text-sm text-neutral-900 text-right font-mono">
                              {formatNumber(row.shares)}
                            </td>
                            <td className="px-4 py-3 text-sm font-semibold text-neutral-900 text-right">
                              {formatPercentage(row.ownership)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* After */}
                <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
                  <div className="px-6 py-4 border-b border-neutral-200">
                    <h3 className="text-lg font-semibold text-neutral-900">After Round</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-neutral-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase">
                            Stakeholder
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-600 uppercase">
                            Shares
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-600 uppercase">
                            %
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-200">
                        {(modelingResults.afterCapTable || []).map((row: any, index: number) => (
                          <tr key={index} className="hover:bg-neutral-50">
                            <td className="px-4 py-3 text-sm font-medium text-neutral-900">
                              {row.stakeholder?.name || "Unknown"}
                            </td>
                            <td className="px-4 py-3 text-sm text-neutral-900 text-right font-mono">
                              {formatNumber(row.shares)}
                            </td>
                            <td className="px-4 py-3 text-sm font-semibold text-neutral-900 text-right">
                              {formatPercentage(row.ownership)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}