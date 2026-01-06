/**
 * PeakRow
 * 
 * A list item component for displaying a peak in discovery lists.
 * Shows peak name, elevation, location, and summit counts.
 * Features a retro boy scout medal badge for summited peaks.
 */

import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Users, ChevronRight, Mountain } from 'lucide-react-native';
import Svg, { Circle, Path } from 'react-native-svg';
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

/**
 * SummitMedal - Retro boy scout style merit badge
 * Circular medal with mountain icon and summit count
 */
const SummitMedal: React.FC<{ summitCount: number; size?: number }> = ({ 
  summitCount, 
  size = 44 
}) => {
  const { colors } = useTheme();
  const half = size / 2;
  
  return (
    <View 
      style={{ 
        width: size, 
        height: size, 
        alignItems: 'center', 
        justifyContent: 'center',
      }}
    >
      {/* SVG medal base */}
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Outer ring - softer blue with muted border */}
        <Circle
          cx={half}
          cy={half}
          r={half - 2}
          fill={`${colors.summited}CC`}
          stroke={`${colors.summited}60`}
          strokeWidth={2}
        />
        {/* Inner decorative ring */}
        <Circle
          cx={half}
          cy={half}
          r={half - 6}
          fill="none"
          stroke="rgba(255,255,255,0.25)"
          strokeWidth={1.5}
          strokeDasharray="3 2"
        />
        {/* Center circle */}
        <Circle
          cx={half}
          cy={half}
          r={half - 10}
          fill="rgba(255,255,255,0.1)"
        />
      </Svg>
      
      {/* Content overlay */}
      <View 
        style={{ 
          position: 'absolute',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Mountain icon */}
        <Mountain size={14} color="#fff" strokeWidth={2.5} />
        {/* Summit count */}
        <Text 
          style={{ 
            color: '#fff', 
            fontSize: 10, 
            fontWeight: '800',
            marginTop: 1,
            textShadowColor: 'rgba(0,0,0,0.3)',
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 1,
          }}
        >
          ×{summitCount}
        </Text>
      </View>
    </View>
  );
};

/**
 * UnsummitedBadge - Subtle circular badge for peaks not yet summited
 */
const UnsummitedBadge: React.FC<{ size?: number }> = ({ size = 44 }) => {
  const { colors } = useTheme();
  
  return (
    <View 
      style={{ 
        width: size, 
        height: size, 
        borderRadius: size / 2,
        backgroundColor: colors.muted,
        borderWidth: 2,
        borderColor: colors.border,
        borderStyle: 'dashed',
        alignItems: 'center', 
        justifyContent: 'center',
      }}
    >
      <Mountain size={18} color={colors.mutedForeground} strokeWidth={1.5} />
    </View>
  );
};

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
  const displaySummitCount = Math.max(userSummits, hasSummited ? 1 : 0);

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      style={{ paddingHorizontal: 16, paddingVertical: 8 }}
    >
      <CardFrame 
        topo="corner" 
        seed={`peak-row:${peak.id}`} 
        style={{ padding: 12 }}
        accentColor={hasSummited ? colors.summited : undefined}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {/* Medal / Badge */}
          <View style={{ marginRight: 12 }}>
            {hasSummited ? (
              <SummitMedal summitCount={displaySummitCount} />
            ) : (
              <UnsummitedBadge />
            )}
          </View>

          {/* Peak info */}
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text 
              className="text-foreground text-base font-semibold" 
              numberOfLines={1}
            >
              {peak.name || 'Unknown Peak'}
            </Text>

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
