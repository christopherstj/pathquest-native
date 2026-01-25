/**
 * QuickStats
 * 
 * Retro topographic styled stats display showing 3 key lifetime metrics:
 * - Total unique peaks summited
 * - Total elevation gained
 * - Closest challenge to completion
 * 
 * Uses muted earthy colors with subtle contour line decorations.
 */

import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Flag, TrendingUp, Trophy } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Text, SkeletonStats, AnimatedPressable } from '@/src/components/ui';
import { useTheme } from '@/src/theme';
import CardFrame from '@/src/components/ui/CardFrame';

interface ChallengeProgress {
  challengeId: number;
  name: string;
  completed: number;
  total: number;
}

interface QuickStatsProps {
  totalPeaks?: number;
  totalElevation?: number; // in meters
  primaryChallenge?: ChallengeProgress | null;
  isLoading?: boolean;
  /** Called when the challenge stat card is pressed */
  onChallengePress?: (challengeId: number) => void;
}

interface StatCardProps {
  Icon: LucideIcon;
  value: string | number;
  label: string;
  accentColor: string;
  flex?: number;
  onPress?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ 
  Icon, 
  value, 
  label, 
  accentColor,
  flex = 1,
  onPress,
}) => {
  const { colors, isDark } = useTheme();

  const content = (
    <CardFrame
      variant="default"
      topo="corner"
      ridge="none"
      accentColor={accentColor}
      seed={`quickstats:${label}`}
      style={{ flex: onPress ? undefined : 1 }}
    >
      <View className="p-3">
        {/* Icon with VIBRANT accent background */}
        <View 
          className="w-9 h-9 rounded-xl items-center justify-center mb-2"
          style={{ 
            backgroundColor: `${accentColor}${isDark ? '35' : '25'}`,
            // Add subtle glow
            shadowColor: accentColor,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
          }}
        >
          <Icon size={18} color={accentColor} strokeWidth={2.5} />
        </View>
        
        {/* Value - with accent color tint */}
        <Text 
          className="text-xl font-bold" 
          style={{ color: accentColor }}
          numberOfLines={1}
        >
          {value}
        </Text>
        
        {/* Label */}
        <Text 
          className="text-[11px] font-semibold uppercase tracking-wide mt-0.5" 
          style={{ color: colors.mutedForeground }}
          numberOfLines={1}
        >
          {label}
        </Text>
      </View>
      
      {/* Bottom accent line - MORE VIBRANT */}
      <View 
        style={{ 
          height: 3, 
          backgroundColor: accentColor,
          opacity: isDark ? 0.75 : 0.55,
        }} 
      />
    </CardFrame>
  );

  if (onPress) {
    return (
      <AnimatedPressable onPress={onPress} style={{ flex }} haptic="selection">
        {content}
      </AnimatedPressable>
    );
  }

  return <View style={{ flex }}>{content}</View>;
};

const QuickStats: React.FC<QuickStatsProps> = ({
  totalPeaks = 0,
  totalElevation = 0, // elevation comes in as METERS
  primaryChallenge,
  isLoading = false,
  onChallengePress,
}) => {
  // Convert meters to feet (1 meter = 3.28084 feet)
  const elevationInFeet = Math.round(totalElevation * 3.28084);
  
  // Format elevation with k suffix for thousands
  const elevationStr = elevationInFeet >= 1000 
    ? `${(elevationInFeet / 1000).toFixed(1)}k ft` 
    : `${elevationInFeet} ft`;

  // Format challenge progress
  const challengeValue = primaryChallenge 
    ? `${primaryChallenge.completed}/${primaryChallenge.total}`
    : '—';
  
  // Truncate challenge name for display  
  const challengeName = primaryChallenge?.name 
    ? (primaryChallenge.name.length > 10 
        ? primaryChallenge.name.substring(0, 9) + '…' 
        : primaryChallenge.name)
    : 'Challenge';

  if (isLoading) {
    return <SkeletonStats count={3} />;
  }

  const { colors } = useTheme();
  
  return (
    <View className="flex-row gap-3">
      {/* Total Peaks - Forest Green */}
      <StatCard 
        Icon={Flag}
        value={totalPeaks} 
        label="Peaks"
        accentColor={colors.statForest}
      />
      
      {/* Total Elevation - Trail Brown */}
      <StatCard 
        Icon={TrendingUp}
        value={elevationStr} 
        label="Gained"
        accentColor={colors.statTrail}
      />
      
      {/* Closest Challenge - Rust */}
      <StatCard 
        Icon={Trophy}
        value={challengeValue}
        label={challengeName}
        accentColor={colors.statGold}
        onPress={primaryChallenge && onChallengePress 
          ? () => onChallengePress(primaryChallenge.challengeId) 
          : undefined
        }
      />
    </View>
  );
};

export default QuickStats;
