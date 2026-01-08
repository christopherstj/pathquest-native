/**
 * useHaptics
 *
 * A hook for consistent haptic feedback throughout the app.
 * Provides typed methods for different feedback intensities.
 *
 * Usage:
 * const haptics = useHaptics();
 * haptics.light(); // Button press
 * haptics.medium(); // Modal open
 * haptics.selection(); // Tab switch
 * haptics.success(); // Action completed
 * haptics.warning(); // Destructive action
 */

import { useCallback } from "react";
import * as Haptics from "expo-haptics";

export type HapticFeedbackType =
  | "light"
  | "medium"
  | "heavy"
  | "selection"
  | "success"
  | "warning"
  | "error";

export interface UseHapticsReturn {
  /** Light impact - for button presses, toggles */
  light: () => Promise<void>;
  /** Medium impact - for modal open/close, significant actions */
  medium: () => Promise<void>;
  /** Heavy impact - for major events, confirmations */
  heavy: () => Promise<void>;
  /** Selection feedback - for tab switches, picker changes */
  selection: () => Promise<void>;
  /** Success notification - for completed actions */
  success: () => Promise<void>;
  /** Warning notification - for destructive actions */
  warning: () => Promise<void>;
  /** Error notification - for failed actions */
  error: () => Promise<void>;
  /** Trigger haptic by type */
  trigger: (type: HapticFeedbackType) => Promise<void>;
}

/**
 * Hook for consistent haptic feedback
 */
export function useHaptics(): UseHapticsReturn {
  const light = useCallback(async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Haptics may not be available on all devices/simulators
    }
  }, []);

  const medium = useCallback(async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // Haptics may not be available
    }
  }, []);

  const heavy = useCallback(async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch {
      // Haptics may not be available
    }
  }, []);

  const selection = useCallback(async () => {
    try {
      await Haptics.selectionAsync();
    } catch {
      // Haptics may not be available
    }
  }, []);

  const success = useCallback(async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Haptics may not be available
    }
  }, []);

  const warning = useCallback(async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {
      // Haptics may not be available
    }
  }, []);

  const error = useCallback(async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch {
      // Haptics may not be available
    }
  }, []);

  const trigger = useCallback(
    async (type: HapticFeedbackType) => {
      switch (type) {
        case "light":
          return light();
        case "medium":
          return medium();
        case "heavy":
          return heavy();
        case "selection":
          return selection();
        case "success":
          return success();
        case "warning":
          return warning();
        case "error":
          return error();
      }
    },
    [light, medium, heavy, selection, success, warning, error]
  );

  return {
    light,
    medium,
    heavy,
    selection,
    success,
    warning,
    error,
    trigger,
  };
}

export default useHaptics;

