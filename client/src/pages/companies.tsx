import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import Navigation from "@/components/layout/navigation";
import { queryClient } from "@/lib/queryClient";
import { Building2, Search, Plus } from "lucide-react";

type Company = {
  id: string;
  name: string;
  description?: string;
};

export default function CompaniesPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: companies = [], isLoading, error } = useQuery({
    queryKey: ["/api/companies"],
    retry: 3,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const filteredCompanies = (companies as Company[]).filter((company: Company) =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        </div>
      </CardContent>
    </Card>
  );

  const LoadingState = () => (
    <div className="min-h-screen bg-neutral-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <CompanySkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );

  if (isLoading) return <LoadingState />;

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-6 py-6">
          <EmptyState
            icon={<Building2 className="h-6 w-6 text-destructive" />}
            title="Failed to load companies"
            description="There was an error loading your companies. Please try again."
            action={{
              label: "Retry",
              onClick: () => queryClient.refetchQueries({ queryKey: ["/api/companies"] })
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Search and Create Company */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1 max-w-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <Input
                type="text"
                placeholder="Search companies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Link href="/setup">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Company
            </Button>
          </Link>
        </div>

        {/* Companies Grid */}
        {filteredCompanies.length === 0 ? (
          <EmptyState
            icon={<Building2 className="h-6 w-6" />}
            title={companies.length === 0 ? "No companies yet" : "No companies found"}
            description={
              companies.length === 0 
                ? "Get started by creating your first company to manage equity and cap tables." 
                : `No companies match "${searchTerm}". Try a different search term.`
            }
            action={companies.length === 0 ? {
              label: "Create your first company",
              onClick: () => window.location.href = "/setup"
            } : undefined}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCompanies.map((company) => (
              <Link key={company.id} href={`/companies/${company.id}`}>
                <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg text-neutral-900 truncate">
                          {company.name}
                        </h3>
                        {company.description && (
                          <p className="text-sm text-neutral-600 line-clamp-2">
                            {company.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-neutral-500">
                      <span>View details</span>
                      <span>→</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}