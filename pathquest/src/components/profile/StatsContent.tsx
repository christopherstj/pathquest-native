/**
 * StatsContent
 * 
 * Profile Stats sub-tab showing the user's highlight reel:
 * - Highest peak climbed
 * - Total elevation gained
 * - Challenges completed
 * - Geographic diversity (states/countries)
 * - Peak type breakdown
 */

import React from 'react';
import { View, ScrollView } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { getElevationString } from '@pathquest/shared';
import { Text, Value } from '@/src/components/ui';

interface ProfileStats {
  totalPeaks?: number;
  totalSummits?: number;
  highestPeak?: {
    name: string;
    elevation: number;
  };
  challengesCompleted?: number;
  totalElevation?: number;
  statesClimbed?: number;
  countriesClimbed?: number;
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
}

interface StatCardProps {
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  value: string | number;
  label: string;
  sublabel?: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, value, label, sublabel }) => {
  return (
    <View className="w-[47%] p-4 rounded-xl bg-card border border-border items-center">
      <View className="w-10 h-10 rounded-full bg-primary/15 items-center justify-center mb-2">
        <FontAwesome name={icon} size={18} color="#5B9167" />
      </View>
      <Value className="text-foreground text-2xl font-bold">{value}</Value>
      <Text className="text-muted-foreground text-xs mt-1 text-center">{label}</Text>
      {sublabel && (
        <Text className="text-muted-foreground text-[11px] mt-0.5 text-center">{sublabel}</Text>
      )}
    </View>
  );
};

const StatsContent: React.FC<StatsContentProps> = ({ stats, isLoading = false }) => {
  if (isLoading) {
    return (
      <View className="p-4 gap-3">
        <View className="h-[100px] rounded-xl bg-muted" />
        <View className="h-[100px] rounded-xl bg-muted" />
      </View>
    );
  }

  if (!stats) {
    return (
      <View className="flex-1 items-center justify-center p-8">
        <FontAwesome name="bar-chart" size={32} color="#A9A196" />
        <Text className="text-foreground text-lg font-semibold mt-4">
          No stats yet
        </Text>
        <Text className="text-muted-foreground text-sm mt-2 text-center leading-5">
          Your climbing statistics will appear here once you start logging summits.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView 
      className="flex-1"
      contentContainerClassName="p-4 gap-4 pb-8"
      showsVerticalScrollIndicator={false}
    >
      {/* Highlight Card - Highest Peak */}
      {stats.highestPeak && (
        <View className="p-5 rounded-xl bg-card border border-border items-center">
          <View className="w-12 h-12 rounded-full bg-summited/20 items-center justify-center mb-3">
            <FontAwesome name="flag" size={20} color="#4A8BC4" />
          </View>
          <Text className="text-muted-foreground text-xs uppercase tracking-wider">
            Highest Peak
          </Text>
          <Text className="text-foreground text-xl font-bold mt-1 text-center">
            {stats.highestPeak.name}
          </Text>
          <Value className="text-muted-foreground text-sm mt-0.5">
            {getElevationString(stats.highestPeak.elevation, 'imperial')}
          </Value>
        </View>
      )}

      {/* Stats Grid */}
      <View className="flex-row flex-wrap gap-3">
        <StatCard 
          icon="flag" 
          value={stats.totalPeaks ?? 0} 
          label="Peaks Summited"
        />
        <StatCard 
          icon="repeat" 
          value={stats.totalSummits ?? 0} 
          label="Total Summits"
        />
        <StatCard 
          icon="arrow-up" 
          value={stats.totalElevation ? `${Math.round(stats.totalElevation / 1000)}k ft` : '0 ft'} 
          label="Elevation Gained"
        />
        <StatCard 
          icon="trophy" 
          value={stats.challengesCompleted ?? 0} 
          label="Challenges"
        />
      </View>

      {/* Geographic Diversity */}
      {(stats.statesClimbed || stats.countriesClimbed) && (
        <View className="p-4 rounded-xl bg-card border border-border">
          <Text className="text-foreground text-base font-semibold mb-3">
            Geographic Diversity
          </Text>
          <View className="flex-row gap-6">
            {stats.statesClimbed !== undefined && (
              <View className="flex-row items-center gap-2">
                <FontAwesome name="map" size={14} color="#A9A196" />
                <Value className="text-foreground text-lg font-bold">
                  {stats.statesClimbed}
                </Value>
                <Text className="text-muted-foreground text-[13px]">
                  States
                </Text>
              </View>
            )}
            {stats.countriesClimbed !== undefined && (
              <View className="flex-row items-center gap-2">
                <FontAwesome name="globe" size={14} color="#A9A196" />
                <Value className="text-foreground text-lg font-bold">
                  {stats.countriesClimbed}
                </Value>
                <Text className="text-muted-foreground text-[13px]">
                  Countries
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Peak Breakdown */}
      {stats.peakBreakdown && (
        <View className="p-4 rounded-xl bg-card border border-border">
          <Text className="text-foreground text-base font-semibold mb-3">
            Peak Breakdown
          </Text>
          <View>
            {stats.peakBreakdown.fourteeners !== undefined && stats.peakBreakdown.fourteeners > 0 && (
              <BreakdownItem label="14ers (14,000+ ft)" value={stats.peakBreakdown.fourteeners} />
            )}
            {stats.peakBreakdown.thirteeners !== undefined && stats.peakBreakdown.thirteeners > 0 && (
              <BreakdownItem label="13ers (13,000+ ft)" value={stats.peakBreakdown.thirteeners} />
            )}
            {stats.peakBreakdown.twelvers !== undefined && stats.peakBreakdown.twelvers > 0 && (
              <BreakdownItem label="12ers (12,000+ ft)" value={stats.peakBreakdown.twelvers} />
            )}
            {stats.peakBreakdown.other !== undefined && stats.peakBreakdown.other > 0 && (
              <BreakdownItem label="Other peaks" value={stats.peakBreakdown.other} />
            )}
          </View>
        </View>
      )}
    </ScrollView>
  );
};

interface BreakdownItemProps {
  label: string;
  value: number;
}

const BreakdownItem: React.FC<BreakdownItemProps> = ({ label, value }) => {
  return (
    <View className="flex-row justify-between items-center py-3 border-b border-border">
      <Text className="text-foreground text-sm">{label}</Text>
      <Value className="text-foreground text-base font-semibold">{value}</Value>
    </View>
  );
};

export default StatsContent;
