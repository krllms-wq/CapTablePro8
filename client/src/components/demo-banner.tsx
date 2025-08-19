import { useState } from "react";
import { X, ExternalLink, Settings, Trash2 } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface DemoBannerProps {
  companyId: string;
  companyName: string;
  onDismiss: () => void;
}

export default function DemoBanner({ companyId, companyName, onDismiss }: DemoBannerProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete the sample company "${companyName}"? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      await apiRequest(`/api/companies/${companyId}`, {
        method: "DELETE",
      });

      // Invalidate companies list
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });

      toast({
        title: "Sample company deleted",
        description: "The sample company has been removed from your account.",
      });

      onDismiss();
    } catch (error) {
      console.error("Error deleting sample company:", error);
      toast({
        title: "Error",
        description: "Failed to delete sample company. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-sm font-medium text-blue-900">
              Sample Company Added
            </h3>
            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
              Demo
            </span>
          </div>
          <p className="text-sm text-blue-800 mb-3">
            We added a sample company '{companyName}' so you can explore features. 
            You can rename or delete it anytime.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link href={`/companies/${companyId}`}>
              <Button size="sm" variant="outline" className="text-blue-700 border-blue-300 hover:bg-blue-100">
                <ExternalLink className="w-4 h-4 mr-1" />
                Open
              </Button>
            </Link>
            <Link href={`/companies/${companyId}/settings`}>
              <Button size="sm" variant="outline" className="text-blue-700 border-blue-300 hover:bg-blue-100">
                <Settings className="w-4 h-4 mr-1" />
                Rename
              </Button>
            </Link>
            <Button 
              size="sm" 
              variant="outline" 
              className="text-red-700 border-red-300 hover:bg-red-100"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={onDismiss}
          className="text-blue-600 hover:text-blue-800 hover:bg-blue-100"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}