/**
 * ChallengeDetail
 * 
 * Shows detailed information about a challenge with a retro topographic
 * "expedition journal" aesthetic. Features:
 * - Hero header card with topo pattern and circular progress
 * - Milestone stamp badges with animated reveals
 * - Next peak suggestion with compass decoration
 * - Recent peaks timeline with summit badges
 * - Grouped peaks list with visual hierarchy
 */

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { ActivityIndicator, View, TouchableOpacity, Animated } from 'react-native';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { 
  Trophy, 
  Heart, 
  Flag, 
  TrendingUp, 
  List, 
  MapPin,
  Target,
  Award,
  Star,
  Check,
  Compass,
  Navigation,
  ChevronRight,
  ChevronLeft,
  X,
  Mountain,
  Plus,
  CheckCircle,
  Share2,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import Svg, { Circle, Path, Line } from 'react-native-svg';
import { CardFrame, PrimaryCTA, SecondaryCTA, Text } from '@/src/components/ui';
import { TabSwitcher } from '@/src/components/shared';
import PeakRow from './PeakRow';
import type { ChallengeProgress } from '@pathquest/shared';
import type { Peak } from '@pathquest/shared';
import { getElevationString } from '@pathquest/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocationPolling, useChallengeDetails, useNextPeakSuggestion, useUserChallengeProgress } from '@/src/hooks';
import { useAuthStore } from '@/src/lib/auth';
import { getApiClient } from '@/src/lib/api/client';
import { startStravaAuth } from '@/src/lib/auth/strava';
import { useLoginPromptStore } from '@/src/store';
import { haversineMeters, metersToMiles, bearingDegrees } from '@/src/utils/geo';
import { parseDate, formatDateString } from '@/src/utils/formatting';
import { useTheme } from '@/src/theme';
import { endpoints } from '@pathquest/shared/api';

type ChallengeDetailTab = 'progress' | 'peaks';
type PeaksSort = 'distance' | 'elevation' | 'az';
type PeaksFilter = 'all' | 'summited' | 'remaining';

// ═══════════════════════════════════════════════════════════════════════════
// DECORATIVE COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * CompassRose - Decorative compass element for cards
 */
const CompassRose: React.FC<{ size?: number; color?: string; opacity?: number }> = ({ 
  size = 80, 
  color = '#A9A196',
  opacity = 0.12,
}) => {
  const half = size / 2;
  const tickLength = size * 0.08;
  const innerRadius = size * 0.15;
  const outerRadius = size * 0.42;
  
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Outer circle */}
      <Circle
        cx={half}
        cy={half}
        r={outerRadius}
        stroke={color}
        strokeWidth={1.5}
        strokeOpacity={opacity}
        fill="none"
      />
      {/* Inner circle */}
      <Circle
        cx={half}
        cy={half}
        r={innerRadius}
        stroke={color}
        strokeWidth={1}
        strokeOpacity={opacity * 0.8}
        fill="none"
      />
      {/* Cardinal direction ticks */}
      {[0, 90, 180, 270].map((angle) => {
        const rad = (angle * Math.PI) / 180;
        const x1 = half + Math.sin(rad) * (outerRadius - tickLength);
        const y1 = half - Math.cos(rad) * (outerRadius - tickLength);
        const x2 = half + Math.sin(rad) * (outerRadius + 2);
        const y2 = half - Math.cos(rad) * (outerRadius + 2);
        return (
          <Line
            key={angle}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={color}
            strokeWidth={2}
            strokeOpacity={opacity * 1.2}
          />
        );
      })}
      {/* Ordinal direction ticks (smaller) */}
      {[45, 135, 225, 315].map((angle) => {
        const rad = (angle * Math.PI) / 180;
        const x1 = half + Math.sin(rad) * (outerRadius - tickLength * 0.5);
        const y1 = half - Math.cos(rad) * (outerRadius - tickLength * 0.5);
        const x2 = half + Math.sin(rad) * (outerRadius + 1);
        const y2 = half - Math.cos(rad) * (outerRadius + 1);
        return (
          <Line
            key={angle}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={color}
            strokeWidth={1}
            strokeOpacity={opacity * 0.8}
          />
        );
      })}
      {/* North arrow */}
      <Path
        d={`M ${half} ${half - innerRadius - 2} L ${half - 4} ${half - innerRadius + 8} L ${half} ${half - innerRadius + 5} L ${half + 4} ${half - innerRadius + 8} Z`}
        fill={color}
        fillOpacity={opacity * 1.5}
      />
    </Svg>
  );
};

/**
 * CircularProgress - Ring-style progress indicator
 */
