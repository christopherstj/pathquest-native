import React from "react";
import { View } from "react-native";
import { Activity, ArrowUp, CloudSun, FileText } from "lucide-react-native";
import type { PeakForecast, Summit } from "@pathquest/shared";
import type { CurrentWeather } from "@pathquest/shared";
import { CardFrame, Text } from "@/src/components/ui";
import { useTheme } from "@/src/theme";
import { cToF, kmhToMph, normalizeDegrees } from "@/src/utils";
import { SummitCard } from "@/src/components/shared";
import { PeakDetailForecastCard } from "./PeakDetailForecastCard";
import { PeakDetailDaylightCard } from "./PeakDetailDaylightCard";

export function PeakDetailConditionsTab({
  peakId,
  weather,
  weatherLoading,
  forecast,
  forecastLoading,
  recentConditionTags,
  recentReportsWithNotes,
  publicSummitsLoading,
  publicSummitsCount,
}: {
  peakId: string;
  weather: CurrentWeather | undefined;
  weatherLoading: boolean;
  forecast: PeakForecast | undefined;
  forecastLoading: boolean;
  recentConditionTags: [string, number][];
  recentReportsWithNotes: (Summit & { user_id?: string; user_name?: string })[];
  publicSummitsLoading: boolean;
  publicSummitsCount: number;
}) {
  const { colors, isDark } = useTheme();

  const iconChipBg = `${colors.secondary}${isDark ? "22" : "18"}`;
  const iconChipBorder = `${colors.secondary}${isDark ? "3A" : "2A"}`;
  const dividerOpacity = isDark ? 0.35 : 0.25;
  const pillBg = `${colors.secondary}${isDark ? "18" : "12"}`;
  const pillBorder = `${colors.secondary}${isDark ? "40" : "2A"}`;

  return (
    <View style={{ gap: 12 }}>
      {/* Weather card */}
      <CardFrame topo="corner" seed={`conditions:${peakId}`}>
        <View style={{ padding: 14 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View
              style={{
                width: 30,
                height: 30,
                borderRadius: 10,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: iconChipBg as any,
                borderWidth: 1,
                borderColor: iconChipBorder as any,
              }}
            >
              <CloudSun size={16} color={colors.secondary as any} />
            </View>
            <Text className="text-foreground text-base font-semibold">Current Weather</Text>
          </View>

          {weatherLoading ? (
            <Text className="text-muted-foreground text-sm mt-3">Loading weather…</Text>
          ) : weather ? (
            <View style={{ marginTop: 12, gap: 8 }}>
              <Text className="text-muted-foreground text-sm">
                Temp:{" "}
                <Text className="text-foreground">{weather.temperature === null ? "—" : `${Math.round(cToF(weather.temperature))}°F`}</Text>
                {weather.feelsLike === null ? "" : ` (feels like ${Math.round(cToF(weather.feelsLike))}°F)`}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap" }}>
                <Text className="text-muted-foreground text-sm">Wind: </Text>
                <Text className="text-foreground text-sm">
                  {weather.windSpeed === null ? "—" : `${Math.round(kmhToMph(weather.windSpeed))} mph`}
                </Text>
                {weather.windDirection === null ? null : (
                  <View
                    style={{
                      marginLeft: 8,
                      width: 18,
                      height: 18,
                      borderRadius: 9,
                      backgroundColor: colors.muted as any,
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 1,
                      borderColor: colors.border as any,
                    }}
                  >
                    {/* Open-Meteo wind_direction is the direction it's coming FROM; rotate 180 to show where it's blowing TO */}
                    <View style={{ transform: [{ rotate: `${normalizeDegrees(weather.windDirection + 180)}deg` }] }}>
                      <ArrowUp size={12} color={colors.mutedForeground as any} />
                    </View>
                  </View>
                )}
              </View>
              {weather.precipitationProbability === null ? null : (
                <Text className="text-muted-foreground text-sm">
                  Precip: <Text className="text-foreground">{Math.round(weather.precipitationProbability)}%</Text>
                </Text>
              )}
              <Text className="text-muted-foreground text-sm">
                Humidity: <Text className="text-foreground">{weather.humidity === null ? "—" : `${weather.humidity}%`}</Text>
              </Text>
            </View>
          ) : (
            <Text className="text-muted-foreground text-sm mt-3">No weather available.</Text>
          )}
        </View>

        {/* Warm accent divider */}
        <View
          pointerEvents="none"
          style={{
            height: 2,
            backgroundColor: colors.secondary as any,
            opacity: dividerOpacity,
          }}
        />
      </CardFrame>

      <PeakDetailForecastCard forecast={forecast} isLoading={forecastLoading} />
      <PeakDetailDaylightCard forecast={forecast} />

      {/* Recent conditions from reports */}
      {recentConditionTags.length > 0 ? (
        <CardFrame topo="corner" seed={`recent-conditions:${peakId}`}>
          <View style={{ padding: 14 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 10,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: iconChipBg as any,
                  borderWidth: 1,
                  borderColor: iconChipBorder as any,
                }}
              >
                <Activity size={16} color={colors.secondary as any} />
              </View>
              <Text className="text-foreground text-base font-semibold">Recent Conditions</Text>
            </View>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
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

          {/* Warm accent divider */}
          <View
            pointerEvents="none"
            style={{
              height: 2,
              backgroundColor: colors.secondary as any,
              opacity: dividerOpacity,
            }}
          />
        </CardFrame>
      ) : null}

      {/* Recent reports with notes */}
      {recentReportsWithNotes.length > 0 ? (
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 }}>
            <FileText size={16} color={colors.mutedForeground as any} />
            <Text className="text-muted-foreground text-sm font-medium">Recent Reports</Text>
          </View>
          {recentReportsWithNotes.map((s) => (
            <SummitCard key={s.id} summit={s} />
          ))}
        </View>
      ) : !publicSummitsLoading && publicSummitsCount === 0 ? (
        <CardFrame topo="none" seed={`no-reports:${peakId}`} style={{ padding: 14 }}>
          <Text className="text-muted-foreground text-sm">No condition reports yet. Be the first to share!</Text>
        </CardFrame>
      ) : null}
    </View>
  );
}


