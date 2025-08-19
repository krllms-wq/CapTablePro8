/**
 * Activity Feed Component with date grouping and reliable updates
 */
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatRelativeTime, formatDate } from '@/utils/date';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity, User, Briefcase, TrendingUp, FileText, Shuffle } from 'lucide-react';

interface ActivityFeedProps {
  companyId: string;
  className?: string;
}

interface ActivityEvent {
  id: string;
  event: string;
  actorId: string;
  actorName?: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

const getEventIcon = (event: string) => {
  if (event.includes('stakeholder')) return User;
  if (event.includes('transaction')) return TrendingUp;
  if (event.includes('company')) return Briefcase;
  if (event.includes('document')) return FileText;
  if (event.includes('transfer')) return Shuffle;
  return Activity;
};

const getEventColor = (event: string) => {
  if (event.includes('created')) return 'text-green-600 bg-green-50';
  if (event.includes('updated')) return 'text-blue-600 bg-blue-50';
  if (event.includes('deleted')) return 'text-red-600 bg-red-50';
  if (event.includes('transfer')) return 'text-purple-600 bg-purple-50';
  return 'text-gray-600 bg-gray-50';
};

const formatEventDescription = (event: ActivityEvent) => {
  const { event: eventType, metadata } = event;
  
  if (eventType === 'transaction.options_granted') {
    return `Granted ${metadata?.quantity || 'N/A'} ${metadata?.awardType || 'options'} to ${metadata?.stakeholderName || 'stakeholder'}`;
  }
  
  if (eventType === 'transaction.secondary_transfer') {
    return `Secondary transfer: ${metadata?.seller || 'Unknown'} → ${metadata?.buyer || 'Unknown'} (${metadata?.quantity || 'N/A'} shares)`;
  }
  
  if (eventType === 'stakeholder.created') {
    return `Added new stakeholder: ${metadata?.stakeholderName || 'Unknown'}`;
  }
  
  if (eventType === 'stakeholder.updated') {
    return `Updated stakeholder: ${metadata?.stakeholderName || 'Unknown'}`;
  }
  
  if (eventType === 'transaction.shares_issued') {
    return `Issued ${metadata?.quantity || 'N/A'} shares to ${metadata?.stakeholderName || 'Unknown'}`;
  }
  
  // Default formatting
  return eventType.replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const groupEventsByDate = (events: ActivityEvent[]) => {
  const groups: { [date: string]: ActivityEvent[] } = {};
  
  events.forEach(event => {
    const date = new Date(event.createdAt).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(event);
  });
  
  return Object.entries(groups).sort(([a], [b]) => 
    new Date(b).getTime() - new Date(a).getTime()
  );
};

export function ActivityFeed({ companyId, className = '' }: ActivityFeedProps) {
  const { data: activities = [], isLoading, refetch } = useQuery<ActivityEvent[]>({
    queryKey: ['/api/companies', companyId, 'activity'],
    enabled: !!companyId,
    refetchInterval: 30000, // Refetch every 30 seconds for live updates
  });

  // Group activities by date
  const groupedActivities = groupEventsByDate(activities);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity Feed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3 animate-pulse">
                <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mt-1"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Activity Feed
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-80">
          {groupedActivities.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No activity yet
            </div>
          ) : (
            <div className="space-y-6">
              {groupedActivities.map(([date, events]) => (
                <div key={date}>
                  <h4 className="text-sm font-medium text-gray-500 mb-2 sticky top-0 bg-white">
                    {formatDate(date)}
                  </h4>
                  <div className="space-y-3">
                    {events.map((event) => {
                      const IconComponent = getEventIcon(event.event);
                      return (
                        <div key={event.id} className="flex items-start space-x-3">
                          <div className={`p-1.5 rounded-full ${getEventColor(event.event)}`}>
                            <IconComponent className="h-3 w-3" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900">
                              {formatEventDescription(event)}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-xs text-gray-500">
                                {formatRelativeTime(event.createdAt)}
                              </p>
                              {event.actorName && (
                                <Badge variant="secondary" className="text-xs">
                                  {event.actorName}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}