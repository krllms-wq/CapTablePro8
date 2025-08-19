import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useParams } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { Calendar, Filter, Search, User, Building, Briefcase, DollarSign } from "lucide-react";
import Navigation from "@/components/layout/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AuditLog } from "@shared/schema";

export default function CompanyActivity() {
  const { companyId } = useParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [eventFilter, setEventFilter] = useState("all");
  const [resourceTypeFilter, setResourceTypeFilter] = useState("all");
  const [cursor, setCursor] = useState<string | undefined>();

  const { data: auditLogs, isLoading } = useQuery<AuditLog[]>({
    queryKey: ["/api/companies", companyId, "activity", { 
      event: eventFilter === "all" ? "" : eventFilter, 
      resourceType: resourceTypeFilter === "all" ? "" : resourceTypeFilter,
      cursor 
    }],
    enabled: !!companyId,
  });

  const { data: company } = useQuery({
    queryKey: ["/api/companies", companyId],
    enabled: !!companyId,
  });

  if (!companyId) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-neutral-600">No company selected</p>
        </div>
      </div>
    );
  }

  // Filter audit logs based on search term
  const filteredLogs = auditLogs?.filter(log => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    const metadata = log.metadata as any;
    return (
      log.event.toLowerCase().includes(searchLower) ||
      metadata?.stakeholderName?.toLowerCase().includes(searchLower) ||
      metadata?.details?.toLowerCase().includes(searchLower)
    );
  }) || [];

  const getActivityIcon = (event: string, resourceType: string) => {
    if (resourceType === "stakeholder") {
      return User;
    } else if (resourceType === "company") {
      return Building;
    } else if (resourceType === "transaction") {
      if (event.includes("shares")) return DollarSign;
      if (event.includes("options")) return Briefcase;
      return DollarSign;
    }
    return User;
  };

  const getActivityColor = (event: string) => {
    if (event.includes("created")) return "text-green-600";
    if (event.includes("updated")) return "text-blue-600";
    if (event.includes("deleted")) return "text-red-600";
    if (event.includes("shares")) return "text-purple-600";
    if (event.includes("safe") || event.includes("convertible")) return "text-orange-600";
    return "text-neutral-600";
  };

  const getActivityBgColor = (event: string) => {
    if (event.includes("created")) return "bg-green-100";
    if (event.includes("updated")) return "bg-blue-100";
    if (event.includes("deleted")) return "bg-red-100";
    if (event.includes("shares")) return "bg-purple-100";
    if (event.includes("safe") || event.includes("convertible")) return "bg-orange-100";
    return "bg-neutral-100";
  };

  const formatEventDescription = (log: AuditLog) => {
    const metadata = log.metadata as any;
    const actorName = metadata?.actorName || "Someone";
    
    switch (log.event) {
      case "stakeholder.created":
        return `${actorName} added ${metadata?.stakeholderName || "a stakeholder"}`;
      case "stakeholder.updated":
        return `${actorName} updated ${metadata?.stakeholderName || "a stakeholder"}`;
      case "stakeholder.deleted":
        return `${actorName} removed ${metadata?.stakeholderName || "a stakeholder"}`;
      case "transaction.shares_issued":
        return `${actorName} issued ${metadata?.quantity || "shares"} shares to ${metadata?.stakeholderName || "a stakeholder"}`;
      case "transaction.options_granted":
        return `${actorName} granted ${metadata?.quantity || "options"} ${metadata?.awardType || "equity awards"} to ${metadata?.stakeholderName || "a stakeholder"}`;
      case "transaction.safe_created":
        return `${actorName} created a SAFE for ${metadata?.stakeholderName || "a stakeholder"}`;
      case "transaction.convertible_created":
        return `${actorName} created a convertible note for ${metadata?.stakeholderName || "a stakeholder"}`;
      case "company.updated":
        return `${actorName} updated company settings`;
      case "company.created":
        return `${actorName} created the company`;
      default:
        return metadata?.details || log.event.replace(/[._]/g, " ");
    }
  };

  const formatEventDetails = (log: AuditLog) => {
    const metadata = log.metadata as any;
    const details = [];
    
    if (metadata?.quantity) {
      details.push(`Quantity: ${Intl.NumberFormat().format(metadata.quantity)}`);
    }
    if (metadata?.consideration) {
      details.push(`Consideration: ${Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(metadata.consideration)}`);
    }
    if (metadata?.securityClassName) {
      details.push(`Security: ${metadata.securityClassName}`);
    }
    if (metadata?.awardType) {
      details.push(`Type: ${metadata.awardType}`);
    }
    if (metadata?.changedFields && Object.keys(metadata.changedFields).length > 0) {
      details.push(`Fields: ${Object.keys(metadata.changedFields).join(", ")}`);
    }
    
    return details.length > 0 ? details.join(" • ") : "No additional details";
  };

  const loadMore = () => {
    if (filteredLogs.length > 0) {
      setCursor(filteredLogs[filteredLogs.length - 1].id);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-neutral-900">Company Activity</h1>
              <p className="text-neutral-600 mt-1">{(company as any)?.name || 'Company'} • Activity Feed</p>
            </div>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                  <Input
                    placeholder="Search activity..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={eventFilter} onValueChange={setEventFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Event type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All events</SelectItem>
                    <SelectItem value="stakeholder.created">Stakeholder created</SelectItem>
                    <SelectItem value="stakeholder.updated">Stakeholder updated</SelectItem>
                    <SelectItem value="transaction.shares_issued">Shares issued</SelectItem>
                    <SelectItem value="transaction.options_granted">Options granted</SelectItem>
                    <SelectItem value="transaction.safe_created">SAFE created</SelectItem>
                    <SelectItem value="transaction.convertible_created">Note created</SelectItem>
                    <SelectItem value="company.updated">Company updated</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={resourceTypeFilter} onValueChange={setResourceTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Resource type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All resources</SelectItem>
                    <SelectItem value="stakeholder">Stakeholders</SelectItem>
                    <SelectItem value="transaction">Transactions</SelectItem>
                    <SelectItem value="company">Company</SelectItem>
                    <SelectItem value="user">Users</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm("");
                    setEventFilter("all");
                    setResourceTypeFilter("all");
                    setCursor(undefined);
                  }}
                >
                  Clear filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Activity Feed */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Activity Feed</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-start space-x-4 animate-pulse">
                      <div className="w-10 h-10 bg-neutral-200 rounded-full flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <div className="h-4 bg-neutral-200 rounded mb-2"></div>
                        <div className="h-3 bg-neutral-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-neutral-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="text-center py-12 text-neutral-500">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-neutral-300" />
                  <p className="text-lg mb-2">No activity found</p>
                  <p className="text-sm">Try adjusting your filters or check back later</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredLogs.map((log) => {
                    const IconComponent = getActivityIcon(log.event, log.resourceType);
                    
                    return (
                      <div key={log.id} className="flex items-start space-x-4 p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors">
                        <div className={`w-10 h-10 ${getActivityBgColor(log.event)} rounded-full flex items-center justify-center flex-shrink-0`}>
                          <IconComponent className={`h-5 w-5 ${getActivityColor(log.event)}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-neutral-900 font-medium">
                            {formatEventDescription(log)}
                          </p>
                          <p className="text-xs text-neutral-600 mt-1">
                            {formatEventDetails(log)}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-neutral-400">
                            <span>{formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}</span>
                            <span className="capitalize">{log.resourceType}</span>
                            {log.actorId && <span>User ID: {log.actorId.slice(-8)}</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {filteredLogs.length >= 20 && (
                    <div className="text-center pt-4">
                      <Button variant="outline" onClick={loadMore}>
                        Load more activity
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}