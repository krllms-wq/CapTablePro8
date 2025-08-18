import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface SaveScenarioDialogProps {
  companyId: string;
  roundAmount: string;
  premoney: string;
  investors: Array<{ id: string; name: string; investmentAmount: number }>;
  children: React.ReactNode;
}

export function SaveScenarioDialog({
  companyId,
  roundAmount,
  premoney,
  investors,
  children,
}: SaveScenarioDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const parseFormattedNumber = (value: string) => {
    return parseFloat(value.replace(/,/g, '')) || 0;
  };

  const saveScenarioMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/companies/${companyId}/scenarios`, {
        name,
        description: description || null,
        roundAmount: parseFormattedNumber(roundAmount).toString(),
        premoney: parseFormattedNumber(premoney).toString(),
        investors: investors.filter(inv => inv.name && inv.investmentAmount > 0),
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId, "scenarios"] });
      toast({
        title: "Scenario saved successfully",
        description: "Your scenario has been saved for future reference",
      });
      setOpen(false);
      setName("");
      setDescription("");
    },
    onError: () => {
      toast({
        title: "Error saving scenario",
        description: "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for this scenario",
        variant: "destructive",
      });
      return;
    }
    saveScenarioMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save Scenario</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Scenario Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Series A - Q2 2025"
            />
          </div>
          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Additional notes about this scenario..."
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={saveScenarioMutation.isPending}
            >
              {saveScenarioMutation.isPending ? "Saving..." : "Save Scenario"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}