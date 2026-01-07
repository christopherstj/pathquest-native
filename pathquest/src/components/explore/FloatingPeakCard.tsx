/**
 * FloatingPeakCard
 * 
 * Floating card overlay that appears when a peak is selected on the map.
 * Shows peak info, GPS strip, and action buttons.
 * Positioned above the bottom sheet, below the map.
 */

import React from 'react';
import { View, TouchableOpacity, Linking, Platform } from 'react-native';
import { X, Compass, Map, Users, Flag } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
  useSharedValue,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import type { Peak } from '@pathquest/shared';
import { getElevationString } from '@pathquest/shared';
import { CardFrame, PrimaryCTA, SecondaryCTA, Text } from '@/src/components/ui';
import { useTheme } from '@/src/theme';

interface FloatingPeakCardProps {
  peak: Peak;
  onClose: () => void;
  onDetailsPress: () => void;
  onCompassPress?: () => void;
}

const FloatingPeakCard: React.FC<FloatingPeakCardProps> = ({
  peak,
  onClose,
  onDetailsPress,
  onCompassPress,
}) => {
  const { colors, isDark } = useTheme();
  const translateY = useSharedValue(200); // Start below screen
  const opacity = useSharedValue(0);

  // Entry animation - quick micro-animation
  React.useEffect(() => {
    translateY.value = withTiming(0, { duration: 150 });
    opacity.value = withTiming(1, { duration: 150 });
  }, [translateY, opacity]);

  // Format location string
  const locationParts = [peak.state, peak.country].filter(Boolean);
  const locationString = locationParts.length > 0 
    ? locationParts.join(', ')
    : 'Unknown location';

  // Open in maps app
  const handleNavigate = () => {
    if (!peak.location_coords) return;
    
    const [lng, lat] = peak.location_coords;
    const label = encodeURIComponent(peak.name || 'Peak');
    
    // Use Apple Maps on iOS, Google Maps on Android
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${lat},${lng}`,
      android: `geo:${lat},${lng}?q=${lat},${lng}(${label})`,
    });
    
    if (url) {
      Linking.openURL(url).catch(err => 
        console.warn('[FloatingPeakCard] Error opening maps:', err)
      );
    }
  };

  // Swipe down to dismiss gesture
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationY > 0) {
        translateY.value = event.translationY;
        opacity.value = 1 - (event.translationY / 200);
      }
    })
    .onEnd((event) => {
      if (event.translationY > 100 || event.velocityY > 500) {
        // Dismiss
        translateY.value = withTiming(300, { duration: 200 });
        opacity.value = withTiming(0, { duration: 200 }, () => {
          runOnJS(onClose)();
        });
      } else {
        // Snap back
        translateY.value = withTiming(0, { duration: 150 });
        opacity.value = withTiming(1, { duration: 150 });
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const userSummits = peak.summits || 0;
  const publicSummits = peak.public_summits || 0;
  const inChallenges = (peak.num_challenges || 0) > 0;

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View 
        style={animatedStyle}
      >
        <CardFrame variant="cta" topo="corner" ridge="bottom" seed={`floating-peak:${peak.id}`} style={{ marginHorizontal: 16 }}>
          {/* Drag handle */}
          <View className="items-center pt-2 pb-1">
            <View className="w-10 h-1 rounded-full bg-muted-foreground/30" />
          </View>

          <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', paddingTop: 6 }}>
              <View style={{ flex: 1, gap: 2 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text className="text-foreground text-lg font-bold flex-1" numberOfLines={1}>
                    {peak.name || 'Unknown Peak'}
                  </Text>
                  {inChallenges && (
                    <View style={{ backgroundColor: `${colors.secondary}30`, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: `${colors.secondary}50` }}>
                      <Text style={{ color: colors.secondary, fontSize: 10, fontWeight: '600' }}>CHALLENGE</Text>
                    </View>
                  )}
                </View>
                <Text className="text-muted-foreground text-sm" numberOfLines={1}>
                  {peak.publicLand?.name ? `${peak.publicLand.name} · ` : ''}{locationString}
                </Text>
                <Text className="text-muted-foreground text-xs mt-0.5">
                  {getElevationString(peak.elevation ?? 0, 'imperial')}
                </Text>
              </View>

              <TouchableOpacity
                onPress={onClose}
                activeOpacity={0.7}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 999,
                  backgroundColor: colors.muted as any,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginLeft: 10,
                }}
              >
                <X size={14} color={colors.mutedForeground as any} />
              </TouchableOpacity>
            </View>

            {/* Stats Badges */}
            <View style={{ flexDirection: 'row', gap: 8, marginVertical: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                <Users size={12} color={colors.mutedForeground as any} />
                <Text className="text-foreground text-xs font-medium">{publicSummits} summits</Text>
              </View>
              
              {userSummits > 0 && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: `${colors.summited}20`, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                  <Flag size={12} color={colors.summited as any} />
                  <Text style={{ color: colors.summited, fontSize: 12, fontWeight: '600' }}>Summited {userSummits > 1 ? `x${userSummits}` : ''}</Text>
                </View>
              )}
            </View>

            {/* Actions */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <PrimaryCTA label="Details" onPress={onDetailsPress} />
              </View>

              {onCompassPress ? (
                <View style={{ flex: 1 }}>
                  <SecondaryCTA label="Compass" onPress={onCompassPress} Icon={Compass} />
                </View>
              ) : null}

              <View style={{ flex: 1 }}>
                <SecondaryCTA label="Navigate" onPress={handleNavigate} Icon={Map} />
              </View>
            </View>
          </View>
        </CardFrame>
      </Animated.View>
    </GestureDetector>
  );
};

export default FloatingPeakCard;

