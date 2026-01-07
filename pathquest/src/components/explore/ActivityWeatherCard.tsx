/**
 * ActivityWeatherCard
 *
 * Displays historical weather conditions at the start of an activity.
 * Fetches from Open-Meteo Archive API using activity start_time and start_coords.
 */

import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import {
  Cloud,
  CloudFog,
  CloudRain,
  CloudSnow,
  CloudSun,
  Sun,
  Wind,
  Thermometer,
  Droplets,
} from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";

import { CardFrame, Text } from "@/src/components/ui";
import { useTheme } from "@/src/theme";
import { cToF, kmhToMph } from "@/src/utils";

// Weather icon mapping (same as other weather components)
const iconMap: Record<string, LucideIcon> = {
  sun: Sun,
  cloudSun: CloudSun,
  cloud: Cloud,
  cloudFog: CloudFog,
  cloudRain: CloudRain,
  cloudSnow: CloudSnow,
};

type WeatherIconKey = keyof typeof iconMap;

interface HistoricalWeather {
  temperature: number | null; // Celsius
  precipitation: number | null; // mm
  weatherCode: number | null; // WMO code
  cloudCover: number | null; // %
  windSpeed: number | null; // km/h
  windDirection: number | null; // degrees
  humidity: number | null; // %
}

interface ActivityWeatherCardProps {
  activityId: string;
  startTime: string; // ISO timestamp
  startCoords: [number, number]; // [lng, lat]
  elevation?: number; // meters (optional, improves accuracy)
}

/**
 * Map WMO weather code to icon key and label
 */
function getWeatherInfo(code: number | null): { iconKey: WeatherIconKey; label: string } {
  if (code === null) return { iconKey: "cloudSun", label: "Unknown" };

  // Clear sky
  if (code === 0) return { iconKey: "sun", label: "Clear" };
  // Mainly clear, partly cloudy
  if (code >= 1 && code <= 2) return { iconKey: "cloudSun", label: "Partly cloudy" };
  // Overcast
  if (code === 3) return { iconKey: "cloud", label: "Overcast" };
  // Fog
  if (code >= 45 && code <= 48) return { iconKey: "cloudFog", label: "Foggy" };
  // Drizzle
  if (code >= 51 && code <= 57) return { iconKey: "cloudRain", label: "Drizzle" };
  // Rain
  if (code >= 61 && code <= 67) return { iconKey: "cloudRain", label: "Rain" };
  // Snow
  if (code >= 71 && code <= 77) return { iconKey: "cloudSnow", label: "Snow" };
  // Rain showers
  if (code >= 80 && code <= 82) return { iconKey: "cloudRain", label: "Showers" };
  // Snow showers
  if (code >= 85 && code <= 86) return { iconKey: "cloudSnow", label: "Snow showers" };
  // Thunderstorm
  if (code >= 95 && code <= 99) return { iconKey: "cloudRain", label: "Thunderstorm" };

  return { iconKey: "cloudSun", label: "Unknown" };
}

/**
 * Fetch historical weather from Open-Meteo Archive API
 */
async function fetchHistoricalWeather(
  timestamp: Date,
  coords: { lat: number; lng: number },
  elevation?: number
): Promise<HistoricalWeather> {
  const dateStr = timestamp.toISOString().split("T")[0];
  const hour = timestamp.getUTCHours();

  let url =
    `https://archive-api.open-meteo.com/v1/archive?` +
    `latitude=${coords.lat}&longitude=${coords.lng}&` +
    `start_date=${dateStr}&end_date=${dateStr}&` +
    `hourly=temperature_2m,precipitation,weathercode,cloudcover,windspeed_10m,winddirection_10m,relativehumidity_2m&` +
    `timezone=UTC`;

  if (elevation !== undefined && elevation > 0) {
    url += `&elevation=${Math.round(elevation)}`;
  }

  try {
    const response = await fetch(url);

    if (!response.ok) {
      console.warn(`[ActivityWeatherCard] API error: ${response.status}`);
      return nullWeather();
    }

    const data = await response.json();

    if (!data.hourly || !data.hourly.temperature_2m) {
      console.warn("[ActivityWeatherCard] Invalid data structure");
      return nullWeather();
    }

    // Get the closest hour's data
    const dataHour = Math.min(hour, data.hourly.temperature_2m.length - 1);

    return {
      temperature: data.hourly.temperature_2m[dataHour] ?? null,
      precipitation: data.hourly.precipitation[dataHour] ?? null,
      weatherCode: data.hourly.weathercode[dataHour] ?? null,
      cloudCover: data.hourly.cloudcover[dataHour] ?? null,
      windSpeed: data.hourly.windspeed_10m[dataHour] ?? null,
      windDirection: data.hourly.winddirection_10m[dataHour] ?? null,
      humidity: data.hourly.relativehumidity_2m[dataHour] ?? null,
    };
  } catch (error) {
    console.error("[ActivityWeatherCard] Fetch error:", error);
    return nullWeather();
  }
}

