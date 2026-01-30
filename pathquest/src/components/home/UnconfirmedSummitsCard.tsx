/**
 * UnconfirmedSummitsCard
 * 
 * A dashboard card showing unconfirmed summits that need user review.
 * Styled with amber/rust warning theme to draw attention.
 * Shows up to 3 summits with full review cards (same as Profile Review tab).
 */

import React from 'react';
import { View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { AlertTriangle, ChevronRight, Mountain } from 'lucide-react-native';
import { Text } from '@/src/components/ui';
import CardFrame from '@/src/components/ui/CardFrame';
import { SummitReviewRow } from '@/src/components/shared';
import { useTheme } from '@/src/theme';
import { useUnconfirmedSummits, useConfirmSummit, useDenySummit } from '@/src/hooks';

interface UnconfirmedSummitsCardProps {
  /** Navigate to the Profile Review tab */
  onViewAll?: () => void;
  /** Navigate to a peak detail */
  onViewPeak?: (peakId: string) => void;
  /** Navigate to an activity detail */
  onViewActivity?: (activityId: string) => void;
  /** Max number of summits to show (default: 3) */
  maxSummits?: number;
}

const UnconfirmedSummitsCard: React.FC<UnconfirmedSummitsCardProps> = ({
  onViewAll,
  onViewPeak,
  onViewActivity,
  maxSummits = 3,
}) => {
  const { colors, isDark } = useTheme();
  
  // Fetch unconfirmed summits
  const { data: summits, isLoading } = useUnconfirmedSummits(maxSummits);
  
  // Mutations
  const confirmMutation = useConfirmSummit();
  const denyMutation = useDenySummit();
  
  // Amber/rust warning accent
  const accentColor = colors.secondary;
  const accentBg = `${colors.secondary}${isDark ? '20' : '15'}`;
  
  // Don't render if no unconfirmed summits
  if (!isLoading && (!summits || summits.length === 0)) {
    return null;
  }
  
  const handleConfirm = (summitId: string) => {
    confirmMutation.mutate(summitId);
  };
  
  const handleDeny = (summitId: string) => {
    denyMutation.mutate(summitId);
  };
  
  const summitCount = summits?.length ?? 0;
  
  return (
    <CardFrame
      variant="cta"
      topo="corner"
      ridge="bottom"
      seed="unconfirmed-summits"
      accentColor={accentColor}
    >
      {/* Top label bar */}
      <View className="px-4 pt-3 pb-2 flex-row items-center">
        <AlertTriangle size={12} color={accentColor} />
        <Text 
          className="text-[10px] font-bold ml-1.5 uppercase tracking-wider"
          style={{ color: accentColor }}
        >
          Needs Review
        </Text>
      </View>
      
      {/* Header */}
      <View className="px-4 pb-3">
        <View className="flex-row items-center mb-3">
          {/* Icon Container */}
          <View 
            className="w-12 h-12 rounded-lg items-center justify-center"
            style={{ backgroundColor: accentBg }}
          >
            <Mountain size={20} color={accentColor} />
          </View>
          
          {/* Content */}
          <View className="flex-1 ml-3">
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.mutedForeground} />
            ) : (
              <>
                <Text style={{ color: colors.foreground }} className="text-lg font-bold">
                  {summitCount} summit{summitCount !== 1 ? 's' : ''} to review
                </Text>
                <Text style={{ color: colors.mutedForeground }} className="text-sm mt-0.5">
                  Confirm or deny detected peaks
                </Text>
              </>
            )}
          </View>
        </View>
        
        {/* Summit list using shared component - FULL variant with links */}
        {!isLoading && summits && summits.length > 0 && (
          <View className="gap-3 mb-3">
            {summits.slice(0, maxSummits).map((summit) => (
              <SummitReviewRow
                key={summit.id}
                summit={{
                  id: summit.id,
                  peakId: summit.peakId,
                  peakName: summit.peakName,
                  peakElevation: summit.peakElevation,
                  activityId: summit.activityId,
                  timestamp: summit.timestamp,
                  confidenceScore: summit.confidenceScore,
                }}
                variant="full"
                showConfidence
                onConfirm={() => handleConfirm(summit.id)}
                onDeny={() => handleDeny(summit.id)}
                onViewPeak={onViewPeak ? () => onViewPeak(summit.peakId) : undefined}
                onViewActivity={onViewActivity ? () => onViewActivity(summit.activityId) : undefined}
                isConfirming={confirmMutation.isPending && confirmMutation.variables === summit.id}
                isDenying={denyMutation.isPending && denyMutation.variables === summit.id}
              />
            ))}
          </View>
        )}
        
        {/* View all link */}
        {onViewAll && (
          <TouchableOpacity
            className="flex-row items-center justify-center py-2"
            onPress={onViewAll}
            activeOpacity={0.7}
          >
            <Text 
              className="text-sm font-semibold mr-1"
              style={{ color: accentColor }}
            >
              View all in Profile
            </Text>
            <ChevronRight size={14} color={accentColor} />
          </TouchableOpacity>
        )}
      </View>
      
      {/* Bottom accent line */}
      <View style={{ height: 2, backgroundColor: accentColor, opacity: 0.3 }} />
    </CardFrame>
  );
};

export default UnconfirmedSummitsCard;
