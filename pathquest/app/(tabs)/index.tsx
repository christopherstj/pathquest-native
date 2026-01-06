/**
 * Home Tab Route
 * 
 * Full-screen dashboard with recent summits, favorites, and quick stats.
 */

import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFetching } from '@tanstack/react-query';
import { DashboardContent } from '@/src/components/home';
import { RefreshBar } from '@/src/components/shared';
import type { Peak, ChallengeProgress } from '@pathquest/shared';

const BACKGROUND_COLOR = '#25221E';

export default function HomeRoute() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  // Check if any dashboard-related queries are fetching
  const isFetchingDashboard = useIsFetching({ queryKey: ['dashboardStats'] }) > 0;
  const isFetchingChallenges = useIsFetching({ queryKey: ['favoriteChallenges'] }) > 0;
  const isFetchingSummits = useIsFetching({ queryKey: ['recentSummits'] }) > 0;
  const isFetchingSuggested = useIsFetching({ queryKey: ['suggestedPeak'] }) > 0;
  const isRefreshing = isFetchingDashboard || isFetchingChallenges || isFetchingSummits || isFetchingSuggested;
  
  const handlePeakPress = (peak: Peak) => {
    router.push({
      pathname: '/explore/peak/[peakId]',
      params: { peakId: peak.id },
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
      />
    </View>
  );
}
