/**
 * SecondaryCTA
 *
 * Secondary call-to-action button with spring-based press animations,
 * subtle background shift, and haptic feedback.
 */

import React, { useCallback } from "react";
import { StyleProp, View, ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
  interpolateColor,
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

export interface SecondaryCTAProps {
  label: string;
  onPress: () => void;
  Icon?: LucideIcon;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

const SecondaryCTA: React.FC<SecondaryCTAProps> = ({
  label,
  onPress,
  Icon,
  disabled,
  style,
}) => {
  const { colors } = useTheme();

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

  // Animated container style (scale + shadow + background)
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
      [0.1, 0.06],
      Extrapolation.CLAMP
    );
    const shadowRadius = interpolate(
      pressed.value,
      [0, 1],
      [8, 4],
      Extrapolation.CLAMP
    );
    const shadowOffsetY = interpolate(
      pressed.value,
      [0, 1],
      [3, 1],
      Extrapolation.CLAMP
    );
    const elevation = interpolate(
      pressed.value,
      [0, 1],
      [4, 2],
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

  // Animated background style
  const animatedBackgroundStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      pressed.value,
      [0, 1],
      ["transparent", colors.muted as string]
    );

    return {
      backgroundColor,
    };
  });

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[
          {
            borderRadius: 10,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: colors.border as any,
            minHeight: 44,
            shadowColor: "#000",
          },
          animatedContainerStyle,
          style,
        ]}
        accessible
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled }}
      >
        {/* Animated background layer */}
        <Animated.View
          style={[
            {
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: 9, // Slightly smaller to fit inside border
            },
            animatedBackgroundStyle,
          ]}
          pointerEvents="none"
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
          {Icon ? <Icon size={16} color={colors.mutedForeground} /> : null}
          <Text
            style={{ color: colors.mutedForeground }}
            className="text-sm font-semibold"
          >
            {label}
          </Text>
        </View>
      </Animated.View>
    </GestureDetector>
  );
};

export default SecondaryCTA;
