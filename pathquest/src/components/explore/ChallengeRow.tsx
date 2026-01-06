/**
 * ChallengeRow
 * 
 * A list item component for displaying a challenge in discovery lists.
 * Shows challenge name, region, peak count, and progress if available.
 */

import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { BadgeCheck, Check, ChevronRight, Flag } from 'lucide-react-native';
import type { ChallengeProgress } from '@pathquest/shared';
import { CardFrame, Text } from '@/src/components/ui';
import { useTheme } from '@/src/theme';

interface ChallengeRowProps {
  challenge: ChallengeProgress;
  onPress?: (challenge: ChallengeProgress) => void;
}

const ChallengeRow: React.FC<ChallengeRowProps> = ({ challenge, onPress }) => {
  const { colors, isDark } = useTheme();
  const handlePress = () => {
    onPress?.(challenge);
  };

  const total = challenge.total > 0 ? challenge.total : (challenge.num_peaks ?? 0);
  const completed = Math.max(0, challenge.completed ?? 0);

  // Calculate progress percentage
  const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;
  const isCompleted = challenge.is_completed || (total > 0 && progressPercent === 100);
  const isAccepted = !!challenge.is_favorited && !isCompleted;

  // Accent colors: tan for accepted, blue for completed, green otherwise
  const accentColor = isCompleted
    ? (colors.summited as string)
    : isAccepted
      ? (colors.secondary as string)
      : (colors.primary as string);

  // Card tint wash for accepted/completed challenges
  const cardWash = isAccepted
    ? `${colors.secondary}${isDark ? '0C' : '08'}`
    : isCompleted
      ? `${colors.summited}${isDark ? '0C' : '08'}`
      : undefined;

  const cardBorder = isAccepted
    ? `${colors.secondary}${isDark ? '30' : '20'}`
    : isCompleted
      ? `${colors.summited}${isDark ? '30' : '20'}`
      : undefined;

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      style={{ paddingHorizontal: 16, paddingVertical: 8 }}
    >
      <CardFrame
        topo="corner"
        seed={`challenge-row:${challenge.id}`}
        accentColor={accentColor}
        style={{
          padding: 12,
          backgroundColor: cardWash ?? (colors.card as any),
          borderColor: cardBorder ?? (colors.border as any),
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {/* Challenge info */}
          <View style={{ flex: 1, marginRight: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text className="text-foreground text-base font-semibold flex-1" numberOfLines={1}>
                {challenge.name || 'Unknown Challenge'}
              </Text>
              {isCompleted ? (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 999,
                    backgroundColor: `${colors.summited}20` as any,
                    borderWidth: 1,
                    borderColor: `${colors.summited}3A` as any,
                  }}
                >
                  <BadgeCheck size={12} color={colors.summited as any} />
                  <Text style={{ color: colors.summited as any }} className="text-[10px] font-semibold">
                    Completed
                  </Text>
                </View>
              ) : isAccepted ? (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 999,
                    backgroundColor: `${colors.secondary}18` as any,
                    borderWidth: 1,
                    borderColor: `${colors.secondary}3A` as any,
                  }}
                >
                  <Flag size={12} color={colors.secondary as any} />
                  <Text style={{ color: colors.secondary as any }} className="text-[10px] font-semibold">
                    Accepted
                  </Text>
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
                {challenge.num_peaks ?? total} peaks
              </Text>
            </View>

            {/* Progress bar (always show when we know total) */}
            {total > 0 ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 }}>
                <View className="flex-1 h-1.5 rounded-sm bg-muted overflow-hidden">
                  <View className="h-full rounded-sm" style={{ width: `${progressPercent}%`, backgroundColor: accentColor }} />
                </View>
                <Text className="text-muted-foreground text-[11px] font-medium min-w-[48px] text-right">
                  {Math.min(completed, total)}/{total}
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
