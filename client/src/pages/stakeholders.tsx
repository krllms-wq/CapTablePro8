import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { formatNumber } from "@/lib/formatters";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Navigation from "@/components/layout/navigation";

export default function StakeholdersPage() {
  const { companyId } = useParams();
  const { toast } = useToast();
  const [editingStakeholder, setEditingStakeholder] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const { data: stakeholders, isLoading } = useQuery({
    queryKey: ["/api/companies", companyId, "stakeholders"],
    enabled: !!companyId,
  });

  const { data: capTableData } = useQuery({
    queryKey: ["/api/companies", companyId, "cap-table"],
    enabled: !!companyId,
  });

  const updateStakeholderMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest(`/api/companies/${companyId}/stakeholders/${editingStakeholder?.id}`, {
        method: "PUT",
        body: data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId, "stakeholders"] });
      setShowEditDialog(false);
      setEditingStakeholder(null);
      toast({
        title: "Success",
        description: "Stakeholder updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update stakeholder",
        variant: "error",
      });
    },
  });

  const handleEditStakeholder = (stakeholder: any) => {
    setEditingStakeholder(stakeholder);
    setShowEditDialog(true);
  };

  const handleDeleteStakeholder = async (stakeholderId: string) => {
    if (confirm('Are you sure you want to delete this stakeholder?')) {
      try {
        await apiRequest(`/api/companies/${companyId}/stakeholders/${stakeholderId}`, {
          method: "DELETE"
        });
        queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId, "stakeholders"] });
        toast({
          title: "Success",
          description: "Stakeholder deleted successfully",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete stakeholder",
          variant: "error",
        });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-semibold text-neutral-900">Stakeholders</h1>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
              <div className="animate-pulse space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-neutral-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const stakeholderData = Array.isArray(stakeholders) ? stakeholders.map((stakeholder: any) => {
    const capTable = Array.isArray(capTableData) ? capTableData : (capTableData?.capTable || []);
    const ownership = Array.isArray(capTable) ? capTable.find((row: any) => 
      row.stakeholder?.name === stakeholder.name
    ) : null;
    return {
      ...stakeholder,
      shares: ownership?.shares || 0,
      ownership: ownership?.ownership || 0,
      value: ownership?.value || 0,
    };
  }) : [];

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-neutral-900">Stakeholders</h1>
            <Button>
              <i className="fas fa-plus mr-2"></i>
              Add Stakeholder
            </Button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
            <div className="px-6 py-4 border-b border-neutral-200">
              <h3 className="text-lg font-semibold text-neutral-900">All Stakeholders</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Shares
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Ownership %
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Value
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-200">
                  {stakeholderData.map((stakeholder: any) => (
                    <tr key={stakeholder.id} className="hover:bg-neutral-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-semibold">
                              {stakeholder.name.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-neutral-900">
                              {stakeholder.name}
                            </div>
                            <div className="text-sm text-neutral-500">
                              {stakeholder.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                        {stakeholder.title || "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          stakeholder.type === "individual" 
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                        }`}>
                          {stakeholder.type === "individual" ? "Individual" : "Entity"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 text-right">
                        {formatNumber(stakeholder.shares)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 text-right">
                        {stakeholder.ownership.toFixed(2)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 text-right">
                        ${formatNumber(stakeholder.value)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => handleEditStakeholder(stakeholder)}
                          className="text-primary hover:text-primary-dark mr-3"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteStakeholder(stakeholder.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Edit Stakeholder Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Stakeholder</DialogTitle>
            </DialogHeader>
            {editingStakeholder && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-name">Name</Label>
                  <Input
                    id="edit-name"
                    value={editingStakeholder.name}
                    onChange={(e) => setEditingStakeholder({...editingStakeholder, name: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editingStakeholder.email || ''}
                    onChange={(e) => setEditingStakeholder({...editingStakeholder, email: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-title">Title</Label>
                  <Input
                    id="edit-title"
                    value={editingStakeholder.title || ''}
                    onChange={(e) => setEditingStakeholder({...editingStakeholder, title: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-type">Type</Label>
                  <Select 
                    value={editingStakeholder.type} 
                    onValueChange={(value) => setEditingStakeholder({...editingStakeholder, type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Individual</SelectItem>
                      <SelectItem value="entity">Entity</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowEditDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => updateStakeholderMutation.mutate(editingStakeholder)}
                    disabled={updateStakeholderMutation.isPending}
                  >
                    {updateStakeholderMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}