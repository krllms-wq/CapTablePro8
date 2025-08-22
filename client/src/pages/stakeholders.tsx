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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { formatNumber } from "@/lib/formatters";
import { apiRequest, queryClient } from "@/lib/queryClient";
import AppShell from "@/components/layout/app-shell";
import PageHeader from "@/components/layout/page-header";
import { useConfirmation } from "@/components/ui/confirmation-dialog";
import { Pencil, Trash2, Plus } from "lucide-react";

export default function StakeholdersPage() {
  const { companyId } = useParams();
  const { toast } = useToast();
  const [editingStakeholder, setEditingStakeholder] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showSecurityClassDialog, setShowSecurityClassDialog] = useState(false);
  const [editingSecurityClass, setEditingSecurityClass] = useState<any>(null);
  const { confirm, ConfirmationComponent } = useConfirmation();
  const [newStakeholder, setNewStakeholder] = useState({
    name: "",
    email: "",
    title: "",
    type: "individual",
    address: ""
  });
  const [newSecurityClass, setNewSecurityClass] = useState({
    name: "",
    liquidationPreferenceMultiple: "1.0",
    participating: false,
    votingRights: "1.0"
  });

  const { data: stakeholders, isLoading } = useQuery({
    queryKey: ["/api/companies", companyId, "stakeholders"],
    enabled: !!companyId,
  });

  const { data: capTableData } = useQuery({
    queryKey: ["/api/companies", companyId, "cap-table"],
    enabled: !!companyId,
  });

  const { data: securityClasses } = useQuery({
    queryKey: ["/api/companies", companyId, "security-classes"],
    enabled: !!companyId,
  });

  const updateStakeholderMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest(`/api/stakeholders/${editingStakeholder?.id}`, {
        method: "PUT",
        body: data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId, "stakeholders"] });
      toast({
        title: "Success",
        description: "Stakeholder updated successfully",
        variant: "success",
      });
      setShowEditDialog(false);
      setEditingStakeholder(null);
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || error.message || "Failed to update stakeholder";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "error",
      });
    }
  });

  const createStakeholderMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest(`/api/companies/${companyId}/stakeholders`, {
        method: "POST",
        body: data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId, "stakeholders"] });
      toast({
        title: "Success",
        description: "Stakeholder created successfully",
        variant: "success",
      });
      setShowAddDialog(false);
      setNewStakeholder({ name: "", email: "", title: "", type: "individual", address: "" });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || error.message || "Failed to create stakeholder";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "error",
      });
    }
  });

  const deleteStakeholderMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/stakeholders/${id}`, {
        method: "DELETE"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId, "stakeholders"] });
      toast({
        title: "Success",
        description: "Stakeholder deleted successfully",
        variant: "success",
      });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || error.message || "Failed to delete stakeholder";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "error",
      });
    }
  });

  const createSecurityClassMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest(`/api/companies/${companyId}/security-classes`, {
        method: "POST",
        body: data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId, "security-classes"] });
      toast({
        title: "Success",
        description: "Security class created successfully",
        variant: "success",
      });
      setShowSecurityClassDialog(false);
      setNewSecurityClass({ name: "", liquidationPreferenceMultiple: "1.0", participating: false, votingRights: "1.0" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create security class",
        variant: "error",
      });
    }
  });

  const updateSecurityClassMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest(`/api/companies/${companyId}/security-classes/${editingSecurityClass?.id}`, {
        method: "PUT",
        body: data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId, "security-classes"] });
      toast({
        title: "Success", 
        description: "Security class updated successfully",
        variant: "success",
      });
      setShowSecurityClassDialog(false);
      setEditingSecurityClass(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update security class",
        variant: "error",
      });
    }
  });

  const deleteSecurityClassMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/companies/${companyId}/security-classes/${id}`, {
        method: "DELETE"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId, "security-classes"] });
      toast({
        title: "Success",
        description: "Security class deleted successfully",
        variant: "success",
      });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || error.message || "Failed to delete security class";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "error",
      });
    }
  });

  const handleDeleteSecurityClass = async (securityClass: any) => {
    confirm({
      title: "Delete Security Class",
      description: `Are you sure you want to delete the security class "${securityClass.name}"? This action cannot be undone.`,
      confirmText: "Delete",
      variant: "destructive",
      onConfirm: () => deleteSecurityClassMutation.mutate(securityClass.id)
    });
  };

  const handleEditStakeholder = (stakeholder: any) => {
    setEditingStakeholder(stakeholder);
    setShowEditDialog(true);
  };

  const handleDeleteStakeholder = async (stakeholder: any) => {
    confirm({
      title: "Delete Stakeholder",
      description: `Are you sure you want to delete stakeholder "${stakeholder.name}"? This action cannot be undone.`,
      confirmText: "Delete",
      variant: "destructive",
      onConfirm: () => deleteStakeholderMutation.mutate(stakeholder.id)
    });
  };

  if (isLoading) {
    return (
      <AppShell>
        <PageHeader title="Stakeholders" subtitle="Loading stakeholder data..." />
        <div className="space-y-xl">
          <div className="h-8 bg-muted rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </AppShell>
    );
  }

  const stakeholderData = Array.isArray(stakeholders) ? stakeholders.map((stakeholder: any) => {
    const capTable = Array.isArray(capTableData) ? capTableData : [];
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
    <AppShell>
      <PageHeader
        title="Stakeholders & Security Classes"
        subtitle="Manage shareholders, investors, employees, and other equity holders"
        primaryAction={{
          label: "Add Security Class",
          onClick: () => setShowSecurityClassDialog(true)
        }}
        secondaryActions={[
          {
            label: "Add Stakeholder",
            variant: "default",
            onClick: () => setShowAddDialog(true)
          }
        ]}
      />
      
      <div className="space-y-xl">
        <Tabs defaultValue="stakeholders" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="stakeholders">Stakeholders</TabsTrigger>
            <TabsTrigger value="security-classes">Security Classes</TabsTrigger>
          </TabsList>
          
          <TabsContent value="stakeholders" className="space-y-xl">

            <div className="card">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/20">
                    <tr>
                      <th className="px-xl py-md text-left text-xs font-medium text-muted uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-xl py-md text-left text-xs font-medium text-muted uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-xl py-md text-left text-xs font-medium text-muted uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-xl py-md text-right text-xs font-medium text-muted uppercase tracking-wider">
                        Shares
                      </th>
                      <th className="px-xl py-md text-right text-xs font-medium text-muted uppercase tracking-wider">
                        Ownership
                      </th>
                      <th className="px-xl py-md text-right text-xs font-medium text-muted uppercase tracking-wider">
                        Value
                      </th>
                      <th className="px-xl py-md text-right text-xs font-medium text-muted uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-card divide-y divide-border">
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
                            <div className="flex justify-end space-x-2">
                              <button 
                                onClick={() => handleEditStakeholder(stakeholder)}
                                className="text-indigo-600 hover:text-indigo-900 p-1"
                                title="Edit stakeholder"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteStakeholder(stakeholder)}
                                className="text-red-600 hover:text-red-900 p-1"
                                title="Delete stakeholder"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="security-classes" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-neutral-800">Security Classes</h2>
                <Button onClick={() => {
                  setEditingSecurityClass(null);
                  setNewSecurityClass({ name: "", liquidationPreferenceMultiple: "1.0", participating: false, votingRights: "1.0" });
                  setShowSecurityClassDialog(true);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Security Class
                </Button>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-neutral-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                          Liquidation Preference
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                          Participating
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                          Voting Rights
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-neutral-200">
                      {Array.isArray(securityClasses) && securityClasses.map((securityClass: any) => (
                        <tr key={securityClass.id} className="hover:bg-neutral-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-neutral-900">
                              {securityClass.name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-neutral-900">
                              {securityClass.liquidationPreferenceMultiple}x
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant={securityClass.participating ? "default" : "secondary"}>
                              {securityClass.participating ? "Yes" : "No"}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-neutral-900">
                              {securityClass.votingRights}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <button 
                                onClick={() => {
                                  setEditingSecurityClass(securityClass);
                                  setNewSecurityClass({
                                    name: securityClass.name,
                                    liquidationPreferenceMultiple: securityClass.liquidationPreferenceMultiple.toString(),
                                    participating: securityClass.participating,
                                    votingRights: securityClass.votingRights.toString()
                                  });
                                  setShowSecurityClassDialog(true);
                                }}
                                className="text-indigo-600 hover:text-indigo-900 p-1"
                                title="Edit security class"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteSecurityClass(securityClass)}
                                className="text-red-600 hover:text-red-900 p-1"
                                title="Delete security class"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Add Stakeholder Dialog */}
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Stakeholder</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="add-name">Name</Label>
                  <Input
                    id="add-name"
                    value={newStakeholder.name}
                    onChange={(e) => setNewStakeholder({...newStakeholder, name: e.target.value})}
                    placeholder="Enter stakeholder name"
                  />
                </div>
                <div>
                  <Label htmlFor="add-email">Email</Label>
                  <Input
                    id="add-email"
                    type="email"
                    value={newStakeholder.email}
                    onChange={(e) => setNewStakeholder({...newStakeholder, email: e.target.value})}
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <Label htmlFor="add-title">Title</Label>
                  <Input
                    id="add-title"
                    value={newStakeholder.title}
                    onChange={(e) => setNewStakeholder({...newStakeholder, title: e.target.value})}
                    placeholder="Enter title or role"
                  />
                </div>
                <div>
                  <Label htmlFor="add-type">Type</Label>
                  <Select 
                    value={newStakeholder.type} 
                    onValueChange={(value) => setNewStakeholder({...newStakeholder, type: value})}
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
                <div>
                  <Label htmlFor="add-address">Address (Optional)</Label>
                  <Input
                    id="add-address"
                    value={newStakeholder.address}
                    onChange={(e) => setNewStakeholder({...newStakeholder, address: e.target.value})}
                    placeholder="Enter address"
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowAddDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => createStakeholderMutation.mutate(newStakeholder)}
                    disabled={createStakeholderMutation.isPending || !newStakeholder.name}
                  >
                    {createStakeholderMutation.isPending ? "Creating..." : "Create Stakeholder"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

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
                      value={editingStakeholder.email}
                      onChange={(e) => setEditingStakeholder({...editingStakeholder, email: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-title">Title</Label>
                    <Input
                      id="edit-title"
                      value={editingStakeholder.title || ""}
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
                  <div>
                    <Label htmlFor="edit-address">Address (Optional)</Label>
                    <Input
                      id="edit-address"
                      value={editingStakeholder.address || ""}
                      onChange={(e) => setEditingStakeholder({...editingStakeholder, address: e.target.value})}
                      placeholder="Enter address"
                    />
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

          {/* Security Class Dialog */}
          <Dialog open={showSecurityClassDialog} onOpenChange={setShowSecurityClassDialog}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {editingSecurityClass ? "Edit Security Class" : "Add New Security Class"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="sc-name">Security Class Name</Label>
                  <Input
                    id="sc-name"
                    value={newSecurityClass.name}
                    onChange={(e) => setNewSecurityClass({...newSecurityClass, name: e.target.value})}
                    placeholder="e.g. Series A Preferred"
                  />
                </div>
                <div>
                  <Label htmlFor="sc-liq-pref">Liquidation Preference Multiple</Label>
                  <Input
                    id="sc-liq-pref"
                    type="number"
                    step="0.1"
                    value={newSecurityClass.liquidationPreferenceMultiple}
                    onChange={(e) => setNewSecurityClass({...newSecurityClass, liquidationPreferenceMultiple: e.target.value})}
                    placeholder="1.0"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="sc-participating"
                    checked={newSecurityClass.participating}
                    onChange={(e) => setNewSecurityClass({...newSecurityClass, participating: e.target.checked})}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <Label htmlFor="sc-participating">Participating Preferred</Label>
                </div>
                <div>
                  <Label htmlFor="sc-voting">Voting Rights</Label>
                  <Input
                    id="sc-voting"
                    type="number"
                    step="0.1"
                    value={newSecurityClass.votingRights}
                    onChange={(e) => setNewSecurityClass({...newSecurityClass, votingRights: e.target.value})}
                    placeholder="1.0"
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowSecurityClassDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => {
                      if (editingSecurityClass) {
                        updateSecurityClassMutation.mutate(newSecurityClass);
                      } else {
                        createSecurityClassMutation.mutate(newSecurityClass);
                      }
                    }}
                    disabled={(createSecurityClassMutation.isPending || updateSecurityClassMutation.isPending) || !newSecurityClass.name}
                  >
                    {(createSecurityClassMutation.isPending || updateSecurityClassMutation.isPending) 
                      ? "Saving..." 
                      : editingSecurityClass ? "Update Security Class" : "Create Security Class"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {ConfirmationComponent}
        </div>
    </AppShell>
  );
}