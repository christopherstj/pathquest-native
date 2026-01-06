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

import React, { useRef, useCallback, useEffect, useMemo } from 'react';
import { View } from 'react-native';
import { Slot, useRouter, usePathname, useSegments } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFetching } from '@tanstack/react-query';
import { MapView, PeakMarkers, ChallengePeaksOverlay, CenterOnMeButton, LineToTarget } from '@/src/components/map';
import type { MapViewRef } from '@/src/components/map';
import { ContentSheet } from '@/src/components/navigation';
import { RefreshBar } from '@/src/components/shared';
import { useMapStore } from '@/src/store/mapStore';
import { useSheetStore } from '@/src/store/sheetStore';
import { useMapPeaks, useMapChallenges } from '@/src/hooks';
import { 
  ExploreOmnibar,
  FloatingPeakCard,
  FloatingChallengeCard,
} from '@/src/components/explore';
import type { Peak, ChallengeProgress } from '@pathquest/shared';

export default function ExploreLayout() {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapViewRef>(null);
  const router = useRouter();
  const pathname = usePathname();
  const segments = useSegments();
  
  // Check if any explore-related queries are fetching
  const isFetchingPeaks = useIsFetching({ queryKey: ['mapPeaks'] }) > 0;
  const isFetchingChallenges = useIsFetching({ queryKey: ['mapChallenges'] }) > 0;
  const isFetchingAllChallenges = useIsFetching({ queryKey: ['allChallenges'] }) > 0;
  const isFetchingPeakDetails = useIsFetching({ queryKey: ['peakDetails'] }) > 0;
  const isFetchingChallengeDetails = useIsFetching({ queryKey: ['challengeDetails'] }) > 0;
  const isRefreshing = isFetchingPeaks || isFetchingChallenges || isFetchingAllChallenges || isFetchingPeakDetails || isFetchingChallengeDetails;
  
  // Determine if we're on a detail page
  const isDetailView = segments.includes('peak') || segments.includes('challenge');
  
  // Map store state
  const visiblePeaks = useMapStore((state) => state.visiblePeaks);
  const visibleChallenges = useMapStore((state) => state.visibleChallenges);
  const challengeOverlayPeaks = useMapStore((state) => state.challengeOverlayPeaks);
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
  const setChallengeOverlayPeaks = useMapStore((state) => state.setChallengeOverlayPeaks);
  const currentBounds = useMapStore((state) => state.currentBounds);
  const isZoomedOutTooFar = useMapStore((state) => state.isZoomedOutTooFar);
  const pendingFitBounds = useMapStore((state) => state.pendingFitBounds);
  const clearPendingFitBounds = useMapStore((state) => state.clearPendingFitBounds);

  // Sheet state
  const sheetSnapIndex = useSheetStore((s) => s.snapIndex);
  const sheetExpand = useSheetStore((s) => s.expand);
  const sheetSnapTo = useSheetStore((s) => s.snapTo);
  const sheetCollapse = useSheetStore((s) => s.collapse);

  // Convert bounds for API
  const apiBounds = currentBounds ? {
    northWest: [currentBounds[1][1], currentBounds[0][0]] as [number, number],
    southEast: [currentBounds[0][1], currentBounds[1][0]] as [number, number],
  } : null;

  // Fetch peaks and challenges
  const { data: peaksData } = useMapPeaks(apiBounds, !isZoomedOutTooFar);
  const { data: challengesData } = useMapChallenges(apiBounds, !isZoomedOutTooFar);

  useEffect(() => {
    if (peaksData) setVisiblePeaks(peaksData);
  }, [peaksData, setVisiblePeaks]);

  useEffect(() => {
    if (challengesData) setVisibleChallenges(challengesData);
  }, [challengesData, setVisibleChallenges]);

  // Resolve selected items
  const selectedPeak = selectedPeakId 
    ? visiblePeaks.find(p => p.id === selectedPeakId) 
    : null;
  const selectedChallenge = selectedChallengeId
    ? visibleChallenges.find(c => c.id === selectedChallengeId)
    : null;

  // Sync selectionMode with route
  useEffect(() => {
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
      clearPendingFitBounds();
    }
  }, [pendingFitBounds, clearPendingFitBounds]);

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
  const handlePeakMarkerPress = useCallback((peak: Peak) => {
    selectPeak(peak.id);
    sheetCollapse();
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

  return (
    <View style={{ flex: 1 }}>
      {/* Map Layer */}
      <MapView
        ref={mapRef}
        onRegionChange={handleRegionChange}
        onMapReady={handleMapReady}
      >
        {/* Only show regular peaks when NOT in challenge overlay mode */}
        {!challengeOverlayPeaks && (
          <PeakMarkers
            peaks={visiblePeaks}
            selectedPeakId={selectedPeakId}
            onPeakPress={handlePeakMarkerPress}
            isDark={true}
          />
        )}
        {/* Challenge overlay peaks (Show on Map) */}
        {challengeOverlayPeaks && (
          <ChallengePeaksOverlay peaks={challengeOverlayPeaks} isDark={true} />
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
          visible={!isDetailView}
          onPeakPress={openPeakDetail}
          onChallengePress={openChallengeDetail}
        />
      </View>

      {/* Center on Me FAB */}
      <CenterOnMeButton
        onPress={handleCenterOnUser}
        visible={selectionMode !== 'floating' || sheetSnapIndex !== 0}
        style={{
          position: 'absolute',
          right: 16,
          bottom: 100,
        }}
      />

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
