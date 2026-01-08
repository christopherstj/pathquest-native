/**
 * FloatingChallengeCard
 * 
 * Floating card overlay that appears when a challenge is selected on the map.
 * Shows challenge info, progress bar, and action buttons.
 * Positioned above the bottom sheet, below the map.
 */

import React from 'react';
import { View, TouchableOpacity } from 'react-native';
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
import { CardFrame, PrimaryCTA, SecondaryCTA, Text } from '@/src/components/ui';
import { useAuthStore } from '@/src/lib/auth';
import { useTheme } from '@/src/theme';
import { useMapNavigation } from '@/src/hooks';

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
  const { colors } = useTheme();
  const { openInMaps } = useMapNavigation();

  // Entry animation
  React.useEffect(() => {
    translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
    opacity.value = withTiming(1, { duration: 200 });
  }, [translateY, opacity]);

  // Calculate progress
  const totalPeaks = challenge.num_peaks ?? challenge.total ?? 0;
  const summitedPeaks = challenge.completed ?? 0;
  const progressPercent = totalPeaks > 0 
    ? Math.round((summitedPeaks / totalPeaks) * 100)
    : 0;

  // Navigate to nearest unsummited peak
  const handleNavigate = () => {
    if (!nearestPeak?.coords) return;
    openInMaps(nearestPeak.coords, nearestPeak.name);
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
        // Snap back - consistent spring config
        translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
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
      >
        <CardFrame variant="cta" topo="corner" ridge="bottom" seed={`floating-challenge:${challenge.id}`} style={{ marginHorizontal: 16 }}>
          {/* Drag handle */}
          <View className="items-center pt-2 pb-1">
            <View className="w-10 h-1 rounded-full bg-muted-foreground/30" />
          </View>

          <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', paddingTop: 6, paddingBottom: 10 }}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Trophy size={16} color={colors.primary as any} />
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

            {/* Progress bar (authenticated only) */}
            {isAuthenticated ? (
              <View style={{ paddingBottom: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text className="text-muted-foreground text-xs">Your Progress</Text>
                  <Text className="text-foreground text-xs font-semibold">
                    {summitedPeaks}/{totalPeaks} ({progressPercent}%)
                  </Text>
                </View>
                <View className="h-2 bg-muted rounded-full overflow-hidden">
                  <View className="h-full bg-primary rounded-full" style={{ width: `${progressPercent}%` }} />
                </View>
              </View>
            ) : null}

            {/* Nearest unsummited peak */}
            {nearestPeak ? (
              <View style={{ paddingBottom: 12 }}>
                <Text className="text-muted-foreground text-xs mb-1">Nearest unsummited:</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <MapPin size={12} color={colors.mutedForeground as any} />
                  <Text className="text-foreground text-sm font-medium">
                    {nearestPeak.name}
                  </Text>
                  {nearestPeak.distance ? (
                    <Text className="text-muted-foreground text-sm">· {nearestPeak.distance}</Text>
                  ) : null}
                </View>
              </View>
            ) : null}

            {/* Actions */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <PrimaryCTA label="Details" onPress={onDetailsPress} />
              </View>

              {nearestPeak?.coords ? (
                <View style={{ flex: 1 }}>
                  <SecondaryCTA label="Navigate" onPress={handleNavigate} Icon={Map} />
                </View>
              ) : null}
            </View>
          </View>
        </CardFrame>
      </Animated.View>
    </GestureDetector>
  );
};

export default FloatingChallengeCard;

