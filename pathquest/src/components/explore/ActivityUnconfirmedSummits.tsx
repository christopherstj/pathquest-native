/**
 * ActivityUnconfirmedSummits
 * 
 * Shows unconfirmed summits for a specific activity.
 * Allows users to confirm/deny summits directly from the activity detail view.
 */

import React, { useMemo } from 'react';
import { View } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import { Text, CardFrame } from '@/src/components/ui';
import { SummitReviewRow } from '@/src/components/shared';
import { useTheme } from '@/src/theme';
import { useUnconfirmedSummits, useConfirmSummit, useDenySummit } from '@/src/hooks';

interface ActivityUnconfirmedSummitsProps {
  activityId: string;
  /** Called when user taps to view a peak */
  onViewPeak?: (peakId: string) => void;
}

export default function ActivityUnconfirmedSummits({
  activityId,
  onViewPeak,
}: ActivityUnconfirmedSummitsProps) {
  const { colors, isDark } = useTheme();
  
  // Fetch all unconfirmed summits and filter by activity
  const { data: allUnconfirmed, isLoading } = useUnconfirmedSummits();
  
  const unconfirmedForActivity = useMemo(() => {
    if (!allUnconfirmed) return [];
    return allUnconfirmed.filter(s => s.activityId === activityId);
  }, [allUnconfirmed, activityId]);
  
  // Mutations
  const confirmMutation = useConfirmSummit();
  const denyMutation = useDenySummit();
  
  // Don't render if loading or no unconfirmed summits for this activity
  if (isLoading || unconfirmedForActivity.length === 0) {
    return null;
  }
  
  const accentColor = colors.secondary;
  
  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 6 }}>
        <AlertTriangle size={14} color={accentColor} />
        <Text 
          className="text-xs uppercase tracking-widest" 
          style={{ color: accentColor }}
        >
          Needs Review
        </Text>
        <Text 
          className="text-xs" 
          style={{ color: colors.mutedForeground }}
        >
          ({unconfirmedForActivity.length})
        </Text>
      </View>
      
      <CardFrame topo="corner" seed={`activity-unconfirmed-${activityId}`}>
        <View className="p-3 gap-2">
          {unconfirmedForActivity.map((summit) => (
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
              onConfirm={() => confirmMutation.mutate(summit.id)}
              onDeny={() => denyMutation.mutate(summit.id)}
              onViewPeak={onViewPeak ? () => onViewPeak(summit.peakId) : undefined}
              isConfirming={confirmMutation.isPending && confirmMutation.variables === summit.id}
              isDenying={denyMutation.isPending && denyMutation.variables === summit.id}
            />
          ))}
        </View>
      </CardFrame>
    </View>
  );
}
