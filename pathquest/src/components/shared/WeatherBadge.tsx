import React from "react";
import { View } from "react-native";
import { Text } from "@/src/components/ui";

export type WeatherBadgeProps = {
  label: string;
  color: string;
};

export function WeatherBadge({ label, color }: WeatherBadgeProps) {
  return (
    <View
      style={{
        marginTop: 8,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 999,
        backgroundColor: `${color}20`,
      }}
    >
      <Text style={{ color, fontSize: 10, fontWeight: "600" }}>{label}</Text>
    </View>
  );
}


