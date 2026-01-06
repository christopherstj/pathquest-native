import React from "react";
import { View } from "react-native";
import { ScrollView as GHScrollView } from "react-native-gesture-handler";
import {
  Activity,
  ArrowUp,
  Cloud,
  CloudFog,
  CloudRain,
  CloudSnow,
  CloudSun,
  Sun,
  Sunrise,
  Sunset,
  Wind,
} from "lucide-react-native";
import type { PeakForecast } from "@pathquest/shared";
import type { CurrentWeather } from "@pathquest/shared";
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

interface WeatherSectionProps {
  peakId: string;
  weather: CurrentWeather | undefined;
  weatherLoading: boolean;
  forecast: PeakForecast | undefined;
  forecastLoading: boolean;
  recentConditionTags: [string, number][];
}

export function WeatherSection({
  peakId,
  weather,
  weatherLoading,
  forecast,
  forecastLoading,
  recentConditionTags,
}: WeatherSectionProps) {
  const { colors, isDark } = useTheme();

  const iconChipBg = `${colors.secondary}${isDark ? "22" : "18"}`;
  const iconChipBorder = `${colors.secondary}${isDark ? "3A" : "2A"}`;
  const dividerOpacity = isDark ? 0.35 : 0.25;
  const pillBg = `${colors.secondary}${isDark ? "18" : "12"}`;
  const pillBorder = `${colors.secondary}${isDark ? "40" : "2A"}`;

  // Get current weather icon and description
  const currentWeatherInfo = weather?.weatherCode != null ? getWeatherInfo(weather.weatherCode) : null;
  const CurrentWeatherIcon = currentWeatherInfo ? iconMap[currentWeatherInfo.iconKey] : Sun;

  return (
    <View style={{ gap: 12 }}>
      {/* Current Weather Card */}
      <CardFrame topo="corner" seed={`weather:${peakId}`}>
        <View style={{ padding: 14 }}>
          {weatherLoading ? (
            <Text className="text-muted-foreground text-sm">Loading weather…</Text>
          ) : weather ? (
            <View style={{ gap: 10 }}>
              {/* Main weather row */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: iconChipBg as any,
                    borderWidth: 1,
                    borderColor: iconChipBorder as any,
                  }}
                >
                  <CurrentWeatherIcon size={24} color={colors.secondary as any} />
                </View>

                <View style={{ flex: 1 }}>
                  <Text className="text-foreground text-lg font-semibold">
                    {currentWeatherInfo?.description || "Current Conditions"}
                  </Text>
                  <Text className="text-muted-foreground text-sm">
                    {weather.temperature === null
                      ? "—"
                      : `${Math.round(cToF(weather.temperature))}°F`}
                    {weather.feelsLike != null && weather.feelsLike !== weather.temperature
                      ? ` (feels ${Math.round(cToF(weather.feelsLike))}°F)`
                      : ""}
                  </Text>
                </View>
              </View>

              {/* Details row */}
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16 }}>
                {/* Wind */}
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Wind size={14} color={colors.mutedForeground as any} />
                  <Text className="text-muted-foreground text-sm">
                    {weather.windSpeed === null ? "—" : `${Math.round(kmhToMph(weather.windSpeed))} mph`}
                  </Text>
                  {weather.windDirection != null ? (
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
                      }}
                    >
                      <View style={{ transform: [{ rotate: `${normalizeDegrees(weather.windDirection + 180)}deg` }] }}>
                        <ArrowUp size={10} color={colors.mutedForeground as any} />
                      </View>
                    </View>
                  ) : null}
                </View>

                {/* Precip */}
                {weather.precipitationProbability != null ? (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <CloudRain size={14} color={colors.mutedForeground as any} />
                    <Text className="text-muted-foreground text-sm">
                      {Math.round(weather.precipitationProbability)}%
                    </Text>
                  </View>
                ) : null}

                {/* Humidity */}
                {weather.humidity != null ? (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Cloud size={14} color={colors.mutedForeground as any} />
                    <Text className="text-muted-foreground text-sm">{weather.humidity}%</Text>
                  </View>
                ) : null}
              </View>
            </View>
          ) : (
            <Text className="text-muted-foreground text-sm">No weather data available.</Text>
          )}
        </View>

        {/* Accent divider */}
        <View
          pointerEvents="none"
          style={{
            height: 2,
            backgroundColor: colors.secondary as any,
            opacity: dividerOpacity,
          }}
        />
      </CardFrame>

      {/* Forecast Cards */}
      {forecastLoading ? (
        <CardFrame topo="none" seed="forecast-loading" style={{ padding: 14 }}>
          <Text className="text-muted-foreground text-sm">Loading forecast…</Text>
        </CardFrame>
      ) : forecast && forecast.daily.length > 0 ? (
        <View style={{ marginHorizontal: -16 }}>
          <GHScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            nestedScrollEnabled
            contentContainerStyle={{ gap: 10, paddingHorizontal: 16 }}
          >
            {forecast.daily.map((day) => {
              const weatherInfo = getWeatherInfo(day.weatherCode);
              const WeatherIcon = iconMap[weatherInfo.iconKey];
              const rating = getDayRating(day.precipProbability, day.windSpeed, day.cloudCover);
              const ratingColor =
                rating === "good"
                  ? (colors.primary as string)
                  : rating === "fair"
                    ? (colors.secondary as string)
                    : (colors.destructive as string);

              // Parse date
              const dayDate = new Date(day.date + "T12:00:00");
              const today = new Date();
              const isToday =
                dayDate.getFullYear() === today.getFullYear() &&
                dayDate.getMonth() === today.getMonth() &&
                dayDate.getDate() === today.getDate();
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

              // Format sunrise/sunset times (just show hours:minutes)
              const formatTime = (isoTime: string | null) => {
                if (!isoTime) return null;
                const d = new Date(isoTime);
                return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: false });
              };
              const sunriseTime = formatTime(day.sunrise);
              const sunsetTime = formatTime(day.sunset);

              return (
                <CardFrame
                  key={day.date}
                  topo="none"
                  seed={`forecast:${day.date}`}
                  style={{
                    alignItems: "center",
                    padding: 12,
                    minWidth: 90,
                  }}
                >
                  <Text className="text-foreground text-sm font-semibold">{dayName}</Text>
                  <Text className="text-muted-foreground text-[10px]">{dayNum}</Text>
                  <WeatherIcon size={26} color={colors.foreground as any} style={{ marginVertical: 6 }} />

                  {tempHighF != null && tempLowF != null ? (
                    <View style={{ alignItems: "center" }}>
                      <Text className="text-foreground text-base font-bold">{tempHighF}°</Text>
                      <Text className="text-muted-foreground text-xs">{tempLowF}°</Text>
                    </View>
                  ) : null}

                  {/* Precip probability */}
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 3, marginTop: 6 }}>
                    <CloudRain size={12} color={colors.mutedForeground as any} />
                    <Text className="text-muted-foreground text-[10px]">{precipProb}%</Text>
                  </View>

                  {/* Wind speed + direction */}
                  {windMph != null ? (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 3, marginTop: 4 }}>
                      <Wind size={12} color={colors.mutedForeground as any} />
                      <Text className="text-muted-foreground text-[10px]">{windMph} mph</Text>
                      {windToDeg != null ? (
                        <View
                          style={{
                            width: 14,
                            height: 14,
                            borderRadius: 7,
                            backgroundColor: colors.muted as any,
                            alignItems: "center",
                            justifyContent: "center",
                            borderWidth: 1,
                            borderColor: colors.border as any,
                          }}
                        >
                          <View style={{ transform: [{ rotate: `${windToDeg}deg` }] }}>
                            <ArrowUp size={9} color={colors.mutedForeground as any} />
                          </View>
                        </View>
                      ) : null}
                    </View>
                  ) : null}

                  {/* Daylight times */}
                  {sunriseTime && sunsetTime ? (
                    <View style={{ alignItems: "center", marginTop: 6 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                        <Sunrise size={10} color={colors.secondary as any} />
                        <Text className="text-muted-foreground text-[9px]">{sunriseTime}</Text>
                      </View>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                        <Sunset size={10} color={colors.primary as any} />
                        <Text className="text-muted-foreground text-[9px]">{sunsetTime}</Text>
                      </View>
                    </View>
                  ) : null}

                  <WeatherBadge label={rating.toUpperCase()} color={ratingColor} />
                </CardFrame>
              );
            })}
          </GHScrollView>
        </View>
      ) : null}

      {/* Recent Conditions Tags */}
      {recentConditionTags.length > 0 ? (
        <CardFrame topo="none" seed={`recent-conditions:${peakId}`}>
          <View style={{ padding: 14 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <View
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 8,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: iconChipBg as any,
                  borderWidth: 1,
                  borderColor: iconChipBorder as any,
                }}
              >
                <Activity size={14} color={colors.secondary as any} />
              </View>
              <Text className="text-foreground text-sm font-semibold">Recent Conditions</Text>
            </View>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {recentConditionTags.map(([tag, count]) => (
                <View
                  key={tag}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 999,
                    backgroundColor: pillBg as any,
                    borderWidth: 1,
                    borderColor: pillBorder as any,
                  }}
                >
                  <Text className="text-foreground text-xs font-medium">{tag}</Text>
                  <Text className="text-muted-foreground text-[10px]">({count})</Text>
                </View>
              ))}
            </View>
          </View>
        </CardFrame>
      ) : null}
    </View>
  );
}

