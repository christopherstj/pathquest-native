/**
 * Peak Detail Route
 * 
 * /explore/peak/[peakId]
 * 
 * Uses Expo Router's native back navigation.
 * Back button/gesture returns to previous route (discovery or challenge detail).
 * X button dismisses straight to discovery.
 */

import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useCallback } from 'react';
import { PeakDetail, DetailSkeleton } from '@/src/components/explore';
import { useMapStore } from '@/src/store/mapStore';
import { usePeakDetails } from '@/src/hooks';
import type { Peak } from '@pathquest/shared';

export default function PeakDetailRoute() {
  const { peakId } = useLocalSearchParams<{ peakId: string }>();
  const router = useRouter();
  
  // Get peak from visible peaks (for immediate display)
  const visiblePeaks = useMapStore((state) => state.visiblePeaks);
  const setSelectedPeakId = useMapStore((state) => state.setSelectedPeakId);
  const clearSelection = useMapStore((state) => state.clearSelection);
  const cachedPeak = visiblePeaks.find((p) => p.id === peakId);
  
  // Fetch full peak details
  const { data: peakDetails, isLoading, isError } = usePeakDetails(peakId ?? '');
  
  // Sync map selection with route
  useEffect(() => {
    if (peakId) {
      setSelectedPeakId(peakId);
    }
  }, [peakId, setSelectedPeakId]);
  
  // Go back one step
  const handleClose = useCallback(() => {
    router.back();
  }, [router]);
  
  // Go straight to discovery (dismiss all detail views)
  const handleDismiss = useCallback(() => {
    clearSelection();
    router.navigate('/explore');
  }, [router, clearSelection]);
  
  if (!peakId) return null;
  
  // Determine what peak data we have available
  const fetchedPeak = peakDetails?.peak;
  
  // We have meaningful data if we have a peak with a name from either source
  const hasMeaningfulData = !!(cachedPeak?.name || fetchedPeak?.name);
  
  // Show skeleton while loading AND we don't have any meaningful cached data
  if ((isLoading || (!fetchedPeak && !isError)) && !hasMeaningfulData) {
    return <DetailSkeleton onBack={handleClose} type="peak" />;
  }
  
  // Use the best available data
  // Priority: fetched > cached
  const peakData: Peak = fetchedPeak ?? cachedPeak!;
  
  // If we still don't have data (shouldn't happen normally), show skeleton
  if (!peakData?.name) {
    return <DetailSkeleton onBack={handleClose} type="peak" />;
  }
  
  return (
    <PeakDetail
      peak={peakData}
      onClose={handleClose}
      onDismiss={handleDismiss}
    />
  );
}
