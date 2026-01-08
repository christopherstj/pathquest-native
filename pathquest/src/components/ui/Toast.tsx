/**
 * Toast
 *
 * A notification toast component that slides in from the top.
 * Features:
 * - Spring-based slide animation
 * - Auto-dismiss with progress indicator
 * - Success/error/info/warning variants
 * - Haptic feedback on show
 */

import React, { useEffect, useCallback } from "react";
import { View, TouchableOpacity, Dimensions } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withSequence,
  runOnJS,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { Text } from "./Text";
import { useTheme } from "@/src/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Spring config for smooth slide
const SPRING_CONFIG = {
  damping: 20,
  stiffness: 300,
  mass: 0.8,
};

export type ToastVariant = "success" | "error" | "info" | "warning";

export interface ToastProps {
  /** Whether the toast is visible */
  visible: boolean;
  /** Toast message */
  message: string;
  /** Optional title */
  title?: string;
  /** Toast variant */
  variant?: ToastVariant;
  /** Auto-dismiss duration in ms (0 = no auto-dismiss) */
  duration?: number;
  /** Called when toast is dismissed */
  onDismiss: () => void;
  /** Whether to show haptic feedback */
  haptic?: boolean;
}

const VARIANT_CONFIG: Record<
  ToastVariant,
  { Icon: LucideIcon; color: string; haptic: Haptics.NotificationFeedbackType }
> = {
  success: {
    Icon: CheckCircle,
    color: "#5B9167",
    haptic: Haptics.NotificationFeedbackType.Success,
  },
  error: {
    Icon: AlertCircle,
    color: "#C44536",
    haptic: Haptics.NotificationFeedbackType.Error,
  },
  info: {
    Icon: Info,
    color: "#4A8BC4",
    haptic: Haptics.NotificationFeedbackType.Success,
  },
  warning: {
    Icon: AlertTriangle,
    color: "#C9915A",
    haptic: Haptics.NotificationFeedbackType.Warning,
  },
};

const Toast: React.FC<ToastProps> = ({
  visible,
  message,
  title,
  variant = "info",
  duration = 4000,
  onDismiss,
  haptic = true,
}) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const config = VARIANT_CONFIG[variant];

  // Animation values
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);
  const progress = useSharedValue(0);

  const triggerHaptic = useCallback(() => {
    if (haptic) {
      Haptics.notificationAsync(config.haptic).catch(() => {});
    }
  }, [haptic, config.haptic]);

  // Show/hide animation
  useEffect(() => {
    if (visible) {
      // Slide in
      translateY.value = withSpring(0, SPRING_CONFIG);
      opacity.value = withTiming(1, { duration: 200 });
      triggerHaptic();

      // Auto-dismiss progress
      if (duration > 0) {
        progress.value = 0;
        progress.value = withTiming(1, { duration }, () => {
          runOnJS(onDismiss)();
        });
      }
    } else {
      // Slide out
      translateY.value = withTiming(-100, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 });
      progress.value = 0;
    }
  }, [visible, duration, translateY, opacity, progress, triggerHaptic, onDismiss]);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${interpolate(progress.value, [0, 1], [100, 0], Extrapolation.CLAMP)}%`,
  }));

  // Use pointerEvents to prevent interaction when hidden
  // The opacity animation will handle visual hiding
  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          top: insets.top + 8,
          left: 16,
          right: 16,
          zIndex: 9999,
        },
        animatedContainerStyle,
      ]}
      pointerEvents={visible ? "auto" : "none"}
    >
      <View
        style={{
          backgroundColor: colors.card,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.border,
          overflow: "hidden",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 8,
        }}
      >
        {/* Content */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            padding: 14,
            gap: 12,
          }}
        >
          {/* Icon */}
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: `${config.color}${isDark ? "22" : "15"}`,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <config.Icon size={20} color={config.color} />
          </View>

          {/* Text */}
          <View style={{ flex: 1 }}>
            {title && (
              <Text
                className="text-sm font-semibold"
                style={{ color: colors.foreground, marginBottom: 2 }}
              >
                {title}
              </Text>
            )}
            <Text
              className="text-sm"
              style={{ color: title ? colors.mutedForeground : colors.foreground }}
              numberOfLines={2}
            >
              {message}
            </Text>
          </View>

          {/* Close button */}
          <TouchableOpacity
            onPress={onDismiss}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: colors.muted,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={14} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        {/* Progress bar (only if auto-dismiss) */}
        {duration > 0 && (
          <Animated.View
            style={[
              {
                height: 3,
                backgroundColor: config.color,
                opacity: 0.6,
              },
              animatedProgressStyle,
            ]}
          />
        )}
      </View>
    </Animated.View>
  );
};

export default Toast;

