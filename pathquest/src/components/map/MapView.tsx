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
import { useMapStore } from '@/src/store/mapStore';

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

export type FitBoundsPadding = number | {
  paddingTop?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  paddingRight?: number;
};

export interface MapViewRef {
  flyTo: (center: [number, number], zoom?: number) => void;
  fitBounds: (bounds: [[number, number], [number, number]], padding?: FitBoundsPadding) => void;
  getCenter: () => Promise<[number, number] | null>;
  getZoom: () => Promise<number | null>;
  centerOnUser: () => void;
  resetBearing: () => void;
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
    const setInitialLocationReady = useMapStore((s) => s.setInitialLocationReady);
    const mapRef = useRef<RNMapView>(null);
    const cameraRef = useRef<Camera>(null);
    const didInitialAutoCenterRef = useRef(false);
    const initialAutoCenterInProgressRef = useRef(false);

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
      fitBounds: (bounds: [[number, number], [number, number]], padding: FitBoundsPadding = 50) => {
        // Convert FitBoundsPadding to number[] format expected by Mapbox: [top, right, bottom, left]
        const paddingArray: number[] = typeof padding === 'number'
          ? [padding, padding, padding, padding]
          : [
              padding.paddingTop ?? 0,
              padding.paddingRight ?? 0,
              padding.paddingBottom ?? 0,
              padding.paddingLeft ?? 0,
            ];
        cameraRef.current?.fitBounds(bounds[0], bounds[1], paddingArray, 1000);
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
      resetBearing: () => {
        cameraRef.current?.setCamera({
          heading: 0,
          animationDuration: 500,
        });
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

      // Phase 2: Auto-center on user once at startup (keeps Explore "proximity-based")
      // We retry briefly because lastKnownLocation can be null immediately after permission prompt.
      // Once complete (success or fail), we mark isInitialLocationReady so queries can start.
      // For guests/unauthenticated users, we use a faster timeout to get them exploring quickly.
      const tryInitialAutoCenter = async () => {
        if (didInitialAutoCenterRef.current || initialAutoCenterInProgressRef.current) return;
        initialAutoCenterInProgressRef.current = true;

        try {
          // Try only 2 times (600ms total) to get location - fast fallback for guests
          // Most devices will have location ready quickly if permission was granted
          for (let attempt = 0; attempt < 2; attempt++) {
            const userLocation = await Mapbox.locationManager.getLastKnownLocation();
            if (userLocation?.coords) {
              const { longitude, latitude } = userLocation.coords;
              cameraRef.current?.setCamera({
                centerCoordinate: [longitude, latitude],
                zoomLevel: 12,
                animationDuration: 900,
              });
              didInitialAutoCenterRef.current = true;
              console.log('[MapView] Initial auto-center succeeded, waiting for animation...');
              
              // Wait for camera animation to complete, then update bounds and signal ready
              setTimeout(async () => {
                console.log('[MapView] Animation complete, updating region...');
                await handleRegionChange();  // MUST await - this is async!
                console.log('[MapView] Setting initial location ready');
                setInitialLocationReady(true);
              }, 1000);
              return;
            }
            // wait a bit and retry (shorter delay for faster fallback)
            await new Promise((r) => setTimeout(r, 300));
          }

          // No user location found after retries - fall back to default (Boulder)
          // This ensures guests can explore immediately without location permission
          console.log('[MapView] Initial auto-center skipped - using default location (Boulder, CO)');
          didInitialAutoCenterRef.current = true;
          await handleRegionChange();
          setInitialLocationReady(true);
        } catch (error) {
          console.warn('[MapView] Initial auto-center failed, using fallback:', error);
          didInitialAutoCenterRef.current = true;
          await handleRegionChange();
          setInitialLocationReady(true);
        } finally {
          initialAutoCenterInProgressRef.current = false;
        }
      };

      // small delay so permission prompt / location subsystem can initialize
      setTimeout(() => {
        tryInitialAutoCenter();
      }, 400);
    }, [onMapReady, handleRegionChange, setInitialLocationReady]);

    // Handle map load error (Mapbox callback has no args)
    const handleMapLoadError = useCallback(() => {
      console.error('[MapView] Map load error');
    }, []);

    // Handle style load error (Mapbox callback has no args)
    const handleStyleLoadError = useCallback(() => {
      console.error('[MapView] Style load error');
    }, []);

    // Debug: Log when style loads
    const handleStyleLoaded = useCallback(() => {
      console.log('[MapView] Style loaded successfully');
    }, []);

    // Debounce region change - wait for camera to stop moving before fetching
    const regionChangeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
          compassEnabled={false}
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

