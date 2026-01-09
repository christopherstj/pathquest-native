/**
 * useUnconfirmedSummits Hook
 * 
 * Fetches unconfirmed summits that need user review.
 * These are low-confidence summits detected from Strava activities.
 */

import { useQuery } from '@tanstack/react-query';
import { getApiClient } from '@/src/lib/api/client';
import { endpoints } from '@pathquest/shared/api';
import { useAuthStore } from '@/src/lib/auth';
import type { UnconfirmedSummit } from '@pathquest/shared';

/**
 * Fetch unconfirmed summits that need review
 */
export function useUnconfirmedSummits(limit?: number) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  console.log('[useUnconfirmedSummits] isAuthenticated:', isAuthenticated, 'limit:', limit);
  
  return useQuery({
    queryKey: ['unconfirmedSummits', limit],
    queryFn: async (): Promise<UnconfirmedSummit[]> => {
      try {
        const client = getApiClient();
        const result = await endpoints.getUnconfirmedSummits(client, limit !== undefined ? { limit } : undefined);
        return result ?? [];
      } catch (error) {
        console.error('[useUnconfirmedSummits] Error fetching:', error);
        throw error;
      }
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 2, // 2 minutes - check frequently for new summits
  });
}

