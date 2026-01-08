/**
 * Skeleton
 *
 * Animated loading placeholder with shimmer effect.
 * Matches the retro topographic aesthetic with warm colors.
 *
 * Variants:
 * - text: Single line of text
 * - circle: Circular avatar placeholder
 * - card: Full card placeholder
 * - stat: Stats box placeholder
 * - rectangle: Generic rectangle
 */

import React, { useEffect } from "react";
import { StyleProp, View, ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/src/theme";

export type SkeletonVariant = "text" | "circle" | "card" | "stat" | "rectangle";

export interface SkeletonProps {
  /** Variant determines the shape and default size */
  variant?: SkeletonVariant;
  /** Custom width (overrides variant default) */
  width?: number | string;
  /** Custom height (overrides variant default) */
  height?: number | string;
  /** Border radius (overrides variant default) */
  borderRadius?: number;
  /** Additional styles */
  style?: StyleProp<ViewStyle>;
  /** Whether to animate (default: true) */
  animate?: boolean;
}

// Variant default dimensions
const VARIANT_DEFAULTS: Record<
  SkeletonVariant,
  { width: number | string; height: number; borderRadius: number }
> = {
  text: { width: "100%", height: 14, borderRadius: 4 },
  circle: { width: 40, height: 40, borderRadius: 9999 },
  card: { width: "100%", height: 120, borderRadius: 12 },
  stat: { width: 80, height: 60, borderRadius: 8 },
  rectangle: { width: "100%", height: 48, borderRadius: 8 },
};

const Skeleton: React.FC<SkeletonProps> = ({
  variant = "rectangle",
  width,
  height,
  borderRadius,
  style,
  animate = true,
}) => {
  const { colors, isDark } = useTheme();
  const defaults = VARIANT_DEFAULTS[variant];

  // Animation value (0 to 1, repeating)
  const shimmerProgress = useSharedValue(0);

  useEffect(() => {
    if (animate) {
      shimmerProgress.value = withRepeat(
        withTiming(1, {
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
        }),
        -1, // Infinite repeat
        false // Don't reverse
      );
    }
  }, [animate, shimmerProgress]);

  // Animated style for shimmer gradient position
  const animatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      shimmerProgress.value,
      [0, 1],
      [-200, 200] // Sweep across
    );

    return {
      transform: [{ translateX }],
    };
  });

  // Colors for shimmer effect (warm tones matching theme)
  const baseColor = isDark ? "rgba(55, 52, 47, 0.8)" : "rgba(224, 217, 206, 0.8)";
  const highlightColor = isDark
    ? "rgba(69, 65, 60, 0.9)"
    : "rgba(232, 225, 212, 0.9)";

  const finalWidth = width ?? defaults.width;
  const finalHeight = height ?? defaults.height;
  const finalBorderRadius = borderRadius ?? defaults.borderRadius;

  return (
    <View
      style={[
        {
          width: finalWidth as any,
          height: finalHeight,
          borderRadius: finalBorderRadius,
          backgroundColor: baseColor,
          overflow: "hidden",
        },
        style,
      ]}
    >
      {animate && (
        <Animated.View
          style={[
            {
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: "200%",
            },
            animatedStyle,
          ]}
        >
          <LinearGradient
            colors={[baseColor, highlightColor, baseColor]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{
              flex: 1,
              width: "100%",
            }}
          />
        </Animated.View>
      )}
    </View>
  );
};

/**
 * SkeletonText - Multiple lines of text skeleton
 */
export interface SkeletonTextProps {
  lines?: number;
  /** Width of the last line (percentage or number) */
  lastLineWidth?: number | string;
  /** Gap between lines */
  gap?: number;
  style?: StyleProp<ViewStyle>;
}

export const SkeletonText: React.FC<SkeletonTextProps> = ({
  lines = 3,
  lastLineWidth = "60%",
  gap = 8,
  style,
}) => {
  return (
    <View style={[{ gap }, style]}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          variant="text"
          width={index === lines - 1 ? lastLineWidth : "100%"}
        />
      ))}
    </View>
  );
};

/**
 * SkeletonCard - Card with header, content, and optional footer
 */
export interface SkeletonCardProps {
  /** Show header row with avatar and title */
  showHeader?: boolean;
  /** Number of content lines */
  contentLines?: number;
  /** Show footer with action buttons */
  showFooter?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  showHeader = true,
  contentLines = 2,
  showFooter = false,
  style,
}) => {
  const { colors } = useTheme();

  return (
    <View
      style={[
        {
          backgroundColor: colors.card as any,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.border as any,
          padding: 16,
          gap: 12,
        },
        style,
      ]}
    >
      {/* Header */}
      {showHeader && (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Skeleton variant="circle" width={36} height={36} />
          <View style={{ flex: 1, gap: 6 }}>
            <Skeleton variant="text" width="50%" height={12} />
            <Skeleton variant="text" width="30%" height={10} />
          </View>
        </View>
      )}

      {/* Content */}
      <SkeletonText lines={contentLines} lastLineWidth="75%" />

      {/* Footer */}
      {showFooter && (
        <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
          <Skeleton variant="rectangle" width={80} height={32} borderRadius={6} />
          <Skeleton variant="rectangle" width={80} height={32} borderRadius={6} />
        </View>
      )}
    </View>
  );
};

/**
 * SkeletonStats - Row of stat cards
 */
export interface SkeletonStatsProps {
  count?: number;
  style?: StyleProp<ViewStyle>;
}

export const SkeletonStats: React.FC<SkeletonStatsProps> = ({
  count = 3,
  style,
}) => {
  const { colors } = useTheme();

  return (
    <View style={[{ flexDirection: "row", gap: 12 }, style]}>
      {Array.from({ length: count }).map((_, index) => (
        <View
          key={index}
          style={{
            flex: 1,
            backgroundColor: colors.card as any,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border as any,
            padding: 12,
            gap: 8,
          }}
        >
          <Skeleton variant="circle" width={32} height={32} borderRadius={8} />
          <Skeleton variant="text" width="70%" height={18} />
          <Skeleton variant="text" width="50%" height={10} />
        </View>
      ))}
    </View>
  );
};

export default Skeleton;

