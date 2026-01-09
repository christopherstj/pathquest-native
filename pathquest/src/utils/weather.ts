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

export type DayRating = "great" | "good" | "fair" | "poor";

/**
 * Get weather rating based on multiple factors:
 * - Temperature (ideal: 10-25°C / 50-77°F)
 * - Weather conditions (clear/sunny preferred)
 * - Precipitation probability
 * - Wind speed
 * - Cloud cover
 */
export function getDayRating(
  precipProb: number | null,
  windSpeed: number | null,
  cloudCover: number | null,
  weatherCode: number | null = null,
  tempHigh: number | null = null
): DayRating {
  const precip = precipProb ?? 0;
  const wind = windSpeed ?? 0;
  const clouds = cloudCover ?? 0;
  const temp = tempHigh ?? null;
  const code = weatherCode ?? null;

  // Score each factor (0-100, higher = better)
  let score = 50; // Start neutral

  // Temperature scoring (Celsius)
  if (temp !== null) {
    if (temp >= 10 && temp <= 25) {
      // Ideal hiking temps: 10-25°C (50-77°F)
      score += 30;
    } else if (temp >= 5 && temp <= 30) {
      // Good range: 5-30°C (41-86°F)
      score += 15;
    } else if (temp >= 0 && temp <= 35) {
      // Acceptable but not ideal: 0-35°C (32-95°F)
      score += 5;
    } else if (temp < 0) {
      // Cold: subtract based on how cold
      score -= Math.min(30, Math.abs(temp) * 2);
    } else {
      // Hot: subtract based on how hot
      score -= Math.min(30, (temp - 35) * 2);
    }
  }

  // Weather code scoring (WMO codes)
  if (code !== null) {
    if (code === 0) {
      // Clear sky - best
      score += 25;
    } else if (code >= 1 && code <= 2) {
      // Mainly clear, partly cloudy - good
      score += 15;
    } else if (code === 3) {
      // Overcast - neutral
      score += 0;
    } else if (code >= 45 && code <= 48) {
      // Fog - not great
      score -= 10;
    } else if (code >= 51 && code <= 57) {
      // Drizzle - bad
      score -= 20;
    } else if (code >= 61 && code <= 67) {
      // Rain - worse
      score -= 30;
    } else if (code >= 71 && code <= 77) {
      // Snow - bad for hiking
      score -= 25;
    } else if (code >= 80 && code <= 82) {
      // Rain showers - bad
      score -= 25;
    } else if (code >= 85 && code <= 86) {
      // Snow showers - bad
      score -= 25;
    } else if (code >= 95 && code <= 99) {
      // Thunderstorm - worst
      score -= 40;
    }
  }

  // Precipitation scoring
  if (precip > 50) {
    score -= 40; // Heavy precip
  } else if (precip > 30) {
    score -= 25; // Moderate precip
  } else if (precip > 20) {
    score -= 15; // Light precip
  } else if (precip > 10) {
    score -= 5; // Very light precip
  }
  // precip <= 10: no penalty

  // Wind scoring
  if (wind > 50) {
    score -= 30; // Very windy
  } else if (wind > 40) {
    score -= 20; // Strong wind
  } else if (wind > 30) {
    score -= 10; // Moderate wind
  } else if (wind > 20) {
    score -= 5; // Light wind
  }
  // wind <= 20: no penalty

  // Cloud cover scoring
  if (clouds > 80) {
    score -= 15; // Very cloudy
  } else if (clouds > 70) {
    score -= 10; // Mostly cloudy
  } else if (clouds > 50) {
    score -= 5; // Partly cloudy
  }
  // clouds <= 50: no penalty

  // Convert score to rating
  if (score >= 80) return "great";
  if (score >= 60) return "good";
  if (score >= 40) return "fair";
  return "poor";
}


