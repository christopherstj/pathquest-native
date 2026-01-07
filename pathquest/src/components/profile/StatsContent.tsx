/**
 * StatsContent
 * 
 * Profile Stats sub-tab - "The Summit Registry"
 * 
 * Designed as a vintage expedition journal / mountaineering club certificate.
 * Features:
 * - Hero summit count card with topo pattern
 * - Crown jewel highest peak card
 * - Achievement milestone badges
 * - Elevation breakdown as terrain bands
 * - Geographic diversity visualization
 */

import React, { useEffect, useRef } from 'react';
import { View, Animated, Dimensions, ScrollView } from 'react-native';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { 
  Flag, 
  Repeat, 
  ArrowUp, 
  Trophy, 
  Map, 
  Globe, 
  Mountain,
  Compass,
  Award,
  Star,
  TrendingUp,
  Heart,
  ArrowUpDown,
  Flame,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { getElevationString } from '@pathquest/shared';
import { Text, CardFrame } from '@/src/components/ui';
import { useTheme } from '@/src/theme';
import Svg, { Circle, Path, Line, G } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ProfileStats {
  totalPeaks?: number;
  totalSummits?: number;
  highestPeak?: {
    name: string;
    elevation: number;
  };
  lowestPeak?: {
    name: string;
    elevation: number;
  };
  mostVisitedPeak?: {
    name: string;
    visitCount: number;
  };
  challengesCompleted?: number;
  totalElevation?: number;
  statesClimbed?: number;
  countriesClimbed?: number;
  climbingStreak?: {
    currentStreak: number;
    isActive: boolean;
    lastSummitMonth: string | null;
  };
  peakBreakdown?: {
    fourteeners?: number;
    thirteeners?: number;
    twelvers?: number;
    other?: number;
  };
}

interface StatsContentProps {
  stats?: ProfileStats;
  isLoading?: boolean;
  /** When true, use BottomSheetScrollView; otherwise use regular ScrollView */
  inBottomSheet?: boolean;
}

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
  const { colors, isDark } = useTheme();
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
        className="w-16 h-16 rounded-full items-center justify-center mb-2"
        style={{
          backgroundColor: unlocked ? `${color}15` : colors.muted,
          borderWidth: 2,
          borderColor: unlocked ? `${color}40` : colors.border,
        }}
      >
        <View 
          className="w-12 h-12 rounded-full items-center justify-center"
          style={{
            backgroundColor: unlocked ? `${color}25` : 'transparent',
            borderWidth: 1,
            borderColor: unlocked ? `${color}30` : 'transparent',
          }}
        >
          <Icon 
            size={20} 
            color={unlocked ? color : colors.mutedForeground} 
            strokeWidth={2}
          />
        </View>
      </View>
      <Text 
        className="text-lg font-semibold"
        style={{ color: unlocked ? colors.foreground : colors.mutedForeground }}
      >
        {value}
      </Text>
      <Text 
        className="text-[10px] uppercase tracking-wider text-center mt-0.5"
        style={{ color: colors.mutedForeground }}
      >
        {label}
      </Text>
    </Animated.View>
  );
};

/**
 * JourneyStat - A single stat in the journey card
 */
