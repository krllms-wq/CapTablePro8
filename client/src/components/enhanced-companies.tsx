import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useUrlFilters, useUrlSort } from "@/hooks/useUrlState";
import { useHistoryState } from "@/hooks/useHistoryState";
import { useAutosave } from "@/hooks/useAutosave";
import { EnhancedInput } from "@/components/ui/enhanced-input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbList, 
  BreadcrumbPage 
} from "@/components/ui/breadcrumb";
import Navigation from "@/components/layout/navigation";
import { 
  Building2, Plus, Search, Undo2, Redo2, Save, Filter, 
  SortAsc, SortDesc, MoreVertical, Edit, Archive,
  Users, TrendingUp, Calendar, DollarSign
} from "lucide-react";
import type { Company } from "@shared/schema";

export default function EnhancedCompanies() {
  const { toast } = useToast();
  const { user } = useAuth();

  // Enhanced state management with history and autosave
  const {
    value: companyState,
    setValue: setCompanyState,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useHistoryState({
    selectedCompanies: [],
    viewMode: "grid" as "grid" | "list",
  });

  const [filters, setFilters] = useUrlFilters({
    search: "",
    status: "all",
    industry: "all",
  });

  const [sort, setSort] = useUrlSort({
    field: "name",
    direction: "asc" as const,
  });

  // Autosave functionality
  const { saveStatus, statusDisplay } = useAutosave({
    key: "companies-preferences",
    data: { filters, sort, viewMode: companyState.viewMode },
    interval: 3000,
    onSave: async (data) => {
      console.log("Auto-saving company preferences:", data);
    },
  });

  const { data: companies = [], isLoading, error } = useQuery({
    queryKey: ["/api/companies", { filters, sort }],
    retry: 3,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const archiveCompanyMutation = useMutation({
    mutationFn: async (companyId: string) => {
      return apiRequest(`/api/companies/${companyId}/archive`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      toast({
        title: "Company archived",
        description: "Company has been archived successfully",
        variant: "success",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Archive failed",
        description: error.message || "Failed to archive company",
        variant: "error",
      });
    },
  });

  const handleArchiveCompany = (companyId: string) => {
    if (confirm("Are you sure you want to archive this company? It can be restored later.")) {
      archiveCompanyMutation.mutate(companyId);
    }
  };

  const filteredCompanies = (companies as Company[]).filter((company: Company) => {
    const matchesSearch = company.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      company.description?.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesStatus = filters.status === "all" || 
      (filters.status === "active" && !company.archived) ||
      (filters.status === "archived" && company.archived);
    
    return matchesSearch && matchesStatus;
  });

  const getCompanyStats = (company: Company) => {
    // Mock stats - in real app, these would come from the API
    return {
      stakeholders: Math.floor(Math.random() * 50) + 5,
      valuation: Math.floor(Math.random() * 50000000) + 1000000,
      lastActivity: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    };
  };

  const CompanySkeleton = () => (
    <Card>
      <CardHeader>
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
          <div className="flex gap-2 mt-4">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <CompanySkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">Failed to load companies</h3>
            <p className="text-neutral-600 mb-4">
              There was an error loading your companies. Please try again.
            </p>
            <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/companies"] })}>
              Retry
            </Button>
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
              <BreadcrumbPage>Companies</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="bg-white rounded-lg shadow-sm border">
          {/* Enhanced Header with Controls */}
          <div className="px-6 py-4 border-b border-neutral-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-neutral-900">Your Companies</h1>
                <p className="text-neutral-600 mt-1">
                  Manage your cap table portfolio and company details
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

                {/* Create Company */}
                <Button asChild>
                  <Link href="/setup">
                    <Plus className="h-4 w-4 mr-2" />
                    New Company
                  </Link>
                </Button>
              </div>
            </div>

            {/* Enhanced Search and Filters */}
            <div className="flex items-center gap-4 mt-4">
              <div className="flex-1">
                <EnhancedInput
                  placeholder="Search companies..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  inputMode="search"
                  autoComplete="off"
                />
              </div>

              <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Companies</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
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
                Sort by Name
              </Button>
            </div>
          </div>

          {/* Enhanced Company Grid */}
          <div className="p-6">
            {filteredCompanies.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                  {filters.search || filters.status !== "all" ? "No companies found" : "No companies yet"}
                </h3>
                <p className="text-neutral-600 mb-4">
                  {filters.search || filters.status !== "all"
                    ? "Try adjusting your filters to see more results."
                    : "Get started by creating your first company cap table."}
                </p>
                <Button asChild>
                  <Link href="/setup">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Company
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCompanies.map((company: Company) => {
                  const stats = getCompanyStats(company);
                  
                  return (
                    <Card key={company.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                              <Building2 className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">{company.name}</CardTitle>
                              <CardDescription className="text-sm">
                                {company.incorporationJurisdiction}
                              </CardDescription>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            {company.archived && (
                              <Badge variant="secondary" className="text-xs">
                                Archived
                              </Badge>
                            )}
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        {company.description && (
                          <p className="text-sm text-neutral-600 line-clamp-2">
                            {company.description}
                          </p>
                        )}

                        {/* Company Stats */}
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-neutral-400" />
                            <span className="text-neutral-600">{stats.stakeholders} stakeholders</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-neutral-400" />
                            <span className="text-neutral-600">${(stats.valuation / 1000000).toFixed(1)}M</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-neutral-500">
                          <Calendar className="h-3 w-3" />
                          <span>Last updated {stats.lastActivity.toLocaleDateString()}</span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 pt-2">
                          <Button asChild size="sm" className="flex-1">
                            <Link href={`/companies/${company.id}`}>
                              Open Dashboard
                            </Link>
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleArchiveCompany(company.id)}
                            disabled={company.archived}
                          >
                            <Archive className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats Summary */}
        {filteredCompanies.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Building2 className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{filteredCompanies.filter(c => !c.archived).length}</p>
                    <p className="text-sm text-neutral-600">Active Companies</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold">
                      {filteredCompanies.reduce((sum, c) => sum + getCompanyStats(c).stakeholders, 0)}
                    </p>
                    <p className="text-sm text-neutral-600">Total Stakeholders</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold">
                      ${(filteredCompanies.reduce((sum, c) => sum + getCompanyStats(c).valuation, 0) / 1000000).toFixed(0)}M
                    </p>
                    <p className="text-sm text-neutral-600">Combined Valuation</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Archive className="h-8 w-8 text-neutral-400" />
                  <div>
                    <p className="text-2xl font-bold">{filteredCompanies.filter(c => c.archived).length}</p>
                    <p className="text-sm text-neutral-600">Archived</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}