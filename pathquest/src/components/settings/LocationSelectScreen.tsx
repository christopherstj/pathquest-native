/**
 * Location Select Screen
 * 
 * Allows users to search for and select their location using Mapbox Geocoding API.
 * Includes autocomplete search and a small map preview showing the selected location.
 * Similar to the web app's UserManagementModal location selection.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Mapbox, { MapView as RNMapView, Camera, PointAnnotation } from '@rnmapbox/maps';
import { X, Search, MapPin, Check } from 'lucide-react-native';

import { Text, CardFrame } from '@/src/components/ui';
import { useTheme } from '@/src/theme';
import { useAuthStore } from '@/src/lib/auth';
import { getMapboxToken } from '@/src/lib/map/getMapboxToken';
import { getApiClient } from '@/src/lib/api/client';
import { endpoints } from '@pathquest/shared/api';
import { formatLocationString } from '@/src/utils';

// Initialize Mapbox
const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
if (MAPBOX_TOKEN) {
  Mapbox.setAccessToken(MAPBOX_TOKEN);
}

// Geocoding result type
interface GeocodingFeature {
  id: string;
  place_name: string;
  center: [number, number]; // [lng, lat]
  context?: Array<{
    id: string;
    text: string;
    short_code?: string;
  }>;
  text: string;
}

// Default map center (Boulder, CO)
const DEFAULT_CENTER: [number, number] = [-105.2705, 40.015];

interface LocationSelectScreenProps {
  initialLocation?: {
    city?: string | null;
    state?: string | null;
    country?: string | null;
    coords?: [number, number] | null;
  };
  onSave?: (location: {
    city: string;
    state: string;
    country: string;
    coords: [number, number];
  }) => Promise<void>;
}

export default function LocationSelectScreen({ initialLocation, onSave }: LocationSelectScreenProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  
  const user = useAuthStore((state) => state.user);
  const updateUserStore = useAuthStore((state) => state.updateUser);
  
  // Form state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodingFeature[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{
    city: string;
    state: string;
    country: string;
    coords: [number, number];
    displayString: string;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  
  const searchInputRef = useRef<TextInput>(null);
  const mapRef = useRef<RNMapView>(null);
  const cameraRef = useRef<Camera>(null);
  
  // Fetch user's current location from API (to get coordinates)
  useEffect(() => {
    const loadUserLocation = async () => {
      if (initialLocation) {
        // Use provided initial location
        if (initialLocation.coords && (initialLocation.city || initialLocation.state || initialLocation.country)) {
          const displayString = formatLocationString(initialLocation);
          setSearchQuery(displayString);
          setSelectedLocation({
            city: initialLocation.city || '',
            state: initialLocation.state || '',
            country: initialLocation.country || '',
            coords: initialLocation.coords,
            displayString,
          });
        }
        return;
      }
      
      // Fetch from API if we have user data
      if (!user?.id) return;
      
      try {
        const client = getApiClient();
        const userData = await endpoints.getUser(client, user.id);
        const displayString = formatLocationString(userData);
        
        if (displayString !== 'Unknown location') {
          setSearchQuery(displayString);
          
          // If we have coordinates, set selected location
          if (userData.location_coords && userData.location_coords[0] && userData.location_coords[1]) {
            setSelectedLocation({
              city: userData.city || '',
              state: userData.state || '',
              country: userData.country || '',
              coords: userData.location_coords as [number, number],
              displayString,
            });
          }
        }
      } catch (error) {
        console.error('Failed to load user location:', error);
        // Fallback to just showing city/state/country without coords
        const displayString = formatLocationString(user ?? {});
        if (displayString !== 'Unknown location') {
          setSearchQuery(displayString);
        }
      }
    };
    
    loadUserLocation();
  }, [initialLocation, user?.id, user?.city, user?.state, user?.country]);
  
  // Debounced geocoding search
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    
    const searchLocations = async () => {
      setIsSearching(true);
      try {
        const token = getMapboxToken();
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?` +
          `access_token=${token}&types=place,region,country&limit=5&language=en`
        );
        
        if (response.ok) {
          const data = await response.json();
          setSearchResults(data.features || []);
          setShowDropdown(data.features?.length > 0);
        }
      } catch (err) {
        console.error('Geocoding error:', err);
      } finally {
        setIsSearching(false);
      }
    };
    
    const debounceTimer = setTimeout(searchLocations, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);
  
  // Handle location selection
  const handleSelectLocation = useCallback((feature: GeocodingFeature) => {
    const coords: [number, number] = feature.center;
    
    // Extract location parts from context
    let city = '';
    let state = '';
    let country = '';
    
    // The main text is usually the place name
    city = feature.text || '';
    
    // Context contains parent regions
    if (feature.context) {
      for (const ctx of feature.context) {
        if (ctx.id.startsWith('region')) {
          state = ctx.text;
        } else if (ctx.id.startsWith('country')) {
          country = ctx.text;
        }
      }
    }
    
    // Build display string
    const displayString = formatLocationString({ city, state, country }) !== 'Unknown location'
      ? formatLocationString({ city, state, country })
      : feature.place_name;
    
    setSelectedLocation({
      city,
      state,
      country,
      coords,
      displayString,
    });
    
    setSearchQuery(displayString);
    setShowDropdown(false);
    setSearchResults([]);
    
    // Update map camera
    if (mapRef.current && cameraRef.current) {
      cameraRef.current.setCamera({
        centerCoordinate: coords,
        zoomLevel: 8,
        animationDuration: 500,
      });
    }
  }, []);
  
  // Handle save
  const handleSave = useCallback(async () => {
    if (!selectedLocation || !user?.id) {
      Alert.alert('Error', 'Please select a location');
      return;
    }
    
    setIsSaving(true);
    try {
      const client = getApiClient();
      await endpoints.updateUser(client, user.id, {
        city: selectedLocation.city || undefined,
        state: selectedLocation.state || undefined,
        country: selectedLocation.country || undefined,
        location_coords: selectedLocation.coords,
      });
      
      // Update local store
      await updateUserStore({
        city: selectedLocation.city || null,
        state: selectedLocation.state || null,
        country: selectedLocation.country || null,
      });
      
      // Call onSave callback if provided
      if (onSave) {
        await onSave(selectedLocation);
      }
      
      router.back();
    } catch (error) {
      console.error('Failed to save location:', error);
      Alert.alert('Error', 'Failed to save location. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [selectedLocation, user?.id, updateUserStore, onSave, router]);
  
  const mapCenter = selectedLocation?.coords || DEFAULT_CENTER;
  
  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ backgroundColor: colors.background }}
    >
      {/* Header */}
      <View
        className="flex-row items-center justify-between px-4 py-3 border-b"
        style={{
          backgroundColor: colors.background,
          borderColor: colors.border,
          paddingTop: insets.top,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-2 -ml-2"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X size={24} color={colors.foreground as string} />
        </TouchableOpacity>
        <Text className="text-lg font-semibold" style={{ color: colors.foreground }}>
          Select Location
        </Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={!selectedLocation || isSaving}
          className="px-3 py-1.5 rounded-lg"
          style={{
            backgroundColor: selectedLocation && !isSaving ? colors.primary : colors.muted,
            opacity: selectedLocation && !isSaving ? 1 : 0.5,
          }}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={colors.primaryForeground as string} />
          ) : (
            <Text
              className="text-sm font-medium"
              style={{ color: selectedLocation ? colors.primaryForeground : colors.mutedForeground }}
            >
              Save
            </Text>
          )}
        </TouchableOpacity>
      </View>
      
      <ScrollView
        className="flex-1 px-4 pt-4"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      >
        {/* Search Input */}
        <View className="mb-4">
          <View className="relative">
            <View
              className="absolute left-3 top-0 bottom-0 items-center justify-center z-10"
              style={{ zIndex: 10 }}
            >
              <Search size={18} color={colors.mutedForeground as string} />
            </View>
            <TextInput
              ref={searchInputRef}
              className="pl-10 pr-10 py-3 rounded-lg text-base"
              style={{
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                color: colors.foreground,
                borderWidth: 1,
                borderColor: colors.border,
              }}
              placeholder="Search for a city or region..."
              placeholderTextColor={colors.mutedForeground}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {isSearching && (
              <View className="absolute right-3 top-0 bottom-0 items-center justify-center">
                <ActivityIndicator size="small" color={colors.mutedForeground as string} />
              </View>
            )}
          </View>
          
          {/* Search Results Dropdown */}
          {showDropdown && searchResults.length > 0 && (
            <CardFrame variant="default" seed="location-search-results" className="mt-2">
              {searchResults.map((result) => (
                <TouchableOpacity
                  key={result.id}
                  onPress={() => handleSelectLocation(result)}
                  className="flex-row items-start gap-3 px-4 py-3 border-b"
                  style={{
                    borderBottomColor: colors.border,
                    borderBottomWidth: searchResults.indexOf(result) < searchResults.length - 1 ? 1 : 0,
                  }}
                  activeOpacity={0.7}
                >
                  <MapPin size={18} color={colors.mutedForeground as string} style={{ marginTop: 2 }} />
                  <View className="flex-1">
                    <Text className="text-base font-medium" style={{ color: colors.foreground }}>
                      {result.text}
                    </Text>
                    <Text className="text-sm mt-0.5" style={{ color: colors.mutedForeground }}>
                      {result.place_name}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </CardFrame>
          )}
        </View>
        
        {/* Map Preview */}
        <View className="mb-4">
          <Text className="text-sm font-semibold mb-2" style={{ color: colors.foreground }}>
            Location Preview
          </Text>
          <View
            className="rounded-lg overflow-hidden"
            style={{
              height: 200,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            {MAPBOX_TOKEN ? (
              <RNMapView
                ref={mapRef}
                style={{ flex: 1 }}
                styleURL="mapbox://styles/mapbox/outdoors-v12"
                onDidFinishLoadingMap={() => setMapReady(true)}
              >
                <Camera
                  ref={cameraRef}
                  defaultSettings={{
                    centerCoordinate: mapCenter,
                    zoomLevel: 8,
                  }}
                />
                {selectedLocation && (
                  <PointAnnotation
                    id="location-marker"
                    coordinate={selectedLocation.coords}
                  >
                    <View
                      className="items-center justify-center"
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        backgroundColor: colors.primary as string,
                        borderWidth: 2,
                        borderColor: colors.background as string,
                      }}
                    >
                      <MapPin size={12} color={colors.primaryForeground as string} />
                    </View>
                  </PointAnnotation>
                )}
              </RNMapView>
            ) : (
              <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.muted }}>
                <Text style={{ color: colors.mutedForeground }}>Map unavailable</Text>
              </View>
            )}
          </View>
          
          {selectedLocation && (
            <View className="flex-row items-center gap-2 mt-2">
              <Check size={14} color={colors.primary as string} />
              <Text className="text-xs" style={{ color: colors.mutedForeground }}>
                {selectedLocation.displayString}
              </Text>
            </View>
          )}
        </View>
        
        {/* Instructions */}
        <CardFrame variant="default" seed="location-instructions">
          <View className="p-4">
            <Text className="text-sm" style={{ color: colors.mutedForeground }}>
              Search for your city or region to set your location. This helps us show you nearby peaks and personalize your experience.
            </Text>
          </View>
        </CardFrame>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

