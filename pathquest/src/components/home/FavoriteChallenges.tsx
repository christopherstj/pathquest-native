/**
 * FavoriteChallenges
 * 
 * Shows the user's favorite challenges with progress displays.
 * 
 * Styled with retro topographic aesthetic: muted rust/brown tones,
 * layered progress bars, and subtle contour decorations.
 */

import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Check, ChevronRight, Trophy, Target, Mountain, Flag } from 'lucide-react-native';
import type { ChallengeProgress } from '@pathquest/shared';
import { Text } from '@/src/components/ui';
import { useTheme } from '@/src/theme';
import CardFrame from '@/src/components/ui/CardFrame';

interface FavoriteChallengesProps {
  challenges: ChallengeProgress[];
  onChallengePress?: (challenge: ChallengeProgress) => void;
  onViewAllPress?: () => void;
  isLoading?: boolean;
}

interface ChallengeItemProps {
  challenge: ChallengeProgress;
  onPress?: () => void;
  index: number;
}

// Muted earth tone accent colors
const accentColors = [
  '#8B7355', // Trail brown
  '#9B7D52', // Amber rust
  '#7A6B5A', // Warm gray-brown
  '#A08060', // Tan
  '#8A7A65', // Dusty brown
];

const ChallengeItem: React.FC<ChallengeItemProps> = ({ challenge, onPress, index }) => {
  const { colors, isDark } = useTheme();
  const progressPercent = challenge.total > 0 
    ? Math.round((challenge.completed / challenge.total) * 100) 
    : 0;
  const isCompleted = challenge.is_completed || progressPercent === 100;

  const accentColor = isCompleted ? colors.summited : accentColors[index % accentColors.length];

  return (
    <TouchableOpacity
      className="mb-2.5"
      onPress={onPress}
      activeOpacity={0.8}
    >
      <CardFrame
        variant="default"
        topo={isCompleted ? 'corner' : 'none'}
        ridge="none"
        accentColor={accentColor}
        seed={`challenge:${challenge.id}`}
      >

        {/* Main content row */}
        <View className="p-3 flex-row items-center">
          {/* Icon */}
          <View 
            className="w-9 h-9 rounded-lg items-center justify-center"
            style={{ backgroundColor: `${accentColor}${isDark ? '18' : '14'}` }}
          >
            {isCompleted ? (
              <Check size={16} color={accentColor} strokeWidth={3} />
            ) : (
              <Target size={16} color={accentColor} />
            )}
          </View>
          
          {/* Challenge info */}
          <View className="flex-1 ml-3">
            <View className="flex-row items-center">
              <Text 
                style={{ color: colors.foreground }}
                className="text-[15px] font-semibold flex-1" 
                numberOfLines={1}
              >
                {challenge.name}
              </Text>
              {isCompleted && (
                <View 
                  className="px-2 py-0.5 rounded ml-2"
                  style={{ backgroundColor: `${accentColor}${isDark ? '22' : '18'}` }}
                >
                  <Text 
                    style={{ color: accentColor }}
                    className="text-[9px] font-bold uppercase tracking-wide"
                  >
                    Complete
                  </Text>
                </View>
              )}
            </View>
            
            <View className="flex-row items-center mt-1 gap-3">
              <View className="flex-row items-center">
                <Mountain size={10} color={colors.mutedForeground} />
                <Text style={{ color: colors.mutedForeground }} className="text-xs ml-1">
                  {challenge.completed}/{challenge.total}
                </Text>
              </View>
              {!isCompleted && progressPercent > 0 && (
                <View className="flex-row items-center">
                  <Flag size={10} color={accentColor} />
                  <Text style={{ color: accentColor }} className="text-xs font-medium ml-1">
                    {progressPercent}%
                  </Text>
                </View>
              )}
            </View>
          </View>
          
          <ChevronRight size={14} color={colors.mutedForeground} style={{ marginLeft: 8 }} />
        </View>
        
        {/* Progress bar - multiple layered lines for topo effect */}
        <View className="h-2 flex-row" style={{ backgroundColor: isDark ? '#2D2823' : colors.muted }}>
          {/* Background contour lines */}
          <View 
            className="absolute inset-0 flex-row"
            style={{ opacity: 0.3 }}
          >
            {[0.2, 0.4, 0.6, 0.8].map((pos, i) => (
              <View
                key={i}
                style={{
                  position: 'absolute',
                  left: `${pos * 100}%`,
                  top: 0,
                  bottom: 0,
                  width: 1,
                  backgroundColor: colors.contourInkSubtle,
                }}
              />
            ))}
          </View>
          
          {/* Main progress fill */}
          <View 
            style={{ 
              width: `${progressPercent}%`,
              backgroundColor: accentColor,
              opacity: 0.7,
            }}
          />
          
          {/* Highlight line at edge of progress */}
          {progressPercent > 0 && progressPercent < 100 && (
            <View 
              style={{
                width: 2,
                backgroundColor: accentColor,
                opacity: 1,
              }}
            />
          )}
        </View>
      </CardFrame>
    </TouchableOpacity>
  );
};

