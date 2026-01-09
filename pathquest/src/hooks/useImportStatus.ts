/**
 * useImportStatus Hook
 * 
 * Fetches the user's historical activity import status.
 * Polls every 15 seconds when import is in progress.
 */

import { useQuery } from '@tanstack/react-query';
import { getApiClient } from '@/src/lib/api/client';
import { endpoints } from '@pathquest/shared/api';
import { useAuthStore } from '@/src/lib/auth';
import type { ImportStatus } from '@pathquest/shared/api/endpoints/users';

// Re-export the type for convenience
export type { ImportStatus };

/**
 * Fetch user's import status with automatic polling when processing
 */
export function useImportStatus() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const userId = user?.id;

  return useQuery<ImportStatus | null>({
    queryKey: ['importStatus', userId],
    queryFn: async (): Promise<ImportStatus | null> => {
      if (!userId) return null;
      
      try {
        const client = getApiClient();
        return await endpoints.getImportStatus(client, userId);
      } catch (error) {
        console.error('[useImportStatus] Error fetching:', error);
        throw error;
      }
    },
    enabled: isAuthenticated && !!userId,
    staleTime: 1000 * 10, // 10 seconds - data changes frequently during import
    refetchInterval: (query) => {
      // Poll every 15 seconds if import is in progress
      const data = query.state.data;
      if (data?.status === 'processing') {
        return 1000 * 15; // 15 seconds
      }
      // Don't poll if complete or not started
      return false;
    },
  });
}

