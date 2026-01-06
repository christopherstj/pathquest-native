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
  
  // Clear any overlays when returning to discovery view
  const setUserOverlayPeaks = useMapStore((s) => s.setUserOverlayPeaks);
  const setChallengeOverlayPeaks = useMapStore((s) => s.setChallengeOverlayPeaks);
  
  useEffect(() => {
    // When discovery view is shown, clear overlays so standard map search resumes
    setUserOverlayPeaks(null);
    setChallengeOverlayPeaks(null);
  }, [setUserOverlayPeaks, setChallengeOverlayPeaks]);
  
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
