/**
 * Challenge Detail Route
 * 
 * /explore/challenge/[challengeId]
 * 
 * Uses Expo Router's native back navigation.
 * Back button/gesture returns to previous route.
 * X button dismisses straight to discovery.
 */

import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChallengeDetail, DetailSkeleton } from '@/src/components/explore';
import { useMapStore } from '@/src/store/mapStore';
import { useSheetStore } from '@/src/store/sheetStore';
import { useChallengeDetails } from '@/src/hooks';
import type { Peak } from '@pathquest/shared';

// Tab bar height (matches tabs layout)
const TAB_BAR_HEIGHT = 60;
// Collapsed sheet height
const COLLAPSED_SHEET_HEIGHT = 80;

export default function ChallengeDetailRoute() {
  const { challengeId } = useLocalSearchParams<{ challengeId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  // Get challenge from visible challenges (for immediate display)
  const visibleChallenges = useMapStore((state) => state.visibleChallenges);
  const setSelectedChallengeId = useMapStore((state) => state.setSelectedChallengeId);
  const setChallengeOverlayPeaks = useMapStore((state) => state.setChallengeOverlayPeaks);
  const requestFitToBounds = useMapStore((state) => state.requestFitToBounds);
  const clearSelection = useMapStore((state) => state.clearSelection);
  const sheetCollapse = useSheetStore((s) => s.collapse);
  
  const cachedChallenge = visibleChallenges.find((c) => c.id === challengeId);
  
  // Fetch full challenge details
  const { data: fetchedChallenge, isLoading } = useChallengeDetails(challengeId ?? '');
  
  // Sync map selection with route
  useEffect(() => {
    if (challengeId) {
      setSelectedChallengeId(challengeId);
    }
  }, [challengeId, setSelectedChallengeId]);
  
  // Clear overlay peaks when leaving this page
  useEffect(() => {
    return () => {
      setChallengeOverlayPeaks(null);
    };
  }, [setChallengeOverlayPeaks]);
  
  // Go back one step
  const handleClose = useCallback(() => {
    // Clear overlay when leaving challenge detail
    setChallengeOverlayPeaks(null);
    router.back();
  }, [router, setChallengeOverlayPeaks]);
  
  // Go straight to discovery (dismiss all detail views)
  const handleDismiss = useCallback(() => {
    // Clear overlay when leaving challenge detail
    setChallengeOverlayPeaks(null);
    clearSelection();
    router.navigate('/explore');
  }, [router, clearSelection, setChallengeOverlayPeaks]);
  
  const handlePeakPress = useCallback((peak: Peak) => {
    router.push({
      pathname: '/explore/peak/[peakId]',
      params: { peakId: peak.id },
    });
  }, [router]);
  
  const handleShowOnMap = useCallback(
    (payload: { peaks: Array<Peak & { is_summited?: boolean }>; challengeId: string }) => {
      // Filter peaks with valid coordinates
      const peaksWithCoords = payload.peaks.filter(
        (p) => p.location_coords && p.location_coords.length === 2
      );
      
      // Set overlay peaks (hides regular peaks)
      setChallengeOverlayPeaks(payload.peaks);
      
      // Collapse the sheet to show the map
      sheetCollapse();
      
      if (peaksWithCoords.length === 0) {
        return;
      }
      
      // Calculate bounding box from all peak coordinates
      let minLng = Infinity;
      let minLat = Infinity;
      let maxLng = -Infinity;
      let maxLat = -Infinity;
      
      for (const peak of peaksWithCoords) {
        const [lng, lat] = peak.location_coords!;
        minLng = Math.min(minLng, lng);
        minLat = Math.min(minLat, lat);
        maxLng = Math.max(maxLng, lng);
        maxLat = Math.max(maxLat, lat);
      }
      
      // Bounds: [[sw_lng, sw_lat], [ne_lng, ne_lat]]
      const bounds: [[number, number], [number, number]] = [
        [minLng, minLat],
        [maxLng, maxLat],
      ];
      
      // Calculate bottom padding to account for collapsed sheet + tab bar
      const bottomPadding = COLLAPSED_SHEET_HEIGHT + TAB_BAR_HEIGHT + insets.bottom + 20;
      
      // Request fit to bounds with asymmetric padding
      requestFitToBounds(bounds, {
        paddingTop: insets.top + 80, // Account for omnibar
        paddingBottom: bottomPadding,
        paddingLeft: 40,
        paddingRight: 40,
      });
    },
    [setChallengeOverlayPeaks, sheetCollapse, requestFitToBounds, insets]
  );
  
  if (!challengeId) return null;
  
  // Show skeleton while loading (and no cached data available)
  if (isLoading && !cachedChallenge && !fetchedChallenge) {
    return <DetailSkeleton onBack={handleClose} type="challenge" />;
  }
  
  // Use cached challenge for fallback display
  const challengeForFallback = cachedChallenge ?? (fetchedChallenge ? {
    id: challengeId,
    name: fetchedChallenge.name,
    num_peaks: fetchedChallenge.total_peaks,
    completed: 0,
    total: fetchedChallenge.total_peaks,
    region: fetchedChallenge.region,
  } : undefined);
  
  return (
    <ChallengeDetail
      challengeId={challengeId}
      challenge={challengeForFallback as any}
      onClose={handleClose}
      onDismiss={handleDismiss}
      onPeakPress={handlePeakPress}
      onShowOnMap={handleShowOnMap}
    />
  );
}
