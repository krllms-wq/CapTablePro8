import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { formatNumber } from "@/lib/formatters";
import { apiRequest } from "@/lib/queryClient";
import ResponsiveNavigation from "@/components/layout/responsive-navigation";
import { Plus, Trash2, Save, FileText } from "lucide-react";

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
  dilutionImpact: any[];
}

interface Scenario {
  id: string;
  name: string;
  description: string;
  roundAmount: number;
  premoney: number;
  investors: Investor[];
  results: ModelingResults;
  createdAt: string;
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
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
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

  const { data: savedScenarios, refetch: refetchScenarios } = useQuery({
    queryKey: ["/api/companies", companyId, "scenarios"],
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

    // Calculate dilution impact
    const newShares = Math.round((roundAmountValue / postMoney) * 1000000);
    const totalSharesBefore = Array.isArray(capTable) ? 
      capTable.reduce((sum: number, item: any) => sum + (item.shares || 0), 0) : 1000000;
    const totalSharesAfter = totalSharesBefore + newShares;
    
    // Create after cap table with dilution
    const afterCapTable = Array.isArray(capTable) ? capTable.map((item: any) => ({
      ...item,
      sharesAfter: item.shares,
      ownershipBefore: (item.shares / totalSharesBefore) * 100,
      ownershipAfter: (item.shares / totalSharesAfter) * 100,
      dilution: ((item.shares / totalSharesBefore) - (item.shares / totalSharesAfter)) * 100
    })) : [];

    // Add new investors
    investors.forEach(investor => {
      if (investor.name && investor.investmentAmount > 0) {
        const investorShares = Math.round((investor.investmentAmount / postMoney) * 1000000);
        afterCapTable.push({
          stakeholder: investor.name,
          shares: investorShares,
          sharesAfter: investorShares,
          ownershipBefore: 0,
          ownershipAfter: (investorShares / totalSharesAfter) * 100,
          dilution: 0,
          value: investor.investmentAmount
        });
      }
    });

    const results: ModelingResults = {
      beforeCapTable: Array.isArray(capTable) ? capTable : [],
      afterCapTable,
      newShares,
      totalRaised: roundAmountValue,
      postMoneyValuation: postMoney,
      dilutionImpact: afterCapTable
    };

    setModelingResults(results);
    toast({
      title: "Scenario Complete",
      description: "Modeling results are ready",
      variant: "success",
    });
  };

  // Save scenario mutation
  const saveScenarioMutation = useMutation({
    mutationFn: async (data: { name: string; description: string }) => {
      return apiRequest(`/api/companies/${companyId}/scenarios`, {
        method: "POST",
        body: {
          name: data.name,
          description: data.description,
          roundAmount: parseFloat(roundAmount.replace(/,/g, '')),
          premoney: parseFloat(premoney.replace(/,/g, '')),
          investors: investors.filter(inv => inv.name && inv.investmentAmount > 0),
          results: modelingResults
        }
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Scenario saved successfully",
        variant: "success",
      });
      setSaveDialogOpen(false);
      setScenarioName("");
      setScenarioDescription("");
      refetchScenarios();
    },
    onError: (error: any) => {
      toast({
        title: "Error", 
        description: error?.message || "Failed to save scenario",
        variant: "error",
      });
    }
  });

  const saveScenario = () => {
    if (!scenarioName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a scenario name",
        variant: "error",
      });
      return;
    }
    
    if (!modelingResults) {
      toast({
        title: "Error", 
        description: "Please run a scenario first",
        variant: "error",
      });
      return;
    }

