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
import { useEffect, useCallback, useRef, useMemo } from 'react';
import { Share } from 'react-native';
import * as Linking from 'expo-linking';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChallengeDetail, DetailSkeleton } from '@/src/components/explore';
import { useMapStore } from '@/src/store/mapStore';
import { useChallengeDetails, useUserChallengeProgress } from '@/src/hooks';
import { useAuthStore } from '@/src/lib/auth';
import type { Peak } from '@pathquest/shared';

// Tab bar height (matches tabs layout)
const TAB_BAR_HEIGHT = 60;
// Collapsed sheet height
const COLLAPSED_SHEET_HEIGHT = 80;

function getBoundsFromPeaks(peaks: Array<{ location_coords?: [number, number] | null }>) {
  const coords = peaks
    .map((p) => p.location_coords)
    .filter((c): c is [number, number] => Array.isArray(c) && c.length === 2);
  if (coords.length === 0) return null;
  let minLng = coords[0][0];
  let maxLng = coords[0][0];
  let minLat = coords[0][1];
  let maxLat = coords[0][1];
  for (const [lng, lat] of coords) {
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  }
  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ] as [[number, number], [number, number]];
}


export default function ChallengeDetailRoute() {
  const { challengeId } = useLocalSearchParams<{ challengeId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  // Map store - using new focus system
  const visibleChallenges = useMapStore((state) => state.visibleChallenges);
  const focusChallenge = useMapStore((state) => state.focusChallenge);
  const focusDiscovery = useMapStore((state) => state.focusDiscovery);
  const requestFitToBounds = useMapStore((state) => state.requestFitToBounds);
  
  const cachedChallenge = visibleChallenges.find((c) => c.id === challengeId);
  
  // Fetch full challenge details (public data)
  const { data: fetchedChallenge, isLoading } = useChallengeDetails(challengeId ?? '');
  
  // Fetch user's progress to get summit status (only if authenticated)
  const userProgress = useUserChallengeProgress(
    user?.id ?? null,
    challengeId ?? null,
    isAuthenticated
  );
  
  // Merge public peaks with user's summit status
  const peaksWithSummitStatus = useMemo(() => {
    const publicPeaks = fetchedChallenge?.peaks ?? [];
    const userPeaks = userProgress.data?.peaks ?? [];
    
    // Create a map of peak ID -> summit status
    const summitMap = new Map<string, { is_summited: boolean; summit_date: string | null }>();
    for (const p of userPeaks) {
      summitMap.set(p.id, { is_summited: p.is_summited, summit_date: p.summit_date });
    }
    
    // Merge summit status into public peaks
    return publicPeaks.map(p => ({
      ...p,
      is_summited: summitMap.get(p.id)?.is_summited ?? false,
      summit_date: summitMap.get(p.id)?.summit_date ?? null,
    }));
  }, [fetchedChallenge?.peaks, userProgress.data?.peaks]);
  
  const bounds = useMemo(() => getBoundsFromPeaks(peaksWithSummitStatus), [peaksWithSummitStatus]);
  
  // Track if we've already fitted bounds (only fit once on initial load)
  const hasFittedBounds = useRef(false);
  
  // Set challenge focus when peaks are ready
  useEffect(() => {
    if (challengeId && peaksWithSummitStatus.length > 0) {
      focusChallenge(challengeId, peaksWithSummitStatus);
    }
  }, [challengeId, peaksWithSummitStatus, focusChallenge]);
  
  // Auto-fit the map to show all challenge peaks ONCE when peaks first load
  useEffect(() => {
    if (!bounds || hasFittedBounds.current) return;
    hasFittedBounds.current = true;
    const bottomPadding = COLLAPSED_SHEET_HEIGHT + TAB_BAR_HEIGHT + insets.bottom + 20;
    requestFitToBounds(bounds, {
      paddingTop: insets.top + 80,
      paddingBottom: bottomPadding + 300, // extra padding for the sheet content
      paddingLeft: 40,
      paddingRight: 40,
    });
  }, [bounds, insets.bottom, insets.top, requestFitToBounds]);
  
  // Go back one step (focus will be restored by parent route or discovery)
  const handleClose = useCallback(() => {
    router.back();
  }, [router]);
  
  // Go straight to discovery
  const handleDismiss = useCallback(() => {
    focusDiscovery();
    router.navigate("/explore" as any);
  }, [router, focusDiscovery]);
  
  const handlePeakPress = useCallback((peak: Peak) => {
    router.push({
      pathname: '/explore/peak/[peakId]',
      params: { peakId: peak.id },
    });
  }, [router]);
  
  const handleShare = useCallback(async () => {
    if (!challengeId || !user?.id) return;
    const challengeName = cachedChallenge?.name ?? fetchedChallenge?.challenge?.name ?? 'this challenge';
    const url = Linking.createURL(`/explore/users/${user.id}/challenges/${challengeId}`);
    const message = `Check out ${challengeName} on PathQuest!\n\n${url}`;
    await Share.share({ message, url }).catch(() => null);
  }, [challengeId, user?.id, cachedChallenge?.name, fetchedChallenge?.challenge?.name]);
  
  if (!challengeId) return null;
  
  // Show skeleton while loading (and no cached data available)
  if (isLoading && !cachedChallenge && !fetchedChallenge) {
    return <DetailSkeleton onBack={handleClose} type="challenge" />;
  }
  
  // Use cached challenge for fallback display
  const challengeForFallback = cachedChallenge ?? (fetchedChallenge?.challenge ? {
    id: challengeId,
    name: fetchedChallenge.challenge.name,
    num_peaks: fetchedChallenge.peaks?.length ?? 0,
    completed: 0,
    total: fetchedChallenge.peaks?.length ?? 0,
    region: fetchedChallenge.challenge.region,
  } : undefined);
  
  return (
    <ChallengeDetail
      challengeId={challengeId}
      challenge={challengeForFallback as any}
      onClose={handleClose}
      onDismiss={handleDismiss}
      onPeakPress={handlePeakPress}
      onShare={user?.id ? handleShare : undefined}
    />
  );
}
