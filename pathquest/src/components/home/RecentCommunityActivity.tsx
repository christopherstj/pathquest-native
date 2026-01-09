/**
 * RecentCommunityActivity
 * 
 * Shows recent public summits from the community to engage guest users.
 * Displays user name, peak name, and relative time.
 */

import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Activity, Mountain, User, ChevronRight } from 'lucide-react-native';
import { useTheme } from '@/src/theme';
import { Text, CardFrame, Skeleton } from '@/src/components/ui';
import { UserAvatar } from '@/src/components/shared';
import type { RecentPublicSummit } from '@pathquest/shared/api/endpoints/peaks';

// Helper to format relative time
function getRelativeTime(timestamp: string): string {
  const now = new Date();
  const summitDate = new Date(timestamp);
  const diffMs = now.getTime() - summitDate.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return summitDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}

interface RecentCommunityActivityProps {
  summits: RecentPublicSummit[];
  isLoading?: boolean;
  onPeakPress?: (peakId: string) => void;
  onUserPress?: (userId: string) => void;
}

const RecentCommunityActivity: React.FC<RecentCommunityActivityProps> = ({
  summits,
  isLoading = false,
  onPeakPress,
  onUserPress,
}) => {
  const { colors, isDark } = useTheme();

  if (isLoading) {
    return (
      <View>
        <View className="flex-row items-center gap-2 px-4 mb-3">
          <Activity size={16} color={colors.primary} />
          <Text className="text-foreground font-semibold">Community Activity</Text>
        </View>
        <View className="px-4 gap-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="card" style={{ height: 64 }} />
          ))}
        </View>
      </View>
    );
  }

  if (summits.length === 0) {
    return null;
  }

  return (
    <View>
      <View className="flex-row items-center gap-2 px-4 mb-3">
        <Activity size={16} color={colors.primary} />
        <Text className="text-foreground font-semibold">Community Activity</Text>
      </View>
      <View className="px-4 gap-2">
        {summits.map((summit) => (
          <TouchableOpacity
            key={summit.id}
            activeOpacity={0.8}
            onPress={() => summit.peak_id && onPeakPress?.(summit.peak_id)}
          >
            <CardFrame 
              topo="none" 
              seed={`community-summit:${summit.id}`}
              style={{ padding: 12 }}
            >
              <View className="flex-row items-center gap-3">
                {/* User avatar */}
                <TouchableOpacity
                  onPress={() => summit.user_id && onUserPress?.(summit.user_id)}
                  activeOpacity={0.7}
                >
                  <UserAvatar
                    size="sm"
                    name={summit.user_name || undefined}
                  />
                </TouchableOpacity>
                
                {/* Content */}
                <View className="flex-1">
                  <View className="flex-row items-center gap-1.5 mb-0.5">
                    <Text 
                      className="font-medium text-sm" 
                      style={{ color: colors.foreground }}
                      numberOfLines={1}
                    >
                      {summit.user_name || 'Anonymous'}
                    </Text>
                    <Text className="text-xs" style={{ color: colors.mutedForeground }}>
                      summited
                    </Text>
                  </View>
                  
                  <View className="flex-row items-center gap-1.5">
                    <Mountain size={12} color={colors.summited} />
                    <Text 
                      className="text-sm font-medium" 
                      style={{ color: colors.summited }}
                      numberOfLines={1}
                    >
                      {summit.peak_name}
                    </Text>
                  </View>
                </View>
                
                {/* Time + chevron */}
                <View className="items-end">
                  <Text className="text-xs mb-1" style={{ color: colors.mutedForeground }}>
                    {getRelativeTime(summit.timestamp)}
                  </Text>
                  <ChevronRight size={14} color={colors.mutedForeground} />
                </View>
              </View>
            </CardFrame>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default RecentCommunityActivity;

