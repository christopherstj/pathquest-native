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
import { View } from 'react-native';
import { Flag, TrendingUp, Trophy } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Text } from '@/src/components/ui';
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
}

interface StatCardProps {
  Icon: LucideIcon;
  value: string | number;
  label: string;
  accentColor: string;
  flex?: number;
}

const StatCard: React.FC<StatCardProps> = ({ 
  Icon, 
  value, 
  label, 
  accentColor,
  flex = 1,
}) => {
  const { colors, isDark } = useTheme();

  return (
    <CardFrame
      variant="default"
      topo="corner"
      ridge="none"
      accentColor={accentColor}
      seed={`quickstats:${label}`}
      style={{ flex }}
    >
      <View className="p-3">
        {/* Icon with muted accent background */}
        <View 
          className="w-8 h-8 rounded-lg items-center justify-center mb-2"
          style={{ backgroundColor: `${accentColor}${isDark ? '22' : '18'}` }}
        >
          <Icon size={16} color={accentColor} />
        </View>
        
        {/* Value */}
        <Text 
          className="text-xl font-bold" 
          style={{ color: colors.foreground }}
          numberOfLines={1}
        >
          {value}
        </Text>
        
        {/* Label */}
        <Text 
          className="text-[11px] font-medium uppercase tracking-wide mt-0.5" 
          style={{ color: colors.mutedForeground }}
          numberOfLines={1}
        >
          {label}
        </Text>
      </View>
      
      {/* Bottom accent line */}
      <View 
        style={{ 
          height: 2, 
          backgroundColor: accentColor,
          opacity: isDark ? 0.45 : 0.35,
        }} 
      />
    </CardFrame>
  );
};

const QuickStats: React.FC<QuickStatsProps> = ({
  totalPeaks = 0,
  totalElevation = 0, // elevation comes in as METERS
  primaryChallenge,
  isLoading = false,
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
    return (
      <View className="flex-row gap-3">
        {[1, 2, 3].map((i) => (
          <CardFrame
            key={i}
            variant="default"
            topo="corner"
            ridge="none"
            seed={`quickstats:skeleton:${i}`}
            style={{ flex: 1, height: 96, opacity: 0.6 }}
          />
        ))}
      </View>
    );
  }

  return (
    <View className="flex-row gap-3">
      {/* Total Peaks - Forest Green */}
      <StatCard 
        Icon={Flag}
        value={totalPeaks} 
        label="Peaks"
        accentColor="#5B9167"
      />
      
      {/* Total Elevation - Trail Brown */}
      <StatCard 
        Icon={TrendingUp}
        value={elevationStr} 
        label="Gained"
        accentColor="#8B7355"
      />
      
      {/* Closest Challenge - Rust */}
      <StatCard 
        Icon={Trophy}
        value={challengeValue}
        label={challengeName}
        accentColor="#C9A66B"
      />
    </View>
  );
};

export default QuickStats;
