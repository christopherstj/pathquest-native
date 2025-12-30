/**
 * TripReportCTA
 * 
 * A call-to-action card encouraging users to write a trip report
 * for their most recent unreported summit.
 * 
 * Styled with retro topographic aesthetic: faded blue ink color,
 * subtle contour lines, and field-journal feel.
 */

import React from 'react';
import { View } from 'react-native';
import { Pencil, Camera, Mountain } from 'lucide-react-native';
import { Text } from '@/src/components/ui';
import { useTheme } from '@/src/theme';
import CardFrame from '@/src/components/ui/CardFrame';
import PrimaryCTA from '@/src/components/ui/PrimaryCTA';
import { formatDistanceToNowStrict } from 'date-fns';

interface Summit {
  peakId: string;
  peakName: string;
  timestamp: string;
  elevation?: number;
}

interface TripReportCTAProps {
  summit: Summit;
  onPress: () => void;
}

const TripReportCTA: React.FC<TripReportCTAProps> = ({ summit, onPress }) => {
  const { colors, isDark } = useTheme();
  const timeAgo = formatDistanceToNowStrict(new Date(summit.timestamp), { addSuffix: true });
  // “Old ink” summit-blue accent
  const accentColor = colors.summited;
  const accentBg = `${colors.summited}${isDark ? '18' : '14'}`;

  return (
    <CardFrame
      variant="cta"
      topo="corner"
      ridge="bottom"
      seed="trip-report"
      accentColor={accentColor}
    >
      {/* Top label bar */}
      <View 
        className="px-4 pt-3 pb-2 flex-row items-center"
      >
        <Mountain size={12} color={accentColor} />
        <Text 
          className="text-[10px] font-bold ml-1.5 uppercase tracking-wider"
          style={{ color: accentColor }}
        >
          Recent Summit
        </Text>
      </View>

      {/* Main content */}
      <View className="px-4 pb-3">
        <View className="flex-row items-center mb-3">
          {/* Icon Container */}
          <View 
            className="w-12 h-12 rounded-lg items-center justify-center"
            style={{ backgroundColor: accentBg }}
          >
            <Pencil size={20} color={accentColor} />
          </View>

          {/* Content */}
          <View className="flex-1 ml-3">
            <Text style={{ color: colors.foreground }} className="text-lg font-bold" numberOfLines={1}>
              {summit.peakName}
            </Text>
            <Text style={{ color: colors.mutedForeground }} className="text-sm mt-0.5">
              Summited {timeAgo}
            </Text>
          </View>
        </View>

        {/* Blue CTA - Most clickable thing */}
        <PrimaryCTA
          label="Add Trip Report"
          onPress={onPress}
          Icon={Camera}
          backgroundColor={accentColor}
          foregroundColor={colors.summitedForeground}
          style={{
            shadowColor: accentColor as any,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.4,
            shadowRadius: 16,
            elevation: 10,
          }}
        />
      </View>

      {/* Bottom accent line */}
      <View style={{ height: 2, backgroundColor: accentColor, opacity: 0.3 }} />
    </CardFrame>
  );
};

export default TripReportCTA;
