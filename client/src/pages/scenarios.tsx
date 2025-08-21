import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { formatNumber } from "@/lib/formatters";
import { apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/layout/navigation";
import { Plus, Trash2, Save } from "lucide-react";

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
  const [scenarioName, setScenarioName] = useState("");
  const [scenarioDescription, setScenarioDescription] = useState("");

  const { data: company } = useQuery({
    queryKey: ["/api/companies", companyId],
    enabled: !!companyId,
  });

  const { data: capTable } = useQuery({
    queryKey: ["/api/companies", companyId, "cap-table"],
    enabled: !!companyId,
  });

  const { data: scenarios } = useQuery({
    queryKey: ["/api/companies", companyId, "scenarios"],
    enabled: !!companyId,
  });

  const saveScenarioMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest(`/api/companies/${companyId}/scenarios`, {
        method: "POST",
        body: data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId, "scenarios"] });
      toast({
        title: "Success",
        description: "Scenario saved successfully",
        variant: "success",
      });
      setScenarioName("");
      setScenarioDescription("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save scenario",
        variant: "error",
      });
    }
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

  const runScenario = async () => {
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

    const totalInvestment = investors.reduce((sum, inv) => sum + inv.investmentAmount, 0);
    
    if (Math.abs(totalInvestment - roundAmountValue) > 1) {
      toast({
        title: "Warning",
        description: `Total investor amounts ($${formatNumber(totalInvestment)}) don't match round amount ($${formatNumber(roundAmountValue)})`,
        variant: "warn",
      });
    }

    try {
      const response = await apiRequest(`/api/companies/${companyId}/rounds/model`, {
        method: "POST",
        body: {
          roundAmount: parseFloat(roundAmountValue.toString().replace(/,/g, '')),
          premoney: parseFloat(premoneyValue.toString().replace(/,/g, '')),
          investors: investors.filter(inv => inv.name && inv.investmentAmount > 0)
        },
      });

      const results = response;
      setModelingResults(results);
      
      toast({
        title: "Scenario Complete",
        description: "Modeling results are ready",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to model round scenario",
        variant: "error",
      });
    }
  };

  const saveScenario = () => {
    if (!modelingResults || !scenarioName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a scenario name and run the scenario first",
        variant: "error",
      });
      return;
    }

    saveScenarioMutation.mutate({
      name: scenarioName.trim(),
      description: scenarioDescription.trim() || null,
      roundAmount: parseFormattedNumber(roundAmount),
      premoney: parseFormattedNumber(premoney),
      investors: investors.filter(inv => inv.name && inv.investmentAmount > 0)
    });
  };

  const loadScenario = (scenario: any) => {
    setRoundAmount(formatNumberInput(scenario.roundAmount.toString()));
    setPremoney(formatNumberInput(scenario.premoney.toString()));
    setInvestors(scenario.investors.length > 0 ? scenario.investors : [{ id: "1", name: "", investmentAmount: 0 }]);
    setScenarioName(scenario.name);
    setScenarioDescription(scenario.description || "");
    setShowSavedScenarios(false);
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

          {/* Before/After Results Table (always visible) */}
          <Card>
            <CardHeader>
              <CardTitle>Modeling Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full table-auto border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Stakeholder</th>
                      <th className="text-right p-2">Current</th>
                      {modelingResults && <th className="text-right p-2">After</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {!modelingResults ? (
                      // Show current cap table only
                      (Array.isArray(capTable) ? capTable : capTable?.capTable || [])?.map((row: any) => (
                        <tr key={row.stakeholder?.id || Math.random()} className="border-b">
                          <td className="p-2">{row.stakeholder?.name || 'Unknown'}</td>
                          <td className="text-right p-2">{(row.ownership || 0).toFixed(2)}%</td>
                        </tr>
                      ))
                    ) : (
                      // Show before and after results
                      (modelingResults?.afterCapTable || []).map((row: any) => {
                        const beforeRow = (modelingResults?.beforeCapTable || []).find((b: any) => 
                          b.stakeholder?.id === row.stakeholder?.id
                        );
                        return (
                          <tr key={row.stakeholder?.id || Math.random()} className="border-b">
                            <td className="p-2">{row.stakeholder?.name || 'Unknown'}</td>
                            <td className="text-right p-2">{(beforeRow?.ownership || 0).toFixed(2)}%</td>
                            <td className="text-right p-2">{(row.ownership || 0).toFixed(2)}%</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>



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

                  {/* Save Scenario Section */}
                  {modelingResults && (
                    <div className="space-y-3 pt-4 border-t">
                      <Label>Save Scenario</Label>
                      <div>
                        <Input
                          placeholder="Scenario name"
                          value={scenarioName}
                          onChange={(e) => setScenarioName(e.target.value)}
                        />
                      </div>
                      <div>
                        <Textarea
                          placeholder="Description (optional)"
                          value={scenarioDescription}
                          onChange={(e) => setScenarioDescription(e.target.value)}
                          rows={2}
                        />
                      </div>
                      <Button 
                        onClick={saveScenario} 
                        disabled={saveScenarioMutation.isPending || !scenarioName.trim()}
                        className="w-full"
                        variant="outline"
                      >
                        <Save className="h-4 w-4 mr-1" />
                        Save Scenario
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Results Panel */}
              <Card>
                <CardHeader>
                  <CardTitle>Modeling Results</CardTitle>
                </CardHeader>
                <CardContent>
                  {modelingResults ? (
                    <div className="space-y-6">
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

                      {/* Conversion Tools Section */}
                      <div className="border-t pt-6">
                        <h4 className="text-sm font-medium mb-4">Conversion Tools</h4>
                        <div className="space-y-3">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              // Convert outstanding options to shares
                              toast({
                                title: "Convert Options",
                                description: "Options conversion feature coming soon",
                                variant: "info"
                              });
                            }}
                          >
                            Convert Outstanding Options to Shares
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              // Convert SAFEs to shares
                              toast({
                                title: "Convert SAFEs",
                                description: "SAFE conversion feature coming soon",
                                variant: "info"
                              });
                            }}
                          >
                            Convert SAFEs to Shares
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              // Convert convertible notes to shares
                              toast({
                                title: "Convert Notes",
                                description: "Convertible note conversion feature coming soon",
                                variant: "info"
                              });
                            }}
                          >
                            Convert Convertible Notes to Shares
                          </Button>
                        </div>
                      </div>
                      
                      {/* Before/After Comparison */}
                      <div className="space-y-4">
                        <div className="text-sm font-medium text-neutral-700">Cap Table Before & After</div>
                        
                        {/* Before */}
                        <div>
                          <div className="text-xs font-medium text-neutral-500 mb-2">BEFORE</div>
                          <div className="space-y-1">
                            {modelingResults.beforeCapTable?.map((row: any, index: number) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span>{row.stakeholder?.name}</span>
                                <span>{row.ownership?.toFixed(1)}%</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* After */}
                        <div>
                          <div className="text-xs font-medium text-neutral-500 mb-2">AFTER</div>
                          <div className="space-y-1">
                            {modelingResults.afterCapTable?.map((row: any, index: number) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span>{row.stakeholder?.name}</span>
                                <span>{row.ownership?.toFixed(1)}%</span>
                              </div>
                            ))}
                          </div>
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
                {scenarios && Array.isArray(scenarios) && scenarios.length > 0 ? (
                  <div className="space-y-3">
                    {scenarios.map((scenario: any) => (
                      <div key={scenario.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{scenario.name}</h4>
                            {scenario.description && (
                              <p className="text-sm text-neutral-600 mt-1">{scenario.description}</p>
                            )}
                            <div className="text-xs text-neutral-500 mt-2">
                              Round: ${formatNumber(scenario.roundAmount)} | 
                              Pre-money: ${formatNumber(scenario.premoney)} | 
                              {scenario.investors.length} investor(s)
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => loadScenario(scenario)}
                          >
                            Load
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-neutral-500 py-8">
                    <div className="text-lg mb-2">No saved scenarios</div>
                    <div className="text-sm">
                      Create and save scenarios to compare different fundraising options
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}