import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Compass, User, LogOut, LogIn, UserCircle } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { MapView, PeakMarkers, CenterOnMeButton, LineToTarget } from '@/src/components/map';
import type { MapViewRef } from '@/src/components/map';
import { ContentSheet } from '@/src/components/navigation';
import { useMapStore } from '@/src/store/mapStore';
import { useSheetStore } from '@/src/store/sheetStore';
import { useMapPeaks, useMapChallenges } from '@/src/hooks';
import type { Peak, ChallengeProgress } from '@pathquest/shared';
import { Text } from '@/src/components/ui';

// Import tab content components
import { DashboardContent } from '@/src/components/home';
import { ProfileContent } from '@/src/components/profile';
import { 
  DiscoveryContent, 
  ExploreOmnibar,
  PeakDetail, 
  ChallengeDetail,
  FloatingPeakCard,
  FloatingChallengeCard,
} from '@/src/components/explore';
import { useAuthStore } from '@/src/lib/auth';
import { startStravaAuth } from '@/src/lib/auth/strava';

type TabName = 'home' | 'explore' | 'profile';

/**
 * Main Tab Layout
 * 
 * Layout varies by tab:
 * - **Home**: Full-screen dashboard (no map)
 * - **Explore**: Map background with ContentSheet overlay
 * - **You**: Full-screen profile (no map by default, toggle to map mode in future)
 */
