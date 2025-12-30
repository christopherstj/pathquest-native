/**
 * FloatingChallengeCard
 * 
 * Floating card overlay that appears when a challenge is selected on the map.
 * Shows challenge info, progress bar, and action buttons.
 * Positioned above the bottom sheet, below the map.
 */

import React from 'react';
import { View, TouchableOpacity, Linking, Platform } from 'react-native';
import { X, Trophy, MapPin, Map } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
  useSharedValue,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import type { ChallengeProgress } from '@pathquest/shared';
import { Text } from '@/src/components/ui';
import { useAuthStore } from '@/src/lib/auth';

interface FloatingChallengeCardProps {
  challenge: ChallengeProgress;
  onClose: () => void;
  onDetailsPress: () => void;
  nearestPeak?: {
    name: string;
    distance?: string;
    coords?: [number, number];
  };
}

const FloatingChallengeCard: React.FC<FloatingChallengeCardProps> = ({
  challenge,
  onClose,
  onDetailsPress,
  nearestPeak,
}) => {
  const translateY = useSharedValue(200); // Start below screen
  const opacity = useSharedValue(0);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Entry animation
  React.useEffect(() => {
    translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
    opacity.value = withTiming(1, { duration: 200 });
  }, [translateY, opacity]);

  // Calculate progress
  const totalPeaks = challenge.num_peaks ?? 0;
  const summitedPeaks = challenge.summited ?? 0;
  const progressPercent = totalPeaks > 0 
    ? Math.round((summitedPeaks / totalPeaks) * 100)
    : 0;

  // Navigate to nearest unsummited peak
  const handleNavigate = () => {
    if (!nearestPeak?.coords) return;
    
    const [lng, lat] = nearestPeak.coords;
    const label = encodeURIComponent(nearestPeak.name);
    
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${lat},${lng}`,
      android: `geo:${lat},${lng}?q=${lat},${lng}(${label})`,
    });
    
    if (url) {
      Linking.openURL(url).catch(err => 
        console.warn('[FloatingChallengeCard] Error opening maps:', err)
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
            <View className="flex-row items-center gap-2">
              <Trophy size={16} color="#5B9167" />
              <Text className="text-foreground text-lg font-bold" numberOfLines={1}>
                {challenge.name || 'Unknown Challenge'}
              </Text>
            </View>
            <Text className="text-muted-foreground text-sm mt-0.5">
              {totalPeaks} peaks
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

        {/* Progress bar (authenticated only) */}
        {isAuthenticated && (
          <View className="px-4 pb-3">
            <View className="flex-row items-center justify-between mb-1.5">
              <Text className="text-muted-foreground text-xs">Your Progress</Text>
              <Text className="text-foreground text-xs font-semibold">
                {summitedPeaks}/{totalPeaks} ({progressPercent}%)
              </Text>
            </View>
            <View className="h-2 bg-muted rounded-full overflow-hidden">
              <View 
                className="h-full bg-primary rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </View>
          </View>
        )}

        {/* Nearest unsummited peak */}
        {nearestPeak && (
          <View className="px-4 pb-3">
            <Text className="text-muted-foreground text-xs mb-1">
              Nearest unsummited:
            </Text>
            <View className="flex-row items-center gap-2">
              <MapPin size={12} color="#A9A196" />
              <Text className="text-foreground text-sm font-medium">
                {nearestPeak.name}
              </Text>
              {nearestPeak.distance && (
                <Text className="text-muted-foreground text-sm">
                  · {nearestPeak.distance}
                </Text>
              )}
            </View>
          </View>
        )}

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
          
          {nearestPeak?.coords && (
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
          )}
        </View>
      </Animated.View>
    </GestureDetector>
  );
};

export default FloatingChallengeCard;

