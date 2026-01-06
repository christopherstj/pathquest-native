import React from "react";
import { View } from "react-native";
import { Cloud, CloudRain, Thermometer } from "lucide-react-native";
import { Text } from "@/src/components/ui";
import { useTheme } from "@/src/theme";
import { cToF } from "@/src/utils";

export type WeatherDisplaySize = "small" | "medium";

export type WeatherDisplayProps = {
  temperatureC?: number | null;
  precipitationMm?: number | null;
  cloudCoverPct?: number | null;
  size?: WeatherDisplaySize;
};

export function WeatherDisplay({
  temperatureC,
  precipitationMm,
  cloudCoverPct,
  size = "small",
}: WeatherDisplayProps) {
  const { colors } = useTheme();

  const tempF = typeof temperatureC === "number" ? Math.round(cToF(temperatureC)) : null;
  const showPrecip = typeof precipitationMm === "number" && precipitationMm > 0;
  const cloudPct = typeof cloudCoverPct === "number" ? Math.round(cloudCoverPct) : null;

  const hasAny = tempF !== null || showPrecip || cloudPct !== null;
  if (!hasAny) return null;

  const iconSize = size === "medium" ? 12 : 11;
  const textClass = size === "medium" ? "text-xs" : "text-[11px]";
  const gap = size === "medium" ? 12 : 10;

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap, marginTop: 6 }}>
      {tempF !== null ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
          <Thermometer size={iconSize} color={colors.mutedForeground as any} />
          <Text className={`text-muted-foreground ${textClass}`}>{tempF}°F</Text>
        </View>
      ) : null}
      {showPrecip ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
          <CloudRain size={iconSize} color={colors.mutedForeground as any} />
          <Text className={`text-muted-foreground ${textClass}`}>{precipitationMm!.toFixed(1)}mm</Text>
        </View>
      ) : null}
      {cloudPct !== null ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
          <Cloud size={iconSize} color={colors.mutedForeground as any} />
          <Text className={`text-muted-foreground ${textClass}`}>{cloudPct}%</Text>
        </View>
      ) : null}
    </View>
  );
}


