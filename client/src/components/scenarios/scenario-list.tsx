import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Scenario } from "@shared/schema";

interface ScenarioListProps {
  companyId: string;
  onLoadScenario?: (scenario: Scenario) => void;
}

export function ScenarioList({ companyId, onLoadScenario }: ScenarioListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: scenarios, isLoading } = useQuery({
    queryKey: ["/api/companies", companyId, "scenarios"],
    enabled: !!companyId,
  });

  const deleteScenarioMutation = useMutation({
    mutationFn: async (scenarioId: string) => {
      await apiRequest("DELETE", `/api/companies/${companyId}/scenarios/${scenarioId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId, "scenarios"] });
      toast({
        title: "Scenario deleted",
        description: "The scenario has been removed",
      });
    },
    onError: () => {
      toast({
        title: "Error deleting scenario",
        description: "Please try again",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-neutral-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (!scenarios || scenarios.length === 0) {
    return (
      <div className="text-center py-8 text-neutral-500">
        <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="fas fa-folder-open text-2xl text-neutral-400"></i>
        </div>
        <p>No saved scenarios yet</p>
        <p className="text-sm">Create and save scenarios to reference them later</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {scenarios.map((scenario: Scenario) => (
        <Card key={scenario.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-neutral-900">{scenario.name}</h3>
                <p className="text-sm text-neutral-500">
                  Created {formatDate(new Date(scenario.createdAt))}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onLoadScenario?.(scenario)}
                >
                  Load
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                      <i className="fas fa-trash text-sm"></i>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Scenario</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{scenario.name}"? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteScenarioMutation.mutate(scenario.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {scenario.description && (
              <p className="text-sm text-neutral-600 mb-3">{scenario.description}</p>
            )}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-neutral-500">Round Amount:</span>
                <div className="font-medium">{formatCurrency(parseFloat(scenario.roundAmount))}</div>
              </div>
              <div>
                <span className="text-neutral-500">Pre-money:</span>
                <div className="font-medium">{formatCurrency(parseFloat(scenario.premoney))}</div>
              </div>
            </div>
            <div className="mt-3">
              <span className="text-neutral-500 text-sm">Investors:</span>
              <div className="text-sm font-medium">
                {(scenario.investors as any[]).map((inv, idx) => (
                  <span key={idx}>
                    {inv.name} ({formatCurrency(inv.investmentAmount)})
                    {idx < (scenario.investors as any[]).length - 1 && ", "}
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}