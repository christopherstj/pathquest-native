/**
 * useGuestData Hook
 * 
 * Fetches public data for unauthenticated users including:
 * - Popular challenges (for discovery)
 * - Recent community activity (public summits)
 * 
 * These endpoints require no authentication.
 */

import { useQuery } from '@tanstack/react-query';
import { getApiClient } from '@/src/lib/api/client';
import { endpoints } from '@pathquest/shared/api';
import type { Challenge } from '@pathquest/shared';
import type { RecentPublicSummit } from '@pathquest/shared/api/endpoints/peaks';

/**
 * Fetch popular challenges (public, no auth required)
 */
export function usePopularChallenges(limit = 5) {
  return useQuery({
    queryKey: ['popularChallenges', limit],
    queryFn: async (): Promise<Challenge[]> => {
      const client = getApiClient();
      return await endpoints.getPopularChallenges(client, { limit });
    },
    staleTime: 1000 * 60 * 10, // 10 minutes (doesn't change often)
  });
}

/**
 * Fetch recent public summits from the community (public, no auth required)
 */
export function useRecentPublicSummits(limit = 10) {
  return useQuery({
    queryKey: ['recentPublicSummits', limit],
    queryFn: async (): Promise<RecentPublicSummit[]> => {
      const client = getApiClient();
      return await endpoints.getRecentPublicSummits(client, { limit });
    },
    staleTime: 1000 * 60 * 2, // 2 minutes (more dynamic)
  });
}

