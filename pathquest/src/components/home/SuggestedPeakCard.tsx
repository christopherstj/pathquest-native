/**
 * SuggestedPeakCard
 * 
 * Hero card for the dashboard showing either:
 * - The closest unclimbed peak from user's challenges (is_fallback: false)
 * - A tall nearby peak to explore (is_fallback: true) - fallback when no challenge peaks nearby
 * 
 * Styled with retro topographic aesthetic: parchment background, mountain ridge
 * silhouette, muted colors, and field-notes style weather display.
 */

import React from 'react';
import { View, TouchableOpacity, Linking, Platform, ActivityIndicator } from 'react-native';
import { 
  Mountain, 
  Navigation,
  Trophy, 
  Compass,
  Sun, 
  Cloud, 
  CloudRain, 
  CloudSnow, 
  CloudFog,
  CloudLightning,
  Wind,
  Thermometer,
  ChevronRight,
  MapPin,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { getElevationString } from '@pathquest/shared';
import { Text } from '@/src/components/ui';
import { useTheme } from '@/src/theme';
import CardFrame from '@/src/components/ui/CardFrame';
import PrimaryCTA from '@/src/components/ui/PrimaryCTA';
import SecondaryCTA from '@/src/components/ui/SecondaryCTA';
import type { SuggestedPeak } from '@pathquest/shared/api';

interface SuggestedPeakCardProps {
  suggestedPeak: SuggestedPeak | null;
  isLoading?: boolean;
  onPeakPress?: (peakId: string) => void;
  onChallengePress?: (challengeId: string) => void;
}

// Map weather icon strings to Lucide icons
const weatherIconMap: Record<string, LucideIcon> = {
  clear: Sun,
  mostly_clear: Sun,
  partly_cloudy: Cloud,
  overcast: Cloud,
  fog: CloudFog,
  drizzle: CloudRain,
  rain: CloudRain,
  heavy_rain: CloudRain,
  freezing_rain: CloudRain,
  snow: CloudSnow,
  heavy_snow: CloudSnow,
  snow_showers: CloudSnow,
  rain_showers: CloudRain,
  thunderstorm: CloudLightning,
  unknown: Cloud,
};

const SuggestedPeakCard: React.FC<SuggestedPeakCardProps> = ({
  suggestedPeak,
  isLoading = false,
  onPeakPress,
  onChallengePress,
}) => {
  const { colors, isDark } = useTheme();

  // Open in maps app
  const handleNavigate = () => {
    if (!suggestedPeak?.peak_coords) return;
    
    const { lat, lng } = suggestedPeak.peak_coords;
    const label = encodeURIComponent(suggestedPeak.peak_name || 'Peak');
    
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${lat},${lng}`,
      android: `geo:${lat},${lng}?q=${lat},${lng}(${label})`,
    });
    
    if (url) {
      Linking.openURL(url).catch(err => 
        console.warn('[SuggestedPeakCard] Error opening maps:', err)
      );
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <CardFrame variant="hero" topo="full" ridge="bottom" seed="suggested:loading">
        <View className="p-6 items-center justify-center" style={{ minHeight: 180 }}>
          <View
            className="w-14 h-14 rounded-full items-center justify-center mb-4"
            style={{ backgroundColor: `${colors.primary}${isDark ? '22' : '18'}` }}
          >
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
          <Text style={{ color: colors.foreground }} className="text-base font-medium">
            Finding your next adventure...
          </Text>
          <Text style={{ color: colors.mutedForeground }} className="text-sm mt-1">
            Checking weather conditions
          </Text>
        </View>
      </CardFrame>
    );
  }

  // No suggestion state
  if (!suggestedPeak) {
    return (
      <CardFrame variant="hero" topo="corner" ridge="bottom" seed="suggested:empty">
        <View className="p-6 items-center">
          <View 
            className="w-14 h-14 rounded-full items-center justify-center mb-4"
            style={{ backgroundColor: `${colors.primary}${isDark ? '18' : '14'}` }}
          >
            <Trophy size={24} color={colors.primary} />
          </View>
          <Text style={{ color: colors.foreground }} className="text-lg font-bold text-center mb-2">
            Start Your Journey
          </Text>
          <Text style={{ color: colors.mutedForeground }} className="text-sm text-center leading-5 px-4">
            Favorite a challenge to see personalized peak suggestions with live weather.
          </Text>
        </View>
      </CardFrame>
    );
  }

  // Get weather icon component
  const WeatherIcon = weatherIconMap[suggestedPeak.weather.conditions_icon] || Cloud;
  
  // is_fallback=false means it's from a challenge, is_fallback=true means it's a nearby explore peak
  const isChallenge = !suggestedPeak.is_fallback;
  const headerLabel = isChallenge ? 'Your Next Summit' : 'Nearby Adventure';
  const HeaderIcon = isChallenge ? Mountain : Compass;

  return (
    <CardFrame
      variant="hero"
      topo="full"
      ridge="bottom"
      seed={`suggested:${isChallenge ? 'challenge' : 'fallback'}`}
      accentColor={isChallenge ? colors.primary : colors.secondary}
    >

      {/* Header label */}
      <View 
        className="px-4 pt-3 pb-2 flex-row items-center"
      >
        <HeaderIcon size={14} color={colors.primary} />
        <Text 
          className="text-xs font-bold ml-2 uppercase tracking-wider"
          style={{ color: colors.primary }}
        >
          {headerLabel}
        </Text>
        <View className="flex-1" />
        <View 
          className="flex-row items-center px-2 py-1 rounded-full"
          style={{ backgroundColor: colors.contourInkSubtle }}
        >
          <MapPin size={10} color={colors.mutedForeground} />
          <Text className="text-[10px] font-medium ml-1" style={{ color: colors.mutedForeground }}>
            {suggestedPeak.distance_miles} mi
          </Text>
        </View>
      </View>

      {/* Peak Info */}
      <TouchableOpacity 
        className="px-4 pt-3 pb-2"
        onPress={() => onPeakPress?.(suggestedPeak.peak_id)}
        activeOpacity={0.7}
      >
        <Text style={{ color: colors.foreground }} className="text-2xl font-bold" numberOfLines={1}>
          {suggestedPeak.peak_name}
        </Text>
        <View className="flex-row items-center gap-2 mt-1">
          <View 
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: colors.primary }}
          />
          <Text style={{ color: colors.mutedForeground }} className="text-sm font-medium">
            {getElevationString(suggestedPeak.peak_elevation, 'imperial')}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Challenge context (only for challenge suggestions) */}
      {isChallenge && suggestedPeak.challenge_id && (
        <TouchableOpacity 
          className="mx-4 mb-3 rounded-lg overflow-hidden"
          onPress={() => onChallengePress?.(suggestedPeak.challenge_id!)}
          activeOpacity={0.7}
          style={{ backgroundColor: `${colors.primary}${isDark ? '18' : '12'}` }}
        >
          <View className="px-3 py-2.5 flex-row items-center">
            <View 
              className="w-7 h-7 rounded items-center justify-center"
              style={{ backgroundColor: `${colors.primary}${isDark ? '22' : '16'}` }}
            >
              <Trophy size={12} color={colors.primary} />
            </View>
            <View className="flex-1 ml-2.5">
              <Text style={{ color: colors.foreground }} className="text-sm font-medium" numberOfLines={1}>
                {suggestedPeak.challenge_name}
              </Text>
            </View>
            <Text style={{ color: colors.primary }} className="text-sm font-semibold mr-1">
              {suggestedPeak.challenge_remaining} left
            </Text>
            <ChevronRight size={14} color={colors.primary} />
          </View>
        </TouchableOpacity>
      )}

      {/* Explore context (for fallback suggestions) */}
      {!isChallenge && (
        <View 
          className="mx-4 mb-3 px-3 py-2.5 rounded-lg"
          style={{ backgroundColor: `${colors.secondary}${isDark ? '18' : '12'}` }}
        >
          <Text style={{ color: colors.mutedForeground }} className="text-sm text-center">
            Great conditions for an adventure today
          </Text>
        </View>
      )}

      {/* Weather - Field Notes Style */}
      <View 
        className="mx-4 mb-4 rounded-lg p-3"
        style={{ 
          backgroundColor: isDark ? '#2D2823' : colors.muted,
          borderWidth: 1,
          borderColor: colors.border as any,
        }}
      >
        <View className="flex-row items-center">
          <View 
            className="w-11 h-11 rounded-lg items-center justify-center"
            style={{ backgroundColor: `${colors.primary}${isDark ? '18' : '12'}` }}
          >
            <WeatherIcon size={22} color={colors.primary} />
          </View>
          <View className="flex-1 ml-3">
            <Text style={{ color: colors.foreground }} className="text-base font-semibold">
              {suggestedPeak.weather.summary}
            </Text>
            <View className="flex-row items-center gap-4 mt-1">
              {suggestedPeak.weather.temp_f !== null && (
                <View className="flex-row items-center">
                  <Thermometer size={11} color={colors.secondary} />
                  <Text style={{ color: colors.mutedForeground }} className="text-sm ml-1">
                    {suggestedPeak.weather.temp_f}°F
                  </Text>
                </View>
              )}
              {suggestedPeak.weather.wind_mph !== null && (
                <View className="flex-row items-center">
                  <Wind size={11} color={colors.secondary} />
                  <Text style={{ color: colors.mutedForeground }} className="text-sm ml-1">
                    {suggestedPeak.weather.wind_mph} mph
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View className="flex-row px-4 pb-4 gap-3">
        <PrimaryCTA
          label="View Details"
          onPress={() => onPeakPress?.(suggestedPeak.peak_id)}
          style={{ flex: 1 }}
        />

        <SecondaryCTA
          label="Navigate"
          onPress={handleNavigate}
          Icon={Navigation}
          style={{ flex: 1 }}
        />
      </View>
    </CardFrame>
  );
};

export default SuggestedPeakCard;