    saveScenarioMutation.mutate({
      name: scenarioName,
      description: scenarioDescription
    });
  };

  const loadScenario = (scenario: Scenario) => {
    setRoundAmount(formatNumberInput(scenario.roundAmount.toString()));
    setPremoney(formatNumberInput(scenario.premoney.toString()));
    setInvestors(scenario.investors);
    setModelingResults(scenario.results);
    setShowSavedScenarios(false);
    
    toast({
      title: "Loaded",
      description: `Scenario "${scenario.name}" loaded`,
      variant: "success",
    });
  };

  return (
    <ResponsiveNavigation>
      <div className="max-w-7xl mx-auto responsive-padding">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">Fundraising Scenarios</h1>
            <div className="flex gap-2">
              {modelingResults && !showSavedScenarios && (
                <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Save className="h-4 w-4 mr-2" />
                      Save Scenario
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Save Scenario</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="scenario-name">Scenario Name</Label>
                        <Input
                          id="scenario-name"
                          value={scenarioName}
                          onChange={(e) => setScenarioName(e.target.value)}
                          placeholder="e.g., Series A Round"
                        />
                      </div>
                      <div>
                        <Label htmlFor="scenario-description">Description (Optional)</Label>
                        <Textarea
                          id="scenario-description"
                          value={scenarioDescription}
                          onChange={(e) => setScenarioDescription(e.target.value)}
                          placeholder="Additional notes about this scenario..."
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={saveScenario} disabled={saveScenarioMutation.isPending}>
                          {saveScenarioMutation.isPending ? "Saving..." : "Save"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
              <Button onClick={() => setShowSavedScenarios(!showSavedScenarios)}>
                <FileText className="h-4 w-4 mr-2" />
                {showSavedScenarios ? "New Scenario" : "Saved Scenarios"}
              </Button>
            </div>
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
                    <div className="space-y-6">
                      {/* Summary Stats */}
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

                      {/* Before/After Cap Table */}
                      <div className="border-t pt-6">
                        <h4 className="text-sm font-medium text-neutral-900 mb-4">Cap Table Comparison</h4>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Before */}
                          <div>
                            <h5 className="text-sm font-medium text-neutral-700 mb-3">Before Investment</h5>
                            <div className="border rounded-lg overflow-hidden">
                              <div className="bg-neutral-50 px-4 py-2 grid grid-cols-3 text-xs font-medium text-neutral-600">
                                <div>Stakeholder</div>
                                <div className="text-right">Shares</div>
                                <div className="text-right">Ownership</div>
                              </div>
                              {modelingResults.beforeCapTable.slice(0, 5).map((item: any, idx: number) => (
                                <div key={idx} className="px-4 py-2 grid grid-cols-3 border-t text-sm">
                                  <div className="truncate">{item.stakeholder || 'Unknown'}</div>
                                  <div className="text-right">{formatNumber(item.shares || 0)}</div>
                                  <div className="text-right">{((item.shares || 0) / 1000000 * 100).toFixed(1)}%</div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* After */}
                          <div>
                            <h5 className="text-sm font-medium text-neutral-700 mb-3">After Investment</h5>
                            <div className="border rounded-lg overflow-hidden">
                              <div className="bg-neutral-50 px-4 py-2 grid grid-cols-4 text-xs font-medium text-neutral-600">
                                <div>Stakeholder</div>
                                <div className="text-right">Shares</div>
                                <div className="text-right">Ownership</div>
                                <div className="text-right">Dilution</div>
                              </div>
                              {modelingResults.afterCapTable.slice(0, 6).map((item: any, idx: number) => (
                                <div key={idx} className="px-4 py-2 grid grid-cols-4 border-t text-sm">
                                  <div className="truncate">{item.stakeholder || 'Unknown'}</div>
                                  <div className="text-right">{formatNumber(item.sharesAfter || item.shares || 0)}</div>
                                  <div className="text-right">{(item.ownershipAfter || 0).toFixed(1)}%</div>
                                  <div className="text-right text-red-600">
                                    {item.dilution ? `${item.dilution.toFixed(1)}%` : '-'}
                                  </div>
                                </div>
                              ))}
                            </div>
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
                {Array.isArray(savedScenarios) && savedScenarios.length > 0 ? (
                  <div className="space-y-4">
                    {(savedScenarios as Scenario[]).map((scenario: Scenario) => (
                      <div key={scenario.id} className="border rounded-lg p-4 hover:bg-neutral-50 cursor-pointer"
                           onClick={() => loadScenario(scenario)}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-neutral-900">{scenario.name}</h4>
                            {scenario.description && (
                              <p className="text-sm text-neutral-600 mt-1">{scenario.description}</p>
                            )}
                            <div className="flex gap-4 mt-2 text-xs text-neutral-500">
                              <span>Round: ${formatNumber(scenario.roundAmount)}</span>
                              <span>Pre-money: ${formatNumber(scenario.premoney)}</span>
                              <span>{scenario.investors.length} investor(s)</span>
                            </div>
                          </div>
                          <div className="text-xs text-neutral-400">
                            {new Date(scenario.createdAt).toLocaleDateString()}
                          </div>
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
    </ResponsiveNavigation>
  );
}