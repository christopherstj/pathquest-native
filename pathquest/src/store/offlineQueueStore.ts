/**
 * Offline Queue Store
 * 
 * Manages pending submissions (trip reports, manual summits) that were created
 * while offline. Persists queue to AsyncStorage and auto-retries when connectivity
 * is restored.
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'pathquest_offline_queue';

// Types for pending submissions
export interface PendingPhoto {
  uri: string; // Local file URI
  filename: string;
  width: number;
  height: number;
}

export interface TripReportData {
  ascentId: string;
  difficulty?: number;
  experience?: string;
  notes?: string;
  tags?: string[];
  conditionTags?: string[];
}

export interface ManualSummitData {
  peakId: string;
  peakName: string;
  summitDate: string; // ISO string
  timezone: string;
  activityId?: string;
  difficulty?: number;
  experience?: string;
  notes?: string;
  tags?: string[];
  conditionTags?: string[];
  userId: string;
}

export interface PendingSubmission {
  id: string; // UUID
  type: 'trip_report' | 'manual_summit';
  timestamp: number; // When queued
  data: TripReportData | ManualSummitData;
  photos: PendingPhoto[];
  retryCount: number; // Track retry attempts
  lastError?: string; // Last error message
}

interface OfflineQueueState {
  // Queue state
  pendingSubmissions: PendingSubmission[];
  isRetrying: boolean;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  queueSubmission: (
    type: 'trip_report' | 'manual_summit',
    data: TripReportData | ManualSummitData,
    photos: PendingPhoto[]
  ) => Promise<string>; // Returns submission ID
  removeSubmission: (id: string) => Promise<void>;
  updateSubmission: (id: string, updates: Partial<PendingSubmission>) => Promise<void>;
  setRetrying: (isRetrying: boolean) => void;
  clearQueue: () => Promise<void>;
  getSubmission: (id: string) => PendingSubmission | undefined;
}

// Generate a simple UUID
function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const useOfflineQueueStore = create<OfflineQueueState>((set, get) => ({
  pendingSubmissions: [],
  isRetrying: false,
  isInitialized: false,

  /**
   * Initialize queue from AsyncStorage.
   * Called on app startup.
   */
  initialize: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          set({ pendingSubmissions: parsed, isInitialized: true });
          console.log('[OfflineQueue] Loaded', parsed.length, 'pending submissions');
          return;
        }
      }
      set({ isInitialized: true });
    } catch (error) {
      console.error('[OfflineQueue] Failed to load from AsyncStorage:', error);
      set({ isInitialized: true });
    }
  },

  /**
   * Add a submission to the queue.
   * Returns the submission ID.
   */
  queueSubmission: async (type, data, photos) => {
    const submission: PendingSubmission = {
      id: generateId(),
      type,
      timestamp: Date.now(),
      data,
      photos,
      retryCount: 0,
    };

    const current = get().pendingSubmissions;
    const updated = [...current, submission];

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      set({ pendingSubmissions: updated });
      console.log('[OfflineQueue] Queued submission:', submission.id, type);
      return submission.id;
    } catch (error) {
      console.error('[OfflineQueue] Failed to save queue:', error);
      throw error;
    }
  },

  /**
   * Remove a submission from the queue (after successful upload).
   */
  removeSubmission: async (id) => {
    const current = get().pendingSubmissions;
    const updated = current.filter((s) => s.id !== id);

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      set({ pendingSubmissions: updated });
      console.log('[OfflineQueue] Removed submission:', id);
    } catch (error) {
      console.error('[OfflineQueue] Failed to save queue:', error);
    }
  },

  /**
   * Update a submission (e.g., increment retry count, set error).
   */
  updateSubmission: async (id, updates) => {
    const current = get().pendingSubmissions;
    const updated = current.map((s) =>
      s.id === id ? { ...s, ...updates } : s
    );

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      set({ pendingSubmissions: updated });
    } catch (error) {
      console.error('[OfflineQueue] Failed to save queue:', error);
    }
  },

  /**
   * Set the retrying state.
   */
  setRetrying: (isRetrying) => set({ isRetrying }),

  /**
   * Clear all pending submissions.
   */
  clearQueue: async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      set({ pendingSubmissions: [] });
      console.log('[OfflineQueue] Queue cleared');
    } catch (error) {
      console.error('[OfflineQueue] Failed to clear queue:', error);
    }
  },

  /**
   * Get a specific submission by ID.
   */
  getSubmission: (id) => {
    return get().pendingSubmissions.find((s) => s.id === id);
  },
}));

/**
 * Check if there are pending submissions in the queue.
 */
export function hasPendingSubmissions(): boolean {
  return useOfflineQueueStore.getState().pendingSubmissions.length > 0;
}

/**
 * Get the count of pending submissions.
 */
export function getPendingCount(): number {
  return useOfflineQueueStore.getState().pendingSubmissions.length;
}



