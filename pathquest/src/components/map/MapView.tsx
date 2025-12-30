/**
 * MapView
 * 
 * Full-screen Mapbox map component that serves as the persistent background.
 * Matches the web frontend's MapBackground component behavior:
 * - Default center at Boulder, CO
 * - 3D terrain support
 * - Outdoor map style
 * 
 * Uses @rnmapbox/maps for native Mapbox integration.
 */

import React, { useRef, useCallback, useEffect } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import Mapbox, { Camera, MapView as RNMapView, LocationPuck } from '@rnmapbox/maps';
import { useTheme } from '@/src/theme';

// Initialize Mapbox with access token
const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;

console.log('[MapView] MAPBOX_TOKEN present:', !!MAPBOX_TOKEN);
console.log('[MapView] MAPBOX_TOKEN starts with:', MAPBOX_TOKEN?.substring(0, 10));

if (MAPBOX_TOKEN) {
  Mapbox.setAccessToken(MAPBOX_TOKEN);
  console.log('[MapView] Access token set successfully');
} else {
  console.error('[MapView] No MAPBOX_TOKEN found in environment!');
}

// Default map settings (matching web frontend)
const DEFAULT_CENTER: [number, number] = [-105.2705, 40.015]; // Boulder, CO
const DEFAULT_ZOOM = 11;
const DEFAULT_PITCH = 45;
const DEFAULT_BEARING = 0;

// Map style URLs
const MAP_STYLES = {
  outdoors: 'mapbox://styles/mapbox/outdoors-v12',
  satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
  light: 'mapbox://styles/mapbox/light-v11',
  dark: 'mapbox://styles/mapbox/dark-v11',
};

interface MapViewProps {
  /**
   * Initial center coordinates [longitude, latitude]
   */
  initialCenter?: [number, number];
  /**
   * Initial zoom level
   */
  initialZoom?: number;
  /**
   * Initial pitch (tilt) angle
   */
  initialPitch?: number;
  /**
   * Whether to show satellite imagery instead of outdoors style
   */
  satellite?: boolean;
  /**
   * Callback when map region changes (user interaction or programmatic)
   */
  onRegionChange?: (region: {
    center: [number, number];
    zoom: number;
    bounds: [[number, number], [number, number]];
  }) => void;
  /**
   * Callback when map is ready
   */
  onMapReady?: () => void;
  /**
   * Children to render on the map (markers, etc.)
   */
  children?: React.ReactNode;
}

export interface MapViewRef {
  flyTo: (center: [number, number], zoom?: number) => void;
  fitBounds: (bounds: [[number, number], [number, number]], padding?: number) => void;
  getCenter: () => Promise<[number, number] | null>;
  getZoom: () => Promise<number | null>;
  centerOnUser: () => void;
}

