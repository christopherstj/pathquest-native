/**
 * ChallengeRow
 * 
 * A list item component for displaying a challenge in discovery lists.
 * Shows challenge name, region, peak count, and progress if available.
 */

import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Check, ChevronRight } from 'lucide-react-native';
import type { ChallengeProgress } from '@pathquest/shared';
import { CardFrame, Text } from '@/src/components/ui';
import { useTheme } from '@/src/theme';

interface ChallengeRowProps {
  challenge: ChallengeProgress;
  onPress?: (challenge: ChallengeProgress) => void;
}

const ChallengeRow: React.FC<ChallengeRowProps> = ({ challenge, onPress }) => {
  const { colors } = useTheme();
  const handlePress = () => {
    onPress?.(challenge);
  };

  // Calculate progress percentage
  const hasProgress = challenge.completed > 0;
  const progressPercent = challenge.total > 0 
    ? Math.round((challenge.completed / challenge.total) * 100) 
    : 0;
  const isCompleted = challenge.is_completed || progressPercent === 100;

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      style={{ paddingHorizontal: 16, paddingVertical: 8 }}
    >
      <CardFrame topo="corner" seed={`challenge-row:${challenge.id}`} style={{ padding: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {/* Challenge info */}
          <View style={{ flex: 1, marginRight: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text className="text-foreground text-base font-semibold flex-1" numberOfLines={1}>
                {challenge.name || 'Unknown Challenge'}
              </Text>
              {isCompleted ? (
                <View className="bg-summited/20 px-2 py-0.5 rounded-xl">
                  <Check size={10} color={colors.summited as any} />
                </View>
              ) : null}
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
              {challenge.region ? (
                <Text className="text-muted-foreground text-xs flex-1" numberOfLines={1}>
                  {challenge.region}
                </Text>
              ) : null}
              <Text className="text-muted-foreground text-xs">
                {challenge.num_peaks ?? challenge.total} peaks
              </Text>
            </View>

            {/* Progress bar (only show if user has progress) */}
            {hasProgress && !isCompleted ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 }}>
                <View className="flex-1 h-1.5 rounded-sm bg-muted overflow-hidden">
                  <View className="h-full rounded-sm bg-primary" style={{ width: `${progressPercent}%` }} />
                </View>
                <Text className="text-muted-foreground text-[11px] font-medium min-w-[48px] text-right">
                  {challenge.completed}/{challenge.total}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Chevron */}
          <ChevronRight size={14} color={colors.mutedForeground as any} />
        </View>
      </CardFrame>
    </TouchableOpacity>
  );
};

export default ChallengeRow;
