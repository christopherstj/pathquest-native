/**
 * PeaksContent
 * 
 * Profile Peaks sub-tab showing the user's summited peaks list.
 * Supports filtering by state, elevation, and sorting.
 */

import React from 'react';
import { View, ScrollView, TouchableOpacity, Text } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { PeakRow } from '@/src/components/explore';
import type { Peak } from '@pathquest/shared';

interface PeaksContentProps {
  peaks?: Peak[];
  onPeakPress?: (peak: Peak) => void;
  isLoading?: boolean;
}

const PeaksContent: React.FC<PeaksContentProps> = ({
  peaks = [],
  onPeakPress,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <View className="p-4 gap-3">
        <View className="h-16 rounded-lg bg-muted" />
        <View className="h-16 rounded-lg bg-muted" />
        <View className="h-16 rounded-lg bg-muted" />
      </View>
    );
  }

  if (peaks.length === 0) {
    return (
      <View className="flex-1 items-center justify-center p-8">
        <FontAwesome name="map-marker" size={32} color="#A9A196" />
        <Text className="text-foreground text-lg font-semibold mt-4 font-display">
          No peaks yet
        </Text>
        <Text className="text-muted-foreground text-sm mt-2 text-center leading-5">
          Your summited peaks will appear here. Connect with Strava to automatically track your climbs.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1">
      {/* Filter Bar - Placeholder */}
      <View className="flex-row items-center py-2.5 px-4 border-b border-border bg-card gap-4">
        <TouchableOpacity className="flex-row items-center gap-1.5" activeOpacity={0.7}>
          <FontAwesome name="filter" size={14} color="#A9A196" />
          <Text className="text-muted-foreground text-[13px] font-medium">
            Filters
          </Text>
        </TouchableOpacity>
        <TouchableOpacity className="flex-row items-center gap-1.5" activeOpacity={0.7}>
          <FontAwesome name="sort" size={14} color="#A9A196" />
          <Text className="text-muted-foreground text-[13px] font-medium">
            Sort
          </Text>
        </TouchableOpacity>
        <Text className="text-muted-foreground text-xs ml-auto">
          {peaks.length} peaks
        </Text>
      </View>

      {/* Peaks List */}
      <ScrollView 
        className="flex-1"
        contentContainerClassName="pb-8"
        showsVerticalScrollIndicator={false}
      >
        {peaks.map((peak) => (
          <PeakRow
            key={peak.id}
            peak={peak}
            onPress={onPeakPress}
            isSummited={true}
          />
        ))}
      </ScrollView>
    </View>
  );
};

export default PeaksContent;
