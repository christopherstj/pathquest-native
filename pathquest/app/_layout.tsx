import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState, useMemo } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { useColorScheme as useSystemColorScheme } from 'react-native';

// Google Fonts
import {
  Fraunces_400Regular,
  Fraunces_500Medium,
  Fraunces_600SemiBold,
  Fraunces_700Bold,
} from '@expo-google-fonts/fraunces';
import {
  IBMPlexMono_400Regular,
  IBMPlexMono_500Medium,
  IBMPlexMono_600SemiBold,
} from '@expo-google-fonts/ibm-plex-mono';

// NativeWind - must be imported at root
import '../global.css';

import { useAuthStore } from '@/src/lib/auth';
import { setQueryClientRef } from '@/src/lib/queryCache';
import { handleNotificationReceived, handleNotificationResponse } from '@/src/lib/notifications';
import * as Notifications from 'expo-notifications';
import { useOfflineQueueRetry } from '@/src/hooks';
import { ThemeProvider, colors } from '@/src/theme';
import { GluestackProvider } from '@/src/components/ui/gluestack-provider';
import { ToastProvider } from '@/src/components/ui';
import { AddReportModal, ManualSummitModal, LoginPrompt } from '@/src/components/modals';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Create a client for React Query with persistence-friendly settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 60 * 24, // 24 hours - keep in cache for persistence
      retry: 2,
    },
  },
});

// Query cache key
const QUERY_CACHE_KEY = 'pathquest-query-cache';

// Safe AsyncStorage wrapper that handles corrupted/oversized data
const safeAsyncStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error: any) {
      // Handle "Row too big" or OOM errors by clearing corrupted cache
      if (
        error?.message?.includes('Row too big') ||
        error?.message?.includes('CursorWindow') ||
        error?.message?.includes('OutOfMemory')
      ) {
        console.warn('[QueryCache] Corrupted cache detected, clearing...', error.message);
        try {
          await AsyncStorage.removeItem(key);
        } catch (clearError) {
          console.error('[QueryCache] Failed to clear corrupted cache:', clearError);
        }
        return null;
      }
      throw error;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      // Limit cache size to 1MB to prevent SQLite cursor window issues
      if (value.length > 1024 * 1024) {
        console.warn('[QueryCache] Cache too large, skipping persistence:', value.length, 'bytes');
        return;
      }
      await AsyncStorage.setItem(key, value);
    } catch (error: any) {
      console.error('[QueryCache] Failed to persist cache:', error.message);
      // Don't throw - persistence failure shouldn't break the app
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('[QueryCache] Failed to remove cache:', error);
    }
  },
};

// Create AsyncStorage persister for query cache with safe wrapper
const asyncStoragePersister = createAsyncStoragePersister({
  storage: safeAsyncStorage,
  key: QUERY_CACHE_KEY,
  // Throttle writes to avoid excessive storage operations
  throttleTime: 1000,
});

// Set the query client reference for cache management utilities
setQueryClientRef(queryClient);

// Proactively check and clear corrupted cache on startup
const clearCorruptedCacheOnStartup = async () => {
  try {
    // Try to read the cache - if it fails, clear it
    await AsyncStorage.getItem(QUERY_CACHE_KEY);
  } catch (error: any) {
    console.warn('[QueryCache] Startup check found corrupted cache, clearing...', error.message);
    try {
      await AsyncStorage.removeItem(QUERY_CACHE_KEY);
    } catch (clearError) {
      console.error('[QueryCache] Failed to clear on startup:', clearError);
    }
  }
};

