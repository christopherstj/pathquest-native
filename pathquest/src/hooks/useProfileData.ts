/**
 * useProfileData Hook
 * 
 * Fetches data for the Profile (You) tab including:
 * - User profile and stats
 * - Summited peaks list
 * - Summit journal entries (summits with notes)
 * - Accepted challenges with progress
 */

import { useQuery } from '@tanstack/react-query';
import { getApiClient } from '@/src/lib/api/client';
import { endpoints } from '@pathquest/shared/api';
import { useAuthStore } from '@/src/lib/auth';
import type { 
  ChallengeProgress, 
  ProfileStats, 
  UserPeakWithSummitCount,
} from '@pathquest/shared';

// Derive types from endpoint return types (not directly exported from package)
type UserProfileResponse = Awaited<ReturnType<typeof endpoints.getUserProfile>>;
type SearchUserPeaksResult = Awaited<ReturnType<typeof endpoints.searchUserPeaks>>;
type SearchUserSummitsResult = Awaited<ReturnType<typeof endpoints.searchUserSummits>>;

export type JournalEntry = {
  id: string;
  peakId: string;
  peakName: string;
  peakState?: string; // State where the peak is located
  elevation?: number;
  timestamp: string;
  activityId?: string;
  notes?: string;
  difficulty?: string;
  experienceRating?: string;
  conditionTags?: string[];
  customTags?: string[];
  temperature?: number;
  cloudCover?: number;
  precipitation?: number;
  weatherCode?: number;
  windSpeed?: number;
  hasNotes?: boolean;
};

/**
 * Fetch user profile data (stats + accepted challenges)
 */
export function useUserProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ['userProfile', userId],
    queryFn: async (): Promise<UserProfileResponse> => {
      if (!userId) throw new Error('No userId provided');
      const client = getApiClient();
      return await endpoints.getUserProfile(client, userId);
    },
    // Optional auth endpoint; allow fetching for public profiles too.
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export type PeaksResult = {
  peaks: UserPeakWithSummitCount[];
  totalCount: number;
  hasMore: boolean;
};

export type PeaksFilters = {
  state?: string;
  sortBy?: 'elevation' | 'name' | 'summits' | 'recent';
};

/**
 * Fetch list of states where user has summited peaks
 */
export function useUserSummitStates(userId: string | undefined) {
  return useQuery({
    queryKey: ['userSummitStates', userId],
    queryFn: async (): Promise<string[]> => {
      if (!userId) throw new Error('No userId provided');
      const client = getApiClient();
      const result = await endpoints.getUserSummitStates(client, userId);
      return result.states;
    },
    // Optional auth endpoint; allow fetching for public profiles too.
    enabled: !!userId,
    staleTime: 1000 * 60 * 10, // 10 minutes - states don't change often
  });
}

/**
 * Fetch ALL user summited peaks for map display (no pagination, max 2000)
 */
