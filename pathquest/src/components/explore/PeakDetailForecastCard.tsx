import React from "react";
import { View } from "react-native";
import { ScrollView as GHScrollView } from "react-native-gesture-handler";
import { ArrowUp, Calendar, Cloud, CloudFog, CloudRain, CloudSnow, CloudSun, Sun, Wind } from "lucide-react-native";
import type { PeakForecast } from "@pathquest/shared";
import { CardFrame, Text } from "@/src/components/ui";
import { useTheme } from "@/src/theme";
import { cToF, getDayRating, getWeatherInfo, kmhToMph, normalizeDegrees } from "@/src/utils";
import { WeatherBadge } from "@/src/components/shared";

const iconMap = {
  sun: Sun,
  cloudSun: CloudSun,
  cloud: Cloud,
  cloudFog: CloudFog,
  cloudRain: CloudRain,
  cloudSnow: CloudSnow,
} as const;

export function PeakDetailForecastCard({
  forecast,
  isLoading,
}: {
  forecast: PeakForecast | null | undefined;
  isLoading?: boolean;
}) {
  const { colors } = useTheme();

  if (isLoading) {
    return (
      <CardFrame topo="none" seed="forecast-loading" style={{ padding: 14 }}>
        <Text className="text-muted-foreground text-sm">Loading forecast…</Text>
      </CardFrame>
    );
  }

  if (!forecast || forecast.daily.length === 0) return null;

  return (
    <View style={{ marginHorizontal: -16 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12, paddingHorizontal: 16 }}>
        <Calendar size={18} color={colors.mutedForeground as any} />
        <Text className="text-foreground text-base font-semibold">7-Day Summit Window</Text>
      </View>

      <GHScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        nestedScrollEnabled={true}
        contentContainerStyle={{ gap: 10, paddingHorizontal: 16 }}
      >
        {forecast.daily.map((day) => {
          const weatherInfo = getWeatherInfo(day.weatherCode);
          const WeatherIcon = iconMap[weatherInfo.iconKey];
          const rating = getDayRating(day.precipProbability, day.windSpeed, day.cloudCover, day.weatherCode, day.tempHigh);
          const ratingColor =
            rating === "great"
              ? (colors.statGold as string)
              : rating === "good"
              ? (colors.primary as string)
              : rating === "fair"
              ? (colors.secondary as string)
              : (colors.destructive as string);

          // Parse date as local date (YYYY-MM-DD format from API) using midday to avoid TZ boundary issues.
          const dayDate = new Date(day.date + "T12:00:00");
          const today = new Date();
          const isToday =
            dayDate.getFullYear() === today.getFullYear() && dayDate.getMonth() === today.getMonth() && dayDate.getDate() === today.getDate();
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          const isTomorrow =
            dayDate.getFullYear() === tomorrow.getFullYear() &&
            dayDate.getMonth() === tomorrow.getMonth() &&
            dayDate.getDate() === tomorrow.getDate();
          const dayName = isToday ? "Today" : isTomorrow ? "Tmrw" : dayDate.toLocaleDateString("en-US", { weekday: "short" });
          const dayNum = dayDate.getDate();

          const tempHighF = day.tempHigh != null ? Math.round(cToF(day.tempHigh)) : null;
          const tempLowF = day.tempLow != null ? Math.round(cToF(day.tempLow)) : null;
          const precipProb = day.precipProbability ?? 0;
          const windMph = day.windSpeed != null ? Math.round(kmhToMph(day.windSpeed)) : null;
          const windToDeg = day.windDirection != null ? normalizeDegrees(day.windDirection + 180) : null;

          return (
            <CardFrame
              key={day.date}
              topo="none"
              seed={`forecast-day:${day.date}`}
              style={{
                alignItems: "center",
                padding: 12,
                minWidth: 85,
              }}
            >
              <Text className="text-foreground text-sm font-semibold">{dayName}</Text>
              <Text className="text-muted-foreground text-xs">{dayNum}</Text>
              <WeatherIcon size={28} color={colors.foreground as any} style={{ marginVertical: 8 }} />

              {tempHighF != null && tempLowF != null ? (
                <View style={{ alignItems: "center" }}>
                  <Text className="text-foreground text-base font-bold">{tempHighF}°</Text>
                  <Text className="text-muted-foreground text-xs">{tempLowF}°</Text>
                </View>
              ) : null}

              <View style={{ flexDirection: "row", alignItems: "center", gap: 3, marginTop: 6 }}>
                <CloudRain size={12} color={colors.mutedForeground as any} />
                <Text className="text-muted-foreground text-xs">{precipProb}%</Text>
              </View>

              {windMph != null ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 }}>
                  <Wind size={12} color={colors.mutedForeground as any} />
                  <Text className="text-muted-foreground text-xs">{windMph} mph</Text>
                  {windToDeg == null ? null : (
                    <View
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 8,
                        backgroundColor: colors.muted as any,
                        alignItems: "center",
                        justifyContent: "center",
                        borderWidth: 1,
                        borderColor: colors.border as any,
                        marginLeft: 2,
                      }}
                    >
                      <View style={{ transform: [{ rotate: `${windToDeg}deg` }] }}>
                        <ArrowUp size={11} color={colors.mutedForeground as any} />
                      </View>
                    </View>
                  )}
                </View>
              ) : null}

              <WeatherBadge label={rating.toUpperCase()} color={ratingColor} />
            </CardFrame>
          );
        })}
      </GHScrollView>
    </View>
  );
}


