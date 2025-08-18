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
  const activities = auditLogs?.slice(0, 4).map((log: any) => ({
    id: log.id,
    type: log.action,
    title: log.action.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
    description: log.details || `${log.entityType} ${log.action}`,
    details: log.metadata ? JSON.stringify(log.metadata) : "No details available",
    timestamp: new Date(log.timestamp),
    icon: getActivityIcon(log.action),
    iconColor: getActivityIconColor(log.action),
    iconBg: getActivityIconBg(log.action)
  })) || [];

  function getActivityIcon(action: string) {
    switch (action) {
      case 'create': return "fas fa-plus";
      case 'update': return "fas fa-edit";
      case 'delete': return "fas fa-trash";
      case 'issue_shares': return "fas fa-certificate";
      case 'grant_options': return "fas fa-gift";
      default: return "fas fa-file";
    }
  }

  function getActivityIconColor(action: string) {
    switch (action) {
      case 'create': return "text-green-600";
      case 'update': return "text-blue-600";
      case 'delete': return "text-red-600";
      case 'issue_shares': return "text-purple-600";
      case 'grant_options': return "text-orange-600";
      default: return "text-neutral-600";
    }
  }

  function getActivityIconBg(action: string) {
    switch (action) {
      case 'create': return "bg-green-100";
      case 'update': return "bg-blue-100";
      case 'delete': return "bg-red-100";
      case 'issue_shares': return "bg-purple-100";
      case 'grant_options': return "bg-orange-100";
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
          {activities.map((activity) => (
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
                  {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
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