const FavoriteChallenges: React.FC<FavoriteChallengesProps> = ({
  challenges,
  onChallengePress,
  onViewAllPress,
  isLoading = false,
}) => {
  const { colors, isDark } = useTheme();
  if (isLoading) {
    return (
      <View>
        <View className="flex-row justify-between items-center mb-3">
          <View className="flex-row items-center gap-2">
            <Trophy size={15} color={colors.secondary} />
            <Text style={{ color: colors.foreground }} className="text-base font-bold">
              Your Challenges
            </Text>
          </View>
        </View>
        <View className="gap-2.5">
          {[1, 2].map((i) => (
            <CardFrame
              key={i}
              variant="default"
              topo="corner"
              ridge="none"
              seed={`challenges:skeleton:${i}`}
              style={{ height: 74, opacity: 0.65 }}
            />
          ))}
        </View>
      </View>
    );
  }

  if (challenges.length === 0) {
    return (
      <View>
        <View className="flex-row justify-between items-center mb-3">
          <View className="flex-row items-center gap-2">
            <Trophy size={15} color={colors.secondary} />
            <Text style={{ color: colors.foreground }} className="text-base font-bold">
              Your Challenges
            </Text>
          </View>
        </View>
        <CardFrame
          variant="default"
          topo="corner"
          ridge="none"
          seed="challenges:empty"
          style={{
            borderStyle: 'dashed',
            borderColor: `${colors.secondary}${isDark ? '26' : '33'}` as any,
          }}
        >
          <View className="items-center justify-center p-8">
            <View 
              className="w-12 h-12 rounded-full items-center justify-center mb-3"
              style={{ backgroundColor: `${colors.secondary}${isDark ? '18' : '12'}` }}
            >
              <Trophy size={20} color={colors.secondary} />
            </View>
            <Text style={{ color: colors.foreground }} className="text-base font-semibold mb-1">
              No challenges yet
            </Text>
            <Text 
              style={{ color: colors.mutedForeground }}
              className="text-sm text-center leading-5"
            >
              Explore to find peak lists and challenges to track your progress.
            </Text>
          </View>
        </CardFrame>
      </View>
    );
  }

  return (
    <View>
      <View className="flex-row justify-between items-center mb-3">
        <View className="flex-row items-center gap-2">
          <Trophy size={15} color={colors.secondary} />
          <Text style={{ color: colors.foreground }} className="text-base font-bold">
            Your Challenges
          </Text>
        </View>
        {onViewAllPress && challenges.length > 3 && (
          <TouchableOpacity 
            onPress={onViewAllPress} 
            className="flex-row items-center"
          >
            <Text style={{ color: colors.primary }} className="text-[13px] font-medium mr-1">
              View All
            </Text>
            <ChevronRight size={14} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>
      
      {challenges.slice(0, 5).map((challenge, index) => (
        <ChallengeItem
          key={challenge.id}
          challenge={challenge}
          index={index}
          onPress={() => onChallengePress?.(challenge)}
        />
      ))}
    </View>
  );
};

export default FavoriteChallenges;
