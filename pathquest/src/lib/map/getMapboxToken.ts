/**
 * Get Mapbox access token from Expo env.
 * Used for Mapbox Geocoding (place search).
 */
export function getMapboxToken(): string {
  const token = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
  if (!token) {
    throw new Error("EXPO_PUBLIC_MAPBOX_TOKEN is not set");
  }
  return token;
}


