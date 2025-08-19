/**
 * Hook to automatically refresh activity feed when mutations occur
 */
import { useQueryClient } from '@tanstack/react-query';

export function useActivityRefresh(companyId: string) {
  const queryClient = useQueryClient();

  const invalidateActivity = () => {
    queryClient.invalidateQueries({
      queryKey: ['/api/companies', companyId, 'activity']
    });
  };

  const invalidateOnMutation = (mutationKey: string[]) => {
    // Invalidate activity feed after successful mutations
    queryClient.invalidateQueries({
      queryKey: ['/api/companies', companyId, 'activity']
    });
    
    // Also invalidate related queries
    if (mutationKey.includes('stakeholders')) {
      queryClient.invalidateQueries({
        queryKey: ['/api/companies', companyId, 'stakeholders']
      });
    }
    
    if (mutationKey.includes('share-ledger') || mutationKey.includes('secondary-transfer')) {
      queryClient.invalidateQueries({
        queryKey: ['/api/companies', companyId, 'share-ledger']
      });
      queryClient.invalidateQueries({
        queryKey: ['/api/companies', companyId, 'cap-table']
      });
    }
    
    if (mutationKey.includes('equity-awards')) {
      queryClient.invalidateQueries({
        queryKey: ['/api/companies', companyId, 'equity-awards']
      });
    }
    
    if (mutationKey.includes('convertibles')) {
      queryClient.invalidateQueries({
        queryKey: ['/api/companies', companyId, 'convertibles']
      });
    }
  };

  return {
    invalidateActivity,
    invalidateOnMutation
  };
}