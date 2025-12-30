/**
 * useLocation Hook
 * 
 * Handles location permissions and tracking for the native app.
 * Uses @rnmapbox/maps for permission handling and location updates.
 */

import { useState, useEffect, useCallback } from 'react';
import { Platform, Alert, Linking } from 'react-native';
import Mapbox from '@rnmapbox/maps';

export type LocationPermissionStatus = 'undetermined' | 'granted' | 'denied';

export interface UserLocation {
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number | null;
  heading: number | null;
  timestamp: number;
}

interface UseLocationReturn {
  /** Current permission status */
  permissionStatus: LocationPermissionStatus;
  /** Whether we're currently requesting permission */
  isRequesting: boolean;
  /** Current user location (null if not available) */
  location: UserLocation | null;
  /** Request location permission */
  requestPermission: () => Promise<boolean>;
  /** Open device settings to enable location */
  openSettings: () => void;
}

/**
 * Hook for managing location permissions and tracking
 */
export function useLocation(): UseLocationReturn {
  const [permissionStatus, setPermissionStatus] = useState<LocationPermissionStatus>('undetermined');
  const [isRequesting, setIsRequesting] = useState(false);
  const [location, setLocation] = useState<UserLocation | null>(null);

  // Check initial permission status on mount
  useEffect(() => {
    checkPermissionStatus();
  }, []);

  // Check current permission status
  const checkPermissionStatus = useCallback(async () => {
    try {
      if (Platform.OS === 'android') {
        // On Android, we check by trying to get location
        // Mapbox will return false if permission isn't granted
        const granted = await Mapbox.requestAndroidLocationPermissions();
        setPermissionStatus(granted ? 'granted' : 'denied');
      } else {
        // On iOS, permissions are handled through Info.plist
        // The LocationPuck will prompt automatically
        // For now, assume granted until we know otherwise
        setPermissionStatus('granted');
      }
    } catch (error) {
      console.warn('[useLocation] Error checking permission:', error);
      setPermissionStatus('undetermined');
    }
  }, []);

  // Request location permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (isRequesting) return false;
    
    setIsRequesting(true);
    
    try {
      if (Platform.OS === 'android') {
        const granted = await Mapbox.requestAndroidLocationPermissions();
        setPermissionStatus(granted ? 'granted' : 'denied');
        setIsRequesting(false);
        return granted;
      } else {
        // iOS handles this automatically through the LocationPuck
        // Just mark as granted
        setPermissionStatus('granted');
        setIsRequesting(false);
        return true;
      }
    } catch (error) {
      console.error('[useLocation] Error requesting permission:', error);
      setPermissionStatus('denied');
      setIsRequesting(false);
      return false;
    }
  }, [isRequesting]);

  // Open device settings
  const openSettings = useCallback(() => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  }, []);

  // Show permission denied alert
  const showPermissionDeniedAlert = useCallback(() => {
    Alert.alert(
      'Location Permission Required',
      'PathQuest needs location access to show your position on the map and calculate distances to peaks.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: openSettings },
      ]
    );
  }, [openSettings]);

  return {
    permissionStatus,
    isRequesting,
    location,
    requestPermission,
    openSettings,
  };
}

export default useLocation;

