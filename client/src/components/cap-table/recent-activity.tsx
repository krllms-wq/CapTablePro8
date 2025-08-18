import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";

interface RecentActivityProps {
  companyId: string;
}

export default function RecentActivity({ companyId }: RecentActivityProps) {
  const { data: auditLogs, isLoading } = useQuery({
    queryKey: ["/api/companies", companyId, "audit-logs"],
    enabled: !!companyId,
  });

  // Mock recent activities for display
  const mockActivities = [
    {
      id: "1",
      type: "option_grant",
      title: "Option grant",
      description: "to Sarah Adams",
      details: "185,000 shares • 4-year vesting • 1-year cliff",
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      icon: "fas fa-plus",
      iconColor: "text-green-600",
      iconBg: "bg-green-100"
    },
    {
      id: "2",
      type: "round_closed",
      title: "Series A",
      description: "round closed",
      details: "$10M raised • 1.5M new shares • $6.67 PPS",
      timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
      icon: "fas fa-exchange-alt",
      iconColor: "text-blue-600",
      iconBg: "bg-blue-100"
    },
    {
      id: "3",
      type: "safe_conversion",
      title: "SAFE conversion",
      description: "completed",
      details: "$2M SAFE • 20% discount • 350,000 shares",
      timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 2 weeks ago
      icon: "fas fa-file-alt",
      iconColor: "text-orange-600",
      iconBg: "bg-orange-100"
    },
    {
      id: "4",
      type: "option_pool",
      title: "Option pool",
      description: "increased",
      details: "15% post-money • 1.2M shares allocated",
      timestamp: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000), // 3 weeks ago
      icon: "fas fa-users",
      iconColor: "text-purple-600",
      iconBg: "bg-purple-100"
    }
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-neutral-900">Recent Activity</h3>
        <button className="text-neutral-400 hover:text-neutral-600 transition-colors">
          <i className="fas fa-history"></i>
        </button>
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
      ) : (
        <div className="space-y-4">
          {mockActivities.map((activity) => (
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
      
      <button className="w-full mt-4 text-center text-sm text-primary hover:text-primary-dark font-medium">
        View all activity
      </button>
    </div>
  );
}
