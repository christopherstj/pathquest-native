/**
 * useNetworkStatus Hook
 * 
 * Provides real-time network connectivity status using @react-native-community/netinfo.
 * Returns whether the device is connected to the internet and whether the internet is reachable.
 */

import { useEffect, useState, useCallback } from 'react';
import NetInfo, { NetInfoState, NetInfoSubscription } from '@react-native-community/netinfo';

export interface NetworkStatus {
  /** Whether the device has any network connection (WiFi, cellular, etc.) */
  isConnected: boolean;
  /** Whether the internet is actually reachable (can make network requests) */
  isInternetReachable: boolean | null;
  /** The type of connection (wifi, cellular, etc.) */
  connectionType: string | null;
  /** Whether the network status has been determined */
  isLoading: boolean;
}

/**
 * Hook that provides real-time network connectivity status.
 * 
 * @example
 * const { isConnected, isInternetReachable } = useNetworkStatus();
 * 
 * if (!isConnected || !isInternetReachable) {
 *   // Queue action for later
 * }
 */
export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>({
    isConnected: true, // Assume connected initially
    isInternetReachable: null,
    connectionType: null,
    isLoading: true,
  });

  useEffect(() => {
    let subscription: NetInfoSubscription | null = null;

    const handleNetworkChange = (state: NetInfoState) => {
      setStatus({
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable,
        connectionType: state.type,
        isLoading: false,
      });
    };

    // Get initial state
    NetInfo.fetch().then(handleNetworkChange);

    // Subscribe to network state changes
    subscription = NetInfo.addEventListener(handleNetworkChange);

    return () => {
      if (subscription) {
        subscription();
      }
    };
  }, []);

  return status;
}

/**
 * Check if the device is currently online (has internet access).
 * This is a one-time check, not a subscription.
 */
export async function checkIsOnline(): Promise<boolean> {
  try {
    const state = await NetInfo.fetch();
    // Consider online if connected AND internet is reachable (or reachability is unknown)
    return (state.isConnected ?? false) && (state.isInternetReachable !== false);
  } catch (error) {
    console.error('[NetworkStatus] Error checking connectivity:', error);
    return false;
  }
}

export default useNetworkStatus;



