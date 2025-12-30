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
import { Text } from '@/src/components/ui';

interface PeakRowProps {
  peak: Peak;
  onPress?: (peak: Peak) => void;
  /**
   * Whether this peak has been summited by the current user
   */
  isSummited?: boolean;
}

const PeakRow: React.FC<PeakRowProps> = ({ peak, onPress, isSummited }) => {
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
      className="flex-row items-center py-3 px-4 border-b border-border"
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Peak info */}
      <View className="flex-1 mr-3">
        <View className="flex-row items-center gap-2">
          <Text 
            className="text-foreground text-base font-semibold flex-1"
            numberOfLines={1}
          >
            {peak.name || 'Unknown Peak'}
          </Text>
          {hasSummited && (
            <View className="flex-row items-center gap-1 bg-summited/20 px-2 py-0.5 rounded-xl">
              <Check size={10} color="#4A8BC4" />
              {userSummits > 1 && (
                <Text className="text-summited text-[11px] font-semibold">
                  {userSummits}
                </Text>
              )}
            </View>
          )}
        </View>

        <View className="flex-row items-center gap-2 mt-0.5">
          {peak.elevation !== undefined && (
            <Text className="text-foreground text-[13px] font-medium">
              {getElevationString(peak.elevation, 'imperial')}
            </Text>
          )}
          {locationString && (
            <Text 
              className="text-muted-foreground text-xs flex-1"
              numberOfLines={1}
            >
              {locationString}
            </Text>
          )}
        </View>

        {/* Public summit count */}
        {publicSummits > 0 && (
          <View className="flex-row items-center gap-1 mt-1">
            <Users size={10} color="#A9A196" />
            <Text className="text-muted-foreground text-[11px]">
              {publicSummits} {publicSummits === 1 ? 'summit' : 'summits'}
            </Text>
          </View>
        )}
      </View>

      {/* Chevron */}
      <ChevronRight size={12} color="#A9A196" />
    </TouchableOpacity>
  );
};

export default PeakRow;
