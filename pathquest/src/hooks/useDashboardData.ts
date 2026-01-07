/**
 * useDashboardData Hook
 * 
 * Fetches data for the Home dashboard including:
 * - Dashboard stats (total peaks, elevation, challenge progress)
 * - Recent summits
 * - Favorite challenges with progress
 * - Suggested next peak with weather
 */

import { useQuery } from '@tanstack/react-query';
import { getApiClient } from '@/src/lib/api/client';
import { endpoints } from '@pathquest/shared/api';
import { useAuthStore } from '@/src/lib/auth';
import type { ChallengeProgress, DashboardStats } from '@pathquest/shared';
type SuggestedPeak = Awaited<ReturnType<typeof endpoints.getSuggestedPeak>>;

/**
 * Fetch dashboard stats (total peaks, elevation, challenge progress)
 */
export function useDashboardStats() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  return useQuery({
    queryKey: ['dashboardStats'],
    queryFn: async (): Promise<DashboardStats> => {
      const client = getApiClient();
      console.log('[useDashboardStats] Fetching stats');
      try {
        const stats = await endpoints.getDashboardStats(client);
        console.log('[useDashboardStats] Fetched stats:', stats);
        return stats;
      } catch (error) {
        console.error('[useDashboardStats] Error:', error);
        throw error;
      }
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Fetch recent summits for the dashboard
 */
export function useRecentSummits(limit = 5) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  return useQuery({
    queryKey: ['recentSummits', limit],
    queryFn: async (): Promise<any[]> => {
      const client = getApiClient();
      console.log('[useRecentSummits] Fetching recent summits');
      try {
        const summits = await endpoints.getRecentSummits(client, { limit });
        console.log('[useRecentSummits] Fetched', summits.length, 'summits:', summits[0]);
        return summits;
      } catch (error) {
        console.error('[useRecentSummits] Error:', error);
        throw error;
      }
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Fetch favorite challenges for the dashboard
 */
export function useFavoriteChallenges() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  return useQuery({
    queryKey: ['favoriteChallenges'],
    queryFn: async (): Promise<ChallengeProgress[]> => {
      const client = getApiClient();
      try {
        const challenges = await endpoints.getFavoriteChallenges(client);
        console.log('[useFavoriteChallenges] Fetched', challenges.length, 'challenges');
        return challenges;
      } catch (error) {
        console.error('[useFavoriteChallenges] Error:', error);
        throw error;
      }
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Fetch suggested next peak based on user's location
 */
export function useSuggestedPeak(coords: { lat: number; lng: number } | null) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  return useQuery({
    queryKey: ['suggestedPeak', coords?.lat, coords?.lng],
    queryFn: async (): Promise<SuggestedPeak | null> => {
      if (!coords) return null;
      
      const client = getApiClient();
      console.log('[useSuggestedPeak] Fetching suggested peak for coords:', coords);
      try {
        const peak = await endpoints.getSuggestedPeak(client, {
          lat: coords.lat,
          lng: coords.lng,
          maxDistanceMiles: 100,
        });
        console.log('[useSuggestedPeak] Fetched suggested peak:', peak?.peak_name ?? 'none');
        return peak;
      } catch (error) {
        console.error('[useSuggestedPeak] Error:', error);
        throw error;
      }
    },
    enabled: isAuthenticated && coords !== null,
    staleTime: 1000 * 60 * 10, // 10 minutes (weather doesn't change that fast)
  });
}

/**
 * Combined dashboard data hook
 */
export function useDashboardData() {
  const dashboardStats = useDashboardStats();
  const recentSummits = useRecentSummits();
  const favoriteChallenges = useFavoriteChallenges();
  
  return {
    stats: dashboardStats.data ?? null,
    recentSummits: recentSummits.data ?? [],
    favoriteChallenges: favoriteChallenges.data ?? [],
    isLoading: dashboardStats.isLoading || recentSummits.isLoading || favoriteChallenges.isLoading,
    isFetching: dashboardStats.isFetching || recentSummits.isFetching || favoriteChallenges.isFetching,
    isError: dashboardStats.isError || recentSummits.isError || favoriteChallenges.isError,
    refetch: () => {
      dashboardStats.refetch();
      recentSummits.refetch();
      favoriteChallenges.refetch();
    },
  };
}
