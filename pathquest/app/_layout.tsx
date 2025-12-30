import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState, useMemo } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

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
import { ThemeProvider, colors } from '@/src/theme';
import { GluestackProvider } from '@/src/components/ui/gluestack-provider';

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

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
});

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
    ...FontAwesome.font,
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
  // Force dark mode to match web app
  const darkNavTheme = useMemo(() => ({
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      primary: colors.dark.primary,
      background: colors.dark.background,
      card: colors.dark.card,
      text: colors.dark.foreground,
      border: colors.dark.border,
      notification: colors.dark.destructive,
    },
  }), []);

  return (
    <GestureHandlerRootView className="flex-1">
      <GluestackProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <NavigationThemeProvider value={darkNavTheme}>
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
              </Stack>
            </NavigationThemeProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </GluestackProvider>
    </GestureHandlerRootView>
  );
}
