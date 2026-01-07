/**
 * Explore Tab Layout
 * 
 * Contains the map and ContentSheet wrapper. Uses <Slot /> to render
 * the active explore route inside the sheet.
 * 
 * Routes:
 * - /explore → Discovery (index.tsx)
 * - /explore/peak/[peakId] → Peak detail
 * - /explore/challenge/[challengeId] → Challenge detail
 */

import React, { useRef, useCallback, useEffect, useMemo, useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Slot, useRouter, usePathname, useSegments } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFetching } from '@tanstack/react-query';
import { Crosshair } from 'lucide-react-native';
import { MapView, PeakMarkers, ChallengePeaksOverlay, UserPeaksOverlay, ActivityPolylineOverlay, ActivitySummitMarkers, CenterOnMeButton, CompassButton, LineToTarget } from '@/src/components/map';
import type { MapViewRef } from '@/src/components/map';
import { ContentSheet } from '@/src/components/navigation';
import { RefreshBar } from '@/src/components/shared';
import { useMapStore, getOverlayPeaksFromFocus, getRecenterTarget } from '@/src/store/mapStore';
import { useSheetStore } from '@/src/store/sheetStore';
import { useMapPeaks, useMapChallenges } from '@/src/hooks';
import { 
  ExploreOmnibar,
  FloatingPeakCard,
  FloatingChallengeCard,
} from '@/src/components/explore';
import { useTheme } from '@/src/theme';
import type { Peak, ChallengeProgress } from '@pathquest/shared';

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

// Debounce delay for map bounds updates (ms)
const MAP_BOUNDS_DEBOUNCE_MS = 500;

