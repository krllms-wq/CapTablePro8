/**
 * Activity Feed Component with date grouping, real-time updates, and auto-refetching
 */
import React, { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { formatRelativeTime, formatDate } from '@/utils/date';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity, User, Briefcase, TrendingUp, FileText, Shuffle, Clock, RefreshCw } from 'lucide-react';

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
  
  // Transaction Events
  if (eventType === 'transaction.shares_issued') {
    const quantity = metadata?.quantity ? Number(metadata.quantity).toLocaleString() : 'N/A';
    const securityClass = metadata?.securityClassName || metadata?.securityClass || 'Common';
    const stakeholder = metadata?.stakeholderName || 'Unknown';
    const consideration = metadata?.consideration ? `$${Number(metadata.consideration).toLocaleString()}` : '';
    const date = metadata?.issueDate ? new Date(metadata.issueDate).toLocaleDateString() : '';
    
    return `Issued ${quantity} ${securityClass} shares to ${stakeholder}${consideration ? ` for ${consideration}` : ''}${date ? ` on ${date}` : ''}`;
  }
  
  if (eventType === 'transaction.options_granted' || eventType === 'transaction.equity_awarded') {
    const quantity = metadata?.quantity ? Number(metadata.quantity).toLocaleString() : 'N/A';
    const awardType = metadata?.awardType || metadata?.type || 'options';
    const stakeholder = metadata?.stakeholderName || 'Unknown';
    const strikePrice = metadata?.strikePrice ? `$${metadata.strikePrice}` : '';
    const date = metadata?.grantDate ? new Date(metadata.grantDate).toLocaleDateString() : '';
    
    return `Granted ${quantity} ${awardType}${strikePrice ? ` at ${strikePrice}` : ''} to ${stakeholder}${date ? ` on ${date}` : ''}`;
  }
  
  if (eventType === 'transaction.secondary_transfer') {
    const seller = metadata?.seller || 'Unknown';
    const buyer = metadata?.buyer || 'Unknown';
    const quantity = metadata?.quantity ? Number(metadata.quantity).toLocaleString() : 'N/A';
    const pricePerShare = metadata?.pricePerShare ? `$${metadata.pricePerShare}` : '';
    const totalValue = metadata?.totalValue ? `$${Number(metadata.totalValue).toLocaleString()}` : '';
    
    return `Secondary transfer: ${seller} → ${buyer} (${quantity} shares${pricePerShare ? ` @ ${pricePerShare}` : ''}${totalValue ? ` = ${totalValue}` : ''})`;
  }
  
  if (eventType === 'transaction.safe_created') {
    const stakeholder = metadata?.stakeholderName || 'Unknown';
    const principal = metadata?.principal ? `$${Number(metadata.principal).toLocaleString()}` : 'N/A';
    const framework = metadata?.framework || 'SAFE';
    const date = metadata?.issueDate ? new Date(metadata.issueDate).toLocaleDateString() : '';
    
    return `Created ${framework} for ${stakeholder} (${principal}${date ? ` on ${date}` : ''})`;
  }
  
  if (eventType === 'transaction.convertible_created') {
    const stakeholder = metadata?.stakeholderName || 'Unknown';
    const principal = metadata?.principal ? `$${Number(metadata.principal).toLocaleString()}` : 'N/A';
    const interestRate = metadata?.interestRate ? `${metadata.interestRate}%` : '';
    const date = metadata?.issueDate ? new Date(metadata.issueDate).toLocaleDateString() : '';
    
    return `Created convertible note for ${stakeholder} (${principal}${interestRate ? ` @ ${interestRate}` : ''}${date ? ` on ${date}` : ''})`;
  }
  
  if (eventType === 'transaction.equity_canceled') {
    const quantity = metadata?.quantity ? Number(metadata.quantity).toLocaleString() : 'N/A';
    const awardType = metadata?.awardType || 'equity awards';
    const stakeholder = metadata?.stakeholderName || 'Unknown';
    
    return `Canceled ${quantity} ${awardType} for ${stakeholder}`;
  }
  
  // Stakeholder Events
  if (eventType === 'stakeholder.created') {
    const name = metadata?.stakeholderName || 'Unknown';
    const type = metadata?.stakeholderType || '';
    return `Added new ${type ? `${type} ` : ''}stakeholder: ${name}`;
  }
  
  if (eventType === 'stakeholder.updated') {
    const stakeholderName = metadata?.stakeholderName || 'Unknown';
    const changes = metadata?.changes;
    
    if (changes) {
      const changeDescriptions = [];
      if (changes.type) changeDescriptions.push(`type: ${changes.type.from} → ${changes.type.to}`);
      if (changes.name) changeDescriptions.push(`name: ${changes.name.from} → ${changes.name.to}`);
      if (changes.email) changeDescriptions.push(`email: ${changes.email.from} → ${changes.email.to}`);
      
      if (changeDescriptions.length > 0) {
        return `Updated ${stakeholderName} (${changeDescriptions.join(', ')})`;
      }
    }
    
    return `Updated stakeholder: ${stakeholderName}`;
  }
  
  if (eventType === 'stakeholder.deleted') {
    const name = metadata?.stakeholderName || 'Unknown';
    return `Removed stakeholder: ${name}`;
  }
  
  // Company Events
  if (eventType === 'company.created') {
    const name = metadata?.companyName || 'Company';
    return `Created company: ${name}`;
  }
  
  if (eventType === 'company.updated') {
    const changes = metadata?.changedFields || {};
    const changeCount = Object.keys(changes).length;
    return `Updated company settings (${changeCount} ${changeCount === 1 ? 'change' : 'changes'})`;
  }
  
  // Corporate Actions
  if (eventType === 'corporate.stock_split') {
    const ratio = metadata?.splitRatio || 'N/A';
    const affectedShares = metadata?.affectedShares ? Number(metadata.affectedShares).toLocaleString() : 'N/A';
    return `Stock split executed (${ratio}:1 ratio, ${affectedShares} shares affected)`;
  }
  
  if (eventType === 'corporate.name_change') {
    const from = metadata?.oldName || 'Unknown';
    const to = metadata?.newName || 'Unknown';
    return `Company name changed: ${from} → ${to}`;
  }
  
  // Demo/System Events
  if (eventType === 'demo.seeded') {
    const stakeholders = metadata?.stakeholders || 0;
    const transactions = metadata?.shareIssuances || metadata?.transactions || 0;
    return `Demo data seeded: ${stakeholders} stakeholders, ${transactions} transactions`;
  }
  
  if (eventType === 'system.data_imported') {
    const records = metadata?.recordCount || 0;
    const type = metadata?.importType || 'data';
    return `Imported ${records} ${type} records`;
  }
  
  // Fallback for any unrecognized event types
  // Convert event type to readable format
  const parts = eventType.split(/[._]/);
  const category = parts[0] || 'system';
  const action = parts[1] || 'action';
  
  const readableCategory = category.charAt(0).toUpperCase() + category.slice(1);
  const readableAction = action.replace(/([A-Z])/g, ' $1').toLowerCase().trim();
  
  const stakeholder = metadata?.stakeholderName || metadata?.name;
  const quantity = metadata?.quantity;
  
  let description = `${readableCategory} ${readableAction}`;
  
  if (stakeholder) {
    description += ` - ${stakeholder}`;
  }
  
  if (quantity) {
    description += ` (${Number(quantity).toLocaleString()})`;
  }
  
  return description;
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
  const queryClient = useQueryClient();
  
  const { data: activities = [], isLoading, refetch, isFetching } = useQuery<ActivityEvent[]>({
    queryKey: ['/api/companies', companyId, 'activity'],
    enabled: !!companyId,
    refetchInterval: 30000, // Refetch every 30 seconds for live updates
    refetchOnWindowFocus: true, // Refetch when window gains focus
  });

  // Auto-refetch when mutations occur by listening for query invalidations
  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event.type === 'updated' && event.query.queryKey[0] === '/api/companies') {
        // If any company-related query is updated, refetch activity
        const isRelevantUpdate = event.query.queryKey.includes(companyId) && 
          (event.query.queryKey.includes('stakeholders') || 
           event.query.queryKey.includes('share-ledger') ||
           event.query.queryKey.includes('equity-awards') ||
           event.query.queryKey.includes('convertibles') ||
           event.query.queryKey.includes('secondary-transfer'));
        
        if (isRelevantUpdate) {
          refetch();
        }
      }
    });

    return unsubscribe;
  }, [queryClient, companyId, refetch]);

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
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity Feed
          </div>
          {isFetching && (
            <RefreshCw className="h-4 w-4 animate-spin text-gray-400" />
          )}
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