function nullWeather(): HistoricalWeather {
  return {
    temperature: null,
    precipitation: null,
    weatherCode: null,
    cloudCover: null,
    windSpeed: null,
    windDirection: null,
    humidity: null,
  };
}

export default function ActivityWeatherCard({
  activityId,
  startTime,
  startCoords,
  elevation,
}: ActivityWeatherCardProps) {
  const { colors, isDark } = useTheme();
  const [weather, setWeather] = useState<HistoricalWeather | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(false);

      try {
        const timestamp = new Date(startTime);
        // startCoords is [lng, lat], Open-Meteo expects lat, lng
        const coords = { lat: startCoords[1], lng: startCoords[0] };
        const result = await fetchHistoricalWeather(timestamp, coords, elevation);

        if (!cancelled) {
          setWeather(result);
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [activityId, startTime, startCoords, elevation]);

  const accent = colors.secondary as string;
  const iconChipBg = `${accent}${isDark ? "22" : "18"}`;
  const iconChipBorder = `${accent}${isDark ? "3A" : "2A"}`;

  if (loading) {
    return (
      <CardFrame topo="corner" seed={`activity-weather:${activityId}`} style={{ padding: 14 }}>
        <Text className="text-xs uppercase tracking-widest" style={{ color: colors.mutedForeground as any }}>
          Weather at Start
        </Text>
        <View style={{ alignItems: "center", paddingVertical: 20 }}>
          <ActivityIndicator size="small" color={colors.mutedForeground as any} />
        </View>
      </CardFrame>
    );
  }

  if (error || !weather || weather.temperature === null) {
    return (
      <CardFrame topo="corner" seed={`activity-weather:${activityId}`} style={{ padding: 14 }}>
        <Text className="text-xs uppercase tracking-widest" style={{ color: colors.mutedForeground as any }}>
          Weather at Start
        </Text>
        <Text className="text-muted-foreground text-sm mt-2">Weather data unavailable for this activity.</Text>
      </CardFrame>
    );
  }

  const weatherInfo = getWeatherInfo(weather.weatherCode);
  const WeatherIcon = iconMap[weatherInfo.iconKey] ?? CloudSun;
  const tempF = weather.temperature !== null ? Math.round(cToF(weather.temperature)) : null;
  const windMph = weather.windSpeed !== null ? Math.round(kmhToMph(weather.windSpeed)) : null;

  return (
    <CardFrame topo="corner" seed={`activity-weather:${activityId}`} style={{ padding: 14 }}>
      <Text className="text-xs uppercase tracking-widest" style={{ color: colors.mutedForeground as any }}>
        Weather at Start
      </Text>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginTop: 10 }}>
        {/* Weather icon chip */}
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: iconChipBg as any,
            borderWidth: 1,
            borderColor: iconChipBorder as any,
          }}
        >
          <WeatherIcon size={26} color={accent} />
        </View>

        {/* Condition + temp */}
        <View style={{ flex: 1 }}>
          <Text className="text-foreground text-base font-semibold">{weatherInfo.label}</Text>
          <Text className="text-muted-foreground text-sm">
            {tempF !== null ? `${tempF}°F` : "—"}
          </Text>
        </View>
      </View>

      {/* Details row */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16, marginTop: 12 }}>
        {/* Wind */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Wind size={14} color={colors.mutedForeground as any} />
          <Text className="text-muted-foreground text-sm">
            {windMph !== null ? `${windMph} mph` : "—"}
          </Text>
        </View>

        {/* Cloud cover */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Cloud size={14} color={colors.mutedForeground as any} />
          <Text className="text-muted-foreground text-sm">
            {weather.cloudCover !== null ? `${Math.round(weather.cloudCover)}%` : "—"}
          </Text>
        </View>

        {/* Humidity */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Droplets size={14} color={colors.mutedForeground as any} />
          <Text className="text-muted-foreground text-sm">
            {weather.humidity !== null ? `${Math.round(weather.humidity)}%` : "—"}
          </Text>
        </View>
      </View>
    </CardFrame>
  );
}

