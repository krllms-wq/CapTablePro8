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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { formatNumber } from "@/lib/formatters";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useUrlFilters, useUrlSort } from "@/hooks/useUrlState";
import { useHistoryState } from "@/hooks/useHistoryState";
import { useAutosave } from "@/hooks/useAutosave";
import { CsvImportDialog } from "@/components/csv/csv-import-dialog";
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
import { Upload, Undo2, Redo2, Save, Filter, SortAsc, SortDesc, Plus, Edit, Trash2 } from "lucide-react";

export default function EnhancedStakeholdersDemo() {
  const { companyId } = useParams();
  const { toast } = useToast();
  
  // Enhanced state management with history and autosave
  const {
    value: stakeholderFilters,
    setValue: setStakeholderFilters,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useHistoryState({
    search: "",
    type: "all",
    showInactive: false,
  });

  const [filters, setFilters] = useUrlFilters({
    search: "",
    type: "all",
  });

  const [sort, setSort] = useUrlSort({
    field: "name",
    direction: "asc" as const,
  });

  const [editingStakeholder, setEditingStakeholder] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showCsvImport, setShowCsvImport] = useState(false);

  // Autosave functionality
  const { saveStatus, statusDisplay } = useAutosave({
    key: "stakeholders-draft",
    data: stakeholderFilters,
    interval: 3000,
    onSave: async (data) => {
      // Mock save to server
      console.log("Auto-saving filters:", data);
    },
  });

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
        title: "Stakeholder updated",
        description: "Changes saved successfully",
        variant: "success",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update stakeholder",
        variant: "error",
      });
    },
  });

  const deleteStakeholderMutation = useMutation({
    mutationFn: async (stakeholderId: string) => {
      return apiRequest(`/api/companies/${companyId}/stakeholders/${stakeholderId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId, "stakeholders"] });
      toast({
        title: "Stakeholder deleted",
        description: "Stakeholder removed successfully",
        variant: "success",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete stakeholder",
        variant: "error",
      });
    },
  });

  const handleEditStakeholder = (stakeholder: any) => {
    setEditingStakeholder(stakeholder);
    setShowEditDialog(true);
  };

  const handleDeleteStakeholder = (stakeholderId: string) => {
    if (confirm("Are you sure you want to delete this stakeholder?")) {
      deleteStakeholderMutation.mutate(stakeholderId);
    }
  };

  const handleUpdateStakeholder = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data = {
      name: formData.get("name"),
      title: formData.get("title"),
      email: formData.get("email"),
      type: formData.get("type"),
    };
    updateStakeholderMutation.mutate(data);
  };

  const handleCsvImport = (data: any[]) => {
    console.log("Importing stakeholder data:", data);
    toast({
      title: "Import successful",
      description: `${data.length} stakeholders imported`,
      variant: "success",
    });
  };

  const stakeholderData = capTableData || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <Navigation />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-12 h-12 bg-primary/20 rounded-xl mx-auto mb-4 animate-pulse"></div>
            <p className="text-gray-600">Loading stakeholders...</p>
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
              <BreadcrumbLink href={`/companies/${companyId}`}>Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbPage>Stakeholders</BreadcrumbPage>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="bg-white rounded-lg shadow-sm border">
          {/* Enhanced Header with Controls */}
          <div className="px-6 py-4 border-b border-neutral-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-neutral-900">Stakeholders</h1>
                <p className="text-neutral-600 mt-1">
                  Manage company stakeholders and ownership details
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

                {/* CSV Import */}
                <Button
                  variant="outline"
                  onClick={() => setShowCsvImport(true)}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import CSV
                </Button>

                {/* Add Stakeholder */}
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Stakeholder
                </Button>
              </div>
            </div>

            {/* Enhanced Search and Filters */}
            <div className="flex items-center gap-4 mt-4">
              <div className="flex-1">
                <EnhancedInput
                  placeholder="Search stakeholders..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  inputMode="search"
                  autoComplete="off"
                />
              </div>

              <Select value={filters.type} onValueChange={(value) => setFilters({ ...filters, type: value })}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="person">Individuals</SelectItem>
                  <SelectItem value="entity">Entities</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => setSort({ 
                  ...sort, 
                  direction: sort.direction === "asc" ? "desc" : "asc" 
                })}
              >
                {sort.direction === "asc" ? (
                  <SortAsc className="h-4 w-4 mr-2" />
                ) : (
                  <SortDesc className="h-4 w-4 mr-2" />
                )}
                Sort
              </Button>
            </div>
          </div>

          {/* Enhanced Table */}
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
                  <tr key={stakeholder.id} className="hover:bg-neutral-50 transition-colors">
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
                      <Badge variant={stakeholder.type === "person" ? "default" : "secondary"}>
                        {stakeholder.type === "person" ? "Individual" : "Entity"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 text-right font-mono">
                      {formatNumber(stakeholder.shares)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 text-right font-mono">
                      {stakeholder.ownership.toFixed(2)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 text-right font-mono">
                      ${formatNumber(stakeholder.value)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditStakeholder(stakeholder)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteStakeholder(stakeholder.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Enhanced Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Stakeholder</DialogTitle>
            <DialogDescription>
              Update stakeholder information and details
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleUpdateStakeholder} className="space-y-4">
            <EnhancedInput
              label="Name"
              name="name"
              defaultValue={editingStakeholder?.name}
              autoComplete="name"
              required
            />
            
            <EnhancedInput
              label="Title"
              name="title"
              defaultValue={editingStakeholder?.title}
              autoComplete="organization-title"
            />
            
            <EnhancedInput
              label="Email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              defaultValue={editingStakeholder?.email}
            />

            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select name="type" defaultValue={editingStakeholder?.type}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="person">Individual</SelectItem>
                  <SelectItem value="entity">Entity</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEditDialog(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={updateStakeholderMutation.isPending}
              >
                {updateStakeholderMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* CSV Import Dialog */}
      <CsvImportDialog
        open={showCsvImport}
        onOpenChange={setShowCsvImport}
        onImport={handleCsvImport}
        title="Import Stakeholders"
        description="Import stakeholder data from CSV file"
      />
    </div>
  );
}