import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { formatNumber, formatCurrency } from "@/lib/formatters";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useUrlFilters, useUrlSort } from "@/hooks/useUrlState";
import { useHistoryState } from "@/hooks/useHistoryState";
import { useAutosave } from "@/hooks/useAutosave";
import { EnhancedInput } from "@/components/ui/enhanced-input";
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from "@/components/ui/breadcrumb";
import Navigation from "@/components/layout/navigation";
import { 
  Undo2, Redo2, Save, Plus, Edit, Trash2, Eye, Play, 
  Calculator, TrendingUp, PieChart, BarChart3, Target,
  Calendar, DollarSign
} from "lucide-react";

export default function EnhancedScenarios() {
  const { companyId } = useParams();
  const { toast } = useToast();
  
  // Enhanced state management with history and autosave
  const {
    value: scenarioState,
    setValue: setScenarioState,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useHistoryState({
    roundAmount: 1000000,
    premoney: 5000000,
    investors: [{ name: "", amount: 0 }],
  });

  const [filters, setFilters] = useUrlFilters({
    search: "",
    sortBy: "recent",
  });

  const [showNewScenario, setShowNewScenario] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<any>(null);
  const [showScenarioDetail, setShowScenarioDetail] = useState(false);
  const [isModelingRound, setIsModelingRound] = useState(false);

  // Autosave functionality for round modeling
  const { saveStatus, statusDisplay } = useAutosave({
    key: "scenario-draft",
    data: scenarioState,
    interval: 3000,
    onSave: async (data) => {
      console.log("Auto-saving scenario draft:", data);
    },
  });

  const { data: scenarios, isLoading } = useQuery({
    queryKey: ["/api/companies", companyId, "scenarios"],
    enabled: !!companyId,
  });

  const { data: company } = useQuery({
    queryKey: ["/api/companies", companyId],
    enabled: !!companyId,
  });

  const { data: capTable } = useQuery({
    queryKey: ["/api/companies", companyId, "cap-table"],
    enabled: !!companyId,
  });

  const createScenarioMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest(`/api/companies/${companyId}/scenarios`, {
        method: "POST",
        body: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId, "scenarios"] });
      setShowNewScenario(false);
      toast({
        title: "Scenario saved",
        description: "Funding round scenario saved successfully",
        variant: "success",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Save failed",
        description: error.message || "Failed to save scenario",
        variant: "error",
      });
    },
  });

  const deleteScenarioMutation = useMutation({
    mutationFn: async (scenarioId: string) => {
      return apiRequest(`/api/companies/${companyId}/scenarios/${scenarioId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId, "scenarios"] });
      toast({
        title: "Scenario deleted",
        description: "Scenario removed successfully",
        variant: "success",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete scenario",
        variant: "error",
      });
    },
  });

  const handleSaveScenario = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data = {
      name: formData.get("name"),
      description: formData.get("description"),
      roundAmount: scenarioState.roundAmount,
      premoney: scenarioState.premoney,
      investors: scenarioState.investors,
    };
    createScenarioMutation.mutate(data);
  };

  const handleDeleteScenario = (scenarioId: string) => {
    if (confirm("Are you sure you want to delete this scenario? This action cannot be undone.")) {
      deleteScenarioMutation.mutate(scenarioId);
    }
  };

  const handleLoadScenario = (scenario: any) => {
    setScenarioState({
      roundAmount: scenario.roundAmount,
      premoney: scenario.premoney,
      investors: scenario.investors,
    });
    setIsModelingRound(true);
    toast({
      title: "Scenario loaded",
      description: `Loaded "${scenario.name}" for modeling`,
      variant: "success",
    });
  };

  const handleViewScenario = (scenario: any) => {
    setSelectedScenario(scenario);
    setShowScenarioDetail(true);
  };

  // Calculate dilution impact
  const calculateDilution = () => {
    const totalInvestment = scenarioState.investors.reduce((sum, inv) => sum + inv.amount, 0);
    const postMoney = scenarioState.premoney + totalInvestment;
    const newSharesIssued = (totalInvestment / postMoney) * 100;
    return {
      totalInvestment,
      postMoney,
      newSharesIssued,
      dilution: newSharesIssued,
    };
  };

  const dilutionData = calculateDilution();
  const scenarioData = Array.isArray(scenarios) ? scenarios : [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <Navigation />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-12 h-12 bg-primary/20 rounded-xl mx-auto mb-4 animate-pulse"></div>
            <p className="text-gray-600">Loading scenarios...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Enhanced Breadcrumb Navigation */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/companies">Companies</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/companies/${companyId}`}>
                {company?.name || "Dashboard"}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbPage>Funding Scenarios</BreadcrumbPage>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Round Modeling Panel */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b border-neutral-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-neutral-900">Model Funding Round</h2>
                    <p className="text-neutral-600 mt-1">
                      Simulate investment scenarios and analyze dilution impact
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Autosave Status */}
                    {statusDisplay && (
                      <Badge variant="outline" className="text-xs">
                        <Save className="h-3 w-3 mr-1" />
                        {statusDisplay}
                      </Badge>
                    )}

                    {/* History Controls */}
                    <div className="flex items-center gap-1 border rounded-md">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={undo}
                        disabled={!canUndo}
                        title="Undo (Ctrl+Z)"
                      >
                        <Undo2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={redo}
                        disabled={!canRedo}
                        title="Redo (Ctrl+Shift+Z)"
                      >
                        <Redo2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <Button onClick={() => setShowNewScenario(true)}>
                      <Save className="h-4 w-4 mr-2" />
                      Save Scenario
                    </Button>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Round Parameters */}
                <div className="grid grid-cols-2 gap-4">
                  <EnhancedInput
                    label="Pre-money Valuation"
                    type="number"
                    inputMode="numeric"
                    value={scenarioState.premoney}
                    onChange={(e) => setScenarioState({
                      ...scenarioState,
                      premoney: Number(e.target.value)
                    })}
                    description="Company valuation before investment"
                  />
                  
                  <EnhancedInput
                    label="Total Round Size"
                    type="number"
                    inputMode="numeric"
                    value={scenarioState.roundAmount}
                    onChange={(e) => setScenarioState({
                      ...scenarioState,
                      roundAmount: Number(e.target.value)
                    })}
                    description="Total amount to raise"
                  />
                </div>

                {/* Investors */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <Label className="text-base font-medium">Investors</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setScenarioState({
                        ...scenarioState,
                        investors: [...scenarioState.investors, { name: "", amount: 0 }]
                      })}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Investor
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {scenarioState.investors.map((investor, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <EnhancedInput
                          placeholder="Investor name"
                          value={investor.name}
                          onChange={(e) => {
                            const newInvestors = [...scenarioState.investors];
                            newInvestors[index].name = e.target.value;
                            setScenarioState({ ...scenarioState, investors: newInvestors });
                          }}
                          className="flex-1"
                        />
                        <EnhancedInput
                          type="number"
                          inputMode="numeric"
                          placeholder="Amount"
                          value={investor.amount}
                          onChange={(e) => {
                            const newInvestors = [...scenarioState.investors];
                            newInvestors[index].amount = Number(e.target.value);
                            setScenarioState({ ...scenarioState, investors: newInvestors });
                          }}
                          className="w-32"
                        />
                        {scenarioState.investors.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const newInvestors = scenarioState.investors.filter((_, i) => i !== index);
                              setScenarioState({ ...scenarioState, investors: newInvestors });
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dilution Analysis */}
                <div className="bg-neutral-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Dilution Analysis
                  </h3>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {formatCurrency(dilutionData.totalInvestment)}
                      </div>
                      <div className="text-sm text-neutral-600">Total Investment</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {formatCurrency(dilutionData.postMoney)}
                      </div>
                      <div className="text-sm text-neutral-600">Post-money</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {dilutionData.newSharesIssued.toFixed(1)}%
                      </div>
                      <div className="text-sm text-neutral-600">New Shares</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {dilutionData.dilution.toFixed(1)}%
                      </div>
                      <div className="text-sm text-neutral-600">Dilution</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Saved Scenarios */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b border-neutral-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Saved Scenarios</h3>
                  <Button variant="outline" size="sm">
                    <Target className="h-4 w-4 mr-1" />
                    Compare
                  </Button>
                </div>
                
                <div className="mt-3">
                  <EnhancedInput
                    placeholder="Search scenarios..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    inputMode="search"
                    autoComplete="off"
                  />
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {scenarioData.length === 0 ? (
                  <div className="text-center py-8">
                    <PieChart className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                    <h4 className="text-sm font-medium text-neutral-900 mb-2">No scenarios saved</h4>
                    <p className="text-sm text-neutral-600 mb-4">
                      Save your first funding scenario to get started.
                    </p>
                    <Button size="sm" onClick={() => setShowNewScenario(true)}>
                      Save Current Scenario
                    </Button>
                  </div>
                ) : (
                  <div className="divide-y divide-neutral-200">
                    {scenarioData.map((scenario: any) => (
                      <div key={scenario.id} className="p-4 hover:bg-neutral-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-neutral-900 mb-1">
                              {scenario.name}
                            </h4>
                            <p className="text-xs text-neutral-600 mb-2">
                              {scenario.description}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-neutral-500">
                              <span className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                {formatCurrency(scenario.roundAmount)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(scenario.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewScenario(scenario)}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleLoadScenario(scenario)}
                            >
                              <Play className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteScenario(scenario.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Scenario Dialog */}
      <Dialog open={showNewScenario} onOpenChange={setShowNewScenario}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Funding Scenario</DialogTitle>
            <DialogDescription>
              Save the current round parameters for future reference
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSaveScenario} className="space-y-4">
            <EnhancedInput
              label="Scenario Name"
              name="name"
              placeholder="e.g., Series A - Conservative"
              required
            />
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Optional description of this scenario..."
                rows={3}
              />
            </div>

            <div className="bg-neutral-50 rounded-lg p-4 space-y-2">
              <h4 className="font-medium">Scenario Parameters</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-neutral-600">Pre-money:</span>
                  <span className="ml-2 font-mono">{formatCurrency(scenarioState.premoney)}</span>
                </div>
                <div>
                  <span className="text-neutral-600">Round size:</span>
                  <span className="ml-2 font-mono">{formatCurrency(scenarioState.roundAmount)}</span>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowNewScenario(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={createScenarioMutation.isPending}
              >
                {createScenarioMutation.isPending ? "Saving..." : "Save Scenario"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Scenario Detail Dialog */}
      <Dialog open={showScenarioDetail} onOpenChange={setShowScenarioDetail}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {selectedScenario?.name}
            </DialogTitle>
            <DialogDescription>
              Detailed view of saved funding scenario
            </DialogDescription>
          </DialogHeader>
          
          {selectedScenario && (
            <div className="space-y-4">
              <div className="bg-neutral-50 rounded-lg p-4">
                <h4 className="font-medium mb-3">Round Parameters</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Pre-money Valuation</Label>
                    <p className="text-lg font-mono">{formatCurrency(selectedScenario.premoney)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Round Amount</Label>
                    <p className="text-lg font-mono">{formatCurrency(selectedScenario.roundAmount)}</p>
                  </div>
                </div>
              </div>

              {selectedScenario.description && (
                <div>
                  <Label className="text-sm font-medium">Description</Label>
                  <p className="text-sm text-neutral-600 mt-1">
                    {selectedScenario.description}
                  </p>
                </div>
              )}

              <div>
                <Label className="text-sm font-medium">Investors</Label>
                <div className="mt-2 space-y-2">
                  {selectedScenario.investors.map((investor: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-neutral-50 rounded">
                      <span className="text-sm">{investor.name}</span>
                      <span className="text-sm font-mono">{formatCurrency(investor.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScenarioDetail(false)}>
              Close
            </Button>
            {selectedScenario && (
              <Button onClick={() => handleLoadScenario(selectedScenario)}>
                <Play className="h-4 w-4 mr-2" />
                Load Scenario
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}