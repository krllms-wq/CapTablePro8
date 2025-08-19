import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function AddSampleCompanyButton() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleAddSample = async () => {
    setIsLoading(true);
    try {
      const result = await apiRequest("/api/demo/seed/ensure", {
        method: "POST",
      });

      // Invalidate companies list to refresh
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });

      toast({
        title: "Sample company added",
        description: "Example LLC has been added to your account with sample data.",
      });
    } catch (error) {
      console.error("Error adding sample company:", error);
      toast({
        title: "Error",
        description: "Failed to add sample company. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      onClick={handleAddSample}
      disabled={isLoading}
      className="w-full"
    >
      <Plus className="w-4 h-4 mr-2" />
      {isLoading ? "Adding Sample Company..." : "Add Sample Company"}
    </Button>
  );
}