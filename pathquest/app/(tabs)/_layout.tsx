import React, { useState, useRef, useCallback } from 'react';
import { View, TouchableOpacity, Text as RNText } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { MapView, PeakMarkers } from '@/src/components/map';
import type { MapViewRef } from '@/src/components/map';
import { ContentSheet } from '@/src/components/navigation';
import { useMapStore } from '@/src/store/mapStore';
import type { Peak } from '@pathquest/shared';
import { Text } from '@/src/components/ui';

// Import tab content components
import { DashboardContent } from '@/src/components/home';
import { ProfileContent } from '@/src/components/profile';
import { DiscoveryContent, PeakDetail, ChallengeDetail } from '@/src/components/explore';
import { useAuthStore } from '@/src/lib/auth';
import { startStravaAuth } from '@/src/lib/auth/strava';

type TabName = 'home' | 'explore' | 'profile';

/**
 * Main Tab Layout
 * 
 * Renders the map as a full-screen background with all tab content
 * inside a draggable ContentSheet overlay. This mimics the web app's
 * layout where the map is always visible behind the content drawer.
 */
export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapViewRef>(null);
  
  // Active tab state
  const [activeTab, setActiveTab] = useState<TabName>('home');
  
  // Auth state
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  
  // Map store state
  const visiblePeaks = useMapStore((state) => state.visiblePeaks);
  const selectedPeakId = useMapStore((state) => state.selectedPeakId);
  const setSelectedPeakId = useMapStore((state) => state.setSelectedPeakId);
  const setSelectedChallengeId = useMapStore((state) => state.setSelectedChallengeId);
  const updateMapRegion = useMapStore((state) => state.updateMapRegion);
  const clearSelection = useMapStore((state) => state.clearSelection);

  // Find selected peak from visible items
  const selectedPeak = selectedPeakId 
    ? visiblePeaks.find(p => p.id === selectedPeakId) 
    : null;

  // Handle map region changes
  const handleRegionChange = useCallback((region: {
    center: [number, number];
    zoom: number;
    bounds: [[number, number], [number, number]];
  }) => {
    updateMapRegion(region);
  }, [updateMapRegion]);

  // Handle peak selection from list or map
  const handlePeakPress = useCallback((peak: Peak) => {
    setSelectedPeakId(peak.id);
    setActiveTab('explore');
    if (peak.location_coords) {
      mapRef.current?.flyTo(peak.location_coords, 14);
    }
  }, [setSelectedPeakId]);

  // Handle challenge selection from list
  const handleChallengePress = useCallback((challenge: any) => {
    setSelectedChallengeId(challenge.id);
    setActiveTab('explore');
  }, [setSelectedChallengeId]);

  // Handle closing detail view
  const handleCloseDetail = useCallback(() => {
    clearSelection();
  }, [clearSelection]);

  // Handle login
  const handleLogin = async () => {
    await startStravaAuth();
  };

  // Handle logout
  const handleLogout = async () => {
    await logout();
  };

  // Render content based on active tab
  const renderContent = () => {
    // If on Explore tab and there's a selection, show detail view
    if (activeTab === 'explore') {
      if (selectedPeak) {
        return (
          <PeakDetail 
            peak={selectedPeak} 
            onClose={handleCloseDetail}
          />
        );
      }
      
      return (
        <DiscoveryContent
          onPeakPress={handlePeakPress}
          onChallengePress={handleChallengePress}
        />
      );
    }
    
    if (activeTab === 'home') {
      return <DashboardContent onPeakPress={handlePeakPress} />;
    }
    
    if (activeTab === 'profile') {
      if (!isAuthenticated) {
        return (
          <View className="flex-1 items-center justify-center p-6">
            <FontAwesome name="user-circle" size={64} color="#A9A196" />
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
              <FontAwesome name="sign-in" size={18} color="#F5F2ED" />
              <Text className="text-primary-foreground text-base font-semibold">
                Connect with Strava
              </Text>
            </TouchableOpacity>
          </View>
        );
      }
      
      return (
        <View className="flex-1">
          {/* Profile Header */}
          <View className="flex-row items-center px-4 py-4 border-b border-border">
            <View className="w-14 h-14 rounded-full bg-muted items-center justify-center">
              <FontAwesome name="user" size={28} color="#A9A196" />
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
              <FontAwesome name="sign-out" size={16} color="#A9A196" />
            </TouchableOpacity>
          </View>
          
          <ProfileContent userId={user?.id || ''} />
        </View>
      );
    }
    
    return null;
  };

  // Tab bar height
  const TAB_BAR_HEIGHT = 60;

  return (
    <View className="flex-1">
      {/* Map Background - Always visible */}
      <MapView
        ref={mapRef}
        onRegionChange={handleRegionChange}
      >
        <PeakMarkers
          peaks={visiblePeaks}
          selectedPeakId={selectedPeakId}
          onPeakPress={handlePeakPress}
          isDark={true}
        />
      </MapView>

      {/* Content Sheet Overlay */}
      <ContentSheet bottomPadding={TAB_BAR_HEIGHT + insets.bottom}>
        {renderContent()}
      </ContentSheet>

      {/* Bottom Tab Bar */}
      <View 
        className="absolute bottom-0 left-0 right-0 flex-row bg-card border-t border-border"
        style={{ paddingBottom: insets.bottom, height: TAB_BAR_HEIGHT + insets.bottom }}
      >
        <TabButton
          icon="home"
          label="Home"
          isActive={activeTab === 'home'}
          onPress={() => setActiveTab('home')}
        />
        <TabButton
          icon="compass"
          label="Explore"
          isActive={activeTab === 'explore'}
          onPress={() => setActiveTab('explore')}
        />
        <TabButton
          icon="user"
          label="Profile"
          isActive={activeTab === 'profile'}
          onPress={() => setActiveTab('profile')}
        />
      </View>
    </View>
  );
}

// Tab Button Component
function TabButton({ 
  icon, 
  label, 
  isActive, 
  onPress, 
}: { 
  icon: React.ComponentProps<typeof FontAwesome>['name'];
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
        <FontAwesome
          name={icon}
          size={22}
          color={isActive ? '#5B9167' : '#A9A196'}
        />
      </View>
      <RNText className={`text-[10px] font-medium mt-0.5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
        {label}
      </RNText>
    </TouchableOpacity>
  );
}
