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
import { Text } from '@/src/components/ui';

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
        className="bg-card/95 rounded-2xl mx-4 border border-border overflow-hidden"
      >
        {/* Drag handle */}
        <View className="items-center pt-2 pb-1">
          <View className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </View>

        {/* Header */}
        <View className="flex-row items-start px-4 pb-3">
          <View className="flex-1">
            <Text className="text-foreground text-lg font-bold" numberOfLines={1}>
              {peak.name || 'Unknown Peak'}
            </Text>
            <Text className="text-muted-foreground text-sm mt-0.5">
              {getElevationString(peak.elevation, 'imperial')} · {locationString}
            </Text>
          </View>
          
          {/* Close button */}
          <TouchableOpacity
            className="w-8 h-8 rounded-full bg-muted items-center justify-center ml-2"
            onPress={onClose}
            activeOpacity={0.7}
          >
            <X size={14} color="#A9A196" />
          </TouchableOpacity>
        </View>

        {/* GPS Strip - Placeholder for Phase 2 */}
        <View className="flex-row px-4 pb-3 gap-2">
          <View className="flex-1 bg-muted rounded-lg py-2 items-center">
            <Text className="text-foreground text-base font-semibold">{distance}</Text>
            <Text className="text-muted-foreground text-[10px] mt-0.5">away</Text>
          </View>
          <View className="flex-1 bg-muted rounded-lg py-2 items-center">
            <Text className="text-foreground text-base font-semibold">{bearing}</Text>
            <Text className="text-muted-foreground text-[10px] mt-0.5">bearing</Text>
          </View>
          <View className="flex-1 bg-muted rounded-lg py-2 items-center">
            <Text className="text-foreground text-base font-semibold">{vertRemaining}</Text>
            <Text className="text-muted-foreground text-[10px] mt-0.5">vert</Text>
          </View>
        </View>

        {/* Reports summary */}
        <View className="px-4 pb-3">
          <Text className="text-muted-foreground text-xs">
            {peak.public_summits ?? 0} people have summited this peak
          </Text>
        </View>

        {/* Actions */}
        <View className="flex-row px-4 pb-4 gap-2">
          <TouchableOpacity
            className="flex-1 bg-primary py-3 rounded-lg items-center"
            onPress={onDetailsPress}
            activeOpacity={0.8}
          >
            <Text className="text-primary-foreground text-sm font-semibold">
              Details
            </Text>
          </TouchableOpacity>
          
          {onCompassPress && (
            <TouchableOpacity
              className="flex-1 bg-muted py-3 rounded-lg items-center flex-row justify-center gap-1.5"
              onPress={onCompassPress}
              activeOpacity={0.7}
            >
              <Compass size={14} color="#A9A196" />
              <Text className="text-muted-foreground text-sm font-medium">
                Compass
              </Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            className="flex-1 bg-muted py-3 rounded-lg items-center flex-row justify-center gap-1.5"
            onPress={handleNavigate}
            activeOpacity={0.7}
          >
            <Map size={14} color="#A9A196" />
            <Text className="text-muted-foreground text-sm font-medium">
              Navigate
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </GestureDetector>
  );
};

export default FloatingPeakCard;