export default function ExploreLayout() {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapViewRef>(null);
  const router = useRouter();
  const pathname = usePathname();
  // Expo Router typed routes can sometimes infer segments as never[] depending on config.
  // Cast to string[] for safe runtime checks.
  const segments = useSegments() as string[];
  
  // Check if any explore-related queries are fetching
  const isFetchingPeaks = useIsFetching({ queryKey: ['mapPeaks'] }) > 0;
  const isFetchingChallenges = useIsFetching({ queryKey: ['mapChallenges'] }) > 0;
  const isFetchingAllChallenges = useIsFetching({ queryKey: ['allChallenges'] }) > 0;
  const isFetchingPeakDetails = useIsFetching({ queryKey: ['peakDetails'] }) > 0;
  const isFetchingChallengeDetails = useIsFetching({ queryKey: ['challengeDetails'] }) > 0;
  const isRefreshing = isFetchingPeaks || isFetchingChallenges || isFetchingAllChallenges || isFetchingPeakDetails || isFetchingChallengeDetails;
  
  // Determine if we're on a detail page
  const isDetailView =
    segments.includes("peak") ||
    segments.includes("challenge") ||
    segments.includes("users") ||
    segments.includes("activity");
  
  // Map store state - using new mapFocus system
  const mapFocus = useMapStore((state) => state.mapFocus);
  const visiblePeaks = useMapStore((state) => state.visiblePeaks);
  const visibleChallenges = useMapStore((state) => state.visibleChallenges);
  const selectedPeakId = useMapStore((state) => state.selectedPeakId);
  const selectedChallengeId = useMapStore((state) => state.selectedChallengeId);
  const selectionMode = useMapStore((state) => state.selectionMode);
  const selectPeak = useMapStore((state) => state.selectPeak);
  const selectChallenge = useMapStore((state) => state.selectChallenge);
  const clearSelection = useMapStore((state) => state.clearSelection);
  const setSelectionMode = useMapStore((state) => state.setSelectionMode);
  const updateMapRegion = useMapStore((state) => state.updateMapRegion);
  const setVisiblePeaks = useMapStore((state) => state.setVisiblePeaks);
  const setVisibleChallenges = useMapStore((state) => state.setVisibleChallenges);
  const currentBounds = useMapStore((state) => state.currentBounds);
  const isZoomedOutTooFar = useMapStore((state) => state.isZoomedOutTooFar);
  const isInitialLocationReady = useMapStore((state) => state.isInitialLocationReady);
  const pendingFitBounds = useMapStore((state) => state.pendingFitBounds);
  const clearPendingFitBounds = useMapStore((state) => state.clearPendingFitBounds);
  const pendingFlyTo = useMapStore((state) => state.pendingFlyTo);
  const clearPendingFlyTo = useMapStore((state) => state.clearPendingFlyTo);
  
  // Derive overlay peaks from mapFocus
  const overlayPeaks = useMemo(() => getOverlayPeaksFromFocus(mapFocus), [mapFocus]);
  const recenterTarget = useMemo(() => getRecenterTarget(mapFocus), [mapFocus]);

  // Sheet state
  const sheetSnapIndex = useSheetStore((s) => s.snapIndex);
  const sheetExpand = useSheetStore((s) => s.expand);
  const sheetSnapTo = useSheetStore((s) => s.snapTo);
  const sheetCollapse = useSheetStore((s) => s.collapse);

  // Debounced bounds for API queries (only update after user stops panning)
  // This prevents excessive API calls while the user is actively panning
  // IMPORTANT: We don't set bounds until isInitialLocationReady to avoid querying Boulder
  const [debouncedBounds, setDebouncedBounds] = useState<typeof currentBounds>(null);
  const hasSetInitialBounds = useRef(false);
  
  useEffect(() => {
    // Don't update bounds until initial location is ready
    // This prevents querying Boulder before we know where the user is
    if (!isInitialLocationReady) {
      return;
    }
    
    // First time isInitialLocationReady becomes true: set bounds immediately
    if (!hasSetInitialBounds.current) {
      hasSetInitialBounds.current = true;
      setDebouncedBounds(currentBounds);
      console.log('[ExploreLayout] Initial location ready, setting bounds immediately');
      return;
    }
    
    // After initial set, debounce subsequent updates (panning)
    const timer = setTimeout(() => {
      setDebouncedBounds(currentBounds);
    }, MAP_BOUNDS_DEBOUNCE_MS);
    
    return () => clearTimeout(timer);
  }, [currentBounds, isInitialLocationReady]);

  // Convert bounds for API (use debounced bounds to prevent excessive queries)
  const apiBounds = debouncedBounds ? {
    northWest: [debouncedBounds[1][1], debouncedBounds[0][0]] as [number, number],
    southEast: [debouncedBounds[0][1], debouncedBounds[1][0]] as [number, number],
  } : null;

  // Fetch peaks and challenges (using debounced bounds)
  // Only query when initial location is ready (prevents Boulder query before user location)
  const { data: peaksData } = useMapPeaks(apiBounds, !isZoomedOutTooFar && isInitialLocationReady);
  const { data: challengesData } = useMapChallenges(apiBounds, !isZoomedOutTooFar && isInitialLocationReady);

  useEffect(() => {
    if (peaksData) setVisiblePeaks(peaksData);
  }, [peaksData, setVisiblePeaks]);

  useEffect(() => {
    if (challengesData) setVisibleChallenges(challengesData);
  }, [challengesData, setVisibleChallenges]);

  // Resolve selected items (check both regular peaks and overlay peaks)
  const selectedPeak = selectedPeakId 
    ? (visiblePeaks.find(p => p.id === selectedPeakId) 
       ?? overlayPeaks?.find(p => p.id === selectedPeakId))
    : null;
  const selectedChallenge = selectedChallengeId
    ? visibleChallenges.find(c => c.id === selectedChallengeId)
    : null;

  // Sync selectionMode with route
  // NOTE: Don't override 'floating' mode - it takes precedence for showing the floating card
  useEffect(() => {
    if (selectionMode === 'floating') {
      // Don't override floating mode - user clicked a peak and wants to see the card
      return;
    }
    if (isDetailView) {
      setSelectionMode('detail');
    } else if (selectionMode === 'detail') {
      // Coming back from detail to discovery
      setSelectionMode('none');
      sheetSnapTo('halfway');
    }
  }, [isDetailView, selectionMode, setSelectionMode, sheetSnapTo]);

  // Handle pending fitBounds request (from "Show on Map")
  useEffect(() => {
    if (pendingFitBounds) {
      mapRef.current?.fitBounds(pendingFitBounds.bounds, pendingFitBounds.padding);
      // Update debounced bounds immediately when fitBounds is requested (no debounce delay)
      setDebouncedBounds(pendingFitBounds.bounds);
      clearPendingFitBounds();
    }
  }, [pendingFitBounds, clearPendingFitBounds]);
  
  // Handle pending flyTo request (for single peak auto-zoom)
  useEffect(() => {
    if (pendingFlyTo) {
      mapRef.current?.flyTo(pendingFlyTo.center, pendingFlyTo.zoom);
      clearPendingFlyTo();
    }
  }, [pendingFlyTo, clearPendingFlyTo]);

  // Clear floating selection when sheet is dragged up
  useEffect(() => {
    if (sheetSnapIndex !== 0 && selectionMode === 'floating') {
      clearSelection();
    }
  }, [sheetSnapIndex, selectionMode, clearSelection]);

  // Map handlers
  const handleRegionChange = useCallback((region: {
    center: [number, number];
    zoom: number;
    bounds: [[number, number], [number, number]];
  }) => {
    updateMapRegion(region);
  }, [updateMapRegion]);

  const handleMapReady = useCallback(async () => {
    console.log('[ExploreLayout] Map ready');
  }, []);

  // Peak marker press → floating card
  // NOTE: Collapse sheet FIRST, then select - otherwise the "clear floating when sheet not collapsed" effect fires
  const handlePeakMarkerPress = useCallback((peak: Peak) => {
    sheetCollapse();
    selectPeak(peak.id);
  }, [selectPeak, sheetCollapse]);

  // Open peak detail (from floating card, omnibar, or list)
  const openPeakDetail = useCallback((peak: Peak) => {
    router.push({
      pathname: '/explore/peak/[peakId]',
      params: { peakId: peak.id },
    });
    sheetExpand();
    if (peak.location_coords) {
      mapRef.current?.flyTo(peak.location_coords, 14);
    }
  }, [router, sheetExpand]);

  // Open challenge detail
  const openChallengeDetail = useCallback((challenge: ChallengeProgress) => {
    router.push({
      pathname: '/explore/challenge/[challengeId]',
      params: { challengeId: challenge.id },
    });
    sheetExpand();
  }, [router, sheetExpand]);

  // Floating card handlers
  const handleCloseFloating = useCallback(() => {
    clearSelection();
  }, [clearSelection]);

  const handleOpenDetail = useCallback(() => {
    if (selectedPeak) {
      openPeakDetail(selectedPeak);
    } else if (selectedChallenge) {
      openChallengeDetail(selectedChallenge);
    }
  }, [selectedPeak, selectedChallenge, openPeakDetail, openChallengeDetail]);

  const handleOpenCompass = useCallback(() => {
    if (selectedPeakId) {
      router.push({ pathname: '/compass/[peakId]', params: { peakId: selectedPeakId } });
    }
  }, [router, selectedPeakId]);

  const handleCenterOnUser = useCallback(() => {
    mapRef.current?.centerOnUser();
  }, []);

  // Get the theme for the recenter button
  const { colors } = useTheme();
  
  // Show recenter button when we have a recenter target
  const showRecenterButton = !!recenterTarget;
  
  const handleRecenter = useCallback(() => {
    if (!recenterTarget) return;
    
    if (recenterTarget.type === 'point') {
      // Fly to specific point (peak focus)
      mapRef.current?.flyTo(recenterTarget.coords, 13);
    } else if (recenterTarget.type === 'bounds') {
      // Fit to bounds (challenge/user focus)
      const bounds = getBoundsFromPeaks(recenterTarget.peaks);
      if (bounds) {
        const bottomPadding = COLLAPSED_SHEET_HEIGHT + TAB_BAR_HEIGHT + insets.bottom + 20;
        mapRef.current?.fitBounds(bounds, {
          paddingTop: insets.top + 80,
          paddingBottom: bottomPadding + 300,
          paddingLeft: 40,
          paddingRight: 40,
        });
      }
    } else if (recenterTarget.type === 'boundsCoords') {
      const bottomPadding = COLLAPSED_SHEET_HEIGHT + TAB_BAR_HEIGHT + insets.bottom + 20;
      mapRef.current?.fitBounds(recenterTarget.bounds, {
        paddingTop: insets.top + 80,
        paddingBottom: bottomPadding + 300,
        paddingLeft: 40,
        paddingRight: 40,
      });
    }
  }, [recenterTarget, insets]);

  return (
    <View style={{ flex: 1 }}>
      {/* Map Layer */}
      <MapView
        ref={mapRef}
        onRegionChange={handleRegionChange}
        onMapReady={handleMapReady}
      >
        {/* Render based on mapFocus type */}
        {mapFocus.type === 'discovery' && (
          <PeakMarkers
            peaks={visiblePeaks}
            selectedPeakId={selectedPeakId}
            onPeakPress={handlePeakMarkerPress}
            isDark={true}
          />
        )}
        {mapFocus.type === 'challenge' && (
          <ChallengePeaksOverlay 
            peaks={mapFocus.peaks} 
            isDark={true} 
            onPeakPress={handlePeakMarkerPress}
          />
        )}
        {mapFocus.type === 'user' && (
          <UserPeaksOverlay 
            peaks={mapFocus.peaks} 
            isDark={true} 
            onPeakPress={handlePeakMarkerPress}
          />
        )}
        {mapFocus.type === "activity" && (
          <>
            <ActivityPolylineOverlay
              activityId={mapFocus.activityId}
              coords={mapFocus.coords}
              color={colors.primary as any}
              width={3}
            />
            <ActivitySummitMarkers
              activityId={mapFocus.activityId}
              summits={mapFocus.summits}
              color={colors.summited as any}
            />
          </>
        )}
        {mapFocus.type === 'peak' && (
          <PeakMarkers
            peaks={visiblePeaks}
            selectedPeakId={selectedPeakId}
            onPeakPress={handlePeakMarkerPress}
            isDark={true}
          />
        )}
        {selectionMode === 'floating' && selectedPeak?.location_coords && (
          <LineToTarget
            targetCoords={selectedPeak.location_coords}
            userCoords={null}
            visible={true}
          />
        )}
      </MapView>

      {/* Omnibar - top of map */}
      <View
        style={{
          position: 'absolute',
          top: insets.top + 12,
          left: 16,
          right: 16,
          zIndex: 10,
        }}
        pointerEvents="box-none"
      >
        <ExploreOmnibar
          visible={true}
          onPeakPress={openPeakDetail}
          onChallengePress={openChallengeDetail}
          onPlacePress={({ coords, zoom }) => {
            // coords are [lng, lat]
            mapRef.current?.flyTo(coords, zoom);
          }}
        />
      </View>

      {/* Map Controls - top right, below search bar */}
      <View
        style={{
          position: 'absolute',
          top: insets.top + 12 + 56 + 24, // Below search bar (56px height + 24px padding)
          right: 16,
          flexDirection: 'column',
          gap: 8,
          zIndex: 10,
        }}
        pointerEvents="box-none"
      >
        {/* Compass Button */}
        <CompassButton
          onPress={() => mapRef.current?.resetBearing()}
          visible={true}
        />
        
        {/* Center on Me Button */}
        <View style={{ width: 44, height: 44 }}>
          <CenterOnMeButton
            onPress={handleCenterOnUser}
            visible={selectionMode !== 'floating' || sheetSnapIndex !== 0}
            style={{ position: 'relative' }}
          />
        </View>
        
        {/* Recenter/Snapping Button - shows when viewing a user profile, challenge, or single peak */}
        {showRecenterButton && (
          <TouchableOpacity
            onPress={handleRecenter}
            activeOpacity={0.8}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: colors.card as any,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 4,
              elevation: 4,
              borderWidth: 1,
              borderColor: colors.border as any,
            }}
          >
            <Crosshair size={20} color={colors.primary as any} />
          </TouchableOpacity>
        )}
      </View>

      {/* Floating Peak Card */}
      {selectionMode === 'floating' && sheetSnapIndex === 0 && selectedPeak && (
        <View 
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 90,
          }}
        >
          <FloatingPeakCard
            peak={selectedPeak}
            onClose={handleCloseFloating}
            onDetailsPress={handleOpenDetail}
            onCompassPress={handleOpenCompass}
          />
        </View>
      )}

      {/* Floating Challenge Card */}
      {selectionMode === 'floating' && sheetSnapIndex === 0 && selectedChallenge && (
        <View 
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 90,
          }}
        >
          <FloatingChallengeCard
            challenge={selectedChallenge}
            onClose={handleCloseFloating}
            onDetailsPress={handleOpenDetail}
          />
        </View>
      )}

      {/* Content Sheet with routed content */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 20,
        }}
        pointerEvents="box-none"
      >
        <ContentSheet
          bottomPadding={0}
          expandedTopInset={!isDetailView ? insets.top + 12 + 56 + 16 : 100}
        >
          {/* Refresh bar at top of drawer */}
          <RefreshBar isRefreshing={isRefreshing} />
          {/* Expo Router renders the active route here */}
          <Slot />
        </ContentSheet>
      </View>
    </View>
  );
}
