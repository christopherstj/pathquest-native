/**
 * Query Cache Utilities
 * 
 * Utilities for managing the TanStack Query cache, including
 * clearing the cache on logout.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient } from '@tanstack/react-query';

// Storage key for the persisted query cache
const QUERY_CACHE_KEY = 'pathquest-query-cache';

// Reference to the query client (set by the root layout)
let queryClientRef: QueryClient | null = null;

/**
 * Set the query client reference.
 * Called from the root layout after creating the QueryClient.
 */
export function setQueryClientRef(client: QueryClient) {
  queryClientRef = client;
}

/**
 * Get the query client reference.
 */
export function getQueryClient(): QueryClient | null {
  return queryClientRef;
}

/**
 * Clear all query cache data.
 * Should be called on logout to ensure user data is not persisted.
 */
export async function clearQueryCache(): Promise<void> {
  try {
    // Clear the in-memory cache
    if (queryClientRef) {
      queryClientRef.clear();
    }

    // Clear the persisted cache from AsyncStorage
    await AsyncStorage.removeItem(QUERY_CACHE_KEY);
    
    console.log('[QueryCache] Cache cleared successfully');
  } catch (error) {
    console.error('[QueryCache] Failed to clear cache:', error);
  }
}

/**
 * Invalidate specific queries without clearing the entire cache.
 * Useful for refreshing data after mutations.
 */
export function invalidateQueries(queryKeys: string[]): void {
  if (!queryClientRef) return;

  queryKeys.forEach((key) => {
    queryClientRef!.invalidateQueries({ queryKey: [key] });
  });
}



