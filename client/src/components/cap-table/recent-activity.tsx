import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";

interface RecentActivityProps {
  companyId: string;
}

export default function RecentActivity({ companyId }: RecentActivityProps) {
  const { data: auditLogs, isLoading } = useQuery({
    queryKey: ["/api/companies", companyId, "audit-logs"],
    enabled: !!companyId,
  });

  // Transform audit logs into activities
  const activities = (auditLogs as any[])?.slice(0, 4)?.map((log: any) => {
    const payload = log.payloadDiff || {};
    const details = payload.details || `${payload.entityType || 'Unknown'} ${log.action}`;
    
    return {
      id: log.id,
      type: log.action,
      title: log.action?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'Unknown Action',
      description: details,
      details: payload.stakeholderName 
        ? `Stakeholder: ${payload.stakeholderName}` 
        : payload.quantity 
        ? `Quantity: ${payload.quantity}` 
        : "No details available",
      timestamp: log.timestamp ? new Date(log.timestamp) : new Date(),
      icon: getActivityIcon(log.action || ''),
      iconColor: getActivityIconColor(log.action || ''),
      iconBg: getActivityIconBg(log.action || '')
    };
  }) || [];

  function getActivityIcon(action: string) {
    switch (action) {
      case 'stakeholder_created': return "fas fa-user-plus";
      case 'shares_issued': return "fas fa-certificate";
      case 'equity_award_granted': return "fas fa-gift";
      case 'convertible_created': return "fas fa-exchange-alt";
      case 'create': return "fas fa-plus";
      case 'update': return "fas fa-edit";
      case 'delete': return "fas fa-trash";
      default: return "fas fa-file";
    }
  }

  function getActivityIconColor(action: string) {
    switch (action) {
      case 'stakeholder_created': return "text-green-600";
      case 'shares_issued': return "text-purple-600";
      case 'equity_award_granted': return "text-orange-600";
      case 'convertible_created': return "text-blue-600";
      case 'create': return "text-green-600";
      case 'update': return "text-blue-600";
      case 'delete': return "text-red-600";
      default: return "text-neutral-600";
    }
  }

  function getActivityIconBg(action: string) {
    switch (action) {
      case 'stakeholder_created': return "bg-green-100";
      case 'shares_issued': return "bg-purple-100";
      case 'equity_award_granted': return "bg-orange-100";
      case 'convertible_created': return "bg-blue-100";
      case 'create': return "bg-green-100";
      case 'update': return "bg-blue-100";
      case 'delete': return "bg-red-100";
      default: return "bg-neutral-100";
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-neutral-900">Recent Activity</h3>
        <Link href={`/companies/${companyId}/transactions`}>
          <button className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors">
            View all activity
          </button>
        </Link>
      </div>
      
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-start space-x-3 animate-pulse">
              <div className="w-8 h-8 bg-neutral-200 rounded-full flex-shrink-0"></div>
              <div className="flex-1 min-w-0">
                <div className="h-4 bg-neutral-200 rounded mb-2"></div>
                <div className="h-3 bg-neutral-200 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center text-neutral-500">
          No recent activity found
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity: any) => (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className={`w-8 h-8 ${activity.iconBg} rounded-full flex items-center justify-center flex-shrink-0`}>
                <i className={`${activity.icon} ${activity.iconColor} text-sm`}></i>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-neutral-900">
                  <span className="font-medium">{activity.title}</span> {activity.description}
                </p>
                <p className="text-xs text-neutral-500 mt-1">{activity.details}</p>
                <p className="text-xs text-neutral-400 mt-1">
                  {activity.timestamp && !isNaN(activity.timestamp.getTime()) 
                    ? formatDistanceToNow(activity.timestamp, { addSuffix: true })
                    : 'Recently'
                  }
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <button 
        onClick={() => window.location.href = `/companies/${companyId}/transactions`}
        className="w-full mt-4 text-center text-sm text-primary hover:text-primary-dark font-medium"
      >
        View all activity
      </button>
    </div>
  );
}
