import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { formatNumber } from "@/lib/formatters";
import Navigation from "@/components/layout/navigation";
import { Plus, Trash2 } from "lucide-react";

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

export default function ScenariosPage() {
  const { companyId } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [roundAmount, setRoundAmount] = useState("");
  const [premoney, setPremoney] = useState("");
  const [investors, setInvestors] = useState<Investor[]>([
    { id: "1", name: "", investmentAmount: 0 }
  ]);
  const [modelingResults, setModelingResults] = useState<ModelingResults | null>(null);
  const [showSavedScenarios, setShowSavedScenarios] = useState(false);

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
      inv.id === id ? { ...inv, [field]: value } : inv
    ));
  };

  const runScenario = () => {
    const roundAmountValue = parseFormattedNumber(roundAmount);
    const premoneyValue = parseFormattedNumber(premoney);
    
    if (!roundAmountValue || !premoneyValue) {
      toast({
        title: "Error",
        description: "Please enter valid round amount and pre-money valuation",
        variant: "error",
      });
      return;
    }

    // Simple scenario modeling logic
    const postMoney = premoneyValue + roundAmountValue;
    const totalInvestment = investors.reduce((sum, inv) => sum + inv.investmentAmount, 0);
    
    if (totalInvestment !== roundAmountValue) {
      toast({
        title: "Warning",
        description: "Total investor amounts don't match round amount",
        variant: "warn",
      });
    }

    const results: ModelingResults = {
      beforeCapTable: Array.isArray(capTable) ? capTable : [],
      afterCapTable: [], // Would be calculated based on dilution
      newShares: Math.round((roundAmountValue / postMoney) * 1000000), // Assuming 1M shares
      totalRaised: roundAmountValue,
      postMoneyValuation: postMoney,
    };

    setModelingResults(results);
    toast({
      title: "Scenario Complete",
      description: "Modeling results are ready",
      variant: "success",
    });
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-neutral-900">Fundraising Scenarios</h1>
            <Button onClick={() => setShowSavedScenarios(!showSavedScenarios)}>
              {showSavedScenarios ? "New Scenario" : "Saved Scenarios"}
            </Button>
          </div>

          {!showSavedScenarios ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Input Panel */}
              <Card>
                <CardHeader>
                  <CardTitle>Scenario Parameters</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="round-amount">Round Amount ($)</Label>
                    <Input
                      id="round-amount"
                      value={roundAmount}
                      onChange={(e) => handleRoundAmountChange(e.target.value)}
                      placeholder="e.g., 1,000,000"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="premoney">Pre-money Valuation ($)</Label>
                    <Input
                      id="premoney"
                      value={premoney}
                      onChange={(e) => handlePremoneyChange(e.target.value)}
                      placeholder="e.g., 5,000,000"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Investors</Label>
                      <Button size="sm" onClick={addInvestor}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </div>
                    
                    {investors.map((investor) => (
                      <div key={investor.id} className="flex gap-2 items-end">
                        <div className="flex-1">
                          <Label htmlFor={`investor-name-${investor.id}`}>Name</Label>
                          <Input
                            id={`investor-name-${investor.id}`}
                            value={investor.name}
                            onChange={(e) => updateInvestor(investor.id, "name", e.target.value)}
                            placeholder="Investor name"
                          />
                        </div>
                        <div className="flex-1">
                          <Label htmlFor={`investor-amount-${investor.id}`}>Amount ($)</Label>
                          <Input
                            id={`investor-amount-${investor.id}`}
                            type="number"
                            value={investor.investmentAmount}
                            onChange={(e) => updateInvestor(investor.id, "investmentAmount", parseFloat(e.target.value) || 0)}
                            placeholder="0"
                          />
                        </div>
                        {investors.length > 1 && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => removeInvestor(investor.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>

                  <Button onClick={runScenario} className="w-full">
                    Run Scenario
                  </Button>
                </CardContent>
              </Card>

              {/* Results Panel */}
              <Card>
                <CardHeader>
                  <CardTitle>Modeling Results</CardTitle>
                </CardHeader>
                <CardContent>
                  {modelingResults ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-neutral-500">Post-money Valuation</div>
                          <div className="text-lg font-semibold">
                            ${formatNumber(modelingResults.postMoneyValuation)}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-neutral-500">New Shares Issued</div>
                          <div className="text-lg font-semibold">
                            {formatNumber(modelingResults.newShares)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="pt-4 border-t">
                        <div className="text-sm text-neutral-500 mb-2">Cap Table Impact</div>
                        <div className="text-sm text-neutral-600">
                          Scenario modeling complete. The new investment would result in dilution 
                          across existing shareholders based on the post-money valuation.
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-neutral-500 py-8">
                      <div className="text-lg mb-2">No scenario results yet</div>
                      <div className="text-sm">
                        Enter parameters and run a scenario to see the impact on your cap table
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Saved Scenarios</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center text-neutral-500 py-8">
                  <div className="text-lg mb-2">No saved scenarios</div>
                  <div className="text-sm">
                    Create and save scenarios to compare different fundraising options
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}