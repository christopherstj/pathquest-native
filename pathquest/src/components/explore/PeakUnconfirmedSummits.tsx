/**
 * PeakUnconfirmedSummits
 * 
 * Shows unconfirmed summits for a specific peak (user's own ascents).
 * Allows users to confirm/deny summits directly from the peak detail view.
 */

import React, { useMemo } from 'react';
import { View } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import { Text, CardFrame } from '@/src/components/ui';
import { SummitReviewRow } from '@/src/components/shared';
import { useTheme } from '@/src/theme';
import { useUnconfirmedSummits, useConfirmSummit, useDenySummit } from '@/src/hooks';

interface PeakUnconfirmedSummitsProps {
  peakId: string;
  /** Called when user taps to view an activity */
  onViewActivity?: (activityId: string) => void;
}

export default function PeakUnconfirmedSummits({
  peakId,
  onViewActivity,
}: PeakUnconfirmedSummitsProps) {
  const { colors, isDark } = useTheme();
  
  // Fetch all unconfirmed summits and filter by peak
  const { data: allUnconfirmed, isLoading } = useUnconfirmedSummits();
  
  const unconfirmedForPeak = useMemo(() => {
    if (!allUnconfirmed) return [];
    return allUnconfirmed.filter(s => s.peakId === peakId);
  }, [allUnconfirmed, peakId]);
  
  // Mutations
  const confirmMutation = useConfirmSummit();
  const denyMutation = useDenySummit();
  
  // Don't render if loading or no unconfirmed summits for this peak
  if (isLoading || unconfirmedForPeak.length === 0) {
    return null;
  }
  
  const accentColor = colors.secondary;
  
  return (
    <View style={{ marginTop: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 6 }}>
        <AlertTriangle size={14} color={accentColor} />
        <Text 
          className="text-xs uppercase tracking-widest" 
          style={{ color: accentColor }}
        >
          Your Ascents Needing Review
        </Text>
        <Text 
          className="text-xs" 
          style={{ color: colors.mutedForeground }}
        >
          ({unconfirmedForPeak.length})
        </Text>
      </View>
      
      <CardFrame topo="corner" seed={`peak-unconfirmed-${peakId}`}>
        <View className="p-3 gap-2">
          {unconfirmedForPeak.map((summit) => (
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
              hidePeakName // Peak name is already shown in context
              showConfidence
              onConfirm={() => confirmMutation.mutate(summit.id)}
              onDeny={() => denyMutation.mutate(summit.id)}
              onViewActivity={onViewActivity ? () => onViewActivity(summit.activityId) : undefined}
              isConfirming={confirmMutation.isPending && confirmMutation.variables === summit.id}
              isDenying={denyMutation.isPending && denyMutation.variables === summit.id}
            />
          ))}
        </View>
      </CardFrame>
    </View>
  );
}
