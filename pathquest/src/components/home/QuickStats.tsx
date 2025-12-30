/**
 * QuickStats
 * 
 * Horizontal stats bar showing key metrics:
 * - Total peaks summited
 * - Total elevation gained
 * - Summits this month
 * - Primary challenge progress
 */

import React from 'react';
import { View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text, Value } from '@/src/components/ui';

interface QuickStatsProps {
  totalPeaks?: number;
  totalElevation?: number;
  summitsThisMonth?: number;
  summitsLastMonth?: number;
  challengeProgress?: number;
  isLoading?: boolean;
}

interface StatItemProps {
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  value: string | number;
  label: string;
  trend?: 'up' | 'down' | 'same';
}

const StatItem: React.FC<StatItemProps> = ({ icon, value, label, trend }) => {
  return (
    <View className="flex-1 flex-row items-center gap-2">
      <View className="w-7 h-7 rounded-full bg-primary/15 items-center justify-center">
        <FontAwesome name={icon} size={14} color="#5B9167" />
      </View>
        <View className="flex-1">
          <View className="flex-row items-center gap-1">
            <Value className="text-foreground text-[15px] font-bold">{value}</Value>
            {trend && trend !== 'same' && (
              <FontAwesome 
                name={trend === 'up' ? 'arrow-up' : 'arrow-down'} 
                size={10} 
                color={trend === 'up' ? '#5B9167' : '#A9A196'} 
                style={{ marginTop: 1 }}
              />
            )}
          </View>
          <Text className="text-muted-foreground text-[10px] mt-0.5">{label}</Text>
        </View>
    </View>
  );
};

const QuickStats: React.FC<QuickStatsProps> = ({
  totalPeaks = 0,
  totalElevation = 0,
  summitsThisMonth = 0,
  summitsLastMonth = 0,
  challengeProgress,
  isLoading = false,
}) => {
  // Format elevation
  const elevationStr = totalElevation >= 1000 
    ? `${(totalElevation / 1000).toFixed(1)}k` 
    : totalElevation.toString();

  // Calculate trend
  const monthTrend: 'up' | 'down' | 'same' = 
    summitsThisMonth > summitsLastMonth ? 'up' : 
    summitsThisMonth < summitsLastMonth ? 'down' : 'same';

  if (isLoading) {
    return (
      <View className="flex-row items-center p-3 rounded-xl bg-card border border-border">
        <View className="flex-1 h-11 rounded-lg bg-muted" />
      </View>
    );
  }

  return (
    <View className="flex-row items-center p-3 rounded-xl bg-card border border-border">
      <StatItem 
        icon="flag" 
        value={totalPeaks} 
        label="Peaks" 
      />
      <View className="w-px h-8 mx-2 bg-border" />
      <StatItem 
        icon="arrow-up" 
        value={`${elevationStr} ft`} 
        label="Elevation" 
      />
      <View className="w-px h-8 mx-2 bg-border" />
      <StatItem 
        icon="calendar" 
        value={summitsThisMonth} 
        label="This Month" 
        trend={monthTrend}
      />
      {challengeProgress !== undefined && (
        <>
          <View className="w-px h-8 mx-2 bg-border" />
          <StatItem 
            icon="trophy" 
            value={`${challengeProgress}%`} 
            label="Challenge" 
          />
        </>
      )}
    </View>
  );
};

export default QuickStats;
