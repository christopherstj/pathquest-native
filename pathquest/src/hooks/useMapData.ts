/**
 * useMapData Hook
 * 
 * Fetches peaks and challenges for the current map viewport.
 * Uses TanStack Query for caching and refetching.
 */

import { useQuery } from '@tanstack/react-query';
import { getApiClient } from '@/src/lib/api/client';
import { endpoints } from '@pathquest/shared/api';
import type { Peak, ChallengeProgress } from '@pathquest/shared';

interface MapBounds {
  northWest: [number, number]; // [lat, lng]
  southEast: [number, number]; // [lat, lng]
}

// Maximum number of peaks to fetch/render (prevents crashes on wide zoom)
const MAX_PEAKS = 200;

/**
 * Fetch peaks within the given bounds
 */
export function useMapPeaks(bounds: MapBounds | null, enabled = true) {
  return useQuery({
    queryKey: ['mapPeaks', bounds],
    queryFn: async (): Promise<Peak[]> => {
      if (!bounds) {
        return [];
      }
      
      const client = getApiClient();
      const peaks = await endpoints.searchPeaks(client, {
        northWestLat: String(bounds.northWest[0]),
        northWestLng: String(bounds.northWest[1]),
        southEastLat: String(bounds.southEast[0]),
        southEastLng: String(bounds.southEast[1]),
        page: '1', // Must provide page for perPage limit to work
        perPage: String(MAX_PEAKS),
        showSummittedPeaks: 'true', // Include peaks the user has already summited
      });
      
      // Client-side safeguard: limit to MAX_PEAKS to prevent rendering crashes
      if (peaks.length > MAX_PEAKS) {
        return peaks.slice(0, MAX_PEAKS);
      }
      
      return peaks;
    },
    enabled: enabled && bounds !== null,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Fetch challenges within the given bounds
 */
export function useMapChallenges(bounds: MapBounds | null, enabled = true) {
  return useQuery({
    queryKey: ['mapChallenges', bounds],
    queryFn: async (): Promise<ChallengeProgress[]> => {
      if (!bounds) return [];
      
      const client = getApiClient();
      return await endpoints.searchChallenges(client, {
        northWestLat: String(bounds.northWest[0]),
        northWestLng: String(bounds.northWest[1]),
        southEastLat: String(bounds.southEast[0]),
        southEastLng: String(bounds.southEast[1]),
      });
    },
    enabled: enabled && bounds !== null,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