// Run on module load (before React renders)
clearCorruptedCacheOnStartup();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    // Display font - Fraunces (serif, for headings)
    Fraunces_400Regular,
    Fraunces_500Medium,
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    // Body/mono font - IBM Plex Mono
    IBMPlexMono_400Regular,
    IBMPlexMono_500Medium,
    IBMPlexMono_600SemiBold,
  });

  const [authInitialized, setAuthInitialized] = useState(false);
  const initializeAuth = useAuthStore((state) => state.initialize);

  // Initialize auth state from secure storage
  useEffect(() => {
    initializeAuth().then(() => {
      setAuthInitialized(true);
    });
  }, [initializeAuth]);

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded && authInitialized) {
      SplashScreen.hideAsync();
    }
  }, [loaded, authInitialized]);

  if (!loaded || !authInitialized) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const systemScheme = useSystemColorScheme(); // 'light' | 'dark' | null
  const scheme = systemScheme === 'light' ? 'light' : 'dark';
  const c = colors[scheme];

  // Initialize offline queue retry system
  useOfflineQueueRetry();

  // Set up notification listeners
  useEffect(() => {
    // Handle notifications received while app is in foreground
    const notificationListener = Notifications.addNotificationReceivedListener(
      handleNotificationReceived
    );

    // Handle notification taps (foreground and background)
    const responseListener = Notifications.addNotificationResponseReceivedListener(
      handleNotificationResponse
    );

    return () => {
      // Use .remove() method on subscription objects (newer API)
      notificationListener.remove();
      responseListener.remove();
    };
  }, []);

  const navTheme = useMemo(() => {
    const base = scheme === 'light' ? DefaultTheme : DarkTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: c.primary,
        background: c.background,
        card: c.card,
        text: c.foreground,
        border: c.border,
        notification: c.destructive,
      },
    };
  }, [scheme, c.background, c.border, c.card, c.destructive, c.foreground, c.primary]);

  return (
    <GestureHandlerRootView className="flex-1">
      <GluestackProvider>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{
            persister: asyncStoragePersister,
            // Max age for persisted cache (24 hours)
            maxAge: 1000 * 60 * 60 * 24,
            // Only persist queries that are successful
            dehydrateOptions: {
              shouldDehydrateQuery: (query) => {
                // Only persist successful queries
                if (query.state.status !== 'success') return false;
                // Don't persist queries with errors
                if (query.state.error) return false;
                // Persist key queries that benefit from caching
                const queryKey = query.queryKey;
                if (Array.isArray(queryKey)) {
                  const key = queryKey[0];
                  // Persist these query types for faster startup
                  const persistableKeys = [
                    'dashboardData',
                    'favoriteChallenges',
                    'userStats',
                    'userProfile',
                    'peakDetails',
                    'challengeDetails',
                    'allChallenges',
                    'popularChallenges',
                  ];
                  return persistableKeys.includes(key as string);
                }
                return false;
              },
            },
          }}
        >
          <ThemeProvider forcedColorScheme={scheme}>
            <NavigationThemeProvider value={navTheme}>
              <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
                <Stack.Screen 
                  name="auth/callback" 
                  options={{ 
                    headerShown: false,
                    presentation: 'fullScreenModal',
                  }} 
                />
                <Stack.Screen name="compass/[peakId]" options={{ headerShown: false }} />
                <Stack.Screen 
                  name="settings" 
                  options={{ 
                    headerShown: false,
                    presentation: 'modal',
                  }} 
                />
                <Stack.Screen 
                  name="settings/location" 
                  options={{ 
                    headerShown: false,
                    presentation: 'modal',
                  }} 
                />
                {/* User profile routes render their own headers */}
                <Stack.Screen name="users/[userId]" options={{ headerShown: false }} />
                <Stack.Screen name="users/[userId]/challenges/[challengeId]" options={{ headerShown: false }} />
              </Stack>
              {/* Global Modals */}
              <AddReportModal />
              <ManualSummitModal />
              <LoginPrompt />
              {/* Global Toast Notifications */}
              <ToastProvider />
            </NavigationThemeProvider>
          </ThemeProvider>
        </PersistQueryClientProvider>
      </GluestackProvider>
    </GestureHandlerRootView>
  );
}
