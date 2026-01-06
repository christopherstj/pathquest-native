import React from "react";
import { View } from "react-native";
import { Sun, Sunrise, Sunset } from "lucide-react-native";
import type { PeakForecast } from "@pathquest/shared";
import { CardFrame, Text } from "@/src/components/ui";
import { useTheme } from "@/src/theme";

export function PeakDetailDaylightCard({ forecast }: { forecast: PeakForecast | null | undefined }) {
  const { colors } = useTheme();
  if (!forecast || (!forecast.sunrise && !forecast.sunset)) return null;

  return (
    <CardFrame topo="corner" seed="daylight" style={{ padding: 14 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <Sun size={18} color={colors.mutedForeground as any} />
        <Text className="text-foreground text-base font-semibold">Today's Daylight</Text>
      </View>

      <View style={{ flexDirection: "row", justifyContent: "space-around", alignItems: "center" }}>
        {forecast.sunrise ? (
          <View style={{ alignItems: "center" }}>
            <Sunrise size={20} color={colors.secondary as any} />
            <Text className="text-foreground text-sm font-medium mt-1">
              {new Date(forecast.sunrise).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
            </Text>
            <Text className="text-muted-foreground text-[10px]">Sunrise</Text>
          </View>
        ) : null}

        {forecast.daylightSeconds ? (
          <View style={{ alignItems: "center" }}>
            <Text className="text-foreground text-lg font-bold">
              {Math.floor(forecast.daylightSeconds / 3600)}h {Math.round((forecast.daylightSeconds % 3600) / 60)}m
            </Text>
            <Text className="text-muted-foreground text-[10px]">Daylight</Text>
          </View>
        ) : null}

        {forecast.sunset ? (
          <View style={{ alignItems: "center" }}>
            <Sunset size={20} color={colors.primary as any} />
            <Text className="text-foreground text-sm font-medium mt-1">
              {new Date(forecast.sunset).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
            </Text>
            <Text className="text-muted-foreground text-[10px]">Sunset</Text>
          </View>
        ) : null}
      </View>
    </CardFrame>
  );
}


