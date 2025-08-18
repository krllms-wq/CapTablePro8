import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Users, User, Building, Mail, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Navigation from "@/components/layout/navigation";
import type { Stakeholder } from "@shared/schema";

export default function Stakeholders() {
  const companyId = "cc5ebdde-1683-434a-8292-ca7fe00dd4ee"; // Using the correct company ID

  const { data: stakeholders, isLoading } = useQuery<Stakeholder[]>({
    queryKey: ["/api/companies", companyId, "stakeholders"],
    enabled: !!companyId,
  });

  const personStakeholders = stakeholders?.filter(s => s.type === "person") || [];
  const entityStakeholders = stakeholders?.filter(s => s.type === "entity") || [];

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-3">
                <Users className="h-8 w-8" />
                Stakeholders
              </h1>
              <p className="text-neutral-600 mt-1">
                Manage individual and entity stakeholders in your cap table
              </p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Individual Stakeholders</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{personStakeholders.length}</div>
              <p className="text-xs text-muted-foreground">
                Founders, employees, and advisors
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Entity Stakeholders</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{entityStakeholders.length}</div>
              <p className="text-xs text-muted-foreground">
                Institutional investors and funds
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Stakeholders Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Stakeholders</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading stakeholders...</div>
            ) : stakeholders?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No stakeholders found
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stakeholders?.map((stakeholder) => (
                    <TableRow key={stakeholder.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {stakeholder.type === "person" ? (
                            <User className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Building className="h-4 w-4 text-muted-foreground" />
                          )}
                          {stakeholder.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={stakeholder.type === "person" ? "default" : "secondary"}>
                          {stakeholder.type === "person" ? "Individual" : "Entity"}
                        </Badge>
                      </TableCell>
                      <TableCell>{stakeholder.title || "-"}</TableCell>
                      <TableCell>
                        {stakeholder.email ? (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            <span className="text-sm">{stakeholder.email}</span>
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <Link href={`/stakeholders/${stakeholder.id}`}>
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View Details
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
