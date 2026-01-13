/**
 * Push Notifications Service
 * 
 * Handles Expo push notification setup, token registration, and notification handling.
 * 
 * Features:
 * - Request notification permissions
 * - Get Expo push token
 * - Register token with backend
 * - Handle foreground/background notifications
 */

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { router } from 'expo-router';

// Lazy import to avoid circular dependency
// client.ts -> auth/store.ts -> notifications/index.ts -> pushNotifications.ts -> client.ts
const getApiClientLazy = () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { getApiClient } = require('@/src/lib/api/client');
  return getApiClient();
};

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Check if the device can receive push notifications.
 * Returns false on simulators/emulators.
 */
export function canReceivePushNotifications(): boolean {
  return Device.isDevice;
}

/**
 * Request notification permissions from the user.
 * Returns true if permissions were granted.
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (!canReceivePushNotifications()) {
    console.log('[PushNotifications] Not a physical device, skipping permission request');
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('[PushNotifications] Permission not granted');
    return false;
  }

  // Android requires a notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'PathQuest',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4A7C59', // Primary green color
    });
  }

  return true;
}

/**
 * Get the Expo push token for this device.
 * Returns null if unable to get token.
 */
export async function getExpoPushToken(): Promise<string | null> {
  if (!canReceivePushNotifications()) {
    console.log('[PushNotifications] Not a physical device, cannot get push token');
    return null;
  }

  try {
    // Get project ID from app config
    const projectId = Constants.expoConfig?.extra?.eas?.projectId 
      ?? Constants.easConfig?.projectId;

    if (!projectId) {
      console.error('[PushNotifications] No project ID found in app config');
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    console.log('[PushNotifications] Got push token:', tokenData.data.substring(0, 20) + '...');
    return tokenData.data;
  } catch (error) {
    console.error('[PushNotifications] Failed to get push token:', error);
    return null;
  }
}

/**
 * Register the push token with the backend.
 */
export async function registerPushToken(token: string): Promise<boolean> {
  try {
    const client = getApiClientLazy();
    const platform = Platform.OS === 'ios' ? 'ios' : 'android';

    // Use fetchJson with POST method - the shared API client doesn't have .post()
    await client.fetchJson('/push-tokens', {
      method: 'POST',
      json: { token, platform },
    });

    console.log('[PushNotifications] Token registered with backend');
    return true;
  } catch (error) {
    console.error('[PushNotifications] Error registering token:', error);
    return false;
  }
}

/**
 * Unregister the push token from the backend.
 * Called on logout.
 */
export async function unregisterPushToken(token: string): Promise<boolean> {
  try {
    const client = getApiClientLazy();

    // Use fetchJson with DELETE method - the shared API client doesn't have .delete()
    await client.fetchJson(`/push-tokens/${encodeURIComponent(token)}`, {
      method: 'DELETE',
    });

    console.log('[PushNotifications] Token unregistered from backend');
    return true;
  } catch (error) {
    console.error('[PushNotifications] Error unregistering token:', error);
    return false;
  }
}

/**
 * Full setup flow: request permissions, get token, register with backend.
 * Returns the push token if successful, null otherwise.
 */
export async function setupPushNotifications(): Promise<string | null> {
  console.log('[PushNotifications] Starting setup...');
  console.log('[PushNotifications] Device.isDevice:', Device.isDevice);
  
  const hasPermission = await requestNotificationPermissions();
  console.log('[PushNotifications] Permission result:', hasPermission);
  if (!hasPermission) {
    return null;
  }

  const token = await getExpoPushToken();
  console.log('[PushNotifications] Token result:', token ? 'got token' : 'no token');
  if (!token) {
    return null;
  }

  const registered = await registerPushToken(token);
  console.log('[PushNotifications] Registration result:', registered);
  if (!registered) {
    // Still return token even if backend registration failed
    // It will be retried later
    console.warn('[PushNotifications] Backend registration failed, will retry later');
  }

  return token;
}

/**
 * Handle a notification response (user tapped notification).
 * Navigate to the appropriate screen based on notification data.
 */
export function handleNotificationResponse(
  response: Notifications.NotificationResponse
): void {
  const data = response.notification.request.content.data;

  console.log('[PushNotifications] Notification tapped:', data);

  if (!data) return;

  // Handle different notification types
  switch (data.type) {
    case 'summit_logged':
      if (data.peakId) {
        // Navigate to peak detail
        router.push({
          pathname: '/explore/peak/[peakId]',
          params: { peakId: data.peakId as string },
        });
      }
      break;
    
    default:
      console.log('[PushNotifications] Unknown notification type:', data.type);
  }
}

/**
 * Handle a notification received while app is in foreground.
 */
export function handleNotificationReceived(
  notification: Notifications.Notification
): void {
  console.log('[PushNotifications] Notification received in foreground:', notification);
  // The notification will be shown automatically due to setNotificationHandler config
}

// Export types for use in other files
export type { Notifications };

