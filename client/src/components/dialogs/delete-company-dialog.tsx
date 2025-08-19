import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Trash2, AlertTriangle, Building, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Company } from "@shared/schema";

interface DeleteCompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: Company;
}

export default function DeleteCompanyDialog({
  open,
  onOpenChange,
  company,
}: DeleteCompanyDialogProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [confirmationText, setConfirmationText] = useState("");
  const [step, setStep] = useState<"warning" | "confirmation">("warning");
  
  const expectedText = `DELETE ${company.name}`;
  const isConfirmationValid = confirmationText === expectedText;

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/companies/${company.id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      
      toast({
        title: "Company deleted",
        description: `${company.name} and all its data have been permanently deleted.`,
      });
      
      // Navigate back to companies list
      setLocation("/");
      onOpenChange(false);
    },
    onError: (error: any) => {
      console.error("Delete error:", error);
      
      let errorMessage = "Failed to delete company. Please try again.";
      if (error.message?.includes("Access denied")) {
        errorMessage = "You don't have permission to delete this company.";
      } else if (error.message?.includes("not found")) {
        errorMessage = "Company not found or already deleted.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
      });
    },
  });

  const handleClose = () => {
    setStep("warning");
    setConfirmationText("");
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (step === "warning") {
      setStep("confirmation");
    } else if (step === "confirmation" && isConfirmationValid) {
      deleteMutation.mutate();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {step === "warning" ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Delete Company
              </DialogTitle>
              <DialogDescription>
                You are about to permanently delete <strong>{company.name}</strong>.
              </DialogDescription>
            </DialogHeader>

            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>This action cannot be undone.</strong> All data associated with this company will be permanently deleted, including:
              </AlertDescription>
            </Alert>

            <div className="space-y-2 text-sm text-neutral-600">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                <span>Cap table and ownership records</span>
              </div>
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                <span>All stakeholders and their information</span>
              </div>
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                <span>Transaction history and audit logs</span>
              </div>
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                <span>Equity awards, options, and vesting schedules</span>
              </div>
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                <span>Funding rounds and scenarios</span>
              </div>
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                <span>All corporate actions and documents</span>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={handleClose}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                I Understand, Continue
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <Trash2 className="h-5 w-5" />
                Confirm Deletion
              </DialogTitle>
              <DialogDescription>
                To confirm, type <code className="font-mono bg-neutral-100 px-1 rounded">DELETE {company.name}</code> in the box below.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="confirmation">Confirmation Text</Label>
                <Input
                  id="confirmation"
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  placeholder={expectedText}
                  className="font-mono"
                  autoFocus
                />
              </div>

              {confirmationText && !isConfirmationValid && (
                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    Text doesn't match. Please type exactly: <code className="font-mono">DELETE {company.name}</code>
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setStep("warning")}>
                <X className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDelete}
                disabled={!isConfirmationValid || deleteMutation.isPending}
                className="bg-red-600 hover:bg-red-700 disabled:bg-red-300"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {deleteMutation.isPending ? "Deleting..." : "Delete Company"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}