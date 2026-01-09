/**
 * Onboarding Store
 * 
 * Manages onboarding state with AsyncStorage persistence.
 * Tracks whether the user has seen the onboarding modal.
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'pathquest_onboarding_seen';

interface OnboardingState {
  // Whether the user has completed onboarding (persisted)
  hasSeenOnboarding: boolean;
  
  // Whether the onboarding modal is currently visible
  showOnboardingModal: boolean;
  
  // Loading state while checking AsyncStorage
  isLoading: boolean;

  // Actions
  initialize: () => Promise<void>;
  openOnboarding: () => void;
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>; // For testing
}

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  hasSeenOnboarding: false,
  showOnboardingModal: false,
  isLoading: true,

  /**
   * Initialize onboarding state from AsyncStorage.
   * Called on app startup.
   */
  initialize: async () => {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEY);
      const hasSeenOnboarding = value === 'true';
      set({ 
        hasSeenOnboarding, 
        isLoading: false,
      });
    } catch (error) {
      console.error('[OnboardingStore] Failed to load from AsyncStorage:', error);
      set({ isLoading: false });
    }
  },

  /**
   * Show the onboarding modal.
   */
  openOnboarding: () => {
    set({ showOnboardingModal: true });
  },

  /**
   * Mark onboarding as complete and hide the modal.
   * Persists to AsyncStorage.
   */
  completeOnboarding: async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, 'true');
      set({ 
        hasSeenOnboarding: true, 
        showOnboardingModal: false,
      });
    } catch (error) {
      console.error('[OnboardingStore] Failed to save to AsyncStorage:', error);
      // Still update state even if storage fails
      set({ 
        hasSeenOnboarding: true, 
        showOnboardingModal: false,
      });
    }
  },

  /**
   * Reset onboarding state (for testing/debugging).
   */
  resetOnboarding: async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      set({ 
        hasSeenOnboarding: false, 
        showOnboardingModal: false,
      });
    } catch (error) {
      console.error('[OnboardingStore] Failed to reset AsyncStorage:', error);
    }
  },
}));

