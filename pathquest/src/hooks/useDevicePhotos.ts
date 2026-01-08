/**
 * useDevicePhotos
 * 
 * Hooks for fetching photos from the device's media library.
 * Provides access to summit day photos and recent photos with proper
 * permission handling and pagination.
 */

import { useState, useEffect, useCallback } from 'react';
import * as MediaLibrary from 'expo-media-library';
import { startOfDay, endOfDay } from 'date-fns';

export interface DevicePhoto {
  id: string;
  uri: string;
  filename: string;
  width: number;
  height: number;
  creationTime: number;
}

interface UseDevicePhotosResult {
  photos: DevicePhoto[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

interface UseSummitDayPhotosResult extends UseDevicePhotosResult {
  permissionStatus: MediaLibrary.PermissionStatus | null;
  requestPermission: () => Promise<boolean>;
}

/**
 * Convert MediaLibrary.Asset to our DevicePhoto type
 */
const assetToDevicePhoto = (asset: MediaLibrary.Asset): DevicePhoto => ({
  id: asset.id,
  uri: asset.uri,
  filename: asset.filename,
  width: asset.width,
  height: asset.height,
  creationTime: asset.creationTime,
});

/**
 * Hook to fetch photos taken on a specific day (summit day)
 */
export function useSummitDayPhotos(timestamp: string | null): UseSummitDayPhotosResult {
  const [photos, setPhotos] = useState<DevicePhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<MediaLibrary.PermissionStatus | null>(null);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      setPermissionStatus(status);
      return status === 'granted';
    } catch (err) {
      console.error('[useDevicePhotos] Permission request failed:', err);
      return false;
    }
  }, []);

  const fetchPhotos = useCallback(async () => {
    if (!timestamp) {
      setPhotos([]);
      return;
    }

    // Validate timestamp is not empty string
    if (typeof timestamp !== 'string' || timestamp.trim() === '') {
      console.warn('[useDevicePhotos] Empty or invalid timestamp:', timestamp);
      setPhotos([]);
      return;
    }

    // Check permission first
    const { status } = await MediaLibrary.getPermissionsAsync();
    setPermissionStatus(status);
    
    if (status !== 'granted') {
      setError('Photo library permission not granted');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Parse the timestamp - handle various formats:
      // 1. PostgreSQL format: "2024-01-15 12:00:00+00" -> convert to ISO format
      // 2. Date only: "2024-01-15" -> parse as local midnight
      // 3. Full ISO: "2024-01-15T12:00:00Z" -> parse with timezone
      let summitDate: Date;
      let trimmed = timestamp.trim();
      
      // Convert PostgreSQL timestamp format to ISO format
      // "2024-01-15 12:00:00+00" -> "2024-01-15T12:00:00+00:00"
      if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}[+-]\d{2}$/.test(trimmed)) {
        // Replace space with T and add :00 to timezone
        trimmed = trimmed.replace(' ', 'T') + ':00';
      } else if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(trimmed)) {
        // No timezone, replace space with T
        trimmed = trimmed.replace(' ', 'T');
      }
      
      // Check if it's just a date string (YYYY-MM-DD) without time
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        // Parse as local date (not UTC) to match device photo timestamps
        const [year, month, day] = trimmed.split('-').map(Number);
        summitDate = new Date(year, month - 1, day);
      } else {
        // Try parsing as ISO string
        summitDate = new Date(trimmed);
      }
      
      // Validate the date
      if (isNaN(summitDate.getTime())) {
        console.error('[useDevicePhotos] Invalid timestamp - cannot parse:', {
          timestamp,
          type: typeof timestamp,
          length: timestamp.length,
        });
        setError('Invalid date format');
        return;
      }
      
      // Use local timezone for day boundaries (photos are stored with local timestamps)
      const dayStart = startOfDay(summitDate);
      const dayEnd = endOfDay(summitDate);
      
      // Convert to milliseconds for MediaLibrary API
      // Add a small buffer (1 second) to account for any timezone/rounding edge cases
      const dayStartMs = dayStart.getTime() - 1000;
      const dayEndMs = dayEnd.getTime() + 1000;

      console.log('[useDevicePhotos] Fetching photos for day:', {
        timestamp,
        summitDate: summitDate.toISOString(),
        dayStart: dayStart.toISOString(),
        dayEnd: dayEnd.toISOString(),
        dayStartMs,
        dayEndMs,
      });

      const result = await MediaLibrary.getAssetsAsync({
        mediaType: MediaLibrary.MediaType.photo,
        createdAfter: dayStartMs,
        createdBefore: dayEndMs,
        sortBy: [[MediaLibrary.SortBy.creationTime, false]], // Descending
        first: 100, // Get up to 100 photos from that day
      });

      console.log('[useDevicePhotos] Found', result.assets.length, 'photos for summit day');

      setPhotos(result.assets.map(assetToDevicePhoto));
    } catch (err) {
      console.error('[useDevicePhotos] Failed to fetch summit day photos:', err);
      setError('Failed to load photos from this day');
    } finally {
      setLoading(false);
    }
  }, [timestamp]);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  return {
    photos,
    loading,
    error,
    hasMore: false, // Summit day photos are fetched all at once
    loadMore: async () => {}, // No pagination for summit day
    refresh: fetchPhotos,
    permissionStatus,
    requestPermission,
  };
}