const MapViewComponent = React.forwardRef<MapViewRef, MapViewProps>(
  (
    {
      initialCenter = DEFAULT_CENTER,
      initialZoom = DEFAULT_ZOOM,
      initialPitch = DEFAULT_PITCH,
      satellite = false,
      onRegionChange,
      onMapReady,
      children,
    },
    ref
  ) => {
    const { isDark } = useTheme();
    const mapRef = useRef<RNMapView>(null);
    const cameraRef = useRef<Camera>(null);

    // Determine map style based on satellite mode and theme
    const mapStyle = satellite
      ? MAP_STYLES.satellite
      : MAP_STYLES.outdoors;

    // Expose imperative methods via ref
    React.useImperativeHandle(ref, () => ({
      flyTo: (center: [number, number], zoom?: number) => {
        cameraRef.current?.setCamera({
          centerCoordinate: center,
          zoomLevel: zoom ?? initialZoom,
          animationDuration: 1000,
        });
      },
      fitBounds: (bounds: [[number, number], [number, number]], padding = 50) => {
        cameraRef.current?.fitBounds(bounds[0], bounds[1], padding, 1000);
      },
      getCenter: async () => {
        const center = await mapRef.current?.getCenter();
        return center as [number, number] | null;
      },
      getZoom: async () => {
        const zoom = await mapRef.current?.getZoom();
        return zoom ?? null;
      },
      centerOnUser: async () => {
        try {
          // Get user's current location from Mapbox
          const userLocation = await Mapbox.locationManager.getLastKnownLocation();
          if (userLocation && userLocation.coords) {
            const { longitude, latitude } = userLocation.coords;
            cameraRef.current?.setCamera({
              centerCoordinate: [longitude, latitude],
              zoomLevel: 14,
              animationDuration: 1000,
            });
          } else {
            console.warn('[MapView] No user location available');
          }
        } catch (error) {
          console.warn('[MapView] Error centering on user:', error);
        }
      },
    }));

    // Handle region change events
    const handleRegionChange = useCallback(async () => {
      if (!onRegionChange || !mapRef.current) return;

      try {
        const center = await mapRef.current.getCenter();
        const zoom = await mapRef.current.getZoom();
        const bounds = await mapRef.current.getVisibleBounds();

        if (center && zoom !== undefined && bounds) {
          onRegionChange({
            center: center as [number, number],
            zoom,
            bounds: bounds as [[number, number], [number, number]],
          });
        }
      } catch (error) {
        console.warn('Failed to get map region:', error);
      }
    }, [onRegionChange]);

    // Handle map ready
    const handleMapReady = useCallback(async () => {
      console.log('[MapView] Map finished loading!');
      onMapReady?.();
      
      // Trigger initial region fetch after map is ready
      // Small delay to ensure map is fully initialized
      setTimeout(() => {
        handleRegionChange();
      }, 300);
    }, [onMapReady, handleRegionChange]);

    // Handle map load error
    const handleMapLoadError = useCallback((error: any) => {
      console.error('[MapView] Map load error:', JSON.stringify(error, null, 2));
    }, []);

    // Handle style load error
    const handleStyleLoadError = useCallback((error: any) => {
      console.error('[MapView] Style load error:', JSON.stringify(error, null, 2));
    }, []);

    // Debug: Log when style loads
    const handleStyleLoaded = useCallback(() => {
      console.log('[MapView] Style loaded successfully');
    }, []);

    // Debounce region change - wait for camera to stop moving before fetching
    const regionChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastCameraLogRef = useRef(0);
    
    const handleCameraChanged = useCallback((state: any) => {
      // Throttle logging
      const now = Date.now();
      if (now - lastCameraLogRef.current > 2000) {
        console.log('[MapView] Camera moving...');
        lastCameraLogRef.current = now;
      }
      
      // Debounce: Clear existing timeout and set new one
      if (regionChangeTimeoutRef.current) {
        clearTimeout(regionChangeTimeoutRef.current);
      }
      
      // Wait 300ms after last camera change before fetching new data
      regionChangeTimeoutRef.current = setTimeout(() => {
        console.log('[MapView] Camera stopped, triggering region change');
        handleRegionChange();
      }, 300);
    }, [handleRegionChange]);
    
    // Cleanup timeout on unmount
    useEffect(() => {
      return () => {
        if (regionChangeTimeoutRef.current) {
          clearTimeout(regionChangeTimeoutRef.current);
        }
      };
    }, []);

    // Request location permissions on mount
    useEffect(() => {
      const requestLocationPermission = async () => {
        try {
          if (Platform.OS === 'android') {
            const granted = await Mapbox.requestAndroidLocationPermissions();
            console.log('[MapView] Android location permission:', granted ? 'granted' : 'denied');
          }
          // iOS permissions are handled automatically via Info.plist
        } catch (error) {
          console.warn('[MapView] Error requesting location permission:', error);
        }
      };
      
      requestLocationPermission();
    }, []);

    // Log on mount and test Mapbox connectivity
    useEffect(() => {
      console.log('[MapView] Component mounted');
      console.log('[MapView] Using style:', mapStyle);
      
      // Test if we can reach Mapbox API
      fetch(`https://api.mapbox.com/styles/v1/mapbox/outdoors-v12?access_token=${MAPBOX_TOKEN}`)
        .then(res => {
          console.log('[MapView] Mapbox API test - status:', res.status);
          if (!res.ok) {
            return res.text().then(text => {
              console.error('[MapView] Mapbox API error:', text);
            });
          }
          console.log('[MapView] Mapbox API test - SUCCESS');
        })
        .catch(err => {
          console.error('[MapView] Mapbox API test - FAILED:', err.message);
        });
      
      return () => {
        console.log('[MapView] Component unmounted');
      };
    }, [mapStyle]);

    if (!MAPBOX_TOKEN) {
      return (
        <View style={[styles.container, styles.errorContainer]}>
          {/* Fallback when no token - should not happen in production */}
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <RNMapView
          ref={mapRef}
          style={styles.map}
          styleURL={mapStyle}
          logoEnabled={false}
          attributionEnabled={true}
          attributionPosition={{ bottom: 8, right: 8 }}
          compassEnabled={true}
          compassPosition={{ top: 100, right: 16 }}
          scaleBarEnabled={false}
          onDidFinishLoadingMap={handleMapReady}
          onDidFinishLoadingStyle={handleStyleLoaded}
          onDidFailLoadingMap={handleStyleLoadError}
          onCameraChanged={handleCameraChanged}
          onMapIdle={handleRegionChange}
          onMapLoadingError={handleMapLoadError}
        >
          {/* Camera controls */}
          <Camera
            ref={cameraRef}
            defaultSettings={{
              centerCoordinate: initialCenter,
              zoomLevel: initialZoom,
              pitch: initialPitch,
              heading: DEFAULT_BEARING,
            }}
            animationDuration={0}
          />

          {/* User location indicator */}
          <LocationPuck
            puckBearingEnabled
            puckBearing="heading"
            pulsing={{
              isEnabled: true,
              color: '#4D7A57', // Primary green
              radius: 50,
            }}
          />

          {/* Child components (markers, etc.) */}
          {children}
        </RNMapView>
      </View>
    );
  }
);

MapViewComponent.displayName = 'MapView';

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject, // Cover the entire parent
  },
  map: {
    flex: 1,
  },
  errorContainer: {
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default MapViewComponent;

