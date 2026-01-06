import React from "react";
import { View } from "react-native";
import {
  Landmark,
  Mountain,
  TreePine,
  Trees,
  Tent,
  Bird,
  Sprout,
  Shield,
  Map,
} from "lucide-react-native";
import type { PublicLand } from "@pathquest/shared";
import { Text } from "@/src/components/ui";
import { useTheme } from "@/src/theme";

/**
 * Icon mapping for different public land designation types.
 * Uses thematic icons to quickly communicate the land type.
 */
const DESIGNATION_ICONS: Record<string, typeof Landmark> = {
  NP: Landmark,    // National Park - iconic landmark
  NM: Mountain,    // National Monument - monument/mountain
  WILD: Trees,     // Wilderness Area - dense forest
  WSA: Trees,      // Wilderness Study Area - forest
  NRA: Tent,       // National Recreation Area - camping
  NCA: Shield,     // National Conservation Area - protected
  NWR: Bird,       // National Wildlife Refuge - wildlife
  NF: TreePine,    // National Forest - conifer tree
  NG: Sprout,      // National Grassland - grassland
  SP: Map,         // State Park - map/park
  SW: Trees,       // State Wilderness - forest
  SRA: Tent,       // State Recreation Area - camping
  SF: TreePine,    // State Forest - tree
};

interface PublicLandBadgeProps {
  publicLand: PublicLand;
  accentColor?: string;
  compact?: boolean;
}

export function PublicLandBadge({ publicLand, accentColor, compact = false }: PublicLandBadgeProps) {
  const { colors, isDark } = useTheme();

  const Icon = DESIGNATION_ICONS[publicLand.type] || Map;
  const color = accentColor || (colors.primary as string);
  const bgColor = `${color}${isDark ? "18" : "12"}`;
  const borderColor = `${color}${isDark ? "40" : "28"}`;

  if (compact) {
    return (
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          paddingHorizontal: 10,
          paddingVertical: 5,
          borderRadius: 8,
          backgroundColor: bgColor as any,
          borderWidth: 1,
          borderColor: borderColor as any,
        }}
      >
        <Icon size={12} color={color as any} />
        <Text style={{ color: color as any }} className="text-xs font-medium" numberOfLines={1}>
          {publicLand.name}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: bgColor as any,
        borderWidth: 1,
        borderColor: borderColor as any,
      }}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: `${color}${isDark ? "28" : "18"}` as any,
        }}
      >
        <Icon size={16} color={color as any} />
      </View>

      <View style={{ flex: 1 }}>
        <Text className="text-foreground text-sm font-semibold" numberOfLines={2}>
          {publicLand.name}
        </Text>
        <Text className="text-muted-foreground text-xs" numberOfLines={1}>
          {publicLand.manager}
        </Text>
      </View>
    </View>
  );
}

