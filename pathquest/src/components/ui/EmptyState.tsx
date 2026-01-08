/**
 * EmptyState
 *
 * A consistent empty state component for when there's no content to display.
 * Features:
 * - Icon or custom illustration slot
 * - Title + description
 * - Optional CTA button
 * - Consistent styling with CardFrame
 */

import React from "react";
import { View, StyleProp, ViewStyle } from "react-native";
import type { LucideIcon } from "lucide-react-native";
import { Text } from "./Text";
import CardFrame from "./CardFrame";
import PrimaryCTA from "./PrimaryCTA";
import SecondaryCTA from "./SecondaryCTA";
import { useTheme } from "@/src/theme";

export interface EmptyStateProps {
  /** Icon to display */
  Icon?: LucideIcon;
  /** Custom icon color (defaults to mutedForeground) */
  iconColor?: string;
  /** Title text */
  title: string;
  /** Description text */
  description?: string;
  /** Primary action button */
  primaryAction?: {
    label: string;
    onPress: () => void;
  };
  /** Secondary action button */
  secondaryAction?: {
    label: string;
    onPress: () => void;
  };
  /** Whether to wrap in a CardFrame (default: true) */
  showCard?: boolean;
  /** Custom styles for the container */
  style?: StyleProp<ViewStyle>;
  /** Seed for topo pattern (when using card) */
  seed?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  Icon,
  iconColor,
  title,
  description,
  primaryAction,
  secondaryAction,
  showCard = true,
  style,
  seed = "empty-state",
}) => {
  const { colors, isDark } = useTheme();
  const finalIconColor = iconColor ?? colors.mutedForeground;

  const content = (
    <View style={{ alignItems: "center", padding: 24, gap: 12 }}>
      {/* Icon */}
      {Icon && (
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: `${finalIconColor}${isDark ? "18" : "12"}`,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 4,
          }}
        >
          <Icon size={28} color={finalIconColor} strokeWidth={1.5} />
        </View>
      )}

      {/* Title */}
      <Text
        className="text-base font-semibold text-center"
        style={{ color: colors.foreground }}
      >
        {title}
      </Text>

      {/* Description */}
      {description && (
        <Text
          className="text-sm text-center leading-5"
          style={{ color: colors.mutedForeground, maxWidth: 280 }}
        >
          {description}
        </Text>
      )}

      {/* Actions */}
      {(primaryAction || secondaryAction) && (
        <View style={{ flexDirection: "row", gap: 12, marginTop: 8 }}>
          {secondaryAction && (
            <SecondaryCTA
              label={secondaryAction.label}
              onPress={secondaryAction.onPress}
              style={{ minWidth: 100 }}
            />
          )}
          {primaryAction && (
            <PrimaryCTA
              label={primaryAction.label}
              onPress={primaryAction.onPress}
              style={{ minWidth: 100 }}
            />
          )}
        </View>
      )}
    </View>
  );

  if (showCard) {
    return (
      <CardFrame topo="corner" seed={seed} style={style}>
        {content}
      </CardFrame>
    );
  }

  return <View style={style}>{content}</View>;
};

export default EmptyState;

