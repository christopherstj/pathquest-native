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
 * Shows a login prompt when not authenticated.
 */

import React, { useEffect, useState } from 'react';
import { View, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from "expo-router";
import { Map, LogIn, Flag, Trophy, MapPin } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import Mapbox from '@rnmapbox/maps';
import { useAuthStore } from '@/src/lib/auth';
import { startStravaAuth } from '@/src/lib/auth/strava';
import { useDashboardData, useSuggestedPeak } from '@/src/hooks';
import { useTheme } from '@/src/theme';
import TopoPattern from '@/src/components/ui/TopoPattern';
import { Text } from '@/src/components/ui';
import { UserAvatar } from "@/src/components/shared";
import QuickStats from './QuickStats';
import SuggestedPeakCard from './SuggestedPeakCard';
import TripReportCTA from './TripReportCTA';
import FavoriteChallenges from './FavoriteChallenges';

import type { ChallengeProgress } from '@pathquest/shared';

interface DashboardContentProps {
  onPeakPress?: (peakId: string) => void;
  onChallengePress?: (challenge: ChallengeProgress) => void;
  onChallengePressById?: (challengeId: string) => void; // For SuggestedPeakCard which only has challenge_id
  onTripReportPress?: (summitId: string, peakId: string) => void;
}

const DashboardContent: React.FC<DashboardContentProps> = ({
  onPeakPress,
  onChallengePress,
  onChallengePressById,
  onTripReportPress,
}) => {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

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

  const handleLogin = async () => {
    await startStravaAuth();
  };

  // Guest view
  if (!isAuthenticated) {
    return (
      <ScrollView 
        className="flex-1"
        contentContainerClassName="p-6 pt-10 items-center"
        showsVerticalScrollIndicator={false}
        style={{ backgroundColor: colors.background }}
      >
        {/* Welcome */}
        <View className="items-center mb-8">
          <View className="w-20 h-20 rounded-full bg-primary/15 items-center justify-center mb-4">
            <Map size={32} color={colors.statForest} />
          </View>
          <Text className="text-foreground text-2xl font-bold text-center mb-2">
            Welcome to PathQuest
          </Text>
          <Text className="text-muted-foreground text-[15px] text-center leading-[22px] px-4">
            Track your mountain adventures, discover new peaks, and join climbing challenges.
          </Text>
        </View>

        {/* Login CTA */}
        <TouchableOpacity 
          className="flex-row items-center gap-2.5 px-6 py-3.5 rounded-lg mb-10"
          onPress={handleLogin}
          activeOpacity={0.8}
          style={{ backgroundColor: colors.primary }}
        >
          <LogIn size={18} color={colors.primaryForeground} />
          <Text style={{ color: colors.primaryForeground }} className="text-base font-semibold">
            Connect with Strava
          </Text>
        </TouchableOpacity>

        {/* Features */}
        <View className="w-full gap-4">
          <FeatureItem 
            Icon={Flag}
            title="Track Summits" 
            description="Automatically detect peaks from your activities"
          />
          <FeatureItem 
            Icon={Trophy}
            title="Join Challenges" 
            description="Complete peak lists like the 14ers or ADK 46"
          />
          <FeatureItem 
            Icon={MapPin}
            title="Explore" 
            description="Discover new peaks and plan your next adventure"
          />
        </View>
      </ScrollView>
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

interface FeatureItemProps {
  Icon: LucideIcon;
  title: string;
  description: string;
}

const FeatureItem: React.FC<FeatureItemProps> = ({ Icon, title, description }) => {
  const { colors, isDark } = useTheme();
  return (
    <View className="flex-row items-start gap-3">
      <View
        className="w-10 h-10 rounded-lg items-center justify-center"
        style={{ backgroundColor: `${colors.primary}${isDark ? '18' : '12'}` }}
      >
        <Icon size={16} color={colors.primary} />
      </View>
      <View className="flex-1">
        <Text style={{ color: colors.foreground }} className="text-[15px] font-semibold mb-0.5">
          {title}
        </Text>
        <Text style={{ color: colors.mutedForeground }} className="text-[13px] leading-[18px]">
          {description}
        </Text>
      </View>
    </View>
  );
};

export default DashboardContent;
