import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { CompaniesEmptyState } from "@/components/ui/empty-state";
import Navigation from "@/components/layout/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Building2 } from "lucide-react";

export default function EnhancedCompanies() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: companies = [], isLoading, error } = useQuery({
    queryKey: ["/api/companies"],
    retry: 3,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const filteredCompanies = (companies as any[]).filter((company: any) =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateCompany = () => {
    window.location.href = "/setup";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
                  <div className="h-3 bg-neutral-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-neutral-200 rounded"></div>
                    <div className="h-3 bg-neutral-200 rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
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
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
            <Building2 className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Failed to load companies</h3>
            <p className="text-neutral-600 mb-4">There was an error loading your companies. Please try again.</p>
            <Button onClick={() => window.location.reload()}>
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
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-neutral-900">Companies</h1>
              <p className="text-neutral-600 mt-1">
                Manage your cap tables across multiple companies
              </p>
            </div>
            <Button onClick={handleCreateCompany} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Company
            </Button>
          </div>

          {/* Search */}
          {(companies as any[]).length > 0 && (
            <div className="max-w-sm">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <Input
                  type="text"
                  placeholder="Search companies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          )}

          {/* Companies Grid */}
          {(companies as any[]).length === 0 ? (
            <CompaniesEmptyState onCreateCompany={handleCreateCompany} />
          ) : filteredCompanies.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
              <Search className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No companies found</h3>
              <p className="text-neutral-600">
                No companies match "{searchTerm}". Try a different search term.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCompanies.map((company: any) => (
                <Link key={company.id} href={`/companies/${company.id}`}>
                  <Card className="hover:shadow-md hover:border-primary/20 transition-all duration-200 cursor-pointer group">
                    <CardHeader>
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">
                        {company.name}
                      </CardTitle>
                      {company.description && (
                        <CardDescription>{company.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-neutral-500">Jurisdiction:</span>
                          <Badge variant="secondary">{company.country}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-500">Currency:</span>
                          <span className="font-medium">{company.currency}</span>
                        </div>
                        {company.authorizedShares && (
                          <div className="flex justify-between">
                            <span className="text-neutral-500">Authorized Shares:</span>
                            <span className="font-medium">{company.authorizedShares.toLocaleString()}</span>
                          </div>
                        )}
                        {company.incorporationDate && (
                          <div className="flex justify-between">
                            <span className="text-neutral-500">Incorporated:</span>
                            <span className="font-medium">
                              {new Date(company.incorporationDate).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}