export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapViewRef>(null);
  const router = useRouter();
  
  // Active tab state
  const [activeTab, setActiveTab] = useState<TabName>('home');
  
  // Auth state
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  
  // Map store state
  const visiblePeaks = useMapStore((state) => state.visiblePeaks);
  const visibleChallenges = useMapStore((state) => state.visibleChallenges);
  const selectedPeakId = useMapStore((state) => state.selectedPeakId);
  const selectedChallengeId = useMapStore((state) => state.selectedChallengeId);
  const selectionMode = useMapStore((state) => state.selectionMode);
  const selectPeak = useMapStore((state) => state.selectPeak);
  const selectChallenge = useMapStore((state) => state.selectChallenge);
  const openDetail = useMapStore((state) => state.openDetail);
  const updateMapRegion = useMapStore((state) => state.updateMapRegion);
  const clearSelection = useMapStore((state) => state.clearSelection);
  const setSelectedPeakId = useMapStore((state) => state.setSelectedPeakId);
  const setSelectedChallengeId = useMapStore((state) => state.setSelectedChallengeId);
  const setSelectionMode = useMapStore((state) => state.setSelectionMode);
  const setVisiblePeaks = useMapStore((state) => state.setVisiblePeaks);
  const setVisibleChallenges = useMapStore((state) => state.setVisibleChallenges);
  const currentBounds = useMapStore((state) => state.currentBounds);
  const isZoomedOutTooFar = useMapStore((state) => state.isZoomedOutTooFar);

  // Sheet state (0 collapsed, 1 halfway, 2 expanded)
  const sheetSnapIndex = useSheetStore((s) => s.snapIndex);
  const sheetExpand = useSheetStore((s) => s.expand);
  const sheetSnapTo = useSheetStore((s) => s.snapTo);

  // Convert bounds format for API: [[sw_lng, sw_lat], [ne_lng, ne_lat]] -> { northWest: [lat, lng], southEast: [lat, lng] }
  const apiBounds = currentBounds ? {
    northWest: [currentBounds[1][1], currentBounds[0][0]] as [number, number], // [ne_lat, sw_lng]
    southEast: [currentBounds[0][1], currentBounds[1][0]] as [number, number], // [sw_lat, ne_lng]
  } : null;

  // Debug logging
  useEffect(() => {
    console.log('[TabLayout] Bounds state - currentBounds:', currentBounds ? 'set' : 'null', 
      'isZoomedOutTooFar:', isZoomedOutTooFar, 
      'apiBounds:', apiBounds ? JSON.stringify(apiBounds) : 'null');
  }, [currentBounds, isZoomedOutTooFar, apiBounds]);

  // Enforce routing rule: floating preview cards only exist when sheet is fully collapsed.
  // If user drags the sheet up, dismiss the floating selection.
  useEffect(() => {
    if (sheetSnapIndex !== 0 && selectionMode === 'floating') {
      clearSelection();
    }
  }, [sheetSnapIndex, selectionMode, clearSelection]);

  // Fetch peaks and challenges from API when map bounds change
  const { data: peaksData, isLoading: peaksLoading, error: peaksError } = useMapPeaks(apiBounds, !isZoomedOutTooFar);
  const { data: challengesData } = useMapChallenges(apiBounds, !isZoomedOutTooFar);

  // Debug: Log when peaks data changes
  useEffect(() => {
    console.log('[TabLayout] peaksData changed:', peaksData?.length ?? 0, 'peaks, loading:', peaksLoading, 'error:', peaksError?.message);
  }, [peaksData, peaksLoading, peaksError]);

  // Update store when data changes
  useEffect(() => {
    if (peaksData) {
      setVisiblePeaks(peaksData);
    }
  }, [peaksData, setVisiblePeaks]);

  useEffect(() => {
    if (challengesData) {
      setVisibleChallenges(challengesData);
    }
  }, [challengesData, setVisibleChallenges]);

  // Find selected items from visible items
  const selectedPeak = selectedPeakId 
    ? visiblePeaks.find(p => p.id === selectedPeakId) 
    : null;
  const selectedChallenge = selectedChallengeId
    ? visibleChallenges.find(c => c.id === selectedChallengeId)
    : null;

  // Handle map region changes
  const handleRegionChange = useCallback((region: {
    center: [number, number];
    zoom: number;
    bounds: [[number, number], [number, number]];
  }) => {
    console.log('[TabLayout] Region changed - zoom:', region.zoom, 'bounds:', JSON.stringify(region.bounds));
    updateMapRegion(region);
  }, [updateMapRegion]);

  // Handle map ready - trigger initial bounds fetch
  const handleMapReady = useCallback(async () => {
    console.log('[TabLayout] Map ready, fetching initial bounds...');
    // Give the map a moment to fully initialize
    setTimeout(async () => {
      try {
        const center = await mapRef.current?.getCenter();
        const zoom = await mapRef.current?.getZoom();
        if (center && zoom) {
          // Estimate bounds from center and zoom
          // This is a rough approximation - the actual onRegionChange will update with real bounds
          console.log('[TabLayout] Initial center:', center, 'zoom:', zoom);
        }
      } catch (error) {
        console.warn('[TabLayout] Error getting initial map state:', error);
      }
    }, 500);
  }, []);

  // Open detail directly (used by list taps + omnibar)
  const openPeakDetail = useCallback(
    (peak: Peak) => {
      setSelectedPeakId(peak.id);
      setSelectionMode('detail');
      sheetExpand(); // Ensure sheet is fully open for detail
      setActiveTab('explore');
      if (peak.location_coords) {
        mapRef.current?.flyTo(peak.location_coords, 14);
      }
    },
    [setSelectedPeakId, setSelectionMode, sheetExpand]
  );

  const openChallengeDetail = useCallback(
    (challenge: ChallengeProgress) => {
      setSelectedChallengeId(challenge.id);
      setSelectionMode('detail');
      sheetExpand(); // Ensure sheet is fully open for detail
      setActiveTab('explore');
    },
    [setSelectedChallengeId, setSelectionMode, sheetExpand]
  );

  // Marker tap behavior depends on sheet position:
  // - Collapsed: show floating mini card
  // - Half/Expanded: go straight to detail + expand
  const handlePeakMarkerPress = useCallback(
    (peak: Peak) => {
      if (sheetSnapIndex === 0) {
        selectPeak(peak.id);
        setActiveTab('explore');
        if (peak.location_coords) {
          mapRef.current?.flyTo(peak.location_coords, 14);
        }
        return;
      }
      openPeakDetail(peak);
    },
    [openPeakDetail, selectPeak, sheetSnapIndex]
  );

  // Handle opening detail view from floating card
  const handleOpenDetail = useCallback(() => {
    openDetail();
    sheetExpand();
  }, [openDetail, sheetExpand]);

  const handleOpenCompass = useCallback(() => {
    if (!selectedPeakId) return;
    router.push({ pathname: '/compass/[peakId]', params: { peakId: selectedPeakId } });
  }, [router, selectedPeakId]);

  // Close floating selection (doesn't change sheet snap)
  const handleCloseFloating = useCallback(() => {
    clearSelection();
  }, [clearSelection]);

  // Close detail (returns to browsing state)
  const handleCloseDetail = useCallback(() => {
    clearSelection();
    sheetSnapTo('halfway');
  }, [clearSelection, sheetSnapTo]);

  // Handle center on user location
  const handleCenterOnUser = useCallback(() => {
    mapRef.current?.centerOnUser();
  }, []);

  // Handle login
  const handleLogin = async () => {
    await startStravaAuth();
  };

  // Handle logout
  const handleLogout = async () => {
    await logout();
  };

  // Render Explore tab content (for ContentSheet)
  const renderExploreContent = () => {
    // Show full detail view only when selectionMode is 'detail'
    if (selectionMode === 'detail') {
      if (selectedPeak) {
        return (
          <PeakDetail 
            peak={selectedPeak} 
            onClose={handleCloseDetail}
          />
        );
      }
      if (selectedChallenge) {
        return (
          <ChallengeDetail 
            challenge={selectedChallenge} 
            onClose={handleCloseDetail}
          />
        );
      }
    }
    
    // Default to discovery content (floating cards shown separately)
    return (
      <DiscoveryContent
        onPeakPress={openPeakDetail}
        onChallengePress={openChallengeDetail}
      />
    );
  };

  // Theme background color (warm brown)
  const BACKGROUND_COLOR = '#25221E';

  // Render Home tab content (full screen, no map)
  const renderHomeContent = () => {
    return (
      <View 
        className="flex-1"
        style={{ 
          backgroundColor: BACKGROUND_COLOR,
          paddingTop: insets.top, 
          paddingBottom: TAB_BAR_HEIGHT + insets.bottom 
        }}
      >
        <DashboardContent onPeakPress={openPeakDetail} />
      </View>
    );
  };

  // Render You/Profile tab content (full screen, no map)
  const renderProfileContent = () => {
    if (!isAuthenticated) {
      return (
        <View 
          className="flex-1 items-center justify-center p-6"
          style={{ 
            backgroundColor: BACKGROUND_COLOR,
            paddingTop: insets.top, 
            paddingBottom: TAB_BAR_HEIGHT + insets.bottom 
          }}
        >
          <UserCircle size={64} color="#A9A196" />
          <Text className="text-foreground text-lg font-semibold mt-5 text-center">
            Sign in to view your profile
          </Text>
          <Text className="text-muted-foreground text-sm mt-2 text-center leading-5">
            Track your peaks, summit journal, and challenges
          </Text>
          <TouchableOpacity 
            className="flex-row items-center gap-2.5 bg-primary px-6 py-3.5 rounded-lg mt-7"
            onPress={handleLogin}
            activeOpacity={0.8}
          >
            <LogIn size={18} color="#F5F2ED" />
            <Text className="text-primary-foreground text-base font-semibold">
              Connect with Strava
            </Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    return (
      <View 
        className="flex-1"
        style={{ 
          backgroundColor: BACKGROUND_COLOR,
          paddingTop: insets.top, 
          paddingBottom: TAB_BAR_HEIGHT + insets.bottom 
        }}
      >
        {/* Profile Header */}
        <View className="flex-row items-center px-4 py-4 border-b border-border">
          <View className="w-14 h-14 rounded-full bg-muted items-center justify-center">
            <User size={28} color="#A9A196" />
          </View>
          <View className="flex-1 ml-3">
            <Text className="text-foreground text-lg font-bold">
              {user?.name || 'Explorer'}
            </Text>
            {(user?.city || user?.state) && (
              <Text className="text-muted-foreground text-sm mt-0.5">
                {[user.city, user.state].filter(Boolean).join(', ')}
              </Text>
            )}
          </View>
          <TouchableOpacity 
            className="p-2.5 rounded-lg border border-border"
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <LogOut size={16} color="#A9A196" />
          </TouchableOpacity>
        </View>
        
        <ProfileContent userId={user?.id || ''} />
      </View>
    );
  };

  // Tab bar height
  const TAB_BAR_HEIGHT = 60;

  // Check if we should show the map-based layout (Explore tab only)
  const isExploreTab = activeTab === 'explore';

  return (
    <View className="flex-1">
      {/* 
        === MAP LAYER === 
        Always mounted to prevent tile reloading, but hidden when not on Explore tab
      */}
      <View 
        style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0,
          // Hide but keep mounted when not on Explore tab
          opacity: isExploreTab ? 1 : 0,
          pointerEvents: isExploreTab ? 'auto' : 'none',
        }}
      >
        <MapView
          ref={mapRef}
          onRegionChange={handleRegionChange}
          onMapReady={handleMapReady}
        >
          <PeakMarkers
            peaks={visiblePeaks}
            selectedPeakId={selectedPeakId}
            onPeakPress={handlePeakMarkerPress}
            isDark={true}
          />
          
          {/* Line from user to selected peak (when in floating mode) */}
          {selectionMode === 'floating' && selectedPeak?.location_coords && (
            <LineToTarget
              targetCoords={selectedPeak.location_coords}
              userCoords={null} // TODO: Add user location tracking in Phase 2
              visible={true}
            />
          )}
        </MapView>

        {/* Omnibar - top of map (web-style) */}
        <View
          style={{
            position: 'absolute',
            top: insets.top + 12,
            left: 16,
            right: 16,
            zIndex: 50,
          }}
          pointerEvents="box-none"
        >
          <ExploreOmnibar
            visible={selectionMode !== 'detail'}
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
            bottom: TAB_BAR_HEIGHT + insets.bottom + 100,
          }}
        />

        {/* Floating Peak Card */}
        {selectionMode === 'floating' && sheetSnapIndex === 0 && selectedPeak && (
          <View 
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: TAB_BAR_HEIGHT + insets.bottom + 90,
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
              bottom: TAB_BAR_HEIGHT + insets.bottom + 90,
            }}
          >
            <FloatingChallengeCard
              challenge={selectedChallenge}
              onClose={handleCloseFloating}
              onDetailsPress={handleOpenDetail}
            />
          </View>
        )}

        {/* Content Sheet Overlay */}
        <ContentSheet
          bottomPadding={TAB_BAR_HEIGHT + insets.bottom}
          // In discovery mode, leave room for the omnibar so the sheet doesn't slide under it.
          expandedTopInset={selectionMode === 'none' ? insets.top + 12 + 56 + 16 : 100}
        >
          {renderExploreContent()}
        </ContentSheet>
      </View>

      {/* === HOME TAB: Full-screen dashboard (no map) === */}
      {activeTab === 'home' && renderHomeContent()}

      {/* === YOU TAB: Full-screen profile (no map) === */}
      {activeTab === 'profile' && renderProfileContent()}

      {/* Bottom Tab Bar - Always visible */}
      <View 
        className="absolute bottom-0 left-0 right-0 flex-row bg-card border-t border-border"
        style={{ paddingBottom: insets.bottom, height: TAB_BAR_HEIGHT + insets.bottom }}
      >
        <TabButton
          Icon={Home}
          label="Home"
          isActive={activeTab === 'home'}
          onPress={() => setActiveTab('home')}
        />
        <TabButton
          Icon={Compass}
          label="Explore"
          isActive={activeTab === 'explore'}
          onPress={() => setActiveTab('explore')}
        />
        <TabButton
          Icon={User}
          label="You"
          isActive={activeTab === 'profile'}
          onPress={() => setActiveTab('profile')}
        />
      </View>
    </View>
  );
}

// Tab Button Component
function TabButton({ 
  Icon, 
  label, 
  isActive, 
  onPress, 
}: { 
  Icon: LucideIcon;
  label: string;
  isActive: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      className="flex-1 items-center justify-center pt-1.5"
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View className={`p-1.5 rounded-lg ${isActive ? 'bg-primary/20' : ''}`}>
        <Icon
          size={22}
          color={isActive ? '#5B9167' : '#A9A196'}
        />
      </View>
      <Text className={`text-[10px] font-medium mt-0.5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}
