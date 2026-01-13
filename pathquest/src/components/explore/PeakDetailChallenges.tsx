import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import { Trophy, ChevronRight, Mountain } from 'lucide-react-native';
import { Text, CardFrame } from '@/src/components/ui';
import { useTheme } from '@/src/theme';
import type { Challenge } from '@pathquest/shared';

interface PeakDetailChallengesProps {
  challenges?: Challenge[];
  isLoading?: boolean;
}

export function PeakDetailChallenges({ challenges = [], isLoading = false }: PeakDetailChallengesProps) {
  const { colors } = useTheme();
  const router = useRouter();

  if (isLoading) {
    return (
      <View className="px-4 mt-4">
        <View className="h-16 rounded-xl bg-muted animate-pulse" />
      </View>
    );
  }

  if (!challenges || challenges.length === 0) {
    return null;
  }

  const handlePress = (challengeId: string) => {
    router.push({
      pathname: '/explore/challenge/[challengeId]',
      params: { challengeId },
    });
  };

  return (
    <View className="mt-4">
      {/* NOTE: PeakDetail already applies padding: 16 on the parent scroll view.
          Keep this section flush with that baseline (no extra side padding here). */}
      {!isLoading && challenges.length > 0 && (
        <View 
          className="mb-1 flex-row items-center gap-1.5"
          style={{ backgroundColor: 'transparent' }}
        >
          <Trophy size={11} color={colors.primary} />
          <Text 
            className="text-[9px] uppercase tracking-widest font-medium"
            style={{ color: colors.mutedForeground }}
          >
            Included in {challenges.length} Challenge{challenges.length !== 1 ? 's' : ''}
          </Text>
        </View>
      )}

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        nestedScrollEnabled
        directionalLockEnabled
        contentContainerStyle={{ flexDirection: 'row' }}
      >
        {challenges.map((challenge, idx) => (
          <TouchableOpacity
            key={challenge.id}
            activeOpacity={0.7}
            onPress={() => handlePress(challenge.id)}
            style={{ marginRight: idx === challenges.length - 1 ? 0 : 12 }}
          >
            <CardFrame
              variant="default"
              topo="corner"
              seed={`challenge-chip-${challenge.id}`}
              style={{ padding: 0, overflow: 'hidden', width: 220 }}
            >
              <View className="p-3">
                <View className="flex-row items-start justify-between gap-2">
                  <View className="flex-1">
                    <Text 
                      className="text-sm font-semibold leading-tight mb-1"
                      style={{ color: colors.foreground }}
                      numberOfLines={2}
                    >
                      {challenge.name}
                    </Text>
                    
                    <View className="flex-row items-center gap-3">
                      <View className="flex-row items-center gap-1">
                        <Mountain size={10} color={colors.mutedForeground} />
                        <Text className="text-[10px]" style={{ color: colors.mutedForeground }}>
                          {challenge.num_peaks} peaks
                        </Text>
                      </View>
                      
                      {challenge.region && (
                        <Text className="text-[10px]" style={{ color: colors.mutedForeground }} numberOfLines={1}>
                          • {challenge.region}
                        </Text>
                      )}
                    </View>
                  </View>
                  
                  <View 
                    className="w-6 h-6 rounded-full items-center justify-center"
                    style={{ backgroundColor: `${colors.primary}15` }}
                  >
                    <ChevronRight size={14} color={colors.primary} />
                  </View>
                </View>
              </View>
            </CardFrame>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

