/**
 * RecentSummits
 * 
 * Shows a list of the user's recent summit activities.
 */

import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Flag, Pencil, ChevronRight } from 'lucide-react-native';
import { getElevationString } from '@pathquest/shared';
import { Text } from '@/src/components/ui';
import { useTheme } from '@/src/theme';

interface Summit {
  id: string;
  peakId: string;
  peakName: string;
  peakElevation?: number;
  timestamp: string;
  hasReport?: boolean;
  summitNumber?: number;
}

interface RecentSummitsProps {
  summits: Summit[];
  onSummitPress?: (summit: Summit) => void;
  onViewAllPress?: () => void;
  isLoading?: boolean;
}

interface SummitItemProps {
  summit: Summit;
  onPress?: () => void;
}

const SummitItem: React.FC<SummitItemProps> = ({ summit, onPress }) => {
  const { colors } = useTheme();
  
  // Format date
  const date = new Date(summit.timestamp);
  const dateStr = date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });
  const timeStr = date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit' 
  });

  return (
    <TouchableOpacity
      className="flex-row items-center py-3 px-4 border-b border-border gap-3"
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View className="w-9 h-9 rounded-full bg-summited/20 items-center justify-center">
        <Flag size={14} color="#4A8BC4" />
      </View>
      
      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <Text className="text-foreground text-[15px] font-medium flex-1" numberOfLines={1}>
            {summit.peakName}
          </Text>
          {summit.summitNumber && (
            <Text className="text-muted-foreground text-xs">
              #{summit.summitNumber}
            </Text>
          )}
        </View>
        
        <View className="flex-row items-center gap-2 mt-0.5">
          {summit.peakElevation && (
            <Text className="text-muted-foreground text-xs">
              {getElevationString(summit.peakElevation, 'imperial')}
            </Text>
          )}
          <Text className="text-muted-foreground text-xs">
            {dateStr} at {timeStr}
          </Text>
        </View>
      </View>

      {!summit.hasReport && (
        <View className="bg-primary/15 px-2 py-1 rounded-xl mr-2">
          <Pencil size={10} color={colors.statForest} />
        </View>
      )}
      
      <ChevronRight size={12} color={colors.statMuted} />
    </TouchableOpacity>
  );
};

const RecentSummits: React.FC<RecentSummitsProps> = ({
  summits,
  onSummitPress,
  onViewAllPress,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <View className="rounded-xl border border-border bg-card overflow-hidden">
        <View className="flex-row justify-between items-center p-4 pb-3">
          <Text className="text-foreground text-base font-semibold">Recent Summits</Text>
        </View>
        <View className="p-4 gap-3">
          <View className="h-[52px] rounded-lg bg-muted" />
          <View className="h-[52px] rounded-lg bg-muted" />
        </View>
      </View>
    );
  }

  if (summits.length === 0) {
    return (
      <View className="rounded-xl border border-border bg-card overflow-hidden">
        <View className="flex-row justify-between items-center p-4 pb-3">
          <Text className="text-foreground text-base font-semibold">Recent Summits</Text>
        </View>
        <View className="items-center justify-center p-8">
          <Flag size={24} color="#A9A196" />
          <Text className="text-muted-foreground text-sm mt-3 text-center">
            No summits yet. Get out there!
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="rounded-xl border border-border bg-card overflow-hidden">
      <View className="flex-row justify-between items-center p-4 pb-3">
        <Text className="text-foreground text-base font-semibold">Recent Summits</Text>
        {onViewAllPress && summits.length > 3 && (
          <TouchableOpacity onPress={onViewAllPress}>
            <Text className="text-primary text-[13px] font-medium">View All</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {summits.slice(0, 5).map((summit) => (
        <SummitItem
          key={summit.id}
          summit={summit}
          onPress={() => onSummitPress?.(summit)}
        />
      ))}
    </View>
  );
};

export default RecentSummits;
