export type WeatherIconKey =
  | "sun"
  | "cloudSun"
  | "cloud"
  | "cloudFog"
  | "cloudRain"
  | "cloudSnow";

export type WeatherInfo = {
  iconKey: WeatherIconKey;
  label: string;
};

// Map backend "conditions_icon" strings (used by SuggestedPeakCard) to our icon keys.
export function getConditionsIconKey(conditionsIcon?: string | null): WeatherIconKey {
  switch (conditionsIcon) {
    case "clear":
    case "mostly_clear":
      return "sun";
    case "partly_cloudy":
      return "cloudSun";
    case "overcast":
    case "unknown":
      return "cloud";
    case "fog":
      return "cloudFog";
    case "drizzle":
    case "rain":
    case "heavy_rain":
    case "freezing_rain":
    case "rain_showers":
    case "thunderstorm":
      return "cloudRain";
    case "snow":
    case "heavy_snow":
    case "snow_showers":
      return "cloudSnow";
    default:
      return "cloud";
  }
}

// Weather code mapping (WMO codes used by Open-Meteo)
export function getWeatherInfo(code: number | null): WeatherInfo {
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
  // Thunderstorm (use rain icon for now)
  if (code >= 95 && code <= 99) return { iconKey: "cloudRain", label: "Thunderstorm" };

  return { iconKey: "cloudSun", label: "Unknown" };
}

export type DayRating = "good" | "fair" | "poor";

export function getDayRating(precipProb: number | null, windSpeed: number | null, cloudCover: number | null): DayRating {
  const precip = precipProb ?? 0;
  const wind = windSpeed ?? 0;
  const clouds = cloudCover ?? 0;

  // Poor conditions
  if (precip > 50 || wind > 50) return "poor";

  // Fair conditions
  if (precip > 20 || wind > 30 || clouds > 70) return "fair";

  // Good conditions
  return "good";
}