const CircularProgress: React.FC<{
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  color: string;
  bgColor: string;
}> = ({ progress, size = 48, strokeWidth = 4, color, bgColor }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  const center = size / 2;
  
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {/* Background circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={bgColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>
    </View>
  );
};

/**
 * MilestoneBadge - Circular achievement indicator like vintage trail markers
 */
const MilestoneBadge: React.FC<{
  Icon: LucideIcon;
  label: string;
  value: string | number;
  color: string;
  unlocked?: boolean;
  delay?: number;
}> = ({ Icon, label, value, color, unlocked = true, delay = 0 }) => {
  const { colors } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay, fadeAnim, scaleAnim]);
  
  return (
    <Animated.View 
      style={{ 
        opacity: fadeAnim,
        transform: [{ scale: scaleAnim }],
      }}
      className="items-center"
    >
      <View 
        className="w-14 h-14 rounded-full items-center justify-center mb-1.5"
        style={{
          backgroundColor: unlocked ? `${color}15` : colors.muted,
          borderWidth: 2,
          borderColor: unlocked ? `${color}40` : colors.border,
        }}
      >
        <View 
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{
            backgroundColor: unlocked ? `${color}25` : 'transparent',
            borderWidth: 1,
            borderColor: unlocked ? `${color}30` : 'transparent',
          }}
        >
          <Icon 
            size={18} 
            color={unlocked ? color : colors.mutedForeground} 
            strokeWidth={2}
          />
        </View>
      </View>
      <Text 
        className="text-base font-semibold"
        style={{ color: unlocked ? colors.foreground : colors.mutedForeground }}
      >
        {value}
      </Text>
      <Text 
        className="text-[9px] uppercase tracking-wider text-center mt-0.5"
        style={{ color: colors.mutedForeground }}
      >
        {label}
      </Text>
    </Animated.View>
  );
};

/**
 * CompletionBadge - Celebratory badge for completed challenges
 */
const CompletionBadge: React.FC<{ size?: number }> = ({ size = 32 }) => {
  const { colors } = useTheme();
  
  return (
    <View 
      className="items-center justify-center"
      style={{ 
        width: size, 
        height: size, 
        borderRadius: size / 2,
        backgroundColor: `${colors.summited}20`,
        borderWidth: 2,
        borderColor: `${colors.summited}40`,
      }}
    >
      <Star size={size * 0.45} color={colors.summited} fill={colors.summited} />
    </View>
  );
};

/**
 * SummitCheckBadge - Checkmark badge for summited peaks
 */
const SummitCheckBadge: React.FC<{ size?: number }> = ({ size = 24 }) => {
  const { colors } = useTheme();
  
  return (
    <View 
      className="items-center justify-center"
      style={{ 
        width: size, 
        height: size, 
        borderRadius: size / 2,
        backgroundColor: `${colors.summited}20`,
      }}
    >
      <Check size={size * 0.6} color={colors.summited} strokeWidth={3} />
    </View>
  );
};

/**
 * Get cardinal direction from bearing
 */