export function useUserAllSummitedPeaks(userId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ['userAllSummitedPeaks', userId],
    queryFn: async (): Promise<UserPeakWithSummitCount[]> => {
      if (!userId) throw new Error('No userId provided');
      const client = getApiClient();
      // Fetch up to 2000 peaks - should cover almost all users
      const result = await endpoints.searchUserPeaks(client, userId, {
        page: 1,
        pageSize: 2000,
        filters: { 
          sortBy: 'elevation'
        },
      });
      return result.peaks;
    },
    enabled: !!userId && enabled,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Fetch user's summited peaks (single page) with optional filters
 */
export function useUserPeaks(
  userId: string | undefined, 
  page = 1, 
  pageSize = 50,
  filters?: PeaksFilters
) {
  return useQuery({
    queryKey: ['userPeaks', userId, page, pageSize, filters],
    queryFn: async (): Promise<PeaksResult> => {
      if (!userId) throw new Error('No userId provided');
      const client = getApiClient();
      const result = await endpoints.searchUserPeaks(client, userId, {
        page,
        pageSize,
        filters: { 
          sortBy: filters?.sortBy ?? 'elevation',
          state: filters?.state,
        },
      });
      const hasMore = page * pageSize < result.totalCount;
      return { peaks: result.peaks, totalCount: result.totalCount, hasMore };
    },
    // Optional auth endpoint; allow fetching for public profiles too.
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export type JournalResult = {
  entries: JournalEntry[];
  totalCount: number;
  hasMore: boolean;
};

export type JournalFilters = {
  state?: string;
};

/**
 * Fetch user's summit journal entries (all summits, sorted by most recent)
 * Supports pagination with page parameter and state filtering
 */
export function useUserJournal(
  userId: string | undefined, 
  page = 1, 
  pageSize = 30,
  filters?: JournalFilters
) {
  return useQuery({
    queryKey: ['userJournal', userId, page, pageSize, filters],
    queryFn: async (): Promise<JournalResult> => {
      if (!userId) throw new Error('No userId provided');
      const client = getApiClient();
      const result = await endpoints.searchUserSummits(client, userId, {
        page,
        pageSize,
        state: filters?.state,
      });
      
      // Transform to JournalEntry format - include ALL summits
      const entries: JournalEntry[] = result.summits.map(s => ({
        id: s.id,
        peakId: s.peak.id,
        peakName: s.peak.name,
        peakState: s.peak.state,
        elevation: s.peak.elevation,
        timestamp: s.timestamp,
        activityId: s.activity_id,
        notes: s.notes,
        difficulty: s.difficulty,
        experienceRating: s.experience_rating,
        conditionTags: s.condition_tags,
        customTags: s.custom_condition_tags,
        temperature: s.temperature,
        cloudCover: s.cloud_cover,
        precipitation: s.precipitation,
        weatherCode: s.weather_code,
        windSpeed: s.wind_speed,
        // hasNotes means "has any report data" - notes, difficulty, rating, or tags
        hasNotes: !!(
          s.notes?.trim() ||
          s.difficulty ||
          s.experience_rating ||
          (s.condition_tags && s.condition_tags.length > 0) ||
          (s.custom_condition_tags && s.custom_condition_tags.length > 0)
        ),
      }));
      
      const hasMore = page * pageSize < result.totalCount;
      return { entries, totalCount: result.totalCount, hasMore };
    },
    // Optional auth endpoint; allow fetching for public profiles too.
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Combined profile data hook
 */
export function useProfileData(userId: string | undefined) {
  const userProfile = useUserProfile(userId);
  const userPeaks = useUserPeaks(userId, 1, 50); // Initial page
  const userJournal = useUserJournal(userId, 1, 30); // Initial page
  
  const peaks = userPeaks.data?.peaks ?? [];
  const peaksTotalCount = userPeaks.data?.totalCount ?? 0;
  const peaksHasMore = userPeaks.data?.hasMore ?? false;
  
  // Extract stats from profile - now using backend-computed values
  const stats = userProfile.data?.stats ? {
    totalPeaks: userProfile.data.stats.totalPeaks,
    totalSummits: userProfile.data.stats.totalSummits,
    highestPeak: userProfile.data.stats.highestPeak ?? undefined,
    // Backend now provides these directly
    lowestPeak: userProfile.data.stats.lowestPeak ? {
      name: userProfile.data.stats.lowestPeak.name,
      elevation: userProfile.data.stats.lowestPeak.elevation,
    } : undefined,
    mostVisitedPeak: userProfile.data.stats.mostVisitedPeak ? {
      name: userProfile.data.stats.mostVisitedPeak.name,
      visitCount: userProfile.data.stats.mostVisitedPeak.visitCount,
    } : undefined,
    challengesCompleted: userProfile.data.stats.challengesCompleted,
    totalElevation: userProfile.data.stats.totalElevationGained,
    statesClimbed: userProfile.data.stats.statesClimbed?.length ?? 0,
    countriesClimbed: userProfile.data.stats.countriesClimbed?.length ?? 0,
    // Climbing streak from backend
    climbingStreak: userProfile.data.stats.climbingStreak ?? undefined,
    peakBreakdown: userProfile.data.stats.peakTypeBreakdown ? {
      fourteeners: userProfile.data.stats.peakTypeBreakdown.fourteeners,
      thirteeners: userProfile.data.stats.peakTypeBreakdown.thirteeners,
      twelvers: userProfile.data.stats.peakTypeBreakdown.twelvers,
      other: (userProfile.data.stats.peakTypeBreakdown.elevenThousanders ?? 0) +
             (userProfile.data.stats.peakTypeBreakdown.tenThousanders ?? 0) +
             (userProfile.data.stats.peakTypeBreakdown.other ?? 0),
    } : undefined,
  } : undefined;
  
  return {
    // Stats for StatsContent
    stats,
    
    // Peaks for PeaksContent  
    peaks,
    peaksTotalCount,
    peaksHasMore,
    
    // Journal entries for JournalContent (initial page)
    journalEntries: userJournal.data?.entries ?? [],
    journalTotalCount: userJournal.data?.totalCount ?? 0,
    journalHasMore: userJournal.data?.hasMore ?? false,
    
    // Challenges for ChallengesContent - merge accepted + completed, deduplicate by ID
    challenges: (() => {
      const accepted = userProfile.data?.acceptedChallenges ?? [];
      const completed = userProfile.data?.completedChallenges ?? [];
      
      // Merge and dedupe by ID (accepted takes priority since it may have is_favorited flag)
      const byId = new Map<string, typeof accepted[0]>();
      for (const c of completed) {
        byId.set(c.id, c);
      }
      for (const c of accepted) {
        byId.set(c.id, c); // Accepted overwrites completed if duplicate
      }
      
      return Array.from(byId.values());
    })(),
    
    // Loading states
    isLoading: userProfile.isLoading || userPeaks.isLoading || userJournal.isLoading,
    isStatsLoading: userProfile.isLoading,
    isPeaksLoading: userPeaks.isLoading,
    isJournalLoading: userJournal.isLoading,
    isChallengesLoading: userProfile.isLoading,
    
    // Error states
    isError: userProfile.isError || userPeaks.isError || userJournal.isError,
    
    // Refetch functions
    refetch: () => {
      userProfile.refetch();
      userPeaks.refetch();
      userJournal.refetch();
    },
    
    // User ID for pagination
    userId,
  };
}

