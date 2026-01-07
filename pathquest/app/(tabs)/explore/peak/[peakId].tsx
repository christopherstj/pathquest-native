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
import { useEffect, useCallback, useRef } from 'react';
import { PeakDetail, DetailSkeleton } from '@/src/components/explore';
import { useMapStore } from '@/src/store/mapStore';
import { usePeakDetails } from '@/src/hooks';
import type { Peak } from '@pathquest/shared';

export default function PeakDetailRoute() {
  const { peakId } = useLocalSearchParams<{ peakId: string }>();
  const router = useRouter();
  
  // Map store - using new focus system
  const visiblePeaks = useMapStore((state) => state.visiblePeaks);
  const mapFocus = useMapStore((state) => state.mapFocus);
  const focusPeak = useMapStore((state) => state.focusPeak);
  const focusDiscovery = useMapStore((state) => state.focusDiscovery);
  const requestFlyTo = useMapStore((state) => state.requestFlyTo);
  
  // Try to get peak from visible peaks or current overlay
  const overlayPeaks =
    mapFocus.type === 'challenge'
      ? mapFocus.peaks
      : mapFocus.type === 'user'
        ? mapFocus.peaks
        : null;
  const cachedPeak = visiblePeaks.find((p) => p.id === peakId) ?? 
                     overlayPeaks?.find((p) => p.id === peakId);
  
  // Fetch full peak details
  const { data: peakDetails, isLoading, isError } = usePeakDetails(peakId ?? '');
  
  // Track if we've already zoomed (only zoom once on initial load)
  const hasZoomed = useRef(false);
  
  // Set peak focus when we have coords
  useEffect(() => {
    if (!peakId) return;
    
    const coords = cachedPeak?.location_coords ?? peakDetails?.peak?.location_coords;
    if (coords) {
      focusPeak(peakId, coords);
      
      // Auto-zoom to peak (only once)
      if (!hasZoomed.current) {
        hasZoomed.current = true;
        requestFlyTo(coords, 13);
      }
    }
  }, [peakId, cachedPeak?.location_coords, peakDetails?.peak?.location_coords, focusPeak, requestFlyTo]);
  
  // Go back one step (parent focus is automatically restored by the focus system)
  const handleClose = useCallback(() => {
    router.back();
  }, [router]);
  
  // Go straight to discovery
  const handleDismiss = useCallback(() => {
    focusDiscovery();
    router.navigate("/explore" as any);
  }, [router, focusDiscovery]);
  
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
