/**
 * PrimaryCTA
 *
 * Primary call-to-action button with spring-based press animations,
 * dynamic shadow depth, and haptic feedback.
 */

import React, { useCallback } from "react";
import { StyleProp, View, ViewStyle } from "react-native";
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
import type { LucideIcon } from "lucide-react-native";
import { Text } from "./Text";
import { useTheme } from "@/src/theme";

// Spring config for snappy, premium feel
const SPRING_CONFIG = {
  damping: 15,
  stiffness: 400,
  mass: 0.8,
};

export interface PrimaryCTAProps {
  label: string;
  onPress: () => void;
  Icon?: LucideIcon;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Custom background color. Defaults to primary */
  backgroundColor?: string;
  /** Custom foreground color (text/icon). Defaults to primaryForeground */
  foregroundColor?: string;
}

const PrimaryCTA: React.FC<PrimaryCTAProps> = ({
  label,
  onPress,
  Icon,
  disabled,
  style,
  backgroundColor,
  foregroundColor,
}) => {
  const { colors, isDark } = useTheme();
  const bgColor = backgroundColor || colors.primary;
  const textColor = foregroundColor || colors.primaryForeground;

  // Shared value for press state (0 = released, 1 = pressed)
  const pressed = useSharedValue(0);

  const handlePress = useCallback(() => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress();
  }, [disabled, onPress]);

  // Gesture handler
  const gesture = Gesture.Tap()
    .enabled(!disabled)
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

  // Animated container style (scale + shadow)
  const animatedContainerStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      pressed.value,
      [0, 1],
      [1, 0.97],
      Extrapolation.CLAMP
    );
    const translateY = interpolate(
      pressed.value,
      [0, 1],
      [0, 1],
      Extrapolation.CLAMP
    );
    const shadowOpacity = interpolate(
      pressed.value,
      [0, 1],
      [0.35, 0.18],
      Extrapolation.CLAMP
    );
    const shadowRadius = interpolate(
      pressed.value,
      [0, 1],
      [14, 6],
      Extrapolation.CLAMP
    );
    const shadowOffsetY = interpolate(
      pressed.value,
      [0, 1],
      [8, 2],
      Extrapolation.CLAMP
    );
    const elevation = interpolate(
      pressed.value,
      [0, 1],
      [8, 3],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ scale }, { translateY }],
      shadowOffset: { width: 0, height: shadowOffsetY },
      shadowOpacity,
      shadowRadius,
      elevation,
      opacity: disabled ? 0.55 : 1,
    };
  });

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[
          {
            borderRadius: 10,
            overflow: "hidden",
            minHeight: 44,
            shadowColor: bgColor,
          },
          animatedContainerStyle,
          style,
        ]}
        accessible
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled }}
      >
        {/* Background layer */}
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: bgColor,
            borderRadius: 10,
          }}
          pointerEvents="none"
        />

        {/* Subtle top highlight */}
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 1,
            backgroundColor: isDark
              ? "rgba(255,255,255,0.15)"
              : "rgba(255,255,255,0.2)",
          }}
        />

        {/* Content */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            paddingVertical: 12,
            paddingHorizontal: 16,
          }}
        >
          {Icon ? <Icon size={16} color={textColor} /> : null}
          <Text style={{ color: textColor }} className="text-sm font-bold">
            {label}
          </Text>
        </View>
      </Animated.View>
    </GestureDetector>
  );
};

export default PrimaryCTA;