/**
 * Hook to fetch recent photos from the device
 * Supports pagination and excludes photos already shown in summit day section
 */
export function useRecentPhotos(excludeIds: Set<string> = new Set()): UseDevicePhotosResult {
  const [photos, setPhotos] = useState<DevicePhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [endCursor, setEndCursor] = useState<string | undefined>(undefined);

  const fetchPhotos = useCallback(async (cursor?: string) => {
    // Check permission first
    const { status } = await MediaLibrary.getPermissionsAsync();
    
    if (status !== 'granted') {
      setError('Photo library permission not granted');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await MediaLibrary.getAssetsAsync({
        mediaType: MediaLibrary.MediaType.photo,
        sortBy: [[MediaLibrary.SortBy.creationTime, false]], // Descending (newest first)
        first: 50,
        after: cursor,
      });

      // Filter out excluded photos (summit day photos)
      const filteredAssets = result.assets.filter(asset => !excludeIds.has(asset.id));
      const newPhotos = filteredAssets.map(assetToDevicePhoto);

      if (cursor) {
        // Appending to existing photos
        setPhotos(prev => [...prev, ...newPhotos]);
      } else {
        // Initial load
        setPhotos(newPhotos);
      }

      setHasMore(result.hasNextPage);
      setEndCursor(result.endCursor);
    } catch (err) {
      console.error('[useDevicePhotos] Failed to fetch recent photos:', err);
      setError('Failed to load recent photos');
    } finally {
      setLoading(false);
    }
  }, [excludeIds]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    await fetchPhotos(endCursor);
  }, [loading, hasMore, endCursor, fetchPhotos]);

  const refresh = useCallback(async () => {
    setEndCursor(undefined);
    setHasMore(true);
    await fetchPhotos(undefined);
  }, [fetchPhotos]);

  useEffect(() => {
    fetchPhotos();
  }, []);

  // Re-filter when excludeIds changes
  useEffect(() => {
    if (excludeIds.size > 0) {
      setPhotos(prev => prev.filter(photo => !excludeIds.has(photo.id)));
    }
  }, [excludeIds]);

  return {
    photos,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
  };
}

/**
 * Combined hook for photo picker - fetches both summit day and recent photos
 */
export interface UsePhotoPickerResult {
  summitDayPhotos: DevicePhoto[];
  recentPhotos: DevicePhoto[];
  loading: boolean;
  error: string | null;
  hasMoreRecent: boolean;
  loadMoreRecent: () => Promise<void>;
  refresh: () => Promise<void>;
  permissionStatus: MediaLibrary.PermissionStatus | null;
  requestPermission: () => Promise<boolean>;
}

