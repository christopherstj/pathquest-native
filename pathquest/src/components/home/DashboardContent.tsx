/**
 * DashboardContent
 * 
 * Main dashboard wrapper for the Home tab. Shows:
 * - Welcome header
 * - Quick stats bar (peaks, elevation, closest challenge)
 * - Suggested next peak with weather
 * - Trip report CTA (if unreported summit)
 * - Favorite challenges with progress
 * 
 * For guests (unauthenticated users), shows:
 * - Welcome hero with value proposition and login CTA
 * - Popular challenges carousel
 * - Recent community activity feed
 */

import React, { useEffect, useState } from 'react';
import { View, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from "expo-router";
import { LogIn } from 'lucide-react-native';
import Mapbox from '@rnmapbox/maps';
import { useAuthStore } from '@/src/lib/auth';
import { startStravaAuth } from '@/src/lib/auth/strava';
import { useDashboardData, useSuggestedPeak, usePopularChallenges, useRecentPublicSummits, useImportStatus } from '@/src/hooks';
import { useTheme } from '@/src/theme';
import { useOnboardingStore } from '@/src/store';
import TopoPattern from '@/src/components/ui/TopoPattern';
import { Text } from '@/src/components/ui';
import { UserAvatar } from "@/src/components/shared";
import { OnboardingModal } from '@/src/components/onboarding';
import QuickStats from './QuickStats';
import SuggestedPeakCard from './SuggestedPeakCard';
import TripReportCTA from './TripReportCTA';
import FavoriteChallenges from './FavoriteChallenges';
import UnconfirmedSummitsCard from './UnconfirmedSummitsCard';
import GuestWelcomeHero from './GuestWelcomeHero';
import PopularChallengesCarousel from './PopularChallengesCarousel';
import RecentCommunityActivity from './RecentCommunityActivity';
import ImportProgressCard from './ImportProgressCard';

import type { ChallengeProgress } from '@pathquest/shared';

interface DashboardContentProps {
  onPeakPress?: (peakId: string) => void;
  onChallengePress?: (challenge: ChallengeProgress) => void;
  onChallengePressById?: (challengeId: string) => void; // For SuggestedPeakCard which only has challenge_id
  onTripReportPress?: (summitId: string, peakId: string) => void;
  onViewReview?: () => void; // Navigate to Profile Review tab
}

const DashboardContent: React.FC<DashboardContentProps> = ({
  onPeakPress,
  onChallengePress,
  onChallengePressById,
  onTripReportPress,
  onViewReview,
}) => {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  // Onboarding state
  const hasSeenOnboarding = useOnboardingStore((s) => s.hasSeenOnboarding);
  const showOnboardingModal = useOnboardingStore((s) => s.showOnboardingModal);
  const isOnboardingLoading = useOnboardingStore((s) => s.isLoading);
  const initializeOnboarding = useOnboardingStore((s) => s.initialize);
  const openOnboarding = useOnboardingStore((s) => s.openOnboarding);
  const completeOnboarding = useOnboardingStore((s) => s.completeOnboarding);

  // Track user location for suggested peak
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [bgDims, setBgDims] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  // Get user location via Mapbox (uses same location provider as the map puck)
  useEffect(() => {
    let isMounted = true;

    const getLocation = async () => {
      try {
        // Request permission on Android
        if (Platform.OS === 'android') {
          const granted = await Mapbox.requestAndroidLocationPermissions();
          if (!granted) {
            console.log('[DashboardContent] Location permission denied');
            return;
          }
        }

        // Get last known location from Mapbox
        const location = await Mapbox.locationManager.getLastKnownLocation();
        
        if (isMounted && location?.coords) {
          setUserCoords({
            lat: location.coords.latitude,
            lng: location.coords.longitude,
          });
          console.log('[DashboardContent] Got user location:', location.coords);
        }
      } catch (error) {
        console.warn('[DashboardContent] Error getting location:', error);
      }
    };

    if (isAuthenticated) {
      getLocation();
    }

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  // Fetch dashboard data - must be called unconditionally (React hooks rules)
  const { stats, recentSummits, favoriteChallenges, isLoading } = useDashboardData();
  
  // Fetch suggested peak (only when we have user location)
  const { data: suggestedPeak, isLoading: isSuggestedLoading } = useSuggestedPeak(userCoords);

  // Guest data - always fetch these (hooks must be called unconditionally)
  const { data: popularChallenges, isLoading: isPopularLoading } = usePopularChallenges(5);
  const { data: recentPublicSummits, isLoading: isPublicSummitsLoading } = useRecentPublicSummits(8);

  // Import status (for authenticated users)
  const { data: importStatus } = useImportStatus();

  // Initialize onboarding store on mount
  useEffect(() => {
    initializeOnboarding();
  }, [initializeOnboarding]);

  // Show onboarding modal when:
  // - User is authenticated
  // - Has not seen onboarding before
  // - Import is in progress (first time user)
  // - Onboarding store is done loading
  useEffect(() => {
    if (
      isAuthenticated &&
      !hasSeenOnboarding &&
      !isOnboardingLoading &&
      importStatus?.status === 'processing'
    ) {
      openOnboarding();
    }
  }, [isAuthenticated, hasSeenOnboarding, isOnboardingLoading, importStatus?.status, openOnboarding]);

  const handleLogin = async () => {
    await startStravaAuth();
  };

  const handleExplore = () => {
    router.navigate('/explore' as any);
  };

  // Guest view - engaging discovery experience
  if (!isAuthenticated) {
    return (
      <View
        className="flex-1"
        style={{ backgroundColor: colors.background }}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          setBgDims({ width, height });
        }}
      >
        {/* Screen-level topo backdrop */}
        {bgDims.width > 0 && bgDims.height > 0 && (
          <TopoPattern
            width={bgDims.width}
            height={bgDims.height}
            variant="full"
            lines={10}
            opacity={isDark ? 0.06 : 0.08}
            strokeWidth={1.25}
            color={colors.contourInk}
            seed="guest-home-backdrop"
          />
        )}

        <ScrollView 
          className="flex-1"
          contentContainerClassName="py-6 gap-5"
          showsVerticalScrollIndicator={false}
        >
          {/* Hero with login CTA */}
          <GuestWelcomeHero 
            onLoginPress={handleLogin}
            onExplorePress={handleExplore}
          />

          {/* Popular Challenges */}
          <PopularChallengesCarousel
            challenges={popularChallenges ?? []}
            isLoading={isPopularLoading}
            onChallengePress={onChallengePressById}
          />

          {/* Community Activity */}
          <RecentCommunityActivity
            summits={recentPublicSummits ?? []}
            isLoading={isPublicSummitsLoading}
            onPeakPress={onPeakPress}
            onUserPress={(userId) => {
              router.push({
                pathname: '/explore/users/[userId]',
                params: { userId },
              });
            }}
          />

          {/* Bottom CTA reminder */}
          <View className="px-4 pt-2">
            <TouchableOpacity
              className="flex-row items-center justify-center gap-2 py-3 rounded-xl"
              style={{ 
                backgroundColor: `${colors.primary}15`,
                borderWidth: 1,
                borderColor: `${colors.primary}30`,
              }}
              onPress={handleLogin}
              activeOpacity={0.7}
            >
              <LogIn size={16} color={colors.primary} />
              <Text className="font-medium" style={{ color: colors.primary }}>
                Sign in to track your summits
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Helper to parse PostgreSQL timestamp format to ISO format
  // "2025-12-28 20:44:52+00" -> "2025-12-28T20:44:52+00:00"
  const parseTimestamp = (ts: string): string => {
    if (!ts) return new Date().toISOString();
    let parsed = ts.replace(' ', 'T');
    if (/[+-]\d{2}$/.test(parsed)) {
      parsed = parsed + ':00';
    }
    return parsed;
  };

  // Transform summits to the expected format
  const formattedSummits = recentSummits.map((summit: any) => ({
    id: summit.id,
    peakId: summit.peak_id,
    peakName: summit.name,
    peakElevation: summit.elevation,
    timestamp: parseTimestamp(summit.timestamp),
    hasReport: summit.hasReport ?? false,
    summitNumber: summit.summitNumber,
  }));

  // Find first unreported summit for trip report CTA
  const unreportedSummit = formattedSummits.find((s) => !s.hasReport);

  // Calculate time estimate for onboarding modal
  const estimatedMinutes = importStatus?.estimatedHoursRemaining 
    ? importStatus.estimatedHoursRemaining * 60 
    : undefined;

  // Authenticated view
  return (
    <View
      className="flex-1"
      style={{ backgroundColor: colors.background }}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        setBgDims({ width, height });
      }}
    >
      {/* Onboarding Modal */}
      <OnboardingModal
        visible={showOnboardingModal}
        onComplete={completeOnboarding}
        totalActivities={importStatus?.totalActivities}
        estimatedMinutes={estimatedMinutes}
      />

      {/* Screen-level topo backdrop */}
      {bgDims.width > 0 && bgDims.height > 0 && (
        <TopoPattern
          width={bgDims.width}
          height={bgDims.height}
          variant="full"
          lines={10}
          opacity={isDark ? 0.06 : 0.08}
          strokeWidth={1.25}
          color={colors.contourInk}
          seed="home-backdrop"
        />
      )}

      <ScrollView 
        className="flex-1"
        contentContainerClassName="p-4 pb-8 gap-4"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row justify-between items-center mb-2">
          <View>
            <Text style={{ color: colors.mutedForeground }} className="text-sm">
              Welcome back
            </Text>
            <Text style={{ color: colors.foreground }} className="text-2xl font-bold">
              {user?.name || 'Explorer'}
            </Text>
          </View>
          <UserAvatar
            size="md"
            name={user?.name}
            uri={user?.pic}
            onPress={() => router.navigate("/profile" as any)}
          />
        </View>

      {/* Import Progress Card (when import is in progress) */}
      {importStatus?.status === 'processing' && (
        <ImportProgressCard status={importStatus} />
      )}

      {/* Quick Stats - 3 lifetime metrics */}
      <QuickStats 
        totalPeaks={stats?.totalPeaks ?? 0}
        totalElevation={stats?.totalElevationGained ?? 0}
        primaryChallenge={stats?.primaryChallengeProgress ?? null}
        isLoading={isLoading}
        onChallengePress={(challengeId) => onChallengePressById?.(String(challengeId))}
      />

      {/* Trip Report CTA (if there's an unreported summit) - Main focus */}
      {unreportedSummit && (
        <TripReportCTA
          summit={unreportedSummit}
          onPress={() => onTripReportPress?.(unreportedSummit.id, unreportedSummit.peakId)}
        />
      )}

      {/* Unconfirmed Summits Card (if any need review) */}
      <UnconfirmedSummitsCard
        onViewAll={onViewReview}
        onViewPeak={onPeakPress}
        onViewActivity={(activityId) => {
          router.push({
            pathname: '/explore/activity/[activityId]',
            params: { activityId },
          });
        }}
        maxSummits={3}
      />

      {/* Suggested Next Peak Hero */}
      <SuggestedPeakCard
        suggestedPeak={suggestedPeak ?? null}
        isLoading={isSuggestedLoading || (userCoords === null && isAuthenticated)}
        onPeakPress={onPeakPress}
        onChallengePress={onChallengePressById}
      />

      {/* Favorite Challenges */}
      <FavoriteChallenges 
        challenges={favoriteChallenges}
        onChallengePress={onChallengePress}
        isLoading={isLoading}
      />
      </ScrollView>
    </View>
  );
};

export default DashboardContent;
