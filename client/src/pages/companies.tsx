import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Building, Users, Calendar, Globe } from "lucide-react";
import { Link } from "wouter";

interface Company {
  id: string;
  name: string;
  description?: string;
  country: string;
  incorporationDate: string;
  authorizedShares: number;
  createdAt: string;
}

export default function CompaniesPage() {
  const { data: companies, isLoading } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading companies...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Your Companies</h1>
          <p className="text-neutral-600 mt-2">
            Manage cap tables and equity for your portfolio companies
          </p>
        </div>
        <Link href="/setup">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Company
          </Button>
        </Link>
      </div>

      {!companies || companies.length === 0 ? (
        <div className="text-center py-12">
          <Building className="h-12 w-12 mx-auto mb-4 text-neutral-400" />
          <h3 className="text-lg font-semibold mb-2">No companies yet</h3>
          <p className="text-neutral-600 mb-6">
            Get started by creating your first company and setting up its cap table
          </p>
          <Link href="/setup">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Company
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.map((company) => (
            <Card key={company.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <Link href={`/companies/${company.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <Building className="h-5 w-5 text-neutral-600" />
                      <CardTitle className="text-lg">{company.name}</CardTitle>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {company.country}
                    </Badge>
                  </div>
                  {company.description && (
                    <p className="text-sm text-neutral-600 line-clamp-2">
                      {company.description}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2 text-sm text-neutral-600">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Incorporated {new Date(company.incorporationDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4" />
                      <span>
                        {company.authorizedShares.toLocaleString()} authorized shares
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Globe className="h-4 w-4" />
                      <span>
                        Created {new Date(company.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}