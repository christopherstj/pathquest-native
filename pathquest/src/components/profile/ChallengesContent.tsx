/**
 * ChallengesContent
 * 
 * Profile Challenges sub-tab - "The Trophy Case"
 * 
 * Displays accepted challenges as expedition achievements.
 * Features:
 * - Trophy case header with completion stats
 * - In-progress challenges with animated progress
 * - Completed challenges with celebration styling
 * - Rich visual hierarchy
 */

import React, { useEffect, useRef, useMemo } from 'react';
import { View, TouchableOpacity, Animated, ScrollView } from 'react-native';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { 
  Trophy, 
  Check, 
  Target,
  Zap,
  Award,
  Star,
  MapPin,
  TrendingUp,
  ChevronRight,
} from 'lucide-react-native';
import { Text, CardFrame } from '@/src/components/ui';
import { useTheme } from '@/src/theme';
import type { ChallengeProgress } from '@pathquest/shared';
import Svg, { Circle, Path, G } from 'react-native-svg';

interface ChallengesContentProps {
  challenges?: ChallengeProgress[];
  onChallengePress?: (challenge: ChallengeProgress) => void;
  isLoading?: boolean;
  /** When true, use BottomSheetScrollView; otherwise use regular ScrollView */
  inBottomSheet?: boolean;
}

// Muted earth tone accent colors (same as home dashboard)
const accentColors = [
  '#8B7355', // Trail brown
  '#9B7D52', // Amber rust
  '#7A6B5A', // Warm gray-brown
  '#A08060', // Tan
  '#8A7A65', // Dusty brown
];

// ═══════════════════════════════════════════════════════════════════════════
// DECORATIVE COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════════════
// CHALLENGE CARD
// ═══════════════════════════════════════════════════════════════════════════

interface ChallengeCardProps {
  challenge: ChallengeProgress;
  onPress?: () => void;
  isCompleted?: boolean;
  delay?: number;
  index?: number; // For cycling through accent colors
}

