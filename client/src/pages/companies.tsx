import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth, logout } from "@/hooks/useAuth";
import { formatCurrency } from "@/lib/formatters";
import type { Company } from "@shared/schema";

export default function CompaniesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ["/api/companies"],
  });

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
  };

  const filteredCompanies = companies.filter((company: Company) =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-primary/20 rounded-xl mx-auto mb-4 animate-pulse"></div>
          <p className="text-gray-600">Loading companies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                  <i className="fas fa-chart-pie text-white"></i>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">CapTable Pro</h1>
                  <p className="text-gray-600">Manage your equity and cap tables</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {user && (
                <div className="flex items-center space-x-3">
                  <Link href="/profile">
                    <Button variant="outline" size="sm">
                      <i className="fas fa-user mr-2"></i>
                      {user.firstName} {user.lastName}
                    </Button>
                  </Link>
                  <Button variant="outline" size="sm" onClick={handleLogout}>
                    <i className="fas fa-sign-out-alt mr-2"></i>
                    Logout
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 px-6">
        {/* Search and Actions */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                <Input
                  placeholder="Search companies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Link href="/setup">
                <Button>
                  <i className="fas fa-plus mr-2"></i>
                  Add Company
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Companies Grid */}
        {filteredCompanies.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="w-16 h-16 bg-neutral-100 rounded-xl mx-auto mb-4 flex items-center justify-center">
                <i className="fas fa-building text-2xl text-neutral-400"></i>
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                {searchTerm ? "No companies found" : "No companies yet"}
              </h3>
              <p className="text-neutral-600 mb-6">
                {searchTerm 
                  ? "Try adjusting your search terms"
                  : "Get started by adding your first company"
                }
              </p>
              {!searchTerm && (
                <Link href="/setup">
                  <Button>
                    <i className="fas fa-plus mr-2"></i>
                    Add Your First Company
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCompanies.map((company: Company) => (
              <Link key={company.id} href={`/companies/${company.id}`}>
                <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg group-hover:text-primary transition-colors">
                          {company.name}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {company.description}
                        </CardDescription>
                      </div>
                      <Badge variant="secondary" className="ml-2">
                        {company.country}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-neutral-600">Currency</span>
                        <span className="font-medium">{company.currency}</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-neutral-600">Authorized Shares</span>
                        <span className="font-medium">
                          {company.authorizedShares?.toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-neutral-600">Par Value</span>
                        <span className="font-medium">{formatCurrency(parseFloat(company.parValue))}</span>
                      </div>
                      
                      <div className="pt-2 flex items-center text-xs text-neutral-500">
                        <i className="fas fa-calendar mr-2"></i>
                        Incorporated {company.incorporationDate.toLocaleDateString()}
                      </div>
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