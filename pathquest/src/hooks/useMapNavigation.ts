/**
 * useMapNavigation Hook
 * 
 * Provides a function to open coordinates in the native maps app.
 * Uses Apple Maps on iOS and Google Maps on Android.
 */

import { useCallback } from 'react';
import { Linking, Platform } from 'react-native';

/**
 * Hook for opening locations in the native maps app.
 * @returns Object containing the openInMaps function
 */
export function useMapNavigation() {
  /**
   * Opens the given coordinates in the native maps app.
   * @param coords [longitude, latitude] array
   * @param label Display label for the location
   */
  const openInMaps = useCallback((coords: [number, number], label: string) => {
    const [lng, lat] = coords;
    const encodedLabel = encodeURIComponent(label);
    
    // Use Apple Maps on iOS, Google Maps on Android
    const url = Platform.select({
      ios: `maps:0,0?q=${encodedLabel}@${lat},${lng}`,
      android: `geo:${lat},${lng}?q=${lat},${lng}(${encodedLabel})`,
    });
    
    if (url) {
      Linking.openURL(url).catch((err) => {
        console.warn('[useMapNavigation] Error opening maps:', err);
      });
    }
  }, []);
  
  return { openInMaps };
}

