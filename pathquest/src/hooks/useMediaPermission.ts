/**
 * useMediaPermission
 * 
 * Cross-platform hook for requesting media library permissions.
 * Works around expo-media-library's broken permission checks on Android 13+
 * by using PermissionsAndroid directly.
 */

import { useState, useCallback, useEffect } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import * as MediaLibrary from 'expo-media-library';

export type MediaPermissionStatus = 'undetermined' | 'granted' | 'denied' | 'limited';

interface UseMediaPermissionResult {
  status: MediaPermissionStatus;
  isGranted: boolean;
  isLoading: boolean;
  requestPermission: () => Promise<boolean>;
  checkPermission: () => Promise<MediaPermissionStatus>;
}

/**
 * Request Android media permissions directly via PermissionsAndroid
 * This bypasses expo-media-library's broken permission flow on Android 13+
 */
async function requestAndroidMediaPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  
  const apiLevel = Platform.Version;
  console.log('[useMediaPermission] Android API level:', apiLevel);
  
  if (typeof apiLevel === 'number' && apiLevel >= 33) {
    // Android 13+ requires READ_MEDIA_IMAGES
    console.log('[useMediaPermission] Requesting READ_MEDIA_IMAGES...');
    try {
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
        {
          title: 'Photo Access',
          message: 'PathQuest needs access to your photos to add summit photos to your trip reports.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      console.log('[useMediaPermission] PermissionsAndroid result:', result);
      return result === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.error('[useMediaPermission] PermissionsAndroid.request failed:', err);
      return false;
    }
  } else {
    // Android 12 and below
    console.log('[useMediaPermission] Requesting READ_EXTERNAL_STORAGE...');
    try {
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        {
          title: 'Photo Access',
          message: 'PathQuest needs access to your photos to add summit photos to your trip reports.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      console.log('[useMediaPermission] PermissionsAndroid result:', result);
      return result === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.error('[useMediaPermission] PermissionsAndroid.request failed:', err);
      return false;
    }
  }
}

/**
 * Check Android permission status directly
 */
async function checkAndroidMediaPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  
  const apiLevel = Platform.Version;
  
  if (typeof apiLevel === 'number' && apiLevel >= 33) {
    const result = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
    );
    return result;
  } else {
    const result = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
    );
    return result;
  }
}

export function useMediaPermission(): UseMediaPermissionResult {
  const [status, setStatus] = useState<MediaPermissionStatus>('undetermined');
  const [isLoading, setIsLoading] = useState(true);

  const checkPermission = useCallback(async (): Promise<MediaPermissionStatus> => {
    console.log('[useMediaPermission] Checking permission...');
    
    if (Platform.OS === 'android') {
      const hasPermission = await checkAndroidMediaPermission();
      console.log('[useMediaPermission] Android permission check:', hasPermission);
      const newStatus = hasPermission ? 'granted' : 'undetermined';
      setStatus(newStatus);
      return newStatus;
    } else {
      // iOS - use MediaLibrary
      const result = await MediaLibrary.getPermissionsAsync();
      console.log('[useMediaPermission] iOS permission check:', result.status);
      setStatus(result.status as MediaPermissionStatus);
      return result.status as MediaPermissionStatus;
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    console.log('[useMediaPermission] Requesting permission...');
    setIsLoading(true);
    
    try {
      if (Platform.OS === 'android') {
        const granted = await requestAndroidMediaPermission();
        const newStatus = granted ? 'granted' : 'denied';
        setStatus(newStatus);
        setIsLoading(false);
        return granted;
      } else {
        // iOS - use MediaLibrary
        const result = await MediaLibrary.requestPermissionsAsync();
        console.log('[useMediaPermission] iOS permission result:', result.status);
        setStatus(result.status as MediaPermissionStatus);
        setIsLoading(false);
        return result.status === 'granted' || result.status === 'limited';
      }
    } catch (err) {
      console.error('[useMediaPermission] Error requesting permission:', err);
      setStatus('denied');
      setIsLoading(false);
      return false;
    }
  }, []);

  // Check permission on mount
  useEffect(() => {
    checkPermission().finally(() => setIsLoading(false));
  }, [checkPermission]);

  return {
    status,
    isGranted: status === 'granted' || status === 'limited',
    isLoading,
    requestPermission,
    checkPermission,
  };
}

export default useMediaPermission;