const ChallengeCard: React.FC<ChallengeCardProps> = ({ 
  challenge, 
  onPress,
  isCompleted = false,
  delay = 0,
  index = 0,
}) => {
  const { colors, isDark } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  
  const progressPercent = challenge.total > 0 
    ? Math.round((challenge.completed / challenge.total) * 100) 
    : 0;
  
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
    
    // Animate progress bar
    Animated.timing(progressAnim, {
      toValue: progressPercent,
      duration: 800,
      delay: delay + 200,
      useNativeDriver: false,
    }).start();
  }, [delay, fadeAnim, slideAnim, progressAnim, progressPercent]);

  // Use earth tones for in-progress, blue for completed
  const accentColor = isCompleted ? colors.summited : accentColors[index % accentColors.length];

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={onPress}
      >
        <CardFrame 
          variant={isCompleted ? 'cta' : 'default'}
          topo="corner"
          seed={`challenge-${challenge.id}`}
          accentColor={accentColor}
        >
          <View className="p-4">
            <View className="flex-row items-start gap-3">
              {/* Progress ring or completion badge */}
              <View className="items-center justify-center">
                {isCompleted ? (
                  <CompletionBadge size={48} />
                ) : (
                  <View className="relative items-center justify-center">
                    <CircularProgress
                      progress={progressPercent}
                      size={48}
                      strokeWidth={4}
                      color={accentColor}
                      bgColor={colors.muted}
                    />
                    <View className="absolute">
                      <Text 
                        className="text-[11px]"
                        style={{ color: colors.foreground }}
                      >
                        {progressPercent}%
                      </Text>
                    </View>
                  </View>
                )}
              </View>
              
              {/* Challenge info */}
              <View className="flex-1">
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 mr-2">
                    <Text 
                      className="text-base font-semibold"
                      style={{ color: colors.foreground }}
                      numberOfLines={2}
                    >
                      {challenge.name}
                    </Text>
                    {challenge.region && (
                      <View className="flex-row items-center gap-1 mt-1">
                        <MapPin size={11} color={colors.mutedForeground} />
                        <Text 
                          className="text-xs"
                          style={{ color: colors.mutedForeground }}
                        >
                          {challenge.region}
                        </Text>
                      </View>
                    )}
                  </View>
                  
                  <ChevronRight size={18} color={colors.mutedForeground} />
                </View>
                
                {/* Progress bar */}
                <View className="mt-3">
                  <View 
                    className="h-2 rounded-full overflow-hidden"
                    style={{ backgroundColor: colors.muted }}
                  >
                    <Animated.View
                      className="h-full rounded-full"
                      style={{ 
                        backgroundColor: accentColor,
                        width: progressAnim.interpolate({
                          inputRange: [0, 100],
                          outputRange: ['0%', '100%'],
                        }),
                      }}
                    />
                  </View>
                  
                  <View className="flex-row items-center justify-between mt-1.5">
                    <Text 
                      className="text-xs"
                      style={{ color: colors.mutedForeground }}
                    >
                      {challenge.completed} / {challenge.total} peaks
                    </Text>
                    {isCompleted && (
                      <View className="flex-row items-center gap-1">
                        <Check size={12} color={colors.summited} />
                        <Text 
                          className="text-[10px] uppercase tracking-wide"
                          style={{ color: colors.summited }}
                        >
                          Complete
                        </Text>
                      </View>
                    )}
                    {!isCompleted && challenge.total - challenge.completed <= 3 && (
                      <View className="flex-row items-center gap-1">
                        <Zap size={12} color={colors.secondary} />
                        <Text 
                          className="text-[10px]"
                          style={{ color: colors.secondary }}
                        >
                          {challenge.total - challenge.completed} to go!
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </View>
          </View>
        </CardFrame>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const ChallengesContent: React.FC<ChallengesContentProps> = ({
  challenges = [],
  onChallengePress,
  isLoading = false,
  inBottomSheet = false,
}) => {
  const { colors, isDark } = useTheme();
  const ScrollContainer = inBottomSheet ? BottomSheetScrollView : ScrollView;
  const headerFade = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    if (challenges.length > 0) {
      Animated.timing(headerFade, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [challenges.length, headerFade]);

  // Separate into in-progress and completed
  const { inProgress, completed, stats } = useMemo(() => {
    const inProg = challenges.filter(c => !c.is_completed && c.completed < c.total);
    const comp = challenges.filter(c => c.is_completed || c.completed >= c.total);
    
    const totalPeaksCompleted = challenges.reduce((sum, c) => sum + c.completed, 0);
    const totalPeaksTarget = challenges.reduce((sum, c) => sum + c.total, 0);
    
    return {
      inProgress: inProg,
      completed: comp,
      stats: { totalPeaksCompleted, totalPeaksTarget, completionRate: comp.length },
    };
  }, [challenges]);

  if (isLoading) {
    return (
      <View className="p-4 gap-4">
        <View className="h-[100px] rounded-xl bg-muted animate-pulse" />
        <View className="h-[120px] rounded-xl bg-muted animate-pulse" />
        <View className="h-[120px] rounded-xl bg-muted animate-pulse" />
      </View>
    );
  }

  if (challenges.length === 0) {
    return (
      <View className="flex-1 items-center justify-center p-8">
        <View 
          className="w-20 h-20 rounded-full items-center justify-center mb-4"
          style={{ backgroundColor: `${colors.secondary}15` }}
        >
          <Trophy size={36} color={colors.secondary} />
        </View>
        <Text 
          className="text-xl font-semibold text-center"
          style={{ color: colors.foreground }}
        >
          Your Trophy Case
        </Text>
        <Text 
          className="text-sm mt-3 text-center leading-6 max-w-[280px]"
          style={{ color: colors.mutedForeground }}
        >
          Accept challenges to track your progress toward iconic peak lists like the Colorado 14ers or Cascade Volcanoes.
        </Text>
        <View 
          className="flex-row items-center gap-2 mt-6 px-4 py-2 rounded-full"
          style={{ backgroundColor: `${colors.primary}10` }}
        >
          <Target size={14} color={colors.primary} />
          <Text 
            className="text-sm"
            style={{ color: colors.primary }}
          >
            Explore challenges
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollContainer
      style={{ flex: 1 }}
      contentContainerStyle={{ gap: 24, paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Trophy Case Header */}
      <Animated.View style={{ opacity: headerFade }}>
        <CardFrame 
          variant="hero" 
          topo="full" 
          ridge="bottom"
          seed="trophy-case-header"
          className="mx-4 mt-4"
        >
          <View className="p-5 pb-10">
            <View className="flex-row items-center gap-2 mb-3">
              <View 
                className="w-6 h-6 rounded items-center justify-center"
                style={{ backgroundColor: `${colors.secondary}20` }}
              >
                <Award size={14} color={colors.secondary} />
              </View>
              <Text 
                className="text-[10px] uppercase tracking-[2px]"
                style={{ color: colors.mutedForeground }}
              >
                Trophy Case
              </Text>
            </View>
            
            <View className="flex-row items-end justify-between">
              <View>
                <View className="flex-row items-baseline gap-1.5">
                  <Text 
                    className="text-4xl font-bold"
                    style={{ color: colors.foreground }}
                  >
                    {completed.length}
                  </Text>
                  <Text 
                    className="text-base"
                    style={{ color: colors.mutedForeground }}
                  >
                    / {challenges.length}
                  </Text>
                </View>
                <Text 
                  className="text-sm"
                  style={{ color: colors.mutedForeground }}
                >
                  challenges completed
                </Text>
              </View>
              
              <View className="items-end">
                <View className="flex-row items-center gap-1">
                  <TrendingUp size={14} color={colors.primary} />
                  <Text 
                    className="text-lg font-semibold"
                    style={{ color: colors.foreground }}
                  >
                    {stats.totalPeaksCompleted}
                  </Text>
                </View>
                <Text 
                  className="text-xs"
                  style={{ color: colors.mutedForeground }}
                >
                  peaks across all
                </Text>
              </View>
            </View>
          </View>
        </CardFrame>
      </Animated.View>

      {/* In Progress Section */}
      {inProgress.length > 0 && (
        <View className="px-4 gap-3">
          <View className="flex-row items-center gap-2 mb-1">
            <View 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: accentColors[0] }}
            />
            <Text 
              className="text-xs uppercase tracking-widest"
              style={{ color: colors.mutedForeground }}
            >
              In Progress
            </Text>
            <Text 
              className="text-xs"
              style={{ color: colors.mutedForeground }}
            >
              ({inProgress.length})
            </Text>
          </View>
          
          {inProgress.map((challenge, index) => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              onPress={() => onChallengePress?.(challenge)}
              delay={200 + index * 100}
              index={index}
            />
          ))}
        </View>
      )}

      {/* Completed Section */}
      {completed.length > 0 && (
        <View className="px-4 gap-3">
          <View className="flex-row items-center gap-2 mb-1">
            <View 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: colors.summited }}
            />
            <Text 
              className="text-xs uppercase tracking-widest"
              style={{ color: colors.mutedForeground }}
            >
              Completed
            </Text>
            <Text 
              className="text-xs"
              style={{ color: colors.mutedForeground }}
            >
              ({completed.length})
            </Text>
          </View>
          
          {completed.map((challenge, index) => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              onPress={() => onChallengePress?.(challenge)}
              isCompleted
              delay={200 + inProgress.length * 100 + index * 100}
              index={index}
            />
          ))}
        </View>
      )}
    </ScrollContainer>
  );
};

export default ChallengesContent;
