/**
 * FavoriteChallenges
 * 
 * Shows the user's favorite challenges with progress bars.
 */

import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import type { ChallengeProgress } from '@pathquest/shared';
import { Text, Value } from '@/src/components/ui';

interface FavoriteChallengesProps {
  challenges: ChallengeProgress[];
  onChallengePress?: (challenge: ChallengeProgress) => void;
  onViewAllPress?: () => void;
  isLoading?: boolean;
}

interface ChallengeItemProps {
  challenge: ChallengeProgress;
  onPress?: () => void;
}

const ChallengeItem: React.FC<ChallengeItemProps> = ({ challenge, onPress }) => {
  const progressPercent = challenge.total > 0 
    ? Math.round((challenge.completed / challenge.total) * 100) 
    : 0;
  const isCompleted = challenge.is_completed || progressPercent === 100;

  return (
    <TouchableOpacity
      className="flex-row items-center py-3 px-4 border-b border-border gap-3"
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View className="flex-1">
        <View className="flex-row items-center gap-2 mb-2">
          <Text className="text-foreground text-[15px] font-medium flex-1" numberOfLines={1}>
            {challenge.name}
          </Text>
          {isCompleted && (
            <View className="bg-summited/20 px-2 py-0.5 rounded-xl">
              <FontAwesome name="check" size={10} color="#4A8BC4" />
            </View>
          )}
        </View>
        
        <View className="flex-row items-center gap-2">
          <View className="flex-1 h-1.5 rounded-sm bg-muted overflow-hidden">
            <View 
              className={`h-full rounded-sm ${isCompleted ? 'bg-summited' : 'bg-primary'}`}
              style={{ width: `${progressPercent}%` }}
            />
          </View>
          <Value className="text-muted-foreground text-xs font-medium min-w-[45px] text-right">
            {challenge.completed}/{challenge.total}
          </Value>
        </View>

        {challenge.lastProgressDate && !isCompleted && (
          <Value className="text-muted-foreground text-[11px] mt-1.5">
            Last progress: {new Date(challenge.lastProgressDate).toLocaleDateString()}
          </Value>
        )}
      </View>
      
      <FontAwesome name="chevron-right" size={12} color="#A9A196" />
    </TouchableOpacity>
  );
};

const FavoriteChallenges: React.FC<FavoriteChallengesProps> = ({
  challenges,
  onChallengePress,
  onViewAllPress,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <View className="rounded-xl border border-border bg-card overflow-hidden">
        <View className="flex-row justify-between items-center p-4 pb-3">
          <Text className="text-foreground text-base font-semibold">Your Challenges</Text>
        </View>
        <View className="p-4 gap-3">
          <View className="h-16 rounded-lg bg-muted" />
          <View className="h-16 rounded-lg bg-muted" />
        </View>
      </View>
    );
  }

  if (challenges.length === 0) {
    return (
      <View className="rounded-xl border border-border bg-card overflow-hidden">
        <View className="flex-row justify-between items-center p-4 pb-3">
          <Text className="text-foreground text-base font-semibold">Your Challenges</Text>
        </View>
        <View className="items-center justify-center p-8">
          <FontAwesome name="trophy" size={24} color="#A9A196" />
          <Text className="text-muted-foreground text-sm mt-3 text-center">
            No challenges yet. Explore to find challenges!
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="rounded-xl border border-border bg-card overflow-hidden">
      <View className="flex-row justify-between items-center p-4 pb-3">
        <Text className="text-foreground text-base font-semibold">Your Challenges</Text>
        {onViewAllPress && challenges.length > 3 && (
          <TouchableOpacity onPress={onViewAllPress}>
            <Text className="text-primary text-[13px] font-medium">View All</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {challenges.slice(0, 5).map((challenge) => (
        <ChallengeItem
          key={challenge.id}
          challenge={challenge}
          onPress={() => onChallengePress?.(challenge)}
        />
      ))}
    </View>
  );
};

export default FavoriteChallenges;
