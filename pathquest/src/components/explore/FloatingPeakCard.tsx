/**
 * FloatingPeakCard
 * 
 * Floating card overlay that appears when a peak is selected on the map.
 * Shows peak info, GPS strip, and action buttons.
 * Positioned above the bottom sheet, below the map.
 */

import React from 'react';
import { View, TouchableOpacity, Linking, Platform } from 'react-native';
import { X, Compass, Map } from 'lucide-react-native';
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
  const { colors } = useTheme();
  const translateY = useSharedValue(200); // Start below screen
  const opacity = useSharedValue(0);

  // Entry animation
  React.useEffect(() => {
    translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
    opacity.value = withTiming(1, { duration: 200 });
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
        translateY.value = withSpring(0);
        opacity.value = withSpring(1);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  // Placeholder GPS values - will be real in Phase 2
  const distance = '—';
  const bearing = '—';
  const vertRemaining = '—';

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
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', paddingTop: 6, paddingBottom: 10 }}>
              <View style={{ flex: 1 }}>
                <Text className="text-foreground text-lg font-bold" numberOfLines={1}>
                  {peak.name || 'Unknown Peak'}
                </Text>
                <Text className="text-muted-foreground text-sm mt-0.5">
                  {getElevationString(peak.elevation, 'imperial')} · {locationString}
                </Text>
              </View>

              <TouchableOpacity
                onPress={onClose}
                activeOpacity={0.7}
                style={{
                  width: 34,
                  height: 34,
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

            {/* GPS Strip (Phase 2 placeholder; wired in Peak Detail first) */}
            <View style={{ flexDirection: 'row', gap: 10, paddingBottom: 10 }}>
              <View style={{ flex: 1, backgroundColor: colors.muted as any, borderRadius: 10, paddingVertical: 10, alignItems: 'center' }}>
                <Text className="text-foreground text-base font-semibold">{distance}</Text>
                <Text className="text-muted-foreground text-[10px] mt-0.5">away</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: colors.muted as any, borderRadius: 10, paddingVertical: 10, alignItems: 'center' }}>
                <Text className="text-foreground text-base font-semibold">{bearing}</Text>
                <Text className="text-muted-foreground text-[10px] mt-0.5">bearing</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: colors.muted as any, borderRadius: 10, paddingVertical: 10, alignItems: 'center' }}>
                <Text className="text-foreground text-base font-semibold">{vertRemaining}</Text>
                <Text className="text-muted-foreground text-[10px] mt-0.5">vert</Text>
              </View>
            </View>

            {/* Reports summary */}
            <Text className="text-muted-foreground text-xs mb-3">
              {peak.public_summits ?? 0} people have summited this peak
            </Text>

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