const JourneyStat: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  subvalue?: string;
  color: string;
  delay?: number;
}> = ({ icon, label, value, subvalue, color, delay = 0 }) => {
  const { colors } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(10)).current;
  
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay, fadeAnim, slideAnim]);
  
  return (
    <Animated.View 
      style={{ 
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
      className="flex-row items-center gap-3 py-3"
    >
      <View 
        className="w-10 h-10 rounded-lg items-center justify-center"
        style={{ backgroundColor: `${color}15` }}
      >
        {icon}
      </View>
      <View className="flex-1">
        <Text 
          className="text-[11px] uppercase tracking-wider"
          style={{ color: colors.mutedForeground }}
        >
          {label}
        </Text>
        <View className="flex-row items-baseline gap-1.5 mt-0.5">
          <Text 
            className="text-lg font-semibold"
            style={{ color: colors.foreground }}
          >
            {value}
          </Text>
          {subvalue && (
            <Text 
              className="text-xs"
              style={{ color: colors.mutedForeground }}
            >
              {subvalue}
            </Text>
          )}
        </View>
      </View>
    </Animated.View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const StatsContent: React.FC<StatsContentProps> = ({ stats, isLoading = false, inBottomSheet = false }) => {
  const ScrollContainer = inBottomSheet ? BottomSheetScrollView : ScrollView;
  const { colors, isDark } = useTheme();
  
  // Staggered animation refs
  const heroFade = useRef(new Animated.Value(0)).current;
  const heroSlide = useRef(new Animated.Value(20)).current;
  const crownFade = useRef(new Animated.Value(0)).current;
  const crownSlide = useRef(new Animated.Value(20)).current;
  
  useEffect(() => {
    if (stats) {
      // Hero card animation
      Animated.parallel([
        Animated.timing(heroFade, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(heroSlide, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Crown jewel card animation (delayed)
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(crownFade, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(crownSlide, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]).start();
      }, 200);
    }
  }, [stats, heroFade, heroSlide, crownFade, crownSlide]);

  if (isLoading) {
    return (
      <View className="p-4 gap-4">
        <View className="h-[180px] rounded-xl bg-muted animate-pulse" />
        <View className="h-[140px] rounded-xl bg-muted animate-pulse" />
        <View className="flex-row gap-3">
          <View className="flex-1 h-[100px] rounded-xl bg-muted animate-pulse" />
          <View className="flex-1 h-[100px] rounded-xl bg-muted animate-pulse" />
        </View>
      </View>
    );
  }

  if (!stats) {
    return (
      <View className="flex-1 items-center justify-center p-8">
        <View className="w-20 h-20 rounded-full bg-muted/50 items-center justify-center mb-4">
          <Mountain size={36} color={colors.mutedForeground} />
        </View>
        <Text className="text-foreground text-xl font-semibold text-center">
          Your Summit Registry
        </Text>
        <Text className="text-muted-foreground text-sm mt-3 text-center leading-6 max-w-[280px]">
          Connect with Strava to automatically track your peak conquests and build your expedition log.
        </Text>
      </View>
    );
  }


  return (
    <ScrollContainer
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16, paddingBottom: 24, gap: 16 }}
      showsVerticalScrollIndicator={false}
    >
      {/* ═══════════════════════════════════════════════════════════════════
          HERO CARD: Summit Registry
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
          seed="summit-registry"
          className="relative overflow-hidden"
        >
          {/* Compass rose decoration */}
          <View className="absolute -right-4 -top-4">
            <CompassRose 
              size={100} 
              color={colors.contourInk}
              opacity={isDark ? 0.15 : 0.12}
            />
          </View>
          
          <View className="p-6 pb-12">
            {/* Registry header */}
            <View className="flex-row items-center gap-2 mb-1">
              <View 
                className="w-5 h-5 rounded items-center justify-center"
                style={{ backgroundColor: `${colors.primary}20` }}
              >
                <Flag size={12} color={colors.primary} />
              </View>
              <Text 
                className="text-[10px] uppercase tracking-[2px]"
                style={{ color: colors.mutedForeground }}
              >
                Summit Registry
              </Text>
            </View>
            
            {/* Main stat */}
            <View className="flex-row items-baseline gap-2 mt-2">
              <Text 
                className="text-6xl font-bold"
                style={{ 
                  color: colors.foreground,
                  letterSpacing: -2,
                }}
              >
                {stats.totalPeaks ?? 0}
              </Text>
              <Text 
                className="text-lg"
                style={{ color: colors.mutedForeground }}
              >
                peaks
              </Text>
            </View>
            
            {/* Secondary stat */}
            <View className="flex-row items-center gap-1.5 mt-2">
              <Repeat size={14} color={colors.secondary} />
              <Text className="text-base font-semibold" style={{ color: colors.secondary }}>
                {stats.totalSummits ?? 0}
              </Text>
              <Text className="text-sm" style={{ color: colors.mutedForeground }}>
                total summits
              </Text>
            </View>
            
            {/* Elevation gained */}
            {stats.totalElevation && stats.totalElevation > 0 && (
              <View className="flex-row items-center gap-1.5 mt-1">
                <ArrowUp size={14} color={colors.primary} />
                <Text className="text-base font-semibold" style={{ color: colors.foreground }}>
                  {Math.round(stats.totalElevation / 1000).toLocaleString()}k
                </Text>
                <Text className="text-sm" style={{ color: colors.mutedForeground }}>
                  ft gained
                </Text>
              </View>
            )}
          </View>
        </CardFrame>
      </Animated.View>

      {/* ═══════════════════════════════════════════════════════════════════
          CROWN JEWEL: Highest Peak
          ═══════════════════════════════════════════════════════════════════ */}
      {stats.highestPeak && (
        <Animated.View
          style={{
            opacity: crownFade,
            transform: [{ translateY: crownSlide }],
          }}
        >
          <CardFrame 
            variant="cta" 
            topo="corner" 
            seed="crown-jewel"
            accentColor={colors.summited}
          >
            <View className="p-5">
              {/* Crown jewel header */}
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center gap-2">
                  <View 
                    className="w-8 h-8 rounded-full items-center justify-center"
                    style={{ backgroundColor: `${colors.summited}20` }}
                  >
                    <Award size={16} color={colors.summited} />
                  </View>
                  <Text 
                    className="text-xs uppercase tracking-widest"
                    style={{ color: colors.mutedForeground }}
                  >
                    Crown Jewel
                  </Text>
                </View>
                <View 
                  className="px-2 py-1 rounded"
                  style={{ backgroundColor: `${colors.summited}15` }}
                >
                  <Text 
                    className="text-[10px] uppercase tracking-wide"
                    style={{ color: colors.summited }}
                  >
                    Highest
                  </Text>
                </View>
              </View>
              
              {/* Peak info */}
              <Text 
                className="text-2xl font-semibold"
                style={{ color: colors.foreground }}
                numberOfLines={1}
              >
                {stats.highestPeak.name}
              </Text>
              
              <View className="flex-row items-baseline gap-1 mt-1">
                <Text 
                  className="text-3xl font-bold"
                  style={{ color: colors.summited }}
                >
                  {getElevationString(stats.highestPeak.elevation, 'imperial').replace(' ft', '')}
                </Text>
                <Text 
                  className="text-sm"
                  style={{ color: colors.mutedForeground }}
                >
                  ft
                </Text>
              </View>
            </View>
          </CardFrame>
        </Animated.View>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          MILESTONE BADGES
          ═══════════════════════════════════════════════════════════════════ */}
      <View className="flex-row justify-around py-2">
        <MilestoneBadge
          Icon={Trophy}
          label="Challenges"
          value={stats.challengesCompleted ?? 0}
          color={colors.secondary}
          unlocked={(stats.challengesCompleted ?? 0) > 0}
          delay={400}
        />
        <MilestoneBadge
          Icon={Map}
          label="States"
          value={stats.statesClimbed ?? 0}
          color={colors.primary}
          unlocked={(stats.statesClimbed ?? 0) > 0}
          delay={500}
        />
        <MilestoneBadge
          Icon={Globe}
          label="Countries"
          value={stats.countriesClimbed ?? 0}
          color={colors.summited}
          unlocked={(stats.countriesClimbed ?? 0) > 0}
          delay={600}
        />
      </View>

      {/* ═══════════════════════════════════════════════════════════════════
          YOUR JOURNEY: Universal stats that work for any hiker
          ═══════════════════════════════════════════════════════════════════ */}
      {(stats.climbingStreak?.currentStreak || stats.lowestPeak || stats.mostVisitedPeak || (stats.totalSummits && stats.totalPeaks && stats.totalSummits > stats.totalPeaks)) && (
        <CardFrame 
          variant="default" 
          topo="corner" 
          seed="your-journey"
        >
          <View className="p-4">
            <View className="flex-row items-center gap-2 mb-2">
              <View 
                className="w-6 h-6 rounded items-center justify-center"
                style={{ backgroundColor: `${colors.primary}15` }}
              >
                <TrendingUp size={14} color={colors.primary} />
              </View>
              <Text 
                className="text-sm font-semibold uppercase tracking-wide"
                style={{ color: colors.foreground }}
              >
                Your Journey
              </Text>
            </View>
            
            {/* Elevation Range - shows lowest to highest */}
            {stats.highestPeak && stats.lowestPeak && stats.highestPeak.elevation !== stats.lowestPeak.elevation && (
              <JourneyStat
                icon={<ArrowUpDown size={18} color={colors.secondary} />}
                label="Elevation Range"
                value={`${getElevationString(stats.lowestPeak.elevation, 'imperial').replace(' ft', '')} → ${getElevationString(stats.highestPeak.elevation, 'imperial').replace(' ft', '')}`}
                subvalue="ft"
                color={colors.secondary}
                delay={700}
              />
            )}
            
            {/* Climbing Streak - consecutive months with summits */}
            {stats.climbingStreak && stats.climbingStreak.currentStreak > 0 && (
              <JourneyStat
                icon={<Flame size={18} color="#E07B39" />}
                label="Climbing Streak"
                value={`${stats.climbingStreak.currentStreak}`}
                subvalue={stats.climbingStreak.currentStreak === 1 
                  ? 'month'
                  : 'months in a row'
                }
                color="#E07B39"
                delay={800}
              />
            )}
            
            {/* Most Visited Peak - shows dedication (now in BLUE) */}
            {stats.mostVisitedPeak && stats.mostVisitedPeak.visitCount > 1 && (
              <JourneyStat
                icon={<Heart size={18} color={colors.summited} />}
                label="Favorite Peak"
                value={stats.mostVisitedPeak.name}
                subvalue={`${stats.mostVisitedPeak.visitCount}× summited`}
                color={colors.summited}
                delay={900}
              />
            )}
            
            {/* Repeat Summits - if they have more summits than peaks but no clear favorite */}
            {!stats.mostVisitedPeak && stats.totalSummits && stats.totalPeaks && stats.totalSummits > stats.totalPeaks && (
              <JourneyStat
                icon={<Repeat size={18} color={colors.summited} />}
                label="Repeat Summits"
                value={(stats.totalSummits - stats.totalPeaks).toString()}
                subvalue="return visits"
                color={colors.summited}
                delay={900}
              />
            )}
          </View>
        </CardFrame>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          EXPEDITIONER'S NOTE (empty state encouragement)
          ═══════════════════════════════════════════════════════════════════ */}
      {(stats.totalPeaks ?? 0) < 5 && (
        <View 
          className="p-4 rounded-xl mx-2 mt-2"
          style={{ 
            backgroundColor: isDark ? 'rgba(91, 145, 103, 0.08)' : 'rgba(77, 122, 87, 0.06)',
            borderWidth: 1,
            borderColor: isDark ? 'rgba(91, 145, 103, 0.2)' : 'rgba(77, 122, 87, 0.15)',
            borderStyle: 'dashed',
          }}
        >
          <View className="flex-row items-start gap-3">
            <View 
              className="w-8 h-8 rounded-full items-center justify-center mt-0.5"
              style={{ backgroundColor: `${colors.primary}15` }}
            >
              <Compass size={16} color={colors.primary} />
            </View>
            <View className="flex-1">
              <Text 
                className="text-sm font-semibold"
                style={{ color: colors.foreground }}
              >
                Your adventure awaits
              </Text>
              <Text 
                className="text-xs mt-1 leading-5"
                style={{ color: colors.mutedForeground }}
              >
                Every summit tells a story. Keep exploring and watch your registry grow.
              </Text>
            </View>
          </View>
        </View>
      )}
    </ScrollContainer>
  );
};

export default StatsContent;
