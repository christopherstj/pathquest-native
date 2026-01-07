/**
 * Explore Discovery Route
 * 
 * Shows peaks and challenges in the current map viewport.
 * State persists when navigating to/from detail pages.
 */

import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { DiscoveryContent } from '@/src/components/explore';
import { useExploreNavStore } from '@/src/store/exploreNavStore';
import { useMapStore } from '@/src/store/mapStore';
import type { Peak, ChallengeProgress } from '@pathquest/shared';

export default function ExploreDiscovery() {
  const router = useRouter();
  
  // Set focus to discovery when this view is shown
  const focusDiscovery = useMapStore((s) => s.focusDiscovery);
  
  useEffect(() => {
    // When discovery view is shown, reset to discovery focus
    focusDiscovery();
  }, [focusDiscovery]);
  
  // Persisted discovery state
  const discoveryState = useExploreNavStore((s) => s.discoveryState);
  const setDiscoveryTab = useExploreNavStore((s) => s.setDiscoveryTab);
  const setChallengeFilter = useExploreNavStore((s) => s.setChallengeFilter);
  
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
  
  return (
    <DiscoveryContent
      onPeakPress={handlePeakPress}
      onChallengePress={handleChallengePress}
      activeTab={discoveryState.activeTab}
      onTabChange={setDiscoveryTab}
      challengeFilter={discoveryState.challengeFilter}
      onChallengeFilterChange={setChallengeFilter}
    />
  );
}
