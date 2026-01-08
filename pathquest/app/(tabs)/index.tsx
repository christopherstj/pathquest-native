/**
 * Home Tab Route
 * 
 * Full-screen dashboard with recent summits, favorites, and quick stats.
 */

import React, { useCallback } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFetching } from '@tanstack/react-query';
import { DashboardContent } from '@/src/components/home';
import { RefreshBar } from '@/src/components/shared';
import { useAddReportStore } from '@/src/store';
import { useDashboardData } from '@/src/hooks';
import type { ChallengeProgress } from '@pathquest/shared';

const BACKGROUND_COLOR = '#25221E';

export default function HomeRoute() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const openAddReportModal = useAddReportStore((s) => s.openModal);
  const { recentSummits } = useDashboardData();
  
  // Check if any dashboard-related queries are fetching
  const isFetchingDashboard = useIsFetching({ queryKey: ['dashboardStats'] }) > 0;
  const isFetchingChallenges = useIsFetching({ queryKey: ['favoriteChallenges'] }) > 0;
  const isFetchingSummits = useIsFetching({ queryKey: ['recentSummits'] }) > 0;
  const isFetchingSuggested = useIsFetching({ queryKey: ['suggestedPeak'] }) > 0;
  const isRefreshing = isFetchingDashboard || isFetchingChallenges || isFetchingSummits || isFetchingSuggested;
  
  const handlePeakPress = (peakId: string) => {
    router.push({
      pathname: '/explore/peak/[peakId]',
      params: { peakId },
    });
  };
  
  const handleChallengePress = (challenge: ChallengeProgress) => {
    router.push({
      pathname: '/explore/challenge/[challengeId]',
      params: { challengeId: challenge.id },
    });
  };
  
  const handleChallengePressById = (challengeId: string) => {
    router.push({
      pathname: '/explore/challenge/[challengeId]',
      params: { challengeId },
    });
  };

  const handleTripReportPress = useCallback((summitId: string, peakId: string) => {
    // Find the summit in recent summits to get full details
    const summit = recentSummits.find((s: any) => s.id === summitId);
    if (!summit) return;

    // Determine summit type based on activity_id presence
    const summitType = summit.activity_id ? 'activity' : 'manual';

    openAddReportModal({
      ascentId: summitId,
      peakId,
      peakName: summit.name || 'Unknown Peak',
      timestamp: summit.timestamp,
      activityId: summit.activity_id,
      summitType,
      // Pre-populate with existing data if available
      notes: summit.notes,
      difficulty: summit.difficulty,
      experienceRating: summit.experience_rating,
      conditionTags: summit.condition_tags,
      customTags: summit.custom_condition_tags,
    });
  }, [recentSummits, openAddReportModal]);
  
  return (
    <View 
      style={{ 
        flex: 1,
        backgroundColor: BACKGROUND_COLOR,
        paddingTop: insets.top,
      }}
    >
      <RefreshBar isRefreshing={isRefreshing} />
      <DashboardContent 
        onPeakPress={handlePeakPress}
        onChallengePress={handleChallengePress}
        onChallengePressById={handleChallengePressById}
        onTripReportPress={handleTripReportPress}
      />
    </View>
  );
}
