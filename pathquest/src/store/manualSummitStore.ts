/**
 * Manual Summit Store
 *
 * Manages the state of the Manual Summit Entry modal.
 * Matches the web app architecture from pathquest-frontend.
 */

import { create } from "zustand";
import type { SummitPhoto } from "@pathquest/shared/types";

export interface ManualSummitData {
  /** Peak ID (OSM ID) - empty string if peak needs to be selected */
  peakId: string;
  /** Peak name for display */
  peakName: string;
  /** Peak coordinates [lng, lat] for timezone lookup */
  peakCoords: [number, number];
  /** Peak elevation in meters */
  peakElevation?: number;
  /** Peak state/region */
  peakState?: string;
  /** Pre-selected activity ID (when opened from activity page) */
  preselectedActivityId?: string;
}

export interface PhotoUploadProgress {
  progress: number;
  status: "uploading" | "processing" | "complete" | "error";
  error?: string;
}

interface ManualSummitState {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Data for the current summit entry */
  data: ManualSummitData | null;
  /** Photos attached to this summit */
  photos: SummitPhoto[];
  /** Upload progress for each photo by temp ID */
  uploadProgress: Map<string, PhotoUploadProgress>;
  /** Open the modal with peak data (can pass empty peakId to require search) */
  openManualSummit: (data?: ManualSummitData) => void;
  /** Close the modal and reset state */
  closeManualSummit: () => void;
  /** Add a photo to the list */
  addPhoto: (photo: SummitPhoto) => void;
  /** Remove a photo from the list */
  removePhoto: (photoId: string) => void;
  /** Clear all photos */
  clearPhotos: () => void;
  /** Set upload progress for a photo */
  setUploadProgress: (photoId: string, progress: PhotoUploadProgress) => void;
  /** Clear upload progress for a photo */
  clearUploadProgress: (photoId: string) => void;
}

export const useManualSummitStore = create<ManualSummitState>((set) => ({
  isOpen: false,
  data: null,
  photos: [],
  uploadProgress: new Map(),
  openManualSummit: (data?: ManualSummitData) => set({
    isOpen: true,
    data: data ?? {
      peakId: "",
      peakName: "",
      peakCoords: [0, 0],
    },
    photos: [],
    uploadProgress: new Map(),
  }),
  closeManualSummit: () => set({ 
    isOpen: false, 
    data: null,
    photos: [],
    uploadProgress: new Map(),
  }),
  addPhoto: (photo) => set((state) => ({
    photos: [...state.photos, photo],
  })),
  removePhoto: (photoId) => set((state) => ({
    photos: state.photos.filter((p) => p.id !== photoId),
  })),
  clearPhotos: () => set({ photos: [] }),
  setUploadProgress: (photoId, progress) => set((state) => {
    const newProgress = new Map(state.uploadProgress);
    newProgress.set(photoId, progress);
    return { uploadProgress: newProgress };
  }),
  clearUploadProgress: (photoId) => set((state) => {
    const newProgress = new Map(state.uploadProgress);
    newProgress.delete(photoId);
    return { uploadProgress: newProgress };
  }),
}));

