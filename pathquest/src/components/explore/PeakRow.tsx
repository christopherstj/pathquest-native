/**
 * PeakRow
 * 
 * A list item component for displaying a peak in discovery lists.
 * Shows peak name, elevation, location, and summit counts.
 */

import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Check, Users, ChevronRight } from 'lucide-react-native';
import type { Peak } from '@pathquest/shared';
import { getElevationString } from '@pathquest/shared';
import { CardFrame, Text } from '@/src/components/ui';
import { useTheme } from '@/src/theme';

interface PeakRowProps {
  peak: Peak;
  onPress?: (peak: Peak) => void;
  /**
   * Whether this peak has been summited by the current user
   */
  isSummited?: boolean;
}

const PeakRow: React.FC<PeakRowProps> = ({ peak, onPress, isSummited }) => {
  const { colors } = useTheme();
  const handlePress = () => {
    onPress?.(peak);
  };

  // Format location string
  const locationParts = [peak.county, peak.state, peak.country].filter(Boolean);
  const locationString = locationParts.join(', ');

  // Determine summit count display
  const userSummits = peak.summits ?? 0;
  const publicSummits = peak.public_summits ?? 0;
  const hasSummited = isSummited ?? userSummits > 0;

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      style={{ paddingHorizontal: 16, paddingVertical: 8 }}
    >
      <CardFrame topo="corner" seed={`peak-row:${peak.id}`} style={{ padding: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {/* Peak info */}
          <View style={{ flex: 1, marginRight: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text className="text-foreground text-base font-semibold flex-1" numberOfLines={1}>
                {peak.name || 'Unknown Peak'}
              </Text>
              {hasSummited && (
                <View className="flex-row items-center gap-1 bg-summited/20 px-2 py-0.5 rounded-xl">
                  <Check size={10} color={colors.summited as any} />
                  {userSummits > 1 ? (
                    <Text className="text-summited text-[11px] font-semibold">{userSummits}</Text>
                  ) : null}
                </View>
              )}
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
              {peak.elevation !== undefined ? (
                <Text className="text-foreground text-[13px] font-medium">
                  {getElevationString(peak.elevation, 'imperial')}
                </Text>
              ) : null}
              {locationString ? (
                <Text className="text-muted-foreground text-xs flex-1" numberOfLines={1}>
                  {locationString}
                </Text>
              ) : null}
            </View>

            {/* Public summit count */}
            {publicSummits > 0 ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
                <Users size={12} color={colors.mutedForeground as any} />
                <Text className="text-muted-foreground text-[11px]">
                  {publicSummits} {publicSummits === 1 ? 'summit' : 'summits'}
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

export default PeakRow;
