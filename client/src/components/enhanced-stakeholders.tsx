import { useState } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { StakeholdersEmptyState } from "@/components/ui/empty-state";
import Navigation from "@/components/layout/navigation";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function EnhancedStakeholders() {
  const { companyId } = useParams();
  const [showAddStakeholder, setShowAddStakeholder] = useState(false);

  const { data: stakeholders, isLoading } = useQuery({
    queryKey: ["/api/companies", companyId, "stakeholders"],
    enabled: !!companyId,
  });

  const { data: company } = useQuery({
    queryKey: ["/api/companies", companyId],
    enabled: !!companyId,
  });

  const handleAddStakeholder = () => {
    setShowAddStakeholder(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-neutral-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-6 py-6" data-tour="stakeholders-section">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-neutral-900">Stakeholders</h1>
              <p className="text-neutral-600 mt-1">
                Manage your company's stakeholders and their equity holdings
              </p>
            </div>
            <Button onClick={handleAddStakeholder} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Stakeholder
            </Button>
          </div>

          {(!stakeholders || (stakeholders as any[]).length === 0) ? (
            <StakeholdersEmptyState onAddStakeholder={handleAddStakeholder} />
          ) : (
            <div className="bg-white rounded-xl shadow-sm border">
              {/* Regular stakeholders table would go here */}
              <div className="p-6">
                <p>Stakeholders table content would be here</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}