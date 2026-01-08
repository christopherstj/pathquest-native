export function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

export function normalizeDegrees(deg: number) {
  const d = deg % 360;
  return d < 0 ? d + 360 : d;
}

export function haversineMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function bearingDegrees(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const dLng = toRad(b.lng - a.lng);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return normalizeDegrees(brng);
}

export function bearingToCardinal(deg: number) {
  const dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  const idx = Math.round(deg / 22.5) % 16;
  return dirs[idx];
}

export function metersToMiles(m: number) {
  return m / 1609.344;
}

export function metersToFeet(m: number) {
  return m * 3.28084;
}

/**
 * Format location parts into a display string.
 * @param parts Object containing optional city, state, county, country
 * @param options.includeCounty Whether to include county in the output (default: false)
 * @returns Formatted location string, e.g. "Boulder, Colorado, United States"
 */
export function formatLocationString(
  parts: { 
    city?: string | null; 
    state?: string | null; 
    county?: string | null; 
    country?: string | null;
  },
  options?: { includeCounty?: boolean }
): string {
  const { city, state, county, country } = parts;
  const arr = options?.includeCounty 
    ? [city, county, state, country] 
    : [city, state, country];
  return arr.filter(Boolean).join(', ') || 'Unknown location';
}

