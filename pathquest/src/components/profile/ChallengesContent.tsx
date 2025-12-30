/**
 * ChallengesContent
 * 
 * Profile Challenges sub-tab showing the user's accepted challenges.
 * Separates into "In Progress" and "Completed" sections.
 */

import React from 'react';
import { View, ScrollView, TouchableOpacity, Text } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import type { ChallengeProgress } from '@pathquest/shared';

interface ChallengesContentProps {
  challenges?: ChallengeProgress[];
  onChallengePress?: (challenge: ChallengeProgress) => void;
  isLoading?: boolean;
}

const ChallengesContent: React.FC<ChallengesContentProps> = ({
  challenges = [],
  onChallengePress,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <View className="p-4 gap-3">
        <View className="h-[100px] rounded-xl bg-muted" />
        <View className="h-[100px] rounded-xl bg-muted" />
      </View>
    );
  }

  if (challenges.length === 0) {
    return (
      <View className="flex-1 items-center justify-center p-8">
        <FontAwesome name="trophy" size={32} color="#A9A196" />
        <Text className="text-foreground text-lg font-semibold mt-4 font-display">
          No challenges yet
        </Text>
        <Text className="text-muted-foreground text-sm mt-2 text-center leading-5">
          Explore challenges and add them to your list to track your progress.
        </Text>
      </View>
    );
  }

  // Separate into in-progress and completed
  const inProgress = challenges.filter(c => !c.is_completed && c.completed < c.total);
  const completed = challenges.filter(c => c.is_completed || c.completed >= c.total);

  return (
    <ScrollView 
      className="flex-1"
      contentContainerClassName="p-4 gap-6 pb-8"
      showsVerticalScrollIndicator={false}
    >
      {/* In Progress Section */}
      {inProgress.length > 0 && (
        <View className="gap-3">
          <Text className="text-foreground text-sm font-semibold uppercase tracking-wide mb-1">
            In Progress ({inProgress.length})
          </Text>
          {inProgress.map((challenge) => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              onPress={() => onChallengePress?.(challenge)}
            />
          ))}
        </View>
      )}

      {/* Completed Section */}
      {completed.length > 0 && (
        <View className="gap-3">
          <Text className="text-foreground text-sm font-semibold uppercase tracking-wide mb-1">
            Completed ({completed.length})
          </Text>
          {completed.map((challenge) => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              onPress={() => onChallengePress?.(challenge)}
              isCompleted
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
};

interface ChallengeCardProps {
  challenge: ChallengeProgress;
  onPress?: () => void;
  isCompleted?: boolean;
}

const ChallengeCard: React.FC<ChallengeCardProps> = ({ 
  challenge, 
  onPress,
  isCompleted = false,
}) => {
  const progressPercent = challenge.total > 0 
    ? Math.round((challenge.completed / challenge.total) * 100) 
    : 0;

  return (
    <TouchableOpacity
      className={`p-4 rounded-xl bg-card border ${isCompleted ? 'border-summited' : 'border-border'}`}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View className="flex-row items-start mb-3">
        <View className="flex-1">
          <Text className="text-foreground text-base font-semibold font-display" numberOfLines={1}>
            {challenge.name}
          </Text>
          {challenge.region && (
            <Text className="text-muted-foreground text-[13px] mt-0.5">
              {challenge.region}
            </Text>
          )}
        </View>
        {isCompleted && (
          <View className="w-7 h-7 rounded-full bg-summited/20 items-center justify-center ml-3">
            <FontAwesome name="check" size={12} color="#4A8BC4" />
          </View>
        )}
      </View>

      <View className="gap-1.5">
        <View className="h-1.5 rounded-sm bg-muted overflow-hidden">
          <View 
            className={`h-full rounded-sm ${isCompleted ? 'bg-summited' : 'bg-primary'}`}
            style={{ width: `${progressPercent}%` }}
          />
        </View>
        <Text className="text-muted-foreground text-xs">
          {challenge.completed}/{challenge.total} peaks
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default ChallengesContent;
