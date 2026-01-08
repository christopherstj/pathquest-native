/**
 * AnimatedPressable
 *
 * A unified pressable component with consistent micro-interactions:
 * - Subtle scale down on press (0.97-0.98)
 * - Opacity shift for visual feedback
 * - Optional haptic feedback
 * - Spring-based animations via Reanimated
 *
 * Use this as the base for all interactive elements to ensure cohesive feel.
 */

import React, { useCallback } from "react";
import { StyleProp, ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
  Extrapolation,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";

// Spring config for snappy, premium feel
const SPRING_CONFIG = {
  damping: 15,
  stiffness: 400,
  mass: 0.8,
};

export type HapticStyle = "light" | "medium" | "heavy" | "selection" | "none";

export interface AnimatedPressableProps {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  /**
   * Scale factor when pressed (0-1). Default: 0.97
   */
  pressScale?: number;
  /**
   * Opacity when pressed (0-1). Default: 0.85
   */
  pressOpacity?: number;
  /**
   * Haptic feedback style. Default: "light"
   */
  haptic?: HapticStyle;
  /**
   * Delay before long press triggers (ms). Default: 500
   */
  longPressDelay?: number;
  /**
   * Hit slop to expand touch area
   */
  hitSlop?: number;
  /**
   * Accessibility label
   */
  accessibilityLabel?: string;
  /**
   * Accessibility hint
   */
  accessibilityHint?: string;
}

const triggerHaptic = (style: HapticStyle) => {
  if (style === "none") return;

  try {
    switch (style) {
      case "light":
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case "medium":
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case "heavy":
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case "selection":
        Haptics.selectionAsync();
        break;
    }
  } catch {
    // Haptics may not be available on all devices
  }
};

const AnimatedPressable: React.FC<AnimatedPressableProps> = ({
  children,
  onPress,
  onLongPress,
  disabled = false,
  style,
  pressScale = 0.97,
  pressOpacity = 0.85,
  haptic = "light",
  longPressDelay = 500,
  hitSlop = 0,
  accessibilityLabel,
  accessibilityHint,
}) => {
  // Shared value for press state (0 = released, 1 = pressed)
  const pressed = useSharedValue(0);

  const handlePress = useCallback(() => {
    if (disabled) return;
    triggerHaptic(haptic);
    onPress?.();
  }, [disabled, haptic, onPress]);

  const handleLongPress = useCallback(() => {
    if (disabled || !onLongPress) return;
    triggerHaptic("medium");
    onLongPress();
  }, [disabled, onLongPress]);

  // Gesture handler
  const tapGesture = Gesture.Tap()
    .enabled(!disabled)
    .hitSlop(hitSlop)
    .onBegin(() => {
      "worklet";
      pressed.value = withSpring(1, SPRING_CONFIG);
    })
    .onFinalize(() => {
      "worklet";
      pressed.value = withSpring(0, SPRING_CONFIG);
    })
    .onEnd(() => {
      "worklet";
      runOnJS(handlePress)();
    });

  // Long press gesture
  const longPressGesture = Gesture.LongPress()
    .enabled(!disabled && !!onLongPress)
    .minDuration(longPressDelay)
    .onStart(() => {
      "worklet";
      runOnJS(handleLongPress)();
    });

  // Compose gestures - tap and long press are exclusive
  const composedGesture = Gesture.Exclusive(longPressGesture, tapGesture);

  // Animated styles
  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      pressed.value,
      [0, 1],
      [1, pressScale],
      Extrapolation.CLAMP
    );
    const opacity = interpolate(
      pressed.value,
      [0, 1],
      [1, pressOpacity],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ scale }],
      opacity: disabled ? 0.5 : opacity,
    };
  });

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View
        style={[style, animatedStyle]}
        accessible
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled }}
      >
        {children}
      </Animated.View>
    </GestureDetector>
  );
};

export default AnimatedPressable;
