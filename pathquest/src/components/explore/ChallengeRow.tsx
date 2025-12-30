/**
 * ChallengeRow
 * 
 * A list item component for displaying a challenge in discovery lists.
 * Shows challenge name, region, peak count, and progress if available.
 */

import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import type { ChallengeProgress } from '@pathquest/shared';
import { Text, Value } from '@/src/components/ui';

interface ChallengeRowProps {
  challenge: ChallengeProgress;
  onPress?: (challenge: ChallengeProgress) => void;
}

const ChallengeRow: React.FC<ChallengeRowProps> = ({ challenge, onPress }) => {
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
      className="flex-row items-center py-3 px-4 border-b border-border"
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Challenge info */}
      <View className="flex-1 mr-3">
        <View className="flex-row items-center gap-2">
          <Text 
            className="text-foreground text-base font-semibold flex-1"
            numberOfLines={1}
          >
            {challenge.name || 'Unknown Challenge'}
          </Text>
          {isCompleted && (
            <View className="bg-summited/20 px-2 py-0.5 rounded-xl">
              <FontAwesome name="check" size={10} color="#4A8BC4" />
            </View>
          )}
        </View>

        <View className="flex-row items-center gap-2 mt-0.5">
          {challenge.region && (
            <Text 
              className="text-muted-foreground text-xs flex-1"
              numberOfLines={1}
            >
              {challenge.region}
            </Text>
          )}
          <Value className="text-muted-foreground text-xs">
            {challenge.num_peaks ?? challenge.total} peaks
          </Value>
        </View>

        {/* Progress bar (only show if user has progress) */}
        {hasProgress && !isCompleted && (
          <View className="flex-row items-center gap-2 mt-2">
            <View className="flex-1 h-1 rounded-sm bg-muted overflow-hidden">
              <View 
                className="h-full rounded-sm bg-primary"
                style={{ width: `${progressPercent}%` }}
              />
            </View>
            <Value className="text-muted-foreground text-[11px] font-medium min-w-[40px] text-right">
              {challenge.completed}/{challenge.total}
            </Value>
          </View>
        )}
      </View>

      {/* Chevron */}
      <FontAwesome name="chevron-right" size={12} color="#A9A196" />
    </TouchableOpacity>
  );
};

export default ChallengeRow;
