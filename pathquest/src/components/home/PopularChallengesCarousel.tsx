/**
 * PopularChallengesCarousel
 * 
 * Horizontal scrolling carousel of popular challenges for guest users.
 * Shows challenge name, region, and peak count to entice exploration.
 */

import React from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { Trophy, Mountain, ChevronRight } from 'lucide-react-native';
import { useTheme } from '@/src/theme';
import { Text, CardFrame, Skeleton } from '@/src/components/ui';
import type { Challenge } from '@pathquest/shared';

interface PopularChallengesCarouselProps {
  challenges: Challenge[];
  isLoading?: boolean;
  onChallengePress?: (challengeId: string) => void;
}

const PopularChallengesCarousel: React.FC<PopularChallengesCarouselProps> = ({
  challenges,
  isLoading = false,
  onChallengePress,
}) => {
  const { colors, isDark } = useTheme();

  if (isLoading) {
    return (
      <View>
        <View className="flex-row items-center gap-2 px-4 mb-3">
          <Trophy size={16} color={colors.statGold} />
          <Text className="text-foreground font-semibold">Popular Challenges</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
        >
          {[1, 2, 3].map((i) => (
            <View key={i} style={{ width: 200 }}>
              <Skeleton variant="card" style={{ height: 100 }} />
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  if (challenges.length === 0) {
    return null;
  }

  return (
    <View>
      <View className="flex-row items-center gap-2 px-4 mb-3">
        <Trophy size={16} color={colors.statGold} />
        <Text className="text-foreground font-semibold">Popular Challenges</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
      >
        {challenges.map((challenge) => (
          <TouchableOpacity
            key={challenge.id}
            activeOpacity={0.8}
            onPress={() => onChallengePress?.(challenge.id)}
            style={{ width: 200 }}
          >
            <CardFrame 
              topo="corner" 
              seed={`popular-challenge:${challenge.id}`}
              style={{ padding: 14 }}
            >
              <View className="flex-row items-start justify-between mb-2">
                <View 
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: `${colors.statGold}20` }}
                >
                  <Trophy size={16} color={colors.statGold} />
                </View>
                <ChevronRight size={16} color={colors.mutedForeground} />
              </View>
              
              <Text 
                className="font-semibold mb-1" 
                style={{ color: colors.foreground }}
                numberOfLines={2}
              >
                {challenge.name}
              </Text>
              
              {challenge.region && (
                <Text 
                  className="text-xs mb-2" 
                  style={{ color: colors.mutedForeground }}
                  numberOfLines={1}
                >
                  {challenge.region}
                </Text>
              )}
              
              <View className="flex-row items-center gap-1.5">
                <Mountain size={12} color={colors.primary} />
                <Text className="text-xs" style={{ color: colors.primary }}>
                  {challenge.num_peaks} peaks
                </Text>
              </View>
            </CardFrame>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

export default PopularChallengesCarousel;