const getCardinalDirection = (bearing: number): string => {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(bearing / 45) % 8;
  return directions[index];
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface ChallengeDetailProps {
  challengeId: string;
  challenge?: ChallengeProgress;
  onClose?: () => void;
  onDismiss?: () => void; // Go straight to discovery (X button)
  onPeakPress?: (peak: Peak) => void;
  onShare?: () => void;
}

const ChallengeDetail: React.FC<ChallengeDetailProps> = ({
  challengeId,
  challenge: challengeFallback,
  onClose,
  onDismiss,
  onPeakPress,
  onShare,
}) => {
  const [activeTab, setActiveTab] = useState<ChallengeDetailTab>('progress');
  const [peaksSort, setPeaksSort] = useState<PeaksSort>('elevation');
  const [peaksFilter, setPeaksFilter] = useState<PeaksFilter>('all');
  const { colors, isDark } = useTheme();
  const queryClient = useQueryClient();

  // Animation refs
  const heroFade = useRef(new Animated.Value(0)).current;
  const heroSlide = useRef(new Animated.Value(20)).current;
  const contentFade = useRef(new Animated.Value(0)).current;

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const showLoginPrompt = useLoginPromptStore((s) => s.showPrompt);
  const { location } = useLocationPolling(5000);
  const coords = location ? { lat: location.lat, lng: location.lng } : null;

  const challengeDetails = useChallengeDetails(challengeId, true);
  const userProgress = useUserChallengeProgress(user?.id ?? null, challengeId, isAuthenticated);
  const nextPeakSuggestion = useNextPeakSuggestion(challengeId, coords, isAuthenticated);

  const title = challengeDetails.data?.challenge?.name ?? challengeFallback?.name ?? "Unknown Challenge";
  const region = challengeDetails.data?.challenge?.region ?? challengeFallback?.region;
  const isFavorited =
    challengeDetails.data?.challenge?.is_favorited ??
    challengeFallback?.is_favorited ??
    false;

  // Run hero animation on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(heroFade, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(heroSlide, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Content fade after hero
    setTimeout(() => {
      Animated.timing(contentFade, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }, 200);
  }, [heroFade, heroSlide, contentFade]);

  const favoriteMutation = useMutation({
    mutationFn: async (next: boolean) => {
      const client = getApiClient();
      if (next) {
        await endpoints.addChallengeFavorite(client, challengeId);
      } else {
        await endpoints.deleteChallengeFavorite(client, challengeId);
      }
      return next; // Return the new value
    },
    onMutate: async (next) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ["challengeDetails", challengeId] });
      
      // Snapshot previous value
      const previousData = queryClient.getQueryData(["challengeDetails", challengeId]);
      
      // Optimistically update the cache immediately
      queryClient.setQueryData(["challengeDetails", challengeId], (old: any) => {
        if (!old?.challenge) return old;
        return {
          ...old,
          challenge: {
            ...old.challenge,
            is_favorited: next,
          },
        };
      });
      
      // Return context with snapshot for rollback
      return { previousData };
    },
    onError: (_err, _next, context) => {
      // Roll back to snapshot on error
      if (context?.previousData) {
        queryClient.setQueryData(["challengeDetails", challengeId], context.previousData);
      }
    },
    onSettled: () => {
      // Refetch to ensure server state after mutation settles
      queryClient.invalidateQueries({ queryKey: ["challengeDetails", challengeId] });
      queryClient.invalidateQueries({ queryKey: ["mapChallenges"] });
      queryClient.invalidateQueries({ queryKey: ["allChallenges"] });
      queryClient.invalidateQueries({ queryKey: ["favoriteChallenges"] }); // Dashboard challenges
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      queryClient.invalidateQueries({ queryKey: ["userProfile"] }); // Profile page
    },
  });

  const progress = userProgress.data?.progress ?? (challengeDetails.data?.progress ?? null);
  const totalPeaks = progress?.total ?? challengeFallback?.total ?? challengeFallback?.num_peaks ?? challengeDetails.data?.challenge?.num_peaks ?? 0;
  const completedPeaks = progress?.completed ?? challengeFallback?.completed ?? 0;
  const progressPercent = totalPeaks > 0 ? Math.round((completedPeaks / totalPeaks) * 100) : 0;
  const isCompleted = challengeFallback?.is_completed ?? progressPercent >= 100;
  const remaining = Math.max(0, totalPeaks - completedPeaks);

  // Hero color coding: green (un-accepted) → amber (accepted) → blue (completed)
  const heroAccentColor = isCompleted 
    ? colors.summited   // Blue for completed
    : isFavorited 
      ? colors.secondary // Rust/amber for accepted
      : colors.primary;  // Green for un-accepted

  const summitedById = useMemo(() => {
    const map = new globalThis.Map<string, { is_summited: boolean; summit_date: string | null; summits: number }>();
    for (const p of userProgress.data?.peaks ?? []) {
      map.set(p.id, { 
        is_summited: p.is_summited, 
        summit_date: p.summit_date ?? null,
        summits: p.summits ?? (p.is_summited ? 1 : 0),
      });
    }
    return map;
  }, [userProgress.data?.peaks]);

  const peaksForList = useMemo(() => {
    const peaks = challengeDetails.data?.peaks ?? [];
    const withStatus = peaks.map((p) => {
      const status = summitedById.get(p.id);
      return {
        ...p,
        is_summited: status?.is_summited ?? false,
        summit_date: status?.summit_date ?? null,
        summits: status?.summits ?? 0,
      };
    });

    // Apply filter
    const filtered = peaksFilter === 'all' 
      ? withStatus 
      : peaksFilter === 'summited'
        ? withStatus.filter(p => p.is_summited)
        : withStatus.filter(p => !p.is_summited);

    const sort = peaksSort === "distance" && coords ? "distance" : peaksSort === "distance" ? "elevation" : peaksSort;

    if (sort === "az") {
      return filtered.sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
    }
    if (sort === "elevation") {
      return filtered.sort((a, b) => (b.elevation ?? 0) - (a.elevation ?? 0));
    }
    return filtered.sort((a, b) => {
      if (!a.location_coords || !b.location_coords) return 0;
      const da = haversineMeters(coords!, { lat: a.location_coords[1], lng: a.location_coords[0] });
      const db = haversineMeters(coords!, { lat: b.location_coords[1], lng: b.location_coords[0] });
      return da - db;
    });
  }, [challengeDetails.data?.peaks, summitedById, peaksSort, peaksFilter, coords]);

  // Split peaks into summited and remaining for grouped display
  const { summitedPeaks, remainingPeaks } = useMemo(() => {
    const summited = peaksForList.filter(p => p.is_summited);
    const remaining = peaksForList.filter(p => !p.is_summited);
    return { summitedPeaks: summited, remainingPeaks: remaining };
  }, [peaksForList]);

  const recentSummitedPeaks = useMemo(() => {
    const peaks = userProgress.data?.peaks ?? [];
    return peaks
      .filter((p) => (p as any).is_summited && (p as any).summit_date)
      .sort((a, b) => {
        const da = parseDate((a as any).summit_date);
        const db = parseDate((b as any).summit_date);
        if (!da || !db) return 0;
        return db.getTime() - da.getTime();
      })
      .slice(0, 5);
  }, [userProgress.data?.peaks]);

  // Compute direction to next peak
  const nextPeakDirection = useMemo(() => {
    const peak = nextPeakSuggestion.data?.closestPeak;
    if (!peak || !coords) return null;
    const bearing = bearingDegrees(coords, { lat: peak.latitude, lng: peak.longitude });
    return getCardinalDirection(bearing);
  }, [nextPeakSuggestion.data?.closestPeak, coords]);

  // Fallback next peak from remaining peaks list (first one by distance or elevation)
  const fallbackNextPeak = useMemo(() => {
    if (nextPeakSuggestion.data?.closestPeak) return null; // API gave us one
    if (remainingPeaks.length === 0) return null;
    // Return the first remaining peak (already sorted by distance or elevation)
    const p = remainingPeaks[0];
    return {
      id: p.id,
      name: p.name ?? 'Unknown Peak',
      elevation: p.elevation,
      latitude: p.location_coords?.[1],
      longitude: p.location_coords?.[0],
      distance: coords && p.location_coords 
        ? metersToMiles(haversineMeters(coords, { lat: p.location_coords[1], lng: p.location_coords[0] }))
        : undefined,
    };
  }, [nextPeakSuggestion.data?.closestPeak, remainingPeaks, coords]);

  // The actual next peak to display (API response or fallback)
  const displayNextPeak = nextPeakSuggestion.data?.closestPeak ?? fallbackNextPeak;
  
  // Direction to display next peak
  const displayNextPeakDirection = useMemo(() => {
    if (!displayNextPeak || !coords || !displayNextPeak.latitude || !displayNextPeak.longitude) return null;
    const bearing = bearingDegrees(coords, { lat: displayNextPeak.latitude, lng: displayNextPeak.longitude });
    return getCardinalDirection(bearing);
  }, [displayNextPeak, coords]);

  const handleLogin = async () => {
    await startStravaAuth();
  };


  // Milestone thresholds - filter to only show meaningful ones
  const milestones = useMemo(() => {
    const thresholds = [10, 25, 50, totalPeaks].filter((n, idx, arr) => 
      n > 0 && n <= totalPeaks && arr.indexOf(n) === idx
    );
    return thresholds.map((n) => ({
      value: n,
      label: n === totalPeaks ? 'Complete' : `${n} peaks`,
      unlocked: completedPeaks >= n,
      icon: n === totalPeaks ? Star : Target,
    }));
  }, [totalPeaks, completedPeaks]);

  return (
    <View style={{ flex: 1 }}>
      {/* Navigation buttons row - above hero card */}
      {(onClose || onDismiss) ? (
        <View style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 8 }}>
          {/* Back button */}
          {onClose ? (
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.7}
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border as any,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ChevronLeft size={20} color={colors.mutedForeground as any} />
            </TouchableOpacity>
          ) : <View style={{ width: 38 }} />}
          
          {/* Dismiss button (X) - go straight to discovery */}
          {onDismiss ? (
            <TouchableOpacity
              onPress={onDismiss}
              activeOpacity={0.7}
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border as any,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={18} color={colors.mutedForeground as any} />
            </TouchableOpacity>
          ) : <View style={{ width: 38 }} />}
        </View>
      ) : null}

      {/* ═══════════════════════════════════════════════════════════════════
          HERO HEADER CARD
          ═══════════════════════════════════════════════════════════════════ */}
      <Animated.View
        style={{
          opacity: heroFade,
          transform: [{ translateY: heroSlide }],
        }}
      >
        <CardFrame 
          variant="hero" 
          topo="full" 
          ridge="bottom"
          seed={`challenge-hero:${challengeId}`}
          accentColor={heroAccentColor}
          className="mx-4 mt-4 relative overflow-hidden"
        >
          {/* Compass rose decoration */}
          <View className="absolute -right-2 -top-2" pointerEvents="none">
            <CompassRose 
              size={90} 
              color={colors.contourInk}
              opacity={isDark ? 0.15 : 0.1}
            />
          </View>

          <View className="p-5 pb-12">
            {/* Challenge badge */}
            <View className="flex-row items-center justify-center mb-3">
              <View className="flex-row items-center gap-1.5 bg-black/10 dark:bg-white/10 px-2.5 py-1 rounded-lg">
                <Trophy size={12} color={colors.mutedForeground} />
                <Text 
                  className="text-[10px] uppercase tracking-widest font-semibold"
                  style={{ color: colors.mutedForeground }}
                >
                  Challenge
                </Text>
              </View>
            </View>

            {/* Title + region */}
            <Text 
              className="text-2xl font-bold font-display"
              style={{ color: colors.foreground }}
              numberOfLines={2}
            >
              {title}
            </Text>
            
            {region && (
              <View className="flex-row items-center gap-1.5 mt-1.5">
                <MapPin size={13} color={colors.mutedForeground} />
                <Text 
                  className="text-sm"
                  style={{ color: colors.mutedForeground }}
                >
                  {region}
                </Text>
              </View>
            )}

            {/* Progress section */}
            <View className="flex-row items-center gap-4 mt-5">
              {/* Circular progress */}
              <View className="relative items-center justify-center">
                <CircularProgress
                  progress={progressPercent}
                  size={64}
                  strokeWidth={5}
                  color={heroAccentColor}
                  bgColor={colors.muted}
                />
                <View className="absolute items-center justify-center">
                  {isCompleted ? (
                    <Star size={20} color={colors.summited} fill={colors.summited} />
                  ) : (
                    <Text 
                      className="text-sm font-bold"
                      style={{ color: colors.foreground }}
                    >
                      {progressPercent}%
                    </Text>
                  )}
                </View>
              </View>

              {/* Stats */}
              <View className="flex-1">
                <Text 
                  className="text-lg font-semibold"
                  style={{ color: colors.foreground }}
                >
                  {isCompleted ? "Challenge Complete!" : `${completedPeaks} of ${totalPeaks} peaks`}
                </Text>
                
                {!isCompleted && remaining > 0 && (
                  <View className="flex-row items-center gap-1.5 mt-1">
                    <Flag size={12} color={colors.mutedForeground} />
                    <Text 
                      className="text-sm"
                      style={{ color: colors.mutedForeground }}
                    >
                      {remaining} remaining
                    </Text>
                  </View>
                )}
                
                {progress?.lastProgressDate && (() => {
                  const formatted = formatDateString(progress.lastProgressDate);
                  if (!formatted) return null;
                  return (
                    <View className="flex-row items-center gap-1.5 mt-1">
                      <TrendingUp size={12} color={colors.mutedForeground} />
                      <Text 
                        className="text-xs"
                        style={{ color: colors.mutedForeground }}
                      >
                        Last: {formatted}
                      </Text>
                    </View>
                  );
                })()}
              </View>
            </View>

            {/* Primary CTA - Accept Challenge or Share */}
            <View className="mt-5">
              {isCompleted ? (
                // Completed challenges show Share button
                onShare ? (
                  <SecondaryCTA label="Share" onPress={onShare} Icon={Share2} />
                ) : null
              ) : isAuthenticated ? (
                isFavorited ? (
                  <View style={{ gap: 10 }}>
                    {/* Already accepted - tappable badge to un-accept */}
                    <TouchableOpacity 
                      className="flex-row items-center justify-center gap-2 py-2.5 rounded-lg"
                      style={{ backgroundColor: `${heroAccentColor}15` }}
                      onPress={() => {
                        if (favoriteMutation.isPending) return;
                        favoriteMutation.mutate(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <CheckCircle size={16} color={heroAccentColor} />
                      <Text 
                        className="text-sm font-semibold"
                        style={{ color: heroAccentColor }}
                      >
                        Challenge Accepted
                      </Text>
                    </TouchableOpacity>
                    {onShare && (
                      <SecondaryCTA label="Share" onPress={onShare} Icon={Share2} />
                    )}
                  </View>
                ) : (
                  <PrimaryCTA 
                    label="Accept Challenge" 
                    onPress={() => {
                      if (!isAuthenticated) {
                        showLoginPrompt('favorite_challenge');
                        return;
                      }
                      if (favoriteMutation.isPending) return;
                      favoriteMutation.mutate(true);
                    }}
                    Icon={Plus}
                  />
                )
              ) : (
                onShare ? (
                  <SecondaryCTA label="Share" onPress={onShare} Icon={Share2} />
                ) : null
              )}
            </View>
          </View>
        </CardFrame>
      </Animated.View>

      {/* Sub-tabs */}
      <Animated.View 
        style={{ 
          opacity: contentFade,
          marginHorizontal: 16, 
          marginTop: 16, 
          marginBottom: 12 
        }}
      >
        <TabSwitcher
          tabs={[
            { id: 'progress', label: 'Progress' },
            { id: 'peaks', label: 'Peaks', badge: totalPeaks },
          ]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </Animated.View>

      {/* Tab Content */}
      <BottomSheetScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: contentFade }}>
          {activeTab === "progress" && (
            <View style={{ gap: 16 }}>
              {/* Not authenticated - Login CTA */}
              {!isAuthenticated && (
                <CardFrame topo="corner" seed={`challenge-login:${challengeId}`}>
                  <View className="p-4">
                    <View className="flex-row items-center gap-2 mb-2">
                      <View 
                        className="w-8 h-8 rounded-full items-center justify-center"
                        style={{ backgroundColor: `${colors.primary}15` }}
                      >
                        <Mountain size={16} color={colors.primary} />
                      </View>
                      <Text 
                        className="text-base font-semibold"
                        style={{ color: colors.foreground }}
                      >
                        Track Your Progress
                      </Text>
                    </View>
                    <Text 
                      className="text-sm mt-1"
                      style={{ color: colors.mutedForeground }}
                    >
                      Sign in to see which peaks you've completed, get personalized suggestions, and earn milestone badges.
                    </Text>
                    <View className="mt-4">
                      <PrimaryCTA label="Connect with Strava" onPress={handleLogin} />
                    </View>
                  </View>
                </CardFrame>
              )}

              {/* Authenticated content */}
              {isAuthenticated && (
                <>
                  {userProgress.isLoading ? (
                    <View className="items-center justify-center py-8">
                      <ActivityIndicator />
                      <Text 
                        className="text-sm mt-3"
                        style={{ color: colors.mutedForeground }}
                      >
                        Loading your progress…
                      </Text>
                    </View>
                  ) : userProgress.data ? (
                    <>
                      {/* ═══════════════════════════════════════════════════════════════
                          MILESTONE BADGES
                          ═══════════════════════════════════════════════════════════════ */}
                      {milestones.length > 0 && (
                        <View>
                          <View className="flex-row items-center gap-2 mb-4">
                            <Award size={14} color={colors.mutedForeground} />
                            <Text 
                              className="text-xs uppercase tracking-widest"
                              style={{ color: colors.mutedForeground }}
                            >
                              Milestones
                            </Text>
                          </View>
                          <View className="flex-row justify-around">
                            {milestones.map((m, idx) => (
                              <MilestoneBadge
                                key={m.value}
                                Icon={m.icon}
                                label={m.label}
                                value={m.unlocked ? '✓' : `${m.value - completedPeaks}`}
                                color={m.value === totalPeaks ? colors.summited : colors.secondary}
                                unlocked={m.unlocked}
                                delay={400 + idx * 100}
                              />
                            ))}
                          </View>
                        </View>
                      )}

                      {/* ═══════════════════════════════════════════════════════════════
                          NEXT PEAK SUGGESTION
                          ═══════════════════════════════════════════════════════════════ */}
                      {!isCompleted && (
                        <CardFrame 
                          topo="corner" 
                          seed={`challenge-next:${challengeId}`}
                          accentColor={colors.primary}
                        >
                          <View className="p-4 relative overflow-hidden">
                            {/* Compass decoration */}
                            <View className="absolute -right-3 -bottom-3" pointerEvents="none">
                              <CompassRose 
                                size={70} 
                                color={colors.contourInk}
                                opacity={isDark ? 0.12 : 0.08}
                              />
                            </View>

                            <View className="flex-row items-center gap-2 mb-3">
                              <View 
                                className="w-7 h-7 rounded-lg items-center justify-center"
                                style={{ backgroundColor: `${colors.primary}15` }}
                              >
                                <Navigation size={14} color={colors.primary} />
                              </View>
                              <Text 
                                className="text-sm font-semibold uppercase tracking-wide"
                                style={{ color: colors.foreground }}
                              >
                                Next Objective
                              </Text>
                            </View>

                            {nextPeakSuggestion.isLoading && !fallbackNextPeak ? (
                              <Text 
                                className="text-sm"
                                style={{ color: colors.mutedForeground }}
                              >
                                Finding your next peak…
                              </Text>
                            ) : displayNextPeak ? (
                              <View>
                                <Text 
                                  className="text-lg font-semibold"
                                  style={{ color: colors.foreground }}
                                >
                                  {displayNextPeak.name}
                                </Text>
                                
                                <View className="flex-row items-center flex-wrap gap-3 mt-2">
                                  {displayNextPeak.distance !== undefined && (
                                    <View className="flex-row items-center gap-1">
                                      <MapPin size={12} color={colors.primary} />
                                      <Text 
                                        className="text-sm font-medium"
                                        style={{ color: colors.primary }}
                                      >
                                        {Math.round(displayNextPeak.distance * 10) / 10} mi
                                      </Text>
                                    </View>
                                  )}
                                  
                                  {displayNextPeakDirection && (
                                    <View className="flex-row items-center gap-1">
                                      <Compass size={12} color={colors.mutedForeground} />
                                      <Text 
                                        className="text-sm"
                                        style={{ color: colors.mutedForeground }}
                                      >
                                        {displayNextPeakDirection}
                                      </Text>
                                    </View>
                                  )}
                                  
                                  {displayNextPeak.elevation && (
                                    <Text 
                                      className="text-sm"
                                      style={{ color: colors.mutedForeground }}
                                    >
                                      {getElevationString(displayNextPeak.elevation, 'imperial')}
                                    </Text>
                                  )}
                                </View>

                                <View className="mt-4">
                                  <SecondaryCTA
                                    label="View Peak Details"
                                    Icon={ChevronRight}
                                    onPress={() => {
                                      if (!displayNextPeak) return;
                                      onPeakPress?.({
                                        id: displayNextPeak.id,
                                        name: displayNextPeak.name,
                                        elevation: displayNextPeak.elevation,
                                        location_coords: displayNextPeak.longitude && displayNextPeak.latitude 
                                          ? [displayNextPeak.longitude, displayNextPeak.latitude]
                                          : undefined,
                                      } as Peak);
                                    }}
                                  />
                                </View>
                              </View>
                            ) : remainingPeaks.length === 0 ? (
                              <View className="flex-row items-center gap-2">
                                <Star size={16} color={colors.summited} fill={colors.summited} />
                                <Text 
                                  className="text-sm font-medium"
                                  style={{ color: colors.summited }}
                                >
                                  All peaks summited!
                                </Text>
                              </View>
                            ) : (
                              <Text 
                                className="text-sm"
                                style={{ color: colors.mutedForeground }}
                              >
                                {!coords ? "Enable location to see distance." : "Loading peaks…"}
                              </Text>
                            )}
                          </View>
                        </CardFrame>
                      )}

                      {/* ═══════════════════════════════════════════════════════════════
                          COMPLETION CELEBRATION
                          ═══════════════════════════════════════════════════════════════ */}
                      {isCompleted && (
                        <CardFrame 
                          variant="cta"
                          topo="corner" 
                          seed={`challenge-complete:${challengeId}`}
                          accentColor={colors.summited}
                        >
                          <View className="p-5 items-center">
                            <CompletionBadge size={56} />
                            <Text 
                              className="text-xl font-bold mt-3 text-center"
                              style={{ color: colors.foreground }}
                            >
                              Congratulations!
                            </Text>
                            <Text 
                              className="text-sm mt-2 text-center"
                              style={{ color: colors.mutedForeground }}
                            >
                              You've completed all {totalPeaks} peaks in this challenge. What an achievement!
                            </Text>
                          </View>
                        </CardFrame>
                      )}

                      {/* ═══════════════════════════════════════════════════════════════
                          RECENT SUMMITS TIMELINE
                          ═══════════════════════════════════════════════════════════════ */}
                      {recentSummitedPeaks.length > 0 && (
                        <CardFrame topo="corner" seed={`challenge-recent:${challengeId}`}>
                          <View className="p-4">
                            <View className="flex-row items-center gap-2 mb-3">
                              <View 
                                className="w-6 h-6 rounded items-center justify-center"
                                style={{ backgroundColor: `${colors.summited}15` }}
                              >
                                <TrendingUp size={14} color={colors.summited} />
                              </View>
                              <Text 
                                className="text-sm font-semibold"
                                style={{ color: colors.foreground }}
                              >
                                Recent Summits
                              </Text>
                            </View>

                            {/* Timeline */}
                            <View className="ml-3">
                              {recentSummitedPeaks.map((p, idx) => (
                                <TouchableOpacity
                                  key={p.id}
                                  activeOpacity={0.75}
                                  onPress={() => onPeakPress?.(p as unknown as Peak)}
                                >
                                  <View className="flex-row items-start">
                                    {/* Timeline line + dot */}
                                    <View className="items-center mr-3">
                                      <View 
                                        className="w-2.5 h-2.5 rounded-full"
                                        style={{ backgroundColor: colors.summited }}
                                      />
                                      {idx < recentSummitedPeaks.length - 1 && (
                                        <View 
                                          className="w-0.5 flex-1 min-h-[32px]"
                                          style={{ backgroundColor: `${colors.summited}30` }}
                                        />
                                      )}
                                    </View>

                                    {/* Content */}
                                    <View className="flex-1 pb-3">
                                      <Text 
                                        className="text-sm font-semibold"
                                        style={{ color: colors.foreground }}
                                        numberOfLines={1}
                                      >
                                        {p.name ?? "Unknown Peak"}
                                      </Text>
                                      {(() => {
                                        const formatted = formatDateString((p as any).summit_date);
                                        if (!formatted) return null;
                                        return (
                                          <Text 
                                            className="text-xs mt-0.5"
                                            style={{ color: colors.mutedForeground }}
                                          >
                                            {formatted}
                                          </Text>
                                        );
                                      })()}
                                    </View>

                                    <ChevronRight size={16} color={colors.mutedForeground} />
                                  </View>
                                </TouchableOpacity>
                              ))}
                            </View>
                          </View>
                        </CardFrame>
                      )}
                    </>
                  ) : (
                    <CardFrame topo="corner" seed={`challenge-progress-error:${challengeId}`}>
                      <View className="p-4">
                        <Text 
                          className="text-base font-semibold"
                          style={{ color: colors.foreground }}
                        >
                          Couldn't load your progress
                        </Text>
                        <Text 
                          className="text-sm mt-2"
                          style={{ color: colors.mutedForeground }}
                        >
                          Try again in a moment.
                        </Text>
                      </View>
                    </CardFrame>
                  )}
                </>
              )}
            </View>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              PEAKS TAB
              ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === "peaks" && (
            <View style={{ gap: 12 }}>
              {/* Sort controls */}
              <View>
                <TabSwitcher
                  tabs={[
                    { id: "elevation", label: "Elevation" },
                    { id: "distance", label: "Distance" },
                    { id: "az", label: "A–Z" },
                  ]}
                  activeTab={peaksSort}
                  onTabChange={(t) => setPeaksSort(t as PeaksSort)}
                />
                {peaksSort === "distance" && !coords && (
                  <Text 
                    className="text-xs mt-2"
                    style={{ color: colors.mutedForeground }}
                  >
                    Enable location to sort by distance.
                  </Text>
                )}
              </View>

              {/* Filter controls */}
              {isAuthenticated && (
                <View className="flex-row gap-2">
                  {(['all', 'summited', 'remaining'] as PeaksFilter[]).map((filter) => {
                    const isActive = peaksFilter === filter;
                    const label = filter === 'all' ? 'All' : filter === 'summited' ? 'Summited' : 'Remaining';
                    const count = filter === 'all' 
                      ? (challengeDetails.data?.peaks?.length ?? 0)
                      : filter === 'summited' 
                        ? summitedPeaks.length 
                        : remainingPeaks.length;
                    
                    return (
                      <TouchableOpacity
                        key={filter}
                        onPress={() => setPeaksFilter(filter)}
                        activeOpacity={0.7}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 16,
                          backgroundColor: isActive 
                            ? (filter === 'summited' ? `${colors.summited}20` : `${colors.primary}20`)
                            : colors.muted,
                          borderWidth: 1,
                          borderColor: isActive
                            ? (filter === 'summited' ? `${colors.summited}40` : `${colors.primary}40`)
                            : colors.border,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: isActive ? '600' : '500',
                            color: isActive 
                              ? (filter === 'summited' ? colors.summited : colors.primary)
                              : colors.mutedForeground,
                          }}
                        >
                          {label} ({count})
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {challengeDetails.isLoading ? (
                <View className="items-center justify-center py-8">
                  <ActivityIndicator />
                  <Text 
                    className="text-sm mt-3"
                    style={{ color: colors.mutedForeground }}
                  >
                    Loading peaks…
                  </Text>
                </View>
              ) : challengeDetails.data ? (
                <>
                  {peaksForList.length === 0 ? (
                    <View className="items-center justify-center p-8">
                      <List size={24} color={colors.mutedForeground} />
                      <Text 
                        className="text-sm mt-3 text-center"
                        style={{ color: colors.mutedForeground }}
                      >
                        No peaks found for this challenge.
                      </Text>
                    </View>
                  ) : (
                    <View style={{ marginHorizontal: -16 }}>
                      {/* All peaks in one list - using PeakRow style */}
                      {peaksForList.map((p) => (
                        <PeakRow
                          key={p.id}
                          peak={{
                            ...p,
                            // Pass through the actual summit count from user progress
                            summits: p.summits,
                          } as Peak}
                          onPress={() => onPeakPress?.(p as Peak)}
                          isSummited={p.is_summited}
                        />
                      ))}
                    </View>
                  )}
                </>
              ) : (
                <CardFrame topo="corner" seed={`challenge-peaks-error:${challengeId}`}>
                  <View className="p-4">
                    <Text 
                      className="text-base font-semibold"
                      style={{ color: colors.foreground }}
                    >
                      Couldn't load peaks
                    </Text>
                    <Text 
                      className="text-sm mt-2"
                      style={{ color: colors.mutedForeground }}
                    >
                      Try again in a moment.
                    </Text>
                  </View>
                </CardFrame>
              )}
            </View>
          )}
        </Animated.View>
      </BottomSheetScrollView>
    </View>
  );
};

export default ChallengeDetail;