export function usePhotoPicker(summitTimestamp: string | null): UsePhotoPickerResult {
  const [summitDayPhotos, setSummitDayPhotos] = useState<DevicePhoto[]>([]);
  const [recentPhotos, setRecentPhotos] = useState<DevicePhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMoreRecent, setHasMoreRecent] = useState(true);
  const [endCursor, setEndCursor] = useState<string | undefined>(undefined);
  const [permissionStatus, setPermissionStatus] = useState<MediaLibrary.PermissionStatus | null>(null);
  const [summitDayIds, setSummitDayIds] = useState<Set<string>>(new Set());

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      setPermissionStatus(status);
      return status === 'granted';
    } catch (err) {
      console.error('[usePhotoPicker] Permission request failed:', err);
      return false;
    }
  }, []);

  const fetchSummitDayPhotos = useCallback(async (): Promise<DevicePhoto[]> => {
    if (!summitTimestamp) return [];

    // Validate timestamp is not empty string
    if (typeof summitTimestamp !== 'string' || summitTimestamp.trim() === '') {
      console.warn('[usePhotoPicker] Empty or invalid timestamp:', summitTimestamp);
      return [];
    }

    try {
      // Parse the timestamp - handle various formats:
      // 1. PostgreSQL format: "2024-01-15 12:00:00+00" -> convert to ISO format
      // 2. Date only: "2024-01-15" -> parse as local midnight
      // 3. Full ISO: "2024-01-15T12:00:00Z" -> parse with timezone
      let summitDate: Date;
      let trimmed = summitTimestamp.trim();
      
      // Convert PostgreSQL timestamp format to ISO format
      // "2024-01-15 12:00:00+00" -> "2024-01-15T12:00:00+00:00"
      if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}[+-]\d{2}$/.test(trimmed)) {
        // Replace space with T and add :00 to timezone
        trimmed = trimmed.replace(' ', 'T') + ':00';
      } else if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(trimmed)) {
        // No timezone, replace space with T
        trimmed = trimmed.replace(' ', 'T');
      }
      
      // Check if it's just a date string (YYYY-MM-DD) without time
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        // Parse as local date (not UTC) to match device photo timestamps
        const [year, month, day] = trimmed.split('-').map(Number);
        summitDate = new Date(year, month - 1, day);
      } else {
        // Try parsing as ISO string
        summitDate = new Date(trimmed);
      }
      
      // Validate the date
      if (isNaN(summitDate.getTime())) {
        console.error('[usePhotoPicker] Invalid timestamp - cannot parse:', {
          timestamp: summitTimestamp,
          type: typeof summitTimestamp,
          length: summitTimestamp.length,
        });
        return [];
      }
      
      // Use local timezone for day boundaries (photos are stored with local timestamps)
      const dayStart = startOfDay(summitDate);
      const dayEnd = endOfDay(summitDate);
      
      // Convert to milliseconds for MediaLibrary API
      // Add a small buffer (1 second) to account for any timezone/rounding edge cases
      const dayStartMs = dayStart.getTime() - 1000;
      const dayEndMs = dayEnd.getTime() + 1000;

      console.log('[usePhotoPicker] Fetching photos for day:', {
        timestamp: summitTimestamp,
        summitDate: summitDate.toISOString(),
        dayStart: dayStart.toISOString(),
        dayEnd: dayEnd.toISOString(),
        dayStartMs,
        dayEndMs,
      });

      const result = await MediaLibrary.getAssetsAsync({
        mediaType: MediaLibrary.MediaType.photo,
        createdAfter: dayStartMs,
        createdBefore: dayEndMs,
        sortBy: [[MediaLibrary.SortBy.creationTime, false]],
        first: 100,
      });

      console.log('[usePhotoPicker] Found', result.assets.length, 'photos for summit day');

      return result.assets.map(assetToDevicePhoto);
    } catch (err) {
      console.error('[usePhotoPicker] Failed to fetch summit day photos:', err);
      return [];
    }
  }, [summitTimestamp]);

  const fetchRecentPhotos = useCallback(async (cursor?: string, excludeIds?: Set<string>) => {
    try {
      const result = await MediaLibrary.getAssetsAsync({
        mediaType: MediaLibrary.MediaType.photo,
        sortBy: [[MediaLibrary.SortBy.creationTime, false]],
        first: 50,
        after: cursor,
      });

      // Filter out summit day photos
      const idsToExclude = excludeIds || summitDayIds;
      const filteredAssets = result.assets.filter(asset => !idsToExclude.has(asset.id));
      const newPhotos = filteredAssets.map(assetToDevicePhoto);

      return {
        photos: newPhotos,
        hasMore: result.hasNextPage,
        endCursor: result.endCursor,
      };
    } catch (err) {
      console.error('[usePhotoPicker] Failed to fetch recent photos:', err);
      return { photos: [], hasMore: false, endCursor: undefined };
    }
  }, [summitDayIds]);

  const loadAll = useCallback(async () => {
    // Check permission first
    const { status } = await MediaLibrary.getPermissionsAsync();
    setPermissionStatus(status);
    
    if (status !== 'granted') {
      setError('Photo library permission not granted');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch summit day photos first
      const summitPhotos = await fetchSummitDayPhotos();
      setSummitDayPhotos(summitPhotos);
      
      // Create set of summit day photo IDs for filtering
      const summitIds = new Set(summitPhotos.map(p => p.id));
      setSummitDayIds(summitIds);

      // Fetch recent photos, excluding summit day photos
      const recentResult = await fetchRecentPhotos(undefined, summitIds);
      setRecentPhotos(recentResult.photos);
      setHasMoreRecent(recentResult.hasMore);
      setEndCursor(recentResult.endCursor);
    } catch (err) {
      console.error('[usePhotoPicker] Failed to load photos:', err);
      setError('Failed to load photos');
    } finally {
      setLoading(false);
    }
  }, [fetchSummitDayPhotos, fetchRecentPhotos]);

  const loadMoreRecent = useCallback(async () => {
    if (loading || !hasMoreRecent) return;
    
    setLoading(true);
    try {
      const result = await fetchRecentPhotos(endCursor);
      setRecentPhotos(prev => [...prev, ...result.photos]);
      setHasMoreRecent(result.hasMore);
      setEndCursor(result.endCursor);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMoreRecent, endCursor, fetchRecentPhotos]);

  const refresh = useCallback(async () => {
    setEndCursor(undefined);
    setHasMoreRecent(true);
    await loadAll();
  }, [loadAll]);

  useEffect(() => {
    loadAll();
  }, [summitTimestamp]);

  return {
    summitDayPhotos,
    recentPhotos,
    loading,
    error,
    hasMoreRecent,
    loadMoreRecent,
    refresh,
    permissionStatus,
    requestPermission,
  };
}

